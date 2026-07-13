<template>
  <div
    class="nav-item save-nav-item"
    :class="{ saving: saving }"
    @click="handleSave"
  >
    <n-icon class="nav-icon">
      <SaveOutlined />
    </n-icon>
    <span class="nav-label">存档{{ slotLabel }}</span>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { usePlayerStore } from '../stores/player'
  import { useMessage } from 'naive-ui'
  import { SaveOutlined } from '@ant-design/icons-vue'

  const playerStore = usePlayerStore()
  const message = useMessage()
  const saving = ref(false)

  // 标签上显示当前存档所在槽位（未指定时显示「·默认」）
  const slotLabel = computed(() => {
    return playerStore.currentSlot ? `·${playerStore.currentSlot}` : '·默认'
  })

  const handleSave = async () => {
    if (saving.value) return
    saving.value = true
    try {
      const slot = await playerStore.saveToCurrentSlot()
      message.success(`已保存至槽位 ${slot}`)
    } catch (err) {
      message.error('保存失败：' + (err?.message || err))
    } finally {
      saving.value = false
    }
  }
</script>

<style scoped>
  .save-nav-item {
    color: #DAA520;
    position: relative;
  }

  .save-nav-item::before {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(218, 165, 32, 0.12), rgba(255, 215, 0, 0.05));
    border: 1px solid rgba(218, 165, 32, 0.35);
    z-index: -1;
    transition: all 0.2s ease;
  }

  .save-nav-item:active {
    transform: scale(0.95);
  }

  .save-nav-item:active::before {
    background: linear-gradient(135deg, rgba(218, 165, 32, 0.25), rgba(255, 215, 0, 0.12));
  }

  .save-nav-item.saving {
    animation: savePulse 0.8s ease-in-out infinite;
  }

  @keyframes savePulse {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(218, 165, 32, 0.5)); }
    50% { filter: drop-shadow(0 0 12px rgba(218, 165, 32, 0.9)); }
  }
</style>
