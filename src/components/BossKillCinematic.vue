<template>
  <!-- 击杀BOSS立绘突入演出层：纯CSS动画，GPU合成层，pointer-events:none不挡挂机 -->
  <teleport to="body">
    <div v-if="show" class="boss-kill-cinematic" aria-hidden="true">
      <!-- 全屏一闪：斩杀冲击白光 -->
      <div class="kill-flash"></div>
      <!-- 中心顿帧光晕 -->
      <div class="kill-glow"></div>
      <!-- 击杀者立绘：左下突入→中心旋转→右上消失 -->
      <img
        v-if="portraitUrl"
        :src="portraitUrl"
        class="kill-portrait"
        :alt="killerName"
        @animationend="onAnimationEnd"
      />
      <!-- 几片飘动粒子（灵光） -->
      <div class="kill-particle p1"></div>
      <div class="kill-particle p2"></div>
      <div class="kill-particle p3"></div>
      <!-- 击杀文案 -->
      <div class="kill-text">
        <div class="kill-subtitle">斩杀</div>
        <div class="kill-bossname">{{ bossName }}</div>
      </div>
      <!-- 连击特效：Double Kill / Triple Kill 等 -->
      <div v-if="comboLabel" class="kill-combo" :class="comboClass">
        <span class="combo-text">{{ comboLabel }}</span>
        <span v-if="comboCount > 1" class="combo-count">×{{ comboCount }}</span>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { useIdleSystem } from '../composables/useIdleSystem'
import { usePlayerStore } from '../stores/player'
import { getCharacterAvatar, getCharacterSkinUrl, getSkinCount } from '../plugins/characters'

const { bossKillEvent } = useIdleSystem()
const playerStore = usePlayerStore()

const show = ref(false)
const portraitUrl = ref(null)
const killerName = ref('')
const bossName = ref('')
const comboLabel = ref('')
const comboClass = ref('')
const comboCount = ref(0)

// ===== 连击系统 =====
// 连击窗口：每次击杀BOSS后 12 秒内再次击杀则连击+1，超时重置
const COMBO_WINDOW_MS = 12000
let comboTimerId = null
let currentCombo = 0

// 连击等级表：根据连续击杀数返回标签与样式类
function getComboTier(count) {
  if (count < 2) return { label: '', class: '' }
  if (count === 2) return { label: 'DOUBLE KILL', class: 'combo-double' }
  if (count === 3) return { label: 'TRIPLE KILL', class: 'combo-triple' }
  if (count === 4) return { label: 'QUADRA KILL', class: 'combo-quadra' }
  if (count === 5) return { label: 'PENTA KILL', class: 'combo-penta' }
  if (count === 6) return { label: 'KILLING SPREE', class: 'combo-spree' }
  if (count === 7) return { label: 'RAMPAGE', class: 'combo-rampage' }
  if (count === 8) return { label: 'UNSTOPPABLE', class: 'combo-unstoppable' }
  if (count === 9) return { label: 'DOMINATING', class: 'combo-dominating' }
  if (count === 10) return { label: 'GODLIKE', class: 'combo-godlike' }
  return { label: 'LEGENDARY', class: 'combo-legendary' }
}

function bumpCombo() {
  currentCombo++
  const tier = getComboTier(currentCombo)
  comboLabel.value = tier.label
  comboClass.value = tier.class
  comboCount.value = currentCombo
  // 重置连击窗口计时器
  if (comboTimerId) clearTimeout(comboTimerId)
  comboTimerId = setTimeout(() => {
    currentCombo = 0
    comboLabel.value = ''
    comboClass.value = ''
    comboCount.value = 0
    comboTimerId = null
  }, COMBO_WINDOW_MS)
}

onUnmounted(() => {
  if (comboTimerId) clearTimeout(comboTimerId)
})

