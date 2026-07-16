import { reactive } from 'vue'
import { GameDB } from '../stores/db'
import { getInitialSkills, getSkillSchoolByRole, skillSchools } from './skills'

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

export const characterRoles = {
  vanguard: { name: '先锋', icon: '⚔️', desc: '核心输出，队伍的主要战力担当' },
  blade: { name: '刀锋', icon: '🗡️', desc: '副位输出，补充伤害与连击' },
  herb: { name: '药引', icon: '🌿', desc: '辅助治疗，为队伍提供续航' },
  shield: { name: '护法', icon: '🛡️', desc: '承伤坦克，保护队友免受致命打击' },
  tactician: { name: '掌阵', icon: '📐', desc: '战术核心，掌控全局节奏与阵法' }
}

export const starConfig = {
  3: { name: '三星', color: '#999999', multiplier: 1, growthRate: 1, talentValue: 100, effortCapRatio: 0.9, nextStarTalent: 150 },
  4: { name: '四星', color: '#4169E1', multiplier: 1.5, growthRate: 1.2, talentValue: 150, effortCapRatio: 0.9, nextStarTalent: 225 },
  5: { name: '五星', color: '#FFD700', multiplier: 2.5, growthRate: 1.5, talentValue: 225, effortCapRatio: null, nextStarTalent: null }
}

// 根据星级和升星继承的努力值，计算实际初始天赋值（升星时会额外获得原星级最大努力值的10%）
export function getInitialTalent(star, inheritedEffortBonus = 0) {
  const base = starConfig[star]?.talentValue || 100
  return base + inheritedEffortBonus
}

// 根据星级计算努力值上限（五星无上限）
export function getEffortCap(star) {
  const cfg = starConfig[star]
  if (!cfg) return Infinity
  if (cfg.effortCapRatio === null || cfg.nextStarTalent === null) return Infinity
  return Math.floor(cfg.nextStarTalent * cfg.effortCapRatio)
}

// 天赋值到属性的换算系数（每点天赋值对应多少基础属性）
export const TALENT_STAT_COEFF = {
  attack: 0.15,
  health: 1.0,
  defense: 0.08,
  speed: 0.12
}

