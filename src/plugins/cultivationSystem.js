export const CULTIVATION_PHASES = {
  early: {
    name: '前期',
    startLevel: 1,
    endLevel: 27,
    realms: ['练气', '筑基', '金丹'],
    realmLevels: {
      '练气': 9,
      '筑基': 9,
      '金丹': 9
    },
    description: '初入修仙之道，打牢基础'
  },
  mid: {
    name: '中期',
    startLevel: 28,
    endLevel: 45,
    realms: ['元婴', '出窍', '化神'],
    realmLevels: {
      '元婴': 6,
      '出窍': 6,
      '化神': 6
    },
    description: '实力大增，开始接触高深道法'
  },
  late: {
    name: '后期',
    startLevel: 46,
    endLevel: 72,
    realms: ['返虚', '合体', '大乘'],
    realmLevels: {
      '返虚': 9,
      '合体': 9,
      '大乘': 9
    },
    description: '纵横三界，威震一方'
  },
  endgame: {
    name: '终局',
    startLevel: 73,
    endLevel: 126,
    realms: ['渡劫', '仙人', '大罗'],
    realmLevels: {
      '渡劫': 18,
      '仙人': 18,
      '大罗': 18
    },
    description: '登峰造极，问鼎混沌'
  }
}

export const getPhaseByLevel = (level) => {
  if (level >= 73) return CULTIVATION_PHASES.endgame
  if (level >= 46) return CULTIVATION_PHASES.late
  if (level >= 28) return CULTIVATION_PHASES.mid
  return CULTIVATION_PHASES.early
}

export const getRealmByLevel = (level) => {
  let remainingLevel = level
  for (const phase of Object.values(CULTIVATION_PHASES)) {
    if (level >= phase.startLevel && level <= phase.endLevel) {
      remainingLevel -= phase.startLevel - 1
      for (const realm of phase.realms) {
        const realmCount = phase.realmLevels[realm]
        if (remainingLevel <= realmCount) {
          return {
            name: realm,
            level: remainingLevel,
            phase: phase
          }
        }
        remainingLevel -= realmCount
      }
    }
  }
  return { name: '大罗', level: 18, phase: CULTIVATION_PHASES.endgame }
}

export const calculateLevelExp = (level) => {
  const baseExp = 100
  const growthRate = 1.15
  return Math.floor(baseExp * Math.pow(growthRate, level - 1))
}

export const calculateTotalExpToLevel = (level) => {
  let total = 0
  for (let i = 1; i <= level; i++) {
    total += calculateLevelExp(i)
  }
  return total
}

export const calculateBreakthroughCost = (level) => {
  const phase = getPhaseByLevel(level)
  const phaseMultiplier = {
    early: 1,
    mid: 3,
    late: 10,
    endgame: 30
  }[phase.name]
  
  const spiritStones = Math.floor(100 * Math.pow(1.3, level - 1))
  const cultivation = calculateLevelExp(level) * 2
  
  const requiredMaterials = []
  if (level % 9 === 0) {
    const bossMaterial = getBossMaterialForLevel(level)
    if (bossMaterial) {
      requiredMaterials.push({ ...bossMaterial, amount: 1 })
    }
  }
  
  return {
    spiritStones: spiritStones * phaseMultiplier,
    cultivation: cultivation * phaseMultiplier,
    materials: requiredMaterials
  }
}

