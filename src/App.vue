<template>
  <n-config-provider :theme="playerStore.isDarkMode ? darkTheme : null" :theme-overrides="playerStore.isDarkMode ? null : lightThemeOverrides">
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
                  :class="{ active: currentMenuKey === item.key }"
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
                <div class="player-name-only" @click="onSectNameClick" title="">{{ playerStore.name }}</div>
              </div>
              <div class="resource-bar">
                <div class="resource-item crystal">
                  <n-icon class="resource-icon"><StarOutlined /></n-icon>
                  <div class="resource-content">
                    <span class="resource-label">幻灵结晶</span>
                    <span class="resource-value">{{ formatNumber(animatedCrystals) }}</span>
                  </div>
                </div>
                <div class="resource-item gold">
                  <n-icon class="resource-icon"><DollarOutlined /></n-icon>
                  <div class="resource-content">
                    <span class="resource-label">灵石</span>
                    <span class="resource-value">{{ formatNumber(animatedStones) }}</span>
                  </div>
                </div>
              </div>
              <!-- GM 礼包铃铛：有待领取礼包时显示红点，点击前往设置领取 -->
              <div
                v-if="playerStore.giftCount > 0"
                class="top-actions"
                @click="goGifts"
                title="你有未领取的 GM 礼包"
              >
                <div class="gift-bell-wrap">
                  <n-icon class="gift-bell"><GiftOutlined /></n-icon>
                  <span class="gift-badge">{{ playerStore.giftCount > 99 ? '99+' : playerStore.giftCount }}</span>
                </div>
                <span class="gift-hint">礼包待领</span>
              </div>
            </header>

            <!-- 修为池 -->
            <div class="cultivation-bar">
              <div class="cultivation-info">
                <span class="cultivation-label">
                  修为池
                  <!-- 调试按钮：连击洞府名 5 次后出现在动作名旁，再连击 5 次消失 -->
                  <span
                    v-if="showDebugBtn"
                    class="debug-btn"
                    @click="showDebugPanel = true"
                    title="查看近期程序日志"
                  >🐛 调试</span>
                </span>
                <span class="cultivation-text">{{ formatNumber(animatedCultivation) }}</span>
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
                  :class="{ active: currentMenuKey === item.key }"
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
                  :class="{ active: currentMenuKey === item.key }"
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

            <!-- 击杀BOSS立绘演出：全局挂载，任意页面挂机/挑战击杀BOSS都能弹出 -->
            <BossKillCinematic />
            <!-- 人物 BOSS 入场演出：立绘从上而下在屏幕中间展示后从下方滑出 -->
            <CharacterBossIntro />
            <!-- 突破境界演出：全局挂载，监听 breakthroughCount 变化自动触发 -->
            <BreakthroughEffect
              :visible="breakthroughVisible"
              :realm-name="breakthroughRealmName"
              :realm-color="breakthroughRealmColor"
              @complete="breakthroughVisible = false"
            />

            <!-- 调试日志面板：连击洞府名 5 次显示按钮，点按钮打开此面板 -->
            <teleport to="body">
              <div v-if="showDebugPanel" class="debug-panel-overlay" @click.self="onDebugPanelClose">
                <div class="debug-panel">
                  <div class="debug-panel-header">
                    <span class="debug-panel-title">近期程序日志（最近 {{ debugLogs.length }} 条）</span>
                    <div class="debug-panel-actions">
                      <button class="debug-btn-copy" @click="copyDebugLogs">
                        {{ logCopied ? '已复制 ✓' : '一键复制' }}
                      </button>
                      <button class="debug-btn-clear" @click="onDebugClearLogs" title="清空日志">清空</button>
                      <button class="debug-btn-close" @click="onDebugPanelClose" title="关闭">✕</button>
                    </div>
                  </div>
                  <div class="debug-panel-body">
                    <div v-if="debugLogs.length === 0" class="debug-empty">暂无日志</div>
                    <div v-else class="debug-log-list">
                      <div
                        v-for="(log, i) in debugLogs"
                        :key="i"
                        class="debug-log-line"
                        :class="'log-' + log.level"
                      >[{{ log.ts }}] [{{ log.level.toUpperCase() }}] {{ log.text }}</div>
                    </div>
                  </div>
                  <div class="debug-panel-footer">
                    <span class="debug-hint">提示：复制后粘贴给开发者分析 bug，仅含最近 {{ debugLogs.length }} 条日志</span>
                  </div>
                </div>
              </div>
            </teleport>
          </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
  import { useRouter, useRoute } from 'vue-router'
  import { usePlayerStore } from './stores/player'
  import { useAuthStore } from './stores/auth'
  import { ref, computed, onMounted, onUnmounted, watch, nextTick, defineAsyncComponent } from 'vue'
  import { NIcon, darkTheme, createDiscreteApi } from 'naive-ui'
  // 全局 message 实例：通过 createDiscreteApi 创建，挂到 window.$message，
  // 让非 setup 上下文（如 stores/player.js 的 consumePill、组件内非 setup 函数）也能调用。
  // 修复"一键全选/丹药服用后无任何反馈"的根因：原仅用 <n-message-provider> 包裹，
  // 但从未把 message 实例挂到 window，导致 window.$message?.xxx 永远是 undefined 静默跳过。
  if (!window.$message) {
    try {
      const { message } = createDiscreteApi(['message'])
      window.$message = message
    } catch (e) {
      console.warn('[message] createDiscreteApi 初始化失败，window.$message 不可用', e)
    }
  }
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
    StarOutlined,
    FireOutlined,
    ShoppingOutlined
  } from '@ant-design/icons-vue'
  import { formatNumber } from './utils/formatNumber.js'
  import { getRealmName } from './plugins/realm'
