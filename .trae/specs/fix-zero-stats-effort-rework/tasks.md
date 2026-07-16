# Tasks

- [ ] Task 1: 装备词条生成与洗练零值保护
  - [ ] SubTask 1.1: 修改 `buildSystem.js` 的 `getAffixesForSlot`，生成词条时确保 percent 值 >0 且不低于 baseRange[0]*0.5，flat 值 ≥1
  - [ ] SubTask 1.2: 修改 `equipment.js` 的 `reforgeEquipment`，洗练计算新值时给 flat 词条增加 minFloor=1；最终写入前过滤所有 0/null/NaN 非基础属性
  - [ ] SubTask 1.3: 修改 `equipment.js` 的 `reforgeEquipment` 入口清理逻辑，对所有非 BASE_STATS 属性执行 0/NaN/null 清理（不限于 PERCENT_STATS）
  - [ ] SubTask 1.4: 在 `Inventory.vue` 装备属性展示区域，渲染 stats 时过滤值为 0/null/NaN 的词条（只展示有意义的属性）

- [ ] Task 2: 丹药 effortValue 机制重做
  - [ ] SubTask 2.1: 修改 `pills.js` 的 `pillRecipes`：为所有 `effortGain` 类型丹药增加 `extraStats` 字段，调整 effortValue 为 1~5，小培元丹具体为 `{ value: 1, extraStats: { health: 10 } }`
  - [ ] SubTask 2.2: 修改 `pills.js` 的 `calculatePillEffect`，透传 `extraStats` 到返回的 effect 对象
  - [ ] SubTask 2.3: 修改 `player.js` 的 `applyPillEffect`（effortGain 分支）：移除 effortValue 增加后自动提升 baseStats 的 0.5% 逻辑；增加 extraStats 处理，将属性直接写入 `member.baseStats` 和 `member.permanentBonuses`，并加入 changes 数组
  - [ ] SubTask 2.4: 修改 `Inventory.vue` 的 `getEffectDescription`，支持显示 effortGain 的 extraStats（如「努力值 +1，生命 +10」）
  - [ ] SubTask 2.5: 更新 `pills.js` 中培元丹系列的 description 文本，使其与实际效果一致

- [ ] Task 3: 缩小桌面端装备详情弹窗
  - [ ] SubTask 3.1: 修改 `Inventory.vue` 中 `.equipment-detail-modal .equipment-detail-content` 的桌面端尺寸，从 `60vw / max-width: 900px` 改为 `50vw / max-width: 720px`

- [ ] Task 4: 构建验证并推送 main
  - [ ] SubTask 4.1: 运行 `npm run build`
  - [ ] SubTask 4.2: 提交并 `git push`

# Task Dependencies
- [Task 2] 的内部 SubTask 2.1 → SubTask 2.2 → SubTask 2.3 → SubTask 2.4（顺序依赖）
- [Task 1] 与 [Task 2] 可并行
- [Task 3] 可与其他任务并行
- [Task 4] 依赖前面所有任务完成
