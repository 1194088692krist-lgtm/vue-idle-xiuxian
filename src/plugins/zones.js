// 每张秘境内置的 5 档难度（修仙风命名）
// scale : 怪物属性相对「标准档(凶险)」的缩放系数
// rmMul : 奖励倍率相对该图基础倍率的系数
// cost  : 每场遭遇的灵力消耗
// drop  : 掉落率/品质加成
const DIFFICULTY_TEMPLATES = [
  { key: 'youli',     label: '游历', color: '#32CD32', scale: 0.30, rmMul: 0.6, cost: 10,  drop: 1.0 },
  { key: 'shilian',   label: '试炼', color: '#1E90FF', scale: 0.60, rmMul: 0.9, cost: 25, drop: 1.15 },
  { key: 'xiongxian', label: '凶险', color: '#9932CC', scale: 1.00, rmMul: 1.2, cost: 80, drop: 1.3 },
  { key: 'juejing',   label: '绝境', color: '#FF8C00', scale: 1.60, rmMul: 1.8, cost: 200, drop: 1.5 },
  { key: 'mieshi',    label: '灭世', color: '#B22222', scale: 2.50, rmMul: 2.8, cost: 500, drop: 1.8 }
]

// 各秘境「凶险(标准档)」对应的 Build 强度推荐值（基础属性，决定能否稳定挂机通关）
// 量级与各区自有掉落装备的满装 Build 强度一致：低区弱、高区强，形成平滑梯度
// 玩家挂机的“成功/提前失败”即以「自身 Build 强度 ÷ 推荐 Build」为判定基准
const ZONE_BUILD_BASE = {
  forest_edge: 3000,
  misty_valley: 12000,
  phoenix_cave: 55000,
  dragon_abyss: 100000,
  ghost_wasteland: 400000,
  ice_palace: 800000,
  immortal_ruins: 2000000,
  chaos_realm: 7000000
}

// Build 强度参考阶梯（区间）：极品中的极品过于稀有，故给玩家一个“可达成的上限”参考
export const BUILD_TIERS = {
  entry: { name: '入门', value: 68000, desc: '全稀有(+10)基础满装' },
  strong: { name: '强力', value: 686000, desc: '传说/史诗混搭(+20)含套装' },
  top: { name: '顶级', value: 5090000, desc: '全神话(+50)含套装' },
  apex: { name: '极限', value: 20000000, desc: '全神话(+100)双五件套·混沌级' }
}

