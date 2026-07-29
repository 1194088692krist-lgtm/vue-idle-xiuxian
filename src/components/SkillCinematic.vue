<template>
  <!-- 技能释放特写演出：嵌入 BattleStage 内，按技能类型分方位（攻击/debuff靠敌方，治疗/buff靠我方） -->
  <!-- PixiJS canvas：独立于 .skill-cinematic 的 v-if，保证预热时 canvas 已存在 -->
  <canvas ref="pixiCanvasRef" class="pixi-fx-canvas"></canvas>
  <div v-if="show" class="skill-cinematic" :class="sideClass" aria-hidden="true">
      <!-- 全屏属性色光闪 -->
      <div :key="`flash-${animKey}`" class="skill-flash" :style="{ background: flashBg }"></div>
      <!-- 中心光晕 -->
      <div :key="`glow-${animKey}`" class="skill-glow" :style="{ background: glowBg }"></div>

      <!-- 专属图形特效：按技能属性系渲染不同图形，纯 transform/opacity 走 GPU 合成层 -->
      <!-- 暗系：旋转黑洞漩涡（PixiJS 序列帧优先，回退 CSS） -->
      <div v-if="skillFx === 'vortex' && !usePixiFxFlag" :key="`fx-${animKey}`" class="fx-vortex">
        <div class="vortex-ring r1" :style="{ borderColor: skillColor, '--c': skillColor }"></div>
        <div class="vortex-ring r2" :style="{ borderColor: skillColor }"></div>
        <div class="vortex-ring r3" :style="{ borderColor: skillColor }"></div>
        <div class="vortex-core" :style="{ background: glowBg }"></div>
      </div>
      <!-- 火系：腾起火焰粒子 -->
      <!-- PixiJS 序列帧优先（WebGL 可用时）：usePixiFxFlag=true 时不渲染此 CSS 分支 -->
      <!-- CSS fallback：WebGL 不可用或 PixiJS 初始化失败时仍走原 CSS 火焰粒子 -->
      <div v-else-if="skillFx === 'flames' && !usePixiFxFlag" :key="`fx-${animKey}`" class="fx-flames">
        <div v-for="i in 7" :key="i" class="flame-particle"
          :style="{ '--c': skillColor, left: `${15 + i * 10}%`, animationDelay: `${i * 0.08}s` }"></div>
      </div>
      <!-- 雷系：Z字闪电链 -->
      <div v-else-if="skillFx === 'lightning' && !usePixiFxFlag" :key="`fx-${animKey}`" class="fx-lightning">
        <svg class="lightning-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline :stroke="skillColor" points="50,0 40,30 60,35 45,65 55,70 50,100" />
          <polyline class="bolt2" :stroke="skillColor" points="30,5 20,35 40,40 25,70 35,75 30,100" />
          <polyline class="bolt3" :stroke="skillColor" points="70,5 60,35 80,40 65,70 75,75 70,100" />
        </svg>
      </div>
      <!-- 冰系：六角冰晶 -->
      <div v-else-if="skillFx === 'crystal' && !usePixiFxFlag" :key="`fx-${animKey}`" class="fx-crystal">
        <div class="crystal-shape" :style="{ borderColor: skillColor }">
          <div class="crystal-arm a1" :style="{ background: skillColor }"></div>
          <div class="crystal-arm a2" :style="{ background: skillColor }"></div>
          <div class="crystal-arm a3" :style="{ background: skillColor }"></div>
        </div>
        <div class="crystal-shape small" :style="{ borderColor: skillColor }"></div>
      </div>
      <!-- 毒系：冒泡毒气云 -->
      <div v-else-if="skillFx === 'cloud' && !usePixiFxFlag" :key="`fx-${animKey}`" class="fx-cloud">
        <div v-for="i in 6" :key="i" class="cloud-bubble"
          :style="{ '--c': skillColor, left: `${10 + i * 14}%`, animationDelay: `${i * 0.12}s` }"></div>
      </div>
      <!-- 木系：向上生长的藤蔓 -->
      <div v-else-if="skillFx === 'vines' && !usePixiFxFlag" :key="`fx-${animKey}`" class="fx-vines">
        <div v-for="i in 5" :key="i" class="vine" :style="{ '--c': skillColor, left: `${15 + i * 16}%`, animationDelay: `${i * 0.1}s` }">
          <div class="vine-leaf" :style="{ background: skillColor }"></div>
        </div>
      </div>
      <!-- 剑系：交叉剑光斜劈 -->
      <div v-else-if="skillFx === 'slash' && !usePixiFxFlag" :key="`fx-${animKey}`" class="fx-slash">
        <div class="slash-line s1" :style="`--c:${skillColor}`"></div>
        <div class="slash-line s2" :style="`--c:${skillColor}`"></div>
        <div class="slash-line s3" :style="`--c:${skillColor}`"></div>
      </div>
      <!-- 土系：升起岩石尖刺 -->
      <div v-else-if="skillFx === 'spikes' && !usePixiFxFlag" :key="`fx-${animKey}`" class="fx-spikes">
        <div v-for="i in 7" :key="i" class="spike"
          :style="{ '--c': skillColor, left: `${8 + i * 12}%`, animationDelay: `${i * 0.07}s` }"></div>
      </div>
      <!-- 风系：旋转龙卷风圈 -->
      <div v-else-if="skillFx === 'tornado' && !usePixiFxFlag" :key="`fx-${animKey}`" class="fx-tornado">
        <div class="tornado-ring r1" :style="{ borderColor: skillColor }"></div>
        <div class="tornado-ring r2" :style="{ borderColor: skillColor }"></div>
        <div class="tornado-ring r3" :style="{ borderColor: skillColor }"></div>
        <div class="tornado-ring r4" :style="{ borderColor: skillColor }"></div>
      </div>
      <!-- 水系：横向波纹 -->
      <div v-else-if="skillFx === 'waves' && !usePixiFxFlag" :key="`fx-${animKey}`" class="fx-waves">
        <div class="wave-line w1" :style="{ borderColor: skillColor }"></div>
        <div class="wave-line w2" :style="{ borderColor: skillColor }"></div>
        <div class="wave-line w3" :style="{ borderColor: skillColor }"></div>
      </div>
      <!-- 光系：八芒星放射 -->
      <div v-else-if="skillFx === 'star' && !usePixiFxFlag" :key="`fx-${animKey}`" class="fx-star" :style="{ '--c': skillColor }">
        <div class="star-rays">
          <div v-for="i in 8" :key="i" class="star-ray"
            :style="{ '--rot': `${(i - 1) * 45}deg`, background: `linear-gradient(to top, transparent, ${skillColor})`, animationDelay: `${(i - 1) * 0.05}s` }"></div>
        </div>
        <div class="star-core" :style="{ background: glowBg }"></div>
      </div>
      <!-- 战系：向下冲击拳印 -->
      <div v-else-if="skillFx === 'impact' && !usePixiFxFlag" :key="`fx-${animKey}`" class="fx-impact">
        <div class="impact-diamond d1" :style="{ borderColor: skillColor }"></div>
        <div class="impact-diamond d2" :style="{ borderColor: skillColor }"></div>
        <div class="impact-diamond d3" :style="{ borderColor: skillColor }"></div>
        <div class="impact-core" :style="{ background: skillColor }"></div>
      </div>
      <!-- 阵法系：旋转六芒星阵 -->
      <div v-else-if="skillFx === 'hexagram' && !usePixiFxFlag" :key="`fx-${animKey}`" class="fx-hexagram">
        <div class="hexagram-circle" :style="{ borderColor: skillColor }"></div>
        <div class="hexagram-triangle up" :style="{ borderColor: skillColor }"></div>
        <div class="hexagram-triangle down" :style="{ borderColor: skillColor }"></div>
      </div>

      <!-- 技能名四字特写：逐字砸入出现，全部到齐后整体一起消失 -->
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
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useIdleSystem } from '../composables/useIdleSystem'
import { usePixiFx } from '../composables/usePixiFx'
import { generateFxFramesByType } from '../composables/generateFxFrames'

