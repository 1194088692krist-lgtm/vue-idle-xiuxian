// 装备强化和洗练相关配置

// 强化等级配置
const enhanceConfig = {
  maxLevel: 12,
  baseSuccessRate: 0.9,
  lockLevels: [4, 8],
  spiritStoneBaseCost: 100,
  spiritStoneGrowth: 1.5,
  stoneCosts: {
    1: { type: 'common_enhance_stone', count: 5 },
    2: { type: 'common_enhance_stone', count: 10 },
    3: { type: 'common_enhance_stone', count: 20 },
    4: { type: 'common_enhance_stone', count: 40 },
    5: { type: 'advanced_enhance_stone', count: 5 },
    6: { type: 'advanced_enhance_stone', count: 10 },
    7: { type: 'advanced_enhance_stone', count: 20 },
    8: { type: 'advanced_enhance_stone', count: 40 },
    9: { type: 'supreme_enhance_stone', count: 1 },
    10: { type: 'supreme_enhance_stone', count: 2 },
    11: { type: 'supreme_enhance_stone', count: 4 },
    12: { type: 'supreme_enhance_stone', count: 8 }
  },
  enhanceMult: 1.2
}

// 洗练配置
const reforgeConfig = {
  costPerAttempt: 10,
  minVariation: -0.3,
  maxVariation: 0.3,
  newStatChance: 0.3,
  affixMaxCount: {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
    mythic: 6
  }
}

const reforgeableStats = {
  weapon: ['attack', 'critRate', 'critDamageBoost', 'comboRate', 'vampireRate', 'stunRate', 'finalDamageBoost'],
  head: ['defense', 'health', 'stunResist', 'critResist', 'healBoost'],
  body: ['defense', 'health', 'finalDamageReduce', 'counterResist', 'comboResist'],
  legs: ['defense', 'speed', 'dodgeRate', 'dodgeResist', 'counterRate'],
  feet: ['defense', 'speed', 'dodgeRate', 'dodgeResist', 'haste'],
  shoulder: ['defense', 'health', 'counterRate', 'stunResist', 'resistanceBoost'],
  hands: ['attack', 'critRate', 'comboRate', 'vampireRate', 'speed'],
  wrist: ['defense', 'counterRate', 'vampireRate', 'healBoost', 'critDamageReduce'],
  necklace: ['health', 'healBoost', 'spiritRate', 'critRate', 'cultivationRate'],
  ring1: ['attack', 'critDamageBoost', 'finalDamageBoost', 'comboRate', 'vampireRate'],
  ring2: ['defense', 'critDamageReduce', 'resistanceBoost', 'dodgeRate', 'finalDamageReduce'],
  belt: ['health', 'defense', 'combatBoost', 'healBoost', 'counterRate'],
  artifact: ['attack', 'critRate', 'comboRate', 'finalDamageBoost', 'vampireRate']
}

// 强化石类型配置
export const enhanceStoneTypes = {
  common_enhance_stone: { name: '普通强化石', color: '#808080', rarity: 'common', dropZoneMin: 1 },
  advanced_enhance_stone: { name: '高级强化石', color: '#1E90FF', rarity: 'rare', dropZoneMin: 5 },
  supreme_enhance_stone: { name: '至尊强化石', color: '#FFD700', rarity: 'legendary', dropZoneMin: null }
}

function getEnhanceSpiritStoneCost(currentLevel) {
  return Math.round(enhanceConfig.spiritStoneBaseCost * Math.pow(enhanceConfig.spiritStoneGrowth, currentLevel))
}

function getEnhanceStoneCost(currentLevel) {
  return enhanceConfig.stoneCosts[currentLevel + 1] || { type: 'common_enhance_stone', count: 0 }
}

function getLockLevel(currentLevel) {
  if (currentLevel >= enhanceConfig.lockLevels[1]) return enhanceConfig.lockLevels[1]
  if (currentLevel >= enhanceConfig.lockLevels[0]) return enhanceConfig.lockLevels[0]
  return 0
}