// 监听击杀事件，触发立绘突入动画
watch(bossKillEvent, (evt) => {
  if (!evt || !evt.ts) return
  // 设置开关关闭则不触发
  if (!playerStore.bossKillAnimation) return

  // 立绘来源：随机播放三人中的一个（用户可为每个角色指定立绘）
  // 优先使用 bossKillCharacterId 固定角色；否则从队伍存活成员中随机选
  let member = null
  const fixedCharId = playerStore.bossKillCharacterId
  if (fixedCharId) {
    member = playerStore.sectMembers.find(m => (m.templateId || m.id) === fixedCharId)
  }
  if (!member) {
    // 从队伍存活成员中随机选一个
    if (playerStore.teamMembers && playerStore.teamMembers.length > 0) {
      const aliveMembers = playerStore.teamMembers
        .map(id => playerStore.sectMembers.find(m => m.id === id))
        .filter(m => m && m.id)
      if (aliveMembers.length > 0) {
        member = aliveMembers[Math.floor(Math.random() * aliveMembers.length)]
      }
    }
  }
  if (!member) return

  // 按设置选择立绘索引：0=原立绘 1-3=skin
  const skinIdx = playerStore.bossKillSkinIndex || 0
  let url = null
  if (skinIdx > 0) {
    const skinCount = getSkinCount(member)
    if (skinIdx <= skinCount) {
      url = getCharacterSkinUrl(member, skinIdx)
    }
  }
  if (!url) url = getCharacterAvatar(member, 'full')
  if (!url) return

  // 触发连击计数
  bumpCombo()

  // 多场连打时（手动BOSS挑战count>1），上一次动画可能还在播放
  // 先重置 show 让 <img> 卸载，nextTick 后再设 true 重新触发 CSS animation
  if (show.value) {
    show.value = false
    nextTick(() => {
      portraitUrl.value = url
      killerName.value = evt.killerName || member.name || ''
      bossName.value = evt.bossName || ''
      show.value = true
    })
  } else {
    portraitUrl.value = url
    killerName.value = evt.killerName || member.name || ''
    bossName.value = evt.bossName || ''
    show.value = true
  }
}, { deep: true })

const onAnimationEnd = () => {
  // 动画播完移除节点，内存零残留
  show.value = false
  portraitUrl.value = null
}
</script>

<style scoped>
.boss-kill-cinematic {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* 不挡挂机点击 */
  overflow: hidden;
}

/* 立绘主体：左下突入→中心旋转顿帧→右上消失，纯 transform+opacity 走 GPU 合成层 */
.kill-portrait {
  position: relative;
  width: min(70vw, 520px);
  max-height: 80vh;
  object-fit: contain;
  border-radius: 12px;
  filter: drop-shadow(0 0 24px rgba(255, 215, 0, 0.7));
  animation: boss-slash 1.8s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
  will-change: transform, opacity;
}

@keyframes boss-slash {
  0% {
    transform: translate(-60vw, 60vh) rotate(-200deg) scale(0.6);
    opacity: 0;
  }
  35% {
    transform: translate(0, 0) rotate(0deg) scale(1.15);
    opacity: 1;
  }
  55% {
    transform: translate(0, 0) rotate(8deg) scale(1.15);
    opacity: 1; /* 中心顿帧 */
  }
  100% {
    transform: translate(60vw, -60vh) rotate(200deg) scale(0.6);
    opacity: 0;
  }
}

/* 全屏一闪：0.3s 白光冲击 */
.kill-flash {
  position: absolute;
  inset: 0;
  background: #fff;
  opacity: 0;
  animation: flash-anim 0.3s ease-out forwards;
}
@keyframes flash-anim {
  0% { opacity: 0; }
  30% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 中心光晕：立绘顿帧时的金色辐射 */
.kill-glow {
  position: absolute;
  width: 60vmin;
  height: 60vmin;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.45) 0%, rgba(255, 140, 0, 0.2) 40%, transparent 70%);
  opacity: 0;
  animation: glow-anim 1.8s ease-out forwards;
}
@keyframes glow-anim {
  0% { opacity: 0; transform: scale(0.5); }
  35% { opacity: 0.9; transform: scale(1); }
  60% { opacity: 0.6; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(1.3); }
}

/* 飘动粒子：3片灵光，各自 transform 动画 */
.kill-particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #FFD700;
  box-shadow: 0 0 8px #FFD700;
  opacity: 0;
}
.p1 { left: 30%; top: 40%; animation: particle-1 1.8s ease-out forwards; }
.p2 { left: 60%; top: 50%; animation: particle-2 1.8s ease-out forwards; }
.p3 { left: 50%; top: 30%; animation: particle-3 1.8s ease-out forwards; }

