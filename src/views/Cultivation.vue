<template>
  <div class="cultivation-page fade-in-up">
    <div class="cultivation-card glass-card">
      <div class="card-header">
        <div class="header-icon">
            <BookOutlined />
          </div>
        <div class="header-info">
          <h2 class="card-title gold-gradient-text">修炼</h2>
          <p class="card-subtitle">打坐修炼，积累修为，突破境界</p>
        </div>
      </div>
      <div class="card-body">
        <div class="cultivation-progress">
          <div class="progress-header">
            <span class="progress-label">当前修为</span>
            <span class="progress-value">
              <AnimatedNumber :value="playerStore.cultivation" :highlight="true" /> / 
              <AnimatedNumber :value="playerStore.maxCultivation" />
            </span>
          </div>
          <div class="progress-bar-container">
            <div 
              class="progress-bar" 
              :style="{ width: `${(playerStore.cultivation / playerStore.maxCultivation) * 100}%` }"
            >
              <div class="progress-glow"></div>
            </div>
          </div>
          <div class="progress-percentage">{{ ((playerStore.cultivation / playerStore.maxCultivation) * 100).toFixed(1) }}%</div>
        </div>
        <div class="tips-box">
            <InfoCircleOutlined />
            <span>通过打坐修炼来提升修为，积累足够的修为后可以尝试突破境界。</span>
          </div>
        <div class="action-buttons">
          <button
            class="btn btn-primary"
            :class="{ disabled: playerStore.spirit < cultivationCost }"
            @click="cultivate"
          >
            <span class="btn-icon"><ArrowUpOutlined /></span>
            <span>打坐修炼</span>
            <span class="btn-cost">消耗 {{ cultivationCost }} 灵力</span>
          </button>
          <button
            class="btn"
            :class="isAutoCultivating ? 'btn-warning' : 'btn-success'"
            @click="toggleAutoCultivation"
          >
            <span class="btn-icon">
              <PauseCircleOutlined v-if="isAutoCultivating" />
              <PlayCircleOutlined v-else />
            </span>
            <span>{{ isAutoCultivating ? '停止自动修炼' : '开始自动修炼' }}</span>
          </button>
          <button
            class="btn btn-info"
            :class="{ disabled: playerStore.spirit < calculateBreakthroughCost() }"
            @click="cultivateUntilBreakthrough"
          >
            <span class="btn-icon"><AimOutlined /></span>
            <span>一键突破</span>
          </button>
        </div>
        <div class="stats-section">
          <h3 class="section-title">修炼详情</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon">
                <ArrowUpOutlined />
              </div>
              <div class="stat-content">
                <div class="stat-label">灵力获取速率</div>
                <div class="stat-value"><AnimatedNumber :value="baseGainRate * playerStore.spiritRate" /> / 秒</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">
                <AimOutlined />
              </div>
              <div class="stat-content">
                <div class="stat-label">修炼效率</div>
                <div class="stat-value"><AnimatedNumber :value="cultivationGain" /> 修为 / 次</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">
                <StarOutlined />
              </div>
              <div class="stat-content">
                <div class="stat-label">突破所需修为</div>
                <div class="stat-value"><AnimatedNumber :value="playerStore.maxCultivation" /></div>
              </div>
            </div>
          </div>
        </div>
        <div class="log-section">
          <h3 class="section-title">修炼日志</h3>
          <log-panel ref="logRef" />
        </div>
      </div>
    </div>
    <BreakthroughEffect 
      :visible="showBreakthroughEffect"
      :realm-name="breakthroughRealm"
      :realm-color="breakthroughColor"
      @complete="showBreakthroughEffect = false"
    />
  </div>
</template>

