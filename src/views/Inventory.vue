<template>
  <div class="inventory-page">
    <div class="inventory-tabs">
      <div class="tab-header">
        <div
          v-for="tab in tabs"
          :key="tab.name"
          class="tab-item"
          :class="{ active: activeTab === tab.name }"
          @click="activeTab = tab.name"
        >
          {{ tab.label }}
        </div>
      </div>
      <div class="tab-content">
        <!-- 装备 -->
        <div v-if="activeTab === 'equipment'" class="tab-pane">
          <div class="equip-toolbar">
            <button class="btn-small btn-warning all-equip-btn" @click="showEquipmentList('all')">
              📦 全部装备
            </button>
            <button class="btn-small btn-primary auto-equip-btn" @click="handleAutoEquipBest" :disabled="!hasEquipableItems">
              ⚡ 一键装备最强
            </button>
          </div>
          <div class="simple-grid" :class="{ mobile: isMobile }">
            <div
              v-for="(name, type) in equipmentTypes"
              :key="type"
              class="simple-card"
              @click="showEquipmentList(type)"
            >
              <div class="card-header">
                <span>{{ name }}</span>
                <div v-if="playerStore.equippedArtifacts[type]" class="card-actions">
                  <button
                    class="btn-small btn-info"
                    @click.stop="showEquipmentDetails(playerStore.equippedArtifacts[type])"
                  >
                    详情
                  </button>
                  <button
                    class="btn-small btn-danger"
                    @click.stop="unequipItem(type)"
                  >
                    卸下
                  </button>
                </div>
              </div>
              <div class="card-body">
                <p v-if="playerStore.equippedArtifacts[type]">
                  {{ playerStore.equippedArtifacts[type].name }}
                </p>
                <p v-else>未装备</p>
              </div>
            </div>
          </div>
        </div>
        <!-- 灵草 -->
        <div v-if="activeTab === 'herbs'" class="tab-pane">
          <div v-if="groupedHerbs.length" class="simple-grid" :class="{ mobile: isMobile }">
            <div v-for="herb in groupedHerbs" :key="herb.id" class="simple-card">
              <div class="card-header">
                <span>{{ herb.name }}({{ herb.count }})</span>
              </div>
              <div class="card-body">
                <p>{{ herb.description }}</p>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">暂无灵草</div>
        </div>
        <!-- 丹药 -->
        <div v-if="activeTab === 'pills'" class="tab-pane">
          <div v-if="groupedPills.length" class="simple-grid" :class="{ mobile: isMobile }">
            <div v-for="pill in groupedPills" :key="pill.id" class="simple-card">
              <div class="card-header">
                <span>{{ pill.name }}({{ pill.count }})</span>
                <button class="btn-small btn-primary" @click="usePill(pill)">服用</button>
              </div>
              <div class="card-body">
                <p>{{ pill.description }}</p>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">暂无丹药</div>
        </div>
        <!-- 丹方 -->
        <div v-if="activeTab === 'formulas'" class="tab-pane">
          <div v-if="allFormulas.length" class="simple-grid" :class="{ mobile: isMobile }">
            <div v-for="formula in allFormulas" :key="formula.id" class="simple-card">
              <div class="card-header">
                <span>{{ formula.name }}</span>
                <span class="tag-group">
                  <span class="simple-tag" :class="formula.isComplete ? 'success' : 'warning'">
                    {{ formula.isComplete ? '完整' : '残缺' }}
                  </span>
                  <span class="simple-tag info">{{ pillGrades[formula.grade].name }}</span>
                  <span class="simple-tag warning">{{ pillTypes[formula.type].name }}</span>
                </span>
              </div>
              <div class="card-body">
                <p>{{ formula.description }}</p>
                <div v-if="!formula.isComplete" class="progress-line">
                  <div
                    class="progress-fill"
                    :style="{ width: ((formula.fragments / formula.fragmentsNeeded) * 100) + '%' }"
                  ></div>
                </div>
                <p v-if="!formula.isComplete" class="progress-text">
                  收集进度: {{ formula.fragments }}/{{ formula.fragmentsNeeded }}
                </p>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">暂无丹方</div>
        </div>
        <!-- 灵宠 -->
        <div v-if="activeTab === 'pets'" class="tab-pane">
          <div class="pet-actions">
            <select v-model="selectedRarityToRelease" class="simple-select">
              <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <button
              class="btn-small btn-success"
              @click="sortPetsByScore"
              :disabled="!playerStore.items.filter(item => item.type === 'pet').length"
            >
              🔼 按评分排序
            </button>
            <button
              class="btn-small"
              @click="showBatchReleaseConfirm = true"
              :disabled="!playerStore.items.filter(item => item.type === 'pet').length"
            >
              一键放生
            </button>
          </div>
          <div v-if="filteredPets.length > pageSize" class="pagination-info">
            共 {{ filteredPets.length }} 只灵宠，当前第 {{ currentPage }} 页
            <button class="btn-small" :disabled="currentPage <= 1" @click="currentPage--">上一页</button>
            <button class="btn-small" :disabled="currentPage * pageSize >= filteredPets.length" @click="currentPage++">下一页</button>
          </div>
          <div v-if="displayPets.length" class="simple-grid" :class="{ mobile: isMobile }">
            <div v-for="pet in displayPets" :key="pet.id" class="simple-card">
              <div class="card-header">
                <span>{{ pet.name }}</span>
                <button class="btn-small btn-primary" @click="showPetDetails(pet)">
                  详情
                </button>
              </div>
              <div class="card-body">
                <p>{{ pet.description }}</p>
                <div class="pet-info">
                  <span class="simple-tag" :style="{ color: petRarities[pet.rarity].color }">
                    {{ petRarities[pet.rarity].name }}
                  </span>
                  <span>等级: {{ pet.level || 1 }}</span>
                  <span>星级: {{ pet.star || 0 }}</span>
                  <span class="pet-score">评分: {{ calculatePetScore(pet) }}</span>
                  <button class="btn-small" @click="showPetDetails(pet)">详情</button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">暂无灵宠</div>
        </div>

      </div>
    </div>
  </div>

  <!-- 灵宠详情弹窗 -->
  <div v-if="showPetModal" class="simple-modal" @click.self="showPetModal = false">
    <div class="simple-modal-content">
      <div class="modal-header">
        <h3>灵宠详情</h3>
        <button class="btn-small" @click="showPetModal = false">关闭</button>
      </div>
      <div v-if="selectedPet" class="modal-body">
        <div class="detail-row">
          <span>名称</span><span>{{ selectedPet.name }}</span>
        </div>
        <div class="detail-row">
          <span>品质</span>
          <span class="simple-tag" :style="{ color: petRarities[selectedPet.rarity].color }">
            {{ petRarities[selectedPet.rarity].name }}
          </span>
        </div>
        <div class="detail-row">
          <span>等级</span><span>{{ selectedPet.level || 1 }}</span>
        </div>
        <div class="detail-row">
          <span>星级</span><span>{{ selectedPet.star || 0 }}</span>
        </div>
        <div class="detail-row">
          <span>境界</span><span>{{ Math.floor((selectedPet.star || 0) / 5) }}阶</span>
        </div>
        <div class="simple-divider">属性加成</div>
        <div class="detail-row">
          <span>攻击加成</span><span>+{{ (getPetBonus(selectedPet).attack * 100).toFixed(1) }}%</span>
        </div>
        <div class="detail-row">
          <span>防御加成</span><span>+{{ (getPetBonus(selectedPet).defense * 100).toFixed(1) }}%</span>
        </div>
        <div class="detail-row">
          <span>生命加成</span><span>+{{ (getPetBonus(selectedPet).health * 100).toFixed(1) }}%</span>
        </div>
        <div class="modal-actions">
          <button
            class="btn-small btn-primary"
            @click="upgradePet(selectedPet)"
            :disabled="!canUpgrade(selectedPet)"
          >
            升级({{ getUpgradeCost(selectedPet) }}精华)
          </button>
          <select v-model="selectedFoodPet" class="simple-select">
            <option value="">选择升星材料</option>
            <option v-for="opt in getAvailableFoodPets(selectedPet)" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <button class="btn-small btn-warning" @click="evolvePet(selectedPet)" :disabled="!selectedFoodPet">
            升星
          </button>
          <button class="btn-small btn-danger" @click="confirmReleasePet(selectedPet)">放生</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 批量放生确认弹窗 -->
  <div v-if="showBatchReleaseConfirm" class="simple-modal" @click.self="showBatchReleaseConfirm = false">
    <div class="simple-modal-content">
      <div class="modal-header"><h3>批量放生确认</h3></div>
      <p>
        确定要放生{{ selectedRarityToRelease === 'all' ? '所有' : petRarities[selectedRarityToRelease].name }}品阶的未出战灵宠吗？此操作不可撤销。
      </p>
      <div class="modal-actions">
        <button class="btn-small" @click="showBatchReleaseConfirm = false">取消</button>
        <button class="btn-small btn-danger" @click="batchReleasePets">确认放生</button>
      </div>
    </div>
  </div>

  <!-- 灵宠放生确认弹窗 -->
  <div v-if="showReleaseConfirm" class="simple-modal" @click.self="cancelReleasePet">
    <div class="simple-modal-content">
      <div class="modal-header"><h3>灵宠放生</h3></div>
      <p v-if="petToRelease">确定要放生 {{ petToRelease.name }} 吗？此操作不可撤销，且不会返还已消耗的道具。</p>
      <div class="modal-actions">
        <button class="btn-small" @click="cancelReleasePet">取消</button>
        <button class="btn-small btn-danger" @click="releasePet">确认放生</button>
      </div>
    </div>
  </div>

  <!-- 装备列表弹窗 -->
  <div v-if="showEquipmentModal" class="simple-modal" @click.self="showEquipmentModal = false">
    <div class="simple-modal-content wide">
      <div class="modal-header">
        <h3>{{ equipmentModalTitle }}</h3>
        <button class="btn-small" @click="showEquipmentModal = false">关闭</button>
      </div>
      <div class="modal-toolbar">
        <select v-model="selectedQuality" class="simple-select">
          <option v-for="opt in qualityOptions" :key="opt.value" :value="opt.value" :disabled="opt.disabled">
            {{ opt.label }}
          </option>
        </select>
        <button class="btn-small btn-success" :disabled="equipmentList.length === 0" @click="sortEquipmentByScore">
          🔼 按评分排序
        </button>
        <button class="btn-small btn-warning" :disabled="equipmentList.length === 0" @click="batchSellEquipments">
          一键出售
        </button>
      </div>
      <div v-if="equipmentList.length > 0" class="pagination-info">
        共 {{ filteredEquipmentList.length }} 件，当前第 {{ currentEquipmentPage }} 页
        <button class="btn-small" :disabled="currentEquipmentPage <= 1" @click="currentEquipmentPage--">上一页</button>
        <button class="btn-small" :disabled="currentEquipmentPage * equipmentPageSize >= filteredEquipmentList.length" @click="currentEquipmentPage++">下一页</button>
      </div>
      <div v-if="equipmentList.length" class="simple-grid" :class="{ mobile: isMobile }">
        <div
          v-for="equipment in equipmentList"
          :key="equipment.id"
          class="simple-card"
          @click="showEquipmentDetails(equipment)"
        >
          <div class="card-header">
            <span class="equip-name">{{ equipment.name }}</span>
            <button
              v-if="!isEquipped(equipment)"
              class="btn-small btn-equip"
              @click.stop="equipItem(equipment)"
              :disabled="(equipment.requiredRealm || 1) > playerStore.level"
            >装备</button>
            <button
              v-else
              class="btn-small btn-danger"
              @click.stop="unequipItem(equipment.slot || equipment.type)"
            >卸下</button>
          </div>
          <div class="card-body">
            <div class="equip-meta">
              <span class="simple-tag" :style="{ color: qualityInfoOf(equipment).color }">
                {{ qualityInfoOf(equipment).name }}
              </span>
              <span class="equip-score-badge">评分 {{ calculateEquipmentScore(equipment) }}</span>
            </div>
            <p class="equip-affix-preview">词条：{{ formatAffixNames(equipment.affixes) }}</p>
            <p>境界要求：{{ getRealmName(equipment.requiredRealm || 1).name }}</p>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">没有任何装备</div>
    </div>
  </div>

  <!-- 装备详情弹窗 -->
  <div v-if="showEquipmentDetailModal" class="simple-modal" @click.self="showEquipmentDetailModal = false">
    <div class="simple-modal-content">
      <div class="modal-header">
        <h3>{{ selectedEquipment?.name || '装备详情' }}</h3>
        <button class="btn-small" @click="showEquipmentDetailModal = false">关闭</button>
      </div>
      <div v-if="selectedEquipment" class="modal-body">
        <div class="detail-row">
          <span>品质</span>
          <span class="simple-tag" :style="{ color: qualityInfoOf(selectedEquipment).color }">
            {{ qualityInfoOf(selectedEquipment).name }}
          </span>
        </div>
        <div class="detail-row">
          <span>类型</span><span>{{ equipmentTypes[selectedEquipment.slot || selectedEquipment.type] }}</span>
        </div>
        <div class="detail-row">
          <span>强化等级</span><span>+{{ selectedEquipment.enhanceLevel || 0 }}</span>
        </div>
        <div class="detail-row">
          <span>装备评分</span><span class="equipment-score">{{ calculateEquipmentScore(selectedEquipment) }}</span>
        </div>
        <div v-if="selectedEquipment.setId" class="detail-row">
          <span>套装</span>
          <span class="set-tag" :style="{ color: getSetInfo(selectedEquipment.setId)?.color }">
            {{ getSetInfo(selectedEquipment.setId)?.name }}
          </span>
        </div>
        <div class="simple-divider">基础属性</div>
        <div v-for="(value, stat) in selectedEquipment.stats" :key="stat" class="detail-row">
          <span>{{ getStatName(stat) }}</span><span>{{ formatStatValue(stat, value) }}</span>
        </div>
        <div v-if="selectedEquipment.affixes && selectedEquipment.affixes.length > 0" class="affixes-section">
          <div class="simple-divider">词条</div>
          <div v-for="affix in selectedEquipment.affixes" :key="affix.id" class="affix-row">
            <span class="affix-name" :class="'affix-tier-' + affix.tier">{{ affix.name }}</span>
            <span>{{ getStatName(affix.stat) }} {{ affix.valueType === 'percent' ? '+' + (affix.value * 100).toFixed(1) + '%' : '+' + affix.value }}</span>
          </div>
        </div>
        <div v-if="selectedEquipment.setId" class="set-bonus-section">
          <div class="simple-divider">套装效果</div>
          <div v-for="bonus in getSetBonuses(selectedEquipment.setId)" :key="bonus.stat" class="set-bonus-row">
            <span>{{ bonus.label }}</span>
          </div>
        </div>
        <div v-if="equipmentComparison && selectedEquipment?.id != playerStore.equippedArtifacts[selectedEquipment?.slot]?.id" class="stats-comparison">
          <div class="simple-divider">属性对比</div>
          <table class="simple-table">
            <thead>
              <tr><th>属性</th><th>当前</th><th>选中</th><th>变化</th></tr>
            </thead>
            <tbody>
              <tr v-for="(comparison, stat) in equipmentComparison" :key="stat">
                <td>{{ getStatName(stat) }}</td>
                <td>{{ formatStatValue(stat, comparison.current) }}</td>
                <td>{{ formatStatValue(stat, comparison.selected) }}</td>
                <td :class="comparison.isPositive ? 'positive' : 'negative'">
                  {{ comparison.isPositive ? '+' : '' }}{{ formatStatValue(stat, comparison.diff) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-actions four-grid">
          <button
            class="btn-small btn-primary"
            @click="showEnhanceConfirm = true"
            :disabled="(selectedEquipment?.enhanceLevel || 0) >= 100"
          >
            强化
          </button>
          <button
            class="btn-small btn-info"
            :disabled="playerStore.refinementStones === 0"
            @click="showReforgePreConfirm = true"
          >
            洗练
          </button>
          <button
            v-if="selectedEquipment?.id != playerStore.equippedArtifacts[selectedEquipment?.slot || selectedEquipment?.type]?.id"
            class="btn-small"
            @click="equipItem(selectedEquipment)"
            :disabled="playerStore.level < (selectedEquipment?.requiredRealm || 1)"
          >
            装备
          </button>
          <button
            v-else
            class="btn-small"
            @click="unequipItem(selectedEquipment?.slot || selectedEquipment?.type)"
            :disabled="playerStore.level < (selectedEquipment?.requiredRealm || 1)"
          >
            卸下
          </button>
          <button
            class="btn-small btn-danger"
            @click="showSellDisassemble = true"
          >
            出售/分解
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 强化确认弹窗 -->
  <div v-if="showEnhanceConfirm" class="simple-modal" @click.self="showEnhanceConfirm = false">
    <div class="simple-modal-content">
      <div class="modal-header"><h3>装备强化</h3></div>
      <p>是否消耗 {{ ((selectedEquipment?.enhanceLevel || 0) + 1) * 10 }} 强化石强化装备？</p>
      <p>当前强化石数量：{{ playerStore.reinforceStones }}</p>
      <div class="modal-actions">
        <button class="btn-small" @click="showEnhanceConfirm = false">取消</button>
        <button
          class="btn-small btn-primary"
          @click="handleEnhanceEquipment"
          :disabled="playerStore.reinforceStones < ((selectedEquipment?.enhanceLevel || 0) + 1) * 10"
        >
          确认强化
        </button>
      </div>
    </div>
  </div>

  <!-- 洗练确认弹窗 -->
  <div v-if="showReforgeConfirm" class="simple-modal" @click.self="showReforgeConfirm = false">
    <div class="simple-modal-content">
      <div class="modal-header"><h3>洗练结果确认</h3></div>
      <div v-if="reforgeResult" class="reforge-compare">
        <div class="old-stats">
          <h4>原始属性</h4>
          <div v-for="(value, key) in reforgeResult.oldStats" :key="key">
            {{ getStatName(key) }}: {{ formatStatValue(key, value) }}
          </div>
        </div>
        <div class="new-stats">
          <h4>新属性</h4>
          <div v-for="(value, key) in reforgeResult.newStats" :key="key">
            {{ getStatName(key) }}: {{ formatStatValue(key, value) }}
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-small btn-primary" @click="confirmReforgeResult(true)">确认新属性</button>
        <button class="btn-small" @click="confirmReforgeResult(false)">保留原属性</button>
      </div>
    </div>
  </div>

  <!-- 洗练前置确认弹窗 -->
  <div v-if="showReforgePreConfirm" class="simple-modal" @click.self="showReforgePreConfirm = false">
    <div class="simple-modal-content">
      <div class="modal-header"><h3>洗练确认</h3></div>
      <p>洗练将消耗 {{ reforgeCost }} 洗练石，并可能改变装备的词条属性，是否继续？</p>
      <p>当前洗练石数量：{{ playerStore.refinementStones }}</p>
      <div class="modal-actions">
        <button class="btn-small" @click="showReforgePreConfirm = false">取消</button>
        <button
          class="btn-small btn-info"
          @click="confirmReforgeStart"
          :disabled="playerStore.refinementStones < reforgeCost"
        >确认洗练</button>
      </div>
    </div>
  </div>

  <!-- 出售 / 分解选择弹窗 -->
  <div v-if="showSellDisassemble" class="simple-modal" @click.self="showSellDisassemble = false">
    <div class="simple-modal-content">
      <div class="modal-header"><h3>出售 / 分解</h3></div>
      <p>请选择对「{{ selectedEquipment?.name }}」的处理方式：</p>
      <div class="modal-actions sell-disassemble-actions">
        <button class="btn-small btn-warning" @click="sellCurrentEquipment">
          出售（获得 {{ sellPreview }} 灵石）
        </button>
        <button class="btn-small btn-info" @click="disassembleCurrentEquipment">
          分解（获得强化石 / 洗练石）
        </button>
        <button class="btn-small" @click="showSellDisassemble = false">返回</button>
      </div>
    </div>
  </div>

</template>

<script setup>
  import { usePlayerStore } from '../stores/player'
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useMessage } from 'naive-ui'
  import { getStatName, formatStatValue } from '../plugins/stats'
  import { getRealmName } from '../plugins/realm'
  import { pillRecipes, pillGrades, pillTypes, calculatePillEffect } from '../plugins/pills'
  import { enhanceEquipment, reforgeEquipment, calculateEquipmentScore, rarityConfig, setBonuses } from '../plugins/equipment'

  // 移动端适配
  const isMobile = ref(window.innerWidth <= 768)
  const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768
  }
  onMounted(() => window.addEventListener('resize', updateIsMobile))
  onUnmounted(() => window.removeEventListener('resize', updateIsMobile))

  // 分页相关
  const currentPage = ref(1)
  const pageSize = ref(12)

  // 排序标志
  const petsSortedByScore = ref(false)
  const equipmentSortedByScore = ref(false)

  // 过滤后的灵宠列表
  const filteredPets = computed(() => {
    const pets = playerStore.items.filter(item => item.type === 'pet')
    let result = selectedRarityToRelease.value === 'all' ? pets : pets.filter(pet => pet.rarity === selectedRarityToRelease.value)
    if (petsSortedByScore.value) {
      result = [...result].sort((a, b) => calculatePetScore(b) - calculatePetScore(a))
    }
    return result
  })

  // 当前页显示的灵宠
  const displayPets = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredPets.value.slice(start, end)
  })

  // 灵宠按评分排序
  const sortPetsByScore = () => {
    petsSortedByScore.value = !petsSortedByScore.value
    currentPage.value = 1
    if (petsSortedByScore.value) {
      message.success('灵宠已按评分从高到低排序')
    } else {
      message.success('灵宠已恢复默认排序')
    }
  }

  const playerStore = usePlayerStore()
  const message = useMessage()

  // 使用丹药
  const usePill = pill => {
    const result = playerStore.usePill(pill)
    if (result.success) {
      message.success(result.message)
    } else {
      message.error(result.message)
    }
  }

  // 标签页
  const activeTab = ref('equipment')
  const tabs = [
    { name: 'equipment', label: '装备' },
    { name: 'herbs', label: '灵草' },
    { name: 'pills', label: '丹药' },
    { name: 'formulas', label: '丹方' },
    { name: 'pets', label: '灵宠' }
  ]

  // 灵宠品质配置
  const petRarities = {
    divine: { name: '神品', color: '#FF0000', probability: 0.02, essenceBonus: 50 },
    celestial: { name: '仙品', color: '#FFD700', probability: 0.08, essenceBonus: 30 },
    mystic: { name: '玄品', color: '#9932CC', probability: 0.15, essenceBonus: 20 },
    spiritual: { name: '灵品', color: '#1E90FF', probability: 0.25, essenceBonus: 10 },
    mortal: { name: '凡品', color: '#32CD32', probability: 0.5, essenceBonus: 5 }
  }

  // 灵宠详情相关
  const showPetModal = ref(false)
  const selectedPet = ref(null)
  const selectedFoodPet = ref(null)

  // 放生确认弹窗
  const showReleaseConfirm = ref(false)
  const showBatchReleaseConfirm = ref(false)
  const petToRelease = ref(null)

  // 显示放生确认弹窗
  const confirmReleasePet = pet => {
    petToRelease.value = pet
    showReleaseConfirm.value = true
  }

  // 取消放生
  const cancelReleasePet = () => {
    petToRelease.value = null
    showReleaseConfirm.value = false
  }

  // 执行放生
  const releasePet = () => {
    if (petToRelease.value) {
      // 如果灵宠正在出战，先取消出战
      if (playerStore.activePet?.id === petToRelease.value.id) {
        playerStore.activePet = null
      }
      // 从背包中移除灵宠
      const index = playerStore.items.findIndex(item => item.id === petToRelease.value.id)
      if (index > -1) {
        playerStore.items.splice(index, 1)
        playerStore.saveData()
        message.success('已放生灵宠')
      }
      // 关闭所有相关弹窗
      showReleaseConfirm.value = false
      showPetModal.value = false
      petToRelease.value = null
    }
  }

  // 选中的放生品阶
  const selectedRarityToRelease = ref('all')

  // 批量放生函数
  const batchReleasePets = () => {
    playerStore.items = playerStore.items.filter(
      item =>
        item.type !== 'pet' ||
        item.id === playerStore.activePet?.id ||
        (selectedRarityToRelease.value !== 'all' && item.rarity !== selectedRarityToRelease.value)
    )
    showBatchReleaseConfirm.value = false
    message.success(
      `已放生${
        selectedRarityToRelease.value === 'all' ? '所有' : petRarities[selectedRarityToRelease.value].name
      }品阶的未出战灵宠`
    )
  }

  // 显示灵宠详情
  const showPetDetails = pet => {
    selectedPet.value = pet
    selectedFoodPet.value = null
    showPetModal.value = true
  }

  // 计算灵宠属性加成
  const getPetBonus = pet => {
    if (!pet) return { attack: 0, defense: 0, health: 0 }
    const qualityBonusMap = {
      divine: 0.5,
      celestial: 0.3,
      mystic: 0.2,
      spiritual: 0.1,
      mortal: 0.05
    }
    const starBonusPerQuality = {
      divine: 0.1,
      celestial: 0.08,
      mystic: 0.06,
      spiritual: 0.04,
      mortal: 0.02
    }
    const baseBonus = qualityBonusMap[pet.rarity] || 0.05
    const starBonus = (pet.star || 0) * (starBonusPerQuality[pet.rarity] || 0.02)
    const totalBonus = baseBonus + starBonus
    const phase = Math.floor((pet.star || 0) / 5)
    const phaseBonus = phase * (baseBonus * 0.5)
    const finalBonus = totalBonus + phaseBonus
    return {
      attack: finalBonus,
      defense: finalBonus,
      health: finalBonus
    }
  }

  // 计算灵宠评分
  const calculatePetScore = pet => {
    if (!pet) return 0
    const rarityScoreMap = {
      divine: 1000,
      celestial: 600,
      mystic: 350,
      spiritual: 200,
      mortal: 100
    }
    const baseScore = rarityScoreMap[pet.rarity] || 100
    const levelScore = (pet.level || 1) * 20
    const starScore = (pet.star || 0) * 50
    return baseScore + levelScore + starScore
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

  // 获取可用作升星材料的灵宠列表
  const getAvailableFoodPets = pet => {
    if (!pet) return []
    return playerStore.items
      .filter(
        item =>
          item.type === 'pet' &&
          item.id !== pet.id &&
          item.star === pet.star &&
          item.rarity === pet.rarity &&
          item.name === pet.name
      )
      .map(item => ({
        label: `${item.name} (${item.level || 1}级 ${item.star || 0}星)`,
        value: item.id
      }))
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

  // 升星灵宠
  const evolvePet = pet => {
    if (!selectedFoodPet.value) {
      message.error('请选择用于升星的灵宠')
      return
    }
    // 通过id查找对应的灵宠对象
    const foodPet = playerStore.items.find(item => item.id === selectedFoodPet.value)
    if (!foodPet) {
      message.error('升星材料灵宠不存在')
      return
    }
    const result = playerStore.evolvePet(pet, foodPet)
    if (result.success) {
      message.success(result.message)
      selectedFoodPet.value = null
      showPetModal.value = false
    } else {
      message.error(result.message)
    }
  }

  // 装备类型配置
  const equipmentTypes = {
    weapon: '武器',
    head: '头部',
    body: '衣服',
    legs: '裤子',
    feet: '鞋子',
    shoulder: '肩甲',
    hands: '手套',
    wrist: '护腕',
    necklace: '项链',
    ring1: '戒指1',
    ring2: '戒指2',
    belt: '腰带',
    artifact: '法宝'
  }

  // 所有装备槽位（用于识别装备类物品，兼容 gacha 与挂机两种生成形态）
  const EQUIPMENT_SLOTS = ['weapon', 'head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'necklace', 'ring1', 'ring2', 'belt', 'artifact']
  const isEquipmentItem = item => !!item && (item.type === 'equipment' || (item.slot && EQUIPMENT_SLOTS.includes(item.slot)))

  // 是否有可装备物品（用于禁用一键按钮）
  const hasEquipableItems = computed(() => {
    return playerStore.items.some(item => {
      if (!isEquipmentItem(item)) return false
      const req = item.requiredRealm || 1
      return playerStore.level >= req
    })
  })

  // 一键装备最强装备
  const handleAutoEquipBest = () => {
    const result = playerStore.autoEquipBest()
    if (result.success) {
      message.success(result.message + (result.equipped ? '\n' + result.equipped.join('\n') : ''))
    } else {
      message.warning(result.message)
    }
  }

  // 当前选中的装备类型
  const selectedType = ref('')

  // 显示装备类型弹窗
  const showEquipmentList = type => {
    selectedType.value = type
    selectedEquipmentType.value = type
    showEquipmentModal.value = true
  }

  // 卸下装备
  const unequipItem = slot => {
    const result = playerStore.unequipArtifact(slot)
    if (result) {
      showEquipmentDetailModal.value = false
      message.success('当前装备已卸下')
    } else {
      message.error('卸下装备失败')
    }
  }

  // 装备列表相关
  const showEquipmentModal = ref(false)
  const selectedEquipmentType = ref('')
  const selectedQuality = ref('all')

  // 装备列表弹窗标题（含“全部”）
  const equipmentModalTitle = computed(() => {
    if (!selectedEquipmentType.value || selectedEquipmentType.value === 'all') return '全部装备'
    return equipmentTypes[selectedEquipmentType.value] + '列表'
  })
  const currentEquipmentPage = ref(1)
  const equipmentPageSize = ref(8)

  // 装备品质选项
  const qualityOptions = computed(() => {
    const equipmentsByQuality = {}
    playerStore.items
      .filter(item => isEquipmentItem(item) && (!selectedEquipmentType.value || selectedEquipmentType.value === 'all' || item.slot === selectedEquipmentType.value))
      .forEach(item => {
        equipmentsByQuality[item.quality] = (equipmentsByQuality[item.quality] || 0) + 1
      })
    return [
      { label: '全部品质', value: 'all' },
      { label: '仙品', value: 'mythic', disabled: !equipmentsByQuality['mythic'] },
      { label: '极品', value: 'legendary', disabled: !equipmentsByQuality['legendary'] },
      { label: '上品', value: 'epic', disabled: !equipmentsByQuality['epic'] },
      { label: '中品', value: 'rare', disabled: !equipmentsByQuality['rare'] },
      { label: '下品', value: 'uncommon', disabled: !equipmentsByQuality['uncommon'] },
      { label: '凡品', value: 'common', disabled: !equipmentsByQuality['common'] }
    ]
  })

  // 过滤后的装备列表
  const filteredEquipmentList = computed(() => {
    let list = playerStore.items.filter(item => {
      if (!isEquipmentItem(item)) return false
      if (selectedEquipmentType.value && selectedEquipmentType.value !== 'all' && item.slot !== selectedEquipmentType.value) return false
      if (selectedQuality.value !== 'all' && item.quality !== selectedQuality.value) return false
      return true
    })
    if (equipmentSortedByScore.value) {
      list = [...list].sort((a, b) => calculateEquipmentScore(b) - calculateEquipmentScore(a))
    }
    return list
  })

  // 当前页显示的装备
  const equipmentList = computed(() => {
    const start = (currentEquipmentPage.value - 1) * equipmentPageSize.value
    const end = start + equipmentPageSize.value
    return filteredEquipmentList.value.slice(start, end)
  })

  // 批量卖出装备
  const batchSellEquipments = async () => {
    const result = await playerStore.batchSellEquipments(
      selectedQuality.value === 'all' ? null : selectedQuality.value,
      selectedEquipmentType.value
    )
    if (result.success) {
      message.success(result.message)
    } else {
      message.error(result.message || '批量卖出失败')
    }
  }

  // 装备按评分排序
  const sortEquipmentByScore = () => {
    equipmentSortedByScore.value = !equipmentSortedByScore.value
    currentEquipmentPage.value = 1
    if (equipmentSortedByScore.value) {
      message.success('装备已按评分从高到低排序')
    } else {
      message.success('装备已恢复默认排序')
    }
  }

  // 卖出单件装备
  // 出售当前装备（获得灵石，按评分折价）
  const sellCurrentEquipment = async () => {
    if (!selectedEquipment.value) return
    const result = await playerStore.sellEquipment(selectedEquipment.value)
    showSellDisassemble.value = false
    if (result.success) {
      message.success(result.message)
      showEquipmentDetailModal.value = false
    } else {
      message.error(result.message || '出售失败')
    }
  }

  // 分解当前装备（获得强化石 / 洗练石）
  const disassembleCurrentEquipment = async () => {
    if (!selectedEquipment.value) return
    const result = await playerStore.disassembleEquipment(selectedEquipment.value)
    showSellDisassemble.value = false
    if (result.success) {
      message.success(result.message)
      showEquipmentDetailModal.value = false
    } else {
      message.error(result.message || '分解失败')
    }
  }

  // 显示装备详情
  const showEquipmentDetails = equipment => {
    selectedEquipment.value = equipment
    showEquipmentDetailModal.value = true
  }

  // 装备详情相关
  const showEquipmentDetailModal = ref(false)
  const selectedEquipment = ref(null)

  // 出售预览灵石（按评分折价）
  const sellPreview = computed(() => {
    if (!selectedEquipment.value) return 0
    return Math.max(1, Math.round((calculateEquipmentScore(selectedEquipment.value) || 0) * 0.1))
  })

  // 强化确认弹窗
  const showEnhanceConfirm = ref(false)

  // 强化装备
  const handleEnhanceEquipment = () => {
    if (!selectedEquipment.value) return
    const usedBonus = playerStore.enhanceBonus || 0 // 淬灵丹加成
    const result = enhanceEquipment(selectedEquipment.value, playerStore.reinforceStones, usedBonus)
    if (result.success) {
      playerStore.reinforceStones -= result.cost
      selectedEquipment.value.stats = { ...result.newStats }
      selectedEquipment.value.enhanceLevel = result.newLevel
      if (usedBonus > 0) playerStore.enhanceBonus = 0 // 消耗淬灵丹加成（下次强化）
      message.success('强化成功')
      playerStore.saveData()
    } else {
      message.error(result.message || '强化失败')
    }
  }

  // 洗练前置确认弹窗
  const showReforgePreConfirm = ref(false)
  // 洗练消耗（与 plugins/equipment reforgeConfig.costPerAttempt 保持一致）
  const reforgeCost = 10
  // 出售 / 分解选择弹窗
  const showSellDisassemble = ref(false)

  // 洗练确认弹窗
  const showReforgeConfirm = ref(false)
  const reforgeResult = ref(null)

  // 洗练前置确认后，执行洗练
  const confirmReforgeStart = () => {
    showReforgePreConfirm.value = false
    handleReforgeEquipment()
  }

  // 洗练装备
  const handleReforgeEquipment = () => {
    if (!selectedEquipment.value) return
    const usedSafe = playerStore.reforgeSafeCharges > 0 // 定灵丹保底
    const result = reforgeEquipment(selectedEquipment.value, playerStore.refinementStones, false, usedSafe)
    if (result.success) {
      playerStore.refinementStones -= result.cost
      result.usedSafe = usedSafe
      reforgeResult.value = result
      showReforgeConfirm.value = true
    } else {
      message.error(result.message || '洗练失败')
    }
  }

  // 确认洗练结果
  const confirmReforgeResult = confirm => {
    if (!reforgeResult.value) return
    if (confirm) {
      // 用户确认后，应用新属性
      selectedEquipment.value.stats = reforgeResult.value.newStats
      message.success('已确认新属性')
      if (reforgeResult.value.usedSafe) {
        // 消耗一次定灵丹保底
        playerStore.reforgeSafeCharges = Math.max(0, playerStore.reforgeSafeCharges - 1)
      }
    } else {
      // 用户取消，保留原属性
      message.info('已保留原有属性')
    }
    showReforgeConfirm.value = false
    reforgeResult.value = null
    playerStore.saveData()
  }

  // 使用装备（兼容 gacha 的 type=槽位 与 挂机生成的 type='equipment'，统一取 slot）
  const equipItem = equipment => {
    const slot = equipment.slot || equipment.type
    const result = playerStore.equipArtifact(equipment, slot)
    if (result.success) {
      message.success(result.message)
      showEquipmentModal.value = false
      showEquipmentDetailModal.value = false
    } else {
      message.error(result.message || '装备失败')
    }
  }

  // 判断某件装备是否已装备
  const isEquipped = equipment => {
    const slot = equipment.slot || equipment.type
    return playerStore.equippedArtifacts[slot]?.id === equipment.id
  }

  // 兼容 qualityInfo 缺失的装备（如挂机生成），回退到 rarityConfig
  const qualityInfoOf = item => {
    if (item && item.qualityInfo && item.qualityInfo.name) return item.qualityInfo
    const cfg = rarityConfig[item?.quality]
    if (cfg) return { name: cfg.name, color: cfg.color }
    return { name: item?.quality || '未知', color: '#999' }
  }

  // 将词条压缩为紧凑展示文本
  const formatAffixNames = affixes => {
    if (!affixes || affixes.length === 0) return '无'
    return affixes.map(a => a.name).join('、')
  }

  const getSetInfo = setId => {
    return setBonuses.find(s => s.id === setId)
  }

  const getSetBonuses = setId => {
    const setData = setBonuses.find(s => s.id === setId)
    if (!setData) return []
    const bonuses = []
    if (setData.bonus2) bonuses.push(setData.bonus2)
    if (setData.bonus3) bonuses.push(setData.bonus3)
    if (setData.bonus4) bonuses.push(setData.bonus4)
    if (setData.bonus5) bonuses.push(setData.bonus5)
    return bonuses
  }

  // 计算灵草分组
  const groupedHerbs = computed(() => {
    const groups = {}
    playerStore.herbs.forEach(herb => {
      if (!groups[herb.name]) {
        groups[herb.name] = {
          ...herb,
          count: 1
        }
      } else {
        groups[herb.name].count++
      }
    })
    return Object.values(groups)
  })

  // 计算丹方分组
  const groupedFormulas = computed(() => {
    // 从pillRecipes中获取完整丹方
    const complete = playerStore.pillRecipes
      .map(recipeId => {
        const recipe = pillRecipes.find(r => r.id === recipeId)
        return recipe
          ? {
              id: recipe.id,
              name: recipe.name,
              description: recipe.description,
              grade: recipe.grade,
              type: recipe.type,
              isComplete: true
            }
          : null
      })
      .filter(Boolean)

    // 从pillFragments中获取残缺丹方
    const incomplete = Object.entries(playerStore.pillFragments)
      .map(([recipeId, fragments]) => {
        const recipe = pillRecipes.find(r => r.id === recipeId)
        return recipe
          ? {
              id: recipe.id,
              name: recipe.name,
              description: recipe.description,
              grade: recipe.grade,
              type: recipe.type,
              isComplete: false,
              fragments,
              fragmentsNeeded: recipe.fragmentsNeeded
            }
          : null
      })
      .filter(Boolean)

    return { complete, incomplete }
  })

  // 合并完整与残缺丹方
  const allFormulas = computed(() => {
    return [...groupedFormulas.value.complete, ...groupedFormulas.value.incomplete]
  })

  // 计算丹药分组
  const groupedPills = computed(() => {
    const groups = {}
    playerStore.items
      .filter(item => item.type === 'pill')
      .forEach(pill => {
        if (!groups[pill.name]) {
          groups[pill.name] = {
            ...pill,
            count: 1
          }
        } else {
          groups[pill.name].count++
        }
      })
    return Object.values(groups)
  })

  // 使用物品
  const useItem = item => {
    // 灵宠已改由详情弹窗操作，不再从此处出战/召回
  }

  // 装备属性对比计算
  const equipmentComparison = computed(() => {
    if (!selectedEquipment.value) return null
    const slot = selectedEquipment.value.slot || selectedEquipment.value.type
    const currentEquipment = playerStore.equippedArtifacts[slot]
    if (!currentEquipment) return null
    const comparison = {}
    const allStats = new Set([...Object.keys(selectedEquipment.value.stats), ...Object.keys(currentEquipment.stats)])
    allStats.forEach(stat => {
      const selectedValue = selectedEquipment.value.stats[stat] || 0
      const currentValue = currentEquipment.stats[stat] || 0
      const diff = selectedValue - currentValue
      comparison[stat] = {
        current: currentValue,
        selected: selectedValue,
        diff: diff,
        isPositive: diff > 0
      }
    })
    return comparison
  })

  const options = [
    { label: '全部品阶', value: 'all' },
    { label: '神品', value: 'divine' },
    { label: '仙品', value: 'celestial' },
    { label: '玄品', value: 'mystic' },
    { label: '灵品', value: 'spiritual' },
    { label: '凡品', value: 'mortal' }
  ]
</script>

<style scoped>
  .inventory-page {
    padding: 0;
    min-height: 100%;
  }

  .inventory-tabs {
    display: flex;
    flex-direction: column;
  }

  .tab-header {
    display: flex;
    overflow-x: auto;
    border-bottom: 1px solid rgba(139, 69, 19, 0.3);
    margin-bottom: 12px;
    gap: 4px;
  }

  .tab-item {
    padding: 10px 14px;
    white-space: nowrap;
    cursor: pointer;
    color: #8B8B8B;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .tab-item.active {
    color: #DAA520;
    border-bottom-color: #DAA520;
  }

  .tab-content {
    flex: 1;
  }

  .tab-pane {
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* 装备操作栏 */
  .equip-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .auto-equip-btn {
    padding: 8px 16px !important;
    font-size: 13px !important;
    background: linear-gradient(135deg, rgba(218, 165, 32, 0.7), rgba(255, 215, 0, 0.5)) !important;
    color: #1a1a2e !important;
    border: 1px solid rgba(255, 215, 0, 0.6) !important;
    border-radius: 8px !important;
    cursor: pointer;
    transition: all 0.25s ease;
    font-weight: bold;
    letter-spacing: 0.5px;
  }

  .auto-equip-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.85), rgba(218, 165, 32, 0.7)) !important;
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
    transform: translateY(-1px);
  }

  .auto-equip-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .simple-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .simple-grid.mobile {
    grid-template-columns: 1fr;
  }

  .simple-card {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(139, 69, 19, 0.25);
    border-radius: 8px;
    padding: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .simple-card:hover {
    border-color: rgba(218, 165, 32, 0.5);
  }

  .simple-card .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-weight: bold;
    color: #F5DEB3;
  }

  .card-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .simple-card .card-body {
    font-size: 13px;
    color: #aaa;
  }

  .simple-card .card-body p {
    margin: 0 0 6px;
    line-height: 1.4;
  }

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

  .btn-small.btn-info {
    background: rgba(30, 144, 255, 0.6);
    color: #fff;
  }

  .simple-tag {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    background: rgba(0, 0, 0, 0.3);
  }

  .simple-tag.success {
    background: rgba(34, 139, 34, 0.3);
    color: #4CAF50;
  }

  .simple-tag.warning {
    background: rgba(218, 165, 32, 0.2);
    color: #DAA520;
  }

  .simple-tag.info {
    background: rgba(30, 144, 255, 0.2);
    color: #1E90FF;
  }

  .tag-group {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #888;
  }

  .progress-line {
    height: 6px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 3px;
    overflow: hidden;
    margin: 8px 0 4px;
  }

  .progress-line .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #8B4513, #DAA520);
    transition: width 0.3s;
  }

  .progress-text {
    font-size: 11px;
    color: #DAA520;
  }

  .pet-actions,
  .modal-toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .simple-select {
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid rgba(139, 69, 19, 0.4);
    background: rgba(0, 0, 0, 0.3);
    color: #F5DEB3;
    font-size: 13px;
  }

  .pagination-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    font-size: 12px;
    color: #888;
    flex-wrap: wrap;
  }

  .pet-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 6px;
  }

  .pet-score {
    color: #DAA520;
    font-weight: bold;
    font-size: 13px;
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

  .simple-modal-content.wide {
    max-width: 90vw;
    max-height: calc(100vh - 50px);
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
    color: #aaa;
  }

  .detail-row span:first-child {
    color: #888;
  }

  .modal-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }

  /* 装备详情四宫格（强化 / 洗练 / 装备 / 出售分解） */
  .modal-actions.four-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .modal-actions.four-grid .btn-small {
    width: 100%;
    padding: 10px 0;
    font-size: 14px;
    font-weight: bold;
  }

  /* 工具栏“全部装备”按钮 */
  .all-equip-btn {
    padding: 8px 16px !important;
    font-size: 13px !important;
    background: rgba(139, 69, 19, 0.6) !important;
    color: #F5DEB3 !important;
    border: 1px solid rgba(218, 165, 32, 0.5) !important;
    border-radius: 8px !important;
    cursor: pointer;
    transition: all 0.25s ease;
    font-weight: bold;
    letter-spacing: 0.5px;
  }

  .all-equip-btn:hover {
    background: rgba(139, 69, 19, 0.85) !important;
    box-shadow: 0 0 12px rgba(218, 165, 32, 0.35);
    transform: translateY(-1px);
  }

  /* 列表卡片：装备名、评分、词条 */
  .equip-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 70%;
  }

  .equip-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }

  .equip-score-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: bold;
    color: #FFD700;
    background: rgba(255, 215, 0, 0.12);
    border: 1px solid rgba(255, 215, 0, 0.3);
  }

  .equip-affix-preview {
    margin: 0 0 6px;
    font-size: 12px;
    color: #9FD8A0;
    line-height: 1.4;
  }

  /* 列表“装备”按钮 */
  .btn-small.btn-equip {
    background: rgba(34, 139, 34, 0.6);
    color: #fff;
  }

  /* 出售/分解选择弹窗按钮纵向排布 */
  .sell-disassemble-actions {
    flex-direction: column;
  }

  .sell-disassemble-actions .btn-small {
    width: 100%;
    padding: 10px 0;
    font-size: 14px;
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

  .simple-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-top: 8px;
  }

  .simple-table th,
  .simple-table td {
    padding: 6px;
    border: 1px solid rgba(139, 69, 19, 0.2);
    text-align: center;
  }

  .simple-table th {
    background: rgba(139, 69, 19, 0.2);
    color: #F5DEB3;
  }

  .positive {
    color: #4CAF50;
  }

  .negative {
    color: #DC3545;
  }

  .reforge-compare {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin: 12px 0;
  }

  .old-stats,
  .new-stats {
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
  }

  .old-stats h4,
  .new-stats h4 {
    margin-top: 0;
    margin-bottom: 8px;
    font-size: 14px;
    color: #F5DEB3;
  }

  .equipment-score {
    font-size: 18px;
    font-weight: bold;
    color: #FFD700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }

  .set-tag {
    font-weight: bold;
    font-size: 14px;
  }

  .affixes-section {
    margin-top: 8px;
  }

  .affix-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 13px;
    border-bottom: 1px solid rgba(139, 69, 19, 0.2);
  }

  .affix-name {
    font-weight: bold;
  }

  .affix-tier-1 {
    color: #32CD32;
  }

  .affix-tier-2 {
    color: #1E90FF;
  }

  .affix-tier-3 {
    color: #FFD700;
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  }

  .set-bonus-section {
    margin-top: 8px;
  }

  .set-bonus-row {
    padding: 4px 8px;
    background: rgba(139, 69, 19, 0.1);
    border-radius: 4px;
    margin-bottom: 4px;
    font-size: 13px;
    color: #F5DEB3;
  }
</style>