const { skillCastEvent } = useIdleSystem()

// PixiJS 序列帧播放器（单例）
const fx = usePixiFx()
// PixiJS canvas ref：模板提供，传给 fx.ensureReady(canvas)
// 独立于 v-if="show"，保证预热时 canvas 已存在
const pixiCanvasRef = ref(null)
// 当前演出是否走 PixiJS 路径。true=隐藏 CSS 分支；false=回退 CSS
// 初始为 false（不阻塞首屏），演出触发时按需置 true
const usePixiFxFlag = ref(false)
// 序列帧缓存：按 fx 类型缓存（只生成一次，后续复用）
// 已支持类型由 generateFxFramesByType 决定，未知类型返回 null → 回退 CSS
const fxFramesCache = new Map()
// 预热状态：true=PixiJS Application 已就绪，可直接 play
let pixiReady = false

/**
 * 获取指定 fx 类型的序列帧（懒生成 + 缓存）
 * @param {string} fxType
 * @returns {string[]|null}  dataURL 数组；null=该类型未实现 PixiJS 序列帧，回退 CSS
 */
function getFxFrames(fxType) {
  if (!fxFramesCache.has(fxType)) {
    const frames = generateFxFramesByType(fxType)
    if (frames) fxFramesCache.set(fxType, frames)
    else return null
  }
  return fxFramesCache.get(fxType)
}

// 组件挂载后空闲时预热 PixiJS（避免首次演出卡顿）
function warmupPixi() {
  if (pixiReady) return Promise.resolve(true)
  if (!pixiCanvasRef.value) {
    nextTick(() => warmupPixi())
    return Promise.resolve(false)
  }
  return fx.ensureReady(pixiCanvasRef.value).then(ready => {
    if (!ready) return false
    pixiReady = true
    return true
  }).catch(() => false)
}

onMounted(() => {
  // 延迟到 idle，不阻塞渲染
  const scheduleIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500))
  scheduleIdle(() => warmupPixi())
})

