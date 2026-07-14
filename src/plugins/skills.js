export const SKILL_TYPES = {
  ACTIVE: 'active',
  PASSIVE: 'passive'
}

export const SKILL_CATEGORIES = {
  DAMAGE: 'damage',
  HEAL: 'heal',
  BUFF: 'buff',
  DEBUFF: 'debuff',
  SHIELD: 'shield',
  CONTROL: 'control',
  AURA: 'aura'
}

export const skillSchools = {
  war_god: {
    name: '战神流',
    icon: '⚔️',
    role: 'vanguard',
    description: '以绝对力量碾压敌人，追求极致伤害输出'
  },
  assassin: {
    name: '刺客流',
    icon: '🗡️',
    role: 'blade',
    description: '灵动迅捷，擅长一击必杀与连击追击'
  },
  healer: {
    name: '医者流',
    icon: '🌿',
    role: 'herb',
    description: '悬壶济世，以精湛医术守护队友生命'
  },
  guardian: {
    name: '守护流',
    icon: '🛡️',
    role: 'shield',
    description: '坚如磐石，为队友抵挡一切伤害'
  },
  tactician: {
    name: '阵法流',
    icon: '📐',
    role: 'tactician',
    description: '运筹帷幄，以精妙阵法掌控战局'
  }
}

