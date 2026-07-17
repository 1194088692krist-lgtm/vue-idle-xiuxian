<template>
  <div v-if="playback && playback.rounds.length" class="battle-stage" ref="stageRef">
    <!-- 暴击屏幕震动层 -->
    <div v-if="screenShake" class="screen-shake" :class="screenShake"></div>

    <!-- 顶部回合信息 -->
    <div class="stage-header">
      <span class="round-badge">第 {{ currentRoundNum }}/{{ totalRounds }} 回合</span>
      <span v-if="effectBadge" class="effect-badge" :class="effectBadge.cls">{{ effectBadge.text }}</span>
      <span v-if="!isPlaying && playback.victory === false" class="result-badge defeat">败北</span>
      <span v-else-if="!isPlaying && playback.victory" class="result-badge victory">胜利</span>
    </div>

    <!-- 战斗舞台 -->
    <div class="stage-arena">
      <!-- 左侧：队伍成员 -->
      <div class="team-side">
        <div
          v-for="m in playback.members"
          :key="m.memberId"
          class="fighter member"
          :class="getMemberClasses(m.memberId)"
        >
          <div class="avatar-wrap">
            <img v-if="m.avatar" :src="m.avatar" class="fighter-avatar" :alt="m.name" />
            <div v-else class="fighter-avatar placeholder">{{ (m.name || '?')[0] }}</div>
            <div v-if="stunTarget === 'member-' + m.memberId" class="stun-stars">💫</div>
            <div v-if="frozenTarget === 'member-' + m.memberId" class="frozen-overlay"></div>
            <div v-if="burningTargets.includes('member-' + m.memberId)" class="burn-overlay"></div>
            <div v-if="bleedingTargets.includes('member-' + m.memberId)" class="bleed-overlay"></div>
            <div v-if="poisonTargets.includes('member-' + m.memberId)" class="poison-overlay"></div>
            <div v-if="shockedTarget === 'member-' + m.memberId" class="shock-overlay"></div>
            <div v-if="shieldTarget === 'member-' + m.memberId" class="shield-overlay"></div>
            <div v-if="healingTargets.includes('member-' + m.memberId)" class="heal-overlay"></div>
            <div v-if="floaters['m-' + m.memberId]" class="float-damage" :class="floaters['m-' + m.memberId].cls">
              {{ floaters['m-' + m.memberId].text }}
            </div>
            <div v-if="comboShadows.includes(m.memberId)" class="combo-shadow"></div>
          </div>
          <div class="fighter-info">
            <div class="fighter-name" :title="m.name">{{ m.name }}</div>
            <div class="hp-bar">
              <div class="hp-fill" :style="{ width: memberHpPct(m) + '%', background: hpBarColor(memberHpPct(m)) }"></div>
            </div>
            <div class="hp-text">{{ Math.round(memberHPs[m.memberId] ?? m.hp) }}/{{ m.maxHP }}</div>
          </div>
        </div>
      </div>

      <!-- 中间 VS -->
      <div class="vs-zone">
        <div class="vs-icon">⚔️</div>
      </div>

      <!-- 右侧：怪物 -->
      <div class="enemy-side">
        <div class="fighter enemy" :class="getEnemyClasses()">
          <div class="avatar-wrap">
            <div
              class="fighter-avatar enemy-avatar"
              :class="{ 'clickable-portrait': isImageUrl(playback.enemy?.avatar) }"
              @click="openMonsterPortrait"
            >
              <img
                v-if="isImageUrl(playback.enemy?.avatar)"
                :src="playback.enemy.avatar"
                class="enemy-avatar-img"
                :alt="playback.enemy?.name"
              />
              <span v-else class="enemy-emoji">{{ enemyEmoji }}</span>
            </div>
            <span class="tier-badge" :class="'tier-' + (playback.enemy?.tier || 'normal')">{{ tierText }}</span>
            <div v-if="stunTarget === 'enemy'" class="stun-stars">💫</div>
            <div v-if="frozenTarget === 'enemy'" class="frozen-overlay"></div>
            <div v-if="burningTargets.includes('enemy')" class="burn-overlay"></div>
            <div v-if="bleedingTargets.includes('enemy')" class="bleed-overlay"></div>
            <div v-if="poisonTargets.includes('enemy')" class="poison-overlay"></div>
            <div v-if="shockedTarget === 'enemy'" class="shock-overlay"></div>
            <div v-if="shieldTarget === 'enemy'" class="shield-overlay"></div>
            <div v-if="healingTargets.includes('enemy')" class="heal-overlay"></div>
            <div v-if="floaters.enemy" class="float-damage" :class="floaters.enemy.cls">
              {{ floaters.enemy.text }}
            </div>
            <div v-if="comboShadowEnemy" class="combo-shadow"></div>
          </div>
          <div class="fighter-info">
            <div class="fighter-name">{{ playback.enemy?.name }}</div>
            <div class="hp-bar">
              <div class="hp-fill enemy-hp" :style="{ width: enemyHpPct + '%', background: hpBarColor(enemyHpPct) }"></div>
            </div>
            <div class="hp-text">{{ Math.round(enemyHP) }}/{{ playback.enemy?.maxHealth || 0 }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 吸血血链特效 -->
    <svg v-if="vampireChain.show" class="vampire-chain" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path class="chain-path" d="M10,50 Q50,10 90,50" />
    </svg>

    <!-- 闪避虚影 -->
    <div v-if="dodgeGhost.show" class="dodge-ghost" :style="dodgeGhost.style">
      <img v-if="dodgeGhost.avatar" :src="dodgeGhost.avatar" class="ghost-avatar" />
      <div v-else class="ghost-avatar placeholder">{{ (dodgeGhost.name || '?')[0] }}</div>
    </div>

    <!-- 实时日志（最多3条） -->
    <div class="battle-log-zone">
      <div class="battle-log-header">
        <span class="battle-log-title">实时战报</span>
        <button class="view-full-log-btn" @click="showFullLog = true">查看完整日志</button>
      </div>
      <div class="battle-log-list">
        <TransitionGroup name="log-fade" tag="div" class="battle-log-list-inner">
          <div
            v-for="(log, idx) in battleLogDisplay"
            :key="log.id"
            class="battle-log-item"
            :class="[log.type, { 'is-fading': idx === 0 && battleLog.length > 3 }]"
          >
          <img v-if="log.avatar" :src="log.avatar" class="battle-log-avatar" />
          <span class="battle-log-text">{{ log.text }}</span>
        </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- 掉落光球动画 -->
    <transition name="drop-fly">
      <div v-if="dropOrb.show" class="drop-orb" :class="dropOrb.rarity">
        {{ dropOrb.emoji }}
      </div>
    </transition>

    <!-- 完整日志弹窗 -->
    <teleport to="body">
      <div v-if="showFullLog" class="battle-log-modal" @click.self="showFullLog = false">
        <div class="battle-log-modal-content">
          <div class="modal-header">
            <span>完整战斗日志</span>
            <button class="close-btn" @click="showFullLog = false">×</button>
          </div>
          <div class="battle-log-modal-body">
            <div v-for="(log, idx) in fullBattleLog" :key="idx" class="battle-log-item" :class="log.type">
              <img v-if="log.avatar" :src="log.avatar" class="battle-log-avatar" />
              <span class="battle-log-text">{{ log.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 怪物立绘弹窗 -->
    <teleport to="body">
      <div v-if="showMonsterPortrait" class="monster-portrait-modal" @click.self="showMonsterPortrait = false">
        <div class="monster-portrait-content">
          <div class="modal-header">
            <span>{{ monsterPortraitName }}</span>
            <button class="close-btn" @click="showMonsterPortrait = false">×</button>
          </div>
          <div class="monster-portrait-body">
            <img :src="monsterPortraitUrl" class="monster-portrait-img" :alt="monsterPortraitName" />
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onUnmounted, computed, nextTick } from 'vue'

const props = defineProps({
  playback: { type: Object, default: null }
})

const stageRef = ref(null)

// 播放状态
const roundIndex = ref(0)
const isPlaying = ref(false)
let timer = null

// 动画状态
const activeAttacker = ref('')
const activeDefender = ref('')
const hurtLevel = ref('')
const stunTarget = ref('')
const frozenTarget = ref('')
const burningTargets = reactive([])
const bleedingTargets = reactive([])
const poisonTargets = reactive([])
const shockedTarget = ref('')
const shieldTarget = ref('')
const healingTargets = reactive([])
const floaters = reactive({})
const effectBadge = ref(null)
const screenShake = ref('')
const comboShadows = reactive([])
const comboShadowEnemy = ref(false)
const vampireChain = reactive({ show: false })
const dodgeGhost = reactive({ show: false, avatar: '', name: '', style: {} })

// 血量
const memberHPs = reactive({})
const enemyHP = ref(0)

// 掉落动画
const dropOrb = reactive({ show: false, rarity: '', emoji: '' })

// 日志
const battleLog = reactive([])
const showFullLog = ref(false)

// 怪物立绘弹窗
const showMonsterPortrait = ref(false)
const monsterPortraitUrl = ref('')
const monsterPortraitName = ref('')

function openMonsterPortrait() {
  const enemy = props.playback?.enemy
  if (!enemy) return
  const portrait = enemy.portrait || enemy.avatar
  if (portrait && (portrait.startsWith('http') || portrait.startsWith('/'))) {
    monsterPortraitUrl.value = portrait
    monsterPortraitName.value = enemy.name || '怪物'
    showMonsterPortrait.value = true
  }
}

function isImageUrl(str) {
  return str && (str.startsWith('http') || str.startsWith('/'))
}

const totalRounds = computed(() => props.playback?.rounds?.length || 0)
const currentRoundNum = computed(() => Math.min(roundIndex.value, totalRounds.value))
const enemyHpPct = computed(() => {
  const max = props.playback?.enemy?.maxHealth || 1
  return Math.max(0, Math.min(100, (enemyHP.value / max) * 100))
})

// 实时显示：最多3条，旧的渐入透明
const battleLogDisplay = computed(() => {
  const list = battleLog.slice(-3)
  return list
})

const fullBattleLog = computed(() => [...battleLog])

const enemyEmoji = computed(() => {
  const tier = props.playback?.enemy?.tier
  if (tier === 'boss') return '👹'
  if (tier === 'elite') return '👺'
  return '🐺'
})
const tierText = computed(() => {
  const t = props.playback?.enemy?.tier
  if (t === 'boss') return 'BOSS'
  if (t === 'elite') return '精英'
  return '普通'
})

watch(
  () => props.playback?.id,
  (newId) => {
    if (newId) startPlayback()
  }
)

function startPlayback() {
  stopPlayback()
  const pb = props.playback
  if (!pb || !pb.rounds || !pb.rounds.length) return

  for (const m of pb.members) {
    memberHPs[m.memberId] = m.maxHP
  }
  enemyHP.value = pb.enemy?.maxHealth || 100

  roundIndex.value = 0
  isPlaying.value = true
  effectBadge.value = null
  clearFloaters()
  battleLog.splice(0, battleLog.length)
  addBattleLog('header', `【${pb.enemy?.name}】战斗开始！`)

  const stepDelay = Math.max(350, Math.min(700, 3000 / pb.rounds.length))
  timer = setInterval(() => {
    if (roundIndex.value >= pb.rounds.length) {
      finishPlayback()
      return
    }
    playRound(pb.rounds[roundIndex.value], pb)
    roundIndex.value++
  }, stepDelay)
}

function playRound(r, pb) {
  clearFloaters()
  effectBadge.value = null
  activeAttacker.value = ''
  activeDefender.value = ''
  hurtLevel.value = ''
  stunTarget.value = ''
  frozenTarget.value = ''
  poisonTargets.splice(0, poisonTargets.length)
  shockedTarget.value = ''
  shieldTarget.value = ''
  healingTargets.splice(0, healingTargets.length)
  comboShadows.splice(0, comboShadows.length)
  comboShadowEnemy.value = false
  screenShake.value = ''
  vampireChain.show = false
  dodgeGhost.show = false

  const isPlayerAtk = r.isPlayerAttack
  const attackerId = isPlayerAtk ? r.memberId : 'enemy'
  const defenderId = isPlayerAtk ? 'enemy' : ('member-' + r.memberId)
  const attackerName = isPlayerAtk ? r.memberName : pb.enemy?.name
  const defenderName = isPlayerAtk ? pb.enemy?.name : r.memberName

  activeAttacker.value = attackerId
  activeDefender.value = defenderId

  // 连击残影
  if (r.isCombo) {
    if (isPlayerAtk) comboShadows.push(r.memberId)
    else comboShadowEnemy.value = true
  }

  // 闪避
  if (r.isDodged) {
    const avatar = isPlayerAtk ? null : getMemberAvatar(r.memberId)
    const name = isPlayerAtk ? pb.enemy?.name : r.memberName
    showDodgeGhost(defenderId, avatar, name)
    floaters[isPlayerAtk ? 'enemy' : ('m-' + r.memberId)] = { text: '闪避', cls: 'dodge' }
    effectBadge.value = { text: '闪避！', cls: 'badge-dodge' }
    addBattleLog('dodge', `${defenderName} 身形一晃，闪开了 ${attackerName} 的攻击`)
    return
  }

  // 伤害判定
  if (r.damage > 0) {
    if (isPlayerAtk) {
      enemyHP.value = Math.max(0, enemyHP.value - r.damage)
      floaters['enemy'] = { text: r.damage, cls: r.isCrit ? 'crit' : (r.isCounter ? 'counter' : 'normal') }
    } else {
      memberHPs[r.memberId] = Math.max(0, memberHPs[r.memberId] - r.damage)
      floaters['m-' + r.memberId] = { text: r.damage, cls: r.isCrit ? 'crit' : (r.isCounter ? 'counter' : 'normal') }
    }

    // 冰冻/灼烧/流血/中毒状态模拟：根据战斗文案池中原有的特殊描写
    if (isPlayerAtk && r.isCrit && Math.random() < 0.35) {
      const roll = Math.random()
      if (roll < 0.25) burningTargets.push('enemy')
      else if (roll < 0.5) frozenTarget.value = 'enemy'
      else if (roll < 0.75) bleedingTargets.push('enemy')
      else poisonTargets.push('enemy')
    }
    // 敌人重击我方时低概率触发流血
    if (!isPlayerAtk && r.damage > 0 && Math.random() < 0.15) {
      bleedingTargets.push('member-' + r.memberId)
    }

    const targetMax = isPlayerAtk ? (pb.enemy?.maxHealth || 100) : (r.defenderMaxHP || r.attackerMaxHP || 100)
    const ratio = r.damage / targetMax
    if (ratio > 0.25 || r.isCrit) hurtLevel.value = 'strong'
    else if (ratio > 0.1) hurtLevel.value = 'medium'
    else hurtLevel.value = 'mild'
  }

  // 暴击
  if (r.isCrit) {
    effectBadge.value = { text: '暴击！', cls: 'badge-crit' }
    screenShake.value = 'shake-strong'
    setTimeout(() => { if (screenShake.value === 'shake-strong') screenShake.value = '' }, 500)
    addBattleLog('crit', `${attackerName} 触发暴击，对 ${defenderName} 造成 ${r.damage} 点伤害！`)
  }
  // 连击
  if (r.isCombo) {
    effectBadge.value = effectBadge.value || { text: '连击！', cls: 'badge-combo' }
    if (!r.isCrit) addBattleLog('combo', `${attackerName} 连击命中，对 ${defenderName} 造成 ${r.damage} 点伤害`)
  }
  // 眩晕
  if (r.isStun) {
    stunTarget.value = isPlayerAtk ? 'enemy' : ('member-' + r.memberId)
    shockedTarget.value = stunTarget.value // 眩晕伴随感电
    if (!effectBadge.value) effectBadge.value = { text: '眩晕！', cls: 'badge-stun' }
    addBattleLog('stun', `${defenderName} 被 ${attackerName} 眩晕！`)
  }
  // 吸血
  if (r.isVampire && isPlayerAtk) {
    const heal = Math.round(r.damage * 0.3)
    if (heal > 0) {
      memberHPs[r.memberId] = Math.min(r.attackerMaxHP, (memberHPs[r.memberId] || 0) + heal)
      floaters['m-' + r.memberId] = { text: '+' + heal, cls: 'vampire' }
      healingTargets.push('member-' + r.memberId)
      showVampireChain()
      if (!effectBadge.value) effectBadge.value = { text: '吸血', cls: 'badge-vampire' }
      addBattleLog('vampire', `${attackerName} 吸血恢复 ${heal} 点气血`)
    }
  }
  // 护盾：我方受到低伤害时概率触发护盾格挡
  if (!isPlayerAtk && r.damage > 0 && !r.isCrit) {
    const ratio = r.damage / (r.defenderMaxHP || r.attackerMaxHP || 100)
    if (ratio < 0.06 && Math.random() < 0.25) {
      shieldTarget.value = 'member-' + r.memberId
      if (!effectBadge.value) effectBadge.value = { text: '护盾', cls: 'badge-shield' }
      addBattleLog('shield', `${defenderName} 的护盾格挡了部分伤害`)
    }
  }
  // 反击
  if (r.isCounter) {
    if (!effectBadge.value) effectBadge.value = { text: '反击！', cls: 'badge-counter' }
    addBattleLog('counter', `${attackerName} 抓住破绽反击，造成 ${r.damage} 点伤害`)
  }

  if (!r.isCrit && !r.isCombo && !r.isStun && !r.isVampire && !r.isCounter) {
    addBattleLog('combat', `${attackerName} 对 ${defenderName} 造成 ${r.damage} 点伤害`)
  }
}

function finishPlayback() {
  stopPlayback()
  const pb = props.playback
  if (pb) {
    for (const m of pb.members) {
      memberHPs[m.memberId] = m.hp
    }
    enemyHP.value = pb.enemy?.currentHealth || 0
  }

  if (pb?.victory) {
    addBattleLog('victory', `战斗胜利！${pb.enemy?.name} 已阵亡`)
    if (pb.rewards?.length) triggerDropOrb(pb.rewards)
  } else {
    addBattleLog('defeat', '战斗失败，队伍气力耗尽')
  }
}

function addBattleLog(type, text) {
  const member = props.playback?.members[0]
  battleLog.push({
    id: Date.now() + '_' + Math.random().toString(36).slice(2),
    type,
    text,
    avatar: type === 'victory' ? null : (member ? member.avatar : null)
  })
  if (battleLog.length > 200) battleLog.shift()
}

function showDodgeGhost(targetId, avatar, name) {
  const isMember = targetId.startsWith('member-')
  dodgeGhost.avatar = avatar
  dodgeGhost.name = name
  dodgeGhost.show = true
  nextTick(() => {
    // 根据目标位置设置虚影样式（简化：始终从中心偏移）
    dodgeGhost.style = {
      left: isMember ? '18%' : '72%',
      top: '35%'
    }
    setTimeout(() => { dodgeGhost.show = false }, 400)
  })
}

function showVampireChain() {
  vampireChain.show = true
  setTimeout(() => { vampireChain.show = false }, 500)
}

function triggerDropOrb(rewards) {
  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
  let best = null
  let bestTier = -1
  for (const r of rewards) {
    if (r.type === 'equipment' || r.type === 'pet') {
      const tier = rarityOrder.indexOf(r.rarity)
      if (tier > bestTier) {
        bestTier = tier
        best = r
      }
    }
  }
  if (!best) return

  const rarityEmoji = { common: '📦', uncommon: '✨', rare: '💎', epic: '🔮', legendary: '🌟', mythic: '🔥' }
  dropOrb.show = true
  dropOrb.rarity = best.rarity || 'common'
  dropOrb.emoji = rarityEmoji[best.rarity] || '📦'
  setTimeout(() => { dropOrb.show = false }, 2000)
}

function stopPlayback() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isPlaying.value = false
}

function clearFloaters() {
  for (const k in floaters) delete floaters[k]
}

function getMemberAvatar(memberId) {
  const m = props.playback?.members.find(x => x.memberId === memberId)
  return m ? m.avatar : null
}

function getMemberClasses(memberId) {
  const classes = []
  if (activeAttacker.value === memberId) classes.push('attacking')
  if (activeDefender.value === 'member-' + memberId) {
    classes.push('hurt', 'hurt-' + hurtLevel.value)
  }
  const hp = memberHPs[memberId]
  if (hp !== undefined && hp <= 0) classes.push('dead')
  return classes.join(' ')
}

function getEnemyClasses() {
  const classes = []
  if (activeAttacker.value === 'enemy') classes.push('attacking')
  if (activeDefender.value === 'enemy') {
    classes.push('hurt', 'hurt-' + hurtLevel.value)
  }
  if (enemyHP.value <= 0) classes.push('dead')
  return classes.join(' ')
}

function memberHpPct(m) {
  const hp = memberHPs[m.memberId] ?? m.hp
  return Math.max(0, Math.min(100, (hp / m.maxHP) * 100))
}

function hpBarColor(pct) {
  if (pct > 60) return 'linear-gradient(90deg, #4ade80, #22c55e)'
  if (pct > 30) return 'linear-gradient(90deg, #fbbf24, #f59e0b)'
  return 'linear-gradient(90deg, #f87171, #ef4444)'
}

onUnmounted(() => {
  stopPlayback()
})
</script>

<style scoped>
.battle-stage {
  position: relative;
  background: linear-gradient(135deg, rgba(30, 20, 40, 0.9), rgba(15, 10, 25, 0.95));
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  overflow: hidden;
}

.screen-shake {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 20;
  animation: screenShakeStrong 0.5s ease;
}
@keyframes screenShakeStrong {
  0%, 100% { transform: translate(0, 0); }
  20% { transform: translate(-4px, 4px); }
  40% { transform: translate(4px, -4px); }
  60% { transform: translate(-4px, -4px); }
  80% { transform: translate(4px, 4px); }
}

.stage-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  min-height: 24px;
}

