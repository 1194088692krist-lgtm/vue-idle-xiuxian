// 灵石阁（商店）配置
// 设计定位：作为「补缺枢纽」而非「回收 Sink」
//   原「通胀治理 / 灵石回收」假设（endgame 灵石通胀需回收）经核实不成立——
//   实测 endgame 突破成本反倒稀缺（单次 800万-2亿，累计约 30亿），灵石不是溢出而是瓶颈。
//   故商店改以「需求驱动、以物易物为主灵石为辅、每项服务落真实系统」为原则。
// 当前 P0 范围：修死代码（增益符消耗品从未进入战斗结算，纯死代码）+ 上线「求材」定向 BOSS 素材兑换。

import { BOSS_MATERIALS, BOSS_TICKETS } from './cultivationSystem'
import { craftCurrencies } from './craftCurrency'
import { runes } from './runes'

// 境界阶段 → 价格倍率（自动匹配玩家进度，让 endgame 价格自动变贵）
export const PHASE_PRICE_MULT = {
  early: 1,
  mid: 3,
  late: 10,
  endgame: 25
}

// ===== 求材：定向 BOSS 素材兑换（补缺枢纽核心服务） =====
// 三重约束：
//   1) 进度门控：仅开放「玩家已解锁秘境」的 BOSS 素材（见 ZONE_UNLOCK_LEVEL）
//   2) 溢价定价：终价 = 基础价 × 境界倍率，基础价已内含溢价 ≈ 公平刷本机会成本 ×(1+α)
//   3) 数量软限：单素材/每日上限，保护 BOSS 循环（求材用于「解卡」，不替代刷本）
// 溢价系数 α ∈ [0.3, 0.6]，当前取 0.45；全部数值 [PLACEHOLDER]，待 playtest 校准。

// 各秘境首现突破等级（进度门控依据：玩家 level >= 此值即解锁该秘境素材）
export const ZONE_UNLOCK_LEVEL = {
  forest_edge: 9,
  misty_valley: 18,
  phoenix_cave: 27,
  dragon_abyss: 36,
  ghost_wasteland: 45,
  ice_palace: 54,
  immortal_ruins: 63,
  chaos_realm: 72
}

// 求材基础价（early 参考；×PHASE_PRICE_MULT 后为终价）—— 已内含溢价，[PLACEHOLDER]
//   参考锚点：灭世档单场期望产出 ~2.2万灵石，BOSS 掉率 7%-18%
//   → 单素材公平刷本机会成本约 13万-31万（endgame）。下表 endgame 终价明显高于此，即「溢价」。
export const SEEK_BASE_PRICE = {
  forest_edge: 8000,     // endgame 终价 ≈ 20万
  misty_valley: 11000,   // ≈ 27.5万
  phoenix_cave: 15000,   // ≈ 37.5万
  dragon_abyss: 22000,   // ≈ 55万
  ghost_wasteland: 30000,// ≈ 75万
  ice_palace: 42000,     // ≈ 105万
  immortal_ruins: 58000, // ≈ 145万
  chaos_realm: 80000     // ≈ 200万
}

export const SEEK_CONFIG = {
  premiumAlpha: 0.45,            // [PLACEHOLDER] 溢价系数，区间 [0.3, 0.6]
  perMaterialDailyCap: 2,        // 单素材每日兑换上限（保护 BOSS 循环）
  globalDailyCap: 6              // 每日求材总次数上限（保护 BOSS 循环）
}

// 素材 id → 所属秘境（由 BOSS_MATERIALS 反向推导，单一数据源，避免硬编码映射漂移）
const MATERIAL_ZONE = {}
for (const [zone, list] of Object.entries(BOSS_MATERIALS)) {
  for (const m of list) MATERIAL_ZONE[m.id] = zone
}
export function getSeekMaterialZone(materialId) {
  return MATERIAL_ZONE[materialId] || null
}
// 求材定价：基础价(按秘境) × 境界倍率
export function getSeekMaterialPrice(materialId, phaseName) {
  const zone = getSeekMaterialZone(materialId)
  if (!zone) return 0
  const base = SEEK_BASE_PRICE[zone] || 0
  return Math.round(base * (PHASE_PRICE_MULT[phaseName] || 1))
}


