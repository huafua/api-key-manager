# Nginx Ollama API 反向代理 - API Key 校驗說明

## 簡介

本說明文檔介紹如何使用 Nginx 作為 Ollama API 的反向代理，並集成 API Key 認證校驗機制。

**核心概念：** 所有 Ollama API 請求都必須通過 Nginx 代理，並在通過時驗證有效的 API Key。

## 系統架構

```
┌─────────────────────────────────────────┐
│     客戶端請求                           │
│  (需要提供 Authorization: Bearer key)   │
└──────────────┬──────────────────────────┘
               │
               ▼
        ┌─────────────────┐
        │ Nginx 代理      │ (Port 81)
        │ 攔截請求       │
        └────────┬────────┘
                 │
         ┌───────┴─────────┐
         │                 │
         ▼                 ▼
    ┌────────────┐   ┌──────────────────┐
    │ auth_request  │   │ 無效/無認證      │
    │ 驗證 API Key  │   │ 返回 403/401    │
    └────┬───────┘   └──────────────────┘
         │
    ┌────┴──────────────────┐
    │ 驗證通過 (200 OK)     │
    ▼                      ▼
┌──────────────────┐  ┌──────────────┐
│ Ollama Backend   │  │ 代理請求到   │
│ (Port 11434)     │  │ Ollama       │
└──────────────────┘  └──────────────┘
         ▲
         │ 返回響應
         ▼
    返回給客戶端
```

## 安裝步驟

### 第一步：複製 Nginx 配置文件

將 `nginx-ollama-proxy.conf` 文件複製到 Nginx 配置目錄：

**Windows:**
```bash
copy nginx-ollama-proxy.conf C:\nginx\conf\ollama-auth.conf
```

**Linux/Mac:**
```bash
sudo cp nginx-ollama-proxy.conf /etc/nginx/sites-available/ollama-auth
```

### 第二步：編輯 nginx.conf

在主配置文件 `nginx.conf` 的 `http` 塊中添加包含指令：

```nginx
http {
    # ... 其他配置 ...
    
    include ollama-auth.conf;  # 添加此行
}
```

### 第三步：驗證配置

```bash
# 檢查配置語法是否正確
nginx -t

# 預期輸出：
# nginx: the configuration file ... syntax is ok
# nginx: configuration file ... test is successful
```

### 第四步：啓動或重新加載 Nginx

```bash
# 如果 Nginx 未運行：
nginx

# 如果 Nginx 已運行：
nginx -s reload
```

## 使用示例

### 1. 獲取 API Key

首先，從 API Key Manager 獲取一個有效的 API Key：

```bash
# 查看所有可用的 API Key
curl http://localhost:3000/api/keys
```

### 2. 測試無認證請求（應失敗）

```bash
# 不提供 Authorization 頭
curl http://localhost:81/api/tags

# 預期結果：401 Unauthorized 或 403 Forbidden
# "Authorization required"
```

### 3. 使用 API Key 進行請求（應成功）

```bash
# 設置 API Key 變量
API_KEY="sk-d6ved24isinrd2g43wbyvd93arqk4cnx"  # 用實際的 key 替換

# 列表模型
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:81/api/tags

# 預期結果：200 OK + JSON 模型列表
```

### 4. 常見的 Ollama API 調用

#### 聊天完成

```bash
curl -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "messages": [{"role": "user", "content": "你好！"}],
    "stream": false
  }' \
  http://localhost:81/api/chat
```

#### 文本生成

```bash
curl -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "prompt": "請介紹一下人工智能",
    "stream": false
  }' \
  http://localhost:81/api/generate
```

#### 生成嵌入向量

```bash
curl -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "input": "Hello, World!"
  }' \
  http://localhost:81/api/embeddings
```

#### 流式響應示例

```bash
# 啓用流式響應
curl -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "prompt": "講一個故事",
    "stream": true
  }' \
  http://localhost:81/api/generate
```

## 配置文件說明

### nginx-ollama-proxy.conf 的主要部分

#### 1. 上游服務器定義

```nginx
upstream ollama_backend {
    server localhost:11434;  # Ollama 服務器
    keepalive 32;            # 保活連接池
}

upstream auth_service {
    server localhost:3000;   # API Key Manager 服務器
    keepalive 32;
}
```

#### 2. 認證驗證

