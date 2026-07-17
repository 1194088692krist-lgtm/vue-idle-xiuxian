# 紧急回滚指南

## 概述

本文档描述了在推送新版本后出现恶性 bug 时的回滚流程。

---

## 第一层：Git Tag 回滚（推荐）

### 自动回滚脚本

```bash
# 回滚到上一个稳定版本（默认 v1.5.0-stable）
./scripts/rollback.sh

# 回滚到指定版本
./scripts/rollback.sh v1.4.0-stable
./scripts/rollback.sh e6649cb
```

### 手动回滚步骤

```bash
# 1. 查看所有稳定 tag
git tag -l 'v*-stable'

# 2. 切换到目标版本
git checkout v1.5.0-stable

# 3. 重新安装依赖
npm install

# 4. 重新构建
npm run build

# 5. 强制推送（会覆盖远程历史）
git push --force-with-lease origin main
```

---

## 第二层：Cloudflare Pages 回滚

如果 Git 回滚后 Cloudflare 构建仍有问题：

### 方法 A：Cloudflare Dashboard 手动回滚

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Workers & Pages → 你的项目
3. 点击 **View details** → **Deployments**
4. 找到上一个成功的部署 → 点击 **...** → **Rollback to this deployment**
5. 确认回滚

### 方法 B：禁用自动部署，手动上传

```bash
# 1. 在 Cloudflare Dashboard 禁用 Git 触发自动部署
# Settings → Builds & deployments → Disable auto deployments

# 2. 本地回滚并构建
git checkout v1.5.0-stable
npm run build

# 3. 使用 wrangler 直接上传
npx wrangler pages deploy docs --project-name=你的项目名
```

---

## 第三层：本地存档保护

玩家存档保存在浏览器 localStorage，不受远程代码回滚影响。但如果新版本存档结构变更导致损坏：

### 存档自动备份机制

游戏每次保存时会自动备份最近 5 个存档：

```javascript
// localStorage key: xiuxian_save_slot_1_backup_0 ~ _backup_4
```

### 手动导出存档

玩家可在 **设置页面** 点击 **导出存档** 按钮，下载 JSON 文件备份。

---

## 推送前安全检查清单

```bash
# 1. 本地构建确认无错误
npm run build

# 2. Dev server 启动确认
npm run dev
# 手动测试核心流程：
#   - 登录/注册
#   - 新游戏/读档
#   - 挂机探索（战斗、结算）
#   - 装备穿戴/强化/洗练
#   - 角色突破/升级
#   - 抽卡/炼丹

# 3. 创建稳定 tag（推送前）
git tag -a v1.5.1-stable -m "稳定版本：XXX功能"
git push origin v1.5.1-stable

# 4. 推送代码
git push origin main

# 5. 观察 Cloudflare 构建日志
# 如构建失败，立即查看错误并修复
```

---

## 常见问题与解决方案

### Q1: 推送后游戏无法加载

```bash
# 检查控制台错误（F12）
# 常见原因：
#   - import 路径错误
#   - 组件未注册
#   - 变量未定义

# 快速回滚：
./scripts/rollback.sh
git push --force-with-lease origin main
```

### Q2: 挂机战斗卡死

```bash
# 检查 useIdleSystem.js 是否有 try/catch 保护
# 检查 roundDetails 是否为空数组

# 临时禁用战斗回放：
# 在 ZoneSelector.vue 注释掉 <BattleStage ...> 行
git add -A && git commit -m "temp: disable battle playback"
git push origin main
```

### Q3: 存档损坏

```bash
# 检查 playerStore.initializePlayer() 的空值保护
# 检查 recomputeAttributes() 是否有 try/catch

# 玩家可在设置页点击 "重置游戏" 清空存档
```

---

## 联系方式

- 问题反馈：请在项目 issue 中提交
- 紧急修复：回滚后立即定位根因，修复后打新的 stable tag

---

**稳定版本列表**

| Tag | Commit | 说明 |
|-----|--------|------|
| v1.5.0-stable | e6649cb | 开发者通道、头像立绘视频加载优化 |
| v1.4.0-stable | 86135c6 | 头像和视频加载修复 |
| v1.3.0-stable | 4db39b0 | 超时回退机制 |

---

最后更新：2025-01-18