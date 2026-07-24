// 通胀治理：商店系统配置
// 设计目标：作为可循环、不可毕业、随进度递增的灵石回收主战场
// 商品类型：消耗品（高频 sink） + 黑市限量（大额回收）
// 定价锚点：灭世档单场期望产出 ~2.2万灵石，30分钟约 60-120 场，时产 50-100万

// ===== 消耗品：高频可重复购买的增益丹 =====
// 价格按玩家境界 phaseMultiplier 缩放，自动匹配产出量级
// 效果持续 1 小时（对应一次完整挂机）
export const CONSUMABLES = [
  {
    id: 'buff_attack',
    name: '攻伐符',
    description: '下次挂机期间角色攻击力 +20%，持续 1 小时',
    icon: '⚔️',
    effect: { type: 'attack', multiplier: 0.2, duration: 3600 }, // duration 秒
    basePrice: 8000,   // 基础价，× phaseMultiplier 后约 1.6万-32万
    category: 'combat'
  },
  {
    id: 'buff_drop',
    name: '寻宝符',
    description: '下次挂机期间装备/素材掉率 +15%，持续 1 小时',
    icon: '🍀',
    effect: { type: 'dropRate', multiplier: 0.15, duration: 3600 },
    basePrice: 12000,
    category: 'fortune'
  },
  {
    id: 'buff_exp',
    name: '悟道符',
    description: '下次挂机期间修为获取 +30%，持续 1 小时',
    icon: '📖',
    effect: { type: 'expGain', multiplier: 0.3, duration: 3600 },
    basePrice: 10000,
    category: 'cultivation'
  },
  {
    id: 'buff_stone',
    name: '聚财符',
    description: '下次挂机期间灵石掉落 +25%，持续 1 小时',
    icon: '💰',
    effect: { type: 'spiritStoneRate', multiplier: 0.25, duration: 3600 },
    basePrice: 15000,
    category: 'fortune'
  },
  {
    id: 'lucky_charm',
    name: '强运符',
    description: '下次 BOSS 战必掉高一档品质素材（一次性消耗）',
    icon: '🌟',
    effect: { type: 'bossLuckyDrop', multiplier: 1, duration: 0 }, // 一次性
    basePrice: 50000,
    category: 'fortune'
  }
]

// 境界阶段 → 价格倍率（自动匹配玩家进度，让 endgame 价格自动变贵）
export const PHASE_PRICE_MULT = {
  early: 1,
  mid: 3,
  late: 10,
  endgame: 25
}

// ===== 黑市：限量随机刷新的高价商品（大额回收） =====
// 每日自动刷新一次，可手动刷新（灵石消耗递增）
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
  // 大额工艺货币包（补缺 + 回收）
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
  // BOSS 素材盲盒（缓解卡关）
  {
    id: 'pack_boss_material',
    name: '混沌核心 ×2',
    description: '高阶 BOSS 素材，突破卡关利器',
    icon: '🔥',
    type: 'material',
    rarity: 'legendary',
    priceRange: [300000, 500000],
    stock: 1,
    grant: { kind: 'material', id: 'chaos_core', amount: 2 }
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

// 计算消耗品当前价格（按玩家境界缩放）
export function getConsumablePrice(item, phaseMultiplier) {
  return Math.round(item.basePrice * (PHASE_PRICE_MULT[phaseMultiplier] || 1))
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