// 努力值到属性的换算（与天赋值使用相同系数，但单独计算、单独加成）
export const EFFORT_STAT_COEFF = TALENT_STAT_COEFF

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
  { id: 'char_001', name: '苏浅雪', star: 3, school: 'sword', talent: 'sword_mastery', description: '曾于青萝林剑斩三头狼王，剑身未沾一滴血', role: 'vanguard', baseStats: { attack: 15, health: 80, defense: 8, speed: 12 }, avatar: null },
  { id: 'char_002', name: '林清瑶', star: 3, school: 'dao', talent: 'dao_insight', description: '能以铜钱占卜吉凶，百算百中，人称"活神仙"', role: 'tactician', baseStats: { attack: 10, health: 90, defense: 10, speed: 10 }, avatar: null },
  { id: 'char_003', name: '炎红袖', star: 3, school: 'fire', talent: 'flame_body', description: '赤足踏过岩浆如履平地，指尖焰火可点燃百丈开外的枯枝', role: 'vanguard', baseStats: { attack: 18, health: 70, defense: 6, speed: 11 }, avatar: null },
  { id: 'char_004', name: '冷月', star: 3, school: 'ice', talent: 'ice_barrier', description: '眼神所及之处寸草不生，皆化为冰晶', role: 'shield', baseStats: { attack: 12, health: 95, defense: 12, speed: 9 }, avatar: null },
  { id: 'char_005', name: '惊鸿', star: 3, school: 'thunder', talent: 'thunder_speed', description: '轻功冠绝天下，曾在暴雨夜踏雷电而行，如履平地', role: 'blade', baseStats: { attack: 14, health: 75, defense: 7, speed: 18 }, avatar: null },
  { id: 'char_006', name: '蛇姬', star: 3, school: 'poison', talent: 'poison_breath', description: '腰间常挂着一条翡翠小蛇，那是她唯一的伙伴', role: 'blade', baseStats: { attack: 13, health: 78, defense: 6, speed: 13 }, avatar: null },
  { id: 'char_007', name: '熊娇娇', star: 3, school: 'beast', talent: 'beast_tamer', description: '能与百兽对话，曾骑着一头白熊从山崖跃下毫发无损', role: 'shield', baseStats: { attack: 16, health: 110, defense: 11, speed: 8 }, avatar: null },
  { id: 'char_008', name: '夜鸢', star: 3, school: 'ghost', talent: 'ghost_pact', description: '只在午夜出现，来去无声，江湖人称"午夜幽灵"', role: 'blade', baseStats: { attack: 15, health: 65, defense: 5, speed: 14 }, avatar: null },
  { id: 'char_009', name: '云隐', star: 3, school: 'light', talent: 'light_blessing', description: '随身带着一个破旧药箱，无论多重的伤都能妙手回春', role: 'herb', baseStats: { attack: 11, health: 85, defense: 9, speed: 10 }, avatar: null },
  { id: 'char_010', name: '影杀', star: 3, school: 'dark', talent: 'dark_pact', description: '能融入任何阴影之中，敌人永远看不见她的刀刃', role: 'blade', baseStats: { attack: 17, health: 68, defense: 5, speed: 15 }, avatar: null },
  { id: 'char_011', name: '铁扇娘', star: 3, school: 'sword', talent: 'iron_wall', description: '一柄铁扇攻守兼备，曾挡住数十名高手的围攻', role: 'shield', baseStats: { attack: 12, health: 100, defense: 14, speed: 7 }, avatar: null },
  { id: 'char_012', name: '飞絮', star: 3, school: 'dao', talent: 'agile_step', description: '身法轻盈如柳絮飘飞，没人能看清她的招式', role: 'blade', baseStats: { attack: 13, health: 72, defense: 6, speed: 16 }, avatar: null },
  { id: 'char_013', name: '血罗刹', star: 3, school: 'fire', talent: 'blood_lust', description: '每战必浴血，血溅三尺时反而越战越勇', role: 'vanguard', baseStats: { attack: 19, health: 60, defense: 4, speed: 12 }, avatar: null },
  { id: 'char_014', name: '逆鳞', star: 3, school: 'ice', talent: 'counter_master', description: '从不主动攻击，但若被触碰到逆鳞，后果不堪设想', role: 'shield', baseStats: { attack: 14, health: 82, defense: 10, speed: 9 }, avatar: null },
  { id: 'char_015', name: '连珠', star: 3, school: 'thunder', talent: 'combo_master', description: '快剑如连珠炮发，一剑快过一剑，让人目不暇接', role: 'blade', baseStats: { attack: 15, health: 70, defense: 6, speed: 14 }, avatar: null },
  { id: 'char_016', name: '幻雾', star: 3, school: 'poison', talent: 'stun_master', description: '擅长用毒烟制造幻境，曾让整支军队迷失在山谷之中', role: 'tactician', baseStats: { attack: 12, health: 75, defense: 7, speed: 11 }, avatar: null },
  { id: 'char_017', name: '裂魂', star: 3, school: 'beast', talent: 'crit_master', description: '一刀斩出可裂山石，据说他的刀下亡魂已有百数', role: 'vanguard', baseStats: { attack: 20, health: 55, defense: 4, speed: 13 }, avatar: null },
  { id: 'char_018', name: '磐石', star: 3, school: 'ghost', talent: 'tank_master', description: '站如磐石，曾一人挡住千军万马，岿然不动', role: 'shield', baseStats: { attack: 10, health: 120, defense: 16, speed: 6 }, avatar: null },
  { id: 'char_019', name: '焚天', star: 3, school: 'light', talent: 'dps_master', description: '以命换命的打法，同归于尽前必定拉上对手陪葬', role: 'vanguard', baseStats: { attack: 22, health: 50, defense: 3, speed: 12 }, avatar: null },
  { id: 'char_020', name: '回春', star: 3, school: 'dark', talent: 'support_master', description: '虽出身暗宗，却心怀慈悲，救人无数', role: 'herb', baseStats: { attack: 8, health: 88, defense: 8, speed: 10 }, avatar: null },
  { id: 'char_021', name: '凌霜剑姬', star: 4, school: 'sword', talent: 'sword_mastery', description: '剑宗圣女，一剑霜寒十四州，所到之处冰雪纷飞', role: 'vanguard', baseStats: { attack: 25, health: 120, defense: 14, speed: 18 }, avatar: null },
  { id: 'char_022', name: '玄玑仙子', star: 4, school: 'dao', talent: 'dao_insight', description: '推演天机如探囊取物，能预测百年后的天劫', role: 'tactician', baseStats: { attack: 18, health: 140, defense: 16, speed: 15 }, avatar: null },
  { id: 'char_023', name: '赤焰灵尊', star: 4, school: 'fire', talent: 'flame_body', description: '火宗圣女，能召唤九天神火，焚尽世间一切污秽', role: 'vanguard', baseStats: { attack: 32, health: 100, defense: 10, speed: 16 }, avatar: null },
  { id: 'char_024', name: '寒渊仙子', star: 4, school: 'ice', talent: 'ice_barrier', description: '冰宫传人，挥手间万里冰封，连时间都仿佛凝固', role: 'shield', baseStats: { attack: 22, health: 145, defense: 20, speed: 14 }, avatar: null },
  { id: 'char_025', name: '紫电圣母', star: 4, school: 'thunder', talent: 'thunder_speed', description: '雷宗奇才，双掌拍出如雷霆万钧，无人能挡', role: 'blade', baseStats: { attack: 26, health: 110, defense: 12, speed: 26 }, avatar: null },
  { id: 'char_026', name: '百毒仙姑', star: 4, school: 'poison', talent: 'poison_breath', description: '毒宗长老，万毒不侵，一滴毒液可让方圆十里寸草不生', role: 'blade', baseStats: { attack: 24, health: 115, defense: 10, speed: 19 }, avatar: null },
  { id: 'char_027', name: '驭兽天女', star: 4, school: 'beast', talent: 'beast_tamer', description: '兽宗宗主，能号令万兽，曾驱使一群巨龙守护宗门', role: 'shield', baseStats: { attack: 28, health: 170, defense: 18, speed: 12 }, avatar: null },
  { id: 'char_028', name: '九幽鬼母', star: 4, school: 'ghost', talent: 'ghost_pact', description: '鬼修大能，能召唤九幽厉鬼，执掌幽冥生死簿', role: 'blade', baseStats: { attack: 28, health: 100, defense: 8, speed: 22 }, avatar: null },
  { id: 'char_029', name: '净世光使', star: 4, school: 'light', talent: 'light_blessing', description: '光宗使者，以圣光净化邪祟，让亡灵安息', role: 'herb', baseStats: { attack: 20, health: 130, defense: 15, speed: 16 }, avatar: null },
  { id: 'char_030', name: '噬影魔女', star: 4, school: 'dark', talent: 'dark_pact', description: '暗宗殿主，能吞噬光影为食，与黑暗融为一体', role: 'vanguard', baseStats: { attack: 30, health: 95, defense: 9, speed: 24 }, avatar: null },
  { id: 'char_031', name: '九天玄女', star: 4, school: 'sword', talent: 'iron_wall', description: '刀枪不入，曾以肉身硬抗天劫而毫发无损', role: 'shield', baseStats: { attack: 20, health: 180, defense: 24, speed: 10 }, avatar: null },
  { id: 'char_032', name: '风无形', star: 4, school: 'dao', talent: 'agile_step', description: '身法绝伦，来无影去无踪，从未有人见过她的真面目', role: 'blade', baseStats: { attack: 24, health: 105, defense: 10, speed: 28 }, avatar: null },
  { id: 'char_033', name: '血魔女', star: 4, school: 'fire', talent: 'blood_lust', description: '以血为道，每饮一滴血便增一分修为，令人闻风丧胆', role: 'vanguard', baseStats: { attack: 35, health: 90, defense: 7, speed: 18 }, avatar: null },
  { id: 'char_034', name: '镜花影', star: 4, school: 'ice', talent: 'counter_master', description: '以镜反射攻击，敌人的招式会原封不动地还回去', role: 'shield', baseStats: { attack: 25, health: 130, defense: 16, speed: 14 }, avatar: null },
  { id: 'char_035', name: '千手修罗', star: 4, school: 'thunder', talent: 'combo_master', description: '多臂连环攻击，如修罗降世，让人防不胜防', role: 'blade', baseStats: { attack: 28, health: 100, defense: 10, speed: 20 }, avatar: null },
  { id: 'char_036', name: '摄魂音', star: 4, school: 'poison', talent: 'stun_master', description: '以音律摄魂，琴声一起，敌人便会不由自主地起舞', role: 'tactician', baseStats: { attack: 22, health: 110, defense: 12, speed: 16 }, avatar: null },
  { id: 'char_037', name: '天怒', star: 4, school: 'beast', talent: 'crit_master', description: '追求暴击极致，一拳打出可震碎山岳', role: 'vanguard', baseStats: { attack: 38, health: 80, defense: 6, speed: 18 }, avatar: null },
  { id: 'char_038', name: '不灭金身', star: 4, school: 'ghost', talent: 'tank_master', description: '修炼不死金身，无论受到多重的伤都能快速恢复', role: 'shield', baseStats: { attack: 18, health: 200, defense: 28, speed: 8 }, avatar: null },
  { id: 'char_039', name: '杀生佛', star: 4, school: 'light', talent: 'dps_master', description: '以杀证道，佛挡杀佛，魔挡杀魔', role: 'vanguard', baseStats: { attack: 42, health: 75, defense: 5, speed: 16 }, avatar: null },
  { id: 'char_040', name: '慈航道人', star: 4, school: 'dark', talent: 'support_master', description: '救苦救难，能以暗力治愈百病，人称"暗中医仙"', role: 'herb', baseStats: { attack: 15, health: 140, defense: 14, speed: 14 }, avatar: null },
  { id: 'char_041', name: '太虚剑帝', star: 5, school: 'sword', talent: 'battle_master', description: '剑道通神，一剑可斩天裂地，连天道都要退避三分', role: 'vanguard', baseStats: { attack: 50, health: 200, defense: 25, speed: 30 }, avatar: null },
  { id: 'char_042', name: '混元道母', star: 5, school: 'dao', talent: 'cultivation_master', description: '参悟大道本源，一念可定乾坤，万法皆空', role: 'tactician', baseStats: { attack: 40, health: 250, defense: 30, speed: 25 }, avatar: null },
  { id: 'char_043', name: '九阳炎皇', star: 5, school: 'fire', talent: 'dps_master', description: '驾驭九阳真火，焚尽世间万物，连虚空都能点燃', role: 'vanguard', baseStats: { attack: 60, health: 180, defense: 20, speed: 28 }, avatar: null },
  { id: 'char_044', name: '万古冰皇', star: 5, school: 'ice', talent: 'resistance_master', description: '万载寒冰加身，冰封三千世界，时间在她面前静止', role: 'shield', baseStats: { attack: 45, health: 280, defense: 35, speed: 22 }, avatar: null },
  { id: 'char_045', name: '紫霄雷母', star: 5, school: 'thunder', talent: 'speed_master', description: '掌控天劫雷霆，速度天下无双，眨眼间可跨越万里', role: 'blade', baseStats: { attack: 52, health: 160, defense: 18, speed: 45 }, avatar: null },
  { id: 'char_046', name: '天毒圣母', star: 5, school: 'poison', talent: 'ghost_pact', description: '万毒之体，天地间无药可解其毒，一滴血便可毒杀一界', role: 'blade', baseStats: { attack: 55, health: 170, defense: 15, speed: 32 }, avatar: null },
  { id: 'char_047', name: '光明佛母', star: 5, school: 'light', talent: 'light_blessing', description: '普度众生的光明之尊，圣光所到之处，万物复苏', role: 'herb', baseStats: { attack: 42, health: 300, defense: 30, speed: 26 }, avatar: null },
  { id: 'char_048', name: '洪荒兽神', star: 5, school: 'beast', talent: 'survival_master', description: '唤醒洪荒血脉，肉身堪比神兽，一拳可打碎星辰', role: 'shield', baseStats: { attack: 48, health: 350, defense: 32, speed: 20 }, avatar: null },
  { id: 'char_049', name: '十殿阎罗', star: 5, school: 'ghost', talent: 'blood_lust', description: '执掌幽冥十殿，掌控生死轮回，一念可判人生死', role: 'vanguard', baseStats: { attack: 58, health: 220, defense: 22, speed: 35 }, avatar: null },
  { id: 'char_050', name: '永夜天尊', star: 5, school: 'dark', talent: 'dark_pact', description: '吞噬光明的永夜之主，一念之间可让世界陷入永恒黑暗', role: 'vanguard', baseStats: { attack: 65, health: 150, defense: 15, speed: 40 }, avatar: null },
]

