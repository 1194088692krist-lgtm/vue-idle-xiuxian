# 丹药与洗练系统 Bug 修复 v2 Spec

## Why
上一轮实现后暴露多项严重问题：背包页被错误添加了「丹方」标签；丹药服用无数值变化反馈；炼制成功无提示；小培元丹 effortValue 未同步到人物基础数据；旧存档装备 stats 中混杂了基础属性与非法 0 值词条，单条洗练选择列表未过滤基础属性；桌面端装备弹窗全屏显示体验极差。

## What Changes
- 背包页移除「丹方」标签，仅保留「丹药」子菜单
- 丹药服用后弹出具体数值变化提示（如「张小凡 努力值 +5」）
- 八卦炉炼制成功后显示「获得 X 丹药 ×N」提示
- 八卦炉支持批量炼制（输入数量，一次性消耗素材并产出）
- 修复小培元丹 effectDescription 与背包显示不一致；effortValue 增加必须按规则同步提升人物 baseStats（每点 effortValue 按比例增加 attack/health/defense/speed），确保战力真实增长
- 修复单条洗练：装备 stats 中的基础属性（attack/health/defense/speed）不得出现在洗练选择列表中；清理旧存档装备的非法 0 值词条；凡品装备若 stats 中只有基础属性则无词条可选
- 桌面端装备详情弹窗从全屏改为小弹窗（类似人物详情弹窗尺寸）
- 构建验证并推送到 main

## Impact
- Affected specs: 背包系统、炼丹系统、装备洗练系统、UI 弹窗
- Affected code: `src/views/Inventory.vue`, `src/views/Alchemy.vue`, `src/stores/player.js`, `src/plugins/equipment.js`, `src/components/EquipmentDetailModal.vue` 或相关弹窗组件

## ADDED Requirements
### Requirement: 批量炼制
The system SHALL allow the player to input a quantity in the Alchemy UI and craft that many pills at once, consuming materials proportionally.

#### Scenario: 批量炼制
- **WHEN** 玩家在八卦炉选择丹药并输入数量 5
- **THEN** 一次性扣除 5 倍素材，产出 5 颗丹药，提示「获得 聚灵丹 ×5」

### Requirement: 丹药服用数值反馈
The system SHALL display a specific numeric change message after consuming a pill, showing which stat increased by how much.

### Requirement: effortValue 同步提升基础属性
The system SHALL ensure that every point of effortValue gained from pills directly increases the character's baseStats (attack, health, defense, speed) by a defined ratio, so that combat power actually grows.

#### Scenario: 服用小培元丹
- **GIVEN** 角色张小凡当前 effortValue=0，baseStats.attack=100
- **WHEN** 服用小培元丹获得 effortValue +5
- **THEN** effortValue 变为 5，同时 baseStats.attack 按每点 effortValue 增加 0.5% 的比例提升（attack 增加 2.5 点并四舍五入），战力真实增长

## MODIFIED Requirements
### Requirement: 单条洗练词条选择
Equipment single-stat reforge selection list SHALL only display affix stats (from `reforgeableStats`), never base stats (attack/health/defense/speed). If an equipment has no valid affixes, the single-stat reforge option SHALL be disabled or show "无可用词条".

### Requirement: 旧装备非法词条清理
The system SHALL clean up invalid affixes (vampireRate:0, spiritRate, cultivationRate, etc.) from existing equipment stats when the equipment is first loaded or before reforge.

## REMOVED Requirements
### Requirement: 背包页「丹方」标签
**Reason**: 用户要求丹方仅在八卦炉显示，背包页不应有丹方标签。
**Migration**: 从 Inventory.vue 中移除「丹方」标签及相关渲染逻辑。
