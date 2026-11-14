# Nginx Reverse Proxy Setup Guide for Ollama API Key Authentication

## Overview

This guide explains how to set up and use the nginx reverse proxy configuration for Ollama API with API Key authentication.

## Architecture

```
Client Request with API Key
        ↓
    Nginx (Port 81)
        ↓
auth_request to Node.js Auth Service (Port 3000)
        ↓
  API Key Validation
    ↓         ↓
  Valid    Invalid
    ↓         ↓
  Pass    Reject (401/403)
    ↓
Proxy to Ollama (Port 11434)
    ↓
Return Response
```

## Prerequisites

1. **Node.js Auth Service**: Running on `localhost:3000`
   - Provides API key validation at `/auth` endpoint
   - Returns 200 for valid keys, 401/403 for invalid keys

2. **Ollama Service**: Running on `localhost:11434`
   - The actual LLM service being proxied

3. **Nginx**: Installed and configured

## Configuration Files

### File Locations

- Main nginx config: `nginx-ollama-proxy.conf`
- Original simplified config: `ollama-auth.conf` (now superseded)

## Installation Steps

### 1. Copy Configuration

Copy `nginx-ollama-proxy.conf` to your nginx configuration directory:

**Windows (NGINX installed via MSI or portable):**
```bash
copy D:\api-key-manager\nginx-ollama-proxy.conf "C:\nginx\conf\ollama-auth.conf"
```

**Linux:**
```bash
sudo cp /path/to/nginx-ollama-proxy.conf /etc/nginx/sites-available/ollama-auth
```

### 2. Include Configuration in Main nginx.conf

Add this line to your main `nginx.conf` (inside http block):

```nginx
include ../ollama-auth.conf;
# or on Linux:
# include /etc/nginx/sites-available/ollama-auth;
```

### 3. Test Configuration

```bash
# Test nginx configuration syntax
nginx -t
# or
./nginx -t

# Output should show:
# nginx: the configuration file ... syntax is ok
# nginx: configuration file ... test is successful
```

### 4. Start/Reload Nginx

```bash
# Start nginx
nginx

# Or reload if already running
nginx -s reload
```

### 5. Verify Services

Ensure all services are running:

```bash
# Check Node.js API Key Manager
curl http://localhost:3000/api/keys

# Check Ollama
curl http://localhost:11434/api/tags

# Check Nginx proxy health
curl http://localhost:81/health
```

## Usage Examples

### Making Requests to Ollama Through Nginx

All requests must include an `Authorization` header with a valid API key.

#### Get Available Models
```bash
curl -H "Authorization: Bearer sk-your-api-key-here" \
  http://localhost:81/api/tags
```

#### Chat with Ollama
```bash
curl -X POST \
  -H "Authorization: Bearer sk-your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }' \
  http://localhost:81/api/chat
```

#### Generate Text
```bash
curl -X POST \
  -H "Authorization: Bearer sk-your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "prompt": "Hello, world!",
    "stream": false
  }' \
  http://localhost:81/api/generate
```

#### Generate Embeddings
```bash
curl -X POST \
  -H "Authorization: Bearer sk-your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "input": "Hello, world!"
  }' \
  http://localhost:81/api/embeddings
```

#### OpenAI-Compatible /v1 API
```bash
curl -H "Authorization: Bearer sk-your-api-key-here" \
  http://localhost:81/v1/models

# Chat completion
curl -X POST \
  -H "Authorization: Bearer sk-your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "messages": [{"role": "user", "content": "Hello"}]
  }' \
  http://localhost:81/v1/chat/completions
```

## Configuration Details

### Key Features

1. **API Key Validation**
   - All requests to `/v1/` and `/api/*` endpoints require `Authorization` header
   - API keys are validated against the Node.js API Key Manager
   - Invalid or disabled keys return 403 Forbidden

2. **Streaming Support**
   - `proxy_buffering off` disables buffering for streaming responses
   - Streaming endpoints: `/api/chat`, `/api/generate`, `/api/embeddings`

3. **Connection Management**
   - Upstream connections use `keepalive` for connection pooling
   - HTTP/1.1 with persistent connections for better performance

4. **Buffer Configuration**
   - Large buffer sizes for handling big requests/responses
   - Client max body size: 100M for file uploads

5. **Timeout Configuration**
   - Connect timeout: 30s
   - Send timeout: 300s (5 minutes)
   - Read timeout: 300s (5 minutes)

6. **Request Headers**
   - Forwards real client IP via `X-Real-IP` and `X-Forwarded-For`
   - Preserves original protocol via `X-Forwarded-Proto`
   - Passes through Authorization header to backend

7. **Health Check**
   - `/health` endpoint available without authentication
   - Useful for monitoring and load balancing

## Endpoints Protected by Authentication

| Endpoint | Method | Authentication | Purpose |
|----------|--------|----------------|---------|
| `/v1/*` | ANY | ✅ Required | OpenAI-compatible API |
| `/api/chat` | POST | ✅ Required | Chat completions |
| `/api/generate` | POST | ✅ Required | Text generation |
| `/api/embeddings` | POST | ✅ Required | Generate embeddings |
| `/api/tags` | GET | ✅ Required | List models |
| `/api/show` | POST | ✅ Required | Show model details |
| `/api/*` | ANY | ✅ Required | All other API endpoints |
| `/health` | GET | ❌ None | Health check |