// ===== 立绘解析与持久化（批量导入 + 大陆稳定加载）=====
// 合并定义表：templateId -> 角色定义（含 avatar），运行时由 GMTools / 存档覆盖静态 characterList
export const characterDefMap = reactive({})

export function syncCharacterDefs(list) {
  if (Array.isArray(list)) {
    list.forEach(c => { if (c && c.id) characterDefMap[c.id] = c })
  }
  // 静态角色作为兜底，保证 map 永不为空
  characterList.forEach(c => { if (!characterDefMap[c.id]) characterDefMap[c.id] = c })
}

// 应用启动时调用：从 IndexedDB（ gm_characters ）载入立绘定义，回退 localStorage / 静态表
export async function initCharacterDefs() {
  let list = null
  try {
    list = await GameDB.getData('gm_characters')
  } catch (e) { list = null }
  if (!Array.isArray(list) || !list.length) {
    try { list = JSON.parse(localStorage.getItem('gm_characters') || 'null') } catch (e) { list = null }
  }
  if (Array.isArray(list) && list.length) {
    syncCharacterDefs(list)
  } else {
    syncCharacterDefs(characterList)
  }
  // 载入随站点部署的「共享立绘包」：所有玩家同源可见（开发者发布后生效）
  try { await loadSharedPortraits() } catch (e) { /* 无共享包时静默降级 */ }
  return characterDefMap
}

