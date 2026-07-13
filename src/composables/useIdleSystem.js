import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { zones, getZoneById, getZoneDifficulty } from '../plugins/zones'
import { CombatManager, CombatEntity, CombatType } from '../plugins/combat'
import { getRandomHerb, getRandomOre, getRandomLiquid, getRandomCore, getRandomSpecial } from '../plugins/materials'
import { getAffixesForSlot, setBonuses } from '../plugins/buildSystem'

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
const SCENES = [
  '林间雾气氤氲，你屏息潜行，灵识扫过每一寸草木。',
  '山风呼啸，乱石嶙峋，你踏歌而行，浑然不惧。',
  '洞府幽深，火灵翻涌，炽浪扑面而来。',
  '深渊幽暗，龙吟隐隐，寒意刺骨。',
  '荒原寂寥，白骨皑皑，怨气冲霄。',
  '冰雪封山，琼楼玉宇，朔风如刀割面。',
  '残垣断壁间，仙光若隐若现，似有古人长叹。',
  '混沌虚无，法则崩坏，时空在此处扭曲错位。'
]
const COMBAT_ACTIONS = [
  { type: 'victory', text: '⚡ 你抓住破绽，一击命中要害，霎时暴击伤害炸裂！' },
  { type: 'victory', text: '🔥 剑光连绵，连环三击如疾风骤雨，敌人节节败退！' },
  { type: 'victory', text: '🌀 你身形鬼魅般一晃，轻易避开这记杀招，反手一剑。' },
  { type: 'victory', text: '🛡️ 护体真气一震，将敌人攻势尽数反震回去！' },
  { type: 'victory', text: '🌟 你以绝对修为压制全场，敌人气机为之紊乱！' },
  { type: 'victory', text: '💥 你引动灵力，一掌拍出，山河为之震颤！' }
]
const VICTORY_LINES = [
  (e) => `🗡️ ${e} 轰然倒地，腥血溅落，你悠然收剑入鞘。`,
  (e) => `✨ 你身形一闪，${e} 已授首，清风拂过染血的战袍。`,
  (e) => `🌿 你以四两拨千斤之势，将${e}轻松放倒，神色淡然。`
]
const DEFEAT_LINES = [
  (e, l) => `😱 你被 ${e} 一爪拍飞，气血翻涌，修为折损 ${l}！`,
  (e, l) => `💢 不敌 ${e} 之威，你狼狈遁走，修为受损 ${l}。`,
  (e, l) => `🩸 ${e} 一击洞穿护体真气，你险象环生，折损修为 ${l}。`
]
const FORTUNE_LINES = [
  (n) => `🌀 机缘巧合，你于石缝间发现${n}，此乃天赐！`,
  (n) => `🌿 一株${n}破土而生，你福至心灵将其采下。`,
  (n) => `✨ 奇遇降临，你寻得${n}，周身灵气为之一振！`
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a

function addLog(type, text) {
  logs.value.push({ type, text, time: new Date().toLocaleTimeString() })
  // 控制内存体积：最多保留 400 条
  if (logs.value.length > 400) logs.value = logs.value.slice(-400)
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
const SLOT_NAMES = { weapon: '剑', head: '冠', body: '袍', legs: '裤', feet: '靴', shoulder: '甲', hands: '套', wrist: '腕', necklace: '链', ring1: '戒', ring2: '戒', belt: '带' }
const RARITY_PREFIX = { common: '凡品', uncommon: '良品', rare: '上品', epic: '极品', legendary: '仙品', mythic: '神品' }

function getEquipName(slot, rarity, setId = null) {
  if (setId) {
    const setData = setBonuses.find(s => s.id === setId)
    if (setData) return `${setData.name}·${SLOT_NAMES[slot]}`
  }
  return (RARITY_PREFIX[rarity] || '凡品') + SLOT_NAMES[slot]
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
    stats: {
      attack: Math.floor(effectiveZone.recommendedStats.attack * 0.15 * mult),
      health: Math.floor(effectiveZone.recommendedStats.health * 0.1 * mult),
      defense: Math.floor(effectiveZone.recommendedStats.attack * 0.08 * mult),
      speed: Math.floor(5 * mult)
    },
    affixes,
    setId,
    enhanceLevel: 0,
    value: Math.floor(50 * effectiveZone.difficulty * mult)
  }
}

function generatePet(rarity, effectiveZone) {
  const petNames = ['灵狐', '仙鹤', '青鸾', '玉兔', '玄龟', '朱雀', '白虎', '麒麟']
  return {
    id: Date.now() + Math.random(),
    type: 'pet',
    name: petNames[Math.floor(Math.random() * petNames.length)],
    rarity,
    level: 1,
    stats: {
      attack: Math.floor(effectiveZone.recommendedStats.attack * 0.1),
      defense: Math.floor(effectiveZone.recommendedStats.attack * 0.05),
      health: Math.floor(effectiveZone.recommendedStats.health * 0.05)
    }
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
        rewards.push({ type: 'equipment', name: info.name + '装备', rarity, info })
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
        rewards.push({ type: 'pet', name: info.name, rarity, info })
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
  addLog('info', `【${zone.name}·${diff.label}】第 ${count} 次探索`)
  addLog('info', pick(SCENES))
  const appearType = enemy.tier === 'boss' ? 'reward-epic' : enemy.tier === 'elite' ? 'reward-highlight' : 'info'
  if (enemy.tier === 'boss') addLog('reward-epic', `👑 ${enemy.name} 自虚空中降临，威压如山，天地为之变色！`)
  else if (enemy.tier === 'elite') addLog('reward-highlight', `⚡ 一股凶煞之气逼近——${enemy.name}（精英）横空而出，气势逼人！`)
  else addLog(appearType, `一头${enemy.name}自暗处扑出，獠牙森森，杀意凛然！`)

  if (victory) {
    addLog('victory', pick(VICTORY_LINES)(enemy.name))
    // 1~2 条战斗动作描写
    const actions = 1 + (enemy.tier !== 'normal' ? 1 : 0)
    for (let i = 0; i < actions; i++) {
      const a = pick(COMBAT_ACTIONS); addLog(a.type, a.text)
    }
    rewards.forEach(r => {
      if (r.type === 'equipment' || r.type === 'pet') {
        const info = r.info
        if (info.tier === 'legendary') addLog('reward-legendary', `🔥 金光万丈！获得【${r.name}】，异象冲霄，天地同贺！`)
        else if (info.tier === 'epic') addLog('reward-epic', `🌟 紫气东来！获得【${r.name}】，瑞光环绕！`)
        else if (info.tier === 'highlight') addLog('reward-highlight', `💎 稀有收获：【${r.name}】`)
        else addLog('victory', `获得 ${r.name}`)
      } else if (r.type === 'fortune') {
        addLog('reward-epic', pick(FORTUNE_LINES)(r.material?.name || r.name))
      } else {
        addLog('victory', `获得 ${r.amount} ${r.name}`)
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
    if (s.spirit < diff.spiritCost) {
      addLog('warning', '灵力不足，挂机探索暂停，恢复灵力后可继续。')
      stopIdle()
      return
    }
    s.spirit -= diff.spiritCost
    idleEncounterCount.value++
    const count = idleEncounterCount.value
    const result = await runExploreCombat(effectiveZone, count, true)
    let rewards = []
    let loss = 0
    if (result.victory) {
      rewards = grantReward(effectiveZone, true)
      s.dungeonTotalKills++; s.explorationCount++
      // 奇遇：每 20 次，50% 触发
      if (count % 20 === 0 && Math.random() < 0.5) {
        const fortunePool = [getRandomHerb({ difficulty: 9 }), getRandomOre({ difficulty: 9 }), getRandomLiquid({ difficulty: 9 }), getRandomSpecial()].filter(Boolean)
        const fp = fortunePool[Math.floor(Math.random() * fortunePool.length)]
        if (fp) { s.gainMaterial(fp); rewards.push({ type: 'fortune', amount: 1, name: '奇遇·' + fp.name, material: fp }) }
      }
      runStats.value.victories++
    } else {
      loss = Math.floor(s.cultivation * 0.05)
      s.cultivation = Math.max(0, s.cultivation - loss)
      s.dungeonDeathCount++
      runStats.value.defeats++
    }
    logEncounter(zone, diff, count, result.enemy, result.victory, rewards, loss)
    s.updateIdleExploration({ encounterCount: count, lastEncounterTime: Date.now() })
    s.queueSave()
  } finally {
    isRunning = false
  }
}

// ============ 离线补算（轻量结算，避免卡顿） ============
function runOfflineEncounter(zone, diff, count) {
  const s = store()
  s.regenerateSpirit()
  if (s.spirit < diff.spiritCost) return false
  s.spirit -= diff.spiritCost
  const pAtk = s.baseAttributes.attack + (s.getPetBonus?.attack || 0) + (s.artifactBonuses?.attack || 0)
  const pHp = s.baseAttributes.health + (s.getPetBonus?.health || 0) + (s.artifactBonuses?.health || 0)
  const winChance = Math.min(0.95, Math.max(0.3,
    0.5 + (pAtk - diff.recommendedStats.attack) * 0.02 + (pHp - diff.recommendedStats.health) * 0.002))
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
  runStats.value = { victories: 0, defeats: 0, spiritStones: 0, cultivation: 0, equipment: 0 }
  logs.value = []
  logs.value.push({ type: 'info', text: `开始挂机探索【${selectedZone.value.name}·${diff.label}】，预计 ${durationMinutes} 分钟，每 ${ENCOUNTER_INTERVAL / 1000} 秒一场遭遇`, time: new Date().toLocaleTimeString() })
  startIdleTimers()
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
    logs: [...logs.value]
  }
  s.stopIdleExploration()
  isIdling.value = false
  idleProgress.value = 100
  idleTimeRemaining.value = '已完成'
  if (logs.value.length) logs.value.push({ type: 'info', text: `挂机结束！共探索 ${idleEncounterCount.value} 次，胜 ${runStats.value.victories} / 败 ${runStats.value.defeats}`, time: new Date().toLocaleTimeString() })
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
  return s.spirit >= diff.spiritCost
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
