// 素材系统：灵草(herb) / 矿料(ore) / 灵液(liquid) / 妖丹(core) / 至宝(special) / BOSS素材(boss_material)
// 灵草数据迁自 herbs.js，其余四类为本模块新增。
import { herbs, herbQualities, getRandomHerb as getRandomHerbBase, getHerbValue } from './herbs'
import { BOSS_MATERIALS } from './cultivationSystem'

export const MATERIAL_KINDS = {
  herb: { name: '灵草', color: '#44aa44' },
  ore: { name: '矿料', color: '#b08d57' },
  liquid: { name: '灵液', color: '#3aa0c0' },
  core: { name: '妖丹', color: '#c0392b' },
  special: { name: '至宝', color: '#FFD700' },
  boss_material: { name: 'BOSS素材', color: '#FF4500' },
  boss_ticket: { name: '挑战券', color: '#FF8C00' }
}

// 矿料（zoneMin: 该秘境最低难度才可能出现；chance: 相对权重）
const ores = [
  { id: 'iron_essence', name: '铁精', description: '蕴含微弱铁煞之气的矿石，炼体丹药常用辅材', quality: 'common', baseValue: 12, zoneMin: 1, chance: 0.35 },
  { id: 'prospect_sand', name: '探矿砂', description: '可感应矿脉走向的细砂，寻宝丹主料', quality: 'common', baseValue: 14, zoneMin: 1, chance: 0.3 },
  { id: 'dark_iron_marrow', name: '玄铁髓', description: '玄铁精髓，锻骨丹核心辅材', quality: 'uncommon', baseValue: 28, zoneMin: 2, chance: 0.2 },
  { id: 'spirit_quench_sand', name: '淬灵砂', description: '淬炼灵气的神砂，强化丹主料', quality: 'uncommon', baseValue: 30, zoneMin: 2, chance: 0.18 },
  { id: 'tribulation_thunder_stone', name: '雷劫石', description: '雷劫淬炼之石，渡厄丹必需要件', quality: 'rare', baseValue: 60, zoneMin: 5, chance: 0.5 },
  { id: 'dao_essence_stone', name: '道蕴石', description: '蕴含大道纹路的奇石，悟道丹辅料', quality: 'rare', baseValue: 65, zoneMin: 5, chance: 0.4 },
  { id: 'common_enhance_stone', name: '普通强化石', description: '蕴含微弱灵力的灵石，可用于装备强化+1~+4', quality: 'common', baseValue: 50, zoneMin: 1, chance: 0.2 },
  { id: 'advanced_enhance_stone', name: '高级强化石', description: '蕴含精纯灵力的灵石，可用于装备强化+5~+8，需龙渊以上地图获取', quality: 'rare', baseValue: 200, zoneMin: 5, chance: 0.3 },
  { id: 'supreme_enhance_stone', name: '至尊强化石', description: '蕴含至强灵力的神石，可用于装备强化+9~+12，仅分解仙品以上装备概率获得', quality: 'legendary', baseValue: 1000, zoneMin: null, chance: 0 }
]

// 灵液（zoneMin 同上）
const liquids = [
  { id: 'ward_evil_dew', name: '辟邪露', description: '驱散邪祟的灵露，解厄丹辅料', quality: 'uncommon', baseValue: 26, zoneMin: 1, chance: 0.3 },
  { id: 'spirit_spring_water', name: '灵泉水', description: '灵泉之水，淬灵丹辅料', quality: 'uncommon', baseValue: 28, zoneMin: 2, chance: 0.25 },
  { id: 'jade_marrow_liquid', name: '玉髓液', description: '玉髓凝露，生肌疗伤圣品', quality: 'rare', baseValue: 55, zoneMin: 3, chance: 0.2 }
]

// 妖丹（tier 对应敌人档位；战斗掉落时按档位取池）
const cores = [
  { id: 'beast_core', name: '妖兽核', description: '普通妖兽内丹，通用催化', quality: 'common', baseValue: 20, tier: 'normal' },
  { id: 'elite_core', name: '精英核', description: '精英妖兽内核，中阶丹辅料', quality: 'uncommon', baseValue: 45, tier: 'elite' },
  { id: 'demon_king_core', name: '妖王丹', description: '妖王修为凝丹，高阶丹辅料', quality: 'rare', baseValue: 90, tier: 'boss' }
]

