<template>
  <Teleport to="body">
    <div v-if="character" class="char-modal-overlay" @click="$emit('close')">
      <div class="char-modal" @click.stop>
        <div class="char-modal-close" @click="$emit('close')">✕</div>
        <div class="char-modal-content">
          <div class="char-portrait-large">
            <!-- 加载占位：图片/视频未就绪时显示 -->
            <div v-if="!avatarLoaded" class="char-portrait-loading">
              <div class="loading-spinner"></div>
            </div>
            <!-- 静态立绘：始终作为底层；无视频时直接展示，有视频时作为首帧垫底 -->
            <img
              v-if="avatar"
              ref="imgEl"
              :src="avatar"
              class="char-portrait-static"
              :class="{ 'is-loaded': avatarLoaded, 'is-hidden': shouldShowVideo && videoReady }"
              alt="角色立绘"
              draggable="false"
              @load="onAvatarLoad"
              @error="onAvatarError"
            />
            <!-- 动态视频：加载完成后淡入覆盖并自动播放。
                 视频源直接挂在 <video :src> 上（比 <source> 子元素可靠：
                 <video v-if> + 动态 <source :src> 存在资源选择竞态，
                 可能导致视频拿到空源而触发 error 静默回退静态图）。
                 loadeddata 事件首帧就绪即触发，比 canplay 快 -->
            <video
              v-if="shouldShowVideo"
              ref="videoEl"
              class="char-portrait-video"
              :class="{ 'is-visible': videoReady }"
              :src="videoSrc"
              :poster="avatar || undefined"
              preload="auto"
              muted
              loop
              playsinline
              webkit-playsinline
              @loadeddata="onVideoReady"
              @error="onVideoError"
            ></video>
          </div>
          <div class="char-modal-footer">
            <h2 class="char-name-large">{{ character.name }}</h2>
            <div class="char-stars-large">{{ '⭐'.repeat(character.star || 1) }}</div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getCharacterAvatar, getCharacterVideo } from '../plugins/characters'
import { usePlayerStore } from '../stores/player'

const props = defineProps({
  character: { type: Object, default: null }
})
defineEmits(['close'])

const playerStore = usePlayerStore()
const videoEl = ref(null)
const imgEl = ref(null)
const videoReady = ref(false)
const avatarLoaded = ref(false)

const avatar = computed(() => (props.character ? getCharacterAvatar(props.character) : null))
const videoSrc = computed(() => (props.character ? getCharacterVideo(props.character) : null))
// 同时满足：动态效果开启 + 该角色配置了视频
const shouldShowVideo = computed(() => !!playerStore.dynamicPortrait && !!videoSrc.value)

// 静态图加载完成回调
const onAvatarLoad = () => {
  avatarLoaded.value = true
}
const onAvatarError = () => {
  avatarLoaded.value = false
}

const tryPlay = () => {
  const v = videoEl.value
  if (!v) return
  const p = v.play()
  if (p && p.catch) p.catch(() => { /* 自动播放被拦截时静默忽略，仍显示静态图 */ })
}

// loadeddata：首帧已解码就绪，立即显示并播放（比 canplay 快）
const onVideoReady = () => {
  videoReady.value = true
  tryPlay()
}

const onVideoError = (e) => {
  // 视频加载失败：保持静态立绘显示，但打印真实错误便于排查（如源无法解码/404）
  const v = videoEl.value
  const errDetail = v && v.error ? `code=${v.error.code} mediaError=${['','MEDIA_ERR_ABORTED','MEDIA_ERR_NETWORK','MEDIA_ERR_DECODE','MEDIA_ERR_SRC_NOT_SUPPORTED'][v.error.code] || '未知'}` : ''
  console.warn('[立绘视频] 加载失败，回退静态立绘：', videoSrc.value, errDetail, e)
  videoReady.value = false
}

// 组件挂载后立即尝试播放（处理视频已缓存、loadeddata 不再触发的情况）
onMounted(() => {
  // 静态图可能已缓存（complete 状态），直接标记为已加载
  if (imgEl.value && imgEl.value.complete) {
    avatarLoaded.value = true
  }
  if (shouldShowVideo.value) {
    nextTick(() => requestAnimationFrame(tryPlay))
  }
})

// 切换角色 / 开关变化时重置，并尝试直接播放（已被缓存时更快）
watch(
  () => [props.character, shouldShowVideo.value, videoSrc.value],
  () => {
    videoReady.value = false
    avatarLoaded.value = false
    if (shouldShowVideo.value) {
      // 等待 video 元素渲染后再尝试播放
      nextTick(() => requestAnimationFrame(tryPlay))
    }
  }
)

onBeforeUnmount(() => {
  videoReady.value = false
})
</script>

<style scoped>
.char-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}
.char-modal {
  position: relative;
  max-width: 400px;
  width: 90%;
  animation: scaleIn 0.4s ease;
}
.char-modal-close {
  position: absolute;
  top: -12px; right: -12px;
  width: 36px; height: 36px;
  background: rgba(255, 50, 50, 0.9);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 18px;
  color: #fff;
  z-index: 10;
  border: 2px solid rgba(255,255,255,0.3);
}
.char-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, #1a0a2e 0%, #0d1b2a 100%);
  border-radius: 16px;
  border: 2px solid rgba(218, 165, 32, 0.4);
  overflow: hidden;
  box-shadow: 0 0 40px rgba(218, 165, 32, 0.3);
}
.char-portrait-large {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(218,165,32,0.1) 0%, transparent 100%);
  overflow: hidden;
}
/* 加载占位 */
.char-portrait-loading {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 0;
}
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(218, 165, 32, 0.2);
  border-top-color: rgba(218, 165, 32, 0.8);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.char-portrait-static {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
  user-select: none;
  -webkit-user-drag: none;
}
.char-portrait-static.is-loaded {
  opacity: 1;
}
.char-portrait-static.is-hidden {
  opacity: 0;
}
.char-portrait-video {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 2;
  background: transparent;
}
.char-portrait-video.is-visible {
  opacity: 1;
}
.char-modal-footer {
  padding: 16px 20px 24px;
  text-align: center;
  width: 100%;
  background: linear-gradient(180deg, transparent, rgba(0,0,0,0.6));
}
.char-name-large {
  font-size: 24px;
  color: #FFD700;
  margin: 0 0 8px;
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}
.char-stars-large {
  font-size: 22px;
  letter-spacing: 4px;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
