// 素材系统：灵草(herb) / 矿料(ore) / 灵液(liquid) / 妖丹(core) / 至宝(special)
// 灵草数据迁自 herbs.js，其余四类为本模块新增。
import { herbs, herbQualities, getRandomHerb as getRandomHerbBase, getHerbValue } from './herbs'

export const MATERIAL_KINDS = {
  herb: { name: '灵草', color: '#44aa44' },
  ore: { name: '矿料', color: '#b08d57' },
  liquid: { name: '灵液', color: '#3aa0c0' },
  core: { name: '妖丹', color: '#c0392b' },
  special: { name: '至宝', color: '#FFD700' }
}

// 矿料（zoneMin: 该秘境最低难度才可能出现；chance: 相对权重）
const ores = [
  { id: 'iron_essence', name: '铁精', description: '蕴含微弱铁煞之气的矿石，炼体丹药常用辅材', quality: 'common', baseValue: 12, zoneMin: 1, chance: 0.35 },
  { id: 'prospect_sand', name: '探矿砂', description: '可感应矿脉走向的细砂，寻宝丹主料', quality: 'common', baseValue: 14, zoneMin: 1, chance: 0.3 },
  { id: 'dark_iron_marrow', name: '玄铁髓', description: '玄铁精髓，锻骨丹核心辅材', quality: 'uncommon', baseValue: 28, zoneMin: 2, chance: 0.2 },
  { id: 'spirit_quench_sand', name: '淬灵砂', description: '淬炼灵气的神砂，强化丹主料', quality: 'uncommon', baseValue: 30, zoneMin: 2, chance: 0.18 },
  { id: 'tribulation_thunder_stone', name: '雷劫石', description: '雷劫淬炼之石，渡厄丹必需要件', quality: 'rare', baseValue: 60, zoneMin: 5, chance: 0.5 },
  { id: 'dao_essence_stone', name: '道蕴石', description: '蕴含大道纹路的奇石，悟道丹辅料', quality: 'rare', baseValue: 65, zoneMin: 5, chance: 0.4 }
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

// 至宝：当前仅定灵珠；可扩展为随机至宝
export const getRandomSpecial = () => makeMaterial(specials[0], 'special', 'boss')

export { allMaterials }
