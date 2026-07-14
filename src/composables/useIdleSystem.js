import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { zones, getZoneById, getZoneDifficulty } from '../plugins/zones'
import { CombatManager, CombatEntity, CombatType } from '../plugins/combat'
import { getRandomHerb, getRandomOre, getRandomLiquid, getRandomCore, getRandomSpecial } from '../plugins/materials'
import { getAffixesForSlot, setBonuses, rarityConfig } from '../plugins/buildSystem'
import { equipmentNameParts } from '../plugins/gacha'

// ============ 单例状态（模块级，跨组件共享） ============
const selectedZone = ref(null)
const selectedDifficultyKey = ref('xiongxian')
const isIdling = ref(false)
const logs = ref([])                 // 挂机日志（仅内存，不写入存档）
const idleEncounterCount = ref(0)
const idleProgress = ref(0)
const idleTimeRemaining = ref('')
const lastSummary = ref(null)
const combatState = ref({ inCombat: false, combatManager: null })
const animState = ref({ playerAttack: false, playerHurt: false, enemyAttack: false, enemyHurt: false })
const treasureFlash = ref({ show: false, tier: '', title: '', desc: '', icon: '' })
const runStats = ref({ victories: 0, defeats: 0, spiritStones: 0, cultivation: 0, equipment: 0 })

// ============ 挂机血条（持久化气血，跨遭遇累积，归零则提前力竭） ============
const idlePlayerHP = ref(0)
const idlePlayerMaxHP = ref(0)
const idlePlayerDefeated = ref(false)

// 玩家当前 Build 强度（装备评分总和）
const playerBuildStrength = computed(() => store().buildStrength)
// 当前地图/难度推荐的 Build 强度（挂机能否成功的基础属性）
const currentRecommendedBuild = computed(() => {
  if (!selectedZone.value) return 0
  const diff = getZoneDifficulty(selectedZone.value, selectedDifficultyKey.value)
  return diff ? (diff.recommendedBuild || 0) : 0
})
// Build 匹配度 = 自身 / 推荐，<1 表示强度不足，可能在挂机中因气血耗尽提前失败
const buildRatio = computed(() => {
  const rec = currentRecommendedBuild.value
  return rec > 0 ? playerBuildStrength.value / rec : 1
})

// 在线每场遭遇间隔：15 秒，让日志密集滚动
const ENCOUNTER_INTERVAL = 15000

let _store = null
function store() {
  if (!_store) _store = usePlayerStore()
  return _store
}

let idleInterval = null
let idleTimer = null
let isRunning = false // 重入锁

