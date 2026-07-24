// ===== 工艺货币体系（M0-B）：把"看脸捡品质"升级为"定向 craft 极品"的解谜系统 =====
// 设计：每种货币做一件确定性/半确定性的事，玩家朝目标配方推进（对应 PoE orb，修仙命名）。
// 数据依赖：buildSystem（词缀池 / 品质档 roll / 反推）。行为统一对 equipment.affixes 操作。
// 掉落表与「决策 2」一致；分解返货币遵循"净 sink"（返量低于直掉期望）。
import {
  affixPool, getAffixesForSlot, rollQualityTier, rollAffixQualityValue, inferAffixQualityTier
} from './buildSystem.js'

// 词缀数量上限（镜像 equipment.js reforgeConfig.affixMaxCount，避免反向依赖 equipment → 本模块）
const AFFIX_MAX_BY_RARITY = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 }

// 货币定义（needTarget：是否需要在 craft 面板指定一条词缀）
export const craftCurrencies = {
  refine_stone: { id: 'refine_stone', name: '洗练石', dropZoneMin: 1, weight: 50, needTarget: false, desc: '重 roll 全部词缀数值（保留种类/档位，尊重锁定）' },
  lock_rune: { id: 'lock_rune', name: '锁灵符', dropZoneMin: 2, weight: 20, needTarget: true, desc: '锁定/解锁指定词缀，后续 roll 中不被改动' },
  chaos_sand: { id: 'chaos_sand', name: '重铸灵砂', dropZoneMin: 3, weight: 8, needTarget: false, desc: '清空并重生成全部词缀（尊重锁定）' },
  divine_stone: { id: 'divine_stone', name: '点化石', dropZoneMin: 4, weight: 6, needTarget: false, desc: '只重 roll 现有词缀数值（保留种类/档位，尊重锁定）' },
  exalt_stone: { id: 'exalt_stone', name: '增幅石', dropZoneMin: 4, bossOnly: true, weight: 3, needTarget: false, desc: '新增一条随机词缀（不超过品质上限）' },
  law_stone: { id: 'law_stone', name: '凝律石', dropZoneMin: 5, weight: 2, needTarget: true, desc: '将指定词缀提升一档（重 roll 该档数值）' },
  annul_dew: { id: 'annul_dew', name: '抹除露', dropZoneMin: 5, bossOnly: true, weight: 2, needTarget: false, desc: '随机删除一条词缀（默认保底 1 条）' },
  blood_sigil: { id: 'blood_sigil', name: '血祭符', dropZoneMin: 6, weight: 1, rare: true, needTarget: false, desc: '腐化：+1 强化 / 变异词缀 / 5% 碎裂（腐化后不可再 craft）' }
}

// 每张图工艺材料掉落触发概率（决策 2；再 × 难度 drop 倍率）
export const CRAFT_DROP_CHANCE_BY_ZONE = { 1: 0.10, 2: 0.14, 3: 0.18, 4: 0.22, 5: 0.27, 6: 0.30, 7: 0.33, 8: 0.36 }
// Boss 专属货币额外权重
const BOSS_CURRENCY_WEIGHTS = { exalt_stone: 6, annul_dew: 4, blood_sigil: 2 }

// 分解装备返货币（按品质；遵循"净 sink"：返量 < 直掉期望）
export function disassembleCurrencyRewards(rarity) {
  const out = {}
  const add = (id, n) => { out[id] = (out[id] || 0) + n }
  if (rarity === 'uncommon') add('refine_stone', 1)
  if (rarity === 'rare') { add('refine_stone', 1); add('lock_rune', 1) }
  if (rarity === 'epic') { add('refine_stone', 2); add('chaos_sand', 1) }
  if (rarity === 'legendary') { add('refine_stone', 2); add('divine_stone', 1); add('chaos_sand', 1) }
  if (rarity === 'mythic') { add('refine_stone', 3); add('divine_stone', 1); add('law_stone', 1) }
  return out
}

