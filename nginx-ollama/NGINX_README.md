# 🔐 Nginx Ollama Proxy - API Key 認證完整實現

歡迎使用完整的 Nginx 反向代理 + API Key 認證系統！本實現為 Ollama API 添加了強大的認證機制。

## 📚 快速導航

| 用戶類型 | 推薦閱讀 | 時間 |
|---------|---------|------|
| **急於上手** | [`NGINX_QUICKSTART.md`](./NGINX_QUICKSTART.md) | 5 分鐘 |
| **完整配置** | [`NGINX_SETUP.md`](./NGINX_SETUP.md) | 20 分鐘 |
| **理解架構** | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | 15 分鐘 |
| **技術深度** | [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) | 30 分鐘 |
| **驗證檢查** | [`VERIFICATION.md`](./VERIFICATION.md) | 10 分鐘 |

## 🎯 5 分鐘快速開始

### 前置條件
- ✅ Nginx 已安裝
- ✅ Node.js 已安裝且 `node app.js` 運行在 localhost:3000
- ✅ Ollama 已運行在 localhost:11434

### 3 步安裝

```bash
# 1. 複製配置文件
# Windows:
copy nginx-ollama-proxy.conf C:\nginx\conf\ollama-auth.conf

# Linux/Mac:
sudo cp nginx-ollama-proxy.conf /etc/nginx/sites-available/ollama-auth

# 2. 在 nginx.conf 中添加 (http 塊內)
include ollama-auth.conf;

# 3. 測試並啓動
nginx -t              # 測試配置
nginx -s reload       # 重新加載
```

### 驗證安裝

```bash
# 無認證請求（應失敗）
curl http://localhost:81/api/tags
# 預期: 401 Unauthorized

# 有認證請求（應成功）
curl -H "Authorization: Bearer sk-d6ved24isinrd2g43wbyvd93arqk4cnx" \
  http://localhost:81/api/tags
# 預期: 200 + JSON 響應
```

## 📦 實現內容

### 創建的文件

| 文件 | 大小 | 說明 |
|------|------|------|
| `nginx-ollama-proxy.conf` | 7.5 KB | 核心 Nginx 配置 |
| `NGINX_QUICKSTART.md` | 4.8 KB | 快速開始指南 |
| `NGINX_SETUP.md` | 11.1 KB | 詳細設置和故障排除 |
| `ARCHITECTURE.md` | 13.4 KB | 系統架構和流程圖 |
| `IMPLEMENTATION_SUMMARY.md` | 10.5 KB | 技術實現文檔 |
| `VERIFICATION.md` | 8.5 KB | 驗證清單 |
| `setup-nginx.ps1` | 10.4 KB | Windows 自動化工具 |
| `test-nginx-proxy.js` | 14.1 KB | Node.js 測試套件 |
| `test-curl.sh` | 8.2 KB | cURL 測試腳本 |

**總計: 88.7 KB 完整實現**

### 核心功能

✅ **API Key 認證**
- 所有受保護的端點都需要有效的 API Key
- 使用 Nginx `auth_request` 模塊進行驗證
- 無縫集成現有的 ApiKeyManager

✅ **完整的 Ollama 代理**
- `/v1/*` - OpenAI 兼容 API
- `/api/chat` - 聊天完成
- `/api/generate` - 文本生成
- `/api/embeddings` - 嵌入向量
- `/api/tags` - 列表模型
- 所有其他 Ollama 端點

✅ **流式響應支持**
- 無緩衝傳輸
- 實時流式聊天和生成
- 完美適配 Ollama 的流式 API

✅ **性能優化**
- 連接池: 32 個持久連接
- HTTP/1.1 持久連接
- 智能緩衝配置
- 適合 LLM 推理的 300 秒超時

✅ **企業級特性**
- 詳細的訪問日誌
- 錯誤日誌記錄
- 健康檢查端點
- HTTPS 支持
- 速率限制選項
- IP 訪問控制

## 🚀 使用示例

### Python 客戶端