// ===== 点化·兑币：定向工艺货币兑换（与「求材」同构） =====
// 进度门控：仅开放玩家已 farm 到的秘境货币（c.dropZoneMin <= 秘境进度序号）
// 溢价定价 + 数量软限，保护「刷本掉货币」主循环
// 秘境进度序号：由突破等级反推（与求材同源：forest_edge:9→zone1 … chaos_realm:72→zone8）
export const CRAFT_ZONE_PROGRESS = (level) => {
  if (level >= 63) return 8
  if (level >= 54) return 7
  if (level >= 45) return 6
  if (level >= 36) return 5
  if (level >= 27) return 4
  if (level >= 18) return 3
  if (level >= 9) return 2
  return 1
}
// 兑币基础价（early 参考，×PHASE_PRICE_MULT 为终价）—— [PLACEHOLDER]
//   参考：工艺货币 zone 掉落率 CRAFT_DROP_CHANCE_BY_ZONE 0.10-0.36（×难度 drop），单次挂机期望 0-1 个
//   公平成本 ≈ 单货币期望挂机场数 × 单场灵石；下表已含溢价（endgame 终价见注释）
export const CRAFT_BASE_PRICE = {
  refine_stone: 3000,    // endgame ≈ 7.5万（最常用、量大）
  lock_rune: 6000,      // ≈ 15万
  chaos_sand: 12000,    // ≈ 30万
  divine_stone: 15000,  // ≈ 37.5万
  exalt_stone: 25000,   // ≈ 62.5万（bossOnly）
  law_stone: 30000,     // ≈ 75万（升档核心）
  annul_dew: 35000,     // ≈ 87.5万（bossOnly）
  blood_sigil: 60000    // ≈ 150万（zone6 rare，腐化）
}
export const CRAFT_EXCHANGE_CONFIG = {
  premiumAlpha: 0.45,          // [PLACEHOLDER] 溢价系数 [0.3, 0.6]
  perCurrencyDailyCap: 3,      // 单货币每日兑换上限
  globalDailyCap: 10           // 每日兑币总次数上限
}
export function getCraftCurrencyPrice(currencyId, phaseName) {
  const base = CRAFT_BASE_PRICE[currencyId] || 0
  return Math.round(base * (PHASE_PRICE_MULT[phaseName] || 1))
}

// ===== 开纹·兑纹：定向灵纹兑换（与「求材」同构） =====
// 灵纹当前随机掉落（getRandomRune），无定向获取路径；商店补「指定灵纹」出口
// 进度门控：epic 灵纹需秘境进度 >=4（mid），rare 全程开放
export const RUNE_BASE_PRICE = {
  rune_fire_atk: 8000, rune_water_hp: 8000, rune_metal_def: 8000, rune_wood_spd: 8000, rune_earth_hp: 8000,
  rune_fire_crit: 16000, rune_water_heal: 16000, rune_metal_pen: 16000, rune_wood_dodge: 16000, rune_earth_res: 16000
}
export const RUNE_EXCHANGE_CONFIG = {
  epicUnlockZone: 4,           // epic 灵纹解锁所需秘境进度序号
  perRuneDailyCap: 1,          // 单灵纹每日兑换上限（保稀缺）
  globalDailyCap: 4            // 每日兑纹总次数上限
}
export function getRunePrice(runeId, phaseName) {
  const base = RUNE_BASE_PRICE[runeId] || 0
  return Math.round(base * (PHASE_PRICE_MULT[phaseName] || 1))
}