const show = ref(false)
const skillName = ref('')
const casterName = ref('')
const animKey = ref(0)
const skillColor = ref('#DAA520')
const skillFx = ref('star')
const flashBg = ref('rgba(255, 215, 0, 0.4)')
const glowBg = ref('radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 70%)')
// 当前技能类型（决定方位）与对应的 CSS class
const skillType = ref('skill_attack')
const fxSide = ref('right')  // 'left'=我方一侧，'right'=敌方一侧
const sideClass = computed(() => fxSide.value === 'left' ? 'fx-side-left' : 'fx-side-right')

/**
 * 按技能类型解析特效方位
 * 攻击/减益/控制类作用于敌方 → 靠右（敌方一侧）
 * 治疗/增益/防御/护盾类作用于我方 → 靠左（我方一侧）
 */
function resolveSide(type) {
  if (['skill_attack', 'debuff', 'control'].includes(type)) return 'right'
  return 'left'
}

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

// ===== 技能属性色映射：按技能名关键词推断属性色 + 专属图形特效 =====
// 修仙主题属性配色，覆盖 13 大属性系，每个系有专属图形特效（fx）
// 排序即优先级：多属性关键词技能按靠前的系匹配（如"光暗交织"归暗系）
const SKILL_COLOR_MAP = [
  // 暗系：暗紫/黑紫，阴冷深邃；fx=vortex 黑洞漩涡
  { keys: ['暗', '影', '夜', '幽', '冥', '煞', '魔', '鬼', '魂', '噬', '阴'], color: '#7E1FA2', flash: 'rgba(126, 31, 162, 0.4)', glow: 'radial-gradient(circle, rgba(126, 31, 162, 0.5) 0%, rgba(48, 12, 64, 0.3) 40%, transparent 70%)', fx: 'vortex' },
  // 火系：烈焰红橙；fx=flames 腾起火焰
  { keys: ['火', '焰', '焚', '炽', '炎', '烛', '爆'], color: '#FF5252', flash: 'rgba(255, 82, 82, 0.4)', glow: 'radial-gradient(circle, rgba(255, 82, 82, 0.5) 0%, rgba(255, 140, 0, 0.2) 40%, transparent 70%)', fx: 'flames' },
  // 雷系：明黄电光；fx=lightning Z字闪电链
  { keys: ['雷', '电', '霆', '霹雳', '震'], color: '#FFEB3B', flash: 'rgba(255, 235, 59, 0.4)', glow: 'radial-gradient(circle, rgba(255, 235, 59, 0.5) 0%, rgba(255, 193, 7, 0.2) 40%, transparent 70%)', fx: 'lightning' },
  // 冰系：寒冰青蓝；fx=crystal 六角冰晶
  { keys: ['冰', '雪', '霜', '寒', '凛'], color: '#4FC3F7', flash: 'rgba(79, 195, 247, 0.4)', glow: 'radial-gradient(circle, rgba(79, 195, 247, 0.5) 0%, rgba(38, 198, 218, 0.2) 40%, transparent 70%)', fx: 'crystal' },
  // 毒系：幽毒紫绿；fx=cloud 冒泡毒气云
  { keys: ['毒', '蛊', '腐', '蚀'], color: '#AB47BC', flash: 'rgba(171, 71, 188, 0.4)', glow: 'radial-gradient(circle, rgba(171, 71, 188, 0.5) 0%, rgba(74, 20, 140, 0.2) 40%, transparent 70%)', fx: 'cloud' },
  // 木系（治疗/自然/生命）：青翠绿；fx=vines 向上生长的藤蔓
  { keys: ['木', '藤', '根', '愈', '养', '治', '疗', '复', '生', '命', '自然'], color: '#26A69A', flash: 'rgba(38, 166, 154, 0.4)', glow: 'radial-gradient(circle, rgba(38, 166, 154, 0.5) 0%, rgba(0, 105, 92, 0.2) 40%, transparent 70%)', fx: 'vines' },
  // 剑系：锋金灿金；fx=slash 交叉剑光斜劈
  { keys: ['剑', '刀', '锋', '斩', '劈', '刃', '刺', '舞'], color: '#FFD700', flash: 'rgba(255, 215, 0, 0.4)', glow: 'radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, rgba(255, 140, 0, 0.2) 40%, transparent 70%)', fx: 'slash' },
  // 土系：厚土褐黄；fx=spikes 升起的岩石尖刺
  { keys: ['土', '山', '岳', '岩', '石', '泰坦', '铁壁', '盾', '护', '防', '守', '不破', '磐石'], color: '#8D6E63', flash: 'rgba(141, 110, 99, 0.4)', glow: 'radial-gradient(circle, rgba(141, 110, 99, 0.5) 0%, rgba(78, 52, 46, 0.2) 40%, transparent 70%)', fx: 'spikes' },
  // 风系：疾风翠绿；fx=tornado 旋转龙卷风圈
  { keys: ['风', '云', '气', '御', '疾', '动', '灵'], color: '#66BB6A', flash: 'rgba(102, 187, 106, 0.4)', glow: 'radial-gradient(circle, rgba(102, 187, 106, 0.5) 0%, rgba(46, 125, 50, 0.2) 40%, transparent 70%)', fx: 'tornado' },
  // 水/波系：流水青；fx=waves 横向波纹
  { keys: ['水', '波', '潮', '涌', '渊', '海'], color: '#29B6F6', flash: 'rgba(41, 182, 246, 0.4)', glow: 'radial-gradient(circle, rgba(41, 182, 246, 0.5) 0%, rgba(13, 71, 161, 0.2) 40%, transparent 70%)', fx: 'waves' },
  // 光/佛/圣系：圣金光；fx=star 八芒星放射
  { keys: ['佛', '禅', '金光', '圣', '光', '阳', '神'], color: '#FFE082', flash: 'rgba(255, 224, 130, 0.4)', glow: 'radial-gradient(circle, rgba(255, 224, 130, 0.6) 0%, rgba(255, 152, 0, 0.2) 40%, transparent 70%)', fx: 'star' },
  // 战/力/狂系：战神赤红；fx=impact 向下冲击拳印
  { keys: ['战', '狂', '暴', '重击', '处决', '天罚', '主宰', '威慑', '吼'], color: '#E53935', flash: 'rgba(229, 57, 53, 0.4)', glow: 'radial-gradient(circle, rgba(229, 57, 53, 0.5) 0%, rgba(127, 0, 0, 0.2) 40%, transparent 70%)', fx: 'impact' },
  // 阵法系：玄机青灰；fx=hexagram 旋转六芒星阵
  { keys: ['阵', '迷', '迟', '陷阱', '静止', '幸运', '增幅'], color: '#78909C', flash: 'rgba(120, 144, 156, 0.4)', glow: 'radial-gradient(circle, rgba(120, 144, 156, 0.5) 0%, rgba(38, 50, 56, 0.2) 40%, transparent 70%)', fx: 'hexagram' }
]
const DEFAULT_COLOR = { color: '#DAA520', flash: 'rgba(218, 165, 32, 0.4)', glow: 'radial-gradient(circle, rgba(218, 165, 32, 0.5) 0%, transparent 70%)', fx: 'star' }

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

