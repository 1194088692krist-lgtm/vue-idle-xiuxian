# GMTOOLS 后端代理（轻量 Node + Express）

## 作用

GMTOOLS 页面里上传立绘/素材时，前端把文件 POST 到本后端，后端再用
**GitHub Contents API** 写入仓库 `public/portraits/<filename>` 并提交（或推
到分支让你 review）。前端永远不接触 GitHub PAT。

## 关键安全设计

- **GitHub PAT 绝不下发到浏览器**。它仅存在于：
  - `server/.env` （`GITHUB_TOKEN=...`，被 dotenv 加载到环境变量）
  - 服务器进程内存
- 前端只调用 `http://localhost:8787/api/upload` 等普通接口
- 即使别人打开了游戏页面，也拿不到你的 token
- 后端对上传做了基础白名单校验：仅允许 png/jpg/webp
- 任意来源 CORS 默认开启（仅开发用），生产请配置 `ALLOWED_ORIGIN`

## 启动

```bash
cd server
cp .env.example .env       # 填入 GITHUB_TOKEN / GITHUB_REPO
npm install
npm start
# 默认监听 0.0.0.0:8787
```

`.env` 示例：

```ini
GITHUB_TOKEN=ghp_xxx...               # 必填，Contents API 写入权限
GITHUB_REPO=owner/repo                # 必填，仓库
GITHUB_BRANCH=main                    # 默认 main
PORT=8787
ALLOWED_ORIGIN=*                      # 生产请填你的域名
```

## 接口

| 方法 | 路径 | 用途 |
|---|---|---|
| GET  | `/api/health`           | 健康检查 |
| POST | `/api/upload`           | 上传立绘，body 用 multipart/form-data 提交 `file` + `path`（可选，相对 public/） |
| POST | `/api/commit-text`      | 提交文本文件（如 character_list.json、guideContent 等），body: `{ path, content, message }` |
| GET  | `/api/list?path=...`    | 列出指定路径下的文件 |

## 写入策略

- 默认在 `GITHUB_BRANCH`（main）直接 commit
- 如需先 PR review，把 `GITHUB_BRANCH` 设为 `gm-portraits` 等专用分支，前端
  通过 GitHub PR 合并

## 前端调用

GMTOOLS 的 `uploadPortrait()` / `uploadCharacterList()` 直接调后端：

```js
const r = await fetch('http://localhost:8787/api/upload', {
  method: 'POST',
  body: formData  // file 字段
})
```

无需 GitHub PAT、无需安装 octokit，浏览器仅发送普通 multipart 请求。