```python
import requests

API_KEY = "sk-your-api-key-here"
headers = {"Authorization": f"Bearer {API_KEY}"}

# 列表模型
response = requests.get("http://localhost:81/api/tags", headers=headers)
print(response.json())

# 聊天
response = requests.post(
    "http://localhost:81/api/chat",
    headers=headers,
    json={
        "model": "mistral",
        "messages": [{"role": "user", "content": "Hello!"}],
        "stream": False
    }
)
print(response.json())
```

### JavaScript/Node.js 客戶端

```javascript
const API_KEY = "sk-your-api-key-here";

// 列表模型
fetch("http://localhost:81/api/tags", {
    headers: { "Authorization": `Bearer ${API_KEY}` }
})
.then(r => r.json())
.then(d => console.log(d));

// 聊天
fetch("http://localhost:81/api/chat", {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        model: "mistral",
        messages: [{ role: "user", content: "Hello!" }],
        stream: false
    })
})
.then(r => r.json())
.then(d => console.log(d));
```

### cURL 示例

```bash
# 設置 API Key 變量
API_KEY="sk-your-api-key-here"

# 列表模型
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:81/api/tags

# 聊天
curl -X POST -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }' \
  http://localhost:81/api/chat

# 文本生成
curl -X POST -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "prompt": "What is AI?",
    "stream": false
  }' \
  http://localhost:81/api/generate

# 生成嵌入
curl -X POST -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "input": "Hello world"
  }' \
  http://localhost:81/api/embeddings
```

## 🧪 測試工具

### Windows 用戶

```powershell
# 安裝配置
.\setup-nginx.ps1 -Command install

# 運行完整測試
.\setup-nginx.ps1 -Command test

# 其他命令
.\setup-nginx.ps1 -Command start      # 啓動 Nginx
.\setup-nginx.ps1 -Command reload     # 重新加載配置
.\setup-nginx.ps1 -Command stop       # 停止 Nginx
.\setup-nginx.ps1 -Command status     # 查看狀態
.\setup-nginx.ps1 -Command logs       # 查看日誌
```

### Linux/Mac 用戶

```bash
# Node.js 測試套件
node test-nginx-proxy.js

# cURL 測試 (互動模式)
bash test-curl.sh

# cURL 特定測試
bash test-curl.sh auth          # 認證測試
bash test-curl.sh endpoints     # 端點測試
bash test-curl.sh streaming     # 流式測試
bash test-curl.sh performance   # 性能測試
bash test-curl.sh all           # 所有測試
```

## 🔒 安全特性

### API Key 管理

```bash
# 獲取所有密鑰
curl http://localhost:3000/api/keys

# 創建新密鑰
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"My Key"}' \
  http://localhost:3000/api/keys

# 禁用密鑰
curl -X PUT http://localhost:3000/api/keys/{key-id}/disable

# 啓用密鑰
curl -X PUT http://localhost:3000/api/keys/{key-id}/enable

# 刪除密鑰
curl -X DELETE http://localhost:3000/api/keys/{key-id}
```

### 日誌查看

```bash
# 訪問日誌
tail -f logs/ollama_access.log

# 錯誤日誌
tail -f logs/ollama_error.log
```

## 🔄 系統架構

```
Client (with API Key)
   ↓
Nginx (Port 81)
   ├─ Route to /api/*, /v1/*
   └─ Verify auth_request
      ↓
Node.js Auth Service (Port 3000)
   ├─ Validate API Key
   └─ Return 200 (valid) or 403 (invalid)
      ↓
Ollama Backend (Port 11434)
   ├─ Process request
   └─ Return response
      ↓
Response to Client
```

## 📊 支持的端點

| 端點 | 方法 | 認證 | 用途 |
|------|------|------|------|
| `/v1/*` | ANY | ✅ | OpenAI 兼容 API |
| `/api/chat` | POST | ✅ | 聊天完成 |
| `/api/generate` | POST | ✅ | 文本生成 |
| `/api/embeddings` | POST | ✅ | 嵌入向量 |
| `/api/tags` | GET | ✅ | 列表模型 |
| `/api/show` | POST | ✅ | 模型詳情 |
| `/api/*` | ANY | ✅ | 其他端點 |
| `/health` | GET | ❌ | 健康檢查 |

