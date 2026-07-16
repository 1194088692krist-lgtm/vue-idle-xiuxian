// ================== 宗派共鸣系统 ==================
// 模仿原神元素共鸣理念，设计宗派一致加成 + 宗派搭配加成

// 宗派定义（与 characterSchools 对齐）
export const schoolResonanceConfig = {
  // ---------- 同宗派团队加成 ----------
  // 队伍中同宗派人数达到 2/3 人时触发（出战最多3人）
  uniform: {
    sword: {
      name: '万剑归宗',
      desc: '剑宗弟子同心，剑气纵横',
      2: { attackPercent: 0.12, critRate: 0.06 },
      3: { attackPercent: 0.25, critRate: 0.12, critDamageBoost: 0.20 }
    },
    dao: {
      name: '道法自然',
      desc: '道宗弟子同修，万法不侵',
      2: { defensePercent: 0.12, healthPercent: 0.12 },
      3: { defensePercent: 0.25, healthPercent: 0.25, dodgeRate: 0.08 }
    },
    fire: {
      name: '焚天烈焰',
      desc: '火宗弟子齐聚，烈焰焚世',
      2: { attackPercent: 0.15, finalDamageBoost: 0.06 },
      3: { attackPercent: 0.30, finalDamageBoost: 0.12, critRate: 0.12, critDamageBoost: 0.15 }
    },
    ice: {
      name: '万里冰封',
      desc: '冰宗弟子同心，冰封千里',
      2: { defensePercent: 0.15, finalDamageReduce: 0.06 },
      3: { defensePercent: 0.30, finalDamageReduce: 0.12, critResist: 0.12, dodgeRate: 0.06 }
    },
    thunder: {
      name: '雷霆万钧',
      desc: '雷宗弟子同修，雷霆万钧',
      2: { speedPercent: 0.15, comboRate: 0.06 },
      3: { speedPercent: 0.30, comboRate: 0.12, critRate: 0.12, critDamageBoost: 0.12 }
    },
    poison: {
      name: '万毒噬心',
      desc: '毒宗弟子齐聚，万毒噬心',
      2: { attackPercent: 0.12, vampireRate: 0.06 },
      3: { attackPercent: 0.25, vampireRate: 0.12, finalDamageBoost: 0.08, critRate: 0.08 }
    },
    beast: {
      name: '万兽奔腾',
      desc: '兽宗弟子同心，万兽奔腾',
      2: { healthPercent: 0.20, defensePercent: 0.12 },
      3: { healthPercent: 0.40, defensePercent: 0.25, counterRate: 0.12, vampireRate: 0.06 }
    },
    ghost: {
      name: '九幽鬼域',
      desc: '鬼宗弟子同修，九幽降世',
      2: { critRate: 0.10, critDamageBoost: 0.12 },
      3: { critRate: 0.20, critDamageBoost: 0.25, dodgeRate: 0.08, finalDamageBoost: 0.08 }
    },
    light: {
      name: '圣光普照',
      desc: '光宗弟子齐聚，圣光普照',
      2: { healBoost: 0.20, healthPercent: 0.12 },
      3: { healBoost: 0.40, healthPercent: 0.25, defensePercent: 0.15, finalDamageReduce: 0.08 }
    },
    dark: {
      name: '永夜降临',
      desc: '暗宗弟子同心，永夜降临',
      2: { attackPercent: 0.12, speedPercent: 0.12 },
      3: { attackPercent: 0.25, speedPercent: 0.25, finalDamageBoost: 0.12, critRate: 0.10 }
    }
  },

  // ---------- 宗派搭配加成 ----------
  // 队伍中同时存在两种宗派时触发（每种至少1人）
  // 搭配加成与同宗派加成可同时生效
  combo: {
    'fire+thunder': {
      name: '雷霆烈焰',
      desc: '火雷交加，毁灭一切',
      effect: { attackPercent: 0.15, critRate: 0.10 }
    },
    'fire+ice': {
      name: '冰火两重天',
      desc: '冰火交融，攻守兼备',
      effect: { attackPercent: 0.10, defensePercent: 0.10, finalDamageBoost: 0.05, finalDamageReduce: 0.05 }
    },
    'fire+poison': {
      name: '毒火蔓延',
      desc: '毒火交织，蚀骨灼心',
      effect: { attackPercent: 0.10, vampireRate: 0.10, finalDamageBoost: 0.05 }
    },
    'ice+thunder': {
      name: '雷霆冰狱',
      desc: '雷冰共鸣，冻结雷霆',
      effect: { speedPercent: 0.10, comboRate: 0.10, defensePercent: 0.10 }
    },
    'light+dark': {
      name: '光暗交织',
      desc: '光暗平衡，阴阳调和',
      effect: { attackPercent: 0.10, healthPercent: 0.10, critRate: 0.05, finalDamageReduce: 0.05 }
    },
    'sword+dao': {
      name: '剑道合一',
      desc: '剑道同修，万法归一',
      effect: { attackPercent: 0.10, defensePercent: 0.10, critRate: 0.05 }
    },
    'beast+ghost': {
      name: '幽冥野性',
      desc: '兽鬼同心，野性幽冥',
      effect: { healthPercent: 0.15, critRate: 0.10, counterRate: 0.10 }
    },
    'sword+fire': {
      name: '烈焰剑心',
      desc: '剑心燃火，所向披靡',
      effect: { attackPercent: 0.20, critRate: 0.10 }
    },
    'sword+ice': {
      name: '寒霜剑意',
      desc: '剑意凝霜，无坚不摧',
      effect: { attackPercent: 0.10, defensePercent: 0.15, finalDamageReduce: 0.05 }
    },
    'dao+thunder': {
      name: '天雷道法',
      desc: '道法引雷，天威浩荡',
      effect: { speedPercent: 0.15, comboRate: 0.10, defensePercent: 0.05 }
    },
    'poison+dark': {
      name: '暗影毒刃',
      desc: '暗影淬毒，见血封喉',
      effect: { attackPercent: 0.15, speedPercent: 0.10, vampireRate: 0.05 }
    },
    'beast+light': {
      name: '圣兽庇护',
      desc: '圣光护兽，万法不侵',
      effect: { healthPercent: 0.20, defensePercent: 0.15, healBoost: 0.10 }
    },
    'ghost+dark': {
      name: '幽冥鬼域',
      desc: '鬼暗合一，九幽降临',
      effect: { critRate: 0.15, critDamageBoost: 0.15, finalDamageBoost: 0.05 }
    },
    'ice+poison': {
      name: '霜毒噬骨',
      desc: '霜毒交融，蚀骨销魂',
      effect: { attackPercent: 0.10, defensePercent: 0.10, vampireRate: 0.10 }
    },
    'thunder+poison': {
      name: '雷毒麻痹',
      desc: '雷毒共鸣，麻痹蚀心',
      effect: { speedPercent: 0.10, comboRate: 0.10, vampireRate: 0.10 }
    },
    'sword+beast': {
      name: '兽剑无双',
      desc: '兽力铸剑，无坚不摧',
      effect: { attackPercent: 0.15, healthPercent: 0.15, counterRate: 0.05 }
    },
    'dao+ice': {
      name: '玄冰道心',
      desc: '道心凝冰，万法不侵',
      effect: { defensePercent: 0.20, healthPercent: 0.10, finalDamageReduce: 0.05 }
    },
    'fire+light': {
      name: '圣火净化',
      desc: '圣火燃烧，净化邪祟',
      effect: { attackPercent: 0.10, healBoost: 0.15, finalDamageBoost: 0.05 }
    },
    'thunder+ghost': {
      name: '雷鬼夜行',
      desc: '雷霆鬼影，神出鬼没',
      effect: { speedPercent: 0.15, critRate: 0.10, dodgeRate: 0.05 }
    }
  }
}

