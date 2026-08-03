// 修仙游戏强度平衡分析
// 模拟不同配置下的玩家强度和怪物强度，输出对比表
// 运行: node scripts/balance/analyze.js

// ============== 玩家角色强度模型 ==============
const GROWTH_RATE = { attack: 0.025, health: 0.035, defense: 0.025, speed: 0.020 }
const BREAKTHROUGH_MULT = 1.2
const starConfig = {
  3: { multiplier: 1.0, growthRate: 1.0, talentValue: 100 },
  4: { multiplier: 1.5, growthRate: 1.2, talentValue: 150 },
  5: { multiplier: 2.5, growthRate: 1.5, talentValue: 225 }
}

// 5 星角色模板（参考太虚剑帝 char_041）
const STAR5_TEMPLATE = { attack: 50, health: 200, defense: 25, speed: 30 }
const talentStats = { attack: 0.15, critRate: 0.05 }  // 剑心通明

function generateLevel1Stats(template, star) {
  const mult = starConfig[star].multiplier
  return {
    attack: Math.floor(template.attack * mult),
    health: Math.floor(template.health * mult),
    defense: Math.floor(template.defense * mult),
    speed: Math.floor(template.speed * mult)
  }
}

function levelUpStats(stats, level, star) {
  const g = starConfig[star].growthRate
  let atk = stats.attack
  let hp = stats.health
  let def = stats.defense
  let spd = stats.speed
  for (let i = 1; i < level; i++) {
    atk = Math.round(atk * (1 + GROWTH_RATE.attack * g))
    hp = Math.round(hp * (1 + GROWTH_RATE.health * g))
    def = Math.round(def * (1 + GROWTH_RATE.defense * g))
    spd = Math.round(spd * (1 + GROWTH_RATE.speed * g))
  }
  return { attack: atk, health: hp, defense: def, speed: spd }
}

function applyBreakthrough(stats, times) {
  const mult = Math.pow(BREAKTHROUGH_MULT, times)
  return {
    attack: Math.floor(stats.attack * mult),
    health: Math.floor(stats.health * mult),
    defense: Math.floor(stats.defense * mult),
    speed: Math.floor(stats.speed * mult)
  }
}

function applyEffort(stats, effortValue, star) {
  const tv = starConfig[star].talentValue
  const m = 1 + effortValue / tv
  return {
    attack: Math.round(stats.attack * m),
    health: Math.round(stats.health * m),
    defense: Math.round(stats.defense * m),
    speed: Math.round(stats.speed * m)
  }
}

// ============== 装备强度模型 ==============
const RARITY_MULT = { common: 1, uncommon: 1.3, rare: 1.8, epic: 2.5, legendary: 4, mythic: 7 }
const ENHANCE_MULT = 1.2
const EXCLUSIVE_MULT = 1.3  // 化器成灵

// 装备基础属性（参考混沌界凶险档，recAtk=600000, recHp=1800000）
function generateEquipBase(recAtk, recHp, rarity) {
  const m = RARITY_MULT[rarity]
  return {
    attack: Math.floor(recAtk * 0.22 * m),
    health: Math.floor(recHp * 0.16 * m),
    defense: Math.floor(recAtk * 0.13 * m),
    speed: Math.floor(8 * m)
  }
}

function applyEnhance(stats, level) {
  const m = Math.pow(ENHANCE_MULT, level)
  return {
    attack: Math.floor(stats.attack * m),
    health: Math.floor(stats.health * m),
    defense: Math.floor(stats.defense * m),
    speed: Math.floor(stats.speed * m)
  }
}

