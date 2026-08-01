<template>
  <Teleport to="body">
    <div v-if="character" class="char-modal-overlay" @click="$emit('close')">
      <div class="char-modal" @click.stop>
        <div class="char-modal-close" @click="$emit('close')">✕</div>
        <div class="char-modal-content">
          <div class="char-portrait-large">
            <!-- 加载占位：图片/视频未就绪且未出错时显示 -->
            <div v-if="!avatarLoaded && !avatarError" class="char-portrait-loading">
              <div class="loading-spinner"></div>
            </div>
            <!-- 加载失败占位：显示角色名，不让用户对着空 spinner 发呆 -->
            <div v-if="avatarError" class="char-portrait-fallback">
              <span class="fallback-icon">🖼️</span>
              <span class="fallback-text">{{ character?.name || '角色' }}</span>
              <span class="fallback-hint">立绘加载失败</span>
            </div>
            <!-- 静态立绘：始终作为底层；无视频时直接展示，有视频时作为首帧垫底 -->
            <img
              v-if="avatar && !avatarError"
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
            <div v-else-if="skinCount >= 2 && breakThrough < 1" class="skin-lock-hint">🔒 突破 1 次解锁皮肤切换</div>
            <div v-if="canSwitch && maxSkinIndex < skinCount" class="skin-lock-hint">🔒 突破 {{ maxSkinIndex }} 次解锁更多皮肤</div>
          </div>
          <div class="char-modal-footer">
            <h2 class="char-name-large">{{ character.name }}</h2>
            <div class="char-stars-large">{{ '⭐'.repeat(character.star || 1) }}</div>
            <!-- 设为击杀立绘：为本角色单独指定击杀BOSS时弹出的立绘（每个角色独立设置） -->
            <!-- 仅在当前皮肤已解锁（突破或购买）时才显示，避免商店预览未购买皮肤时被设为击杀立绘 -->
            <button
              v-if="isSkinUnlocked(currentSkin)"
              class="set-kill-portrait-btn"
              :class="{ active: isCurrentKillPortrait }"
              @click.stop="setAsKillPortrait"
            >
              {{ isCurrentKillPortrait ? '✓ 已设为本角色击杀立绘' : '设为本角色击杀立绘' }}
            </button>
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
import { useIdleSystem } from '../composables/useIdleSystem'

const props = defineProps({
  character: { type: Object, default: null },
  // 初始展示的皮肤索引：0=原立绘（默认），1=skin1，2=skin2…
  // 用于商店等场景需要直接展示某皮肤立绘，而非默认原立绘
  initialSkin: { type: Number, default: 0 }
})
defineEmits(['close'])

const playerStore = usePlayerStore()
const videoEl = ref(null)
const imgEl = ref(null)
const videoReady = ref(false)
const avatarLoaded = ref(false)
const avatarError = ref(false)
// 图片重试：加载失败时带缓存破坏参数重试一次（应对偶发 404/SW 缓存不一致）
const imgRetryCount = ref(0)
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
// 突破 >=1 次且角色拥有 >=2 张皮肤时，允许切换皮肤
// skin1/skin2：突破 >=1 次解锁；skin3：突破 >=2 次解锁
const breakThrough = computed(() => (props.character && props.character.breakThrough) || 0)
const skinCount = computed(() => getSkinCount(props.character))
const canSwitch = computed(() => breakThrough.value >= 1 && skinCount.value >= 2)
// currentSkin: 0 = 原立绘；1 = skin1；2 = skin2
const currentSkin = ref(0)
// 当前展示的立绘：选中皮肤则取皮肤图，否则回退原立绘
// 含图片重试缓存破坏参数：imgRetryCount > 0 时追加 ?r=N
const displaySrc = computed(() => {
  let url
  // 商店预览态：initialSkin>=1 且当前展示的就是该初始皮肤时，绕过 isSkinUnlocked 检查
  // 这就是要出售的商品，必须直接展示对应皮肤立绘（用户尚未购买，isSkinUnlocked 会返回 false）
  const isShopPreview = Number(props.initialSkin) >= 1 && currentSkin.value === Number(props.initialSkin)
  if (currentSkin.value >= 1 && (isShopPreview || isSkinUnlocked(currentSkin.value))) {
    const u = getCharacterSkinUrl(props.character, currentSkin.value)
    if (u) url = u
  }
  if (!url) url = avatar.value
  if (!url) return null
  return imgRetryCount.value > 0 ? `${url}?r=${imgRetryCount.value}` : url
})
// 动态视频仅原立绘（currentSkin===0）时播放
const videoVisible = computed(() => currentSkin.value === 0 && shouldShowVideo.value)