export const skills = {
  war_god: [
    {
      id: 'wg_battle_roar',
      name: '战吼',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 1,
      description: '发出震天怒吼，提升自身攻击20%，持续3回合',
      effect: { stat: 'attack', value: 0.2, duration: 3 }
    },
    {
      id: 'wg_heavy_strike',
      name: '重击',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 1,
      description: '蓄力后发动强力一击，造成180%攻击力伤害',
      effect: { damagePercent: 1.8 }
    },
    {
      id: 'wg_berserk',
      name: '狂暴',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '进入狂暴状态，攻击提升40%但防御降低20%，持续2回合',
      effect: { stat: 'attack', value: 0.4, stat2: 'defense', value2: -0.2, duration: 2 }
    },
    {
      id: 'wg_divine_blade',
      name: '神锋斩',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 2,
      description: '凝聚神力于刀锋，造成250%攻击力伤害',
      effect: { damagePercent: 2.5 }
    },
    {
      id: 'wg_war_frenzy',
      name: '战狂',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 3,
      description: '战斗中每击杀一个敌人，攻击永久提升5%（最多3层）',
      effect: { stat: 'attack', value: 0.05, maxStacks: 3 }
    },
    {
      id: 'wg_armor_penetration',
      name: '破甲',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 3,
      description: '攻击时无视敌人20%防御',
      effect: { armorPenetration: 0.2 }
    },
    {
      id: 'wg_execution',
      name: '处决',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 4,
      description: '对生命值低于30%的敌人造成400%攻击力伤害',
      effect: { damagePercent: 4.0, condition: 'hpBelow30' }
    },
    {
      id: 'wg_immortal_warrior',
      name: '不灭战魂',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 4,
      description: '生命值低于20%时，获得20%伤害减免和10%吸血',
      effect: { finalDamageReduce: 0.2, vampireRate: 0.1, condition: 'hpBelow20' }
    },
    {
      id: 'wg_heavenly_strike',
      name: '天罚',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 5,
      description: '召唤天雷轰击敌人，造成350%攻击力伤害，并有30%几率击晕',
      effect: { damagePercent: 3.5, stunChance: 0.3 }
    },
    {
      id: 'wg_domination',
      name: '主宰',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '所有主动技能伤害提升30%',
      effect: { activeSkillDamageBoost: 0.3 }
    }
  ],
  assassin: [
    {
      id: 'as_shadow_strike',
      name: '影袭',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 1,
      description: '从暗影中发动突袭，造成150%攻击力伤害，暴击率提升30%',
      effect: { damagePercent: 1.5, critRateBonus: 0.3 }
    },
    {
      id: 'as_double_strike',
      name: '连击',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 1,
      description: '快速发动两次攻击，每次造成80%攻击力伤害',
      effect: { damagePercent: 0.8, hits: 2 }
    },
    {
      id: 'as_blade_dance',
      name: '刃舞',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 2,
      description: '高速旋转攻击周围敌人，造成120%攻击力伤害，连击率提升20%',
      effect: { damagePercent: 1.2, comboRateBonus: 0.2 }
    },
    {
      id: 'as_critical_flame',
      name: '爆炎',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 2,
      description: '注入爆炎之力，造成200%攻击力伤害，暴击伤害提升50%',
      effect: { damagePercent: 2.0, critDamageBonus: 0.5 }
    },
    {
      id: 'as_deadly_strike',
      name: '致命一击',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 3,
      description: '暴击时额外造成50%伤害',
      effect: { critDamageBoost: 0.5 }
    },
    {
      id: 'as_agility',
      name: '灵动身法',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 3,
      description: '速度提升25%，闪避率提升10%',
      effect: { stat: 'speed', value: 0.25, stat2: 'dodgeRate', value2: 0.1 }
    },
    {
      id: 'as_backstab',
      name: '背刺',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 4,
      description: '绕到敌人背后发动攻击，造成300%攻击力伤害',
      effect: { damagePercent: 3.0 }
    },
    {
      id: 'as_shadow_veil',
      name: '暗影之幕',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 4,
      description: '闪避成功后，下一次攻击必定暴击',
      effect: { guaranteedCritAfterDodge: true }
    },
    {
      id: 'as_void_blade',
      name: '虚空之刃',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 5,
      description: '撕裂空间发动攻击，造成400%攻击力伤害，无视闪避',
      effect: { damagePercent: 4.0, ignoreDodge: true }
    },
    {
      id: 'as_master_assassin',
      name: '刺客宗师',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '暴击率提升15%，暴击伤害提升40%',
      effect: { stat: 'critRate', value: 0.15, stat2: 'critDamageBoost', value2: 0.4 }
    }
  ],
  healer: [
    {
      id: 'hl_healing_herb',
      name: '疗伤药',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.HEAL,
      level: 1,
      description: '使用草药治疗单个队友，恢复目标100%攻击力的生命值',
      effect: { healPercent: 1.0, target: 'single' }
    },
    {
      id: 'hl_protective_aura',
      name: '防护光环',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 1,
      description: '为周围队友提供5%伤害减免',
      effect: { aura: 'damageReduction', value: 0.05, target: 'team' }
    },
    {
      id: 'hl_group_heal',
      name: '群体治愈',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.HEAL,
      level: 2,
      description: '释放治愈之光，恢复全队60%攻击力的生命值',
      effect: { healPercent: 0.6, target: 'team' }
    },
    {
      id: 'hl_blessing',
      name: '祝福',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '为队友施加祝福，提升攻击和防御10%，持续3回合',
      effect: { stat: 'attack', value: 0.1, stat2: 'defense', value2: 0.1, duration: 3, target: 'team' }
    },
    {
      id: 'hl_holy_light',
      name: '圣光',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.HEAL,
      level: 3,
      description: '召唤圣光，恢复目标200%攻击力的生命值，并清除负面效果',
      effect: { healPercent: 2.0, target: 'single', removeDebuff: true }
    },
    {
      id: 'hl_natural_blessing',
      name: '自然祝福',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 3,
      description: '治疗效果提升30%，自身生命恢复速度提升50%',
      effect: { stat: 'healBoost', value: 0.3, stat2: 'health', value2: 0.5 }
    },
    {
      id: 'hl_resurrection',
      name: '复活',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.HEAL,
      level: 4,
      description: '复活一个已阵亡的队友，恢复50%生命值',
      effect: { resurrect: true, healPercent: 0.5 }
    },
    {
      id: 'hl_life_link',
      name: '生命链接',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 4,
      description: '将自身10%的生命恢复分享给全队',
      effect: { aura: 'lifeShare', value: 0.1, target: 'team' }
    },
    {
      id: 'hl_divine_rebirth',
      name: '神圣重生',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.HEAL,
      level: 5,
      description: '释放神圣力量，复活所有阵亡队友并恢复100%生命值',
      effect: { resurrect: true, healPercent: 1.0, target: 'allDead' }
    },
    {
      id: 'hl_master_healer',
      name: '医圣',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '所有治疗技能效果提升50%，自身受到伤害降低20%',
      effect: { stat: 'healBoost', value: 0.5, stat2: 'finalDamageReduce', value2: 0.2 }
    }
  ],
  guardian: [
    {
      id: 'gd_shield_bash',
      name: '盾击',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 1,
      description: '用盾牌猛击敌人，造成80%攻击力伤害并嘲讽目标',
      effect: { damagePercent: 0.8, taunt: true }
    },
    {
      id: 'gd_iron_wall',
      name: '铁壁',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 1,
      description: '防御提升20%',
      effect: { stat: 'defense', value: 0.2 }
    },
    {
      id: 'gd_shield_barrier',
      name: '护盾屏障',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.SHIELD,
      level: 2,
      description: '生成一个吸收150%防御力伤害的护盾，持续2回合',
      effect: { shieldPercent: 1.5, duration: 2 }
    },
    {
      id: 'gd_threaten',
      name: '威慑',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.CONTROL,
      level: 2,
      description: '嘲讽周围所有敌人，使其攻击自己，持续2回合',
      effect: { taunt: true, target: 'aoe', duration: 2 }
    },
    {
      id: 'gd_rebound',
      name: '反弹',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 3,
      description: '受到攻击时反弹20%伤害给攻击者',
      effect: { damageReflection: 0.2 }
    },
    {
      id: 'gd_shared_pain',
      name: '分担痛苦',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 3,
      description: '队友受到攻击时，承受其30%的伤害',
      effect: { damageShare: 0.3, target: 'team' }
    },
    {
      id: 'gd_unbreakable',
      name: '不破',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.SHIELD,
      level: 4,
      description: '进入无敌状态1回合，期间不会受到任何伤害',
      effect: { invulnerable: true, duration: 1 }
    },
    {
      id: 'gd_guardian_aura',
      name: '守护光环',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 4,
      description: '为周围队友提供15%防御加成',
      effect: { aura: 'defense', value: 0.15, target: 'team' }
    },
    {
      id: 'gd_earthquake',
      name: '地震',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 5,
      description: '猛击地面引发地震，对所有敌人造成100%攻击力伤害，并降低其速度30%',
      effect: { damagePercent: 1.0, target: 'aoe', statDebuff: 'speed', debuffValue: -0.3, duration: 2 }
    },
    {
      id: 'gd_titan',
      name: '泰坦之力',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '生命提升50%，防御提升30%，受到的所有伤害降低15%',
      effect: { stat: 'health', value: 0.5, stat2: 'defense', value2: 0.3, stat3: 'finalDamageReduce', value3: 0.15 }
    }
  ],
  tactician: [
    {
      id: 'tc_slow_field',
      name: '迟缓阵',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DEBUFF,
      level: 1,
      description: '布置迟缓阵法，降低敌人速度20%，持续3回合',
      effect: { statDebuff: 'speed', debuffValue: -0.2, duration: 3, target: 'aoe' }
    },
    {
      id: 'tc_power_boost',
      name: '增幅阵',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 1,
      description: '为周围队友提供10%攻击加成',
      effect: { aura: 'attack', value: 0.1, target: 'team' }
    },
    {
      id: 'tc_confusion',
      name: '迷魂阵',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.CONTROL,
      level: 2,
      description: '释放迷魂阵法，使敌人陷入混乱，有40%几率攻击自己人，持续2回合',
      effect: { confusion: true, chance: 0.4, duration: 2, target: 'single' }
    },
    {
      id: 'tc_speed_buff',
      name: '疾风阵',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '布置疾风阵法，提升全队速度25%，持续3回合',
      effect: { stat: 'speed', value: 0.25, duration: 3, target: 'team' }
    },
    {
      id: 'tc_mana_drain',
      name: '吸灵阵',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 3,
      description: '布置吸灵阵法，吸取敌人灵力转化为自身攻击力，持续2回合',
      effect: { damagePercent: 0.5, stat: 'attack', value: 0.15, duration: 2 }
    },
    {
      id: 'tc_fortress',
      name: '防御阵',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 3,
      description: '为周围队友提供15%伤害减免',
      effect: { aura: 'damageReduction', value: 0.15, target: 'team' }
    },
    {
      id: 'tc_time_stop',
      name: '时间静止',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.CONTROL,
      level: 4,
      description: '操控时间，使所有敌人无法行动1回合',
      effect: { stun: true, duration: 1, target: 'aoe' }
    },
    {
      id: 'tc_luck_charm',
      name: '幸运阵',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 4,
      description: '提升全队暴击率8%，闪避率8%',
      effect: { aura: 'critRate', value: 0.08, aura2: 'dodgeRate', value2: 0.08, target: 'team' }
    },
    {
      id: 'tc_death_trap',
      name: '死亡陷阱',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 5,
      description: '布置致命陷阱，对所有敌人造成200%攻击力伤害，并有50%几率触发即死判定',
      effect: { damagePercent: 2.0, instantKillChance: 0.5, target: 'aoe' }
    },
    {
      id: 'tc_master_tactician',
      name: '阵道宗师',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '所有阵法效果提升50%，全队获得20%最终伤害加成',
      effect: { stat: 'combatBoost', value: 0.2, skillEffectBoost: 0.5 }
    }
  ]
}

