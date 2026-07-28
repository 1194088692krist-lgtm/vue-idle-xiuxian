<template>
  <!-- 击杀BOSS立绘突入演出层：纯CSS动画，GPU合成层，pointer-events:none不挡挂机 -->
  <teleport to="body">
    <div v-if="show" class="boss-kill-cinematic" aria-hidden="true">
      <!-- 全屏一闪：斩杀冲击白光 -->
      <div :key="`flash-${animKey}`" class="kill-flash"></div>
      <!-- 中心顿帧光晕 -->
      <div :key="`glow-${animKey}`" class="kill-glow"></div>
      <!-- 击杀者立绘：左下突入→中心旋转→右上消失，纯 transform+opacity 走 GPU 合成层 -->
      <!-- :key=animKey 强制每次击杀都重建 <img>，确保 CSS 动画可靠重启
           （旧实现复用同一 <img> 仅换 src 时 CSS 动画不会重启，导致挂机连斩第二只起立绘不再弹出） -->
      <img
        v-if="portraitUrl"
        :key="`portrait-${animKey}`"
        :src="portraitUrl"
        class="kill-portrait"
        :alt="killerName"
        @animationend="onPortraitAnimEnd"
      />
      <!-- 灵宠立绘：人物立绘弹出 1s 后从另一侧（右下→中心→左上）弹出，与人物相差约 1s -->
      <img
        v-if="petPortraitUrl && petShow"
        :key="`pet-${petAnimKey}`"
        :src="petPortraitUrl"
        class="kill-pet-portrait"
        :alt="petName"
        @animationend="onPetAnimEnd"
      />
      <!-- 几片飘动粒子（灵光） -->
      <div :key="`p1-${animKey}`" class="kill-particle p1"></div>
      <div :key="`p2-${animKey}`" class="kill-particle p2"></div>
      <div :key="`p3-${animKey}`" class="kill-particle p3"></div>
      <!-- 击杀文案 -->
      <div :key="`text-${animKey}`" class="kill-text">
        <div class="kill-subtitle">斩杀</div>
        <div class="kill-bossname">{{ bossName }}</div>
      </div>
      <!-- 连击特效：双杀 / 三杀 等 -->
      <div v-if="comboLabel" :key="`combo-${animKey}`" class="kill-combo" :class="comboClass">
        <span class="combo-text">{{ comboLabel }}</span>
        <span v-if="comboCount > 1" class="combo-count">×{{ comboCount }}</span>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useIdleSystem } from '../composables/useIdleSystem'
import { usePlayerStore } from '../stores/player'
import { getCharacterAvatar, getCharacterSkinUrl, getSkinCount } from '../plugins/characters'
import { getPetAvatar, getPetSkinUrl, getPetSkinCount, getUnlockedSkinCount, getPetTemplateId } from '../plugins/pets'

const { bossKillEvent } = useIdleSystem()
const playerStore = usePlayerStore()

const show = ref(false)
const portraitUrl = ref(null)
const killerName = ref('')
const bossName = ref('')
// 每次击杀递增的动画 key，强制 <img> 重建以重启 CSS 动画
const animKey = ref(0)

// 灵宠立绘状态：人物立绘弹出 1s 后再弹出，与人物相差约 1s
const petShow = ref(false)
const petPortraitUrl = ref(null)
const petName = ref('')
const petAnimKey = ref(0)
let petDelayTimer = null

const comboLabel = ref('')
const comboClass = ref('')
const comboCount = ref(0)

// ===== 连击系统 =====
// 连击窗口：每次击杀BOSS后 12 秒内再次击杀则连击+1，超时重置
const COMBO_WINDOW_MS = 12000
let comboTimerId = null
let currentCombo = 0