// ===== 觅宝/悬赏·兑券（P2-A）：挑战券 → 定向稀缺资源（与「求材」同构） =====
// 进度门控：仅已解锁秘境的挑战券与对应稀缺资源
// 以券易物：消耗 boss_ticket（复用 consumeBossTicket），保底给 1 个该秘境定向稀缺资源
// 每日软限：悬赏榜每日刷新 K 条，每条限兑 1 次（清 surplus 券，不替代刷本）
export const BOUNTY_CONFIG = {
  boardSize: 3,                 // 每日悬赏条数 [PLACEHOLDER]
  ticketCostMin: 3,             // 单条悬赏挑战券成本下限 [PLACEHOLDER]
  ticketCostMax: 8,             // 上限 [PLACEHOLDER]
  rerollBaseCost: 20000,        // 手动刷新悬赏榜灵石成本（首回）[PLACEHOLDER]
  rerollGrowth: 2,              // 每次刷新 ×2 [PLACEHOLDER]
  rerollMaxPerDay: 3,
  grantPool: ['boss_material', 'craft_currency', 'rune']
}
function _bountyPick(arr) {
  if (!arr || !arr.length) return null
  return arr[Math.floor(Math.random() * arr.length)]
}
function _bountyRandomZone(level) {
  const zones = Object.keys(ZONE_UNLOCK_LEVEL).filter(z => (level || 1) >= ZONE_UNLOCK_LEVEL[z])
  return _bountyPick(zones)
}
// 生成悬赏榜：每条绑定一个具体挑战券，grant = 该券所属秘境的定向稀缺资源
export function rollBountyBoard(level) {
  const zp = CRAFT_ZONE_PROGRESS(level || 1)
  const slots = []
  for (let i = 0; i < BOUNTY_CONFIG.boardSize; i++) {
    const zone = _bountyRandomZone(level)
    if (!zone) continue
    const ticket = _bountyPick(BOSS_TICKETS[zone] || [])
    if (!ticket) continue
    const grantKind = _bountyPick(BOUNTY_CONFIG.grantPool)
    let grantId = null, grantName = ''
    if (grantKind === 'boss_material') {
      const m = _bountyPick(BOSS_MATERIALS[zone] || [])
      if (m) { grantId = m.id; grantName = m.name }
    } else if (grantKind === 'craft_currency') {
      const cu = _bountyPick(Object.values(craftCurrencies).filter(cu => (cu.dropZoneMin || 0) <= zp))
      if (cu) { grantId = cu.id; grantName = cu.name }
    } else {
      const r = _bountyPick(runes.filter(r => r.rarity !== 'epic' || zp >= RUNE_EXCHANGE_CONFIG.epicUnlockZone))
      if (r) { grantId = r.id; grantName = r.name }
    }
    if (!grantId) continue
    const zoneIdx = Object.keys(ZONE_UNLOCK_LEVEL).indexOf(zone) + 1
    const ticketCost = BOUNTY_CONFIG.ticketCostMin +
      Math.floor(Math.random() * (BOUNTY_CONFIG.ticketCostMax - BOUNTY_CONFIG.ticketCostMin + 1)) + (zoneIdx - 1)
    slots.push({
      uid: `bty_${Date.now()}_${i}_${Math.floor(Math.random() * 1e4)}`,
      zone, ticketId: ticket.id, ticketName: ticket.name,
      grantKind, grantId, grantName, ticketCost, claimed: false
    })
  }
  return slots
}
export function getBountyRerollCost(currentCount) {
  return Math.round(BOUNTY_CONFIG.rerollBaseCost * Math.pow(BOUNTY_CONFIG.rerollGrowth, currentCount))
}

// ===== 易物（P2-B）：多余 ore ↔ 稀缺 boss_material（以物易物为主、灵石为辅） =====
// 进度门控：仅已解锁秘境的 boss_material 作为易出目标
// 以 abundant ore（iron_essence）为主要代价 + 小额灵石溢价；每日软限
export const BARTER_CONFIG = {
  oreId: 'iron_essence',        // 易物主要代价（玩家常盈余的普通矿料）
  oreCostBase: 20,              // 易出 1 个 boss_material 所需 ore 基数 [PLACEHOLDER]
  oreCostPerTier: 8,            // 按目标秘境 tier 递增 [PLACEHOLDER]
  stonePremiumMult: 0.15,       // 灵石溢价 = 该素材求材价 × 此系数（小额）[PLACEHOLDER]
  perTargetDailyCap: 1,
  globalDailyCap: 4
}
export function getBarterOreCost(tier) {
  return BARTER_CONFIG.oreCostBase + (tier - 1) * BARTER_CONFIG.oreCostPerTier
}
// 易物目录：已解锁秘境的全部 boss_material（与求材同口径，代价为 ore + 小额石）
export function getBarterTargets(level) {
  const out = []
  for (const [zone, mats] of Object.entries(BOSS_MATERIALS)) {
    if ((level || 1) < (ZONE_UNLOCK_LEVEL[zone] || Infinity)) continue
    const tier = Object.keys(ZONE_UNLOCK_LEVEL).indexOf(zone) + 1
    for (const m of mats) {
      out.push({ id: m.id, name: m.name, description: m.description, zone, tier, oreCost: getBarterOreCost(tier) })
    }
  }
  return out
}

