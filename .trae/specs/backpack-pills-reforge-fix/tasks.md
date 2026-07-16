# Tasks

- [ ] Task 1: 在 player store 中建立丹药持有与生效数据结构
  - [ ] SubTask 1.1: 在 `player.js` 中添加 `ownedPills`（Map: pillId → {count, craftedAt}）和 `activePillBuffs` 数组
  - [ ] SubTask 1.2: 在 `player.js` 中添加 `consumePill(pillId, memberId)` 方法，区分全队 buff 与角色专属 buff
  - [ ] SubTask 1.3: 在 `player.js` 中添加定时清理过期 buff 的逻辑（或在 useIdleSystem 中每 tick 检查）

- [ ] Task 2: 在背包页新增丹药子菜单
  - [ ] SubTask 2.1: 读取 `src/views/Inventory.vue`，定位现有子菜单切换结构（装备/素材）
  - [ ] SubTask 2.2: 添加「丹药」标签页，渲染 `ownedPills` 中的丹药卡片列表
  - [ ] SubTask 2.3: 每张卡片显示丹药名称、品阶标签、效果简述、持有数量

- [ ] Task 3: 实现丹药服用弹窗与角色选择
  - [ ] SubTask 3.1: 创建丹药服用弹窗组件（或在 Inventory.vue 内实现），点击丹药后弹出
  - [ ] SubTask 3.2: 弹窗中只列出 `getTeamMembersDetail()` 中已出战的角色
  - [ ] SubTask 3.3: 服用后调用 `consumePill`，数量减 1，弹出数值变化提示（n-message），若数量为 0 则移除卡片

- [ ] Task 4: 丹药 buff 实装到挂机系统
  - [ ] SubTask 4.1: 在 `useIdleSystem.js` 的奖励计算（`grantReward` / 灵石/修为获取处）读取 `activePillBuffs`
  - [ ] SubTask 4.2: 灵石获取加成类 buff 真实作用于 `s.spiritStones += multiplied * (1 + spiritStoneRate)`
  - [ ] SubTask 4.3: 在挂机仪表盘 UI 中（ZoneSelector 或 IdlePanel）添加正向 buff 列表显示当前生效的丹药 buff
  - [ ] SubTask 4.4: buff 过期后自动从列表和计算中移除

- [ ] Task 5: 彻底修复单条洗练残留 bug
  - [ ] SubTask 5.1: 读取 `src/plugins/equipment.js` 的 `reforgeEquipment` 中 `targetStat !== null` 分支
  - [ ] SubTask 5.2: 确认单条洗练时只修改目标词条，不触碰基础属性
  - [ ] SubTask 5.3: 修复百分比词条在单条洗练时可能产生 0 值的逻辑（检查 `getRandomValueInRange` 和 clamp 顺序）
  - [ ] SubTask 5.4: 在补充词条循环（while Object.keys... < maxAffixes）中也加入百分比最小值保护

- [ ] Task 6: 构建验证并推送 main
  - [ ] SubTask 6.1: 运行 `npm run build`
  - [ ] SubTask 6.2: 提交并 `git push`

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1]
- [Task 3] depends on [Task 2]
