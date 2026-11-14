const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ApiKeyManager } = require('./apiKeyManager');
const { Server } = require('./server');
const { UserManager } = require('./userManager');

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'api-key-manager-auth-'));
const dataDirectory = path.join(temporaryDirectory, 'data');
const userManager = new UserManager(path.join(dataDirectory, 'users.json'));
const apiKeyManager = new ApiKeyManager(path.join(dataDirectory, 'api-keys.json'));

try {
  const admin = userManager.getAllUsers().find(user => user.isSuperAdmin);
  assert(admin, 'first run should create a super administrator');
  assert.strictEqual(admin.username, 'admin');
  assert.strictEqual(admin.mustChangePassword, true);
  assert.strictEqual(userManager.authenticate('admin', 'admin123').id, admin.id);
  assert.strictEqual(userManager.authenticate('admin', 'wrong-password'), null);
  assert.strictEqual(userManager.authenticate('admin', 'x'.repeat(10000)), null);
  assert(!fs.readFileSync(path.join(dataDirectory, 'users.json'), 'utf8').includes('admin123'));

  const adminSession = userManager.createSession(admin.id);
  assert.strictEqual(userManager.getSession(adminSession.token).user.id, admin.id);
  userManager.changePassword(admin.id, '', 'newAdminPassword1');
  assert.strictEqual(userManager.getSession(adminSession.token).user.mustChangePassword, false);
  assert.strictEqual(userManager.authenticate('admin', 'admin123'), null);
  assert(userManager.authenticate('admin', 'newAdminPassword1'));

  const user = userManager.createUser('alice', 'initialPassword1');
  assert.strictEqual(user.mustChangePassword, true);
  assert.throws(() => userManager.createUser('ALICE', 'anotherPassword1'), { statusCode: 409 });
  const userSession = userManager.createSession(user.id);

  const userKey = apiKeyManager.createApiKey('Alice key', user.id);
  const adminKey = apiKeyManager.createApiKey('Admin key', admin.id);
  assert.strictEqual(apiKeyManager.getAllApiKeys(user.id).length, 1);
  assert.strictEqual(apiKeyManager.deleteApiKey(userKey.id, admin.id), false);
  assert.strictEqual(apiKeyManager.validateApiKey(userKey.key, userId => userManager.isUserActive(userId)), true);

  userManager.setUserDisabled(user.id, true);
  assert.strictEqual(userManager.getSession(userSession.token), null);
  assert.strictEqual(apiKeyManager.validateApiKey(userKey.key, userId => userManager.isUserActive(userId)), false);
  userManager.setUserDisabled(user.id, false);
  assert.strictEqual(apiKeyManager.validateApiKey(userKey.key, userId => userManager.isUserActive(userId)), true);

  const updatedUser = userManager.updateUser(user.id, {
    username: 'alice.renamed',
    password: 'resetPassword1'
  });
  assert.strictEqual(updatedUser.mustChangePassword, true);
  assert.strictEqual(userManager.authenticate('alice.renamed', 'resetPassword1').id, user.id);

  assert.throws(() => userManager.setUserDisabled(admin.id, true), { statusCode: 400 });
  assert.throws(() => userManager.deleteUser(admin.id), { statusCode: 400 });
  assert.strictEqual(apiKeyManager.getAllApiKeys(admin.id).length, 1);

  const legacyManager = new ApiKeyManager(path.join(dataDirectory, 'legacy-keys.json'));
  const legacyKey = legacyManager.createApiKey('Legacy key');
  legacyManager.assignUnownedKeys(admin.id);
  assert.strictEqual(legacyManager.getAllApiKeys(admin.id)[0].id, legacyKey.id);

  const params = {};
  assert.strictEqual(Server.prototype.matchRoute('/api/student/:id', '/api/student/1', params), true);
  assert.deepStrictEqual(params, { id: '1' });
  assert.strictEqual(Server.prototype.matchRoute('/api/student/:id', '/api/student/1/detail'), false);

  const publicDirectory = path.join(temporaryDirectory, 'public');
  fs.mkdirSync(publicDirectory);
  fs.writeFileSync(path.join(temporaryDirectory, 'private.json'), '{}');
  const staticServer = Object.create(Server.prototype);
  staticServer.staticDir = publicDirectory;
  assert.strictEqual(staticServer.serveStaticFile('/../../private.json', {}), false);

  console.log('Authentication, user isolation, API key ownership, and route parameter tests passed.');
} finally {
  for (const file of ['users.json', 'users.json.tmp', 'api-keys.json', 'api-keys.json.tmp', 'legacy-keys.json', 'legacy-keys.json.tmp']) {
    const filePath = path.join(dataDirectory, file);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  const publicDirectory = path.join(temporaryDirectory, 'public');
  const privateFile = path.join(temporaryDirectory, 'private.json');
  if (fs.existsSync(privateFile)) fs.unlinkSync(privateFile);
  if (fs.existsSync(publicDirectory)) fs.rmdirSync(publicDirectory);
  if (fs.existsSync(dataDirectory)) fs.rmdirSync(dataDirectory);
  fs.rmdirSync(temporaryDirectory);
}
