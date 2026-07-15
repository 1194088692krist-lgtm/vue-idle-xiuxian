<template>
  <n-config-provider :theme="playerStore.isDarkMode ? darkTheme : null">
    <n-message-provider>
      <n-dialog-provider>
        <div v-if="isLoading" class="loading-screen">
          <div class="loading-content">
            <div class="loading-title">修仙梦途</div>
            <div class="loading-subtitle">{{ loadingText }}</div>
            <div class="loading-bar-container">
              <div class="loading-bar" :style="{ width: loadingProgress + '%' }"></div>
            </div>
            <div class="loading-percent">{{ loadingProgress }}%</div>
            <div v-if="isFirstLoad" class="loading-tip">
              ⚠️ 首次启动可能需要较长时间加载资源，请耐心等待...
            </div>
          </div>
        </div>
        <router-view v-if="isStartScreen && !isLoading" />
        <div v-else-if="!isLoading" class="game-container">
            <!-- 桌面端左侧导航栏 -->
            <nav class="desktop-sidebar">
              <div class="desktop-sidebar-inner">
                <div class="sidebar-logo">仙</div>
                <div
                  v-for="item in allMenuItems"
                  :key="item.key"
                  class="nav-item"
                  :class="{ active: getCurrentMenuKey() === item.key }"
                  @click="handleMenuClick(item.key)"
                >
                  <n-icon class="nav-icon">
                    <component :is="item.icon" />
                  </n-icon>
                </div>
                <div class="sidebar-save-btn">
                  <SaveButton />
                </div>
              </div>
            </nav>

            <div class="main-column">
            <!-- 顶部状态栏 -->
            <header class="top-bar">
              <div class="player-info">
                <div class="player-name-only">{{ playerStore.name }}</div>
              </div>
              <div class="resource-bar">
                <div class="resource-item crystal">
                  <n-icon class="resource-icon"><StarOutlined /></n-icon>
                  <div class="resource-content">
                    <span class="resource-label">幻灵结晶</span>
                    <span class="resource-value">{{ formatResource(animatedCrystals) }}</span>
                  </div>
                </div>
                <div class="resource-item gold">
                  <n-icon class="resource-icon"><DollarOutlined /></n-icon>
                  <div class="resource-content">
                    <span class="resource-label">灵石</span>
                    <span class="resource-value">{{ formatResource(animatedStones) }}</span>
                  </div>
                </div>
              </div>
            </header>

            <!-- 修为池 -->
            <div class="cultivation-bar">
              <div class="cultivation-info">
                <span class="cultivation-label">修为池</span>
                <span class="cultivation-text">{{ animatedCultivation }}</span>
              </div>
              <div class="cultivation-progress">
                <div class="progress-bar">
                  <div class="progress-fill cultivation-pool-fill" style="width: 100%">
                    <div class="progress-shimmer"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 主内容区 -->
            <main class="content-area">
              <router-view />
            </main>

            <!-- 底部导航栏 -->
            <nav class="bottom-nav">
              <div class="bottom-nav-inner">
                <div
                  v-for="item in visibleMenuItems"
                  :key="item.key"
                  class="nav-item"
                  :class="{ active: getCurrentMenuKey() === item.key }"
                  @click="handleMenuClick(item.key)"
                >
                  <n-icon class="nav-icon">
                    <component :is="item.icon" />
                  </n-icon>
                  <span class="nav-label">{{ item.label }}</span>
                </div>
              </div>
            </nav>

            <!-- 第二排导航栏 -->
            <nav class="bottom-nav bottom-nav-secondary">
              <div class="bottom-nav-inner">
                <div
                  v-for="item in secondaryMenuItems"
                  :key="item.key"
                  class="nav-item"
                  :class="{ active: getCurrentMenuKey() === item.key }"
                  @click="handleMenuClick(item.key)"
                >
                  <n-icon class="nav-icon">
                    <component :is="item.icon" />
                  </n-icon>
                  <span class="nav-label">{{ item.label }}</span>
                </div>
                <!-- 底部存档按钮：保存至当前所在存档槽 -->
                <SaveButton />
              </div>
            </nav>
            </div>
          </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
  import { useRouter, useRoute } from 'vue-router'
  import { usePlayerStore } from './stores/player'
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { NIcon, darkTheme } from 'naive-ui'
  import {
    BookOutlined,
    ExperimentOutlined,
    CompassOutlined,
    FileTextOutlined,
    SettingOutlined,
    MedicineBoxOutlined,
    GiftOutlined,
    HomeOutlined,
    SmileOutlined,
    ArrowUpOutlined,
    DollarOutlined,
    StarOutlined
  } from '@ant-design/icons-vue'
  import { getRealmName } from './plugins/realm'