function enhanceEquipment(equipment, playerGold, playerMaterials, enhanceBonus = 0) {
  if (!equipment || !equipment.stats) {
    return { success: false, message: '无效的装备' }
  }
  const currentLevel = equipment.enhanceLevel || 0
  if (currentLevel >= enhanceConfig.maxLevel) {
    return { success: false, message: '装备已达到最大强化等级' }
  }
  const goldCost = getEnhanceSpiritStoneCost(currentLevel)
  if (playerGold < goldCost) {
    return { success: false, message: '灵石不足' }
  }
  const stoneCost = getEnhanceStoneCost(currentLevel)
  const stoneCount = (playerMaterials || []).filter(m => m.kind === 'ore' && m.id === stoneCost.type).length
  if (stoneCount < stoneCost.count) {
    return { success: false, message: `${enhanceStoneTypes[stoneCost.type]?.name || '强化石'}不足` }
  }
  const successRate = Math.min(1, enhanceConfig.baseSuccessRate - currentLevel * 0.03 + (enhanceBonus || 0))
  const isSuccess = Math.random() < successRate
  if (!isSuccess) {
    const lockLevel = getLockLevel(currentLevel)
    const oldLevel = currentLevel
    equipment.enhanceLevel = lockLevel
    return {
      success: false,
      message: `强化失败，强化等级从+${oldLevel}回退到+${lockLevel}`,
      goldCost,
      stoneCost,
      oldLevel,
      newLevel: lockLevel,
      isFailure: true
    }
  }
  const oldStats = { ...equipment.stats }
  const oldLevel = currentLevel
  Object.keys(equipment.stats).forEach(stat => {
    if (typeof equipment.stats[stat] === 'number') {
      equipment.stats[stat] = Math.round(equipment.stats[stat] * enhanceConfig.enhanceMult)
    }
  })
  equipment.enhanceLevel = currentLevel + 1
  return {
    success: true,
    message: `强化成功，强化等级+${equipment.enhanceLevel}`,
    goldCost,
    stoneCost,
    oldStats,
    newStats: equipment.stats,
    oldLevel,
    newLevel: equipment.enhanceLevel,
    successRate: Math.round(successRate * 100)
  }
}