// 连击等级表：根据连续击杀数返回中文标签与样式类
// 与本修仙游戏风格一致，避免使用 Double Kill、Triple Kill 等英文
function getComboTier(count) {
  if (count < 2) return { label: '', class: '' }
  if (count === 2) return { label: '双杀', class: 'combo-double' }
  if (count === 3) return { label: '三杀', class: 'combo-triple' }
  if (count === 4) return { label: '四杀', class: 'combo-quadra' }
  if (count === 5) return { label: '五杀', class: 'combo-penta' }
  if (count === 6) return { label: '暴走', class: 'combo-spree' }
  if (count === 7) return { label: '狂暴', class: 'combo-rampage' }
  if (count === 8) return { label: '不可阻挡', class: 'combo-unstoppable' }
  if (count === 9) return { label: '主宰比赛', class: 'combo-dominating' }
  if (count === 10) return { label: '超神', class: 'combo-godlike' }
  return { label: '传奇', class: 'combo-legendary' }
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

// 清理所有挂起的延时任务，防止组件卸载后仍 setState
function clearPendingTimers() {
  if (comboTimerId) { clearTimeout(comboTimerId); comboTimerId = null }
  if (petDelayTimer) { clearTimeout(petDelayTimer); petDelayTimer = null }
  if (hideTimerId) { clearTimeout(hideTimerId); hideTimerId = null }
}

onUnmounted(() => {
  clearPendingTimers()
})

// ===== 兜底隐藏：动画结束后或超时后强制隐藏，防止 animationend 未触发导致 show 卡死 =====
// CSS 动画总时长约 1.8s，留 2.5s 兜底；多次击杀时重新计时
let hideTimerId = null
function scheduleAutoHide() {
  if (hideTimerId) clearTimeout(hideTimerId)
  // 人物立绘 2.5s + 灵宠 1s 延迟 + 1.8s ≈ 5.3s，给 6s 兜底
  hideTimerId = setTimeout(() => {
    if (show.value) {
      show.value = false
      portraitUrl.value = null
      petShow.value = false
      petPortraitUrl.value = null
    }
    hideTimerId = null
  }, 6000)
}

// 监听击杀事件，触发立绘突入动画
watch(bossKillEvent, (evt) => {
  // 诊断日志：确认 watch 是否被触发（排查挂机立绘不弹出的关键证据）
  console.log('[BossKillCinematic] watch 触发', evt)
  if (!evt || !evt.ts) {
    console.warn('[BossKillCinematic] 事件无效，跳过', evt)
    return
  }
  // 设置开关关闭则不触发
  if (!playerStore.bossKillAnimation) {
    console.log('[BossKillCinematic] bossKillAnimation 设置已关闭，跳过')
    return
  }

  // ===== 人物立绘来源 =====
  // 从存活队伍成员中随机选一个，确保平均分布（每人 ~33%）
  // 旧实现优先使用 killerMemberId（实际斩杀者），但实际斩杀者往往是同一角色
  // （最强DPS每次都补刀），导致 9/10 次都显示同一角色，无法看到其他角色的击杀立绘。
  // 改为纯随机：三个角色都设了击杀立绘，随机播放才能让玩家都看到。
  let member = null
  if (playerStore.teamMembers && playerStore.teamMembers.length > 0) {
    const aliveMembers = playerStore.teamMembers
      .map(id => playerStore.sectMembers.find(m => m.id === id))
      .filter(m => m && m.id)
    if (aliveMembers.length > 0) {
      member = aliveMembers[Math.floor(Math.random() * aliveMembers.length)]
    }
  }
  // 兜底：队伍为空时尝试用事件中的 killerMemberId
  if (!member && evt.killerMemberId) {
    member = playerStore.sectMembers.find(m => m.id === evt.killerMemberId)
      || playerStore.sectMembers.find(m => (m.templateId || m.id) === evt.killerMemberId)
  }
  if (!member) return

  // 立绘索引：使用该角色自己的击杀立绘设置（characterKillSkins[memberId]）
  // 关键修复：键必须与 CharacterPortraitModal 保存时一致，即 templateId 优先（与
  // getCharacterAvatar / getCharacterSkinUrl 内部 id 取值口径一致）
  // 旧实现用 member.id || member.templateId，与保存时的 templateId || id 不匹配，
  // 导致查找结果恒为 undefined，立绘永远回退到原皮肤（用户反馈的 bug）
  const characterKey = member.templateId || member.id
  const skinIdx = Number(playerStore.characterKillSkins?.[characterKey]) || 0
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

  // ===== 重启动画的可靠方案：递增 animKey 让 Vue 销毁旧 <img> 并创建新 <img> =====
  // 旧实现靠 show=false → nextTick → show=true 切换，nextTick 在 Vue 内部可能与
  // 同 tick 的其他状态变更合并，导致 <img> 未真正卸载，CSS 动画无法重启，
  // 表现为「挂机连斩第二只起立绘不再弹出」。
  // 新方案：所有子元素（img/光晕/粒子/连击/文案）都通过 :key="...-${animKey}" 绑定，
  // 每次 animKey++ 让 Vue 创建全新 DOM 节点，浏览器从 0% 重新开始 CSS 动画，
  // 旧节点被卸载后其动画自然停止（不会触发错误的 animationend 干扰新动画）。
  // 先清理上一次的灵宠延时（防止上一个宠物立绘抢点）
  if (petDelayTimer) { clearTimeout(petDelayTimer); petDelayTimer = null }
  petShow.value = false
  petPortraitUrl.value = null

  portraitUrl.value = url
  killerName.value = member.name || ''
  bossName.value = evt.bossName || ''
  animKey.value++
  show.value = true
  scheduleAutoHide()
  schedulePetPortrait()
  console.log('[BossKillCinematic] 立绘已设置，show=true', { url: url.slice(0, 50), killerName: killerName.value, bossName: bossName.value })
}, { deep: true })

// ===== 灵宠立绘：人物立绘弹出 1s 后从另一侧弹出 =====
function schedulePetPortrait() {
  const pet = playerStore.activePet
  if (!pet) return
  // 灵宠立绘 URL（按灵宠自己的击杀立绘设置取皮肤，未设默认原立绘）
  const petKey = getPetTemplateId(pet)
  const petSkinIdx = Number(playerStore.petKillSkins?.[petKey]) || 0
  let petUrl = null
  if (petSkinIdx > 0) {
    const petSkinCount = getPetSkinCount(pet)
    const unlocked = getUnlockedSkinCount(pet, playerStore.petSkinUnlockRecord)
    // 仅当该皮肤已解锁且确实存在时才使用
    if (petSkinIdx <= petSkinCount && petSkinIdx <= unlocked) {
      petUrl = getPetSkinUrl(pet, petSkinIdx)
    }
  }
  if (!petUrl) petUrl = getPetAvatar(pet, 'full')
  if (!petUrl) return

  // 1s 延迟：人物立绘先弹出，1s 后灵宠从另一侧弹出
  // 两者出现/消失相差约 1s，避免动画过于拖沓
  petDelayTimer = setTimeout(() => {
    petPortraitUrl.value = petUrl
    petName.value = pet.name || ''
    petAnimKey.value++
    petShow.value = true
    petDelayTimer = null
  }, 1000)
}

const onPortraitAnimEnd = () => {
  // 诊断日志：确认人物立绘动画结束事件触发
  console.log('[BossKillCinematic] 人物立绘 animationend')
  // 人物立绘动画播完：移除外层节点
  // 若灵宠立绘仍在播放则保留外层（petShow 仍 true）
  if (!petShow.value) {
    show.value = false
    portraitUrl.value = null
    if (hideTimerId) { clearTimeout(hideTimerId); hideTimerId = null }
  }
}

const onPetAnimEnd = () => {
  // 诊断日志：确认灵宠立绘动画结束事件触发
  console.log('[BossKillCinematic] 灵宠立绘 animationend')
  // 灵宠立绘动画播完：清除灵宠状态，并连同外层一起隐藏
  petShow.value = false
  petPortraitUrl.value = null
  show.value = false
  portraitUrl.value = null
  if (hideTimerId) { clearTimeout(hideTimerId); hideTimerId = null }
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

/* 人物立绘主体：左下突入→中心旋转顿帧→右上消失，纯 transform+opacity 走 GPU 合成层 */
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

/* 灵宠立绘：右下突入→中心顿帧→左上消失，与人物立绘轨迹镜像对称
   - 与人物立绘相差约 1s 出现（由 JS setTimeout(1000) 控制）
   - 动画时长同为 1.8s，确保整体节奏紧凑不拖沓 */
.kill-pet-portrait {
  position: absolute;
  width: min(50vw, 360px);
  max-height: 60vh;
  object-fit: contain;
  border-radius: 12px;
  filter: drop-shadow(0 0 20px rgba(120, 220, 100, 0.7));
  animation: pet-slash 1.8s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
  will-change: transform, opacity;
  /* 偏右下角定位，避免与人物立绘在中心位置完全重叠 */
  right: 8%;
  bottom: 18%;
}
@keyframes pet-slash {
  0% {
    transform: translate(60vw, 60vh) rotate(200deg) scale(0.5);
    opacity: 0;
  }
  35% {
    transform: translate(0, 0) rotate(0deg) scale(1.1);
    opacity: 1;
  }
  55% {
    transform: translate(0, 0) rotate(-8deg) scale(1.1);
    opacity: 1; /* 中心顿帧 */
  }
  100% {
    transform: translate(-60vw, -60vh) rotate(-200deg) scale(0.5);
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
  letter-spacing: 4px;
  /* 中文斩杀特效不使用斜体（中文字符斜体显示效果差） */
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