import { useIdleSystem } from './composables/useIdleSystem'
import { initCharacterDefs } from './plugins/characters'
import SaveButton from './components/SaveButton.vue'

  const router = useRouter()
  const route = useRoute()
  const playerStore = usePlayerStore()
  const idleSystem = useIdleSystem()
  const spiritWorker = ref(null)
  const menuItems = ref([])
  const isNewPlayer = ref(false)
  const isLoading = ref(true)
  const loadingProgress = ref(0)
  const loadingText = ref('正在初始化...')
  const isFirstLoad = ref(false)
  const animatedSpirit = ref(0)
  const animatedStones = ref(0)
  const animatedCultivation = ref(0)
  const animatedCrystals = ref(0)
  const spiritRaf = ref(null)
  const stonesRaf = ref(null)
  const cultivationRaf = ref(null)
  const crystalsRaf = ref(null)

  const isStartScreen = computed(() => route.path === '/')

  const updateLoading = (text, progress) => {
    loadingText.value = text
    if (progress !== undefined) loadingProgress.value = progress
  }

  async function loadGame() {
    isFirstLoad.value = !localStorage.getItem('hasLoadedBefore')

    // 默认暗色模式：未设置时强制应用
    if (localStorage.getItem('darkMode') === null) {
      localStorage.setItem('darkMode', 'true')
      playerStore.isDarkMode = true
    }
    document.documentElement.classList.toggle('dark', playerStore.isDarkMode)

    updateLoading('正在初始化游戏引擎...', 5)
    await new Promise(r => setTimeout(r, 100))

    updateLoading('正在加载存档数据...', 20)
    await playerStore.initializePlayer()

    updateLoading('正在加载角色定义...', 40)
    await initCharacterDefs()

    updateLoading('正在加载立绘资源...', 60)
    await new Promise(r => setTimeout(r, 200))

    updateLoading('正在初始化挂机系统...', 80)
    idleSystem.initIdle()

    updateLoading('正在进入游戏...', 95)
    await new Promise(r => setTimeout(r, 100))

    isLoading.value = false
    localStorage.setItem('hasLoadedBefore', 'true')

    isNewPlayer.value = playerStore.isNewPlayer
    animatedSpirit.value = playerStore.spirit.toFixed(2)
    animatedStones.value = playerStore.spiritStones
    animatedCultivation.value = playerStore.cultivationPool || 0
    animatedCrystals.value = playerStore.phantomCrystals
    getMenuItems()
  }

  loadGame()

  watch(
    () => playerStore.isNewPlayer,
    bool => {
      isNewPlayer.value = bool
      getMenuItems()
    }
  )

  watch(() => playerStore.spirit, val => {
    animateValue(animatedSpirit, val.toFixed(2), 500, spiritRaf)
  })

  watch(() => playerStore.spiritStones, val => {
    animateValue(animatedStones, val, 500, stonesRaf)
  })

  watch(() => playerStore.cultivationPool, val => {
    animateValue(animatedCultivation, val || 0, 300, cultivationRaf)
  })

  watch(() => playerStore.phantomCrystals, val => {
    animateValue(animatedCrystals, val, 500, crystalsRaf)
  })

  watch(() => playerStore.isGMMode, () => {
    getMenuItems()
  })

  const visibleMenuItems = computed(() => {
    const items = menuItems.value.filter(item => {
      if (item.key === '') return isNewPlayer.value
      if (item.key === 'gm') return playerStore.isGMMode
      return true
    })
    return items.slice(0, Math.ceil(items.length / 2))
  })

  const secondaryMenuItems = computed(() => {
    const items = menuItems.value.filter(item => {
      if (item.key === '') return isNewPlayer.value
      if (item.key === 'gm') return playerStore.isGMMode
      return true
    })
    return items.slice(Math.ceil(items.length / 2))
  })

  const allMenuItems = computed(() => {
    return menuItems.value.filter(item => {
      if (item.key === '') return isNewPlayer.value
      if (item.key === 'gm') return playerStore.isGMMode
      return true
    })
  })

  const realmColors = [
    '#32CD32', '#32CD32', '#32CD32', '#32CD32', '#32CD32', '#32CD32', '#32CD32', '#32CD32', '#32CD32',
    '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF',
    '#9932CC', '#9932CC', '#9932CC', '#9932CC', '#9932CC', '#9932CC', '#9932CC', '#9932CC', '#9932CC',
    '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700',
    '#FF6347', '#FF6347', '#FF6347', '#FF6347', '#FF6347', '#FF6347', '#FF6347', '#FF6347', '#FF6347',
    '#00CED1', '#00CED1', '#00CED1', '#00CED1', '#00CED1', '#00CED1', '#00CED1', '#00CED1', '#00CED1',
    '#FF1493', '#FF1493', '#FF1493', '#FF1493', '#FF1493', '#FF1493', '#FF1493', '#FF1493', '#FF1493',
    '#7FFF00', '#7FFF00', '#7FFF00', '#7FFF00', '#7FFF00', '#7FFF00', '#7FFF00', '#7FFF00', '#7FFF00',
    '#FF4500', '#FF4500', '#FF4500', '#FF4500', '#FF4500', '#FF4500', '#FF4500', '#FF4500', '#FF4500',
    '#C71585', '#C71585', '#C71585', '#C71585', '#C71585', '#C71585', '#C71585', '#C71585', '#C71585',
    '#20B2AA', '#20B2AA', '#20B2AA', '#20B2AA', '#20B2AA', '#20B2AA', '#20B2AA', '#20B2AA', '#20B2AA',
    '#DAA520', '#DAA520', '#DAA520', '#DAA520', '#DAA520', '#DAA520', '#DAA520', '#DAA520', '#DAA520',
    '#FFD700'
  ]
  const getRealmColor = level => {
    return realmColors[Math.min(level - 1, realmColors.length - 1)] || '#F5DEB3'
  }

  const getMenuItems = () => {
    menuItems.value = [
      ...(isNewPlayer.value ? [{ label: '欢迎', key: '', icon: HomeOutlined }] : []),
      { label: '宗门', key: 'cultivation', icon: BookOutlined },
      { label: '探索', key: 'exploration', icon: CompassOutlined },
      { label: '丹药/丹方', key: 'alchemy', icon: MedicineBoxOutlined },
      { label: '背包', key: 'inventory', icon: ExperimentOutlined },
      { label: '仙缘祈福', key: 'gacha', icon: GiftOutlined },
      { label: '攻略', key: 'guide', icon: FileTextOutlined },
      { label: '设置', key: 'settings', icon: SettingOutlined },
      ...(playerStore.isGMMode ? [{ label: 'GM', key: 'gm', icon: SmileOutlined }] : [])
    ]
  }

  const startAutoGain = () => {
    if (isStartScreen.value) return
    if (spiritWorker.value) return
    spiritWorker.value = new Worker(new URL('./workers/spirit.js', import.meta.url))
    spiritWorker.value.onmessage = e => {
      if (e.data.type === 'gain') {
        playerStore.totalCultivationTime += 1
        playerStore.gainSpirit(baseGainRate)
      }
    }
    spiritWorker.value.postMessage({ type: 'start' })
  }

  const flushSave = () => {
    if (playerStore.pendingSave || playerStore.saveTimer) {
      playerStore.saveData()
    }
  }

  // 玩家按 ESC 关闭当前最表层弹窗
  const handleEscKey = (e) => {
    if (e.key !== 'Escape') return
    e.preventDefault()
    e.stopPropagation()
    // 1) 找到页面上所有可见的弹窗/遮罩/对话框
    const candidates = document.querySelectorAll(
      '.n-modal, .n-modal-container, .n-dialog, .modal-overlay, .equip-select-modal, .character-detail-modal, .pet-detail-modal, .simple-modal, [class*="detail-modal"], .n-drawer, .n-popselect, .n-base-selection, [class*="-modal"], [class*="overlay"]'
    )
    const visibleList = []
    candidates.forEach(el => {
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) return
      visibleList.push({ el, z: parseInt(style.zIndex) || 0, rect })
    })
    if (visibleList.length === 0) return
    // 2) 取 z-index 最大的最表层弹窗
    visibleList.sort((a, b) => b.z - a.z)
    const top = visibleList[0].el
    // 3) 优先点击内部 close 按钮，否则派发 close 事件
    const closeBtn = top.querySelector(
      '.n-modal__close, .n-dialog__close, .n-base-close, .close-btn, [aria-label="close"], [data-close]'
    )
    if (closeBtn) {
      closeBtn.click()
    } else {
      // 对自定义 modal，直接点击 .modal-overlay 自身即可让外层 click.self 触发关闭
      const overlay = top.matches('.modal-overlay, .equip-select-modal, .character-detail-modal, .pet-detail-modal, .simple-modal, [class*="detail-modal"]') ? top : top.querySelector('.modal-overlay, .equip-select-modal, .character-detail-modal, .pet-detail-modal, .simple-modal, [class*="detail-modal"]')
      if (overlay) {
        overlay.click()
      } else {
        top.dispatchEvent(new Event('close', { bubbles: true }))
      }
    }
  }

  onMounted(() => {
    startAutoGain()
    window.addEventListener('beforeunload', flushSave)
    window.addEventListener('keydown', handleEscKey)
    // 启动时从 IndexedDB 载入人物定义（含已上传立绘），保证 Gacha/阵容/战斗等界面无需先打开 GM 工具即可显示立绘
    initCharacterDefs().catch(err => console.error('载入人物立绘定义失败:', err))
  })

  onUnmounted(() => {
    flushSave()
    if (spiritWorker.value) {
      spiritWorker.value.terminate()
      spiritWorker.value = null
    }
    if (spiritRaf.value) cancelAnimationFrame(spiritRaf.value)
    if (stonesRaf.value) cancelAnimationFrame(stonesRaf.value)
    if (cultivationRaf.value) cancelAnimationFrame(cultivationRaf.value)
    window.removeEventListener('beforeunload', flushSave)
    window.removeEventListener('keydown', handleEscKey)
  })

  const getCurrentMenuKey = () => {
    return route.path.slice(1)
  }

  const handleMenuClick = key => {
    router.push(`/${key}`)
  }

  const baseGainRate = 1

  // 灵石/幻灵结晶格式化：不足1万用数字，超过1万用x万
  const formatResource = (num) => {
    if (num == null) return '0'
    const n = Number(num) || 0
    if (n >= 10000) {
      return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
    }
    return Math.floor(n).toLocaleString()
  }

  const animateValue = (ref, target, duration, raf_ref) => {
    if (rafRef.value) {
      cancelAnimationFrame(rafRef.value)
    }
    const start = Number(ref.value)
    const diff = target - start
    const startTime = performance.now()
    const animate = currentTime => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      ref.value = Math.round((start + diff * progress) * 100) / 100
      if (progress < 1) {
        rafRef.value = requestAnimationFrame(animate)
      } else {
        rafRef.value = null
      }
    }
    rafRef.value = requestAnimationFrame(animate)
  }