import { useDebugLog, exportLogs, clearLogs } from './composables/useDebugLog'
import { initCharacterDefs } from './plugins/characters'
import { loadSharedPetPortraits, loadPetSkinsManifest } from './plugins/pets'
import SaveButton from './components/SaveButton.vue'
// 演出组件改为异步组件：它们依赖 useIdleSystem（约 280KB 单体模块），
// 异步化后整块从首屏主 chunk 拆出，仅在 BOSS 击杀/突破等演出发生时按需加载
const BossKillCinematic = defineAsyncComponent(() => import('./components/BossKillCinematic.vue'))
const CharacterBossIntro = defineAsyncComponent(() => import('./components/CharacterBossIntro.vue'))
const BreakthroughEffect = defineAsyncComponent(() => import('./components/BreakthroughEffect.vue'))

  // 日间模式 Naive UI 主题覆盖（青绿主色、深墨文字、米白背景）
  const lightThemeOverrides = {
    common: {
      primaryColor: '#7A9E7E',
      primaryColorHover: '#8FB88C',
      primaryColorPressed: '#5E8A63',
      primaryColorSuppl: '#7A9E7E',
      textColorBase: '#2E2A24',
      textColor1: '#2E2A24',
      textColor2: '#5E564A',
      textColor3: '#8B8376',
      bodyColor: '#F8F5EF',
      cardColor: '#F8F5EF',
      modalColor: '#F8F5EF',
      borderColor: 'rgba(122, 158, 126, 0.35)',
      dividerColor: 'rgba(122, 158, 126, 0.25)'
    },
    Button: {
      textColor: '#2E2A24',
      textColorPrimary: '#FFFFFF',
      colorPrimary: '#7A9E7E',
      colorPrimaryHover: '#8FB88C',
      colorPrimaryPressed: '#5E8A63',
      borderColorPrimary: '#7A9E7E'
    }
  }

  const router = useRouter()
  const route = useRoute()
  const playerStore = usePlayerStore()
  const spiritWorker = ref(null)
  const menuItems = ref([])
  const isNewPlayer = ref(false)
  const isLoading = ref(true)
  const loadingProgress = ref(0)
  const loadingText = ref('正在初始化...')
  const isFirstLoad = ref(false)

  // ===== 调试按钮：连击洞府名 5 次显示，再连击 5 次隐藏 =====
  // 用于现场抓日志分析 bug，避免用户开 devtools
  const DEBUG_CLICK_THRESHOLD = 5
  const DEBUG_CLICK_RESET_MS = 1500  // 1.5s 内未连续点击则重置计数
  const showDebugBtn = ref(false)
  let sectNameClicks = 0
  let sectNameClickTimer = null
  const { logs: debugLogs } = useDebugLog()
  const showDebugPanel = ref(false)
  const logCopied = ref(false)
  let logCopyTimer = null

  function onSectNameClick() {
    sectNameClicks++
    if (sectNameClickTimer) clearTimeout(sectNameClickTimer)
    sectNameClickTimer = setTimeout(() => {
      sectNameClicks = 0
      sectNameClickTimer = null
    }, DEBUG_CLICK_RESET_MS)
    if (sectNameClicks >= DEBUG_CLICK_THRESHOLD) {
      // 达到阈值：切换显示状态，并重置计数
      showDebugBtn.value = !showDebugBtn.value
      sectNameClicks = 0
      if (sectNameClickTimer) { clearTimeout(sectNameClickTimer); sectNameClickTimer = null }
      // 隐藏按钮时同步关闭面板
      if (!showDebugBtn.value) showDebugPanel.value = false
    }
  }

  function copyDebugLogs() {
    const text = exportLogs()
    // 一键复制：优先 navigator.clipboard，回退 textarea 兜底
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        logCopied.value = true
        if (logCopyTimer) clearTimeout(logCopyTimer)
        logCopyTimer = setTimeout(() => { logCopied.value = false }, 2000)
      }).catch(() => fallbackCopy(text))
    } else {
      fallbackCopy(text)
    }
  }
  function fallbackCopy(text) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      logCopied.value = true
      if (logCopyTimer) clearTimeout(logCopyTimer)
      logCopyTimer = setTimeout(() => { logCopied.value = false }, 2000)
    } catch (e) {
      console.warn('复制日志失败:', e)
    }
  }
  function onDebugPanelClose() {
    showDebugPanel.value = false
  }
  function onDebugClearLogs() {
    clearLogs()
  }
  const animatedSpirit = ref(0)
  const animatedStones = ref(0)
  const animatedCultivation = ref(0)
  const animatedCrystals = ref(0)
  const spiritRaf = ref(null)
  const stonesRaf = ref(null)
  const cultivationRaf = ref(null)
  const crystalsRaf = ref(null)

  // ===== 突破境界演出状态 =====
  // 监听 playerStore.breakthroughCount 变化自动触发，配合 realmColors 取对应境界色
  const breakthroughVisible = ref(false)
  const breakthroughRealmName = ref('')
  const breakthroughRealmColor = ref('#DAA520')
  let lastBreakthroughCount = -1 // 初始 -1，避免首次加载存档时误触发

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
    await nextTick()

    updateLoading('正在加载存档数据...', 20)
    await nextTick()
    try {
      await playerStore.initializePlayer()
    } catch (e) {
      console.error('初始化存档失败，尝试继续:', e)
    }

    // 已登录且非开发者模式：启动仅上传本地存档到云端备份，绝不下载覆盖本地。
    // ⚠️ 彻底修复回档 bug：原实现启动时后台 migrate({interactive:false}) 会下载云端存档，
    //   当 cloudTime >= localTime 时用云端旧数据覆盖 IndexedDB 并 $reset() 内存状态，
    //   导致用户最新进度被旧云端数据覆盖（"回档"）。即使用 AbortSignal 也无法阻止
    //   中途已执行的 setData 污染 IndexedDB。
    //   现改为：启动只做 syncToCloud()（纯上传，不下载、不 $reset），本地 IndexedDB
    //   始终是唯一可信源。云端下载仅在用户显式进入设置页交互式同步时触发。
    const authStore = useAuthStore()
    if (authStore.isLoggedIn && !authStore.devMode) {
      // 仅上传本地到云端备份，绝不覆盖本地
      playerStore
        .syncToCloud()
        .catch(e => console.warn('启动云备份失败（不影响本地游玩）:', e?.message || e))
      // 启动即拉取 GM 礼包收件箱，驱动顶部铃铛红点（完全后台，不等待）
      playerStore.loadGifts().catch(e => console.warn('拉取礼包失败（不影响游玩）:', e))
    } else if (authStore.devMode) {
      console.info('[开发者模式] 跳过云同步，仅使用本地存档')
    }

    updateLoading('正在加载角色定义...', 40)
    await nextTick()
    await initCharacterDefs()

    // 立绘资源已改为完全后台加载（loadSharedPortraits 内部 fetch 不阻塞）
    updateLoading('正在加载立绘资源...', 60)
    await nextTick()
    // 灵宠立绘与皮肤清单后台异步加载（不阻塞游戏启动；图片资源未到位时静默降级）
    try { loadSharedPetPortraits() } catch (e) { /* 静默降级 */ }
    try { loadPetSkinsManifest() } catch (e) { /* 静默降级 */ }

    updateLoading('正在初始化挂机系统...', 80)
    await nextTick()
    // initIdle 内部已改为：先启动定时器，离线补算延后到 setTimeout(0) 异步执行，不阻塞加载
    // useIdleSystem 为 280KB 单体模块，首屏不静态引入；进入游戏时才动态加载并初始化
    const { initIdle } = await import('./composables/useIdleSystem')
    initIdle()

    updateLoading('正在进入游戏...', 95)
    await nextTick()

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

  // 突破演出：监听 breakthroughCount 变化（玩家境界突破成功 +1）
  // 首次加载存档时 lastBreakthroughCount 初始化为当前值，避免误触发
  watch(() => playerStore.breakthroughCount, (count) => {
    if (lastBreakthroughCount < 0) {
      lastBreakthroughCount = count
      return
    }
    if (count <= lastBreakthroughCount) return
    lastBreakthroughCount = count
    // 取当前境界名与对应颜色
    const realmInfo = getRealmName(playerStore.level)
    breakthroughRealmName.value = realmInfo?.name || playerStore.realm || ''
    // realmColors 数组按 level-1 取色（index 0 对应 level 1）
    breakthroughRealmColor.value = realmColors[playerStore.level - 1] || '#DAA520'
    breakthroughVisible.value = true
  })

  watch(() => playerStore.isGMMode, () => {
    getMenuItems()
  })

  // 菜单统一过滤：欢迎页仅新玩家可见、GM 页仅 GM 模式可见。
  // 三个展示 computed（all/visible/secondary）共用此结果，避免重复过滤
  const filteredMenuItems = computed(() => {
    return menuItems.value.filter(item => {
      if (item.key === '') return isNewPlayer.value
      if (item.key === 'gm') return playerStore.isGMMode
      return true
    })
  })

  const visibleMenuItems = computed(() => {
    return filteredMenuItems.value.slice(0, Math.ceil(filteredMenuItems.value.length / 2))
  })

  const secondaryMenuItems = computed(() => {
    return filteredMenuItems.value.slice(Math.ceil(filteredMenuItems.value.length / 2))
  })

  const allMenuItems = computed(() => filteredMenuItems.value)

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
      { label: '八卦炉', key: 'alchemy', icon: FireOutlined },
      { label: '背包', key: 'inventory', icon: ShoppingOutlined },
      { label: '仙缘祈福', key: 'gacha', icon: StarOutlined },
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

  // ===== 后台节流：暂停 spirit worker，避免后台/息屏持续发热 =====
  // Web Worker 的 setInterval 不受浏览器后台节流（与主线程 setTimeout 不同），
  // 即使切后台/锁屏，spirit worker 仍每秒唤起 CPU → 触发 gainSpirit → 响应式更新 + saveData。
  // 这是"未进入挂机战斗时设备仍发热"的首要原因。切后台时暂停 worker，回前台再恢复（并补算灵回复）。
  const handleVisibilityChange = () => {
    if (document.hidden) {
      if (spiritWorker.value) {
        spiritWorker.value.postMessage({ type: 'stop' })
      }
    } else {
      // 回前台：先补算息屏期间灵力回复（按已流逝时间，最多回满 maxSpirit），再恢复 worker
      try { playerStore.regenerateSpirit() } catch (e) { /* 静默 */ }
      if (!isStartScreen.value) {
        if (spiritWorker.value) {
          spiritWorker.value.postMessage({ type: 'start' })
        } else {
          startAutoGain()
        }
      }
    }
  }

  onMounted(() => {
    startAutoGain()
    window.addEventListener('beforeunload', flushSave)
    // pagehide 在移动端 Safari / bfcache 场景比 beforeunload 更可靠，作为备份保底
    window.addEventListener('pagehide', flushSave)
    window.addEventListener('keydown', handleEscKey)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    // 注：人物立绘定义已在 loadGame() 中通过 await initCharacterDefs() 加载完成
    // 此处不再重复调用，避免与加载流程竞争造成 race condition（曾导致头像立绘 5 分钟后才显示）
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
    window.removeEventListener('pagehide', flushSave)
    window.removeEventListener('keydown', handleEscKey)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  // 当前路由菜单 key（模板中通过 computed 缓存，避免每次渲染都调用函数）
  const currentMenuKey = computed(() => route.path.slice(1))

  const handleMenuClick = key => {
    router.push(`/${key}`)
  }

  // 点击顶部礼包铃铛：前往「设置」页领取
  const goGifts = () => {
    router.push('/settings')
  }

  const baseGainRate = 1

  const animateValue = (ref, target, duration, raf_ref) => {
    if (raf_ref.value) {
      cancelAnimationFrame(raf_ref.value)
    }
    const start = Number(ref.value)
    const diff = target - start
    // 差值过小时直接赋值，避免每秒高频 RAF（spirit 每秒+1 时差值仅 1，RAF 动画肉眼不可见却持续占 CPU）
    if (Math.abs(diff) < 5) {
      ref.value = target
      raf_ref.value = null
      return
    }
    const startTime = performance.now()
    const animate = currentTime => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      ref.value = Math.round((start + diff * progress) * 100) / 100
      if (progress < 1) {
        raf_ref.value = requestAnimationFrame(animate)
      } else {
        raf_ref.value = null
      }
    }
    raf_ref.value = requestAnimationFrame(animate)
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
    color: #C9C4BA;
    white-space: nowrap;
  }

  .top-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    margin-left: 6px;
    padding: 4px 10px;
    border-radius: 12px;
    cursor: pointer;
    background: rgba(218, 165, 32, 0.12);
    border: 1px solid rgba(218, 165, 32, 0.35);
    transition: all 0.2s ease;
  }

  .top-actions:hover {
    background: rgba(218, 165, 32, 0.22);
    transform: translateY(-1px);
  }

  .top-actions:active {
    transform: scale(0.96);
  }

  .gift-bell-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .gift-bell {
    font-size: 18px;
    color: #FFD700;
    filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.55));
    animation: giftPulse 1.4s ease-in-out infinite;
  }

  @keyframes giftPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.12); }
  }

  .gift-badge {
    position: absolute;
    top: -7px;
    right: -9px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 9px;
    background: linear-gradient(135deg, #FF4D4F, #FF7875);
    color: #fff;
    font-size: 10px;
    font-weight: bold;
    line-height: 16px;
    text-align: center;
    box-shadow: 0 0 8px rgba(255, 77, 79, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.6);
  }

  .gift-hint {
    font-size: 11px;
    color: #FFD700;
    white-space: nowrap;
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
    color: #C9C4BA;
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

  /* 中低端设备（fx-low / fx-medium）禁用常驻装饰动画，减少 GPU 合成层持续重绘 */
  html.fx-low .progress-shimmer,
  html.fx-medium .progress-shimmer { animation: none; }

  /* 中低端设备（fx-low / fx-medium）禁用角色星级光效（每角色 3 组 infinite 动画叠加，多角色时 GPU 负载高） */
  /* 移动端特效默认 medium，也禁用，避免常用页面（宗门选中角色头像等）持续重绘 */
  html.fx-low .char-avatar.star-4,
  html.fx-low .char-avatar.star-4::before,
  html.fx-low .char-avatar.star-4::after,
  html.fx-low .char-avatar.star-5,
  html.fx-low .char-avatar.star-5::before,
  html.fx-low .char-avatar.star-5::after,
  html.fx-medium .char-avatar.star-4,
  html.fx-medium .char-avatar.star-4::before,
  html.fx-medium .char-avatar.star-4::after,
  html.fx-medium .char-avatar.star-5,
  html.fx-medium .char-avatar.star-5::before,
  html.fx-medium .char-avatar.star-5::after { animation: none; }

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
    color: #C9C4BA;
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

  /* 白天模式（日间模式）样式 - 国风青绿山水配色 */
  html:not(.dark) .game-container {
    background-color: #F8F5EF;
    background-image: url('/assets/bg/main_bg.png');
    background-size: cover;
    background-position: center top;
    background-repeat: no-repeat;
    background-attachment: fixed;
  }

  html:not(.dark) .top-bar {
    background: rgba(248, 245, 239, 0.55);
    border-bottom: 1px solid rgba(122, 158, 126, 0.4);
  }

  html:not(.dark) .player-name-only {
    color: #2E2A24;
  }

  html:not(.dark) .resource-label {
    color: #5E564A;
  }

  html:not(.dark) .resource-value {
    color: #2E2A24;
  }

  html:not(.dark) .resource-item {
    background: rgba(122, 158, 126, 0.1);
    border: 1px solid rgba(122, 158, 126, 0.3);
  }

  html:not(.dark) .resource-item.gold {
    border-color: rgba(201, 163, 61, 0.5);
    background: rgba(201, 163, 61, 0.1);
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

  /* 日间模式：礼包铃铛 */
  html:not(.dark) .top-actions {
    background: rgba(201, 163, 61, 0.12);
    border: 1px solid rgba(201, 163, 61, 0.5);
  }

  html:not(.dark) .gift-bell {
    color: #8B6914;
    filter: drop-shadow(0 0 6px rgba(201, 163, 61, 0.5));
  }

  html:not(.dark) .gift-hint {
    color: #8B6914;
  }

  html:not(.dark) .resource-item.crystal .resource-icon {
    color: #6A5ACD;
  }

  html:not(.dark) .cultivation-bar {
    background: rgba(248, 245, 239, 0.6);
    border-bottom: 1px solid rgba(122, 158, 126, 0.3);
  }

  html:not(.dark) .cultivation-label {
    color: #5E564A;
  }

  html:not(.dark) .cultivation-text {
    color: #8B6914;
  }

  html:not(.dark) .bottom-nav {
    background: rgba(248, 245, 239, 0.55);
    border-top: 1px solid rgba(122, 158, 126, 0.3);
  }

  html:not(.dark) .nav-item {
    color: #5E564A;
  }

  html:not(.dark) .nav-item.active {
    color: #7A9E7E;
  }

  html:not(.dark) .desktop-sidebar {
    background: rgba(248, 245, 239, 0.55);
    border-right: 1px solid rgba(122, 158, 126, 0.3);
  }

  html:not(.dark) .sidebar-logo {
    color: #7A9E7E;
  }

  html:not(.dark) .content-area {
    position: relative;
    color: #2E2A24;
    isolation: isolate;
  }

  html:not(.dark) .content-area::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(248, 245, 239, 0.62);
    pointer-events: none;
    z-index: -1;
  }

  /* ================== 人物星级光效 ================== */
  /* 4星（传说）仙气特效：青蓝/水绿光晕 + 呼吸 + 轻飘光点 */
  @keyframes charStar4Glow {
    0%, 100% { box-shadow: 0 0 8px 2px rgba(120, 220, 240, 0.55), 0 0 14px 4px rgba(80, 180, 220, 0.35), inset 0 0 6px rgba(255, 255, 255, 0.3); }
    50% { box-shadow: 0 0 12px 3px rgba(160, 240, 255, 0.75), 0 0 22px 6px rgba(100, 200, 240, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.45); }
  }
  @keyframes charStar4Float {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
    50% { transform: translateY(-3px) scale(1.1); opacity: 1; }
  }
  .char-avatar.star-4 {
    position: relative;
    animation: charStar4Glow 3s ease-in-out infinite;
  }
  .char-avatar.star-4::before,
  .char-avatar.star-4::after {
    content: '';
    position: absolute;
    width: 6px;
    height: 6px;
    background: radial-gradient(circle, rgba(180, 240, 255, 0.95) 0%, rgba(120, 200, 240, 0.4) 60%, transparent 100%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 2;
  }
  .char-avatar.star-4::before {
    top: -2px;
    left: 30%;
    animation: charStar4Float 2.8s ease-in-out infinite;
  }
  .char-avatar.star-4::after {
    bottom: 2px;
    right: 20%;
    animation: charStar4Float 2.8s ease-in-out 1.4s infinite;
  }

  /* 5星（神话）神气特效：金色光晕 + 更强呼吸 + 飘动金点 */
  @keyframes charStar5Glow {
    0%, 100% { box-shadow: 0 0 10px 3px rgba(255, 200, 80, 0.7), 0 0 20px 5px rgba(255, 160, 40, 0.5), inset 0 0 8px rgba(255, 255, 200, 0.4); }
    50% { box-shadow: 0 0 16px 4px rgba(255, 220, 120, 0.9), 0 0 32px 8px rgba(255, 180, 60, 0.7), inset 0 0 14px rgba(255, 255, 220, 0.6); }
  }
  @keyframes charStar5Float {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0.85; }
    50% { transform: translateY(-4px) scale(1.2); opacity: 1; }
  }
  .char-avatar.star-5 {
    position: relative;
    animation: charStar5Glow 2.2s ease-in-out infinite;
  }
  .char-avatar.star-5::before,
  .char-avatar.star-5::after {
    content: '';
    position: absolute;
    width: 7px;
    height: 7px;
    background: radial-gradient(circle, rgba(255, 240, 180, 1) 0%, rgba(255, 200, 80, 0.5) 50%, transparent 100%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 2;
    box-shadow: 0 0 4px rgba(255, 220, 120, 0.8);
  }
  .char-avatar.star-5::before {
    top: -3px;
    right: 25%;
    animation: charStar5Float 2.2s ease-in-out infinite;
  }
  .char-avatar.star-5::after {
    bottom: -2px;
    left: 25%;
    animation: charStar5Float 2.2s ease-in-out 1.1s infinite;
  }

  /* ===== 调试按钮 + 调试面板（连击洞府名 5 次激活） ===== */
  .debug-btn {
    display: inline-block;
    margin-left: 8px;
    padding: 1px 8px;
    font-size: 11px;
    color: #FFD700;
    background: rgba(255, 215, 0, 0.12);
    border: 1px solid rgba(255, 215, 0, 0.4);
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    vertical-align: middle;
    transition: background 0.15s;
  }
  .debug-btn:hover { background: rgba(255, 215, 0, 0.25); }
  .debug-btn:active { transform: scale(0.95); }

  /* 调试面板：全屏遮罩 + 中央卡片 */
  .debug-panel-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    box-sizing: border-box;
  }
  .debug-panel {
    width: 100%;
    max-width: 720px;
    max-height: 80vh;
    background: #1e1e1e;
    color: #d4d4d4;
    border: 1px solid #444;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: 'SF Mono', Monaco, Menlo, Consolas, 'Courier New', monospace;
    font-size: 12px;
  }
  .debug-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #252526;
    border-bottom: 1px solid #3c3c3c;
    flex-shrink: 0;
  }
  .debug-panel-title {
    color: #FFD700;
    font-weight: 600;
  }
  .debug-panel-actions {
    display: flex;
    gap: 8px;
  }
  .debug-panel-actions button {
    padding: 4px 10px;
    font-size: 11px;
    border: 1px solid #555;
    background: #333;
    color: #ddd;
    border-radius: 3px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .debug-panel-actions button:hover { background: #444; }
  .debug-btn-copy { border-color: #4a8a4a !important; color: #8fbc8f !important; }
  .debug-btn-copy:hover { background: #2d4a2d !important; }
  .debug-btn-clear { border-color: #8a4a4a !important; color: #bc8f8f !important; }
  .debug-btn-close { border-color: #555 !important; }
  .debug-panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 10px 14px;
    min-height: 200px;
  }
  .debug-empty {
    color: #777;
    text-align: center;
    padding: 40px 0;
  }
  .debug-log-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .debug-log-line {
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.5;
    padding: 2px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .debug-log-line.log-log { color: #d4d4d4; }
  .debug-log-line.log-warn { color: #FFA500; background: rgba(255, 165, 0, 0.05); }
  .debug-log-line.log-error { color: #FF5252; background: rgba(255, 82, 82, 0.08); }
  .debug-panel-footer {
    padding: 8px 14px;
    background: #252526;
    border-top: 1px solid #3c3c3c;
    flex-shrink: 0;
  }
  .debug-hint {
    color: #777;
    font-size: 11px;
  }
</style>
