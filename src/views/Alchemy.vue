<template>
  <div class="alchemy-page fade-in-up">
    <div class="main-card glass-card">
      <div class="card-header">
        <div class="header-icon">
          <FireOutlined />
        </div>
        <div class="header-info">
          <h2 class="card-title gold-gradient-text">八卦炉</h2>
          <p class="card-subtitle">炼丹锻器，回炉转生</p>
        </div>
      </div>

      <!-- 八卦炉子菜单切换 -->
      <div class="furnace-tabs">
        <div
          class="furnace-tab"
          :class="{ active: activeTab === 'pill' }"
          @click="activeTab = 'pill'"
        >
          <span class="tab-icon">⚗️</span>
          <span class="tab-label">丹药炼制</span>
        </div>
        <div
          class="furnace-tab"
          :class="{ active: activeTab === 'forge' }"
          @click="activeTab = 'forge'"
        >
          <span class="tab-icon">🔨</span>
          <span class="tab-label">装备锻打</span>
        </div>
        <div
          class="furnace-tab"
          :class="{ active: activeTab === 'rebirth' }"
          @click="activeTab = 'rebirth'"
        >
          <span class="tab-icon">♻️</span>
          <span class="tab-label">回炉转生</span>
        </div>
      </div>

      <div class="card-body">
        <!-- ==================== 丹药炼制 ==================== -->
        <template v-if="activeTab === 'pill'">
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
        </template>

        <!-- ==================== 装备锻打 ==================== -->
        <template v-if="activeTab === 'forge'">
          <div class="tips-box">
            <InfoCircleOutlined />
            <span>将多余装备投入八卦炉锻打，锤炼出更强属性。</span>
          </div>
          <div class="coming-soon">
            <div class="coming-soon-icon">🔨</div>
            <h3 class="section-title">装备锻打系统</h3>
            <p class="coming-soon-desc">投入装备与锻材，以炉火淬炼装备属性。</p>
            <div class="feature-preview">
              <div class="feature-item">
                <span class="feature-icon">⚔️</span>
                <span>装备强化</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🔄</span>
                <span>属性洗练</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">✨</span>
                <span>品质提升</span>
              </div>
            </div>
            <div class="coming-soon-badge">即将开放</div>
          </div>
        </template>

        <!-- ==================== 回炉转生 ==================== -->
        <template v-if="activeTab === 'rebirth'">
          <div class="tips-box">
            <InfoCircleOutlined />
            <span>角色达到80级后可回炉重造，晋升星级，获得更高天赋。升星后等级重置为1级，但永久继承原努力值的10%。</span>
          </div>

          <div class="section">
            <h3 class="section-title">选择角色</h3>
            <div class="rebirth-member-list">
              <div
                v-for="member in rebirthCandidates"
                :key="member.id"
                class="rebirth-member-card glass-card"
                :class="{ selected: selectedRebirthMember?.id === member.id, disabled: !canRebirth(member) }"
                @click="selectRebirthMember(member)"
              >
                <div class="member-avatar">{{ member.name.charAt(0) }}</div>
                <div class="member-info">
                  <div class="member-name">
                    {{ member.name }}
                    <span class="member-star" :style="{ color: starConfig[member.star]?.color }">
                      {{ '★'.repeat(member.star) }}
                    </span>
                  </div>
                  <div class="member-detail">等级: {{ member.level }} / 80</div>
                  <div class="member-detail">天赋值: {{ member.talentValue || starConfig[member.star]?.talentValue || 100 }}</div>
                  <div class="member-detail">
                    努力值: {{ Math.round(member.effortValue || 0) }}
                    <span v-if="member.star < 5">/ {{ getMemberEffortCap(member) }}</span>
                    <span v-else>（无上限）</span>
                  </div>
                </div>
                <div class="member-status">
                  <span v-if="canRebirth(member)" class="status-ready">可升星</span>
                  <span v-else class="status-locked">等级不足</span>
                </div>
              </div>
            </div>
          </div>

          <template v-if="selectedRebirthMember">
            <div class="section">
              <h3 class="section-title">升星预览</h3>
              <div class="rebirth-preview glass-card">
                <div class="preview-row">
                  <div class="preview-col">
                    <div class="preview-label">当前</div>
                    <div class="preview-star" :style="{ color: starConfig[getRebirthPreview(selectedRebirthMember).currentStar]?.color }">
                      {{ '★'.repeat(getRebirthPreview(selectedRebirthMember).currentStar) }}
                    </div>
                    <div class="preview-value">天赋值: {{ getRebirthPreview(selectedRebirthMember).currentTalent }}</div>
                  </div>
                  <div class="preview-arrow">→</div>
                  <div class="preview-col">
                    <div class="preview-label">升星后</div>
                    <div class="preview-star" :style="{ color: starConfig[getRebirthPreview(selectedRebirthMember).nextStar]?.color }">
                      {{ '★'.repeat(getRebirthPreview(selectedRebirthMember).nextStar) }}
                    </div>
                    <div class="preview-value highlight">天赋值: {{ getRebirthPreview(selectedRebirthMember).newTalent }}</div>
                    <div class="preview-bonus">+{{ getRebirthPreview(selectedRebirthMember).inheritedBonus }} 继承加成</div>
                  </div>
                </div>
                <div class="preview-note">
                  <p>📌 升星后等级重置为1级，需重新修炼</p>
                  <p>📌 永久继承当前努力值的10%作为额外天赋值</p>
                  <p>📌 努力值越高，升星后获得的继承加成越多</p>
                </div>
              </div>
            </div>

            <div class="action-section">
              <button
                class="btn-primary rebirth-button"
                :disabled="!canRebirth(selectedRebirthMember)"
                @click="requestRebirth"
              >
                ♻️ 回炉重造
              </button>
            </div>
          </template>

          <n-modal v-model:show="showRebirthConfirm" preset="dialog" title="确认回炉重造"
            positive-text="确认重造" negative-text="取消" @positive-click="confirmRebirth">
            <p>确定要将 <strong>{{ selectedRebirthMember?.name }}</strong> 回炉重造吗？</p>
            <p>角色将晋升 {{ selectedRebirthMember ? selectedRebirthMember.star + 1 : 0 }} 星，但等级重置为 1 级。</p>
            <p style="color: #d4a017;">当前努力值的 10% 将永久继承为天赋值加成。</p>
          </n-modal>
        </template>
      </div>
    </div>
    <div class="log-section" v-if="selectedRecipe && activeTab === 'pill'">
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
  import { starConfig, getEffortCap } from '../plugins/characters'
  import LogPanel from '../components/LogPanel.vue'
  import { useMessage } from 'naive-ui'
  import {
    MedicineBoxOutlined,
    InfoCircleOutlined,
    FireOutlined
  } from '@ant-design/icons-vue'

  const playerStore = usePlayerStore()
  const message = useMessage()
  const logRef = ref(null)

  const activeTab = ref('pill')
  const selectedRecipe = ref(null)
  const selectedRebirthMember = ref(null)
  const showRebirthConfirm = ref(false)

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

  // ===== 回炉重造相关 =====
  const rebirthCandidates = computed(() => {
    return playerStore.sectMembers.filter(m => m.star < 5)
  })

  const canRebirth = (member) => {
    if (!member) return false
    if (member.star >= 5) return false
    return member.level >= 80
  }

  const getMemberEffortCap = (member) => {
    if (!member) return 0
    return getEffortCap(member.star)
  }

  const getRebirthPreview = (member) => {
    if (!member) return null
    const currentStar = member.star || 3
    const nextStar = currentStar + 1
    if (nextStar > 5) return null
    const effort = member.effortValue || 0
    const inheritedBonus = Math.floor(effort * 0.1)
    const nextCfg = starConfig[nextStar]
    const newTalent = nextCfg.talentValue + inheritedBonus
    return {
      currentStar,
      nextStar,
      currentTalent: member.talentValue || starConfig[currentStar]?.talentValue || 100,
      newTalent,
      inheritedBonus,
      currentEffort: effort
    }
  }

  const selectRebirthMember = (member) => {
    selectedRebirthMember.value = member
  }

  const requestRebirth = () => {
    if (!selectedRebirthMember.value) return
    if (!canRebirth(selectedRebirthMember.value)) {
      message.warning('角色需达到80级才能回炉重造')
      return
    }
    showRebirthConfirm.value = true
  }

  const confirmRebirth = () => {
    if (!selectedRebirthMember.value) return
    const result = playerStore.rebirthCharacter(selectedRebirthMember.value.id)
    showRebirthConfirm.value = false
    if (result.success) {
      message.success(result.message)
      selectedRebirthMember.value = null
    } else {
      message.error(result.message)
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

  /* 八卦炉子菜单 */
  .furnace-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    padding: 6px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    border: 1px solid rgba(139, 69, 19, 0.15);
  }

  .furnace-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #888;
    font-size: 13px;
    text-align: center;
  }

  .furnace-tab:hover {
    background: rgba(218, 165, 32, 0.08);
    color: #ccc;
  }

  .furnace-tab.active {
    background: linear-gradient(135deg, rgba(139, 69, 19, 0.4), rgba(218, 165, 32, 0.25));
    color: var(--color-accent-gold);
    box-shadow: 0 2px 12px rgba(218, 165, 32, 0.2);
  }

  .tab-icon {
    font-size: 22px;
    line-height: 1;
  }

  .tab-label {
    font-size: 13px;
    font-weight: 500;
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

  /* 即将开放占位 */
  .coming-soon {
    text-align: center;
    padding: 48px 24px;
  }

  .coming-soon-icon {
    font-size: 56px;
    margin-bottom: 16px;
    opacity: 0.7;
  }

  .coming-soon-desc {
    color: #888;
    font-size: 14px;
    line-height: 1.6;
    margin: 8px 0 24px;
  }

  .feature-preview {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .feature-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: #aaa;
    font-size: 13px;
  }

  .feature-icon {
    font-size: 28px;
  }

  .coming-soon-badge {
    display: inline-block;
    padding: 6px 20px;
    background: rgba(218, 165, 32, 0.15);
    border: 1px solid rgba(218, 165, 32, 0.3);
    border-radius: 20px;
    color: var(--color-accent-gold);
    font-size: 13px;
    font-weight: 500;
  }

  .rebirth-member-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .rebirth-member-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
  }

  .rebirth-member-card:hover {
    border-color: rgba(218, 165, 32, 0.4);
  }

  .rebirth-member-card.selected {
    border-color: var(--color-accent-gold);
    background: rgba(218, 165, 32, 0.08);
  }

  .rebirth-member-card.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .member-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #d4a017, #8b6914);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    flex-shrink: 0;
  }

  .member-info {
    flex: 1;
  }

  .member-name {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .member-star {
    font-size: 14px;
  }

  .member-detail {
    font-size: 13px;
    color: #999;
    margin-top: 2px;
  }

  .member-status {
    flex-shrink: 0;
  }

  .status-ready {
    padding: 4px 12px;
    background: rgba(76, 175, 80, 0.15);
    color: #4caf50;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .status-locked {
    padding: 4px 12px;
    background: rgba(158, 158, 158, 0.15);
    color: #999;
    border-radius: 12px;
    font-size: 12px;
  }

  .rebirth-preview {
    padding: 20px;
  }

  .preview-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 20px;
  }

  .preview-col {
    text-align: center;
    flex: 1;
    padding: 16px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
  }

  .preview-label {
    font-size: 13px;
    color: #888;
    margin-bottom: 8px;
  }

  .preview-star {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .preview-value {
    font-size: 15px;
    color: #ddd;
  }

  .preview-value.highlight {
    color: var(--color-accent-gold);
    font-weight: 600;
  }

  .preview-bonus {
    margin-top: 6px;
    font-size: 12px;
    color: #4caf50;
  }

  .preview-arrow {
    font-size: 24px;
    color: var(--color-accent-gold);
    font-weight: bold;
  }

  .preview-note {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 16px;
  }

  .preview-note p {
    margin: 6px 0;
    font-size: 13px;
    color: #aaa;
    line-height: 1.5;
  }

  .action-section {
    text-align: center;
    margin-top: 20px;
  }

  .rebirth-button {
    padding: 12px 36px;
    font-size: 16px;
    font-weight: 600;
  }

  .rebirth-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
