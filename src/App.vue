<template>
  <n-config-provider :theme="darkTheme">
    <n-message-provider>
      <n-dialog-provider>
        <n-spin :show="isLoading" description="正在加载游戏数据...">
          <router-view v-if="isStartScreen" />
          <div v-else class="game-container">
            <!-- 顶部状态栏 -->
            <header class="top-bar">
              <div class="player-info">
                <div class="player-avatar">
                  <span>仙</span>
                </div>
                <div class="player-meta">
                  <div class="player-name">{{ playerStore.name }}</div>
                  <div class="player-realm" :style="{ color: getRealmColor(playerStore.level) }">
                    {{ getRealmName(playerStore.level).name }}
                  </div>
                </div>
              </div>
              <div class="resource-bar">
                <div class="resource-item crystal">
                  <n-icon class="resource-icon"><StarOutlined /></n-icon>
                  <span class="resource-value">{{ animatedCrystals }}</span>
                  <span class="resource-label">幻灵结晶</span>
                </div>
                <div class="resource-item gold">
                  <n-icon class="resource-icon"><DollarOutlined /></n-icon>
                  <span class="resource-value">{{ animatedStones }}</span>
                  <span class="resource-label">灵石</span>
                </div>
              </div>
              <div class="top-actions">
                <n-button quaternary circle @click="playerStore.toggle">
                  <n-icon><Sunny v-if="playerStore.isDarkMode" /><Moon v-else /></n-icon>
                </n-button>
              </div>
            </header>

            <!-- 修为进度条 -->
            <div class="cultivation-bar">
              <div class="cultivation-info">
                <span class="cultivation-label">修为</span>
                <span class="cultivation-text">{{ animatedCultivation }} / {{ playerStore.maxCultivation }}</span>
              </div>
              <div class="cultivation-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: cultivationPercentage + '%' }">
                    <div class="progress-shimmer"></div>
                  </div>
                </div>
              </div>
              <div class="cultivation-percent">{{ cultivationPercentage.toFixed(1) }}%</div>
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
        </n-spin>
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
  import { Moon, Sunny } from '@vicons/ionicons5'
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
  const animatedSpirit = ref(0)
  const animatedStones = ref(0)
  const animatedCultivation = ref(0)
  const animatedCrystals = ref(0)
  const spiritRaf = ref(null)
  const stonesRaf = ref(null)
  const cultivationRaf = ref(null)
  const crystalsRaf = ref(null)

  const isStartScreen = computed(() => route.path === '/')

  playerStore.initializePlayer().then(() => {
    isLoading.value = false
    isNewPlayer.value = playerStore.isNewPlayer
    animatedSpirit.value = playerStore.spirit.toFixed(2)
    animatedStones.value = playerStore.spiritStones
    animatedCultivation.value = playerStore.cultivation
    animatedCrystals.value = playerStore.phantomCrystals
    getMenuItems()
    // 常驻挂机探索：玩家数据就绪后恢复并启动后台推进（离开探索页仍持续）
    idleSystem.initIdle()
  })

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

  watch(() => playerStore.cultivation, val => {
    animateValue(animatedCultivation, val, 300, cultivationRaf)
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

  const cultivationPercentage = computed(() => {
    return (playerStore.cultivation / playerStore.maxCultivation) * 100
  })

  const animateValue = (ref, target, duration, rafRef) => {
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
  .game-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    background: linear-gradient(135deg, #0D0D12 0%, #1A1A2E 50%, #0D0D12 100%);
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

  .player-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #DAA520, #FFD700);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 20px;
    color: #0D0D12;
    box-shadow: 0 0 12px rgba(218, 165, 32, 0.4);
    flex-shrink: 0;
  }

  .player-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .player-name {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 16px;
    color: #F5DEB3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px;
  }

  .player-realm {
    font-size: 11px;
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    border: 1px solid rgba(218, 165, 32, 0.3);
    white-space: nowrap;
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
    gap: 4px;
    padding: 4px 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 16px;
    border: 1px solid rgba(139, 69, 19, 0.2);
    font-size: 12px;
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
    font-size: 14px;
    color: #DAA520;
  }

  .resource-value {
    font-weight: bold;
    color: #F5DEB3;
    min-width: auto;
  }

  .resource-label {
    font-size: 11px;
    color: #8B8B8B;
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

  .cultivation-percent {
    font-size: 11px;
    color: #DAA520;
    font-weight: bold;
    flex-shrink: 0;
    min-width: 36px;
    text-align: right;
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

    .player-name {
      max-width: 160px;
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

    .player-avatar {
      width: 30px;
      height: 30px;
      font-size: 16px;
    }

    .player-name {
      font-size: 14px;
    }

    .player-realm {
      font-size: 10px;
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
</style>
