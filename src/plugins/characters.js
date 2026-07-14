export const characterSchools = {
  sword: { name: '剑宗', color: '#4169E1', icon: '🗡️' },
  dao: { name: '道宗', color: '#9370DB', icon: '☯️' },
  fire: { name: '火宗', color: '#FF4500', icon: '🔥' },
  ice: { name: '冰宗', color: '#00CED1', icon: '❄️' },
  thunder: { name: '雷宗', color: '#FFD700', icon: '⚡' },
  poison: { name: '毒宗', color: '#32CD32', icon: '☠️' },
  beast: { name: '兽宗', color: '#8B4513', icon: '🐉' },
  ghost: { name: '鬼宗', color: '#808080', icon: '👻' },
  light: { name: '光宗', color: '#FFFFE0', icon: '✨' },
  dark: { name: '暗宗', color: '#4B0082', icon: '🌑' }
}

export const starConfig = {
  3: { name: '三星', color: '#999999', multiplier: 1, growthRate: 1 },
  4: { name: '四星', color: '#4169E1', multiplier: 1.5, growthRate: 1.2 },
  5: { name: '五星', color: '#FFD700', multiplier: 2.5, growthRate: 1.5 }
}

export const characterTalents = {
  sword_mastery: { name: '剑心通明', desc: '攻击+15%，暴击率+5%', stats: { attack: 0.15, critRate: 0.05 } },
  dao_insight: { name: '悟道天机', desc: '修炼效率+20%，灵力恢复+15%', stats: { cultivationRate: 0.2, spiritRate: 0.15 } },
  flame_body: { name: '炎躯', desc: '攻击+12%，火属性伤害+10%', stats: { attack: 0.12, finalDamageBoost: 0.1 } },
  ice_barrier: { name: '寒冰护体', desc: '防御+15%，抗暴击+10%', stats: { defense: 0.15, critResist: 0.1 } },
  thunder_speed: { name: '雷速', desc: '速度+20%，闪避率+8%', stats: { speed: 0.2, dodgeRate: 0.08 } },
  poison_breath: { name: '毒息', desc: '攻击+10%，中毒几率+15%', stats: { attack: 0.1, stunRate: 0.15 } },
  beast_tamer: { name: '驭兽', desc: '生命+20%，召唤兽强度+15%', stats: { health: 0.2, combatBoost: 0.15 } },
  ghost_pact: { name: '鬼契', desc: '暴击伤害+25%，吸血率+10%', stats: { critDamageBoost: 0.25, vampireRate: 0.1 } },
  light_blessing: { name: '圣光祝福', desc: '治疗效果+30%，生命恢复+20%', stats: { healBoost: 0.3, health: 0.2 } },
  dark_pact: { name: '暗影契约', desc: '最终伤害+15%，穿透防御+10%', stats: { finalDamageBoost: 0.15, combatBoost: 0.1 } },
  iron_wall: { name: '铁壁', desc: '防御+20%，生命+15%', stats: { defense: 0.2, health: 0.15 } },
  agile_step: { name: '灵动', desc: '闪避率+12%，速度+15%', stats: { dodgeRate: 0.12, speed: 0.15 } },
  blood_lust: { name: '嗜血', desc: '吸血率+15%，暴击率+8%', stats: { vampireRate: 0.15, critRate: 0.08 } },
  counter_master: { name: '反击达人', desc: '反击率+15%，反击伤害+50%', stats: { counterRate: 0.15, critDamageBoost: 0.5 } },
  combo_master: { name: '连击大师', desc: '连击率+15%，连击伤害+30%', stats: { comboRate: 0.15, comboResist: 0.15 } },
  stun_master: { name: '眩晕大师', desc: '眩晕率+12%，抗眩晕+10%', stats: { stunRate: 0.12, stunResist: 0.1 } },
  crit_master: { name: '暴击大师', desc: '暴击率+10%，暴击伤害+30%', stats: { critRate: 0.1, critDamageBoost: 0.3 } },
  tank_master: { name: '防御大师', desc: '防御+25%，最终减伤+10%', stats: { defense: 0.25, finalDamageReduce: 0.1 } },
  dps_master: { name: '输出大师', desc: '攻击+20%，最终伤害+10%', stats: { attack: 0.2, finalDamageBoost: 0.1 } },
  support_master: { name: '辅助大师', desc: '治疗效果+40%，全队增益+10%', stats: { healBoost: 0.4, combatBoost: 0.1 } },
  survival_master: { name: '生存大师', desc: '生命+30%，生命恢复+25%', stats: { health: 0.3, healBoost: 0.25 } },
  speed_master: { name: '速度大师', desc: '速度+30%，先手几率+20%', stats: { speed: 0.3, dodgeRate: 0.2 } },
  balance_master: { name: '均衡大师', desc: '全属性+8%', stats: { attack: 0.08, defense: 0.08, health: 0.08, speed: 0.08 } },
  luck_master: { name: '幸运大师', desc: '掉落率+25%，幸运值+100%', stats: { cultivationRate: 0.25 } },
  cultivation_master: { name: '修炼大师', desc: '修炼效率+35%，修为上限+20%', stats: { cultivationRate: 0.35, spiritRate: 0.2 } },
  spirit_master: { name: '灵力大师', desc: '灵力恢复+30%，灵力上限+25%', stats: { spiritRate: 0.3, cultivationRate: 0.25 } },
  equipment_master: { name: '炼器大师', desc: '装备效果+15%，强化成功率+10%', stats: { combatBoost: 0.15, resistanceBoost: 0.1 } },
  alchemy_master: { name: '炼丹大师', desc: '丹药效果+20%，炼丹成功率+15%', stats: { healBoost: 0.2, cultivationRate: 0.15 } },
  battle_master: { name: '战神', desc: '战斗属性全+10%', stats: { critRate: 0.1, comboRate: 0.1, counterRate: 0.1, stunRate: 0.1, dodgeRate: 0.1, vampireRate: 0.1 } },
  resistance_master: { name: '抗性大师', desc: '所有抗性+15%', stats: { critResist: 0.15, comboResist: 0.15, counterResist: 0.15, stunResist: 0.15, dodgeResist: 0.15, vampireResist: 0.15 } }
}

