// 丹药品阶
export const pillGrades = {
  grade1: { name: '一品', difficulty: 1, successRate: 0.9 },
  grade2: { name: '二品', difficulty: 1.2, successRate: 0.8 },
  grade3: { name: '三品', difficulty: 1.5, successRate: 0.7 },
  grade4: { name: '四品', difficulty: 2, successRate: 0.6 },
  grade5: { name: '五品', difficulty: 2.5, successRate: 0.5 },
  grade6: { name: '六品', difficulty: 3, successRate: 0.4 },
  grade7: { name: '七品', difficulty: 4, successRate: 0.3 },
  grade8: { name: '八品', difficulty: 5, successRate: 0.2 },
  grade9: { name: '九品', difficulty: 6, successRate: 0.1 }
}

// 丹药类型
export const pillTypes = {
  spirit_stone: { name: '灵石类', effectMultiplier: 1 },
  cultivation: { name: '修炼类', effectMultiplier: 1.2 },
  attribute: { name: '属性类', effectMultiplier: 1.5 },
  special: { name: '特殊类', effectMultiplier: 2 }
}

// 根据品阶计算所需残页数量
const getFragmentsNeeded = grade => {
  const gradeNumber = parseInt(grade.replace('grade', ''))
  return 5 * gradeNumber + 5 // 一品10个，二品15个，以此类推
}

