# 修仙游戏独立编辑器

这是一个独立的开发工具，用于编辑《Vue Idle 修仙》游戏的所有数据文件，并直接将修改同步到游戏源代码中，支持一键提交到GitHub。

## 特性

- **直接编辑源代码** - 修改即保存到 `src/plugins/` 下的游戏数据文件
- **批量更新** - 同时保存多个文件的修改
- **可视化编辑** - 对数组数据提供表单式编辑界面
- **素材管理** - 上传图片/音频素材到游戏项目
- **GitHub集成** - 一键提交并推送到GitHub仓库
- **数据备份** - 导出/导入所有游戏数据为JSON备份

## 启动方式

### 1. 启动后端服务

```bash
cd tools/server
pnpm install   # 首次使用
pnpm start     # 启动服务（端口3456）
```

### 2. 打开编辑器

用浏览器直接打开 `tools/editor/index.html`：

```bash
# 方式一：直接打开文件
open tools/editor/index.html

# 方式二：用简单的HTTP服务器打开（推荐）
cd tools/editor
python3 -m http.server 3457
# 然后访问 http://localhost:3457
```

## 使用流程

1. **编辑数据** - 在左侧选择要编辑的JS文件，在代码编辑器中修改
2. **可视化编辑** - 切换到"可视化编辑"Tab，用表单方式编辑数组数据
3. **保存修改** - 点击"保存当前文件"或"保存所有修改"
4. **提交GitHub** - 点击左下角"提交并推送"，输入提交信息

## API接口

后端提供以下REST API：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/files | 列出所有数据文件 |
| GET | /api/file/:name | 读取文件内容 |
| POST | /api/file/:name | 保存文件内容 |
| POST | /api/files/batch | 批量保存多个文件 |
| POST | /api/upload | 上传素材文件 |
| GET | /api/assets/:type | 获取素材列表 |
| GET | /api/git/status | 查看Git状态 |
| POST | /api/git/commit | 提交并推送 |
| GET | /api/export | 导出所有数据 |
| POST | /api/import | 导入数据 |

## 目录结构

```
tools/
  README.md           # 本文件
  editor/
    index.html        # 编辑器前端（独立HTML应用）
  server/
    package.json      # 后端依赖
    index.js          # Express服务端
```

## 注意事项

- 编辑器直接修改 `src/plugins/` 下的文件，保存后立即生效
- 提交GitHub前请确保已配置git用户信息和远程仓库
- 建议定期使用"导出备份"功能保存数据快照