<script setup>
  import { usePlayerStore } from '../stores/player'
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import {
    BookOutlined,
    InfoCircleOutlined,
    ArrowUpOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    AimOutlined,
    StarOutlined
  } from '@ant-design/icons-vue'
  import { getRealmName, getRealmColor } from '../plugins/realm'
  import LogPanel from '../components/LogPanel.vue'
  import AnimatedNumber from '../components/AnimatedNumber.vue'
  import BreakthroughEffect from '../components/BreakthroughEffect.vue'

  const playerStore = usePlayerStore()
  const logRef = ref(null)
  const showBreakthroughEffect = ref(false)
  const breakthroughRealm = ref('')
  const breakthroughColor = ref('#DAA520')

  const baseGainRate = 1
  const baseCultivationCost = 10
  const baseCultivationGain = 1
  const autoGainInterval = 1000
  const extraCultivationChance = 0.3

  const getCurrentCultivationCost = () => {
    return Math.floor(baseCultivationCost * Math.pow(1.5, playerStore.level - 1))
  }

  const getCurrentCultivationGain = () => {
    return Math.floor(baseCultivationGain * Math.pow(1.2, playerStore.level - 1))
  }

  const cultivationCost = computed(() => getCurrentCultivationCost())
  const cultivationGain = computed(() => getCurrentCultivationGain())

  const calculateBreakthroughCost = () => {
    const remainingCultivation = Math.max(0, playerStore.maxCultivation - playerStore.cultivation)
    const gain = cultivationGain.value || 1
    if (gain <= 0) return 0
    const cultivationTimes = Math.ceil(remainingCultivation / gain)
    return Math.max(0, cultivationTimes * getCurrentCultivationCost())
  }

  const isAutoCultivating = ref(false)
  const cultivationTimer = ref(null)

  const showMessage = (type, content) => {
    return logRef.value?.addLog(type, content)
  }

  const calculateCultivationGain = () => {
    let gain = cultivationGain.value
    if (Math.random() < extraCultivationChance * playerStore.luck) {
      gain *= 2
      showMessage('success', '福缘不错，获得双倍修为！')
    }
    return gain
  }

  const canBreakthrough = () => {
    return playerStore.cultivation >= playerStore.maxCultivation
  }

  const cultivationWorker = ref(null)

  const initCultivationWorker = () => {
    cultivationWorker.value = new Worker(new URL('../workers/cultivation.js', import.meta.url), { type: 'module' })
    cultivationWorker.value.onmessage = ({ data }) => {
      if (data.type === 'error') {
        showMessage('error', data.message)
        return
      }
      if (data.type === 'success') {
        const { spiritCost, cultivationGain: gain, doubleGainTimes } = data.result
        playerStore.spirit -= spiritCost
        playerStore.cultivate(gain)
        if (doubleGainTimes > 0) {
          showMessage('success', `福缘不错，获得${doubleGainTimes}次双倍修为！`)
        }
        if (canBreakthrough() && playerStore.tryBreakthrough()) {
          showMessage('success', `突破成功！恭喜进入${playerStore.realm}！`)
        } else if (canBreakthrough()) {
          showMessage('info', '已达到突破条件，但突破失败，请继续努力！')
        } else {
          showMessage('success', '修炼成功！')
        }
      }
    }
  }

  const cultivateUntilBreakthrough = () => {
    try {
      if (!canBreakthrough()) {
        cultivationWorker.value?.postMessage({
          type: 'cultivateUntilBreakthrough',
          playerData: {
            level: playerStore.level,
            spirit: playerStore.spirit,
            cultivation: playerStore.cultivation,
            maxCultivation: playerStore.maxCultivation,
            luck: playerStore.luck
          }
        })
      } else {
        if (playerStore.tryBreakthrough()) {
          showMessage('success', `突破成功！恭喜进入${playerStore.realm}！`)
        } else {
          showMessage('info', '已达到突破条件，但突破失败，请继续努力！')
        }
      }
    } catch (error) {
      console.error('一键修炼出错：', error)
      showMessage('error', '修炼失败！')
    }
  }

  const cultivate = () => {
    try {
      const currentCost = getCurrentCultivationCost()
      if (playerStore.spirit >= currentCost) {
        const oldLevel = playerStore.level
        playerStore.spirit -= currentCost
        playerStore.cultivate(calculateCultivationGain())
        if (playerStore.level !== oldLevel) {
          showMessage('success', `突破成功！恭喜进入${playerStore.realm}！`)
          breakthroughRealm.value = getRealmName(playerStore.level)?.name || playerStore.realm
          breakthroughColor.value = getRealmColor(playerStore.level)
          showBreakthroughEffect.value = true
        } else {
          showMessage('success', '修炼成功！')
        }
      } else {
        showMessage('error', '灵力不足！')
      }
    } catch (error) {
      console.error('修炼出错：', error)
      showMessage('error', '修炼失败！')
    }
  }

  const toggleAutoCultivation = () => {
    try {
      if (isAutoCultivating.value) {
        isAutoCultivating.value = false
        if (cultivationTimer.value) {
          clearInterval(cultivationTimer.value)
          cultivationTimer.value = null
        }
      } else {
        if (cultivationTimer.value) return
        isAutoCultivating.value = true
        cultivationTimer.value = setInterval(() => {
          const currentCost = getCurrentCultivationCost()
          if (playerStore.spirit >= currentCost) {
            playerStore.spirit -= currentCost
            playerStore.cultivate(cultivationGain.value)
          }
        }, autoGainInterval)
      }
    } catch (error) {
      console.error('切换自动修炼出错：', error)
      logRef.value?.addLog('error', '切换失败！')
      isAutoCultivating.value = false
      if (cultivationTimer.value) {
        clearInterval(cultivationTimer.value)
        cultivationTimer.value = null
      }
    }
  }

  onMounted(() => {
    initCultivationWorker()
  })

  onUnmounted(() => {
    try {
      if (cultivationTimer.value) {
        clearInterval(cultivationTimer.value)
        cultivationTimer.value = null
      }
      isAutoCultivating.value = false
      if (cultivationWorker.value) {
        cultivationWorker.value.terminate()
        cultivationWorker.value = null
      }
    } catch (error) {
      console.error('清理修炼资源出错：', error)
    }
  })