// 丹方配置
export const pillRecipes = [
  {
    id: 'spirit_gathering',
    name: '聚灵丹',
    description: '提升灵石获取效率的丹药',
    grade: 'grade1',
    type: 'spirit_stone',
    materials: [
      { kind: 'herb', id: 'spirit_grass', count: 2 },
      { kind: 'herb', id: 'cloud_flower', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade1'),
    baseEffect: {
      type: 'spiritStoneRate',
      value: 0.1,
      duration: 3600
    }
  },
  {
    id: 'cultivation_boost',
    name: '聚气丹',
    description: '提升修炼速度的丹药',
    grade: 'grade2',
    type: 'cultivation',
    materials: [
      { kind: 'herb', id: 'cloud_flower', count: 2 },
      { kind: 'herb', id: 'thunder_root', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade2'),
    baseEffect: {
      type: 'cultivationRate',
      value: 0.15,
      duration: 1800
    }
  },
  {
    id: 'thunder_power',
    name: '雷灵丹',
    description: '提升战斗属性的丹药',
    grade: 'grade3',
    type: 'attribute',
    materials: [
      { kind: 'herb', id: 'thunder_root', count: 2 },
      { kind: 'herb', id: 'dragon_breath_herb', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade3'),
    baseEffect: {
      type: 'combatBoost',
      value: 0.12,
      duration: 900
    }
  },
  {
    id: 'immortal_essence',
    name: '仙灵丹',
    description: '全属性提升的神奇丹药',
    grade: 'grade4',
    type: 'special',
    materials: [
      { kind: 'herb', id: 'dragon_breath_herb', count: 2 },
      { kind: 'herb', id: 'immortal_jade_grass', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade4'),
    baseEffect: {
      type: 'allAttributes',
      value: 0.2,
      duration: 600
    }
  },
  {
    id: 'five_elements_pill',
    name: '五行丹',
    description: '融合五行之力的神奇丹药，全面提升修炼者素质',
    grade: 'grade5',
    type: 'attribute',
    materials: [
      { kind: 'herb', id: 'five_elements_grass', count: 2 },
      { kind: 'herb', id: 'phoenix_feather_herb', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade5'),
    baseEffect: {
      type: 'allAttributes',
      value: 0.3,
      duration: 1200
    }
  },
  {
    id: 'celestial_essence_pill',
    name: '天元丹',
    description: '凝聚天地精华的极品丹药，大幅提升修炼速度',
    grade: 'grade6',
    type: 'cultivation',
    materials: [
      { kind: 'herb', id: 'celestial_dew_grass', count: 2 },
      { kind: 'herb', id: 'moonlight_orchid', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade6'),
    baseEffect: {
      type: 'cultivationRate',
      value: 0.35,
      duration: 1800
    }
  },
  {
    id: 'sun_moon_pill',
    name: '日月丹',
    description: '融合日月精华的丹药，能大幅提升灵石获取效率',
    grade: 'grade7',
    type: 'spirit_stone',
    materials: [
      { kind: 'herb', id: 'sun_essence_flower', count: 2 },
      { kind: 'herb', id: 'moonlight_orchid', count: 2 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade7'),
    baseEffect: {
      type: 'spiritStoneRate',
      value: 0.35,
      duration: 2400
    }
  },
  {
    id: 'phoenix_rebirth_pill',
    name: '涅槃丹',
    description: '蕴含不死凤凰之力的神丹，能在战斗中自动恢复生命',
    grade: 'grade8',
    type: 'special',
    materials: [
      { kind: 'herb', id: 'phoenix_feather_herb', count: 3 },
      { kind: 'herb', id: 'celestial_dew_grass', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade8'),
    baseEffect: {
      type: 'autoHeal',
      value: 0.05,
      duration: 3600
    }
  },
  {
    id: 'spirit_recovery',
    name: '回灵丹',
    description: '快速恢复灵石获取效率的丹药',
    grade: 'grade2',
    type: 'spirit_stone',
    materials: [
      { kind: 'herb', id: 'dark_yin_grass', count: 2 },
      { kind: 'herb', id: 'frost_lotus', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade2'),
    baseEffect: {
      type: 'spiritStoneRate',
      value: 0.15,
      duration: 1200
    }
  },
  {
    id: 'essence_condensation',
    name: '凝元丹',
    description: '提升修炼效率的高级丹药',
    grade: 'grade3',
    type: 'cultivation',
    materials: [
      { kind: 'herb', id: 'nine_leaf_lingzhi', count: 2 },
      { kind: 'herb', id: 'purple_ginseng', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade3'),
    baseEffect: {
      type: 'cultivationEfficiency',
      value: 0.18,
      duration: 1500
    }
  },
  {
    id: 'mind_clarity',
    name: '清心丹',
    description: '提升心境和悟性的丹药',
    grade: 'grade3',
    type: 'special',
    materials: [
      { kind: 'herb', id: 'frost_lotus', count: 2 },
      { kind: 'herb', id: 'fire_heart_flower', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade3'),
    baseEffect: {
      type: 'comprehension',
      value: 0.15,
      duration: 2400
    }
  },
  {
    id: 'fire_essence',
    name: '火元丹',
    description: '提升火属性修炼速度的丹药',
    grade: 'grade4',
    type: 'attribute',
    materials: [
      { kind: 'herb', id: 'fire_heart_flower', count: 2 },
      { kind: 'herb', id: 'dragon_breath_herb', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade4'),
    baseEffect: {
      type: 'combatBoost',
      value: 0.15,
      duration: 1800
    }
  },
  // ===== 新增：丹药多元化（打破"全是限时 buff"） =====
  // func 仅用于炼丹界面分类展示；materials 采用 {kind,id,count} 统一素材模型
  {
    id: 'wash_marrow_pill',
    name: '洗髓丹',
    description: '洗髓易筋，永久提升攻击（存档沉淀）',
    grade: 'grade1',
    type: 'attribute',
    func: 'permanent',
    materials: [
      { kind: 'herb', id: 'wash_marrow_herb', count: 2 },
      { kind: 'ore', id: 'iron_essence', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade1'),
    baseEffect: { type: 'permanentStat', stat: 'attack', value: 5, duration: 0 }
  },
  {
    id: 'forge_bone_pill',
    name: '锻骨丹',
    description: '锻骨淬体，永久提升防御（存档沉淀）',
    grade: 'grade2',
    type: 'attribute',
    func: 'permanent',
    materials: [
      { kind: 'herb', id: 'forge_bone_wood', count: 2 },
      { kind: 'ore', id: 'dark_iron_marrow', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade2'),
    baseEffect: { type: 'permanentStat', stat: 'defense', value: 6, duration: 0 }
  },
  {
    id: 'heal_pill',
    name: '疗伤丹',
    description: '生肌续命，战斗中可嗑以回复生命',
    grade: 'grade1',
    type: 'attribute',
    func: 'battle',
    materials: [
      { kind: 'herb', id: 'flesh_growth_herb', count: 2 },
      { kind: 'liquid', id: 'jade_marrow_liquid', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade1'),
    baseEffect: { type: 'healBattle', value: 0.3, duration: 0 }
  },
  {
    id: 'cleanse_pill',
    name: '解厄丹',
    description: '化解厄难，战斗中可嗑以清除负面状态',
    grade: 'grade2',
    type: 'special',
    func: 'battle',
    materials: [
      { kind: 'herb', id: 'disaster_ward_flower', count: 2 },
      { kind: 'liquid', id: 'ward_evil_dew', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade2'),
    baseEffect: { type: 'cleanse', value: 1, duration: 0 }
  },
  {
    id: 'enlightenment_pill',
    name: '悟道丹',
    description: '蕴含道韵，一定时间内修炼/探索修为加成',
    grade: 'grade2',
    type: 'cultivation',
    func: 'explore',
    materials: [
      { kind: 'herb', id: 'enlightenment_leaf', count: 2 },
      { kind: 'ore', id: 'dao_essence_stone', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade2'),
    baseEffect: { type: 'expGain', value: 0.2, duration: 1800 }
  },
  {
    id: 'treasure_pill',
    name: '寻宝丹',
    description: '感应宝物，一定时间内探索掉落加成',
    grade: 'grade3',
    type: 'special',
    func: 'explore',
    materials: [
      { kind: 'herb', id: 'treasure_scent_herb', count: 2 },
      { kind: 'ore', id: 'prospect_sand', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade3'),
    baseEffect: { type: 'dropRate', value: 0.2, duration: 1800 }
  },
  {
    id: 'quench_spirit_pill',
    name: '淬灵丹',
    description: '淬炼灵气，提升下次装备强化成功率',
    grade: 'grade3',
    type: 'attribute',
    func: 'enhance',
    materials: [
      { kind: 'ore', id: 'spirit_quench_sand', count: 2 },
      { kind: 'liquid', id: 'spirit_spring_water', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade3'),
    baseEffect: { type: 'enhanceRate', value: 0.15, duration: 0 }
  },
  {
    id: 'calm_spirit_pill',
    name: '定灵丹',
    description: '凝定神魂，洗练装备时保底不降属性',
    grade: 'grade3',
    type: 'special',
    func: 'reforge',
    materials: [
      { kind: 'special', id: 'calm_spirit_pearl', count: 1 },
      { kind: 'herb', id: 'calm_mind_herb', count: 2 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade3'),
    baseEffect: { type: 'reforgeSafe', value: 1, duration: 0 }
  },
  {
    id: 'tribulation_pill',
    name: '渡厄丹',
    description: '雷劫中绽放，提升境界突破成功率',
    grade: 'grade4',
    type: 'special',
    func: 'breakthrough',
    materials: [
      { kind: 'herb', id: 'tribulation_lotus', count: 2 },
      { kind: 'ore', id: 'tribulation_thunder_stone', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade4'),
    baseEffect: { type: 'breakthroughRate', value: 0.1, duration: 0 }
  },
  // ===== 努力值丹药（提升角色潜力/根骨） =====
  {
    id: 'minor_foundation_pill',
    name: '小培元丹',
    description: '固本培元，少量提升根骨潜力（努力值+1，生命+10）',
    grade: 'grade1',
    type: 'attribute',
    func: 'effort',
    materials: [
      { kind: 'herb', id: 'spirit_grass', count: 3 },
      { kind: 'ore', id: 'iron_essence', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade1'),
    baseEffect: { type: 'effortGain', value: 1, duration: 0, extraStats: { health: 10 } }
  },
  {
    id: 'foundation_pill',
    name: '培元丹',
    description: '强筋健骨，稳步提升根骨潜力（努力值+2，攻击+15，生命+20）',
    grade: 'grade2',
    type: 'attribute',
    func: 'effort',
    materials: [
      { kind: 'herb', id: 'nine_leaf_lingzhi', count: 2 },
      { kind: 'ore', id: 'dark_iron_marrow', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade2'),
    baseEffect: { type: 'effortGain', value: 2, duration: 0, extraStats: { attack: 15, health: 20 } }
  },
  {
    id: 'great_foundation_pill',
    name: '大培元丹',
    description: '脱胎换骨，大幅提升根骨潜力（努力值+3，攻击+30，生命+40，防御+15）',
    grade: 'grade3',
    type: 'attribute',
    func: 'effort',
    materials: [
      { kind: 'herb', id: 'purple_ginseng', count: 2 },
      { kind: 'liquid', id: 'jade_marrow_liquid', count: 1 },
      { kind: 'core', id: 'elite_core', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade3'),
    baseEffect: { type: 'effortGain', value: 3, duration: 0, extraStats: { attack: 30, health: 40, defense: 15 } }
  },
  {
    id: 'extreme_foundation_pill',
    name: '极培元丹',
    description: '逆天改命，极限提升根骨潜力（努力值+4，攻击+50，生命+60，防御+25，速度+10）',
    grade: 'grade4',
    type: 'special',
    func: 'effort',
    materials: [
      { kind: 'herb', id: 'immortal_jade_grass', count: 2 },
      { kind: 'ore', id: 'tribulation_thunder_stone', count: 1 },
      { kind: 'core', id: 'demon_king_core', count: 1 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade4'),
    baseEffect: { type: 'effortGain', value: 4, duration: 0, extraStats: { attack: 50, health: 60, defense: 25, speed: 10 } }
  },
  {
    id: 'heaven_foundation_pill',
    name: '天培元丹',
    description: '夺天地造化，突破潜力极限（努力值+5，全属性大幅提升，无视上限）',
    grade: 'grade5',
    type: 'special',
    func: 'effort',
    materials: [
      { kind: 'special', id: 'heaven_fragment', count: 1 },
      { kind: 'core', id: 'demon_king_core', count: 2 },
      { kind: 'herb', id: 'sun_essence_flower', count: 2 }
    ],
    fragmentsNeeded: getFragmentsNeeded('grade5'),
    baseEffect: { type: 'effortGain', value: 5, duration: 0, ignoreCap: true, extraStats: { attack: 80, health: 100, defense: 40, speed: 20 } }
  }
]

export const pillZoneMapping = {
  forest_edge: ['spirit_gathering', 'wash_marrow_pill', 'heal_pill', 'minor_foundation_pill'],
  misty_valley: ['cultivation_boost', 'spirit_recovery', 'forge_bone_pill', 'cleanse_pill', 'enlightenment_pill', 'foundation_pill'],
  phoenix_cave: ['thunder_power', 'essence_condensation', 'mind_clarity', 'treasure_pill', 'quench_spirit_pill', 'calm_spirit_pill', 'great_foundation_pill'],
  dragon_abyss: ['immortal_essence', 'fire_essence', 'tribulation_pill', 'extreme_foundation_pill'],
  ghost_wasteland: ['five_elements_pill', 'heaven_foundation_pill'],
  ice_palace: ['celestial_essence_pill'],
  immortal_ruins: ['sun_moon_pill'],
  chaos_realm: ['phoenix_rebirth_pill']
}

export const getPillsByZone = (zoneId) => {
  const recipeIds = pillZoneMapping[zoneId] || []
  return recipeIds.map(id => pillRecipes.find(r => r.id === id)).filter(Boolean)
}

export const getZoneByPill = (pillId) => {
  for (const [zoneId, recipeIds] of Object.entries(pillZoneMapping)) {
    if (recipeIds.includes(pillId)) return zoneId
  }
  return null
}

// 计算丹药实际效果（基于玩家境界）
export const calculatePillEffect = (recipe, playerLevel) => {
  const grade = pillGrades[recipe.grade]
  const type = pillTypes[recipe.type]
  // 数值类丹药（努力值、永久属性、战斗回血等）不受境界缩放，避免夸张
  const fixedValueTypes = ['effortGain', 'permanentStat', 'healBattle', 'cleanse', 'reforgeSafe', 'breakthroughRate', 'enhanceRate']
  const isFixed = fixedValueTypes.includes(recipe.baseEffect.type)
  const levelMultiplier = isFixed ? 1 : Math.min(2, 1 + (playerLevel - 1) * 0.05)
  return {
    type: recipe.baseEffect.type,
    stat: recipe.baseEffect.stat,
    value: recipe.baseEffect.value * type.effectMultiplier * levelMultiplier,
    duration: recipe.baseEffect.duration || 0,
    successRate: grade.successRate,
    extraStats: recipe.baseEffect.extraStats || null
  }
}

// 尝试合成丹药
export const tryCreatePill = (recipe, herbs, player, fragments = 0, luck = 1) => {
  // 检查材料是否足够（支持 {kind,id} 与旧式 {herb} 写法；以 player.materials 为准）
  const owned = player.materials || []
  for (const material of recipe.materials) {
    const kind = material.kind || 'herb'
    const mid = material.id || material.herb
    const have = owned.filter(m => m.kind === kind && m.id === mid).length
    if (have < material.count) {
      return { success: false, message: '材料不足' }
    }
  }
  // 检查丹方是否完整（只有在未掌握完整丹方时才检查残页数量）
  if (!player.pillRecipes.includes(recipe.id) && fragments < recipe.fragmentsNeeded) {
    return { success: false, message: '丹方不完整' }
  }
  // 计算成功率（受幸运值影响）
  const grade = pillGrades[recipe.grade]
  if (Math.random() > grade.successRate * luck) {
    return { success: false, message: '炼制失败' }
  }
  return { success: true, message: '炼制成功' }
}
