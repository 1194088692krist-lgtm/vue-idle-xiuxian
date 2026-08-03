// 修仙游戏平衡性重设计方案
// 输出新旧对比和具体数值修改建议
// 运行: node scripts/balance/redesign.js

console.log('\n' + '='.repeat(120))
console.log('  最后三张图强度梯度重设计方案')
console.log('='.repeat(120))

// ============== 当前配置 vs 新方案对比 ==============

console.log('\n【方案 1】LATE_ZONE_ENEMY_MULT 调整（降低后期秘境倍率，平滑过渡）\n')
console.log(
  '秘境'.padEnd(16) +
  '当前lateMult'.padStart(14) +
  '新lateMult'.padStart(14) +
  '变化'.padStart(14) +
  '理由'.padStart(40)
)
console.log('-'.repeat(112))

const lateMultChanges = [
  { zone: 'ice_palace', old: 3.0, newVal: 2.2, reason: '降低33%，让冰雪宫更早可攻略' },
  { zone: 'immortal_ruins', old: 4.5, newVal: 3.0, reason: '降低33%，平滑冰雪→仙墟跳跃' },
  { zone: 'chaos_realm', old: 8.0, newVal: 4.5, reason: '降低44%，消除混沌界断崖式跳跃' }
]
for (const c of lateMultChanges) {
  const change = ((c.newVal - c.old) / c.old * 100).toFixed(1) + '%'
  console.log(
    c.zone.padEnd(16) +
    String(c.old).padStart(14) +
    String(c.newVal).padStart(14) +
    change.padStart(14) +
    c.reason.padStart(40)
  )
}

console.log('\n\n【方案 2】BOSS_STRENGTH_MULT 调整（消除双重叠加）\n')
console.log(
  '字段'.padEnd(28) +
  '当前值'.padStart(12) +
  '新值'.padStart(12) +
  '说明'.padStart(60)
)
console.log('-'.repeat(112))
console.log('BOSS_POWER_MULTIPLIER'.padEnd(28) + '1.5'.padStart(12) + '1.3'.padStart(12) + '降低13%，保留BOSS威慑感但不至于秒杀'.padStart(60))
console.log('BOSS_STRENGTH_MULT'.padEnd(28) + '1.5'.padStart(12) + '1.2'.padStart(12) + '降低20%，避免双重1.5×1.5=2.25的叠加'.padStart(60))
console.log('实际总倍率'.padEnd(28) + '2.25'.padStart(12) + '1.56'.padStart(12) + '总降幅31%，让BOSS强度回归合理'.padStart(60))

console.log('\n\n【方案 3】变种 BOSS 倍率调整（让变种可击杀但仍有挑战）\n')
console.log(
  '变种类型'.padEnd(16) +
  '当前倍率'.padStart(12) +
  '新倍率'.padStart(12) +
  '说明'.padStart(60)
)
console.log('-'.repeat(100))
console.log('仙变种(xian)'.padEnd(16) + '1.3'.padStart(12) + '1.2'.padStart(12) + '降低8%，轮回/天劫档可击杀'.padStart(60))
console.log('混沌变种(hundun)'.padEnd(16) + '1.5'.padStart(12) + '1.3'.padStart(12) + '降低13%，天道档仍需顶级配置'.padStart(60))

console.log('\n\n【方案 4】难度档 scale 微调（高级档略微下调）\n')
console.log(
  '难度'.padEnd(12) +
  '当前scale'.padStart(12) +
  '新scale'.padStart(12) +
  '变化'.padStart(12) +
  '说明'.padStart(50)
)
console.log('-'.repeat(98))
const diffChanges = [
  { key: 'lunhui', label: '轮回', old: 4.0, newVal: 3.5, desc: '降低12.5%，让仙变种可战' },
  { key: 'tianjie', label: '天劫', old: 7.0, newVal: 5.5, desc: '降低21%，让仙变种可战' },
  { key: 'tiandao', label: '天道', old: 12.0, newVal: 9.0, desc: '降低25%，让混沌变种在终局配可击杀' }
]
for (const c of diffChanges) {
  const change = ((c.newVal - c.old) / c.old * 100).toFixed(1) + '%'
  console.log(
    c.label.padEnd(12) +
    String(c.old).padStart(12) +
    String(c.newVal).padStart(12) +
    change.padStart(12) +
    c.desc.padStart(50)
  )
}

// ============== 重新计算新方案下的 BOSS 强度 ==============
console.log('\n\n' + '='.repeat(120))
console.log('  新方案下的 BOSS 强度（与旧方案对比）')
console.log('='.repeat(120))