```nginx
# 內部認證端點
location /auth/ {
    internal;                           # 只允許內部請求
    proxy_pass http://auth_service/auth;  # 轉發到認證服務
    proxy_pass_request_body off;        # 不轉發請求體
    proxy_set_header Authorization $http_authorization;  # 傳遞 Authorization 頭
}
```

#### 3. API 路由

```nginx
# 所有 API 請求都需要認證
location /api/ {
    auth_request /auth/;                # 先驗證 API Key
    proxy_pass http://ollama_backend;   # 通過驗證後轉發到 Ollama
    
    # 流式響應配置
    proxy_buffering off;                # 禁用緩衝，實現實時流傳輸
    proxy_request_buffering off;
    
    # 超時配置（適合 LLM）
    proxy_connect_timeout 30s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}
```

#### 4. 無認證的健康檢查

```nginx
location /health {
    access_log off;                     # 不記錄健康檢查日誌
    proxy_pass http://ollama_backend/api/tags;
}
```

## 支持的端點

| 端點 | 認證 | 說明 |
|------|------|------|
| `/v1/models` | ✅ | 列表模型 (v1 API) |
| `/v1/chat/completions` | ✅ | 聊天完成 (OpenAI 兼容) |
| `/api/tags` | ✅ | 列表模型 |
| `/api/chat` | ✅ | 聊天完成 |
| `/api/generate` | ✅ | 文本生成 |
| `/api/embeddings` | ✅ | 嵌入向量 |
| `/api/show` | ✅ | 模型詳情 |
| `/health` | ❌ | 健康檢查 (無需認證) |

## 常見問題

### Q1: 如何修改代理的監聽端口？

**A:** 編輯 `nginx-ollama-proxy.conf`，修改以下行：

```nginx
server {
    listen 8080;  # 改為你想要的端口，例如 8080
    server_name localhost;
}
```

### Q2: 如何建立新的 API Key？

**A:** 使用 API Key Manager 的 POST 端點：

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"My New Key"}' \
  http://localhost:3000/api/keys
```

### Q3: 如何禁用/刪除 API Key？

**A:** 

禁用（保留記錄）：
```bash
curl -X PUT http://localhost:3000/api/keys/{key-id}/disable
```

刪除（永久移除）：
```bash
curl -X DELETE http://localhost:3000/api/keys/{key-id}
```

### Q4: 流式響應不工作怎麼辦？

**A:** 確保配置中有以下設置：

```nginx
proxy_buffering off;           # 禁用緩衝
proxy_request_buffering off;   # 禁用請求緩衝
```

這些已在 `nginx-ollama-proxy.conf` 中默認配置。

### Q5: 如何查看請求日誌？

**A:** 查看以下日誌文件：

```bash
# 所有請求日誌
tail -f logs/ollama_access.log

# 錯誤日誌
tail -f logs/ollama_error.log
```

## 故障排除

### 問題 1：連接被拒絕 (connection refused)

**症狀：** `curl: (7) Failed to connect to localhost:81`

**解決方案：**
```bash
# 檢查 Nginx 是否運行
nginx -s status

# 檢查配置是否正確
nginx -t

# 查看錯誤日誌
tail -f logs/ollama_error.log
```

### 問題 2：總是返回 401/403

**症狀：** 即使提供了 API Key 也被拒絕

**解決方案：**
```bash
# 驗證 API Key 格式（應以 "sk-" 開頭）
echo $API_KEY

# 確認 Key 存在且未被禁用
curl http://localhost:3000/api/keys | grep "$API_KEY"

# 測試認證服務是否運行
curl http://localhost:3000/auth -H "Authorization: Bearer $API_KEY"
```

### 問題 3：502 Bad Gateway

**症狀：** 請求返回 502 錯誤

**解決方案：**
```bash
# 檢查 Ollama 是否運行
curl http://localhost:11434/api/tags

# 檢查認證服務是否運行
curl http://localhost:3000/api/keys

# 查看 Nginx 錯誤日誌
tail -f logs/ollama_error.log
```

### 問題 4：流式響應斷開

**症狀：** 流式請求中途中斷

**解決方案：**
1. 檢查 `proxy_buffering off;` 配置是否存在
2. 檢查超時設置是否足夠長
3. 查看錯誤日誌中是否有超時信息

## 測試驗證

### 快速驗證

運行以下命令驗證安裝是否成功：

```bash
# 1. 檢查 Nginx 是否監聽 81 端口
netstat -an | grep 81

