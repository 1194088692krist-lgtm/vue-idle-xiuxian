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
              :src="displaySrc"
              class="char-portrait-static"
              :class="{ 'is-loaded': avatarLoaded, 'is-hidden': videoVisible && videoReady }"
              alt="角色立绘"
              draggable="false"
              decoding="async"
              fetchpriority="high"
              @load="onAvatarLoad"
              @error="onAvatarError"
            />
            <!-- 动态视频：加载完成后淡入覆盖并自动播放。
                 视频源直接挂在 <video :src> 上（比 <source> 子元素可靠：
                 <video v-if> + 动态 <source :src> 存在资源选择竞态，
                 可能导致视频拿到空源而触发 error 静默回退静态图）。
                 关键修复：
                 1) autoplay 原生属性——静音视频由浏览器原生自动播放，
                    不依赖 JS play() 的时序/手势上下文，最稳；
                 2) 同时监听 loadeddata 与 canplay，尽早显示并播放；
                 3) 加载失败时带缓存破坏参数重试一次，应对偶发网络/解码失败。 -->
            <video
              v-if="videoVisible"
              :key="videoReloadKey"
              ref="videoEl"
              class="char-portrait-video"
              :class="{ 'is-visible': videoReady }"
              :src="effectiveVideoSrc"
              :poster="avatar || undefined"
              autoplay
              preload="metadata"
              muted
              loop
              playsinline
              webkit-playsinline
              @loadstart="onVideoLoadStart"
              @loadedmetadata="onVideoMeta"
              @loadeddata="onVideoReady"
              @canplay="onVideoReady"
              @playing="onVideoPlaying"
              @error="onVideoError"
            ></video>
            <!-- 皮肤切换（突破>=1 且拥有皮肤时显示左右箭头） -->
            <button v-if="canSwitch" class="skin-arrow skin-arrow-left" @click.stop="prevSkin" aria-label="上一个皮肤">‹</button>
            <button v-if="canSwitch" class="skin-arrow skin-arrow-right" @click.stop="nextSkin" aria-label="下一个皮肤">›</button>
            <div v-if="canSwitch" class="skin-indicator">{{ skinLabel }}</div>
            <div v-else-if="skinCount >= 2" class="skin-lock-hint">🔒 突破 1 次解锁皮肤切换</div>
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
import { getCharacterAvatar, getCharacterVideo, getCharacterSkinUrl, getSkinCount } from '../plugins/characters'
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
// 重试计数与重载 key：首次加载偶发失败时，破坏缓存后重新加载一次
const videoErrorRetries = ref(0)
const videoReloadKey = ref(0)

const avatar = computed(() => (props.character ? getCharacterAvatar(props.character) : null))
const videoSrc = computed(() => (props.character ? getCharacterVideo(props.character) : null))
// 含重试缓存破坏参数的有效视频源
const effectiveVideoSrc = computed(() =>
  videoSrc.value ? (videoErrorRetries.value > 0 ? `${videoSrc.value}?r=${videoErrorRetries.value}` : videoSrc.value) : null
)
// 同时满足：动态效果开启 + 该角色配置了视频
const shouldShowVideo = computed(() => !!playerStore.dynamicPortrait && !!effectiveVideoSrc.value)

// ===== 皮肤切换 =====
// 突破 >=1 次且角色拥有 >=2 张皮肤时，允许在 skin1 / skin2 之间左右切换
const breakThrough = computed(() => (props.character && props.character.breakThrough) || 0)
const skinCount = computed(() => getSkinCount(props.character))
const canSwitch = computed(() => breakThrough.value >= 1 && skinCount.value >= 2)
// currentSkin: 0 = 原立绘；1 = skin1；2 = skin2
const currentSkin = ref(0)
// 当前展示的立绘：选中皮肤则取皮肤图，否则回退原立绘
const displaySrc = computed(() => {
  if (currentSkin.value >= 1) {
    const u = getCharacterSkinUrl(props.character, currentSkin.value)
    if (u) return u
  }
  return avatar.value
})
// 动态视频仅原立绘（currentSkin===0）时播放
const videoVisible = computed(() => currentSkin.value === 0 && shouldShowVideo.value)

// 静态图加载完成回调
const onAvatarLoad = () => {
  avatarLoaded.value = true
}
const onAvatarError = () => {
  avatarLoaded.value = false
}

// 触发播放：优先依赖 autoplay 原生属性；此函数为兜底（已缓存/竞态场景）。
// 若 play() 被自动播放策略拦截，延迟一小段后重试一次（部分浏览器首播需短暂延迟）。
const tryPlay = () => {
  const v = videoEl.value
  if (!v) return
  const p = v.play()
  if (p && p.catch) {
    p.catch(() => {
      setTimeout(() => {
        const vv = videoEl.value
        if (vv) {
          const pp = vv.play()
          if (pp && pp.catch) pp.catch(() => { /* 仍被拦截则保持静态立绘 */ })
        }
      }, 300)
    })
  }
}

