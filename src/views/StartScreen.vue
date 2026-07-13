<template>
  <div class="start-screen">
    <div class="start-bg"></div>
    <div class="bg-overlay"></div>
    <div class="start-content">
      <div class="game-title" @click="handleTitleClick">
        <div class="title-ornament top">✦ ✦ ✦</div>
        <div class="title-main">修仙问道</div>
        <div class="title-sub">Idle Cultivation</div>
        <div class="title-version">v1.1.0</div>
        <div class="title-ornament bottom">✦ ✦ ✦</div>
      </div>

      <div class="start-buttons" v-if="!showLoadMenu">
        <button class="btn-primary" @click="startNewGame">
          <span class="btn-icon">⚔</span>
          <span class="btn-text">新的开始</span>
        </button>
        <button class="btn-secondary" @click="showLoadMenu = true">
          <span class="btn-icon">📜</span>
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
        <span>道可道 · 非常道</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import { loadTheme } from '../plugins/theme'

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
    playerStore.regenerateSpirit() // 加载存档后恢复离线灵力
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

let clickCount = 0
let clickTimer = null

const handleTitleClick = () => {
  clickCount++
  if (clickTimer) clearTimeout(clickTimer)
  if (clickCount >= 5) {
    playerStore.isGMMode = !playerStore.isGMMode
    localStorage.setItem('isGMMode', playerStore.isGMMode)
    alert(playerStore.isGMMode ? 'GM模式已开启' : 'GM模式已关闭')
    clickCount = 0
  } else {
    clickTimer = setTimeout(() => {
      clickCount = 0
    }, 2000)
  }
}

onMounted(() => {
  loadTheme()
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
  background-image: url('https://i.postimg.cc/MpkhQqtd/start.png');
  background-size: cover;
  background-position: center top;
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.25) 20%,
    rgba(0, 0, 0, 0.35) 50%,
    rgba(0, 0, 0, 0.6) 80%,
    rgba(0, 0, 0, 0.8) 100%
  );
}

.bg-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    ellipse at center top,
    rgba(255, 215, 0, 0.15) 0%,
    transparent 50%
  );
}

.start-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 20px;
  max-width: 420px;
  width: 100%;
}

.game-title {
  margin-bottom: 70px;
  cursor: default;
}

.title-ornament {
  font-size: 14px;
  color: #B8860B;
  letter-spacing: 8px;
  text-shadow: 0 0 10px rgba(184, 134, 11, 0.5);
  margin-bottom: 12px;
}

.title-ornament.bottom {
  margin-bottom: 0;
  margin-top: 12px;
}

.title-main {
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif;
  font-size: 56px;
  color: #FFD700;
  text-shadow: 
    0 0 12px rgba(255, 215, 0, 0.6),
    0 0 24px rgba(255, 215, 0, 0.4),
    0 0 36px rgba(255, 215, 0, 0.2),
    2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 10px;
  letter-spacing: 10px;
  font-weight: normal;
}

