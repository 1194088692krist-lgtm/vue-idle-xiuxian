<template>
  <Teleport to="body">
    <div v-if="character" class="char-modal-overlay" @click="$emit('close')">
      <div class="char-modal" @click.stop>
        <div class="char-modal-close" @click="$emit('close')">✕</div>
        <div class="char-modal-content">
          <div class="char-portrait-large">
            <LivePortrait
              :avatar="avatar"
              :layers="layers"
              :name="character.name"
              :star="character.star || 3"
            />
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
import { getCharacterAvatar, getCharacterLayers } from '../plugins/characters'
import LivePortrait from './LivePortrait.vue'

const props = defineProps({
  character: { type: Object, default: null }
})
defineEmits(['close'])

const avatar = computed(() => (props.character ? getCharacterAvatar(props.character) : null))
const layers = computed(() => (props.character ? getCharacterLayers(props.character) : null))
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