const NEW_LATE_MULT = { ice_palace: 2.2, immortal_ruins: 3.0, chaos_realm: 4.5 }
const NEW_BOSS_POWER = 1.3
const NEW_BOSS_STRENGTH = 1.2
const NEW_DIFF_SCALE = { lunhui: 3.5, tianjie: 5.5, tiandao: 9.0 }
const NEW_VARIANT = { xian: 1.2, hundun: 1.3 }

const ZONE_REC = {
  ice_palace: { atk: 30000, hp: 90000 },
  immortal_ruins: { atk: 90000, hp: 270000 },
  chaos_realm: { atk: 600000, hp: 1800000 }
}
const ZONE_BUILD_BASE = { ice_palace: 6000000, immortal_ruins: 18000000, chaos_realm: 120000000 }

function calcNewBoss(bossBaseStats, zoneId, diffKey, variantMult = 1) {
  const scale = NEW_DIFF_SCALE[diffKey] || 1
  const lateMult = NEW_LATE_MULT[zoneId]
  const totalBossMult = NEW_BOSS_POWER * lateMult
  const recHp = ZONE_REC[zoneId].hp
  const bossAtkLateFactor = 1 + (lateMult - 1) * 0.3

  let hp = Math.floor(bossBaseStats.health * scale * totalBossMult)
  let def = Math.floor(bossBaseStats.defense * scale * totalBossMult)
  let atk = Math.floor(recHp * 0.22 * bossAtkLateFactor * scale)
  let spd = Math.floor(bossBaseStats.speed * 1.5 * Math.sqrt(lateMult))

  hp = Math.floor(hp * NEW_BOSS_STRENGTH)
  def = Math.floor(def * NEW_BOSS_STRENGTH)
  atk = Math.floor(atk * NEW_BOSS_STRENGTH)

  hp = Math.floor(hp * variantMult)
  def = Math.floor(def * variantMult)
  atk = Math.floor(atk * variantMult)
  spd = Math.floor(spd * variantMult)
  return { attack: atk, health: hp, defense: def, speed: spd }
}

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(n)
}

const bosses = {
  ice_palace: [
    { name: '玄冰祖龙', stats: { attack: 130000, health: 1100000, defense: 35000, speed: 22 } }
  ],
  immortal_ruins: [
    { name: '太古仙人', stats: { attack: 420000, health: 4200000, defense: 95000, speed: 32 } }
  ],
  chaos_realm: [
    { name: '原始混沌', stats: { attack: 3200000, health: 32000000, defense: 650000, speed: 45 } }
  ]
}

// 玩家档位（复用）
const PLAYER_PROFILES = [
  { name: '冰雪宫毕业', teamBuild: 5030000000, teamAtk: 205970000 },
  { name: '仙墟毕业', teamBuild: 12680000000, teamAtk: 341110000 },
  { name: '混沌界入门', teamBuild: 19260000000, teamAtk: 409330000 },
  { name: '终局极限', teamBuild: 36560000000, teamAtk: 589460000 }
]

console.log('\n【表 5】新方案 BOSS 强度对比（天道档，最难关卡）\n')
console.log(
  '秘境·BOSS'.padEnd(20) +
  '| 旧方案'.padEnd(40) +
  '| 新方案'.padEnd(40) +
  '| 终局玩家击杀回合'.padEnd(30)
)
console.log('-'.repeat(130))
console.log(
  ''.padEnd(20) +
  '| 普通 ATK / HP'.padStart(20) + '变种混沌 ATK/HP'.padStart(20) +
  '| 普通 ATK / HP'.padStart(20) + '变种混沌 ATK/HP'.padStart(20) +
  '| 旧方案/新方案'.padStart(20)
)
console.log('-'.repeat(130))

for (const zoneId of ['ice_palace', 'immortal_ruins', 'chaos_realm']) {
  const zoneName = { ice_palace: '冰雪宫', immortal_ruins: '仙墟', chaos_realm: '混沌界' }[zoneId]
  const boss = bosses[zoneId][0]
  // 旧方案
  const oldNormal = calcOldBoss(boss.stats, zoneId, 'tiandao', 1)
  const oldHundun = calcOldBoss(boss.stats, zoneId, 'tiandao', 1.5)
  // 新方案
  const newNormal = calcNewBoss(boss.stats, zoneId, 'tiandao', 1)
  const newHundun = calcNewBoss(boss.stats, zoneId, 'tiandao', NEW_VARIANT.hundun)

  const oldRounds = Math.ceil(oldHundun.health / 589460000)
  const newRounds = Math.ceil(newHundun.health / 589460000)

  console.log(
    (zoneName + '·' + boss.name).padEnd(20) +
    '|' + (fmt(oldNormal.attack) + ' / ' + fmt(oldNormal.health)).padStart(20) +
    (fmt(oldHundun.attack) + ' / ' + fmt(oldHundun.health)).padStart(20) +
    '|' + (fmt(newNormal.attack) + ' / ' + fmt(newNormal.health)).padStart(20) +
    (fmt(newHundun.attack) + ' / ' + fmt(newHundun.health)).padStart(20) +
    '|' + (oldRounds + '回合 → ' + newRounds + '回合').padStart(20)
  )
}