export const BOSS_MATERIALS = {
  forest_edge: [
    { id: 'boar_tusk', name: '野猪獠牙', description: '野猪精的獠牙，坚硬无比' },
    { id: 'bandit_emblem', name: '山匪令牌', description: '山匪首领的令牌' }
  ],
  misty_valley: [
    { id: 'snake_scale', name: '蛇鳞', description: '剧毒蛇妖的鳞片' },
    { id: 'spirit_wolf_fur', name: '灵狼皮毛', description: '灵狼的珍贵皮毛' }
  ],
  phoenix_cave: [
    { id: 'phoenix_feather', name: '凤凰羽毛', description: '浴火凤凰的羽毛，蕴含火之力' },
    { id: 'flame_core', name: '火焰核心', description: '火元素凝聚的核心' }
  ],
  dragon_abyss: [
    { id: 'dragon_scale', name: '龙鳞', description: '远古巨龙的鳞片' },
    { id: 'dragon_core', name: '龙元', description: '巨龙的核心精华' }
  ],
  ghost_wasteland: [
    { id: 'ghost_essence', name: '鬼气精华', description: '千年厉鬼凝聚的精华' },
    { id: 'bone_artifact', name: '骨器', description: '白骨炼制的法器' }
  ],
  ice_palace: [
    { id: 'ice_crystal', name: '冰晶', description: '万年不化的冰晶' },
    { id: 'frozen_core', name: '冰封核心', description: '蕴含极寒之力的核心' }
  ],
  immortal_ruins: [
    { id: 'immortal_fragment', name: '仙人碎片', description: '仙人遗留的碎片' },
    { id: 'divine_essence', name: '神性精华', description: '神明之力的碎片' }
  ],
  chaos_realm: [
    { id: 'chaos_crystal', name: '混沌水晶', description: '混沌之力凝聚的水晶' },
    { id: 'void_essence', name: '虚空精华', description: '来自虚空的神秘力量' }
  ]
}

export const getBossMaterialForLevel = (level) => {
  const zoneMap = {
    9: 'forest_edge',
    18: 'misty_valley',
    27: 'phoenix_cave',
    36: 'dragon_abyss',
    45: 'ghost_wasteland',
    54: 'ice_palace',
    63: 'immortal_ruins',
    72: 'chaos_realm',
    90: 'chaos_realm',
    108: 'chaos_realm',
    126: 'chaos_realm'
  }
  
  const zoneId = zoneMap[level]
  if (!zoneId) return null
  
  const materials = BOSS_MATERIALS[zoneId]
  return materials ? materials[level % 2 === 0 ? 0 : 1] : null
}

export const ZONE_BOSSES = {
  forest_edge: [
    {
      id: 'boss_boar_king',
      name: '野猪王',
      description: '青萝林的霸主，力大无穷',
      hpMultiplier: 5,
      attackMultiplier: 3,
      dropMaterial: 'boar_tusk',
      dropChance: 0.15
    },
    {
      id: 'boss_bandit_leader',
      name: '山匪首领',
      description: '青萝林周边的匪首',
      hpMultiplier: 4,
      attackMultiplier: 4,
      dropMaterial: 'bandit_emblem',
      dropChance: 0.18
    }
  ],
  misty_valley: [
    {
      id: 'boss_poison_snake',
      name: '毒蟒',
      description: '迷雾谷深处的剧毒蟒蛇',
      hpMultiplier: 8,
      attackMultiplier: 5,
      dropMaterial: 'snake_scale',
      dropChance: 0.12
    },
    {
      id: 'boss_spirit_wolf',
      name: '灵狼王',
      description: '迷雾谷的狼群之王',
      hpMultiplier: 6,
      attackMultiplier: 7,
      dropMaterial: 'spirit_wolf_fur',
      dropChance: 0.14
    }
  ],
  phoenix_cave: [
    {
      id: 'boss_phoenix',
      name: '浴火凤凰',
      description: '镇守凤凰窟的神鸟',
      hpMultiplier: 15,
      attackMultiplier: 10,
      dropMaterial: 'phoenix_feather',
      dropChance: 0.10
    },
    {
      id: 'boss_flame_elemental',
      name: '炎魔',
      description: '火焰凝聚的魔物',
      hpMultiplier: 12,
      attackMultiplier: 12,
      dropMaterial: 'flame_core',
      dropChance: 0.12
    }
  ],
  dragon_abyss: [
    {
      id: 'boss_ancient_dragon',
      name: '远古巨龙',
      description: '沉睡于龙渊的远古巨龙',
      hpMultiplier: 25,
      attackMultiplier: 18,
      dropMaterial: 'dragon_scale',
      dropChance: 0.08
    },
    {
      id: 'boss_dragon_spirit',
      name: '龙魂',
      description: '巨龙死后残留的灵魂',
      hpMultiplier: 20,
      attackMultiplier: 22,
      dropMaterial: 'dragon_core',
      dropChance: 0.10
    }
  ],
  ghost_wasteland: [
    {
      id: 'boss_ghost_lord',
      name: '鬼帝',
      description: '鬼荒原的统治者',
      hpMultiplier: 40,
      attackMultiplier: 30,
      dropMaterial: 'ghost_essence',
      dropChance: 0.07
    },
    {
      id: 'boss_skeleton_king',
      name: '白骨妖王',
      description: '白骨堆积而成的妖王',
      hpMultiplier: 35,
      attackMultiplier: 35,
      dropMaterial: 'bone_artifact',
      dropChance: 0.08
    }
  ],
  ice_palace: [
    {
      id: 'boss_ice_empress',
      name: '冰后',
      description: '冰雪宫的主人',
      hpMultiplier: 60,
      attackMultiplier: 45,
      dropMaterial: 'ice_crystal',
      dropChance: 0.06
    },
    {
      id: 'boss_frozen_titan',
      name: '冰封巨人',
      description: '被冰封千年的巨人',
      hpMultiplier: 55,
      attackMultiplier: 50,
      dropMaterial: 'frozen_core',
      dropChance: 0.07
    }
  ],
  immortal_ruins: [
    {
      id: 'boss_immortal_guardian',
      name: '仙人守卫',
      description: '仙墟的守护者',
      hpMultiplier: 100,
      attackMultiplier: 70,
      dropMaterial: 'immortal_fragment',
      dropChance: 0.05
    },
    {
      id: 'boss_divine_beast',
      name: '神兽',
      description: '守护仙墟的远古神兽',
      hpMultiplier: 90,
      attackMultiplier: 80,
      dropMaterial: 'divine_essence',
      dropChance: 0.06
    }
  ],
  chaos_realm: [
    {
      id: 'boss_chaos_lord',
      name: '混沌之主',
      description: '混沌界的主宰',
      hpMultiplier: 200,
      attackMultiplier: 150,
      dropMaterial: 'chaos_crystal',
      dropChance: 0.04
    },
    {
      id: 'boss_void_walker',
      name: '虚空行者',
      description: '来自虚空的神秘存在',
      hpMultiplier: 180,
      attackMultiplier: 170,
      dropMaterial: 'void_essence',
      dropChance: 0.05
    }
  ]
}