// ============ 生动日志文案库（修仙风） ============
// 通用场景（无专属描写时回退）
const SCENES = [
  '林间雾气氤氲如纱，你屏息敛息，灵识如涟漪般扫过每一寸草木，捕捉着最细微的灵机波动。',
  '山风呼啸掠过乱石，你踏歌而行、足下生风，对周遭潜藏的煞气浑然不惧。',
  '洞府幽深，火灵翻涌如潮，炽浪扑面而来，将你的衣袂灼得微微卷曲。',
  '深渊幽暗无光，龙吟隐隐自地底传来，刺骨寒意顺着经脉悄然蔓延周身。',
  '荒原寂寥，白骨皑皑铺成血色长路，冲霄怨气令空气都凝滞了几分。',
  '冰雪封山，琼楼玉宇在朔风中若隐若现，厉风如刀，割得面皮生疼。',
  '残垣断壁间仙光流转，似有古人长叹穿越千年，余音绕梁、久久不散。',
  '混沌虚无之地，法则崩坏、时空错位，你每一步都踏在天地裂隙的边缘。'
]
// 八图专属探索描写（更详尽、各有意境）
const ZONE_SCENES = {
  forest_edge: [
    '林缘古木参天，藤蔓垂落如帘，你拨开半人高的荒草，听见远处灵兽啃噬浆果的细响。',
    '晨露未晞，林间浮起一层淡金灵雾，你踩着湿润的苔径，灵识悄然探入树海深处。'
  ],
  misty_valley: [
    '雾谷终年云雾缭绕，能见度不过丈许，你以灵识代目，循着一缕若有若无的灵泉之音前行。',
    '谷中雾气忽聚忽散，隐约现出一座半塌的石桥，桥下灵泉汩汩，映着朦胧月色。'
  ],
  phoenix_cave: [
    '火凤洞内岩浆奔流如河，热浪扭曲了视线，你运转护体真气，踏着冷却的玄武岩步步深入。',
    '洞壁嵌满赤红火晶，每一次心跳都仿佛与地火共鸣，焦糊的硫磺味扑面而来。'
  ],
  dragon_abyss: [
    '龙渊深不见底，黑水之上寒气凝结成霜，你御风悬于渊口，隐约瞥见水底有庞然黑影游弋。',
    '渊底龙吟低沉如雷，震得崖壁簌簌落石，你屏息凝神，灵识小心翼翼探向那片幽暗。'
  ],
  ghost_wasteland: [
    '鬼荒之地白骨蔽野，残魂如萤火飘荡，凄厉怨啸缠上神魂，你以清心诀压下心头寒意。',
    '断戟朽甲散落满地，一缕缕黑气自尸骸中渗出，汇成偌大的怨气漩涡缓缓旋转。'
  ],
  ice_palace: [
    '冰宫玉砌银装，千年不化的玄冰倒悬如剑，你每一步落足都激起清脆如磬的回响。',
    '宫殿深处宝光莹莹，冰封的仙池下似有残阵流转，朔风卷着冰屑拂过你眉间。'
  ],
  immortal_ruins: [
    '仙墟断壁残垣爬满古老的道纹，虽已残破，仍透出令人心悸的法则余威。',
    '废墟中央矗立半截碑文，字迹被岁月蚀去大半，你驻足凝望，似有所悟又怅然若失。'
  ],
  chaos_realm: [
    '混沌界中五行颠倒、光暗交错，脚下的大地时而化为流沙、时而凝作坚铁。',
    '此处时空如碎镜，你看见数个自己的残影在不同方向行走，法则的碎屑在指缝间流过。'
  ]
}
// 敌人现身描写（按层级）
const ENEMY_APPEAR = {
  boss: [
    (n) => `👑 天穹骤暗，${n} 自虚空裂隙中降临，威压如万钧大山轰然压下，天地为之失色！`,
    (n) => `👑 一声长啸震碎云霄，${n} 裹挟滔天煞气现身，周遭法则都在其怒意下微微颤栗！`
  ],
  elite: [
    (n) => `⚡ 一股凶煞之气破空袭来——${n}（精英）自暗影中横空而出，双目猩红、气势逼人！`,
    (n) => `⚡ 林木倒卷，${n}（精英）踏碎山石逼近，鳞甲上还沾着未干的温热血迹！`
  ],
  normal: [
    (n) => `一头${n}自草莽暗处扑出，獠牙森森、腥风扑面，杀意凛然！`,
    (n) => `${n}自岩后悄然探出头颅，目光如钩，已死死锁定了你的咽喉！`
  ]
}
// 战斗动作（带招式名，多段描写）
const COMBAT_ACTIONS = [
  { type: 'combat', text: '⚡ 你捕捉敌方气机破绽，剑随念动，「惊鸿破月」一击正中要害，暴击伤害如惊雷炸裂！' },
  { type: 'combat', text: '🔥 剑光连绵成网，连环三击如疾风骤雨倾泻而下，逼得敌人节节败退、气机大乱！' },
  { type: 'combat', text: '🌀 你身形鬼魅般一晃，轻易避开这记噬魂杀招，反手「流光剑」已无声抵在其咽喉！' },
  { type: 'combat', text: '🛡️ 护体真气轰然一震，将敌人狂暴攻势尽数反震回去，震得它气血翻涌、踉跄数步！' },
  { type: 'combat', text: '🌟 你以碾压级的修为压制全场，威压如山倾泻，敌人动作立时凝滞、破绽百出！' },
  { type: 'combat', text: '💥 你引动周身灵力，一掌「撼山印」拍出，掌风所过山河震颤、碎石崩飞！' },
  { type: 'combat', text: '🗡️ 你踏罡步斗，身形化作流光绕敌三匝，每一闪现都带走一道血光，敌人防不胜防！' },
  { type: 'combat', text: '❄️ 寒霜灵力透体而出，将敌人双足封冻于地，你趁机长剑贯胸，冰碴与热血一同迸溅！' }
]
const VICTORY_LINES = [
  (e) => `🗡️ ${e} 轰然倒地，腥血溅落青石，你悠然收剑入鞘，衣袂不染纤尘。`,
  (e) => `✨ 你身形一闪，${e} 已授首殒命，清风拂过染血的战袍，杀意渐散于天地间。`,
  (e) => `🌿 你以四两拨千斤之势将${e}轻松放倒，神色淡然，仿佛只是拂去肩头落雪。`,
  (e) => `🔥 ${e} 在连绵剑影中化作血雾溃散，你负手而立，周身灵光因畅快一战而愈发炽盛。`
]
const DEFEAT_LINES = [
  (e, l) => `😱 你被 ${e} 一爪狠狠拍飞，气血翻涌几欲呕血，此役折损修为 ${l} 点。`,
  (e, l) => `💢 不敌 ${e} 之威，你狼狈遁走，灵力枯竭、修为受损 ${l} 点，须得养精蓄锐再战。`,
  (e, l) => `🩸 ${e} 一击洞穿护体真气，你险象环生、踉跄败退，折损修为 ${l} 点。`
]
const FORTUNE_LINES = [
  (n) => `🌀 机缘巧合，你于石缝灵脉间寻得${n}，此乃天赐造化，福缘匪浅！`,
  (n) => `🌿 一株${n}破土而生、灵光流转，你福至心灵将其小心采下，周身灵气为之一振！`,
  (n) => `✨ 奇遇骤降，你于残阵中寻得${n}，宝光温润，似有古老封印仍未散去。`
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a

function addLog(type, text, detail = null) {
  logs.value.push({ type, text, detail, time: new Date().toLocaleTimeString() })
  // 控制内存体积：最多保留 400 条
  if (logs.value.length > 400) logs.value = logs.value.slice(-400)
}

// 将装备/灵宠的基础数据格式化为日志明细子行
function formatItemDetail(item, type, rarity) {
  if (!item) return ''
  const st = item.stats || item.combatAttributes || {}
  // 使用普通空格和 ASCII 分隔符替代全角空格（U+3000），避免部分设备渲染为乱码方块
  if (type === 'equipment') {
    let s = `攻+${st.attack ?? 0} 生+${st.health ?? 0} 防+${st.defense ?? 0} 速+${st.speed ?? 0}`
    const affixes = item.affixes || []
    if (affixes.length) s += ' | ' + affixes.map(a => a.name).join('·')
    if (item.setId) {
      const setData = setBonuses.find(x => x.id === item.setId)
      if (setData) s += ' | 套装·' + setData.name
    }
    return s
  }
  if (type === 'pet') {
    const rName = (rarityInfo[rarity] && rarityInfo[rarity].name) || ''
    return `${rName}灵宠 攻+${st.attack ?? 0} 防+${st.defense ?? 0} 生+${st.health ?? 0}`
  }
  return ''
}

// ============ 奖励品质信息 ============
const rarityInfo = {
  common: { name: '凡品', color: '#aaaaaa', tier: 'normal' },
  uncommon: { name: '良品', color: '#88cc44', tier: 'normal' },
  rare: { name: '稀有', color: '#4488ff', tier: 'highlight' },
  epic: { name: '史诗', color: '#aa44ff', tier: 'epic' },
  legendary: { name: '传说', color: '#ff8800', tier: 'epic' },
  mythic: { name: '仙品', color: '#ff4444', tier: 'legendary' },
  mortal: { name: '凡品灵宠', color: '#32CD32', tier: 'normal' },
  spiritual: { name: '灵品灵宠', color: '#1E90FF', tier: 'highlight' },
  mystic: { name: '玄品灵宠', color: '#9932CC', tier: 'epic' },
  celestial: { name: '仙品灵宠', color: '#FFD700', tier: 'legendary' },
  divine: { name: '神品灵宠', color: '#FF0000', tier: 'legendary' }
}

// 合并难度参数，生成一个「有效区域」供战斗/奖励逻辑使用
function buildEffectiveZone(zone, diff) {
  return {
    ...zone,
    rewardMultiplier: diff.rewardMultiplier,
    recommendedStats: diff.recommendedStats,
    difficultyLabel: diff.label,
    difficultyColor: diff.color,
    enemyScale: diff.enemyScale,
    dropBonus: diff.dropBonus
  }
}

// ============ 装备 / 灵宠 / 敌人生成 ============
const SLOTS = ['weapon', 'head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'necklace', 'ring1', 'ring2', 'belt']
const RARITY_MULT = { common: 1, uncommon: 1.3, rare: 1.8, epic: 2.5, legendary: 4, mythic: 7 }

// 使用真实装备名库（与抽卡系统一致），避免挂机产出「良品戒」这类虚拟命名
function getEquipName(slot, rarity, setId = null) {
  const nameParts = equipmentNameParts[slot] || ['未知']
  const nameBase = nameParts[Math.floor(Math.random() * nameParts.length)]
  const qualityName = (rarityConfig[rarity] || {}).name || rarity
  if (setId) {
    const setData = setBonuses.find(s => s.id === setId)
    if (setData) return `${setData.name}·${nameBase}`
  }
  return `${nameBase}·${qualityName}`
}

function generateEquipment(rarity, effectiveZone) {
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)]
  const mult = RARITY_MULT[rarity] || 1
  const affixes = getAffixesForSlot(slot, rarity)
  let setId = null
  if (['epic', 'legendary', 'mythic'].includes(rarity) && Math.random() < 0.3) {
    const availableSets = setBonuses.filter(s => s.pieces.includes(slot))
    if (availableSets.length > 0) setId = availableSets[Math.floor(Math.random() * availableSets.length)].id
  }
  return {
    id: Date.now() + Math.random(),
    type: 'equipment',
    slot,
    name: getEquipName(slot, rarity, setId),
    quality: rarity,
    rarity,
    qualityInfo: { name: (rarityConfig[rarity] || {}).name || rarity, color: (rarityConfig[rarity] || {}).color || '#999' },
    stats: {
      attack: Math.floor(effectiveZone.recommendedStats.attack * 0.22 * mult),
      health: Math.floor(effectiveZone.recommendedStats.health * 0.16 * mult),
      defense: Math.floor(effectiveZone.recommendedStats.attack * 0.13 * mult),
      speed: Math.floor(8 * mult)
    },
    affixes,
    setId,
    enhanceLevel: 0,
    value: Math.floor(50 * effectiveZone.difficulty * mult)
  }
}

