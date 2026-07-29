<template>
  <!-- 人物 BOSS 入场演出：立绘从屏幕上方滑入、居中展示后从下方滑出 -->
  <teleport to="body">
    <div v-if="intro.show" class="char-boss-intro-overlay" @click="dismiss">
      <div class="char-boss-intro-stage" :key="intro.characterId + '-' + intro.name">
        <div class="char-boss-intro-portrait-wrap">
          <img
            :src="intro.portrait"
            class="char-boss-intro-portrait"
            :alt="intro.name"
            decoding="async"
            @error="onImgError"
          />
          <div class="char-boss-intro-vignette"></div>
        </div>
        <div class="char-boss-intro-banner">
          <div class="char-boss-intro-stars">{{ '★'.repeat(intro.star || 1) }}</div>
          <div class="char-boss-intro-name">{{ intro.name }}</div>
          <div class="char-boss-intro-sub">人物形态 · BOSS</div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { watch } from 'vue'
import { useIdleSystem } from '../composables/useIdleSystem'

const props = defineProps({
  // 显式传入的覆盖（默认从 useIdleSystem 取）
  intro: { type: Object, default: null }
})

const idleSystem = useIdleSystem()
const intro = props.intro || idleSystem.characterBossIntro

function onImgError(e) {
  e.target.style.opacity = '0.2'
}
function dismiss() {
  intro.value = { show: false, characterId: null, name: '', portrait: '', star: 0 }
}

// 兜底：若 2.4s 定时器未触发（如组件挂载时机问题），4s 后强制关闭
watch(
  () => intro.value && intro.value.show,
  (show) => {
    if (show) {
      setTimeout(() => {
        if (intro.value && intro.value.show) {
          intro.value = { show: false, characterId: null, name: '', portrait: '', star: 0 }
        }
      }, 4000)
    }
  }
)
</script>

<style scoped>
.char-boss-intro-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(20, 5, 30, 0.88) 0%, rgba(0, 0, 0, 0.96) 70%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  cursor: pointer;
}

.char-boss-intro-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: charBossIntroEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.char-boss-intro-stage.leaving {
  animation: charBossIntroLeave 0.6s cubic-bezier(0.7, 0, 0.84, 0) forwards;
}

.char-boss-intro-portrait-wrap {
  position: relative;
  width: min(80vw, 320px);
  aspect-ratio: 3/4;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 0 60px rgba(218, 165, 32, 0.5), 0 0 20px rgba(255, 80, 80, 0.4);
  border: 2px solid rgba(218, 165, 32, 0.6);
}

.char-boss-intro-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  animation: charBossIntroHold 2.4s ease-in-out forwards;
}

.char-boss-intro-vignette {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.85) 100%);
  pointer-events: none;
}

.char-boss-intro-banner {
  margin-top: 18px;
  text-align: center;
  animation: charBossBannerFade 0.4s ease 0.3s both;
}

.char-boss-intro-stars {
  color: #FFD700;
  font-size: 18px;
  letter-spacing: 2px;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
  margin-bottom: 4px;
}

.char-boss-intro-name {
  font-size: 26px;
  font-weight: 700;
  color: #FF8C00;
  text-shadow: 0 0 12px rgba(255, 140, 0, 0.7), 0 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 2px;
}

.char-boss-intro-sub {
  margin-top: 4px;
  font-size: 13px;
  color: #C9C4BA;
  letter-spacing: 1px;
}

/* 入场：从屏幕上方滑入到中心 */
@keyframes charBossIntroEnter {
  0% {
    transform: translateY(-110vh) scale(0.85);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* 离场：从屏幕中心向下方滑出 */
@keyframes charBossIntroLeave {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) scale(0.85);
    opacity: 0;
  }
}

/* 立绘停留期间的轻微缩放呼吸（入场后） */
@keyframes charBossIntroHold {
  0% { transform: scale(1.08); }
  60% { transform: scale(1); }
  100% { transform: scale(1.02); }
}

@keyframes charBossBannerFade {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 移动端适配 */
@media (max-width: 600px) {
  .char-boss-intro-portrait-wrap {
    width: 70vw;
  }
  .char-boss-intro-name {
    font-size: 22px;
  }
}
</style>