export const getBossEncounterChance = (difficultyKey) => {
  const chances = {
    xiongxian: 0.50,
    juejing: 0.75,
    mieshi: 0.90
  }
  return chances[difficultyKey] || 0
}

// 按秘境 + boss 序号（0/1）取 BOSS 素材定义
// 用于「击杀 boss 掉对应素材」以及「强化/洗练消耗对应难度 boss 素材」
export const getBossMaterialByZoneIndex = (zoneId, index) => {
  const arr = BOSS_MATERIALS[zoneId]
  if (!arr || index < 0 || index >= arr.length) return null
  return arr[index]
}

// 按 boss id（如 zones.js 中 forest_boss_1/forest_boss_2 的命名）
// 解析末尾数字得到 boss 序号（_1 -> 0, _2 -> 1），再查对应素材
export const getBossMaterialByBossId = (zoneId, bossId) => {
  if (!bossId) return null
  const match = String(bossId).match(/_(\d+)$/)
  if (!match) return null
  const idx = Math.max(0, parseInt(match[1], 10) - 1)
  return getBossMaterialByZoneIndex(zoneId, idx)
}

// 12 阶强化对应难度 BOSS 素材映射
// +1 -> forest_edge[0]（野猪獠牙，对应「狼王」）
// +2 -> forest_edge[1]
// +3 ~ +12 按 6 个秘境（青萝林~冰雪宫）每图两个素材递增
// 仙墟/混沌界 boss 素材仅作为掉落奖励，不用于强化消耗（保留稀缺性）
export const ENHANCE_BOSS_MATERIAL_MAP = {
  1:  { zoneId: 'forest_edge',     index: 0 },
  2:  { zoneId: 'forest_edge',     index: 1 },
  3:  { zoneId: 'misty_valley',    index: 0 },
  4:  { zoneId: 'misty_valley',    index: 1 },
  5:  { zoneId: 'phoenix_cave',    index: 0 },
  6:  { zoneId: 'phoenix_cave',    index: 1 },
  7:  { zoneId: 'dragon_abyss',    index: 0 },
  8:  { zoneId: 'dragon_abyss',    index: 1 },
  9:  { zoneId: 'ghost_wasteland', index: 0 },
  10: { zoneId: 'ghost_wasteland', index: 1 },
  11: { zoneId: 'ice_palace',      index: 0 },
  12: { zoneId: 'ice_palace',      index: 1 }
}

