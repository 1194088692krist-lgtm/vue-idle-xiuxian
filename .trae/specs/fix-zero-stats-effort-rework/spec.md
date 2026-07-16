# 装备0值词条清理与丹药努力值机制重做 Spec

## Why
1. 旧存档及新掉落装备中仍存在「连击率：0」「吸血率：0」等无意义词条，且洗练可能生成数值为0的词条；
2. 用户明确反馈「光加努力值，而不体现基础数值增加是没有意义的」——当前 effortValue 增加后仅按0.5%比例隐性提升 baseStats，效果不直观；
3. 桌面端装备详情弹窗虽已缩小，但仍显过宽。

## What Changes
- **装备系统**：
  - 生成装备词条时彻底禁止产出0值（百分比词条下限>0，固定值词条下限≥1）；
  - 洗练（全洗/单条）时若计算出新值为0或负数，强制取品质基础下限的50%（百分比）或1（固定值）；
  - 装备属性展示与洗练选择列表统一过滤值为0、null、NaN的词条；
  - `reforgeEquipment` 入口对所有非基础属性执行0值清理（不限于 PERCENT_STATS）。
- **丹药系统**：
  - 努力值（effortValue）改为「容器上限」概念：所有永久增加基础数值的丹药都必须附带少量 effortValue（1~5点），但主效果是**直接增加具体属性**（如生命+10、攻击+15）；
  - 移除「effortValue 增加后按0.5%同步提升四项 baseStats」的隐藏逻辑；
  - 丹药 `baseEffect` 支持 `extraStats: { stat: value }` 字段，用于描述除 effortValue 外的直接属性增益；
  - 小培元丹具体调整为：effortValue +1，生命+10；
  - 其他培元丹系列按梯度调整 effortValue（1~5）与对应属性；
  - 努力值达到上限后，effortGain 类丹药完全无法服用（返回「努力值已达上限」）。
- **UI**：桌面端装备详情弹窗宽度从 60vw/900px 进一步缩窄至约 50vw/720px。
- **构建与推送**：验证构建通过后推送 main。

## Impact
- Affected specs: 装备掉落与洗练、丹药服用与效果计算、角色属性成长
- Affected code: `src/plugins/buildSystem.js`, `src/plugins/equipment.js`, `src/plugins/pills.js`, `src/stores/player.js`, `src/views/Inventory.vue`

## ADDED Requirements
### Requirement: 丹药复合效果 extraStats
The system SHALL support a new optional field `extraStats` in `pillRecipes.baseEffect`, typed as `Record<statKey, number>`. When an `effortGain` pill is consumed, the system SHALL:
1. Check effortValue cap first; reject if capped.
2. Add the `value` to `member.effortValue`.
3. For each entry in `extraStats`, round the value and add it directly to both `member.baseStats[stat]` and `member.permanentBonuses[stat]`.
4. Return a `changes` array containing effortValue delta and every stat delta.

#### Scenario: 服用小培元丹
- **GIVEN** 角色当前 effortValue=0, baseStats.health=100, permanentBonuses.health=0, 星级3（上限足够）
- **WHEN** 服用小培元丹（baseEffect: `{ type: 'effortGain', value: 1, extraStats: { health: 10 } }`）
- **THEN** effortValue 变为 1；baseStats.health 变为 110；permanentBonuses.health 变为 10；弹窗提示「努力值 +1」「生命 +10」

### Requirement: 装备词条零值保护
When generating or reforging equipment affixes:
- For `percent` stats, the final value SHALL be strictly greater than 0, and not less than 50% of the rarity base range lower bound.
- For `flat` stats, the final value SHALL be at least 1.
- Any existing stat in `equipment.stats` (excluding BASE_STATS) with value 0, null, undefined, or NaN SHALL be removed during display and before reforge.

## MODIFIED Requirements
### Requirement: effortValue 与 baseStats 的关系
**Previous**: effortValue 每增加1点，隐性提升四项 baseStats 各0.5%。
**New**: effortValue 仅作为服用上限容器，不再自动提升 baseStats；所有数值提升必须由 `extraStats` 显式描述并直接写入 baseStats。

### Requirement: 装备详情弹窗尺寸
**Previous**: 桌面端 60vw, max-width 900px.
**New**: 桌面端 50vw, max-width 720px.

## REMOVED Requirements
### Requirement: effortValue 隐性比例增益
**Reason**: 用户要求努力值只做上限，属性增益必须显式、直接、可感知。
**Migration**: 已有 effortValue 的角色不再追溯扣除；从本版本起 effortValue 仅影响「能否继续服用 effortGain 丹药」。