## Error Responses

### Missing Authorization Header (401)
```json
{
  "error": "Authorization required",
  "message": "Please provide a valid API key via Authorization header"
}
```

### Invalid/Disabled API Key (403)
```json
{
  "error": "Authorization failed",
  "message": "Invalid or disabled API key"
}
```

### Endpoint Not Found (404)
```json
{
  "error": "Not Found"
}
```

## Troubleshooting

### 1. Connection Refused

**Problem**: `curl: (7) Failed to connect to localhost:81`

**Solution**:
- Verify nginx is running: `nginx -s status` or check process
- Check nginx configuration: `nginx -t`
- Verify port 81 is available (not blocked by firewall)

### 2. Authentication Always Fails

**Problem**: Getting 403 even with valid API key

**Solution**:
- Verify Node.js auth service is running on port 3000
- Check API key format: should start with `sk-`
- Verify Authorization header format: `Authorization: Bearer sk-xxxxx`
- Check auth service logs at `3000` port

### 3. Upstream Connection Refused

**Problem**: Getting 502 Bad Gateway

**Solution**:
- Verify Ollama is running on port 11434
- Check firewall allows local connections
- Verify upstream URL is correct in config

### 4. Streaming Not Working

**Problem**: Response streaming interrupted or incomplete

**Solution**:
- Ensure `proxy_buffering off` is set (already configured)
- Check timeout values for long-running requests
- Verify client supports chunked transfer encoding

### 5. Large Request Failures

**Problem**: 413 Payload Too Large

**Solution**:
- Increase `client_max_body_size` in config
- Verify proxy buffer sizes are sufficient

## Viewing Logs

```bash
# Access logs (all requests)
tail -f logs/ollama_access.log

# Error logs (warnings and errors)
tail -f logs/ollama_error.log

# Windows (if logs directory is in nginx folder)
# Or check the path specified in access_log/error_log directives
```

## Performance Tuning

### For High Traffic

```nginx
upstream ollama_backend {
    server localhost:11434;
    server localhost:11434;  # Add more backends if available
    keepalive 64;            # Increase keepalive connections
}

upstream auth_service {
    server localhost:3000;
    keepalive 64;
}
```

### For Streaming Optimization

Already configured with `proxy_buffering off` for optimal streaming performance.

### Connection Pooling

- `keepalive 32` ensures connection reuse
- `proxy_http_version 1.1` enables HTTP/1.1 features
- `proxy_set_header Connection ""` allows persistent connections

## Security Considerations

1. **API Key Storage**: Store API keys in `data/api-keys.json`
   - This file should be protected with appropriate file permissions
   - Never expose to version control (add to .gitignore)

2. **HTTPS/TLS**: For production, add SSL/TLS termination:
   ```nginx
   listen 443 ssl;
   ssl_certificate /path/to/cert.crt;
   ssl_certificate_key /path/to/key.key;
   ```

3. **Rate Limiting**: Add rate limiting to prevent abuse:
   ```nginx
   limit_req_zone $remote_addr zone=api_limit:10m rate=10r/s;
   
   location /v1/ {
       limit_req zone=api_limit burst=20 nodelay;
       # ... rest of configuration
   }
   ```

4. **Access Control**: Restrict access by IP if needed:
   ```nginx
   location /api/ {
       allow 192.168.1.0/24;
       allow 127.0.0.1;
       deny all;
   }
   ```

## Reloading Configuration After Changes

```bash
# Test the new configuration
nginx -t

# If test passes, reload
nginx -s reload

# Verify it's running
nginx -s version
```

## Complete Service Startup

Run all services in the correct order:

```bash
# 1. Start Ollama (in separate terminal)
ollama serve

# 2. Start Node.js API Key Manager
node app.js

# 3. Start/Reload Nginx
nginx -s reload

# 4. Test the complete setup
curl -H "Authorization: Bearer sk-your-api-key" http://localhost:81/api/tags
```

## Integration Examples

### Python Client
```python
import requests

API_KEY = "sk-your-api-key-here"
BASE_URL = "http://localhost:81"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Get models
response = requests.get(f"{BASE_URL}/api/tags", headers=headers)
print(response.json())

# Chat
response = requests.post(
    f"{BASE_URL}/api/chat",
    headers=headers,
    json={
        "model": "mistral",
        "messages": [{"role": "user", "content": "Hello"}],
        "stream": False
    }
)
print(response.json())
```

### JavaScript/Node.js Client
```javascript
const API_KEY = "sk-your-api-key-here";
const BASE_URL = "http://localhost:81";

const headers = {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
};

// Get models
fetch(`${BASE_URL}/api/tags`, { headers })
    .then(r => r.json())
    .then(d => console.log(d));

// Chat
fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
        model: "mistral",
        messages: [{ role: "user", content: "Hello" }],
        stream: false
    })
})
.then(r => r.json())
.then(d => console.log(d));
```

## Additional Resources

- [Ollama API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Nginx auth_request Module](http://nginx.org/en/docs/http/ngx_http_auth_request_module.html)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review nginx error logs
3. Verify all services are running correctly
4. Check API Key Manager status at http://localhost:3000/api/keys