export const zones = [
  {
    id: 'forest_edge',
    name: '青萝林',
    description: '灵气稀薄的外围森林，适合初入修仙之道的修士历练。',
    difficulty: 1,
    difficultyLabel: '入门',
    difficultyColor: '#32CD32',
    minLevel: 1,
    spiritCost: 50,
    rewardMultiplier: 1.0,
    image: '',
    monsters: ['野猪精', '山匪', '野狼'],
    bosses: [
      {
        id: 'forest_boss_1',
        name: '狼王',
        description: '青萝林的霸主，统领狼群横行霸道',
        traits: ['速度快', '群体攻击'],
        stats: { attack: 12, health: 124, defense: 4, speed: 15 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [30, 75] },
          { type: 'equipment', chance: 0.3, rarity: ['common', 'uncommon'], slot: 'weapon' },
          { type: 'herb', chance: 0.5, amount: [2, 5] }
        ],
        dropRateBonus: 1.0
      },
      {
        id: 'forest_boss_2',
        name: '山匪头目',
        description: '盘踞山林的悍匪首领，刀法凌厉',
        traits: ['高攻击', '暴击率高'],
        stats: { attack: 19, health: 112, defense: 6, speed: 10 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [45, 90] },
          { type: 'equipment', chance: 0.35, rarity: ['common', 'uncommon'], slot: 'hands' },
          { type: 'cultivation', chance: 0.5, amount: [50, 100] }
        ],
        dropRateBonus: 1.1
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.5, amount: [22, 90] },
      { type: 'herb', chance: 0.3, amount: [1, 3], name: '灵草' },
      { type: 'cultivation', chance: 0.3, amount: [25, 75] },
      { type: 'equipment', chance: 0.18, rarity: ['common', 'uncommon'], name: '装备' }
    ],
    recommendedStats: { attack: 8, health: 80 }
  },
  {
    id: 'misty_valley',
    name: '迷雾谷',
    description: '常年被迷雾笼罩的山谷，隐藏着不为人知的机缘与危险。',
    difficulty: 2,
    difficultyLabel: '普通',
    difficultyColor: '#1E90FF',
    minLevel: 1,
    spiritCost: 50,
    rewardMultiplier: 1.5,
    image: '',
    monsters: ['猛虎', '骷髅兵', '毒蛇'],
    bosses: [
      {
        id: 'valley_boss_1',
        name: '迷雾虎王',
        description: '迷雾中潜伏的兽王，一击致命',
        traits: ['高爆发', '隐蔽攻击'],
        stats: { attack: 31, health: 248, defense: 11, speed: 18 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [75, 180] },
          { type: 'equipment', chance: 0.3, rarity: ['uncommon', 'rare'], slot: 'body' },
          { type: 'pet', chance: 0.02, rarity: ['mortal'] }
        ],
        dropRateBonus: 1.2
      },
      {
        id: 'valley_boss_2',
        name: '骷髅将军',
        description: '远古战场遗留的亡灵将军，刀枪不入',
        traits: ['高防御', '召唤骷髅'],
        stats: { attack: 22, health: 372, defense: 21, speed: 8 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [90, 225] },
          { type: 'equipment', chance: 0.25, rarity: ['uncommon', 'rare'], slot: 'shoulder' },
          { type: 'herb', chance: 0.6, amount: [4, 10] }
        ],
        dropRateBonus: 1.15
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.4, amount: [90, 270] },
      { type: 'herb', chance: 0.3, amount: [3, 8], name: '灵草' },
      { type: 'cultivation', chance: 0.25, amount: [125, 375] },
      { type: 'equipment', chance: 0.22, rarity: ['uncommon', 'rare'], name: '装备' }
    ],
    recommendedStats: { attack: 25, health: 200 }
  },
  {
    id: 'phoenix_cave',
    name: '凤凰窟',
    description: '传说凤凰涅槃之地，蕴含炽热的火灵气。',
    difficulty: 3,
    difficultyLabel: '困难',
    difficultyColor: '#FF6347',
    minLevel: 1,
    spiritCost: 50,
    rewardMultiplier: 2.0,
    image: '',
    monsters: ['妖狼', '毒蛇', '焰魔'],
    bosses: [
      {
        id: 'phoenix_boss_1',
        name: '焰魔领主',
        description: '凤凰窟的火焰主宰，浑身燃烧着无尽业火',
        traits: ['火焰伤害', '灼烧效果'],
        stats: { attack: 50, health: 496, defense: 18, speed: 12 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [150, 375] },
          { type: 'equipment', chance: 0.35, rarity: ['rare', 'epic'], slot: 'weapon' },
          { type: 'herb', chance: 0.5, amount: [5, 15] }
        ],
        dropRateBonus: 1.3
      },
      {
        id: 'phoenix_boss_2',
        name: '火凤凰',
        description: '涅槃重生的神鸟，虽非真凤却也威震一方',
        traits: ['范围攻击', '复活一次'],
        stats: { attack: 37, health: 372, defense: 14, speed: 25 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [180, 450] },
          { type: 'equipment', chance: 0.35, rarity: ['rare', 'epic'], slot: 'ring1' },
          { type: 'pet', chance: 0.03, rarity: ['spiritual'] }
        ],
        dropRateBonus: 1.4
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.35, amount: [225, 675] },
      { type: 'herb', chance: 0.25, amount: [5, 15], name: '灵草' },
      { type: 'cultivation', chance: 0.25, amount: [375, 1000] },
      { type: 'equipment', chance: 0.25, rarity: ['rare', 'epic'], name: '装备' },
      { type: 'pet', chance: 0.04, rarity: ['spiritual', 'mystic'], name: '灵宠' }
    ],
    recommendedStats: { attack: 50, health: 400 }
  },
  {
    id: 'dragon_abyss',
    name: '龙渊',
    description: '深不见底的神秘深渊，蕴含远古真龙的气息与宝藏。',
    difficulty: 4,
    difficultyLabel: '精英',
    difficultyColor: '#9932CC',
    minLevel: 1,
    spiritCost: 50,
    rewardMultiplier: 3.0,
    image: '',
    monsters: ['僵尸王', '血魔', '深渊蛟龙'],
    bosses: [
      {
        id: 'dragon_boss_1',
        name: '深渊蛟龙',
        description: '龙渊深处的蛟龙，传承了远古真龙的血脉',
        traits: ['龙威震慑', '水属性攻击'],
        stats: { attack: 93, health: 930, defense: 35, speed: 20 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [300, 750] },
          { type: 'equipment', chance: 0.4, rarity: ['epic', 'legendary'], slot: 'necklace' },
          { type: 'pet', chance: 0.03, rarity: ['mystic'] }
        ],
        dropRateBonus: 1.5
      },
      {
        id: 'dragon_boss_2',
        name: '血魔大帝',
        description: '吸食万千生灵精血而成的恐怖存在',
        traits: ['吸血', '腐蚀攻击'],
        stats: { attack: 74, health: 1240, defense: 25, speed: 15 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [375, 900] },
          { type: 'equipment', chance: 0.35, rarity: ['rare', 'epic'], slot: 'wrist' },
          { type: 'cultivation', chance: 0.6, amount: [500, 1000] }
        ],
        dropRateBonus: 1.45
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.3, amount: [450, 1350] },
      { type: 'herb', chance: 0.2, amount: [8, 20], name: '灵草' },
      { type: 'cultivation', chance: 0.25, amount: [750, 2000] },
      { type: 'equipment', chance: 0.28, rarity: ['epic', 'legendary'], name: '装备' },
      { type: 'pet', chance: 0.05, rarity: ['mystic', 'celestial'], name: '灵宠' }
    ],
    recommendedStats: { attack: 100, health: 800 }
  },
  {
    id: 'ghost_wasteland',
    name: '鬼荒原',
    description: '亡灵聚集的荒芜之地，阴气弥漫，凶险异常。',
    difficulty: 5,
    difficultyLabel: '噩梦',
    difficultyColor: '#8B0000',
    minLevel: 1,
    spiritCost: 50,
    rewardMultiplier: 4.0,
    image: '',
    monsters: ['噬魂鬼', '血魔'],
    bosses: [
      {
        id: 'ghost_boss_1',
        name: '噬魂鬼王',
        description: '鬼荒原的统治者，以吞噬生灵魂魄为生',
        traits: ['灵魂攻击', '恐惧效果'],
        stats: { attack: 124, health: 1860, defense: 42, speed: 18 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [600, 1500] },
          { type: 'equipment', chance: 0.4, rarity: ['epic', 'legendary'], slot: 'head' },
          { type: 'pet', chance: 0.04, rarity: ['celestial'] }
        ],
        dropRateBonus: 1.6
      },
      {
        id: 'ghost_boss_2',
        name: '白骨魔尊',
        description: '由无尽白骨堆砌而成的恐怖存在，不死不灭',
        traits: ['分身', '再生'],
        stats: { attack: 112, health: 2480, defense: 56, speed: 12 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [750, 1800] },
          { type: 'equipment', chance: 0.35, rarity: ['epic', 'legendary'], slot: 'body' },
          { type: 'herb', chance: 0.4, amount: [15, 35] }
        ],
        dropRateBonus: 1.55
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.2, amount: [900, 2250] },
      { type: 'herb', chance: 0.15, amount: [10, 25], name: '灵草' },
      { type: 'cultivation', chance: 0.2, amount: [1250, 3000] },
      { type: 'equipment', chance: 0.30, rarity: ['epic', 'legendary', 'mythic'], name: '装备' },
      { type: 'pet', chance: 0.06, rarity: ['mystic', 'celestial'], name: '灵宠' }
    ],
    recommendedStats: { attack: 150, health: 1500 }
  },
  {
    id: 'ice_palace',
    name: '冰雪宫',
    description: '极寒之地的古老宫殿，冰封着上古秘宝。',
    difficulty: 6,
    difficultyLabel: '地狱',
    difficultyColor: '#00CED1',
    minLevel: 1,
    spiritCost: 50,
    rewardMultiplier: 5.0,
    image: '',
    monsters: ['远古妖龙'],
    bosses: [
      {
        id: 'ice_boss_1',
        name: '冰凰',
        description: '镇守冰雪宫的上古神兽，一身冰系神通出神入化',
        traits: ['冰冻', '冰系AOE'],
        stats: { attack: 217, health: 3100, defense: 70, speed: 22 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [1200, 3000] },
          { type: 'equipment', chance: 0.45, rarity: ['legendary', 'mythic'], slot: 'feet' },
          { type: 'pet', chance: 0.04, rarity: ['celestial'] }
        ],
        dropRateBonus: 1.7
      },
      {
        id: 'ice_boss_2',
        name: '冰封古魔',
        description: '被封印万年的上古魔修，实力深不可测',
        traits: ['时间减速', '封印技能'],
        stats: { attack: 248, health: 3720, defense: 84, speed: 15 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [1500, 3750] },
          { type: 'equipment', chance: 0.35, rarity: ['legendary', 'mythic'], slot: 'belt' },
          { type: 'cultivation', chance: 0.5, amount: [2000, 5000] }
        ],
        dropRateBonus: 1.65
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.15, amount: [1800, 4500] },
      { type: 'herb', chance: 0.1, amount: [15, 35], name: '灵草' },
      { type: 'cultivation', chance: 0.2, amount: [2000, 5000] },
      { type: 'equipment', chance: 0.30, rarity: ['legendary', 'mythic'], name: '装备' },
      { type: 'pet', chance: 0.06, rarity: ['celestial', 'divine'], name: '灵宠' }
    ],
    recommendedStats: { attack: 300, health: 3000 }
  },
  {
    id: 'immortal_ruins',
    name: '仙墟',
    description: '上古仙人遗迹，蕴含无尽机缘，亦有重重杀机。',
    difficulty: 7,
    difficultyLabel: '仙境',
    difficultyColor: '#FFD700',
    minLevel: 1,
    spiritCost: 50,
    rewardMultiplier: 7.0,
    image: '',
    monsters: ['远古妖龙'],
    bosses: [
      {
        id: 'immortal_boss_1',
        name: '仙墟守护者',
        description: '上古仙人留下的守护者，拥有仙人之威',
        traits: ['仙术攻击', '领域压制'],
        stats: { attack: 372, health: 6200, defense: 126, speed: 25 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [2250, 6000] },
          { type: 'equipment', chance: 0.45, rarity: ['legendary', 'mythic'], slot: 'artifact' },
          { type: 'pet', chance: 0.05, rarity: ['divine'] }
        ],
        dropRateBonus: 1.8
      },
      {
        id: 'immortal_boss_2',
        name: '堕落仙君',
        description: '曾经的仙人，堕入魔道后更加强大',
        traits: ['魔仙双修', '变身'],
        stats: { attack: 434, health: 7440, defense: 140, speed: 20 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [3000, 7500] },
          { type: 'equipment', chance: 0.4, rarity: ['legendary', 'mythic'], slot: 'ring2' },
          { type: 'cultivation', chance: 0.4, amount: [5000, 12000] }
        ],
        dropRateBonus: 1.75
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.1, amount: [3600, 9000] },
      { type: 'herb', chance: 0.08, amount: [20, 50], name: '灵草' },
      { type: 'cultivation', chance: 0.2, amount: [3750, 10000] },
      { type: 'equipment', chance: 0.32, rarity: ['legendary', 'mythic'], name: '装备' },
      { type: 'pet', chance: 0.05, rarity: ['celestial', 'divine'], name: '灵宠' }
    ],
    recommendedStats: { attack: 600, health: 6000 }
  },
  {
    id: 'chaos_realm',
    name: '混沌界',
    description: '天道之外的混沌空间，超越一切法则，是通往大道的最后试炼。',
    difficulty: 8,
    difficultyLabel: '混沌',
    difficultyColor: '#4B0082',
    minLevel: 1,
    spiritCost: 50,
    rewardMultiplier: 10.0,
    image: '',
    monsters: ['远古妖龙'],
    bosses: [
      {
        id: 'chaos_boss_1',
        name: '混沌主宰',
        description: '混沌界的至高存在，一念可生灭万物',
        traits: ['法则扭曲', '全属性攻击'],
        stats: { attack: 744, health: 12400, defense: 210, speed: 30 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [4500, 12000] },
          { type: 'equipment', chance: 0.45, rarity: ['legendary', 'mythic'], slot: 'weapon' },
          { type: 'pet', chance: 0.06, rarity: ['divine'] }
        ],
        dropRateBonus: 2.0
      },
      {
        id: 'chaos_boss_2',
        name: '天道化身',
        description: '天道在混沌中的投影，代表着至高法则',
        traits: ['因果律', '无法闪避'],
        stats: { attack: 930, health: 15500, defense: 245, speed: 35 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [7500, 22500] },
          { type: 'equipment', chance: 0.4, rarity: ['mythic'], slot: 'artifact' },
          { type: 'cultivation', chance: 0.3, amount: [10000, 30000] }
        ],
        dropRateBonus: 2.0
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.05, amount: [9000, 22500] },
      { type: 'herb', chance: 0.05, amount: [30, 80], name: '灵草' },
      { type: 'cultivation', chance: 0.2, amount: [7500, 20000] },
      { type: 'equipment', chance: 0.35, rarity: ['legendary', 'mythic'], name: '装备' },
      { type: 'pet', chance: 0.06, rarity: ['celestial', 'divine'], name: '灵宠' }
    ],
    recommendedStats: { attack: 1000, health: 10000 }
  }
]

