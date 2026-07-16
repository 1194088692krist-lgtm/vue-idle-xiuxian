// 装备Build系统：词条、套装、评分

const rarityConfig = {
  common: { name: '凡品', color: '#808080', affixCount: [0, 0], scoreMultiplier: 1 },
  uncommon: { name: '良品', color: '#32CD32', affixCount: [0, 1], scoreMultiplier: 1.5 },
  rare: { name: '上品', color: '#1E90FF', affixCount: [1, 2], scoreMultiplier: 2 },
  epic: { name: '极品', color: '#9932CC', affixCount: [2, 3], scoreMultiplier: 3.5 },
  legendary: { name: '仙品', color: '#FFD700', affixCount: [3, 4], scoreMultiplier: 6 },
  mythic: { name: '神品', color: '#FF4500', affixCount: [4, 5], scoreMultiplier: 10 }
}

const affixPool = [
  { id: 'sharp_blade', name: '利刃', stat: 'attack', valueType: 'flat', baseRange: [5, 15], tier: 1, slots: ['weapon', 'hands', 'wrist', 'ring1', 'artifact'] },
  { id: 'mighty_strike', name: '重击', stat: 'attack', valueType: 'percent', baseRange: [0.03, 0.08], tier: 2, slots: ['weapon', 'hands', 'ring1', 'artifact'] },
  { id: 'critical_eye', name: '鹰眼', stat: 'critRate', valueType: 'percent', baseRange: [0.02, 0.05], tier: 2, slots: ['weapon', 'hands', 'ring1', 'head', 'necklace'] },
  { id: 'fierce_crit', name: '暴击', stat: 'critDamageBoost', valueType: 'percent', baseRange: [0.05, 0.15], tier: 2, slots: ['weapon', 'ring1', 'hands'] },
  { id: 'rapid_strike', name: '连击', stat: 'comboRate', valueType: 'percent', baseRange: [0.02, 0.06], tier: 2, slots: ['weapon', 'hands', 'artifact'] },
  { id: 'vampiric', name: '吸血', stat: 'vampireRate', valueType: 'percent', baseRange: [0.02, 0.05], tier: 2, slots: ['weapon', 'wrist', 'ring1'] },
  { id: 'counter_stance', name: '反击', stat: 'counterRate', valueType: 'percent', baseRange: [0.02, 0.05], tier: 2, slots: ['shoulder', 'wrist', 'body'] },
  { id: 'stun_strike', name: '眩晕', stat: 'stunRate', valueType: 'percent', baseRange: [0.01, 0.04], tier: 2, slots: ['weapon', 'hands', 'head'] },
  { id: 'agile', name: '敏捷', stat: 'dodgeRate', valueType: 'percent', baseRange: [0.02, 0.06], tier: 2, slots: ['feet', 'legs', 'ring2'] },
  { id: 'iron_skin', name: '铁壁', stat: 'defense', valueType: 'flat', baseRange: [3, 10], tier: 1, slots: ['head', 'body', 'legs', 'feet', 'shoulder', 'ring2', 'belt'] },
  { id: 'tough_hide', name: '坚韧', stat: 'defense', valueType: 'percent', baseRange: [0.03, 0.08], tier: 2, slots: ['body', 'belt', 'shoulder'] },
  { id: 'vitality', name: '活力', stat: 'health', valueType: 'flat', baseRange: [30, 80], tier: 1, slots: ['head', 'body', 'necklace', 'belt', 'ring2'] },
  { id: 'life_force', name: '生命', stat: 'health', valueType: 'percent', baseRange: [0.03, 0.08], tier: 2, slots: ['body', 'belt', 'necklace'] },
  { id: 'swift_feet', name: '迅捷', stat: 'speed', valueType: 'flat', baseRange: [2, 6], tier: 1, slots: ['feet', 'legs'] },
  { id: 'haste', name: '急速', stat: 'speed', valueType: 'percent', baseRange: [0.03, 0.08], tier: 2, slots: ['feet', 'legs', 'hands'] },
  { id: 'healing_touch', name: '治疗', stat: 'healBoost', valueType: 'percent', baseRange: [0.03, 0.1], tier: 2, slots: ['necklace', 'ring2', 'wrist'] },
  { id: 'damage_amp', name: '增伤', stat: 'finalDamageBoost', valueType: 'percent', baseRange: [0.02, 0.06], tier: 3, slots: ['ring1', 'weapon', 'artifact'] },
  { id: 'damage_reduce', name: '减伤', stat: 'finalDamageReduce', valueType: 'percent', baseRange: [0.02, 0.06], tier: 3, slots: ['ring2', 'body', 'belt'] },
  { id: 'combat_boost', name: '战意', stat: 'combatBoost', valueType: 'percent', baseRange: [0.02, 0.05], tier: 3, slots: ['belt', 'shoulder', 'artifact'] },
  { id: 'resistance_boost', name: '抗性', stat: 'resistanceBoost', valueType: 'percent', baseRange: [0.02, 0.05], tier: 3, slots: ['belt', 'head', 'ring2'] },
  { id: 'spirit_channel', name: '灵力', stat: 'spiritRate', valueType: 'percent', baseRange: [0.05, 0.15], tier: 2, slots: ['necklace', 'ring2', 'head'] },
  { id: 'cultivation_focus', name: '悟道', stat: 'cultivationRate', valueType: 'percent', baseRange: [0.05, 0.15], tier: 2, slots: ['necklace', 'head', 'body'] },
  { id: 'crit_resist', name: '抗暴', stat: 'critResist', valueType: 'percent', baseRange: [0.02, 0.05], tier: 2, slots: ['head', 'body', 'ring2'] },
  { id: 'combo_resist', name: '抗连', stat: 'comboResist', valueType: 'percent', baseRange: [0.02, 0.05], tier: 2, slots: ['shoulder', 'body', 'belt'] },
  { id: 'dodge_resist', name: '命击', stat: 'dodgeResist', valueType: 'percent', baseRange: [0.02, 0.05], tier: 2, slots: ['weapon', 'hands', 'ring1'] },
  { id: 'stun_resist', name: '抗晕', stat: 'stunResist', valueType: 'percent', baseRange: [0.02, 0.05], tier: 2, slots: ['head', 'necklace', 'shoulder'] },
  { id: 'vampire_resist', name: '抗吸血', stat: 'vampireResist', valueType: 'percent', baseRange: [0.02, 0.05], tier: 2, slots: ['body', 'ring2', 'belt'] },
  { id: 'counter_resist', name: '抗反击', stat: 'counterResist', valueType: 'percent', baseRange: [0.02, 0.05], tier: 2, slots: ['wrist', 'body', 'legs'] }
]

