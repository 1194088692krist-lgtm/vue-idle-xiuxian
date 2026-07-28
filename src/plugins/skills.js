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

// skills 按 school 分组，每个 school 下按 role 分组
// 每个组合 10 个技能（5级×2，每级1主动+1被动），共 20 组合 × 10 = 200 个技能
// 技能 ID 规则：{school}_{role}_{序号}，序号 1-10（奇数为该级主动，偶数为该级被动）
export const skills = {
  sword: {
    // 剑宗 + 先锋：高伤害剑气斩劈
    vanguard: [
      {
        id: 'sword_vanguard_1',
        name: '剑气斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 1,
        description: '凝聚剑气斩向敌人，造成150%攻击力伤害',
        effect: { damagePercent: 1.5 }
      },
      {
        id: 'sword_vanguard_2',
        name: '剑意',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '剑意贯穿周身，攻击永久提升10%',
        effect: { stat: 'attack', value: 0.1 }
      },
      {
        id: 'sword_vanguard_3',
        name: '万剑斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 2,
        description: '召唤万剑齐斩，造成200%攻击力伤害',
        effect: { damagePercent: 2.0 }
      },
      {
        id: 'sword_vanguard_4',
        name: '剑心',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '剑心通明，暴击率永久提升10%',
        effect: { stat: 'critRate', value: 0.1 }
      },
      {
        id: 'sword_vanguard_5',
        name: '天剑斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 3,
        description: '引动天剑之力斩下，造成280%攻击力伤害，30%几率击晕',
        effect: { damagePercent: 2.8, stunChance: 0.3 }
      },
      {
        id: 'sword_vanguard_6',
        name: '剑威',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 3,
        description: '剑威震慑全场，为全队提供10%攻击加成',
        effect: { aura: 'attack', value: 0.1, target: 'team' }
      },
      {
        id: 'sword_vanguard_7',
        name: '一剑开天',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '一剑破开苍穹，造成350%攻击力伤害',
        effect: { damagePercent: 3.5 }
      },
      {
        id: 'sword_vanguard_8',
        name: '不灭剑体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '生命值低于20%时，获得20%最终伤害减免',
        effect: { finalDamageReduce: 0.2, condition: 'hpBelow20' }
      },
      {
        id: 'sword_vanguard_9',
        name: '诛仙剑斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 5,
        description: '诛仙剑气横扫全场，对全体敌人造成400%攻击力伤害',
        effect: { damagePercent: 4.0, target: 'aoe' }
      },
      {
        id: 'sword_vanguard_10',
        name: '剑道至尊',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '登临剑道至尊，所有主动技能伤害提升30%',
        effect: { activeSkillDamageBoost: 0.3 }
      }
    ],
    // 剑宗 + 护法：剑壁剑阵护盾
    shield: [
      {
        id: 'sword_shield_1',
        name: '剑盾',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 1,
        description: '凝聚剑气为盾，生成吸收150%防御力伤害的护盾，持续2回合',
        effect: { shieldPercent: 1.5, duration: 2 }
      },
      {
        id: 'sword_shield_2',
        name: '剑壁',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '剑意凝壁，防御永久提升15%',
        effect: { stat: 'defense', value: 0.15 }
      },
      {
        id: 'sword_shield_3',
        name: '剑阵护',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 2,
        description: '布下剑阵护体，生成吸收200%防御力伤害的护盾，持续2回合',
        effect: { shieldPercent: 2.0, duration: 2 }
      },
      {
        id: 'sword_shield_4',
        name: '剑意护',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 2,
        description: '剑意护佑全场，为全队提供10%防御加成',
        effect: { aura: 'defense', value: 0.1, target: 'team' }
      },
      {
        id: 'sword_shield_5',
        name: '万剑壁',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 3,
        description: '万剑结壁，为全队生成吸收250%防御力伤害的护盾，持续3回合',
        effect: { shieldPercent: 2.5, duration: 3, target: 'team' }
      },
      {
        id: 'sword_shield_6',
        name: '剑心护',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 3,
        description: '剑心澄明护体，生命永久提升20%，防御提升10%',
        effect: { stat: 'health', value: 0.2, stat2: 'defense', value2: 0.1 }
      },
      {
        id: 'sword_shield_7',
        name: '剑锋反噬',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '剑锋反噬来犯之敌，造成300%攻击力伤害并嘲讽目标',
        effect: { damagePercent: 3.0, taunt: true }
      },
      {
        id: 'sword_shield_8',
        name: '不灭剑壁',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '生命值低于20%时，获得20%最终伤害减免',
        effect: { finalDamageReduce: 0.2, condition: 'hpBelow20' }
      },
      {
        id: 'sword_shield_9',
        name: '万古剑阵',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 5,
        description: '万古剑阵护佑全队，为全队生成吸收400%防御力伤害的护盾，持续3回合',
        effect: { shieldPercent: 4.0, duration: 3, target: 'team' }
      },
      {
        id: 'sword_shield_10',
        name: '剑皇护体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '剑皇护体，防御永久提升30%，生命提升30%',
        effect: { stat: 'defense', value: 0.3, stat2: 'health', value2: 0.3 }
      }
    ]
  },
  dao: {
    // 道宗 + 掌阵：阵法符箓 buff/debuff/control
    tactician: [
      {
        id: 'dao_tactician_1',
        name: '符阵',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '布下符阵，提升全队攻击20%，持续3回合',
        effect: { stat: 'attack', value: 0.2, duration: 3, target: 'team' }
      },
      {
        id: 'dao_tactician_2',
        name: '道法',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 1,
        description: '道法自然流转，为全队提供8%速度加成',
        effect: { aura: 'speed', value: 0.08, target: 'team' }
      },
      {
        id: 'dao_tactician_3',
        name: '八卦阵',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '布下八卦阵法，提升全队攻击和防御10%，持续3回合',
        effect: { stat: 'attack', value: 0.1, stat2: 'defense', value2: 0.1, duration: 3, target: 'team' }
      },
      {
        id: 'dao_tactician_4',
        name: '卦象',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 2,
        description: '推演卦象化势，为全队提供10%伤害减免',
        effect: { aura: 'damageReduction', value: 0.1, target: 'team' }
      },
      {
        id: 'dao_tactician_5',
        name: '五行阵',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DEBUFF,
        level: 3,
        description: '运转五行阵法，降低全体敌人攻击15%，持续3回合',
        effect: { statDebuff: 'attack', debuffValue: -0.15, duration: 3, target: 'aoe' }
      },
      {
        id: 'dao_tactician_6',
        name: '太极阵图',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 3,
        description: '太极之象化解攻势，为全队提供10%伤害减免',
        effect: { aura: 'damageReduction', value: 0.1, target: 'team' }
      },
      {
        id: 'dao_tactician_7',
        name: '天罡阵',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.CONTROL,
        level: 4,
        description: '布下天罡阵法，击晕单个敌人2回合',
        effect: { stun: true, duration: 2, target: 'single' }
      },
      {
        id: 'dao_tactician_8',
        name: '道心',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '道心澄明，防御永久提升20%',
        effect: { stat: 'defense', value: 0.2 }
      },
      {
        id: 'dao_tactician_9',
        name: '混元阵',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.CONTROL,
        level: 5,
        description: '混元阵法笼罩全场，击晕全体敌人2回合',
        effect: { stun: true, duration: 2, target: 'aoe' }
      },
      {
        id: 'dao_tactician_10',
        name: '大道无极',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 5,
        description: '大道无极之境，为全队提供15%攻击加成',
        effect: { aura: 'attack', value: 0.15, target: 'team' }
      }
    ],
    // 道宗 + 刀锋：符阵道法连击暴击
    blade: [
      {
        id: 'dao_blade_1',
        name: '符剑斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 1,
        description: '符剑齐出斩击敌人，造成140%攻击力伤害，暴击率提升20%',
        effect: { damagePercent: 1.4, critRateBonus: 0.2 }
      },
      {
        id: 'dao_blade_2',
        name: '道影',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '身化道影飘忽，速度永久提升15%',
        effect: { stat: 'speed', value: 0.15 }
      },
      {
        id: 'dao_blade_3',
        name: '阵刃斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 2,
        description: '阵法凝刃连斩2次，造成180%攻击力伤害',
        effect: { damagePercent: 1.8, hits: 2 }
      },
      {
        id: 'dao_blade_4',
        name: '卦锋',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '卦象锋芒，暴击率永久提升10%',
        effect: { stat: 'critRate', value: 0.1 }
      },
      {
        id: 'dao_blade_5',
        name: '道五行斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 3,
        description: '五行之力凝于刃，造成250%攻击力伤害，暴击率提升30%',
        effect: { damagePercent: 2.5, critRateBonus: 0.3 }
      },
      {
        id: 'dao_blade_6',
        name: '道速',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 3,
        description: '道法增速，连击率永久提升15%',
        effect: { stat: 'comboRate', value: 0.15 }
      },
      {
        id: 'dao_blade_7',
        name: '天罡阵刃',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '天罡之力贯刃，造成300%攻击力伤害，无视闪避',
        effect: { damagePercent: 3.0, ignoreDodge: true }
      },
      {
        id: 'dao_blade_8',
        name: '道影身',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '道影迷踪，闪避率永久提升15%',
        effect: { stat: 'dodgeRate', value: 0.15 }
      },
      {
        id: 'dao_blade_9',
        name: '混元道刃',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 5,
        description: '混元之力化刃连斩2次，造成400%攻击力伤害，暴击率提升30%',
        effect: { damagePercent: 4.0, hits: 2, critRateBonus: 0.3 }
      },
      {
        id: 'dao_blade_10',
        name: '大道刃',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '大道凝刃，暴击率永久提升20%，速度提升15%',
        effect: { stat: 'critRate', value: 0.2, stat2: 'speed', value2: 0.15 }
      }
    ]
  },
  fire: {
    // 火宗 + 先锋：烈焰焚天高伤害
    vanguard: [
      {
        id: 'fire_vanguard_1',
        name: '火球术',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 1,
        description: '凝聚火球掷向敌人，造成150%攻击力伤害',
        effect: { damagePercent: 1.5 }
      },
      {
        id: 'fire_vanguard_2',
        name: '焰甲',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '身披烈焰之甲，受到攻击时反弹10%伤害',
        effect: { damageReflection: 0.1 }
      },
      {
        id: 'fire_vanguard_3',
        name: '烈焰斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 2,
        description: '烈焰凝刃斩下，造成200%攻击力伤害',
        effect: { damagePercent: 2.0 }
      },
      {
        id: 'fire_vanguard_4',
        name: '火体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '炼就火焰之体，攻击永久提升15%',
        effect: { stat: 'attack', value: 0.15 }
      },
      {
        id: 'fire_vanguard_5',
        name: '焚天烈焰',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 3,
        description: '引动焚天烈焰席卷全场，对全体敌人造成250%攻击力伤害',
        effect: { damagePercent: 2.5, target: 'aoe' }
      },
      {
        id: 'fire_vanguard_6',
        name: '炼狱焰',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 3,
        description: '炼狱气息弥漫，为全队提供10%攻击加成',
        effect: { aura: 'attack', value: 0.1, target: 'team' }
      },
      {
        id: 'fire_vanguard_7',
        name: '炎帝斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '承炎帝之力一斩，造成350%攻击力伤害',
        effect: { damagePercent: 3.5 }
      },
      {
        id: 'fire_vanguard_8',
        name: '不灭焰',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '生命值低于20%时，获得20%最终伤害减免',
        effect: { finalDamageReduce: 0.2, condition: 'hpBelow20' }
      },
      {
        id: 'fire_vanguard_9',
        name: '焚天灭地',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 5,
        description: '焚尽天地的烈焰，对全体敌人造成400%攻击力伤害',
        effect: { damagePercent: 4.0, target: 'aoe' }
      },
      {
        id: 'fire_vanguard_10',
        name: '炎帝之魂',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '承继炎帝之魂，攻击永久提升25%，暴击率提升15%',
        effect: { stat: 'attack', value: 0.25, stat2: 'critRate', value2: 0.15 }
      }
    ]
  },
  ice: {
    // 冰宗 + 刀锋：寒冰连击暴击
    blade: [
      {
        id: 'ice_blade_1',
        name: '寒冰斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 1,
        description: '寒冰凝刃斩下，造成150%攻击力伤害，暴击率提升20%',
        effect: { damagePercent: 1.5, critRateBonus: 0.2 }
      },
      {
        id: 'ice_blade_2',
        name: '寒影',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '身化寒影飘忽，速度永久提升15%',
        effect: { stat: 'speed', value: 0.15 }
      },
      {
        id: 'ice_blade_3',
        name: '冰锋斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 2,
        description: '冰锋凝刃连斩2次，造成180%攻击力伤害',
        effect: { damagePercent: 1.8, hits: 2 }
      },
      {
        id: 'ice_blade_4',
        name: '寒锋',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '寒气凝锋，暴击率永久提升10%',
        effect: { stat: 'critRate', value: 0.1 }
      },
      {
        id: 'ice_blade_5',
        name: '霜刃斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 3,
        description: '霜寒之刃斩下，造成250%攻击力伤害，暴击率提升30%',
        effect: { damagePercent: 2.5, critRateBonus: 0.3 }
      },
      {
        id: 'ice_blade_6',
        name: '寒速',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 3,
        description: '寒冰增速，连击率永久提升15%',
        effect: { stat: 'comboRate', value: 0.15 }
      },
      {
        id: 'ice_blade_7',
        name: '冰寒刃',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '冰寒之刃刺穿要害，造成300%攻击力伤害，无视闪避',
        effect: { damagePercent: 3.0, ignoreDodge: true }
      },
      {
        id: 'ice_blade_8',
        name: '寒影身',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '寒影迷踪，闪避率永久提升15%',
        effect: { stat: 'dodgeRate', value: 0.15 }
      },
      {
        id: 'ice_blade_9',
        name: '冻魂斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 5,
        description: '冻魂之刃连斩2次，造成400%攻击力伤害，无视闪避',
        effect: { damagePercent: 4.0, hits: 2, ignoreDodge: true }
      },
      {
        id: 'ice_blade_10',
        name: '冰刃至尊',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '登临冰刃至尊，暴击率永久提升20%，速度提升15%',
        effect: { stat: 'critRate', value: 0.2, stat2: 'speed', value2: 0.15 }
      }
    ],
    // 冰宗 + 护法：冰墙冰盾防御
    shield: [
      {
        id: 'ice_shield_1',
        name: '冰墙',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 1,
        description: '凝起冰墙护体，生成吸收150%防御力伤害的护盾，持续2回合',
        effect: { shieldPercent: 1.5, duration: 2 }
      },
      {
        id: 'ice_shield_2',
        name: '寒冰体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '炼就寒冰之体，防御永久提升15%',
        effect: { stat: 'defense', value: 0.15 }
      },
      {
        id: 'ice_shield_3',
        name: '寒冰盾',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 2,
        description: '寒冰凝盾护体，生成吸收200%防御力伤害的护盾，持续2回合',
        effect: { shieldPercent: 2.0, duration: 2 }
      },
      {
        id: 'ice_shield_4',
        name: '冰封域',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 2,
        description: '冰封领域环绕，为全队提供8%伤害减免',
        effect: { aura: 'damageReduction', value: 0.08, target: 'team' }
      },
      {
        id: 'ice_shield_5',
        name: '玄冰甲',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 3,
        description: '玄冰凝甲护全队，为全队生成吸收250%防御力伤害的护盾，持续3回合',
        effect: { shieldPercent: 2.5, duration: 3, target: 'team' }
      },
      {
        id: 'ice_shield_6',
        name: '冰心诀',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 3,
        description: '冰心诀凝神，生命永久提升20%，防御提升10%',
        effect: { stat: 'health', value: 0.2, stat2: 'defense', value2: 0.1 }
      },
      {
        id: 'ice_shield_7',
        name: '冰封刺',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '冰封刺反击来敌，造成300%攻击力伤害并嘲讽目标',
        effect: { damagePercent: 3.0, taunt: true }
      },
      {
        id: 'ice_shield_8',
        name: '不朽冰雕',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '生命值低于20%时，获得20%最终伤害减免',
        effect: { finalDamageReduce: 0.2, condition: 'hpBelow20' }
      },
      {
        id: 'ice_shield_9',
        name: '万古冰封',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 5,
        description: '万古冰封护佑全队，为全队生成吸收400%防御力伤害的护盾，持续3回合',
        effect: { shieldPercent: 4.0, duration: 3, target: 'team' }
      },
      {
        id: 'ice_shield_10',
        name: '冰皇之体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '成就冰皇之体，防御永久提升30%，生命提升30%',
        effect: { stat: 'defense', value: 0.3, stat2: 'health', value2: 0.3 }
      }
    ]
  },
  thunder: {
    // 雷宗 + 刀锋：雷霆连击暴击
    blade: [
      {
        id: 'thunder_blade_1',
        name: '雷斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 1,
        description: '雷电凝刃斩下，造成150%攻击力伤害，暴击率提升20%',
        effect: { damagePercent: 1.5, critRateBonus: 0.2 }
      },
      {
        id: 'thunder_blade_2',
        name: '雷速',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '身法如雷，速度永久提升15%',
        effect: { stat: 'speed', value: 0.15 }
      },
      {
        id: 'thunder_blade_3',
        name: '连雷斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 2,
        description: '连珠雷电斩击2次，造成180%攻击力伤害',
        effect: { damagePercent: 1.8, hits: 2 }
      },
      {
        id: 'thunder_blade_4',
        name: '雷怒',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '雷霆之怒激荡，暴击率永久提升10%',
        effect: { stat: 'critRate', value: 0.1 }
      },
      {
        id: 'thunder_blade_5',
        name: '天雷斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 3,
        description: '天雷破空斩下，造成250%攻击力伤害，暴击率提升30%',
        effect: { damagePercent: 2.5, critRateBonus: 0.3 }
      },
      {
        id: 'thunder_blade_6',
        name: '雷霆',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 3,
        description: '雷霆万钧之势，为全队提供10%速度加成',
        effect: { aura: 'speed', value: 0.1, target: 'team' }
      },
      {
        id: 'thunder_blade_7',
        name: '九霄雷斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '九霄神雷连斩2次，造成300%攻击力伤害，无视闪避',
        effect: { damagePercent: 3.0, hits: 2, ignoreDodge: true }
      },
      {
        id: 'thunder_blade_8',
        name: '雷神体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '炼就雷神之体，连击率永久提升15%',
        effect: { stat: 'comboRate', value: 0.15 }
      },
      {
        id: 'thunder_blade_9',
        name: '天罚雷斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 5,
        description: '天罚神雷连斩3次，造成400%攻击力伤害，无视闪避',
        effect: { damagePercent: 4.0, hits: 3, ignoreDodge: true }
      },
      {
        id: 'thunder_blade_10',
        name: '雷帝降临',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '雷帝降临凡尘，速度永久提升25%，暴击率提升15%',
        effect: { stat: 'speed', value: 0.25, stat2: 'critRate', value2: 0.15 }
      }
    ]
  },
  poison: {
    // 毒宗 + 刀锋：毒刃连击暴击
    blade: [
      {
        id: 'poison_blade_1',
        name: '毒刃',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 1,
        description: '毒刃斩敌，造成140%攻击力伤害，暴击率提升20%',
        effect: { damagePercent: 1.4, critRateBonus: 0.2 }
      },
      {
        id: 'poison_blade_2',
        name: '毒影',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '身化毒影飘忽，速度永久提升15%',
        effect: { stat: 'speed', value: 0.15 }
      },
      {
        id: 'poison_blade_3',
        name: '蛊刃斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 2,
        description: '蛊毒凝刃连斩2次，造成180%攻击力伤害',
        effect: { damagePercent: 1.8, hits: 2 }
      },
      {
        id: 'poison_blade_4',
        name: '毒锋',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '毒气凝锋，暴击率永久提升10%',
        effect: { stat: 'critRate', value: 0.1 }
      },
      {
        id: 'poison_blade_5',
        name: '腐蚀斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 3,
        description: '腐蚀之刃斩下，造成250%攻击力伤害，暴击率提升30%',
        effect: { damagePercent: 2.5, critRateBonus: 0.3 }
      },
      {
        id: 'poison_blade_6',
        name: '毒速',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 3,
        description: '毒气增速，连击率永久提升15%',
        effect: { stat: 'comboRate', value: 0.15 }
      },
      {
        id: 'poison_blade_7',
        name: '蛊毒刃',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '蛊毒之刃刺穿要害，造成300%攻击力伤害，无视闪避',
        effect: { damagePercent: 3.0, ignoreDodge: true }
      },
      {
        id: 'poison_blade_8',
        name: '毒身',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '毒身飘忽，闪避率永久提升15%',
        effect: { stat: 'dodgeRate', value: 0.15 }
      },
      {
        id: 'poison_blade_9',
        name: '天毒斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 5,
        description: '天毒凝刃连斩2次，造成400%攻击力伤害，暴击率提升30%',
        effect: { damagePercent: 4.0, hits: 2, critRateBonus: 0.3 }
      },
      {
        id: 'poison_blade_10',
        name: '毒尊',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '登临毒尊之位，暴击率永久提升20%，连击率提升15%',
        effect: { stat: 'critRate', value: 0.2, stat2: 'comboRate', value2: 0.15 }
      }
    ],
    // 毒宗 + 掌阵：毒雾蛊阵 buff/debuff/control
    tactician: [
      {
        id: 'poison_tactician_1',
        name: '毒雾',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DEBUFF,
        level: 1,
        description: '释放毒雾弥漫全场，降低全体敌人攻击15%，持续3回合',
        effect: { statDebuff: 'attack', debuffValue: -0.15, duration: 3, target: 'aoe' }
      },
      {
        id: 'poison_tactician_2',
        name: '毒体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '炼就毒体百毒不侵，攻击永久提升10%',
        effect: { stat: 'attack', value: 0.1 }
      },
      {
        id: 'poison_tactician_3',
        name: '蛊阵',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '布下蛊毒之阵，提升全队攻击15%，持续3回合',
        effect: { stat: 'attack', value: 0.15, duration: 3, target: 'team' }
      },
      {
        id: 'poison_tactician_4',
        name: '毒抗',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 2,
        description: '毒气护佑全场，为全队提供8%伤害减免',
        effect: { aura: 'damageReduction', value: 0.08, target: 'team' }
      },
      {
        id: 'poison_tactician_5',
        name: '腐蚀云',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DEBUFF,
        level: 3,
        description: '释放腐蚀云蚀骨，降低全体敌人速度25%，持续3回合',
        effect: { statDebuff: 'speed', debuffValue: -0.25, duration: 3, target: 'aoe' }
      },
      {
        id: 'poison_tactician_6',
        name: '毒蛊',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 3,
        description: '毒蛊共鸣激荡，为全队提供8%攻击加成',
        effect: { aura: 'attack', value: 0.08, target: 'team' }
      },
      {
        id: 'poison_tactician_7',
        name: '毒瘴阵',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.CONTROL,
        level: 4,
        description: '布下瘴气迷阵，使单个敌人陷入混乱，40%几率攻击自己人，持续2回合',
        effect: { confusion: true, chance: 0.4, duration: 2, target: 'single' }
      },
      {
        id: 'poison_tactician_8',
        name: '万毒',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '万毒淬炼身躯，防御永久提升20%',
        effect: { stat: 'defense', value: 0.2 }
      },
      {
        id: 'poison_tactician_9',
        name: '万毒阵',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.CONTROL,
        level: 5,
        description: '万毒之阵笼罩全场，击晕全体敌人2回合',
        effect: { stun: true, duration: 2, target: 'aoe' }
      },
      {
        id: 'poison_tactician_10',
        name: '毒尊',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 5,
        description: '登临毒尊之位，为全队提供15%攻击加成',
        effect: { aura: 'attack', value: 0.15, target: 'team' }
      }
    ]
  },
  beast: {
    // 兽宗 + 护法：兽盾蛮甲防御
    shield: [
      {
        id: 'beast_shield_1',
        name: '兽盾',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 1,
        description: '蛮兽之力凝盾，生成吸收150%防御力伤害的护盾，持续2回合',
        effect: { shieldPercent: 1.5, duration: 2 }
      },
      {
        id: 'beast_shield_2',
        name: '兽皮',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '兽皮坚韧厚重，生命永久提升15%',
        effect: { stat: 'health', value: 0.15 }
      },
      {
        id: 'beast_shield_3',
        name: '蛮甲',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 2,
        description: '蛮力凝甲护体，生成吸收200%防御力伤害的护盾，持续2回合',
        effect: { shieldPercent: 2.0, duration: 2 }
      },
      {
        id: 'beast_shield_4',
        name: '兽威',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 2,
        description: '兽王之威震慑全场，为全队提供10%防御加成',
        effect: { aura: 'defense', value: 0.1, target: 'team' }
      },
      {
        id: 'beast_shield_5',
        name: '蛮兽甲',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 3,
        description: '蛮兽之力护全队，为全队生成吸收250%防御力伤害的护盾，持续3回合',
        effect: { shieldPercent: 2.5, duration: 3, target: 'team' }
      },
      {
        id: 'beast_shield_6',
        name: '蛮体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 3,
        description: '蛮力淬体，生命永久提升20%，防御提升10%',
        effect: { stat: 'health', value: 0.2, stat2: 'defense', value2: 0.1 }
      },
      {
        id: 'beast_shield_7',
        name: '兽咬',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '蛮兽噬咬来敌，造成300%攻击力伤害并嘲讽目标',
        effect: { damagePercent: 3.0, taunt: true }
      },
      {
        id: 'beast_shield_8',
        name: '不灭兽魂',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '生命值低于20%时，获得20%最终伤害减免',
        effect: { finalDamageReduce: 0.2, condition: 'hpBelow20' }
      },
      {
        id: 'beast_shield_9',
        name: '洪荒兽盾',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 5,
        description: '洪荒之力护佑全队，为全队生成吸收400%防御力伤害的护盾，持续3回合',
        effect: { shieldPercent: 4.0, duration: 3, target: 'team' }
      },
      {
        id: 'beast_shield_10',
        name: '兽神护体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '兽神护体，防御永久提升30%，生命提升30%',
        effect: { stat: 'defense', value: 0.3, stat2: 'health', value2: 0.3 }
      }
    ],
    // 兽宗 + 先锋：蛮力狂野高伤害
    vanguard: [
      {
        id: 'beast_vanguard_1',
        name: '兽王击',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 1,
        description: '以兽王之力猛击敌人，造成150%攻击力伤害',
        effect: { damagePercent: 1.5 }
      },
      {
        id: 'beast_vanguard_2',
        name: '蛮野性',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '唤醒体内野性，攻击永久提升10%',
        effect: { stat: 'attack', value: 0.1 }
      },
      {
        id: 'beast_vanguard_3',
        name: '蛮击',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 2,
        description: '蛮力狂击敌人，造成200%攻击力伤害',
        effect: { damagePercent: 2.0 }
      },
      {
        id: 'beast_vanguard_4',
        name: '兽血',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '兽血沸腾，生命永久提升15%',
        effect: { stat: 'health', value: 0.15 }
      },
      {
        id: 'beast_vanguard_5',
        name: '裂魂爪',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 3,
        description: '利爪撕裂敌人魂魄，造成280%攻击力伤害',
        effect: { damagePercent: 2.8 }
      },
      {
        id: 'beast_vanguard_6',
        name: '兽王威',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 3,
        description: '兽王之威震慑全场，为全队提供10%攻击加成',
        effect: { aura: 'attack', value: 0.1, target: 'team' }
      },
      {
        id: 'beast_vanguard_7',
        name: '撕裂爪',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '撕裂敌人要害，造成320%攻击力伤害，吸取30%伤害为生命',
        effect: { damagePercent: 3.2, vampireRate: 0.3 }
      },
      {
        id: 'beast_vanguard_8',
        name: '不灭兽魂',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '生命值低于20%时，获得20%最终伤害减免',
        effect: { finalDamageReduce: 0.2, condition: 'hpBelow20' }
      },
      {
        id: 'beast_vanguard_9',
        name: '蛮荒吞噬',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 5,
        description: '洪荒之力吞噬敌人，造成400%攻击力伤害，吸取30%伤害为生命',
        effect: { damagePercent: 4.0, vampireRate: 0.3 }
      },
      {
        id: 'beast_vanguard_10',
        name: '兽神降临',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '兽神降临凡尘，攻击永久提升25%，生命提升25%',
        effect: { stat: 'attack', value: 0.25, stat2: 'health', value2: 0.25 }
      }
    ]
  },
  ghost: {
    // 鬼宗 + 刀锋：幽冥连击暴击
    blade: [
      {
        id: 'ghost_blade_1',
        name: '幽冥斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 1,
        description: '幽冥之刃斩击敌人，造成140%攻击力伤害，暴击率提升20%',
        effect: { damagePercent: 1.4, critRateBonus: 0.2 }
      },
      {
        id: 'ghost_blade_2',
        name: '幽魂',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '幽魂附体飘忽不定，闪避率永久提升12%',
        effect: { stat: 'dodgeRate', value: 0.12 }
      },
      {
        id: 'ghost_blade_3',
        name: '噬魂斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 2,
        description: '噬魂之刃连斩2次，造成180%攻击力伤害',
        effect: { damagePercent: 1.8, hits: 2 }
      },
      {
        id: 'ghost_blade_4',
        name: '鬼影',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '鬼影迷踪身法诡异，速度永久提升15%',
        effect: { stat: 'speed', value: 0.15 }
      },
      {
        id: 'ghost_blade_5',
        name: '幽鬼斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 3,
        description: '幽鬼之刃斩下，造成250%攻击力伤害，暴击率提升30%',
        effect: { damagePercent: 2.5, critRateBonus: 0.3 }
      },
      {
        id: 'ghost_blade_6',
        name: '冥速',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 3,
        description: '冥府之力增速，连击率永久提升15%',
        effect: { stat: 'comboRate', value: 0.15 }
      },
      {
        id: 'ghost_blade_7',
        name: '幽冥判',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '幽冥判生死，造成300%攻击力伤害，30%几率触发即死',
        effect: { damagePercent: 3.0, instantKillChance: 0.3 }
      },
      {
        id: 'ghost_blade_8',
        name: '不死魂',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '生命值低于20%时，获得10%吸血',
        effect: { vampireRate: 0.1, condition: 'hpBelow20' }
      },
      {
        id: 'ghost_blade_9',
        name: '十殿冥斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 5,
        description: '十殿冥府齐斩，连斩2次造成400%攻击力伤害，无视闪避',
        effect: { damagePercent: 4.0, hits: 2, ignoreDodge: true }
      },
      {
        id: 'ghost_blade_10',
        name: '阎罗冥主',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '执掌阎罗之位，暴击率永久提升20%，速度提升15%',
        effect: { stat: 'critRate', value: 0.2, stat2: 'speed', value2: 0.15 }
      }
    ],
    // 鬼宗 + 护法：幽冥魂盾防御
    shield: [
      {
        id: 'ghost_shield_1',
        name: '鬼盾',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 1,
        description: '幽冥之力凝盾，生成吸收150%防御力伤害的护盾，持续2回合',
        effect: { shieldPercent: 1.5, duration: 2 }
      },
      {
        id: 'ghost_shield_2',
        name: '幽体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '幽冥淬体，防御永久提升15%',
        effect: { stat: 'defense', value: 0.15 }
      },
      {
        id: 'ghost_shield_3',
        name: '冥甲',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 2,
        description: '冥府之力凝甲护体，生成吸收200%防御力伤害的护盾，持续2回合',
        effect: { shieldPercent: 2.0, duration: 2 }
      },
      {
        id: 'ghost_shield_4',
        name: '鬼壁',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 2,
        description: '鬼壁护佑全场，为全队提供10%防御加成',
        effect: { aura: 'defense', value: 0.1, target: 'team' }
      },
      {
        id: 'ghost_shield_5',
        name: '幽魂壁',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 3,
        description: '幽魂结壁护全队，为全队生成吸收250%防御力伤害的护盾，持续3回合',
        effect: { shieldPercent: 2.5, duration: 3, target: 'team' }
      },
      {
        id: 'ghost_shield_6',
        name: '冥体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 3,
        description: '冥府淬体，生命永久提升20%，防御提升10%',
        effect: { stat: 'health', value: 0.2, stat2: 'defense', value2: 0.1 }
      },
      {
        id: 'ghost_shield_7',
        name: '幽魂噬',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '幽魂噬咬来敌，造成300%攻击力伤害并嘲讽目标',
        effect: { damagePercent: 3.0, taunt: true }
      },
      {
        id: 'ghost_shield_8',
        name: '不灭冥身',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '生命值低于20%时，获得20%最终伤害减免',
        effect: { finalDamageReduce: 0.2, condition: 'hpBelow20' }
      },
      {
        id: 'ghost_shield_9',
        name: '冥府护佑',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.SHIELD,
        level: 5,
        description: '冥府护佑全队，为全队生成吸收400%防御力伤害的护盾，持续3回合',
        effect: { shieldPercent: 4.0, duration: 3, target: 'team' }
      },
      {
        id: 'ghost_shield_10',
        name: '不灭魂',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '不灭魂体，防御永久提升30%，生命提升30%',
        effect: { stat: 'defense', value: 0.3, stat2: 'health', value2: 0.3 }
      }
    ],
    // 鬼宗 + 先锋：幽冥魂魄高伤害
    vanguard: [
      {
        id: 'ghost_vanguard_1',
        name: '幽魂击',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 1,
        description: '幽魂凝聚一击，造成150%攻击力伤害',
        effect: { damagePercent: 1.5 }
      },
      {
        id: 'ghost_vanguard_2',
        name: '幽魂',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '幽魂附体，攻击永久提升10%',
        effect: { stat: 'attack', value: 0.1 }
      },
      {
        id: 'ghost_vanguard_3',
        name: '噬魂击',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 2,
        description: '噬魂一击，造成200%攻击力伤害，吸取30%伤害为生命',
        effect: { damagePercent: 2.0, vampireRate: 0.3 }
      },
      {
        id: 'ghost_vanguard_4',
        name: '鬼影',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '鬼影迷踪，速度永久提升15%',
        effect: { stat: 'speed', value: 0.15 }
      },
      {
        id: 'ghost_vanguard_5',
        name: '冥魂斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 3,
        description: '冥魂之刃斩下，对全体敌人造成250%攻击力伤害',
        effect: { damagePercent: 2.5, target: 'aoe' }
      },
      {
        id: 'ghost_vanguard_6',
        name: '冥威',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 3,
        description: '冥府之威震慑全场，为全队提供10%攻击加成',
        effect: { aura: 'attack', value: 0.1, target: 'team' }
      },
      {
        id: 'ghost_vanguard_7',
        name: '冥府判',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '冥府判生死，造成350%攻击力伤害，30%几率触发即死',
        effect: { damagePercent: 3.5, instantKillChance: 0.3 }
      },
      {
        id: 'ghost_vanguard_8',
        name: '不死魂',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '生命值低于20%时，获得20%最终伤害减免',
        effect: { finalDamageReduce: 0.2, condition: 'hpBelow20' }
      },
      {
        id: 'ghost_vanguard_9',
        name: '十殿冥府',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 5,
        description: '十殿冥府齐降，对全体敌人造成400%攻击力伤害',
        effect: { damagePercent: 4.0, target: 'aoe' }
      },
      {
        id: 'ghost_vanguard_10',
        name: '冥府之主',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '执掌阎罗之位，暴击率永久提升20%，攻击提升20%',
        effect: { stat: 'critRate', value: 0.2, stat2: 'attack', value2: 0.2 }
      }
    ]
  },
  light: {
    // 光宗 + 药引：圣光治疗
    herb: [
      {
        id: 'light_herb_1',
        name: '圣光术',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.HEAL,
        level: 1,
        description: '释放圣光治疗单个队友，恢复目标100%攻击力的生命值',
        effect: { healPercent: 1.0, target: 'single' }
      },
      {
        id: 'light_herb_2',
        name: '光之祝福',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 1,
        description: '光之祝福环绕，为全队提供5%伤害减免',
        effect: { aura: 'damageReduction', value: 0.05, target: 'team' }
      },
      {
        id: 'light_herb_3',
        name: '圣光普照',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.HEAL,
        level: 2,
        description: '圣光普照全场，恢复全队60%攻击力的生命值',
        effect: { healPercent: 0.6, target: 'team' }
      },
      {
        id: 'light_herb_4',
        name: '神圣之力',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '承载神圣之力，攻击永久提升12%',
        effect: { stat: 'attack', value: 0.12 }
      },
      {
        id: 'light_herb_5',
        name: '净世光',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.HEAL,
        level: 3,
        description: '净世圣光治疗单个队友，恢复200%攻击力生命值并清除负面状态',
        effect: { healPercent: 2.0, target: 'single', removeDebuff: true }
      },
      {
        id: 'light_herb_6',
        name: '圣光护',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 3,
        description: '圣光护体光辉环绕，治疗效果永久提升30%',
        effect: { stat: 'healBoost', value: 0.3 }
      },
      {
        id: 'light_herb_7',
        name: '圣光涌',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.HEAL,
        level: 4,
        description: '圣光涌动全场，恢复全队150%攻击力的生命值',
        effect: { healPercent: 1.5, target: 'team' }
      },
      {
        id: 'light_herb_8',
        name: '不灭圣光',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 4,
        description: '不灭圣光常伴左右，为全队提供15%防御加成',
        effect: { aura: 'defense', value: 0.15, target: 'team' }
      },
      {
        id: 'light_herb_9',
        name: '圣光降临',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.HEAL,
        level: 5,
        description: '圣光降临复活所有阵亡队友，并恢复100%生命值',
        effect: { resurrect: true, healPercent: 1.0, target: 'allDead' }
      },
      {
        id: 'light_herb_10',
        name: '光明之主',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '光明之主普照众生，治疗效果永久提升50%，最终伤害减免提升20%',
        effect: { stat: 'healBoost', value: 0.5, stat2: 'finalDamageReduce', value2: 0.2 }
      }
    ],
    // 光宗 + 先锋：圣光高伤害
    vanguard: [
      {
        id: 'light_vanguard_1',
        name: '圣光斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 1,
        description: '圣光凝刃斩敌，造成150%攻击力伤害',
        effect: { damagePercent: 1.5 }
      },
      {
        id: 'light_vanguard_2',
        name: '圣光体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '圣光淬体，攻击永久提升10%',
        effect: { stat: 'attack', value: 0.1 }
      },
      {
        id: 'light_vanguard_3',
        name: '光辉斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 2,
        description: '光辉凝刃斩下，造成200%攻击力伤害',
        effect: { damagePercent: 2.0 }
      },
      {
        id: 'light_vanguard_4',
        name: '圣体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '圣光淬体，攻击永久提升15%',
        effect: { stat: 'attack', value: 0.15 }
      },
      {
        id: 'light_vanguard_5',
        name: '圣光破',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 3,
        description: '圣光破空斩下，对全体敌人造成250%攻击力伤害',
        effect: { damagePercent: 2.5, target: 'aoe' }
      },
      {
        id: 'light_vanguard_6',
        name: '圣威',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 3,
        description: '圣威震慑全场，为全队提供10%攻击加成',
        effect: { aura: 'attack', value: 0.1, target: 'team' }
      },
      {
        id: 'light_vanguard_7',
        name: '圣光裁',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '圣光审判斩下，造成350%攻击力伤害',
        effect: { damagePercent: 3.5 }
      },
      {
        id: 'light_vanguard_8',
        name: '不灭圣光',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '生命值低于20%时，获得20%最终伤害减免',
        effect: { finalDamageReduce: 0.2, condition: 'hpBelow20' }
      },
      {
        id: 'light_vanguard_9',
        name: '净世圣光',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 5,
        description: '净世圣光横扫全场，对全体敌人造成400%攻击力伤害',
        effect: { damagePercent: 4.0, target: 'aoe' }
      },
      {
        id: 'light_vanguard_10',
        name: '光明之主',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '光明之主降临，攻击永久提升25%，暴击率提升15%',
        effect: { stat: 'attack', value: 0.25, stat2: 'critRate', value2: 0.15 }
      }
    ]
  },
  dark: {
    // 暗宗 + 刀锋：暗影连击暴击
    blade: [
      {
        id: 'dark_blade_1',
        name: '暗影斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 1,
        description: '从暗影中挥出斩击，造成150%攻击力伤害，暴击率提升20%',
        effect: { damagePercent: 1.5, critRateBonus: 0.2 }
      },
      {
        id: 'dark_blade_2',
        name: '暗影幕',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '暗影之幕遮蔽身形，闪避率永久提升12%',
        effect: { stat: 'dodgeRate', value: 0.12 }
      },
      {
        id: 'dark_blade_3',
        name: '暗影噬',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 2,
        description: '暗影连噬2次，造成180%攻击力伤害',
        effect: { damagePercent: 1.8, hits: 2 }
      },
      {
        id: 'dark_blade_4',
        name: '暗影体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '炼就暗影之体，暴击伤害永久提升25%',
        effect: { stat: 'critDamageBoost', value: 0.25 }
      },
      {
        id: 'dark_blade_5',
        name: '暗影刃',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 3,
        description: '暗影凝刃斩下，造成250%攻击力伤害，暴击率提升30%',
        effect: { damagePercent: 2.5, critRateBonus: 0.3 }
      },
      {
        id: 'dark_blade_6',
        name: '暗速',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 3,
        description: '暗影增速，连击率永久提升15%',
        effect: { stat: 'comboRate', value: 0.15 }
      },
      {
        id: 'dark_blade_7',
        name: '虚影刃',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '虚无之刃斩断虚空，造成300%攻击力伤害，无视闪避',
        effect: { damagePercent: 3.0, ignoreDodge: true }
      },
      {
        id: 'dark_blade_8',
        name: '暗影身',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '暗影迷踪，闪避率永久提升15%',
        effect: { stat: 'dodgeRate', value: 0.15 }
      },
      {
        id: 'dark_blade_9',
        name: '永夜斩',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 5,
        description: '永夜降临连斩2次，造成400%攻击力伤害，无视闪避',
        effect: { damagePercent: 4.0, hits: 2, ignoreDodge: true }
      },
      {
        id: 'dark_blade_10',
        name: '永夜天尊',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '登临永夜天尊之位，暴击率永久提升20%，闪避率提升15%',
        effect: { stat: 'critRate', value: 0.2, stat2: 'dodgeRate', value2: 0.15 }
      }
    ],
    // 暗宗 + 药引：暗影汲取治疗
    herb: [
      {
        id: 'dark_herb_1',
        name: '暗影汲取',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.HEAL,
        level: 1,
        description: '汲取暗影之力治疗单个队友，恢复目标100%攻击力的生命值',
        effect: { healPercent: 1.0, target: 'single' }
      },
      {
        id: 'dark_herb_2',
        name: '暗影祝',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 1,
        description: '暗影祝福环绕，为全队提供5%伤害减免',
        effect: { aura: 'damageReduction', value: 0.05, target: 'team' }
      },
      {
        id: 'dark_herb_3',
        name: '暗影愈',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.HEAL,
        level: 2,
        description: '暗影涌动治疗全队，恢复60%攻击力的生命值',
        effect: { healPercent: 0.6, target: 'team' }
      },
      {
        id: 'dark_herb_4',
        name: '暗影力',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '承载暗影之力，攻击永久提升12%',
        effect: { stat: 'attack', value: 0.12 }
      },
      {
        id: 'dark_herb_5',
        name: '暗影净',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.HEAL,
        level: 3,
        description: '暗影净化治疗单个队友，恢复200%攻击力生命值并清除负面状态',
        effect: { healPercent: 2.0, target: 'single', removeDebuff: true }
      },
      {
        id: 'dark_herb_6',
        name: '暗影愈体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 3,
        description: '暗影愈体，治疗效果永久提升30%',
        effect: { stat: 'healBoost', value: 0.3 }
      },
      {
        id: 'dark_herb_7',
        name: '暗影涌',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.HEAL,
        level: 4,
        description: '暗影涌动全场，恢复全队150%攻击力的生命值',
        effect: { healPercent: 1.5, target: 'team' }
      },
      {
        id: 'dark_herb_8',
        name: '不灭暗',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 4,
        description: '不灭暗影常伴左右，为全队提供15%防御加成',
        effect: { aura: 'defense', value: 0.15, target: 'team' }
      },
      {
        id: 'dark_herb_9',
        name: '暗影复',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.HEAL,
        level: 5,
        description: '暗影之力复活所有阵亡队友，并恢复50%生命值',
        effect: { resurrect: true, healPercent: 0.5, target: 'allDead' }
      },
      {
        id: 'dark_herb_10',
        name: '暗影之主',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '暗影之主，治疗效果永久提升50%，最终伤害减免提升20%',
        effect: { stat: 'healBoost', value: 0.5, stat2: 'finalDamageReduce', value2: 0.2 }
      }
    ],
    // 暗宗 + 先锋：暗影吞噬高伤害
    vanguard: [
      {
        id: 'dark_vanguard_1',
        name: '暗影击',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 1,
        description: '暗影凝聚一击，造成150%攻击力伤害',
        effect: { damagePercent: 1.5 }
      },
      {
        id: 'dark_vanguard_2',
        name: '暗影体',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 1,
        description: '暗影淬体，攻击永久提升10%',
        effect: { stat: 'attack', value: 0.1 }
      },
      {
        id: 'dark_vanguard_3',
        name: '噬影击',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 2,
        description: '暗影吞噬一击，造成200%攻击力伤害，吸取30%伤害为生命',
        effect: { damagePercent: 2.0, vampireRate: 0.3 }
      },
      {
        id: 'dark_vanguard_4',
        name: '暗威',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 2,
        description: '暗影之威，攻击永久提升15%',
        effect: { stat: 'attack', value: 0.15 }
      },
      {
        id: 'dark_vanguard_5',
        name: '暗影破',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 3,
        description: '暗影破空斩下，对全体敌人造成250%攻击力伤害',
        effect: { damagePercent: 2.5, target: 'aoe' }
      },
      {
        id: 'dark_vanguard_6',
        name: '暗影威',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.AURA,
        level: 3,
        description: '暗影之威震慑全场，为全队提供10%攻击加成',
        effect: { aura: 'attack', value: 0.1, target: 'team' }
      },
      {
        id: 'dark_vanguard_7',
        name: '暗影裁',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 4,
        description: '暗影审判斩下，造成350%攻击力伤害',
        effect: { damagePercent: 3.5 }
      },
      {
        id: 'dark_vanguard_8',
        name: '不灭暗',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 4,
        description: '生命值低于20%时，获得20%最终伤害减免',
        effect: { finalDamageReduce: 0.2, condition: 'hpBelow20' }
      },
      {
        id: 'dark_vanguard_9',
        name: '永夜降临',
        type: SKILL_TYPES.ACTIVE,
        category: SKILL_CATEGORIES.DAMAGE,
        level: 5,
        description: '永夜降临笼罩苍穹，对全体敌人造成400%攻击力伤害，无视闪避',
        effect: { damagePercent: 4.0, target: 'aoe', ignoreDodge: true }
      },
      {
        id: 'dark_vanguard_10',
        name: '永夜天尊',
        type: SKILL_TYPES.PASSIVE,
        category: SKILL_CATEGORIES.BUFF,
        level: 5,
        description: '登临永夜天尊之位，攻击永久提升25%，暴击率提升15%',
        effect: { stat: 'attack', value: 0.25, stat2: 'critRate', value2: 0.15 }
      }
    ]
  }
}

