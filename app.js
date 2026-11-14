const { Server } = require('./server');
const { UserManager } = require('./userManager');
const { ApiKeyManager } = require('./apiKeyManager');

const port = Number(process.env.PORT) || 3000;
const apiKeyManager = new ApiKeyManager(process.env.API_KEY_STORAGE_FILE);
const server = new Server(port, apiKeyManager);
const userManager = new UserManager(process.env.USER_STORAGE_FILE);
const superAdmin = userManager.getAllUsers().find(user => user.isSuperAdmin);
if (!superAdmin) throw new Error('A super administrator account is required.');
server.apiKeyManager.assignUnownedKeys(superAdmin.id);

const SESSION_COOKIE = 'session';
const MAX_BODY_BYTES = 1024 * 1024;
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function sendJson(res, statusCode, data, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(JSON.stringify(data));
}

function sendOperationError(res, error) {
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  if (statusCode >= 500) console.error(error);
  sendJson(res, statusCode, {
    error: statusCode >= 500 ? 'Internal server error' : error.message
  });
}

function readJsonBody(req, res, callback) {
  let body = '';
  let tooLarge = false;

  req.on('data', chunk => {
    if (tooLarge) return;
    if (Buffer.byteLength(body) + chunk.length > MAX_BODY_BYTES) {
      tooLarge = true;
      return;
    }
    body += chunk.toString('utf8');
  });

  req.on('end', () => {
    if (tooLarge) {
      return sendJson(res, 413, { error: 'Request body is too large.' });
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch (error) {
      return sendJson(res, 400, { error: 'Invalid JSON request body.' });
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return sendJson(res, 400, { error: 'JSON request body must be an object.' });
    }
    callback(data);
  });
}

function getSessionToken(req) {
  const cookieHeader = req.headers.cookie || '';
  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator < 0) continue;
    if (cookie.slice(0, separator).trim() === SESSION_COOKIE) {
      return cookie.slice(separator + 1).trim();
    }
  }
  return null;
}

function getSession(req) {
  return userManager.getSession(getSessionToken(req));
}

function requireUser(req, res, allowPasswordChange = false) {
  const session = getSession(req);
  if (!session) {
    sendJson(res, 401, { error: 'Authentication required.' });
    return null;
  }
  if (!allowPasswordChange && session.user.mustChangePassword) {
    sendJson(res, 403, { error: 'Password change required.', code: 'PASSWORD_CHANGE_REQUIRED' });
    return null;
  }
  req.user = session.user;
  return session.user;
}

function requireSuperAdmin(req, res) {
  const user = requireUser(req, res);
  if (!user) return null;
  if (!user.isSuperAdmin) {
    sendJson(res, 403, { error: 'Super administrator access required.' });
    return null;
  }
  return user;
}

function redirect(res, location) {
  res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' });
  res.end();
}

function serveLoginPage(req, res) {
  const session = getSession(req);
  if (session) {
    return redirect(res, session.user.mustChangePassword ? '/change-password.html' : '/');
  }
  res.setHeader('Cache-Control', 'no-store');
  if (!server.serveStaticFile('/login.html', res)) {
    sendJson(res, 404, { error: 'Not Found' });
  }
}