watch(skillCastEvent, async (evt) => {
  if (!evt || !evt.ts || !evt.isBoss) return
  // 同技能冷却：5 秒内同名同角色不重复（避免每回合都弹同一个技能）
  const skillKey = `${evt.casterName}-${evt.skillName}`
  if (skillKey === lastSkillKey && evt.ts - lastCastTs < SAME_SKILL_COOLDOWN_MS) return

  lastCastTs = evt.ts
  lastSkillKey = skillKey

  skillName.value = evt.skillName || ''
  casterName.value = evt.casterName || ''
  const c = resolveSkillColor(evt.skillName)
  skillColor.value = c.color
  skillFx.value = c.fx || 'star'
  flashBg.value = c.flash
  glowBg.value = c.glow
  // 按技能类型决定方位：攻击/debuff/control 靠敌方一侧，其余靠我方一侧
  skillType.value = evt.skillType || 'skill_attack'
  fxSide.value = resolveSide(skillType.value)
  // 重置淡出 class：先移除再在下一次 tick 加回，确保 animation-delay 重新计算
  skillFadeClass.value = ''
  animKey.value++
  show.value = true
  // 下一帧再加 fade-out class，让 Vue 先渲染新字再触发淡出动画
  nextTick(() => { skillFadeClass.value = 'skill-fade-out' })
  scheduleAutoHide()

  // PixiJS 序列帧播放（通用）：按 skillFx 类型查找已实现的序列帧
  // 已实现 13 系全部走 WebGL，未知类型 generateFxFramesByType 返回 null → 回退 CSS
  // 关键修复：演出时机紧凑，必须用预热好的资源零延迟播放
  const frames = getFxFrames(c.fx)
  if (frames) {
    if (pixiReady) {
      // 预热已完成：直接播放
      try {
        const ok = await fx.play({
          frames,
          fps: 24,
          tint: c.color,
          scale: 1,
          loop: false,
          side: fxSide.value
        })
        usePixiFxFlag.value = ok  // true=隐藏 CSS 分支，false=回退 CSS
      } catch (e) {
        console.warn('[SkillCinematic] PixiJS play failed, fallback to CSS:', e)
        usePixiFxFlag.value = false
      }
    } else {
      // 预热未完成：尝试立即同步预热（不等 idle），最多等 500ms
      // 500ms 内初始化成功 → 走 WebGL；超时 → 回退 CSS
      usePixiFxFlag.value = false  // 先显示 CSS 分支（不空白）
      const ready = await Promise.race([
        warmupPixi(),
        new Promise(resolve => setTimeout(() => resolve(false), 500))
      ])
      if (ready) {
        // WebGL 就绪：切到 PixiJS（CSS 分支会被 usePixiFxFlag=true 隐藏）
        try {
          const ok = await fx.play({
            frames,
            fps: 24,
            tint: c.color,
            scale: 1,
            loop: false,
            side: fxSide.value
          })
          usePixiFxFlag.value = ok
        } catch (e) {
          usePixiFxFlag.value = false
        }
      }
      // 否则保持 CSS fallback
    }
  } else {
    // 未实现 PixiJS 序列帧的 fx 类型：立即停止任何残留的 PixiJS 播放，走 CSS
    usePixiFxFlag.value = false
    fx.stop()
  }
}, { deep: true })