const setBonuses = [
  {
    id: 'flame_blade',
    name: '烈焰刃',
    description: '火系攻击套装，以灼烧之力焚尽敌人',
    pieces: ['weapon', 'hands', 'ring1'],
    color: '#FF4500',
    bonus2: { stat: 'attack', value: 0.1, valueType: 'percent', label: '2件套：攻击+10%' },
    bonus3: { stat: 'critDamageBoost', value: 0.2, valueType: 'percent', label: '3件套：暴击伤害+20%' }
  },
  {
    id: 'iron_guardian',
    name: '玄铁卫',
    description: '防御套装，铜墙铁壁坚不可摧',
    pieces: ['head', 'body', 'belt', 'ring2'],
    color: '#708090',
    bonus2: { stat: 'defense', value: 0.15, valueType: 'percent', label: '2件套：防御+15%' },
    bonus3: { stat: 'health', value: 0.1, valueType: 'percent', label: '3件套：生命+10%' },
    bonus4: { stat: 'finalDamageReduce', value: 0.1, valueType: 'percent', label: '4件套：最终减伤+10%' }
  },
  {
    id: 'swift_shadow',
    name: '疾风影',
    description: '速度与闪避套装，以快取胜',
    pieces: ['feet', 'legs', 'wrist'],
    color: '#00CED1',
    bonus2: { stat: 'speed', value: 0.15, valueType: 'percent', label: '2件套：速度+15%' },
    bonus3: { stat: 'dodgeRate', value: 0.1, valueType: 'percent', label: '3件套：闪避率+10%' }
  },
  {
    id: 'blood_fang',
    name: '血牙',
    description: '吸血连击套装，越战越勇',
    pieces: ['weapon', 'wrist', 'ring1', 'hands'],
    color: '#DC143C',
    bonus2: { stat: 'vampireRate', value: 0.08, valueType: 'percent', label: '2件套：吸血率+8%' },
    bonus3: { stat: 'comboRate', value: 0.1, valueType: 'percent', label: '3件套：连击率+10%' },
    bonus4: { stat: 'finalDamageBoost', value: 0.12, valueType: 'percent', label: '4件套：最终增伤+12%' }
  },
  {
    id: 'thunder_strike',
    name: '雷霆击',
    description: '眩晕暴击套装，一击制敌',
    pieces: ['weapon', 'head', 'hands', 'artifact'],
    color: '#FFD700',
    bonus2: { stat: 'stunRate', value: 0.06, valueType: 'percent', label: '2件套：眩晕率+6%' },
    bonus3: { stat: 'critRate', value: 0.08, valueType: 'percent', label: '3件套：暴击率+8%' },
    bonus4: { stat: 'critDamageBoost', value: 0.25, valueType: 'percent', label: '4件套：暴击伤害+25%' }
  },
  {
    id: 'immortal_body',
    name: '不灭体',
    description: '生命恢复套装，长生不死',
    pieces: ['body', 'necklace', 'belt', 'head'],
    color: '#32CD32',
    bonus2: { stat: 'health', value: 0.2, valueType: 'percent', label: '2件套：生命+20%' },
    bonus3: { stat: 'healBoost', value: 0.3, valueType: 'percent', label: '3件套：治疗效果+30%' },
    bonus4: { stat: 'finalDamageReduce', value: 0.15, valueType: 'percent', label: '4件套：最终减伤+15%' }
  },
  {
    id: 'counter_attack',
    name: '反击道',
    description: '反击防御套装，后发制人',
    pieces: ['shoulder', 'wrist', 'body', 'ring2'],
    color: '#8B4513',
    bonus2: { stat: 'counterRate', value: 0.1, valueType: 'percent', label: '2件套：反击率+10%' },
    bonus3: { stat: 'defense', value: 0.12, valueType: 'percent', label: '3件套：防御+12%' },
    bonus4: { stat: 'counterRate', value: 0.1, valueType: 'percent', label: '4件套：反击率再+10%' }
  },
  {
    id: 'spirit_essence',
    name: '灵气髓',
    description: '修炼加速套装，道法自然',
    pieces: ['necklace', 'head', 'ring2'],
    color: '#9370DB',
    bonus2: { stat: 'spiritRate', value: 0.2, valueType: 'percent', label: '2件套：灵力获取+20%' },
    bonus3: { stat: 'cultivationRate', value: 0.2, valueType: 'percent', label: '3件套：修炼效率+20%' }
  },
  {
    id: 'combat_king',
    name: '战斗王',
    description: '全能战斗套装，战无不胜',
    pieces: ['weapon', 'body', 'ring1', 'ring2', 'artifact'],
    color: '#FF69B4',
    bonus2: { stat: 'combatBoost', value: 0.05, valueType: 'percent', label: '2件套：战斗属性+5%' },
    bonus3: { stat: 'resistanceBoost', value: 0.05, valueType: 'percent', label: '3件套：战斗抗性+5%' },
    bonus4: { stat: 'finalDamageBoost', value: 0.15, valueType: 'percent', label: '4件套：最终增伤+15%' },
    bonus5: { stat: 'finalDamageReduce', value: 0.15, valueType: 'percent', label: '5件套：最终减伤+15%' }
  },
  {
    id: 'dao_immortal',
    name: '道仙尊',
    description: '传说级套装，道法通天',
    pieces: ['weapon', 'head', 'body', 'feet', 'artifact'],
    color: '#FFD700',
    bonus2: { stat: 'attack', value: 0.1, valueType: 'percent', label: '2件套：攻击+10%' },
    bonus3: { stat: 'health', value: 0.15, valueType: 'percent', label: '3件套：生命+15%' },
    bonus4: { stat: 'critRate', value: 0.1, valueType: 'percent', label: '4件套：暴击率+10%' },
    bonus5: { stat: 'finalDamageBoost', value: 0.2, valueType: 'percent', label: '5件套：最终增伤+20%' }
  }
]

