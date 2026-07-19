// 素材系统：灵草(herb) / 矿料(ore) / 灵液(liquid) / 妖丹(core) / 至宝(special)
// 灵草数据迁自 herbs.js，其余四类为本模块新增。
import { herbs, herbQualities, getRandomHerb as getRandomHerbBase, getHerbValue } from './herbs'

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

// 至宝（Boss / 奇遇专属）
const specials = [
  { id: 'calm_spirit_pearl', name: '定灵珠', description: '凝定神魂之珠，定灵丹必需要件', quality: 'rare', baseValue: 120 },
  { id: 'heaven_fragment', name: '天玄碎片', description: '天降玄石碎片，蕴含造化之力，天培元丹核心材料', quality: 'epic', baseValue: 500 }
]

const allMaterials = [
  ...herbs.map(h => ({ ...h, kind: 'herb', quality: h.quality || 'common' })),
  ...ores.map(o => ({ ...o, kind: 'ore' })),
  ...liquids.map(l => ({ ...l, kind: 'liquid' })),
  ...cores.map(c => ({ ...c, kind: 'core' })),
  ...specials.map(s => ({ ...s, kind: 'special' }))
]

export const oreList = ores
export const liquidList = liquids
export const coreList = cores
export const specialList = specials

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