// 兜底隐藏触发时：show 变为 false 后，同步停止 PixiJS 播放
// 通过 watch show 而非直接改 scheduleAutoHide，保证所有隐藏路径都覆盖
watch(show, (v) => {
  if (!v && usePixiFxFlag.value) {
    usePixiFxFlag.value = false
    fx.stop()
  }
})

onUnmounted(() => {
  if (hideTimerId) { clearTimeout(hideTimerId); hideTimerId = null }
  // 组件卸载：彻底停止 PixiJS 播放（Application 保留为单例供下次使用，避免重建开销）
  usePixiFxFlag.value = false
  fx.stop()
})
</script>

<style scoped>
/* PixiJS WebGL canvas：嵌入 BattleStage 内，absolute 覆盖战斗窗口
   z-index 40 低于 .skill-cinematic(41)，特效在文字/光晕之下
   position/inset 由 CSS 控制，usePixiFx.ensureReady 只设 opacity/transition */
.pixi-fx-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 40;
  opacity: 0;
}

/* 技能演出容器：嵌入 BattleStage，absolute 覆盖战斗窗口
   --fx-x 控制特效横向锚点（左/右），由 .fx-side-left/right 切换 */
.skill-cinematic {
  position: absolute;
  inset: 0;
  z-index: 41;
  pointer-events: none;
  overflow: hidden;
  --fx-x: 50%;
  transform: translateZ(0);
}
/* 攻击/debuff/control 靠敌方一侧（右侧）
   BattleStage 布局：enemy-side max-width 30% 靠右，头像在 enemy-side 内居中，
   实际头像中心约在 85% 处，特效锚点对齐到此位置贴近怪物头像 */
.skill-cinematic.fx-side-right { --fx-x: 85%; }
/* 治疗/buff/防御/shield 靠我方一侧（左侧）
   BattleStage 布局：team-side max-width 46% 靠左，头像在 team-side 内居中，
   实际头像中心约在 23% 处，特效锚点对齐到此位置贴近队员头像 */
.skill-cinematic.fx-side-left { --fx-x: 23%; }

/* 全屏属性色光闪：0.4s 闪一下 */
.skill-flash {
  position: absolute;
  inset: 0;
  opacity: 0;
  animation: skill-flash-anim 0.5s ease-out forwards;
  will-change: opacity;
}
@keyframes skill-flash-anim {
  0% { opacity: 0; }
  20% { opacity: 0.85; }
  100% { opacity: 0; }
}

/* 中心光晕：聚气时的辐射光，锚点跟随方位 */
.skill-glow {
  position: absolute;
  left: var(--fx-x, 50%);
  top: 50%;
  width: 40vmin;
  height: 40vmin;
  margin-left: -20vmin;
  margin-top: -20vmin;
  border-radius: 50%;
  opacity: 0;
  animation: skill-glow-anim 1.8s ease-out forwards;
  will-change: opacity, transform;
}
@keyframes skill-glow-anim {
  0% { opacity: 0; transform: scale(0.5); }
  20% { opacity: 1; transform: scale(1); }
  60% { opacity: 0.7; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(1.3); }
}

/* ============ 13 种属性系专属图形特效 ============ */
/* 所有 fx 容器统一锚点跟随方位（--fx-x），垂直居中 */
[class^="fx-"] {
  position: absolute;
  left: var(--fx-x, 50%);
  top: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
}

/* 暗系：旋转黑洞漩涡（3 圈反向旋转 + 中心暗核） */
.fx-vortex { width: 60vmin; height: 60vmin; }
.vortex-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px dashed;
  opacity: 0;
  animation: vortex-spin 1.6s ease-out forwards;
  will-change: opacity, transform;
}
.vortex-ring.r1 { animation-delay: 0s; }
.vortex-ring.r2 { inset: 12%; animation-delay: 0.15s; }
.vortex-ring.r3 { inset: 24%; animation-delay: 0.3s; }
.vortex-core {
  position: absolute;
  inset: 38%;
  border-radius: 50%;
  opacity: 0;
  animation: vortex-core-in 1s ease-in 0.4s forwards;
  will-change: opacity, transform;
}
@keyframes vortex-spin {
  0% { opacity: 0; transform: rotate(0) scale(0.3); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: rotate(540deg) scale(1.2); }
}
@keyframes vortex-core-in {
  0% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1.3); }
  100% { opacity: 0; transform: scale(0.8); }
}

/* 火系：腾起火焰粒子（向上抖动 + 缩小消散） */
.fx-flames { width: 80vw; height: 60vh; }
.flame-particle {
  position: absolute;
  bottom: 0;
  width: 18px;
  height: 60px;
  background: var(--c);
  border-radius: 50% 50% 20% 20% / 80% 80% 20% 20%;
  opacity: 0;
  animation: flame-rise 1.4s ease-out forwards;
  will-change: opacity, transform;
}
@keyframes flame-rise {
  0% { opacity: 0; transform: translateY(40px) scale(0.3); }
  20% { opacity: 1; transform: translateY(0) scale(1); }
  60% { opacity: 0.8; transform: translateY(-40vh) scale(0.8); }
  100% { opacity: 0; transform: translateY(-70vh) scale(0.2); }
}

