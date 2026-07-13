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
        stats: { attack: 20, health: 200, defense: 5, speed: 15 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [20, 50] },
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
        stats: { attack: 30, health: 180, defense: 8, speed: 10 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [30, 60] },
          { type: 'equipment', chance: 0.35, rarity: ['common', 'uncommon'], slot: 'hands' },
          { type: 'cultivation', chance: 0.5, amount: [50, 100] }
        ],
        dropRateBonus: 1.1
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.5, amount: [5, 20], name: '灵石' },
      { type: 'herb', chance: 0.3, amount: [1, 3], name: '灵草' },
      { type: 'cultivation', chance: 0.3, amount: [10, 30], name: '修为' },
      { type: 'equipment', chance: 0.08, rarity: ['common'], name: '凡品装备' }
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
    minLevel: 5,
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
        stats: { attack: 50, health: 400, defense: 15, speed: 18 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [50, 120] },
          { type: 'equipment', chance: 0.4, rarity: ['uncommon', 'rare'], slot: 'body' },
          { type: 'pet', chance: 0.1, rarity: ['mortal'] }
        ],
        dropRateBonus: 1.2
      },
      {
        id: 'valley_boss_2',
        name: '骷髅将军',
        description: '远古战场遗留的亡灵将军，刀枪不入',
        traits: ['高防御', '召唤骷髅'],
        stats: { attack: 35, health: 600, defense: 30, speed: 8 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [60, 150] },
          { type: 'equipment', chance: 0.35, rarity: ['uncommon', 'rare'], slot: 'shoulder' },
          { type: 'herb', chance: 0.6, amount: [4, 10] }
        ],
        dropRateBonus: 1.15
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.4, amount: [20, 60], name: '灵石' },
      { type: 'herb', chance: 0.3, amount: [3, 8], name: '灵草' },
      { type: 'cultivation', chance: 0.25, amount: [50, 150], name: '修为' },
      { type: 'equipment', chance: 0.12, rarity: ['common', 'uncommon'], name: '凡品装备' }
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
    minLevel: 10,
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
        stats: { attack: 80, health: 800, defense: 25, speed: 12 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [100, 250] },
          { type: 'equipment', chance: 0.45, rarity: ['rare', 'epic'], slot: 'weapon' },
          { type: 'herb', chance: 0.5, amount: [5, 15] }
        ],
        dropRateBonus: 1.3
      },
      {
        id: 'phoenix_boss_2',
        name: '火凤凰',
        description: '涅槃重生的神鸟，虽非真凤却也威震一方',
        traits: ['范围攻击', '复活一次'],
        stats: { attack: 60, health: 600, defense: 20, speed: 25 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [120, 300] },
          { type: 'equipment', chance: 0.5, rarity: ['rare', 'epic'], slot: 'ring1' },
          { type: 'pet', chance: 0.15, rarity: ['spiritual'] }
        ],
        dropRateBonus: 1.4
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.35, amount: [50, 150], name: '灵石' },
      { type: 'herb', chance: 0.25, amount: [5, 15], name: '灵草' },
      { type: 'cultivation', chance: 0.25, amount: [150, 400], name: '修为' },
      { type: 'equipment', chance: 0.15, rarity: ['uncommon', 'rare'], name: '精品装备' },
      { type: 'pet', chance: 0.08, rarity: ['mortal', 'spiritual'], name: '凡品灵宠' }
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
    minLevel: 15,
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
        stats: { attack: 150, health: 1500, defense: 50, speed: 20 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [200, 500] },
          { type: 'equipment', chance: 0.55, rarity: ['epic'], slot: 'necklace' },
          { type: 'pet', chance: 0.2, rarity: ['mystic'] }
        ],
        dropRateBonus: 1.5
      },
      {
        id: 'dragon_boss_2',
        name: '血魔大帝',
        description: '吸食万千生灵精血而成的恐怖存在',
        traits: ['吸血', '腐蚀攻击'],
        stats: { attack: 120, health: 2000, defense: 35, speed: 15 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [250, 600] },
          { type: 'equipment', chance: 0.5, rarity: ['rare', 'epic'], slot: 'wrist' },
          { type: 'cultivation', chance: 0.6, amount: [500, 1000] }
        ],
        dropRateBonus: 1.45
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.3, amount: [100, 300], name: '灵石' },
      { type: 'herb', chance: 0.2, amount: [8, 20], name: '灵草' },
      { type: 'cultivation', chance: 0.25, amount: [300, 800], name: '修为' },
      { type: 'equipment', chance: 0.2, rarity: ['rare', 'epic'], name: '上品装备' },
      { type: 'pet', chance: 0.12, rarity: ['spiritual', 'mystic'], name: '灵品灵宠' }
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
    minLevel: 20,
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
        stats: { attack: 200, health: 3000, defense: 60, speed: 18 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [400, 1000] },
          { type: 'equipment', chance: 0.6, rarity: ['legendary'], slot: 'head' },
          { type: 'pet', chance: 0.25, rarity: ['celestial'] }
        ],
        dropRateBonus: 1.6
      },
      {
        id: 'ghost_boss_2',
        name: '白骨魔尊',
        description: '由无尽白骨堆砌而成的恐怖存在，不死不灭',
        traits: ['分身', '再生'],
        stats: { attack: 180, health: 4000, defense: 80, speed: 12 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [500, 1200] },
          { type: 'equipment', chance: 0.55, rarity: ['legendary'], slot: 'body' },
          { type: 'herb', chance: 0.4, amount: [15, 35] }
        ],
        dropRateBonus: 1.55
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.2, amount: [200, 500], name: '灵石' },
      { type: 'herb', chance: 0.15, amount: [10, 25], name: '灵草' },
      { type: 'cultivation', chance: 0.2, amount: [500, 1200], name: '修为' },
      { type: 'equipment', chance: 0.25, rarity: ['legendary', 'mythic'], name: '极品装备' },
      { type: 'pet', chance: 0.2, rarity: ['mystic', 'celestial'], name: '玄品灵宠' }
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
    minLevel: 25,
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
        stats: { attack: 350, health: 5000, defense: 100, speed: 22 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [800, 2000] },
          { type: 'equipment', chance: 0.65, rarity: ['legendary', 'mythic'], slot: 'feet' },
          { type: 'pet', chance: 0.3, rarity: ['celestial'] }
        ],
        dropRateBonus: 1.7
      },
      {
        id: 'ice_boss_2',
        name: '冰封古魔',
        description: '被封印万年的上古魔修，实力深不可测',
        traits: ['时间减速', '封印技能'],
        stats: { attack: 400, health: 6000, defense: 120, speed: 15 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [1000, 2500] },
          { type: 'equipment', chance: 0.6, rarity: ['mythic'], slot: 'belt' },
          { type: 'cultivation', chance: 0.5, amount: [2000, 5000] }
        ],
        dropRateBonus: 1.65
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.15, amount: [400, 1000], name: '灵石' },
      { type: 'herb', chance: 0.1, amount: [15, 35], name: '灵草' },
      { type: 'cultivation', chance: 0.2, amount: [800, 2000], name: '修为' },
      { type: 'equipment', chance: 0.3, rarity: ['mythic'], name: '仙品装备' },
      { type: 'pet', chance: 0.25, rarity: ['celestial'], name: '仙品灵宠' }
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
    minLevel: 30,
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
        stats: { attack: 600, health: 10000, defense: 180, speed: 25 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [1500, 4000] },
          { type: 'equipment', chance: 0.7, rarity: ['mythic'], slot: 'artifact' },
          { type: 'pet', chance: 0.35, rarity: ['divine'] }
        ],
        dropRateBonus: 1.8
      },
      {
        id: 'immortal_boss_2',
        name: '堕落仙君',
        description: '曾经的仙人，堕入魔道后更加强大',
        traits: ['魔仙双修', '变身'],
        stats: { attack: 700, health: 12000, defense: 200, speed: 20 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [2000, 5000] },
          { type: 'equipment', chance: 0.65, rarity: ['mythic'], slot: 'ring2' },
          { type: 'cultivation', chance: 0.4, amount: [5000, 12000] }
        ],
        dropRateBonus: 1.75
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.1, amount: [800, 2000], name: '灵石' },
      { type: 'herb', chance: 0.08, amount: [20, 50], name: '灵草' },
      { type: 'cultivation', chance: 0.2, amount: [1500, 4000], name: '修为' },
      { type: 'equipment', chance: 0.35, rarity: ['mythic'], name: '仙品装备' },
      { type: 'pet', chance: 0.27, rarity: ['divine'], name: '神品灵宠' }
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
    minLevel: 35,
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
        stats: { attack: 1200, health: 20000, defense: 300, speed: 30 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [3000, 8000] },
          { type: 'equipment', chance: 0.75, rarity: ['mythic'], slot: 'weapon' },
          { type: 'pet', chance: 0.4, rarity: ['divine'] }
        ],
        dropRateBonus: 2.0
      },
      {
        id: 'chaos_boss_2',
        name: '天道化身',
        description: '天道在混沌中的投影，代表着至高法则',
        traits: ['因果律', '无法闪避'],
        stats: { attack: 1500, health: 25000, defense: 350, speed: 35 },
        drops: [
          { type: 'spirit_stone', chance: 0.8, amount: [5000, 15000] },
          { type: 'equipment', chance: 0.8, rarity: ['mythic'], slot: 'artifact' },
          { type: 'cultivation', chance: 0.3, amount: [10000, 30000] }
        ],
        dropRateBonus: 2.0
      }
    ],
    rewards: [
      { type: 'spirit_stone', chance: 0.05, amount: [2000, 5000], name: '灵石' },
      { type: 'herb', chance: 0.05, amount: [30, 80], name: '灵草' },
      { type: 'cultivation', chance: 0.2, amount: [3000, 8000], name: '修为' },
      { type: 'equipment', chance: 0.4, rarity: ['mythic'], name: '仙品装备' },
      { type: 'pet', chance: 0.3, rarity: ['divine'], name: '神品灵宠' }
    ],
    recommendedStats: { attack: 1000, health: 10000 }
  }
]

