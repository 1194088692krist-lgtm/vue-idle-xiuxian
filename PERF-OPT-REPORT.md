# 第四轮性能优化报告

> 优化日期：2026-08-04  
> 提交：`8c5bcdba` perf: 第四轮优化  
> 基于：`e474e359`（第三轮 SW 缓存优化）

## 优化概览

本轮针对挂机核心循环、数值动画、Service Worker 缓存三个维度共实施 **7 项优化**，涉及 4 个文件，净增 174 行代码。

## 优化清单

### 1. 静态数据 Map 索引（收益：高）

**文件**：`src/composables/useIdleSystem.js`

**问题**：挂机循环中每次遭遇都重复对 `setBonuses`、`characterList`、`pillRecipes`、`characterInnerPillList` 做线性 `find()`/`filter()`，O(n) 查找在高频循环中累积开销显著。

**优化**：
- 构建 `setBonusMap`（按 id）、`setBonusBySlotMap`（按 slot 分组）、`charListMap`（按 id）、`charListByStarMap`（按 star 分组）、`pillRecipeMap`、`innerPillMap` 六个索引
- 所有 `find()` 调用改为 `Map.get()`，O(n) → O(1)
- `pickRandomCharacterByStar` 从全量 filter 改为按 star 分组索引收集候选
- 采用懒加载初始化，兼容测试环境 mock 模块

**影响点**：

| 原代码 | 优化后 | 调用频率 |
|--------|--------|----------|
| `setBonuses.find(s => s.id === setId)` | `getSetBonusMap().get(setId)` | 每件装备生成 |
| `setBonuses.filter(s => s.pieces.includes(slot))` | `getSetBonusBySlotMap().get(slot)` | 每件史诗+装备 |
| `_charList.find(c => c.id === charBoss.characterId)` | `getCharListMap().get(...)` | 每场角色BOSS |
| `_charList.filter(c => c.star >= minStar && ...)` | `getCharListByStarMap()` 分组收集 | 每次角色选择 |
| `pillRecipes.find(r => r.id === buff.pillId)` | `getPillRecipeMap().get(...)` | 仪表盘 buff 渲染 |
| `characterInnerPillList.find(p => p.id === pillId)` | `getInnerPillMap().get(...)` | 内丹掉落 |

---

### 2. 日志定时器批量 flush（收益：高）

**文件**：`src/composables/useIdleSystem.js`

**问题**：挂机日志通过 1s 定时器逐条展示，每条 log push 都触发 `logs.value` 变更 → `displayLogs` computed 重算 → DOM diff。高战斗频率时日志积压严重。

**优化**：
- 定时器间隔 1s → 500ms（响应更快）
- 自适应批量 flush：积压 ≤3 条逐条展示，4-10 条每 tick 展示 2 条，>10 条展示 3 条
- 减少 `logs.value` 变更频率约 50-66%

---

### 3. idleDashboard computed 优化（收益：中）

**文件**：`src/composables/useIdleSystem.js`

**问题**：
- `calculateEquipmentScore(eq)` 在每次 dashboard 重算时重复调用（每场战斗后都会触发）
- `totalPhantomCrystals` 重复赋值两次（代码冗余）

**优化**：
- `calculateEquipmentScore` 结果记忆化到 `eq._cachedScore`，同一装备只算一次
- 删除重复的 `totalPhantomCrystals` 赋值

---

### 4. getEffectiveStats 合并遍历（收益：中）

**文件**：`src/stores/player.js`

**问题**：`getEffectiveStats` getter 对 `equippedArtifacts` 做了三次 `Object.values().forEach()` 遍历（固定属性、词缀、灵纹），每次装备变更都触发三次全量遍历。

**优化**：合并为单次 `for...of` 循环，减少 2/3 的迭代开销。

---

### 5. 数值动画节流（收益：中）

**文件**：`src/App.vue`

**问题**：spirit worker 每秒 tick 更新 `playerStore.spirit`，触发 `watch` → `animateValue`。即使差值 < 5 跳过 RAF 动画，每秒仍有函数调用和 ref 赋值开销。四个数值（spirit/stones/cultivation/crystals）各自如此。

**优化**：
- 200ms 节流合并连续更新
- 节流期间若无正在运行的动画，直接同步目标值，确保显示值不落后

---

### 6. Service Worker 缓存优化（收益：中）

**文件**：`public/sw.js`

**问题**：
- 每次请求 `findInCaches` 都 `caches.open()` 两个缓存（async 开销）
- `/assets/` 下 hash 文件名的 JS/CSS 走 SWR 策略，每次都发 revalidate 请求（hash 文件名本身是 immutable 的，revalidate 必返回 304，浪费网络）

**优化**：
- 缓存句柄复用：`getCache()` 用 Map 缓存 `caches.open()` 返回的 Promise，activate 阶段预初始化
- `/assets/` 下带 contenthash 的 JS/CSS 改用纯 Cache-First，避免无意义的 revalidate 请求

---

### 7. 双定时器动态频率（收益：低-中）

**文件**：`src/composables/useIdleSystem.js`

**问题**：`idleTimer`（1s）固定频率运行，前台时进度条精度不需要 1s 更新，浪费 CPU 唤醒。

**优化**：
- 前台时 `idleTimer` 降频到 2s（进度条精度足够）
- 后台时保持 1s（浏览器节流后实际更短间隔更可能在节流间隙执行）
- 通过 `visibilitychange` 动态切换频率，回调抽取为独立函数 `idleTimerCallback` 复用

---

## 验证结果

- **测试**：14 个测试文件、53 个用例全部通过 ✅
- **构建**：`vite build` 成功，无报错 ✅
- **代码变更**：4 files changed, +174 -41 lines

## 未优化的已知项（后续可做）

| 项目 | 说明 | 难度 |
|------|------|------|
| `runStats` shallowRef 改造 | 将 `runStats` 从 `ref` 改为 `shallowRef` + 手动 `triggerRef`，需在所有更新点统一触发 | 高（改动面大） |
| `idleDashboard` 拆分 computed | 拆成多个小 computed 减少重算范围，需改组件模板引用 | 高（影响面广） |
| `equippedArtifacts` shallowReactive | 减少 Pinia 深响应式代理开销，需排查所有 mutation 点 | 中 |
| `sectMembers`/`materials` Map 索引 | 动态存档数据建索引，维护复杂度高 | 中 |