export const sharedPortraitMap = reactive({})

// 立绘资源加载状态：避免重复 fetch，并保证失败时使用静态回退
let portraitsLoaded = false

export async function loadSharedPortraits() {
  if (portraitsLoaded) return
  const base = import.meta.env.BASE_URL || './'
  try {
    // fetch 加 3 秒超时，防止网络慢或 hang 住导致游戏加载卡死
    const res = await Promise.race([
      fetch(`${base}portraits/manifest.json`, { cache: 'force-cache' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('manifest 加载超时')), 3000))
    ])
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const manifest = await res.json()
    if (manifest && typeof manifest === 'object') {
      Object.entries(manifest).forEach(([id, data]) => {
        // 兼容新旧两种格式
        if (typeof data === 'object' && data.full) {
          const entry = {
            full: `${base}portraits/${data.full}`,
            thumbnail: data.thumbnail ? `${base}portraits/${data.thumbnail}` : null
          }
          // 动态立绘视频（点击立绘时加载播放，首帧需与静态立绘一致）
          if (data.video) {
            entry.video = `${base}portraits/${data.video}`
          }
          sharedPortraitMap[id] = entry
        } else if (typeof data === 'string') {
          sharedPortraitMap[id] = {
            full: `${base}portraits/${data}`,
            thumbnail: null
          }
        }
      })
    }
  } catch (e) {
    console.warn('[portraits] 加载 manifest.json 失败，使用静态回退:', e.message)
    // 静态回退：用 characterList 生成默认 sharedPortraitMap（假设图片文件存在）
    // 这样即使 manifest.json 拉取失败，头像立绘也能立即显示，无需等待重试
    characterList.forEach(c => {
      if (!sharedPortraitMap[c.id]) {
        sharedPortraitMap[c.id] = {
          full: `${base}portraits/${c.id}.jpg`,
          thumbnail: null
        }
      }
    })
  }
  portraitsLoaded = true
}

