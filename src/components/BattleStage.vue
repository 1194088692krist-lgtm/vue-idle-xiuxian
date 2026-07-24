<template>
  <div v-if="encounter && encounter.players && encounter.players.length && encounter.enemy" class="battle-stage" ref="stageRef">
    <!-- 暴击屏幕震动层 -->
    <div v-if="screenShake" class="screen-shake" :class="screenShake"></div>

    <!-- 顶部回合信息 -->
    <div class="stage-header">
      <span class="round-badge">第 {{ encounter.round || 0 }} 回合</span>
      <span v-if="effectBadge" class="effect-badge" :class="effectBadge.cls">{{ effectBadge.text }}</span>
      <span v-if="!encounter.inProgress && encounter.enemy.currentHealth <= 0" class="result-badge victory">胜利</span>
      <span v-else-if="!encounter.inProgress" class="result-badge defeat">败北</span>
    </div>

    <!-- 战斗舞台 -->
    <div class="stage-arena">
      <!-- 左侧：队伍成员 -->
      <div class="team-side">
        <div
          v-for="m in encounter.players"
          :key="m.memberId"
          class="fighter member"
          :class="getMemberClasses(m.memberId)"
        >
          <div class="avatar-wrap">
            <img v-if="m.avatar" :src="m.avatar" class="fighter-avatar" :alt="m.name" decoding="async" />
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
            <div class="hp-text">{{ Math.round(m.currentHealth) }}/{{ m.stats.maxHealth }}</div>
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
              :class="{ 'clickable-portrait': isImageUrl(enemyAvatar) }"
              @click="openMonsterPortrait"
            >
              <img
                v-if="isImageUrl(enemyAvatar)"
                :src="enemyAvatar"
                class="enemy-avatar-img"
                :alt="encounter.enemy?.name"
                decoding="async"
              />
              <span v-else class="enemy-emoji">{{ enemyEmoji }}</span>
            </div>
            <span class="tier-badge" :class="'tier-' + (encounter.enemy?.tier || 'normal')">{{ tierText }}</span>
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
            <div class="fighter-name">{{ encounter.enemy?.name }}</div>
            <div class="hp-bar">
              <div class="hp-fill enemy-hp" :style="{ width: enemyHpPct + '%', background: hpBarColor(enemyHpPct) }"></div>
            </div>
            <div class="hp-text">{{ Math.round(encounter.enemy.currentHealth) }}/{{ encounter.enemy.stats.maxHealth || 0 }}</div>
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
      <img v-if="dodgeGhost.avatar" :src="dodgeGhost.avatar" class="ghost-avatar" decoding="async" />
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
            :class="[log.type, { 'is-fading': idx === 0 && (props.encounter?.combatLog?.length || 0) > 3 }]"
          >
          <img v-if="log.avatar" :src="log.avatar" class="battle-log-avatar" loading="lazy" decoding="async" />
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

    <!-- 实时战斗日志弹窗（旧版 logs 系统，按场次累积；含时间戳/类型彩色/清空按钮） -->
    <teleport to="body">
      <div v-if="showFullLog" class="battle-log-modal" @click.self="showFullLog = false">
        <div class="battle-log-modal-content">
          <div class="modal-header">
            <span class="modal-title">📜 实时战报</span>
            <div class="modal-actions">
              <button class="btn-clear-log" @click="clearRealtimeLog" title="清空当前日志">清空日志</button>
              <button class="close-btn" @click="showFullLog = false">×</button>
            </div>
          </div>
          <div class="battle-log-modal-body" ref="fullLogBody">
            <div v-if="!realtimeLogEntries.length" class="empty-log-tip">暂无日志，挂机开始后即会实时累积……</div>
            <div
              v-for="(log, idx) in realtimeLogEntries"
              :key="idx"
              class="rt-log-item"
              :class="log.type"
            >
              <span class="rt-log-time">{{ log.time }}</span>
              <span v-if="log.avatar" class="rt-log-avatar-wrap">
                <img :src="log.avatar" class="rt-log-avatar" loading="lazy" decoding="async" />
              </span>
              <span v-else class="rt-log-bullet" :class="log.type">•</span>
              <span class="rt-log-text">
                <template v-if="log.text">{{ log.text }}</template>
                <template v-if="log.parts && log.parts.length">
                  <span
                    v-for="(part, pi) in log.parts"
                    :key="pi"
                    class="rt-log-part"
                    :class="{ 'has-icon': !!part.icon }"
                  >
                    <img v-if="part.icon" :src="part.icon" class="rt-log-part-icon" loading="lazy" decoding="async" />
                    <span v-if="part.text">{{ part.text }}</span>
                  </span>
                </template>
                <span v-if="log.detail" class="rt-log-detail"> ({{ log.detail }})</span>
              </span>
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
            <img :src="monsterPortraitUrl" class="monster-portrait-img" :alt="monsterPortraitName" decoding="async" />
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onUnmounted, computed, nextTick } from 'vue'
import { useIdleSystem } from '../composables/useIdleSystem.js'
import { getMonsterAvatarSync, monsterManifestVersion } from '../plugins/monsters'

