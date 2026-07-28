<template>
  <!-- 灵宠立绘弹窗：对称于 CharacterPortraitModal，无动态视频，皮肤按升星逐级解锁（每 5 星解锁 1 个）。
       currentSkin 持久化到灵宠 item 上（不同于角色不持久化的设计），切换后下次打开仍是上次选择。 -->
  <Teleport to="body">
    <div v-if="pet" class="pet-modal-overlay" @click="$emit('close')">
      <div class="pet-modal" @click.stop>
        <div class="pet-modal-close" @click="$emit('close')">✕</div>
        <div class="pet-modal-content">
          <div class="pet-portrait-large">
            <!-- 加载占位 -->
            <div v-if="!avatarLoaded && !avatarError" class="pet-portrait-loading">
              <div class="loading-spinner"></div>
            </div>
            <!-- 加载失败占位（图片资源尚未提供时会显示此占位，引导玩家知晓立绘待制作） -->
            <div v-if="avatarError" class="pet-portrait-fallback">
              <span class="fallback-icon">🐾</span>
              <span class="fallback-text">{{ pet?.name || '灵宠' }}</span>
              <span class="fallback-hint">立绘制作中</span>
            </div>
            <!-- 静态立绘 -->
            <img
              v-if="avatar && !avatarError"
              ref="imgEl"
              :src="displaySrc"
              class="pet-portrait-static"
              :class="{ 'is-loaded': avatarLoaded }"
              alt="灵宠立绘"
              draggable="false"
              decoding="async"
              fetchpriority="high"
              @load="onAvatarLoad"
              @error="onAvatarError"
            />
            <!-- 皮肤切换：已解锁至少 1 个皮肤时显示左右箭头 -->
            <button v-if="canSwitch" class="skin-arrow skin-arrow-left" @click.stop="prevSkin" aria-label="上一个皮肤">‹</button>
            <button v-if="canSwitch" class="skin-arrow skin-arrow-right" @click.stop="nextSkin" aria-label="下一个皮肤">›</button>
            <div v-if="canSwitch" class="skin-indicator">{{ skinLabel }}</div>
            <div v-else-if="unlockedCount < skinCount" class="skin-lock-hint">🔒 升至 {{ nextUnlockStar }} 星解锁皮肤</div>
          </div>
          <div class="pet-modal-footer">
            <h2 class="pet-name-large">{{ pet.name }}</h2>
            <div class="pet-stars-large">{{ '⭐'.repeat((pet.star || 0) + 1) }}</div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { getPetAvatar, getPetSkinUrl, getPetSkinCount, getUnlockedSkinCount } from '../plugins/pets'

const props = defineProps({
  pet: { type: Object, default: null }
})
const emit = defineEmits(['close', 'update-skin'])

const imgEl = ref(null)
const avatarLoaded = ref(false)
const avatarError = ref(false)
// 图片重试：加载失败时带缓存破坏参数重试一次（应对偶发 404/SW 缓存不一致）
const imgRetryCount = ref(0)

const avatar = computed(() => (props.pet ? getPetAvatar(props.pet) : null))

// 已解锁皮肤数（按升星逐级解锁，min(unlocked, available)）
const unlockedCount = computed(() => getUnlockedSkinCount(props.pet))
// 该灵宠实际拥有的皮肤总数（manifest 中声明）
const skinCount = computed(() => getPetSkinCount(props.pet))
// 是否可切换：已解锁至少 1 个皮肤，且实际拥有至少 1 个皮肤
const canSwitch = computed(() => unlockedCount.value >= 1 && skinCount.value >= 1)

// currentSkin: 0 = 原立绘；1 = skin1；2 = skin2 ...
// 优先用灵宠持久化的 currentSkin，否则默认 0
const currentSkin = ref(0)
// 下一个解锁星级（用于锁定提示文案）
const nextUnlockStar = computed(() => (unlockedCount.value + 1) * 5)

// 当前展示的立绘 URL：选中皮肤（且该皮肤已解锁）则取皮肤图，否则回退原立绘
const displaySrc = computed(() => {
  let url
  if (currentSkin.value >= 1 && currentSkin.value <= unlockedCount.value) {
    const u = getPetSkinUrl(props.pet, currentSkin.value)
    if (u) url = u
  }
  if (!url) url = avatar.value
  if (!url) return null
  return imgRetryCount.value > 0 ? `${url}?r=${imgRetryCount.value}` : url
})

const onAvatarLoad = () => {
  avatarLoaded.value = true
  avatarError.value = false
}
const onAvatarError = () => {
  if (imgRetryCount.value < 1) {
    imgRetryCount.value++
  } else {
    avatarError.value = true
    avatarLoaded.value = false
  }
}

