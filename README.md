# API Key 管理系统

一个轻量级 API Key 管理应用，基于 Node.js 原生 HTTP 模块构建，使用原生 HTML、CSS 和 JavaScript 实现 Web 界面。提供用户账号、用户独立的 API Key、管理员控制功能，以及供 Nginx 等反向代理使用的 Bearer Token 校验接口。

## 功能

- 登录会话与密码修改，支持首次登录及密码重设后的强制改密。
- 每个用户可创建、查看、复制、启用、禁用和删除自己的 API Key。
- 批量启用、禁用和删除 API Key。
- 超级管理员可创建、编辑、重设密码、启用、禁用和删除用户。
- 管理员操作采用模态弹窗，支持弹窗内错误提示和防重复提交。
- 使用共享设计令牌的响应式页面。
- 使用 JSON 文件持久化，无需数据库或第三方运行时依赖。

## 快速开始

建议使用仍受支持的 Node.js LTS 版本及 npm。项目声明的 Node.js 要求为 `>=12.0.0`；开发监听模式需要支持 `--watch` 的较新 Node.js 版本。

在项目目录中执行：

```powershell
npm start
```

无需安装第三方依赖。启动服务后访问 [http://localhost:3000/login.html](http://localhost:3000/login.html)，请勿直接打开 HTML 文件。

初始化新的用户存储时，应用会创建初始超级管理员账号：

- 用户名：`admin`
- 初始密码：`admin123`

**请立即修改此密码。** 首次登录必须设置新密码，之后才能访问管理页面和操作 API Key。密码长度必须为 8-256 个字符。

开发期间可使用自动重启模式：

```powershell
npm run dev
```

## 使用说明

| 页面 | 用途 |
| --- | --- |
| `/login.html` | 登录。 |
| `/` | 管理自己的 API Key。 |
| `/admin.html` | 用户管理，仅超级管理员可访问。 |
| `/change-password.html` | 修改密码。 |

系统不开放自助注册。普通用户由超级管理员创建，首次登录时必须修改初始密码。

普通修改密码时，可选择**取消并返回首页**，不会保存输入。强制改密或保存请求进行中时，该入口会隐藏。

禁用用户会使其登录会话失效，并阻止其 API Key 通过校验。删除用户会同时删除该用户拥有的所有 API Key。超级管理员不能被禁用或删除。

更多说明请参阅[登录与用户管理](AUTHENTICATION.md)。

## 配置与存储

| 环境变量 | 默认值 | 用途 |
| --- | --- | --- |
| `PORT` | `3000` | HTTP 监听端口。 |
| `USER_STORAGE_FILE` | 项目目录下的 `data/users.json` | 用户记录和密码哈希。 |
| `API_KEY_STORAGE_FILE` | 项目目录下的 `data/api-keys.json` | API Key 及其元数据。 |

例如，在 PowerShell 中使用其他端口：

```powershell
$env:PORT = "3001"
npm start
```

存储目录和文件会按需创建。启动时，已有的无所有者 API Key 会分配给超级管理员。

密码使用加盐的 `scrypt` 哈希保存。**API Key 的值以明文存储**，因此应限制对数据文件及其备份的访问。会话保存在内存中，有效期为八小时；服务重启后用户需要重新登录。

JSON 存储不支持多个应用进程同时写入相同文件。请使用单个应用实例，并提供可写的持久化存储。

## HTTP API

管理接口使用登录会话 Cookie，而不是 API Key。登录时会设置带有 HttpOnly 和 SameSite=Lax 属性的 Cookie。发送 JSON 请求体时，请设置 `Content-Type: application/json`。

### 身份认证

| 方法 | 接口 | 用途 |
| --- | --- | --- |
| `POST` | `/api/auth/login` | 使用 `username` 和 `password` 登录。 |
| `POST` | `/api/auth/logout` | 结束当前会话。 |
| `GET` | `/api/auth/me` | 获取当前用户。 |
| `POST` | `/api/auth/change-password` | 提交 `currentPassword` 和 `newPassword`；强制改密时可省略当前密码。 |

### API Key

这些接口要求用户已登录并完成任何强制改密要求。用户只能操作自己的 API Key。

| 方法 | 接口 | 用途 |
| --- | --- | --- |
| `GET` | `/api/keys` | 获取 API Key 列表。 |
| `POST` | `/api/keys` | 创建 API Key，可选填 `name`。 |
| `DELETE` | `/api/keys/:id` | 删除 API Key。 |
| `PUT` | `/api/keys/:id/enable` | 启用 API Key。 |
| `PUT` | `/api/keys/:id/disable` | 禁用 API Key。 |
| `POST` | `/api/keys/batch/enable` | 使用 `ids` 数组批量启用 API Key。 |
| `POST` | `/api/keys/batch/disable` | 使用 `ids` 数组批量禁用 API Key。 |
| `POST` | `/api/keys/batch/delete` | 使用 `ids` 数组批量删除 API Key。 |

### 用户

这些接口要求使用超级管理员的登录会话。

| 方法 | 接口 | 用途 |
| --- | --- | --- |
| `GET` | `/api/users` | 获取用户列表。 |
| `POST` | `/api/users` | 使用 `username` 和 `password` 创建用户。 |
| `PUT` | `/api/users/:id` | 修改用户名或重设密码。 |
| `PUT` | `/api/users/:id/enable` | 启用用户。 |
| `PUT` | `/api/users/:id/disable` | 禁用用户。 |
| `DELETE` | `/api/users/:id` | 删除用户及其 API Key。 |

### Bearer Token 校验

`GET /auth` 校验 `Authorization: Bearer <API_KEY>`，无需登录会话：

```powershell
curl.exe -i "http://localhost:3000/auth" -H "Authorization: Bearer <API_KEY>"
```

请将 `<API_KEY>` 替换为通过管理界面创建的 API Key。

- `200`：API Key 已启用，且其所有者处于启用状态。
- `401`：缺少 Bearer 授权头或格式错误。
- `403`：API Key 无效、已禁用，或其所有者未处于启用状态。

此接口仅校验访问权限，不会将请求转发给 LLM。应用的 `/llm` 路由是受登录会话保护的占位接口，并非 Ollama 代理。

## 部署

生产环境请使用 HTTPS，限制对管理界面的访问，并安全备份两个 JSON 数据文件。请勿将仍使用初始密码、尚未完成初始化的实例暴露到外部。

Nginx/Ollama 集成示例请参阅 [Nginx 指南](nginx-ollama/NGINX_README.md)和[代理配置](nginx-ollama/nginx-ollama-proxy.conf)。使用前请检查示例，并根据实际环境调整端口、路径和上游服务地址。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| [app.js](app.js) | 应用入口、身份认证和 HTTP 路由。 |
| [server.js](server.js) | HTTP 服务器、动态路由匹配和静态文件服务。 |
| [userManager.js](userManager.js) | 用户管理、密码哈希和内存会话。 |
| [apiKeyManager.js](apiKeyManager.js) | API Key 所有权、校验和持久化。 |
| [public/](public/) | 浏览器页面、共享样式和品牌资源。 |
| `data/` | 自动生成的用户和 API Key 数据文件。 |
| [DESIGN.md](DESIGN.md) | 设计系统参考文档。 |
| [nginx-ollama/](nginx-ollama/) | 反向代理配置示例与指南。 |

## 测试

运行认证与用户隔离测试：

```powershell
npm test
```

[test-auth.js](test-auth.js) 覆盖初始管理员创建、登录与密码修改、超长密码输入、用户及 API Key 所有权隔离、禁用用户后的会话失效与 Key 校验、管理员保护、旧 Key 所有权迁移、路由参数匹配和静态文件路径保护。

测试使用独立临时目录，并在结束后清理，不会修改实际的用户和 API Key 数据。
