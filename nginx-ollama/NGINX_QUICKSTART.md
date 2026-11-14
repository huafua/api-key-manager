# Nginx Ollama Proxy - Quick Start Guide

## 📋 Prerequisites

- ✅ Ollama running on `localhost:11434`
- ✅ Node.js API Key Manager running on `localhost:3000`
- ✅ Nginx installed

## 🚀 Quick Setup (5 minutes)

### Step 1: Copy Configuration File

Copy the nginx configuration to your nginx config directory:

**Windows:**
```cmd
copy nginx-ollama-proxy.conf "C:\nginx\conf\ollama-auth.conf"
```

**Linux/Mac:**
```bash
sudo cp nginx-ollama-proxy.conf /etc/nginx/sites-available/ollama-auth
sudo ln -s /etc/nginx/sites-available/ollama-auth /etc/nginx/sites-enabled/ollama-auth
```

### Step 2: Include in Main nginx.conf

Add this line to your main `nginx.conf` inside the `http` block:

```nginx
http {
    # ... other configs ...
    
    include ollama-auth.conf;  # Windows
    # or
    # include /etc/nginx/sites-enabled/ollama-auth;  # Linux
}
```

### Step 3: Test and Reload

```bash
# Test configuration
nginx -t

# Reload nginx (or start if not running)
nginx -s reload
```

## ✅ Verify Installation

```bash
# 1. Get a valid API key
curl http://localhost:3000/api/keys | head -20

# 2. Test proxy with valid key (replace with actual key)
curl -H "Authorization: Bearer sk-your-actual-key-here" \
  http://localhost:81/api/tags

# 3. Test proxy without key (should fail)
curl http://localhost:81/api/tags
```

## 📝 Example Requests

### List Models
```bash
API_KEY="sk-your-key-here"
curl -H "Authorization: Bearer $API_KEY" http://localhost:81/api/tags
```

### Chat Request
```bash
API_KEY="sk-your-key-here"
curl -X POST -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "messages": [{"role": "user", "content": "Hello!"}]
  }' \
  http://localhost:81/api/chat
```

### Text Generation
```bash
API_KEY="sk-your-key-here"
curl -X POST -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "prompt": "Hello, world!"
  }' \
  http://localhost:81/api/generate
```

## 🧪 Run Full Test Suite

```bash
node test-nginx-proxy.js
```

This will test:
- ✓ Service connectivity
- ✓ API key validation
- ✓ All proxy endpoints
- ✓ Authentication flows

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `nginx-ollama-proxy.conf` | Complete nginx configuration |
| `NGINX_SETUP.md` | Detailed setup and troubleshooting guide |
| `test-nginx-proxy.js` | Comprehensive test suite |

## 📊 Architecture

```
Client
   ↓ (with API Key in Authorization header)
Nginx (Port 81)
   ↓
Auth Service (Port 3000) - validates key
   ↓ (if valid)
Ollama (Port 11434)
   ↓
Response to Client
```

## ⚠️ Common Issues

### "Connection refused" on port 81
- ✓ Verify nginx is running: check taskbar or `ps aux | grep nginx`
- ✓ Verify port 81 is available
- ✓ Run `nginx -t` to check config

### "Authorization required" / 401 error
- ✓ Check you're sending Authorization header
- ✓ Format must be: `Authorization: Bearer sk-xxxxx`
- ✓ Get valid keys from: `http://localhost:3000/api/keys`

### "Invalid API key" / 403 error
- ✓ Verify key exists in API Key Manager
- ✓ Check key is not disabled
- ✓ Get valid keys: `curl http://localhost:3000/api/keys`

### "502 Bad Gateway"
- ✓ Verify Ollama is running on port 11434
- ✓ Verify Node.js auth service is running on port 3000
- ✓ Check nginx error logs

## 📚 Full Documentation

See **NGINX_SETUP.md** for:
- Detailed installation instructions
- All endpoint documentation
- Security configuration
- Performance tuning
- Integration examples
- Troubleshooting guide

## 🎯 Next Steps

1. ✅ Complete setup (see above)
2. ✅ Test with curl commands (see examples)
3. ✅ Run test suite: `node test-nginx-proxy.js`
4. 📖 Read full guide: **NGINX_SETUP.md**
5. 🔐 Add SSL/TLS for production
6. ⚙️ Tune performance if needed

## 💡 Pro Tips

**Get API Keys:**
```bash
curl http://localhost:3000/api/keys
```

**Create New API Key:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"My Key"}' \
  http://localhost:3000/api/keys
```

**Disable API Key:**
```bash
curl -X PUT http://localhost:3000/api/keys/{key-id}/disable
```

**Monitor Access:**
```bash
tail -f logs/ollama_access.log
```

**Monitor Errors:**
```bash
tail -f logs/ollama_error.log
```

## ❓ Quick Help

| Question | Answer |
|----------|--------|
| Where is config? | `nginx-ollama-proxy.conf` |
| How to test? | `node test-nginx-proxy.js` |
| How to get key? | `curl http://localhost:3000/api/keys` |
| Port 81? | Yes, configurable in nginx config |
| Need HTTPS? | Add SSL config to nginx file |
| Help with setup? | Read `NGINX_SETUP.md` |

---

**Ready to use?** Start with the Quick Setup above! 🚀
