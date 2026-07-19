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
    { id: 'wolf_fang', name: '狼王獠牙', description: '狼王的獠牙，锋利无匹，散发着野性气息' },
    { id: 'bandit_leader_emblem', name: '山匪头目令牌', description: '山匪头目的令牌，刻有神秘的匪号' }
  ],
  misty_valley: [
    { id: 'tiger_king_claw', name: '虎王利爪', description: '迷雾虎王的利爪，锐利如刀' },
    { id: 'skeleton_general_bone', name: '骷髅将军骨刃', description: '骷髅将军的骨刃，坚硬无比' }
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
      id: 'forest_boss_1',
      name: '狼王',
      description: '青萝林的霸主，统领狼群横行霸道',
      hpMultiplier: 5,
      attackMultiplier: 3,
      dropMaterial: 'wolf_fang',
      dropChance: 0.15
    },
    {
      id: 'forest_boss_2',
      name: '山匪头目',
      description: '盘踞山林的悍匪首领，刀法凌厉',
      hpMultiplier: 4,
      attackMultiplier: 4,
      dropMaterial: 'bandit_leader_emblem',
      dropChance: 0.18
    }
  ],
  misty_valley: [
    {
      id: 'valley_boss_1',
      name: '迷雾虎王',
      description: '迷雾中潜伏的兽王，一击致命',
      hpMultiplier: 8,
      attackMultiplier: 5,
      dropMaterial: 'tiger_king_claw',
      dropChance: 0.12
    },
    {
      id: 'valley_boss_2',
      name: '骷髅将军',
      description: '远古战场遗留的亡灵将军，刀枪不入',
      hpMultiplier: 6,
      attackMultiplier: 7,
      dropMaterial: 'skeleton_general_bone',
      dropChance: 0.14
    }
  ],
  phoenix_cave: [
    {
      id: 'phoenix_boss_1',
      name: '浴火凤凰',
      description: '镇守凤凰窟的神鸟',
      hpMultiplier: 15,
      attackMultiplier: 10,
      dropMaterial: 'phoenix_feather',
      dropChance: 0.10
    },
    {
      id: 'phoenix_boss_2',
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
      id: 'dragon_boss_1',
      name: '远古巨龙',
      description: '沉睡于龙渊的远古巨龙',
      hpMultiplier: 25,
      attackMultiplier: 18,
      dropMaterial: 'dragon_scale',
      dropChance: 0.08
    },
    {
      id: 'dragon_boss_2',
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
      id: 'ghost_boss_1',
      name: '鬼帝',
      description: '鬼荒原的统治者',
      hpMultiplier: 40,
      attackMultiplier: 30,
      dropMaterial: 'ghost_essence',
      dropChance: 0.07
    },
    {
      id: 'ghost_boss_2',
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
      id: 'ice_boss_1',
      name: '冰后',
      description: '冰雪宫的主人',
      hpMultiplier: 60,
      attackMultiplier: 45,
      dropMaterial: 'ice_crystal',
      dropChance: 0.06
    },
    {
      id: 'ice_boss_2',
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
      id: 'immortal_boss_1',
      name: '仙人守卫',
      description: '仙墟的守护者',
      hpMultiplier: 100,
      attackMultiplier: 70,
      dropMaterial: 'immortal_fragment',
      dropChance: 0.05
    },
    {
      id: 'immortal_boss_2',
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
      id: 'chaos_boss_1',
      name: '混沌之主',
      description: '混沌界的主宰',
      hpMultiplier: 200,
      attackMultiplier: 150,
      dropMaterial: 'chaos_crystal',
      dropChance: 0.04
    },
    {
      id: 'chaos_boss_2',
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
  // 修复：原仅 xiongxian/juejing/mieshi 三档出 BOSS，
  // 导致前期玩家挂 youli/shilian 档永远遇不到 BOSS，
  // 也就永远掉不到 zoneMaterialPool 中的定向素材（洗髓花/锻骨木/护厄花等丹药主料）
  const chances = {
    youli: 0.10,     // 游历：10% 概率出 BOSS（让前期玩家也有途径获取丹药素材）
    shilian: 0.25,   // 试炼：25%
    xiongxian: 0.50, // 凶险：50%
    juejing: 0.75,   // 绝境：75%
    mieshi: 0.90     // 灭世：90%
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

// BOSS 挑战券：每个 BOSS 对应一种专属挑战券，仅在挂机该 BOSS 所在秘境时按 ~30% 概率获得 1~2 张
// 挑战券 id 命名与 zones.js 中 bossId 保持一致（前缀 `ticket_` + bossId），便于解析与展示
export const BOSS_TICKETS = {
  forest_edge: [
    { id: 'ticket_forest_boss_1', name: '狼王挑战券', description: '挑战狼王的入场凭证，仅在青萝林挂机有概率获得' },
    { id: 'ticket_forest_boss_2', name: '山匪头目挑战券', description: '挑战山匪头目的入场凭证，仅在青萝林挂机有概率获得' }
  ],
  misty_valley: [
    { id: 'ticket_valley_boss_1', name: '迷雾虎王挑战券', description: '挑战迷雾虎王的入场凭证，仅在迷雾谷挂机有概率获得' },
    { id: 'ticket_valley_boss_2', name: '骷髅将军挑战券', description: '挑战骷髅将军的入场凭证，仅在迷雾谷挂机有概率获得' }
  ],
  phoenix_cave: [
    { id: 'ticket_phoenix_boss_1', name: '焰魔领主挑战券', description: '挑战焰魔领主的入场凭证，仅在凤凰窟挂机有概率获得' },
    { id: 'ticket_phoenix_boss_2', name: '火凤凰挑战券', description: '挑战火凤凰的入场凭证，仅在凤凰窟挂机有概率获得' }
  ],
  dragon_abyss: [
    { id: 'ticket_dragon_boss_1', name: '深渊蛟龙挑战券', description: '挑战深渊蛟龙的入场凭证，仅在龙渊挂机有概率获得' },
    { id: 'ticket_dragon_boss_2', name: '血魔大帝挑战券', description: '挑战血魔大帝的入场凭证，仅在龙渊挂机有概率获得' }
  ],
  ghost_wasteland: [
    { id: 'ticket_ghost_boss_1', name: '噬魂鬼王挑战券', description: '挑战噬魂鬼王的入场凭证，仅在鬼荒原挂机有概率获得' },
    { id: 'ticket_ghost_boss_2', name: '白骨魔尊挑战券', description: '挑战白骨魔尊的入场凭证，仅在鬼荒原挂机有概率获得' }
  ],
  ice_palace: [
    { id: 'ticket_ice_boss_1', name: '冰凰挑战券', description: '挑战冰凰的入场凭证，仅在冰雪宫挂机有概率获得' },
    { id: 'ticket_ice_boss_2', name: '冰封古魔挑战券', description: '挑战冰封古魔的入场凭证，仅在冰雪宫挂机有概率获得' }
  ],
  immortal_ruins: [
    { id: 'ticket_immortal_boss_1', name: '仙墟守护者挑战券', description: '挑战仙墟守护者的入场凭证，仅在仙墟挂机有概率获得' },
    { id: 'ticket_immortal_boss_2', name: '堕落仙君挑战券', description: '挑战堕落仙君的入场凭证，仅在仙墟挂机有概率获得' }
  ],
  chaos_realm: [
    { id: 'ticket_chaos_boss_1', name: '混沌主宰挑战券', description: '挑战混沌主宰的入场凭证，仅在混沌界挂机有概率获得' },
    { id: 'ticket_chaos_boss_2', name: '天道化身挑战券', description: '挑战天道化身的入场凭证，仅在混沌界挂机有概率获得' }
  ]
}

// 按秘境 + boss 序号（0/1）取 BOSS 挑战券定义
export const getBossTicketByZoneIndex = (zoneId, index) => {
  const arr = BOSS_TICKETS[zoneId]
  if (!arr || index < 0 || index >= arr.length) return null
  return arr[index]
}

// 按 boss id 解析末尾数字得到 boss 序号，再查对应挑战券
export const getBossTicketByBossId = (zoneId, bossId) => {
  if (!bossId) return null
  const match = String(bossId).match(/_(\d+)$/)
  if (!match) return null
  const idx = Math.max(0, parseInt(match[1], 10) - 1)
  return getBossTicketByZoneIndex(zoneId, idx)
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
