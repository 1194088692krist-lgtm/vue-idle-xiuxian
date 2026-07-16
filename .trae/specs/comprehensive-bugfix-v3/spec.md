# 全面 Bug 修复与 UI 检视 v3 Spec

## Why
用户反馈上一轮修复存在严重遗漏：
1. 洗练系统仍大量生成数值为 0 的词条（根源在于旧装备含非法词条时 `getRandomValueInRange` 回退到 0，且百分比路径未兜底）；
2. 背包丹药服用缺少数量选择（当前代码虽有 `pillConsumeCount` 变量，但 UI 未展示数量输入框，实际只能服用 1 个）；
3. 背包素材/装备/丹药分页按钮虽存在，但某些标签页（如丹药）的分页逻辑或按钮位置不完整；
4. 桌面端装备弹窗虽已缩至 50vw/520px，但在宽屏下仍显过大，需进一步缩窄；
5. 日间模式下背包页单方需求材料备注、丹药描述等文字对比度不足，底衬与字体配色方案需全面向宗门页看齐（暗底亮字）；
6. 怪物仪表血量显示存在格式错误（如 `48/48()` 的残留括号），且战斗中怪物 `currentHealth` 因 Vue 3 对类实例深层属性劫持不完整，导致 UI 不响应真实血量下降；
7. 需以「暗色底衬配亮色字体」为原则，全面检视所有页面日间/夜间模式的字体配色一致性。

## What Changes
- **装备洗练**：`equipment.js` 中 `getRandomValueInRange` 增加兜底保护；`reforgeEquipment` 对旧装备非法词条在洗练前强制清理；百分比词条最终值强制 `> 0`；flat 词条强制 `>= 1`。
- **背包丹药服用**：`Inventory.vue` 在丹药服用弹窗中增加数量输入框（`n-input-number`），默认 1，最小 1，最大受库存限制。
- **背包分页**：统一素材、装备、丹药三个标签页的分页组件样式与位置，确保上一页/下一页按钮始终可见且功能正常。
- **装备弹窗**：桌面端装备详情弹窗宽度从 `50vw/520px` 进一步缩至 `45vw/480px`，高度同步下调。
- **日间模式配色（背包页）**：参照宗门页 `Cultivation.vue` 的暗底亮字方案，为 `Inventory.vue` 补充所有遗漏元素的日间样式：材料备注、丹药描述、装备词条标签、弹窗内文字等。
- **怪物血量显示与同步**：`Dungeon.vue` 中血量文本渲染去除残留括号；在 `combat.js` 的 `CombatManager.processRound()` 返回结果中显式带回双方 `currentHealth`，由 `Dungeon.vue` 的 `dungeonState` 响应式对象直接接收并触发 UI 更新，绕过类实例深层劫持问题。
- **全面字体配色检视**：遍历所有 `.vue` 文件中的 `html:not(.dark)` 规则与夜间默认样式，确保暗底始终配亮色字体，消除任何灰底灰字或白底黑字在暗色背景上的不可读情况。

## Impact
- Affected specs: 装备洗练系统、背包系统、战斗系统、UI 主题系统
- Affected code: `src/plugins/equipment.js`, `src/views/Inventory.vue`, `src/views/Dungeon.vue`, `src/plugins/combat.js`, `src/views/Cultivation.vue`（参考样式）, 其他各页面的 `<style>` 区块

## ADDED Requirements
### Requirement: 洗练零值彻底防护
The system SHALL guarantee that no equipment affix ever has a value of 0, null, undefined, or NaN after generation or reforge.

#### Scenario: 旧装备含非法词条被洗练
- **GIVEN** 一件旧装备 stats 中含有不在 `reforgeableStats` 中的属性（如 `vampireRate: 0`）
- **WHEN** 执行单条或全洗练
- **THEN** 该非法词条在洗练前被删除；若出现在选择列表中，其数值被强制替换为品质基础下限的 50%（百分比）或 1（固定值），绝不为 0

### Requirement: 丹药批量服用
The system SHALL allow the player to choose how many pills to consume at once in the backpack pill modal.

#### Scenario: 服用多颗丹药
- **GIVEN** 背包中有小培元丹 ×10
- **WHEN** 玩家打开服用弹窗，输入数量 3，点击服用
- **THEN** 依次调用 `consumePill` 3 次，成功时汇总提示（如「生命 +30」），失败时（如努力值上限）停止并提示

### Requirement: 怪物血量真实同步
The system SHALL ensure the enemy health bar in Dungeon.vue decreases visually after each combat round.

#### Scenario: 战斗回合推进
- **GIVEN** 玩家与怪物进入战斗，怪物 currentHealth = 100
- **WHEN** 玩家攻击造成 20 点伤害，`CombatManager.processRound()` 执行完毕
- **THEN** `Dungeon.vue` 中的 `dungeonState.combatManager.enemy.currentHealth` 立即显示为 80，血条宽度同步收缩

## MODIFIED Requirements
### Requirement: 装备弹窗尺寸
**Previous**: 桌面端 50vw, max-width 520px.
**New**: 桌面端 45vw, max-width 480px, height 75vh.

### Requirement: 日间模式背包配色
**Previous**: 仅覆盖了部分元素的日间样式，材料备注、弹窗内文字等仍使用默认暗色字体。
**New**: 全面覆盖 `Inventory.vue` 中所有文本元素，暗底（rgba(45,44,42,0.92)）+ 亮字（#F5F0E8 / #C9C4BA），与宗门页保持一致。

## REMOVED Requirements
无