const affixTierMultiplier = { 1: 1, 2: 1.5, 3: 2.5 }

function getAffixesForSlot(slot, rarity) {
  const config = rarityConfig[rarity] || rarityConfig.common
  const [min, max] = config.affixCount
  const count = Math.floor(Math.random() * (max - min + 1)) + min
  if (count === 0) return []
  const available = affixPool.filter(a => a.slots.includes(slot))
  const result = []
  const used = new Set()
  for (let i = 0; i < count && available.length > 0; i++) {
    const filtered = available.filter(a => !used.has(a.id))
    if (filtered.length === 0) break
    const weighted = []
    filtered.forEach(a => {
      const weight = a.tier === 1 ? 5 : a.tier === 2 ? 3 : 1
      for (let w = 0; w < weight; w++) weighted.push(a)
    })
    const affix = weighted[Math.floor(Math.random() * weighted.length)]
    used.add(affix.id)
    const [minVal, maxVal] = affix.baseRange
    const value = minVal + Math.random() * (maxVal - minVal)
    const roundedValue = affix.valueType === 'percent' ? Math.round(value * 1000) / 1000 : Math.round(value)
    result.push({
      id: affix.id,
      name: affix.name,
      stat: affix.stat,
      value: roundedValue,
      valueType: affix.valueType,
      tier: affix.tier
    })
  }
  return result
}