// loadeddata / canplay：首帧已解码就绪，立即显示并播放
const onVideoReady = () => {
  videoReady.value = true
  tryPlay()
}
// playing：浏览器已开始播放，确保显示视频
const onVideoPlaying = () => {
  videoReady.value = true
}
const onVideoLoadStart = () => {
  if (import.meta.env.DEV) console.debug('[立绘视频] loadstart', effectiveVideoSrc.value)
}
const onVideoMeta = () => {
  if (import.meta.env.DEV) console.debug('[立绘视频] loadedmetadata', effectiveVideoSrc.value)
}

const onVideoError = (e) => {
  // 视频加载失败：打印真实错误便于排查（如源无法解码/404/网络中断）
  const v = videoEl.value
  const errDetail = v && v.error ? `code=${v.error.code} mediaError=${['','MEDIA_ERR_ABORTED','MEDIA_ERR_NETWORK','MEDIA_ERR_DECODE','MEDIA_ERR_SRC_NOT_SUPPORTED'][v.error.code] || '未知'}` : ''
  console.warn('[立绘视频] 加载失败，回退静态立绘：', effectiveVideoSrc.value, errDetail, e)
  videoReady.value = false
  // 偶发失败自愈：带缓存破坏参数重试一次（最多 1 次），避免永久卡在静态图
  if (videoErrorRetries.value < 1) {
    videoErrorRetries.value++
    videoReloadKey.value++
    nextTick(() => requestAnimationFrame(tryPlay))
  }
}

// 组件挂载后立即尝试播放（处理视频已缓存、loadeddata 不再触发的情况）
onMounted(() => {
  // 静态图可能已缓存（complete 状态），直接标记为已加载
  if (imgEl.value && imgEl.value.complete) {
    avatarLoaded.value = true
  }
  if (videoVisible.value) {
    nextTick(() => requestAnimationFrame(tryPlay))
  }
})

// 切换角色 / 皮肤 / 开关变化时重置，并尝试直接播放（已被缓存时更快）
watch(
  () => [props.character, currentSkin.value, videoVisible.value, effectiveVideoSrc.value],
  () => {
    videoReady.value = false
    avatarLoaded.value = false
    // 切换目标时清零重试状态，避免把上一次的重试参数带到新视频
    videoErrorRetries.value = 0
    videoReloadKey.value = 0
    if (videoVisible.value) {
      // 等待 video 元素渲染后再尝试播放
      nextTick(() => requestAnimationFrame(tryPlay))
    }
  }
)

// 角色或「可切换」状态变化时，重置当前皮肤：可切换则默认 skin1，否则原立绘
watch(
  () => [props.character, canSwitch.value],
  () => { currentSkin.value = canSwitch.value ? 1 : 0 },
  { immediate: true }
)

// 最大索引 = skinCount（0 原立绘 + skin1..skinN）
const maxSkinIndex = computed(() => skinCount.value)
const skinLabel = computed(() => {
  if (currentSkin.value === 0) return '原立绘'
  return `皮肤 ${currentSkin.value}/${skinCount.value}`
})
// 左右切换皮肤：循环 [0 原立绘, 1 skin1, 2 skin2, ...]
const prevSkin = () => {
  if (!canSwitch.value) return
  currentSkin.value = currentSkin.value === 0 ? maxSkinIndex.value : currentSkin.value - 1
  avatarLoaded.value = false
}
const nextSkin = () => {
  if (!canSwitch.value) return
  currentSkin.value = currentSkin.value === maxSkinIndex.value ? 0 : currentSkin.value + 1
  avatarLoaded.value = false
}

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
/* 皮肤左右切换箭头 */
.skin-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid rgba(218, 165, 32, 0.6);
  background: rgba(13, 27, 42, 0.7);
  color: #FFD700;
  font-size: 28px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  user-select: none;
  transition: background 0.2s ease, transform 0.15s ease;
}
.skin-arrow:hover {
  background: rgba(218, 165, 32, 0.35);
}
.skin-arrow:active {
  transform: translateY(-50%) scale(0.92);
}
.skin-arrow-left { left: 12px; }
.skin-arrow-right { right: 12px; }
/* 皮肤序号指示 */
.skin-indicator {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 14px;
  border-radius: 12px;
  background: rgba(13, 27, 42, 0.7);
  border: 1px solid rgba(218, 165, 32, 0.4);
  color: #FFD700;
  font-size: 14px;
  letter-spacing: 1px;
  z-index: 5;
}
/* 未突破时的锁定提示 */
.skin-lock-hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 14px;
  border-radius: 12px;
  background: rgba(13, 27, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  z-index: 5;
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
