# Nginx Ollama Proxy 架構和流程圖

## 🏗️ 系統架構圖

### 完整系統架構

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Application                         │
│  (Python/Node.js/cURL 等，帶有 Authorization 頭)                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ HTTP/HTTPS Request
                        │ Authorization: Bearer sk-xxxxx
                        │
                        ▼
        ┌──────────────────────────────────┐
        │   Nginx Reverse Proxy (Port 81)  │
        │                                   │
        │  ┌────────────────────────────┐  │
        │  │  Route Dispatcher          │  │
        │  │  - /v1/* → Ollama v1 API   │  │
        │  │  - /api/* → Ollama API     │  │
        │  │  - /health → 無認證       │  │
        │  └────────────────────────────┘  │
        │           │                       │
        │           ▼                       │
        │  ┌────────────────────────────┐  │
        │  │  auth_request Module       │  │
        │  │  驗證 API Key              │  │
        │  └────────────┬───────────────┘  │
        │               │                   │
        └───────────────┼───────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
    ┌─────────────┐            ┌──────────────────┐
    │  Invalid    │            │  Valid / Disabled│
    │  Return 401 │            │  Return 403      │
    └─────────────┘            │  or Forward ✓    │
                               └────────┬─────────┘
                                        │
                                        ▼
                        ┌──────────────────────────┐
                        │  Node.js Auth Service    │
                        │  (Port 3000)             │
                        │                          │
                        │  ApiKeyManager           │
                        │  - 驗證 API Key          │
                        │  - 檢查禁用狀態          │
                        │  - 記錄最後使用時間      │
                        └────────────┬─────────────┘
                                     │
                        ┌────────────┴────────────┐
                        │                         │
                        ▼                         ▼
                    ┌────────┐             ┌──────────┐
                    │ Valid  │             │ Invalid  │
                    │ Return │             │ Return   │
                    │ 200    │             │ 401/403  │
                    └────┬───┘             └──────────┘
                         │
                         ▼
            ┌──────────────────────────┐
            │ Ollama Backend           │
            │ (Port 11434)             │
            │                          │
            │ - /api/chat              │
            │ - /api/generate          │
            │ - /api/embeddings        │
            │ - /v1/chat/completions   │
            │ - /api/tags              │
            └────────────┬─────────────┘
                         │
                         ▼
            ┌──────────────────────────┐
            │ Response to Client       │
            │ (JSON/Streaming)         │
            └──────────────────────────┘
```

## 🔄 請求流程圖

### 成功認證流程

```
Client
  │
  ├─ GET /api/tags
  ├─ Header: Authorization: Bearer sk-valid-key
  │
  ▼
Nginx auth_request
  │
  ├─ Forward to: POST /auth
  ├─ Pass Authorization header
  │
  ▼
Node.js Auth Service
  │
  ├─ Parse API Key from header
  ├─ Look up in ApiKeyManager
  ├─ Check if not disabled
  ├─ Update lastUsed timestamp
  │
  ▼
  ├─ Return 200 OK ✓
  │
  ▼
Nginx (auth verified)
  │
  ├─ Forward to: GET /api/tags
  ├─ To: http://localhost:11434/api/tags
  │
  ▼
Ollama Backend
  │
  ├─ Process request
  ├─ Return JSON response
  │
  ▼
Nginx (proxy response)
  │
  ├─ Log request
  ├─ Return response to client
  │
  ▼
Client receives 200 + JSON
```

### 失敗認證流程

```
Client
  │
  ├─ GET /api/tags
  ├─ Header: Authorization: Bearer sk-invalid-key
  │
  ▼
Nginx auth_request
  │
  ├─ Forward to: POST /auth
  ├─ Pass Authorization header
  │
  ▼
Node.js Auth Service
  │
  ├─ Parse API Key from header
  ├─ Look up in ApiKeyManager
  ├─ NOT FOUND or DISABLED
  │
  ▼
  ├─ Return 403 Forbidden ✗
  │
  ▼
Nginx (auth failed)
  │
  ├─ Block request
  ├─ Return 403 response
  ├─ Log rejection
  │
  ▼
Client receives 403 + error message
```

### 無認證流程

```
Client
  │
  ├─ GET /api/tags
  ├─ No Authorization header
  │
  ▼
Nginx auth_request
  │
  ├─ Forward to: POST /auth
  ├─ No Authorization header
  │
  ▼
Node.js Auth Service
  │
  ├─ No header found
  │
  ▼
  ├─ Return 401 Unauthorized ✗
  │
  ▼
Nginx (auth missing)
  │
  ├─ Block request
  ├─ Return 401 response
  ├─ Log missing auth
  │
  ▼
Client receives 401 + error message
```

## 📊 HTTP 狀態碼流圖

```
Request from Client
        │
        ▼
   Nginx Router
        │
        ├─ No Authorization header?
        │  └─→ Return 401 (Unauthorized)
        │     "Authorization required"
        │
        ├─ Authorization header present?
        │  │
        │  ▼
        │  auth_request /auth
        │  │
        │  ├─ Auth Service returns 200?
        │  │  └─→ Forward to Ollama
        │  │     │
        │  │     ▼
        │  │     Ollama Response
        │  │     ├─ 200 OK ✓
        │  │     ├─ 500 Error
        │  │     └─ etc.
        │  │
        │  ├─ Auth Service returns 401?
        │  │  └─→ Return 401
        │  │     "Authorization required"
        │  │
        │  ├─ Auth Service returns 403?
        │  │  └─→ Return 403
        │  │     "Invalid or disabled API key"
        │  │
        │  └─ Connection error?
        │     └─→ Return 502
        │        "Bad Gateway"
        │
        ▼
   Response to Client
```

## 🔐 認證機制詳細流程

```
API Key in Database
│
├─ ID: key_abc123
├─ Key: sk-d6ved24isinrd2g43wbyvd93arqk4cnx
├─ Name: "Production API Key"
├─ Disabled: false
├─ Created: 2024-01-01T00:00:00Z
└─ LastUsed: 2024-01-15T12:30:45Z

Client Request
│
├─ Authorization: Bearer sk-d6ved24isinrd2g43wbyvd93arqk4cnx
│
▼
ApiKeyManager.validateApiKey()
│
├─ 1. Parse bearer token
│ └─ Extract: "sk-d6ved24isinrd2g43wbyvd93arqk4cnx"
│
├─ 2. Loop through all keys
│ └─ Compare with key.key property
│
├─ 3. Check if not disabled
│ └─ if (apiKey.disabled === true) ✗
│
├─ 4. Update last used
│ └─ apiKey.lastUsed = new Date()
│
├─ 5. Save to storage
│ └─ writeFile('data/api-keys.json')
│
▼
Return true ✓ → Auth Success
Return false ✗ → Auth Failure
```

## 🔄 端點路由圖

```
Nginx Port 81
│
├─ /health (GET)
│  └─ No auth required
│     → Ollama /api/tags
│
├─ /v1/* (ANY)
│  └─ Auth required
│     → Ollama /v1/*
│     │
│     ├─ /v1/models
│     ├─ /v1/chat/completions
│     ├─ /v1/completions
│     └─ ... (all v1 endpoints)
│
├─ /api/chat (POST)
│  └─ Auth required
│     → Ollama /api/chat
│     (streaming enabled)
│
├─ /api/generate (POST)
│  └─ Auth required
│     → Ollama /api/generate
│     (streaming enabled)
│
├─ /api/embeddings (POST)
│  └─ Auth required
│     → Ollama /api/embeddings
│
├─ /api/tags (GET)
│  └─ Auth required
│     → Ollama /api/tags
│
├─ /api/show (POST)
│  └─ Auth required
│     → Ollama /api/show
│
└─ /api/* (CATCH-ALL)
   └─ Auth required
      → Ollama /api/*
      (streaming if needed)
```

## 📈 數據流圖 - API Key 生命週期

```
1. 創建 API Key
   │
   └─ POST /api/keys
      │
      ├─ Server.registerRoute() 接收請求
      │
      ├─ ApiKeyManager.createApiKey()
      │  ├─ 生成隨機密鑰 (sk-32chars)
      │  ├─ 生成 ID (key_9chars)
      │  ├─ 設置 createdAt
      │  ├─ 存入 Map
      │  └─ 保存到 api-keys.json
      │
      └─ 返回 201 + key JSON

2. 使用 API Key
   │
   └─ GET /api/tags + Bearer token
      │
      ├─ Nginx 攔截
      │
      ├─ auth_request /auth
      │  │
      │  ├─ ApiKeyManager.validateApiKey()
      │  │  ├─ 在 Map 中查找
      │  │  ├─ 驗證格式
      │  │  ├─ 檢查禁用狀態
      │  │  ├─ 更新 lastUsed
      │  │  └─ 保存
      │  │
      │  └─ 返回 200 ✓
      │
      ├─ Nginx 轉發到 Ollama
      │
      └─ 返回結果

3. 禁用 API Key
   │
   └─ PUT /api/keys/{id}/disable
      │
      ├─ ApiKeyManager.disableApiKey()
      │  ├─ 在 Map 中查找 ID
      │  ├─ 設置 disabled = true
      │  └─ 保存到 api-keys.json
      │
      └─ 返回 200 + {success: true}

4. 刪除 API Key
   │
   └─ DELETE /api/keys/{id}
      │
      ├─ ApiKeyManager.deleteApiKey()
      │  ├─ 從 Map 中刪除
      │  └─ 保存到 api-keys.json
      │
      └─ 返回 200 + {success: true}
```

## 🎯 性能優化流圖

```
Client Connection
      │
      ▼
Nginx Upstream
      │
      ├─ Connection Pool
      │  └─ keepalive 32 connections
      │     (復用現有連接)
      │
      ├─ HTTP/1.1 Persistent
      │  └─ Connection: ""
      │     (允許保活)
      │
      ├─ Request Buffering
      │  ├─ proxy_buffer_size: 128k
      │  ├─ proxy_buffers: 4 × 256k
      │  └─ client_max_body_size: 100M
      │
      ├─ Timeout Configuration
      │  ├─ connect: 30s
      │  ├─ send: 300s
      │  └─ read: 300s
      │
      └─ Streaming Control
         ├─ proxy_buffering: off
         │  (禁用緩衝，實時流傳輸)
         │
         └─ proxy_request_buffering: off
            (直接轉發請求)

Result: 高吞吐量 + 低延遲 + 實時流響應
```

## 📋 測試流程圖

```
Test Suite Start
      │
      ├─ 1. Connectivity Tests
      │  ├─ Check Auth Service (3000)
      │  ├─ Check Ollama Backend (11434)
      │  └─ Check Nginx Proxy (81)
      │
      ├─ 2. Get Valid API Key
      │  └─ From: http://localhost:3000/api/keys
      │
      ├─ 3. Authentication Tests
      │  ├─ No header → Expect 401/403
      │  ├─ Invalid key → Expect 403
      │  └─ Valid key → Expect 200
      │
      ├─ 4. Endpoint Tests
      │  ├─ GET /api/tags
      │  ├─ POST /api/chat
      │  ├─ POST /api/generate
      │  ├─ POST /api/embeddings
      │  └─ GET /v1/models
      │
      └─ 5. Report Results
         ├─ Passed: X
         ├─ Failed: Y
         └─ Exit Code: 0 (all pass) or 1 (failures)
```

---

**這份文檔提供了視覺化的系統架構、數據流和流程圖。**
**結合代碼和文字文檔一起理解系統的工作原理。**
