// 抽奖系统配置

import { getAffixesForSlot, setBonuses, rarityConfig, affixPool } from '../plugins/buildSystem'
import { generateRandomCharacter } from '../plugins/characters'

// 装备品质配置
export const equipmentQualities = {
  mythic: { name: '仙品', color: '#FF0000', weight: 1 },
  legendary: { name: '极品', color: '#FFD700', weight: 3 },
  epic: { name: '上品', color: '#9932CC', weight: 8 },
  rare: { name: '中品', color: '#1E90FF', weight: 18 },
  uncommon: { name: '下品', color: '#228B22', weight: 30 },
  common: { name: '凡品', color: '#8B8B8B', weight: 40 }
}

// 灵宠品质配置
export const petRarities = {
  divine: { name: '神品', color: '#FF0000', weight: 2 },
  celestial: { name: '仙品', color: '#FFD700', weight: 8 },
  mystic: { name: '玄品', color: '#9932CC', weight: 15 },
  spiritual: { name: '灵品', color: '#1E90FF', weight: 25 },
  mortal: { name: '凡品', color: '#32CD32', weight: 50 }
}

// 装备类型配置
export const equipmentTypes = [
  'weapon', 'head', 'body', 'legs', 'feet',
  'shoulder', 'hands', 'wrist', 'necklace',
  'ring1', 'ring2', 'belt', 'artifact'
]

export const equipmentTypeNames = {
  weapon: '武器', head: '头部', body: '衣服', legs: '裤子', feet: '鞋子',
  shoulder: '肩甲', hands: '手套', wrist: '护腕', necklace: '项链',
  ring1: '戒指', ring2: '戒指', belt: '腰带', artifact: '法宝'
}

// 装备名称素材
export const equipmentNameParts = {
  weapon: ['青锋', '紫电', '玄霜', '赤焰', '天罡', '碧落', '幽冥', '星辰'],
  head: ['玄铁盔', '灵玉冠', '紫金环', '天仙帽', '云雾巾', '龙角盔'],
  body: ['天蚕甲', '玄龟铠', '灵蚕衣', '金丝袍', '星辰衫', '龙鳞铠'],
  legs: ['青云裤', '玄铁裙', '灵丝裤', '紫金裳', '星辉裙', '龙鳞护腿'],
  feet: ['踏云靴', '凌波鞋', '风行靴', '星履', '紫电靴', '龙踏'],
  shoulder: ['玄铁肩甲', '灵玉护肩', '紫金肩', '云纹护肩', '龙纹肩'],
  hands: '玄铁手套 灵丝掌 紫金护手 龙爪手套 星辰手 天机手'.split(' '),
  wrist: '玄铁护腕 灵玉镯 紫金腕 甲木腕 星辰环 天机腕'.split(' '),
  necklace: ['灵珠项链', '天珠串', '玄铁链', '灵玉坠', '星辰链', '龙珠链'],
  ring1: ['灵玉戒', '紫金环', '星辰戒', '天机戒', '龙纹戒', '幽冥环'],
  ring2: ['灵玉戒', '紫金环', '星辰戒', '天机戒', '龙纹戒', '幽冥环'],
  belt: ['玄铁带', '灵丝带', '紫金腰', '星辰带', '龙纹带', '天机带'],
  artifact: ['乾坤鼎', '混元钟', '太极图', '造化莲', '盘古幡', '混沌珠']
}

// 灵宠名称素材
export const petNameParts = [
  '火灵', '水灵', '雷灵', '风灵', '土灵', '冰灵',
  '龙崽', '凤雏', '麒麟', '玄武', '白虎', '朱雀',
  '灵狐', '仙鹤', '灵猴', '天狼', '玄蛇', '灵龟'
]

// 灵宠描述
export const petDescriptions = [
  '拥有强大潜力的灵兽，可随主人征战四方。',
  '通灵之兽，与主人心意相通，忠心不二。',
  '天生异种，蕴含洪荒血脉，前途不可限量。',
  '灵智初开的幼兽，假以时日必成大器。',
  '身怀异禀的灵宠，能为修士提供属性加持。'
]