export function getCharacterAvatar(member, size = 'full') {
  if (!member) return null
  if (member.avatar && typeof member.avatar === 'string' && member.avatar.startsWith('data:')) {
    return member.avatar
  }
  const id = member.templateId || member.id
  if (!id) return null
  if (characterDefMap[id] && characterDefMap[id].avatar) {
    return characterDefMap[id].avatar
  }
  if (sharedPortraitMap[id]) {
    const portrait = sharedPortraitMap[id]
    if (typeof portrait === 'object') {
      return size === 'thumbnail' && portrait.thumbnail ? portrait.thumbnail : portrait.full
    }
    return portrait
  }
  // 静态回退：sharedPortraitMap 尚未加载完成时，构造默认 URL（假设图片文件存在）
  // 这样头像可以立即显示，无需等待 manifest.json 加载完成
  const base = import.meta.env.BASE_URL || './'
  return `${base}portraits/${id}.jpg`
}

export function getCharacterThumbnail(member) {
  return getCharacterAvatar(member, 'thumbnail')
}

/**
 * 获取角色的动态立绘视频 URL（用于点击立绘后的视频播放）
 * 优先从 sharedPortraitMap（站点共享包）读取，其次回退到 characterDefMap
 * 返回 null 表示未配置视频，调用方应回退到静态立绘
 */
