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
  sword: { name: '剑宗', icon: '🗡️', description: '剑气纵横，攻守兼备' },
  dao: { name: '道宗', icon: '☯️', description: '道法自然，阵法控局' },
  fire: { name: '火宗', icon: '🔥', description: '烈焰焚天，持续灼烧' },
  ice: { name: '冰宗', icon: '❄️', description: '冰封万里，控制防御' },
  thunder: { name: '雷宗', icon: '⚡', description: '雷霆万钧，迅猛连击' },
  poison: { name: '毒宗', icon: '☠️', description: '毒蛊蚀骨，持续消耗' },
  beast: { name: '兽宗', icon: '🐉', description: '蛮力狂野，越战越勇' },
  ghost: { name: '鬼宗', icon: '👻', description: '幽冥诡异，魂魄操控' },
  light: { name: '光宗', icon: '✨', description: '圣光普照，治疗增益' },
  dark: { name: '暗宗', icon: '🌑', description: '暗影吞噬，亦正亦邪' }
}

export const skills = {
  sword: [
    {
      id: 'sw_sword_qi',
      name: '剑气斩',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 1,
      description: '凝聚剑气斩向敌人，造成150%攻击力伤害',
      effect: { damagePercent: 1.5 }
    },
    {
      id: 'sw_sword_will',
      name: '剑意护体',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 1,
      description: '剑意环绕周身，防御永久提升15%',
      effect: { stat: 'defense', value: 0.15 }
    },
    {
      id: 'sw_ten_thousand_swords',
      name: '万剑归宗',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 2,
      description: '召唤万千剑影归于一宗，造成200%攻击力伤害',
      effect: { damagePercent: 2.0 }
    },
    {
      id: 'sw_sword_heart',
      name: '剑心通明',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '剑心通透，暴击率永久提升10%',
      effect: { stat: 'critRate', value: 0.1 }
    },
    {
      id: 'sw_heaven_sword',
      name: '天剑诀',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 3,
      description: '引动天剑之力，造成280%攻击力伤害',
      effect: { damagePercent: 2.8 }
    },
    {
      id: 'sw_sword_resonance',
      name: '剑意共鸣',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 3,
      description: '剑意共鸣激荡，为全队提供8%攻击加成',
      effect: { aura: 'attack', value: 0.08, target: 'team' }
    },
    {
      id: 'sw_open_sky',
      name: '一剑开天',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 4,
      description: '一剑破开苍穹，造成350%攻击力伤害',
      effect: { damagePercent: 3.5 }
    },
    {
      id: 'sw_unbreakable_blade',
      name: '不灭剑体',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 4,
      description: '生命值低于20%时，获得20%最终伤害减免',
      effect: { finalDamageReduce: 0.2, condition: 'hpBelow20' }
    },
    {
      id: 'sw_immortal_array',
      name: '诛仙剑阵',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 5,
      description: '布下诛仙剑阵，造成400%攻击力伤害，并有30%几率击晕敌人',
      effect: { damagePercent: 4.0, stunChance: 0.3 }
    },
    {
      id: 'sw_sword_supreme',
      name: '剑道至尊',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '登临剑道至尊，所有主动技能伤害提升30%',
      effect: { activeSkillDamageBoost: 0.3 }
    }
  ],
  dao: [
    {
      id: 'dao_talisman',
      name: '符箓术',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 1,
      description: '挥洒符箓攻击敌人，造成130%攻击力伤害',
      effect: { damagePercent: 1.3 }
    },
    {
      id: 'dao_natural',
      name: '道法自然',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 1,
      description: '顺应自然之道，为全队提供8%速度加成',
      effect: { aura: 'speed', value: 0.08, target: 'team' }
    },
    {
      id: 'dao_bagua',
      name: '八卦阵',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '布下八卦阵法，提升全队攻击和防御10%，持续3回合',
      effect: { stat: 'attack', value: 0.1, stat2: 'defense', value2: 0.1, duration: 3, target: 'team' }
    },
    {
      id: 'dao_divine',
      name: '算命占卜',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '窥探天机推演命运，暴击伤害永久提升30%',
      effect: { stat: 'critDamageBoost', value: 0.3 }
    },
    {
      id: 'dao_five_elements',
      name: '五行术',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DEBUFF,
      level: 3,
      description: '运转五行之力，降低全体敌人攻击15%，持续3回合',
      effect: { statDebuff: 'attack', debuffValue: -0.15, duration: 3, target: 'aoe' }
    },
    {
      id: 'dao_taiji',
      name: '太极图',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 3,
      description: '以太极之象化解攻势，为全队提供10%伤害减免',
      effect: { aura: 'damageReduction', value: 0.1, target: 'team' }
    },
    {
      id: 'dao_tiangan',
      name: '天罡阵',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.CONTROL,
      level: 4,
      description: '布下天罡阵法，击晕单个敌人2回合',
      effect: { stun: true, duration: 2, target: 'single' }
    },
    {
      id: 'dao_enlightenment',
      name: '道心通明',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 4,
      description: '道心澄明，战斗加成永久提升10%',
      effect: { stat: 'combatBoost', value: 0.1 }
    },
    {
      id: 'dao_hunyuan',
      name: '混元一气',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 5,
      description: '凝聚混元一气轰击全场，对全体敌人造成250%攻击力伤害',
      effect: { damagePercent: 2.5, target: 'aoe' }
    },
    {
      id: 'dao_wuji',
      name: '大道无极',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '悟得大道无极之境，最终伤害永久提升20%',
      effect: { stat: 'finalDamageBoost', value: 0.2 }
    }
  ],
  fire: [
    {
      id: 'fire_ball',
      name: '火球术',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 1,
      description: '凝聚火球掷向敌人，造成150%攻击力伤害',
      effect: { damagePercent: 1.5 }
    },
    {
      id: 'fire_armor',
      name: '焰甲',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 1,
      description: '身披烈焰之甲，受到攻击时反弹10%伤害',
      effect: { damageReflection: 0.1 }
    },
    {
      id: 'fire_storm',
      name: '烈焰风暴',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 2,
      description: '卷起烈焰风暴席卷全场，对全体敌人造成120%攻击力伤害',
      effect: { damagePercent: 1.2, target: 'aoe' }
    },
    {
      id: 'fire_body',
      name: '火焰之体',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '炼就火焰之体，攻击永久提升15%',
      effect: { stat: 'attack', value: 0.15 }
    },
    {
      id: 'fire_heaven',
      name: '焚天烈焰',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 3,
      description: '引动焚天烈焰，造成250%攻击力伤害',
      effect: { damagePercent: 2.5 }
    },
    {
      id: 'fire_purgatory',
      name: '炼狱',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 3,
      description: '炼狱气息弥漫，为全队提供8%攻击加成',
      effect: { aura: 'attack', value: 0.08, target: 'team' }
    },
    {
      id: 'fire_rebirth',
      name: '浴火重生',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.HEAL,
      level: 4,
      description: '浴火涅槃，恢复单个目标200%攻击力的生命值',
      effect: { healPercent: 2.0, target: 'single' }
    },
    {
      id: 'fire_undying',
      name: '不灭焰',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 4,
      description: '生命值低于30%时，攻击提升40%',
      effect: { stat: 'attack', value: 0.4, condition: 'hpBelow30' }
    },
    {
      id: 'fire_annihilation',
      name: '焚天灭地',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 5,
      description: '焚尽天地的烈焰，对全体敌人造成400%攻击力伤害',
      effect: { damagePercent: 4.0, target: 'aoe' }
    },
    {
      id: 'fire_emperor',
      name: '炎帝之魂',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '承继炎帝之魂，攻击永久提升25%，暴击率提升15%',
      effect: { stat: 'attack', value: 0.25, stat2: 'critRate', value2: 0.15 }
    }
  ],
  ice: [
    {
      id: 'ice_shard',
      name: '冰锥术',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 1,
      description: '凝冰为锥刺向敌人，造成130%攻击力伤害',
      effect: { damagePercent: 1.3 }
    },
    {
      id: 'ice_body',
      name: '寒冰之体',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 1,
      description: '炼就寒冰之体，防御永久提升15%',
      effect: { stat: 'defense', value: 0.15 }
    },
    {
      id: 'ice_wall',
      name: '冰墙',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.SHIELD,
      level: 2,
      description: '凝起冰墙护体，生成吸收150%防御力伤害的护盾，持续2回合',
      effect: { shieldPercent: 1.5, duration: 2 }
    },
    {
      id: 'ice_field',
      name: '冰封领域',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 2,
      description: '冰封领域环绕，为全队提供5%伤害减免',
      effect: { aura: 'damageReduction', value: 0.05, target: 'team' }
    },
    {
      id: 'ice_storm',
      name: '极寒风暴',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DEBUFF,
      level: 3,
      description: '卷起极寒风暴，降低全体敌人速度25%，持续3回合',
      effect: { statDebuff: 'speed', debuffValue: -0.25, duration: 3, target: 'aoe' }
    },
    {
      id: 'ice_heart',
      name: '冰心诀',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 3,
      description: '冰心诀凝神聚气，生命永久提升20%，防御提升10%',
      effect: { stat: 'health', value: 0.2, stat2: 'defense', value2: 0.1 }
    },
    {
      id: 'ice_freeze',
      name: '冰封万里',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.CONTROL,
      level: 4,
      description: '冰封万里之遥，击晕全体敌人2回合',
      effect: { stun: true, duration: 2, target: 'aoe' }
    },
    {
      id: 'ice_immortal',
      name: '不朽冰雕',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 4,
      description: '生命值低于20%时，获得20%最终伤害减免',
      effect: { finalDamageReduce: 0.2, condition: 'hpBelow20' }
    },
    {
      id: 'ice_glacier',
      name: '万古冰川',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.SHIELD,
      level: 5,
      description: '凝起万古冰川，为全队生成吸收200%防御力伤害的护盾，持续2回合',
      effect: { shieldPercent: 2.0, duration: 2, target: 'team' }
    },
    {
      id: 'ice_emperor',
      name: '冰皇之体',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '成就冰皇之体，防御永久提升30%，生命提升30%',
      effect: { stat: 'defense', value: 0.3, stat2: 'health', value2: 0.3 }
    }
  ],
  thunder: [
    {
      id: 'thunder_strike',
      name: '雷击',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 1,
      description: '召唤雷电劈向敌人，造成150%攻击力伤害，并有30%几率击晕',
      effect: { damagePercent: 1.5, stunChance: 0.3 }
    },
    {
      id: 'thunder_speed',
      name: '雷速',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 1,
      description: '身法如雷，速度永久提升15%',
      effect: { stat: 'speed', value: 0.15 }
    },
    {
      id: 'thunder_chain',
      name: '连锁闪电',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 2,
      description: '释放连锁闪电跃动全场，对全体敌人造成120%攻击力伤害',
      effect: { damagePercent: 1.2, target: 'aoe' }
    },
    {
      id: 'thunder_fury',
      name: '雷霆之怒',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '雷霆之怒激荡心神，暴击率永久提升10%',
      effect: { stat: 'critRate', value: 0.1 }
    },
    {
      id: 'thunder_break',
      name: '天雷破',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 3,
      description: '引天雷破空而下，造成250%攻击力伤害',
      effect: { damagePercent: 2.5 }
    },
    {
      id: 'thunder_might',
      name: '雷霆万钧',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 3,
      description: '雷霆万钧之势，为全队提供10%速度加成',
      effect: { aura: 'speed', value: 0.1, target: 'team' }
    },
    {
      id: 'thunder_divine',
      name: '九霄神雷',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 4,
      description: '引动九霄神雷轰击，造成320%攻击力伤害，并有50%几率击晕',
      effect: { damagePercent: 3.2, stunChance: 0.5 }
    },
    {
      id: 'thunder_body',
      name: '雷神之体',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 4,
      description: '炼就雷神之体，连击率永久提升15%',
      effect: { stat: 'comboRate', value: 0.15 }
    },
    {
      id: 'thunder_punishment',
      name: '天罚神雷',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 5,
      description: '降下天罚神雷，造成400%攻击力伤害，无视闪避',
      effect: { damagePercent: 4.0, ignoreDodge: true }
    },
    {
      id: 'thunder_emperor',
      name: '雷帝降临',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '雷帝降临凡尘，速度永久提升25%，暴击率提升15%',
      effect: { stat: 'speed', value: 0.25, stat2: 'critRate', value2: 0.15 }
    }
  ],
  poison: [
    {
      id: 'poison_mist',
      name: '毒雾',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DEBUFF,
      level: 1,
      description: '释放毒雾弥漫全场，降低全体敌人攻击15%，持续3回合',
      effect: { statDebuff: 'attack', debuffValue: -0.15, duration: 3, target: 'aoe' }
    },
    {
      id: 'poison_body',
      name: '毒体',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 1,
      description: '炼就毒体百毒不侵，攻击永久提升10%',
      effect: { stat: 'attack', value: 0.1 }
    },
    {
      id: 'poison_gu',
      name: '蛊毒术',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 2,
      description: '施展蛊毒之术侵蚀敌人，造成100%攻击力伤害',
      effect: { damagePercent: 1.0 }
    },
    {
      id: 'poison_resist',
      name: '毒抗',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '万毒淬炼身躯，最终伤害减免永久提升10%',
      effect: { stat: 'finalDamageReduce', value: 0.1 }
    },
    {
      id: 'poison_corrode',
      name: '腐蚀云',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DEBUFF,
      level: 3,
      description: '释放腐蚀云蚀骨销魂，降低全体敌人防御20%，持续3回合',
      effect: { statDebuff: 'defense', debuffValue: -0.2, duration: 3, target: 'aoe' }
    },
    {
      id: 'poison_resonance',
      name: '毒蛊共鸣',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 3,
      description: '毒蛊共鸣激荡，为全队提供8%攻击加成',
      effect: { aura: 'attack', value: 0.08, target: 'team' }
    },
    {
      id: 'poison_miasma',
      name: '瘴气迷阵',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.CONTROL,
      level: 4,
      description: '布下瘴气迷阵，使单个敌人陷入混乱，有40%几率攻击自己人，持续2回合',
      effect: { confusion: true, chance: 0.4, duration: 2, target: 'single' }
    },
    {
      id: 'poison_immune',
      name: '万毒不侵',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 4,
      description: '万毒不侵之体，最终伤害减免永久提升15%',
      effect: { stat: 'finalDamageReduce', value: 0.15 }
    },
    {
      id: 'poison_soul',
      name: '天毒蚀魂',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 5,
      description: '天毒蚀魂侵蚀全场，对全体敌人造成200%攻击力伤害',
      effect: { damagePercent: 2.0, target: 'aoe' }
    },
    {
      id: 'poison_master',
      name: '毒尊',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '登临毒尊之位，攻击永久提升20%，暴击伤害提升30%',
      effect: { stat: 'attack', value: 0.2, stat2: 'critDamageBoost', value2: 0.3 }
    }
  ],
  beast: [
    {
      id: 'beast_strike',
      name: '兽王击',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 1,
      description: '以兽王之力猛击敌人，造成160%攻击力伤害',
      effect: { damagePercent: 1.6 }
    },
    {
      id: 'beast_wild',
      name: '野性',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 1,
      description: '唤醒体内野性，攻击永久提升10%',
      effect: { stat: 'attack', value: 0.1 }
    },
    {
      id: 'beast_rage',
      name: '狂化',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '进入狂化状态，攻击提升30%但防御降低15%，持续2回合',
      effect: { stat: 'attack', value: 0.3, stat2: 'defense', value2: -0.15, duration: 2 }
    },
    {
      id: 'beast_hide',
      name: '兽皮',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '兽皮坚韧厚重，生命永久提升15%',
      effect: { stat: 'health', value: 0.15 }
    },
    {
      id: 'beast_tear',
      name: '裂魂爪',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 3,
      description: '利爪撕裂敌人魂魄，造成250%攻击力伤害',
      effect: { damagePercent: 2.5 }
    },
    {
      id: 'beast_might',
      name: '兽王之威',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 3,
      description: '兽王之威震慑全场，为全队提供10%攻击加成',
      effect: { aura: 'attack', value: 0.1, target: 'team' }
    },
    {
      id: 'beast_rip',
      name: '撕裂',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 4,
      description: '撕裂敌人要害，造成300%攻击力伤害',
      effect: { damagePercent: 3.0 }
    },
    {
      id: 'beast_unbroken',
      name: '不灭兽魂',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 4,
      description: '战斗中每击杀一个敌人，攻击永久提升5%（最多3层）',
      effect: { stat: 'attack', value: 0.05, maxStacks: 3 }
    },
    {
      id: 'beast_devour',
      name: '洪荒吞噬',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 5,
      description: '洪荒之力吞噬敌人，造成350%攻击力伤害，并吸取30%伤害为生命',
      effect: { damagePercent: 3.5, vampireRate: 0.3 }
    },
    {
      id: 'beast_god',
      name: '兽神降临',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '兽神降临凡尘，攻击永久提升25%，生命提升25%',
      effect: { stat: 'attack', value: 0.25, stat2: 'health', value2: 0.25 }
    }
  ],
  ghost: [
    {
      id: 'ghost_slash',
      name: '幽冥斩',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 1,
      description: '挥出幽冥之刃斩击敌人，造成140%攻击力伤害',
      effect: { damagePercent: 1.4 }
    },
    {
      id: 'ghost_soul',
      name: '幽魂',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 1,
      description: '幽魂附体飘忽不定，闪避率永久提升10%',
      effect: { stat: 'dodgeRate', value: 0.1 }
    },
    {
      id: 'ghost_devour',
      name: '噬魂术',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 2,
      description: '吞噬敌人魂魄，造成180%攻击力伤害，并吸取30%伤害为生命',
      effect: { damagePercent: 1.8, vampireRate: 0.3 }
    },
    {
      id: 'ghost_shadow',
      name: '鬼影迷踪',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '鬼影迷踪身法诡异，速度永久提升15%',
      effect: { stat: 'speed', value: 0.15 }
    },
    {
      id: 'ghost_summon',
      name: '亡灵召唤',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.CONTROL,
      level: 3,
      description: '召唤亡灵困扰单个敌人，使其陷入混乱，有50%几率攻击自己人，持续2回合',
      effect: { confusion: true, chance: 0.5, duration: 2, target: 'single' }
    },
    {
      id: 'ghost_underworld',
      name: '冥府之路',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 3,
      description: '冥府气息笼罩战场，为全队提供8%暴击率加成',
      effect: { aura: 'critRate', value: 0.08, target: 'team' }
    },
    {
      id: 'ghost_judge',
      name: '阎罗判',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 4,
      description: '阎罗判生死，造成300%攻击力伤害，并有30%几率触发即死判定',
      effect: { damagePercent: 3.0, instantKillChance: 0.3 }
    },
    {
      id: 'ghost_undead',
      name: '不死之身',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 4,
      description: '生命值低于20%时，获得10%吸血',
      effect: { vampireRate: 0.1, condition: 'hpBelow20' }
    },
    {
      id: 'ghost_ten_palaces',
      name: '十殿冥府',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 5,
      description: '十殿冥府齐降，对全体敌人造成350%攻击力伤害',
      effect: { damagePercent: 3.5, target: 'aoe' }
    },
    {
      id: 'ghost_lord',
      name: '阎罗之主',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '执掌阎罗之位，暴击率永久提升20%，暴击伤害提升40%',
      effect: { stat: 'critRate', value: 0.2, stat2: 'critDamageBoost', value2: 0.4 }
    }
  ],
  light: [
    {
      id: 'light_heal',
      name: '圣光术',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.HEAL,
      level: 1,
      description: '释放圣光治疗单个队友，恢复目标100%攻击力的生命值',
      effect: { healPercent: 1.0, target: 'single' }
    },
    {
      id: 'light_blessing_aura',
      name: '光之祝福',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 1,
      description: '光之祝福环绕，为全队提供5%伤害减免',
      effect: { aura: 'damageReduction', value: 0.05, target: 'team' }
    },
    {
      id: 'light_radiance',
      name: '圣光普照',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.HEAL,
      level: 2,
      description: '圣光普照全场，恢复全队60%攻击力的生命值',
      effect: { healPercent: 0.6, target: 'team' }
    },
    {
      id: 'light_power',
      name: '神圣之力',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '承载神圣之力，攻击永久提升12%',
      effect: { stat: 'attack', value: 0.12 }
    },
    {
      id: 'light_judgment',
      name: '光之审判',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 3,
      description: '降下光之审判，造成220%攻击力伤害',
      effect: { damagePercent: 2.2 }
    },
    {
      id: 'light_protection',
      name: '圣光护体',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 3,
      description: '圣光护体光辉环绕，治疗效果永久提升30%',
      effect: { stat: 'healBoost', value: 0.3 }
    },
    {
      id: 'light_might',
      name: '神威',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 4,
      description: '降临神威，提升全队攻击和防御15%，持续3回合',
      effect: { stat: 'attack', value: 0.15, stat2: 'defense', value2: 0.15, duration: 3, target: 'team' }
    },
    {
      id: 'light_eternal',
      name: '不灭圣光',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 4,
      description: '不灭圣光常伴左右，为全队提供15%防御加成',
      effect: { aura: 'defense', value: 0.15, target: 'team' }
    },
    {
      id: 'light_angel',
      name: '天使降临',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.HEAL,
      level: 5,
      description: '天使降临复活所有阵亡队友，并恢复100%生命值',
      effect: { resurrect: true, healPercent: 1.0, target: 'allDead' }
    },
    {
      id: 'light_lord',
      name: '光明之主',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '光明之主普照众生，治疗效果永久提升50%，最终伤害减免提升20%',
      effect: { stat: 'healBoost', value: 0.5, stat2: 'finalDamageReduce', value2: 0.2 }
    }
  ],
  dark: [
    {
      id: 'dark_slash',
      name: '暗影斩',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 1,
      description: '从暗影中挥出斩击，造成150%攻击力伤害，本次攻击暴击率提升20%',
      effect: { damagePercent: 1.5, critRateBonus: 0.2 }
    },
    {
      id: 'dark_veil',
      name: '暗影之幕',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 1,
      description: '暗影之幕遮蔽身形，闪避率永久提升12%',
      effect: { stat: 'dodgeRate', value: 0.12 }
    },
    {
      id: 'dark_devour',
      name: '暗影吞噬',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 2,
      description: '暗影吞噬敌人，造成200%攻击力伤害',
      effect: { damagePercent: 2.0 }
    },
    {
      id: 'dark_body',
      name: '暗影之体',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 2,
      description: '炼就暗影之体，暴击伤害永久提升25%',
      effect: { stat: 'critDamageBoost', value: 0.25 }
    },
    {
      id: 'dark_curse',
      name: '暗影诅咒',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DEBUFF,
      level: 3,
      description: '施加暗影诅咒，降低全体敌人攻击20%，持续3回合',
      effect: { statDebuff: 'attack', debuffValue: -0.2, duration: 3, target: 'aoe' }
    },
    {
      id: 'dark_resonance',
      name: '暗影共鸣',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.AURA,
      level: 3,
      description: '暗影共鸣激荡，为全队提供8%暴击率加成',
      effect: { aura: 'critRate', value: 0.08, target: 'team' }
    },
    {
      id: 'dark_void',
      name: '虚无之刃',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 4,
      description: '虚无之刃斩断虚空，造成300%攻击力伤害，无视闪避',
      effect: { damagePercent: 3.0, ignoreDodge: true }
    },
    {
      id: 'dark_unbroken',
      name: '暗影不灭',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 4,
      description: '闪避成功后，下一次攻击必定暴击',
      effect: { guaranteedCritAfterDodge: true }
    },
    {
      id: 'dark_eternal_night',
      name: '永夜降临',
      type: SKILL_TYPES.ACTIVE,
      category: SKILL_CATEGORIES.DAMAGE,
      level: 5,
      description: '永夜降临笼罩苍穹，造成400%攻击力伤害，无视闪避',
      effect: { damagePercent: 4.0, ignoreDodge: true }
    },
    {
      id: 'dark_supreme',
      name: '永夜天尊',
      type: SKILL_TYPES.PASSIVE,
      category: SKILL_CATEGORIES.BUFF,
      level: 5,
      description: '登临永夜天尊之位，暴击率永久提升20%，闪避率提升15%',
      effect: { stat: 'critRate', value: 0.2, stat2: 'dodgeRate', value2: 0.15 }
    }
  ]
}

