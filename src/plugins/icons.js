// 素材/装备图标统一管理
// 所有图标已压缩到 96x96（3-7KB），通过 import 引入让 Vite 自动内联为 base64 data URI
// 修复「素材图标加载延迟非常大」的问题：内联后图标随 JS bundle 一次性加载，0 网络请求
//
// 用法：import { getIconUrl } from '../plugins/icons'
//       getIconUrl('reward_mat_herb.png')  // 返回 base64 data URI 或带 hash 的 URL

// import.meta.glob 批量导入 src/assets/icons/ 下所有 PNG（eager 同步加载，as: 'url' 获取 URL）
// Vite 会根据 assetsInlineLimit 自动决定内联为 base64 还是输出为独立文件
const iconModules = import.meta.glob('../assets/icons/*.png', { eager: true, as: 'url' })

// 构建文件名 -> URL 的映射表
const ICON_URLS = {}
for (const path in iconModules) {
  // path 形如 '../assets/icons/reward_mat_herb.png'，提取文件名
  const fileName = path.split('/').pop()
  ICON_URLS[fileName] = iconModules[path]
}

/**
 * 根据文件名获取图标 URL
 * @param {string} fileName - 图标文件名，如 'reward_mat_herb.png'
 * @returns {string} base64 data URI 或带 hash 的 URL（未找到时返回空字符串）
 */
export function getIconUrl(fileName) {
  return ICON_URLS[fileName] || ''
}

/**
 * 素材图标映射（按 kind 分类）
 * 替代原 useIdleSystem.js 中的 MATERIAL_DISPLAY 硬编码
 */
export const MATERIAL_ICON_MAP = {
  herb: getIconUrl('reward_mat_herb.png'),
  ore: getIconUrl('reward_mat_ore.png'),
  liquid: getIconUrl('reward_mat_liquid.png'),
  core: getIconUrl('reward_mat_core.png'),
  special: getIconUrl('reward_mat_core.png'),
  pet_fragment: getIconUrl('reward_mat_pet_fragment.png'),
  phantom_crystal: getIconUrl('reward_mat_phantom_crystal.png'),
  boss_material: getIconUrl('reward_mat_core.png'),
  boss_ticket: getIconUrl('reward_mat_core.png')
}

/**
 * 奖励类型 -> 图标 URL 映射
 * 替代原 useIdleSystem.js 中的 REWARD_ICON_MAP 硬编码
 */
export const REWARD_ICON_MAP = {
  head: getIconUrl('reward_eq_head.png'),
  body: getIconUrl('reward_eq_body.png'),
  legs: getIconUrl('reward_eq_legs.png'),
  feet: getIconUrl('reward_eq_feet.png'),
  shoulder: getIconUrl('reward_eq_shoulder.png'),
  hands: getIconUrl('reward_eq_wrist.png'),
  wrist: getIconUrl('reward_eq_wrist.png'),
  necklace: getIconUrl('reward_eq_necklace.png'),
  ring1: getIconUrl('reward_eq_ring.png'),
  ring2: getIconUrl('reward_eq_ring.png'),
  belt: getIconUrl('reward_eq_belt.png'),
  artifact: getIconUrl('reward_eq_artifact.png'),
  equipment: getIconUrl('reward_eq_default.png'),
  pet: getIconUrl('reward_pet.png'),
  herb: getIconUrl('reward_mat_herb.png'),
  ore: getIconUrl('reward_mat_ore.png'),
  liquid: getIconUrl('reward_mat_liquid.png'),
  core: getIconUrl('reward_mat_core.png'),
  pet_fragment: getIconUrl('reward_mat_pet_fragment.png'),
  phantom_crystal: getIconUrl('reward_mat_phantom_crystal.png'),
  monster: getIconUrl('reward_monster.png'),
  spirit_stone: getIconUrl('reward_eq_default.png'),
  cultivation: getIconUrl('reward_eq_default.png'),
  fortune: getIconUrl('reward_eq_default.png')
}
