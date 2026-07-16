# Tasks

- [ ] Task 1: 背包页移除「丹方」标签，仅保留「丹药」
  - [ ] SubTask 1.1: 读取 Inventory.vue，定位并移除「丹方」标签及相关渲染代码
  - [ ] SubTask 1.2: 确保「丹药」标签正常显示 ownedPills

- [ ] Task 2: 丹药服用后显示数值变化提示
  - [ ] SubTask 2.1: 修改 player.js 的 consumePill，在成功服用后返回具体的数值变化信息
  - [ ] SubTask 2.2: 修改 Inventory.vue 的服用弹窗，调用 consumePill 后使用 n-message 显示具体变化（如「张小凡 努力值 +5」）

- [ ] Task 3: 八卦炉炼制成功提示 + 批量炼制
  - [ ] SubTask 3.1: 读取 Alchemy.vue，在 craftPill 成功后添加 n-message 提示「获得 X 丹药」
  - [ ] SubTask 3.2: 在炼丹详情页添加数量输入框（n-input-number，默认1，最小1）
  - [ ] SubTask 3.3: 批量炼制时一次性扣除 N 倍素材，产出 N 颗丹药，提示「获得 X 丹药 ×N」

- [ ] Task 4: 修复小培元丹 effortValue 不一致与未同步基础数据
  - [ ] SubTask 4.1: 检查 effectDescription 在 Alchemy.vue 与 Inventory.vue 中的计算逻辑是否一致
  - [ ] SubTask 4.2: 修复 consumePill 中 effortGain 处理：effortValue 增加后需要同步更新对应的 baseStats（如 attack/health 等）

- [ ] Task 5: 彻底修复单条洗练（图片所示 bug）
  - [ ] SubTask 5.1: 读取 equipment.js 的 reforgeEquipment，确认单条洗练选择列表的来源
  - [ ] SubTask 5.2: 确保洗练选择列表只显示 reforgeableStats 中的词条，过滤掉 BASE_STATS
  - [ ] SubTask 5.3: 在装备加载时（或 reforge 前）清理 stats 中的非法词条（vampireRate:0、spiritRate、cultivationRate 等不在 reforgeableStats 中的属性）
  - [ ] SubTask 5.4: 若装备没有任何可用词条，单条洗练按钮禁用或显示「无可用词条」

- [ ] Task 6: 桌面端装备弹窗缩小
  - [ ] SubTask 6.1: 查找桌面端装备详情弹窗组件（可能在 EquipmentDetailModal.vue 或 Inventory.vue 中）
  - [ ] SubTask 6.2: 将全屏弹窗改为小弹窗（类似人物详情弹窗尺寸，约 60vw/80vh 以内）

- [ ] Task 7: 构建验证并推送 main
  - [ ] SubTask 7.1: 运行 `npm run build`
  - [ ] SubTask 7.2: 提交并 `git push`

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 4] depends on [Task 2]
