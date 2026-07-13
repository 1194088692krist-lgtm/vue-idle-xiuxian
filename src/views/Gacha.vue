<template>
  <div class="gacha-page fade-in-up">
    <div class="main-card glass-card">
      <div class="card-header">
        <div class="header-icon">
          <GiftOutlined />
        </div>
        <div class="header-info">
          <h2 class="card-title gold-gradient-text">天机阁</h2>
          <p class="card-subtitle">消耗灵石抽取珍稀装备与灵宠</p>
        </div>
      </div>
      <div class="card-body">
        <div class="tips-box">
          <InfoCircleOutlined />
          <span>不同奖池产出不同，高品质物品概率更低但属性更强。</span>
        </div>

        <!-- 奖池选择 -->
        <div class="pool-selector">
          <div
            v-for="pool in poolList"
            :key="pool.key"
            class="pool-card"
            :class="{ active: currentPool === pool.key }"
            @click="switchPool(pool.key)"
          >
            <div class="pool-name">{{ pool.name }}</div>
            <div class="pool-cost">{{ pool.cost }} 灵石/次</div>
            <div class="pool-desc">{{ pool.desc }}</div>
          </div>
        </div>

        <!-- 抽奖按钮 -->
        <div class="gacha-actions">
          <div class="spirit-stone-display">
            <span class="label">当前灵石：</span>
            <span class="value">{{ formatNumber(playerStore.spiritStones) }}</span>
          </div>
          <div class="action-buttons">
            <button
              class="btn btn-primary"
              :class="{ disabled: playerStore.spiritStones < currentPoolConfig.cost }"
              @click="doSingleGacha"
            >
              <span>单抽（{{ currentPoolConfig.cost }}灵石）</span>
            </button>
            <button
              class="btn btn-success"
              :class="{ disabled: playerStore.spiritStones < currentPoolConfig.cost * 10 }"
              @click="doTenGacha"
            >
              <span>十连（{{ currentPoolConfig.cost * 10 }}灵石）</span>
            </button>
          </div>
        </div>

        <!-- 抽奖结果 -->
        <div v-if="gachaResults.length > 0" class="gacha-results">
          <h3 class="section-title">抽奖结果</h3>
          <div class="results-grid">
            <div
              v-for="(result, index) in gachaResults"
              :key="index"
              class="result-card"
              :class="getResultClass(result)"
            >
              <div class="result-type" :style="{ color: getResultColor(result) }">
                {{ getResultTypeName(result) }}
              </div>
              <div class="result-name" :style="{ color: getResultColor(result) }">
                {{ result.item.name || getResultTypeName(result) }}
              </div>
              <div class="result-detail">
                <template v-if="result.category === 'equipment'">
                  <span>{{ equipmentTypeNames[result.item.type] || '装备' }}</span>
                  <span>{{ result.item.qualityInfo?.name || '' }}</span>
                </template>
                <template v-else-if="result.category === 'pet'">
                  <span>{{ petRarities[result.item.rarity]?.name || '' }}</span>
                </template>
                <template v-else>
                  <span>+{{ result.item.amount }}</span>
                  <span>{{ resourceNames[result.item.type] || '资源' }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 抽奖日志 -->
        <div class="log-section">
          <div class="log-header">
            <h3 class="section-title gold-gradient-text">抽奖日志</h3>
            <button class="btn btn-small btn-danger" @click="clearLogPanel">清空</button>
          </div>
          <log-panel ref="logRef" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { usePlayerStore } from '../stores/player'
  import { ref, computed } from 'vue'
  import { useMessage } from 'naive-ui'
  import { GiftOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
  import { getStatName } from '../plugins/stats'
  import {
    gachaPools,
    doGacha,
    doMultiGacha,
    equipmentTypeNames,
    petRarities,
    equipmentQualities
  } from '../plugins/gacha'
  import LogPanel from '../components/LogPanel.vue'

  const playerStore = usePlayerStore()
  const message = useMessage()
  const logRef = ref(null)

  const currentPool = ref('all')
  const gachaResults = ref([])

  const poolList = computed(() => [
    { key: 'all', name: '综合池', cost: gachaPools.all.cost, desc: '装备/灵宠/资源均有' },
    { key: 'equipment', name: '装备池', cost: gachaPools.equipment.cost, desc: '侧重装备产出' },
    { key: 'pet', name: '灵宠池', cost: gachaPools.pet.cost, desc: '侧重灵宠产出' }
  ])

  const currentPoolConfig = computed(() => gachaPools[currentPool.value])

  const resourceNames = {
    spirit_stone: '灵石',
    reinforce_stone: '强化石',
    refinement_stone: '洗练石',
    pet_essence: '灵宠精华'
  }

  const formatNumber = num => {
    if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿'
    if (num >= 10000) return (num / 10000).toFixed(1) + '万'
    return num.toLocaleString()
  }

  const switchPool = key => {
    currentPool.value = key
    gachaResults.value = []
  }

  const showMessage = (type, content) => {
    logRef.value?.addLog(type, content)
  }

  // 发放奖励
  const grantReward = (result) => {
    const { category, item } = result
    if (category === 'equipment') {
      playerStore.items.push(item)
    } else if (category === 'pet') {
      playerStore.items.push(item)
    } else if (category === 'resource') {
      switch (item.type) {
        case 'spirit_stone':
          playerStore.spiritStones += item.amount
          break
        case 'reinforce_stone':
          playerStore.reinforceStones += item.amount
          break
        case 'refinement_stone':
          playerStore.refinementStones += item.amount
          break
        case 'pet_essence':
          playerStore.petEssence += item.amount
          break
      }
    }
  }

  // 格式化奖励名
  const getRewardName = (result) => {
    const { category, item } = result
    if (category === 'equipment') return item.name
    if (category === 'pet') return item.name
    return `${resourceNames[item.type] || '资源'}+${item.amount}`
  }

  // 单抽
  const doSingleGacha = () => {
    const cost = currentPoolConfig.value.cost
    if (playerStore.spiritStones < cost) {
      showMessage('error', '灵石不足！')
      return
    }
    playerStore.spiritStones -= cost
    const result = doGacha(currentPool.value, playerStore.level)
    if (!result) return
    grantReward(result)
    gachaResults.value = [result]
    showMessage('success', `抽奖获得：${getRewardName(result)}`)
    playerStore.queueSave()
  }

  // 十连
  const doTenGacha = () => {
    const cost = currentPoolConfig.value.cost * 10
    if (playerStore.spiritStones < cost) {
      showMessage('error', '灵石不足！')
      return
    }
    playerStore.spiritStones -= cost
    const results = doMultiGacha(currentPool.value, 10, playerStore.level)
    results.forEach(r => grantReward(r))
    gachaResults.value = results
    // 汇总日志
    const summary = {}
    results.forEach(r => {
      const key = r.category === 'resource' ? r.item.type : r.category
      if (!summary[key]) summary[key] = 0
      summary[key]++
    })
    const parts = []
    if (summary.equipment) parts.push(`装备×${summary.equipment}`)
    if (summary.pet) parts.push(`灵宠×${summary.pet}`)
    if (summary.spirit_stone) parts.push(`灵石奖励×${summary.spirit_stone}`)
    if (summary.reinforce_stone) parts.push(`强化石奖励×${summary.reinforce_stone}`)
    if (summary.refinement_stone) parts.push(`洗练石奖励×${summary.refinement_stone}`)
    if (summary.pet_essence) parts.push(`灵宠精华奖励×${summary.pet_essence}`)
    showMessage('success', `十连抽奖完成：${parts.join('，')}`)
    playerStore.queueSave()
  }

  const clearLogPanel = () => {
    logRef.value?.clearLogs()
  }

  // 结果卡片样式
  const getResultClass = (result) => {
    if (result.category === 'equipment') {
      return `quality-${result.item.quality}`
    } else if (result.category === 'pet') {
      return `rarity-${result.item.rarity}`
    }
    return 'quality-resource'
  }

  const getResultColor = (result) => {
    if (result.category === 'equipment') {
      return result.item.qualityInfo?.color || '#F5DEB3'
    } else if (result.category === 'pet') {
      return petRarities[result.item.rarity]?.color || '#F5DEB3'
    }
    return '#DAA520'
  }

  const getResultTypeName = (result) => {
    if (result.category === 'equipment') return '装备'
    if (result.category === 'pet') return '灵宠'
    return resourceNames[result.item.type] || '资源'
  }
</script>

<style scoped>
  .gacha-page {
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 100%;
  }

  .main-card {
    padding: 16px;
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
    margin-bottom: 16px;
    color: #aaa;
    font-size: 13px;
  }

  /* 奖池选择 */
  .pool-selector {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 16px;
  }

  @media (min-width: 480px) {
    .pool-selector {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .pool-card {
    padding: 14px;
    background: rgba(0, 0, 0, 0.25);
    border: 2px solid rgba(139, 69, 19, 0.2);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .pool-card.active {
    border-color: #DAA520;
    background: rgba(218, 165, 32, 0.1);
    box-shadow: 0 0 12px rgba(218, 165, 32, 0.2);
  }

  .pool-name {
    font-size: 16px;
    font-weight: bold;
    color: #F5DEB3;
    margin-bottom: 4px;
  }

  .pool-cost {
    font-size: 13px;
    color: #DAA520;
    margin-bottom: 4px;
  }

  .pool-desc {
    font-size: 11px;
    color: #888;
  }

  /* 抽奖按钮 */
  .gacha-actions {
    margin-bottom: 16px;
  }

  .spirit-stone-display {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: rgba(218, 165, 32, 0.08);
    border-radius: 8px;
    border: 1px solid rgba(218, 165, 32, 0.2);
    margin-bottom: 12px;
  }

  .spirit-stone-display .label {
    font-size: 13px;
    color: #888;
  }

  .spirit-stone-display .value {
    font-size: 16px;
    font-weight: bold;
    color: #DAA520;
  }

  .action-buttons {
    display: flex;
    gap: 10px;
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

  .btn-success {
    background: linear-gradient(135deg, #2E7D32, #66BB6A);
    color: #fff;
    box-shadow: 0 4px 15px rgba(34, 139, 34, 0.3);
  }

  .btn-danger {
    background: rgba(220, 53, 69, 0.3);
    color: #DC3545;
    border: 1px solid rgba(220, 53, 69, 0.3);
  }

  .btn-small {
    padding: 6px 12px;
    font-size: 12px;
    min-height: auto;
    flex: none;
  }

  .btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* 抽奖结果 */
  .gacha-results {
    margin-bottom: 16px;
  }

  .section-title {
    margin: 0 0 12px;
    font-size: 18px;
    color: #fff;
    font-family: var(--font-family-heading);
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }

  .result-card {
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(139, 69, 19, 0.2);
    border-radius: 8px;
    text-align: center;
    transition: all 0.2s;
  }

  .result-card.quality-mythic,
  .result-card.rarity-divine {
    border-color: #FF0000;
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.2);
  }

  .result-card.quality-legendary,
  .result-card.rarity-celestial {
    border-color: #FFD700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
  }

  .result-card.quality-epic,
  .result-card.rarity-mystic {
    border-color: #9932CC;
    box-shadow: 0 0 8px rgba(153, 50, 204, 0.15);
  }

  .result-type {
    font-size: 11px;
    margin-bottom: 4px;
    opacity: 0.8;
  }

  .result-name {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 6px;
    word-break: break-all;
  }

  .result-detail {
    display: flex;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    color: #aaa;
    flex-wrap: wrap;
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