// 装备属性池
export const equipmentStatPool = {
  attack: { min: [3, 8], max: [15, 40], growth: 5 },
  defense: { min: [2, 6], max: [12, 30], growth: 4 },
  health: { min: [20, 50], max: [100, 300], growth: 30 },
  speed: { min: [1, 3], max: [5, 15], growth: 2 },
  critRate: { min: [0.01, 0.02], max: [0.05, 0.15], growth: 0.02 },
  comboRate: { min: [0.01, 0.02], max: [0.05, 0.12], growth: 0.02 },
  dodgeRate: { min: [0.01, 0.02], max: [0.04, 0.10], growth: 0.02 },
  vampireRate: { min: [0.01, 0.02], max: [0.04, 0.10], growth: 0.02 }
}

// 抽奖池配置
export const gachaPools = {
  all: {
    name: '综合池',
    cost: 100,
    characterRate: 0.25,
    weaponRate: 0.25,
    artifactRate: 0.25,
    petRate: 0.15,
    resourceRate: 0.10
  },
  character: {
    name: '人物池',
    cost: 150,
    characterRate: 0.80,
    weaponRate: 0.10,
    artifactRate: 0.05,
    petRate: 0.03,
    resourceRate: 0.02
  },
  equipment: {
    name: '装备池',
    cost: 120,
    characterRate: 0,
    weaponRate: 0.50,
    artifactRate: 0.45,
    petRate: 0,
    resourceRate: 0.05
  },
  weapon: {
    name: '武器池',
    cost: 120,
    characterRate: 0,
    weaponRate: 0.80,
    artifactRate: 0.15,
    petRate: 0,
    resourceRate: 0.05
  },
  artifact: {
    name: '法宝池',
    cost: 180,
    characterRate: 0,
    weaponRate: 0.10,
    artifactRate: 0.85,
    petRate: 0,
    resourceRate: 0.05
  },
  pet: {
    name: '灵宠池',
    cost: 200,
    characterRate: 0,
    weaponRate: 0,
    artifactRate: 0,
    petRate: 0.95,
    resourceRate: 0.05
  }
}

// 资源奖励配置
const resourceRewards = [
  { type: 'spirit_stone', amount: [50, 200] },
  { type: 'reinforce_stone', amount: [1, 5] },
  { type: 'refinement_stone', amount: [1, 3] },
  { type: 'pet_essence', amount: [5, 20] }
]

// 根据权重随机选择品质
const pickByWeight = (qualityMap) => {
  const entries = Object.entries(qualityMap)
  const totalWeight = entries.reduce((sum, [, v]) => sum + v.weight, 0)
  let rand = Math.random() * totalWeight
  for (const [key, val] of entries) {
    rand -= val.weight
    if (rand <= 0) return { key, ...val }
  }
  const last = entries[entries.length - 1]
  return { key: last[0], ...last[1] }
}