// 为各秘境补充素材类奖励（矿料/灵液/奇遇），按秘境等级解锁高难素材
zones.forEach(zone => {
  const d = zone.difficulty
  zone.rewards.push(
    { type: 'ore', chance: 0.18 + d * 0.01, amount: [1, Math.max(1, Math.floor(d / 2))], name: '矿料' },
    ...(d >= 2
      ? [{ type: 'liquid', chance: 0.12 + d * 0.01, amount: [1, Math.max(1, Math.floor(d / 3))], name: '灵液' }]
      : []),
    { type: 'fortune', chance: 0.03 + d * 0.005, amount: 1, name: '奇遇' }
  )
})

// 为每张秘境生成内置的 5 档难度（八图全开，minLevel 统一为 1）
zones.forEach(zone => {
  const baseAtk = zone.recommendedStats.attack
  const baseHp = zone.recommendedStats.health
  const baseRM = zone.rewardMultiplier
  const baseBuild = ZONE_BUILD_BASE[zone.id] || 0
  zone.difficulties = DIFFICULTY_TEMPLATES.map(t => ({
    key: t.key,
    label: t.label,
    color: t.color,
    spiritCost: t.cost,
    rewardMultiplier: Math.round(baseRM * t.rmMul * 100) / 100,
    enemyScale: t.scale,
    dropBonus: t.drop,
    recommendedStats: {
      attack: Math.max(1, Math.round(baseAtk * t.scale)),
      health: Math.max(1, Math.round(baseHp * t.scale))
    },
    // Build 强度推荐值：以标准档为基准，按难度缩放（游历0.3 → 灭世2.5）
    recommendedBuild: Math.max(1, Math.round(baseBuild * t.scale))
  }))
  // 八图全开：移除等级锁
  zone.minLevel = 1
})