@keyframes particle-1 {
  0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translate(-120px, -80px) scale(1.2); }
}
@keyframes particle-2 {
  0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
  40% { opacity: 1; }
  100% { opacity: 0; transform: translate(100px, -60px) scale(1.1); }
}
@keyframes particle-3 {
  0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
  50% { opacity: 1; }
  100% { opacity: 0; transform: translate(0, -140px) scale(1.3); }
}

/* 击杀文案 */
.kill-text {
  position: absolute;
  bottom: 12%;
  text-align: center;
  color: #FFD700;
  text-shadow: 0 0 12px rgba(0, 0, 0, 0.9), 0 2px 4px rgba(0, 0, 0, 0.8);
  opacity: 0;
  animation: text-anim 1.8s ease-out forwards;
}
.kill-subtitle {
  font-size: 18px;
  letter-spacing: 6px;
  opacity: 0.85;
}
.kill-bossname {
  font-size: 32px;
  font-weight: bold;
  margin-top: 4px;
}
@keyframes text-anim {
  0% { opacity: 0; transform: translateY(20px); }
  40% { opacity: 1; transform: translateY(0); }
  75% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-10px); }
}

/* ===== 连击特效 ===== */
/* 位置：屏幕右上角，从右侧滑入后弹跳停留，再淡出消失 */
.kill-combo {
  position: absolute;
  top: 18%;
  right: 8%;
  display: flex;
  align-items: baseline;
  gap: 8px;
  opacity: 0;
  animation: combo-in 1.8s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
  text-shadow: 0 0 16px currentColor, 0 0 32px currentColor, 0 2px 6px rgba(0, 0, 0, 0.9);
  -webkit-text-stroke: 1px rgba(0, 0, 0, 0.4);
}
.combo-text {
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 2px;
  font-style: italic;
}
.combo-count {
  font-size: 28px;
  font-weight: 700;
  opacity: 0.9;
}
@keyframes combo-in {
  0% { opacity: 0; transform: translateX(80px) scale(0.3) rotate(-10deg); }
  25% { opacity: 1; transform: translateX(0) scale(1.3) rotate(3deg); }
  40% { transform: translateX(0) scale(1) rotate(-2deg); }
  55% { transform: translateX(0) scale(1.1) rotate(1deg); }
  70% { transform: translateX(0) scale(1) rotate(0deg); }
  85% { opacity: 1; }
  100% { opacity: 0; transform: translateX(40px) scale(0.8) rotate(5deg); }
}

/* 连击等级配色：从蓝→紫→金→红，强度递增 */
.combo-double { color: #4FC3F7; }        /* 浅蓝 */
.combo-triple { color: #BA68C8; }         /* 紫 */
.combo-quadra { color: #FFB300; }         /* 金橙 */
.combo-penta { color: #FF6E40; }          /* 橙红 */
.combo-spree { color: #FF5252; }          /* 红 */
.combo-rampage { color: #FF1744; }        /* 深红 */
.combo-unstoppable { color: #D500F9; }    /* 品红 */
.combo-dominating { color: #00E5FF; }     /* 青蓝 */
.combo-godlike { color: #FFD600; }        /* 金黄 */
.combo-legendary {
  color: #FFD600;
  animation: combo-in-legendary 1.8s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards, legendary-glow 0.8s ease-in-out infinite alternate 1.8s;
}
@keyframes legendary-glow {
  0% { text-shadow: 0 0 16px #FFD600, 0 0 32px #FF6E40, 0 2px 6px rgba(0,0,0,0.9); }
  100% { text-shadow: 0 0 28px #FFD600, 0 0 56px #FF1744, 0 0 84px #D500F9, 0 2px 6px rgba(0,0,0,0.9); }
}
@keyframes combo-in-legendary {
  0% { opacity: 0; transform: translateX(80px) scale(0.3) rotate(-10deg); }
  25% { opacity: 1; transform: translateX(0) scale(1.4) rotate(3deg); }
  40% { transform: translateX(0) scale(1) rotate(-2deg); }
  55% { transform: translateX(0) scale(1.15) rotate(1deg); }
  70% { transform: translateX(0) scale(1) rotate(0deg); }
  85% { opacity: 1; }
  100% { opacity: 0; transform: translateX(40px) scale(0.8) rotate(5deg); }
}

/* 尊重无障碍：减弱动画偏好下不播放演出 */
@media (prefers-reduced-motion: reduce) {
  .boss-kill-cinematic { display: none; }
}
</style>
