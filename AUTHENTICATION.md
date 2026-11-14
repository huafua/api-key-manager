# 登录、用户与 API Key

## 首次登录

启动服务：

```bash
npm start
```

打开 `http://localhost:3000/login.html`。首次启动会创建超级管理员：

- 用户名：`admin`
- 初始密码：`admin123`

首次登录必须修改密码；密码至少 8 位。该账号只能用于首次设置，请勿继续使用默认密码。

普通修改密码时可选择「取消并返回首页」，不会保存输入。首次登录或管理员重设密码后必须完成改密，此时不显示取消入口；保存请求进行中也暂时隐藏取消入口。

## 用户管理

超级管理员登录后，在 API Key 页面选择「用户管理」，或打开 `/admin.html`。

管理员可以创建、查询、修改用户名、重设密码、禁用／启用和删除普通用户。新建或重设密码后，该用户下次登录必须修改密码。超级管理员账号不能被禁用或删除。

删除用户会同时删除该用户拥有的 API Key。禁用用户会立即使其登录会话失效，并阻止其 API Key 通过 `/auth` 校验。

管理页的新增、修改、启用／禁用、删除及退出登录均使用页面内模态弹窗。可通过取消、关闭按钮、点击遮罩或 Esc 关闭；提交期间禁止重复提交和关闭，失败信息显示在弹窗内，保留输入以便重试。删除操作使用红色确认按钮。

系统不开放自助注册；新用户由超级管理员创建。

## 用户自己的 API Key

用户登录后进入 API Key 管理页面，可创建、查看、复制、禁用／启用和删除自己的 Key。服务端会按登录用户过滤并检查所有权，不能通过更改 URL 中的 Key ID 管理其他用户的 Key。

已有的无所有者 API Key 会在首次启动新版服务时迁移给超级管理员。新安装不会再生成共享的默认 API Key；用户可登录后创建自己的 Key。

## API 与会话

浏览器管理界面使用 HttpOnly、SameSite=Lax 的会话 Cookie。会话有效期为 8 小时，储存在服务进程内存中；服务重启后需要重新登录。

用户和密码哈希保存在 `data/users.json`；API Key 保存在 `data/api-keys.json`。密码使用每用户独立盐值和 Node.js `scrypt` 哈希保存，不会以明文写入文件。这两个数据文件已加入 `.gitignore`。

可通过 `PORT` 指定监听端口，并通过 `USER_STORAGE_FILE` 和 `API_KEY_STORAGE_FILE` 分别指定用户数据与 API Key 数据文件路径；未设置时使用上述 `data` 目录中的默认文件。

- `POST /api/auth/login`：登录并建立会话
- `POST /api/auth/logout`：退出登录
- `GET /api/auth/me`：获取当前用户
- `POST /api/auth/change-password`：修改密码
- `/api/keys`：当前用户自己的 Key 管理接口，需要登录会话
- `/api/users`：用户管理接口，仅超级管理员可用
- `GET /auth`：供 Nginx `auth_request` 使用，通过 `Authorization: Bearer <API_KEY>` 校验 Key

生产环境请通过 HTTPS 访问管理界面，并妥善备份及保护 `data` 目录。