export const getZoneById = (id) => zones.find(z => z.id === id)

export const getZonesByDifficulty = (difficulty) => zones.filter(z => z.difficulty <= difficulty)

export const calculateZoneDifficultyRating = (zone) => {
  const baseRating = zone.difficulty * 10
  const levelBonus = (zone.minLevel - 1) * 2
  return Math.round(baseRating + levelBonus)
}

export const canEnterZone = (zone, playerStats) => {
  if (!playerStats) return true
  const req = zone.recommendedStats
  const attackOk = (playerStats.attack || 10) >= req.attack * 0.5
  const healthOk = (playerStats.health || 100) >= req.health * 0.5
  return attackOk && healthOk
}

export const isZoneUnlocked = (zone, playerLevel) => playerLevel >= zone.minLevel

export const getBossById = (zoneId, bossId) => {
  const zone = getZoneById(zoneId)
  if (!zone || !zone.bosses) return null
  return zone.bosses.find(b => b.id === bossId)
}

export const getRandomBoss = (zone) => {
  if (!zone.bosses || zone.bosses.length === 0) return null
  return zone.bosses[Math.floor(Math.random() * zone.bosses.length)]
}

// 取某秘境指定难度的配置（缺省返回「标准档/凶险」）
export const getZoneDifficulty = (zone, key) => {
  if (!zone || !zone.difficulties) return null
  return zone.difficulties.find(d => d.key === key) || zone.difficulties[2]
}
