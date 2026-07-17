<template>
  <div v-if="playback && playback.rounds.length" class="battle-stage">
    <!-- 顶部回合信息 -->
    <div class="stage-header">
      <span class="round-badge">第 {{ currentRoundNum }}/{{ totalRounds }} 回合</span>
      <span v-if="effectBadge" class="effect-badge" :class="effectBadge.cls">{{ effectBadge.text }}</span>
      <span v-if="isPlaying && playback.victory === false && currentRoundNum >= totalRounds" class="result-badge defeat">败北</span>
      <span v-else-if="isPlaying && currentRoundNum >= totalRounds && playback.victory" class="result-badge victory">胜利</span>
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
            <div v-if="floaters['m-' + m.memberId]" class="float-damage" :class="floaters['m-' + m.memberId].cls">
              {{ floaters['m-' + m.memberId].text }}
            </div>
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
            <div class="fighter-avatar enemy-avatar">
              <span class="enemy-emoji">{{ enemyEmoji }}</span>
            </div>
            <span class="tier-badge" :class="'tier-' + (playback.enemy?.tier || 'normal')">{{ tierText }}</span>
            <div v-if="stunTarget === 'enemy'" class="stun-stars">💫</div>
            <div v-if="floaters.enemy" class="float-damage" :class="floaters.enemy.cls">
              {{ floaters.enemy.text }}
            </div>
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

    <!-- 掉落光球动画 -->
    <transition name="drop-fly">
      <div v-if="dropOrb.show" class="drop-orb" :class="dropOrb.rarity">
        {{ dropOrb.emoji }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onUnmounted, computed } from 'vue'

const props = defineProps({
  playback: { type: Object, default: null }
})

// 播放状态
const roundIndex = ref(0)
const isPlaying = ref(false)
let timer = null

// 动画状态
const activeAttacker = ref('') // 'member-id' 或 'enemy'
const activeDefender = ref('') // 'member-id' 或 'enemy'
const hurtLevel = ref('') // mild / medium / strong
const stunTarget = ref('') // 'member-id' 或 'enemy'
const floaters = reactive({}) // 飘字 { 'm-id' / 'enemy': { text, cls } }
const effectBadge = ref(null) // { text, cls }

// 血量
const memberHPs = reactive({})
const enemyHP = ref(0)

// 掉落动画
const dropOrb = reactive({ show: false, rarity: '', emoji: '' })

const totalRounds = computed(() => props.playback?.rounds?.length || 0)
const currentRoundNum = computed(() => Math.min(roundIndex.value, totalRounds.value))
const enemyHpPct = computed(() => {
  const max = props.playback?.enemy?.maxHealth || 1
  return Math.max(0, Math.min(100, (enemyHP.value / max) * 100))
})

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