// 取强化某阶所需的 BOSS 素材（返回 {id,name,description} 或 null）
export const getEnhanceBossMaterial = (level) => {
  const cfg = ENHANCE_BOSS_MATERIAL_MAP[level]
  if (!cfg) return null
  return getBossMaterialByZoneIndex(cfg.zoneId, cfg.index)
}

// 6 档品级洗练对应难度 BOSS 素材映射
// 凡品(common) -> forest_edge[0]（对应「狼王」），按品级递增取更高难度秘境
export const REFORGE_BOSS_MATERIAL_MAP = {
  common:    { zoneId: 'forest_edge',     index: 0 },
  uncommon:  { zoneId: 'misty_valley',    index: 0 },
  rare:      { zoneId: 'phoenix_cave',    index: 0 },
  epic:      { zoneId: 'dragon_abyss',    index: 0 },
  legendary: { zoneId: 'ghost_wasteland', index: 0 },
  mythic:    { zoneId: 'ice_palace',      index: 0 }
}

// 取某品级洗练所需的 BOSS 素材
export const getReforgeBossMaterial = (rarity) => {
  const cfg = REFORGE_BOSS_MATERIAL_MAP[rarity]
  if (!cfg) return null
  return getBossMaterialByZoneIndex(cfg.zoneId, cfg.index)
}

export const calculateStatIncrease = (level) => {
  const phase = getPhaseByLevel(level)
  const phaseMultiplier = {
    early: 1,
    mid: 2,
    late: 4,
    endgame: 8
  }[phase.name]
  
  return {
    attack: Math.floor(10 * phaseMultiplier * (1 + (level - 1) * 0.05)),
    health: Math.floor(100 * phaseMultiplier * (1 + (level - 1) * 0.05)),
    defense: Math.floor(5 * phaseMultiplier * (1 + (level - 1) * 0.05)),
    speed: Math.floor(3 * phaseMultiplier * (1 + (level - 1) * 0.05))
  }
}

export const getPublicPoolExp = (player) => {
  return player.cultivationPool || 0
}

export const addToPublicPool = (player, amount) => {
  if (!player.cultivationPool) player.cultivationPool = 0
  player.cultivationPool += amount
}

export const allocateExpToCharacter = (player, memberId, amount) => {
  if (!player.cultivationPool || player.cultivationPool < amount) {
    return false
  }
  if (amount <= 0) return false

  const member = player.sectMembers.find(m => m.id === memberId)
  if (!member) return false

  if (typeof member.experience !== 'number' || isNaN(member.experience)) member.experience = 0
  if (typeof member.level !== 'number' || isNaN(member.level) || member.level < 1) member.level = 1
  if (typeof member.maxExperience !== 'number' || isNaN(member.maxExperience) || member.maxExperience <= 0) {
    member.maxExperience = calculateLevelExp(member.level)
  }

  player.cultivationPool -= amount
  member.experience += amount

  let safetyCounter = 0
  const MAX_LEVEL = 999
  while (member.experience >= member.maxExperience && member.level < MAX_LEVEL && safetyCounter < 100) {
    member.experience -= member.maxExperience
    member.level++
    const nextLevelExp = calculateLevelExp(member.level)
    if (!nextLevelExp || isNaN(nextLevelExp) || nextLevelExp <= 0) {
      member.maxExperience = Math.max(1, Math.floor(member.maxExperience * 1.15))
    } else {
      member.maxExperience = nextLevelExp
    }

    const statIncrease = calculateStatIncrease(member.level)
    if (statIncrease && member.baseStats) {
      member.baseStats.attack = (member.baseStats.attack || 0) + (statIncrease.attack || 0)
      member.baseStats.health = (member.baseStats.health || 0) + (statIncrease.health || 0)
      member.baseStats.defense = (member.baseStats.defense || 0) + (statIncrease.defense || 0)
      member.baseStats.speed = (member.baseStats.speed || 0) + (statIncrease.speed || 0)
    }
    safetyCounter++
  }

  return true
}