// 切换灵宠 / 已解锁数变化时，校正 currentSkin：
// - 灵宠切换：恢复该灵宠持久化的 currentSkin（默认 0）
// - 已解锁数下降（不应发生，但防御）：把 currentSkin 限制在合法范围
watch(
  () => [props.pet, unlockedCount.value],
  () => {
    const persisted = (props.pet && typeof props.pet.currentSkin === 'number') ? props.pet.currentSkin : 0
    // 校验持久化值是否仍合法（可能因升星回退/数据迁移导致越界）
    currentSkin.value = (persisted >= 0 && persisted <= unlockedCount.value) ? persisted : 0
    avatarLoaded.value = false
    avatarError.value = false
    imgRetryCount.value = 0
    nextTick(() => {
      if (imgEl.value && imgEl.value.complete && imgEl.value.naturalWidth > 0) {
        avatarLoaded.value = true
      }
    })
  },
  { immediate: true }
)

// 最大皮肤索引 = unlockedCount（0 原立绘 + skin1..skinN，但只能切到已解锁的）
const maxSkinIndex = computed(() => unlockedCount.value)
const skinLabel = computed(() => {
  if (currentSkin.value === 0) return '原立绘'
  return `皮肤 ${currentSkin.value}/${unlockedCount.value}`
})

const prevSkin = () => {
  if (!canSwitch.value) return
  currentSkin.value = currentSkin.value === 0 ? maxSkinIndex.value : currentSkin.value - 1
  avatarLoaded.value = false
  persistSkin()
}
const nextSkin = () => {
  if (!canSwitch.value) return
  currentSkin.value = currentSkin.value === maxSkinIndex.value ? 0 : currentSkin.value + 1
  avatarLoaded.value = false
  persistSkin()
}

// 通知父组件持久化灵宠的 currentSkin（父组件调 store action 写入）
const persistSkin = () => {
  emit('update-skin', { pet: props.pet, skin: currentSkin.value })
}

onMounted(() => {
  if (imgEl.value && imgEl.value.complete && imgEl.value.naturalWidth > 0) {
    avatarLoaded.value = true
  }
})
</script>

<style scoped>
.pet-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}
.pet-modal {
  position: relative;
  max-width: 400px;
  width: 90%;
  animation: scaleIn 0.4s ease;
}
.pet-modal-close {
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
.pet-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, #1a2e0a 0%, #0d1f0a 100%);
  border-radius: 16px;
  border: 2px solid rgba(120, 220, 100, 0.4);
  overflow: hidden;
  box-shadow: 0 0 40px rgba(120, 220, 100, 0.3);
}
.pet-portrait-large {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(120,220,100,0.1) 0%, transparent 100%);
  overflow: hidden;
}
.pet-portrait-loading {
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
  border: 2px solid rgba(120, 220, 100, 0.2);
  border-top-color: rgba(120, 220, 100, 0.8);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.pet-portrait-fallback {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 1;
  color: rgba(120, 220, 100, 0.7);
}
.fallback-icon { font-size: 56px; }
.fallback-text { font-size: 20px; font-weight: bold; }
.fallback-hint { font-size: 13px; color: rgba(255, 255, 255, 0.5); }
@keyframes spin { to { transform: rotate(360deg); } }
.pet-portrait-static {
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
.pet-portrait-static.is-loaded { opacity: 1; }
.skin-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid rgba(120, 220, 100, 0.6);
  background: rgba(13, 31, 10, 0.7);
  color: #80E060;
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
.skin-arrow:hover { background: rgba(120, 220, 100, 0.35); }
.skin-arrow:active { transform: translateY(-50%) scale(0.92); }
.skin-arrow-left { left: 12px; }
.skin-arrow-right { right: 12px; }
.skin-indicator {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 14px;
  border-radius: 12px;
  background: rgba(13, 31, 10, 0.7);
  border: 1px solid rgba(120, 220, 100, 0.4);
  color: #80E060;
  font-size: 14px;
  letter-spacing: 1px;
  z-index: 5;
}
.skin-lock-hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 14px;
  border-radius: 12px;
  background: rgba(13, 31, 10, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  z-index: 5;
}
.pet-modal-footer {
  padding: 16px 20px 24px;
  text-align: center;
  width: 100%;
  background: linear-gradient(180deg, transparent, rgba(0,0,0,0.6));
}
.pet-name-large {
  font-size: 24px;
  color: #80E060;
  margin: 0 0 8px;
  text-shadow: 0 0 15px rgba(120, 220, 100, 0.5);
}
.pet-stars-large {
  font-size: 22px;
  letter-spacing: 4px;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