function getAffixValue(affix, baseStatValue = 0) {
  if (affix.valueType === 'flat') return affix.value
  return baseStatValue * affix.value
}

function calculateEquipmentScore(equipment) {
  if (!equipment) return 0
  const rarity = equipment.rarity || 'common'
  const mult = rarityConfig[rarity]?.scoreMultiplier || 1
  let baseScore = 0
  if (equipment.stats) {
    Object.entries(equipment.stats).forEach(([stat, value]) => {
      const statScore = getStatScore(stat, value)
      baseScore += statScore
    })
  }
  let affixScore = 0
  if (equipment.affixes && equipment.affixes.length > 0) {
    equipment.affixes.forEach(affix => {
      const tierMult = affixTierMultiplier[affix.tier] || 1
      const statScore = getStatScore(affix.stat, affix.value, affix.valueType === 'percent')
      affixScore += statScore * tierMult
    })
  }
  const enhanceLevel = equipment.enhanceLevel || 0
  const enhanceMult = Math.pow(1.2, enhanceLevel)
  let setBonusScore = 0
  if (equipment.setId) {
    setBonusScore += 50
  }
  const totalScore = Math.round((baseScore + affixScore + setBonusScore) * mult * enhanceMult)
  return totalScore
}

function getStatScore(stat, value, isPercent = false) {
  const highValueStats = ['health', 'spiritRate', 'cultivationRate']
  const attackStats = ['attack', 'critRate', 'critDamageBoost', 'comboRate', 'vampireRate', 'stunRate', 'finalDamageBoost', 'combatBoost']
  const defenseStats = ['defense', 'dodgeRate', 'counterRate', 'healBoost', 'finalDamageReduce', 'resistanceBoost', 'critResist', 'comboResist', 'dodgeResist', 'stunResist', 'vampireResist', 'counterResist']
  if (stat === 'health') return isPercent ? value * 200 : value * 0.5
  if (stat === 'attack') return isPercent ? value * 200 : value * 5
  if (stat === 'defense') return isPercent ? value * 180 : value * 3
  if (stat === 'speed') return isPercent ? value * 150 : value * 8
  if (attackStats.includes(stat)) return value * 300
  if (defenseStats.includes(stat)) return value * 250
  if (highValueStats.includes(stat)) return value * 100
  return value * 10
}

function calculateBuildStrength(equippedArtifacts) {
  let totalScore = 0
  let setCount = {}
  Object.values(equippedArtifacts).forEach(equip => {
    if (equip) {
      totalScore += calculateEquipmentScore(equip)
      if (equip.setId) {
        setCount[equip.setId] = (setCount[equip.setId] || 0) + 1
      }
    }
  })
  let setBonusScore = 0
  Object.entries(setCount).forEach(([setId, count]) => {
    const setData = setBonuses.find(s => s.id === setId)
    if (setData) {
      if (count >= 2) setBonusScore += 200
      if (count >= 3) setBonusScore += 300
      if (count >= 4) setBonusScore += 500
      if (count >= 5) setBonusScore += 800
    }
  })
  return Math.round(totalScore + setBonusScore)
}