/* 雷系：Z 字闪电链（3 道折线闪现） */
.fx-lightning { width: 80vw; height: 80vh; }
.lightning-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  animation: lightning-flash 1s ease-out forwards;
  will-change: opacity;
}
.lightning-svg polyline {
  fill: none;
  stroke-width: 3;
}
.lightning-svg .bolt2 { animation: bolt-flicker 0.8s ease-out 0.15s forwards; opacity: 0; }
.lightning-svg .bolt3 { animation: bolt-flicker 0.8s ease-out 0.3s forwards; opacity: 0; }
@keyframes lightning-flash {
  0%, 100% { opacity: 0; }
  10%, 25%, 45% { opacity: 1; }
  18%, 35%, 55% { opacity: 0.3; }
  70% { opacity: 0.6; }
}
@keyframes bolt-flicker {
  0%, 100% { opacity: 0; }
  10%, 30% { opacity: 1; }
  20% { opacity: 0.4; }
}

/* 冰系：六角冰晶（中心大晶体 + 小晶体，缓慢旋转） */
.fx-crystal { width: 40vmin; height: 40vmin; }
.crystal-shape {
  position: absolute;
  inset: 0;
  border: 3px solid;
  transform: rotate(45deg);
  opacity: 0;
  animation: crystal-in 1.6s ease-out forwards;
  will-change: opacity, transform;
}
.crystal-shape.small {
  inset: 25%;
  animation-delay: 0.3s;
}
.crystal-arm {
  position: absolute;
  width: 4px;
  height: 140%;
  top: -20%;
  left: 50%;
  margin-left: -2px;
}
.crystal-arm.a1 { transform: rotate(0deg); }
.crystal-arm.a2 { transform: rotate(60deg); }
.crystal-arm.a3 { transform: rotate(-60deg); }
@keyframes crystal-in {
  0% { opacity: 0; transform: rotate(45deg) scale(0); }
  30% { opacity: 1; }
  70% { opacity: 0.9; transform: rotate(225deg) scale(1.1); }
  100% { opacity: 0; transform: rotate(405deg) scale(0.8); }
}

/* 毒系：冒泡毒气云（6 个不规则扩散圆） */
.fx-cloud { width: 80vw; height: 50vh; }
.cloud-bubble {
  position: absolute;
  bottom: 0;
  width: 60px;
  height: 60px;
  background: var(--c);
  border-radius: 50% 40% 55% 45%;
  opacity: 0;
  animation: cloud-bubble 1.8s ease-out forwards;
  will-change: opacity, transform;
}
@keyframes cloud-bubble {
  0% { opacity: 0; transform: translateY(20px) scale(0.2); }
  25% { opacity: 0.9; transform: translateY(0) scale(1); }
  60% { opacity: 0.7; transform: translateY(-30vh) scale(1.4); }
  100% { opacity: 0; transform: translateY(-50vh) scale(1.8); }
}

/* 木系：向上生长的藤蔓（垂直延伸 + 末端叶子绽放） */
.fx-vines { width: 80vw; height: 70vh; }
.vine {
  position: absolute;
  bottom: 0;
  width: 3px;
  height: 55vh;
  background: var(--c);
  opacity: 0;
  transform-origin: bottom;
  transform: scaleY(0);
  animation: vine-grow 1.6s ease-out forwards;
  will-change: opacity, transform;
}
.vine-leaf {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 18px;
  height: 18px;
  border-radius: 50% 0;
  opacity: 0;
  animation: leaf-bloom 0.5s ease-out 1s forwards;
}
@keyframes vine-grow {
  0% { opacity: 0; transform: scaleY(0); }
  20% { opacity: 1; }
  70% { opacity: 1; transform: scaleY(1); }
  100% { opacity: 0; transform: scaleY(1); }
}
@keyframes leaf-bloom {
  0% { opacity: 0; transform: scale(0) rotate(0); }
  100% { opacity: 0.9; transform: scale(1) rotate(45deg); }
}