const props = defineProps({
  encounter: { type: Object, default: null }
})

// 完整战斗日志累积源：挂机时跨所有遭遇，从挂机开始累积到当前（非当前回合）
// 现已切换回旧版「实时战斗日志」系统（logs/displayLogs），保留时间戳与彩色分类
const { displayLogs, clearIdleLogs } = useIdleSystem()

const stageRef = ref(null)

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

// 掉落动画
const dropOrb = reactive({ show: false, rarity: '', emoji: '' })

// 日志
const showFullLog = ref(false)

// 怪物立绘弹窗
const showMonsterPortrait = ref(false)
const monsterPortraitUrl = ref('')
const monsterPortraitName = ref('')

function openMonsterPortrait() {
  const enemy = props.encounter?.enemy
  if (!enemy) return
  // 优先用响应式 computed（manifest 就绪后返回真实立绘 URL），回退到 enemy 对象上已赋值的字段
  const portrait = enemyPortrait.value || enemy.portrait || enemyAvatar.value || enemy.avatar
  if (isImageUrl(portrait)) {
    monsterPortraitUrl.value = portrait
    monsterPortraitName.value = enemy.name || '怪物'
    showMonsterPortrait.value = true
  }
}

// 判断字符串是否为图片 URL（支持 http/https、绝对路径 /xxx、相对路径 ./xxx / ../xxx）
// 因 vite.config.js 配置 base: './'，怪物立绘 URL 形如 ./monsters/xxx.jpg
// 旧版仅接受 http 或 / 开头，导致 ./monsters/... 全部被识别为 emoji 而无法显示
function isImageUrl(str) {
  if (!str) return false
  if (str.startsWith('http://') || str.startsWith('https://')) return true
  if (str.startsWith('/')) return true
  if (str.startsWith('./') || str.startsWith('../')) return true
  // 不以路径开头但包含图片扩展名，也认为是 URL
  return /\.(jpg|jpeg|png|webp|gif|svg|ico|avif)$/i.test(str)
}

const enemyHpPct = computed(() => {
  const e = props.encounter?.enemy
  if (!e || !e.stats) return 0
  return Math.max(0, Math.min(100, (e.currentHealth / (e.stats.maxHealth || 1)) * 100))
})

// 实时显示：最多3条，来自 encounter.combatLog 字符串数组
function logType(text) {
  if (text.startsWith('——')) return 'separator'
  if (text.startsWith('💚')) return 'vampire'
  if (text.startsWith('⚔️') || text.startsWith('🔥')) return 'combat'
  if (text.startsWith('💨')) return 'dodge'
  if (text.startsWith('✨')) return 'crit'
  if (text.startsWith('🛡️')) return 'shield'
  if (text.startsWith('💥')) return 'counter'
  return 'combat'
}
const battleLogDisplay = computed(() => {
  const log = props.encounter?.combatLog || []
  return log.slice(-3).map((t, i) => ({ id: (props.encounter?.round || 0) + '-' + i, type: logType(t), text: t }))
})

