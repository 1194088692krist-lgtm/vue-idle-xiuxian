<template>
  <div
    class="live-portrait"
    :class="['star-' + star, { 'has-layers': hasLayers }]"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- 多图层视差模式 -->
    <div v-if="hasLayers" class="portrait-layers" ref="layerContainer">
      <div
        v-for="(layer, i) in layers"
        :key="i"
        class="portrait-layer"
        :style="layerStyle(i)"
      >
        <img :src="layer" :alt="`${name} layer ${i + 1}`" draggable="false" />
      </div>
    </div>
    <!-- 单图回退模式 -->
    <div v-else-if="avatar" class="portrait-single" :class="'star-' + star">
      <img :src="avatar" :alt="name" draggable="false" />
    </div>
    <!-- 无图占位 -->
    <div v-else class="portrait-placeholder">
      <UserOutlined />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { UserOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  avatar: { type: String, default: null },
  layers: { type: Array, default: null },
  name: { type: String, default: '' },
  star: { type: Number, default: 3 }
})

// 鼠标位置（-1 ~ 1，中心为 0）
const mouseX = ref(0)
const mouseY = ref(0)
// 是否正在跟随鼠标
const tracking = ref(false)

const hasLayers = computed(() => Array.isArray(props.layers) && props.layers.length > 0)

function onMouseMove(e) {
  if (!hasLayers.value) return
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  // 归一化到 -1 ~ 1
  mouseX.value = (e.clientX - cx) / (rect.width / 2)
  mouseY.value = (e.clientY - cy) / (rect.height / 2)
  tracking.value = true
}

function onMouseLeave() {
  tracking.value = false
  mouseX.value = 0
  mouseY.value = 0
}

// 每层视差系数：底层幅度小，顶层幅度大
// layers[0] = 后发/背景（depth 0），layers[1] = 身体（depth 1），layers[2] = 前发（depth 2）...
function layerStyle(index) {
  const total = props.layers.length
  // depth 从 0（最底）到 1（最顶）
  const depth = total > 1 ? index / (total - 1) : 0.5

  // 鼠标视差偏移量（顶层偏移最大）
  const maxOffset = 15 // px
  const tx = mouseX.value * maxOffset * (0.3 + depth * 0.7)
  const ty = mouseY.value * maxOffset * 0.5 * (0.3 + depth * 0.7)

  // 呼吸浮动：不同图层延迟不同，营造层次感
  const breatheDelay = index * 0.3
  const breatheDuration = 3.5 + index * 0.5

  // 轻微旋转（顶层旋转幅度略大）
  const rot = mouseX.value * 2 * (0.3 + depth * 0.7)

  return {
    transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg)`,
    animation: `liveBreathe ${breatheDuration}s ease-in-out ${breatheDelay}s infinite`,
    zIndex: index
  }
}
</script>

<style scoped>
.live-portrait {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* === 多图层模式 === */
.portrait-layers {
  width: 100%;
  height: 100%;
  position: relative;
}
.portrait-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.15s ease-out;
  will-change: transform;
}
.portrait-layer img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

/* === 单图模式 === */
.portrait-single {
  width: 100%;
  height: 100%;
}
.portrait-single img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  animation: liveBreathe 4s ease-in-out infinite;
}

/* === 占位符 === */
.portrait-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 120px;
  color: rgba(218, 165, 32, 0.3);
  animation: liveBreathe 3s ease-in-out infinite;
}

/* === 呼吸动画 === */
@keyframes liveBreathe {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-5px) scale(1.012);
  }
}

/* === 星级光晕（单图模式 + 占位符） === */
/* 4★：青蓝光晕 */
.star-4 .portrait-single img {
  filter: drop-shadow(0 0 6px rgba(120, 220, 240, 0.3));
  animation: liveBreathe4 4s ease-in-out infinite;
}
@keyframes liveBreathe4 {
  0%, 100% {
    transform: translateY(0) scale(1);
    filter: drop-shadow(0 0 4px rgba(120, 220, 240, 0.25));
  }
  50% {
    transform: translateY(-7px) scale(1.02);
    filter: drop-shadow(0 0 12px rgba(120, 220, 240, 0.5));
  }
}
/* 5★：金色光晕 */
.star-5 .portrait-single img {
  animation: liveBreathe5 3.5s ease-in-out infinite;
}
@keyframes liveBreathe5 {
  0%, 100% {
    transform: translateY(0) scale(1);
    filter: drop-shadow(0 0 6px rgba(255, 200, 80, 0.35));
  }
  50% {
    transform: translateY(-8px) scale(1.025);
    filter: drop-shadow(0 0 16px rgba(255, 200, 80, 0.65));
  }
}

/* === 多图层模式下的顶层光晕 === */
.has-layers.star-4 .portrait-layer:last-child img {
  filter: drop-shadow(0 0 4px rgba(120, 220, 240, 0.2));
}
.has-layers.star-5 .portrait-layer:last-child img {
  filter: drop-shadow(0 0 6px rgba(255, 200, 80, 0.3));
}
</style>
