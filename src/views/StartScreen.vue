<template>
  <div class="start-screen">
    <div class="start-bg"></div>
    <div class="start-content">
      <div class="game-title">
        <div class="title-main">修仙问道</div>
        <div class="title-sub">Idle Cultivation</div>
        <div class="title-version">v1.0.5</div>
      </div>

      <div class="start-buttons" v-if="!showLoadMenu">
        <button class="btn-primary" @click="startNewGame">
          <span class="btn-icon">🌱</span>
          <span class="btn-text">新的开始</span>
        </button>
        <button class="btn-secondary" @click="showLoadMenu = true">
          <span class="btn-icon">📂</span>
          <span class="btn-text">读取存档</span>
        </button>
      </div>

      <div class="load-menu" v-else>
        <div class="menu-header">
          <button class="btn-back" @click="showLoadMenu = false">
            ← 返回
          </button>
          <span class="menu-title">选择存档</span>
          <span class="menu-spacer"></span>
        </div>

        <div class="slot-list">
          <div
            v-for="slot in saveSlots"
            :key="slot.slot"
            class="slot-item"
            :class="{ empty: !slot.name, damaged: slot.name === '存档损坏' }"
            @click="slot.name && slot.name !== '存档损坏' && loadGame(slot.slot)"
          >
            <div class="slot-number">{{ slot.slot }}</div>
            <div class="slot-info">
              <div class="slot-name">{{ slot.name || '空存档槽' }}</div>
              <div class="slot-realm" v-if="slot.realm">{{ slot.realm }}</div>
              <div class="slot-time" v-if="slot.saveTime">
                {{ formatTime(slot.saveTime) }}
              </div>
            </div>
            <div class="slot-action">
              <button
                v-if="slot.name && slot.name !== '存档损坏'"
                class="btn-small btn-danger"
                @click.stop="deleteSlot(slot.slot)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="start-footer">
        <span>心诚则灵 · 大道可期</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'

const router = useRouter()
const playerStore = usePlayerStore()
const showLoadMenu = ref(false)
const saveSlots = ref([])

const loadSlots = async () => {
  try {
    saveSlots.value = await playerStore.getSaveSlots()
  } catch (error) {
    console.error('加载存档槽位失败:', error)
  }
}

const startNewGame = async () => {
  try {
    await playerStore.clearData()
    playerStore.$reset()
    playerStore.initNewPlayer()
    await playerStore.saveData()
    router.push('/cultivation')
  } catch (error) {
    console.error('开始新游戏失败:', error)
  }
}

const loadGame = async (slot) => {
  try {
    await playerStore.loadFromSlot(slot)
    router.push('/cultivation')
  } catch (error) {
    console.error('加载存档失败:', error)
    alert('加载存档失败: ' + error.message)
  }
}

const deleteSlot = async (slot) => {
  if (!confirm('确定要删除这个存档吗？')) return
  try {
    await playerStore.deleteSlot(slot)
    await loadSlots()
  } catch (error) {
    console.error('删除存档失败:', error)
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

onMounted(() => {
  loadSlots()
})
</script>

<style scoped>
.start-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 1000;
}

.start-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #0D0D12 0%, #1A1A2E 50%, #2D1B4E 100%);
}

.start-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(218, 165, 32, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(153, 50, 204, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(30, 144, 255, 0.05) 0%, transparent 70%);
  animation: bgPulse 8s ease-in-out infinite;
}

@keyframes bgPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.start-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 20px;
  max-width: 400px;
  width: 100%;
}

.game-title {
  margin-bottom: 60px;
}

.title-main {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 48px;
  color: #FFD700;
  text-shadow: 
    0 0 10px rgba(255, 215, 0, 0.5),
    0 0 20px rgba(255, 215, 0, 0.3),
    0 0 30px rgba(255, 215, 0, 0.2);
  margin-bottom: 8px;
  letter-spacing: 8px;
}

.title-sub {
  font-size: 16px;
  color: #8B8B8B;
  font-weight: 300;
  letter-spacing: 4px;
  margin-bottom: 8px;
}

.title-version {
  font-size: 12px;
  color: #555;
}

.start-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 48px;
  border-radius: 40px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  width: 100%;
  max-width: 280px;
}

.btn-primary {
  background: linear-gradient(135deg, #DAA520, #FFD700);
  color: #0D0D12;
  box-shadow: 
    0 4px 15px rgba(218, 165, 32, 0.4),
    0 0 30px rgba(218, 165, 32, 0.2);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(218, 165, 32, 0.5),
    0 0 40px rgba(218, 165, 32, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #F5DEB3;
  border: 1px solid rgba(218, 165, 32, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(218, 165, 32, 0.5);
}

.btn-icon {
  font-size: 20px;
}

.btn-text {
  font-family: 'Ma Shan Zheng', cursive;
  letter-spacing: 2px;
}

.load-menu {
  background: rgba(20, 25, 30, 0.95);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(218, 165, 32, 0.2);
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(218, 165, 32, 0.2);
}

.btn-back {
  background: transparent;
  border: none;
  color: #8B8B8B;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #F5DEB3;
}

.menu-title {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 20px;
  color: #FFD700;
}

.menu-spacer {
  width: 60px;
}

.slot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.slot-item:hover:not(.empty):not(.damaged) {
  background: rgba(218, 165, 32, 0.1);
  border-color: rgba(218, 165, 32, 0.3);
}

.slot-item.empty {
  cursor: default;
  opacity: 0.5;
}

.slot-item.damaged {
  cursor: default;
  opacity: 0.6;
}

.slot-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(218, 165, 32, 0.2);
  color: #DAA520;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.slot-info {
  flex: 1;
  text-align: left;
}

.slot-name {
  font-size: 15px;
  color: #F5DEB3;
  font-weight: bold;
  margin-bottom: 2px;
}

.slot-realm {
  font-size: 12px;
  color: #DAA520;
  margin-bottom: 2px;
}

.slot-time {
  font-size: 11px;
  color: #666;
}

.slot-action {
  flex-shrink: 0;
}

.btn-small {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger {
  background: rgba(255, 99, 71, 0.2);
  color: #FF6347;
}

.btn-danger:hover {
  background: rgba(255, 99, 71, 0.3);
}

.start-footer {
  margin-top: 60px;
  font-size: 12px;
  color: #555;
  letter-spacing: 2px;
}

@media (min-width: 769px) {
  .start-screen {
    max-width: 520px;
    margin: 0 auto;
    border-left: 1px solid rgba(139, 69, 19, 0.2);
    border-right: 1px solid rgba(139, 69, 19, 0.2);
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
  }
}
</style>