// 从已解锁货币池按权重抽 1 个（zoneIndex 图序 1~8；isBoss 决定是否含 bossOnly 货币）
export function pickCraftCurrency(zoneIndex, isBoss = false) {
  const pool = Object.values(craftCurrencies).filter(c => c.dropZoneMin <= zoneIndex && (isBoss || !c.bossOnly))
  if (pool.length === 0) return null
  const table = []
  pool.forEach(c => {
    const w = (isBoss && BOSS_CURRENCY_WEIGHTS[c.id]) || c.weight
    for (let i = 0; i < w; i++) table.push(c.id)
  })
  return table[Math.floor(Math.random() * table.length)]
}

// ===== craft 行为（对 equipment.affixes 操作；返回 { success, message, ... }）=====
function findAffixDef(affix) {
  return affixPool.find(p => p.id === affix.id || p.stat === affix.stat)
}
function availableNewAffixDefs(eq) {
  const existing = new Set((eq.affixes || []).map(a => a.id))
  return affixPool.filter(a => a.slots.includes(eq.slot) && !existing.has(a.id))
}

// 凝律石升档成本：随档位递增（Playtest Sim C 修正——避免 craft 过于线性廉价）
// 从 currentTier 升一档所需凝律石数量：越高档越贵，T2→T1 最贵；全 T1 毕业约 40+ 凝律石（≈20 小时定向挂机）
export function lawStoneCost(currentTier) {
  return ({ 6: 1, 5: 2, 4: 3, 3: 4, 2: 5 })[currentTier] || 1
}
// 计算使用某货币的成本（默认 1；凝律石按目标词缀当前档位递增）
export function getCraftCost(currencyId, eq, targetAffixId) {
  if (currencyId === 'law_stone') {
    const af = (eq.affixes || []).find(a => a.id === targetAffixId)
    if (af) return lawStoneCost(af.qualityTier || 4)
  }
  return 1
}

// 凝律石：指定词缀提升一档（重 roll 该档数值）
export function upgradeAffixTier(eq, affixId) {
  const af = (eq.affixes || []).find(a => a.id === affixId)
  if (!af) return { success: false, message: '词缀不存在' }
  if ((af.qualityTier || 4) <= 1) return { success: false, message: '该词缀已是 T1 极品' }
  const def = findAffixDef(af)
  if (!def) return { success: false, message: '词缀定义缺失' }
  af.qualityTier = (af.qualityTier || 4) - 1
  af.value = rollAffixQualityValue(def, af.qualityTier)
  return { success: true, message: `「${af.name}」提升至 T${af.qualityTier}`, affix: af }
}

// 点化石：重 roll 所有未锁定词缀的数值（保留种类/档位）
export function rerollAffixValues(eq) {
  const list = (eq.affixes || []).filter(a => !a.locked)
  if (list.length === 0) return { success: false, message: '无可重 roll 的词缀（均已锁定）' }
  list.forEach(af => {
    const def = findAffixDef(af)
    if (def) af.value = rollAffixQualityValue(def, af.qualityTier || 4)
  })
  return { success: true, message: `重 roll 了 ${list.length} 条词缀数值` }
}

// 重铸灵砂：重生成全部词缀（保留锁定词缀）
export function rerollAllAffixes(eq) {
  const locked = (eq.affixes || []).filter(a => a.locked)
  const fresh = getAffixesForSlot(eq.slot, eq.rarity, eq.ilvl ?? null).filter(a => !locked.some(l => l.id === a.id))
  const max = AFFIX_MAX_BY_RARITY[eq.rarity] || 1
  const merged = [...locked]
  for (const a of fresh) {
    if (merged.length >= max || merged.some(m => m.id === a.id)) continue
    merged.push(a)
  }
  eq.affixes = merged
  return { success: true, message: '重铸完成（锁定词缀已保留）' }
}

// 锁灵符：锁定/解锁指定词缀
export function toggleAffixLock(eq, affixId) {
  const af = (eq.affixes || []).find(a => a.id === affixId)
  if (!af) return { success: false, message: '词缀不存在' }
  af.locked = !af.locked
  return { success: true, message: af.locked ? `已锁定「${af.name}」` : `已解锁「${af.name}」`, affix: af }
}

