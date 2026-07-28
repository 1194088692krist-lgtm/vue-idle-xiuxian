<template>
  <!-- 技能释放全屏特写演出：仅 BOSS 战时触发，技能名四字大字 + 属性色光闪 + 聚气波纹 -->
  <teleport to="body">
    <div v-if="show" class="skill-cinematic" aria-hidden="true">
      <!-- 全屏属性色光闪：按技能关键词匹配属性色 -->
      <div :key="`flash-${animKey}`" class="skill-flash" :style="{ background: flashBg }"></div>
      <!-- 中心聚气波纹：3 圈扩散 -->
      <div :key="`wave1-${animKey}`" class="skill-wave wave-1" :style="{ borderColor: skillColor }"></div>
      <div :key="`wave2-${animKey}`" class="skill-wave wave-2" :style="{ borderColor: skillColor }"></div>
      <div :key="`wave3-${animKey}`" class="skill-wave wave-3" :style="{ borderColor: skillColor }"></div>
      <!-- 中心光晕 -->
      <div :key="`glow-${animKey}`" class="skill-glow" :style="{ background: glowBg }"></div>
      <!-- 技能名四字特写：逐字砸入出现，全部到齐后整体一起消失 -->
      <!-- 外层 .skill-text 负责整体淡出（统一延迟），内层 .skill-name-char 仅负责逐字砸入出现 -->
      <div
        :key="`text-${animKey}`"
        class="skill-text"
        :class="skillFadeClass"
        :style="{ color: skillColor, animationDelay: skillFadeDelay + 's' }"
      >
        <div class="skill-caster">{{ casterName }}</div>
        <div class="skill-name">
          <span
            v-for="(ch, i) in skillNameChars"
            :key="i"
            class="skill-name-char"
            :style="{ animationDelay: (0.15 + i * 0.15) + 's' }"
          >{{ ch }}</span>
        </div>
      </div>
      <!-- 放射光线：8 道从中心射出 -->
      <div :key="`rays-${animKey}`" class="skill-rays">
        <div
          v-for="i in 8"
          :key="i"
          class="skill-ray"
          :style="{
            transform: `translate(-50%, -100%) rotate(${(i - 1) * 45}deg)`,
            background: `linear-gradient(to top, transparent, ${skillColor})`,
            animationDelay: ((i - 1) * 0.05) + 's'
          }"
        ></div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useIdleSystem } from '../composables/useIdleSystem'

const { skillCastEvent } = useIdleSystem()
const route = useRoute()

const show = ref(false)
const skillName = ref('')
const casterName = ref('')
const animKey = ref(0)
const skillColor = ref('#DAA520')
const flashBg = ref('rgba(255, 215, 0, 0.4)')
const glowBg = ref('radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 70%)')

// 技能名拆字：实现一字一字弹出效果（与 BossKillCinematic 一致，节奏更紧凑）
const skillNameChars = computed(() => Array.from(skillName.value || ''))
// 整体淡出延迟：等所有字逐字砸入完成 + 停留 1s 后，整体一起消失
// 计算 = 第一字基础 delay 0.15 + 最后一字 (n-1)*0.15 + 入场 0.55 + 停留 1.0
const skillFadeDelay = computed(() => {
  const n = skillNameChars.value.length
  if (n === 0) return 0
  return 0.15 + (n - 1) * 0.15 + 0.55 + 1.0
})
// 整体淡出 class：在 skillCastEvent watch 内通过 nextTick 触发，避免初始化误触发
const skillFadeClass = ref('')