function generatePet(rarity, effectiveZone) {
  const petNames = ['灵狐', '仙鹤', '青鸾', '玉兔', '玄龟', '朱雀', '白虎', '麒麟']
  // 与抽卡灵宠一致：输出 combatAttributes，使出战/升级/显示逻辑统一生效
  const rarityMult = { mortal: 1, spiritual: 1.5, mystic: 2, celestial: 3, divine: 5 }[rarity] || 1
  const zAtk = effectiveZone.recommendedStats.attack
  const zHp = effectiveZone.recommendedStats.health
  const combatAttributes = {
    attack: Math.floor(zAtk * 0.16 * rarityMult),
    defense: Math.floor(zAtk * 0.09 * rarityMult),
    health: Math.floor(zHp * 0.09 * rarityMult),
    speed: Math.floor(6 * rarityMult),
    critRate: Math.min(0.5, 0.05 * rarityMult),
    comboRate: Math.min(0.5, 0.05 * rarityMult),
    counterRate: Math.min(0.5, 0.04 * rarityMult),
    stunRate: Math.min(0.5, 0.04 * rarityMult),
    dodgeRate: Math.min(0.5, 0.05 * rarityMult),
    vampireRate: Math.min(0.5, 0.04 * rarityMult),
    critResist: Math.min(0.5, 0.04 * rarityMult),
    comboResist: Math.min(0.5, 0.04 * rarityMult),
    counterResist: Math.min(0.5, 0.04 * rarityMult),
    stunResist: Math.min(0.5, 0.04 * rarityMult),
    dodgeResist: Math.min(0.5, 0.04 * rarityMult),
    vampireResist: Math.min(0.5, 0.04 * rarityMult),
    healBoost: 0,
    critDamageBoost: 0,
    critDamageReduce: 0,
    finalDamageBoost: 0,
    finalDamageReduce: 0,
    combatBoost: 0,
    resistanceBoost: 0
  }
  return {
    id: Date.now() + Math.random(),
    type: 'pet',
    name: petNames[Math.floor(Math.random() * petNames.length)],
    rarity,
    level: 1,
    star: 0,
    combatAttributes
  }
}

