# 背包丹药子菜单与洗练残留 Bug 修复 Spec

## Why
玩家炼制丹药后无处可查看和使用，背包页缺少丹药管理入口；同时八卦炉的单条洗练模式仍存在吸血率 0 的无效词条，且基础属性被错误混入洗练池，导致装备养成体验极差。

## What Changes
- 在背包页新增「丹药」子菜单，展示已拥有的丹药列表（名称、效果、持有数量）
- 点击丹药弹出服用菜单，仅列出当前**出战角色**供选择
- 实现丹药服用逻辑：持久性 buff 写入角色对象（如 `activePills` 数组），全队 buff 写入玩家全局状态
- 在挂机仪表盘的正向 buff 列表中显示当前生效的丹药 buff，且数据实装（真实影响挂机收益）
- 彻底解决单条洗练模式下的吸血率 0 问题：修正 `targetStat` 分支中的数值生成逻辑，确保百分比词条最小值 > 0
- 再次确认洗练逻辑中基础属性（attack/health/defense/speed）被完全隔离，不可被单条洗练选中或修改
- 构建验证并推送到 main

## Impact
- Affected specs: 背包系统、丹药系统、挂机 buff 系统、装备洗练系统
- Affected code: `src/views/Inventory.vue`, `src/stores/player.js`, `src/composables/useIdleSystem.js`, `src/plugins/equipment.js`

## ADDED Requirements
### Requirement: 背包丹药子菜单
The system SHALL provide a dedicated "Pills" tab within the Inventory view that lists all currently owned pills with their effects and quantities.

#### Scenario: 玩家查看丹药
- **WHEN** 玩家切换到背包页的「丹药」标签
- **THEN** 显示所有已拥有的丹药卡片，包含名称、图标、效果简述、持有数量

### Requirement: 丹药服用与角色选择
The system SHALL allow the player to click a pill to open a modal for choosing a team member to consume it. Only currently deployed (出战) members SHALL be selectable.

#### Scenario: 服用角色专属丹药
- **WHEN** 玩家点击丹药并选择出战角色 A
- **THEN** 丹药效果绑定到角色 A 的 activePills 数组，数量减 1，弹出数值变化提示

#### Scenario: 服用全队 buff 丹药
- **WHEN** 玩家点击「灵石获取加成」类丹药并选择任意出战角色
- **THEN** 效果写入玩家全局 activeBuffs，全队生效，数量减 1

### Requirement: 丹药 Buff 实装到挂机仪表盘
The system SHALL display active pill buffs in the idle exploration dashboard's positive buff list, and these buffs SHALL actually modify combat/reward calculations.

#### Scenario: 灵石加成丹生效
- **GIVEN** 玩家服用了灵石获取 +10% 的丹药且仍在持续时间内
- **WHEN** 挂机探索获得灵石奖励
- **THEN** 实际获得的灵石 = 基础值 × (1 + 0.10)

## MODIFIED Requirements
### Requirement: 单条洗练词条正确性
Equipment single-stat reforge (`targetStat !== null`) SHALL only modify the selected affix stat, SHALL never generate a 0-value percentage stat, and SHALL never touch base stats (attack/health/defense/speed).

### Requirement: 洗练预览数值下限
Any percentage-type affix (vampireRate, comboRate, critRate, etc.) generated during reforge SHALL have a minimum value strictly greater than 0, enforced at both the range-sampling and the clamping stage.

## REMOVED Requirements
无
