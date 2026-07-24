// ===== 灵纹镶嵌系统（M1）：PoE 插槽+连线 的修仙化 =====
// 设计：装备按品质开 0~3 个灵纹槽，镶嵌灵纹获得额外词缀；相邻同元素灵纹触发"共鸣"加成（PoE link 简化）。
// 本模块为叶子模块（不依赖 buildSystem/player），供 buildSystem(评分) 与 player(getEffectiveStats) 引用，避免循环依赖。

// 五行元素（修仙主题）
export const RUNE_ELEMENTS = {
  metal: { name: '金', color: '#C9C9C9' },
  wood: { name: '木', color: '#3CB371' },
  water: { name: '水', color: '#1E90FF' },
  fire: { name: '火', color: '#FF4500' },
  earth: { name: '土', color: '#D2691E' }
}

// 灵纹池：每个灵纹给一条词缀 + 一个元素（用于共鸣）
export const runes = [
  { id: 'rune_fire_atk', name: '离火纹', element: 'fire', stat: 'attack', valueType: 'percent', value: 0.06, rarity: 'rare' },
  { id: 'rune_fire_crit', name: '焚天纹', element: 'fire', stat: 'critDamageBoost', valueType: 'percent', value: 0.08, rarity: 'epic' },
  { id: 'rune_water_hp', name: '坎水纹', element: 'water', stat: 'health', valueType: 'percent', value: 0.06, rarity: 'rare' },
  { id: 'rune_water_heal', name: '润泽纹', element: 'water', stat: 'healBoost', valueType: 'percent', value: 0.08, rarity: 'epic' },
  { id: 'rune_metal_def', name: '锐金纹', element: 'metal', stat: 'defense', valueType: 'percent', value: 0.06, rarity: 'rare' },
  { id: 'rune_metal_pen', name: '破甲纹', element: 'metal', stat: 'finalDamageBoost', valueType: 'percent', value: 0.06, rarity: 'epic' },
  { id: 'rune_wood_spd', name: '巽木纹', element: 'wood', stat: 'speed', valueType: 'flat', value: 8, rarity: 'rare' },
  { id: 'rune_wood_dodge', name: '风影纹', element: 'wood', stat: 'dodgeRate', valueType: 'percent', value: 0.05, rarity: 'epic' },
  { id: 'rune_earth_hp', name: '厚土纹', element: 'earth', stat: 'health', valueType: 'flat', value: 150, rarity: 'rare' },
  { id: 'rune_earth_res', name: '磐石纹', element: 'earth', stat: 'finalDamageReduce', valueType: 'percent', value: 0.06, rarity: 'epic' }
]

// 相邻同元素共鸣加成（PoE 连线的简化：每对相邻同元素灵纹触发一次）
const SYNERGY_BONUS = {
  fire: { stat: 'critDamageBoost', value: 0.05, valueType: 'percent' },
  water: { stat: 'healBoost', value: 0.05, valueType: 'percent' },
  metal: { stat: 'finalDamageBoost', value: 0.05, valueType: 'percent' },
  wood: { stat: 'dodgeRate', value: 0.03, valueType: 'percent' },
  earth: { stat: 'finalDamageReduce', value: 0.05, valueType: 'percent' }
}

// 装备按品质开槽数（决策：凡0/良1/上1/极2/仙2/神3）
export const SOCKETS_BY_RARITY = { common: 0, uncommon: 1, rare: 1, epic: 2, legendary: 2, mythic: 3 }
export function getSocketsByRarity(rarity) {
  return SOCKETS_BY_RARITY[rarity] || 0
}

// 计算一件装备的相邻同元素共鸣列表
export function getRuneSynergy(eq) {
  const list = []
  const rs = eq.runes || []
  for (let i = 0; i < rs.length - 1; i++) {
    const a = rs[i]
    const b = rs[i + 1]
    if (a && b && a.element === b.element) {
      const s = SYNERGY_BONUS[a.element]
      if (s) list.push({ ...s, element: a.element, pair: [i, i + 1] })
    }
  }
  return list
}

// 汇总一件装备的灵纹词缀 + 共鸣加成（供 getEffectiveStats 应用 / 评分计入）
export function getRuneStats(eq) {
  const stats = []
  ;(eq.runes || []).forEach(r => { if (r) stats.push({ stat: r.stat, value: r.value, valueType: r.valueType }) })
  getRuneSynergy(eq).forEach(s => stats.push({ stat: s.stat, value: s.value, valueType: s.valueType }))
  return stats
}

// 生成一个随机灵纹实例（带唯一 uid，供镶嵌追踪）；zoneIdx 图序决定稀有度倾向
export function getRandomRune(zoneIdx = 1) {
  // 高图序 → 更高概率出 epic 灵纹
  const epicChance = Math.min(0.5, 0.1 + zoneIdx * 0.05)
  const wantRarity = Math.random() < epicChance ? 'epic' : 'rare'
  let pool = runes.filter(r => r.rarity === wantRarity)
  if (pool.length === 0) pool = runes
  const def = pool[Math.floor(Math.random() * pool.length)]
  return { ...def, uid: `${def.id}_${Date.now()}_${Math.floor(Math.random() * 1e6)}` }
}

export function getRuneByUid(playerRunes, uid) {
  return (playerRunes || []).find(r => r.uid === uid)
}