function createPlayerEntity() {
  const s = store()
  const baseStats = {
    health: s.baseAttributes.health,
    damage: s.baseAttributes.attack,
    defense: s.baseAttributes.defense,
    speed: s.baseAttributes.speed,
    critRate: s.combatAttributes.critRate,
    comboRate: s.combatAttributes.comboRate,
    counterRate: s.combatAttributes.counterRate,
    stunRate: s.combatAttributes.stunRate,
    dodgeRate: s.combatAttributes.dodgeRate,
    vampireRate: s.combatAttributes.vampireRate,
    critResist: s.combatResistance.critResist,
    comboResist: s.combatResistance.comboResist,
    counterResist: s.combatResistance.counterResist,
    stunResist: s.combatResistance.stunResist,
    dodgeResist: s.combatResistance.dodgeResist,
    vampireResist: s.combatResistance.vampireResist,
    healBoost: s.specialAttributes.healBoost,
    critDamageBoost: s.specialAttributes.critDamageBoost,
    critDamageReduce: s.specialAttributes.critDamageReduce,
    finalDamageBoost: s.specialAttributes.finalDamageBoost,
    finalDamageReduce: s.specialAttributes.finalDamageReduce,
    combatBoost: s.specialAttributes.combatBoost,
    resistanceBoost: s.specialAttributes.resistanceBoost,
    spiritDamage: s.spirit * 0.1,
    maxHealth: s.baseAttributes.health
  }
  const petBonus = s.getPetBonus
  if (petBonus) {
    baseStats.damage += petBonus.attack || 0
    baseStats.health += petBonus.health || 0
    baseStats.maxHealth = baseStats.health
    baseStats.defense += petBonus.defense || 0
    baseStats.speed += petBonus.speed || 0
  }
  if (s.artifactBonuses) {
    const ab = s.artifactBonuses
    baseStats.damage += ab.attack || 0
    baseStats.health += ab.health || 0
    baseStats.maxHealth = baseStats.health
    baseStats.defense += ab.defense || 0
    baseStats.speed += ab.speed || 0
  }
  return new CombatEntity(s.name, s.level, baseStats, s.realm)
}

function generateZoneEnemy(effectiveZone, encounterCount) {
  const isBoss = encounterCount > 0 && encounterCount % 10 === 0
  const isElite = encounterCount > 0 && encounterCount % 5 === 0 && !isBoss
  const type = isBoss ? CombatType.BOSS : isElite ? CombatType.ELITE : CombatType.NORMAL
  const secretLv = effectiveZone.difficulty
  const scale = effectiveZone.enemyScale
  const baseStats = {
    health: Math.floor(effectiveZone.recommendedStats.health * 0.6 * scale),
    damage: Math.floor(effectiveZone.recommendedStats.attack * 0.4 * scale),
    defense: Math.floor(effectiveZone.recommendedStats.attack * 0.1 * scale),
    speed: 5 + secretLv * 2,
    critRate: Math.min(0.15, 0.02 + secretLv * 0.01),
    comboRate: Math.min(0.1, 0.01 + secretLv * 0.005),
    counterRate: Math.min(0.1, 0.01 + secretLv * 0.005),
    stunRate: Math.min(0.08, 0.01 + secretLv * 0.003),
    dodgeRate: Math.min(0.12, 0.02 + secretLv * 0.008),
    vampireRate: Math.min(0.08, 0.01 + secretLv * 0.003),
    critResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    comboResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    counterResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    stunResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    dodgeResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    vampireResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    healBoost: 0,
    critDamageBoost: 0.3,
    critDamageReduce: 0,
    finalDamageBoost: Math.min(0.1, secretLv * 0.01),
    finalDamageReduce: Math.min(0.1, secretLv * 0.01),
    combatBoost: 0,
    resistanceBoost: 0,
    maxHealth: Math.floor(effectiveZone.recommendedStats.health * 0.6 * scale)
  }

  let monsterName
  if (isBoss && effectiveZone.bosses && effectiveZone.bosses.length > 0) {
    const boss = effectiveZone.bosses[Math.floor(Math.random() * effectiveZone.bosses.length)]
    monsterName = boss.name
    baseStats.health = boss.stats.health
    baseStats.maxHealth = boss.stats.health
    baseStats.damage = boss.stats.attack
    baseStats.defense = boss.stats.defense || 0
    baseStats.speed = boss.stats.speed || 10
    baseStats.critRate = Math.min(0.2, baseStats.critRate + 0.1)
    baseStats.finalDamageBoost = Math.min(0.2, baseStats.finalDamageBoost + 0.1)
  } else if (isElite) {
    monsterName = effectiveZone.monsters[Math.floor(Math.random() * effectiveZone.monsters.length)]
    baseStats.health = Math.floor(baseStats.health * 1.5)
    baseStats.maxHealth = baseStats.health
    baseStats.damage = Math.floor(baseStats.damage * 1.3)
    baseStats.critRate = Math.min(0.2, baseStats.critRate + 0.05)
  } else {
    monsterName = effectiveZone.monsters[Math.floor(Math.random() * effectiveZone.monsters.length)]
  }

  const enemy = new CombatEntity(monsterName, effectiveZone.minLevel, baseStats, isBoss ? 'BOSS' : isElite ? '精英' : effectiveZone.difficultyLabel)
  enemy.tier = isBoss ? 'boss' : isElite ? 'elite' : 'normal'
  return enemy
}

