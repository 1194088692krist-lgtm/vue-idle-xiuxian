<template>
  <div class="zone-selector">
    <!-- 标题 -->
    <div class="exploration-header">
      <div class="header-icon">探索</div>
      <div class="header-info">
        <h2 class="card-title">探索秘境</h2>
        <p class="card-subtitle">挑战八大秘境，寻找机缘造化</p>
      </div>
    </div>

    <!-- 难度筛选 -->
    <div class="filter-bar">
      <div
        v-for="f in filters"
        :key="f.key"
        class="filter-chip"
        :class="{ active: activeFilter === f.key }"
        @click="activeFilter = f.key"
      >
        {{ f.label }}
      </div>
    </div>

    <!-- 区域网格 -->
    <div class="zones-grid">
      <div
        v-for="zone in filteredZones"
        :key="zone.id"
        class="zone-card"
        :class="{
          locked: !canEnter(zone),
          selected: selectedZone?.id === zone.id
        }"
        @click="selectZone(zone)"
      >
        <div class="zone-banner" :style="{ borderTopColor: zone.difficultyColor }">
          <div class="zone-icon-area">
            <span class="zone-icon">{{ getZoneIcon(zone.id) }}</span>
          </div>
          <div class="zone-difficulty-badge" :style="{ backgroundColor: zone.difficultyColor }">
            {{ zone.difficultyLabel }}
          </div>
        </div>
        <div class="zone-body">
          <div class="zone-name">{{ zone.name }}</div>
          <div class="zone-meta">
            <span class="meta-item">Lv.{{ zone.minLevel }}+</span>
            <span class="meta-item">x{{ zone.rewardMultiplier }}奖励</span>
          </div>
          <div class="zone-monsters">
            <span v-for="m in zone.monsters" :key="m" class="monster-tag">{{ m }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中区域详情 -->
    <div v-if="selectedZone" class="zone-detail glass-card">
      <div class="detail-header">
        <div>
          <h3 class="detail-title">{{ getZoneIcon(selectedZone.id) }} {{ selectedZone.name }}</h3>
          <p class="detail-desc">{{ selectedZone.description }}</p>
        </div>
        <div class="difficulty-badge" :style="{ backgroundColor: selectedZone.difficultyColor }">
          {{ selectedZone.difficultyLabel }}
        </div>
      </div>

      <div class="detail-stats">
        <div class="stat-row">
          <span class="stat-label">推荐等级</span>
          <span class="stat-value">Lv.{{ selectedZone.minLevel }}+</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">推荐攻击</span>
          <span class="stat-value">{{ selectedZone.recommendedStats.attack }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">推荐生命</span>
          <span class="stat-value">{{ selectedZone.recommendedStats.health }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">奖励倍率</span>
          <span class="stat-value gold-text">x{{ selectedZone.rewardMultiplier }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">灵力消耗</span>
          <span class="stat-value">50 灵力/次</span>
        </div>
      </div>

      <!-- 奖励预览 -->
      <div class="rewards-preview">
        <div class="rewards-title">可能获得的报酬</div>
        <div class="rewards-list">
          <div v-for="rw in selectedZone.rewards" :key="rw.name" class="reward-row">
            <span class="reward-name">{{ rw.name }}</span>
            <div class="reward-bar-wrap">
              <div class="reward-bar" :style="{ width: rw.chance * 100 + '%' }"></div>
            </div>
            <span class="reward-chance">{{ (rw.chance * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>

      <!-- 战斗动画区域 -->
      <div v-if="combatState.inCombat && combatState.combatManager" class="combat-area">
        <div class="combat-round">
          第 {{ combatState.combatManager.round }} / {{ combatState.combatManager.maxRounds }} 回合
        </div>
        <div class="combat-scene">
          <div class="combatant player" :class="{ attack: animState.playerAttack, hurt: animState.playerHurt }">
            <div class="combatant-name">{{ combatState.combatManager.player.name }}</div>
            <div class="combatant-avatar player-avatar">
              {{ combatState.combatManager.player.name[0] }}
            </div>
            <div class="hp-bar">
              <div
                class="hp-fill"
                :style="{
                  width:
                    (combatState.combatManager.player.currentHealth /
                      combatState.combatManager.player.stats.maxHealth) *
                    100 + '%'
                }"
              ></div>
            </div>
            <div class="hp-text">
              {{ Math.ceil(combatState.combatManager.player.currentHealth) }} /
              {{ combatState.combatManager.player.stats.maxHealth }}
            </div>
          </div>
          <div class="vs-text">VS</div>
          <div class="combatant enemy" :class="{ attack: animState.enemyAttack, hurt: animState.enemyHurt }">
            <div class="combatant-name">{{ combatState.combatManager.enemy.name }}</div>
            <div class="combatant-avatar enemy-avatar">
              {{ combatState.combatManager.enemy.name[0] }}
            </div>
            <div class="hp-bar">
              <div
                class="hp-fill enemy-hp"
                :style="{
                  width:
                    (combatState.combatManager.enemy.currentHealth /
                      combatState.combatManager.enemy.stats.maxHealth) *
                    100 + '%'
                }"
              ></div>
            </div>
            <div class="hp-text">
              {{ Math.ceil(combatState.combatManager.enemy.currentHealth) }} /
              {{ combatState.combatManager.enemy.stats.maxHealth }}
            </div>
          </div>
        </div>
      </div>

      <!-- 探索按钮 -->
      <div v-if="!combatState.inCombat" class="action-bar">
        <button
          class="btn btn-primary"
          :disabled="playerStore.spirit < 50 || isIdling"
          @click="startExplore"
        >
          开始探索 (50灵力)
        </button>
      </div>

      <!-- 挂机探索区域 -->
      <div v-if="!combatState.inCombat" class="idle-section">
        <div class="idle-title">挂机探索</div>
        <div v-if="!isIdling" class="idle-options">
          <div
            v-for="dur in idleDurations"
            :key="dur.minutes"
            class="idle-card"
            :class="{ selected: selectedDuration === dur.minutes }"
            @click="selectedDuration = dur.minutes"
          >
            <div class="dur-time">{{ dur.minutes }}分钟</div>
            <div class="dur-info">{{ dur.encounters }}次探索</div>
            <div class="dur-cost">{{ dur.encounters * 50 }}灵力</div>
          </div>
        </div>
        <button
          v-if="!isIdling"
          class="btn btn-success"
          :disabled="playerStore.spirit < 50 || !selectedZone"
          @click="startIdle"
        >
          开始挂机 ({{ selectedDuration }}分钟)
        </button>
        <!-- 挂机进行中 -->
        <div v-if="isIdling" class="idle-running">
          <div class="idle-status">
            <div class="idle-timer">{{ idleTimeRemaining }}</div>
            <div class="idle-progress-bar">
              <div class="idle-progress-fill" :style="{ width: idleProgress + '%' }"></div>
            </div>
            <div class="idle-count">已完成 {{ idleEncounterCount }} 次探索</div>
          </div>
          <button class="btn btn-danger" @click="stopIdle">停止挂机</button>
        </div>
      </div>
    </div>

    <!-- 挂机日志区域 -->
    <div v-if="isIdling || lastIdleLog" class="idle-log-section glass-card">
      <div class="idle-log-header">
        <h3 class="section-title">{{ isIdling ? '挂机日志（实时）' : '上次挂机日志' }}</h3>
        <span v-if="lastIdleLog && !isIdling" class="log-meta">
          {{ lastIdleLog.zoneName }} · {{ lastIdleLog.duration }}分钟 ·
          {{ lastIdleLog.encounters }}次探索
        </span>
      </div>
      <div class="idle-log-body" ref="idleLogRef">
        <div
          v-for="(log, idx) in displayIdleLogs"
          :key="idx"
          class="log-line"
          :class="log.type"
        >
          <span v-if="log.type === 'reward-highlight'" class="log-highlight">
            {{ log.text }}
          </span>
          <span v-else-if="log.type === 'reward-epic'" class="log-epic">
            {{ log.text }}
          </span>
          <span v-else-if="log.type === 'reward-legendary'" class="log-legendary">
            {{ log.text }}
          </span>
          <span v-else>
            {{ log.text }}
          </span>
        </div>
      </div>
      <!-- 挂机统计 -->
      <div v-if="lastIdleLog && !isIdling" class="idle-summary">
        <div class="summary-item">
          <span class="summary-label">总探索</span>
          <span class="summary-value">{{ lastIdleLog.encounters }}次</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">胜利</span>
          <span class="summary-value green">{{ lastIdleLog.victories }}次</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">失败</span>
          <span class="summary-value red">{{ lastIdleLog.defeats }}次</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">获得灵石</span>
          <span class="summary-value gold">{{ lastIdleLog.totalStones }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">获得修为</span>
          <span class="summary-value">{{ lastIdleLog.totalCultivation }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">获得装备</span>
          <span class="summary-value">{{ lastIdleLog.totalEquipment }}</span>
        </div>
      </div>
    </div>

    <!-- 宝物高亮弹窗 -->
    <transition name="flash">
      <div v-if="treasureFlash.show" class="treasure-flash" :class="treasureFlash.tier">
        <div class="flash-content">
          <div class="flash-icon">{{ treasureFlash.icon }}</div>
          <div class="flash-title">{{ treasureFlash.title }}</div>
          <div class="flash-desc">{{ treasureFlash.desc }}</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { usePlayerStore } from '../stores/player'
import { zones } from '../plugins/zones'
import { CombatManager, CombatEntity, CombatType } from '../plugins/combat'
import { getRealmName } from '../plugins/realm'

const playerStore = usePlayerStore()

// 筛选
const filters = [
  { key: 'all', label: '全部' },
  { key: 'easy', label: '入门' },
  { key: 'normal', label: '普通' },
  { key: 'hard', label: '困难+' }
]
const activeFilter = ref('all')

const filteredZones = computed(() => {
  if (activeFilter.value === 'all') return zones
  if (activeFilter.value === 'easy') return zones.filter(z => z.difficulty <= 2)
  if (activeFilter.value === 'normal') return zones.filter(z => z.difficulty === 3 || z.difficulty === 4)
  if (activeFilter.value === 'hard') return zones.filter(z => z.difficulty >= 5)
  return zones
})

const selectedZone = ref(null)

const canEnter = (zone) => playerStore.level >= zone.minLevel

const selectZone = (zone) => {
  if (!canEnter(zone)) return
  selectedZone.value = zone
}

const getZoneIcon = (id) => {
  const icons = {
    forest_edge: '🌲', misty_valley: '🌫️', phoenix_cave: '🔥', dragon_abyss: '🐉',
    ghost_wasteland: '💀', ice_palace: '❄️', immortal_ruins: '🏛️', chaos_realm: '🌀'
  }
  return icons[id] || '⛰️'
}

// ========== 战斗系统 ==========
const combatState = ref({
  inCombat: false,
  combatManager: null
})
const animState = ref({ playerAttack: false, playerHurt: false, enemyAttack: false, enemyHurt: false })

const sleep = ms => new Promise(r => setTimeout(r, ms))

// 创建玩家战斗实体
const createPlayerEntity = () => {
  const baseStats = {
    health: playerStore.baseAttributes.health,
    damage: playerStore.baseAttributes.attack,
    defense: playerStore.baseAttributes.defense,
    speed: playerStore.baseAttributes.speed,
    critRate: playerStore.combatAttributes.critRate,
    comboRate: playerStore.combatAttributes.comboRate,
    counterRate: playerStore.combatAttributes.counterRate,
    stunRate: playerStore.combatAttributes.stunRate,
    dodgeRate: playerStore.combatAttributes.dodgeRate,
    vampireRate: playerStore.combatAttributes.vampireRate,
    critResist: playerStore.combatResistance.critResist,
    comboResist: playerStore.combatResistance.comboResist,
    counterResist: playerStore.combatResistance.counterResist,
    stunResist: playerStore.combatResistance.stunResist,
    dodgeResist: playerStore.combatResistance.dodgeResist,
    vampireResist: playerStore.combatResistance.vampireResist,
    healBoost: playerStore.specialAttributes.healBoost,
    critDamageBoost: playerStore.specialAttributes.critDamageBoost,
    critDamageReduce: playerStore.specialAttributes.critDamageReduce,
    finalDamageBoost: playerStore.specialAttributes.finalDamageBoost,
    finalDamageReduce: playerStore.specialAttributes.finalDamageReduce,
    combatBoost: playerStore.specialAttributes.combatBoost,
    resistanceBoost: playerStore.specialAttributes.resistanceBoost,
    spiritDamage: playerStore.spirit * 0.1,
    maxHealth: playerStore.baseAttributes.health
  }
  // 应用灵宠加成
  const petBonus = playerStore.getPetBonus
  if (petBonus) {
    baseStats.damage += petBonus.attack || 0
    baseStats.health += petBonus.health || 0
    baseStats.maxHealth = baseStats.health
    baseStats.defense += petBonus.defense || 0
    baseStats.speed += petBonus.speed || 0
  }
  // 应用装备加成
  if (playerStore.artifactBonuses) {
    const ab = playerStore.artifactBonuses
    baseStats.damage += ab.attack || 0
    baseStats.health += ab.health || 0
    baseStats.maxHealth = baseStats.health
    baseStats.defense += ab.defense || 0
    baseStats.speed += ab.speed || 0
  }
  return new CombatEntity(playerStore.name, playerStore.level, baseStats, playerStore.realm)
}

// 生成区域敌人（基于zone推荐属性，降低难度确保可通过）
const generateZoneEnemy = (zone, encounterCount) => {
  const isBoss = encounterCount > 0 && encounterCount % 10 === 0
  const isElite = encounterCount > 0 && encounterCount % 5 === 0 && !isBoss
  const type = isBoss ? CombatType.BOSS : isElite ? CombatType.ELITE : CombatType.NORMAL

  // 基于zone推荐属性生成敌人，敌人属性为推荐值的60%，确保玩家可击败
  const diff = zone.difficulty
  const baseStats = {
    health: Math.floor(zone.recommendedStats.health * 0.6),
    damage: Math.floor(zone.recommendedStats.attack * 0.4),
    defense: Math.floor(zone.recommendedStats.attack * 0.1),
    speed: 5 + diff * 2,
    critRate: Math.min(0.15, 0.02 + diff * 0.01),
    comboRate: Math.min(0.1, 0.01 + diff * 0.005),
    counterRate: Math.min(0.1, 0.01 + diff * 0.005),
    stunRate: Math.min(0.08, 0.01 + diff * 0.003),
    dodgeRate: Math.min(0.12, 0.02 + diff * 0.008),
    vampireRate: Math.min(0.08, 0.01 + diff * 0.003),
    critResist: Math.min(0.1, 0.01 + diff * 0.003),
    comboResist: Math.min(0.1, 0.01 + diff * 0.003),
    counterResist: Math.min(0.1, 0.01 + diff * 0.003),
    stunResist: Math.min(0.1, 0.01 + diff * 0.003),
    dodgeResist: Math.min(0.1, 0.01 + diff * 0.003),
    vampireResist: Math.min(0.1, 0.01 + diff * 0.003),
    healBoost: 0,
    critDamageBoost: 0.3,
    critDamageReduce: 0,
    finalDamageBoost: Math.min(0.1, diff * 0.01),
    finalDamageReduce: Math.min(0.1, diff * 0.01),
    combatBoost: 0,
    resistanceBoost: 0,
    maxHealth: Math.floor(zone.recommendedStats.health * 0.6)
  }

  if (isElite) {
    baseStats.health = Math.floor(baseStats.health * 1.5)
    baseStats.maxHealth = baseStats.health
    baseStats.damage = Math.floor(baseStats.damage * 1.3)
  } else if (isBoss) {
    baseStats.health = Math.floor(baseStats.health * 2.5)
    baseStats.maxHealth = baseStats.health
    baseStats.damage = Math.floor(baseStats.damage * 1.8)
  }

  const monsterName = zone.monsters[Math.floor(Math.random() * zone.monsters.length)]
  return new CombatEntity(monsterName, zone.minLevel, baseStats, zone.difficultyLabel)
}

// 执行一次探索战斗
const runExploreCombat = async (zone, encounterCount, isIdleMode = false) => {
  const playerEntity = createPlayerEntity()
  const enemy = generateZoneEnemy(zone, encounterCount)
  const manager = new CombatManager(playerEntity, enemy)
  manager.start()

  if (!isIdleMode) {
    combatState.value = { inCombat: true, combatManager: manager }
  }

  // 自动战斗
  while (manager.state === 'in_progress') {
    const result = manager.executeTurn()

    if (!isIdleMode && result) {
      // 动画效果
      if (result.results && result.results.length > 0) {
        const firstAttack = result.results[0]
        if (firstAttack.attacker === playerEntity.name) {
          animState.value.playerAttack = true
          animState.value.enemyHurt = true
          await sleep(400)
          animState.value.playerAttack = false
          animState.value.enemyHurt = false
        } else {
          animState.value.enemyAttack = true
          animState.value.playerHurt = true
          await sleep(400)
          animState.value.enemyAttack = false
          animState.value.playerHurt = false
        }
      }
      if (!combatState.value.inCombat) break
      await sleep(300)
    }

    if (!result) break
    if (result.state === 'victory') {
      return { victory: true, manager, enemy }
    } else if (result.state === 'defeat') {
      return { victory: false, manager, enemy }
    }
  }
  return { victory: false, manager, enemy }
}

// 奖励品质颜色和描述
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

// 发放奖励
const grantReward = (zone, isIdleMode = false, logs) => {
  const rewards = []
  for (const rw of zone.rewards) {
    if (Math.random() < rw.chance) {
      const amount = Array.isArray(rw.amount)
        ? Math.floor(Math.random() * (rw.amount[1] - rw.amount[0] + 1)) + rw.amount[0]
        : rw.amount || 1
      const multiplied = Math.floor(amount * zone.rewardMultiplier)

      if (rw.type === 'spirit_stone') {
        playerStore.spiritStones += multiplied
        rewards.push({ type: 'spirit_stone', amount: multiplied, name: '灵石' })
      } else if (rw.type === 'herb') {
        for (let i = 0; i < multiplied; i++) {
          playerStore.herbs.push({ id: Date.now() + i, name: '灵草', rarity: 'common' })
        }
        rewards.push({ type: 'herb', amount: multiplied, name: '灵草' })
      } else if (rw.type === 'cultivation') {
        playerStore.cultivate(multiplied)
        rewards.push({ type: 'cultivation', amount: multiplied, name: '修为' })
      } else if (rw.type === 'equipment') {
        const rarity = rw.rarity[Math.floor(Math.random() * rw.rarity.length)]
        const equip = generateEquipment(rarity, zone)
        playerStore.items.push(equip)
        playerStore.itemsFound++
        const info = rarityInfo[rarity] || rarityInfo.common
        rewards.push({ type: 'equipment', name: info.name + '装备', rarity, info })
      } else if (rw.type === 'pet') {
        const rarity = rw.rarity[Math.floor(Math.random() * rw.rarity.length)]
        const pet = generatePet(rarity, zone)
        playerStore.items.push(pet)
        playerStore.itemsFound++
        const info = rarityInfo[rarity] || rarityInfo.mortal
        rewards.push({ type: 'pet', name: info.name, rarity, info })
      }
    }
  }
  return rewards
}

// 生成装备
const generateEquipment = (rarity, zone) => {
  const slots = ['weapon', 'head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'necklace', 'ring1', 'ring2', 'belt']
  const slot = slots[Math.floor(Math.random() * slots.length)]
  const rarityMultipliers = {
    common: 1, uncommon: 1.3, rare: 1.8, epic: 2.5, legendary: 4, mythic: 7
  }
  const mult = rarityMultipliers[rarity] || 1
  return {
    id: Date.now() + Math.random(),
    type: 'equipment',
    slot,
    name: getEquipName(slot, rarity),
    quality: rarity,
    stats: {
      attack: Math.floor(zone.recommendedStats.attack * 0.15 * mult),
      health: Math.floor(zone.recommendedStats.health * 0.1 * mult),
      defense: Math.floor(zone.recommendedStats.attack * 0.08 * mult),
      speed: Math.floor(5 * mult)
    },
    enhanceLevel: 0,
    value: Math.floor(50 * zone.difficulty * mult)
  }
}

const getEquipName = (slot, rarity) => {
  const slotNames = { weapon: '剑', head: '冠', body: '袍', legs: '裤', feet: '靴', shoulder: '甲', hands: '套', wrist: '腕', necklace: '链', ring1: '戒', ring2: '戒', belt: '带' }
  const rarityPrefix = { common: '', uncommon: '精良', rare: '稀有', epic: '史诗', legendary: '传说', mythic: '仙器' }
  return (rarityPrefix[rarity] || '') + slotNames[slot]
}

// 生成灵宠
const generatePet = (rarity, zone) => {
  const petNames = ['灵狐', '仙鹤', '青鸾', '玉兔', '玄龟', '朱雀', '白虎', '麒麟']
  return {
    id: Date.now() + Math.random(),
    type: 'pet',
    name: petNames[Math.floor(Math.random() * petNames.length)],
    rarity,
    level: 1,
    stats: {
      attack: Math.floor(zone.recommendedStats.attack * 0.1),
      defense: Math.floor(zone.recommendedStats.attack * 0.05),
      health: Math.floor(zone.recommendedStats.health * 0.05)
    }
  }
}

// ========== 宝物高亮弹窗 ==========
const treasureFlash = ref({ show: false, tier: '', title: '', desc: '', icon: '' })
let flashTimer = null

const showTreasureFlash = (reward) => {
  if (flashTimer) clearTimeout(flashTimer)
  let tier = 'normal', icon = '', title = '', desc = ''

  if (reward.type === 'equipment' || reward.type === 'pet') {
    const info = reward.info || rarityInfo[reward.rarity] || rarityInfo.common
    tier = info.tier
    icon = reward.type === 'pet' ? '🐉' : '⚔️'

    if (tier === 'legendary') {
      title = '神品降临！'
      desc = `获得${info.name}${reward.type === 'pet' ? '' : '装备'}！天降异象，金光万丈！`
    } else if (tier === 'epic') {
      title = '极品宝物！'
      desc = `获得${info.name}${reward.type === 'pet' ? '' : '装备'}！紫气东来！`
    } else if (tier === 'highlight') {
      title = '稀有收获！'
      desc = `获得${info.name}${reward.type === 'pet' ? '' : '装备'}！`
    } else {
      return // 普通品质不弹窗
    }
  } else {
    return
  }

  treasureFlash.value = { show: true, tier, title, desc, icon }
  flashTimer = setTimeout(() => {
    treasureFlash.value.show = false
  }, tier === 'legendary' ? 3000 : tier === 'epic' ? 2500 : 2000)
}

// ========== 手动探索 ==========
const startExplore = async () => {
  if (!selectedZone.value || playerStore.spirit < 50 || combatState.value.inCombat || isIdling.value) return
  playerStore.spirit -= 50
  playerStore.explorationCount++
  playerStore.queueSave()

  const result = await runExploreCombat(selectedZone.value, 0, false)

  if (result.victory) {
    const rewards = grantReward(selectedZone.value, false, null)
    playerStore.dungeonTotalKills++
    playerStore.queueSave()
    // 高亮奖励
    rewards.forEach(r => showTreasureFlash(r))
  } else {
    // 失败惩罚：损失少量修为
    const loss = Math.floor(playerStore.cultivation * 0.1)
    playerStore.cultivation = Math.max(0, playerStore.cultivation - loss)
    playerStore.dungeonDeathCount++
    playerStore.queueSave()
  }

  combatState.value = { inCombat: false, combatManager: null }
}

// ========== 挂机探索 ==========
const idleDurations = [
  { minutes: 5, encounters: 60 },
  { minutes: 10, encounters: 120 },
  { minutes: 15, encounters: 180 },
  { minutes: 20, encounters: 240 },
  { minutes: 30, encounters: 360 }
]
const selectedDuration = ref(5)
const isIdling = ref(false)
const idleEncounterCount = ref(0)
const idleTimeRemaining = ref('')
const idleProgress = ref(0)
const currentIdleLogs = ref([])
const lastIdleLog = ref(null)
const idleLogRef = ref(null)

let idleTimer = null
let idleInterval = null
let idleStartTime = 0
let idleTotalMs = 0

const displayIdleLogs = computed(() => {
  if (isIdling.value) return currentIdleLogs.value
  return lastIdleLog.value?.logs || []
})

const startIdle = () => {
  if (!selectedZone.value || playerStore.spirit < 50) return
  isIdling.value = true
  idleEncounterCount.value = 0
  currentIdleLogs.value = []
  idleStartTime = Date.now()
  idleTotalMs = selectedDuration.value * 60 * 1000

  currentIdleLogs.value.push({ type: 'info', text: `开始挂机探索【${selectedZone.value.name}】，预计 ${selectedDuration.value} 分钟` })

  // 每5秒执行一次探索
  idleInterval = setInterval(async () => {
    await runIdleEncounter()
  }, 5000)

  // 每秒更新倒计时
  idleTimer = setInterval(() => {
    const elapsed = Date.now() - idleStartTime
    const remaining = Math.max(0, idleTotalMs - elapsed)
    idleProgress.value = (elapsed / idleTotalMs) * 100

    const min = Math.floor(remaining / 60000)
    const sec = Math.floor((remaining % 60000) / 1000)
    idleTimeRemaining.value = `${min}:${String(sec).padStart(2, '0')}`

    if (remaining <= 0) {
      finishIdle()
    }
  }, 1000)

  // 初始倒计时
  const min = selectedDuration.value
  idleTimeRemaining.value = `${min}:00`
}

const runIdleEncounter = async () => {
  if (!isIdling.value || !selectedZone.value) return
  if (playerStore.spirit < 50) {
    currentIdleLogs.value.push({ type: 'warning', text: '灵力不足，挂机探索停止' })
    finishIdle()
    return
  }

  playerStore.spirit -= 50
  idleEncounterCount.value++
  const count = idleEncounterCount.value

  const result = await runExploreCombat(selectedZone.value, count, true)

  if (result.victory) {
    const rewards = grantReward(selectedZone.value, true, null)
    playerStore.dungeonTotalKills++
    playerStore.explorationCount++

    // 构建日志
    const enemyName = result.enemy.name
    let logText = `[${count}] 击败${enemyName}`
    if (rewards.length > 0) {
      const rewardStrs = rewards.map(r => {
        if (r.type === 'equipment' || r.type === 'pet') {
          return `${r.name}`
        }
        return `${r.amount}${r.name}`
      })
      logText += `，获得：${rewardStrs.join('、')}`

      // 根据品质设置日志类型
      for (const r of rewards) {
        if (r.type === 'equipment' || r.type === 'pet') {
          const tier = r.info?.tier || 'normal'
          if (tier === 'legendary') {
            currentIdleLogs.value.push({ type: 'reward-legendary', text: `🌟【神品降临】获得${r.name}！金光万丈！` })
            showTreasureFlash(r)
          } else if (tier === 'epic') {
            currentIdleLogs.value.push({ type: 'reward-epic', text: `✨【极品宝物】获得${r.name}！紫气东来！` })
            showTreasureFlash(r)
          } else if (tier === 'highlight') {
            currentIdleLogs.value.push({ type: 'reward-highlight', text: `🎉 获得${r.name}` })
          }
        }
      }
    } else {
      logText += `，无掉落`
    }
    currentIdleLogs.value.push({ type: 'victory', text: logText })
  } else {
    const loss = Math.floor(playerStore.cultivation * 0.05)
    playerStore.cultivation = Math.max(0, playerStore.cultivation - loss)
    playerStore.dungeonDeathCount++
    currentIdleLogs.value.push({ type: 'defeat', text: `[${count}] 被${result.enemy.name}击败，损失${loss}修为` })
  }

  playerStore.queueSave()

  // 自动滚动到底部
  nextTick(() => {
    if (idleLogRef.value) {
      idleLogRef.value.scrollTop = idleLogRef.value.scrollHeight
    }
  })
}

const finishIdle = () => {
  if (!isIdling.value) return
  if (idleInterval) clearInterval(idleInterval)
  if (idleTimer) clearInterval(idleTimer)

  // 保存上次挂机日志
  const summary = {
    zoneName: selectedZone.value.name,
    duration: selectedDuration.value,
    encounters: idleEncounterCount.value,
    victories: currentIdleLogs.value.filter(l => l.type === 'victory').length,
    defeats: currentIdleLogs.value.filter(l => l.type === 'defeat').length,
    totalStones: 0,
    totalCultivation: 0,
    totalEquipment: 0,
    logs: [...currentIdleLogs.value]
  }
  lastIdleLog.value = summary

  isIdling.value = false
  idleProgress.value = 100
  idleTimeRemaining.value = '已完成'
  currentIdleLogs.value.push({ type: 'info', text: `挂机结束！共探索 ${summary.encounters} 次` })
}

const stopIdle = () => {
  finishIdle()
}

onUnmounted(() => {
  if (idleInterval) clearInterval(idleInterval)
  if (idleTimer) clearInterval(idleTimer)
  if (flashTimer) clearTimeout(flashTimer)
  if (combatState.value.inCombat) {
    combatState.value = { inCombat: false, combatManager: null }
  }
})
</script>

<style scoped>
.zone-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exploration-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.15), rgba(218, 165, 32, 0.08));
  border-radius: 12px;
}
.header-icon {
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #8B4513, #DAA520);
  border-radius: 12px;
  font-size: 14px;
  color: #fff;
  font-weight: bold;
}
.card-title {
  margin: 0;
  font-size: 20px;
  color: var(--color-accent-gold, #DAA520);
}
.card-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #888;
}

/* 筛选 */
.filter-bar {
  display: flex;
  gap: 8px;
  padding: 0 4px;
}
.filter-chip {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}
.filter-chip.active {
  background: linear-gradient(135deg, #8B4513, #DAA520);
  border-color: #DAA520;
  color: #fff;
}

/* 区域网格 */
.zones-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.zone-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}
.zone-card:hover:not(.locked) {
  transform: translateY(-2px);
  border-color: rgba(218, 165, 32, 0.4);
}
.zone-card.selected {
  border-color: #DAA520;
  box-shadow: 0 0 12px rgba(218, 165, 32, 0.3);
}
.zone-card.locked {
  opacity: 0.4;
  cursor: not-allowed;
}
.zone-banner {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 3px solid;
  position: relative;
  background: rgba(0, 0, 0, 0.3);
}
.zone-icon-area {
  font-size: 28px;
}
.zone-difficulty-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  color: #fff;
  font-weight: bold;
}
.zone-body {
  padding: 8px 10px;
}
.zone-name {
  font-size: 14px;
  font-weight: bold;
  color: #DAA520;
  margin-bottom: 4px;
}
.zone-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}
.meta-item {
  font-size: 11px;
  color: #888;
}
.zone-monsters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.monster-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: #aaa;
}

/* 详情 */
.zone-detail {
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.detail-title {
  margin: 0 0 4px;
  font-size: 18px;
  color: #DAA520;
}
.detail-desc {
  margin: 0;
  font-size: 13px;
  color: #888;
  max-width: 70%;
}
.difficulty-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #fff;
  font-weight: bold;
}
.detail-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-size: 13px;
}
.stat-label { color: #888; }
.stat-value { color: #fff; font-weight: bold; }
.gold-text { color: #DAA520; }

/* 奖励预览 */
.rewards-preview {
  margin-bottom: 12px;
}
.rewards-title {
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}
.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.reward-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.reward-name {
  width: 80px;
  color: #ccc;
}
.reward-bar-wrap {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  overflow: hidden;
}
.reward-bar {
  height: 100%;
  background: linear-gradient(90deg, #8B4513, #DAA520);
  border-radius: 3px;
}
.reward-chance {
  width: 36px;
  text-align: right;
  color: #888;
}

/* 战斗区域 */
.combat-area {
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin-bottom: 12px;
}
.combat-round {
  text-align: center;
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}
.combat-scene {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 12px;
}
.combatant {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 45%;
}
.combatant-name {
  font-size: 12px;
  color: #ccc;
}
.combatant-avatar {
  width: 50px; height: 50px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  font-weight: bold;
}
.player-avatar {
  background: linear-gradient(135deg, #1E90FF, #4169E1);
  color: #fff;
}
.enemy-avatar {
  background: linear-gradient(135deg, #8B0000, #FF4500);
  color: #fff;
}
.hp-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
}
.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #2E7D32, #66BB6A);
  transition: width 0.3s;
}
.enemy-hp {
  background: linear-gradient(90deg, #C62828, #EF5350);
}
.hp-text {
  font-size: 10px;
  color: #888;
}
.vs-text {
  font-size: 14px;
  color: #DAA520;
  font-weight: bold;
}
.combatant.attack .combatant-avatar {
  animation: attackAnim 0.4s ease;
}
.combatant.hurt .combatant-avatar {
  animation: hurtAnim 0.4s ease;
}
@keyframes attackAnim {
  0% { transform: scale(1); }
  50% { transform: scale(1.2) translateX(10px); }
  100% { transform: scale(1); }
}
@keyframes hurtAnim {
  0%, 100% { filter: none; }
  50% { filter: brightness(2) hue-rotate(-30deg); }
}

/* 按钮 */
.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-primary {
  background: linear-gradient(135deg, #8B4513, #DAA520);
  color: #fff;
}
.btn-success {
  background: linear-gradient(135deg, #2E7D32, #66BB6A);
  color: #fff;
}
.btn-danger {
  background: linear-gradient(135deg, #C62828, #EF5350);
  color: #fff;
}

/* 挂机探索 */
.idle-section {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 12px;
}
.idle-title {
  font-size: 15px;
  color: #DAA520;
  margin-bottom: 8px;
  font-weight: bold;
}
.idle-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}
.idle-card {
  padding: 8px 4px;
  text-align: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.idle-card.selected {
  border-color: #DAA520;
  background: rgba(218, 165, 32, 0.1);
}
.dur-time {
  font-size: 13px;
  color: #fff;
  font-weight: bold;
}
.dur-info {
  font-size: 10px;
  color: #888;
  margin-top: 2px;
}
.dur-cost {
  font-size: 10px;
  color: #DAA520;
}
.idle-running {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.idle-status {
  text-align: center;
}
.idle-timer {
  font-size: 28px;
  font-weight: bold;
  color: #DAA520;
  font-family: monospace;
}
.idle-progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  overflow: hidden;
  margin: 8px 0;
}
.idle-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2E7D32, #66BB6A);
  transition: width 0.5s;
}
.idle-count {
  font-size: 13px;
  color: #888;
}

/* 挂机日志 */
.idle-log-section {
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.idle-log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.section-title {
  margin: 0;
  font-size: 15px;
  color: #DAA520;
}
.log-meta {
  font-size: 12px;
  color: #888;
}
.idle-log-body {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.log-line {
  font-size: 12px;
  padding: 3px 6px;
  border-radius: 4px;
  line-height: 1.5;
}
.log-line.victory {
  color: #66BB6A;
}
.log-line.defeat {
  color: #EF5350;
}
.log-line.info {
  color: #58a6ff;
}
.log-line.warning {
  color: #f0883e;
}
.log-highlight {
  color: #4488ff;
  font-weight: bold;
  background: rgba(68, 136, 255, 0.1);
  border-radius: 4px;
  padding: 2px 6px;
  display: block;
}
.log-epic {
  color: #aa44ff;
  font-weight: bold;
  background: rgba(170, 68, 255, 0.15);
  border-radius: 4px;
  padding: 2px 6px;
  display: block;
  animation: epicGlow 1s ease;
}
.log-legendary {
  color: #FFD700;
  font-weight: bold;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 4px;
  padding: 4px 6px;
  display: block;
  border: 1px solid rgba(255, 215, 0, 0.5);
  animation: legendaryGlow 1.5s ease;
}
@keyframes epicGlow {
  0% { box-shadow: 0 0 0 rgba(170, 68, 255, 0); }
  50% { box-shadow: 0 0 12px rgba(170, 68, 255, 0.6); }
  100% { box-shadow: 0 0 0 rgba(170, 68, 255, 0); }
}
@keyframes legendaryGlow {
  0% { box-shadow: 0 0 0 rgba(255, 215, 0, 0); transform: scale(1); }
  30% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); transform: scale(1.02); }
  100% { box-shadow: 0 0 0 rgba(255, 215, 0, 0); transform: scale(1); }
}

/* 挂机统计 */
.idle-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.summary-item {
  text-align: center;
}
.summary-label {
  display: block;
  font-size: 10px;
  color: #888;
}
.summary-value {
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}
.summary-value.green { color: #66BB6A; }
.summary-value.red { color: #EF5350; }
.summary-value.gold { color: #DAA520; }

/* 宝物高亮弹窗 */
.treasure-flash {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  pointer-events: none;
}
.flash-content {
  text-align: center;
  padding: 24px 32px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
}
.flash-icon {
  font-size: 48px;
  margin-bottom: 8px;
}
.flash-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}
.flash-desc {
  font-size: 14px;
  color: #ccc;
}
.treasure-flash.highlight .flash-content {
  border: 2px solid #4488ff;
  box-shadow: 0 0 30px rgba(68, 136, 255, 0.6);
}
.treasure-flash.highlight .flash-title {
  color: #4488ff;
}
.treasure-flash.epic .flash-content {
  border: 2px solid #aa44ff;
  box-shadow: 0 0 40px rgba(170, 68, 255, 0.8);
  animation: epicPulse 2.5s ease;
}
.treasure-flash.epic .flash-title {
  color: #aa44ff;
}
.treasure-flash.legendary .flash-content {
  border: 2px solid #FFD700;
  box-shadow: 0 0 60px rgba(255, 215, 0, 1);
  animation: legendaryPulse 3s ease;
  background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(50,30,0,0.95));
}
.treasure-flash.legendary .flash-title {
  color: #FFD700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
}
.treasure-flash.legendary .flash-icon {
  animation: spinFlash 3s ease;
}
@keyframes epicPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(170, 68, 255, 0.4); }
  50% { box-shadow: 0 0 50px rgba(170, 68, 255, 0.9); }
}
@keyframes legendaryPulse {
  0% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); transform: scale(0.9); }
  30% { box-shadow: 0 0 80px rgba(255, 215, 0, 1); transform: scale(1); }
  100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.3); transform: scale(1); }
}
@keyframes spinFlash {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.3); }
  100% { transform: rotate(360deg) scale(1); }
}
.flash-enter-active, .flash-leave-active {
  transition: all 0.3s ease;
}
.flash-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}
.flash-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.2);
}
</style>
