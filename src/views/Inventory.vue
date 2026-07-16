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
          <div class="pet-actions">
            <select v-model="equipmentFilterCategory" class="simple-select">
              <option value="">全部分类</option>
              <option value="artifact">法宝</option>
              <option value="armor">防具</option>
              <option value="accessory">饰品</option>
            </select>
            <select v-model="equipmentFilterQuality" class="simple-select">
              <option value="">全部品质</option>
              <option value="mythic">仙品</option>
              <option value="legendary">极品</option>
              <option value="epic">上品</option>
              <option value="rare">中品</option>
              <option value="uncommon">下品</option>
              <option value="common">凡品</option>
            </select>
            <button
              class="btn-small btn-success"
              :disabled="displayEquipmentList.length === 0"
              @click="sortEquipmentByScore"
            >
              🔼 按评分排序
            </button>
            <button
              class="btn-small btn-warning"
              :disabled="displayEquipmentList.length === 0"
              @click="batchSellEquipments"
            >
              一键出售
            </button>
          </div>
          <div v-if="displayEquipmentList.length > pageSize" class="pagination-info">
            共 {{ filteredEquipmentList.length }} 件装备，当前第 {{ currentEquipmentPage }} 页
            <button class="btn-small" :disabled="currentEquipmentPage <= 1" @click="currentEquipmentPage--">上一页</button>
            <button class="btn-small" :disabled="currentEquipmentPage * pageSize >= filteredEquipmentList.length" @click="currentEquipmentPage++">下一页</button>
          </div>
          <div v-if="displayEquipmentList.length" class="simple-grid" :class="{ mobile: isMobile }">
            <div
              v-for="item in displayEquipmentList"
              :key="item.id || item.name"
              class="simple-card"
              :class="[
                `equip-border-${item.quality || 'common'}`,
                `equip-bg-${item.quality || 'common'}`
              ]"
              @click="showEquipmentDetails(item)"
            >
              <div class="card-header">
                <span :style="{ color: qualityInfoOf(item).color }" :class="'text-glow-' + (item.quality || 'common')">
                  {{ item.name }}
                  <span class="equip-category-tag">{{ getEquipCategoryName(item.slot) }}</span>
                </span>
              </div>
              <div class="card-body">
                <div class="equip-meta">
                  <span class="simple-tag" :style="{ color: qualityInfoOf(item).color }">
                    {{ qualityInfoOf(item).name }}
                  </span>
                  <span class="equip-score-badge">评分 {{ calculateEquipmentScore(item) }}</span>
                </div>
                <p>{{ equipmentTypes[item.slot] || item.slot }}</p>
                <div class="equip-stats">
                  <span v-if="item.stats?.attack">攻击: {{ item.stats.attack }}</span>
                  <span v-if="item.stats?.health">生命: {{ item.stats.health }}</span>
                  <span v-if="item.stats?.defense">防御: {{ item.stats.defense }}</span>
                </div>
                <p class="equip-affix-preview">词条：{{ formatAffixNames(item.affixes) }}</p>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">暂无装备</div>
        </div>
        <!-- 素材 -->
        <div v-if="activeTab === 'materials'" class="tab-pane">
          <div class="material-categories">
            <button
              v-for="cat in materialCategories"
              :key="cat.key"
              class="btn-small"
              :class="{ active: selectedMaterialCategory === cat.key }"
              @click="selectedMaterialCategory = cat.key"
            >
              {{ cat.label }}
            </button>
          </div>
          <div class="material-toolbar">
            <button
              class="btn-small"
              :class="{ active: isMaterialSelectMode }"
              @click="toggleMaterialSelectMode"
              :disabled="filteredMaterials.length === 0"
            >
              {{ isMaterialSelectMode ? '取消多选' : '多选卖出' }}
            </button>
            <button
              v-if="isMaterialSelectMode"
              class="btn-small btn-danger"
              :disabled="selectedMaterials.length === 0"
              @click="showMaterialSellModal = true"
            >
              批量卖出 ({{ selectedMaterials.length }})
            </button>
          </div>
          <div v-if="filteredMaterials.length" class="simple-grid" :class="{ mobile: isMobile }">
            <div
              v-for="mat in filteredMaterials"
              :key="mat.id"
              class="simple-card material-card"
              :class="{ selected: isMaterialSelected(mat) }"
              @click="handleMaterialClick(mat)"
            >
              <div class="card-header">
                <span>
                  <input
                    v-if="isMaterialSelectMode"
                    type="checkbox"
                    :checked="isMaterialSelected(mat)"
                    @click.stop="toggleMaterialSelect(mat)"
                    class="material-checkbox"
                  />
                  {{ mat.name }}({{ mat.count }})
                </span>
                <span class="simple-tag" :style="{ color: getMaterialColor(mat) }">
                  {{ getMaterialQualityName(mat) }}
                </span>
              </div>
              <div class="card-body">
                <p>{{ mat.description }}</p>
                <div class="material-meta">
                  <span class="material-kind">{{ getMaterialKindName(mat.kind) }}</span>
                  <span class="material-price">
                    单价 {{ getMaterialUnitPrice(mat) }} 灵石
                    <span class="material-total">总价 {{ getMaterialTotalPrice(mat) }} 灵石</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">暂无素材</div>
        </div>
        <!-- 丹药 -->
        <div v-if="activeTab === 'pills'" class="tab-pane">
          <div v-if="groupedPills.length" class="simple-grid" :class="{ mobile: isMobile }">
            <div
              v-for="pill in groupedPills"
              :key="pill.id"
              class="simple-card pill-card"
              @click="openPillConsumeModal(pill)"
            >
              <div class="card-header">
                <span :style="{ color: getPillGradeColor(pill.grade) }">
                  {{ pill.name }}
                  <span class="pill-grade-tag">{{ pillGrades[pill.grade]?.name }}</span>
                </span>
                <span class="pill-count">×{{ pill.count }}</span>
              </div>
              <div class="card-body">
                <p class="pill-effect">{{ pill.effectText }}</p>
                <p class="pill-desc">{{ pill.description }}</p>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">暂无丹药</div>
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
            <div v-for="pet in displayPets" :key="pet.id" class="simple-card" @click="showPetDetails(pet)">
              <div class="card-header">
                <span>{{ pet.name }}</span>
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
          <button
            class="btn-small btn-warning"
            @click="evolvePet(selectedPet)"
            :disabled="!canEvolve(selectedPet)"
            :title="`需要 ${getEvolveCost(selectedPet)} 升星碎片`"
          >
            升星({{ getEvolveCost(selectedPet) }}碎片)
          </button>
          <button
            class="btn-small btn-danger"
            @click="confirmReleasePet(selectedPet)"
            :disabled="equippedPetIds.has(selectedPet.uid || selectedPet.id)"
            :title="equippedPetIds.has(selectedPet.uid || selectedPet.id) ? '出战或装备中的灵宠无法放生' : ''"
          >
            {{ equippedPetIds.has(selectedPet.uid || selectedPet.id) ? '装备中' : '放生' }}
          </button>
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
  <div v-if="showEquipmentDetailModal" class="simple-modal equipment-detail-modal" @click.self="showEquipmentDetailModal = false">
    <div class="simple-modal-content equipment-detail-content">
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
        <div v-for="(value, stat) in filteredEquipmentStats" :key="stat" class="detail-row">
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
        <div class="enhance-preview-section">
          <div class="simple-divider">强化预览 (+1 ~ +12)</div>
          <div class="enhance-preview-grid">
            <div class="enhance-preview-header">
              <span>等级</span>
              <span>倍率</span>
              <span>评分</span>
            </div>
            <div v-for="p in enhancePreview" :key="p.level" class="enhance-preview-row">
              <span>+{{ p.level }}</span>
              <span>×{{ Math.round(p.multiplier * 100) / 100 }}</span>
              <span>{{ p.score }}</span>
            </div>
          </div>
        </div>
        <div class="modal-actions four-grid">
          <button
            class="btn-small"
            @click="showEquipTargetModal = true"
            :disabled="playerStore.level < (selectedEquipment?.requiredRealm || 1) || equipTargetMembers.length === 0"
          >
            装备
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

  <!-- 选择出战角色弹窗 -->
  <div v-if="showEquipTargetModal" class="simple-modal" @click.self="showEquipTargetModal = false">
    <div class="simple-modal-content">
      <div class="modal-header">
        <h3>选择装备对象</h3>
        <button class="btn-small" @click="showEquipTargetModal = false">关闭</button>
      </div>
      <div class="modal-body">
        <p>将「{{ selectedEquipment?.name }}」装备给：</p>
        <div v-if="equipTargetMembers.length === 0" class="empty-state">
          当前没有出战角色
        </div>
        <div v-else class="equip-target-list">
          <div
            v-for="member in equipTargetMembers"
            :key="member.id"
            class="equip-target-item"
            @click="equipToMember(member)"
          >
            <img v-if="member.portraitThumbnail" :src="member.portraitThumbnail" class="target-avatar" />
            <span class="target-name">{{ member.name }}</span>
            <span class="target-level">Lv.{{ member.level }}</span>
          </div>
        </div>
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

  <!-- 素材批量卖出弹窗 -->
  <div v-if="showMaterialSellModal" class="simple-modal" @click.self="showMaterialSellModal = false">
    <div class="simple-modal-content">
      <div class="modal-header">
        <h3>批量卖出素材</h3>
        <button class="btn-small" @click="showMaterialSellModal = false">关闭</button>
      </div>
      <div class="modal-body">
        <p>已选择 {{ selectedMaterials.length }} 种素材</p>
        <div class="material-sell-list">
          <div v-for="mat in selectedMaterials" :key="mat.id" class="material-sell-row">
            <span>{{ mat.name }}</span>
            <span class="material-sell-count">
              <button class="btn-mini" @click="decreaseSellCount(mat)" :disabled="materialSellCounts[mat.id] <= 1">-</button>
              <input
                type="number"
                v-model.number="materialSellCounts[mat.id]"
                :min="1"
                :max="mat.count"
                class="count-input"
              />
              <button class="btn-mini" @click="increaseSellCount(mat)" :disabled="materialSellCounts[mat.id] >= mat.count">+</button>
              <span class="sell-max-btn" @click="setMaxSellCount(mat)">全部</span>
            </span>
            <span>× {{ getMaterialPrice(mat) }} = {{ getMaterialPrice(mat) * (materialSellCounts[mat.id] || 1) }} 灵石</span>
          </div>
        </div>
        <div class="sell-total">
          总计: <strong>{{ totalSellPrice }} 灵石</strong>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-small" @click="showMaterialSellModal = false">取消</button>
        <button class="btn-small btn-danger" @click="confirmSellMaterials">确认卖出</button>
      </div>
    </div>
  </div>

  <!-- 素材快速卖出弹窗 -->
  <div v-if="showQuickSellModal" class="simple-modal" @click.self="showQuickSellModal = false">
    <div class="simple-modal-content">
      <div class="modal-header">
        <h3>快速卖出</h3>
        <button class="btn-small" @click="showQuickSellModal = false">关闭</button>
      </div>
      <div class="modal-body">
        <p v-if="quickSellMaterial">
          {{ quickSellMaterial.name }}（持有 {{ quickSellMaterial.count }} 个）
        </p>
        <div class="quick-sell-count">
          <span>卖出数量：</span>
          <button class="btn-mini" @click="quickSellCount = Math.max(1, quickSellCount - 1)">-</button>
          <input
            type="number"
            v-model.number="quickSellCount"
            :min="1"
            :max="quickSellMaterial?.count || 1"
            class="count-input"
          />
          <button class="btn-mini" @click="quickSellCount = Math.min(quickSellMaterial?.count || 1, quickSellCount + 1)">+</button>
          <span class="sell-max-btn" @click="quickSellCount = quickSellMaterial?.count || 1">全部</span>
        </div>
        <p v-if="quickSellMaterial">
          预计获得：{{ getMaterialPrice(quickSellMaterial) * quickSellCount }} 灵石
        </p>
      </div>
      <div class="modal-actions">
        <button class="btn-small" @click="showQuickSellModal = false">取消</button>
        <button class="btn-small btn-danger" @click="confirmQuickSell">确认卖出</button>
      </div>
    </div>
  </div>

  <!-- 丹药服用弹窗 -->
  <div v-if="showPillConsumeModal" class="simple-modal" @click.self="showPillConsumeModal = false">
    <div class="simple-modal-content">
      <div class="modal-header">
        <h3>
          服用
          <span v-if="selectedPill" :style="{ color: getPillGradeColor(selectedPill.grade) }">
            {{ selectedPill.name }}
          </span>
        </h3>
        <button class="btn-small" @click="showPillConsumeModal = false">关闭</button>
      </div>
      <div class="modal-body">
        <template v-if="selectedPill">
          <div class="detail-row">
            <span>效果</span>
            <span class="pill-effect-value">{{ selectedPill.effectText }}</span>
          </div>
          <div class="detail-row">
            <span>持有</span>
            <span>×{{ selectedPill.count }}</span>
          </div>
          <div class="detail-row">
            <span>说明</span>
            <span>{{ selectedPill.description }}</span>
          </div>
          <div class="simple-divider">选择服用角色</div>
          <p v-if="isTeamBuffPill(selectedPill.effect?.type)" class="team-buff-hint">
            该丹药为全队增益，选择任意出战角色即可全队生效
          </p>
          <div v-if="pillConsumeMembers.length === 0" class="empty-state">
            当前没有出战角色
          </div>
          <div v-else class="equip-target-list">
            <div
              v-for="member in pillConsumeMembers"
              :key="member.id"
              class="equip-target-item"
              @click="consumePillForMember(member)"
            >
              <img v-if="member.portraitThumbnail || member.avatar" :src="member.portraitThumbnail || member.avatar" class="target-avatar" />
              <span class="target-name">{{ member.name }}</span>
              <span class="target-level">Lv.{{ member.level }}</span>
            </div>
          </div>
        </template>
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

  // 素材分类
  const materialCategories = [
    { key: 'all', label: '全部' },
    { key: 'herb', label: '灵草' },
    { key: 'ore', label: '矿料' },
    { key: 'liquid', label: '灵液' },
    { key: 'core', label: '妖核' },
    { key: 'special', label: '奇遇' }
  ]
  const selectedMaterialCategory = ref('all')

  const groupedMaterials = computed(() => {
    const map = {}
    const materials = playerStore.materials || []
    materials.forEach(mat => {
      const key = mat.id || mat.name + mat.kind
      if (!map[key]) {
        map[key] = { ...mat, count: 0 }
      }
      map[key].count++
    })
    return Object.values(map)
  })

  const filteredMaterials = computed(() => {
    if (selectedMaterialCategory.value === 'all') return groupedMaterials.value
    return groupedMaterials.value.filter(m => m.kind === selectedMaterialCategory.value)
  })

  const materialQualityNames = {
    common: '普通',
    uncommon: '优良',
    rare: '稀有',
    epic: '珍贵',
    legendary: '极品',
    mythic: '神品'
  }

  const materialQualityColors = {
    common: '#9e9e9e',
    uncommon: '#4caf50',
    rare: '#2196f3',
    epic: '#9c27b0',
    legendary: '#ff9800',
    mythic: '#f44336'
  }

  const materialKindNames = {
    herb: '灵草',
    ore: '矿料',
    liquid: '灵液',
    core: '妖核',
    special: '奇遇素材'
  }

  const MATERIAL_PRICE_MAP = {
    common: 5,
    uncommon: 10,
    rare: 25,
    epic: 60,
    legendary: 150,
    mythic: 400
  }

  const getMaterialQualityName = (mat) => materialQualityNames[mat.quality] || '普通'
  const getMaterialColor = (mat) => materialQualityColors[mat.quality] || '#9e9e9e'
  const getMaterialKindName = (kind) => materialKindNames[kind] || '素材'
  const getMaterialUnitPrice = (mat) => MATERIAL_PRICE_MAP[mat.quality] || 5
  const getMaterialTotalPrice = (mat) => getMaterialUnitPrice(mat) * (mat.count || 1)

  // 素材多选模式
  const isMaterialSelectMode = ref(false)
  const selectedMaterialIds = ref([])
  const materialSellCounts = ref({})
  const showMaterialSellModal = ref(false)
  const showQuickSellModal = ref(false)
  const quickSellMaterial = ref(null)
  const quickSellCount = ref(1)

  const openQuickSell = (mat) => {
    quickSellMaterial.value = mat
    quickSellCount.value = 1
    showQuickSellModal.value = true
  }

  const confirmQuickSell = () => {
    if (!quickSellMaterial.value) return
    const result = playerStore.sellMaterial(quickSellMaterial.value.kind, quickSellMaterial.value.id, quickSellCount.value)
    if (result.success) {
      message.success(`卖出 ${quickSellCount.value} 个${quickSellMaterial.value.name}，获得 ${result.totalPrice} 灵石`)
      showQuickSellModal.value = false
    } else {
      message.error(result.message || '卖出失败')
    }
  }

  const toggleMaterialSelectMode = () => {
    isMaterialSelectMode.value = !isMaterialSelectMode.value
    selectedMaterialIds.value = []
    materialSellCounts.value = {}
  }

  const isMaterialSelected = (mat) => selectedMaterialIds.value.includes(mat.id)

  const toggleMaterialSelect = (mat) => {
    const idx = selectedMaterialIds.value.indexOf(mat.id)
    if (idx >= 0) {
      selectedMaterialIds.value.splice(idx, 1)
      delete materialSellCounts.value[mat.id]
    } else {
      selectedMaterialIds.value.push(mat.id)
      materialSellCounts.value[mat.id] = mat.count
    }
  }

  const handleMaterialClick = (mat) => {
    if (isMaterialSelectMode.value) {
      toggleMaterialSelect(mat)
    } else {
      openQuickSell(mat)
    }
  }

  const selectedMaterials = computed(() => {
    return filteredMaterials.value.filter(m => selectedMaterialIds.value.includes(m.id))
  })

  const materialPriceMap = { common: 5, uncommon: 10, rare: 25, epic: 60, legendary: 150, mythic: 400 }
  const getMaterialPrice = (mat) => materialPriceMap[mat.quality] || 5

  const increaseSellCount = (mat) => {
    const cur = materialSellCounts.value[mat.id] || 1
    if (cur < mat.count) materialSellCounts.value[mat.id] = cur + 1
  }
  const decreaseSellCount = (mat) => {
    const cur = materialSellCounts.value[mat.id] || 1
    if (cur > 1) materialSellCounts.value[mat.id] = cur - 1
  }
  const setMaxSellCount = (mat) => {
    materialSellCounts.value[mat.id] = mat.count
  }

  const totalSellPrice = computed(() => {
    let total = 0
    selectedMaterials.value.forEach(mat => {
      const cnt = materialSellCounts.value[mat.id] || 1
      total += getMaterialPrice(mat) * cnt
    })
    return total
  })

  const confirmSellMaterials = () => {
    let totalGot = 0
    selectedMaterials.value.forEach(mat => {
      const cnt = materialSellCounts.value[mat.id] || 1
      const result = playerStore.sellMaterial(mat.kind, mat.id, cnt)
      if (result.success) totalGot += result.totalPrice
    })
    message.success(`卖出完成，共获得 ${totalGot} 灵石`)
    showMaterialSellModal.value = false
    isMaterialSelectMode.value = false
    selectedMaterialIds.value = []
    materialSellCounts.value = {}
  }

  // 丹药品阶颜色
  const pillGradeColors = {
    grade1: '#9e9e9e',
    grade2: '#4caf50',
    grade3: '#2196f3',
    grade4: '#9c27b0',
    grade5: '#ff9800',
    grade6: '#f44336',
    grade7: '#FFD700',
    grade8: '#00BFFF',
    grade9: '#FF00FF'
  }
  const getPillGradeColor = grade => pillGradeColors[grade] || '#DAA520'

  // 丹药效果描述（复用 Alchemy.vue 逻辑）
  const getEffectDescription = effect => {
    if (!effect) return '-'
    const statNames = { attack: '攻击', defense: '防御', health: '生命', speed: '速度' }
    switch (effect.type) {
      case 'permanentStat':
        return `永久${statNames[effect.stat] || effect.stat} +${Math.round(effect.value)}`
      case 'breakthroughRate':
        return `突破成功率 +${(effect.value * 100).toFixed(0)}%`
      case 'enhanceRate':
        return `强化成功率 +${(effect.value * 100).toFixed(0)}%`
      case 'reforgeSafe':
        return `洗练保底 ${Math.max(1, Math.round(effect.value))} 次`
      case 'healBattle':
        return `战斗回血 ${(effect.value * 100).toFixed(0)}% 最大生命`
      case 'cleanse':
        return '战斗中解控'
      case 'expGain':
        return `修为获取 +${(effect.value * 100).toFixed(0)}%`
      case 'dropRate':
        return `掉落加成 +${(effect.value * 100).toFixed(0)}%`
      case 'spiritStoneRate':
        return `灵石获取 +${(effect.value * 100).toFixed(0)}%`
      case 'cultivationRate':
        return `修炼速度 +${(effect.value * 100).toFixed(0)}%`
      case 'cultivationEfficiency':
        return `修炼效率 +${(effect.value * 100).toFixed(0)}%`
      case 'combatBoost':
        return `战斗属性 +${(effect.value * 100).toFixed(0)}%`
      case 'allAttributes':
        return `全属性 +${(effect.value * 100).toFixed(0)}%`
      case 'comprehension':
        return `悟性提升 +${(effect.value * 100).toFixed(0)}%`
      case 'autoHeal':
        return `每秒恢复 ${(effect.value * 100).toFixed(0)}% 最大生命`
      case 'effortGain': {
        let text = `努力值 +${Math.round(effect.value)} 点`
        if (effect.extraStats) {
          const extras = Object.entries(effect.extraStats)
            .map(([stat, val]) => `${statNames[stat] || stat} +${Math.round(val)}`)
            .join('，')
          text += `，${extras}`
        }
        return text
      }
      default:
        return `效果 +${effect.value}`
    }
  }

  // 基于 ownedPills 的丹药列表
  const groupedPills = computed(() => {
    return Object.entries(playerStore.ownedPills || {})
      .map(([pillId, data]) => {
        const recipe = pillRecipes.find(r => r.id === pillId)
        if (!recipe) return null
        const effect = calculatePillEffect(recipe, playerStore.level)
        return {
          id: pillId,
          name: recipe.name,
          description: recipe.description,
          grade: recipe.grade,
          type: recipe.type,
          count: data.count || 0,
          effect,
          effectText: getEffectDescription(effect)
        }
      })
      .filter(Boolean)
  })

  // 丹药服用弹窗
  const showPillConsumeModal = ref(false)
  const selectedPill = ref(null)
  const pillConsumeMembers = computed(() => playerStore.getTeamMembersDetail().filter(m => m))

  const openPillConsumeModal = pill => {
    selectedPill.value = pill
    showPillConsumeModal.value = true
  }

  // 全队 buff 类型（选择任意角色后全队生效）
  const isTeamBuffPill = effectType => {
    return ['spiritStoneRate', 'cultivationRate', 'cultivationEfficiency', 'expGain', 'dropRate', 'combatBoost', 'allAttributes', 'comprehension', 'autoHeal'].includes(effectType)
  }

  const consumePillForMember = member => {
    if (!selectedPill.value) return
    const result = playerStore.consumePill(selectedPill.value.id, member.id)
    if (result.success) {
      if (result.changes && result.changes.length > 0) {
        result.changes.forEach(change => {
          if (change.isGlobal) {
            window.$message?.success(`全队${change.stat} +${change.delta}${change.unit || ''}`)
          } else {
            window.$message?.success(`${member.name} ${change.stat} +${change.delta}${change.unit || ''}`)
          }
        })
      } else {
        message.success(result.message || '服用成功')
      }
      showPillConsumeModal.value = false
      selectedPill.value = null
    } else {
      message.error(result.message || '服用失败')
    }
  }

  // 标签页
  const activeTab = ref('materials')
  const tabs = [
    { name: 'materials', label: '素材' },
    { name: 'equipment', label: '装备' },
    { name: 'pills', label: '丹药' },
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
      const result = playerStore.releasePet(petToRelease.value.uid || petToRelease.value.id)
      if (result.success) {
        message.success(result.message)
      } else {
        message.error(result.message)
      }
      // 关闭所有相关弹窗
      showReleaseConfirm.value = false
      showPetModal.value = false
      petToRelease.value = null
    }
  }

  // 选中的放生品阶
  const selectedRarityToRelease = ref('all')

  // 收集被宗门成员装备的灵宠ID
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

  // 批量放生函数
  const batchReleasePets = () => {
    const toRelease = playerStore.items.filter(
      item =>
        item.type === 'pet' &&
        !equippedPetIds.value.has(item.uid || item.id) &&
        (selectedRarityToRelease.value === 'all' || item.rarity === selectedRarityToRelease.value)
    )
    let totalEssence = 0
    let totalFragments = 0
    let count = 0
    toRelease.forEach(pet => {
      const result = playerStore.releasePet(pet.uid || pet.id)
      if (result.success) {
        count++
        totalEssence += result.returnAmount || 0
        const fragmentReturn = (pet.star || 0) * 2 + Math.floor(({ divine: 100, celestial: 60, mystic: 35, spiritual: 20, mortal: 10 }[pet.rarity] || 5) / 10)
        totalFragments += fragmentReturn
      }
    })
    showBatchReleaseConfirm.value = false
    if (count > 0) {
      message.success(
        `已放生 ${count} 只${
          selectedRarityToRelease.value === 'all' ? '' : petRarities[selectedRarityToRelease.value].name + '品阶'
        }未出战灵宠，获得 ${totalEssence} 灵宠精华、${totalFragments} 升星碎片`
      )
    } else {
      message.warning('没有可放生的灵宠')
    }
  }

  // 显示灵宠详情
  const showPetDetails = pet => {
    selectedPet.value = pet
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

  // 升星灵宠
  const evolvePet = pet => {
    const result = playerStore.evolvePet(pet)
    if (result.success) {
      message.success(result.message)
      showPetModal.value = false
    } else {
      message.error(result.message)
    }
  }

  // 装备类型配置
  const equipmentTypes = {
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
  const EQUIPMENT_SLOTS = ['head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'necklace', 'ring1', 'ring2', 'belt', 'artifact']
  const isEquipmentItem = item => !!item && item.type !== 'pet' && item.type !== 'material' && (item.type === 'equipment' || (item.slot && EQUIPMENT_SLOTS.includes(item.slot)))

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

  // 装备标签页筛选变量
  const equipmentFilterCategory = ref('')
  const equipmentFilterQuality = ref('')

  // 装备列表弹窗标题（含“全部”）
  const equipmentModalTitle = computed(() => {
    if (!selectedEquipmentType.value || selectedEquipmentType.value === 'all') return '全部装备'
    return equipmentTypes[selectedEquipmentType.value] + '列表'
  })
  const currentEquipmentPage = ref(1)
  const equipmentPageSize = ref(8)

  // 装备分类映射
  const equipmentCategoryMap = {
    artifact: ['artifact'],
    armor: ['head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'belt'],
    accessory: ['necklace', 'ring1', 'ring2']
  }

  const getEquipCategoryName = (slot) => {
    if (equipmentCategoryMap.artifact.includes(slot)) return '法宝'
    if (equipmentCategoryMap.armor.includes(slot)) return '防具'
    if (equipmentCategoryMap.accessory.includes(slot)) return '饰品'
    return slot
  }

  // 装备标签页过滤后的列表
  const displayEquipmentList = computed(() => {
    let list = playerStore.items.filter(item => {
      if (!isEquipmentItem(item)) return false
      if (equipmentFilterCategory.value) {
        const slots = equipmentCategoryMap[equipmentFilterCategory.value]
        if (slots && !slots.includes(item.slot)) return false
      }
      if (equipmentFilterQuality.value && item.quality !== equipmentFilterQuality.value) return false
      return true
    })
    if (equipmentSortedByScore.value) {
      list = [...list].sort((a, b) => calculateEquipmentScore(b) - calculateEquipmentScore(a))
    }
    const start = (currentEquipmentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return list.slice(start, end)
  })

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

  // 过滤掉值为0/NaN/null的无意义词条，基础属性始终显示
  const filteredEquipmentStats = computed(() => {
    if (!selectedEquipment.value || !selectedEquipment.value.stats) return {}
    const result = {}
    Object.entries(selectedEquipment.value.stats).forEach(([stat, value]) => {
      if (['attack', 'health', 'defense', 'speed'].includes(stat) || (value && value !== 0 && !Number.isNaN(value))) {
        result[stat] = value
      }
    })
    return result
  })

  // 出售预览灵石（按评分折价）
  const sellPreview = computed(() => {
    if (!selectedEquipment.value) return 0
    return Math.max(1, Math.round((calculateEquipmentScore(selectedEquipment.value) || 0) * 0.1))
  })

  // 出售 / 分解选择弹窗
  const showSellDisassemble = ref(false)

  // 装备给出战角色弹窗
  const showEquipTargetModal = ref(false)
  const equipTargetMembers = computed(() => {
    return playerStore.getTeamMembersDetail().filter(m => m)
  })
  const equipToMember = (member) => {
    if (!selectedEquipment.value) return
    const slot = selectedEquipment.value.slot || selectedEquipment.value.type
    const result = playerStore.equipCharacterArtifact(member.id, selectedEquipment.value, slot)
    if (result.success) {
      message.success(result.message)
      showEquipTargetModal.value = false
      showEquipmentDetailModal.value = false
    } else {
      message.error(result.message || '装备失败')
    }
  }

  // 强化预览：计算 +1 到 +12 的属性
  const enhancePreview = computed(() => {
    if (!selectedEquipment.value) return []
    const base = selectedEquipment.value
    const previews = []
    for (let lv = 1; lv <= 12; lv++) {
      const multiplier = Math.pow(1.2, lv)
      const stats = {}
      for (const [stat, value] of Object.entries(base.stats || {})) {
        stats[stat] = typeof value === 'number' ? Math.round(value * multiplier * 10) / 10 : value
      }
      previews.push({ level: lv, multiplier, stats, score: Math.round(calculateEquipmentScore({ ...base, enhanceLevel: lv })) })
    }
    return previews
  })

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

  const getItemColor = (item) => item?.color || item?.qualityInfo?.color || '#DAA520'

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

  /* 装备详情弹窗：移动端铺满屏幕，桌面端居中缩小 */
  .simple-modal.equipment-detail-modal {
    padding: 0;
    align-items: flex-start;
  }

  .equipment-detail-modal .equipment-detail-content {
    width: 100%;
    max-width: 100%;
    height: calc(100vh - 80px);
    max-height: calc(100vh - 80px);
    border-radius: 0;
    padding: 16px 16px 24px;
  }

  @media (min-width: 769px) {
    .simple-modal.equipment-detail-modal {
      padding: 20px;
      align-items: center;
      justify-content: center;
    }

    .equipment-detail-modal .equipment-detail-content {
      width: 50vw;
      max-width: 720px;
      height: 80vh;
      max-height: 80vh;
      border-radius: 14px;
      padding: 18px 20px 24px;
    }
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

  /* 素材多选 */
  .material-toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
    align-items: center;
  }

  .material-card.selected {
    border-color: #DAA520;
    background: rgba(218, 165, 32, 0.1);
  }

  .material-checkbox {
    margin-right: 6px;
    cursor: pointer;
  }

  .material-kind {
    display: inline-block;
    margin-top: 4px;
    font-size: 11px;
    color: #888;
  }

  .material-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    margin-top: 4px;
  }

  .material-price {
    font-size: 11px;
    color: #aaa;
  }

  .material-total {
    margin-left: 6px;
    color: #FFD700;
    font-weight: bold;
  }

  /* 素材卖出弹窗 */
  .material-sell-list {
    max-height: 300px;
    overflow-y: auto;
    margin: 10px 0;
  }

  .material-sell-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 4px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    gap: 8px;
  }

  .material-sell-count {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .btn-mini {
    padding: 2px 8px;
    border: 1px solid rgba(139, 69, 19, 0.4);
    background: rgba(0, 0, 0, 0.3);
    color: #F5DEB3;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }

  .btn-mini:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .count-input {
    width: 50px;
    text-align: center;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(139, 69, 19, 0.3);
    color: #F5DEB3;
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 12px;
  }

  .sell-max-btn {
    font-size: 11px;
    color: #DAA520;
    cursor: pointer;
    padding: 2px 6px;
    border: 1px solid rgba(218, 165, 32, 0.4);
    border-radius: 4px;
  }

  .sell-total {
    margin-top: 12px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    text-align: right;
    font-size: 14px;
  }

  .sell-total strong {
    color: #DAA520;
    font-size: 16px;
  }

  /* 装备分类标签 */
  .equip-category-tag {
    font-size: 11px;
    padding: 1px 6px;
    background: rgba(30, 144, 255, 0.2);
    color: #64B5F6;
    border-radius: 4px;
    margin-left: 6px;
    font-weight: normal;
  }

  /* 强化预览 */
  .enhance-preview-section {
    margin-top: 8px;
  }
  .enhance-preview-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    max-height: 200px;
    overflow-y: auto;
  }
  .enhance-preview-header,
  .enhance-preview-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    padding: 4px 8px;
    text-align: center;
  }
  .enhance-preview-header {
    background: rgba(139, 69, 19, 0.2);
    color: #F5DEB3;
    font-weight: bold;
    position: sticky;
    top: 0;
  }
  .enhance-preview-row:nth-child(even) {
    background: rgba(255, 255, 255, 0.03);
  }

  /* 装备目标选择 */
  .equip-target-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
  }
  .equip-target-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(139, 69, 19, 0.2);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .equip-target-item:hover {
    background: rgba(218, 165, 32, 0.1);
    border-color: rgba(218, 165, 32, 0.4);
  }
  .target-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(218, 165, 32, 0.4);
  }
  .target-name {
    font-weight: bold;
    color: #F5DEB3;
    flex: 1;
  }
  .target-level {
    font-size: 12px;
    color: #aaa;
  }

  /* 快速卖出 */
  .quick-sell-count {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 0;
  }

  /* 丹药卡片 */
  .pill-card {
    position: relative;
  }

  .pill-card .card-header {
    align-items: flex-start;
  }

  .pill-grade-tag {
    font-size: 11px;
    padding: 1px 6px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    margin-left: 6px;
    font-weight: normal;
    color: #aaa;
  }

  .pill-count {
    font-size: 13px;
    color: #DAA520;
    font-weight: bold;
    white-space: nowrap;
  }

  .pill-effect {
    color: #9FD8A0;
    margin: 0 0 6px;
  }

  .pill-desc {
    font-size: 12px;
    color: #888;
    margin: 0;
  }

  /* 丹药服用弹窗 */
  .pill-effect-value {
    color: #9FD8A0;
    font-weight: bold;
  }

  .team-buff-hint {
    font-size: 12px;
    color: #DAA520;
    margin: 0 0 10px;
    padding: 8px 10px;
    background: rgba(218, 165, 32, 0.1);
    border-radius: 6px;
  }
</style>