function grantCombatDrops(enemy) {
  const s = store()
  const drops = []
  const tier = enemy?.tier || 'normal'
  if (tier === 'boss') {
    if (Math.random() < 0.6) { const c = getRandomCore('boss'); s.gainMaterial(c); drops.push(c) }
    if (Math.random() < 0.08) { const sp = getRandomSpecial(); s.gainMaterial(sp); drops.push(sp) }
    if (Math.random() < 0.25) { const h = getRandomHerb({ difficulty: 9 }); s.gainMaterial(h); drops.push(h) }
  } else if (tier === 'elite') {
    if (Math.random() < 0.5) { const c = getRandomCore('elite'); s.gainMaterial(c); drops.push(c) }
    const beast = getRandomCore('normal'); s.gainMaterial(beast); drops.push(beast)
  } else {
    if (Math.random() < 0.4) { const c = getRandomCore('normal'); s.gainMaterial(c); drops.push(c) }
  }
  return drops
}

function grantReward(effectiveZone, isIdleMode = false) {
  const s = store()
  const rewards = []
  const dropBonus = effectiveZone.dropBonus || 1
  // 掉落加成：小幅提升高品质概率
  const upgradeChance = Math.max(0, (dropBonus - 1) * 0.35)
  for (const rw of effectiveZone.rewards) {
    if (Math.random() < rw.chance) {
      const amount = Array.isArray(rw.amount)
        ? Math.floor(Math.random() * (rw.amount[1] - rw.amount[0] + 1)) + rw.amount[0]
        : rw.amount || 1
      const multiplied = Math.floor(amount * effectiveZone.rewardMultiplier)
      if (rw.type === 'spirit_stone') {
        s.spiritStones += multiplied
        runStats.value.spiritStones += multiplied
        rewards.push({ type: 'spirit_stone', amount: multiplied, name: '灵石' })
      } else if (rw.type === 'herb') {
        for (let i = 0; i < multiplied; i++) { const h = getRandomHerb(effectiveZone); if (h) s.gainMaterial(h) }
        rewards.push({ type: 'herb', amount: multiplied, name: '灵草' })
      } else if (rw.type === 'ore') {
        for (let i = 0; i < multiplied; i++) { const o = getRandomOre(effectiveZone); if (o) s.gainMaterial(o) }
        rewards.push({ type: 'ore', amount: multiplied, name: '矿料' })
      } else if (rw.type === 'liquid') {
        for (let i = 0; i < multiplied; i++) { const l = getRandomLiquid(effectiveZone); if (l) s.gainMaterial(l) }
        rewards.push({ type: 'liquid', amount: multiplied, name: '灵液' })
      } else if (rw.type === 'fortune') {
        const pool = [
          getRandomHerb({ difficulty: 9 }),
          ...(effectiveZone.difficulty >= 5 ? [getRandomOre({ difficulty: 9 }), getRandomLiquid({ difficulty: 9 })] : []),
          getRandomSpecial()
        ].filter(Boolean)
        const pickItem = pool[Math.floor(Math.random() * pool.length)]
        if (pickItem) { s.gainMaterial(pickItem); rewards.push({ type: 'fortune', amount: 1, name: '奇遇·' + pickItem.name, material: pickItem }) }
      } else if (rw.type === 'cultivation') {
        s.cultivate(multiplied)
        runStats.value.cultivation += multiplied
        rewards.push({ type: 'cultivation', amount: multiplied, name: '修为' })
      } else if (rw.type === 'equipment') {
        let rarity = rw.rarity[Math.floor(Math.random() * rw.rarity.length)]
        if (Math.random() < upgradeChance) {
          const idx = rw.rarity.indexOf(rarity)
          if (idx >= 0 && idx < rw.rarity.length - 1) rarity = rw.rarity[idx + 1]
        }
        const equip = generateEquipment(rarity, effectiveZone)
        s.items.push(equip); s.itemsFound++
        runStats.value.equipment++
        const info = rarityInfo[rarity] || rarityInfo.common
        rewards.push({ type: 'equipment', name: equip.name, rarity, info, item: equip })
      } else if (rw.type === 'pet') {
        let rarity = rw.rarity[Math.floor(Math.random() * rw.rarity.length)]
        if (Math.random() < upgradeChance) {
          const idx = rw.rarity.indexOf(rarity)
          if (idx >= 0 && idx < rw.rarity.length - 1) rarity = rw.rarity[idx + 1]
        }
        const pet = generatePet(rarity, effectiveZone)
        s.items.push(pet); s.itemsFound++
        runStats.value.equipment++
        const info = rarityInfo[rarity] || rarityInfo.mortal
        rewards.push({ type: 'pet', name: pet.name, rarity, info, item: pet })
      }
    }
  }
  return rewards
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function runExploreCombat(effectiveZone, encounterCount, isIdleMode = false) {
  const playerEntity = createPlayerEntity()
  const enemy = generateZoneEnemy(effectiveZone, encounterCount)
  const manager = new CombatManager(playerEntity, enemy)
  manager.start()
  if (!isIdleMode) {
    combatState.value = { inCombat: true, combatManager: manager }
  }
  while (manager.state === 'in_progress') {
    const result = manager.executeTurn()
    if (!isIdleMode && result) {
      if (result.results && result.results.length > 0) {
        const firstAttack = result.results[0]
        if (firstAttack.attacker === playerEntity.name) {
          animState.value.playerAttack = true; animState.value.enemyHurt = true
          await sleep(400)
          animState.value.playerAttack = false; animState.value.enemyHurt = false
        } else {
          animState.value.enemyAttack = true; animState.value.playerHurt = true
          await sleep(400)
          animState.value.enemyAttack = false; animState.value.playerHurt = false
        }
      }
      if (!combatState.value.inCombat) break
      await sleep(300)
    }
    if (!result) break
    if (result.state === 'victory') {
      const drops = grantCombatDrops(enemy)
      return { victory: true, manager, enemy, drops }
    } else if (result.state === 'defeat') {
      return { victory: false, manager, enemy }
    }
  }
  return { victory: false, manager, enemy }
}

// ============ 宝物高亮弹窗 ============
let flashTimer = null
function showTreasureFlash(reward) {
  if (flashTimer) clearTimeout(flashTimer)
  let tier = 'normal', icon = '', title = '', desc = ''
  if (reward.type === 'equipment' || reward.type === 'pet') {
    const info = reward.info || rarityInfo[reward.rarity] || rarityInfo.common
    tier = info.tier; icon = reward.type === 'pet' ? '🐉' : '⚔️'
    if (tier === 'legendary') { title = '神品降临！'; desc = `获得${info.name}${reward.type === 'pet' ? '' : '装备'}！天降异象，金光万丈！` }
    else if (tier === 'epic') { title = '极品宝物！'; desc = `获得${info.name}${reward.type === 'pet' ? '' : '装备'}！紫气东来！` }
    else if (tier === 'highlight') { title = '稀有收获！'; desc = `获得${info.name}${reward.type === 'pet' ? '' : '装备'}！` }
    else return
  } else return
  treasureFlash.value = { show: true, tier, title, desc, icon }
  flashTimer = setTimeout(() => { treasureFlash.value.show = false }, tier === 'legendary' ? 3000 : tier === 'epic' ? 2500 : 2000)
}

// ============ 生动日志：单场遭遇 ============
function logEncounter(zone, diff, count, enemy, victory, rewards, loss) {
  addLog('header', `【${zone.name}·${diff.label}】第 ${count} 次探索`)
  // 探索场景：优先使用对应地图专属描写，让八图各有意境
  const scenePool = (ZONE_SCENES[zone.id] && ZONE_SCENES[zone.id].length) ? ZONE_SCENES[zone.id] : SCENES
  addLog('scene', pick(scenePool))
  // 敌人现身（按层级差异化描写）
  const appearPool = ENEMY_APPEAR[enemy.tier] || ENEMY_APPEAR.normal
  addLog('enemy-' + enemy.tier, pick(appearPool)(enemy.name))
  // 战斗过程：先交手后分胜负，普通怪 2 段、精英/Boss 3 段，描述更详尽
  const actions = 2 + (enemy.tier !== 'normal' ? 1 : 0)
  for (let i = 0; i < actions; i++) {
    const a = pick(COMBAT_ACTIONS); addLog('combat', a.text)
  }
  if (victory) {
    addLog('victory', pick(VICTORY_LINES)(enemy.name))
    rewards.forEach(r => {
      if (r.type === 'equipment' || r.type === 'pet') {
        const info = r.info
        const detail = formatItemDetail(r.item, r.type, r.rarity)
        if (info.tier === 'legendary') addLog('reward-legendary', `🔥 金光万丈！获得【${r.name}】，异象冲霄，天地同贺！`, detail)
        else if (info.tier === 'epic') addLog('reward-epic', `🌟 紫气东来！获得【${r.name}】，瑞光环绕！`, detail)
        else if (info.tier === 'highlight') addLog('reward-highlight', `💎 稀有收获：【${r.name}】`, detail)
        // 普通品质也显示完整名称 + 数据（不再只显示"凡品/良品"）
        else addLog('reward-normal', `⚔️ 获得【${r.name}】（${info.name}）`, detail)
      } else if (r.type === 'fortune') {
        addLog('fortune', pick(FORTUNE_LINES)(r.material?.name || r.name))
      } else {
        addLog('reward-normal', `获得 ${r.amount} ${r.name}`)
      }
      showTreasureFlash(r)
    })
  } else {
    addLog('defeat', pick(DEFEAT_LINES)(enemy.name, loss))
  }
}

// ============ 挂机单次遭遇（在线，完整战斗模拟） ============
async function runIdleEncounter() {
  if (!isIdling.value || !selectedZone.value) return
  if (isRunning) return // 重入锁
  isRunning = true
  const s = store()
  const zone = selectedZone.value
  const diff = getZoneDifficulty(zone, selectedDifficultyKey.value)
  const effectiveZone = buildEffectiveZone(zone, diff)
  try {
    s.regenerateSpirit()
    if (s.spiritStones < diff.spiritCost) {
      addLog('warning', '灵石不足，挂机探索暂停，恢复灵石后可继续。')
      stopIdle()
      return
    }
    s.spiritStones -= diff.spiritCost
    idleEncounterCount.value++
    const count = idleEncounterCount.value
    const result = await runExploreCombat(effectiveZone, count, true)
    let rewards = []
    let loss = 0
    const maxHP = idlePlayerMaxHP.value || 1
    const ratio = buildRatio.value
    const underBuilt = Math.max(0, 1 - ratio) // 0=达标，越大越弱
    if (result.victory) {
      rewards = grantReward(effectiveZone, true)
      s.dungeonTotalKills++; s.explorationCount++
      // 保底灵石返还：每场胜利至少回收消耗的 30%~80%（难度越高比例越低但基数大）
      const recoverRatio = Math.max(0.3, 0.8 - effectiveZone.difficulty * 0.06)
      const recovered = Math.max(1, Math.round(diff.spiritCost * recoverRatio))
      s.spiritStones += recovered
      runStats.value.spiritStones += recovered
      // 挂机修为加成：每场胜利额外给修为（与地图等级相关）
      const cultBonus = Math.round(5 * effectiveZone.difficulty * (1 + ratio * 0.5))
      s.cultivate(cultBonus)
      runStats.value.cultivation += cultBonus
      // 奇遇：每 20 次，50% 触发
      if (count % 20 === 0 && Math.random() < 0.5) {
        const fortunePool = [getRandomHerb({ difficulty: 9 }), getRandomOre({ difficulty: 9 }), getRandomLiquid({ difficulty: 9 }), getRandomSpecial()].filter(Boolean)
        const fp = fortunePool[Math.floor(Math.random() * fortunePool.length)]
        if (fp) { s.gainMaterial(fp); rewards.push({ type: 'fortune', amount: 1, name: '奇遇·' + fp.name, material: fp }) }
      }
      runStats.value.victories++
      // 胜利：小幅擦伤后调息回血，Build 越强损耗越小
      const scrape = Math.round(maxHP * (0.04 + 0.06 * underBuilt))
      idlePlayerHP.value = Math.min(maxHP, idlePlayerHP.value + Math.round(maxHP * 0.12) - scrape)
    } else {
      loss = Math.floor(s.cultivation * 0.05)
      s.cultivation = Math.max(0, s.cultivation - loss)
      s.dungeonDeathCount++
      runStats.value.defeats++
      // 失败：气血重创，Build 越弱受伤越重（25%~60% 最大气血）
      const hurt = Math.round(maxHP * (0.25 + 0.35 * underBuilt))
      idlePlayerHP.value -= hurt
    }
    idlePlayerHP.value = Math.max(0, idlePlayerHP.value)
    logEncounter(zone, diff, count, result.enemy, result.victory, rewards, loss)
    s.updateIdleExploration({ encounterCount: count, lastEncounterTime: Date.now() })
    s.queueSave()
    // 气血归零 → 力竭提前失败
    if (idlePlayerHP.value <= 0) {
      idlePlayerDefeated.value = true
      addLog('defeat', `💀 力竭血枯！你的 Build 强度（${Math.round(playerBuildStrength.value)}）不足以撑过【${zone.name}·${diff.label}】（推荐 ${Math.round(currentRecommendedBuild.value)}），挂机被迫提前终止。`)
      finishIdle()
      return
    }
  } finally {
    isRunning = false
  }
}

// ============ 离线补算（轻量结算，避免卡顿） ============
function runOfflineEncounter(zone, diff, count) {
  const s = store()
  s.regenerateSpirit()
  if (s.spiritStones < diff.spiritCost) return false
  s.spiritStones -= diff.spiritCost
  const pAtk = s.baseAttributes.attack + (s.getPetBonus?.attack || 0) + (s.artifactBonuses?.attack || 0)
  const pHp = s.baseAttributes.health + (s.getPetBonus?.health || 0) + (s.artifactBonuses?.health || 0)
  // 离线胜率同样以 Build 匹配度为基准（兼容旧数值，做平滑过渡）
  const recBuild = diff.recommendedBuild || 1
  const ratio = (s.buildStrength || 1) / recBuild
  const winChance = Math.min(0.97, Math.max(0.08,
    0.5 + (ratio - 1) * 0.45 + (pAtk - diff.recommendedStats.attack) * 0.005 + (pHp - diff.recommendedStats.health) * 0.0005))
  const victory = Math.random() < winChance
  const effectiveZone = buildEffectiveZone(zone, diff)
  if (victory) {
    const rewards = grantReward(effectiveZone, true)
    s.dungeonTotalKills++; s.explorationCount++
    logEncounter(zone, diff, count, { name: zone.monsters[0], tier: 'normal' }, true, rewards, 0)
    runStats.value.victories++
  } else {
    const loss = Math.floor(s.cultivation * 0.05)
    s.cultivation = Math.max(0, s.cultivation - loss)
    s.dungeonDeathCount++
    logEncounter(zone, diff, count, { name: zone.monsters[0], tier: 'normal' }, false, [], loss)
    runStats.value.defeats++
  }
  return victory
}

// ============ 挂机控制 ============
function startIdleTimers() {
  if (idleInterval) clearInterval(idleInterval)
  if (idleTimer) clearInterval(idleTimer)
  idleInterval = setInterval(() => { runIdleEncounter() }, ENCOUNTER_INTERVAL)
  idleTimer = setInterval(() => {
    const remaining = store().getIdleRemainingTime()
    const elapsed = store().idleExploration.duration - remaining
    const total = store().idleExploration.duration
    idleProgress.value = total > 0 ? (elapsed / total) * 100 : 0
    const min = Math.floor(remaining / 60000)
    const sec = Math.floor((remaining % 60000) / 1000)
    idleTimeRemaining.value = `${min}:${String(sec).padStart(2, '0')}`
    if (remaining <= 0) finishIdle()
  }, 1000)
}

function startIdle(durationMinutes) {
  const s = store()
  if (!selectedZone.value) return
  const diff = getZoneDifficulty(selectedZone.value, selectedDifficultyKey.value)
  s.regenerateSpirit()
  if (s.spirit < diff.spiritCost) return
  s.startIdleExploration(selectedZone.value.id, selectedDifficultyKey.value, durationMinutes)
  isIdling.value = true
  idleEncounterCount.value = 0
  idlePlayerDefeated.value = false
  // 初始化血条：以玩家真实最大生命为基准
  const probe = createPlayerEntity()
  idlePlayerMaxHP.value = probe.stats.maxHealth
  idlePlayerHP.value = probe.stats.maxHealth
  runStats.value = { victories: 0, defeats: 0, spiritStones: 0, cultivation: 0, equipment: 0 }
  logs.value = []
  logs.value.push({ type: 'info', text: `开始挂机探索【${selectedZone.value.name}·${diff.label}】，预计 ${durationMinutes} 分钟，每 ${ENCOUNTER_INTERVAL / 1000} 秒一场遭遇`, time: new Date().toLocaleTimeString() })
  const match = Math.round(buildRatio.value * 100)
  if (buildRatio.value < 1) {
    logs.value.push({ type: 'warning', text: `⚠️ 你的 Build 强度（${Math.round(playerBuildStrength.value)}）低于推荐值（${Math.round(currentRecommendedBuild.value)}），匹配度 ${match}%，气血可能不支、挂机或提前力竭。`, time: new Date().toLocaleTimeString() })
  } else {
    logs.value.push({ type: 'info', text: `🛡️ Build 匹配度 ${match}%，气血充盈，可稳定挂机。`, time: new Date().toLocaleTimeString() })
  }
  startIdleTimers()
  // 挂机开始即触发一次自动存档（落盘挂机状态，防止意外丢失）
  s.queueSave()
}

function stopIdle() { finishIdle() }

function finishIdle() {
  if (!isIdling.value) return
  if (idleInterval) clearInterval(idleInterval)
  if (idleTimer) clearInterval(idleTimer)
  idleInterval = null; idleTimer = null
  const s = store()
  lastSummary.value = {
    zoneName: selectedZone.value?.name || '未知',
    difficulty: selectedDifficultyKey.value,
    duration: s.idleExploration.duration,
    encounters: idleEncounterCount.value,
    victories: runStats.value.victories,
    defeats: runStats.value.defeats,
    totalStones: runStats.value.spiritStones,
    totalCultivation: runStats.value.cultivation,
    totalEquipment: runStats.value.equipment,
    defeated: idlePlayerDefeated.value,
    logs: [...logs.value]
  }
  s.stopIdleExploration()
  // 挂机结束（正常结束 / 力竭 / 手动停止）立即同步落盘，确保本次收益不丢失
  s.saveData()
  isIdling.value = false
  idleProgress.value = 100
  idleTimeRemaining.value = '已完成'
  if (logs.value.length) {
    const tail = idlePlayerDefeated.value
      ? `挂机因气血耗尽提前终止！共探索 ${idleEncounterCount.value} 次，胜 ${runStats.value.victories} / 败 ${runStats.value.defeats}`
      : `挂机结束！共探索 ${idleEncounterCount.value} 次，胜 ${runStats.value.victories} / 败 ${runStats.value.defeats}`
    logs.value.push({ type: 'info', text: tail, time: new Date().toLocaleTimeString() })
  }
}

function processOfflineIdle() {
  const s = store()
  const idleState = s.idleExploration
  if (!idleState || !idleState.isActive) return
  const zone = getZoneById(idleState.zoneId)
  if (!zone) { s.stopIdleExploration(); return }
  const diff = getZoneDifficulty(zone, idleState.difficultyKey)
  const now = Date.now()
  const elapsed = now - idleState.startTime
  const totalDuration = idleState.duration
  const expected = Math.floor(elapsed / ENCOUNTER_INTERVAL)
  const missed = Math.max(0, expected - idleState.encounterCount)
  if (missed > 0) {
    logs.value.push({ type: 'info', text: `⏳ 离线期间完成了 ${missed} 次探索，正在结算……`, time: new Date().toLocaleTimeString() })
    for (let i = 0; i < missed; i++) {
      runOfflineEncounter(zone, diff, idleState.encounterCount + i + 1)
    }
    // 离线补算结算后立即同步落盘，防止补算收益丢失
    s.saveData()
  }
  finishIdle()
}

// App.vue 常驻初始化：恢复挂机状态并启动推进
function initIdle() {
  const s = store()
  s.regenerateSpirit()
  const idleState = s.idleExploration
  if (idleState && idleState.isActive) {
    const zone = getZoneById(idleState.zoneId)
    if (zone) {
      selectedZone.value = zone
      selectedDifficultyKey.value = idleState.difficultyKey || 'xiongxian'
      isIdling.value = true
      idleEncounterCount.value = idleState.encounterCount || 0
      idlePlayerDefeated.value = false
      const probe = createPlayerEntity()
      idlePlayerMaxHP.value = probe.stats.maxHealth
      idlePlayerHP.value = probe.stats.maxHealth
      runStats.value = { victories: 0, defeats: 0, spiritStones: 0, cultivation: 0, equipment: 0 }
      logs.value = []
      startIdleTimers()
      processOfflineIdle()
    } else {
      s.stopIdleExploration()
    }
  }
}

const displayLogs = computed(() => (isIdling.value ? logs.value : lastSummary.value?.logs || []))
const canStartIdle = computed(() => {
  const s = store()
  const zone = selectedZone.value
  if (!zone) return false
  const diff = getZoneDifficulty(zone, selectedDifficultyKey.value)
  return s.spiritStones >= diff.spiritCost
})

export function useIdleSystem() {
  return {
    // 状态
    zones,
    selectedZone,
    selectedDifficultyKey,
    isIdling,
    logs,
    displayLogs,
    idleEncounterCount,
    idleProgress,
    idleTimeRemaining,
    lastSummary,
    combatState,
    animState,
    treasureFlash,
    canStartIdle,
    // Build 强度 / 血条
    playerBuildStrength,
    currentRecommendedBuild,
    buildRatio,
    idlePlayerHP,
    idlePlayerMaxHP,
    idlePlayerDefeated,
    // 方法
    setSelectedZone: (z) => { selectedZone.value = z },
    setDifficulty: (k) => { selectedDifficultyKey.value = k },
    startIdle,
    stopIdle,
    initIdle,
    runExploreCombat,
    grantReward,
    showTreasureFlash,
    buildEffectiveZone,
    getZoneDifficulty
  }
}