/* 剑系：交叉剑光斜劈（3 道对角剑气） */
.fx-slash { width: 100vw; height: 100vh; }
.slash-line {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80vmin;
  height: 4px;
  background: linear-gradient(to right, transparent, var(--c), transparent);
  opacity: 0;
  transform-origin: center;
}
.slash-line.s1 { animation: slash-anim 0.8s ease-out forwards; will-change: opacity, transform; }
.slash-line.s2 { animation: slash-anim 0.8s ease-out 0.2s forwards; will-change: opacity, transform; }
.slash-line.s3 { animation: slash-anim 0.8s ease-out 0.4s forwards; will-change: opacity, transform; }
@keyframes slash-anim {
  0% { opacity: 0; transform: translate(-50%, -50%) rotate(-45deg) scaleX(0); }
  30% { opacity: 1; transform: translate(-50%, -50%) rotate(-45deg) scaleX(1); }
  60% { opacity: 0.8; transform: translate(-50%, -50%) rotate(-45deg) scaleX(1.2); }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(-45deg) scaleX(1.5); }
}
.slash-line.s2 { animation-name: slash-anim-2; }
.slash-line.s3 { animation-name: slash-anim-3; }
@keyframes slash-anim-2 {
  0% { opacity: 0; transform: translate(-50%, -50%) rotate(45deg) scaleX(0); }
  30% { opacity: 1; transform: translate(-50%, -50%) rotate(45deg) scaleX(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(45deg) scaleX(1.5); }
}
@keyframes slash-anim-3 {
  0% { opacity: 0; transform: translate(-50%, -50%) rotate(90deg) scaleX(0); }
  30% { opacity: 1; transform: translate(-50%, -50%) rotate(90deg) scaleX(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(90deg) scaleX(1.5); }
}

/* 土系：升起岩石尖刺（7 个向上突起的三角） */
.fx-spikes { width: 80vw; height: 50vh; }
.spike {
  position: absolute;
  bottom: 0;
  width: 0;
  height: 35vh;
  border-left: 18px solid transparent;
  border-right: 18px solid transparent;
  border-bottom: 35vh solid var(--c);
  opacity: 0;
  transform-origin: bottom;
  transform: scaleY(0);
  animation: spike-rise 1.2s ease-out forwards;
  will-change: opacity, transform;
}
@keyframes spike-rise {
  0% { opacity: 0; transform: scaleY(0) translateY(20px); }
  30% { opacity: 1; }
  60% { opacity: 1; transform: scaleY(1) translateY(0); }
  100% { opacity: 0; transform: scaleY(1) translateY(-10px); }
}

/* 风系：旋转龙卷风圈（4 层椭圆环旋转） */
.fx-tornado { width: 40vmin; height: 60vh; }
.tornado-ring {
  position: absolute;
  left: 50%;
  border: 3px solid;
  border-radius: 50%;
  opacity: 0;
  transform: translateX(-50%) rotate(0deg);
  animation: tornado-spin 1.8s ease-out forwards;
  will-change: opacity, transform;
}
.tornado-ring.r1 { top: 60%; width: 30vmin; height: 8vmin; animation-delay: 0s; }
.tornado-ring.r2 { top: 45%; width: 22vmin; height: 6vmin; animation-delay: 0.15s; }
.tornado-ring.r3 { top: 30%; width: 14vmin; height: 4vmin; animation-delay: 0.3s; }
.tornado-ring.r4 { top: 15%; width: 6vmin; height: 2vmin; animation-delay: 0.45s; }
@keyframes tornado-spin {
  0% { opacity: 0; transform: translateX(-50%) rotate(0deg) scaleY(0.3); }
  30% { opacity: 1; }
  70% { opacity: 0.9; transform: translateX(-50%) rotate(720deg) scaleY(1); }
  100% { opacity: 0; transform: translateX(-50%) rotate(1080deg) scaleY(1.2); }
}

/* 水系：横向波纹（3 条水平扩散的弧线） */
.fx-waves { width: 100vw; height: 40vh; }
.wave-line {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 20vmin;
  border: 3px solid;
  border-radius: 50%;
  opacity: 0;
  transform: translate(-50%, -50%) scaleX(0);
  animation: wave-spread 1.6s ease-out forwards;
  will-change: opacity, transform;
}
.wave-line.w1 { animation-delay: 0s; }
.wave-line.w2 { animation-delay: 0.25s; height: 35vmin; }
.wave-line.w3 { animation-delay: 0.5s; height: 50vmin; }
@keyframes wave-spread {
  0% { opacity: 0; transform: translate(-50%, -50%) scaleX(0); }
  30% { opacity: 1; transform: translate(-50%, -50%) scaleX(1); }
  70% { opacity: 0.6; transform: translate(-50%, -50%) scaleX(1.5); }
  100% { opacity: 0; transform: translate(-50%, -50%) scaleX(2); }
}

/* 光系：八芒星放射（8 道光线 + 中心光球） */
.fx-star { width: 0; height: 0; }
.star-rays {
  position: absolute;
  left: 0;
  top: 0;
}
.star-ray {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 50vmin;
  transform-origin: bottom center;
  transform: translate(-50%, -100%) rotate(var(--rot, 0deg)) scaleY(0);
  opacity: 0;
  animation: star-ray-anim 0.8s ease-out forwards;
  will-change: opacity, transform;
}
@keyframes star-ray-anim {
  0% { opacity: 0; transform: translate(-50%, -100%) rotate(var(--rot, 0deg)) scaleY(0); }
  40% { opacity: 1; transform: translate(-50%, -100%) rotate(var(--rot, 0deg)) scaleY(0.7); }
  100% { opacity: 0; transform: translate(-50%, -100%) rotate(var(--rot, 0deg)) scaleY(1); }
}
.star-core {
  position: absolute;
  left: -10vmin;
  top: -10vmin;
  width: 20vmin;
  height: 20vmin;
  border-radius: 50%;
  opacity: 0;
  animation: star-core-pulse 1.2s ease-out forwards;
  will-change: opacity, transform;
}
@keyframes star-core-pulse {
  0% { opacity: 0; transform: scale(0); }
  30% { opacity: 1; transform: scale(1.2); }
  60% { opacity: 0.8; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.7); }
}

/* 战系：向下冲击拳印（3 圈菱形冲击波 + 中心爆点） */
.fx-impact { width: 50vmin; height: 50vmin; }
.impact-diamond {
  position: absolute;
  inset: 0;
  border: 3px solid;
  opacity: 0;
  transform: rotate(45deg) scale(0);
  animation: impact-punch 1.2s ease-out forwards;
  will-change: opacity, transform;
}
.impact-diamond.d1 { animation-delay: 0s; }
.impact-diamond.d2 { inset: 15%; animation-delay: 0.15s; }
.impact-diamond.d3 { inset: 30%; animation-delay: 0.3s; }
.impact-core {
  position: absolute;
  inset: 40%;
  border-radius: 50%;
  opacity: 0;
  animation: impact-core-flash 0.6s ease-out 0.4s forwards;
  will-change: opacity, transform;
}
@keyframes impact-punch {
  0% { opacity: 0; transform: rotate(45deg) scale(0); }
  30% { opacity: 1; transform: rotate(45deg) scale(1); }
  60% { opacity: 0.7; transform: rotate(45deg) scale(1.3); }
  100% { opacity: 0; transform: rotate(45deg) scale(1.6); }
}
@keyframes impact-core-flash {
  0% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1.5); }
  100% { opacity: 0; transform: scale(0.5); }
}

