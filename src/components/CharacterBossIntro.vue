<template>
  <!-- 人物 BOSS 入场演出：立绘从屏幕上方滑入、居中展示后从下方滑出 -->
  <teleport to="body">
    <div v-if="intro.show" class="char-boss-intro-overlay" :class="{ 'theme-wraith': intro.theme === 'wraith' }" @click="dismiss">
      <div class="char-boss-intro-stage" :key="intro.characterId + '-' + intro.name">
        <!-- 怨灵降临：深紫色特效大字，人物 BOSS 登场时降下 -->
        <div v-if="intro.theme === 'wraith'" class="char-boss-intro-title">
          <span class="title-char">怨</span>
          <span class="title-char">灵</span>
          <span class="title-char">降</span>
          <span class="title-char">临</span>
        </div>
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
  .char-boss-intro-title {
    font-size: 32px;
  }
}

/* 怨灵降临主题：深紫色背景强化 */
.char-boss-intro-overlay.theme-wraith {
  background: radial-gradient(ellipse at center, rgba(40, 5, 60, 0.92) 0%, rgba(10, 0, 20, 0.97) 70%);
}

.char-boss-intro-portrait-wrap {
  /* 怨灵主题：紫色发光边框 */
}
.theme-wraith .char-boss-intro-portrait-wrap {
  box-shadow: 0 0 60px rgba(157, 78, 221, 0.6), 0 0 20px rgba(123, 44, 191, 0.5);
  border-color: rgba(157, 78, 221, 0.7);
}

/* 怨灵降临：四个深紫色特效大字 */
.char-boss-intro-title {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 42px;
  font-weight: 800;
  letter-spacing: 4px;
  color: #9D4EDD;
  text-shadow:
    0 0 20px rgba(157, 78, 221, 0.9),
    0 0 40px rgba(157, 78, 221, 0.6),
    0 0 60px rgba(123, 44, 191, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.8);
  animation: charBossTitleSlam 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
}

.char-boss-intro-title .title-char {
  display: inline-block;
  animation: charBossTitleGlow 1.6s ease-in-out 0.9s infinite alternate;
}

/* 大字砸入动画：从上方放大旋转砸入 */
@keyframes charBossTitleSlam {
  0% {
    transform: translateY(-60vh) scale(2.5) rotate(-8deg);
    opacity: 0;
    filter: blur(8px);
  }
  60% {
    transform: translateY(8px) scale(1.1) rotate(2deg);
    opacity: 1;
    filter: blur(0);
  }
  80% {
    transform: translateY(-4px) scale(0.98) rotate(-1deg);
  }
  100% {
    transform: translateY(0) scale(1) rotate(0);
    opacity: 1;
    filter: blur(0);
  }
}

/* 大字呼吸发光：紫色光晕脉动 */
@keyframes charBossTitleGlow {
  0% {
    text-shadow:
      0 0 20px rgba(157, 78, 221, 0.9),
      0 0 40px rgba(157, 78, 221, 0.6),
      0 2px 4px rgba(0, 0, 0, 0.8);
  }
  100% {
    text-shadow:
      0 0 30px rgba(157, 78, 221, 1),
      0 0 60px rgba(157, 78, 221, 0.8),
      0 0 80px rgba(123, 44, 191, 0.5),
      0 2px 4px rgba(0, 0, 0, 0.8);
  }
}
</style>
