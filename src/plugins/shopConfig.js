// 灵石阁（商店）配置
// 设计定位：作为「补缺枢纽」而非「回收 Sink」
//   原「通胀治理 / 灵石回收」假设（endgame 灵石通胀需回收）经核实不成立——
//   实测 endgame 突破成本反倒稀缺（单次 800万-2亿，累计约 30亿），灵石不是溢出而是瓶颈。
//   故商店改以「需求驱动、以物易物为主灵石为辅、每项服务落真实系统」为原则。
// 当前 P0 范围：修死代码（增益符消耗品从未进入战斗结算，纯死代码）+ 上线「求材」定向 BOSS 素材兑换。

import { BOSS_MATERIALS } from './cultivationSystem'

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