.round-badge {
  background: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.effect-badge {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  animation: effectPop 0.4s ease;
}
.badge-crit { background: rgba(239, 68, 68, 0.3); color: #fca5a5; }
.badge-combo { background: rgba(251, 146, 60, 0.3); color: #fdba74; }
.badge-stun { background: rgba(168, 85, 247, 0.3); color: #c4b5fd; }
.badge-vampire { background: rgba(34, 197, 94, 0.3); color: #86efac; }
.badge-counter { background: rgba(59, 130, 246, 0.3); color: #93c5fd; }
.badge-dodge { background: rgba(156, 163, 175, 0.3); color: #d1d5db; }
.badge-shield { background: rgba(234, 179, 8, 0.3); color: #fde047; }

.result-badge {
  margin-left: auto;
  padding: 2px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  animation: resultPop 0.5s ease;
}
.result-badge.victory { background: rgba(34, 197, 94, 0.3); color: #4ade80; }
.result-badge.defeat { background: rgba(239, 68, 68, 0.3); color: #f87171; }

.stage-arena {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 150px;
}

.team-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  max-width: 46%;
}

.vs-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  opacity: 0.5;
  padding: 0 4px;
}

.enemy-side {
  display: flex;
  justify-content: center;
  flex: 1;
  max-width: 30%;
}

.fighter {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s ease, opacity 0.3s ease;
  padding: 4px;
  border-radius: 8px;
}

.fighter.member {
  flex-direction: row;
}

.fighter.enemy {
  flex-direction: column;
  align-items: center;
}

.avatar-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.fighter-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid rgba(139, 92, 246, 0.4);
  background: rgba(0, 0, 0, 0.3);
}

.fighter-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #a5b4fc;
}

.enemy-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-color: rgba(239, 68, 68, 0.4);
  position: relative;
}

.enemy-emoji {
  font-size: 28px;
}

.tier-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 6px;
  font-weight: 700;
  color: #fff;
}
.tier-badge.tier-boss { background: #ef4444; }
.tier-badge.tier-elite { background: #a855f7; }
.tier-badge.tier-normal { background: #6b7280; }

.fighter-info {
  flex: 1;
  min-width: 0;
}

.fighter-name {
  font-size: 11px;
  color: #e5e7eb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.hp-bar {
  width: 80px;
  height: 6px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 3px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 3px;
}

.hp-text {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 1px;
}

/* 攻击动画：队员向右冲 */
.fighter.member.attacking .fighter-avatar {
  animation: attackRight 0.4s ease;
}
.fighter.enemy.attacking .fighter-avatar {
  animation: attackLeft 0.4s ease;
}

@keyframes attackRight {
  0%, 100% { transform: translateX(0); }
  40% { transform: translateX(22px) scale(1.08); }
}
@keyframes attackLeft {
  0%, 100% { transform: translateX(0); }
  40% { transform: translateX(-22px) scale(1.08); }
}

/* 连击残影 */
.combo-shadow {
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: rgba(251, 146, 60, 0.4);
  animation: comboFlash 0.4s ease;
  pointer-events: none;
}
@keyframes comboFlash {
  0% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.2); }
  100% { opacity: 0; transform: scale(1.4); }
}

/* 受击抖动 */
.hurt.hurt-mild { animation: shakeMild 0.3s ease; }
.hurt.hurt-medium { animation: shakeMedium 0.4s ease; }
.hurt.hurt-strong { animation: shakeStrong 0.5s ease; }

@keyframes shakeMild {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
@keyframes shakeMedium {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px) rotate(-1deg); }
  40% { transform: translateX(6px) rotate(1deg); }
  60% { transform: translateX(-4px) rotate(-0.5deg); }
  80% { transform: translateX(4px) rotate(0.5deg); }
}
@keyframes shakeStrong {
  0%, 100% { transform: translateX(0) rotate(0); }
  15% { transform: translateX(-10px) rotate(-2deg); }
  30% { transform: translateX(10px) rotate(2deg); }
  45% { transform: translateX(-8px) rotate(-1.5deg); }
  60% { transform: translateX(8px) rotate(1.5deg); }
  75% { transform: translateX(-4px) rotate(-0.5deg); }
}

/* 闪避虚影 */
.dodge-ghost {
  position: absolute;
  width: 48px;
  height: 48px;
  pointer-events: none;
  z-index: 15;
  animation: dodgeGhost 0.4s ease forwards;
}
.ghost-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  opacity: 0.7;
  filter: blur(1px);
}
.ghost-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(156, 163, 175, 0.3);
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}
@keyframes dodgeGhost {
  0% { opacity: 0.8; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}

/* 死亡 */
.dead {
  opacity: 0.35;
  filter: grayscale(0.8);
}

/* 眩晕星星 */
.stun-stars {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  animation: stunSpin 1s linear infinite;
  z-index: 2;
}
@keyframes stunSpin {
  from { transform: translateX(-50%) rotate(0deg); }
  to { transform: translateX(-50%) rotate(360deg); }
}

/* 冰冻：冰晶边框 + 雪花飘落 */
.frozen-overlay {
  position: absolute;
  inset: -4px;
  border-radius: 10px;
  border: 2px solid rgba(96, 165, 250, 0.8);
  background: rgba(96, 165, 250, 0.12);
  box-shadow: 0 0 10px rgba(96, 165, 250, 0.35), inset 0 0 12px rgba(96, 165, 250, 0.2);
  animation: frostPulse 1.2s ease-in-out infinite;
  pointer-events: none;
  z-index: 4;
}
.frozen-overlay::before,
.frozen-overlay::after {
  content: '❄';
  position: absolute;
  color: rgba(191, 219, 254, 0.9);
  font-size: 12px;
  animation: snowFall 1.6s linear infinite;
}
.frozen-overlay::before { left: 4px; top: 2px; animation-delay: 0s; }
.frozen-overlay::after { right: 4px; top: 6px; animation-delay: 0.8s; }
@keyframes frostPulse {
  0%, 100% { opacity: 0.65; border-color: rgba(96, 165, 250, 0.6); }
  50% { opacity: 1; border-color: rgba(191, 219, 254, 0.95); }
}
@keyframes snowFall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(36px) rotate(180deg); opacity: 0; }
}

/* 灼烧：火焰边框 + 火星上飘 */
.burn-overlay {
  position: absolute;
  inset: -3px;
  border-radius: 10px;
  border: 2px solid rgba(249, 115, 22, 0.8);
  background: linear-gradient(180deg, transparent 30%, rgba(249, 115, 22, 0.22));
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.35), inset 0 0 8px rgba(249, 115, 22, 0.15);
  animation: burnFlicker 0.45s ease-in-out infinite alternate;
  pointer-events: none;
  z-index: 4;
}
.burn-overlay::before,
.burn-overlay::after {
  content: '🔥';
  position: absolute;
  font-size: 10px;
  filter: drop-shadow(0 0 2px rgba(249, 115, 22, 0.9));
  animation: emberRise 1s ease-out infinite;
}
.burn-overlay::before { left: 6px; bottom: 2px; animation-delay: 0s; }
.burn-overlay::after { right: 6px; bottom: 4px; animation-delay: 0.5s; }
@keyframes burnFlicker {
  0% { opacity: 0.7; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.04); }
}
@keyframes emberRise {
  0% { transform: translateY(0) scale(0.8); opacity: 1; }
  100% { transform: translateY(-32px) scale(0.4); opacity: 0; }
}