.title-sub {
  font-size: 14px;
  color: #DAA520;
  font-weight: 300;
  letter-spacing: 6px;
  margin-bottom: 6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.title-version {
  font-size: 11px;
  color: #8B7355;
  letter-spacing: 2px;
}

.start-buttons {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 18px 56px;
  border-radius: 2px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  width: 100%;
  max-width: 300px;
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: linear-gradient(135deg, #8B6914 0%, #DAA520 50%, #FFD700 100%);
  color: #0a0a0a;
  border: 2px solid #FFD700;
  box-shadow: 
    0 4px 20px rgba(218, 165, 32, 0.5),
    0 0 40px rgba(218, 165, 32, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border: 1px solid rgba(139, 105, 20, 0.5);
  pointer-events: none;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 28px rgba(255, 215, 0, 0.6),
    0 0 60px rgba(255, 215, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: rgba(10, 10, 10, 0.85);
  color: #DAA520;
  border: 2px solid #8B6914;
  box-shadow: 
    0 2px 10px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(218, 165, 32, 0.1);
}

.btn-secondary::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border: 1px solid rgba(139, 105, 20, 0.3);
  pointer-events: none;
}

.btn-secondary:hover {
  background: rgba(20, 15, 5, 0.9);
  border-color: #DAA520;
  color: #FFD700;
  box-shadow: 
    0 4px 15px rgba(218, 165, 32, 0.3),
    inset 0 1px 0 rgba(218, 165, 32, 0.2);
}

.btn-icon {
  font-size: 18px;
}

.btn-text {
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif;
  letter-spacing: 4px;
  font-weight: normal;
}

.load-menu {
  background: linear-gradient(180deg, rgba(15, 12, 8, 0.97) 0%, rgba(5, 4, 2, 0.98) 100%);
  border-radius: 4px;
  padding: 24px 20px;
  backdrop-filter: blur(8px);
  border: 1px solid #8B6914;
  position: relative;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.8),
    0 0 60px rgba(218, 165, 32, 0.1),
    inset 0 1px 0 rgba(218, 165, 32, 0.1);
}

.load-menu::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  bottom: 4px;
  border: 1px solid rgba(139, 105, 20, 0.3);
  pointer-events: none;
  border-radius: 2px;
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(139, 105, 20, 0.4);
}

.btn-back {
  background: transparent;
  border: none;
  color: #8B7355;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-family: 'Ma Shan Zheng', serif;
}

.btn-back:hover {
  background: rgba(218, 165, 32, 0.1);
  color: #DAA520;
}

.menu-title {
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif;
  font-size: 22px;
  color: #FFD700;
  letter-spacing: 4px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
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
  gap: 14px;
  padding: 14px 16px;
  background: linear-gradient(180deg, rgba(20, 16, 10, 0.9) 0%, rgba(10, 8, 5, 0.95) 100%);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid rgba(139, 105, 20, 0.3);
}

.slot-item:hover:not(.empty):not(.damaged) {
  background: linear-gradient(180deg, rgba(30, 24, 12, 0.95) 0%, rgba(15, 12, 6, 0.98) 100%);
  border-color: #DAA520;
  box-shadow: 
    0 2px 12px rgba(218, 165, 32, 0.2),
    inset 0 1px 0 rgba(218, 165, 32, 0.1);
}

.slot-item.empty {
  cursor: default;
  opacity: 0.4;
}

.slot-item.damaged {
  cursor: default;
  opacity: 0.5;
  border-color: rgba(178, 34, 34, 0.4);
}

.slot-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1510 0%, #0a0805 100%);
  color: #DAA520;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: bold;
  border: 1px solid #8B6914;
  font-family: 'Ma Shan Zheng', serif;
}

.slot-info {
  flex: 1;
  text-align: left;
}

.slot-name {
  font-size: 15px;
  color: #F5DEB3;
  font-weight: normal;
  margin-bottom: 3px;
  font-family: 'Ma Shan Zheng', serif;
  letter-spacing: 2px;
}

.slot-realm {
  font-size: 12px;
  color: #DAA520;
  margin-bottom: 2px;
}

.slot-time {
  font-size: 11px;
  color: #665544;
}

.slot-action {
  flex-shrink: 0;
}

.btn-small {
  padding: 6px 14px;
  border-radius: 2px;
  font-size: 12px;
  border: 1px solid rgba(178, 34, 34, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Ma Shan Zheng', serif;
  letter-spacing: 2px;
}

.btn-danger {
  background: rgba(30, 10, 5, 0.8);
  color: #CD5C5C;
}

.btn-danger:hover {
  background: rgba(50, 15, 10, 0.9);
  border-color: rgba(205, 92, 92, 0.6);
}

.start-footer {
  margin-top: 70px;
  font-size: 12px;
  color: #6B5B3F;
  letter-spacing: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  font-family: 'Ma Shan Zheng', serif;
}

@media (min-width: 769px) {
  .start-screen {
    max-width: 520px;
    margin: 0 auto;
    border-left: 1px solid rgba(139, 105, 20, 0.3);
    border-right: 1px solid rgba(139, 105, 20, 0.3);
    box-shadow: 0 0 60px rgba(0, 0, 0, 0.8);
  }
}
</style>