// 向后兼容：旧代码可能仍以 role 调用 getSkillSchoolByRole
// 将角色职业映射到默认宗门，便于迁移
export const getSkillSchoolByRole = (role) => {
  const mapping = {
    vanguard: 'sword',
    blade: 'thunder',
    herb: 'light',
    shield: 'ice',
    tactician: 'dao'
  }
  return mapping[role] || 'sword'
}

// 新增：根据角色的 school 字段获取技能宗门
export const getSkillSchoolByCharacter = (character) => {
  return character?.school || 'sword'
}

// getInitialSkills 现以宗门 key（如 'ice'）为参数
export const getInitialSkills = (school) => {
  const schoolSkills = skills[school] || skills['sword'] || []
  // 仅取 level === 1 的技能（每宗门初始 2 个），避免与突破技能重叠
  return schoolSkills.filter(s => s.level === 1).map(s => ({ ...s }))
}

// getSkillsForBreakthrough 现以宗门 key 作为第一个参数
export const getSkillsForBreakthrough = (school, breakThrough) => {
  const schoolSkills = skills[school] || skills['sword'] || []
  // 修复重复技能 bug：突破 N 次 → 给 level N+1 的技能
  // 初始 breakThrough=0 时已有 level 1 技能，突破到 1 时给 level 2，避免重叠
  // 突破到 5 时给 level 6（不存在，返回空数组，本次突破不再加技能，仅属性成长）
  const targetLevel = breakThrough + 1
  return schoolSkills.filter(s => s.level === targetLevel).map(s => ({ ...s }))
}

// 按 skill.id 去重，用于清理老存档中已存在的重复技能
export const deduplicateSkills = (skillList) => {
  if (!Array.isArray(skillList)) return []
  const seen = new Set()
  const result = []
  for (const s of skillList) {
    if (!s || !s.id) continue
    if (seen.has(s.id)) continue
    seen.add(s.id)
    result.push(s)
  }
  return result
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