// 生成随机装备
export const generateEquipment = (playerLevel = 1, specificType = null) => {
  const type = specificType || equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)]
  const qualityInfo = pickByWeight(equipmentQualities)
  const rarity = qualityInfo.key // 与 buildSystem.rarityConfig 的 key 完全一致
  const nameParts = equipmentNameParts[type] || ['未知']
  const nameBase = nameParts[Math.floor(Math.random() * nameParts.length)]
  const name = `${nameBase}·${rarityConfig[rarity].name}`

  // 词条（接入 buildSystem，使抽奖装备也能吃 build 加成）
  let affixes = getAffixesForSlot(type, rarity)
  // 保底：非凡品装备至少带 1 条词条（凡品本就无词条，符合设定）
  if (affixes.length === 0 && rarity !== 'common') {
    const available = affixPool.filter(a => a.slots.includes(type))
    if (available.length > 0) {
      const affix = available[Math.floor(Math.random() * available.length)]
      const [minVal, maxVal] = affix.baseRange
      const value = minVal + Math.random() * (maxVal - minVal)
      const roundedValue = affix.valueType === 'percent' ? Math.round(value * 1000) / 1000 : Math.round(value)
      affixes = [{
        id: affix.id, name: affix.name, stat: affix.stat,
        value: roundedValue, valueType: affix.valueType, tier: affix.tier
      }]
    }
  }

  // 套装（epic+ 30% 概率，且与当前部位匹配）
  let setId = null
  if (['epic', 'legendary', 'mythic'].includes(rarity) && Math.random() < 0.3) {
    const candidateSets = setBonuses.filter(s => s.pieces.includes(type))
    if (candidateSets.length > 0) {
      setId = candidateSets[Math.floor(Math.random() * candidateSets.length)].id
    }
  }

  // 根据品质决定属性条数
  const statCountMap = { common: 2, uncommon: 2, rare: 3, epic: 3, legendary: 4, mythic: 5 }
  const statCount = statCountMap[rarity] || 2

  // 随机选取属性
  const allStats = Object.keys(equipmentStatPool)
  const selectedStats = []
  while (selectedStats.length < statCount && allStats.length > 0) {
    const idx = Math.floor(Math.random() * allStats.length)
    selectedStats.push(allStats.splice(idx, 1)[0])
  }

  // 品质倍率
  const qualityMultiplier = { common: 1, uncommon: 1.2, rare: 1.5, epic: 2, legendary: 3, mythic: 5 }
  const multiplier = qualityMultiplier[rarity] || 1

  // 生成属性值
  const stats = {}
  selectedStats.forEach(stat => {
    const config = equipmentStatPool[stat]
    const minVal = config.min[0] + (config.min[1] - config.min[0]) * (playerLevel / 100)
    const maxVal = config.max[0] + (config.max[1] - config.max[0]) * (playerLevel / 100)
    let value = minVal + Math.random() * (maxVal - minVal)
    value *= multiplier
    // 百分比属性取整到小数点后两位
    if (['critRate', 'comboRate', 'dodgeRate', 'vampireRate'].includes(stat)) {
      stats[stat] = Math.min(0.5, Math.round(value * 100) / 100)
    } else {
      stats[stat] = Math.round(value)
    }
  })

  return {
    id: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    type,
    slot: type,
    rarity,
    quality: rarity,
    qualityInfo: { name: rarityConfig[rarity].name, color: rarityConfig[rarity].color },
    stats,
    affixes,
    setId,
    enhanceLevel: 0,
    requiredRealm: Math.max(1, playerLevel - Math.floor(Math.random() * 5))
  }
}