// 12 槽装备总属性（假设全相同品质/强化）
function totalEquipStats(recAtk, recHp, rarity, enhanceLevel, slots = 12, exclusive = false) {
  let total = { attack: 0, health: 0, defense: 0, speed: 0 }
  for (let i = 0; i < slots; i++) {
    let base = generateEquipBase(recAtk, recHp, rarity)
    let enhanced = applyEnhance(base, enhanceLevel)
    if (exclusive) {
      enhanced = {
        attack: Math.floor(enhanced.attack * EXCLUSIVE_MULT),
        health: Math.floor(enhanced.health * EXCLUSIVE_MULT),
        defense: Math.floor(enhanced.defense * EXCLUSIVE_MULT),
        speed: Math.floor(enhanced.speed * EXCLUSIVE_MULT)
      }
    }
    total.attack += enhanced.attack
    total.health += enhanced.health
    total.defense += enhanced.defense
    total.speed += enhanced.speed
  }
  return total
}

// ============== 灵宠强度模型 ==============
const PET_QUALITY = {
  mortal:    { baseBonus: 0.03, mult: 1.2 },
  spiritual: { baseBonus: 0.06, mult: 1.4 },
  mystic:    { baseBonus: 0.09, mult: 1.6 },
  celestial: { baseBonus: 0.12, mult: 1.8 },
  divine:    { baseBonus: 0.15, mult: 2.0 }
}

function computePetMultiplier(rarity, star, level) {
  const q = PET_QUALITY[rarity]
  const starGrowth = 0.01 * q.mult
  const levelGrowth = 0.02 * q.mult
  const starM = Math.pow(1 + starGrowth, star)
  const levelM = Math.pow(1 + levelGrowth, level - 1)
  return 1 + q.baseBonus + (starM * levelM - 1)
}

// ============== Build 强度计算（简化版 player.js L4295） ==============
function calculateBuildStrength(charBase, equipTotal, petMult, level, slots12 = true) {
  const ts = talentStats
  // 主属性得分（权重 v2）
  const charBaseScore =
    (charBase.attack + ts.attack * charBase.attack) * 8 +
    (charBase.health + ts.health * charBase.health || charBase.health * 0.8) * 0.8 +
    charBase.defense * 5 +
    charBase.speed * 12

  // 装备评分（简化：每件 baseScore × rarityMult × enhanceMult，12 槽）
  const equipScore = equipTotal.attack * 5 + equipTotal.health * 0.5 + equipTotal.defense * 3 + equipTotal.speed * 8

  // 灵宠评分：扁平 + 百分比倍率
  const petScore = (charBaseScore + equipScore) * (petMult - 1)

  // 人物 55% / 装备 45%
  const characterPower = charBaseScore + petScore * 0.5
  const equipmentPower = equipScore
  const totalPower = characterPower * 0.55 + equipmentPower * 0.45
  const levelMult = 1 + (level - 1) * 0.02
  return Math.round(totalPower * levelMult)
}

// ============== 怪物强度模型 ==============
const LATE_ZONE_ENEMY_MULT = {
  ice_palace: 3.0,
  immortal_ruins: 4.5,
  chaos_realm: 8.0
}
const BOSS_POWER_MULTIPLIER = 1.5
const BOSS_STRENGTH_MULT = 1.5
const DIFFICULTY_SCALE = {
  youli: 0.30, shilian: 0.60, xiongxian: 1.00, juejing: 1.60, mieshi: 2.50,
  lunhui: 4.00, tianjie: 7.00, tiandao: 12.00
}