// 增幅石：新增一条随机词缀（不超过品质上限）
export function addAffix(eq) {
  eq.affixes = eq.affixes || []
  const max = AFFIX_MAX_BY_RARITY[eq.rarity] || 1
  if (eq.affixes.length >= max) return { success: false, message: `词缀已达${eq.rarity}品质上限(${max})` }
  const pool = availableNewAffixDefs(eq)
  if (pool.length === 0) return { success: false, message: '没有可新增的词缀' }
  const def = pool[Math.floor(Math.random() * pool.length)]
  const qualityTier = rollQualityTier(eq.ilvl ?? 4)
  const value = rollAffixQualityValue(def, qualityTier)
  const af = { id: def.id, name: def.name, stat: def.stat, value, valueType: def.valueType, tier: def.tier, qualityTier }
  eq.affixes.push(af)
  return { success: true, message: `新增词缀「${af.name}」T${qualityTier}`, affix: af }
}

// 抹除露：随机删除一条未锁定词缀（默认保底 1 条）
export function annulAffix(eq, allowEmpty = false) {
  eq.affixes = eq.affixes || []
  const removable = eq.affixes.filter(a => !a.locked)
  if (removable.length === 0) return { success: false, message: '没有可删除的词缀（均已锁定）' }
  if (eq.affixes.length <= 1 && !allowEmpty) return { success: false, message: '至少保留 1 条词缀（可在设置开启「允许清空」）' }
  const target = removable[Math.floor(Math.random() * removable.length)]
  eq.affixes = eq.affixes.filter(a => a !== target)
  return { success: true, message: `删除了词缀「${target.name}」`, removed: target }
}

// 血祭符：腐化（+1 强化 / 变异词缀 / 5% 碎裂；腐化后不可再 craft）
export function corruptEquipment(eq) {
  if (eq.corrupted) return { success: false, message: '该装备已腐化，不可再次腐化' }
  const r = Math.random()
  eq.corrupted = true
  if (r < 0.05) return { success: true, shattered: true, message: '血祭失败，装备碎裂消散……' }
  if (r < 0.45) {
    eq.enhanceLevel = (eq.enhanceLevel || 0) + 1
    return { success: true, message: `血祭成功，强化等级 +1（现 +${eq.enhanceLevel}）` }
  }
  // 变异：随机一条词缀提升一档；若无，则 +1 强化
  const pool = (eq.affixes || []).filter(a => (a.qualityTier || 4) > 1)
  if (pool.length === 0) {
    eq.enhanceLevel = (eq.enhanceLevel || 0) + 1
    return { success: true, message: `血祭成功，强化等级 +1（现 +${eq.enhanceLevel}）` }
  }
  const af = pool[Math.floor(Math.random() * pool.length)]
  const def = findAffixDef(af)
  af.qualityTier = (af.qualityTier || 4) - 1
  if (def) af.value = rollAffixQualityValue(def, af.qualityTier)
  return { success: true, message: `血祭变异：「${af.name}」跃升至 T${af.qualityTier}` }
}

// 统一入口：对装备使用某货币（targetAffixId 视货币需要）
export function applyCraftCurrency(eq, currencyId, targetAffixId = null, opts = {}) {
  if (!eq || typeof eq !== 'object') return { success: false, message: '无效的装备' }
  if (eq.corrupted && currencyId !== 'blood_sigil') return { success: false, message: '已腐化装备不可再 craft' }
  switch (currencyId) {
    case 'refine_stone': return rerollAffixValues(eq)
    case 'lock_rune': return toggleAffixLock(eq, targetAffixId)
    case 'chaos_sand': return rerollAllAffixes(eq)
    case 'divine_stone': return rerollAffixValues(eq)
    case 'exalt_stone': return addAffix(eq)
    case 'law_stone': return upgradeAffixTier(eq, targetAffixId)
    case 'annul_dew': return annulAffix(eq, !!opts.allowEmpty)
    case 'blood_sigil': return corruptEquipment(eq)
    default: return { success: false, message: '未知货币' }
  }
}
