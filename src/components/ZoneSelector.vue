<template>
  <div class="zone-selector">
    <div class="selector-header">
      <div class="header-icon">🗺️</div>
      <div class="header-text">
        <h2 class="header-title gold-gradient-text">探索秘境</h2>
        <p class="header-subtitle">选择一处秘境进行探索，挑战怪物，获取机缘</p>
      </div>
    </div>

    <div class="filter-bar">
      <button 
        v-for="filter in filters" 
        :key="filter.key"
        class="filter-btn"
        :class="{ active: currentFilter === filter.key }"
        @click="currentFilter = filter.key"
      >
        {{ filter.label }}
      </button>
    </div>

    <div class="zones-grid">
      <div 
        v-for="zone in filteredZones" 
        :key="zone.id"
        class="zone-card"
        :class="{ 
          locked: !canEnter(zone),
          selected: selectedZone?.id === zone.id
        }"
        @click="selectZone(zone)"
      >
        <div class="zone-image-wrapper">
          <div class="zone-image" :style="{ backgroundImage: zone.image ? `url(${getAssetUrl(zone.image)})` : 'none', backgroundColor: zone.difficultyColor + '20' }">
            <div v-if="!zone.image" class="zone-icon">{{ getZoneIcon(zone.id) }}</div>
            <div class="zone-difficulty-badge" :style="{ backgroundColor: zone.difficultyColor }">
              {{ zone.difficultyLabel }}
            </div>
          </div>
        </div>

        <div class="zone-info">
          <div class="zone-name">{{ zone.name }}</div>
          <div class="zone-description">{{ zone.description }}</div>

          <div class="zone-stats">
            <div class="stat-row">
              <span class="stat-label">🪄 推荐等级</span>
              <span class="stat-value">{{ zone.minLevel }}级</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">💨 灵力消耗</span>
              <span class="stat-value">{{ formatNumber(zone.spiritCost) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">⭐ 奖励倍率</span>
              <span class="stat-value highlight">{{ zone.rewardMultiplier }}x</span>
            </div>
          </div>

          <div class="zone-monsters">
            <span class="monsters-label">👹 出没怪物:</span>
            <span class="monsters-list">{{ zone.monsters.join('、') }}</span>
          </div>

          <div class="zone-rewards-preview">
            <div class="rewards-title">💰 可能获得</div>
            <div class="rewards-list">
              <div v-for="(reward, index) in zone.rewards.slice(0, 3)" :key="index" class="reward-item">
                <span class="reward-name">{{ reward.name }}</span>
                <span class="reward-chance">{{ Math.round(reward.chance * 100) }}%</span>
              </div>
            </div>
          </div>

          <div v-if="!canEnter(zone)" class="lock-overlay">
            <div class="lock-icon">🔒</div>
            <div class="lock-text">等级不足</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedZone" class="selection-panel">
      <div class="panel-header">
        <div class="panel-title">
          <span class="zone-name-large">{{ selectedZone.name }}</span>
          <span class="zone-difficulty" :style="{ color: selectedZone.difficultyColor }">{{ selectedZone.difficultyLabel }}</span>
        </div>
        <button class="btn-close" @click="selectedZone = null">✕</button>
      </div>

      <div class="panel-content">
        <div class="panel-description">{{ selectedZone.description }}</div>

        <div class="panel-stats-grid">
          <div class="panel-stat">
            <div class="stat-icon">🪄</div>
            <div class="stat-content">
              <div class="stat-label">推荐等级</div>
              <div class="stat-value">{{ selectedZone.minLevel }}级</div>
            </div>
          </div>
          <div class="panel-stat">
            <div class="stat-icon">💨</div>
            <div class="stat-content">
              <div class="stat-label">灵力消耗</div>
              <div class="stat-value">{{ formatNumber(selectedZone.spiritCost) }}</div>
            </div>
          </div>
          <div class="panel-stat">
            <div class="stat-icon">⭐</div>
            <div class="stat-content">
              <div class="stat-label">奖励倍率</div>
              <div class="stat-value highlight">{{ selectedZone.rewardMultiplier }}x</div>
            </div>
          </div>
          <div class="panel-stat">
            <div class="stat-icon">⚔️</div>
            <div class="stat-content">
              <div class="stat-label">推荐攻击</div>
              <div class="stat-value">{{ selectedZone.recommendedStats.attack }}</div>
            </div>
          </div>
          <div class="panel-stat">
            <div class="stat-icon">❤️</div>
            <div class="stat-content">
              <div class="stat-label">推荐生命</div>
              <div class="stat-value">{{ selectedZone.recommendedStats.health }}</div>
            </div>
          </div>
        </div>

        <div class="panel-monsters">
          <h4>👹 出没怪物</h4>
          <div class="monsters-tags">
            <span v-for="monster in selectedZone.monsters" :key="monster" class="monster-tag">{{ monster }}</span>
          </div>
        </div>

        <div class="panel-rewards">
          <h4>💰 可能获得的报酬</h4>
          <div class="rewards-detail">
            <div v-for="(reward, index) in selectedZone.rewards" :key="index" class="reward-detail-item">
              <div class="reward-info">
                <span class="reward-name-large">{{ reward.name }}</span>
                <span v-if="reward.amount" class="reward-range">{{ formatNumber(reward.amount[0]) }}~{{ formatNumber(reward.amount[1]) }}</span>
              </div>
              <div class="reward-chance-bar">
                <div class="chance-fill" :style="{ width: reward.chance * 100 + '%' }"></div>
                <span class="chance-text">{{ Math.round(reward.chance * 100) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-actions">
        <button 
          class="btn-explore"
          :class="{ disabled: !canEnter(selectedZone) || playerStore.spirit < selectedZone.spiritCost }"
          @click="startExplore"
        >
          <span class="btn-icon">🚀</span>
          <span class="btn-text">开始探索</span>
          <span class="btn-cost">{{ formatNumber(selectedZone.spiritCost) }} 灵力</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { zones, canEnterZone } from '../plugins/zones'
import { getAssetUrl } from '../plugins/theme'

const playerStore = usePlayerStore()
const currentFilter = ref('all')
const selectedZone = ref(null)

const filters = [
  { key: 'all', label: '全部' },
  { key: 'easy', label: '入门' },
  { key: 'normal', label: '普通' },
  { key: 'hard', label: '困难' },
  { key: 'elite', label: '精英+' }
]

const filteredZones = computed(() => {
  if (currentFilter.value === 'all') return zones
  if (currentFilter.value === 'easy') return zones.filter(z => z.difficulty <= 2)
  if (currentFilter.value === 'normal') return zones.filter(z => z.difficulty === 3 || z.difficulty === 4)
  if (currentFilter.value === 'hard') return zones.filter(z => z.difficulty === 5 || z.difficulty === 6)
  if (currentFilter.value === 'elite') return zones.filter(z => z.difficulty >= 7)
  return zones
})

const canEnter = (zone) => {
  return playerStore.level >= zone.minLevel
}

const selectZone = (zone) => {
  if (canEnter(zone)) {
    selectedZone.value = zone
  }
}

const formatNumber = (num) => {
  if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿'
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  return num.toLocaleString()
}

const getZoneIcon = (id) => {
  const icons = {
    forest_edge: '🌲',
    misty_valley: '🌫️',
    phoenix_cave: '🔥',
    dragon_abyss: '🐉',
    ghost_wasteland: '💀',
    ice_palace: '❄️',
    immortal_ruins: '🏛️',
    chaos_realm: '🌀'
  }
  return icons[id] || '🏔️'
}

const startExplore = () => {
  if (!selectedZone.value) return
  if (!canEnter(selectedZone.value)) {
    alert('等级不足，无法进入！')
    return
  }
  if (playerStore.spirit < selectedZone.value.spiritCost) {
    alert('灵力不足！')
    return
  }
  alert(`开始探索 ${selectedZone.value.name}！\n\n消耗 ${selectedZone.value.spiritCost} 灵力`)
  playerStore.spirit -= selectedZone.value.spiritCost
}
</script>

<style scoped>
.zone-selector {
  padding: 16px;
}

.selector-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.header-icon {
  font-size: 36px;
}

.header-title {
  margin: 0;
  font-size: 24px;
  font-family: 'Ma Shan Zheng', cursive;
}

.header-subtitle {
  margin: 4px 0 0;
  color: #888;
  font-size: 14px;
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 20px;
  color: #8B8B8B;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: rgba(218, 165, 32, 0.2);
  border-color: #DAA520;
  color: #FFD700;
}

.zones-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .zones-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.zone-card {
  background: rgba(20, 25, 30, 0.9);
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
}

.zone-card:hover:not(.locked) {
  border-color: rgba(218, 165, 32, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.zone-card.selected {
  border-color: #DAA520;
  box-shadow: 0 0 20px rgba(218, 165, 32, 0.3);
}

.zone-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.zone-image-wrapper {
  position: relative;
  height: 120px;
}

.zone-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zone-icon {
  font-size: 48px;
}

.zone-difficulty-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.zone-info {
  padding: 16px;
}

.zone-name {
  font-size: 18px;
  font-weight: bold;
  color: #F5DEB3;
  margin-bottom: 4px;
  font-family: 'Ma Shan Zheng', cursive;
}

.zone-description {
  font-size: 13px;
  color: #8B8B8B;
  margin-bottom: 12px;
  line-height: 1.4;
}

.zone-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat-row {
  background: rgba(0, 0, 0, 0.3);
  padding: 8px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 10px;
  color: #666;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 13px;
  color: #DAA520;
  font-weight: bold;
}

.stat-value.highlight {
  color: #FFD700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.zone-monsters {
  margin-bottom: 12px;
  font-size: 12px;
}

.monsters-label {
  color: #666;
}

.monsters-list {
  color: #F5DEB3;
}

.zone-rewards-preview {
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 8px;
}

.rewards-title {
  font-size: 11px;
  color: #666;
  margin-bottom: 8px;
}

.rewards-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.reward-name {
  color: #F5DEB3;
}

.reward-chance {
  color: #DAA520;
  font-size: 11px;
}

.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.lock-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.lock-text {
  font-size: 14px;
  color: #8B8B8B;
}

.selection-panel {
  margin-top: 20px;
  background: rgba(20, 25, 30, 0.95);
  border-radius: 16px;
  border: 1px solid rgba(218, 165, 32, 0.3);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(218, 165, 32, 0.1);
  border-bottom: 1px solid rgba(218, 165, 32, 0.2);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zone-name-large {
  font-size: 20px;
  font-weight: bold;
  color: #F5DEB3;
  font-family: 'Ma Shan Zheng', cursive;
}

.zone-difficulty {
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(218, 165, 32, 0.2);
  font-size: 12px;
  font-weight: bold;
}

.btn-close {
  background: transparent;
  border: none;
  color: #8B8B8B;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #F5DEB3;
}

.panel-content {
  padding: 16px;
}

.panel-description {
  font-size: 14px;
  color: #8B8B8B;
  margin-bottom: 16px;
  line-height: 1.5;
}

.panel-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.panel-stat {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 10px;
}

.stat-icon {
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.panel-stat .stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.panel-stat .stat-value {
  font-size: 16px;
  color: #DAA520;
  font-weight: bold;
}

.panel-monsters,
.panel-rewards {
  margin-bottom: 16px;
}

.panel-monsters h4,
.panel-rewards h4 {
  font-size: 14px;
  color: #FFD700;
  margin-bottom: 10px;
}

.monsters-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.monster-tag {
  padding: 4px 12px;
  background: rgba(255, 99, 71, 0.2);
  border: 1px solid rgba(255, 99, 71, 0.3);
  border-radius: 12px;
  font-size: 12px;
  color: #FF6347;
}

.rewards-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reward-detail-item {
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 10px;
}

.reward-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.reward-name-large {
  font-size: 14px;
  color: #F5DEB3;
}

.reward-range {
  font-size: 13px;
  color: #DAA520;
}

.reward-chance-bar {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.chance-fill {
  height: 100%;
  background: linear-gradient(90deg, #8B4513, #DAA520);
  border-radius: 4px;
  transition: width 0.3s;
}

.chance-text {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: #FFD700;
  font-weight: bold;
}

.panel-actions {
  padding: 16px;
  border-top: 1px solid rgba(218, 165, 32, 0.2);
}

.btn-explore {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(135deg, #DAA520, #FFD700);
  color: #0D0D12;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-explore:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(218, 165, 32, 0.4);
}

.btn-explore.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 20px;
}

.btn-cost {
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
}
</style>