// 静态图加载完成回调
const onAvatarLoad = () => {
  avatarLoaded.value = true
  avatarError.value = false
}
const onAvatarError = () => {
  // 加载失败：重试一次（带缓存破坏参数），仍失败则显示 fallback 而非永久转圈
  if (imgRetryCount.value < 1) {
    imgRetryCount.value++
  } else {
    avatarError.value = true
    avatarLoaded.value = false
  }
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
  if (imgEl.value && imgEl.value.complete && imgEl.value.naturalWidth > 0) {
    avatarLoaded.value = true
  }
  if (videoVisible.value) {
    nextTick(() => requestAnimationFrame(tryPlay))
  }
  // 关闭人物 BOSS 演出浮层（含击败立绘），防止 z-index 10000 遮挡本弹窗（z-index 9999）
  // 场景：挂机击败人物BOSS后 defeated 立绘仍在展示，此时打开立绘弹窗会被盖住
  try {
    const { characterBossIntro } = useIdleSystem()
    if (characterBossIntro.value && characterBossIntro.value.show) {
      characterBossIntro.value = { show: false, characterId: null, name: '', portrait: '', star: 0, theme: null, isDefeated: false }
    }
  } catch (e) { /* ignore */ }
})

// 切换角色 / 皮肤 / 开关变化时重置，并尝试直接播放（已被缓存时更快）
watch(
  () => [props.character, currentSkin.value, videoVisible.value, effectiveVideoSrc.value],
  () => {
    videoReady.value = false
    avatarLoaded.value = false
    avatarError.value = false
    imgRetryCount.value = 0
    // 切换目标时清零重试状态，避免把上一次的重试参数带到新视频
    videoErrorRetries.value = 0
    videoReloadKey.value = 0
    // 修复：已缓存图片切换时 @load 可能不触发（浏览器认为 src 没变或缓存命中跳过事件）。
    // nextTick 后手动检查 img.complete，若已就绪直接标记 loaded。
    nextTick(() => {
      if (imgEl.value && imgEl.value.complete && imgEl.value.naturalWidth > 0) {
        avatarLoaded.value = true
      }
      if (videoVisible.value) {
        requestAnimationFrame(tryPlay)
      }
    })
  }
)

// 角色或「可切换」状态变化时，重置当前皮肤：
// - 若传入 initialSkin（商店场景）：强制展示该皮肤立绘，不受解锁限制（这就是要卖的商品）
// - 否则默认显示原立绘（0），用户可手动切换皮肤
// 修复：原实现可切换时默认 skin1，导致皮肤1覆盖原立绘，用户看不到原立绘
watch(
  () => [props.character, canSwitch.value],
  () => {
    const initSkin = Number(props.initialSkin) || 0
    if (initSkin >= 1) {
      // 商店场景：直接展示指定皮肤，不受 isSkinUnlocked 限制
      currentSkin.value = initSkin
    } else {
      currentSkin.value = 0
    }
  },
  { immediate: true }
)