// 人物作为BOSS时掉落的内丹碎片（至宝类，每个角色一种）
// 星级 → 品质与定价：3星=rare/200，4星=epic/500，5星=legendary/1000
const characterInnerPills = [
  { id: 'inner_pill_char_001', name: '苏浅雪的内丹碎片', description: '作为苏浅雪形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_002', name: '林清瑶的内丹碎片', description: '作为林清瑶形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_003', name: '炎红袖的内丹碎片', description: '作为炎红袖形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_004', name: '冷月的内丹碎片', description: '作为冷月形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_005', name: '惊鸿的内丹碎片', description: '作为惊鸿形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_006', name: '蛇姬的内丹碎片', description: '作为蛇姬形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_007', name: '熊娇娇的内丹碎片', description: '作为熊娇娇形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_008', name: '夜鸢的内丹碎片', description: '作为夜鸢形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_009', name: '云隐的内丹碎片', description: '作为云隐形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_010', name: '影杀的内丹碎片', description: '作为影杀形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_011', name: '铁扇娘的内丹碎片', description: '作为铁扇娘形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_012', name: '飞絮的内丹碎片', description: '作为飞絮形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_013', name: '血罗刹的内丹碎片', description: '作为血罗刹形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_014', name: '逆鳞的内丹碎片', description: '作为逆鳞形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_015', name: '连珠的内丹碎片', description: '作为连珠形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_016', name: '幻雾的内丹碎片', description: '作为幻雾形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_017', name: '裂魂的内丹碎片', description: '作为裂魂形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_018', name: '磐石的内丹碎片', description: '作为磐石形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_019', name: '焚天的内丹碎片', description: '作为焚天形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_020', name: '回春的内丹碎片', description: '作为回春形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'rare', baseValue: 200 },
  { id: 'inner_pill_char_021', name: '凌霜剑姬的内丹碎片', description: '作为凌霜剑姬形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_022', name: '玄玑仙子的内丹碎片', description: '作为玄玑仙子形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_023', name: '赤焰灵尊的内丹碎片', description: '作为赤焰灵尊形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_024', name: '寒渊仙子的内丹碎片', description: '作为寒渊仙子形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_025', name: '紫电圣母的内丹碎片', description: '作为紫电圣母形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_026', name: '百毒仙姑的内丹碎片', description: '作为百毒仙姑形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_027', name: '驭兽天女的内丹碎片', description: '作为驭兽天女形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_028', name: '九幽鬼母的内丹碎片', description: '作为九幽鬼母形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_029', name: '净世光使的内丹碎片', description: '作为净世光使形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_030', name: '噬影魔女的内丹碎片', description: '作为噬影魔女形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_031', name: '九天玄女的内丹碎片', description: '作为九天玄女形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_032', name: '风无形的内丹碎片', description: '作为风无形形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_033', name: '血魔女的内丹碎片', description: '作为血魔女形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_034', name: '镜花影的内丹碎片', description: '作为镜花影形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_035', name: '千手修罗的内丹碎片', description: '作为千手修罗形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_036', name: '摄魂音的内丹碎片', description: '作为摄魂音形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_037', name: '天怒的内丹碎片', description: '作为天怒形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_038', name: '不灭金身的内丹碎片', description: '作为不灭金身形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_039', name: '杀生佛的内丹碎片', description: '作为杀生佛形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_040', name: '慈航道人的内丹碎片', description: '作为慈航道人形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'epic', baseValue: 500 },
  { id: 'inner_pill_char_041', name: '太虚剑帝的内丹碎片', description: '作为太虚剑帝形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'legendary', baseValue: 1000 },
  { id: 'inner_pill_char_042', name: '混元道母的内丹碎片', description: '作为混元道母形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'legendary', baseValue: 1000 },
  { id: 'inner_pill_char_043', name: '九阳炎皇的内丹碎片', description: '作为九阳炎皇形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'legendary', baseValue: 1000 },
  { id: 'inner_pill_char_044', name: '万古冰皇的内丹碎片', description: '作为万古冰皇形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'legendary', baseValue: 1000 },
  { id: 'inner_pill_char_045', name: '紫霄雷母的内丹碎片', description: '作为紫霄雷母形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'legendary', baseValue: 1000 },
  { id: 'inner_pill_char_046', name: '天毒圣母的内丹碎片', description: '作为天毒圣母形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'legendary', baseValue: 1000 },
  { id: 'inner_pill_char_047', name: '光明佛母的内丹碎片', description: '作为光明佛母形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'legendary', baseValue: 1000 },
  { id: 'inner_pill_char_048', name: '洪荒兽神的内丹碎片', description: '作为洪荒兽神形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'legendary', baseValue: 1000 },
  { id: 'inner_pill_char_049', name: '十殿阎罗的内丹碎片', description: '作为十殿阎罗形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'legendary', baseValue: 1000 },
  { id: 'inner_pill_char_050', name: '永夜天尊的内丹碎片', description: '作为永夜天尊形态BOSS时掉落的至宝素材，蕴含其修行精髓。后续可炼化用于专属至宝。', quality: 'legendary', baseValue: 1000 }
]

// 至宝（Boss / 奇遇专属）
const specials = [
  { id: 'calm_spirit_pearl', name: '定灵珠', description: '凝定神魂之珠，定灵丹必需要件', quality: 'rare', baseValue: 120 },
  { id: 'heaven_fragment', name: '天玄碎片', description: '天降玄石碎片，蕴含造化之力，天培元丹核心材料', quality: 'epic', baseValue: 500 },
  ...characterInnerPills
]

// 将 BOSS_MATERIALS 扁平化并纳入 allMaterials，使炼丹界面能正确查询到中文名
const bossMaterialList = Object.values(BOSS_MATERIALS).flat().map(m => ({
  id: m.id,
  name: m.name,
  description: m.description,
  kind: 'boss_material',
  quality: 'rare',
  baseValue: 100
}))

const allMaterials = [
  ...herbs.map(h => ({ ...h, kind: 'herb', quality: h.quality || 'common' })),
  ...ores.map(o => ({ ...o, kind: 'ore' })),
  ...liquids.map(l => ({ ...l, kind: 'liquid' })),
  ...cores.map(c => ({ ...c, kind: 'core' })),
  ...specials.map(s => ({ ...s, kind: 'special' })),
  ...bossMaterialList
]

export const oreList = ores
export const liquidList = liquids
export const coreList = cores
export const specialList = specials
export const characterInnerPillList = characterInnerPills

// 标准化素材对象：统一携带 kind / source 字段
const makeMaterial = (base, kind, source) => ({
  id: base.id,
  name: base.name,
  kind,
  quality: base.quality,
  description: base.description,
  baseValue: base.baseValue,
  source
})

// 按权重抽取
const weightedPick = (pool, weightKey = 'chance') => {
  if (!pool || pool.length === 0) return null
  const total = pool.reduce((s, m) => s + (m[weightKey] || 0), 0)
  let rand = Math.random() * total
  for (const m of pool) {
    rand -= (m[weightKey] || 0)
    if (rand <= 0) return m
  }
  return pool[pool.length - 1]
}

// 灵草：高难秘境(>=5)有概率直接出稀有灵草（悟道叶/渡厄莲）
export const getRandomHerb = (zone) => {
  const diff = zone?.difficulty || 1
  if (diff >= 5 && Math.random() < 0.25) {
    const rareHerbs = herbs.filter(h => h.id === 'enlightenment_leaf' || h.id === 'tribulation_lotus')
    if (rareHerbs.length > 0) {
      const h = rareHerbs[Math.floor(Math.random() * rareHerbs.length)]
      const q = h.quality || 'rare'
      return { ...h, quality: q, value: getHerbValue(h, q), kind: 'herb', source: 'explore' }
    }
  }
  const h = getRandomHerbBase()
  return { ...h, quality: h.quality || 'common', kind: 'herb', source: 'explore' }
}

// 矿料：按秘境难度过滤后可出（雷劫石/道蕴石仅高难秘境）
export const getRandomOre = (zone) => {
  const diff = zone?.difficulty || 1
  const pool = ores.filter(o => diff >= o.zoneMin)
  const o = weightedPick(pool)
  return o ? makeMaterial(o, 'ore', 'mine') : null
}

// 灵液：按秘境难度过滤
export const getRandomLiquid = (zone) => {
  const diff = zone?.difficulty || 1
  const pool = liquids.filter(l => diff >= l.zoneMin)
  const l = weightedPick(pool)
  return l ? makeMaterial(l, 'liquid', 'explore') : null
}

// 妖丹：按敌人档位取池
// tier: 'normal' | 'elite' | 'boss'
export const getRandomCore = (tier = 'normal') => {
  let pool
  if (tier === 'boss') pool = [cores[2]]
  else if (tier === 'elite') pool = [cores[1], cores[0]]
  else pool = [cores[0]]
  const c = pool[Math.floor(Math.random() * pool.length)]
  return makeMaterial(c, 'core', 'drop')
}

// 至宝：默认按权重抽取（定灵珠 70% / 天玄碎片 30%）
// zone 可选：若传入 zone 且 difficulty < 7（非仙墟/混沌界），天玄碎片不会出现
// —— 天培元丹的「天玄碎片」只能从最后两张高难度图获得
export const getRandomSpecial = (zone = null) => {
  const allowHeavenFragment = !zone || (zone.difficulty || 0) >= 7
  const pool = allowHeavenFragment
    ? [
        { ...specials[0], weight: 7 },
        { ...specials[1], weight: 3 }
      ]
    : [{ ...specials[0], weight: 1 }]
  const total = pool.reduce((s, m) => s + (m.weight || 1), 0)
  let rand = Math.random() * total
  for (const m of pool) {
    rand -= (m.weight || 1)
    if (rand <= 0) return makeMaterial(m, 'special', 'boss')
  }
  return makeMaterial(pool[0], 'special', 'boss')
}

// 秘境→定向素材池：击杀该秘境 BOSS 时按权重掉落对应丹药所需素材
// 解决"洗髓花等关键主料从未获取"的问题——每个秘境 BOSS 都必掉该秘境丹药所需素材
// 配合 pillZoneMapping 使用：玩家通关某秘境即可定向获取该秘境丹药素材
export const zoneMaterialPool = {
  forest_edge: [
    { kind: 'herb', id: 'wash_marrow_herb', weight: 3 },
    { kind: 'herb', id: 'flesh_growth_herb', weight: 3 },
    { kind: 'herb', id: 'spirit_grass', weight: 2 },
    { kind: 'ore', id: 'iron_essence', weight: 2 }
  ],
  misty_valley: [
    { kind: 'herb', id: 'forge_bone_wood', weight: 3 },
    { kind: 'herb', id: 'disaster_ward_flower', weight: 3 },
    { kind: 'herb', id: 'enlightenment_leaf', weight: 2 },
    { kind: 'ore', id: 'dark_iron_marrow', weight: 2 },
    { kind: 'liquid', id: 'ward_evil_dew', weight: 2 }
  ],
  phoenix_cave: [
    { kind: 'herb', id: 'treasure_scent_herb', weight: 3 },
    { kind: 'herb', id: 'calm_mind_herb', weight: 3 },
    { kind: 'herb', id: 'nine_leaf_lingzhi', weight: 2 },
    { kind: 'ore', id: 'spirit_quench_sand', weight: 2 },
    { kind: 'liquid', id: 'spirit_spring_water', weight: 2 },
    { kind: 'liquid', id: 'jade_marrow_liquid', weight: 1 }
  ],
  dragon_abyss: [
    { kind: 'herb', id: 'fire_heart_flower', weight: 3 },
    { kind: 'herb', id: 'tribulation_lotus', weight: 2 },
    { kind: 'herb', id: 'immortal_jade_grass', weight: 2 },
    { kind: 'ore', id: 'tribulation_thunder_stone', weight: 2 },
    { kind: 'core', id: 'demon_king_core', weight: 2 }
  ],
  ghost_wasteland: [
    { kind: 'herb', id: 'five_elements_grass', weight: 3 },
    { kind: 'herb', id: 'sun_essence_flower', weight: 2 },
    { kind: 'herb', id: 'celestial_dew_grass', weight: 2 },
    { kind: 'core', id: 'demon_king_core', weight: 3 },
    { kind: 'special', id: 'heaven_fragment', weight: 1 }
  ],
  ice_palace: [
    { kind: 'herb', id: 'moonlight_orchid', weight: 3 },
    { kind: 'herb', id: 'celestial_dew_grass', weight: 3 },
    { kind: 'liquid', id: 'jade_marrow_liquid', weight: 2 }
  ],
  immortal_ruins: [
    { kind: 'herb', id: 'sun_essence_flower', weight: 3 },
    { kind: 'herb', id: 'moonlight_orchid', weight: 3 },
    { kind: 'ore', id: 'dao_essence_stone', weight: 2 },
    { kind: 'special', id: 'calm_spirit_pearl', weight: 2 }
  ],
  chaos_realm: [
    { kind: 'herb', id: 'phoenix_feather_herb', weight: 3 },
    { kind: 'herb', id: 'celestial_dew_grass', weight: 3 },
    { kind: 'special', id: 'heaven_fragment', weight: 3 },
    { kind: 'core', id: 'demon_king_core', weight: 3 }
  ]
}

// 按秘境素材池抽取一个素材（BOSS 击杀时使用）
export const getRandomZoneMaterial = (zoneId) => {
  const pool = zoneMaterialPool[zoneId]
  if (!pool || pool.length === 0) return null
  const total = pool.reduce((s, m) => s + (m.weight || 1), 0)
  let rand = Math.random() * total
  for (const m of pool) {
    rand -= (m.weight || 1)
    if (rand <= 0) {
      const kind = m.kind
      const id = m.id
      // 从对应类型清单中查找素材定义
      let base = null
      if (kind === 'herb') base = herbs.find(h => h.id === id)
      else if (kind === 'ore') base = ores.find(o => o.id === id)
      else if (kind === 'liquid') base = liquids.find(l => l.id === id)
      else if (kind === 'core') base = cores.find(c => c.id === id)
      else if (kind === 'special') base = specials.find(s => s.id === id)
      if (!base) return null
      return makeMaterial(base, kind, 'boss_zone')
    }
  }
  return null
}

export { allMaterials }