export const characterList = [
  { id: 'char_001', name: '李青', star: 3, school: 'sword', talent: 'sword_mastery', description: '自幼习剑，剑法精湛', baseStats: { attack: 15, health: 80, defense: 8, speed: 12 }, avatar: null },
  { id: 'char_002', name: '王静', star: 3, school: 'dao', talent: 'dao_insight', description: '潜心修道，领悟天机', baseStats: { attack: 10, health: 90, defense: 10, speed: 10 }, avatar: null },
  { id: 'char_003', name: '赵炎', star: 3, school: 'fire', talent: 'flame_body', description: '身怀火灵根，擅长火系法术', baseStats: { attack: 18, health: 70, defense: 6, speed: 11 }, avatar: null },
  { id: 'char_004', name: '孙霜', star: 3, school: 'ice', talent: 'ice_barrier', description: '冰系天才，防御超群', baseStats: { attack: 12, health: 95, defense: 12, speed: 9 }, avatar: null },
  { id: 'char_005', name: '周雷', star: 3, school: 'thunder', talent: 'thunder_speed', description: '雷灵根觉醒，身法如电', baseStats: { attack: 14, health: 75, defense: 7, speed: 18 }, avatar: null },
  { id: 'char_006', name: '吴毒', star: 3, school: 'poison', talent: 'poison_breath', description: '毒宗传人，擅长用毒', baseStats: { attack: 13, health: 78, defense: 6, speed: 13 }, avatar: null },
  { id: 'char_007', name: '郑虎', star: 3, school: 'beast', talent: 'beast_tamer', description: '天生驭兽，力大无穷', baseStats: { attack: 16, health: 110, defense: 11, speed: 8 }, avatar: null },
  { id: 'char_008', name: '陈鬼', star: 3, school: 'ghost', talent: 'ghost_pact', description: '鬼修传人，操控亡灵', baseStats: { attack: 15, health: 65, defense: 5, speed: 14 }, avatar: null },
  { id: 'char_009', name: '杨光', star: 3, school: 'light', talent: 'light_blessing', description: '光明使者，治愈他人', baseStats: { attack: 11, health: 85, defense: 9, speed: 10 }, avatar: null },
  { id: 'char_010', name: '黄小龙', star: 3, school: 'dark', talent: 'dark_pact', description: '暗影行者，暗杀高手', baseStats: { attack: 17, health: 68, defense: 5, speed: 15 }, avatar: null },
  { id: 'char_011', name: '刘铁', star: 3, school: 'sword', talent: 'iron_wall', description: '剑盾双修，攻守兼备', baseStats: { attack: 12, health: 100, defense: 14, speed: 7 }, avatar: null },
  { id: 'char_012', name: '陈小云', star: 3, school: 'dao', talent: 'agile_step', description: '灵动飘逸，难以捉摸', baseStats: { attack: 13, health: 72, defense: 6, speed: 16 }, avatar: null },
  { id: 'char_013', name: '林血', star: 3, school: 'fire', talent: 'blood_lust', description: '嗜血狂战，越战越强', baseStats: { attack: 19, health: 60, defense: 4, speed: 12 }, avatar: null },
  { id: 'char_014', name: '何反', star: 3, school: 'ice', talent: 'counter_master', description: '反击高手，后发制人', baseStats: { attack: 14, health: 82, defense: 10, speed: 9 }, avatar: null },
  { id: 'char_015', name: '马连', star: 3, school: 'thunder', talent: 'combo_master', description: '连击如电，势不可挡', baseStats: { attack: 15, health: 70, defense: 6, speed: 14 }, avatar: null },
  { id: 'char_016', name: '胡晕', star: 3, school: 'poison', talent: 'stun_master', description: '控场专家，眩晕敌人', baseStats: { attack: 12, health: 75, defense: 7, speed: 11 }, avatar: null },
  { id: 'char_017', name: '郭爆', star: 3, school: 'beast', talent: 'crit_master', description: '一击必杀，暴击无敌', baseStats: { attack: 20, health: 55, defense: 4, speed: 13 }, avatar: null },
  { id: 'char_018', name: '罗坦', star: 3, school: 'ghost', talent: 'tank_master', description: '肉盾先锋，保护队友', baseStats: { attack: 10, health: 120, defense: 16, speed: 6 }, avatar: null },
  { id: 'char_019', name: '梁输', star: 3, school: 'light', talent: 'dps_master', description: '输出狂人，伤害爆表', baseStats: { attack: 22, health: 50, defense: 3, speed: 12 }, avatar: null },
  { id: 'char_020', name: '谢辅', star: 3, school: 'dark', talent: 'support_master', description: '辅助达人，增益队友', baseStats: { attack: 8, health: 88, defense: 8, speed: 10 }, avatar: null },
  { id: 'char_021', name: '慕容雪', star: 4, school: 'sword', talent: 'sword_mastery', description: '剑宗圣女，风华绝代', baseStats: { attack: 25, health: 120, defense: 14, speed: 18 }, avatar: null },
  { id: 'char_022', name: '张三丰', star: 4, school: 'dao', talent: 'dao_insight', description: '道宗掌门，道法高深', baseStats: { attack: 18, health: 140, defense: 16, speed: 15 }, avatar: null },
  { id: 'char_023', name: '炎龙子', star: 4, school: 'fire', talent: 'flame_body', description: '火宗少主，焚天煮海', baseStats: { attack: 32, health: 100, defense: 10, speed: 16 }, avatar: null },
  { id: 'char_024', name: '冰仙子', star: 4, school: 'ice', talent: 'ice_barrier', description: '冰宫宫主，冰封万里', baseStats: { attack: 22, health: 145, defense: 20, speed: 14 }, avatar: null },
  { id: 'char_025', name: '雷帝', star: 4, school: 'thunder', talent: 'thunder_speed', description: '雷域之主，雷霆万钧', baseStats: { attack: 26, health: 110, defense: 12, speed: 26 }, avatar: null },
  { id: 'char_026', name: '毒圣', star: 4, school: 'poison', talent: 'poison_breath', description: '万毒之王，毒霸天下', baseStats: { attack: 24, health: 115, defense: 10, speed: 19 }, avatar: null },
  { id: 'char_027', name: '兽王', star: 4, school: 'beast', talent: 'beast_tamer', description: '万兽之王，号令群兽', baseStats: { attack: 28, health: 170, defense: 18, speed: 12 }, avatar: null },
  { id: 'char_028', name: '鬼尊', star: 4, school: 'ghost', talent: 'ghost_pact', description: '幽冥之主，操控鬼神', baseStats: { attack: 28, health: 100, defense: 8, speed: 22 }, avatar: null },
  { id: 'char_029', name: '圣光天使', star: 4, school: 'light', talent: 'light_blessing', description: '天界使者，圣光普照', baseStats: { attack: 20, health: 130, defense: 15, speed: 16 }, avatar: null },
  { id: 'char_030', name: '暗影主宰', star: 4, school: 'dark', talent: 'dark_pact', description: '暗影之主，黑暗降临', baseStats: { attack: 30, health: 95, defense: 9, speed: 24 }, avatar: null },
  { id: 'char_031', name: '铁甲卫', star: 4, school: 'sword', talent: 'iron_wall', description: '铁甲战神，坚不可摧', baseStats: { attack: 20, health: 180, defense: 24, speed: 10 }, avatar: null },
  { id: 'char_032', name: '疾风客', star: 4, school: 'dao', talent: 'agile_step', description: '疾风无影，来去无踪', baseStats: { attack: 24, health: 105, defense: 10, speed: 28 }, avatar: null },
  { id: 'char_033', name: '嗜血魔', star: 4, school: 'fire', talent: 'blood_lust', description: '嗜血狂魔，饮血为生', baseStats: { attack: 35, health: 90, defense: 7, speed: 18 }, avatar: null },
  { id: 'char_034', name: '反击王', star: 4, school: 'ice', talent: 'counter_master', description: '反击之王，以彼之道', baseStats: { attack: 25, health: 130, defense: 16, speed: 14 }, avatar: null },
  { id: 'char_035', name: '千手修罗', star: 4, school: 'thunder', talent: 'combo_master', description: '千手修罗，连击无敌', baseStats: { attack: 28, health: 100, defense: 10, speed: 20 }, avatar: null },
  { id: 'char_036', name: '控魂师', star: 4, school: 'poison', talent: 'stun_master', description: '控魂大师，玩弄敌人', baseStats: { attack: 22, health: 110, defense: 12, speed: 16 }, avatar: null },
  { id: 'char_037', name: '暴击皇', star: 4, school: 'beast', talent: 'crit_master', description: '暴击之皇，一击致命', baseStats: { attack: 38, health: 80, defense: 6, speed: 18 }, avatar: null },
  { id: 'char_038', name: '铜墙', star: 4, school: 'ghost', talent: 'tank_master', description: '铜墙铁壁，无可匹敌', baseStats: { attack: 18, health: 200, defense: 28, speed: 8 }, avatar: null },
  { id: 'char_039', name: '杀神', star: 4, school: 'light', talent: 'dps_master', description: '杀神降临，万敌俯首', baseStats: { attack: 42, health: 75, defense: 5, speed: 16 }, avatar: null },
  { id: 'char_040', name: '圣疗师', star: 4, school: 'dark', talent: 'support_master', description: '圣光疗愈，起死回生', baseStats: { attack: 15, health: 140, defense: 14, speed: 14 }, avatar: null },
  { id: 'char_041', name: '剑神', star: 5, school: 'sword', talent: 'battle_master', description: '剑道巅峰，一剑破万法', baseStats: { attack: 50, health: 200, defense: 25, speed: 30 }, avatar: null },
  { id: 'char_042', name: '道祖', star: 5, school: 'dao', talent: 'cultivation_master', description: '道之极致，一念成圣', baseStats: { attack: 40, health: 250, defense: 30, speed: 25 }, avatar: null },
  { id: 'char_043', name: '炎神', star: 5, school: 'fire', talent: 'dps_master', description: '炎火之神，焚尽苍穹', baseStats: { attack: 60, health: 180, defense: 20, speed: 28 }, avatar: null },
  { id: 'char_044', name: '冰皇', star: 5, school: 'ice', talent: 'resistance_master', description: '冰之皇者，万法不侵', baseStats: { attack: 45, health: 280, defense: 35, speed: 22 }, avatar: null },
  { id: 'char_045', name: '雷神', star: 5, school: 'thunder', talent: 'speed_master', description: '雷霆之神，速度极致', baseStats: { attack: 52, health: 160, defense: 18, speed: 45 }, avatar: null },
  { id: 'char_046', name: '毒神', star: 5, school: 'poison', talent: 'ghost_pact', description: '万毒之神，无药可解', baseStats: { attack: 55, health: 170, defense: 15, speed: 32 }, avatar: null },
  { id: 'char_047', name: '兽神', star: 5, school: 'beast', talent: 'survival_master', description: '万兽之神，不死不灭', baseStats: { attack: 48, health: 350, defense: 32, speed: 20 }, avatar: null },
  { id: 'char_048', name: '鬼王', star: 5, school: 'ghost', talent: 'blood_lust', description: '幽冥鬼王，吞噬一切', baseStats: { attack: 58, health: 220, defense: 22, speed: 35 }, avatar: null },
  { id: 'char_049', name: '光明神', star: 5, school: 'light', talent: 'light_blessing', description: '光明之神，普照众生', baseStats: { attack: 42, health: 300, defense: 30, speed: 26 }, avatar: null },
  { id: 'char_050', name: '暗夜神', star: 5, school: 'dark', talent: 'dark_pact', description: '暗夜之神，掌控命运', baseStats: { attack: 65, health: 150, defense: 15, speed: 40 }, avatar: null }
]