// 实时战斗日志弹窗数据源：直接复用 useIdleSystem 中的 displayLogs
// 挂机中 = logs.value（实时累积），挂机结束 = lastSummary.value.logs（本次挂机快照）
const realtimeLogEntries = computed(() => {
  const arr = displayLogs.value || []
  // 把字符串数组（手动战斗回退场景）也包装为统一结构
  if (arr.length && typeof arr[0] === 'string') {
    return arr.map(t => ({ time: '', text: t, type: logType(t), parts: null, avatar: null, detail: null }))
  }
  return arr
})

// 清空实时日志：调用 useIdleSystem 暴露的方法，同步清理 logs 与 lastSummary.logs
function clearRealtimeLog() {
  if (typeof clearIdleLogs === 'function') clearIdleLogs()
}

// 实时战斗日志弹窗自动滚动到底部：打开瞬间定位到最新一条。
// 新日志到达时仅当用户已在底部附近（未向上翻看历史）才自动滚动，
// 避免用户回看历史日志时被新日志强制拉回底部。
const fullLogBody = ref(null)
// 用户是否在底部附近（距底 < 80px 视为贴底）
function isUserNearBottom() {
  const el = fullLogBody.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < 80
}
function scrollFullLogToBottom() {
  nextTick(() => {
    const el = fullLogBody.value
    if (el) el.scrollTop = el.scrollHeight
  })
}
watch(() => showFullLog.value, (v) => { if (v) scrollFullLogToBottom() })
watch(() => realtimeLogEntries.value.length, () => {
  if (showFullLog.value && isUserNearBottom()) scrollFullLogToBottom()
})

const enemyEmoji = computed(() => {
  const tier = props.encounter?.enemy?.tier
  if (tier === 'boss') return '👹'
  if (tier === 'elite') return '👺'
  return '🐺'
})

// 怪物头像/立绘：响应式获取
// 修复「manifest 异步加载完前 getMonsterAvatarSync 返回 emoji，enemy.avatar 已赋值不会更新」的 bug
// 通过显式访问 monsterManifestVersion.value 建立响应式依赖，manifest 加载完后自动刷新
const enemyAvatar = computed(() => {
  // eslint-disable-next-line no-unused-expressions
  monsterManifestVersion.value  // 建立响应式依赖
  const enemy = props.encounter?.enemy
  if (!enemy) return ''
  // 优先用怪物名实时获取（manifest 就绪后返回真实 URL，未就绪返回 emoji）
  const url = getMonsterAvatarSync(enemy.name, 'thumbnail')
  return url
})
const enemyPortrait = computed(() => {
  // eslint-disable-next-line no-unused-expressions
  monsterManifestVersion.value
  const enemy = props.encounter?.enemy
  if (!enemy) return ''
  return getMonsterAvatarSync(enemy.name, 'full')
})
const tierText = computed(() => {
  const t = props.encounter?.enemy?.tier
  if (t === 'boss') return 'BOSS'
  if (t === 'elite') return '精英'
  return '普通'
})

// ============ 实时战斗：监听 currentEncounter 的回合推进，播放最新一回合 ============
function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

function clearTransient() {
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
  for (const k in floaters) delete floaters[k]
  effectBadge.value = null
}

function showVampireChain() {
  vampireChain.show = true
  setTimeout(() => { vampireChain.show = false }, 500)
}

const roundWatched = ref(0)

function memberIdByName(name) {
  const p = props.encounter?.players?.find(x => x.name === name)
  return p ? (p.memberId || p.name) : name
}

