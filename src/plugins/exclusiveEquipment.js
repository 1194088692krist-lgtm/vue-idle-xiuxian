// 专属装备系统：每个角色 6 件专属装备（神品稀有度），可强化至 +15
// 打造方式：任意一件神品装备 + 100 个该角色内丹碎片 → 打造一个部位的专属装备
// 专属加成：当对应角色穿上对应专属装备时，该装备整体数值 ×1.3
import { characterList, characterDefMap } from './characters'
import { getAffixesForSlot, rarityConfig } from './buildSystem'
import { equipmentStatPool } from './gacha'

// 专属装备的 6 个槽位（armor 类型，不含饰品）
export const EXCLUSIVE_EQUIP_SLOTS = ['head', 'body', 'legs', 'feet', 'shoulder', 'hands']

// 专属装备槽位中文名
export const EXCLUSIVE_SLOT_NAMES = {
  head: '头部',
  body: '衣服',
  legs: '裤子',
  feet: '鞋子',
  shoulder: '肩甲',
  hands: '手套'
}

// 专属装备配置
export const EXCLUSIVE_EQUIP_CONFIG = {
  innerPillCost: 100,           // 打造一件需消耗 100 个该角色内丹碎片
  requiredRarity: 'mythic',     // 消耗的神品装备稀有度
  maxEnhanceLevel: 15,         // 专属装备强化上限 +15
  exclusiveMultiplier: 1.3,     // 对应角色穿戴时数值 ×1.3
  // +13~15 成功率与 +12 一致（冻结在 currentLevel=11 的概率）
  enhanceSuccessRateFreezeLevel: 11
}

// 按角色星级生成基础属性倍率
const STAR_STAT_MULT = {
  3: 1.0,
  4: 1.6,
  5: 2.5
}

// 按角色星级生成词缀数量
const STAR_AFFIX_COUNT = {
  3: 4,
  4: 4,
  5: 5
}

/**
 * 为指定角色生成一件专属装备
 * @param {Object} character - 角色定义（来自 characterList）
 * @param {string} slot - 槽位（head/body/legs/feet/shoulder/hands）
 * @param {number} playerLevel - 玩家等级（影响属性值范围）
 * @returns {Object} 专属装备对象
 */
export function generateExclusiveEquipment(character, slot, playerLevel = 50, sourceEquipment = null) {
  if (!character || !EXCLUSIVE_EQUIP_SLOTS.includes(slot)) return null

  const starMult = STAR_STAT_MULT[character.star] || 1.0
  const mythicMult = 5 // 神品品质倍率
  const statCount = 5 // 神品固定 5 条属性
  const affixCount = STAR_AFFIX_COUNT[character.star] || 4

  // 属性生成：优先继承神品装备的数值词条，缺失的条目才随机补齐
  // 这样专属装备直接继承材料神品装备的数值，玩家可定向打造
  let stats = {}
  let sourceStats = null
  if (sourceEquipment && sourceEquipment.stats && typeof sourceEquipment.stats === 'object') {
    sourceStats = { ...sourceEquipment.stats }
  }

  const allStats = Object.keys(equipmentStatPool)
  const selectedStats = []
  // 优先从 sourceStats 取
  if (sourceStats) {
    Object.keys(sourceStats).forEach(k => {
      if (equipmentStatPool[k] && selectedStats.length < statCount) {
        selectedStats.push(k)
      }
    })
  }
  // 不足的随机补齐
  const pool = allStats.filter(s => !selectedStats.includes(s))
  while (selectedStats.length < statCount && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    selectedStats.push(pool.splice(idx, 1)[0])
  }

  selectedStats.forEach(stat => {
    // 继承来源装备的数值；否则按神品 × 星级倍率随机生成
    let value
    if (sourceStats && sourceStats[stat] !== undefined) {
      value = sourceStats[stat]
    } else {
      const config = equipmentStatPool[stat]
      const minVal = config.min[0] + (config.min[1] - config.min[0]) * (playerLevel / 100)
      const maxVal = config.max[0] + (config.max[1] - config.max[0]) * (playerLevel / 100)
      value = minVal + Math.random() * (maxVal - minVal)
      value *= mythicMult * starMult
      const cap = config.cap
      if (cap !== undefined) {
        value = Math.min(value, cap)
      }
    }
    if (['critRate', 'comboRate', 'dodgeRate', 'vampireRate'].includes(stat)) {
      stats[stat] = Math.round(value * 1000) / 1000
    } else {
      stats[stat] = Math.round(value)
    }
  })

  // 词缀：优先继承来源神品装备的词缀；否则随机生成
  let affixes
  if (sourceEquipment && Array.isArray(sourceEquipment.affixes) && sourceEquipment.affixes.length > 0) {
    affixes = sourceEquipment.affixes.slice(0, affixCount)
  } else {
    affixes = getAffixesForSlot(slot, 'mythic')
    if (affixes.length > affixCount) {
      affixes = affixes.slice(0, affixCount)
    }
  }

  // 专属装备名称：{角色名}·{部位名}
  const slotName = EXCLUSIVE_SLOT_NAMES[slot] || slot
  const name = `${character.name}·专属${slotName}`

  return {
    id: `excl_${character.id}_${slot}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    type: slot,
    slot: slot,
    rarity: 'mythic',
    quality: 'mythic',
    qualityInfo: { name: '神品', color: '#FF4500' },
    stats,
    affixes,
    setId: null,
    enhanceLevel: 0,
    requiredRealm: Math.max(1, playerLevel - Math.floor(Math.random() * 5)),
    // 专属装备特有字段
    isExclusive: true,
    exclusiveCharId: character.id,
    exclusiveCharName: character.name,
    exclusiveCharStar: character.star,
    maxEnhanceLevel: EXCLUSIVE_EQUIP_CONFIG.maxEnhanceLevel
  }
}

/**
 * 检查装备是否为指定角色的专属装备
 */
export function isExclusiveEquipmentForCharacter(equipment, characterId) {
  return equipment && equipment.isExclusive && equipment.exclusiveCharId === characterId
}

/**
 * 获取专属装备加成倍率（对应角色穿戴时返回 1.3，否则返回 1.0）
 */
export function getExclusiveMultiplier(equipment, characterId) {
  if (!equipment || !equipment.isExclusive) return 1.0
  if (!characterId) return 1.0
  return equipment.exclusiveCharId === characterId
    ? EXCLUSIVE_EQUIP_CONFIG.exclusiveMultiplier
    : 1.0
}

/**
 * 获取所有可打造专属装备的角色列表（用于下拉筛选）
 */
export function getExclusiveCraftableCharacters() {
  return characterList
}

/**
 * 获取指定角色的专属装备槽位列表（用于展示）
 */
export function getExclusiveSlotsForCharacter(characterId) {
  const character = characterDefMap[characterId] || characterList.find(c => c.id === characterId)
  if (!character) return []
  return EXCLUSIVE_EQUIP_SLOTS.map(slot => ({
    slot,
    slotName: EXCLUSIVE_SLOT_NAMES[slot],
    characterId,
    characterName: character.name,
    star: character.star
  }))
}