// ===== 黑市：限量随机刷新的高价商品（大额回收 + 装饰/收藏） =====
// 注：原「混沌核心盲盒」已移除——定向 BOSS 素材改由「求材」提供，避免随机盲盒与补缺定位冲突。
export const BLACK_MARKET_POOL = [
  // 稀有外观/幻化（纯装饰，不影响数值，高价回收）
  {
    id: 'appearance_aura_gold',
    name: '金光护体（幻化）',
    description: '角色周身环绕金光，彰显大罗气运',
    icon: '✨',
    type: 'appearance',
    rarity: 'legendary',
    priceRange: [500000, 1000000], // 50万-100万，约 1-2 天挂机产出
    stock: 1
  },
  {
    id: 'appearance_aura_purple',
    name: '紫气东来（幻化）',
    description: '紫气缭绕，仙气凛然',
    icon: '🔮',
    type: 'appearance',
    rarity: 'epic',
    priceRange: [200000, 400000],
    stock: 1
  },
  // 限定称号
  {
    id: 'title_chaos_slayer',
    name: '称号：混沌屠戮者',
    description: '击败混沌之主的无上荣耀',
    icon: '🏆',
    type: 'title',
    rarity: 'mythic',
    priceRange: [1500000, 3000000], // 150万-300万，重度玩家月度目标
    stock: 1
  },
  // 大额工艺货币包（补缺 + 回收，对应 P1「点化」支柱）
  {
    id: 'pack_law_stone',
    name: '凝律石 ×3',
    description: '词缀升档专用货币，定向补缺',
    icon: '📜',
    type: 'currency',
    rarity: 'epic',
    priceRange: [100000, 200000],
    stock: 3,
    grant: { kind: 'craftCurrency', id: 'law_stone', amount: 3 }
  },
  {
    id: 'pack_chaos_sand',
    name: '重铸灵砂 ×2',
    description: '清空重生成全部词缀',
    icon: '⚗️',
    type: 'currency',
    rarity: 'epic',
    priceRange: [80000, 150000],
    stock: 2,
    grant: { kind: 'craftCurrency', id: 'chaos_sand', amount: 2 }
  },
  // 灵宠精华大包
  {
    id: 'pack_pet_essence',
    name: '灵宠精华 ×50',
    description: '灵宠系统通用资源',
    icon: '🐾',
    type: 'currency',
    rarity: 'rare',
    priceRange: [50000, 100000],
    stock: 5,
    grant: { kind: 'resource', id: 'petEssence', amount: 50 }
  }
]

// 黑市刷新配置
export const BLACK_MARKET_CONFIG = {
  autoRefreshInterval: 24 * 3600 * 1000, // 24小时自动刷新
  itemsPerRefresh: 4,                    // 每次刷新 4 件商品
  manualRefreshBaseCost: 10000,          // 首次手动刷新 1万灵石
  manualRefreshGrowth: 3,                // 每次刷新价格 ×3 递增
  manualRefreshMaxPerDay: 5              // 每日最多手动刷新 5 次
}

// 从黑市池随机抽取 N 件商品（带价格随机）
export function rollBlackMarketItems(count = BLACK_MARKET_CONFIG.itemsPerRefresh) {
  const pool = [...BLACK_MARKET_POOL]
  const result = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    const item = pool.splice(idx, 1)[0]
    const [lo, hi] = item.priceRange
    const price = Math.floor(lo + Math.random() * (hi - lo))
    result.push({
      ...item,
      uid: 'bm_' + Date.now() + '_' + i, // 唯一 ID（防重复购买）
      price,
      sold: false // 是否已售罄
    })
  }
  return result
}

// 计算手动刷新成本（递增）
export function getManualRefreshCost(currentCount) {
  return Math.round(
    BLACK_MARKET_CONFIG.manualRefreshBaseCost *
    Math.pow(BLACK_MARKET_CONFIG.manualRefreshGrowth, currentCount)
  )
}
