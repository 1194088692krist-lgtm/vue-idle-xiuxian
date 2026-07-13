<template>
  <div class="exploration-page fade-in-up">
    <div class="main-card glass-card">
      <div class="card-header">
        <div class="header-icon">
          <CompassOutlined />
        </div>
        <div class="header-info">
          <h2 class="card-title gold-gradient-text">探索秘境</h2>
          <p class="card-subtitle">探索各处秘境，寻找机缘造化</p>
        </div>
      </div>
      <div class="card-body">
        <div class="tips-box">
          <InfoCircleOutlined />
          <span>小心谨慎，危险与机遇并存。消耗灵力探索，可能触发特殊事件。</span>
        </div>
        <div class="locations-grid">
          <div class="location-card glass-card" v-for="location in availableLocations" :key="location.id">
            <div class="location-header">
              <h3 class="location-name">{{ location.name }}</h3>
              <n-tag :type="getLocationType(location.minLevel)">{{ getRealmName(location.minLevel).name }}</n-tag>
            </div>
            <p class="location-desc">{{ location.description }}</p>
            <div class="location-info">
              <div class="info-item">
                <span class="info-label">消耗灵力</span>
                <span class="info-value">{{ location.spiritCost }}</span>
              </div>
            </div>
            <div class="location-actions">
              <button
                class="btn btn-primary"
                :class="{ disabled: playerStore.spirit < location.spiritCost || isAutoExploring }"
                @click="exploreLocation(location)"
              >
                <span class="btn-icon"><SearchOutlined /></span>
                <span>探索</span>
              </button>
              <button
                class="btn"
                :class="exploringLocations[location.id] ? 'btn-warning' : 'btn-success'"
                @click="
                  exploringLocations[location.id] ? stopAutoExploration(location) : startAutoExploration(location)
                "
                :disabled="
                  playerStore.spirit < location.spiritCost ||
                  (isAutoExploring && !exploringLocations[location.id])
                "
              >
                <span class="btn-icon">
                  <PauseCircleOutlined v-if="exploringLocations[location.id]" />
                  <PlayCircleOutlined v-else />
                </span>
                <span>{{ exploringLocations[location.id] ? '停止' : '自动' }}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="stats-section">
          <h3 class="section-title">探索统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon">
                <TrophyOutlined />
              </div>
              <div class="stat-content">
                <div class="stat-label">探索次数</div>
                <div class="stat-value">{{ playerStore.explorationCount }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">
                <DollarOutlined />
              </div>
              <div class="stat-content">
                <div class="stat-label">灵石数量</div>
                <div class="stat-value">{{ formatNumber(playerStore.spiritStones) }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">
                <MedicineBoxOutlined />
              </div>
              <div class="stat-content">
                <div class="stat-label">灵草数量</div>
                <div class="stat-value">{{ playerStore.herbs.length }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">
                <FileTextOutlined />
              </div>
              <div class="stat-content">
                <div class="stat-label">丹方残页</div>
                <div class="stat-value">{{ Object.values(playerStore.pillFragments || {}).reduce((a, b) => a + b, 0) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="log-section">
      <div class="log-header">
        <h3 class="section-title gold-gradient-text">探索日志</h3>
        <button class="btn btn-small btn-danger" @click="clearLogPanel">清空日志</button>
      </div>
      <log-panel ref="logRef" />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { usePlayerStore } from '../stores/player'
  import { getRealmName } from '../plugins/realm'
  import { locations } from '../plugins/locations'
  import { triggerRandomEvent, getRandomReward, handleReward } from '../plugins/events'
  import LogPanel from '../components/LogPanel.vue'
  import {
    CompassOutlined,
    InfoCircleOutlined,
    SearchOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    TrophyOutlined,
    DollarOutlined,
    MedicineBoxOutlined,
    FileTextOutlined
  } from '@ant-design/icons-vue'

  const logRef = ref(null)
  const playerStore = usePlayerStore()

  const explorationInterval = 3000
  const exploringLocations = ref({})
  const explorationTimers = ref({})
  const isAutoExploring = ref(false)
  const autoExploringLocationId = ref(null)
  const explorationWorker = ref(null)

  const formatNumber = num => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toLocaleString()
  }

  const getLocationType = level => {
    if (level < 10) return 'info'
    if (level < 30) return 'success'
    if (level < 50) return 'warning'
    return 'error'
  }

  const initWorker = () => {
    explorationWorker.value = new Worker(new URL('../workers/exploration.js', import.meta.url), { type: 'module' })
    explorationWorker.value.onmessage = ({ data }) => {
      if (data.type === 'exploration_result') {
        handleExplorationResult(data)
      } else if (data.type === 'error') {
        showMessage('error', data.message)
      }
    }
  }

  const handleExplorationResult = result => {
    playerStore.spirit -= result.spiritCost
    playerStore.explorationCount++

    if (result.eventTriggered) {
      if (triggerRandomEvent(playerStore, showMessage)) {
        showMessage('info', '你的福缘不错，触发了一个特殊事件！')
      }
    } else {
      const location = availableLocations.value.find(loc => loc.spiritCost === result.spiritCost)
      if (location && Array.isArray(location.rewards)) {
        const reward = getRandomReward(location.rewards)
        if (reward) {
          if (result.rewardMultiplier > 1) {
            reward.amount = Math.floor(reward.amount * result.rewardMultiplier)
            showMessage('success', '福缘加持，获得了更多奖励！')
          }
          handleReward(reward, playerStore, showMessage)
        }
      } else {
        showMessage('error', '无法获取探索奖励，请检查地点配置')
      }
    }
    playerStore.queueSave()
  }

  const exploreLocation = location => {
    if (playerStore.spirit < location.spiritCost) {
      showMessage('error', '灵力不足！')
      return
    }
    explorationWorker.value.postMessage({
      type: 'explore',
      playerData: { luck: playerStore.luck },
      location
    })
  }

  const availableLocations = computed(() => {
    return locations.filter(loc => playerStore.level >= loc.minLevel)
  })

  const showMessage = (type, content) => {
    return logRef.value?.addLog(type, content)
  }

  const startAutoExploration = location => {
    if (exploringLocations.value[location.id] || isAutoExploring.value) return
    isAutoExploring.value = true
    autoExploringLocationId.value = location.id
    exploringLocations.value[location.id] = true
    explorationTimers.value[location.id] = setInterval(() => {
      if (playerStore.spirit >= location.spiritCost) {
        exploreLocation(location)
      } else {
        stopAutoExploration(location)
        showMessage('warning', '灵力不足，自动探索已停止！')
      }
    }, explorationInterval)
  }

  const stopAutoExploration = location => {
    if (explorationTimers.value[location.id]) {
      clearInterval(explorationTimers.value[location.id])
      delete explorationTimers.value[location.id]
    }
    exploringLocations.value[location.id] = false
    isAutoExploring.value = false
    autoExploringLocationId.value = null
  }

  const clearLogPanel = () => {
    logRef.value?.clearLogs()
  }

  onMounted(() => {
    initWorker()
  })

  onUnmounted(() => {
    if (explorationWorker.value) {
      explorationWorker.value.terminate()
    }
    Object.values(explorationTimers.value).forEach(timer => clearInterval(timer))
    explorationTimers.value = {}
    exploringLocations.value = {}
  })
</script>

<style scoped>
  .exploration-page {
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 100%;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(139, 69, 19, 0.2);
    margin-bottom: 16px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(139, 69, 19, 0.3), rgba(218, 165, 32, 0.2));
    border-radius: 12px;
    font-size: 24px;
    color: var(--color-accent-gold);
  }

  .card-title {
    margin: 0;
    font-size: 24px;
    font-family: var(--font-family-heading);
  }

  .card-subtitle {
    margin: 4px 0 0;
    color: #888;
    font-size: 14px;
  }

  .tips-box {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(139, 69, 19, 0.1);
    border-radius: 8px;
    margin-bottom: 12px;
    color: #aaa;
    font-size: 13px;
  }

  .locations-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  .location-card {
    padding: 16px;
    transition: all 0.3s ease;
  }

  .location-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(139, 69, 19, 0.2);
  }

  .location-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .location-name {
    margin: 0;
    font-size: 18px;
    color: var(--color-accent-gold);
    font-family: var(--font-family-heading);
  }

  .location-desc {
    margin: 0 0 12px;
    font-size: 14px;
    color: #aaa;
    line-height: 1.5;
  }

  .location-info {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-label {
    font-size: 12px;
    color: #888;
  }

  .info-value {
    font-size: 14px;
    color: #fff;
    font-weight: bold;
  }

  .location-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 16px;
    border-radius: 10px;
    font-size: 15px;
    font-family: var(--font-family-body);
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    min-height: 48px;
  }

  .btn-primary {
    background: linear-gradient(135deg, #8B4513, #DAA520);
    color: #fff;
    box-shadow: 0 4px 15px rgba(139, 69, 19, 0.4);
  }

  .btn-primary:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(218, 165, 32, 0.5);
  }

  .btn-success {
    background: linear-gradient(135deg, #2E7D32, #66BB6A);
    color: #fff;
  }

  .btn-warning {
    background: linear-gradient(135deg, #E65100, #FF8F00);
    color: #fff;
  }

  .btn-danger {
    background: rgba(220, 53, 69, 0.3);
    color: #DC3545;
    border: 1px solid rgba(220, 53, 69, 0.3);
  }

  .btn-small {
    padding: 6px 12px;
    font-size: 12px;
  }

  .btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-icon {
    font-size: 16px;
  }

  .stats-section {
    margin-top: 12px;
  }

  .section-title {
    margin: 0 0 12px;
    font-size: 18px;
    color: #fff;
    font-family: var(--font-family-heading);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(139, 69, 19, 0.3), rgba(139, 69, 19, 0.1));
    border-radius: 8px;
    color: #ccc;
    font-size: 18px;
  }

  .stat-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: #888;
  }

  .stat-value {
    font-size: 16px;
    font-weight: bold;
    color: #fff;
  }

  .log-section {
    margin-top: auto;
  }

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
</style>
