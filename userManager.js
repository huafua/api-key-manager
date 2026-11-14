const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const PASSWORD_LENGTH = 64;

class UserManager {
  constructor(storageFile = path.join(__dirname, 'data', 'users.json')) {
    this.storageFile = storageFile;
    this.users = new Map();
    this.sessions = new Map();
    this.loadUsers();
  }

  loadUsers() {
    if (!fs.existsSync(this.storageFile)) {
      const admin = this.createUserRecord('user_admin', 'admin', 'admin123', 'superadmin', true);
      this.users.set(admin.id, admin);
      this.saveUsers();
      return;
    }

    const storedUsers = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
    if (!Array.isArray(storedUsers)) {
      throw new Error(`Invalid user data in ${this.storageFile}`);
    }

    storedUsers.forEach(user => {
      if (!user || typeof user.id !== 'string' || typeof user.username !== 'string' ||
          typeof user.passwordHash !== 'string' || typeof user.passwordSalt !== 'string' ||
          !['user', 'superadmin'].includes(user.role)) {
        throw new Error(`Invalid user entry in ${this.storageFile}`);
      }
      this.users.set(user.id, user);
    });

    if (![...this.users.values()].some(user => user.role === 'superadmin')) {
      const admin = this.createUserRecord('user_admin', 'admin', 'admin123', 'superadmin', true);
      this.users.set(admin.id, admin);
      this.saveUsers();
    }
  }