/* 流血：血滴下落 */
.bleed-overlay {
  position: absolute;
  inset: -2px;
  border-radius: 10px;
  pointer-events: none;
  z-index: 4;
  overflow: hidden;
}
.bleed-overlay::before,
.bleed-overlay::after {
  content: '';
  position: absolute;
  width: 5px;
  height: 8px;
  background: radial-gradient(circle at 30% 30%, #ff6b6b, #b91c1c);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  animation: bloodDrop 1s ease-in infinite;
}
.bleed-overlay::before { left: 8px; top: 4px; animation-delay: 0s; }
.bleed-overlay::after { right: 10px; top: 8px; animation-delay: 0.45s; }
@keyframes bloodDrop {
  0% { transform: translateY(0) scale(1); opacity: 0.9; }
  80% { opacity: 0.6; }
  100% { transform: translateY(42px) scale(0.5); opacity: 0; }
}

/* 中毒：毒泡升腾 */
.poison-overlay {
  position: absolute;
  inset: -3px;
  border-radius: 10px;
  border: 2px solid rgba(168, 85, 247, 0.75);
  background: rgba(168, 85, 247, 0.1);
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
  pointer-events: none;
  z-index: 4;
  overflow: hidden;
}
.poison-overlay::before,
.poison-overlay::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(192, 132, 252, 0.9), rgba(147, 51, 234, 0.4));
  animation: poisonBubble 1.1s ease-in infinite;
}
.poison-overlay::before { width: 8px; height: 8px; left: 6px; bottom: 2px; animation-delay: 0s; }
.poison-overlay::after { width: 6px; height: 6px; right: 8px; bottom: 4px; animation-delay: 0.55s; }
@keyframes poisonBubble {
  0% { transform: translateY(0) scale(0.7); opacity: 0.8; }
  100% { transform: translateY(-38px) scale(1.1); opacity: 0; }
}