// 计算队伍中宗派分布
export function getTeamSchoolDistribution(teamMembers) {
  const distribution = {}
  if (!teamMembers || !teamMembers.length) return distribution
  for (const member of teamMembers) {
    const school = member.school
    if (!school) continue
    distribution[school] = (distribution[school] || 0) + 1
  }
  return distribution
}

// 计算同宗派加成
export function getUniformResonance(teamMembers) {
  const distribution = getTeamSchoolDistribution(teamMembers)
  const bonuses = []
  for (const [school, count] of Object.entries(distribution)) {
    const config = schoolResonanceConfig.uniform[school]
    if (!config) continue
    // 取最大匹配等级（3 > 2），出战最多3人
    let level = 0
    if (count >= 3) level = 3
    else if (count >= 2) level = 2
    if (level > 0) {
      bonuses.push({
        school,
        name: config.name,
        desc: config.desc,
        level,
        effect: config[level]
      })
    }
  }
  return bonuses
}

// 计算宗派搭配加成
export function getComboResonance(teamMembers) {
  const distribution = getTeamSchoolDistribution(teamMembers)
  const schools = Object.keys(distribution)
  if (schools.length < 2) return []
  const bonuses = []
  const applied = new Set()
  for (let i = 0; i < schools.length; i++) {
    for (let j = i + 1; j < schools.length; j++) {
      const key1 = `${schools[i]}+${schools[j]}`
      const key2 = `${schools[j]}+${schools[i]}`
      if (applied.has(key1) || applied.has(key2)) continue
      const config = schoolResonanceConfig.combo[key1] || schoolResonanceConfig.combo[key2]
      if (config) {
        bonuses.push({
          schools: [schools[i], schools[j]],
          name: config.name,
          desc: config.desc,
          effect: config.effect
        })
        applied.add(key1)
      }
    }
  }
  return bonuses
}