function reforgeEquipment(equipment, playerReforgeStones, confirmNewStats = true, reforgeSafe = false, targetStat = null) {
  if (!equipment || !equipment.stats || !equipment.type) {
    return { success: false, message: '无效的装备' }
  }
  if (playerReforgeStones < reforgeConfig.costPerAttempt) {
    return { success: false, message: '洗练石不足' }
  }
  const oldStats = { ...equipment.stats }
  const availableStats = reforgeableStats[equipment.type] || reforgeableStats.weapon
  const tempStats = { ...equipment.stats }
  const originStats = Object.keys(tempStats)
  const modifyIndexes = targetStat !== null
    ? originStats.map((s, i) => s === targetStat ? i : -1).filter(i => i >= 0)
    : [
      ...new Set(
        Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => Math.floor(Math.random() * originStats.length))
      )
    ].slice(0, 3)
  if (modifyIndexes.length === 0 && originStats.length > 0) {
    modifyIndexes.push(0)
  }
  modifyIndexes.forEach(index => {
    const originStat = originStats[index]
    let currentStat = originStat
    const baseValue = tempStats[originStat] || 1
    if (Math.random() < reforgeConfig.newStatChance) {
      const availableNew = availableStats.filter(s => !originStats.includes(s) || s !== originStat)
      if (availableNew.length > 0) {
        const newStat = availableNew[Math.floor(Math.random() * availableNew.length)]
        delete tempStats[originStat]
        currentStat = newStat
        originStats[index] = newStat
      }
    }
    const delta = reforgeSafe ? Math.random() * 0.3 : Math.random() * 0.6 - 0.3
    const newValue = baseValue * (1 + delta)
    if (['critRate', 'critDamageBoost', 'dodgeRate', 'vampireRate', 'finalDamageBoost', 'finalDamageReduce'].includes(currentStat)) {
      tempStats[currentStat] = Math.min(Math.max(Number(newValue.toFixed(2)), baseValue * 0.7), baseValue * 1.3)
    } else {
      tempStats[currentStat] = Math.min(
        Math.max(Math.round(newValue), Math.round(baseValue * 0.7)),
        Math.round(baseValue * 1.3)
      )
    }
  })
  if (Object.keys(tempStats).length === 0) {
    const randomStat = availableStats[Math.floor(Math.random() * availableStats.length)]
    const rarity = equipment.rarity || 'common'
    const maxAffixes = reforgeConfig.affixMaxCount[rarity] || 1
    if (maxAffixes >= 1) {
      tempStats[randomStat] = Math.round((Math.random() * 10 + 5))
    }
  }
  const rarity = equipment.rarity || 'common'
  const maxAffixes = reforgeConfig.affixMaxCount[rarity] || 1
  while (Object.keys(tempStats).length < maxAffixes) {
    const availableNew = availableStats.filter(s => !Object.keys(tempStats).includes(s))
    if (availableNew.length === 0) break
    const newStat = availableNew[Math.floor(Math.random() * availableNew.length)]
    tempStats[newStat] = Math.round((Math.random() * 10 + 5))
  }
  while (Object.keys(tempStats).length > maxAffixes) {
    const keys = Object.keys(tempStats)
    const removeKey = keys[Math.floor(Math.random() * keys.length)]
    delete tempStats[removeKey]
  }
  if (confirmNewStats) {
    equipment.stats = { ...tempStats }
  }
  return {
    success: true,
    message: confirmNewStats ? '洗练成功' : '保留原有属性',
    cost: reforgeConfig.costPerAttempt,
    oldStats,
    newStats: tempStats,
    confirmed: confirmNewStats,
    targetStat
  }
}

function disassembleEquipment(equipment) {
  if (!equipment) return { success: false, message: '无效的装备' }
  const rarity = equipment.rarity || 'common'
  let commonStones = 0
  let advancedStones = 0
  let supremeStones = 0
  let reforgeStones = 0
  const rarityRewards = {
    common: { common: 1, reforge: 0 },
    uncommon: { common: 2, reforge: 1 },
    rare: { common: 4, advanced: 1, reforge: 2 },
    epic: { common: 6, advanced: 2, reforge: 3 },
    legendary: { common: 8, advanced: 4, reforge: 5 },
    mythic: { common: 10, advanced: 6, reforge: 8 }
  }
  const rewards = rarityRewards[rarity] || rarityRewards.common
  commonStones += rewards.common || 0
  advancedStones += rewards.advanced || 0
  reforgeStones += rewards.reforge || 0
  if (rarity === 'legendary') {
    if (Math.random() < 0.3) {
      supremeStones += Math.floor(Math.random() * 2) + 1
    }
  }
  if (rarity === 'mythic') {
    supremeStones += Math.floor(Math.random() * 3) + 1
  }
  return {
    success: true,
    message: `分解成功`,
    rewards: {
      common_enhance_stone: commonStones,
      advanced_enhance_stone: advancedStones,
      supreme_enhance_stone: supremeStones,
      reforge_stone: reforgeStones
    }
  }
}

import { calculateEquipmentScore, calculateBuildStrength, getActiveSetBonuses, applySetBonusStats, rarityConfig, setBonuses } from './buildSystem'

export { 
  enhanceConfig, reforgeConfig, reforgeableStats, 
  enhanceEquipment, reforgeEquipment, disassembleEquipment,
  getEnhanceSpiritStoneCost, getEnhanceStoneCost, getLockLevel,
  calculateEquipmentScore, calculateBuildStrength, getActiveSetBonuses, applySetBonusStats, rarityConfig, setBonuses 
}