// ===== 技能属性色映射：按技能名关键词推断属性，未匹配时用金色（中性） =====
// 修仙主题属性：火→红、雷→黄、冰→青、剑气→金、毒→紫、土→褐、风→绿
const SKILL_COLOR_MAP = [
  { keys: ['火', '焰', '焚', '炽', '炎', '烛'], color: '#FF5252', flash: 'rgba(255, 82, 82, 0.4)', glow: 'radial-gradient(circle, rgba(255, 82, 82, 0.5) 0%, rgba(255, 140, 0, 0.2) 40%, transparent 70%)' },
  { keys: ['雷', '电', '霆', '霹雳', '震'], color: '#FFEB3B', flash: 'rgba(255, 235, 59, 0.4)', glow: 'radial-gradient(circle, rgba(255, 235, 59, 0.5) 0%, rgba(255, 193, 7, 0.2) 40%, transparent 70%)' },
  { keys: ['冰', '雪', '霜', '寒', '凛'], color: '#4FC3F7', flash: 'rgba(79, 195, 247, 0.4)', glow: 'radial-gradient(circle, rgba(79, 195, 247, 0.5) 0%, rgba(38, 198, 218, 0.2) 40%, transparent 70%)' },
  { keys: ['剑', '刀', '锋', '剑气', '斩', '劈'], color: '#FFD700', flash: 'rgba(255, 215, 0, 0.4)', glow: 'radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, rgba(255, 140, 0, 0.2) 40%, transparent 70%)' },
  { keys: ['毒', '蛊', '腐', '蚀'], color: '#AB47BC', flash: 'rgba(171, 71, 188, 0.4)', glow: 'radial-gradient(circle, rgba(171, 71, 188, 0.5) 0%, rgba(74, 20, 140, 0.2) 40%, transparent 70%)' },
  { keys: ['土', '山', '岳', '岩', '石'], color: '#8D6E63', flash: 'rgba(141, 110, 99, 0.4)', glow: 'radial-gradient(circle, rgba(141, 110, 99, 0.5) 0%, rgba(78, 52, 46, 0.2) 40%, transparent 70%)' },
  { keys: ['风', '云', '气', '御'], color: '#66BB6A', flash: 'rgba(102, 187, 106, 0.4)', glow: 'radial-gradient(circle, rgba(102, 187, 106, 0.5) 0%, rgba(46, 125, 50, 0.2) 40%, transparent 70%)' },
  { keys: ['佛', '禅', '金光', '圣'], color: '#FFE082', flash: 'rgba(255, 224, 130, 0.4)', glow: 'radial-gradient(circle, rgba(255, 224, 130, 0.6) 0%, rgba(255, 152, 0, 0.2) 40%, transparent 70%)' }
]
const DEFAULT_COLOR = { color: '#DAA520', flash: 'rgba(218, 165, 32, 0.4)', glow: 'radial-gradient(circle, rgba(218, 165, 32, 0.5) 0%, transparent 70%)' }

function resolveSkillColor(name) {
  if (!name) return DEFAULT_COLOR
  for (const entry of SKILL_COLOR_MAP) {
    if (entry.keys.some(k => name.includes(k))) return entry
  }
  return DEFAULT_COLOR
}

// ===== 同名去重：避免同一角色同名技能连续重复触发 =====
// 全局冷却已由 useIdleSystem 侧控制（每个技能事件间隔 1.8s 逐个触发）
// 此处只做同名去重，不再做全局冷却，让所有角色的技能都能显示
const SAME_SKILL_COOLDOWN_MS = 5000
let lastCastTs = 0
let lastSkillKey = ''
let hideTimerId = null

function scheduleAutoHide() {
  if (hideTimerId) clearTimeout(hideTimerId)
  // 兜底隐藏：4 字技能名演出约 4.35s，给 4.6s
  hideTimerId = setTimeout(() => {
    show.value = false
    hideTimerId = null
  }, 4600)
}

watch(skillCastEvent, (evt) => {
  if (!evt || !evt.ts || !evt.isBoss) return
  // 仅在探索挂机页显示技能演出：切到背包/炼丹等其他页面时不弹特效
  if (route.path !== '/exploration') return
  // 同技能冷却：5 秒内同名同角色不重复（避免每回合都弹同一个技能）
  const skillKey = `${evt.casterName}-${evt.skillName}`
  if (skillKey === lastSkillKey && evt.ts - lastCastTs < SAME_SKILL_COOLDOWN_MS) return

  lastCastTs = evt.ts
  lastSkillKey = skillKey

  skillName.value = evt.skillName || ''
  casterName.value = evt.casterName || ''
  const c = resolveSkillColor(evt.skillName)
  skillColor.value = c.color
  flashBg.value = c.flash
  glowBg.value = c.glow
  // 重置淡出 class：先移除再在下一次 tick 加回，确保 animation-delay 重新计算
  skillFadeClass.value = ''
  animKey.value++
  show.value = true
  // 下一帧再加 fade-out class，让 Vue 先渲染新字再触发淡出动画
  nextTick(() => { skillFadeClass.value = 'skill-fade-out' })
  scheduleAutoHide()
}, { deep: true })

// 监听路由变化：特效播放中途切走到其他页面时立即隐藏
watch(() => route.path, (newPath) => {
  if (newPath !== '/exploration' && show.value) {
    show.value = false
    skillFadeClass.value = ''
    if (hideTimerId) { clearTimeout(hideTimerId); hideTimerId = null }
  }
})

onUnmounted(() => {
  if (hideTimerId) { clearTimeout(hideTimerId); hideTimerId = null }
})
</script>

<style scoped>
.skill-cinematic {
  position: fixed;
  inset: 0;
  z-index: 9998; /* 略低于 BossKillCinematic(9999)，避免击杀演出被技能演出遮挡 */
  display: flex;
  /* 偏下方显示：不遮挡顶部回合信息/HP条等，但也别太靠下 */
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 22vh;
  pointer-events: none;
  overflow: hidden;
}

/* 全屏属性色光闪：0.4s 闪一下 */
.skill-flash {
  position: absolute;
  inset: 0;
  opacity: 0;
  animation: skill-flash-anim 0.5s ease-out forwards;
}
@keyframes skill-flash-anim {
  0% { opacity: 0; }
  20% { opacity: 0.85; }
  100% { opacity: 0; }
}