// 合并所有加成效果
export function getAllResonanceEffects(teamMembers) {
  const uniform = getUniformResonance(teamMembers)
  const combo = getComboResonance(teamMembers)
  const merged = {
    attackPercent: 0,
    defensePercent: 0,
    healthPercent: 0,
    speedPercent: 0,
    critRate: 0,
    comboRate: 0,
    counterRate: 0,
    stunRate: 0,
    dodgeRate: 0,
    vampireRate: 0,
    critResist: 0,
    comboResist: 0,
    counterResist: 0,
    stunResist: 0,
    dodgeResist: 0,
    vampireResist: 0,
    healBoost: 0,
    critDamageBoost: 0,
    critDamageReduce: 0,
    finalDamageBoost: 0,
    finalDamageReduce: 0,
    combatBoost: 0,
    resistanceBoost: 0
  }
  // 合并同宗派加成
  for (const u of uniform) {
    for (const [key, value] of Object.entries(u.effect)) {
      if (merged[key] !== undefined && typeof value === 'number') {
        merged[key] += value
      }
    }
  }
  // 合并搭配加成
  for (const c of combo) {
    for (const [key, value] of Object.entries(c.effect)) {
      if (merged[key] !== undefined && typeof value === 'number') {
        merged[key] += value
      }
    }
  }
  return { uniform, combo, merged }
}

// 将共鸣效果应用到 CombatStats 格式的基础属性上
export function applyResonanceToCombatStats(baseStats, resonanceEffects) {
  if (!resonanceEffects) return baseStats
  const stats = { ...baseStats }
  const eff = resonanceEffects.merged || resonanceEffects
  // 百分比基础属性加成
  if (eff.attackPercent && stats.damage !== undefined) {
    stats.damage = (stats.damage || 0) * (1 + eff.attackPercent)
  }
  if (eff.defensePercent && stats.defense !== undefined) {
    stats.defense = (stats.defense || 0) * (1 + eff.defensePercent)
  }
  if (eff.healthPercent && stats.maxHealth !== undefined) {
    const bonus = (stats.maxHealth || 0) * eff.healthPercent
    stats.maxHealth = (stats.maxHealth || 0) + bonus
    stats.health = (stats.health || 0) + bonus
  }
  if (eff.speedPercent && stats.speed !== undefined) {
    stats.speed = (stats.speed || 0) * (1 + eff.speedPercent)
  }
  // 战斗属性加成
  const combatKeys = ['critRate', 'comboRate', 'counterRate', 'stunRate', 'dodgeRate', 'vampireRate']
  combatKeys.forEach(k => {
    if (eff[k] !== undefined && stats[k] !== undefined) {
      stats[k] = (stats[k] || 0) + eff[k]
    }
  })
  // 战斗抗性加成
  const resistKeys = ['critResist', 'comboResist', 'counterResist', 'stunResist', 'dodgeResist', 'vampireResist']
  resistKeys.forEach(k => {
    if (eff[k] !== undefined && stats[k] !== undefined) {
      stats[k] = (stats[k] || 0) + eff[k]
    }
  })
  // 特殊属性加成
  const specialKeys = ['healBoost', 'critDamageBoost', 'critDamageReduce', 'finalDamageBoost', 'finalDamageReduce', 'combatBoost', 'resistanceBoost']
  specialKeys.forEach(k => {
    if (eff[k] !== undefined && stats[k] !== undefined) {
      stats[k] = (stats[k] || 0) + eff[k]
    }
  })
  return stats
}

// 计算宗派加成对队伍战力的乘数加成
export function getResonanceBuildMultiplier(teamMembers) {
  const { merged } = getAllResonanceEffects(teamMembers)
  let multiplier = 1
  // 攻击/防御/生命/速度百分比转化为战力加成
  multiplier += (merged.attackPercent || 0) * 0.8
  multiplier += (merged.defensePercent || 0) * 0.5
  multiplier += (merged.healthPercent || 0) * 0.4
  multiplier += (merged.speedPercent || 0) * 0.3
  // 战斗属性转化为战力加成
  multiplier += (merged.critRate || 0) * 0.5
  multiplier += (merged.comboRate || 0) * 0.3
  multiplier += (merged.counterRate || 0) * 0.3
  multiplier += (merged.dodgeRate || 0) * 0.3
  multiplier += (merged.vampireRate || 0) * 0.3
  multiplier += (merged.stunRate || 0) * 0.2
  multiplier += (merged.critDamageBoost || 0) * 0.4
  multiplier += (merged.finalDamageBoost || 0) * 0.6
  multiplier += (merged.finalDamageReduce || 0) * 0.4
  multiplier += (merged.combatBoost || 0) * 0.5
  return Math.round(multiplier * 100) / 100
}

// 获取加成描述文本
export function getResonanceDesc(teamMembers) {
  const { uniform, combo } = getAllResonanceEffects(teamMembers)
  const parts = []
  for (const u of uniform) {
    parts.push(`${u.name}(${u.level}人): ${u.desc}`)
  }
  for (const c of combo) {
    parts.push(`${c.name}: ${c.desc}`)
  }
  return parts
}