/* 感电：闪电撕裂 */
.shock-overlay {
  position: absolute;
  inset: -4px;
  border-radius: 10px;
  border: 2px solid rgba(250, 204, 21, 0.7);
  background: rgba(250, 204, 21, 0.08);
  box-shadow: 0 0 12px rgba(250, 204, 21, 0.4);
  pointer-events: none;
  z-index: 4;
  animation: shockFlash 0.25s ease-out 3;
}
.shock-overlay::before {
  content: '⚡';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 22px;
  filter: drop-shadow(0 0 4px rgba(250, 204, 21, 0.9));
  animation: shockBolt 0.5s ease-in-out infinite;
}
@keyframes shockFlash {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes shockBolt {
  0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(-5deg); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.2) rotate(5deg); opacity: 0.7; }
}

/* 护盾：金色六边形旋转屏障 */
.shield-overlay {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 4;
}
.shield-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px dashed rgba(250, 204, 21, 0.7);
  background: radial-gradient(circle, rgba(250, 204, 21, 0.12) 0%, transparent 70%);
  animation: shieldSpin 1.5s linear infinite;
}
.shield-overlay::after {
  content: '🛡';
  position: absolute;
  left: 50%;
  top: 0;
  transform: translate(-50%, -40%);
  font-size: 14px;
  filter: drop-shadow(0 0 3px rgba(250, 204, 21, 0.8));
  animation: shieldIcon 1s ease-in-out infinite alternate;
}
@keyframes shieldSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes shieldIcon {
  from { transform: translate(-50%, -40%) scale(1); }
  to { transform: translate(-50%, -50%) scale(1.15); }
}

