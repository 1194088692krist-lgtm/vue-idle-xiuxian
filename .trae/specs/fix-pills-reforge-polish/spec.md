# 丹药与洗练系统修复 Spec

## Why
当前版本存在影响游戏平衡的恶性问题：聚灵丹等丹药引用了未实装的"灵力"素材，导致无法炼制；丹药效果数值（如+750%）过于夸张；炼丹界面不显示素材来源，玩家无法规划挂机地图。同时八卦炉洗练系统仍允许基础属性进入词条池，且继续产出吸血率0等无效词条，影响装备养成体验。

## What Changes
- 移除/替换所有依赖已废弃"灵力"系统的丹药素材需求，将灵力类丹药效果改为灵石获取加成
- 在炼丹界面材料需求栏标注每种素材的推荐掉落地图与难度
- 全面下调丹药效果数值到合理区间（避免百倍级增幅）
- 装备洗练词条池排除基础属性（attack/health/defense/speed），仅保留战斗/特殊词条
- 修复洗练词条数值区间，确保百分比类词条（吸血、连击等）不会出现0值
- 构建验证并推送到 main

## Impact
- Affected specs: 炼丹系统、装备洗练系统、丹药效果计算、挂机奖励
- Affected code: `src/plugins/pills.js`, `src/views/Alchemy.vue`, `src/plugins/equipment.js`, `src/plugins/buildSystem.js`, `src/stores/player.js`

## ADDED Requirements
### Requirement: 素材来源标注
The system SHALL provide the drop source (zone name and difficulty label) for each required material in the Alchemy UI.

#### Scenario: 玩家查看炼丹材料
- **WHEN** 玩家在八卦炉界面查看某丹药详情
- **THEN** 每种材料名称后显示括号标注，例如"灵草（迷雾山谷·凶险）"

### Requirement: 丹药效果合理化
The system SHALL cap or rescale pill effect multipliers so that no common pill exceeds a +50% resource/combat bonus, and high-tier pills scale with realm/level rather than giving flat huge percentages.

## MODIFIED Requirements
### Requirement: 丹药素材可炼制
All pill recipes SHALL only reference materials that are actually dropped by the idle/exploration system. Any recipe previously requiring "spirit"/"灵力" SHALL be changed to require commonly dropped spirit stones or herbs, and its effect SHALL be changed to a spirit stone gain bonus.

### Requirement: 洗练词条正确性
Equipment reforge SHALL only roll affixes from the combat/special pool (crit, combo, dodge, vampire, stun, counter, haste, etc.). Base stats (attack, health, defense, speed) SHALL NOT appear as reforgeable affixes. Percentage affixes SHALL always roll a non-zero value within their configured range.

## REMOVED Requirements
### Requirement: 灵力系统相关丹药
**Reason**: 灵力系统已废弃，相关素材不存在。
**Migration**: 将灵力丹药改为灵石加成丹药，原效果替换为"灵石获取加成"。
