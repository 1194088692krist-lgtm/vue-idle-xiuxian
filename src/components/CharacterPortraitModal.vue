<template>
  <Teleport to="body">
    <div v-if="character" class="char-modal-overlay" @click="$emit('close')">
      <div class="char-modal" @click.stop>
        <div class="char-modal-close" @click="$emit('close')">✕</div>
        <div class="char-modal-content">
          <div class="char-portrait-large">
            <div v-if="avatar" class="char-image-large" :class="'star-' + (character.star || 3)">
              <img :src="avatar" :alt="character.name" />
            </div>
            <div v-else class="char-placeholder-large">
              <UserOutlined />
            </div>
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
import { computed } from 'vue'
import { UserOutlined } from '@ant-design/icons-vue'
import { getCharacterAvatar } from '../plugins/characters'

const props = defineProps({
  character: { type: Object, default: null }
})
defineEmits(['close'])

const avatar = computed(() => (props.character ? getCharacterAvatar(props.character) : null))
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
  width: 100%;
  aspect-ratio: 3/4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(218,165,32,0.1) 0%, transparent 100%);
  overflow: hidden;
}
.char-image-large {
  width: 100%;
  height: 100%;
}
.char-image-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  /* 微动效：呼吸缩放 + 上下浮动 */
  animation: charBreathe 4s ease-in-out infinite;
}
.char-placeholder-large {
  font-size: 120px;
  color: rgba(218, 165, 32, 0.3);
  animation: charPlaceholderFloat 3s ease-in-out infinite;
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

/* === 立绘微动效 === */
/* 呼吸：轻微缩放 + 上下浮动（整体，不破坏 object-fit 定位） */
@keyframes charBreathe {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.015); }
}
/* 占位符浮动 */
@keyframes charPlaceholderFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
/* 高星角色额外光晕脉冲（叠加在呼吸上） */
.char-image-large img[src] {
  animation: charBreathe 4s ease-in-out infinite;
}
/* 4★ 角色：增加青蓝光晕呼吸 */
.char-image-large.star-4 img {
  filter: drop-shadow(0 0 6px rgba(120, 220, 240, 0.3));
  animation: charBreathe4 4s ease-in-out infinite;
}
@keyframes charBreathe4 {
  0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 4px rgba(120, 220, 240, 0.25)); }
  50% { transform: translateY(-7px) scale(1.02); filter: drop-shadow(0 0 12px rgba(120, 220, 240, 0.5)); }
}
/* 5★ 角色：增加金色光晕呼吸 + 更大幅度 */
.char-image-large.star-5 img {
  animation: charBreathe5 3.5s ease-in-out infinite;
}
@keyframes charBreathe5 {
  0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 6px rgba(255, 200, 80, 0.35)); }
  50% { transform: translateY(-8px) scale(1.025); filter: drop-shadow(0 0 16px rgba(255, 200, 80, 0.65)); }
}
</style>