/* 治疗：绿光十字与粒子上升 */
.heal-overlay {
  position: absolute;
  inset: -3px;
  border-radius: 10px;
  pointer-events: none;
  z-index: 4;
  overflow: hidden;
}
.heal-overlay::before {
  content: '✚';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  color: rgba(74, 222, 128, 0.95);
  text-shadow: 0 0 8px rgba(74, 222, 128, 0.8);
  animation: healCross 0.9s ease-out forwards;
}
.heal-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: radial-gradient(circle at center, rgba(74, 222, 128, 0.25), transparent 70%);
  animation: healGlow 0.9s ease-out forwards;
}
@keyframes healCross {
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  40% { transform: translate(-50%, -60%) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -90%) scale(0.8); opacity: 0; }
}
@keyframes healGlow {
  0% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0; transform: scale(1); }
}

/* 吸血血链 */
.vampire-chain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 12;
}
.chain-path {
  fill: none;
  stroke: rgba(34, 197, 94, 0.6);
  stroke-width: 2;
  stroke-dasharray: 8, 4;
  animation: chainFlow 0.5s linear forwards;
}
@keyframes chainFlow {
  0% { stroke-dashoffset: 60; opacity: 0; }
  20% { opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0; }
}

/* 伤害飘字 */
.float-damage {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 0 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.8);
  animation: floatUp 1s ease-out forwards;
  z-index: 3;
  pointer-events: none;
  white-space: nowrap;
}
.float-damage.crit {
  color: #fca5a5;
  font-size: 20px;
  text-shadow: 0 0 6px rgba(239, 68, 68, 0.8), 0 1px 2px rgba(0,0,0,0.8);
}
.float-damage.normal { color: #fff; }
.float-damage.counter { color: #93c5fd; }
.float-damage.dodge {
  color: #d1d5db;
  font-size: 12px;
  animation: dodgeFloat 0.8s ease-out forwards;
}
.float-damage.vampire { color: #86efac; }

@keyframes floatUp {
  0% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-30px); }
}
@keyframes dodgeFloat {
  0% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(50%) translateY(-10px); }
}
@keyframes effectPop {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes resultPop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

/* 实时日志 */
.battle-log-zone {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.battle-log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.battle-log-title {
  font-size: 12px;
  color: #c4b5fd;
  font-weight: 600;
}

.view-full-log-btn {
  font-size: 11px;
  padding: 2px 8px;
  border: 1px solid rgba(139, 92, 246, 0.4);
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.view-full-log-btn:hover {
  background: rgba(99, 102, 241, 0.3);
  color: #fff;
}

.battle-log-list {
  min-height: 60px;
}
.battle-log-list-inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.battle-log-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #d1d5db;
  padding: 3px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.15);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.battle-log-item.is-fading {
  opacity: 0.2;
  transform: translateX(-10px);
}
.battle-log-item.crit { color: #fca5a5; background: rgba(239, 68, 68, 0.1); }
.battle-log-item.combo { color: #fdba74; background: rgba(251, 146, 60, 0.1); }
.battle-log-item.stun { color: #c4b5fd; background: rgba(168, 85, 247, 0.1); }
.battle-log-item.vampire { color: #86efac; background: rgba(34, 197, 94, 0.1); }
.battle-log-item.counter { color: #93c5fd; background: rgba(59, 130, 246, 0.1); }
.battle-log-item.dodge { color: #9ca3af; background: rgba(156, 163, 175, 0.1); }
.battle-log-item.shield { color: #fde047; background: rgba(234, 179, 8, 0.1); }
.battle-log-item.victory { color: #4ade80; font-weight: 700; }
.battle-log-item.defeat { color: #f87171; font-weight: 700; }

/* 日志列表过渡动画 */
.log-fade-enter-active,
.log-fade-leave-active {
  transition: all 0.45s ease;
}
.log-fade-enter-from,
.log-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.log-fade-leave-active {
  position: absolute;
}

.battle-log-avatar {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  object-fit: cover;
  flex-shrink: 0;
}

.battle-log-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 完整日志弹窗 */
.battle-log-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.battle-log-modal-content {
  width: 90%;
  max-width: 500px;
  max-height: 70vh;
  background: linear-gradient(135deg, rgba(30, 20, 40, 0.98), rgba(15, 10, 25, 0.98));
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  color: #e5e7eb;
  font-weight: 600;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.battle-log-modal-body {
  padding: 12px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.battle-log-modal-body .battle-log-item {
  font-size: 12px;
  white-space: normal;
  text-overflow: initial;
}

/* 怪物头像样式 */
.enemy-avatar.clickable-portrait {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.enemy-avatar.clickable-portrait:hover {
  transform: scale(1.08);
  box-shadow: 0 0 12px rgba(255, 107, 107, 0.5);
}
.enemy-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* 怪物立绘弹窗 */
.monster-portrait-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}
.monster-portrait-content {
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  background: linear-gradient(135deg, rgba(30, 20, 40, 0.98), rgba(15, 10, 25, 0.98));
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.monster-portrait-content .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  font-weight: 600;
  font-size: 16px;
  color: #e0e0e0;
}
.monster-portrait-body {
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
.monster-portrait-img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  object-fit: contain;
}

/* 掉落光球 */
.drop-orb {
  position: absolute;
  top: 50%;
  left: 60%;
  font-size: 28px;
  animation: dropFly 2s ease-in-out forwards;
  z-index: 10;
  pointer-events: none;
}
.drop-orb.common { filter: drop-shadow(0 0 4px #9ca3af); }
.drop-orb.uncommon { filter: drop-shadow(0 0 6px #4ade80); }
.drop-orb.rare { filter: drop-shadow(0 0 8px #60a5fa); }
.drop-orb.epic { filter: drop-shadow(0 0 10px #c084fc); animation: dropFly 2s ease-in-out forwards, orbPulse 0.6s ease-in-out infinite; }
.drop-orb.legendary { filter: drop-shadow(0 0 12px #fbbf24); animation: dropFly 2s ease-in-out forwards, orbPulse 0.5s ease-in-out infinite; }
.drop-orb.mythic { filter: drop-shadow(0 0 14px #f97316); animation: dropFly 2s ease-in-out forwards, orbPulse 0.4s ease-in-out infinite; }

@keyframes dropFly {
  0% { left: 60%; top: 50%; opacity: 0; transform: scale(0.5); }
  20% { opacity: 1; transform: scale(1.2); }
  100% { left: 85%; top: 80%; opacity: 0; transform: scale(0.8) rotate(360deg); }
}
@keyframes orbPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* 响应式 */
@media (max-width: 480px) {
  .fighter-avatar, .avatar-wrap { width: 40px; height: 40px; }
  .fighter-avatar { width: 40px; height: 40px; }
  .hp-bar { width: 60px; }
  .fighter-name { font-size: 10px; }
  .vs-zone { font-size: 18px; }
  .battle-log-text { white-space: normal; }
}
</style>