// 秘境 BOSS 基础 stats
const ZONE_BOSSES = {
  ice_palace: {
    recAtk: 30000, recHp: 90000,
    bosses: [
      { id: 'ice_boss_1', name: '冰凰', stats: { attack: 90000, health: 750000, defense: 22000, speed: 30 } },
      { id: 'ice_boss_2', name: '冰封古魔', stats: { attack: 110000, health: 900000, defense: 28000, speed: 25 } },
      { id: 'ice_boss_3', name: '玄冰祖龙', stats: { attack: 130000, health: 1100000, defense: 35000, speed: 22 } }
    ]
  },
  immortal_ruins: {
    recAtk: 90000, recHp: 270000,
    bosses: [
      { id: 'immortal_boss_1', name: '仙墟守护者', stats: { attack: 300000, health: 3000000, defense: 65000, speed: 35 } },
      { id: 'immortal_boss_2', name: '堕落仙君', stats: { attack: 350000, health: 3500000, defense: 80000, speed: 28 } },
      { id: 'immortal_boss_3', name: '太古仙人', stats: { attack: 420000, health: 4200000, defense: 95000, speed: 32 } }
    ]
  },
  chaos_realm: {
    recAtk: 600000, recHp: 1800000,
    bosses: [
      { id: 'chaos_boss_1', name: '混沌主宰', stats: { attack: 2000000, health: 20000000, defense: 400000, speed: 40 } },
      { id: 'chaos_boss_2', name: '天道化身', stats: { attack: 2500000, health: 25000000, defense: 500000, speed: 50 } },
      { id: 'chaos_boss_3', name: '原始混沌', stats: { attack: 3200000, health: 32000000, defense: 650000, speed: 45 } }
    ]
  }
}

function calcBossStats(boss, zoneId, diffKey, variantMult = 1) {
  const scale = DIFFICULTY_SCALE[diffKey]
  const lateMult = LATE_ZONE_ENEMY_MULT[zoneId]
  const totalBossMult = BOSS_POWER_MULTIPLIER * lateMult
  const recHp = ZONE_BOSSES[zoneId].recHp
  const bossAtkLateFactor = 1 + (lateMult - 1) * 0.3

  let hp = Math.floor(boss.stats.health * scale * totalBossMult)
  let def = Math.floor(boss.stats.defense * scale * totalBossMult)
  let atk = Math.floor(recHp * 0.22 * bossAtkLateFactor * scale)
  let spd = Math.floor(boss.stats.speed * 1.5 * Math.sqrt(lateMult))

  // BOSS_STRENGTH_MULT 1.5
  hp = Math.floor(hp * BOSS_STRENGTH_MULT)
  def = Math.floor(def * BOSS_STRENGTH_MULT)
  atk = Math.floor(atk * BOSS_STRENGTH_MULT)

  // 变种倍率
  hp = Math.floor(hp * variantMult)
  def = Math.floor(def * variantMult)
  atk = Math.floor(atk * variantMult)
  spd = Math.floor(spd * variantMult)

  return { attack: atk, health: hp, defense: def, speed: spd }
}

// ============== 玩家配置预设 ==============
// 6 个测试档位，模拟玩家不同进度阶段
const PLAYER_PROFILES = [
  {
    name: '冰雪宫入门',
    star: 5, level: 40, breakthrough: 2, effortValue: 50,
    equipRarity: 'legendary', equipEnhance: 8, slots: 12, exclusive: false, exclusiveSlots: 0,
    petRarity: 'celestial', petStar: 5, petLevel: 15,
    cultivatePills: 0,  // 大培元丹使用次数
    desc: '5星40级2破/传说+8/仙品灵宠'
  },
  {
    name: '冰雪宫毕业',
    star: 5, level: 60, breakthrough: 4, effortValue: 100,
    equipRarity: 'mythic', equipEnhance: 10, slots: 12, exclusive: false, exclusiveSlots: 0,
    petRarity: 'celestial', petStar: 8, petLevel: 25,
    cultivatePills: 3,
    desc: '5星60级4破/神品+10/仙品灵宠8星'
  },
  {
    name: '仙墟入门',
    star: 5, level: 70, breakthrough: 5, effortValue: 150,
    equipRarity: 'mythic', equipEnhance: 11, slots: 12, exclusive: true, exclusiveSlots: 3,
    petRarity: 'divine', petStar: 5, petLevel: 20,
    cultivatePills: 5,
    desc: '5星70级5破/神品+11/3件化器成灵/神品灵宠'
  },
  {
    name: '仙墟毕业',
    star: 5, level: 80, breakthrough: 5, effortValue: 200,
    equipRarity: 'mythic', equipEnhance: 12, slots: 12, exclusive: true, exclusiveSlots: 6,
    petRarity: 'divine', petStar: 8, petLevel: 30,
    cultivatePills: 8,
    desc: '5星80级5破/神品+12/6件化器成灵/神品8星灵宠'
  },
  {
    name: '混沌界入门',
    star: 5, level: 85, breakthrough: 5, effortValue: 250,
    equipRarity: 'mythic', equipEnhance: 13, slots: 12, exclusive: true, exclusiveSlots: 6,
    petRarity: 'divine', petStar: 10, petLevel: 35,
    cultivatePills: 10,
    desc: '5星85级5破/神品+13(专属)/6件化器成灵/神品10星灵宠'
  },
  {
    name: '终局极限',
    star: 5, level: 100, breakthrough: 5, effortValue: 300,
    equipRarity: 'mythic', equipEnhance: 15, slots: 12, exclusive: true, exclusiveSlots: 6,
    petRarity: 'divine', petStar: 10, petLevel: 40,
    cultivatePills: 15,
    desc: '5星100级5破/神品+15(专属)/6件化器成灵/神品10星40级灵宠'
  }
]