</script>

<style scoped>
  .cultivation-page {
    max-width: 100%;
  }

  .cultivation-card {
    padding: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(139, 69, 19, 0.3);
  }

  .header-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(139, 69, 19, 0.3), rgba(218, 165, 32, 0.2));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #DAA520;
  }

  .card-title {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 24px;
    margin: 0;
  }

  .card-subtitle {
    font-size: 13px;
    color: #8B8B8B;
    margin: 4px 0 0;
  }

  .tips-box {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(139, 69, 19, 0.1);
    border-radius: 8px;
    border-left: 3px solid #DAA520;
    margin-bottom: 16px;
    font-size: 13px;
    color: #CDCDCD;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 20px;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Noto Serif SC', serif;
    min-height: 48px;
  }

  .btn:disabled,
  .btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  .btn-primary {
    background: linear-gradient(135deg, #8B4513, #A0522D);
    color: #F5DEB3;
    box-shadow: 0 4px 15px rgba(139, 69, 19, 0.4);
  }

  .btn-primary:hover:not(:disabled):not(.disabled) {
    background: linear-gradient(135deg, #A0522D, #8B4513);
    box-shadow: 0 6px 20px rgba(139, 69, 19, 0.6);
    transform: translateY(-2px);
  }

  .btn-success {
    background: linear-gradient(135deg, #228B22, #2E8B57);
    color: white;
    box-shadow: 0 4px 15px rgba(34, 139, 34, 0.3);
  }

  .btn-success:hover:not(:disabled):not(.disabled) {
    background: linear-gradient(135deg, #2E8B57, #228B22);
    box-shadow: 0 6px 20px rgba(34, 139, 34, 0.5);
    transform: translateY(-2px);
  }

  .btn-warning {
    background: linear-gradient(135deg, #DAA520, #FFD700);
    color: #0D0D12;
    box-shadow: 0 4px 15px rgba(218, 165, 32, 0.3);
  }

  .btn-warning:hover:not(:disabled):not(.disabled) {
    background: linear-gradient(135deg, #FFD700, #DAA520);
    box-shadow: 0 6px 20px rgba(218, 165, 32, 0.5);
    transform: translateY(-2px);
  }

  .btn-info {
    background: linear-gradient(135deg, #1E90FF, #4169E1);
    color: white;
    box-shadow: 0 4px 15px rgba(30, 144, 255, 0.3);
  }

  .btn-info:hover:not(:disabled):not(.disabled) {
    background: linear-gradient(135deg, #4169E1, #1E90FF);
    box-shadow: 0 6px 20px rgba(30, 144, 255, 0.5);
    transform: translateY(-2px);
  }

  .btn-icon {
    font-size: 18px;
  }

  .btn-cost {
    font-size: 12px;
    opacity: 0.8;
    margin-left: auto;
  }

  .stats-section {
    margin-bottom: 16px;
  }

  .section-title {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 20px;
    color: #F5DEB3;
    margin: 0 0 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(139, 69, 19, 0.3);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    border: 1px solid rgba(139, 69, 19, 0.2);
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(218, 165, 32, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #DAA520;
  }

  .stat-label {
    font-size: 12px;
    color: #8B8B8B;
  }

  .stat-value {
    font-size: 16px;
    font-weight: bold;
    color: #F5DEB3;
  }

  .log-section {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    border: 1px solid rgba(139, 69, 19, 0.2);
    overflow: hidden;
  }

  .log-section .section-title {
    padding: 12px 16px;
    margin: 0;
    border-bottom: 1px solid rgba(139, 69, 19, 0.3);
  }
</style>