<template>
  <!-- 灵宠详情弹窗（通用复用组件，供 Inventory / Cultivation 等页面调用） -->
  <div v-if="pet" class="simple-modal" @click.self="emit('close')">
    <div class="simple-modal-content">
      <div class="modal-header">
        <h3>灵宠详情</h3>
        <button class="btn-small" @click="emit('close')">关闭</button>
      </div>
      <div v-if="currentPet" class="modal-body">
        <div class="detail-row">
          <span>名称</span><span>{{ currentPet.name }}</span>
        </div>
        <div class="detail-row">
          <span>品质</span>
          <span class="simple-tag" :style="{ color: petRarities[currentPet.rarity].color }">
            {{ petRarities[currentPet.rarity].name }}
          </span>
        </div>
        <div class="detail-row">
          <span>等级</span><span>{{ currentPet.level || 1 }}</span>
        </div>
        <div class="detail-row">
          <span>星级</span><span>{{ currentPet.star || 0 }}</span>
        </div>
        <div class="detail-row">
          <span>境界</span><span>{{ Math.floor((currentPet.star || 0) / 5) }}阶</span>
        </div>
        <div class="simple-divider">属性加成</div>
        <div class="detail-row">
          <span>攻击加成</span><span>+{{ (getPetBonus(currentPet).attack * 100).toFixed(1) }}%</span>
        </div>
        <div class="detail-row">
          <span>防御加成</span><span>+{{ (getPetBonus(currentPet).defense * 100).toFixed(1) }}%</span>
        </div>
        <div class="detail-row">
          <span>生命加成</span><span>+{{ (getPetBonus(currentPet).health * 100).toFixed(1) }}%</span>
        </div>
        <div class="modal-actions">
          <button
            class="btn-small"
            @click="openPetPortrait(currentPet)"
            title="查看灵宠立绘（可在立绘中切换皮肤）"
          >
            🖼️ 立绘
          </button>
          <button
            class="btn-small btn-primary"
            @click="upgradePet(currentPet)"
            :disabled="!canUpgrade(currentPet)"
          >
            升级({{ getUpgradeCost(currentPet) }}精华)
          </button>
          <button
            class="btn-small btn-warning"
            @click="evolvePet(currentPet)"
            :disabled="!canEvolve(currentPet)"
            :title="`需要 ${getEvolveCost(currentPet)} 升星碎片`"
          >
            升星({{ getEvolveCost(currentPet) }}碎片)
          </button>
          <button
            class="btn-small btn-danger"
            @click="confirmReleasePet(currentPet)"
            :disabled="equippedPetIds.has(currentPet.uid || currentPet.id)"
            :title="equippedPetIds.has(currentPet.uid || currentPet.id) ? '出战或装备中的灵宠无法放生' : ''"
          >
            {{ equippedPetIds.has(currentPet.uid || currentPet.id) ? '装备中' : '放生' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 灵宠立绘弹窗 -->
  <PetPortraitModal
    v-if="showPetPortrait"
    :pet="portraitPet"
    @close="showPetPortrait = false"
    @update-skin="onPetSkinChange"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { usePlayerStore, computePetMultiplier } from '../stores/player'
import PetPortraitModal from './PetPortraitModal.vue'

const props = defineProps({
  pet: { type: Object, default: null }
})
const emit = defineEmits(['close'])

const playerStore = usePlayerStore()
const message = useMessage()

// 灵宠品质配置
const petRarities = {
  divine: { name: '神品', color: '#FF0000', probability: 0.02, essenceBonus: 50 },
  celestial: { name: '仙品', color: '#FFD700', probability: 0.08, essenceBonus: 30 },
  mystic: { name: '玄品', color: '#9932CC', probability: 0.15, essenceBonus: 20 },
  spiritual: { name: '灵品', color: '#1E90FF', probability: 0.25, essenceBonus: 10 },
  mortal: { name: '凡品', color: '#32CD32', probability: 0.5, essenceBonus: 5 }
}

// 升星后用于刷新灵宠引用，使详情弹窗内显示同步更新
const localPet = ref(null)
const currentPet = computed(() => localPet.value || props.pet)

// 灵宠立绘弹窗
const showPetPortrait = ref(false)
const portraitPet = ref(null)
const openPetPortrait = pet => {
  if (!pet) return
  portraitPet.value = pet
  showPetPortrait.value = true
}
// 立绘切换皮肤 → 持久化到灵宠 item
const onPetSkinChange = ({ pet, skin }) => {
  if (!pet) return
  playerStore.setPetCurrentSkin(pet.id, skin)
}

// 收集被宗门成员装备 / 出战的灵宠ID
const equippedPetIds = computed(() => {
  const ids = new Set()
  if (playerStore.activePet) {
    ids.add(playerStore.activePet.uid || playerStore.activePet.id)
  }
  playerStore.sectMembers.forEach(m => {
    if (m.equippedPet) {
      ids.add(m.equippedPet.uid || m.equippedPet.id)
    }
  })
  return ids
})

// 计算灵宠属性加成（使用 store 共享函数 computePetMultiplier，确保面板显示 = 实际生效）
const getPetBonus = pet => {
  if (!pet) return { attack: 0, defense: 0, health: 0 }
  const petMult = computePetMultiplier(pet)
  const totalGrowth = petMult - 1
  return {
    attack: totalGrowth,
    defense: totalGrowth,
    health: totalGrowth
  }
}

// 获取升级所需精华数量
const getUpgradeCost = pet => {
  return (pet.level || 1) * 10
}

// 检查是否可以升级
const canUpgrade = pet => {
  const cost = getUpgradeCost(pet)
  return playerStore.petEssence >= cost
}

// 获取升星所需碎片数量
const getEvolveCost = pet => {
  if (!pet) return 0
  return playerStore.getEvolveCost(pet)
}

// 检查是否可以升星
const canEvolve = pet => {
  if (!pet) return false
  return playerStore.petFragments >= getEvolveCost(pet)
}

// 升级灵宠
const upgradePet = pet => {
  const result = playerStore.upgradePet(pet, getUpgradeCost(pet))
  if (result.success) {
    message.success(result.message)
  } else {
    message.error(result.message)
  }
}

// 从 store 重新拉取最新灵宠对象（兼容 items / activePet / sectMembers.equippedPet）
const refreshPet = pet => {
  const petKey = pet.uid || pet.id
  const freshPet = playerStore.items.find(item => (item.uid || item.id) === petKey && item.type === 'pet')
    || (playerStore.activePet && (playerStore.activePet.uid || playerStore.activePet.id) === petKey ? playerStore.activePet : null)
    || playerStore.sectMembers.reduce((acc, m) => acc || (m.equippedPet && (m.equippedPet.uid || m.equippedPet.id) === petKey ? m.equippedPet : null), null)
  if (freshPet) localPet.value = freshPet
}

// 升星灵宠（升星后保持详情弹窗打开，便于连续升星 / 查看属性变化）
const evolvePet = pet => {
  const result = playerStore.evolvePet(pet)
  if (result.success) {
    message.success(result.message)
    // 重新从 store 拉取最新灵宠对象，确保引用同步（响应式属性刷新）
    refreshPet(pet)
  } else {
    message.error(result.message)
  }
}

// 放生灵宠（已装备 / 出战灵宠按钮已 disabled，这里再次以 store 校验兜底）
const confirmReleasePet = pet => {
  const result = playerStore.releasePet(pet.uid || pet.id)
  if (result.success) {
    message.success(result.message)
    // 放生成功后灵宠已从 store 移除，关闭详情弹窗
    emit('close')
  } else {
    message.error(result.message)
  }
}
</script>

<style scoped>
.btn-small {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  background: rgba(139, 69, 19, 0.4);
  color: #F5DEB3;
  transition: all 0.2s;
}

.btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-small.btn-primary {
  background: rgba(34, 139, 34, 0.6);
  color: #fff;
}

.btn-small.btn-danger {
  background: rgba(220, 53, 69, 0.5);
  color: #fff;
}

.btn-small.btn-warning {
  background: rgba(218, 165, 32, 0.6);
  color: #0D0D12;
}

.simple-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  background: rgba(0, 0, 0, 0.3);
}

/* 弹窗 */
.simple-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  /* 移动端留足安全区 */
  box-sizing: border-box;
}

.simple-modal-content {
  background: #1A1A2E;
  border: 1px solid rgba(139, 69, 19, 0.4);
  border-radius: 14px;
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 60px);
  overflow-y: auto;
  padding: 18px 20px 24px;
  /* 确保弹窗内容不超出可视区域 */
  -webkit-overflow-scrolling: touch;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(139, 69, 19, 0.3);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #F5DEB3;
}

/* 关闭按钮增大点击区域 */
.modal-header .btn-small {
  min-width: 56px;
  min-height: 36px;
  padding: 8px 16px;
  font-size: 14px;
  flex-shrink: 0;
}

.modal-body {
  font-size: 13px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #F5DEB3;
}

.detail-row span:first-child {
  color: #C9C4BA;
}

.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.simple-divider {
  text-align: center;
  margin: 12px 0;
  color: #DAA520;
  font-size: 13px;
  position: relative;
}

.simple-divider::before,
.simple-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
  background: rgba(139, 69, 19, 0.3);
}

.simple-divider::before { left: 0; }
.simple-divider::after { right: 0; }
</style>
