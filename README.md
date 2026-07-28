# 《修仙挂机录》· 凡人修仙（放置修仙）

> **当前版本：2.0.0 · 太初归元（2026-07-24）** — 一款基于 Vue 3 的放置（idle）修仙游戏：自动/离线修炼、装备 Build、灵宠、挂机探索、抽卡、丹药、战斗与灵石阁补缺枢纽一应俱全。

[![version](https://img.shields.io/badge/version-2.0.0%20·%20太初归元-blue.svg)](./package.json)
[![license](https://img.shields.io/badge/license-see%20LICENSE-green.svg)](./LICENSE)
[![deploy](https://img.shields.io/badge/deploy-GitHub%20Pages%20%7C%20Vercel%20%7C%20Cloudflare%20Pages-9cf.svg)]()

---

## ✨ 游戏特色（2.0.0 太初归元）

- **放置核心循环**：自动修炼 / 离线修炼被动累积修为，屏幕关闭或切后台也稳定结算（已修复息屏挂机失败率过高的问题）。
- **境界与突破**：126 层 / 14 大境 × 9 重，每次突破让修炼速率 **×1.2 复利**叠加，越后期修为积累越快。
- **装备 Build 体系**：13 个装备槽（含法宝），品质（凡→神）× 词条 × 套装 × 强化共同决定 Build 强度，并作为挂机「推荐 Build 匹配度」的判定基准。
- **双洗练体系（2.0.0 拆分）**：
  - **小洗炼（洗练石）**：温和微调全部词缀数值（保留 60% 旧值 + 40% 新 roll），不改变词条种类 / 档位，日常低风险调优。
  - **大洗练（八卦炉 · 高级洗炼石 + BOSS 素材）**：可改变词条种类、冲击高数值、补满词条，是定向重塑极品 / 神品的强力手段（定灵丹 = 大洗练保底）。
  - 配套工艺货币：锁灵符（锁定词条）、重铸灵砂（清空重生成）、点化石（重 roll 数值）。
- **灵宠系统**：出战提供全属性加成，支持升级、升星、放生报恩；卸下正确归还背包。
- **八大秘境 × 五档难度**挂机探索，每 15 秒一场遭遇，含随机小剧场增益 / 减益。
- **抽卡 / 丹药炼制 / 回合制战斗**：概率奖池、按品阶炼丹（永久属性丹随存档沉淀）、含暴击 / 连击 / 吸血 / 增伤减伤的完整战斗公式。
- **灵石阁补缺枢纽**：求材 / 点化兑币 / 开纹 / 觅宝·悬赏 / 易物 / 黑市，定位为「补缺」而非回笼通胀。
- **转生渡劫**：50 级可转生，永久叠加攻 / 血 / 防 / 速与效率加成。
- **背包素材视图补全**：高级洗炼石、工艺货币、灵纹、幻灵结晶、灵宠碎片等虚拟资源现在在背包中可见。

> 完整、数据驱动的玩法攻略见仓库根目录 [`GUIDE.md`](./GUIDE.md)（即游戏内「攻略」页内容，由 `scripts/gen_guide.py` 自动渲染到 `src/plugins/guideContent.js`）。

---

## 🛠 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Vue 3.5 + Vue Router 4 + Pinia 3（状态管理） |
| UI | Naive UI + @ant-design/icons-vue + @vicons |
| 构建 | Vite 6（pnpm 9，Node ≥ 18） |
| 移动端 | Capacitor 8（Android） |
| 存档安全 | crypto-js（本地存档加密）+ file-saver |
| 测试 | Vitest 4 |
| 部署 | GitHub Pages / Vercel / Cloudflare Pages（含 `functions/` serverless 存档接口） |

---

## 🚀 快速开始

```bash
# 安装依赖（推荐 pnpm）
pnpm install

# 本地开发（默认 http://localhost:2025 自动打开）
pnpm dev

# 生产构建
pnpm build

# 运行单元测试
pnpm test

# 重新生成游戏内攻略（编辑 GUIDE.md 后务必执行）
pnpm gen:guide
```

> 编辑 `GUIDE.md`（游戏内攻略源文件）后，请运行 `pnpm gen:guide` 重新生成 `src/plugins/guideContent.js`，否则游戏内攻略不会更新。

### 移动端（Android）

```bash
pnpm cap:build      # 构建 Web + 同步到 Capacitor Android 工程并打开
pnpm cap:open       # 仅打开原生工程
```

---

## 📁 目录结构（要点）

```
src/
  plugins/      # 游戏数据与系统：realm/cultivation/equipment/shopConfig/
                #   pets/materials/pills/combat/runes/guideContent …（含全部数值与文案）
  stores/       # Pinia：player（存档/状态）、auth、db
  views/        # 页面：Home/Cultivation/Inventory/Guide/Gacha/Alchemy/
                #   Dungeon/Exploration/Settings/StartScreen/GM …
  components/   # 复用组件：背包、战斗舞台、属性面板等
  composables/  # 挂机 / 战斗 / 资产管理逻辑
  workers/      # 修炼 / 装备 / 探索 / 日志 Web Worker
functions/      # serverless：登录 / 存档 / 礼包（GM）
scripts/        # 资源清单生成、攻略生成（gen_guide.py）
public/         # 静态资源：立绘、怪物、秘境背景、PWA 配置
GUIDE.md        # 游戏内攻略源文件（数据驱动手册）
README.md       # 本文件
```

---

## 📝 近期更新（2.0.0 太初归元）

- **核心重构**：移除灵力、打坐等过时概念，修炼回归「修为 → 突破（×1.2 复利）」主循环；开始页显示大版本号 + 版本名。
- **洗练拆分为双体系**：小洗炼（洗练石·温和微调）/ 大洗练（八卦炉·高级洗炼石 + BOSS 素材·重塑词条）。
- **灵石阁补缺枢纽**落地：求材 / 点化兑币 / 开纹 / 觅宝·悬赏 / 易物 / 黑市。
- **背包素材视图补全**：虚拟资源（高级洗炼石 / 工艺货币 / 灵纹 / 幻灵结晶 / 灵宠碎片）可见。
- **灵宠修复**：卸下归还背包、一键卸下兼容灵宠。
- **息屏挂机修复**：解决屏幕关闭 / 后台时挂机失败率过高的问题。
- **稳定性与易用性**：修为分配小数经验修复、刷新丢档修复；数量选择「一键拉满」；炼丹丹方筛选。

更细的数值与玩法细节，见 [`GUIDE.md`](./GUIDE.md)。

---

## 📄 许可证

见仓库 [`LICENSE`](./LICENSE) 文件。