/* 中心聚气波纹：3 圈向外扩散，错峰 0.15s */
.skill-wave {
  position: absolute;
  width: 20vmin;
  height: 20vmin;
  border-radius: 50%;
  border: 3px solid;
  opacity: 0;
  transform: scale(0.3);
  animation: skill-wave-anim 1s ease-out forwards;
}
.wave-1 { animation-delay: 0s; }
.wave-2 { animation-delay: 0.15s; }
.wave-3 { animation-delay: 0.3s; }
@keyframes skill-wave-anim {
  0% { opacity: 0; transform: scale(0.3); border-width: 6px; }
  30% { opacity: 1; }
  100% { opacity: 0; transform: scale(4); border-width: 1px; }
}

/* 中心光晕：聚气时的辐射光 */
.skill-glow {
  position: absolute;
  width: 50vmin;
  height: 50vmin;
  border-radius: 50%;
  opacity: 0;
  animation: skill-glow-anim 1.8s ease-out forwards;
}
@keyframes skill-glow-anim {
  0% { opacity: 0; transform: scale(0.5); }
  20% { opacity: 1; transform: scale(1); }
  60% { opacity: 0.7; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(1.3); }
}

/* 放射光线：8 道从中心射出 */
.skill-rays {
  position: absolute;
  width: 0;
  height: 0;
  top: 50%;
  left: 50%;
}
.skill-ray {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 30vmin;
  transform-origin: bottom center;
  opacity: 0;
  animation: skill-ray-anim 0.6s ease-out forwards;
}
@keyframes skill-ray-anim {
  0% { opacity: 0; height: 5vmin; }
  40% { opacity: 1; height: 35vmin; }
  100% { opacity: 0; height: 50vmin; }
}

/* 技能名文字层：负责整体淡出（animation-delay 由 JS 动态计算） */
.skill-text {
  position: relative;
  z-index: 10;
  text-align: center;
  pointer-events: none;
}
/* 整体淡出：所有字一起消失 */
.skill-text.skill-fade-out {
  animation: skill-text-fade-out 0.5s ease-in forwards;
}
@keyframes skill-text-fade-out {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(20px) scale(0.92); filter: blur(2px); }
}
.skill-caster {
  font-size: clamp(14px, 2.5vw, 20px);
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 4px;
  margin-bottom: 8px;
  opacity: 0;
  animation: skill-caster-in 0.4s ease-out 0.1s forwards;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
}
@keyframes skill-caster-in {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}
.skill-name {
  display: flex;
  justify-content: center;
  gap: 2px;
}
.skill-name-char {
  display: inline-block;
  /* 坚实有力字体：Ma Shan Zheng 毛笔楷书，回退系统楷体/黑体 */
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', 'STHeiti', 'Microsoft YaHei', serif;
  font-size: clamp(44px, 9vw, 88px);
  font-weight: 900;
  letter-spacing: 4px;
  opacity: 0;
  /* 逐字砸入：从上方砸下 + 缩放过冲 + 顿挫，与 BossKillCinematic 风格统一
     每字 0.55s 完成，间隔 0.15s（技能名通常 2-4 字，节奏比斩杀文案稍快）
     注意：不再有 out 动画，由外层 .skill-text 统一淡出 */
  animation: skill-char-in 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  /* 坚实有力：粗描边 + 立体阴影 + 外发光 */
  -webkit-text-stroke: 2px rgba(0, 0, 0, 0.85);
  paint-order: stroke fill;
  text-shadow:
    2px 2px 0 rgba(0, 0, 0, 0.9),
    4px 4px 0 rgba(0, 0, 0, 0.7),
    0 0 18px currentColor,
    0 0 32px currentColor;
  will-change: transform, opacity;
}
@keyframes skill-char-in {
  0% {
    opacity: 0;
    /* 从上方 60px 砸下，初始放大 2.5 倍（大字砸小），轻微左倾 */
    transform: translateY(-60px) scale(2.5) rotate(-8deg);
    filter: blur(3px);
  }
  40% {
    /* 砸到位置：缩小到 0.85（过冲），轻微右倾，模拟落地顿挫 */
    opacity: 1;
    transform: translateY(0) scale(0.85) rotate(4deg);
    filter: blur(0);
  }
  60% {
    /* 反弹一下：放大到 1.12（皮球落地反弹感） */
    transform: translateY(0) scale(1.12) rotate(-2deg);
  }
  80% {
    /* 再次小顿挫：0.97，模拟重物落地的二次震动 */
    transform: translateY(0) scale(0.97) rotate(1deg);
  }
  100% {
    /* 定格：回到正常大小，稳稳定住 */
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0deg);
    filter: blur(0);
  }
}

/* 尊重无障碍：减弱动画偏好下不播放演出 */
@media (prefers-reduced-motion: reduce) {
  .skill-cinematic { display: none; }
}
</style>