// 最大可切换索引 = 按突破次数限制（0 原立绘不在计数内）
// ⚠️ 皮肤解锁规则（用户需求修订）：
//   - 突破 N 级 → 解锁 skin 1~N（严格 1:1：突破1→skin1，突破2→skin2，...，突破5→skin5）
//   - 皮肤 6、皮肤 7 → 通过灵石阁商店购买解锁（记录在 playerStore.unlockedShopSkins）
//   - 旧的"突破1解锁 skin1+skin2 两个"逻辑已废弃
const maxSkinIndex = computed(() => {
  if (!canSwitch.value) return 0
  // 已购皮肤集合：{ [characterId]: [skinIndex, ...] }，由灵石阁购买写入
  const charId = (props.character && (props.character.templateId || props.character.id)) || null
  const purchased = charId ? (playerStore.unlockedShopSkins?.[charId] || []) : []
  // 1. 突破解锁的皮肤：skin 1 ~ breakThrough
  let maxByBreak = breakThrough.value
  // 2. 商店购买的皮肤：合并到候选集合
  // 取突破解锁范围与商店购买集合的并集最大索引
  let maxPurchased = purchased.length > 0 ? Math.max(...purchased) : 0
  const maxAllowed = Math.max(maxByBreak, maxPurchased)
  // 不能超过该角色实际拥有的皮肤数
  return Math.min(maxAllowed, skinCount.value)
})
// 判断某个皮肤索引是否已解锁（用于 UI 标识"未解锁"状态）
const isSkinUnlocked = (skinIdx) => {
  if (skinIdx === 0) return true // 原立绘永远可用
  if (skinIdx <= breakThrough.value) return true // 突破 N 解锁 skin 1~N
  const charId = (props.character && (props.character.templateId || props.character.id)) || null
  const purchased = charId ? (playerStore.unlockedShopSkins?.[charId] || []) : []
  return purchased.includes(skinIdx)
}
// 获取皮肤解锁来源说明（用于 UI 显示）
const getSkinUnlockSource = (skinIdx) => {
  if (skinIdx === 0) return '原立绘'
  if (skinIdx <= 5) return `突破 ${skinIdx} 级解锁`
  return '灵石阁购买解锁'
}
const skinLabel = computed(() => {
  if (currentSkin.value === 0) return '原立绘'
  return `皮肤 ${currentSkin.value}/${skinCount.value}`
})
// 左右切换皮肤：仅在已解锁皮肤集合中循环跳转（0 原立绘 + 突破解锁 + 商店购买）
// 修复：原逻辑用连续上界 maxSkinIndex 循环，会切到未购买的 skin4/5
const unlockedSkinList = computed(() => {
  if (!canSwitch.value) return [0]
  const list = [0]
  for (let i = 1; i <= skinCount.value; i++) {
    if (isSkinUnlocked(i)) list.push(i)
  }
  return list
})
const prevSkin = () => {
  if (!canSwitch.value) return
  const list = unlockedSkinList.value
  const idx = list.indexOf(currentSkin.value)
  const next = idx <= 0 ? list[list.length - 1] : list[idx - 1]
  currentSkin.value = next
  avatarLoaded.value = false
}
const nextSkin = () => {
  if (!canSwitch.value) return
  const list = unlockedSkinList.value
  const idx = list.indexOf(currentSkin.value)
  const next = idx < 0 || idx >= list.length - 1 ? list[0] : list[idx + 1]
  currentSkin.value = next
  avatarLoaded.value = false
}

// ===== 设为本角色击杀立绘 =====
// 角色ID：templateId 优先，回退 id（与 useIdleSystem 的 memberId 一致）
const characterId = computed(() => (props.character && (props.character.templateId || props.character.id)) || null)
// 当前角色+当前皮肤是否已被设为本角色的击杀立绘
const isCurrentKillPortrait = computed(() => {
  if (!characterId.value) return false
  const saved = playerStore.characterKillSkins?.[characterId.value]
  // 未设置（undefined）默认等价于 0（原立绘）
  return (saved === undefined ? 0 : saved) === currentSkin.value
})
// 设为本角色击杀立绘：把当前选中皮肤保存为该角色的击杀立绘索引
// 三个出战角色可分别设置自己的击杀立绘，击杀BOSS时按实际斩杀者取用
const setAsKillPortrait = () => {
  if (!characterId.value) return
  if (!playerStore.characterKillSkins) playerStore.characterKillSkins = {}
  playerStore.characterKillSkins[characterId.value] = currentSkin.value
  localStorage.setItem('characterKillSkins', JSON.stringify(playerStore.characterKillSkins))
  playerStore.saveData()
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
/* 加载失败占位 */
.char-portrait-fallback {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 1;
  color: rgba(218, 165, 32, 0.6);
}
.fallback-icon { font-size: 48px; }
.fallback-text { font-size: 20px; font-weight: bold; }
.fallback-hint { font-size: 13px; color: rgba(255, 255, 255, 0.4); }
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
.set-kill-portrait-btn {
  margin-top: 12px;
  padding: 8px 20px;
  font-size: 14px;
  color: #fff;
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.set-kill-portrait-btn:hover {
  background: rgba(255, 215, 0, 0.3);
  border-color: #FFD700;
}
.set-kill-portrait-btn.active {
  background: rgba(255, 215, 0, 0.35);
  border-color: #FFD700;
  color: #FFD700;
  font-weight: bold;
}
.set-kill-portrait-btn.reset {
  margin-left: 8px;
  padding: 8px 16px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.3);
}
.set-kill-portrait-btn.reset:hover {
  background: rgba(255, 255, 255, 0.15);
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* 移动端：立绘弹窗靠下显示，避免每次点击头像都要往上滑才能看到立绘 */
@media (max-width: 600px) {
  .char-modal-overlay {
    align-items: flex-end;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .char-modal {
    width: 92%;
    max-width: 360px;
    margin-bottom: 2vh;
    transform-origin: bottom center;
  }
  @keyframes scaleIn {
    from { transform: translateY(40px) scale(0.92); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }
}
</style>