export function getCharacterVideo(member) {
  if (!member) return null
  const id = member.templateId || member.id
  if (!id) return null
  if (sharedPortraitMap[id] && sharedPortraitMap[id].video) {
    return sharedPortraitMap[id].video
  }
  if (characterDefMap[id] && characterDefMap[id].video) {
    return characterDefMap[id].video
  }
  return null
}

// 角色定位对应的初始战斗属性（独特数值信息）
// 每位角色根据其 role 自动获得一组独有的初始战斗/抗性/特殊属性
const roleInitStats = {
  // 先锋：核心输出，攻/暴/连/最终增伤
  vanguard: {
    combatAttributes: { critRate: 0.08, comboRate: 0.10, counterRate: 0, stunRate: 0, dodgeRate: 0, vampireRate: 0.05 },
    specialAttributes: { critDamageBoost: 0.20, finalDamageBoost: 0.10, combatBoost: 0.05 }
  },
  // 刀锋：副输出，速度/暴击/连击
  blade: {
    combatAttributes: { critRate: 0.12, comboRate: 0.15, counterRate: 0.05, stunRate: 0, dodgeRate: 0.05, vampireRate: 0 },
    specialAttributes: { critDamageBoost: 0.15, combatBoost: 0.08 }
  },
  // 药引：治疗/辅助
  herb: {
    combatAttributes: { critRate: 0, comboRate: 0, counterRate: 0, stunRate: 0.05, dodgeRate: 0.10, vampireRate: 0 },
    specialAttributes: { healBoost: 0.30, finalDamageReduce: 0.08, resistanceBoost: 0.10 }
  },
  // 护法：坦克/承伤
  shield: {
    combatAttributes: { critRate: 0, comboRate: 0, counterRate: 0.15, stunRate: 0.05, dodgeRate: 0, vampireRate: 0 },
    combatResistance: { critResist: 0.20, comboResist: 0.15, counterResist: 0.10, stunResist: 0.10, dodgeResist: 0.05, vampireResist: 0.10 },
    specialAttributes: { finalDamageReduce: 0.12, resistanceBoost: 0.15 }
  },
  // 掌阵：控场/阵法
  tactician: {
    combatAttributes: { critRate: 0.05, comboRate: 0.05, counterRate: 0.05, stunRate: 0.15, dodgeRate: 0.05, vampireRate: 0 },
    specialAttributes: { combatBoost: 0.10, healBoost: 0.10, finalDamageBoost: 0.05 }
  }
}