</script>

<style>
  .loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #0D0D12 0%, #1A1A2E 50%, #16213E 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }
  .loading-content {
    text-align: center;
    padding: 40px;
  }
  .loading-title {
    font-size: 36px;
    font-weight: bold;
    color: #FFD700;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    margin-bottom: 16px;
    font-family: '楷体', 'KaiTi', serif;
  }
  .loading-subtitle {
    font-size: 16px;
    color: #9CA3AF;
    margin-bottom: 24px;
  }
  .loading-bar-container {
    width: 280px;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin: 0 auto 12px;
    border: 1px solid rgba(255, 215, 0, 0.3);
  }
  .loading-bar {
    height: 100%;
    background: linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
  .loading-percent {
    font-size: 14px;
    color: #FFD700;
    margin-bottom: 20px;
  }
  .loading-tip {
    font-size: 12px;
    color: #F59E0B;
    background: rgba(245, 158, 11, 0.1);
    padding: 12px 20px;
    border-radius: 8px;
    border: 1px solid rgba(245, 158, 11, 0.3);
    max-width: 300px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .game-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    background: linear-gradient(135deg, #0D0D12 0%, #1A1A2E 50%, #0D0D12 100%);
  }

  .main-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  /* 顶部状态栏 */
  .top-bar {
    flex-shrink: 0;
    height: auto;
    min-height: 56px;
    background: rgba(20, 25, 30, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(139, 69, 19, 0.3);
    display: flex;
    align-items: center;
    padding: 8px 12px;
    gap: 12px;
  }

  .player-info {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .player-name-only {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 16px;
    color: #F5DEB3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 4em;
    letter-spacing: 1px;
  }

  .resource-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .resource-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    border: 1px solid rgba(139, 69, 19, 0.2);
  }

  .resource-item.gold {
    border-color: rgba(218, 165, 32, 0.4);
    background: rgba(218, 165, 32, 0.05);
  }

  .resource-item.crystal {
    border-color: rgba(147, 112, 219, 0.4);
    background: rgba(147, 112, 219, 0.05);
  }

  .resource-item.crystal .resource-icon {
    color: #9370DB;
  }

  .resource-item.crystal .resource-value {
    color: #E6E6FA;
  }

  .resource-icon {
    font-size: 16px;
    color: #DAA520;
    flex-shrink: 0;
  }

  .resource-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
  }

  .resource-value {
    font-weight: bold;
    color: #F5DEB3;
    font-size: 14px;
    min-width: auto;
  }

  .resource-label {
    font-size: 10px;
    color: #8B8B8B;
    white-space: nowrap;
  }

  .top-actions {
    display: flex;
    flex-shrink: 0;
  }

  /* 修为进度条 */
  .cultivation-bar {
    flex-shrink: 0;
    padding: 8px 12px;
    background: rgba(10, 12, 15, 0.85);
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid rgba(139, 69, 19, 0.2);
  }

  .cultivation-info {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .cultivation-label {
    font-size: 12px;
    color: #8B8B8B;
    white-space: nowrap;
  }

  .cultivation-text {
    font-size: 12px;
    color: #DAA520;
    font-weight: bold;
    white-space: nowrap;
  }

  .cultivation-progress {
    flex: 1;
    min-width: 0;
  }

  .progress-bar {
    height: 8px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid rgba(139, 69, 19, 0.3);
  }

  .progress-fill {
    position: relative;
    height: 100%;
    background: linear-gradient(90deg, #8B4513, #DAA520, #FFD700);
    border-radius: 4px;
    transition: width 0.5s ease;
    box-shadow: 0 0 10px rgba(218, 165, 32, 0.5);
    overflow: hidden;
  }

  .progress-shimmer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .cultivation-pool-fill {
    background: linear-gradient(90deg, #9b59b6, #8e44ad, #9b59b6);
  }

  /* 主内容区 */
  .content-area {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px;
    -webkit-overflow-scrolling: touch;
  }

  /* 底部导航 */
  .bottom-nav {
    flex-shrink: 0;
    background: rgba(20, 25, 30, 0.98);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(139, 69, 19, 0.3);
  }

  .bottom-nav-secondary {
    border-top: none;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .bottom-nav-inner {
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 50px;
    padding: 0 4px;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    flex: 1;
    height: 100%;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #8B8B8B;
    border-radius: 8px;
    max-width: 80px;
  }

  .nav-item:active {
    transform: scale(0.95);
    background: rgba(139, 69, 19, 0.1);
  }

  .nav-item.active {
    color: #DAA520;
  }

  .nav-item.active .nav-icon {
    filter: drop-shadow(0 0 6px rgba(218, 165, 32, 0.6));
  }

  .nav-icon {
    font-size: 20px;
    transition: all 0.2s ease;
  }

  .nav-label {
    font-size: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .fade-enter-from {
    opacity: 0;
    transform: translateY(10px);
  }

  .fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }

  .n-config-provider {
    height: 100%;
  }

  /* 桌面端优化 */
  @media (min-width: 769px) {
    .game-container {
      max-width: 520px;
      margin: 0 auto;
      border-left: 1px solid rgba(139, 69, 19, 0.2);
      border-right: 1px solid rgba(139, 69, 19, 0.2);
      box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
    }

    .player-name-only {
      max-width: 4em;
    }

    .bottom-nav-inner {
      justify-content: center;
      gap: 8px;
    }

    .nav-item {
      max-width: 80px;
    }
  }

  /* 横屏适配 */
  @media (max-height: 480px) and (orientation: landscape) {
    .top-bar {
      min-height: 44px;
      padding: 4px 12px;
    }

    .player-name-only {
      font-size: 14px;
    }

    .resource-item {
      padding: 2px 8px;
    }

    .cultivation-bar {
      padding: 4px 12px;
    }

    .bottom-nav-inner {
      height: 40px;
    }

    .nav-icon {
      font-size: 16px;
    }

    .nav-label {
      font-size: 9px;
    }

    .content-area {
      padding: 8px;
    }
  }

  /* 桌面端左侧导航栏 - 默认隐藏 */
  .desktop-sidebar {
    display: none;
  }

  /* 桌面端布局 (≥1024px) */
  @media (min-width: 1024px) {
    body {
      background: #0D0D12;
    }

    .game-container {
      max-width: none;
      margin: 0;
      border-left: none;
      border-right: none;
      box-shadow: none;
      position: relative;
      display: flex;
      flex-direction: row;
    }

    .desktop-sidebar {
      display: flex;
      position: fixed;
      left: 0;
      top: 0;
      width: 80px;
      height: 100vh;
      background: rgba(15, 18, 25, 0.98);
      backdrop-filter: blur(20px);
      border-right: 1px solid rgba(139, 69, 19, 0.25);
      z-index: 100;
      flex-direction: column;
    }

    .desktop-sidebar-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      height: 100%;
      width: 100%;
      padding: 16px 0 12px;
      gap: 4px;
    }

    .sidebar-logo {
      font-size: 28px;
      margin-bottom: 16px;
      color: #DAA520;
      text-shadow: 0 0 10px rgba(218, 165, 32, 0.4);
    }

    .desktop-sidebar .nav-item {
      flex-direction: column;
      width: 100%;
      max-width: none;
      height: 56px;
      flex: none;
      border-radius: 0;
      gap: 2px;
      padding: 6px 0;
      transition: all 0.2s;
      border-left: 3px solid transparent;
    }

    .desktop-sidebar .nav-item.active {
      border-left-color: #DAA520;
      background: rgba(218, 165, 32, 0.08);
    }

    .desktop-sidebar .nav-item:hover {
      background: rgba(218, 165, 32, 0.05);
    }

    .desktop-sidebar .nav-icon {
      font-size: 22px;
    }

    .desktop-sidebar .nav-label {
      font-size: 10px;
    }

    .sidebar-save-btn {
      margin-top: auto;
      padding: 10px 0;
    }

    .main-column {
      margin-left: 80px;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .top-bar {
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 10px 24px;
      gap: 16px;
    }

    .player-name-only {
      font-size: 16px;
      max-width: 4em;
    }

    .resource-bar {
      gap: 20px;
    }

    .resource-item {
      padding: 4px 12px;
    }

    .cultivation-bar {
      padding: 6px 24px;
    }

    .bottom-nav {
      display: none;
    }

    .content-area {
      max-width: 800px;
      margin: 0 auto;
      width: 100%;
      padding: 20px 24px;
    }
  }

  /* 大屏幕优化 (≥1440px) */
  @media (min-width: 1440px) {
    .desktop-sidebar {
      width: 90px;
    }

    .main-column {
      margin-left: 90px;
    }

    .content-area {
      max-width: 960px;
      padding: 24px 32px;
    }

    .desktop-sidebar .nav-item {
      height: 60px;
    }

    .desktop-sidebar .nav-icon {
      font-size: 24px;
    }

    .desktop-sidebar .nav-label {
      font-size: 11px;
    }
  }

  /* 白天模式（日间模式）样式 */
  html:not(.dark) .game-container {
    background: linear-gradient(135deg, #F5EFE0 0%, #E8DCC4 50%, #F0E6D2 100%);
  }

  html:not(.dark) .top-bar {
    background: rgba(245, 239, 224, 0.95);
    border-bottom: 1px solid rgba(139, 69, 19, 0.4);
  }

  html:not(.dark) .player-name-only {
    color: #5B3A1A;
  }

  html:not(.dark) .resource-label {
    color: #6B4226;
  }

  html:not(.dark) .resource-value {
    color: #4A2C12;
  }

  html:not(.dark) .resource-item {
    background: rgba(139, 69, 19, 0.08);
    border: 1px solid rgba(139, 69, 19, 0.25);
  }

  html:not(.dark) .resource-item.gold {
    border-color: rgba(184, 134, 11, 0.5);
    background: rgba(218, 165, 32, 0.1);
  }

  html:not(.dark) .resource-item.crystal {
    border-color: rgba(106, 90, 205, 0.5);
    background: rgba(147, 112, 219, 0.1);
  }

  html:not(.dark) .resource-item.crystal .resource-value {
    color: #4B36A0;
  }

  html:not(.dark) .resource-item.gold .resource-value {
    color: #8B6914;
  }

  html:not(.dark) .resource-item .resource-icon {
    color: #B8860B;
  }

  html:not(.dark) .resource-item.crystal .resource-icon {
    color: #6A5ACD;
  }

  html:not(.dark) .cultivation-bar {
    background: rgba(240, 230, 210, 0.9);
    border-bottom: 1px solid rgba(139, 69, 19, 0.25);
  }

  html:not(.dark) .cultivation-label {
    color: #6B4226;
  }

  html:not(.dark) .cultivation-text {
    color: #8B6914;
  }

  html:not(.dark) .bottom-nav {
    background: rgba(245, 239, 224, 0.98);
    border-top: 1px solid rgba(139, 69, 19, 0.3);
  }

  html:not(.dark) .nav-item {
    color: #6B4226;
  }

  html:not(.dark) .nav-item.active {
    color: #8B6914;
  }

  html:not(.dark) .desktop-sidebar {
    background: rgba(240, 230, 210, 0.98);
    border-right: 1px solid rgba(139, 69, 19, 0.3);
  }

  html:not(.dark) .sidebar-logo {
    color: #8B6914;
  }

  html:not(.dark) .content-area {
    color: #3B240F;
  }
</style>
