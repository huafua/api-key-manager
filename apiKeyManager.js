const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class ApiKey {
  constructor(key, name = '', disabled = false, ownerId = null) {
    this.id = this.generateId();
    this.key = key;
    this.name = name;
    this.disabled = disabled;
    this.ownerId = ownerId;
    this.createdAt = new Date().toISOString();
    this.lastUsed = null;
  }

  generateId() {
    return `key_${crypto.randomBytes(6).toString('hex')}`;
  }

  toJSON() {
    return {
      id: this.id,
      key: this.key,
      name: this.name,
      disabled: this.disabled,
      ownerId: this.ownerId,
      createdAt: this.createdAt,
      lastUsed: this.lastUsed
    };
  }
}

class ApiKeyManager {
  constructor(storageFile = path.join(__dirname, 'data', 'api-keys.json')) {
    this.storageFile = storageFile;
    this.apiKeys = new Map();
    this.loadApiKeys();
  }

  loadApiKeys() {
    if (!fs.existsSync(this.storageFile)) {
      this.saveApiKeys();
      return;
    }

    const storedKeys = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
    if (!Array.isArray(storedKeys)) {
      throw new Error(`Invalid API key data in ${this.storageFile}`);
    }

    storedKeys.forEach(key => {
      if (!key || typeof key.id !== 'string' || typeof key.key !== 'string') {
        throw new Error(`Invalid API key entry in ${this.storageFile}`);
      }
      const apiKey = Object.assign(new ApiKey(key.key), key);
      this.apiKeys.set(apiKey.id, apiKey);
    });
  }

  saveApiKeys() {
    fs.mkdirSync(path.dirname(this.storageFile), { recursive: true });
    const temporaryFile = `${this.storageFile}.tmp`;
    fs.writeFileSync(
      temporaryFile,
      JSON.stringify(Array.from(this.apiKeys.values(), key => key.toJSON()), null, 2)
    );
    fs.renameSync(temporaryFile, this.storageFile);
  }

  createApiKey(name = '', ownerId = null) {
    const key = this.generateKey();
    const apiKey = new ApiKey(key, name, false, ownerId);
    this.apiKeys.set(apiKey.id, apiKey);
    this.saveApiKeys();
    return apiKey;
  }

  generateKey() {
    return `sk-${crypto.randomBytes(16).toString('hex')}`;
  }

  assignUnownedKeys(ownerId) {
    let updated = false;
    for (const apiKey of this.apiKeys.values()) {
      if (!apiKey.ownerId) {
        apiKey.ownerId = ownerId;
        updated = true;
      }
    }
    if (updated) this.saveApiKeys();
    return updated;
  }

  getApiKey(id, ownerId) {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey || (ownerId !== undefined && apiKey.ownerId !== ownerId)) return undefined;
    return apiKey;
  }

  getAllApiKeys(ownerId) {
    return Array.from(this.apiKeys.values())
      .filter(apiKey => ownerId === undefined || apiKey.ownerId === ownerId)
      .map(apiKey => apiKey.toJSON());
  }

  validateApiKey(keyString, isOwnerActive = () => true) {
    for (const apiKey of this.apiKeys.values()) {
      const ownerActive = !apiKey.ownerId || isOwnerActive(apiKey.ownerId);
      if (apiKey.key === keyString && !apiKey.disabled && ownerActive) {
        apiKey.lastUsed = new Date().toISOString();
        this.saveApiKeys();
        return true;
      }
    }
    return false;
  }

  deleteApiKey(id, ownerId) {
    const apiKey = this.getApiKey(id, ownerId);
    if (!apiKey) return false;
    const deleted = this.apiKeys.delete(id);
    if (deleted) this.saveApiKeys();
    return deleted;
  }

  deleteMultipleApiKeys(ids, ownerId) {
    let count = 0;
    ids.forEach(id => {
      if (this.deleteApiKeyWithoutSaving(id, ownerId)) {
        count++;
      }
    });
    if (count > 0) this.saveApiKeys();
    return count;
  }

  deleteApiKeyWithoutSaving(id, ownerId) {
    const apiKey = this.getApiKey(id, ownerId);
    return apiKey ? this.apiKeys.delete(id) : false;
  }

  deleteApiKeysForOwner(ownerId) {
    let count = 0;
    for (const [id, apiKey] of this.apiKeys) {
      if (apiKey.ownerId === ownerId) {
        this.apiKeys.delete(id);
        count++;
      }
    }
    if (count > 0) this.saveApiKeys();
    return count;
  }

  disableApiKey(id, ownerId) {
    const apiKey = this.getApiKey(id, ownerId);
    if (apiKey) {
      apiKey.disabled = true;
      this.saveApiKeys();
      return true;
    }
    return false;
  }

  enableApiKey(id, ownerId) {
    const apiKey = this.getApiKey(id, ownerId);
    if (apiKey) {
      apiKey.disabled = false;
      this.saveApiKeys();
      return true;
    }
    return false;
  }

  disableMultipleApiKeys(ids, ownerId) {
    let count = 0;
    ids.forEach(id => {
      const apiKey = this.getApiKey(id, ownerId);
      if (apiKey) {
        apiKey.disabled = true;
        count++;
      }
    });
    if (count > 0) this.saveApiKeys();
    return count;
  }

  enableMultipleApiKeys(ids, ownerId) {
    let count = 0;
    ids.forEach(id => {
      const apiKey = this.getApiKey(id, ownerId);
      if (apiKey) {
        apiKey.disabled = false;
        count++;
      }
    });
    if (count > 0) this.saveApiKeys();
    return count;
  }

  updateApiKey(id, updates, ownerId) {
    const apiKey = this.getApiKey(id, ownerId);
    if (apiKey) {
      if (updates.name !== undefined) {
        apiKey.name = updates.name;
        this.saveApiKeys();
      }
      return true;
    }
    return false;
  }
}

module.exports = { ApiKeyManager, ApiKey };
