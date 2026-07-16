# Tasks

- [x] Task 1: 审查并修复丹药素材需求（移除灵力素材，改为灵石加成丹药）
  - [x] SubTask 1.1: 读取 `src/plugins/pills.js`，识别所有引用未实装灵力素材的丹方
  - [x] SubTask 1.2: 将这些丹方的素材需求改为当前系统实际掉落的素材（灵草/矿石/灵液/妖核等）
  - [x] SubTask 1.3: 将其效果从"灵力获取"改为"灵石获取加成"，数值在合理区间

- [x] Task 2: 在炼丹界面标注材料来源
  - [x] SubTask 2.1: 读取 `src/views/Alchemy.vue`，定位材料需求展示区域
  - [x] SubTask 2.2: 为每种材料建立掉落来源映射（地图名+难度标签）
  - [x] SubTask 2.3: 在 UI 中渲染括号标注，例如"灵草（迷雾山谷·凶险）"

- [x] Task 3: 调整丹药效果数值到合理区间
  - [x] SubTask 3.1: 读取丹药效果计算公式与基础数值
  - [x] SubTask 3.2: 降低高阶丹药的 flat 百分比，引入境界/等级缩放
  - [x] SubTask 3.3: 确保普通丹药不超过 +50% 加成，稀有丹药不超过 +100% 加成

- [x] Task 4: 修复装备洗练词条池与数值区间
  - [x] SubTask 4.1: 读取 `src/plugins/equipment.js` 与 `src/plugins/buildSystem.js`，确认当前 reforgeableStats 列表
  - [x] SubTask 4.2: 从 reforgeableStats 中移除 attack/health/defense/speed 等基础属性
  - [x] SubTask 4.3: 修正吸血率、连击率等百分比词条的数值区间，确保最小值 > 0
  - [x] SubTask 4.4: 验证洗练预览与确认逻辑不再产生 0 值词条

- [x] Task 5: 构建验证并推送 main
  - [x] SubTask 5.1: 运行 `npm run build`
  - [x] SubTask 5.2: 提交并 `git push`

# Task Dependencies
- [Task 3] depends on [Task 1]
- [Task 2] depends on [Task 1]