export function generateCharacterById(charId) {
  const template = characterList.find(c => c.id === charId)
  if (!template) return null
  
  const starMult = starConfig[template.star].multiplier
  const talent = characterTalents[template.talent]
  
  const baseStats = {
    attack: Math.round(template.baseStats.attack * starMult),
    health: Math.round(template.baseStats.health * starMult),
    defense: Math.round(template.baseStats.defense * starMult),
    speed: Math.round(template.baseStats.speed * starMult)
  }
  
  return {
    id: `member_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    templateId: template.id,
    name: template.name,
    star: template.star,
    school: template.school,
    schoolName: characterSchools[template.school].name,
    schoolColor: characterSchools[template.school].color,
    schoolIcon: characterSchools[template.school].icon,
    talent: template.talent,
    talentName: talent.name,
    talentDesc: talent.desc,
    talentStats: talent.stats,
    description: template.description,
    baseStats: { ...baseStats },
    level: 1,
    experience: 0,
    maxExperience: 100,
    equippedArtifacts: {
      weapon: null,
      head: null,
      body: null,
      legs: null,
      feet: null,
      shoulder: null,
      hands: null,
      wrist: null,
      necklace: null,
      ring1: null,
      ring2: null,
      belt: null,
      artifact: null
    },
    avatar: template.avatar,
    isActive: false,
    combatAttributes: {
      critRate: 0,
      comboRate: 0,
      counterRate: 0,
      stunRate: 0,
      dodgeRate: 0,
      vampireRate: 0
    },
    combatResistance: {
      critResist: 0,
      comboResist: 0,
      counterResist: 0,
      stunResist: 0,
      dodgeResist: 0,
      vampireResist: 0
    },
    specialAttributes: {
      healBoost: 0,
      critDamageBoost: 0,
      critDamageReduce: 0,
      finalDamageBoost: 0,
      finalDamageReduce: 0,
      combatBoost: 0,
      resistanceBoost: 0
    }
  }
}

export function generateRandomCharacter(forceStar = null) {
  // 概率：5星 3%，4星 20%，3星 77%
  // forceStar: 保底/锁定星数时使用（如十连保底）
  const STAR_5_RATE = 0.03
  const STAR_4_RATE = 0.20
  const STAR_3_RATE = 0.77
  let star
  if (forceStar) {
    star = forceStar
  } else {
    const rand = Math.random()
    if (rand < STAR_5_RATE) star = 5
    else if (rand < STAR_5_RATE + STAR_4_RATE) star = 4
    else star = 3
  }
  const candidates = characterList.filter(c => c.star === star)
  if (candidates.length === 0) {
    return generateCharacterById(characterList[Math.floor(Math.random() * characterList.length)].id)
  }
  const template = candidates[Math.floor(Math.random() * candidates.length)]
  return generateCharacterById(template.id)
}

export function getCharacterBuildStrength(character) {
  if (!character) return 0
  
  const baseScore = character.baseStats.attack * 5 + character.baseStats.health * 0.5 +
                    character.baseStats.defense * 3 + character.baseStats.speed * 8
  
  const talentScore = Object.values(character.talentStats || {}).reduce((sum, val) => sum + val * 100, 0)
  
  const levelMult = 1 + (character.level - 1) * 0.02
  
  return Math.round((baseScore + talentScore) * levelMult)
}