// 修炼层级对 Build 的成长系数（每级 +2%，使层级真实影响 Build 与挂机难度匹配）
const LEVEL_BUILD_RATE = 0.02

// 角色裸战力（含已出战灵宠：deployPet 已将灵宠加成并入 baseAttributes）
// 不含装备（由 calculateBuildStrength 计算），也不含神器（避免与 equippedArtifacts 重复计入）
function calculateCharacterPower(player) {
  if (!player) return 0
  let score = 0
  const ba = player.baseAttributes || {}
  const ca = player.combatAttributes || {}
  const cr = player.combatResistance || {}
  const sa = player.specialAttributes || {}
  ;['attack', 'health', 'defense', 'speed'].forEach(s => { score += getStatScore(s, ba[s] || 0) })
  Object.keys(ca).forEach(s => { score += getStatScore(s, ca[s] || 0, true) })
  Object.keys(cr).forEach(s => { score += getStatScore(s, cr[s] || 0, true) })
  Object.keys(sa).forEach(s => { score += getStatScore(s, sa[s] || 0, true) })
  return Math.round(score)
}

// 综合 Build：装备分 + 角色裸战力，并按修炼层级施加成长系数。
// 这样人物修炼层级与出战灵宠都会真实体现在 Build 数值与挂机难度匹配上。
function calculateTotalBuild(player) {
  if (!player) return 0
  const equip = calculateBuildStrength(player.equippedArtifacts || {})
  const charPow = calculateCharacterPower(player)
  const level = Math.max(1, player.level || 1)
  const levelMult = 1 + (level - 1) * LEVEL_BUILD_RATE
  return Math.round((equip + charPow) * levelMult)
}

function getActiveSetBonuses(equippedArtifacts) {
  const setCount = {}
  const slotMap = {}
  Object.entries(equippedArtifacts).forEach(([slot, equip]) => {
    if (equip && equip.setId) {
      setCount[equip.setId] = (setCount[equip.setId] || 0) + 1
      if (!slotMap[equip.setId]) slotMap[equip.setId] = []
      slotMap[equip.setId].push(slot)
    }
  })
  const activeBonuses = []
  Object.entries(setCount).forEach(([setId, count]) => {
    const setData = setBonuses.find(s => s.id === setId)
    if (!setData) return
    const bonuses = []
    if (count >= 2 && setData.bonus2) bonuses.push(setData.bonus2)
    if (count >= 3 && setData.bonus3) bonuses.push(setData.bonus3)
    if (count >= 4 && setData.bonus4) bonuses.push(setData.bonus4)
    if (count >= 5 && setData.bonus5) bonuses.push(setData.bonus5)
    activeBonuses.push({
      setId,
      setName: setData.name,
      setColor: setData.color,
      count,
      totalPieces: setData.pieces.length,
      equippedSlots: slotMap[setId],
      bonuses
    })
  })
  return activeBonuses
}

function applySetBonusStats(equippedArtifacts, baseStats) {
  const activeSets = getActiveSetBonuses(equippedArtifacts)
  const bonusStats = { ...baseStats }
  activeSets.forEach(setInfo => {
    setInfo.bonuses.forEach(bonus => {
      if (bonus.valueType === 'percent') {
        if (bonusStats[bonus.stat] !== undefined) {
          bonusStats[bonus.stat] = (bonusStats[bonus.stat] || 0) * (1 + bonus.value)
        }
      } else {
        if (bonusStats[bonus.stat] !== undefined) {
          bonusStats[bonus.stat] = (bonusStats[bonus.stat] || 0) + bonus.value
        }
      }
    })
  })
  return bonusStats
}

export {
  rarityConfig,
  affixPool,
  setBonuses,
  getAffixesForSlot,
  getAffixValue,
  calculateEquipmentScore,
  calculateBuildStrength,
  calculateCharacterPower,
  calculateTotalBuild,
  LEVEL_BUILD_RATE,
  getActiveSetBonuses,
  applySetBonusStats
}