export function generateCharacterById(charId) {
  const template = characterList.find(c => c.id === charId)
  if (!template) return null

  const starCfg = starConfig[template.star]
  const starMult = starCfg.multiplier
  const talent = characterTalents[template.talent]

  const baseTalent = starCfg.talentValue

  const baseStats = {
    attack: Math.round(template.baseStats.attack * starMult),
    health: Math.round(template.baseStats.health * starMult),
    defense: Math.round(template.baseStats.defense * starMult),
    speed: Math.round(template.baseStats.speed * starMult)
  }

  const roleStats = roleInitStats[template.role] || roleInitStats.vanguard

  return {
    id: `member_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    templateId: template.id,
    name: template.name,
    star: template.star,
    school: template.school,
    schoolName: characterSchools[template.school].name,
    schoolColor: characterSchools[template.school].color,
    schoolIcon: characterSchools[template.school].icon,
    role: template.role,
    roleName: characterRoles[template.role]?.name || template.role,
    roleIcon: characterRoles[template.role]?.icon || '',
    roleDesc: characterRoles[template.role]?.desc || '',
    talent: template.talent,
    talentName: talent.name,
    talentDesc: talent.desc,
    talentStats: talent.stats,
    description: template.description,
    baseStats: { ...baseStats },
    talentValue: baseTalent,
    inheritedTalentBonus: 0,
    effortValue: 0,
    rebirthCount: 0,
    breakThrough: 0,
    skillSchool: getSkillSchoolByRole(template.role),
    skillSchoolName: skillSchools[getSkillSchoolByRole(template.role)]?.name || '',
    skillSchoolIcon: skillSchools[getSkillSchoolByRole(template.role)]?.icon || '',
    skills: getInitialSkills(template.role),
    level: 1,
    experience: 0,
    maxExperience: 100,
    equippedArtifacts: {
      artifact: null,
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
    avatar: (characterDefMap[charId] && characterDefMap[charId].avatar) || template.avatar,
    isActive: false,
    combatAttributes: {
      critRate: 0,
      comboRate: 0,
      counterRate: 0,
      stunRate: 0,
      dodgeRate: 0,
      vampireRate: 0,
      ...(roleStats.combatAttributes || {})
    },
    combatResistance: {
      critResist: 0,
      comboResist: 0,
      counterResist: 0,
      stunResist: 0,
      dodgeResist: 0,
      vampireResist: 0,
      ...(roleStats.combatResistance || {})
    },
    specialAttributes: {
      healBoost: 0,
      critDamageBoost: 0,
      critDamageReduce: 0,
      finalDamageBoost: 0,
      finalDamageReduce: 0,
      combatBoost: 0,
      resistanceBoost: 0,
      ...(roleStats.specialAttributes || {})
    }
  }
}

export function generateRandomCharacter(forceStar = null) {
  // 概率：5星 1%，4星 19%，3星 80%
  // forceStar: 保底/锁定星数时使用（如十连保底）
  const STAR_5_RATE = 0.01
  const STAR_4_RATE = 0.19
  const STAR_3_RATE = 0.80
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

// 计算角色的有效属性（基础属性 × 努力值加成）
export function getEffectiveBaseStats(character) {
  if (!character) return { attack: 0, health: 0, defense: 0, speed: 0 }
  const base = character.baseStats || { attack: 0, health: 0, defense: 0, speed: 0 }
  const talent = character.talentValue || 100
  const effort = character.effortValue || 0
  const effortMult = 1 + effort / talent
  return {
    attack: Math.round(base.attack * effortMult),
    health: Math.round(base.health * effortMult),
    defense: Math.round(base.defense * effortMult),
    speed: Math.round(base.speed * effortMult)
  }
}

// 回炉重造：角色升星（3→4, 4→5）
// 返回新角色（重置为1级，天赋值继承原努力值的10%）
export function rebirthCharacter(character) {
  if (!character) return null
  const currentStar = character.star || 3
  if (currentStar >= 5) return { success: false, message: '五星角色无法继续升星' }

  const currentCfg = starConfig[currentStar]
  const nextStar = currentStar + 1
  const nextCfg = starConfig[nextStar]
  if (!nextCfg) return { success: false, message: '无法升星' }

  const oldEffort = character.effortValue || 0
  const inheritedBonus = Math.floor(oldEffort * 0.1)
  const newTalent = nextCfg.talentValue + inheritedBonus

  const template = characterList.find(c => c.id === character.templateId)
  if (!template) return { success: false, message: '角色模板不存在' }

  const newMult = newTalent / currentCfg.talentValue
  const newBaseStats = {
    attack: Math.round(template.baseStats.attack * newMult),
    health: Math.round(template.baseStats.health * newMult),
    defense: Math.round(template.baseStats.defense * newMult),
    speed: Math.round(template.baseStats.speed * newMult)
  }

  return {
    success: true,
    newStar,
    newTalent,
    newBaseStats,
    inheritedBonus,
    oldEffort
  }
}

export function getCharacterBuildStrength(character) {
  if (!character) return 0
  
  const effStats = getEffectiveBaseStats(character)
  const baseScore = effStats.attack * 5 + effStats.health * 0.5 +
                    effStats.defense * 3 + effStats.speed * 8
  
  const talentScore = Object.values(character.talentStats || {}).reduce((sum, val) => sum + val * 100, 0)
  
  const levelMult = 1 + (character.level - 1) * 0.02
  
  return Math.round((baseScore + talentScore) * levelMult)
}