function calcOldBoss(bossBaseStats, zoneId, diffKey, variantMult = 1) {
  const OLD_LATE = { ice_palace: 3.0, immortal_ruins: 4.5, chaos_realm: 8.0 }
  const OLD_BOSS_POWER = 1.5
  const OLD_BOSS_STRENGTH = 1.5
  const OLD_DIFF = { tiandao: 12.0 }
  const scale = OLD_DIFF[diffKey]
  const lateMult = OLD_LATE[zoneId]
  const totalBossMult = OLD_BOSS_POWER * lateMult
  const recHp = ZONE_REC[zoneId].hp
  const bossAtkLateFactor = 1 + (lateMult - 1) * 0.3

  let hp = Math.floor(bossBaseStats.health * scale * totalBossMult)
  let def = Math.floor(bossBaseStats.defense * scale * totalBossMult)
  let atk = Math.floor(recHp * 0.22 * bossAtkLateFactor * scale)
  hp = Math.floor(hp * OLD_BOSS_STRENGTH)
  atk = Math.floor(atk * OLD_BOSS_STRENGTH)
  hp = Math.floor(hp * variantMult)
  atk = Math.floor(atk * variantMult)
  return { attack: atk, health: hp, defense: def, speed: 0 }
}

// ============== 验证：各档玩家在新方案下的胜率 ==============
console.log('\n\n【表 6】新方案下玩家胜率验证（ratio = teamBuild / recommendedBuild）\n')
console.log(
  '玩家档位'.padEnd(16) +
  '队伍Build'.padStart(12) +
  '| 冰雪宫'.padEnd(40) +
  '| 仙墟'.padEnd(40) +
  '| 混沌界'.padEnd(40)
)
console.log(
  ''.padEnd(28) +
  '| 灭世  轮回  天劫  天道'.padEnd(40) +
  '| 灭世  轮回  天劫  天道'.padEnd(40) +
  '| 灭世  轮回  天劫  天道'.padEnd(40)
)
console.log('-'.repeat(150))

// 新的 recommendedBuild = buildBase × newScale
const NEW_BUILD_BASE = ZONE_BUILD_BASE
for (const p of PLAYER_PROFILES) {
  let line = p.name.padEnd(16) + fmt(p.teamBuild).padStart(12) + ' | '
  for (const zoneId of ['ice_palace', 'immortal_ruins', 'chaos_realm']) {
    const base = NEW_BUILD_BASE[zoneId]
    for (const dk of ['mieshi', 'lunhui', 'tianjie', 'tiandao']) {
      const scale = dk === 'mieshi' ? 2.5 : NEW_DIFF_SCALE[dk]
      const recBuild = Math.floor(base * scale)
      const ratio = p.teamBuild / recBuild
      const tag = ratio < 0.5 ? '✗' : ratio < 1.0 ? '△' : ratio < 1.33 ? '○' : '◎'
      line += (tag + ratio.toFixed(1)).padEnd(8)
    }
    line += ' | '
  }
  console.log(line)
}
console.log('\n图例: ✗<0.5 | △0.5-1.0 | ○1.0-1.33 | ◎>1.33')

console.log('\n' + '='.repeat(120))
console.log('  最终修改建议汇总')
console.log('='.repeat(120))
console.log(`
1. LATE_ZONE_ENEMY_MULT 修改（useIdleSystem.js L1290-L1297）:
   ice_palace: 3.0 → 2.2
   immortal_ruins: 4.5 → 3.0
   chaos_realm: 8.0 → 4.5

2. BOSS 倍率修改（useIdleSystem.js）:
   BOSS_POWER_MULTIPLIER: 1.5 → 1.3
   BOSS_STRENGTH_MULT: 1.5 → 1.2

3. 变种 BOSS 倍率修改（useIdleSystem.js L1418, L1424）:
   xian: 1.3 → 1.2
   hundun: 1.5 → 1.3

4. 高级难度档 scale 修改（zones.js L17-L21）:
   lunhui: 4.00 → 3.50
   tianjie: 7.00 → 5.50
   tiandao: 12.00 → 9.00

5. 推荐统计同步调整（recommendedStats 自动随 scale 缩放，无需手动改）
`)