/* 阵法系：旋转六芒星阵（外圆 + 上下三角） */
.fx-hexagram { width: 50vmin; height: 50vmin; }
.hexagram-circle {
  position: absolute;
  inset: 0;
  border: 3px solid;
  border-radius: 50%;
  opacity: 0;
  animation: hexagram-circle-in 1.8s ease-out forwards;
  will-change: opacity, transform;
}
.hexagram-triangle {
  position: absolute;
  inset: 10%;
  border: 3px solid;
  opacity: 0;
}
.hexagram-triangle.up {
  border-bottom: 0;
  border-left: 0;
  border-right: 0;
  border-top: 3px solid;
  /* 等边三角向上 */
  width: 0;
  height: 0;
  border-left: 20vmin solid transparent;
  border-right: 20vmin solid transparent;
  border-top: 0;
  border-bottom: 35vmin solid;
  inset: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: hexagram-tri-in 1.6s ease-out 0.3s forwards;
}
.hexagram-triangle.down {
  width: 0;
  height: 0;
  border-left: 20vmin solid transparent;
  border-right: 20vmin solid transparent;
  border-top: 35vmin solid;
  border-bottom: 0;
  inset: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: hexagram-tri-in 1.6s ease-out 0.5s forwards;
}
@keyframes hexagram-circle-in {
  0% { opacity: 0; transform: rotate(0) scale(0.3); }
  30% { opacity: 1; }
  70% { opacity: 0.8; transform: rotate(180deg) scale(1); }
  100% { opacity: 0; transform: rotate(360deg) scale(1.2); }
}
@keyframes hexagram-tri-in {
  0% { opacity: 0; }
  30% { opacity: 1; }
  70% { opacity: 0.8; }
  100% { opacity: 0; }
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
  100% { opacity: 0; transform: translateY(20px) scale(0.92); }
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
  /* 逐字砸入：纯 translateY + opacity，无 scale/blur 避免重绘卡顿
     每字 0.55s 完成，间隔 0.15s（技能名通常 2-4 字，节奏比斩杀文案稍快）
     注意：不再有 out 动画，由外层 .skill-text 统一淡出 */
  animation: skill-char-in 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  /* 坚实有力：四方向粗黑描边 + 立体阴影，避免 -webkit-text-stroke 引起栅格化不同步 */
  text-shadow:
    -2px -2px 0 rgba(0, 0, 0, 0.9),
    2px -2px 0 rgba(0, 0, 0, 0.9),
    -2px 2px 0 rgba(0, 0, 0, 0.9),
    2px 2px 0 rgba(0, 0, 0, 0.9),
    4px 4px 0 rgba(0, 0, 0, 0.7);
  will-change: transform, opacity;
}
@keyframes skill-char-in {
  0% {
    opacity: 0;
    /* 纯位移砸入：从上方 60px 砸下，无 scale/blur 避免重绘 */
    transform: translateY(-60px);
  }
  60% {
    /* 砸到位置后小回弹 */
    opacity: 1;
    transform: translateY(8px);
  }
  80% {
    /* 二次小顿挫 */
    transform: translateY(-2px);
  }
  100% {
    /* 定格 */
    opacity: 1;
    transform: translateY(0);
  }
}

/* 尊重无障碍：减弱动画偏好下不播放演出 */
@media (prefers-reduced-motion: reduce) {
  .skill-cinematic { display: none; }
}
</style>