# 2. 測試無認證請求（應失敗）
curl -i http://localhost:81/api/tags | head -1

# 3. 測試有認證請求（應成功）
API_KEY="sk-xxx"
curl -i -H "Authorization: Bearer $API_KEY" \
  http://localhost:81/api/tags | head -1
```

### 完整測試

使用提供的測試工具：

```bash
# Windows 用戶
.\setup-nginx.ps1 -Command test

# Linux/Mac 用戶
node test-nginx-proxy.js
```

## 性能配置

### 連接池設置

```nginx
upstream ollama_backend {
    server localhost:11434;
    keepalive 32;  # 增加此值以支持更多並發
}
```

### 緩衝配置

```nginx
proxy_buffer_size 128k;      # 單個緩衝大小
proxy_buffers 4 256k;        # 4 個 256KB 的緩衝
client_max_body_size 100M;   # 最大客戶端請求大小
```

### 超時配置

```nginx
proxy_connect_timeout 30s;   # 連接超時
proxy_send_timeout 300s;     # 發送超時（5 分鐘）
proxy_read_timeout 300s;     # 讀取超時（5 分鐘）
```

適合 LLM 推理任務，因為模型生成可能需要較長時間。

## Python 集成示例

```python
import requests

# 配置
API_KEY = "sk-your-api-key-here"
BASE_URL = "http://localhost:81"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

# 例 1：列表模型
response = requests.get(f"{BASE_URL}/api/tags", headers=HEADERS)
models = response.json()
print(models)

# 例 2：聊天
response = requests.post(
    f"{BASE_URL}/api/chat",
    headers=HEADERS,
    json={
        "model": "mistral",
        "messages": [{"role": "user", "content": "你好！"}],
        "stream": False
    }
)
print(response.json())

# 例 3：流式生成
response = requests.post(
    f"{BASE_URL}/api/generate",
    headers=HEADERS,
    json={
        "model": "mistral",
        "prompt": "講個故事",
        "stream": True
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
```

## Node.js 集成示例

```javascript
const API_KEY = "sk-your-api-key-here";
const BASE_URL = "http://localhost:81";

// 例 1：列表模型
fetch(`${BASE_URL}/api/tags`, {
    headers: { "Authorization": `Bearer ${API_KEY}` }
})
.then(r => r.json())
.then(data => console.log(data));

// 例 2：聊天
fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        model: "mistral",
        messages: [{ role: "user", content: "你好！" }],
        stream: false
    })
})
.then(r => r.json())
.then(data => console.log(data));
```

## 安全建議

1. **使用 HTTPS：** 在生產環境中，添加 SSL/TLS 加密
2. **限制訪問：** 使用防火牆或 IP 白名單限制訪問
3. **速率限制：** 配置 Nginx 速率限制防止濫用
4. **監控日誌：** 定期檢查訪問日誌和錯誤日誌
5. **定期輪換密鑰：** 定期更新和禁用舊的 API Key

## 後續配置

### 添加 HTTPS

在 `nginx-ollama-proxy.conf` 中修改：

```nginx
server {
    listen 443 ssl http2;  # 改為 443 並啓用 SSL
    ssl_certificate /path/to/cert.crt;
    ssl_certificate_key /path/to/key.key;
    # ... 其他配置
}
```

### 添加速率限制

```nginx
limit_req_zone $remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    # ... 其他配置
}
```

### 添加訪問控制

```nginx
location /api/ {
    allow 192.168.1.0/24;  # 允許內網
    allow 127.0.0.1;       # 允許本地
    deny all;              # 拒絕其他
    # ... 其他配置
}
```

## 相關文件

- `nginx-ollama-proxy.conf` - 完整的 Nginx 配置文件
- `NGINX_QUICKSTART.md` - 快速開始指南
- `NGINX_SETUP.md` - 詳細配置指南
- `ARCHITECTURE.md` - 系統架構圖

## 總結

通過使用 Nginx 反向代理和 API Key 認證機制，你可以：

✅ 保護 Ollama API 的訪問  
✅ 控制誰可以使用 API  
✅ 追蹤和監控 API 使用情況  
✅ 實現細粒度的訪問控制  
✅ 提高系統的安全性和可靠性  

---

**文檔版本**: 1.0  
**最後更新**: 2024  
**維護者**: Copilot API Key Manager 系統