export const difficultyTiers = {
  1: { name: '入门', unlockLevel: 1 },
  2: { name: '普通', unlockLevel: 1 },
  3: { name: '困难', unlockLevel: 10 },
  4: { name: '精英', unlockLevel: 15 },
  5: { name: '噩梦', unlockLevel: 25 },
  6: { name: '地狱', unlockLevel: 35 },
  7: { name: '仙境', unlockLevel: 45 },
  8: { name: '混沌', unlockLevel: 55 }
}

export const getZoneById = (id) => zones.find(z => z.id === id)

export const getZonesByDifficulty = (difficulty) => zones.filter(z => z.difficulty <= difficulty)

export const calculateZoneDifficultyRating = (zone) => {
  const baseRating = zone.difficulty * 10
  const levelBonus = (zone.minLevel - 1) * 2
  return Math.round(baseRating + levelBonus)
}

export const canEnterZone = (zone, playerStats) => {
  if (!playerStats) return false
  const req = zone.recommendedStats
  const attackOk = (playerStats.attack || 10) >= req.attack * 0.5
  const healthOk = (playerStats.health || 100) >= req.health * 0.5
  return attackOk && healthOk
}

export const isZoneUnlocked = (zone, playerLevel) => {
  return playerLevel >= zone.minLevel
}

export const getBossById = (zoneId, bossId) => {
  const zone = getZoneById(zoneId)
  if (!zone || !zone.bosses) return null
  return zone.bosses.find(b => b.id === bossId)
}

export const getRandomBoss = (zone) => {
  if (!zone.bosses || zone.bosses.length === 0) return null
  return zone.bosses[Math.floor(Math.random() * zone.bosses.length)]
}