// 怪物头像与立绘系统
// 与人物系统相同的架构：public/monsters/ 目录存放资源，manifest.json 管理映射
// 注意：manifest 数据已内联到 JS bundle（import monsterManifestData），不依赖网络 fetch
// 修复「GitHub Pages 网络慢导致 manifest fetch 失败，怪物头像/立绘永远显示 emoji」的 bug

import { ref } from 'vue'
// 直接 import JSON：Vite 会把 manifest 打包进 JS bundle，加载时同步可用，永不失败
// 之前用 fetch 加载 manifest.json，网络慢时 fetch 失败会 catch 为 {} 且永不重试
import monsterManifestData from '../data/monster-manifest.json'

// 使用 BASE_URL（与角色立绘一致），保证 GitHub Pages 子路径部署也能正确解析
const MONSTER_ASSETS_BASE = (import.meta.env.BASE_URL || './') + 'monsters/'

// 怪物名称到资源文件名的安全映射（去除特殊字符）
function safeFileName(name) {
  return name.replace(/[\/\\:*?"<>|]/g, '_')
}

// 怪物资源信息（响应式 ref：内联数据初始化，无需异步加载）
// 保留 monsterManifestVersion 用于兼容旧代码（BattleStage.vue 中的 computed 依赖它）
// 虽然不再需要递增触发更新（数据已同步可用），但保留 ref 避免破坏现有依赖
export const monsterManifest = ref(monsterManifestData || {})
export const monsterManifestVersion = ref(1)

// 兼容函数：数据已加载，直接返回（保留函数签名以兼容旧调用）
async function loadMonsterManifest() {
  return monsterManifest.value
}

// 获取怪物头像 URL
export async function getMonsterAvatar(monsterName, size = 'thumbnail') {
  const manifest = await loadMonsterManifest()
  const key = safeFileName(monsterName)
  const entry = manifest[key]
  if (entry && entry[size]) {
    return `${MONSTER_ASSETS_BASE}${entry[size]}`
  }
  // 回退：使用怪物 emoji
  return getMonsterEmoji(monsterName)
}

// 获取怪物立绘 URL（完整尺寸）
export async function getMonsterPortrait(monsterName) {
  const manifest = await loadMonsterManifest()
  const key = safeFileName(monsterName)
  const entry = manifest[key]
  if (entry && entry.full) {
    return `${MONSTER_ASSETS_BASE}${entry.full}`
  }
  return getMonsterAvatar(monsterName, 'thumbnail')
}

// 同步版本：获取怪物头像（基于响应式 manifest）
// 调用方应在 computed 中访问，并显式读取 monsterManifestVersion.value 以建立响应式依赖
// 这样 manifest 异步加载完后，所有依赖此函数的视图会自动刷新
export function getMonsterAvatarSync(monsterName, size = 'thumbnail') {
  // 显式访问 version ref，建立响应式依赖（在 computed 中调用时生效）
  // eslint-disable-next-line no-unused-expressions
  monsterManifestVersion.value
  // manifest 尚未就绪时触发预取（fire-and-forget），下一次响应式更新会拿到真实立绘
  if (!monsterManifest.value || !Object.keys(monsterManifest.value).length) {
    loadMonsterManifest()
    return getMonsterEmoji(monsterName)
  }
  const key = safeFileName(monsterName)
  const entry = monsterManifest.value[key]
  if (entry && entry[size]) {
    return `${MONSTER_ASSETS_BASE}${entry[size]}`
  }
  return getMonsterEmoji(monsterName)
}

// 获取怪物 emoji（回退方案）
export function getMonsterEmoji(monsterName) {
  const emojiMap = {
    // 青萝林
    '野猪精': '🐗',
    '山匪': '🏴‍☠️',
    '野狼': '🐺',
    '狼王': '🐺',
    '山匪头目': '👹',
    // 迷雾谷
    '猛虎': '🐯',
    '骷髅兵': '💀',
    '毒蛇': '🐍',
    '迷雾虎王': '🐅',
    '骷髅将军': '☠️',
    // 凤凰窟
    '妖狼': '🐺',
    '焰魔': '🔥',
    '焰魔领主': '🔥',
    '火凤凰': '🦅',
    // 龙渊
    '僵尸王': '🧟',
    '血魔': '🩸',
    '深渊蛟龙': '🐉',
    '血魔大帝': '👑',
    // 鬼荒原
    '噬魂鬼': '👻',
    '噬魂鬼王': '👻',
    '白骨魔尊': '💀',
    // 冰雪宫
    '远古妖龙': '🐲',
    '冰凰': '🧊',
    '冰封古魔': '❄️',
    // 仙墟
    '仙墟守护者': '🛡️',
    '堕落仙君': '🌑',
    // 混沌界
    '混沌主宰': '⚫',
    '天道化身': '☯️'
  }
  return emojiMap[monsterName] || '👾'
}

// 怪物立绘提示词生成器
export function getMonsterPortraitPrompt(monsterName, monsterTier = 'common') {
  const prompts = MONSTER_PORTRAIT_PROMPTS[monsterName]
  if (!prompts) {
    return `Chinese fantasy game monster portrait, ${monsterName}, detailed fantasy art style, high quality, 4k`
  }
  return prompts.portrait || prompts.thumbnail || prompts
}

// 全怪物立绘提示词库
export const MONSTER_PORTRAIT_PROMPTS = {
  // 青萝林
  '野猪精': {
    thumbnail: 'A fierce boar spirit with glowing red eyes and razor-sharp tusks, covered in dark bristles, Chinese fantasy game monster, chibi style avatar icon, cute but menacing, clean background, 512x512',
    portrait: 'A massive boar spirit monster standing in a bamboo forest, dark bristles with crimson tips, glowing red eyes, razor-sharp ivory tusks covered in runes, mist swirling around its hooves, Chinese fantasy art style, dramatic lighting, highly detailed, 4k quality, full body portrait, dark green and brown color palette'
  },
  '山匪': {
    thumbnail: 'A rugged bandit with a scarred face, wearing tattered leather armor and holding a crude sword, Chinese fantasy game monster, chibi style avatar icon, menacing expression, clean background, 512x512',
    portrait: 'A fearsome mountain bandit leader standing on a rocky cliff, scarred face with an eyepatch, tattered leather armor with bone ornaments, crude iron sword dripping with rust, wild unkempt hair blowing in the wind, Chinese fantasy art style, dramatic sunset lighting, highly detailed, 4k quality, full body portrait, earthy brown and rust color palette'
  },
  '野狼': {
    thumbnail: 'A lean grey wolf with piercing yellow eyes, bared fangs, and a wild mane, Chinese fantasy game monster, chibi style avatar icon, aggressive stance, clean background, 512x512',
    portrait: 'A massive dire wolf crouching in tall grass under moonlight, sleek grey fur with silver highlights, piercing golden eyes, bared fangs glistening with saliva, wild mane bristling, Chinese fantasy art style, moonlit night atmosphere, highly detailed, 4k quality, full body portrait, silver and dark grey color palette'
  },
  '狼王': {
    thumbnail: 'An alpha wolf king with a silver mane, wearing bone ornaments, piercing blue eyes, Chinese fantasy game boss, chibi style avatar icon, regal and fierce, clean background, 512x512',
    portrait: 'A majestic alpha wolf king standing atop a rocky outcrop overlooking a forest, silver-white mane flowing like silk, bone crown and necklace ornaments, piercing ice-blue eyes glowing with intelligence, larger and more muscular than normal wolves, Chinese fantasy art style, moonlight and fog atmosphere, highly detailed, 4k quality, full body portrait, silver and midnight blue color palette'
  },
  '山匪头目': {
    thumbnail: 'A burly bandit chieftain with a massive battle axe, wearing iron armor and a horned helmet, Chinese fantasy game boss, chibi style avatar icon, intimidating presence, clean background, 512x512',
    portrait: 'A towering bandit chieftain standing in a looted village, massive muscular build, crude iron armor with stolen jewelry, horned helmet made from a demon skull, giant battle axe with bloodstains, cruel grin showing gold teeth, Chinese fantasy art style, fire and smoke atmosphere, highly detailed, 4k quality, full body portrait, dark iron and fire orange color palette'
  },
  // 迷雾谷
  '猛虎': {
    thumbnail: 'A fierce tiger with orange and black stripes, glowing amber eyes, bared claws, Chinese fantasy game monster, chibi style avatar icon, predatory stance, clean background, 512x512',
    portrait: 'A massive spirit tiger prowling through misty mountain valley, vibrant orange fur with black lightning-shaped stripes, glowing amber eyes, extended claws shimmering with energy, mist swirling around its paws, Chinese fantasy art style, mysterious fog atmosphere, highly detailed, 4k quality, full body portrait, orange and misty grey color palette'
  },
  '骷髅兵': {
    thumbnail: 'A skeletal warrior with empty eye sockets, holding a rusted sword and broken shield, Chinese fantasy game monster, chibi style avatar icon, eerie glow, clean background, 512x512',
    portrait: 'An undead skeletal warrior standing in a graveyard, bleached bones with green necrotic energy glowing in its eye sockets, rusted sword and cracked shield, tattered remains of ancient armor, eerie green mist emanating from its joints, Chinese fantasy art style, dark moonlit night, highly detailed, 4k quality, full body portrait, bone white and sickly green color palette'
  },
  '毒蛇': {
    thumbnail: 'A venomous snake with emerald green scales, red eyes, and fangs dripping poison, Chinese fantasy game monster, chibi style avatar icon, coiled and ready to strike, clean background, 512x512',
    portrait: 'A giant venomous serpent coiled around ancient temple ruins, shimmering emerald green scales with gold patterns, glowing crimson eyes, fangs dripping glowing purple venom, hood expanded with mystical markings, Chinese fantasy art style, ancient temple atmosphere, highly detailed, 4k quality, full body portrait, emerald and venom purple color palette'
  },
  '迷雾虎王': {
    thumbnail: 'A massive tiger king with white fur and blue stripes, wearing misty aura, Chinese fantasy game boss, chibi style avatar icon, majestic and deadly, clean background, 512x512',
    portrait: 'A colossal tiger king emerging from thick mountain mist, pure white fur with ethereal blue stripes that glow like lightning, crown of condensed fog hovering above its head, eyes like twin blue stars, each step creates swirling mist, Chinese fantasy art style, mystical mountain atmosphere, highly detailed, 4k quality, full body portrait, white and ethereal blue color palette'
  },
  '骷髅将军': {
    thumbnail: 'An undead skeletal general in ornate armor, wielding a giant halberd, Chinese fantasy game boss, chibi style avatar icon, commanding presence, clean background, 512x512',
    portrait: 'An undead skeletal general commanding an army of spirits, ornate dark gold armor fused to its bones, giant halberd crackling with dark energy, tattered war banner on its back, green fire burning in its eye sockets, Chinese fantasy art style, battlefield of bones atmosphere, highly detailed, 4k quality, full body portrait, dark gold and necrotic green color palette'
  },
  // 凤凰窟
  '妖狼': {
    thumbnail: 'A demonic wolf with black fur and red markings, flaming eyes, Chinese fantasy game monster, chibi style avatar icon, sinister aura, clean background, 512x512',
    portrait: 'A demonic wolf with pitch-black fur and glowing crimson tribal markings, eyes burning like embers, fangs dripping with dark energy, shadowy aura swirling around its body, Chinese fantasy art style, volcanic cave atmosphere, highly detailed, 4k quality, full body portrait, black and crimson red color palette'
  },
  '焰魔': {
    thumbnail: 'A fire demon with magma-like skin, horns, and flaming hands, Chinese fantasy game monster, chibi style avatar icon, burning aura, clean background, 512x512',
    portrait: 'A fire demon humanoid with cracked magma-like skin showing glowing lava beneath, curved obsidian horns, hands wreathed in constant flames, eyes like pools of molten gold, volcanic rock armor, Chinese fantasy art style, lava cave atmosphere, highly detailed, 4k quality, full body portrait, magma orange and obsidian black color palette'
  },
  '焰魔领主': {
    thumbnail: 'A fire demon lord with crown of flames, massive wings, and a flaming sword, Chinese fantasy game boss, chibi style avatar icon, overwhelming power, clean background, 512x512',
    portrait: 'A towering fire demon lord sitting on a throne of molten rock, crown of white-hot flames, massive bat-like wings of fire, flaming greatsword embedded in the ground, skin like cooled magma with rivers of lava, eyes burning with ancient fury, Chinese fantasy art style, volcanic throne room atmosphere, highly detailed, 4k quality, full body portrait, white fire and dark magma color palette'
  },
  '火凤凰': {
    thumbnail: 'A majestic phoenix with flaming feathers, golden eyes, and a long tail of fire, Chinese fantasy game boss, chibi style avatar icon, divine and fierce, clean background, 512x512',
    portrait: 'A divine fire phoenix soaring through clouds of flame, feathers of living fire in shades of gold, orange and crimson, golden eyes like twin suns, long flowing tail leaving trails of sacred flames, wingspan casting shadows of light, Chinese fantasy art style, sky of fire atmosphere, highly detailed, 4k quality, full body portrait, gold and sacred flame color palette'
  },
  // 龙渊
  '僵尸王': {
    thumbnail: 'A zombie king with decaying royal robes, glowing green eyes, and clawed hands, Chinese fantasy game monster, chibi style avatar icon, rotting royalty, clean background, 512x512',
    portrait: 'An ancient zombie king rising from a jade coffin, decaying imperial robes with golden embroidery, glowing toxic green eyes, elongated black claws, crown askew on half-rotted head, toxic miasma swirling around its feet, Chinese fantasy art style, dark tomb atmosphere, highly detailed, 4k quality, full body portrait, decayed gold and toxic green color palette'
  },
  '血魔': {
    thumbnail: 'A blood demon with crimson skin, blood-red eyes, and blood-dripping claws, Chinese fantasy game monster, chibi style avatar icon, vampiric horror, clean background, 512x512',
    portrait: 'A blood demon humanoid with deep crimson skin glistening with fresh blood, blood-red eyes with slit pupils, claws constantly dripping blood that forms runes on the ground, muscular build with veins glowing like magma, Chinese fantasy art style, blood moon atmosphere, highly detailed, 4k quality, full body portrait, crimson and blood red color palette'
  },
  '深渊蛟龙': {
    thumbnail: 'A deep sea dragon with dark blue scales, bioluminescent patterns, and sharp fins, Chinese fantasy game monster/boss, chibi style avatar icon, ancient sea terror, clean background, 512x512',
    portrait: 'An ancient deep sea flood dragon emerging from dark abyssal waters, dark blue scales with bioluminescent cyan patterns, multiple sharp fins along its serpentine body, eyes like glowing pearls in the dark, water swirling with magical energy around its horns, Chinese fantasy art style, deep ocean abyss atmosphere, highly detailed, 4k quality, full body portrait, abyssal blue and bioluminescent cyan color palette'
  },
  '血魔大帝': {
    thumbnail: 'A blood demon emperor with crimson armor, blood crown, and a blood-formed scepter, Chinese fantasy game boss, chibi style avatar icon, overwhelming dread, clean background, 512x512',
    portrait: 'A blood demon emperor seated on a throne of crystallized blood, ornate crimson armor made from solidified blood, crown of floating blood droplets, scepter formed from compressed blood energy, eyes that see through souls, blood rivers flowing around the throne, Chinese fantasy art style, blood palace atmosphere, highly detailed, 4k quality, full body portrait, deep crimson and dark ruby color palette'
  },
  // 鬼荒原
  '噬魂鬼': {
    thumbnail: 'A soul-eating ghost with a ghastly face, ethereal body, and glowing eyes, Chinese fantasy game monster, chibi style avatar icon, terrifying spirit, clean background, 512x512',
    portrait: 'A soul-eating ghost floating above a battlefield of fallen warriors, ghastly translucent body with tortured faces visible within, elongated clawed fingers reaching out, eyes like twin violet flames, ethereal chains binding its form, Chinese fantasy art style, ghostly battlefield atmosphere, highly detailed, 4k quality, full body portrait, ethereal purple and ghostly white color palette'
  },
  '噬魂鬼王': {
    thumbnail: 'A soul-eating ghost king with a crown of souls, massive ethereal wings, and a scythe, Chinese fantasy game boss, chibi style avatar icon, supreme terror, clean background, 512x512',
    portrait: 'A soul-eating ghost king towering over a sea of spirits, crown made from trapped souls screaming silently, massive ethereal wings of shadow and mist, giant scythe that harvests souls with each swing, body constantly shifting between solid and ethereal, Chinese fantasy art style, underworld atmosphere, highly detailed, 4k quality, full body portrait, soul purple and shadow black color palette'
  },
  '白骨魔尊': {
    thumbnail: 'A bone demon lord made of white bones, with red soul fire in its eyes, Chinese fantasy game boss, chibi style avatar icon, skeletal supremacy, clean background, 512x512',
    portrait: 'A bone demon lord constructed from the bones of ancient dragons and demons, ivory-white bone structure with red soul fire burning in its eye sockets and ribcage, bone wings spanning wide, bone staff topped with a skull gem, Chinese fantasy art style, bone desert atmosphere, highly detailed, 4k quality, full body portrait, ivory white and soul fire red color palette'
  },
  // 冰雪宫
  '冰凰': {
    thumbnail: 'An ice phoenix with crystalline feathers, blue eyes, and frost aura, Chinese fantasy game boss, chibi style avatar icon, frozen majesty, clean background, 512x512',
    portrait: 'A magnificent ice phoenix perched on a frozen mountain peak, feathers made of crystal ice shards in shades of blue and white, eyes like frozen sapphires, wings spread showing intricate frost patterns, frost aura freezing the air around it, Chinese fantasy art style, frozen mountain atmosphere, highly detailed, 4k quality, full body portrait, crystal blue and frost white color palette'
  },
  '冰封古魔': {
    thumbnail: 'An ancient ice demon frozen in ice armor, with glowing blue eyes, Chinese fantasy game boss, chibi style avatar icon, primordial cold, clean background, 512x512',
    portrait: 'An ancient ice demon sealed in layers of eternal ice, ice armor growing like crystals from its skin, glowing blue eyes visible through ice mask, frost spreading from each step, ancient runes frozen in the ice around it, Chinese fantasy art style, frozen temple atmosphere, highly detailed, 4k quality, full body portrait, ancient ice blue and frost cyan color palette'
  },
  // 仙墟
  '仙墟守护者': {
    thumbnail: 'A celestial guardian in golden armor, with a divine spear and halo, Chinese fantasy game boss, chibi style avatar icon, divine protector, clean background, 512x512',
    portrait: 'A celestial guardian standing before ancient immortal ruins, gleaming golden armor with divine patterns, divine spear crackling with heavenly lightning, halo of sacred light behind its head, eyes filled with divine purpose, Chinese fantasy art style, immortal ruins atmosphere, highly detailed, 4k quality, full body portrait, sacred gold and divine white color palette'
  },
  '堕落仙君': {
    thumbnail: 'A fallen immortal with half-dark half-light appearance, corrupted robes, Chinese fantasy game boss, chibi style avatar icon, tragic corruption, clean background, 512x512',
    portrait: 'A fallen immortal lord with body split between divine light and demonic darkness, one side wearing pristine white immortal robes with golden patterns, the other side in corrupted black demonic armor with crimson veins, dual nature expressed in every feature, Chinese fantasy art style, corrupted immortal realm atmosphere, highly detailed, 4k quality, full body portrait, divine white and corrupted black color palette'
  },
  // 混沌界
  '混沌主宰': {
    thumbnail: 'A chaos overlord with formless body, multiple eyes, and reality-warping aura, Chinese fantasy game boss, chibi style avatar icon, primordial chaos, clean background, 512x512',
    portrait: 'A chaos overlord with formless body constantly shifting between shapes, multiple glowing eyes floating around its core, reality warping around its presence, colors that should not exist visible in its aura, wearing armor made from compressed void, Chinese fantasy art style, chaos void atmosphere, highly detailed, 4k quality, full body portrait, void purple and impossible colors color palette'
  },
  '天道化身': {
    thumbnail: 'An avatar of heavenly dao with golden runes, celestial halo, and divine authority, Chinese fantasy game boss, chibi style avatar icon, supreme divinity, clean background, 512x512',
    portrait: 'An avatar of the heavenly dao floating above clouds of golden light, body made from condensed cosmic energy, golden runes of the laws of nature floating around, celestial halo with infinite layers, eyes containing the birth and death of stars, Chinese fantasy art style, heavenly realm atmosphere, highly detailed, 4k quality, full body portrait, cosmic gold and starlight silver color palette'
  }
}

// 按区域获取怪物提示词列表（用于批量生成）
export function getMonsterPromptsByZone(zoneId) {
  const zoneMonsterMap = {
    'forest_edge': ['野猪精', '山匪', '野狼', '狼王', '山匪头目'],
    'misty_valley': ['猛虎', '骷髅兵', '毒蛇', '迷雾虎王', '骷髅将军'],
    'phoenix_cave': ['妖狼', '毒蛇', '焰魔', '焰魔领主', '火凤凰'],
    'dragon_abyss': ['僵尸王', '血魔', '深渊蛟龙', '血魔大帝'],
    'ghost_wasteland': ['噬魂鬼', '血魔', '噬魂鬼王', '白骨魔尊'],
    'ice_palace': ['远古妖龙', '冰凰', '冰封古魔'],
    'immortal_ruins': ['远古妖龙', '仙墟守护者', '堕落仙君'],
    'chaos_realm': ['远古妖龙', '混沌主宰', '天道化身']
  }
  const names = zoneMonsterMap[zoneId] || []
  return names.map(name => ({
    name,
    thumbnail: MONSTER_PORTRAIT_PROMPTS[name]?.thumbnail,
    portrait: MONSTER_PORTRAIT_PROMPTS[name]?.portrait
  })).filter(item => item.thumbnail && item.portrait)
}

// manifest 已通过 import 内联到 JS bundle，无需模块加载时预取