// 渲染单条战斗事件（实时血量由模板直接绑定 encounter 实体，无需手动扣血）
function showEvent(e) {
  clearTransient()
  const enemyName = props.encounter?.enemy?.name
  const atkIsPlayer = e.attacker !== enemyName
  const defIsPlayer = e.defender !== enemyName
  const atkMemberId = atkIsPlayer ? memberIdByName(e.attacker) : null
  const defMemberId = defIsPlayer ? memberIdByName(e.defender) : null
  // activeAttacker 用原始 memberId（与 getMemberClasses 比较）；defenderId/overlay 用 'member-' 前缀
  const attackerId = atkIsPlayer ? atkMemberId : 'enemy'
  const defenderId = defIsPlayer ? ('member-' + defMemberId) : 'enemy'
  activeAttacker.value = attackerId
  activeDefender.value = defenderId

  if (e.isCombo) {
    if (e.isPlayerAttack) comboShadows.push(memberIdByName(e.attacker))
    else comboShadowEnemy.value = true
  }
  if (e.isDodged) {
    floaters[defenderId === 'enemy' ? 'enemy' : 'm-' + memberIdByName(e.defender)] = { text: '闪避', cls: 'dodge' }
    effectBadge.value = { text: '闪避！', cls: 'badge-dodge' }
    return
  }
  if (e.damage > 0) {
    floaters[defenderId === 'enemy' ? 'enemy' : 'm-' + memberIdByName(e.defender)] = { text: e.damage, cls: e.isCrit ? 'crit' : (e.isCounter ? 'counter' : 'normal') }
    const targetMax = e.defenderMaxHP || e.attackerMaxHP || 100
    const ratio = targetMax > 0 ? e.damage / targetMax : 0
    if (e.isCrit || ratio > 0.25) hurtLevel.value = 'strong'
    else if (ratio > 0.1) hurtLevel.value = 'medium'
    else hurtLevel.value = 'mild'
    // 暴击低概率触发状态特效（与旧表现一致）
    if (e.isPlayerAttack && e.isCrit && Math.random() < 0.35) {
      const roll = Math.random()
      if (roll < 0.25) burningTargets.push(defenderId)
      else if (roll < 0.5) frozenTarget.value = defenderId
      else if (roll < 0.75) bleedingTargets.push(defenderId)
      else poisonTargets.push(defenderId)
    }
  }
  if (e.isCrit) {
    effectBadge.value = { text: '暴击！', cls: 'badge-crit' }
    screenShake.value = 'shake-strong'
    setTimeout(() => { if (screenShake.value === 'shake-strong') screenShake.value = '' }, 500)
  }
  if (e.isCombo) effectBadge.value = effectBadge.value || { text: '连击！', cls: 'badge-combo' }
  if (e.isStun) {
    stunTarget.value = defenderId
    shockedTarget.value = defenderId
    if (!effectBadge.value) effectBadge.value = { text: '眩晕！', cls: 'badge-stun' }
  }
  if (e.isVampire && e.isPlayerAttack) {
    const heal = Math.round(e.damage * 0.3)
    if (heal > 0) {
      floaters['m-' + atkMemberId] = { text: '+' + heal, cls: 'vampire' }
      healingTargets.push('member-' + atkMemberId)
      showVampireChain()
      if (!effectBadge.value) effectBadge.value = { text: '吸血', cls: 'badge-vampire' }
    }
  }
  if (!e.isPlayerAttack && e.damage > 0 && !e.isCrit) {
    const ratio = (e.defenderMaxHP || 100) > 0 ? e.damage / (e.defenderMaxHP || 100) : 0
    if (ratio < 0.06 && Math.random() < 0.25) {
      shieldTarget.value = defenderId
      if (!effectBadge.value) effectBadge.value = { text: '护盾', cls: 'badge-shield' }
    }
  }
  if (e.isCounter) {
    if (!effectBadge.value) effectBadge.value = { text: '反击！', cls: 'badge-counter' }
  }
}

// 每个动作（攻击/buff/回复/技能/战场情况）的播放时长：1 秒/动作，节奏紧凑且不频闪
const ACTION_DELAY = 1000
// 播放锁：防止上一回合动画未播完时下一回合重叠调用导致人物抖动
let isPlayingRound = false

// 播放某一回合的所有事件（实时反馈）
async function playLiveRound(roundNum) {
  if (isPlayingRound) return // 上一回合仍在播放，跳过本次（避免动画堆叠抖动）
  isPlayingRound = true
  try {
    const cs = props.encounter?.combatStats || {}
    const events = []
    for (const pid of Object.keys(cs)) {
      const details = cs[pid]?.roundDetails || []
      for (const d of details) if (d.round === roundNum) events.push(d)
    }
    // 玩家先手、敌人后手，顺序更自然
    events.sort((a, b) => (a.isPlayerAttack === b.isPlayerAttack ? 0 : a.isPlayerAttack ? -1 : 1))
    for (const e of events) {
      showEvent(e)
      await delay(ACTION_DELAY)
    }
  } finally {
    isPlayingRound = false
  }
}