// 生成随机灵宠
export const generatePet = (playerLevel = 1) => {
  const rarityInfo = pickByWeight(petRarities)
  const nameBase = petNameParts[Math.floor(Math.random() * petNameParts.length)]
  const name = `${nameBase}·${rarityInfo.name}`
  const description = petDescriptions[Math.floor(Math.random() * petDescriptions.length)]

  // 品质倍率
  const rarityMultiplier = { mortal: 1, spiritual: 1.5, mystic: 2, celestial: 3, divine: 5 }
  const multiplier = rarityMultiplier[rarityInfo.key] || 1
  const levelBonus = 1 + (playerLevel - 1) * 0.05

  // 生成基础战斗属性
  const combatAttributes = {
    attack: Math.round((5 + Math.random() * 10) * multiplier * levelBonus),
    health: Math.round((30 + Math.random() * 50) * multiplier * levelBonus),
    defense: Math.round((3 + Math.random() * 8) * multiplier * levelBonus),
    speed: Math.round((2 + Math.random() * 5) * multiplier * levelBonus),
    critRate: Math.min(0.5, Math.round((0.01 + Math.random() * 0.03) * multiplier * 100) / 100),
    comboRate: Math.min(0.5, Math.round((0.01 + Math.random() * 0.03) * multiplier * 100) / 100),
    counterRate: Math.min(0.5, Math.round((0.01 + Math.random() * 0.03) * multiplier * 100) / 100),
    stunRate: Math.min(0.5, Math.round((0.01 + Math.random() * 0.03) * multiplier * 100) / 100),
    dodgeRate: Math.min(0.5, Math.round((0.01 + Math.random() * 0.03) * multiplier * 100) / 100),
    vampireRate: Math.min(0.5, Math.round((0.01 + Math.random() * 0.03) * multiplier * 100) / 100),
    critResist: Math.min(0.5, Math.round((0.01 + Math.random() * 0.02) * multiplier * 100) / 100),
    comboResist: Math.min(0.5, Math.round((0.01 + Math.random() * 0.02) * multiplier * 100) / 100),
    counterResist: Math.min(0.5, Math.round((0.01 + Math.random() * 0.02) * multiplier * 100) / 100),
    stunResist: Math.min(0.5, Math.round((0.01 + Math.random() * 0.02) * multiplier * 100) / 100),
    dodgeResist: Math.min(0.5, Math.round((0.01 + Math.random() * 0.02) * multiplier * 100) / 100),
    vampireResist: Math.min(0.5, Math.round((0.01 + Math.random() * 0.02) * multiplier * 100) / 100),
    healBoost: 0,
    critDamageBoost: 0,
    critDamageReduce: 0,
    finalDamageBoost: 0,
    finalDamageReduce: 0,
    combatBoost: 0,
    resistanceBoost: 0
  }

  return {
    id: `pet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    type: 'pet',
    description,
    rarity: rarityInfo.key,
    level: 1,
    star: 0,
    combatAttributes
  }
}

// 生成资源奖励
export const generateResource = () => {
  const reward = resourceRewards[Math.floor(Math.random() * resourceRewards.length)]
  const amount = Math.floor(Math.random() * (reward.amount[1] - reward.amount[0] + 1)) + reward.amount[0]
  return { type: reward.type, amount }
}

// 执行一次抽奖
// 返回 { category: 'character'|'weapon'|'artifact'|'pet'|'resource', item: {...} }
export const doGacha = (poolType, playerLevel = 1) => {
  const pool = gachaPools[poolType]
  if (!pool) return null

  const rand = Math.random()
  let category

  if (rand < pool.characterRate) {
    category = 'character'
  } else if (rand < pool.characterRate + pool.weaponRate) {
    category = 'weapon'
  } else if (rand < pool.characterRate + pool.weaponRate + pool.artifactRate) {
    category = 'artifact'
  } else if (rand < pool.characterRate + pool.weaponRate + pool.artifactRate + pool.petRate) {
    category = 'pet'
  } else {
    category = 'resource'
  }

  switch (category) {
    case 'character':
      return { category, item: generateRandomCharacter() }
    case 'weapon':
      return { category, item: generateEquipment(playerLevel, 'weapon') }
    case 'artifact':
      return { category, item: generateEquipment(playerLevel, 'artifact') }
    case 'pet':
      return { category, item: generatePet(playerLevel) }
    case 'resource':
      return { category, item: generateResource() }
  }
}

// 批量抽奖（保底规则：人物池/综合池每 5 次保底一次 4 星或以上）
// 5星基础概率3%、4星基础概率20%。若 5 次内未出现 4 星或以上人物，则把第 5 次替换为 4 星人物
export const doMultiGacha = (poolType, count, playerLevel = 1) => {
  const results = []
  const isCharacterPool = poolType === 'character' || poolType === 'all'
  const PITY_INTERVAL = 5
  for (let i = 0; i < count; i++) {
    const result = doGacha(poolType, playerLevel)
    if (result) results.push(result)
    // 每 5 次保底：人物池/综合池 5 次内若没有 4 星或以上人物，则把本次替换为 4 星
    if (isCharacterPool && (i + 1) % PITY_INTERVAL === 0) {
      const startIdx = i + 1 - PITY_INTERVAL
      const window = results.slice(startIdx, i + 1)
      const hasHighStar = window.some(r => r.category === 'character' && r.item.star >= 4)
      if (!hasHighStar) {
        results[i] = { category: 'character', item: generateRandomCharacter(4) }
      }
    }
  }
  return results
}