export const getSkillSchoolByRole = (role) => {
  const mapping = {
    vanguard: 'war_god',
    blade: 'assassin',
    herb: 'healer',
    shield: 'guardian',
    tactician: 'tactician'
  }
  return mapping[role] || 'war_god'
}

export const getInitialSkills = (role) => {
  const school = getSkillSchoolByRole(role)
  const schoolSkills = skills[school] || []
  return schoolSkills.filter(s => s.level <= 1).map(s => ({ ...s }))
}

export const getSkillsForBreakthrough = (role, breakThrough) => {
  const school = getSkillSchoolByRole(role)
  const schoolSkills = skills[school] || []
  const targetLevel = breakThrough
  return schoolSkills.filter(s => s.level === targetLevel).map(s => ({ ...s }))
}

export const getSkillById = (skillId) => {
  for (const school of Object.values(skills)) {
    const skill = school.find(s => s.id === skillId)
    if (skill) return { ...skill }
  }
  return null
}

export const getSkillCategoryIcon = (category) => {
  const icons = {
    [SKILL_CATEGORIES.DAMAGE]: '⚔️',
    [SKILL_CATEGORIES.HEAL]: '💚',
    [SKILL_CATEGORIES.BUFF]: '✨',
    [SKILL_CATEGORIES.DEBUFF]: '💀',
    [SKILL_CATEGORIES.SHIELD]: '🛡️',
    [SKILL_CATEGORIES.CONTROL]: '🔮',
    [SKILL_CATEGORIES.AURA]: '🌟'
  }
  return icons[category] || '❓'
}

export const getSkillTypeName = (type) => {
  return type === SKILL_TYPES.ACTIVE ? '主动' : '被动'
}