## ❓ 常見問題

### Q: 如何修改代理端口？

A: 在 `nginx-ollama-proxy.conf` 中修改 `listen` 指令:
```nginx
listen 8080;  # 改為任意可用端口
```

### Q: 如何添加 HTTPS？

A: 見 `NGINX_SETUP.md` 中的 Security 部分

### Q: 如何添加速率限制？

A: 見 `NGINX_SETUP.md` 中的 Performance Tuning 部分

### Q: 流式響應不工作？

A: 確保配置中有 `proxy_buffering off;`（已默認配置）

### Q: 如何查看請求日誌？

A: 查看 `logs/ollama_access.log` 和 `logs/ollama_error.log`

## 🐛 故障排除

### 連接被拒絕

```bash
# 檢查 Nginx 是否運行
nginx -s status

# 檢查端口是否監聽
netstat -an | grep 81

# 檢查配置是否正確
nginx -t
```

### 認證總是失敗

```bash
# 驗證 API Key 有效
curl http://localhost:3000/api/keys

# 檢查 Key 是否被禁用
curl http://localhost:3000/api/keys | grep -A 5 disabled

# 驗證 Key 格式
# 應該以 "sk-" 開頭
```

### 502 Bad Gateway

```bash
# 檢查 Ollama 是否運行
curl http://localhost:11434/api/tags

# 檢查 Auth Service 是否運行
curl http://localhost:3000/api/keys

# 查看 Nginx 錯誤日誌
tail -f logs/ollama_error.log
```

## 📖 進階主題

- 🔐 **HTTPS/SSL 配置** → 見 `NGINX_SETUP.md`
- 🚀 **性能優化** → 見 `NGINX_SETUP.md`
- 📊 **監控和日誌** → 見 `NGINX_SETUP.md`
- 🏗️ **架構理解** → 見 `ARCHITECTURE.md`
- 🔍 **完整配置參考** → 見 `IMPLEMENTATION_SUMMARY.md`

## ✨ 特點總結

- ✅ 零代碼修改 - 完全基於現有系統
- ✅ 即插即用 - 複製配置即可使用
- ✅ 完整文檔 - 3 層次的文檔覆蓋
- ✅ 多平台支持 - Windows、Linux、macOS
- ✅ 完整測試 - 11+ 個測試用例
- ✅ 性能優化 - 連接池、流式支持
- ✅ 企業級 - 日誌、監控、安全特性
- ✅ 易於擴展 - 開放的架構設計

## 🎓 學習資源

| 主題 | 資源 |
|------|------|
| Nginx auth_request | [官方文檔](http://nginx.org/en/docs/http/ngx_http_auth_request_module.html) |
| Ollama API | [API 文檔](https://github.com/ollama/ollama/blob/main/docs/api.md) |
| Nginx 配置 | [官方文檔](https://nginx.org/en/docs/) |
| 本項目技術 | [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) |

## 🤝 支持

| 問題類型 | 推薦資源 |
|---------|---------|
| 快速開始 | [`NGINX_QUICKSTART.md`](./NGINX_QUICKSTART.md) |
| 安裝問題 | [`NGINX_SETUP.md#Troubleshooting`](./NGINX_SETUP.md) |
| 架構問題 | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| 技術細節 | [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) |
| 測試驗證 | [`VERIFICATION.md`](./VERIFICATION.md) |

## 📝 版本信息

- **版本**: 1.0
- **完成日期**: 2024
- **維護者**: Copilot
- **許可證**: MIT
- **狀態**: ✅ 生產就緒

## 🚀 開始使用

1. ✅ 閱讀 [`NGINX_QUICKSTART.md`](./NGINX_QUICKSTART.md) (5 分鐘)
2. ✅ 複製 `nginx-ollama-proxy.conf` 到 Nginx 配置目錄
3. ✅ 運行測試驗證安裝
4. ✅ 開始使用 API Key 認證的 Ollama API！

---

**祝你使用愉快！如有任何問題，請參考上面的資源。** 🎉