// 监听遭遇对象变化（新的一场战斗）：重置瞬态动画
watch(() => props.encounter, (nc) => {
  clearTransient()
  roundWatched.value = nc ? (nc.round || 0) : 0
}, { immediate: true })

// 监听回合推进：先结算、再实时反馈本回合结果
watch(() => props.encounter?.round, (newRound) => {
  if (!newRound || !props.encounter || !props.encounter.inProgress) return
  if (newRound === roundWatched.value) return
  roundWatched.value = newRound
  playLiveRound(newRound)
})

function getMemberClasses(memberId) {
  const classes = []
  if (activeAttacker.value === memberId) classes.push('attacking')
  if (activeDefender.value === 'member-' + memberId) {
    classes.push('hurt', 'hurt-' + hurtLevel.value)
  }
  const p = props.encounter?.players?.find(x => (x.memberId || x.name) === memberId)
  if (p && p.currentHealth <= 0) classes.push('dead')
  return classes.join(' ')
}

function getEnemyClasses() {
  const classes = []
  if (activeAttacker.value === 'enemy') classes.push('attacking')
  if (activeDefender.value === 'enemy') {
    classes.push('hurt', 'hurt-' + hurtLevel.value)
  }
  if (props.encounter?.enemy && props.encounter.enemy.currentHealth <= 0) classes.push('dead')
  return classes.join(' ')
}

function memberHpPct(m) {
  if (!m || !m.stats) return 0
  return Math.max(0, Math.min(100, (m.currentHealth / (m.stats.maxHealth || 1)) * 100))
}

function hpBarColor(pct) {
  if (pct > 60) return 'linear-gradient(90deg, #4ade80, #22c55e)'
  if (pct > 30) return 'linear-gradient(90deg, #fbbf24, #f59e0b)'
  return 'linear-gradient(90deg, #f87171, #ef4444)'
}

onUnmounted(() => {
  clearTransient()
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
/* 完整战斗日志中的「场次分隔符」样式，便于按遭遇区分 */
.battle-log-item.separator {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.08);
  border-left: 3px solid rgba(251, 191, 36, 0.5);
  font-weight: 600;
  letter-spacing: 0.02em;
  margin: 8px 0 4px;
}

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

/* 实时战斗日志弹窗（旧版 logs 系统复刻 LogPanel 风格：时间戳 + 彩色 + 清空按钮） */
.battle-log-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.battle-log-modal-content {
  width: min(620px, 96vw);
  max-height: 82vh;
  background: linear-gradient(180deg, rgba(28, 22, 38, 0.98) 0%, rgba(15, 11, 22, 0.99) 100%);
  border: 1px solid rgba(139, 92, 246, 0.35);
  border-radius: 14px;
  box-shadow: 0 16px 48px rgba(76, 29, 149, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.18) 0%, rgba(139, 92, 246, 0.04) 100%);
  font-size: 15px;
  color: #e5e7eb;
  font-weight: 600;
}
.modal-title {
  color: #c4b5fd;
  letter-spacing: 0.02em;
}
.modal-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-clear-log {
  padding: 4px 12px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  border-radius: 12px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s ease;
}
.btn-clear-log:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fff;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: #d1d5db;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  transition: all 0.15s ease;
}
.close-btn:hover {
  background: rgba(239, 68, 68, 0.35);
  color: #fff;
}

.battle-log-modal-body {
  padding: 12px 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scrollbar-width: thin;
}
.battle-log-modal-body::-webkit-scrollbar {
  width: 6px;
}
.battle-log-modal-body::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.4);
  border-radius: 3px;
}

.empty-log-tip {
  padding: 32px 16px;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
  font-style: italic;
}

