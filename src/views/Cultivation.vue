<template>
  <div class="character-page fade-in-up">
    <!-- 人物信息卡 -->
    <div class="char-card glass-card">
      <div class="char-header">
        <div class="char-avatar">
          <span>仙</span>
        </div>
        <div class="char-info">
          <div class="char-name-row">
          <h2 class="char-name">{{ playerStore.name }}</h2>
          <span v-if="playerStore.rebirthCount > 0" class="rebirth-badge">
            第{{ playerStore.rebirthCount }}世
          </span>
        </div>
        <div class="char-realm" :style="{ color: getRealmColor(playerStore.level) }">
          {{ getRealmName(playerStore.level)?.name || playerStore.realm }}
        </div>
        <div class="char-level">Lv.{{ playerStore.level }}</div>
        <div class="build-strength">
          <span class="build-label">Build强度</span>
          <span class="build-value">{{ playerStore.buildStrength }}</span>
        </div>
        </div>
      </div>

      <!-- 修为进度 -->
      <div class="cultivation-progress">
        <div class="progress-header">
          <span class="progress-label">修为</span>
          <span class="progress-value">
            {{ Math.floor(playerStore.cultivation) }} / {{ playerStore.maxCultivation }}
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
        <div class="progress-percentage">
          {{ ((playerStore.cultivation / playerStore.maxCultivation) * 100).toFixed(1) }}%
        </div>
      </div>
    </div>

    <!-- 属性面板 -->
    <div class="stats-card glass-card">
      <h3 class="section-title">人物属性</h3>
      <p class="base-note">左列为基础值（裸身 · 含出战灵宠），中列为装备后最终值，右列为装备与套装带来的增量</p>

      <!-- 基础数值：基础值 / 装备后 / +装备加成 -->
      <div class="attr-block">
        <h4 class="sub-title">基础数值</h4>
        <div class="attr-table">
          <div class="attr-row attr-head">
            <span class="attr-col-label">属性</span>
            <span class="attr-col-base">基础值</span>
            <span class="attr-col-final">装备后</span>
            <span class="attr-col-delta">+装备加成</span>
          </div>
          <div class="attr-row" v-for="row in baseCompare" :key="row.key">
            <span class="attr-col-label">{{ row.label }}</span>
            <span class="attr-col-base">{{ row.base }}</span>
            <span class="attr-col-final">{{ row.final }}</span>
            <span class="attr-col-delta" :class="{ 'is-zero': row.delta === 0 }">+{{ row.delta }}</span>
          </div>
        </div>
      </div>

      <!-- 战斗属性 -->
      <div class="attr-block">
        <h4 class="sub-title">战斗属性</h4>
        <div class="attr-table">
          <div class="attr-row attr-head">
            <span class="attr-col-label">属性</span>
            <span class="attr-col-base">基础值</span>
            <span class="attr-col-final">装备后</span>
            <span class="attr-col-delta">+装备加成</span>
          </div>
          <div class="attr-row" v-for="row in combatCompare" :key="row.key">
            <span class="attr-col-label">{{ row.label }}</span>
            <span class="attr-col-base">{{ row.base }}%</span>
            <span class="attr-col-final">{{ row.final }}%</span>
            <span class="attr-col-delta" :class="{ 'is-zero': row.delta === 0 }">+{{ row.delta }}%</span>
          </div>
        </div>
      </div>

      <!-- 抗性属性 -->
      <div class="attr-block">
        <h4 class="sub-title">抗性属性</h4>
        <div class="attr-table">
          <div class="attr-row attr-head">
            <span class="attr-col-label">属性</span>
            <span class="attr-col-base">基础值</span>
            <span class="attr-col-final">装备后</span>
            <span class="attr-col-delta">+装备加成</span>
          </div>
          <div class="attr-row" v-for="row in resistCompare" :key="row.key">
            <span class="attr-col-label">{{ row.label }}</span>
            <span class="attr-col-base">{{ row.base }}%</span>
            <span class="attr-col-final">{{ row.final }}%</span>
            <span class="attr-col-delta" :class="{ 'is-zero': row.delta === 0 }">+{{ row.delta }}%</span>
          </div>
        </div>
      </div>

      <!-- 资源信息 -->
      <div class="resource-stats">
        <h4 class="sub-title">资源信息</h4>
        <div class="resource-grid">
          <div class="resource-item">
            <span class="resource-label">灵力</span>
            <span class="resource-value">{{ Math.floor(playerStore.spirit) }}</span>
          </div>
          <div class="resource-item">
            <span class="resource-label">灵石</span>
            <span class="resource-value">{{ playerStore.spiritStones }}</span>
          </div>
          <div class="resource-item">
            <span class="resource-label">强化石</span>
            <span class="resource-value">{{ playerStore.reinforceStones }}</span>
          </div>
          <div class="resource-item">
            <span class="resource-label">洗练石</span>
            <span class="resource-value">{{ playerStore.refinementStones }}</span>
          </div>
          <div class="resource-item">
            <span class="resource-label">灵力倍率</span>
            <span class="resource-value">x{{ playerStore.spiritRate.toFixed(1) }}</span>
          </div>
          <div class="resource-item">
            <span class="resource-label">幸运值</span>
            <span class="resource-value">{{ playerStore.luck }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 灵宠增益 -->
    <div class="pet-card glass-card" v-if="playerStore.activePet">
      <h3 class="section-title">
        灵宠增益
        <span class="pet-name">{{ activePetInfo.name }}</span>
        <span class="pet-rarity" :style="{ color: activePetInfo.color }">{{ activePetInfo.rarityName }}</span>
      </h3>
      <div class="pet-grid">
        <div class="pet-item">
          <span class="pet-label">攻击加成</span>
          <span class="pet-value">+{{ (petBonus.attack * 100).toFixed(1) }}%</span>
        </div>
        <div class="pet-item">
          <span class="pet-label">生命加成</span>
          <span class="pet-value">+{{ (petBonus.health * 100).toFixed(1) }}%</span>
        </div>
        <div class="pet-item">
          <span class="pet-label">防御加成</span>
          <span class="pet-value">+{{ (petBonus.defense * 100).toFixed(1) }}%</span>
        </div>
        <div class="pet-item">
          <span class="pet-label">暴击率</span>
          <span class="pet-value">+{{ (petBonus.critRate * 100).toFixed(1) }}%</span>
        </div>
        <div class="pet-item">
          <span class="pet-label">连击率</span>
          <span class="pet-value">+{{ (petBonus.comboRate * 100).toFixed(1) }}%</span>
        </div>
        <div class="pet-item">
          <span class="pet-label">吸血率</span>
          <span class="pet-value">+{{ (petBonus.vampireRate * 100).toFixed(1) }}%</span>
        </div>
      </div>
      <p class="pet-note">注：灵宠加成已并入上方「基础属性」，此处单独列出其增益占比。</p>
    </div>
    <div v-else class="pet-card pet-empty glass-card">
      <span class="pet-empty-icon">🐾</span>
      <span>未出战灵宠 · 出战后其加成将并入上方基础属性并计入 Build</span>
    </div>

    <!-- 修炼系统 -->
    <div class="cultivation-card glass-card">
      <h3 class="section-title">修炼突破</h3>
      <div class="action-buttons">
        <button
          class="btn btn-primary"
          :class="{ disabled: playerStore.spirit < cultivationCost }"
          @click="cultivate"
        >
          <span>打坐修炼</span>
          <span class="btn-cost">消耗 {{ cultivationCost }} 灵力</span>
        </button>
        <button
          class="btn"
          :class="isAutoCultivating ? 'btn-warning' : 'btn-success'"
          @click="toggleAutoCultivation"
        >
          <span>{{ isAutoCultivating ? '停止自动' : '自动修炼' }}</span>
        </button>
        
      </div>

      <div class="cultivation-detail">
        <div class="detail-item">
          <span class="detail-label">修炼效率</span>
          <span class="detail-value">{{ cultivationGain }} 修为/次</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">灵力获取</span>
          <span class="detail-value">{{ (baseGainRate * playerStore.spiritRate).toFixed(1) }} /秒</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">突破次数</span>
          <span class="detail-value">{{ playerStore.breakthroughCount }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">修炼时长</span>
          <span class="detail-value">{{ playerStore.totalCultivationTime }}</span>
        </div>
      </div>

      <div class="log-section">
        <h4 class="sub-title">修炼日志</h4>
        <log-panel ref="logRef" />
      </div>
    </div>

    <!-- 转生系统 -->
    <div class="rebirth-card glass-card">
      <h3 class="section-title">转生渡劫</h3>
      <p class="rebirth-desc">
        达到50级后可转生，重置等级但获得永久属性加成。每次转生加成更加强大。
      </p>
      <div v-if="playerStore.rebirthCount > 0" class="rebirth-bonus-display">
        <div class="bonus-item">
          <span class="bonus-label">攻击加成</span>
          <span class="bonus-value">+{{ playerStore.rebirthBonus.attack }}</span>
        </div>
        <div class="bonus-item">
          <span class="bonus-label">生命加成</span>
          <span class="bonus-value">+{{ playerStore.rebirthBonus.health }}</span>
        </div>
        <div class="bonus-item">
          <span class="bonus-label">防御加成</span>
          <span class="bonus-value">+{{ playerStore.rebirthBonus.defense }}</span>
        </div>
        <div class="bonus-item">
          <span class="bonus-label">速度加成</span>
          <span class="bonus-value">+{{ playerStore.rebirthBonus.speed }}</span>
        </div>
        <div class="bonus-item">
          <span class="bonus-label">修炼效率</span>
          <span class="bonus-value">+{{ (playerStore.rebirthBonus.cultivationRate * 100).toFixed(0) }}%</span>
        </div>
        <div class="bonus-item">
          <span class="bonus-label">灵力效率</span>
          <span class="bonus-value">+{{ (playerStore.rebirthBonus.spiritRate * 100).toFixed(0) }}%</span>
        </div>
      </div>
      <button
        class="btn btn-rebirth"
        :class="{ disabled: playerStore.level < 50 }"
        @click="tryRebirth"
      >
        <span>{{ playerStore.level >= 50 ? '转生渡劫' : `需达到50级 (当前${playerStore.level}级)` }}</span>
      </button>
      <div v-if="playerStore.rebirthCount > 0" class="rebirth-count">
        当前为第 <span class="rebirth-num">{{ playerStore.rebirthCount }}</span> 世
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
import { useMessage, useDialog } from 'naive-ui'
import { getRealmName, getRealmColor } from '../plugins/realm'
import LogPanel from '../components/LogPanel.vue'
import BreakthroughEffect from '../components/BreakthroughEffect.vue'

const playerStore = usePlayerStore()
const message = useMessage()
const dialog = useDialog()
const logRef = ref(null)
const showBreakthroughEffect = ref(false)
const breakthroughRealm = ref('')
const breakthroughColor = ref('#DAA520')

// 灵宠增益展示：基础属性已含出战灵宠，此处单独列出其加成占比
// 注意：getPetBonus 是 Pinia getter（派生状态），必须直接取值 playerStore.getPetBonus，不能加 () 调用，否则会抛 TypeError 导致人物界面卡死
const petRarityMap = {
  mortal: { rarityName: '凡品灵宠', color: '#32CD32' },
  spiritual: { rarityName: '灵品灵宠', color: '#1E90FF' },
  mystic: { rarityName: '玄品灵宠', color: '#9932CC' },
  celestial: { rarityName: '仙品灵宠', color: '#FFD700' },
  divine: { rarityName: '神品灵宠', color: '#FF0000' }
}
const petBonus = computed(() => playerStore.getPetBonus)
const activePetInfo = computed(() => {
  const p = playerStore.activePet
  if (!p) return { name: '', rarityName: '', color: '#aaa' }
  return { name: p.name, ...(petRarityMap[p.rarity] || { rarityName: p.rarity, color: '#aaa' }) }
})

// 人物属性对比：基础值（裸身·含出战灵宠） vs 装备后最终值 vs 装备/套装增量
const attrLabelMap = { attack: '攻击', health: '生命', defense: '防御', speed: '速度' }
const combatLabelMap = {
  critRate: '暴击率', comboRate: '连击率', counterRate: '反击率',
  stunRate: '眩晕率', dodgeRate: '闪避率', vampireRate: '吸血率'
}
const resistLabelMap = {
  critResist: '抗暴击', comboResist: '抗连击', counterResist: '抗反击',
  stunResist: '抗眩晕', dodgeResist: '抗闪避', vampireResist: '抗吸血'
}
const BASE_ATTR_KEYS = ['attack', 'health', 'defense', 'speed']
const COMBAT_KEYS = ['critRate', 'comboRate', 'counterRate', 'stunRate', 'dodgeRate', 'vampireRate']
const RESIST_KEYS = ['critResist', 'comboResist', 'counterResist', 'stunResist', 'dodgeResist', 'vampireResist']

const baseCompare = computed(() => BASE_ATTR_KEYS.map(k => {
  const base = playerStore.nakedBaseAttributes[k] || 0
  const final = playerStore.baseAttributes[k] || 0
  return { key: k, label: attrLabelMap[k], base: Math.floor(base), final: Math.floor(final), delta: Math.floor(final - base) }
}))
const combatCompare = computed(() => COMBAT_KEYS.map(k => {
  const base = playerStore.nakedCombatAttributes[k] || 0
  const final = playerStore.combatAttributes[k] || 0
  return {
    key: k, label: combatLabelMap[k],
    base: +(base * 100).toFixed(1),
    final: +(final * 100).toFixed(1),
    delta: +((final - base) * 100).toFixed(1)
  }
}))
const resistCompare = computed(() => RESIST_KEYS.map(k => {
  const base = playerStore.nakedCombatResistance[k] || 0
  const final = playerStore.combatResistance[k] || 0
  return {
    key: k, label: resistLabelMap[k],
    base: +(base * 100).toFixed(1),
    final: +(final * 100).toFixed(1),
    delta: +((final - base) * 100).toFixed(1)
  }
}))

const baseGainRate = 1
const baseCultivationCost = 8
const baseCultivationGain = 3
const autoGainInterval = 500
const extraCultivationChance = 0.35

// 优化后的修炼曲线：消耗增长放缓（1.5→1.25），修为获取加快（1.2→1.28）
const getCurrentCultivationCost = () => Math.floor(baseCultivationCost * Math.pow(1.25, playerStore.level - 1))
const getCurrentCultivationGain = () => Math.floor(baseCultivationGain * Math.pow(1.28, playerStore.level - 1))

const cultivationCost = computed(() => getCurrentCultivationCost())
const cultivationGain = computed(() => getCurrentCultivationGain())

const isAutoCultivating = ref(false)
const cultivationTimer = ref(null)
const cultivationWorker = ref(null)

const showMessage = (type, content) => logRef.value?.addLog(type, content)

const calculateCultivationGain = () => {
  let gain = cultivationGain.value
  if (Math.random() < extraCultivationChance * playerStore.luck) {
    gain *= 2
    showMessage('success', '福缘不错，获得双倍修为！')
  }
  return gain
}

const canBreakthrough = () => playerStore.cultivation >= playerStore.maxCultivation

const initCultivationWorker = () => {
  cultivationWorker.value = new Worker(new URL('../workers/cultivation.js', import.meta.url), { type: 'module' })
  cultivationWorker.value.onmessage = ({ data }) => {
    if (data.type === 'error') { showMessage('error', data.message); return }
    if (data.type === 'success') {
      const { spiritCost, cultivationGain: gain, doubleGainTimes } = data.result
      playerStore.regenerateSpirit() // 先恢复灵力
      playerStore.spirit -= spiritCost
      playerStore.cultivate(gain)
      if (doubleGainTimes > 0) showMessage('success', `获得${doubleGainTimes}次双倍修为！`)
      if (canBreakthrough() && playerStore.tryBreakthrough()) {
        showMessage('success', `突破成功！进入${playerStore.realm}！`)
      } else if (canBreakthrough()) {
        showMessage('info', '已达到突破条件')
      } else {
        showMessage('success', '修炼成功！')
      }
    }
  }
}

const cultivate = () => {
  playerStore.regenerateSpirit() // 先恢复灵力
  const currentCost = getCurrentCultivationCost()
  if (playerStore.spirit >= currentCost) {
    const oldLevel = playerStore.level
    playerStore.spirit -= currentCost
    playerStore.cultivate(calculateCultivationGain())
    if (playerStore.level !== oldLevel) {
      showMessage('success', `突破成功！进入${playerStore.realm}！`)
      breakthroughRealm.value = getRealmName(playerStore.level)?.name || playerStore.realm
      breakthroughColor.value = getRealmColor(playerStore.level)
      showBreakthroughEffect.value = true
    } else {
      showMessage('success', '修炼成功！')
    }
  } else {
    showMessage('error', '灵力不足！')
  }
}

const toggleAutoCultivation = () => {
  if (isAutoCultivating.value) {
    isAutoCultivating.value = false
    if (cultivationTimer.value) { clearInterval(cultivationTimer.value); cultivationTimer.value = null }
  } else {
    isAutoCultivating.value = true
    cultivationTimer.value = setInterval(() => {
      playerStore.regenerateSpirit() // 先恢复灵力
      const currentCost = getCurrentCultivationCost()
      if (playerStore.spirit >= currentCost) {
        playerStore.spirit -= currentCost
        playerStore.cultivate(cultivationGain.value)
      }
    }, autoGainInterval)
  }
}

const tryRebirth = () => {
  if (playerStore.level < 50) return
  dialog.warning({
    title: '转生渡劫',
    content: `转生将重置等级为1，但保留灵石、装备和物品。第${playerStore.rebirthCount + 1}次转生将获得：
      \n攻击+${5 * (playerStore.rebirthCount + 1)}、生命+${50 * (playerStore.rebirthCount + 1)}
      \n防御+${3 * (playerStore.rebirthCount + 1)}、速度+${2 * (playerStore.rebirthCount + 1)}
      \n修炼效率+${10 * (playerStore.rebirthCount + 1)}%、灵力效率+${10 * (playerStore.rebirthCount + 1)}%
      \n\n确定要转生吗？`,
    positiveText: '确认转生',
    negativeText: '取消',
    onPositiveClick: () => {
      const result = playerStore.rebirth()
      if (result.success) {
        message.success(result.message)
        showMessage('success', result.message)
        isAutoCultivating.value = false
        if (cultivationTimer.value) { clearInterval(cultivationTimer.value); cultivationTimer.value = null }
      } else {
        message.error(result.message)
      }
    }
  })
}

onMounted(() => { initCultivationWorker() })
onUnmounted(() => {
  if (cultivationTimer.value) { clearInterval(cultivationTimer.value); cultivationTimer.value = null }
  if (cultivationWorker.value) { cultivationWorker.value.terminate(); cultivationWorker.value = null }
  isAutoCultivating.value = false
})
</script>

<style scoped>
.character-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100%;
}

/* 人物信息卡 */
.char-card {
  padding: 16px;
  border-radius: 12px;
}
.char-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}
.char-avatar {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B4513, #DAA520);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
  color: #fff;
  font-weight: bold;
}
.char-info {
  flex: 1;
}
.char-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.char-name {
  margin: 0;
  font-size: 20px;
  color: #DAA520;
}
.rebirth-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #FF6347, #FFD700);
  border-radius: 4px;
  font-size: 11px;
  color: #fff;
  font-weight: bold;
}
.char-realm {
  font-size: 14px;
  margin: 4px 0;
}
.char-level {
  font-size: 13px;
  color: #888;
}
.build-strength {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 4px 8px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  inline-size: fit-content;
}
.build-label {
  font-size: 12px;
  color: #FFD700;
}
.build-value {
  font-size: 16px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

/* 修为进度 */
.cultivation-progress {
  margin-top: 8px;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 13px;
}
.progress-label { color: #888; }
.progress-value { color: #fff; font-weight: bold; }
.progress-bar-container {
  height: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #8B4513, #DAA520);
  border-radius: 5px;
  transition: width 0.5s;
  position: relative;
}
.progress-glow {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.progress-percentage {
  text-align: right;
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

/* 属性面板 */
.stats-card {
  padding: 16px;
  border-radius: 12px;
}
.section-title {
  margin: 0 0 12px;
  font-size: 16px;
  color: #DAA520;
  font-weight: bold;
}
.sub-title {
  margin: 12px 0 8px;
  font-size: 14px;
  color: #aaa;
  font-weight: bold;
}
.attr-block { margin-top: 12px; }
.attr-table {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.attr-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr;
  align-items: center;
  padding: 7px 10px;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 6px;
  font-size: 13px;
}
.attr-head {
  background: rgba(218, 165, 32, 0.12);
  color: #b9c0d4;
  font-weight: bold;
}
.attr-col-label { color: #c9d1e8; }
.attr-col-base { color: #9aa3b8; text-align: right; }
.attr-col-final { color: #DAA520; font-weight: bold; text-align: right; }
.attr-col-delta { color: #66BB6A; font-weight: bold; text-align: right; }
.attr-col-delta.is-zero { color: #5a6378; font-weight: normal; }

.resource-stats { margin-top: 12px; }
.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.resource-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 6px;
}
.resource-label { font-size: 11px; color: #888; }
.resource-value { font-size: 14px; color: #DAA520; font-weight: bold; }

.base-note {
  margin: -6px 0 10px;
  font-size: 11px;
  color: #8b93a8;
  line-height: 1.4;
}

/* 灵宠增益 */
.pet-card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(140, 120, 255, 0.25);
  background: linear-gradient(135deg, rgba(140, 120, 255, 0.08), rgba(20, 16, 38, 0.6));
}
.pet-card .section-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pet-name {
  font-size: 15px;
  color: #fff;
}
.pet-rarity {
  font-size: 12px;
  font-weight: bold;
  padding: 1px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
}
.pet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 10px;
}
.pet-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 6px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 6px;
  border: 1px solid rgba(140, 120, 255, 0.15);
}
.pet-label { font-size: 11px; color: #8b93a8; }
.pet-value {
  font-size: 15px;
  color: #9fe0ff;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(159, 224, 255, 0.4);
}
.pet-note {
  margin: 10px 0 0;
  font-size: 11px;
  color: #8b93a8;
  line-height: 1.4;
}
.pet-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  font-size: 12px;
  color: #8b93a8;
  border-style: dashed;
}
.pet-empty-icon { font-size: 18px; }

/* 修炼系统 */
.cultivation-card {
  padding: 16px;
  border-radius: 12px;
}
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  min-height: 48px;
}
.btn:disabled, .btn.disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary { background: linear-gradient(135deg, #8B4513, #DAA520); color: #fff; }
.btn-success { background: linear-gradient(135deg, #2E7D32, #66BB6A); color: #fff; }
.btn-warning { background: linear-gradient(135deg, #E65100, #FF8F00); color: #fff; }
.btn-info { background: linear-gradient(135deg, #1565C0, #42A5F5); color: #fff; }
.btn-cost { font-size: 11px; opacity: 0.8; }

.cultivation-detail {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}
.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-size: 13px;
}
.detail-label { color: #888; }
.detail-value { color: #fff; font-weight: bold; }

.log-section { margin-top: 8px; }

/* 转生系统 */
.rebirth-card {
  padding: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(255, 215, 0, 0.05));
}
.rebirth-desc {
  font-size: 13px;
  color: #888;
  margin: 0 0 12px;
  line-height: 1.5;
}
.rebirth-bonus-display {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}
.bonus-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
  background: rgba(255, 215, 0, 0.08);
  border-radius: 6px;
  border: 1px solid rgba(255, 215, 0, 0.15);
}
.bonus-label { font-size: 10px; color: #888; }
.bonus-value { font-size: 14px; color: #FFD700; font-weight: bold; }

.btn-rebirth {
  width: 100%;
  background: linear-gradient(135deg, #FF6347, #FFD700);
  color: #fff;
  font-weight: bold;
  font-size: 16px;
  padding: 14px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-rebirth:hover:not(.disabled) {
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}
.btn-rebirth.disabled { opacity: 0.4; cursor: not-allowed; }

.rebirth-count {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #888;
}
.rebirth-num {
  color: #FFD700;
  font-weight: bold;
  font-size: 18px;
}
</style>