function calcPlayerProfile(p) {
  // 1. 基础属性
  let base = generateLevel1Stats(STAR5_TEMPLATE, p.star)
  base = levelUpStats(base, p.level, p.star)
  base = applyBreakthrough(base, p.breakthrough)

  // 丹药 effort 加成（大培元丹每次 +3 effort）
  const totalEffort = p.effortValue + p.cultivatePills * 3
  base = applyEffort(base, totalEffort, p.star)

  // 2. 装备总属性（混沌界 recAtk 作为基准）
  const recAtk = 600000, recHp = 1800000
  const normalSlots = p.slots - p.exclusiveSlots
  let equipTotal = { attack: 0, health: 0, defense: 0, speed: 0 }
  if (normalSlots > 0) {
    const normal = totalEquipStats(recAtk, recHp, p.equipRarity, p.equipEnhance, normalSlots, false)
    equipTotal.attack += normal.attack
    equipTotal.health += normal.health
    equipTotal.defense += normal.defense
    equipTotal.speed += normal.speed
  }
  if (p.exclusiveSlots > 0) {
    const excl = totalEquipStats(recAtk, recHp, p.equipRarity, p.equipEnhance, p.exclusiveSlots, true)
    equipTotal.attack += excl.attack
    equipTotal.health += excl.health
    equipTotal.defense += excl.defense
    equipTotal.speed += excl.speed
  }

  // 3. 灵宠倍率
  const petMult = computePetMultiplier(p.petRarity, p.petStar, p.petLevel)

  // 4. Build 强度
  const build = calculateBuildStrength(base, equipTotal, petMult, p.level)

  // 5. 队伍总 Build（3 人 + 宗派共鸣 1.5）
  const teamBuild = Math.round(build * 3 * 1.5)

  return {
    profile: p.name,
    desc: p.desc,
    charBase: base,
    equipTotal,
    petMult: petMult.toFixed(3),
    singleBuild: build,
    teamBuild: teamBuild,
    level: p.level
  }
}

// ============== 主程序：输出对比表 ==============
function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

function fmtAtk(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(n)
}

console.log('\n' + '='.repeat(120))
console.log('  修仙游戏平衡性分析 — 最后三张图（冰雪宫 / 仙墟 / 混沌界）')
console.log('='.repeat(120))