function serveProtectedPage(req, res, pathname, adminOnly = false) {
  const session = getSession(req);
  if (!session) return redirect(res, '/login.html');
  if (session.user.mustChangePassword && pathname !== '/change-password.html') {
    return redirect(res, '/change-password.html');
  }
  if (adminOnly && !session.user.isSuperAdmin) {
    res.writeHead(403, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
    return res.end('Super administrator access required.');
  }
  res.setHeader('Cache-Control', 'no-store');
  if (!server.serveStaticFile(pathname, res)) {
    sendJson(res, 404, { error: 'Not Found' });
  }
}

server.registerRoutes([
  {
    method: 'GET',
    pathname: '/',
    handler: (req, res) => serveProtectedPage(req, res, '/index.html')
  },
  {
    method: 'GET',
    pathname: '/index.html',
    handler: (req, res) => serveProtectedPage(req, res, '/index.html')
  },
  {
    method: 'GET',
    pathname: '/login.html',
    handler: serveLoginPage
  },
  {
    method: 'GET',
    pathname: '/change-password.html',
    handler: (req, res) => serveProtectedPage(req, res, '/change-password.html')
  },
  {
    method: 'GET',
    pathname: '/admin.html',
    handler: (req, res) => serveProtectedPage(req, res, '/admin.html', true)
  },
  {
    method: 'POST',
    pathname: '/api/auth/login',
    handler: (req, res) => readJsonBody(req, res, data => {
      const user = userManager.authenticate(data.username, data.password);
      if (!user) {
        return sendJson(res, 401, { error: 'Invalid username or password.' });
      }

      const session = userManager.createSession(user.id);
      const secure = req.socket.encrypted ? '; Secure' : '';
      return sendJson(res, 200, { user: session.user }, {
        'Set-Cookie': `${SESSION_COOKIE}=${session.token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`
      });
    })
  },
  {
    method: 'POST',
    pathname: '/api/auth/logout',
    handler: (req, res) => {
      const token = getSessionToken(req);
      if (token) userManager.revokeSession(token);
      return sendJson(res, 200, { success: true }, {
        'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
      });
    }
  },
  {
    method: 'GET',
    pathname: '/api/auth/me',
    handler: (req, res) => {
      const user = requireUser(req, res, true);
      if (user) sendJson(res, 200, { user });
    }
  },
  {
    method: 'POST',
    pathname: '/api/auth/change-password',
    handler: (req, res) => {
      const user = requireUser(req, res, true);
      if (!user) return;
      readJsonBody(req, res, data => {
        try {
          const updatedUser = userManager.changePassword(user.id, data.currentPassword, data.newPassword);
          if (!updatedUser) return sendJson(res, 404, { error: 'User not found.' });
          sendJson(res, 200, { user: updatedUser });
        } catch (error) {
          sendOperationError(res, error);
        }
      });
    }
  },
  {
    method: 'GET',
    pathname: '/api/users',
    handler: (req, res) => {
      if (!requireSuperAdmin(req, res)) return;
      sendJson(res, 200, userManager.getAllUsers());
    }
  },
  {
    method: 'POST',
    pathname: '/api/users',
    handler: (req, res) => {
      if (!requireSuperAdmin(req, res)) return;
      readJsonBody(req, res, data => {
        try {
          const user = userManager.createUser(data.username, data.password);
          sendJson(res, 201, user);
        } catch (error) {
          sendOperationError(res, error);
        }
      });
    }
  },
  {
    method: 'PUT',
    pathname: '/api/users/:id',
    handler: (req, res) => {
      if (!requireSuperAdmin(req, res)) return;
      readJsonBody(req, res, data => {
        try {
          const updatedUser = userManager.updateUser(req.params.id, data);
          if (!updatedUser) return sendJson(res, 404, { error: 'User not found.' });
          sendJson(res, 200, updatedUser);
        } catch (error) {
          sendOperationError(res, error);
        }
      });
    }
  },
  {
    method: 'PUT',
    pathname: '/api/users/:id/disable',
    handler: (req, res) => {
      if (!requireSuperAdmin(req, res)) return;
      try {
        const success = userManager.setUserDisabled(req.params.id, true);
        sendJson(res, success ? 200 : 404, { success });
      } catch (error) {
        sendOperationError(res, error);
      }
    }
  },
  {
    method: 'PUT',
    pathname: '/api/users/:id/enable',
    handler: (req, res) => {
      if (!requireSuperAdmin(req, res)) return;
      try {
        const success = userManager.setUserDisabled(req.params.id, false);
        sendJson(res, success ? 200 : 404, { success });
      } catch (error) {
        sendOperationError(res, error);
      }
    }
  },
  {
    method: 'DELETE',
    pathname: '/api/users/:id',
    handler: (req, res) => {
      if (!requireSuperAdmin(req, res)) return;
      try {
        const success = userManager.deleteUser(req.params.id);
        if (success) server.apiKeyManager.deleteApiKeysForOwner(req.params.id);
        sendJson(res, success ? 200 : 404, { success });
      } catch (error) {
        sendOperationError(res, error);
      }
    }
  },
  {
    method: 'GET',
    pathname: '/api/keys',
    handler: (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      sendJson(res, 200, server.apiKeyManager.getAllApiKeys(user.id));
    }
  },
  {
    method: 'POST',
    pathname: '/api/keys',
    handler: (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      readJsonBody(req, res, data => {
        if (data.name !== undefined && typeof data.name !== 'string') {
          return sendJson(res, 400, { error: 'Key name must be a string.' });
        }
        try {
          const apiKey = server.apiKeyManager.createApiKey(data.name || '', user.id);
          sendJson(res, 201, apiKey.toJSON());
        } catch (error) {
          sendOperationError(res, error);
        }
      });
    }
  },
  {
    method: 'DELETE',
    pathname: '/api/keys/:id',
    handler: (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      const success = server.apiKeyManager.deleteApiKey(req.params.id, user.id);
      sendJson(res, success ? 200 : 404, { success });
    }
  },
  {
    method: 'POST',
    pathname: '/api/keys/batch/delete',
    handler: (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      readJsonBody(req, res, data => {
        if (!Array.isArray(data.ids)) return sendJson(res, 400, { error: 'ids must be an array.' });
        try {
          const count = server.apiKeyManager.deleteMultipleApiKeys(data.ids, user.id);
          sendJson(res, 200, { count });
        } catch (error) {
          sendOperationError(res, error);
        }
      });
    }
  },
  {
    method: 'PUT',
    pathname: '/api/keys/:id/disable',
    handler: (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      const success = server.apiKeyManager.disableApiKey(req.params.id, user.id);
      sendJson(res, success ? 200 : 404, { success });
    }
  },
  {
    method: 'PUT',
    pathname: '/api/keys/:id/enable',
    handler: (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      const success = server.apiKeyManager.enableApiKey(req.params.id, user.id);
      sendJson(res, success ? 200 : 404, { success });
    }
  },
  {
    method: 'POST',
    pathname: '/api/keys/batch/disable',
    handler: (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      readJsonBody(req, res, data => {
        if (!Array.isArray(data.ids)) return sendJson(res, 400, { error: 'ids must be an array.' });
        try {
          const count = server.apiKeyManager.disableMultipleApiKeys(data.ids, user.id);
          sendJson(res, 200, { count });
        } catch (error) {
          sendOperationError(res, error);
        }
      });
    }
  },
  {
    method: 'POST',
    pathname: '/api/keys/batch/enable',
    handler: (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      readJsonBody(req, res, data => {
        if (!Array.isArray(data.ids)) return sendJson(res, 400, { error: 'ids must be an array.' });
        try {
          const count = server.apiKeyManager.enableMultipleApiKeys(data.ids, user.id);
          sendJson(res, 200, { count });
        } catch (error) {
          sendOperationError(res, error);
        }
      });
    }
  },
  {
    method: 'GET',
    pathname: '/auth',
    handler: (req, res) => {
      const authorization = req.headers.authorization || '';
      const match = /^Bearer\s+(.+)$/i.exec(authorization);
      if (!match) {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        return res.end('Authorization required');
      }
      if (!server.apiKeyManager.validateApiKey(match[1], userManager.isUserActive.bind(userManager))) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('Authorization is not valid');
      }
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end('Authorization passed');
    }
  },
  {
    method: 'GET',
    pathname: '/llm',
    handler: (req, res) => {
      if (!requireUser(req, res)) return;
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end('LLM Endpoint');
    }
  }
]);

server.start();