  saveUsers() {
    fs.mkdirSync(path.dirname(this.storageFile), { recursive: true });
    const temporaryFile = `${this.storageFile}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(Array.from(this.users.values()), null, 2));
    fs.renameSync(temporaryFile, this.storageFile);
  }

  createUserRecord(id, username, password, role, mustChangePassword) {
    const passwordSalt = crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();
    return {
      id,
      username,
      passwordSalt,
      passwordHash: this.hashPassword(password, passwordSalt),
      role,
      disabled: false,
      mustChangePassword,
      createdAt: now,
      updatedAt: now
    };
  }

  hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, PASSWORD_LENGTH).toString('hex');
  }

  verifyPassword(user, password) {
    if (typeof password !== 'string' || password.length > 256) return false;
    const actualHash = Buffer.from(this.hashPassword(password, user.passwordSalt), 'hex');
    const expectedHash = Buffer.from(user.passwordHash, 'hex');
    return actualHash.length === expectedHash.length &&
      crypto.timingSafeEqual(actualHash, expectedHash);
  }

  validateUsername(username) {
    if (typeof username !== 'string') {
      throw this.createError('Username is required.', 400);
    }
    const normalized = username.trim();
    if (!/^[A-Za-z0-9._-]{3,32}$/.test(normalized)) {
      throw this.createError('Username must be 3-32 characters: letters, numbers, dot, underscore, or hyphen.', 400);
    }
    return normalized;
  }

  validatePassword(password) {
    if (typeof password !== 'string' || password.length < 8 || password.length > 256) {
      throw this.createError('Password must be between 8 and 256 characters.', 400);
    }
    return password;
  }

  createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }

  findByUsername(username) {
    const normalized = String(username || '').toLowerCase();
    return [...this.users.values()].find(user => user.username.toLowerCase() === normalized);
  }

  ensureUniqueUsername(username, exceptId) {
    const duplicate = this.findByUsername(username);
    if (duplicate && duplicate.id !== exceptId) {
      throw this.createError('Username already exists.', 409);
    }
  }

  toPublicUser(user) {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      isSuperAdmin: user.role === 'superadmin',
      disabled: user.disabled,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  authenticate(username, password) {
    if (typeof username !== 'string' || username.length > 32 ||
        typeof password !== 'string' || password.length > 256) {
      return null;
    }
    const user = this.findByUsername(username);
    if (!user || user.disabled || !this.verifyPassword(user, password)) {
      return null;
    }
    return this.toPublicUser(user);
  }

  createSession(userId) {
    const user = this.users.get(userId);
    if (!user || user.disabled) {
      throw this.createError('User is unavailable.', 401);
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + SESSION_TTL_MS;
    this.sessions.set(token, { userId, expiresAt });
    return { token, expiresAt, user: this.toPublicUser(user) };
  }

  getSession(token) {
    if (typeof token !== 'string') return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    const user = this.users.get(session.userId);
    if (session.expiresAt <= Date.now() || !user || user.disabled) {
      this.sessions.delete(token);
      return null;
    }

    return { token, expiresAt: session.expiresAt, user: this.toPublicUser(user) };
  }

  revokeSession(token) {
    return this.sessions.delete(token);
  }

  revokeUserSessions(userId) {
    for (const [token, session] of this.sessions) {
      if (session.userId === userId) {
        this.sessions.delete(token);
      }
    }
  }

  createUser(username, password) {
    const normalized = this.validateUsername(username);
    this.validatePassword(password);
    this.ensureUniqueUsername(normalized);

    const user = this.createUserRecord(
      `user_${crypto.randomBytes(8).toString('hex')}`,
      normalized,
      password,
      'user',
      true
    );
    this.users.set(user.id, user);
    this.saveUsers();
    return this.toPublicUser(user);
  }

  getUser(id) {
    const user = this.users.get(id);
    return user ? this.toPublicUser(user) : null;
  }

  getAllUsers() {
    return Array.from(this.users.values(), user => this.toPublicUser(user));
  }

  updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return null;

    if (updates.username !== undefined) {
      const username = this.validateUsername(updates.username);
      this.ensureUniqueUsername(username, id);
      user.username = username;
    }

    if (updates.password !== undefined && updates.password !== '') {
      const password = this.validatePassword(updates.password);
      if (this.verifyPassword(user, password)) {
        throw this.createError('New password must differ from the current password.', 400);
      }
      user.passwordSalt = crypto.randomBytes(16).toString('hex');
      user.passwordHash = this.hashPassword(password, user.passwordSalt);
      user.mustChangePassword = true;
      this.revokeUserSessions(id);
    }

    user.updatedAt = new Date().toISOString();
    this.saveUsers();
    return this.toPublicUser(user);
  }

  changePassword(id, currentPassword, newPassword) {
    const user = this.users.get(id);
    if (!user || user.disabled) return null;

    if (!user.mustChangePassword && !this.verifyPassword(user, currentPassword)) {
      throw this.createError('Current password is incorrect.', 401);
    }

    const password = this.validatePassword(newPassword);
    if (this.verifyPassword(user, password)) {
      throw this.createError('New password must differ from the current password.', 400);
    }

    user.passwordSalt = crypto.randomBytes(16).toString('hex');
    user.passwordHash = this.hashPassword(password, user.passwordSalt);
    user.mustChangePassword = false;
    user.updatedAt = new Date().toISOString();
    this.saveUsers();
    return this.toPublicUser(user);
  }

  setUserDisabled(id, disabled) {
    const user = this.users.get(id);
    if (!user) return false;
    if (user.role === 'superadmin' && disabled) {
      throw this.createError('The super administrator cannot be disabled.', 400);
    }

    user.disabled = Boolean(disabled);
    user.updatedAt = new Date().toISOString();
    if (user.disabled) this.revokeUserSessions(id);
    this.saveUsers();
    return true;
  }

  deleteUser(id) {
    const user = this.users.get(id);
    if (!user) return false;
    if (user.role === 'superadmin') {
      throw this.createError('The super administrator cannot be deleted.', 400);
    }

    this.revokeUserSessions(id);
    this.users.delete(id);
    this.saveUsers();
    return true;
  }

  isUserActive(id) {
    const user = this.users.get(id);
    return Boolean(user && !user.disabled);
  }
}

module.exports = { UserManager };