/* 实时战斗日志条目：时间戳 + 彩色圆点/头像 + 文本 */
.rt-log-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
  color: #e5e7eb;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.02);
  border-left: 2px solid transparent;
  line-height: 1.55;
  transition: background 0.15s ease;
}
.rt-log-item:hover {
  background: rgba(255, 255, 255, 0.05);
}
.rt-log-time {
  flex-shrink: 0;
  font-size: 10.5px;
  color: #6b7280;
  padding: 1px 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  margin-top: 1px;
}
.rt-log-avatar-wrap {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 1px;
}
.rt-log-avatar {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  object-fit: cover;
}
.rt-log-bullet {
  flex-shrink: 0;
  font-size: 14px;
  line-height: 1;
  color: #9ca3af;
  width: 14px;
  text-align: center;
  margin-top: 2px;
}
.rt-log-text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
  white-space: normal;
}
.rt-log-detail {
  color: #9ca3af;
  font-size: 11px;
}
.rt-log-part {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.rt-log-part-icon {
  width: 18px;
  height: 18px;
  vertical-align: middle;
  border-radius: 3px;
}

/* 按 log type 上色：左侧色条 + 文本色 */
.rt-log-item.info { color: #93c5fd; border-left-color: rgba(147, 197, 253, 0.5); }
.rt-log-item.info .rt-log-bullet { color: #93c5fd; }

.rt-log-item.warning { color: #fbbf24; border-left-color: rgba(251, 191, 36, 0.5); }
.rt-log-item.warning .rt-log-bullet { color: #fbbf24; }

.rt-log-item.header {
  color: #fbbf24;
  font-weight: 700;
  background: rgba(251, 191, 36, 0.08);
  border-left-color: rgba(251, 191, 36, 0.65);
  margin-top: 6px;
  letter-spacing: 0.02em;
}
.rt-log-item.header .rt-log-bullet { color: #fbbf24; }

.rt-log-item.scene { color: #9ca3af; font-style: italic; border-left-color: rgba(156, 163, 175, 0.4); }
.rt-log-item.scene .rt-log-bullet { color: #9ca3af; }

.rt-log-item.enemy-normal { color: #d1d5db; border-left-color: rgba(209, 213, 219, 0.4); }
.rt-log-item.enemy-normal .rt-log-bullet { color: #d1d5db; }
.rt-log-item.enemy-elite { color: #fdba74; border-left-color: rgba(253, 186, 116, 0.5); }
.rt-log-item.enemy-elite .rt-log-bullet { color: #fdba74; }
.rt-log-item.enemy-boss {
  color: #f87171;
  font-weight: 700;
  background: rgba(248, 113, 113, 0.1);
  border-left-color: rgba(248, 113, 113, 0.7);
}
.rt-log-item.enemy-boss .rt-log-bullet { color: #f87171; }

.rt-log-item.combat { color: #e5e7eb; border-left-color: rgba(229, 231, 235, 0.3); }
.rt-log-item.combat .rt-log-bullet { color: #e5e7eb; }

.rt-log-item.vampire { color: #86efac; border-left-color: rgba(134, 239, 172, 0.5); }
.rt-log-item.vampire .rt-log-bullet { color: #86efac; }

.rt-log-item.dodge { color: #9ca3af; font-style: italic; border-left-color: rgba(156, 163, 175, 0.4); }
.rt-log-item.dodge .rt-log-bullet { color: #9ca3af; }

.rt-log-item.crit { color: #fca5a5; font-weight: 600; border-left-color: rgba(252, 165, 165, 0.6); }
.rt-log-item.crit .rt-log-bullet { color: #fca5a5; }

.rt-log-item.shield { color: #fde047; border-left-color: rgba(253, 224, 71, 0.5); }
.rt-log-item.shield .rt-log-bullet { color: #fde047; }

.rt-log-item.counter { color: #93c5fd; border-left-color: rgba(147, 197, 253, 0.5); }
.rt-log-item.counter .rt-log-bullet { color: #93c5fd; }

.rt-log-item.stun { color: #c4b5fd; border-left-color: rgba(196, 181, 253, 0.5); }
.rt-log-item.stun .rt-log-bullet { color: #c4b5fd; }

.rt-log-item.victory {
  color: #4ade80;
  font-weight: 700;
  background: rgba(74, 222, 128, 0.1);
  border-left-color: rgba(74, 222, 128, 0.7);
}
.rt-log-item.victory .rt-log-bullet { color: #4ade80; }

.rt-log-item.defeat {
  color: #f87171;
  font-weight: 700;
  background: rgba(248, 113, 113, 0.1);
  border-left-color: rgba(248, 113, 113, 0.7);
}
.rt-log-item.defeat .rt-log-bullet { color: #f87171; }

.rt-log-item.drop { color: #fbbf24; border-left-color: rgba(251, 191, 36, 0.5); }
.rt-log-item.drop .rt-log-bullet { color: #fbbf24; }

.rt-log-item.drop-rare {
  color: #f0abfc;
  font-weight: 600;
  background: rgba(240, 171, 252, 0.1);
  border-left-color: rgba(240, 171, 252, 0.65);
}
.rt-log-item.drop-rare .rt-log-bullet { color: #f0abfc; }

.rt-log-item.reward-normal { color: #fde047; border-left-color: rgba(253, 224, 71, 0.5); }
.rt-log-item.reward-normal .rt-log-bullet { color: #fde047; }

.rt-log-item.reward-equipment {
  color: #fbbf24;
  font-weight: 600;
  background: rgba(251, 191, 36, 0.08);
  border-left-color: rgba(251, 191, 36, 0.65);
}
.rt-log-item.reward-equipment .rt-log-bullet { color: #fbbf24; }

.rt-log-item.fortune {
  color: #f0abfc;
  font-weight: 600;
  background: rgba(240, 171, 252, 0.08);
  border-left-color: rgba(240, 171, 252, 0.65);
}
.rt-log-item.fortune .rt-log-bullet { color: #f0abfc; }

.rt-log-item.skit {
  color: #93c5fd;
  font-style: italic;
  background: rgba(147, 197, 253, 0.06);
  border-left-color: rgba(147, 197, 253, 0.5);
}
.rt-log-item.skit .rt-log-bullet { color: #93c5fd; }

/* 日间模式：弹窗配色调整 */
html:not(.dark) .battle-log-modal-content {
  background: linear-gradient(180deg, #fdf4ff 0%, #f5f3ff 100%);
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 16px 48px rgba(139, 92, 246, 0.25);
}
html:not(.dark) .modal-header {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-bottom-color: rgba(139, 92, 246, 0.25);
}
html:not(.dark) .modal-title { color: #6d28d9; }
html:not(.dark) .rt-log-item {
  color: #3f3f5a;
  background: rgba(0, 0, 0, 0.02);
}
html:not(.dark) .rt-log-item:hover {
  background: rgba(139, 92, 246, 0.08);
}
html:not(.dark) .rt-log-time {
  color: #6b7280;
  background: rgba(0, 0, 0, 0.05);
}
html:not(.dark) .rt-log-detail {
  color: #6b7280;
}
html:not(.dark) .empty-log-tip {
  color: #9ca3af;
}
html:not(.dark) .rt-log-item.info { color: #2563eb; border-left-color: rgba(37, 99, 235, 0.5); }
html:not(.dark) .rt-log-item.info .rt-log-bullet { color: #2563eb; }
html:not(.dark) .rt-log-item.warning { color: #d97706; border-left-color: rgba(217, 119, 6, 0.5); }
html:not(.dark) .rt-log-item.warning .rt-log-bullet { color: #d97706; }
html:not(.dark) .rt-log-item.header { color: #d97706; background: rgba(217, 119, 6, 0.08); border-left-color: rgba(217, 119, 6, 0.65); }
html:not(.dark) .rt-log-item.header .rt-log-bullet { color: #d97706; }
html:not(.dark) .rt-log-item.scene { color: #6b7280; border-left-color: rgba(107, 114, 128, 0.4); }
html:not(.dark) .rt-log-item.scene .rt-log-bullet { color: #6b7280; }
html:not(.dark) .rt-log-item.enemy-normal { color: #4b5563; border-left-color: rgba(75, 85, 99, 0.4); }
html:not(.dark) .rt-log-item.enemy-normal .rt-log-bullet { color: #4b5563; }
html:not(.dark) .rt-log-item.enemy-elite { color: #ea580c; border-left-color: rgba(234, 88, 12, 0.5); }
html:not(.dark) .rt-log-item.enemy-elite .rt-log-bullet { color: #ea580c; }
html:not(.dark) .rt-log-item.enemy-boss { color: #dc2626; background: rgba(220, 38, 38, 0.1); border-left-color: rgba(220, 38, 38, 0.7); }
html:not(.dark) .rt-log-item.enemy-boss .rt-log-bullet { color: #dc2626; }
html:not(.dark) .rt-log-item.combat { color: #1f2937; border-left-color: rgba(31, 41, 55, 0.3); }
html:not(.dark) .rt-log-item.combat .rt-log-bullet { color: #1f2937; }
html:not(.dark) .rt-log-item.vampire { color: #16a34a; border-left-color: rgba(22, 163, 74, 0.5); }
html:not(.dark) .rt-log-item.vampire .rt-log-bullet { color: #16a34a; }
html:not(.dark) .rt-log-item.dodge { color: #6b7280; border-left-color: rgba(107, 114, 128, 0.4); }
html:not(.dark) .rt-log-item.dodge .rt-log-bullet { color: #6b7280; }
html:not(.dark) .rt-log-item.crit { color: #b91c1c; border-left-color: rgba(185, 28, 28, 0.6); }
html:not(.dark) .rt-log-item.crit .rt-log-bullet { color: #b91c1c; }
html:not(.dark) .rt-log-item.shield { color: #ca8a04; border-left-color: rgba(202, 138, 4, 0.5); }
html:not(.dark) .rt-log-item.shield .rt-log-bullet { color: #ca8a04; }
html:not(.dark) .rt-log-item.counter { color: #2563eb; border-left-color: rgba(37, 99, 235, 0.5); }
html:not(.dark) .rt-log-item.counter .rt-log-bullet { color: #2563eb; }
html:not(.dark) .rt-log-item.stun { color: #7c3aed; border-left-color: rgba(124, 58, 237, 0.5); }
html:not(.dark) .rt-log-item.stun .rt-log-bullet { color: #7c3aed; }
html:not(.dark) .rt-log-item.victory { color: #16a34a; background: rgba(22, 163, 74, 0.1); border-left-color: rgba(22, 163, 74, 0.7); }
html:not(.dark) .rt-log-item.victory .rt-log-bullet { color: #16a34a; }
html:not(.dark) .rt-log-item.defeat { color: #dc2626; background: rgba(220, 38, 38, 0.1); border-left-color: rgba(220, 38, 38, 0.7); }
html:not(.dark) .rt-log-item.defeat .rt-log-bullet { color: #dc2626; }
html:not(.dark) .rt-log-item.drop { color: #ca8a04; border-left-color: rgba(202, 138, 4, 0.5); }
html:not(.dark) .rt-log-item.drop .rt-log-bullet { color: #ca8a04; }
html:not(.dark) .rt-log-item.drop-rare { color: #c026d3; background: rgba(192, 38, 211, 0.1); border-left-color: rgba(192, 38, 211, 0.65); }
html:not(.dark) .rt-log-item.drop-rare .rt-log-bullet { color: #c026d3; }
html:not(.dark) .rt-log-item.reward-normal { color: #ca8a04; border-left-color: rgba(202, 138, 4, 0.5); }
html:not(.dark) .rt-log-item.reward-normal .rt-log-bullet { color: #ca8a04; }
html:not(.dark) .rt-log-item.reward-equipment { color: #ca8a04; background: rgba(202, 138, 4, 0.08); border-left-color: rgba(202, 138, 4, 0.65); }
html:not(.dark) .rt-log-item.reward-equipment .rt-log-bullet { color: #ca8a04; }
html:not(.dark) .rt-log-item.fortune { color: #c026d3; background: rgba(192, 38, 211, 0.08); border-left-color: rgba(192, 38, 211, 0.65); }
html:not(.dark) .rt-log-item.fortune .rt-log-bullet { color: #c026d3; }
html:not(.dark) .rt-log-item.skit { color: #2563eb; background: rgba(37, 99, 235, 0.06); border-left-color: rgba(37, 99, 235, 0.5); }
html:not(.dark) .rt-log-item.skit .rt-log-bullet { color: #2563eb; }

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
