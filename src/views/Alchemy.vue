<template>
  <div class="alchemy-page fade-in-up">
    <div class="main-card glass-card">
      <div class="card-header">
        <div class="header-icon">
          <MedicineBoxOutlined />
        </div>
        <div class="header-info">
          <h2 class="card-title gold-gradient-text">丹药炼制</h2>
          <p class="card-subtitle">炼制丹药，提升修为</p>
        </div>
      </div>
      <div class="card-body">
        <div class="tips-box">
          <InfoCircleOutlined />
          <span>选择丹方，收集材料，炼制各种神奇丹药。</span>
        </div>
        <template v-if="unlockedRecipes.length > 0">
          <div class="section">
            <h3 class="section-title">丹方选择</h3>
            <div class="recipes-grid">
              <div
                class="recipe-card glass-card"
                v-for="recipe in unlockedRecipes"
                :key="recipe.id"
                :class="{ selected: selectedRecipe?.id === recipe.id }"
                @click="selectRecipe(recipe)"
              >
                <div class="recipe-header">
                  <h4 class="recipe-name">{{ recipe.name }}</h4>
                  <div class="recipe-tags">
                    <n-tag type="info" size="small">{{ pillGrades[recipe.grade].name }}</n-tag>
                    <n-tag type="warning" size="small">{{ pillTypes[recipe.type].name }}</n-tag>
                  </div>
                </div>
                <p class="recipe-desc">{{ recipe.description }}</p>
                <div class="recipe-status">
                  {{ selectedRecipe?.id === recipe.id ? '已选择' : '点击选择' }}
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="empty-state">
          <n-empty description="暂未掌握任何丹方" />
          <p class="empty-hint">探索秘境可获得丹方残页</p>
        </div>
        <template v-if="selectedRecipe">
          <div class="section">
            <h3 class="section-title">材料需求</h3>
            <div class="materials-list">
              <div class="material-item" v-for="material in selectedRecipe.materials" :key="material.id || material.herb">
                <div class="material-info">
                  <span class="material-name">{{ getMaterialName(material) }}</span>
                  <span class="material-need">需要: {{ material.count }}</span>
                </div>
                <div
                  class="material-status"
                  :class="getMaterialStatus(material) === `${material.count}/${material.count}` ? 'success' : 'warning'"
                >
                  {{ getMaterialStatus(material) }}
                </div>
              </div>
            </div>
          </div>
          <div class="section">
            <h3 class="section-title">效果预览</h3>
            <div class="effect-grid">
              <div class="effect-item">
                <div class="effect-label">丹药介绍</div>
                <div class="effect-value">{{ selectedRecipe.description }}</div>
              </div>
              <div class="effect-item">
                <div class="effect-label">{{ effectDescription.label }}</div>
                <div class="effect-value highlight">{{ effectDescription.value }}</div>
              </div>
              <div class="effect-item">
                <div class="effect-label">持续时间</div>
                <div class="effect-value">{{ Math.floor((currentEffect?.duration || 0) / 60) }}分钟</div>
              </div>
              <div class="effect-item">
                <div class="effect-label">成功率</div>
                <div class="effect-value">{{ (currentEffect?.successRate * 100).toFixed(1) }}%</div>
              </div>
            </div>
          </div>
          <div class="craft-section">
            <button
              class="btn btn-primary craft-button"
              :class="{ disabled: !selectedRecipe || !checkMaterials(selectedRecipe) }"
              @click="craftPill"
            >
              <span class="btn-icon"><FireOutlined /></span>
              <span>{{ !checkMaterials(selectedRecipe) ? '材料不足' : '开始炼制' }}</span>
            </button>
          </div>
        </template>
      </div>
    </div>
    <div class="log-section" v-if="selectedRecipe">
      <div class="log-header">
        <h3 class="section-title gold-gradient-text">炼丹日志</h3>
      </div>
      <log-panel ref="logRef" />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { usePlayerStore } from '../stores/player'
  import { pillRecipes, pillGrades, pillTypes, calculatePillEffect } from '../plugins/pills'
  import { allMaterials } from '../plugins/materials'
  import LogPanel from '../components/LogPanel.vue'
  import {
    MedicineBoxOutlined,
    InfoCircleOutlined,
    FireOutlined
  } from '@ant-design/icons-vue'

  const playerStore = usePlayerStore()
  const logRef = ref(null)

  const selectedRecipe = ref(null)

  const unlockedRecipes = computed(() => {
    return pillRecipes.filter(recipe => playerStore.pillRecipes.includes(recipe.id))
  })

  const selectRecipe = recipe => {
    selectedRecipe.value = recipe
  }

  const checkMaterials = recipe => {
    if (!recipe) return false
    return recipe.materials.every(material => {
      const count = playerStore.materials.filter(m => m.kind === (material.kind || 'herb') && m.id === material.id).length
      return count >= material.count
    })
  }

  const getMaterialStatus = material => {
    const count = playerStore.materials.filter(m => m.kind === (material.kind || 'herb') && m.id === material.id).length
    return `${count}/${material.count}`
  }

  const getMaterialName = material => {
    const m = allMaterials.find(x => x.id === material.id && x.kind === (material.kind || 'herb'))
    return m ? m.name : material.id
  }

  const currentEffect = computed(() => {
    if (!selectedRecipe.value) return null
    return calculatePillEffect(selectedRecipe.value, playerStore.level)
  })

  // 按丹药效果类型给出可读描述（支持新增值/突破/强化/洗练/战斗/探索类）
  const effectDescription = computed(() => {
    const e = currentEffect.value
    if (!e) return { label: '效果', value: '-' }
    const statNames = { attack: '攻击', defense: '防御', health: '生命', speed: '速度' }
    switch (e.type) {
      case 'permanentStat':
        return { label: '永久属性', value: `+${Math.round(e.value)} ${statNames[e.stat] || e.stat}` }
      case 'breakthroughRate':
        return { label: '突破成功率', value: `+${(e.value * 100).toFixed(0)}%` }
      case 'enhanceRate':
        return { label: '强化成功率', value: `+${(e.value * 100).toFixed(0)}%` }
      case 'reforgeSafe':
        return { label: '洗练保底', value: `${Math.max(1, Math.round(e.value))} 次` }
      case 'healBattle':
        return { label: '战斗回血', value: '战斗中使用' }
      case 'cleanse':
        return { label: '战斗解控', value: '战斗中使用' }
      case 'expGain':
        return { label: '修为获取', value: `+${(e.value * 100).toFixed(0)}%` }
      case 'dropRate':
        return { label: '掉落加成', value: `+${(e.value * 100).toFixed(0)}%` }
      default:
        return { label: '效果数值', value: `+${(e.value * 100).toFixed(1)}%` }
    }
  })

  const craftPill = () => {
    if (!selectedRecipe.value) return
    const result = playerStore.craftPill(selectedRecipe.value.id)
    if (result.success) {
      logRef.value?.addLog('success', '炼制成功！')
      const btn = document.querySelector('.craft-button')
      if (btn) {
        btn.classList.add('success-animation')
        setTimeout(() => {
          btn.classList.remove('success-animation')
        }, 1000)
      }
    } else {
      logRef.value?.addLog('error', `炼制失败：${result.message}`)
      const btn = document.querySelector('.craft-button')
      if (btn) {
        btn.classList.add('fail-animation')
        setTimeout(() => {
          btn.classList.remove('fail-animation')
        }, 1000)
      }
    }
  }
