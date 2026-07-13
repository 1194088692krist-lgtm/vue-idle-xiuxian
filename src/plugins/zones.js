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
