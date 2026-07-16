# Tasks

- [x] Task 1: 彻底修复洗练生成 0 值词条
  - [x] SubTask 1.1: 在 `equipment.js` 的 `getRandomValueInRange` 中，当 range 无效时不再返回 0，而是返回品质基础下限的 50%（百分比）或 1（固定值）
  - [x] SubTask 1.2: 在 `reforgeEquipment` 入口，对 `equipment.stats` 执行预处理：删除所有值为 0 / null / undefined / NaN 且不在 BASE_STATS 中的属性
  - [x] SubTask 1.3: 在单条洗练循环中，若 `currentStat` 不在 `availableStats` 中，直接跳过而非尝试生成新值
  - [x] SubTask 1.4: 在全洗练补充词条循环中，对新生成的百分比词条增加 `Math.max(baseRange[0] * 0.5, value)` 保护，确保 `> 0`

- [x] Task 2: 背包丹药增加数量选择
  - [x] SubTask 2.1: 在 `Inventory.vue` 的丹药服用弹窗中，增加 `n-input-number` 数量输入框，绑定 `pillConsumeCount`，默认 1，最小 1，最大为选中丹药库存量
  - [x] SubTask 2.2: 调整 `consumePillForMember` 逻辑：根据输入数量循环服用，汇总所有成功/失败结果，使用 `n-message` 一次性提示

- [x] Task 3: 统一背包分页按钮
  - [x] SubTask 3.1: 检查素材、装备、丹药三个标签页的分页变量与分页按钮是否成对存在且绑定正确
  - [x] SubTask 3.2: 丹药页分页联动正确，无需补齐
  - [x] SubTask 3.3: 统一分页按钮样式，确保边界条件正确禁用

- [x] Task 4: 桌面端装备弹窗进一步缩窄
  - [x] SubTask 4.1: 桌面端 `@media (min-width: 769px)` 改为 `width: 45vw; max-width: 480px; height: 75vh; max-height: 75vh;`

- [x] Task 5: 日间模式背包页配色修复
  - [x] SubTask 5.1: 读取 `Cultivation.vue` 的日间模式配色方案作为参考
  - [x] SubTask 5.2: 补充遗漏元素的亮色字体样式（empty-state, pagination-info, modal 文字等）
  - [x] SubTask 5.3: 确保所有暗色底衬上的文字使用亮色

- [x] Task 6: 修复怪物血量显示与同步
  - [x] SubTask 6.1: 检查血量文本模板，确认无残留括号
  - [x] SubTask 6.2: `combat.js` 的 `executeTurn()` 返回 `playerCurrentHealth` 和 `enemyCurrentHealth`
  - [x] SubTask 6.3: `Dungeon.vue` 接收结果后显式更新 `enemy.currentHealth` 和 `player.currentHealth`
  - [x] SubTask 6.4: `dungeonState` 改为 `reactive()` 包裹，确保响应式

- [x] Task 7: 全面检视所有页面字体配色
  - [x] SubTask 7.1: 遍历所有 `.vue` 文件，标记暗底暗字问题
  - [x] SubTask 7.2: 修复 P0 问题：Cultivation.vue (3处 #666)、Settings.vue (1处 #666)、GMTools.vue (1处 #555)
  - [x] SubTask 7.3: 修复 P1 问题：GMTools.vue (3处 #8B8B8B)

- [x] Task 8: 构建验证并推送 main
  - [x] SubTask 8.1: 运行 `npm run build`，无编译错误
  - [ ] SubTask 8.2: 提交并 `git push origin main`

# Task Dependencies
- [Task 5] 依赖 [Task 3]
- [Task 7] 依赖 [Task 5]
- [Task 8] 依赖所有前置任务
