const http = require('http');
const path = require('path');
const fs = require('fs');
const { ApiKeyManager } = require('./apiKeyManager');

/**
 * Request passed to a route handler, including extracted path parameters.
 *
 * @typedef {http.IncomingMessage & {params: Object<string, string>}} RouteRequest
 */

/**
 * Handles a request after its route has matched.
 *
 * @callback RouteHandler
 * @param {RouteRequest} req - Incoming request; named path parameters are available as `req.params`.
 * @param {http.ServerResponse} res - HTTP response to write.
 * @param {URL} urlObject - Parsed request URL.
 * @returns {*} The handler's return value.
 */

/**
 * Object describing one route registered with the server. All three properties are required.
 *
 * @typedef {Object} RouteDefinition
 * @property {string} method HTTP method to match, such as `'GET'` or `'POST'`.
 * @property {string} pathname Route path; segments beginning with `:` match a single path segment and become `req.params` properties.
 * @property {RouteHandler} handler Function called when the method and path match.
 * @example
 * {
 *   method: 'GET',
 *   pathname: '/api/keys/:id',
 *   handler: (req, res, urlObject) => {
 *     res.end(`Requested key ${req.params.id}`);
 *   }
 * }
 */

/**
 * Minimal HTTP server with route matching, static file serving, and API key management.
 */
class Server {
  /**
   * Creates a server instance and initializes its route and API key manager state.
   *
   * @param {number} [port=3000] - Port the HTTP server listens on.
   * @param {ApiKeyManager} [apiKeyManager] - API key manager instance.
   */
  constructor(port = 3000, apiKeyManager = new ApiKeyManager()) {
    this.port = port;
    this.routes = new Map();
    this.apiKeyManager = apiKeyManager;
    this.staticDir = path.join(__dirname, 'public');
    this.server = null;
  }

  /**
   * Registers or replaces a handler for an HTTP method and pathname.
   *
   * @param {string} method - HTTP method to match.
   * @param {string} pathname - Route path, optionally containing `:param` segments.
   * @param {RouteHandler} handler - Function called for matching requests.
   * @returns {this} This server instance, for method chaining.
   */
  registerRoute(method, pathname, handler) {
    const key = `${method}:${pathname}`;
    this.routes.set(key, handler);
    return this;
  }

  /**
   * Registers an array of route objects. Each object must provide `method`, `pathname`, and `handler`.
   *
   * @param {RouteDefinition[]} routes - Route objects in the documented `{ method, pathname, handler }` shape.
   * @returns {this} This server instance, for method chaining.
   * @example
   * server.registerRoutes([
   *   {
   *     method: 'GET',
   *     pathname: '/api/student/:id',
   *     handler: (req, res) => {
   *       const studentId = req.params.id;
   *       res.end(`Student detail for ${studentId}`);
   *     }
   *   }
   * ]);
   */
  registerRoutes(routes) {
    routes.forEach(({ method, pathname, handler }) => {
      this.registerRoute(method, pathname, handler);
    });
    return this;
  }

  /**
   * Serves a file from the public directory when it exists.
   *
   * @param {string} pathname - Request path to resolve under the public directory.
   * @param {http.ServerResponse} res - Response used to send the file.
   * @returns {boolean} Whether a file was successfully served.
   */
  serveStaticFile(pathname, res) {
    let filePath;

    if (pathname === '/' || pathname === '') {
      filePath = path.join(this.staticDir, 'index.html');
    } else {
      const rootPath = path.resolve(this.staticDir);
      filePath = path.resolve(rootPath, pathname.replace(/^[/\\]+/, ''));
      const relativePath = path.relative(rootPath, filePath);
      if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
        return false;
      }
    }

    try {
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      const content = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      };

      const contentType = contentTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Applies CORS headers and dispatches a request to a registered route or static file.
   *
   * @param {http.IncomingMessage} req - Incoming HTTP request.
   * @param {http.ServerResponse} res - Response to write.
   */
  handleRequest(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    const urlObject = new URL(req.url, `http://${req.headers.host}`);
    const pathname = urlObject.pathname;

    // Try exact route match first
    const routeKey = `${req.method}:${pathname}`;
    let handler = this.routes.get(routeKey);
    let params = {};

    // Try pattern-based route match, sorted by specificity (longer patterns first)
    if (!handler) {
      const sortedRoutes = Array.from(this.routes.entries())
        .filter(([key]) => key.startsWith(req.method + ':'))
        .sort((a, b) => {
          const patternA = a[0].substring(req.method.length + 1);
          const patternB = b[0].substring(req.method.length + 1);
          return patternB.length - patternA.length;
        });

      for (const [key, routeHandler] of sortedRoutes) {
        const pattern = key.substring(req.method.length + 1);
        const routeParams = {};
        if (this.matchRoute(pattern, pathname, routeParams)) {
          handler = routeHandler;
          params = routeParams;
          break;
        }
      }
    }

    if (handler) {
      req.params = params;
      return handler(req, res, urlObject);
    }

    if (req.method === 'GET' && this.serveStaticFile(pathname, res)) {
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }

  /**
   * Checks whether a pathname matches a route pattern and extracts named path segments.
   *
   * A pattern segment beginning with `:` matches any single path segment and adds its value
   * to the optional `params` object under the parameter name.
   *
   * @param {string} pattern - Registered route pattern.
   * @param {string} pathname - Request pathname to compare.
   * @param {Object<string, string>} [params] - Object to populate with extracted parameters.
   * @returns {boolean} Whether the pattern matches the pathname.
   */
  matchRoute(pattern, pathname, params = {}) {
    const patternParts = pattern.split('/').filter(p => p !== '');
    const pathParts = pathname.split('/').filter(p => p !== '');
    const matchedParams = {};

    if (patternParts.length !== pathParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        const paramName = patternPart.substring(1);
        if (!paramName) {
          return false;
        }
        matchedParams[paramName] = pathPart;
        continue;
      }

      if (patternPart !== pathPart) {
        return false;
      }
    }

    Object.assign(params, matchedParams);
    return true;
  }

  /**
   * Creates and starts the HTTP server.
   *
   * @returns {http.Server} The underlying Node.js HTTP server.
   */
  start() {
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(this.port, () => {
      console.log(`\x1b[33m ${new Date().toISOString()}: Server running at http://localhost:${this.port}/\x1b[0m`);
    });

    return this.server;
  }

  /**
   * Closes the HTTP server if it has been started.
   */
  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = { Server };