// === 表 1：玩家配置档位 ===
console.log('\n【表 1】玩家测试档位（6 个进度阶段）\n')
console.log('档位'.padEnd(16) + '描述'.padEnd(50) + 'Build/单'.padStart(12) + 'Build/队'.padStart(14))
console.log('-'.repeat(92))
const playerResults = PLAYER_PROFILES.map(calcPlayerProfile)
for (const r of playerResults) {
  console.log(
    r.profile.padEnd(16) +
    r.desc.padEnd(50) +
    fmt(r.singleBuild).padStart(12) +
    fmt(r.teamBuild).padStart(14)
  )
}

// === 表 2：每张图每个难度的怪物 BOSS 强度 ===
console.log('\n\n【表 2】各秘境 BOSS 强度（普通/变种对比玩家队伍 Build）\n')

const zones = [
  { id: 'ice_palace', name: '冰雪宫', buildBase: 6000000 },
  { id: 'immortal_ruins', name: '仙墟', buildBase: 18000000 },
  { id: 'chaos_realm', name: '混沌界', buildBase: 120000000 }
]
const diffs = [
  { key: 'youli', label: '游历', scale: 0.30 },
  { key: 'shilian', label: '试炼', scale: 0.60 },
  { key: 'xiongxian', label: '凶险', scale: 1.00 },
  { key: 'juejing', label: '绝境', scale: 1.60 },
  { key: 'mieshi', label: '灭世', scale: 2.50 },
  { key: 'lunhui', label: '轮回', scale: 4.00 },
  { key: 'tianjie', label: '天劫', scale: 7.00 },
  { key: 'tiandao', label: '天道', scale: 12.00 }
]

for (const zone of zones) {
  console.log('\n--- ' + zone.name + ' (' + zone.id + ') ---')
  console.log(
    '难度'.padEnd(8) +
    'BOSS'.padEnd(14) +
    '攻击'.padStart(14) +
    '生命'.padStart(14) +
    '防御'.padStart(14) +
    '变种×1.3攻'.padStart(14) +
    '变种×1.5攻'.padStart(14) +
    '推荐Build'.padStart(14)
  )
  console.log('-'.repeat(116))
  const zoneData = ZONE_BOSSES[zone.id]
  for (const diff of diffs) {
    const recBuild = Math.floor(zone.buildBase * diff.scale)
    for (const boss of zoneData.bosses) {
      const normal = calcBossStats(boss, zone.id, diff.key, 1)
      const xian = calcBossStats(boss, zone.id, diff.key, 1.3)
      const hundun = calcBossStats(boss, zone.id, diff.key, 1.5)
      console.log(
        diff.label.padEnd(8) +
        boss.name.padEnd(14) +
        fmtAtk(normal.attack).padStart(14) +
        fmtAtk(normal.health).padStart(14) +
        fmtAtk(normal.defense).padStart(14) +
        fmtAtk(xian.attack).padStart(14) +
        fmtAtk(hundun.attack).padStart(14) +
        fmt(recBuild).padStart(14)
      )
    }
  }
}

// === 表 3：玩家队伍 Build vs 怪物推荐 Build 对比（胜率估算） ===
console.log('\n\n\n【表 3】玩家队伍 Build vs 推荐建度（胜率估算 ratio = team/rec）\n')
console.log(
  '玩家档位'.padEnd(16) +
  '队伍Build'.padStart(14) +
  '|'.padEnd(4) +
  '冰雪宫·灭世'.padStart(14) +
  '冰雪宫·轮回'.padStart(14) +
  '冰雪宫·天劫'.padStart(14) +
  '冰雪宫·天道'.padStart(14) +
  '|'.padEnd(4) +
  '仙墟·灭世'.padStart(12) +
  '仙墟·轮回'.padStart(12) +
  '仙墟·天劫'.padStart(12) +
  '仙墟·天道'.padStart(12) +
  '|'.padEnd(4) +
  '混沌·灭世'.padStart(12) +
  '混沌·轮回'.padStart(12) +
  '混沌·天劫'.padStart(12) +
  '混沌·天道'.padStart(12)
)
console.log('-'.repeat(220))