// watch playback 变化启动回放
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

  // 初始化血量（从满血开始，逐步打到最终值）
  for (const m of pb.members) {
    memberHPs[m.memberId] = m.maxHP
  }
  enemyHP.value = pb.enemy?.maxHealth || 100

  roundIndex.value = 0
  isPlaying.value = true
  effectBadge.value = null
  clearFloaters()

  const stepDelay = Math.max(300, Math.min(600, 2500 / pb.rounds.length))
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

  const isPlayerAtk = r.isPlayerAttack
  const attackerId = isPlayerAtk ? r.memberId : 'enemy'
  const defenderId = isPlayerAtk ? 'enemy' : ('member-' + r.memberId)

  activeAttacker.value = attackerId
  activeDefender.value = defenderId

  // 闪避
  if (r.isDodged) {
    floaters[isPlayerAtk ? 'enemy' : ('m-' + r.memberId)] = { text: '闪避', cls: 'dodge' }
    effectBadge.value = { text: '闪避', cls: 'badge-dodge' }
    // 闪避不扣血
    return
  }

  // 伤害判定
  if (r.damage > 0) {
    // 更新血量
    if (isPlayerAtk) {
      // 玩家攻击怪物
      enemyHP.value = Math.max(0, enemyHP.value - r.damage)
      floaters['enemy'] = { text: r.damage, cls: r.isCrit ? 'crit' : (r.isCounter ? 'counter' : 'normal') }
    } else {
      // 怪物攻击队员
      memberHPs[r.memberId] = Math.max(0, memberHPs[r.memberId] - r.damage)
      floaters['m-' + r.memberId] = { text: r.damage, cls: r.isCrit ? 'crit' : (r.isCounter ? 'counter' : 'normal') }
    }

    // 抖动等级（基于伤害占 maxHP 比例）
    const targetMax = isPlayerAtk ? (pb.enemy?.maxHealth || 100) : (r.defenderMaxHP || r.attackerMaxHP || 100)
    const ratio = r.damage / targetMax
    if (ratio > 0.25 || r.isCrit) hurtLevel.value = 'strong'
    else if (ratio > 0.1) hurtLevel.value = 'medium'
    else hurtLevel.value = 'mild'
  }

  // 暴击
  if (r.isCrit) {
    effectBadge.value = { text: '暴击！', cls: 'badge-crit' }
  }
  // 连击
  if (r.isCombo) {
    effectBadge.value = effectBadge.value || { text: '连击！', cls: 'badge-combo' }
  }
  // 眩晕
  if (r.isStun) {
    stunTarget.value = isPlayerAtk ? 'enemy' : ('member-' + r.memberId)
    if (!effectBadge.value) effectBadge.value = { text: '眩晕！', cls: 'badge-stun' }
  }
  // 吸血
  if (r.isVampire && isPlayerAtk) {
    const heal = Math.round(r.damage * 0.3)
    if (heal > 0) {
      memberHPs[r.memberId] = Math.min(r.attackerMaxHP, (memberHPs[r.memberId] || 0) + heal)
      floaters['m-' + r.memberId] = { text: '+' + heal, cls: 'vampire' }
      if (!effectBadge.value) effectBadge.value = { text: '吸血', cls: 'badge-vampire' }
    }
  }
  // 反击
  if (r.isCounter) {
    if (!effectBadge.value) effectBadge.value = { text: '反击！', cls: 'badge-counter' }
  }
}

function finishPlayback() {
  stopPlayback()
  // 最终对齐到实际血量
  const pb = props.playback
  if (pb) {
    for (const m of pb.members) {
      memberHPs[m.memberId] = m.hp
    }
    enemyHP.value = pb.enemy?.currentHealth || 0
  }

  // 胜利时触发掉落动画
  if (pb?.victory && pb.rewards?.length) {
    triggerDropOrb(pb.rewards)
  }
}

function triggerDropOrb(rewards) {
  // 找最高稀有度的奖励
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

// 组件类名计算
function getMemberClasses(memberId) {
  const classes = []
  if (activeAttacker.value === memberId) classes.push('attacking')
  if (activeDefender.value === 'member-' + memberId) {
    classes.push('hurt', 'hurt-' + hurtLevel.value)
    if (floaters['m-' + memberId]?.cls === 'dodge') classes.push('dodging')
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
    if (floaters.enemy?.cls === 'dodge') classes.push('dodging')
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
  min-height: 140px;
}

.team-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  max-width: 45%;
}

.vs-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  opacity: 0.6;
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
.fighter.member.attacking .fighter-avatar,
.fighter.member.attacking {
  animation: attackRight 0.4s ease;
}
.fighter.enemy.attacking .fighter-avatar,
.fighter.enemy.attacking {
  animation: attackLeft 0.4s ease;
}

@keyframes attackRight {
  0%, 100% { transform: translateX(0); }
  40% { transform: translateX(20px) scale(1.05); }
}
@keyframes attackLeft {
  0%, 100% { transform: translateX(0); }
  40% { transform: translateX(-20px) scale(1.05); }
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

/* 闪避 */
.dodging .fighter-avatar {
  animation: dodgeUp 0.4s ease;
}
@keyframes dodgeUp {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
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
  100% { opacity: 0; transform: translateX(-50%) translateX(15px) translateY(-10px); }
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

/* drop-fly transition */
.drop-fly-enter-active, .drop-fly-leave-active {
  transition: opacity 0.3s ease;
}

/* 响应式 */
@media (max-width: 480px) {
  .fighter-avatar, .avatar-wrap { width: 40px; height: 40px; }
  .fighter-avatar { width: 40px; height: 40px; }
  .hp-bar { width: 60px; }
  .fighter-name { font-size: 10px; }
  .vs-zone { font-size: 18px; }
}
</style>
