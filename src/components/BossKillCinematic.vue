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
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useIdleSystem } from '../composables/useIdleSystem'
import { usePlayerStore } from '../stores/player'
import { getCharacterAvatar, getCharacterSkinUrl, getSkinCount } from '../plugins/characters'

const { bossKillEvent } = useIdleSystem()
const playerStore = usePlayerStore()

const show = ref(false)
const portraitUrl = ref(null)
const killerName = ref('')
const bossName = ref('')

// 监听击杀事件，触发立绘突入动画
watch(bossKillEvent, (evt) => {
  if (!evt || !evt.ts) return
  // 设置开关关闭则不触发
  if (!playerStore.bossKillAnimation) return

  // 立绘来源角色选择：
  // 1. 若用户在立绘弹窗设置了 bossKillCharacterId，优先用该固定角色
  // 2. 否则跟随斩杀者（致命一击者），找不到则随机队伍成员（避免总是第一人）
  let member = null
  const fixedCharId = playerStore.bossKillCharacterId
  if (fixedCharId) {
    member = playerStore.sectMembers.find(m => (m.templateId || m.id) === fixedCharId)
  }
  if (!member) {
    // 跟随斩杀者（致命一击者）
    const memberId = evt.killerMemberId
    if (memberId) {
      member = playerStore.sectMembers.find(m => m.id === memberId)
    }
    // 兜底：从存活队伍成员中随机选一个（避免总是第一人）
    if (!member && playerStore.teamMembers && playerStore.teamMembers.length > 0) {
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
    // 指定皮肤不存在（角色没那么多皮肤）则回退原立绘
    if (skinIdx <= skinCount) {
      url = getCharacterSkinUrl(member, skinIdx)
    }
  }
  if (!url) url = getCharacterAvatar(member, 'full')
  if (!url) return

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

/* 尊重无障碍：减弱动画偏好下不播放演出 */
@media (prefers-reduced-motion: reduce) {
  .boss-kill-cinematic { display: none; }
}
</style>