for (const r of playerResults) {
  let line = r.profile.padEnd(16) + fmt(r.teamBuild).padStart(14) + ' | '.padEnd(4)
  for (const zone of zones) {
    for (const dk of ['mieshi', 'lunhui', 'tianjie', 'tiandao']) {
      const recBuild = Math.floor(zone.buildBase * DIFFICULTY_SCALE[dk])
      const ratio = r.teamBuild / recBuild
      // 胜率估算
      let win = 0.5 + (ratio - 1) * 0.4
      win = Math.max(0.05, Math.min(0.97, win))
      const tag = ratio < 0.5 ? '✗' : ratio < 1.0 ? '△' : ratio < 1.33 ? '○' : '◎'
      line += (tag + fmt(ratio)).padStart(14)
    }
    line += ' | '.padEnd(4)
  }
  console.log(line)
}

console.log('\n图例: ✗<0.5(碾压被秒) | △0.5-1.0(艰难) | ○1.0-1.33(可战) | ◎>1.33(稳定挂机)')
console.log('注: 胜率 = 0.5 + (ratio-1)×0.4，clamp 0.05~0.97；实际胜率还受 atkRatio/hpRatio 修正')

// === 表 4：怪物 HP 对比玩家攻击（击杀回合数估算） ===
console.log('\n\n【表 4】击杀回合数估算（BOSS HP / 玩家队伍攻击×3）\n')
console.log(
  '玩家档位'.padEnd(16) +
  '队伍攻击'.padStart(14) +
  '|'.padEnd(4) +
  '冰雪·玄冰祖龙'.padStart(16) +
  '冰雪·祖龙×仙'.padStart(16) +
  '冰雪·祖龙×混沌'.padStart(16) +
  '|'.padEnd(4) +
  '仙墟·太古仙人'.padStart(16) +
  '仙墟·太古×仙'.padStart(16) +
  '仙墟·太古×混沌'.padStart(16) +
  '|'.padEnd(4) +
  '混沌·原始混沌'.padStart(16) +
  '混沌·原始×仙'.padStart(16) +
  '混沌·原始×混沌'.padStart(16)
)
console.log('-'.repeat(220))

// 用天道档 BOSS
const tiandaoBosses = []
for (const zone of zones) {
  const z = ZONE_BOSSES[zone.id]
  const boss3 = z.bosses[2]  // 每图第3个 BOSS
  const normal = calcBossStats(boss3, zone.id, 'tiandao', 1)
  const xian = calcBossStats(boss3, zone.id, 'tiandao', 1.3)
  const hundun = calcBossStats(boss3, zone.id, 'tiandao', 1.5)
  tiandaoBosses.push({ normal, xian, hundun })
}

for (const r of playerResults) {
  // 队伍攻击 = 角色攻击 × 3（含装备）
  const charAtk = r.charBase.attack
  const equipAtk = r.equipTotal.attack
  const totalAtk = (charAtk + equipAtk) * 3
  let line = r.profile.padEnd(16) + fmtAtk(totalAtk).padStart(14) + ' | '.padEnd(4)
  for (let zi = 0; zi < 3; zi++) {
    const b = tiandaoBosses[zi]
    const roundsNormal = Math.ceil(b.normal.health / totalAtk)
    const roundsXian = Math.ceil(b.xian.health / totalAtk)
    const roundsHundun = Math.ceil(b.hundun.health / totalAtk)
    line += (roundsNormal + '回合').padStart(16) + (roundsXian + '回合').padStart(16) + (roundsHundun + '回合').padStart(16) + ' | '.padEnd(4)
  }
  console.log(line)
}

console.log('\n注: 回合数 = BOSS总HP / (角色攻击+装备攻击)×3，未计防御/暴击/技能；超过 30 回合基本无法击杀')
console.log('    变种×1.3/×1.5 是在普通 BOSS 基础上再乘变种倍率')