// 获取角色技能：按 school + role 双维度
// 仅取 level === 1 的技能（每个组合初始 2 个：1主动+1被动）
export const getInitialSkills = (school, role) => {
  const schoolSkills = skills[school]?.[role] || skills['sword']?.['vanguard'] || []
  return schoolSkills.filter(s => s.level === 1).map(s => ({ ...s }))
}

// 突破技能：按 school + role 双维度
// 突破 N 次 → 给 level N+1 的技能，避免与初始 level 1 重叠
export const getSkillsForBreakthrough = (school, role, breakThrough) => {
  const schoolSkills = skills[school]?.[role] || skills['sword']?.['vanguard'] || []
  const targetLevel = breakThrough + 1
  return schoolSkills.filter(s => s.level === targetLevel).map(s => ({ ...s }))
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

// 根据角色的 school 字段获取技能宗门
// 兼容 school（模板字段）和 skillSchool（生成角色对象字段）
export const getSkillSchoolByCharacter = (character) => {
  if (!character) return 'sword'
  return character.school || character.skillSchool || 'sword'
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

// 按 ID 查找技能（遍历嵌套的 school → role 结构）
export const getSkillById = (skillId) => {
  for (const schoolObj of Object.values(skills)) {
    for (const roleArr of Object.values(schoolObj)) {
      const skill = roleArr.find(s => s.id === skillId)
      if (skill) return { ...skill }
    }
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