</script>

<style scoped>
  .alchemy-page {
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

  .section {
    margin-bottom: 16px;
  }

  .section-title {
    margin: 0 0 12px;
    font-size: 18px;
    color: #fff;
    font-family: var(--font-family-heading);
  }

  .recipes-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .recipe-card {
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid rgba(139, 69, 19, 0.2);
  }

  .recipe-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(139, 69, 19, 0.2);
  }

  .recipe-card.selected {
    border-color: var(--color-accent-gold);
    background: rgba(218, 165, 32, 0.1);
  }

  .recipe-header {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
  }

  .recipe-name {
    margin: 0;
    font-size: 18px;
    color: var(--color-accent-gold);
    font-family: var(--font-family-heading);
  }

  .recipe-tags {
    display: flex;
    gap: 4px;
  }

  .recipe-desc {
    margin: 0 0 12px;
    font-size: 14px;
    color: #aaa;
    line-height: 1.5;
  }

  .recipe-status {
    font-size: 12px;
    color: #888;
    text-align: right;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
  }

  .empty-hint {
    margin-top: 12px;
    color: #888;
    font-size: 14px;
  }

  .materials-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .material-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .material-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .material-name {
    font-size: 14px;
    color: #fff;
  }

  .material-need {
    font-size: 12px;
    color: #888;
  }

  .material-status {
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
  }

  .material-status.success {
    background: rgba(76, 175, 80, 0.3);
    color: #4CAF50;
  }

  .material-status.warning {
    background: rgba(255, 193, 7, 0.3);
    color: #FFC107;
  }

  .effect-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .effect-item {
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .effect-label {
    font-size: 12px;
    color: #888;
    margin-bottom: 4px;
  }

  .effect-value {
    font-size: 14px;
    color: #fff;
  }

  .effect-value.highlight {
    color: var(--color-accent-gold);
    font-weight: bold;
  }

  .craft-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(139, 69, 19, 0.2);
  }

  .btn {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 24px;
    border-radius: 10px;
    font-size: 16px;
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

  .btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-icon {
    font-size: 18px;
  }

  .craft-button {
    position: relative;
    overflow: hidden;
  }

  @keyframes success-ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }

  @keyframes fail-shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-10px);
    }
    75% {
      transform: translateX(10px);
    }
  }

  .success-animation::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    background: rgba(0, 255, 0, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: success-ripple 1s ease-out;
  }

  .fail-animation {
    animation: fail-shake 0.5s ease-in-out;
  }

  .log-section {
    margin-top: auto;
  }

  .log-header {
    margin-bottom: 12px;
  }
</style>
