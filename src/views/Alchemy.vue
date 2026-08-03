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
        <div
          class="furnace-tab"
          :class="{ active: activeTab === 'shop' }"
          @click="switchToShop"
        >
          <span class="tab-icon">🏪</span>
          <span class="tab-label">灵石阁</span>
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
              <div class="recipe-filter-bar">
                <select v-model="recipeFilterGrade" class="recipe-filter-select">
                  <option value="">全部品阶</option>
                  <option v-for="g in recipeGradeOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
                </select>
                <select v-model="recipeFilterType" class="recipe-filter-select">
                  <option value="">全部类型</option>
                  <option v-for="t in recipeTypeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
                <button class="btn-small" :class="{ active: recipeOnlyCraftable }" @click="recipeOnlyCraftable = !recipeOnlyCraftable">
                  {{ recipeOnlyCraftable ? '✓ 仅可炼制' : '仅可炼制' }}
                </button>
              </div>
              <div class="recipes-grid">
                <div
                  class="recipe-card glass-card"
                  v-for="recipe in filteredRecipes"
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
                  <!-- 选中后内联展开：材料需求 + 效果预览 + 炼制数量 + 炼制按钮，全部直接显示在该丹药下方 -->
                  <div
                    v-if="selectedRecipe?.id === recipe.id"
                    class="craft-inline-detail"
                    @click.stop
                  >
                    <!-- 材料需求 -->
                    <div class="inline-section">
                      <h5 class="inline-section-title">材料需求</h5>
                      <div class="materials-list">
                        <div class="material-item" v-for="material in recipe.materials" :key="material.id || material.herb">
                          <div class="material-info">
                            <span class="material-name">{{ getMaterialName(material) }}</span>
                            <span class="material-source">{{ getMaterialSource(material) }}</span>
                            <span class="material-need">需要: {{ material.count }}</span>
                          </div>
                          <div
                            class="material-status"
                            :class="getMaterialStatusFor(recipe, material) === `${material.count}/${material.count}` ? 'success' : 'warning'"
                          >
                            {{ getMaterialStatusFor(recipe, material) }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- 效果预览 -->
                    <div class="inline-section">
                      <h5 class="inline-section-title">效果预览</h5>
                      <div class="effect-grid">
                        <div class="effect-item">
                          <div class="effect-label">{{ getEffectDescription(recipe).label }}</div>
                          <div class="effect-value highlight">{{ getEffectDescription(recipe).value }}</div>
                        </div>
                        <div class="effect-item">
                          <div class="effect-label">持续时间</div>
                          <div class="effect-value">{{ getDurationText(recipe) }}</div>
                        </div>
                        <div class="effect-item">
                          <div class="effect-label">成功率</div>
                          <div class="effect-value">{{ (pillGrades[recipe.grade].successRate * 100).toFixed(1) }}%</div>
                        </div>
                      </div>
                    </div>
                    <!-- 炼制数量与按钮 -->
                    <div class="craft-inline-row">
                      <span class="craft-count-label">数量</span>
                      <n-input-number
                        v-model:value="craftCount"
                        :min="1"
                        :max="maxCraftCountFor(recipe)"
                        :disabled="maxCraftCountFor(recipe) <= 1"
                        size="small"
                        style="width: 110px;"
                      />
                      <button
                        class="btn-small btn-primary"
                        :disabled="!checkMaterials(recipe, craftCount)"
                        @click="craftPillInline(recipe)"
                      >
                        {{ !checkMaterials(recipe, craftCount) ? '材料不足' : (craftCount > 1 ? `炼制 ×${craftCount}` : '炼制') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="empty-state">
            <n-empty description="暂未掌握任何丹方" />
            <p class="empty-hint">探索秘境可获得丹方残页</p>
          </div>
        </template>

        <!-- ==================== 装备锻打 ==================== -->
        <template v-if="activeTab === 'forge'">
          <div class="tips-box">
            <InfoCircleOutlined />
            <span>投入装备与锻材，以炉火淬炼装备属性。</span>
          </div>

          <div class="forge-sub-tabs">
            <div
              class="forge-sub-tab"
              :class="{ active: forgeTab === 'enhance' }"
              @click="forgeTab = 'enhance'"
            >
              <span class="tab-icon">⚔️</span>
              <span class="tab-label">强化</span>
            </div>
            <div
              class="forge-sub-tab"
              :class="{ active: forgeTab === 'reforge' }"
              @click="forgeTab = 'reforge'"
            >
              <span class="tab-icon">🔄</span>
              <span class="tab-label">洗练</span>
            </div>
            <div
              class="forge-sub-tab"
              :class="{ active: forgeTab === 'disassemble' }"
              @click="forgeTab = 'disassemble'"
            >
              <span class="tab-icon">🗑️</span>
              <span class="tab-label">分解</span>
            </div>
            <div
              class="forge-sub-tab"
              :class="{ active: forgeTab === 'exclusive' }"
              @click="forgeTab = 'exclusive'"
            >
              <span class="tab-icon">✨</span>
              <span class="tab-label">专属锻打</span>
            </div>
          </div>

          <div class="forge-content">
            <!-- 装备筛选工具栏 -->
            <div class="forge-toolbar">
              <select v-model="forgeFilterType" class="forge-select" @change="onForgeFilterChange">
                <option value="">全部种类</option>
                <option value="head">头部</option>
                <option value="body">衣服</option>
                <option value="legs">裤子</option>
                <option value="feet">鞋子</option>
                <option value="shoulder">肩甲</option>
                <option value="hands">手套</option>
                <option value="wrist">护腕</option>
                <option value="necklace">项链</option>
                <option value="ring1">戒指1</option>
                <option value="ring2">戒指2</option>
                <option value="belt">腰带</option>
                <option value="artifact">法宝</option>
              </select>
              <select v-model="forgeFilterRarity" class="forge-select" @change="onForgeFilterChange">
                <option value="">全部品级</option>
                <option value="mythic">神品</option>
                <option value="legendary">仙品</option>
                <option value="epic">极品</option>
                <option value="rare">上品</option>
                <option value="uncommon">良品</option>
                <option value="common">凡品</option>
              </select>
              <button class="btn-small forge-sort-btn" :class="{ active: forgeSortedByScore }" @click="toggleForgeSort">
                🔼 按评分排序
              </button>
            </div>

            <!-- 强化子菜单 -->
            <template v-if="forgeTab === 'enhance'">
              <template v-if="selectedForgeEquip">
                <div class="section forge-actions-section">
                  <h3 class="section-title">强化信息</h3>
                  <div class="enhance-info glass-card">
                    <div class="enhance-row">
                      <div class="enhance-label">当前等级</div>
                      <div class="enhance-value">+{{ selectedForgeEquip.enhanceLevel || 0 }}</div>
                    </div>
                    <div class="enhance-row">
                      <div class="enhance-label">目标等级</div>
                      <div class="enhance-value">+{{ (selectedForgeEquip.enhanceLevel || 0) + 1 }} <span class="enhance-cap-hint">（上限 +{{ getEquipMaxEnhanceLevel(selectedForgeEquip) }}）</span></div>
                    </div>
                    <div class="enhance-row">
                      <div class="enhance-label">成功率</div>
                      <div class="enhance-value">{{ getEnhanceSuccessRate(selectedForgeEquip) }}%</div>
                    </div>
                    <div class="enhance-row">
                      <div class="enhance-label">强化效果</div>
                      <div class="enhance-value">所有属性 × {{ enhanceConfig.enhanceMult }}</div>
                    </div>
                    <div class="enhance-row">
                      <div class="enhance-label">锁定等级</div>
                      <div class="enhance-value">
                        {{ getLockLevelDisplay(selectedForgeEquip) }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="section forge-actions-section">
                  <h3 class="section-title">消耗</h3>
                  <div class="cost-list">
                    <div class="cost-item">
                      <span class="cost-name">灵石</span>
                      <span class="cost-value" :class="{ insufficient: playerStore.spiritStones < getEnhanceGoldCost(selectedForgeEquip) }">
                        {{ playerStore.spiritStones }} / {{ getEnhanceGoldCost(selectedForgeEquip) }}
                      </span>
                    </div>
                    <div class="cost-item">
                      <span class="cost-name">{{ getEnhanceStoneName(selectedForgeEquip) }}</span>
                      <span class="cost-value" :class="{ insufficient: getEnhanceStoneCount(selectedForgeEquip) < getEnhanceStoneNeed(selectedForgeEquip) }">
                        {{ getEnhanceStoneCount(selectedForgeEquip) }} / {{ getEnhanceStoneNeed(selectedForgeEquip) }}
                      </span>
                    </div>
                    <div class="cost-item" v-if="getEnhanceBossMaterialInfo(selectedForgeEquip)">
                      <span class="cost-name">BOSS素材·{{ getEnhanceBossMaterialInfo(selectedForgeEquip).name }}</span>
                      <span class="cost-value" :class="{ insufficient: getEnhanceBossMaterialOwn(selectedForgeEquip) < getEnhanceBossMaterialInfo(selectedForgeEquip).count }">
                        {{ getEnhanceBossMaterialOwn(selectedForgeEquip) }} / {{ getEnhanceBossMaterialInfo(selectedForgeEquip).count }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="action-section forge-actions-section">
                  <button
                    class="btn-primary enhance-button"
                    :disabled="!canEnhance(selectedForgeEquip)"
                    @click="handleEnhance"
                  >
                    强化
                  </button>
                </div>
              </template>

              <div class="section">
                <h3 class="section-title">选择装备</h3>
                <div class="forge-pagination" v-if="forgeFilteredEquipments.length > forgePageSize">
                  <span>共 {{ forgeFilteredEquipments.length }} 件，第 {{ forgePage }}/{{ forgeTotalPages }} 页</span>
                  <button class="btn-small" :disabled="forgePage <= 1" @click="forgePrevPage">上一页</button>
                  <button class="btn-small" :disabled="forgePage >= forgeTotalPages" @click="forgeNextPage">下一页</button>
                </div>
                <div class="equipment-grid">
                  <div
                    v-for="equip in forgePagedEquipments"
                    :key="equip.id"
                    class="equipment-card glass-card"
                    :class="{ selected: selectedForgeEquip?.id === equip.id }"
                    @click="selectForgeEquip(equip)"
                  >
                    <div class="equip-header">
                      <span class="equip-name">{{ equip.name }}<span v-if="equip.enhanceLevel && equip.enhanceLevel > 0" class="equip-enhance">+{{ equip.enhanceLevel }}</span></span>
                      <span class="equip-rarity" :style="{ color: rarityConfig[equip.rarity || 'common']?.color }">
                        {{ rarityConfig[equip.rarity || 'common']?.name }}
                      </span>
                    </div>
                    <div class="equip-stats">
                      <div v-for="(val, key) in equip.stats" :key="key" class="equip-stat">
                        {{ getStatName(key) }}: {{ formatStatValue(key, val) }}
                      </div>
                    </div>
                    <div class="equip-info">
                      <span>强化: {{ equip.enhanceLevel || 0 }}/{{ getEquipMaxEnhanceLevel(equip) }}</span>
                      <span class="equip-score-badge">评分 {{ formatEquipmentScore(equip) }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="forgeFilteredEquipments.length === 0" class="empty-state">没有符合条件的装备</div>
              </div>
            </template>

            <!-- 洗练子菜单 -->
            <template v-if="forgeTab === 'reforge'">
              <template v-if="selectedForgeEquip">
                <div class="section forge-actions-section">
                  <h3 class="section-title">大洗练方式</h3>
                  <div class="reforge-mode">
                    <button
                      class="btn-primary"
                      :class="{ active: reforgeMode === 'all' }"
                      @click="reforgeMode = 'all'"
                    >
                      全部大洗练
                    </button>
                    <button
                      class="btn-info"
                      :class="{ active: reforgeMode === 'single' }"
                      :disabled="Object.keys(cleanAffixStats).length === 0"
                      @click="reforgeMode = 'single'"
                    >
                      {{ Object.keys(cleanAffixStats).length === 0 ? '无可用词条' : '单条大洗练' }}
                    </button>
                  </div>
                </div>

                <template v-if="reforgeMode === 'single'">
                  <div class="section forge-actions-section">
                    <h3 class="section-title">选择词条</h3>
                    <div v-if="Object.keys(cleanAffixStats).length === 0" class="empty-state">该装备无可大洗练词条</div>
                    <div v-else class="stat-select">
                      <button
                        v-for="(val, key) in cleanAffixStats"
                        :key="key"
                        class="stat-btn"
                        :class="{ active: selectedReforgeStat === key }"
                        @click="selectedReforgeStat = key"
                      >
                        {{ getStatName(key) }}: {{ formatStatValue(key, val) }}
                      </button>
                    </div>
                  </div>
                </template>

                <div class="section forge-actions-section">
                  <h3 class="section-title">大洗练消耗</h3>
                  <div class="cost-list">
                    <div class="cost-item">
                      <span class="cost-name">高级洗炼石</span>
                      <span class="cost-value" :class="{ insufficient: playerStore.refinementStones < reforgeConfig.costPerAttempt }">
                        {{ playerStore.refinementStones || 0 }} / {{ reforgeConfig.costPerAttempt }}
                      </span>
                    </div>
                    <div class="cost-item" v-if="getReforgeBossMaterialInfo(selectedForgeEquip)">
                      <span class="cost-name">BOSS素材·{{ getReforgeBossMaterialInfo(selectedForgeEquip).name }}</span>
                      <span class="cost-value" :class="{ insufficient: getReforgeBossMaterialOwn(selectedForgeEquip) < getReforgeBossMaterialInfo(selectedForgeEquip).count }">
                        {{ getReforgeBossMaterialOwn(selectedForgeEquip) }} / {{ getReforgeBossMaterialInfo(selectedForgeEquip).count }}
                      </span>
                    </div>
                  </div>
                  <div class="reforge-safe">
                    <span>定灵丹保底: {{ playerStore.reforgeSafeCharges }} 次</span>
                  </div>
                </div>

                <div class="action-section forge-actions-section">
                  <button
                    class="btn-primary reforge-button"
                    :disabled="!canReforge(selectedForgeEquip)"
                    @click="handleReforge"
                  >
                    大洗练
                  </button>
                </div>

                <template v-if="reforgeResult">
                  <div class="section forge-actions-section">
                    <h3 class="section-title">大洗练结果</h3>
                    <div class="reforge-result glass-card">
                      <div class="reforge-compare">
                        <div class="reforge-old">
                          <h4>原属性</h4>
                          <div v-for="(val, key) in reforgeResult.oldStats" :key="key" class="reforge-stat">
                            {{ getStatName(key) }}: {{ formatStatValue(key, val) }}
                          </div>
                        </div>
                        <div class="reforge-arrow">→</div>
                        <div class="reforge-new">
                          <h4>新属性</h4>
                          <div v-for="(val, key) in reforgeResult.newStats" :key="key" class="reforge-stat">
                            {{ getStatName(key) }}: {{ formatStatValue(key, val) }}
                          </div>
                        </div>
                      </div>
                      <div class="reforge-actions">
                        <button class="btn-small" @click="reforgeResult = null">保留原属性</button>
                        <button class="btn-small btn-primary" @click="confirmReforgeResult">确认替换</button>
                      </div>
                    </div>
                  </div>
                </template>
              </template>

              <div class="section">
                <h3 class="section-title">选择装备</h3>
                <div class="forge-pagination" v-if="forgeFilteredEquipments.length > forgePageSize">
                  <span>共 {{ forgeFilteredEquipments.length }} 件，第 {{ forgePage }}/{{ forgeTotalPages }} 页</span>
                  <button class="btn-small" :disabled="forgePage <= 1" @click="forgePrevPage">上一页</button>
                  <button class="btn-small" :disabled="forgePage >= forgeTotalPages" @click="forgeNextPage">下一页</button>
                </div>
                <div class="equipment-grid">
                  <div
                    v-for="equip in forgePagedEquipments"
                    :key="equip.id"
                    class="equipment-card glass-card"
                    :class="{ selected: selectedForgeEquip?.id === equip.id }"
                    @click="selectForgeEquip(equip)"
                  >
                    <div class="equip-header">
                      <span class="equip-name">{{ equip.name }}<span v-if="equip.enhanceLevel && equip.enhanceLevel > 0" class="equip-enhance">+{{ equip.enhanceLevel }}</span></span>
                      <span class="equip-rarity" :style="{ color: rarityConfig[equip.rarity || 'common']?.color }">
                        {{ rarityConfig[equip.rarity || 'common']?.name }}
                      </span>
                    </div>
                    <div class="equip-stats">
                      <div v-for="(val, key) in equip.stats" :key="key" class="equip-stat">
                        {{ getStatName(key) }}: {{ formatStatValue(key, val) }}
                      </div>
                    </div>
                    <div class="equip-info">
                      <span>词条数: {{ (equip.affixes ? equip.affixes.length : 0) }}/{{ reforgeConfig.affixMaxCount[equip.rarity || 'common'] }}</span>
                      <span class="equip-score-badge">评分 {{ formatEquipmentScore(equip) }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="forgeFilteredEquipments.length === 0" class="empty-state">没有符合条件的装备</div>
              </div>
            </template>

            <!-- 分解子菜单 -->
            <template v-if="forgeTab === 'disassemble'">
              <div class="section">
                <h3 class="section-title">选择装备（可多选）</h3>
                <div class="forge-pagination">
                  <span>共 {{ forgeFilteredInventory.length }} 件，第 {{ forgePage }}/{{ forgeInventoryTotalPages }} 页</span>
                  <span style="color: #FFD700;">已选 {{ selectedDisassembleIds.length }} 件</span>
                  <div class="forge-pagination-actions">
                    <button class="btn-small" :disabled="forgePage <= 1" @click="forgeInvPrevPage">上一页</button>
                    <button class="btn-small" :disabled="forgePage >= forgeInventoryTotalPages" @click="forgeInvNextPage">下一页</button>
                    <button class="btn-small" @click="selectAllCurrentPage">全选当前页</button>
                    <button class="btn-small btn-danger" @click="selectedDisassembleIds = []">清空选择</button>
                    <button
                      class="btn-small btn-primary"
                      :disabled="selectedDisassembleIds.length === 0"
                      @click="handleBatchDisassemble"
                    >
                      批量分解
                    </button>
                  </div>
                </div>
                <div class="equipment-grid">
                  <div
                    v-for="equip in forgePagedInventory"
                    :key="equip.id"
                    class="equipment-card glass-card"
                    :class="{ selected: selectedDisassembleIds.includes(equip.id) }"
                    @click="toggleDisassembleSelect(equip.id)"
                  >
                    <div class="equip-checkbox">
                      <span v-if="selectedDisassembleIds.includes(equip.id)">✓</span>
                    </div>
                    <div class="equip-header">
                      <span class="equip-name">{{ equip.name }}<span v-if="equip.enhanceLevel && equip.enhanceLevel > 0" class="equip-enhance">+{{ equip.enhanceLevel }}</span></span>
                      <span class="equip-rarity" :style="{ color: rarityConfig[equip.rarity || 'common']?.color }">
                        {{ rarityConfig[equip.rarity || 'common']?.name }}
                      </span>
                    </div>
                    <div class="equip-stats">
                      <div v-for="(val, key) in equip.stats" :key="key" class="equip-stat">
                        {{ getStatName(key) }}: {{ formatStatValue(key, val) }}
                      </div>
                    </div>
                    <div class="equip-info">
                      <span class="equip-score-badge">评分 {{ formatEquipmentScore(equip) }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="forgeFilteredInventory.length === 0" class="empty-state">没有符合条件的装备</div>
              </div>
            </template>

            <!-- 专属锻打子菜单 -->
            <template v-if="forgeTab === 'exclusive'">
              <div class="tips-box">
                <InfoCircleOutlined />
                <span>消耗 1 件任意神品装备 + 100 个该角色内丹碎片，可打造对应人物的专属装备。专属装备仅神品稀有度，每个角色 6 件（头/衣/裤/鞋/肩/手），对应角色穿戴时整体数值 ×1.3，可强化至 +15（+13~15 成长与成功率与 +12 一致）。</span>
              </div>

              <!-- 人物下拉筛选 -->
              <div class="section">
                <h3 class="section-title">选择角色</h3>
                <select v-model="exclSelectedCharId" class="forge-select excl-char-select" @change="onExclCharChange">
                  <option value="">请选择角色</option>
                  <option v-for="char in exclCraftableCharacters" :key="char.id" :value="char.id">
                    {{ char.name }} ({{ char.star }}★)
                  </option>
                </select>
              </div>

              <template v-if="exclSelectedCharId">
                <!-- 6 个部位选择 -->
                <div class="section">
                  <h3 class="section-title">选择部位（共 6 件专属装备）</h3>
                  <div class="excl-slot-grid">
                    <div
                      v-for="slot in exclSlots"
                      :key="slot.slot"
                      class="excl-slot-item glass-card"
                      :class="{ selected: exclSelectedSlot === slot.slot }"
                      @click="exclSelectedSlot = slot.slot"
                    >
                      <div class="excl-slot-name">{{ slot.slotName }}</div>
                      <div class="excl-slot-owned" v-if="exclOwnedCount(slot.slot) > 0">已打造 ×{{ exclOwnedCount(slot.slot) }}</div>
                    </div>
                  </div>
                </div>

                <template v-if="exclSelectedSlot">
                  <!-- 材料需求 -->
                  <div class="section">
                    <h3 class="section-title">打造消耗</h3>
                    <div class="cost-list">
                      <div class="cost-item excl-source-row">
                        <span class="cost-name">神品装备</span>
                        <button
                          class="excl-source-btn"
                          :class="{ insufficient: exclMythicCount < 1 && !exclSelectedSourceId }"
                          @click="openExclSourcePicker"
                        >
                          {{ exclSelectedSourceLabel }}
                        </button>
                      </div>
                      <div class="cost-item">
                        <span class="cost-name">{{ exclInnerPillName }}</span>
                        <span class="cost-value" :class="{ insufficient: exclInnerPillCount < EXCLUSIVE_EQUIP_CONFIG.innerPillCost }">
                          {{ exclInnerPillCount }} / {{ EXCLUSIVE_EQUIP_CONFIG.innerPillCost }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- 预览 -->
                  <div class="section">
                    <h3 class="section-title">装备预览</h3>
                    <div class="excl-preview glass-card">
                      <div class="excl-preview-name">{{ exclPreviewName }}</div>
                      <div class="excl-preview-tags">
                        <span class="excl-tag rarity-mythic">神品</span>
                        <span class="excl-tag excl-tag-bind">{{ exclCharName }} 专属</span>
                        <span class="excl-tag excl-tag-bonus">穿戴 ×1.3</span>
                        <span class="excl-tag excl-tag-enhance">可强化 +15</span>
                      </div>
                      <div class="excl-preview-note">
                        专属装备固定 5 条主属性 + 词缀；对应角色穿戴时整体数值 ×1.3；
                        +13~15 强化成功率与 +12 一致（37%），成长倍率同为 ×1.2。
                      </div>
                    </div>
                  </div>

                  <div class="action-section forge-actions-section">
                    <button
                      class="btn-primary enhance-button"
                      :disabled="!canCraftExclusive()"
                      @click="handleCraftExclusive"
                    >
                      ✨ 打造专属装备
                    </button>
                  </div>

                  <!-- 已拥有的该角色专属装备 -->
                  <div class="section" v-if="exclOwnedEquipments.length > 0">
                    <h3 class="section-title">已拥有的 {{ exclCharName }} 专属装备</h3>
                    <div class="equipment-grid">
                      <div v-for="eq in exclOwnedEquipments" :key="eq.id" class="equipment-card glass-card">
                        <div class="equip-header">
                          <span class="equip-name">{{ eq.name }}<span v-if="eq.enhanceLevel" class="equip-enhance">+{{ eq.enhanceLevel }}</span></span>
                          <span class="equip-rarity" :style="{ color: rarityConfig['mythic']?.color }">神品</span>
                        </div>
                        <div class="equip-stats">
                          <div v-for="(val, key) in eq.stats" :key="key" class="equip-stat">
                            {{ getStatName(key) }}: {{ formatStatValue(key, val) }}
                          </div>
                        </div>
                        <div class="equip-info">
                          <span>强化: {{ eq.enhanceLevel || 0 }}/{{ EXCLUSIVE_EQUIP_CONFIG.maxEnhanceLevel }}</span>
                          <span class="equip-score-badge">评分 {{ formatEquipmentScore(eq) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
              <div v-else class="empty-state">请先在上方下拉选择角色</div>
            </template>
          </div>

          <!-- 神品装备来源选择菜单 -->
          <div v-if="exclSourcePickerVisible" class="excl-source-picker-mask" @click.self="exclSourcePickerVisible = false">
            <div class="excl-source-picker glass-card">
              <div class="excl-source-picker-header">
                <h3 class="excl-source-picker-title">选择神品装备作为材料</h3>
                <button class="excl-source-picker-close" @click="exclSourcePickerVisible = false">×</button>
              </div>
              <div class="excl-source-filter">
                <input
                  v-model="exclSourceKeyword"
                  class="excl-filter-input"
                  placeholder="输入装备名称搜索"
                />
                <select v-model="exclSourceFilterSlot" class="excl-filter-select">
                  <option value="">全部部位</option>
                  <option v-for="slot in EXCLUSIVE_EQUIP_SLOTS" :key="slot" :value="slot">
                    {{ EXCLUSIVE_SLOT_NAMES[slot] }}
                  </option>
                  <option value="wrist">护腕</option>
                  <option value="necklace">项链</option>
                  <option value="ring1">戒指1</option>
                  <option value="ring2">戒指2</option>
                  <option value="belt">腰带</option>
                  <option value="artifact">法宝</option>
                </select>
              </div>
              <div class="excl-source-picker-body">
                <div v-if="exclMythicEquipments.length === 0" class="excl-source-empty">
                  没有符合条件的神品装备
                </div>
                <div
                  v-for="equip in exclMythicEquipments"
                  :key="equip.id"
                  class="excl-source-item glass-card"
                  :class="{ selected: exclSelectedSourceId === equip.id }"
                  @click="pickExclSource(equip.id)"
                >
                  <div class="excl-source-item-header">
                    <span class="excl-source-item-name">{{ equip.name }}</span>
                    <span class="excl-source-item-rarity">神品</span>
                  </div>
                  <div class="excl-source-item-meta">
                    <span>部位: {{ EXCLUSIVE_SLOT_NAMES[equip.slot] || equip.slot || '-' }}</span>
                    <span>评分: {{ formatEquipmentScore(equip) }}</span>
                    <span v-if="equip.enhanceLevel">+{{ equip.enhanceLevel }}</span>
                  </div>
                  <div class="excl-source-item-stats">
                    <span v-for="(val, key) in equip.stats" :key="key" class="excl-source-stat">
                      {{ getStatName(key) }}: {{ formatStatValue(key, val) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="excl-source-picker-footer">
                <button class="btn-small btn-outline" @click="clearExclSource">清除选择</button>
                <button class="btn-small btn-primary" @click="exclSourcePickerVisible = false">关闭</button>
              </div>
            </div>
          </div>
        </template>

        <!-- ==================== 回炉转生 ==================== -->
        <template v-if="activeTab === 'rebirth'">
          <!-- 回炉转生二级子菜单：人物重生 / 化器成灵 -->
          <div class="forge-sub-tabs rebirth-sub-tabs">
            <div
              class="forge-sub-tab"
              :class="{ active: rebirthTab === 'rebirth' }"
              @click="rebirthTab = 'rebirth'"
            >
              <span class="sub-tab-icon">♻️</span>
              <span class="sub-tab-label">人物重生</span>
            </div>
            <div
              class="forge-sub-tab"
              :class="{ active: rebirthTab === 'transmute' }"
              @click="rebirthTab = 'transmute'"
            >
              <span class="sub-tab-icon">✨</span>
              <span class="sub-tab-label">化器成灵</span>
            </div>
          </div>

          <!-- 人物重生 -->
          <template v-if="rebirthTab === 'rebirth'">
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
                v-memo="[member.id, member.level, member.star, Math.round(member.effortValue || 0)]"
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
                    <div class="preview-star" :style="{ color: starConfig[rebirthPreview?.currentStar]?.color }">
                      {{ '★'.repeat(rebirthPreview?.currentStar) }}
                    </div>
                    <div class="preview-value">天赋值: {{ rebirthPreview?.currentTalent }}</div>
                  </div>
                  <div class="preview-arrow">→</div>
                  <div class="preview-col">
                    <div class="preview-label">升星后</div>
                    <div class="preview-star" :style="{ color: starConfig[rebirthPreview?.nextStar]?.color }">
                      {{ '★'.repeat(rebirthPreview?.nextStar) }}
                    </div>
                    <div class="preview-value highlight">天赋值: {{ rebirthPreview?.newTalent }}</div>
                    <div class="preview-bonus">+{{ rebirthPreview?.inheritedBonus }} 继承加成</div>
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

          <!-- 化器成灵 -->
          <template v-if="rebirthTab === 'transmute'">
            <div class="tips-box">
              <InfoCircleOutlined />
              <span>选取 <b>+8 及以上</b>的仙品/神品装备，将其 1/3 基础数值永久融入人物。化器成灵 <b>100% 必成功</b>，仅消耗灵石与装备；强化难度与失败保底已下放到装备强化系统（+1~+12）。</span>
            </div>

            <!-- 选择目标人物（下拉菜单） -->
            <div class="section transmute-select-section">
              <h3 class="section-title">选择目标人物</h3>
              <n-select
                v-model:value="selectedTransmuteMemberId"
                :options="transmuteMemberOptions"
                placeholder="选择目标人物"
                class="transmute-select"
                filterable
                clearable
              >
                <template #render-label="{ option }">
                  <div class="transmute-member-option">
                    <span class="transmute-member-name">{{ option.label }}</span>
                    <span class="transmute-member-sub">{{ option.subText }}</span>
                  </div>
                </template>
              </n-select>
            </div>

            <template v-if="selectedTransmuteMember">
              <!-- 选择神器装备（下拉菜单，含评分） -->
              <div class="section transmute-select-section">
                <h3 class="section-title">选择 +8 及以上 仙品/神品装备</h3>
                <div v-if="transmuteEquipments.length === 0" class="empty-state">
                  暂无 +8 及以上的仙品/神品装备（背包中未装备的）
                </div>
                <n-select
                  v-else
                  v-model:value="selectedTransmuteEquipId"
                  :options="transmuteEquipOptions"
                  placeholder="选择装备"
                  class="transmute-select"
                  filterable
                  clearable
                >
                  <template #render-label="{ option }">
                    <div class="transmute-equip-option">
                      <span class="transmute-equip-option-name" :style="{ color: option.color }">{{ option.label }}</span>
                      <span class="transmute-equip-option-score">评分 {{ option.scoreText }}</span>
                    </div>
                  </template>
                </n-select>
              </div>

              <!-- 底部确认按钮区 + 预览 -->
              <div class="section transmute-confirm-section" v-if="selectedTransmuteEquip">
                <h3 class="section-title">化器成灵预览</h3>
                <div class="rebirth-preview glass-card">
                  <div class="preview-row">
                    <div class="preview-col">
                      <div class="preview-label">装备</div>
                      <div class="preview-value" :style="{ color: getRarityColor(selectedTransmuteEquip) }">
                        {{ selectedTransmuteEquip.name }} +{{ selectedTransmuteEquip.enhanceLevel }}
                      </div>
                      <div class="preview-value">评分 {{ formatScore(selectedTransmuteEquip) }}</div>
                      <div class="preview-value">品质: {{ getRarityName(selectedTransmuteEquip) }}</div>
                    </div>
                    <div class="preview-arrow">→</div>
                    <div class="preview-col">
                      <div class="preview-label">融入 {{ selectedTransmuteMember.name }}</div>
                      <div class="preview-value highlight">攻 +{{ transmuteBonus.attack }}</div>
                      <div class="preview-value highlight">血 +{{ transmuteBonus.health }}</div>
                      <div class="preview-value highlight">防 +{{ transmuteBonus.defense }}</div>
                      <div class="preview-value highlight">速 +{{ transmuteBonus.speed }}</div>
                    </div>
                  </div>
                  <div class="preview-note">
                    <p>📌 成功率: <b class="success-text">100%</b>（化器成灵必成功，失败概率仅存在于装备强化阶段）</p>
                    <p>📌 灵石消耗: <b class="gold-text">{{ transmuteStoneCost.toLocaleString() }}</b></p>
                    <p>📌 成功后装备消失，1/3 基础数值永久加成到人物</p>
                  </div>
                </div>

                <div class="action-section transmute-action">
                  <button
                    class="btn-primary rebirth-button"
                    :disabled="!canTransmute"
                    @click="requestTransmute"
                  >
                    ✨ 确认化器成灵
                  </button>
                </div>
              </div>
            </template>

            <n-modal v-model:show="showTransmuteConfirm" preset="dialog" title="确认化器成灵"
              positive-text="确认融入" negative-text="取消" @positive-click="confirmTransmute">
              <p>确定要将 <strong :style="{ color: getRarityColor(selectedTransmuteEquip) }">{{ selectedTransmuteEquip?.name }}</strong> 融入 <strong>{{ selectedTransmuteMember?.name }}</strong> 吗？</p>
              <p style="color: #d4a017;">消耗灵石 {{ transmuteStoneCost.toLocaleString() }}，成功率 100%</p>
              <p style="color: #ff6b6b;">装备将永久消失，1/3 基础数值永久加成到人物。</p>
            </n-modal>
          </template>
        </template>

        <!-- ==================== 灵石阁（商店） ==================== -->
        <template v-if="activeTab === 'shop'">
          <!-- 当前资产 + 出售折价状态 -->
          <div class="shop-status-bar">
            <span class="shop-balance">灵石：<b class="gold-text">{{ formatNumber(playerStore.spiritStones) }}</b></span>
            <span class="shop-sell-tracker">本月已售装备：{{ playerStore.sellTracker?.soldCount || 0 }} 件（折率 {{ currentSellRateText }}）</span>
          </div>

          <!-- 求材区（定向 BOSS 素材兑换） -->
          <div class="section">
            <h3 class="section-title">求材（定向素材兑换）</h3>
            <p class="section-hint">仅开放已通关秘境的 BOSS 素材；溢价定价、每日限量，用于突破 / 强化「解卡」。</p>
            <div class="shop-grid">
              <div
                v-for="item in seekCatalog"
                :key="item.id"
                class="shop-card seek-card"
                :class="{ needed: item.neededForBreakthrough }"
              >
                <div class="shop-card-header">
                  <span class="shop-icon">🔩</span>
                  <span class="shop-name">{{ item.name }}</span>
                  <span v-if="item.neededForBreakthrough" class="rarity-badge needed-tag">即将突破</span>
                </div>
                <p class="shop-desc">{{ item.description }}</p>
                <div class="seek-meta">
                  <span>持有：{{ item.owned }}</span>
                  <span>今日余：{{ item.remaining }}</span>
                </div>
                <div class="shop-card-footer">
                  <span class="shop-price">{{ formatNumber(item.price) }} 灵石</span>
                  <button
                    class="btn-small btn-buy"
                    :disabled="!item.canBuy"
                    @click="buySeek(item.id)"
                  >兑换</button>
                </div>
              </div>
            </div>
            <div v-if="seekCatalog.length === 0" class="empty-state">尚未解锁任何秘境 BOSS 素材，先去突破吧。</div>
          </div>


          <!-- 点化区（定向工艺货币兑换） -->
          <div class="section">
            <h3 class="section-title">点化（定向工艺货币）</h3>
            <p class="section-hint">仅开放已farm到的秘境货币；溢价定价、每日限量，用于词缀升档/重铸「补缺」。</p>
            <div class="shop-grid">
              <div v-for="item in craftCatalog" :key="item.id" class="shop-card craft-card" :class="{ boss: item.bossOnly }">
                <div class="shop-card-header">
                  <span class="shop-icon">⚗️</span>
                  <span class="shop-name">{{ item.name }}</span>
                  <span v-if="item.bossOnly" class="rarity-badge boss-tag">BOSS</span>
                </div>
                <p class="shop-desc">{{ item.desc }}</p>
                <div class="seek-meta">
                  <span>持有：{{ item.owned }}</span>
                  <span>今日余：{{ item.remaining }}</span>
                </div>
                <div class="shop-card-footer">
                  <span class="shop-price">{{ formatNumber(item.price) }} 灵石</span>
                  <button class="btn-small btn-buy" :disabled="!item.canBuy" @click="buyCraft(item.id)">兑换</button>
                </div>
              </div>
            </div>
            <div v-if="craftCatalog.length === 0" class="empty-state">尚未farm到任何工艺货币秘境。</div>
          </div>

          <!-- 开纹区（定向灵纹兑换） -->
          <div class="section">
            <h3 class="section-title">开纹（定向灵纹）</h3>
            <p class="section-hint">灵纹随机掉落，商店补「指定灵纹」出口；epic 灵纹需更高秘境进度。</p>
            <div class="shop-grid">
              <div v-for="item in runeCatalog" :key="item.id" class="shop-card rune-card" :class="{ locked: !item.unlocked, epic: item.rarity==='epic' }">
                <div class="shop-card-header">
                  <span class="shop-icon">🔯</span>
                  <span class="shop-name">{{ item.name }}</span>
                  <span class="rarity-badge" :class="item.rarity">{{ item.rarity==='epic' ? '极品' : '稀有' }}</span>
                </div>
                <p class="shop-desc">{{ runeStatLabel(item) }}</p>
                <div class="seek-meta">
                  <span>持有：{{ item.owned }}</span>
                  <span v-if="item.unlocked">今日余：{{ item.remaining }}</span>
                  <span v-else class="locked-tag">未解锁</span>
                </div>
                <div class="shop-card-footer">
                  <span class="shop-price">{{ item.unlocked ? formatNumber(item.price) + ' 灵石' : '—' }}</span>
                  <button class="btn-small btn-buy" :disabled="!item.canBuy" @click="buyRune(item.id)">兑换</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 觅宝/悬赏区（挑战券 → 定向稀缺资源） -->
          <div class="section">
            <div class="black-market-header">
              <h3 class="section-title">觅宝/悬赏（挑战券兑稀缺）</h3>
              <button
                class="btn-small btn-refresh"
                :disabled="bountyCatalog.rerollCount >= bountyCatalog.rerollMax || playerStore.spiritStones < bountyCatalog.rerollCost"
                @click="rerollBounty"
              >刷新悬赏 ({{ bountyCatalog.rerollMax - bountyCatalog.rerollCount }}/{{ bountyCatalog.rerollMax }}) - {{ formatNumber(bountyCatalog.rerollCost) }} 灵石</button>
            </div>
            <p class="section-hint">消耗专属挑战券，保底换得该秘境定向稀缺资源（BOSS素材/工艺货币/灵纹）；每日限量，用于清 surplus 券。</p>
            <div class="shop-grid">
              <div v-for="item in bountyCatalog.items" :key="item.uid" class="shop-card bounty-card" :class="{ claimed: item.claimed }">
                <div class="shop-card-header">
                  <span class="shop-icon">🎟️</span>
                  <span class="shop-name">{{ item.ticketName }}</span>
                  <span v-if="item.claimed" class="rarity-badge claimed-tag">已领</span>
                </div>
                <p class="shop-desc">上交 {{ item.ticketCost }} 张 → 获得 {{ item.grantName }}（{{ item.grantKind === 'boss_material' ? 'BOSS素材' : item.grantKind === 'craft_currency' ? '工艺货币' : '灵纹' }}）</p>
                <div class="seek-meta">
                  <span>持有券：{{ item.ticketOwned }}</span>
                  <span>需：{{ item.ticketCost }}</span>
                </div>
                <div class="shop-card-footer">
                  <span class="shop-price">消耗 {{ item.ticketCost }} 挑战券</span>
                  <button class="btn-small btn-buy" :disabled="!item.canClaim || item.claimed" @click="buyBounty(item.uid)">领取</button>
                </div>
              </div>
            </div>
            <div v-if="bountyCatalog.items.length === 0" class="empty-state">暂无可接悬赏。</div>
          </div>

          <!-- 易物区（多余 ore ↔ 稀缺 boss_material） -->
          <div class="section">
            <h3 class="section-title">易物（矿料换 BOSS 素材）</h3>
            <p class="section-hint">以盈余矿料（{{ barterCatalog.oreId }}）为主、少量灵石为辅，定向换取已解锁秘境的 BOSS 素材；每日限量。</p>
            <div class="shop-grid">
              <div v-for="item in barterCatalog.items" :key="item.id" class="shop-card barter-card">
                <div class="shop-card-header">
                  <span class="shop-icon">⛏️</span>
                  <span class="shop-name">{{ item.name }}</span>
                </div>
                <p class="shop-desc">{{ item.description }}</p>
                <div class="seek-meta">
                  <span>矿料：{{ item.oreOwned }}/{{ item.oreCost }}</span>
                  <span>今日余：{{ item.remaining }}</span>
                </div>
                <div class="shop-card-footer">
                  <span class="shop-price">{{ item.oreCost }} 矿料 + {{ formatNumber(item.stonePremium) }} 灵石</span>
                  <button class="btn-small btn-buy" :disabled="!item.canBuy" @click="buyBarter(item.id)">易物</button>
                </div>
              </div>
            </div>
            <div v-if="barterCatalog.items.length === 0" class="empty-state">尚未解锁任何秘境 BOSS 素材，先去突破吧。</div>
          </div>

          <!-- 人物挑战券兑换区（下拉选择人物，按星级定价） -->
          <div class="section">
            <h3 class="section-title">人物挑战券（直接挑战人物 BOSS）</h3>
            <p class="section-hint">消耗灵石直接兑换指定人物 BOSS 的挑战券：3星 5万/张、4星 10万/张、5星 20万/张。灭世难度刷出的人物 BOSS 也可掉落对应挑战券。</p>
            <div class="char-ticket-exchange">
              <div class="char-ticket-select-row">
                <span class="char-ticket-label">选择人物：</span>
                <n-select
                  v-model:value="selectedCharacterId"
                  :options="characterTicketOptions"
                  placeholder="请选择拟兑换挑战券的人物"
                  filterable
                  class="char-ticket-select"
                />
              </div>
              <div v-if="selectedTicketInfo" class="char-ticket-info glass-card">
                <div class="char-ticket-detail">
                  <span class="char-ticket-name">{{ selectedTicketInfo.characterName }}</span>
                  <span class="rarity-badge" :class="starClass(selectedTicketInfo.star)">{{ selectedTicketInfo.star }}星</span>
                  <span class="char-ticket-owned">持有券：{{ selectedTicketInfo.owned }}</span>
                </div>
                <div class="char-ticket-price">{{ formatNumber(selectedTicketInfo.price) }} 灵石 / 张</div>
                <div class="char-ticket-actions">
                  <n-input-number v-model:value="ticketBuyCount" :min="1" :max="20" class="char-ticket-count" />
                  <button
                    class="btn-small btn-buy"
                    :disabled="!selectedTicketInfo.canBuy || playerStore.spiritStones < selectedTicketInfo.price * ticketBuyCount"
                    @click="buyCharacterTicket"
                  >兑换 ×{{ ticketBuyCount }}（{{ formatNumber(selectedTicketInfo.price * ticketBuyCount) }} 灵石）</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 黑市区 -->
          <div class="section">
            <div class="black-market-header">
              <h3 class="section-title">黑市（限量）</h3>
              <button
                class="btn-small btn-refresh"
                :disabled="manualRefreshRemaining <= 0 || playerStore.spiritStones < nextRefreshCost"
                @click="refreshBlackMarket"
              >
                手动刷新 ({{ BLACK_MARKET_CONFIG.manualRefreshMaxPerDay - (playerStore.shopState?.manualRefreshCount || 0) }}/{{ BLACK_MARKET_CONFIG.manualRefreshMaxPerDay }})
                - {{ formatNumber(nextRefreshCost) }} 灵石
              </button>
            </div>
            <p class="black-market-hint">下次自动刷新：{{ autoRefreshCountdown }}</p>
            <div class="shop-grid">
              <div
                v-for="item in blackMarketItems"
                :key="item.uid"
                class="shop-card black-market-card"
                :class="{ sold: item.sold }"
              >
                <div class="shop-card-header">
                  <span class="shop-icon">{{ item.icon }}</span>
                  <span class="shop-name">{{ item.name }}</span>
                  <span class="rarity-badge" :class="item.rarity">{{ rarityName(item.rarity) }}</span>
                </div>
                <p class="shop-desc">{{ item.description }}</p>
                <div class="shop-card-footer">
                  <span class="shop-price">{{ formatNumber(item.price) }} 灵石</span>
                  <button
                    v-if="!item.sold"
                    class="btn-small btn-buy"
                    :disabled="playerStore.spiritStones < item.price"
                    @click="buyBlackMarket(item.uid)"
                  >购买</button>
                  <span v-else class="sold-tag">已售罄</span>
                </div>
              </div>
            </div>
            <div v-if="blackMarketItems.length === 0" class="empty-state">黑市尚未开张…</div>
          </div>

          <!-- 皮肤阁区（人物 skin6/skin7 出售） -->
          <div class="section">
            <div class="black-market-header">
              <h3 class="section-title">皮肤阁（人物立绘）</h3>
              <button
                class="btn-small btn-refresh"
                :disabled="playerStore.spiritStones < skinShopRefreshCost"
                @click="refreshSkinShop"
              >
                刷新 - {{ formatNumber(skinShopRefreshCost) }} 灵石
              </button>
            </div>
            <p class="black-market-hint">本阁随机刷新 5 位人物的限定皮肤，每张 {{ formatNumber(SKIN_SHOP_CONFIG.skinPrice) }} 灵石</p>
            <div class="shop-grid skin-shop-grid">
              <div
                v-for="item in skinShopItems"
                :key="item.uid"
                class="shop-card skin-shop-card"
                :class="{ sold: item.sold }"
                @click="!item.sold && previewSkin(item)"
              >
                <div class="skin-card-portrait" @click.stop="openSkinCharPortrait(item)">
                  <img
                    v-if="getCharAvatar(item.characterId)"
                    :src="getCharAvatar(item.characterId)"
                    :alt="item.characterName"
                    class="skin-avatar clickable-portrait"
                    @error="$event.target.style.display='none'"
                  />
                  <div v-else class="skin-avatar-placeholder">{{ item.characterName?.slice(0, 1) || '?' }}</div>
                  <span class="star-badge star-{{ item.star }}">{{ item.star }}★</span>
                </div>
                <div class="shop-card-header">
                  <span class="shop-name">{{ item.characterName }}</span>
                  <span class="rarity-badge legendary">皮肤 {{ item.skinIndex }}</span>
                </div>
                <p class="shop-desc">点击查看皮肤立绘</p>
                <div class="shop-card-footer">
                  <span class="shop-price">{{ formatNumber(item.price) }} 灵石</span>
                  <button
                    v-if="!item.sold"
                    class="btn-small btn-buy"
                    :disabled="playerStore.spiritStones < item.price"
                    @click.stop="buySkinShop(item.uid)"
                  >购买</button>
                  <span v-else class="sold-tag">已售罄</span>
                </div>
              </div>
            </div>
            <div v-if="!skinShopLoading && skinShopItems.length === 0" class="empty-state">皮肤阁暂无可售皮肤（所有限定皮肤已解锁）…</div>
            <div v-if="skinShopLoading" class="empty-state">皮肤阁正在开张…</div>
          </div>

          <!-- BOSS 挑战券商店区：随机刷新秘境 BOSS 挑战券，越强的越难刷出 -->
          <div class="section">
            <div class="black-market-header">
              <h3 class="section-title">挑战券商店（BOSS 挑战券）</h3>
              <button
                class="btn-small btn-refresh"
                :disabled="playerStore.spiritStones < bossTicketRefreshCost"
                @click="refreshBossTicketShop"
              >
                刷新 - {{ formatNumber(bossTicketRefreshCost) }} 灵石
              </button>
            </div>
            <p class="black-market-hint">随机刷新 5 种 BOSS 挑战券，越强的 BOSS 越难刷出。龙渊及之前 5 万/张，龙渊之后 20 万/张，每张每次最多购 20 张。</p>
            <div class="shop-grid">
              <div
                v-for="item in bossTicketItems"
                :key="item.uid"
                class="shop-card boss-ticket-card"
                :class="{ soldout: (item.soldCount || 0) >= item.maxPurchase }"
              >
                <div class="shop-card-header">
                  <span class="shop-icon">🎟️</span>
                  <span class="shop-name">{{ item.name }}</span>
                  <span class="rarity-badge" :class="getTicketTierClass(item.zoneId)">{{ getTicketTierLabel(item.zoneId) }}</span>
                </div>
                <p class="shop-desc">来自 {{ getZoneName(item.zoneId) }} 的 BOSS 挑战券</p>
                <div class="boss-ticket-buy-row">
                  <span class="shop-price">{{ formatNumber(item.price) }} 灵石/张</span>
                  <span class="ticket-stock">剩余 {{ item.maxPurchase - (item.soldCount || 0) }}/{{ item.maxPurchase }}</span>
                </div>
                <div class="shop-card-footer boss-ticket-footer">
                  <n-input-number
                    v-model:value="bossTicketCountMap[item.uid]"
                    :min="1"
                    :max="item.maxPurchase - (item.soldCount || 0)"
                    size="small"
                    style="width: 90px;"
                  />
                  <button
                    class="btn-small btn-buy"
                    :disabled="(item.soldCount || 0) >= item.maxPurchase || playerStore.spiritStones < item.price * (bossTicketCountMap[item.uid] || 1)"
                    @click="buyBossTicket(item)"
                  >
                    购买
                  </button>
                </div>
              </div>
            </div>
            <div v-if="bossTicketItems.length === 0" class="empty-state">挑战券商店正在开张…</div>
          </div>

          <!-- 皮肤预览弹窗 -->
          <div v-if="previewingSkin" class="skin-preview-mask" @click="closeSkinPreview">
            <div class="skin-preview-modal" @click.stop>
              <button class="skin-preview-close" @click="closeSkinPreview">×</button>
              <h3 class="skin-preview-title">
                {{ previewingSkin.item.characterName }} - 皮肤 {{ previewingSkin.item.skinIndex }}
              </h3>
              <div class="skin-preview-image-wrap">
                <img
                  v-if="previewingSkin.skinUrl"
                  :src="previewingSkin.skinUrl"
                  :alt="previewingSkin.item.characterName + ' 皮肤' + previewingSkin.item.skinIndex"
                  class="skin-preview-image"
                  @error="$event.target.style.display='none'"
                />
                <div v-else class="skin-preview-placeholder">
                  <p>皮肤立绘加载失败</p>
                  <p class="hint">可能尚未上线，敬请期待</p>
                </div>
              </div>
              <div class="skin-preview-footer">
                <span class="shop-price">{{ formatNumber(previewingSkin.item.price) }} 灵石</span>
                <button
                  v-if="!previewingSkin.item.sold"
                  class="btn-small btn-buy"
                  :disabled="playerStore.spiritStones < previewingSkin.item.price"
                  @click="buySkinShop(previewingSkin.item.uid); closeSkinPreview()"
                >购买解锁</button>
                <span v-else class="sold-tag">已售罄</span>
              </div>
            </div>
          </div>

          <!-- 角色立绘弹窗（点击商店角色头像触发，与人物立绘展示逻辑一致） -->
          <!-- initialSkin 直接展示商品对应皮肤立绘，而非默认原立绘 -->
          <CharacterPortraitModal
            v-if="showSkinCharPortrait"
            :character="skinCharPortrait"
            :initialSkin="skinCharPortraitInitialSkin"
            @close="closeSkinCharPortrait"
          />
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
  import { zones, DIFFICULTY_TEMPLATES } from '../plugins/zones'
  import { BOSS_TICKET_SHOP_CONFIG } from '../plugins/shopConfig'
  import { starConfig, getEffortCap } from '../plugins/characters'
  import LogPanel from '../components/LogPanel.vue'
  import { useMessage } from 'naive-ui'
  import {
    MedicineBoxOutlined,
    InfoCircleOutlined,
    FireOutlined
  } from '@ant-design/icons-vue'
  import { enhanceConfig, reforgeConfig, rarityConfig, getEnhanceSpiritStoneCost, getEnhanceStoneCost, getEnhanceBossMaterialCost, calculateEquipmentScore, formatEquipmentScore } from '../plugins/equipment'
  import { formatNumber as formatNumberWithUnit } from '../utils/formatNumber.js'
  import { getReforgeBossMaterial } from '../plugins/cultivationSystem'
  import { BLACK_MARKET_CONFIG, getManualRefreshCost, SKIN_SHOP_CONFIG, getSkinShopRefreshCost } from '../plugins/shopConfig'
  import { getCharacterAvatar, getCharacterSkinUrl, characterDefMap } from '../plugins/characters'
  import CharacterPortraitModal from '../components/CharacterPortraitModal.vue'
  import {
    EXCLUSIVE_EQUIP_CONFIG,
    EXCLUSIVE_EQUIP_SLOTS,
    EXCLUSIVE_SLOT_NAMES,
    getExclusiveCraftableCharacters,
    getExclusiveSlotsForCharacter
  } from '../plugins/exclusiveEquipment'

  const playerStore = usePlayerStore()
  const message = useMessage()
  const logRef = ref(null)

  const activeTab = ref('pill')
  const selectedRecipe = ref(null)
  const craftCount = ref(1)
  const selectedRebirthMember = ref(null)
  const showRebirthConfirm = ref(false)
  // ===== 回炉转生：二级子菜单（人物重生 / 化器成灵）=====
  const rebirthTab = ref('rebirth')

  // ===== 化器成灵相关状态 =====
  // 使用 ID 作为下拉菜单的 v-model，避免直接持有响应式对象导致整体重渲染
  const selectedTransmuteMemberId = ref(null)
  const selectedTransmuteEquipId = ref(null)
  const showTransmuteConfirm = ref(false)

  // 装备稳定 key（部分装备以 _id 标识）
  const equipKey = (e) => (e ? (e.id || e._id || null) : null)

  // 品质配置兜底：rarityConfig 已从 equipment.js 导入；此处提供兼容函数
  const getRarityColor = (item) => {
    const q = item?.rarity || item?.quality
    return rarityConfig[q]?.color || '#999'
  }
  const getRarityName = (item) => {
    const q = item?.rarity || item?.quality
    return rarityConfig[q]?.name || '未知'
  }

  // 装备评分格式化：复用 formatNumber 的万/亿单位转换（>1万显示 x万，>1亿显示 x亿）
  const formatScore = (equip) => {
    const score = calculateEquipmentScore(equip) || 0
    return formatNumberWithUnit(score)
  }

  // 化器成灵：可选人物（宗门中已获得的全部人物）
  const transmuteCandidates = computed(() => {
    return playerStore.sectMembers || []
  })

  // 下拉菜单选项：人物（预计算展示文本，避免渲染期重复拼接）
  const transmuteMemberOptions = computed(() => {
    return transmuteCandidates.value.map(m => ({
      label: m.name,
      value: m.id,
      subText: `Lv.${m.level} · ${m.schoolName || m.school || ''}`
    }))
  })

  // 由 ID 解析当前选中的人物对象（computed 缓存，避免模板内多次查找）
  const selectedTransmuteMember = computed(() => {
    if (!selectedTransmuteMemberId.value) return null
    return transmuteCandidates.value.find(m => m.id === selectedTransmuteMemberId.value) || null
  })

  // 化器成灵：预览某装备融入后给人物的 1/3 基础数值加成
  const getTransmuteBonus = (equip) => {
    const s = equip?.stats || {}
    return {
      attack: Math.floor((s.attack || 0) / 3),
      health: Math.floor((s.health || 0) / 3),
      defense: Math.floor((s.defense || 0) / 3),
      speed: Math.floor((s.speed || 0) / 3)
    }
  }

  // 化器成灵：灵石消耗（仙品 50 万 / 神品 100 万，每超出 +12 一级 ×1.5；+8~+11 不加成）
  const getTransmuteStoneCost = (equip) => {
    if (!equip) return 0
    const rarity = equip.rarity || equip.quality
    const base = rarity === 'legendary' ? 500000 : 1000000
    const overLevel = Math.max(0, (equip.enhanceLevel || 0) - 12)
    return Math.floor(base * Math.pow(1.5, overLevel))
  }

  // 当前选中装备的加成 / 灵石消耗（computed 缓存，替代模板内多次调用）
  // 注：selectedTransmuteEquip / transmuteEquipments 定义在下方 equippedItemIds 之后；
  // computed 取值器在渲染期才执行，引用已初始化，无 TDZ 风险
  const transmuteBonus = computed(() => getTransmuteBonus(selectedTransmuteEquip.value))
  const transmuteStoneCost = computed(() => getTransmuteStoneCost(selectedTransmuteEquip.value))

  // 化器成灵：是否可执行（人物 + 装备均已选择且灵石足够）
  const canTransmute = computed(() => {
    if (!selectedTransmuteMember.value || !selectedTransmuteEquip.value) return false
    return (playerStore.spiritStones || 0) >= transmuteStoneCost.value
  })

  const requestTransmute = () => {
    if (!selectedTransmuteMember.value || !selectedTransmuteEquip.value) return
    showTransmuteConfirm.value = true
  }

  const confirmTransmute = () => {
    if (!selectedTransmuteMember.value || !selectedTransmuteEquip.value) return
    const result = playerStore.transmuteEquipmentToSpirit(
      selectedTransmuteMember.value.id,
      equipKey(selectedTransmuteEquip.value)
    )
    showTransmuteConfirm.value = false
    if (result.success) {
      message.success(result.message)
      selectedTransmuteEquipId.value = null
    } else {
      message.error(result.message)
    }
  }

  // ===== 灵石阁（商店）相关 =====
  const blackMarketItems = ref([])
  const shopTick = ref(0) // 响应式触发，确保 shopState 变更后刷新

  // 切换到商店 tab 时初始化黑市数据
  function switchToShop() {
    activeTab.value = 'shop'
    loadBlackMarket()
    loadSeek()
    loadCraft()
    loadRune()
    loadBounty()
    loadBarter()
    loadCharacterTickets()
    loadSkinShop()
    loadBossTicketShop()
  }
  function loadBlackMarket() {
    blackMarketItems.value = playerStore.getBlackMarketItems()
    shopTick.value++
  }
  // 求材目录（响应式，随境界/持有/配额变化）
  const seekCatalog = ref([])
  function loadSeek() {
    seekCatalog.value = playerStore.getSeekCatalog().items
  }
  // 当前出售折率文本
  const currentSellRateText = computed(() => {
    const count = playerStore.sellTracker?.soldCount || 0
    if (count < 50) return '10%'
    if (count < 150) return '6%'
    if (count < 300) return '3%'
    return '1.5%'
  })
  // 手动刷新剩余次数
  const manualRefreshRemaining = computed(() => {
    shopTick.value
    const used = playerStore.shopState?.manualRefreshCount || 0
    return Math.max(0, BLACK_MARKET_CONFIG.manualRefreshMaxPerDay - used)
  })
  // 下次手动刷新成本
  const nextRefreshCost = computed(() => {
    shopTick.value
    const used = playerStore.shopState?.manualRefreshCount || 0
    return getManualRefreshCost(used)
  })
  // 自动刷新倒计时
  const autoRefreshCountdown = computed(() => {
    shopTick.value
    const last = playerStore.shopState?.blackMarketRefreshAt || 0
    const next = last + BLACK_MARKET_CONFIG.autoRefreshInterval
    const remain = next - Date.now()
    if (remain <= 0) return '即将刷新'
    const h = Math.floor(remain / 3600000)
    const m = Math.floor((remain % 3600000) / 60000)
    return `${h}小时${m}分后`
  })
  function formatNumber(n) {
    if (n == null) return '0'
    return Number(n).toLocaleString()
  }
  function rarityName(r) {
    const map = { common: '凡品', uncommon: '良品', rare: '中品', epic: '上品', legendary: '极品', mythic: '仙品' }
    return map[r] || r
  }
  async function buySeek(id) {
    const r = await playerStore.buySeekMaterial(id)
    r.success ? message.success(r.message) : message.error(r.message)
    loadSeek()
    shopTick.value++
  }
  // 点化·兑币目录与购买
  const craftCatalog = ref([])
  function loadCraft() {
    craftCatalog.value = playerStore.getCraftCatalog().items
  }
  async function buyCraft(id) {
    const r = await playerStore.buyCraftCurrency(id)
    r.success ? message.success(r.message) : message.error(r.message)
    loadCraft()
    shopTick.value++
  }
  // 开纹·兑纹目录与购买
  const runeCatalog = ref([])
  function loadRune() {
    runeCatalog.value = playerStore.getRuneCatalog().items
  }
  async function buyRune(id) {
    const r = await playerStore.buyRune(id)
    r.success ? message.success(r.message) : message.error(r.message)
    loadRune()
    shopTick.value++
  }
  // 觅宝/悬赏目录与购买
  const bountyCatalog = ref({ items: [], rerollCount: 0, rerollMax: 0, rerollCost: 0 })
  function loadBounty() {
    bountyCatalog.value = playerStore.getBountyCatalog()
  }
  async function buyBounty(uid) {
    const r = await playerStore.buyBounty(uid)
    r.success ? message.success(r.message) : message.error(r.message)
    loadBounty()
    shopTick.value++
  }
  async function rerollBounty() {
    const r = await playerStore.rerollBountyBoard()
    r.success ? message.success(r.message) : message.error(r.message)
    loadBounty()
    shopTick.value++
  }
  // 易物目录与购买
  const barterCatalog = ref({ items: [], globalUsed: 0, globalCap: 0, oreId: '' })
  function loadBarter() {
    barterCatalog.value = playerStore.getBarterCatalog()
  }
  async function buyBarter(id) {
    const r = await playerStore.buyBarter(id)
    r.success ? message.success(r.message) : message.error(r.message)
    loadBarter()
    shopTick.value++
  }

  // ===== 人物挑战券兑换（下拉选择人物，按星级定价） =====
  const selectedCharacterId = ref(null)
  const ticketBuyCount = ref(1)
  const characterTicketCatalog = ref([])
  function loadCharacterTickets() {
    characterTicketCatalog.value = playerStore.getCharacterTicketCatalog()
    shopTick.value++
  }
  // n-select 选项：按星级分组展示，标签含星级与价格
  const characterTicketOptions = computed(() => {
    const starLabels = { 3: '三星', 4: '四星', 5: '五星' }
    return characterTicketCatalog.value.map(c => ({
      label: `${starLabels[c.star] || ''} · ${c.characterName}（${formatNumber(c.price)} 灵石/张，持有 ${c.owned}）`,
      value: c.characterId
    }))
  })
  // 当前选中人物的兑换详情
  const selectedTicketInfo = computed(() => {
    if (!selectedCharacterId.value) return null
    return characterTicketCatalog.value.find(c => c.characterId === selectedCharacterId.value) || null
  })
  // 星级 → rarity-badge 类名映射
  function starClass(star) {
    if (star === 5) return 'legendary'
    if (star === 4) return 'epic'
    return 'rare'
  }
  async function buyCharacterTicket() {
    if (!selectedCharacterId.value || !selectedTicketInfo.value) {
      message.error('请先选择人物')
      return
    }
    const count = ticketBuyCount.value || 1
    const totalCost = selectedTicketInfo.value.price * count
    if (playerStore.spiritStones < totalCost) {
      message.error(`灵石不足，需要 ${formatNumber(totalCost)} 灵石`)
      return
    }
    // 逐张兑换（每张调用一次 buyCharacterTicket，保持 store 状态一致）
    let lastMsg = ''
    let allOk = true
    for (let i = 0; i < count; i++) {
      const r = await playerStore.buyCharacterTicket(selectedCharacterId.value)
      if (!r.success) { allOk = false; lastMsg = r.message; break }
      lastMsg = r.message
    }
    if (allOk) {
      message.success(count > 1 ? `成功兑换 ${count} 张「${selectedTicketInfo.value.ticketName}」，消耗 ${formatNumber(totalCost)} 灵石` : lastMsg)
    } else {
      message.error(lastMsg)
    }
    loadCharacterTickets()
    shopTick.value++
  }

  // ===== 皮肤阁（皮肤商店：出售人物 skin6/skin7） =====
  const skinShopItems = ref([])
  const skinShopLoading = ref(false)
  const skinShopRefreshCost = computed(() => getSkinShopRefreshCost())
  // 当前正在预览的皮肤（点击商品卡片时弹出预览）
  const previewingSkin = ref(null)  // { item, skinUrl }

  async function loadSkinShop() {
    skinShopLoading.value = true
    try {
      skinShopItems.value = await playerStore.getSkinShopItems()
    } catch (e) {
      console.error('加载皮肤阁失败', e)
    } finally {
      skinShopLoading.value = false
    }
    shopTick.value++
  }
  async function refreshSkinShop() {
    if (playerStore.spiritStones < skinShopRefreshCost.value) {
      message.error(`灵石不足，刷新需要 ${formatNumber(skinShopRefreshCost.value)} 灵石`)
      return
    }
    const r = await playerStore.refreshSkinShop()
    r.success ? message.success(r.message) : message.error(r.message)
    await loadSkinShop()
  }
  async function buySkinShop(uid) {
    const r = await playerStore.buySkinShopItem(uid)
    r.success ? message.success(r.message) : message.error(r.message)
    await loadSkinShop()
    shopTick.value++
  }

  // ===== BOSS 挑战券商店 =====
  const bossTicketItems = ref([])
  const bossTicketRefreshCost = computed(() => BOSS_TICKET_SHOP_CONFIG.refreshCost)
  // 每个商品 uid 对应的购买数量（响应式 map）
  const bossTicketCountMap = ref({})
  const TIER1_ZONES = BOSS_TICKET_SHOP_CONFIG.tier1Zones

  function loadBossTicketShop() {
    bossTicketItems.value = playerStore.getBossTicketShopItems()
    // 初始化每个商品的购买数量为 1
    const map = {}
    for (const item of bossTicketItems.value) {
      map[item.uid] = 1
    }
    bossTicketCountMap.value = map
    shopTick.value++
  }
  function refreshBossTicketShop() {
    if (playerStore.spiritStones < bossTicketRefreshCost.value) {
      message.error(`灵石不足，刷新需要 ${formatNumber(bossTicketRefreshCost.value)} 灵石`)
      return
    }
    const r = playerStore.refreshBossTicketShop()
    r.success ? message.success(r.message) : message.error(r.message)
    loadBossTicketShop()
  }
  function buyBossTicket(item) {
    const count = bossTicketCountMap.value[item.uid] || 1
    const r = playerStore.buyBossTicket(item.uid, count)
    r.success ? message.success(r.message) : message.error(r.message)
    loadBossTicketShop()
  }
  // 获取秘境中文名
  function getZoneName(zoneId) {
    const z = zones.find(z => z.id === zoneId)
    return z ? z.name : zoneId
  }
  // 挑战券分层标签
  function getTicketTierLabel(zoneId) {
    return TIER1_ZONES.includes(zoneId) ? '龙渊前' : '龙渊后'
  }
  function getTicketTierClass(zoneId) {
    return TIER1_ZONES.includes(zoneId) ? 'rarity-badge common' : 'rarity-badge legendary'
  }
  // 皮肤商品卡片需要展示人物头像，从 characterList 拿模板数据
  // 用懒加载避免循环依赖
  const _charList = ref([])
  async function _ensureCharList() {
    if (_charList.value.length > 0) return
    const m = await import('../plugins/characters.js')
    _charList.value = m.characterList || []
  }
  // 通过 characterId 取人物头像 URL
  function getCharAvatar(characterId) {
    const char = _charList.value.find(c => c.id === characterId)
    if (!char) return null
    return getCharacterAvatar({ templateId: char.id, id: char.id, avatar: char.avatar })
  }
  // 通过 characterId + skinIndex 取皮肤立绘 URL
  function getCharSkinUrl(characterId, skinIndex) {
    if (!characterId || !skinIndex) return null
    return getCharacterSkinUrl({ templateId: characterId, id: characterId }, skinIndex)
  }
  // 点击商品卡片预览皮肤
  async function previewSkin(item) {
    await _ensureCharList()
    const url = getCharSkinUrl(item.characterId, item.skinIndex)
    previewingSkin.value = { item, skinUrl: url }
  }
  // 关闭预览弹窗
  function closeSkinPreview() {
    previewingSkin.value = null
  }
  // 在 switchToShop 中并行预加载 characterList
  ;(async () => { await _ensureCharList() })()

  // 立绘弹窗（与人物立绘展示逻辑一致）：点击商店角色头像打开 CharacterPortraitModal
  // 传入 initialSkin 让弹窗直接展示商品对应皮肤立绘，而非默认原立绘
  const showSkinCharPortrait = ref(false)
  const skinCharPortrait = ref(null)
  const skinCharPortraitInitialSkin = ref(0)
  function openSkinCharPortrait(item) {
    if (!item || !item.characterId) return
    // 用 characterDefMap 取角色定义，模态框内部依赖 templateId/name/star/breakThrough 等字段
    const char = characterDefMap[item.characterId]
    if (char) {
      skinCharPortrait.value = char
      skinCharPortraitInitialSkin.value = Number(item.skinIndex) || 0
      showSkinCharPortrait.value = true
    }
  }
  function closeSkinCharPortrait() {
    showSkinCharPortrait.value = false
    skinCharPortrait.value = null
    skinCharPortraitInitialSkin.value = 0
  }

  function runeStatLabel(item) {
    const map = { attack: '攻击%', health: '生命%', defense: '防御%', speed: '速度',
      healBoost: '治疗%', critDamageBoost: '暴伤%', finalDamageBoost: '增伤%',
      dodgeRate: '闪避%', finalDamageReduce: '减伤%' }
    const label = map[item.stat] || item.stat
    return item.valueType === 'flat' ? `${label} +${item.value}` : `${label} ${Math.round(item.value * 100)}%`
  }
  async function buyBlackMarket(uid) {
    const r = await playerStore.buyBlackMarketItem(uid)
    r.success ? message.success(r.message) : message.error(r.message)
    loadBlackMarket()
  }
  async function refreshBlackMarket() {
    const r = await playerStore.refreshBlackMarket()
    r.success ? message.success(r.message) : message.error(r.message)
    loadBlackMarket()
  }

  // 装备锻打相关
  const forgeTab = ref('enhance')
  const selectedForgeEquip = ref(null)
  const selectedDisassembleIds = ref([])
  const reforgeMode = ref('all')
  const selectedReforgeStat = ref(null)
  const reforgeResult = ref(null)

  // 装备锻打 - 筛选与分页
  const forgeFilterType = ref('')
  const forgeFilterRarity = ref('')
  const forgeSortedByScore = ref(false)
  const forgePage = ref(1)
  const forgePageSize = 10

  const BASE_STATS = ['attack', 'health', 'defense', 'speed']

  const cleanAffixStats = computed(() => {
    if (!selectedForgeEquip.value || !selectedForgeEquip.value.stats) return {}
    const stats = {}
    Object.entries(selectedForgeEquip.value.stats).forEach(([key, val]) => {
      if (!BASE_STATS.includes(key)) {
        stats[key] = val
      }
    })
    return stats
  })

  const unlockedRecipes = computed(() => {
    return pillRecipes.filter(recipe => playerStore.pillRecipes.includes(recipe.id))
  })

  // 丹方筛选：品阶 / 类型 / 仅可炼制（材料齐全）
  const recipeFilterGrade = ref('')
  const recipeFilterType = ref('')
  const recipeOnlyCraftable = ref(false)
  const recipeGradeOptions = computed(() => {
    const grades = new Set(unlockedRecipes.value.map(r => r.grade))
    return [...grades].map(g => ({ value: g, label: pillGrades[g]?.name || g }))
  })
  const recipeTypeOptions = computed(() => {
    const types = new Set(unlockedRecipes.value.map(r => r.type))
    return [...types].map(t => ({ value: t, label: pillTypes[t]?.name || t }))
  })
  const filteredRecipes = computed(() => {
    return unlockedRecipes.value.filter(recipe => {
      if (recipeFilterGrade.value && recipe.grade !== recipeFilterGrade.value) return false
      if (recipeFilterType.value && recipe.type !== recipeFilterType.value) return false
      if (recipeOnlyCraftable.value && !checkMaterials(recipe, 1)) return false
      return true
    })
  })

  const selectRecipe = recipe => {
    selectedRecipe.value = recipe
    craftCount.value = 1 // 切换丹方时重置数量，避免上一个丹药的数量带到新丹药
  }

  const checkMaterials = (recipe, count = 1) => {
    if (!recipe) return false
    return recipe.materials.every(material => {
      const owned = playerStore.materials.filter(m => m.kind === (material.kind || 'herb') && m.id === material.id).length
      return owned >= material.count * count
    })
  }

  // 计算指定丹方可炼制的最大数量（内联炼制行按当前选中丹药实时计算）
  const maxCraftCountFor = recipe => {
    if (!recipe) return 1
    const maxCounts = recipe.materials.map(material => {
      const owned = playerStore.materials.filter(m => m.kind === (material.kind || 'herb') && m.id === material.id).length
      return Math.floor(owned / material.count) || 0
    })
    return Math.max(1, Math.min(...maxCounts))
  }

  const maxCraftCount = computed(() => maxCraftCountFor(selectedRecipe.value))

  const getMaterialStatus = material => {
    const count = playerStore.materials.filter(m => m.kind === (material.kind || 'herb') && m.id === material.id).length
    return `${count}/${material.count}`
  }

  const getMaterialName = material => {
    const m = allMaterials.find(x => x.id === material.id && x.kind === (material.kind || 'herb'))
    return m ? m.name : material.id
  }

  const getMaterialSource = material => {
    const kind = material.kind || 'herb'
    const mid = material.id || material.herb
    const m = allMaterials.find(x => x.id === mid && x.kind === kind)
    if (!m) return ''

    // 灵草：任意地图探索均可掉落，高难地图有稀有灵草加成
    if (kind === 'herb') {
      const zoneMin = m.quality === 'legendary' ? 5 : m.quality === 'rare' ? 4 : 1
      const diffLabel = zoneMin >= 5 ? '灭世' : zoneMin >= 4 ? '绝境' : '任意难度'
      return `（探索·${diffLabel}）`
    }
    // 矿料/灵液：按 zoneMin 找最低可掉落地图
    if (kind === 'ore' || kind === 'liquid') {
      const zoneMin = m.zoneMin || 1
      const zone = zones[Math.min(zoneMin - 1, zones.length - 1)]
      const diff = DIFFICULTY_TEMPLATES[Math.max(0, zoneMin - 1)]
      if (zone && diff) return `（${zone.name}·${diff.label}）`
      return '（探索掉落）'
    }
    // 妖丹：按敌人档位
    if (kind === 'core') {
      const tierLabel = m.tier === 'boss' ? 'Boss' : m.tier === 'elite' ? '精英' : '普通'
      return `（${tierLabel}敌人掉落）`
    }
    // 至宝
    if (kind === 'special') {
      return '（Boss/奇遇）'
    }
    return ''
  }

  // 内联展开用的辅助函数：直接接收 recipe 参数，避免依赖全局 selectedRecipe
  // 这样同一页面同时展示多个丹药详情时也能各自正确取值
  const getMaterialStatusFor = (recipe, material) => {
    // recipe 仅作为存在性校验，实际数量与具体丹药无关，只取决于素材 id/kind
    if (!recipe || !material) return '0/0'
    const count = playerStore.materials.filter(m => m.kind === (material.kind || 'herb') && m.id === material.id).length
    return `${count}/${material.count}`
  }

  const getDurationText = (recipe) => {
    if (!recipe) return '-'
    const e = calculatePillEffect(recipe, playerStore.level)
    if (!e) return '-'
    const globalTypes = ['spiritStoneRate', 'cultivationRate', 'dropRate', 'expGain']
    if (globalTypes.includes(e.type)) return '本次挂机'
    const dur = e.duration || 0
    if (dur <= 0) return '永久/即时'
    return `${Math.floor(dur / 60)}分钟`
  }

  // 按丹药效果类型给出可读描述（支持新增值/突破/强化/洗练/战斗/探索类）
  const getEffectDescription = (recipe) => {
    if (!recipe) return { label: '效果', value: '-' }
    const e = calculatePillEffect(recipe, playerStore.level)
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
        return { label: '大洗练保底', value: `${Math.max(1, Math.round(e.value))} 次` }
      case 'healBattle':
        return { label: '战斗回血', value: `恢复最大生命值 ${(e.value * 100).toFixed(0)}%` }
      case 'cleanse':
        return { label: '战斗解控', value: '战斗中使用' }
      case 'expGain':
        return { label: '修为获取', value: `+${(e.value * 100).toFixed(0)}%` }
      case 'dropRate':
        return { label: '掉落加成', value: `+${(e.value * 100).toFixed(0)}%` }
      case 'spiritStoneRate':
        return { label: '灵石获取', value: `+${(e.value * 100).toFixed(0)}%` }
      case 'cultivationRate':
        return { label: '修炼速度', value: `+${(e.value * 100).toFixed(0)}%` }
      case 'cultivationEfficiency':
        return { label: '修炼效率', value: `+${(e.value * 100).toFixed(0)}%` }
      case 'combatBoost':
        return { label: '战斗属性', value: `+${(e.value * 100).toFixed(0)}%` }
      case 'allAttributes':
        return { label: '全属性', value: `+${(e.value * 100).toFixed(0)}%` }
      case 'comprehension':
        return { label: '悟性提升', value: `+${(e.value * 100).toFixed(0)}%` }
      case 'autoHeal':
        return { label: '自动回血', value: `每秒恢复 ${(e.value * 100).toFixed(0)}% 最大生命` }
      case 'effortGain': {
        let valueText = `+${Math.round(e.value)} 点`
        if (e.extraStats) {
          const extras = Object.entries(e.extraStats)
            .map(([stat, val]) => `${statNames[stat] || stat} +${Math.round(val)}`)
            .join('，')
          valueText += `，${extras}`
        }
        return { label: '努力值', value: valueText }
      }
      default:
        return { label: '效果数值', value: `+${e.value}` }
    }
  }

  // 旧版 computed 委托给新函数，保持向后兼容（底部日志区等其他地方仍可能引用）
  const currentEffect = computed(() => {
    if (!selectedRecipe.value) return null
    return calculatePillEffect(selectedRecipe.value, playerStore.level)
  })
  const durationText = computed(() => getDurationText(selectedRecipe.value))
  const effectDescription = computed(() => getEffectDescription(selectedRecipe.value))

  const craftPill = () => {
    if (!selectedRecipe.value) return
    craftPillFor(selectedRecipe.value, '.craft-button')
  }
  // 内联炼制：从丹药卡片下方直接炼制，按钮选择器限定在该卡片内
  const craftPillInline = (recipe) => {
    if (!recipe) return
    craftPillFor(recipe, `.recipe-card.selected .craft-inline-row .btn-small`)
  }
  const craftPillFor = (recipe, btnSelector) => {
    const count = Math.min(Math.max(1, craftCount.value || 1), maxCraftCountFor(recipe))
    const result = playerStore.craftPill(recipe.id, count)
    if (result.success) {
      const successCount = result.successCount || 1
      // 弹出小窗口提示结果，不再写入页底日志
      window.$message?.success(`炼制成功！获得 ${recipe.name}${successCount > 1 ? ` ×${successCount}` : ''}`, { duration: 2000 })
      const btn = document.querySelector(btnSelector)
      if (btn) {
        btn.classList.add('success-animation')
        setTimeout(() => {
          btn.classList.remove('success-animation')
        }, 1000)
      }
    } else {
      // 失败也用小弹窗提示，不再写入页底日志
      window.$message?.error(`炼制失败：${result.message}`, { duration: 2500 })
      const btn = document.querySelector(btnSelector)
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

  // 当前选中人物的重生预览（computed 缓存，替代模板内 6 次 getRebirthPreview 重复调用）
  const rebirthPreview = computed(() => {
    return selectedRebirthMember.value ? getRebirthPreview(selectedRebirthMember.value) : null
  })

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

  // ===== 装备锻打相关 =====
  const EQUIPMENT_SLOTS_FORGE = ['head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'necklace', 'ring1', 'ring2', 'belt', 'artifact']
  const isForgeEquipItem = (i) => i && i.type !== 'pet' && i.type !== 'material' && (i.type === 'equipment' || (i.slot && EQUIPMENT_SLOTS_FORGE.includes(i.slot)))

  // 收集所有被角色装备中的装备ID（玩家自身 + 宗门成员）
  const equippedItemIds = computed(() => {
    const ids = new Set()
    // 玩家自身装备
    Object.values(playerStore.equippedArtifacts || {}).forEach(e => { if (e?.id) ids.add(e.id) })
    // 宗门成员装备
    playerStore.sectMembers.forEach(m => {
      if (m.equippedArtifacts) {
        Object.values(m.equippedArtifacts).forEach(e => { if (e?.id) ids.add(e.id) })
      }
    })
    return ids
  })

  // 八卦炉仅显示背包中未装备的装备
  const allEquipments = computed(() => {
    return playerStore.items.filter(i => isForgeEquipItem(i) && !equippedItemIds.value.has(i.id))
  })

  const inventoryEquipments = computed(() => {
    return playerStore.items.filter(i => isForgeEquipItem(i) && !equippedItemIds.value.has(i.id))
  })

  // 化器成灵：可选装备（背包中未装备、强化 +8 及以上的仙品/神品装备）
  // 条件 2.2.1 调整：由 +12 放宽至 +8~+12（含专属装备 +8~+15）
  const transmuteEquipments = computed(() => {
    const ids = equippedItemIds.value
    return playerStore.items.filter(i => {
      if (!isForgeEquipItem(i)) return false
      if (ids.has(i.id)) return false
      const rarity = i.rarity || i.quality
      if (rarity !== 'legendary' && rarity !== 'mythic') return false
      const lv = i.enhanceLevel || 0
      return lv >= 8
    })
  })

  // 由 ID 解析当前选中的装备对象（computed 缓存）
  const selectedTransmuteEquip = computed(() => {
    if (!selectedTransmuteEquipId.value) return null
    return transmuteEquipments.value.find(e => equipKey(e) === selectedTransmuteEquipId.value) || null
  })

  // 下拉菜单选项：装备（预计算评分文本与品质色，避免渲染期重复计算）
  const transmuteEquipOptions = computed(() => {
    return transmuteEquipments.value.map(e => ({
      label: `${e.name} +${e.enhanceLevel || 0}`,
      value: equipKey(e),
      color: getRarityColor(e),
      scoreText: formatScore(e)
    }))
  })

  // 筛选+排序后的装备列表
  const forgeFilteredEquipments = computed(() => {
    let list = allEquipments.value
    if (forgeFilterType.value) {
      list = list.filter(e => (e.slot || e.type) === forgeFilterType.value)
    }
    if (forgeFilterRarity.value) {
      list = list.filter(e => (e.rarity || e.quality || 'common') === forgeFilterRarity.value)
    }
    if (forgeSortedByScore.value) {
      list = [...list].sort((a, b) => calculateEquipmentScore(b) - calculateEquipmentScore(a))
    }
    return list
  })

  // 分页后的装备列表
  const forgePagedEquipments = computed(() => {
    const start = (forgePage.value - 1) * forgePageSize
    return forgeFilteredEquipments.value.slice(start, start + forgePageSize)
  })

  const forgeTotalPages = computed(() => Math.max(1, Math.ceil(forgeFilteredEquipments.value.length / forgePageSize)))

  // 分解页筛选+排序+分页
  const forgeFilteredInventory = computed(() => {
    let list = inventoryEquipments.value
    if (forgeFilterType.value) {
      list = list.filter(e => (e.slot || e.type) === forgeFilterType.value)
    }
    if (forgeFilterRarity.value) {
      list = list.filter(e => (e.rarity || e.quality || 'common') === forgeFilterRarity.value)
    }
    if (forgeSortedByScore.value) {
      list = [...list].sort((a, b) => calculateEquipmentScore(b) - calculateEquipmentScore(a))
    }
    return list
  })

  const forgePagedInventory = computed(() => {
    const start = (forgePage.value - 1) * forgePageSize
    return forgeFilteredInventory.value.slice(start, start + forgePageSize)
  })

  const forgeInventoryTotalPages = computed(() => Math.max(1, Math.ceil(forgeFilteredInventory.value.length / forgePageSize)))

  const toggleForgeSort = () => {
    forgeSortedByScore.value = !forgeSortedByScore.value
    forgePage.value = 1
    if (forgeSortedByScore.value) {
      message.success('装备已按评分从高到低排序')
    } else {
      message.success('装备已恢复默认排序')
    }
  }

  const onForgeFilterChange = () => {
    forgePage.value = 1
  }

  const forgePrevPage = () => {
    if (forgePage.value > 1) forgePage.value--
  }
  const forgeNextPage = () => {
    if (forgePage.value < forgeTotalPages.value) forgePage.value++
  }
  const forgeInvPrevPage = () => {
    if (forgePage.value > 1) forgePage.value--
  }
  const forgeInvNextPage = () => {
    if (forgePage.value < forgeInventoryTotalPages.value) forgePage.value++
  }

  const selectForgeEquip = (equip) => {
    selectedForgeEquip.value = equip
    selectedReforgeStat.value = null
    reforgeResult.value = null
    // 若新装备无可用词条，自动切回全部大洗练
    if (reforgeMode.value === 'single' && Object.keys(cleanAffixStats.value).length === 0) {
      reforgeMode.value = 'all'
    }
  }

  const toggleDisassembleSelect = (equipId) => {
    const idx = selectedDisassembleIds.value.indexOf(equipId)
    if (idx > -1) {
      selectedDisassembleIds.value.splice(idx, 1)
    } else {
      selectedDisassembleIds.value.push(equipId)
    }
  }

  // ===== 专属装备打造 =====
  const exclSelectedCharId = ref('')
  const exclSelectedSlot = ref('')
  const exclCraftResult = ref(null)
  const exclCraftableCharacters = computed(() => getExclusiveCraftableCharacters())
  const exclSlots = computed(() =>
    exclSelectedCharId.value ? getExclusiveSlotsForCharacter(exclSelectedCharId.value) : []
  )
  const exclCharName = computed(() =>
    exclCraftableCharacters.value.find(c => c.id === exclSelectedCharId.value)?.name || ''
  )

  // 内丹碎片 ID：inner_pill_char_XXX
  const exclInnerPillId = computed(() => {
    if (!exclSelectedCharId.value) return ''
    return 'inner_pill_char_' + String(exclSelectedCharId.value).replace(/^char_/, '').padStart(3, '0')
  })
  const exclInnerPillName = computed(() => {
    const id = exclInnerPillId.value
    if (!id) return '内丹碎片'
    const m = playerStore.materials.find(x => x.id === id)
    return m?.name || (exclCharName.value ? `${exclCharName.value}·内丹碎片` : '内丹碎片')
  })
  const exclInnerPillCount = computed(() => {
    if (!exclInnerPillId.value) return 0
    return playerStore.materials.filter(m => m.id === exclInnerPillId.value).length
  })
  // 任意神品装备（非专属）数量
  const exclMythicCount = computed(() =>
    playerStore.items.filter(i => (i.rarity || i.quality) === 'mythic' && !i.isExclusive).length
  )
  // 神品装备来源选择（点击弹出菜单筛选）
  const exclSelectedSourceId = ref('')
  const exclSourcePickerVisible = ref(false)
  const exclSourceKeyword = ref('')
  const exclSourceFilterSlot = ref('')
  const exclMythicEquipments = computed(() => {
    const list = playerStore.items.filter(i => (i.rarity || i.quality) === 'mythic' && !i.isExclusive)
    let r = list
    if (exclSourceKeyword.value) {
      const kw = exclSourceKeyword.value.toLowerCase()
      r = r.filter(i => (i.name || '').toLowerCase().includes(kw))
    }
    if (exclSourceFilterSlot.value) {
      r = r.filter(i => (i.slot || i.type) === exclSourceFilterSlot.value)
    }
    return r.slice().sort((a, b) => calculateEquipmentScore(b) - calculateEquipmentScore(a))
  })
  const exclSelectedSource = computed(() =>
    exclSelectedSourceId.value ? playerStore.items.find(i => i.id === exclSelectedSourceId.value) : null
  )
  const exclSelectedSourceLabel = computed(() => {
    if (!exclSelectedSource.value) {
      return exclMythicCount.value > 0 ? `点击选择（共 ${exclMythicCount.value} 件）` : '无神品装备'
    }
    const eq = exclSelectedSource.value
    return `${eq.name}（评分 ${formatEquipmentScore(eq)}）`
  })
  const openExclSourcePicker = () => {
    exclSourcePickerVisible.value = true
    exclSourceKeyword.value = ''
    exclSourceFilterSlot.value = ''
  }
  const pickExclSource = (equipId) => {
    exclSelectedSourceId.value = equipId
    exclSourcePickerVisible.value = false
  }
  const clearExclSource = () => {
    exclSelectedSourceId.value = ''
  }
  // 已拥有的该角色专属装备
  const exclOwnedEquipments = computed(() => {
    if (!exclSelectedCharId.value) return []
    return playerStore.items.filter(i => i.isExclusive && i.exclusiveCharId === exclSelectedCharId.value)
  })
  const exclOwnedCount = (slot) => exclOwnedEquipments.value.filter(e => e.slot === slot).length
  const exclPreviewName = computed(() => {
    if (!exclCharName.value || !exclSelectedSlot.value) return ''
    return `${exclCharName.value}·专属${EXCLUSIVE_SLOT_NAMES[exclSelectedSlot.value] || ''}`
  })
  const onExclCharChange = () => {
    exclSelectedSlot.value = ''
    exclCraftResult.value = null
    exclSelectedSourceId.value = ''
  }
  const canCraftExclusive = () => {
    if (!exclSelectedCharId.value || !exclSelectedSlot.value) return false
    if (!exclSelectedSourceId.value) return false
    if (exclInnerPillCount.value < EXCLUSIVE_EQUIP_CONFIG.innerPillCost) return false
    return true
  }
  const handleCraftExclusive = () => {
    if (!canCraftExclusive()) return
    const result = playerStore.craftExclusiveEquipment(
      exclSelectedCharId.value,
      exclSelectedSlot.value,
      exclSelectedSourceId.value
    )
    exclCraftResult.value = result
    if (result.success) {
      message.success(result.message)
      // 打造成功后清除选择（材料已消耗）
      exclSelectedSourceId.value = ''
    } else {
      message.error(result.message || '打造失败')
    }
  }

  const selectAllCurrentPage = () => {
    const pageIds = forgePagedInventory.value.map(e => e.id)
    const allSelected = pageIds.every(id => selectedDisassembleIds.value.includes(id))
    if (allSelected) {
      selectedDisassembleIds.value = selectedDisassembleIds.value.filter(id => !pageIds.includes(id))
    } else {
      const set = new Set([...selectedDisassembleIds.value, ...pageIds])
      selectedDisassembleIds.value = Array.from(set)
    }
  }

  // 强化成功率（与 enhanceEquipment 内部计算保持一致）：
  // base - level*0.03 + bonus；专属装备 +13~15 冻结在 +12 的水平（currentLevel=11）
  const getEnhanceSuccessRate = (equip) => {
    if (!equip) return 0
    let level = equip.enhanceLevel || 0
    if (equip.isExclusive && level >= enhanceConfig.exclusiveSuccessRateFreezeLevel) {
      level = enhanceConfig.exclusiveSuccessRateFreezeLevel
    }
    const bonus = playerStore.enhanceBonus || 0
    const rate = Math.min(1, enhanceConfig.baseSuccessRate - level * 0.03 + bonus)
    return Math.round(rate * 100)
  }

  const getLockLevelDisplay = (equip) => {
    if (!equip) return ''
    const level = equip.enhanceLevel || 0
    if (level < 4) return '失败归零'
    if (level < 8) return '+4 保护'
    return '+8 保护'
  }

  const getEnhanceGoldCost = (equip) => {
    if (!equip) return 0
    return getEnhanceSpiritStoneCost(equip.enhanceLevel || 0)
  }

  const getEnhanceStoneNeed = (equip) => {
    if (!equip) return 0
    const cost = getEnhanceStoneCost(equip.enhanceLevel || 0)
    return cost ? cost.count : 0
  }

  const enhanceStoneTypes = {
    common_enhance_stone: { name: '普通强化石' },
    advanced_enhance_stone: { name: '高级强化石' },
    supreme_enhance_stone: { name: '至尊强化石' }
  }

  const getEnhanceStoneName = (equip) => {
    if (!equip) return ''
    const cost = getEnhanceStoneCost(equip.enhanceLevel || 0)
    return cost && enhanceStoneTypes[cost.type] ? enhanceStoneTypes[cost.type].name : ''
  }

  const getEnhanceStoneCount = (equip) => {
    if (!equip) return 0
    const cost = getEnhanceStoneCost(equip.enhanceLevel || 0)
    if (!cost) return 0
    return playerStore.materials.filter(m => m.id === cost.type).length
  }

  // 12 阶强化每阶所需的 BOSS 素材信息
  const getEnhanceBossMaterialInfo = (equip) => {
    if (!equip) return null
    return getEnhanceBossMaterialCost(equip.enhanceLevel || 0)
  }
  const getEnhanceBossMaterialOwn = (equip) => {
    const info = getEnhanceBossMaterialInfo(equip)
    if (!info) return 0
    return playerStore.materials.filter(m => m.kind === 'boss_material' && m.id === info.id).length
  }

  // 装备最大强化等级：专属装备 +15，普通装备 +12
  const getEquipMaxEnhanceLevel = (equip) => {
    if (!equip) return enhanceConfig.maxLevel
    return equip.isExclusive ? (enhanceConfig.exclusiveMaxLevel || 15) : enhanceConfig.maxLevel
  }

  const canEnhance = (equip) => {
    if (!equip) return false
    const level = equip.enhanceLevel || 0
    if (level >= getEquipMaxEnhanceLevel(equip)) return false
    if (playerStore.spiritStones < getEnhanceGoldCost(equip)) return false
    if (getEnhanceStoneCount(equip) < getEnhanceStoneNeed(equip)) return false
    // 检查 BOSS 素材是否足够
    const bossInfo = getEnhanceBossMaterialInfo(equip)
    if (bossInfo && getEnhanceBossMaterialOwn(equip) < bossInfo.count) return false
    return true
  }

  const handleEnhance = () => {
    if (!selectedForgeEquip.value) return
    const result = playerStore.enhanceEquipmentItem(selectedForgeEquip.value)
    if (result.success) {
      message.success(`强化成功！${selectedForgeEquip.value.name} +${selectedForgeEquip.value.enhanceLevel}`)
    } else {
      message.error(`强化失败：${result.message}`)
    }
  }

  // 洗练按装备品级所需的 BOSS 素材信息
  const getReforgeBossMaterialInfo = (equip) => {
    if (!equip) return null
    const def = getReforgeBossMaterial(equip.rarity || 'common')
    if (!def) return null
    return { id: def.id, name: def.name, count: 1 }
  }
  const getReforgeBossMaterialOwn = (equip) => {
    const info = getReforgeBossMaterialInfo(equip)
    if (!info) return 0
    return playerStore.materials.filter(m => m.kind === 'boss_material' && m.id === info.id).length
  }

  const canReforge = (equip) => {
    if (!equip) return false
    if (playerStore.refinementStones < reforgeConfig.costPerAttempt) return false
    // 检查 BOSS 素材是否足够
    const bossInfo = getReforgeBossMaterialInfo(equip)
    if (bossInfo && getReforgeBossMaterialOwn(equip) < bossInfo.count) return false
    if (reforgeMode.value === 'single') {
      if (Object.keys(cleanAffixStats.value).length === 0) return false
      if (!selectedReforgeStat.value) return false
    }
    return true
  }

  const handleReforge = () => {
    if (!selectedForgeEquip.value) return
    const result = playerStore.reforgeEquipmentPreview(selectedForgeEquip.value, reforgeMode.value, selectedReforgeStat.value)
    if (result.success) {
      const oldStats = {}
      Object.entries(selectedForgeEquip.value.stats).forEach(([stat, val]) => {
        if (['attack', 'health', 'defense', 'speed'].includes(stat) || (val && val !== 0 && !Number.isNaN(val))) {
          oldStats[stat] = val
        }
      })
      reforgeResult.value = {
        oldStats,
        newStats: result.newStats,
        wasSafe: result.wasSafe
      }
    } else {
      message.error(result.message)
    }
  }

  const confirmReforgeResult = () => {
    if (!selectedForgeEquip.value || !reforgeResult.value) return
    const result = playerStore.reforgeEquipmentConfirm(selectedForgeEquip.value, reforgeResult.value.newStats)
    if (result.success) {
      message.success('大洗练完成！')
      reforgeResult.value = null
      selectedReforgeStat.value = null
    } else {
      message.error(result.message)
    }
  }

  const handleBatchDisassemble = async () => {
    if (selectedDisassembleIds.value.length === 0) return
    const result = await playerStore.batchDisassembleEquipments(selectedDisassembleIds.value)
    if (result.success) {
      message.success(result.message)
      selectedDisassembleIds.value = []
    } else {
      message.error(result.message)
    }
  }

  const getStatName = (statKey) => {
    const statNames = {
      attack: '攻击',
      defense: '防御',
      health: '生命',
      speed: '速度',
      critRate: '暴击率',
      critDamage: '暴击伤害',
      critDamageBoost: '暴击伤害加成',
      critDamageReduce: '暴击伤害减免',
      critResist: '抗暴击率',
      dodgeRate: '闪避率',
      dodgeResist: '抗闪避率',
      blockRate: '格挡率',
      counterRate: '反击率',
      counterResist: '抗反击率',
      stunRate: '眩晕率',
      stunResist: '抗眩晕率',
      comboRate: '连击率',
      comboResist: '抗连击率',
      vampireRate: '吸血率',
      hpRegen: '生命恢复',
      mpRegen: '法力恢复',
      maxMana: '最大法力',
      goldFind: '金币获取',
      expGain: '经验获取',
      dropRate: '掉落率',
      spiritStonesFind: '灵石获取',
      damageReflection: '伤害反弹',
      damageReduction: '伤害减免',
      skillDamage: '技能伤害',
      healingEffect: '治疗效果',
      healBoost: '治疗加成',
      elementalDamage: '元素伤害',
      elementalResist: '元素抗性',
      resistanceBoost: '抗性加成',
      petAttack: '宠物攻击',
      petDefense: '宠物防御',
      petHealth: '宠物生命',
      allStats: '全属性',
      finalDamage: '最终伤害',
      finalDamageBoost: '最终伤害加成',
      finalDamageReduce: '最终伤害减免',
      finalDefense: '最终防御',
      damagePerSecond: '每秒伤害',
      damagePerHit: '每次伤害',
      armorPenetration: '破甲',
      ignoreDefense: '忽视防御',
      lifesteal: '吸血',
      spellDamage: '法术伤害',
      physicalDamage: '物理伤害',
      energyRegen: '能量恢复',
      skillCooldown: '技能冷却',
      haste: '急速',
      spiritRate: '灵力获取',
      cultivationRate: '修炼速度',
      combatBoost: '战斗加成'
    }
    return statNames[statKey] || statKey
  }

  const formatStatValue = (statKey, value) => {
    const percentStats = ['critRate', 'critDamage', 'dodgeRate', 'blockRate', 'goldFind', 'expGain', 'dropRate', 'spiritStonesFind', 'damageReflection', 'damageReduction', 'skillDamage', 'healingEffect', 'elementalResist']
    if (percentStats.includes(statKey)) {
      return `${(value * 100).toFixed(1)}%`
    }
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}万`
    }
    return Math.round(value).toString()
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
    color: #C9C4BA;
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
    color: #C9C4BA;
    font-size: 13px;
    text-align: center;
  }

  .furnace-tab:hover {
    background: rgba(218, 165, 32, 0.08);
    color: #F5F0E8;
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
    color: #F5DEB3;
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

  .recipe-filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 12px;
  }
  .recipe-filter-select {
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid rgba(218, 165, 32, 0.3);
    background: rgba(20, 16, 38, 0.6);
    color: #e8e0ff;
    font-size: 13px;
    cursor: pointer;
    outline: none;
  }
  .recipe-filter-select:focus {
    border-color: rgba(218, 165, 32, 0.6);
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
    color: #F5DEB3;
    line-height: 1.5;
  }

  .recipe-status {
    font-size: 12px;
    color: #C9C4BA;
    text-align: right;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
  }

  .empty-hint {
    margin-top: 12px;
    color: #C9C4BA;
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
    color: #C9C4BA;
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
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }

  .effect-item {
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .effect-label {
    font-size: 12px;
    color: #C9C4BA;
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

  /* 内联展开详情容器：点击丹药后在该丹药卡片下方直接展开材料/效果/炼制控件 */
  .craft-inline-detail {
    margin-top: 12px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.28);
    border: 1px solid rgba(218, 165, 32, 0.3);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    animation: craftInlineIn 0.22s ease;
  }
  .inline-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .inline-section-title {
    margin: 0;
    font-size: 13px;
    color: var(--color-accent-gold, #daa520);
    font-weight: 600;
    letter-spacing: 0.5px;
    border-left: 3px solid var(--color-accent-gold, #daa520);
    padding-left: 8px;
  }
  .material-source {
    font-size: 11px;
    color: #9a958a;
    margin-left: 6px;
  }
  /* 内联炼制行：点击丹药后在该丹药卡片下方直接弹出数量选择与确认 */
  .craft-inline-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 10px 12px;
    background: rgba(139, 69, 19, 0.12);
    border: 1px solid rgba(218, 165, 32, 0.35);
    border-radius: 8px;
    animation: craftInlineIn 0.2s ease;
  }
  @keyframes craftInlineIn {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .craft-inline-row .craft-count-label {
    font-size: 13px;
    flex-shrink: 0;
  }

  .craft-count-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .craft-count-label {
    font-size: 14px;
    color: #F5DEB3;
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
    color: #C9C4BA;
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
    color: #F5DEB3;
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
    color: #C9C4BA;
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
    color: #C9C4BA;
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
    color: #C9C4BA;
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
    color: #F5DEB3;
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

  /* ===== 化器成灵下拉菜单 / 确认区 ===== */
  .transmute-select-section {
    margin-top: 12px;
  }

  .transmute-select {
    width: 100%;
  }

  /* 下拉选项：人物（名称 + 等级/门派） */
  .transmute-member-option {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 2px 0;
  }
  .transmute-member-name {
    font-size: 14px;
    font-weight: 600;
    color: #F5DEB3;
  }
  .transmute-member-sub {
    font-size: 12px;
    color: #C9C4BA;
  }

  /* 下拉选项：装备（名称 + 评分） */
  .transmute-equip-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 2px 0;
  }
  .transmute-equip-option-name {
    font-size: 14px;
    font-weight: 600;
  }
  .transmute-equip-option-score {
    font-size: 12px;
    color: #DAA520;
    flex-shrink: 0;
  }

  .transmute-confirm-section {
    margin-top: 16px;
  }

  .transmute-action {
    padding-bottom: 8px;
  }

  /* ===== 装备锻打样式 ===== */
  .forge-sub-tabs {
    /* 田字分布：2x2 网格 */
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }

  .forge-sub-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #C9C4BA;
    border: 1px solid transparent;
  }

  .forge-sub-tab:hover {
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
  }

  .forge-sub-tab.active {
    background: rgba(218, 165, 32, 0.15);
    border-color: var(--color-accent-gold);
    color: #ffd700;
  }

  .tab-icon {
    font-size: 18px;
  }

  .tab-label {
    font-size: 14px;
    font-weight: 500;
  }

  .forge-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* 装备筛选工具栏 */
  .forge-toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .forge-select {
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid rgba(139, 69, 19, 0.4);
    background: rgba(0, 0, 0, 0.3);
    color: #F5DEB3;
    font-size: 13px;
    cursor: pointer;
  }

  .forge-sort-btn {
    padding: 6px 14px;
    border: 1px solid rgba(139, 69, 19, 0.4);
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.3);
    color: #F5DEB3;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .forge-sort-btn:hover {
    background: rgba(218, 165, 32, 0.15);
  }

  .forge-sort-btn.active {
    background: rgba(218, 165, 32, 0.25);
    border-color: var(--color-accent-gold);
    color: #ffd700;
  }

  /* 专属装备打造样式 */
  .excl-char-select {
    min-width: 220px;
    padding: 8px 12px;
    font-size: 14px;
  }

  .excl-slot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 10px;
  }

  .excl-slot-item {
    padding: 14px 10px;
    text-align: center;
    cursor: pointer;
    border: 1px solid rgba(139, 69, 19, 0.4);
    border-radius: 8px;
    transition: all 0.2s;
    background: rgba(0, 0, 0, 0.3);
  }

  .excl-slot-item:hover {
    background: rgba(218, 165, 32, 0.12);
    border-color: var(--color-accent-gold);
  }

  .excl-slot-item.selected {
    background: rgba(218, 165, 32, 0.2);
    border-color: #ffd700;
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.35);
  }

  .excl-slot-name {
    font-size: 14px;
    color: #F5DEB3;
    font-weight: 500;
  }

  .excl-slot-owned {
    margin-top: 4px;
    font-size: 11px;
    color: #9c8;
  }

  .excl-preview {
    padding: 16px;
    border: 1px solid rgba(255, 69, 0, 0.4);
  }

  .excl-preview-name {
    font-size: 17px;
    font-weight: 600;
    color: #FF8C00;
    margin-bottom: 10px;
  }

  .excl-preview-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
  }

  .excl-tag {
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .excl-tag.rarity-mythic {
    background: rgba(255, 69, 0, 0.18);
    color: #FF4500;
    border: 1px solid rgba(255, 69, 0, 0.5);
  }

  .excl-tag.excl-tag-bind {
    background: rgba(218, 165, 32, 0.18);
    color: #ffd700;
    border: 1px solid rgba(218, 165, 32, 0.5);
  }

  .excl-tag.excl-tag-bonus {
    background: rgba(76, 175, 80, 0.18);
    color: #66bb6a;
    border: 1px solid rgba(76, 175, 80, 0.5);
  }

  .excl-tag.excl-tag-enhance {
    background: rgba(33, 150, 243, 0.18);
    color: #64b5f6;
    border: 1px solid rgba(33, 150, 243, 0.5);
  }

  .excl-preview-note {
    font-size: 13px;
    color: #C9C4BA;
    line-height: 1.6;
  }

  /* 神品装备来源按钮（消耗行内） */
  .excl-source-row {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  .excl-source-btn {
    flex: 1;
    padding: 8px 12px;
    background: rgba(255, 69, 0, 0.12);
    border: 1px solid rgba(255, 69, 0, 0.45);
    border-radius: 6px;
    color: #FF8C00;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .excl-source-btn:hover {
    background: rgba(255, 69, 0, 0.2);
    border-color: #FF4500;
  }

  .excl-source-btn.insufficient {
    color: #888;
    border-color: rgba(136, 136, 136, 0.4);
    background: rgba(0, 0, 0, 0.3);
  }

  /* 神品装备来源选择菜单 */
  .excl-source-picker-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
  }

  .excl-source-picker {
    width: 100%;
    max-width: 680px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    background: rgba(20, 12, 8, 0.96);
    border: 1px solid rgba(255, 69, 0, 0.5);
    border-radius: 12px;
    padding: 18px;
  }

  .excl-source-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .excl-source-picker-title {
    font-size: 16px;
    color: #FF8C00;
    font-weight: 600;
    margin: 0;
  }

  .excl-source-picker-close {
    background: none;
    border: none;
    color: #C9C4BA;
    font-size: 24px;
    cursor: pointer;
    line-height: 1;
    padding: 0 6px;
  }

  .excl-source-picker-close:hover {
    color: #fff;
  }

  .excl-source-filter {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .excl-filter-input,
  .excl-filter-select {
    padding: 6px 10px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(139, 69, 19, 0.5);
    border-radius: 6px;
    color: #F5DEB3;
    font-size: 13px;
  }

  .excl-filter-input {
    flex: 1;
  }

  .excl-filter-select {
    min-width: 130px;
  }

  .excl-source-picker-body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-right: 4px;
  }

  .excl-source-empty {
    text-align: center;
    color: #888;
    padding: 30px 10px;
    font-size: 13px;
  }

  .excl-source-item {
    padding: 10px 12px;
    border: 1px solid rgba(139, 69, 19, 0.35);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(0, 0, 0, 0.3);
  }

  .excl-source-item:hover {
    background: rgba(255, 69, 0, 0.12);
    border-color: rgba(255, 69, 0, 0.6);
  }

  .excl-source-item.selected {
    background: rgba(255, 69, 0, 0.2);
    border-color: #FF4500;
    box-shadow: 0 0 8px rgba(255, 69, 0, 0.35);
  }

  .excl-source-item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .excl-source-item-name {
    font-size: 14px;
    color: #FF8C00;
    font-weight: 600;
  }

  .excl-source-item-rarity {
    font-size: 11px;
    color: #FF4500;
    padding: 1px 6px;
    border: 1px solid rgba(255, 69, 0, 0.5);
    border-radius: 4px;
  }

  .excl-source-item-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #C9C4BA;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }

  .excl-source-item-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    font-size: 11px;
    color: #9c8;
  }

  .excl-source-picker-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(139, 69, 19, 0.3);
  }

  .enhance-cap-hint {
    font-size: 12px;
    color: #9c8;
    margin-left: 4px;
  }

  .forge-pagination {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    font-size: 12px;
    color: #C9C4BA;
    flex-wrap: wrap;
  }

  .forge-pagination-actions {
    display: flex;
    gap: 6px;
    margin-left: auto;
    flex-wrap: wrap;
  }

  .equip-score-badge {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: bold;
    color: #FFD700;
    background: rgba(255, 215, 0, 0.12);
    border: 1px solid rgba(255, 215, 0, 0.3);
  }

  .equip-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #C9C4BA;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #C9C4BA;
  }

  .equipment-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }

  .equipment-card {
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid rgba(139, 69, 19, 0.2);
    position: relative;
  }

  .equipment-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(139, 69, 19, 0.2);
  }

  .equipment-card.selected {
    border-color: var(--color-accent-gold);
    background: rgba(218, 165, 32, 0.1);
  }

  .equip-checkbox {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    border: 2px solid #666;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #4caf50;
    background: rgba(0, 0, 0, 0.5);
  }

  .equipment-card.selected .equip-checkbox {
    background: #4caf50;
    border-color: #4caf50;
    color: #fff;
  }

  .equip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .equip-name {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
  }

  .equip-enhance {
    color: #ffd700;
    margin-left: 4px;
    font-weight: 700;
  }

  .equip-rarity {
    font-size: 12px;
    font-weight: 500;
  }

  .equip-stats {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }

  .equip-stat {
    font-size: 13px;
    color: #F5F0E8;
    display: flex;
    justify-content: space-between;
  }

  .enhance-info {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .enhance-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .enhance-label {
    font-size: 14px;
    color: #C9C4BA;
  }

  .enhance-value {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
  }

  .cost-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cost-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
  }

  .cost-name {
    font-size: 14px;
    color: #C9C4BA;
  }

  .cost-value {
    font-size: 14px;
    font-weight: 600;
    color: #4caf50;
  }

  .cost-value.insufficient {
    color: #f44336;
  }

  .action-section {
    display: flex;
    justify-content: center;
    padding: 16px 0;
  }

  .enhance-button,
  .reforge-button,
  .disassemble-button {
    padding: 12px 40px;
    font-size: 16px;
    font-weight: 600;
  }

  .enhance-button:disabled,
  .reforge-button:disabled,
  .disassemble-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .reforge-mode {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .reforge-mode button {
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 500;
  }

  .reforge-mode button.active {
    background: var(--color-accent-gold);
    color: #000;
    border-color: var(--color-accent-gold);
  }

  .stat-select {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .stat-btn {
    padding: 8px 16px;
    font-size: 13px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #F5F0E8;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .stat-btn:hover {
    background: rgba(0, 0, 0, 0.5);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .stat-btn.active {
    background: rgba(218, 165, 32, 0.15);
    border-color: var(--color-accent-gold);
    color: #ffd700;
  }

  .reforge-safe {
    margin-top: 8px;
    font-size: 13px;
    color: #C9C4BA;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
  }

  .reforge-result {
    padding: 16px;
    max-height: 60vh;
    overflow-y: auto;
  }

  .reforge-compare {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .reforge-old,
  .reforge-new {
    flex: 1;
    min-width: 140px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    max-height: 300px;
    overflow-y: auto;
  }

  .reforge-old h4,
  .reforge-new h4 {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
  }

  .reforge-old h4 {
    color: #C9C4BA;
  }

  .reforge-new h4 {
    color: #4caf50;
  }

  .reforge-stat {
    font-size: 14px;
    color: #F5F0E8;
    padding: 4px 0;
    display: flex;
    justify-content: space-between;
  }

  .reforge-arrow {
    display: flex;
    align-items: center;
    font-size: 32px;
    color: #ffd700;
    font-weight: bold;
  }

  .reforge-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
  }

  .disassemble-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    font-size: 14px;
    color: #F5F0E8;
  }

  /* 日间模式：统一为宗门页式深色卡片 + 亮色字体 */
  html:not(.dark) .alchemy-page {
    color: #F5F0E8;
  }
  html:not(.dark) .alchemy-page .glass-card {
    background: rgba(45, 44, 42, 0.92);
    border-color: rgba(255, 255, 255, 0.08);
    color: #F5F0E8;
  }
  html:not(.dark) .alchemy-page .section-title {
    color: #FFD86B;
  }
  html:not(.dark) .alchemy-page .material-item,
  html:not(.dark) .alchemy-page .effect-item {
    background: rgba(60, 59, 57, 0.85);
  }
  html:not(.dark) .alchemy-page .material-name {
    color: #F5F0E8;
  }
  /* 单方需求材料备注（来源说明）使用白色，确保可读 */
  html:not(.dark) .alchemy-page .material-source {
    color: #FFFFFF;
  }
  html:not(.dark) .alchemy-page .material-need {
    color: #C9C4BA;
  }
  html:not(.dark) .alchemy-page .recipe-name {
    color: #FFD86B;
  }
  html:not(.dark) .alchemy-page .recipe-desc,
  html:not(.dark) .alchemy-page .effect-value,
  html:not(.dark) .alchemy-page .effect-label,
  html:not(.dark) .alchemy-page .craft-count-label {
    color: #C9C4BA;
  }
  html:not(.dark) .alchemy-page .effect-value.highlight {
    color: #FFD86B;
  }
  html:not(.dark) .alchemy-page .tips-box {
    background: rgba(60, 59, 57, 0.85);
    color: #C9C4BA;
  }
  html:not(.dark) .alchemy-page .reforge-stat,
  html:not(.dark) .alchemy-page .disassemble-summary {
    color: #F5F0E8;
  }

  /* ===== 灵石阁（商店）样式 ===== */
  .shop-status-bar {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    padding: 10px 14px;
    margin-bottom: 14px;
    background: rgba(218, 165, 32, 0.08);
    border: 1px solid rgba(218, 165, 32, 0.25);
    border-radius: 8px;
    font-size: 13px;
    color: #d4c5a0;
    align-items: center;
  }
  .shop-balance .gold-text,
  .gold-text {
    color: #FFD700;
    font-size: 15px;
  }
  .shop-sell-tracker { color: #b8a888; }
  .shop-active-buffs { color: #7ee787; }

  .shop-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    margin-top: 10px;
  }
  .shop-card {
    padding: 12px;
    border: 1px solid rgba(139, 92, 246, 0.25);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: border-color 0.15s ease;
  }
  .shop-card:hover {
    border-color: rgba(218, 165, 32, 0.6);
  }
  .shop-card.sold {
    opacity: 0.45;
    filter: grayscale(0.6);
  }
  .shop-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .shop-icon { font-size: 22px; }
  .shop-name {
    font-weight: 600;
    color: #e5e7eb;
    flex: 1;
  }
  .shop-desc {
    font-size: 12px;
    color: #9ca3af;
    flex: 1;
    margin: 0;
    min-height: 32px;
  }
  .shop-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
  }
  /* BOSS 挑战券商店卡片 */
  .boss-ticket-card.soldout {
    opacity: 0.5;
  }
  .boss-ticket-buy-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
    font-size: 12px;
  }
  .ticket-stock {
    color: #F5DEB3;
  }
  .boss-ticket-footer {
    gap: 8px;
    flex-wrap: nowrap;
  }
  .shop-price {
    color: #FFD700;
    font-weight: 600;
    font-size: 13px;
  }
  .btn-buy {
    background: rgba(34, 197, 94, 0.7);
    color: #fff;
    border: 1px solid rgba(34, 197, 94, 0.9);
    padding: 4px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.15s ease;
  }
  .btn-buy:hover:not(:disabled) {
    background: rgba(34, 197, 94, 0.9);
  }
  .btn-buy:disabled {
    background: rgba(100, 100, 100, 0.4);
    color: #888;
    cursor: not-allowed;
    border-color: rgba(100, 100, 100, 0.4);
  }
  .btn-refresh {
    background: rgba(139, 92, 246, 0.6);
    color: #fff;
    border: 1px solid rgba(139, 92, 246, 0.8);
    padding: 4px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
  }
  .btn-refresh:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  /* 人物挑战券兑换区 */
  .char-ticket-exchange {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 140, 0, 0.06);
    border: 1px solid rgba(255, 140, 0, 0.25);
    border-radius: 10px;
  }
  .char-ticket-select-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .char-ticket-label {
    font-size: 14px;
    color: #F5DEB3;
    font-weight: 600;
    flex-shrink: 0;
  }
  .char-ticket-select {
    flex: 1;
    min-width: 220px;
  }
  .char-ticket-info {
    padding: 12px;
    border-radius: 8px;
  }
  .char-ticket-detail {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .char-ticket-name {
    font-size: 15px;
    font-weight: bold;
    color: #FFD700;
  }
  .char-ticket-owned {
    font-size: 12px;
    color: #C9C4BA;
  }
  .char-ticket-price {
    font-size: 14px;
    color: #FFD700;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .char-ticket-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .char-ticket-count {
    width: 120px;
  }
  .char-ticket-actions .btn-buy {
    padding: 8px 16px;
    font-size: 13px;
  }
  .black-market-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .black-market-hint {
    font-size: 11px;
    color: #6b7280;
    margin: 4px 0 0;
  }
  .black-market-card {
    border-color: rgba(139, 92, 246, 0.4);
  }
  /* ===== 皮肤阁卡片样式 ===== */
  .skin-shop-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
  .skin-shop-card {
    cursor: pointer;
    border-color: rgba(255, 215, 0, 0.4);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .skin-shop-card:hover:not(.sold) {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
  }
  .skin-shop-card.sold {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .skin-card-portrait {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 6px;
    overflow: hidden;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    margin-bottom: 6px;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  .skin-card-portrait:hover {
    transform: scale(1.03);
  }
  .skin-avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .skin-avatar.clickable-portrait {
    cursor: pointer;
  }
  .skin-avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    font-weight: bold;
    color: rgba(255, 215, 0, 0.6);
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
  .star-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
  }
  .star-badge.star-3 { color: #c0c0c0; }
  .star-badge.star-4 { color: #4169E1; }
  .star-badge.star-5 { color: #FFD700; }
  /* 皮肤预览弹窗 */
  .skin-preview-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .skin-preview-modal {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 2px solid rgba(255, 215, 0, 0.5);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .skin-preview-close {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .skin-preview-close:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  .skin-preview-title {
    margin: 0 0 12px;
    color: #FFD700;
    font-size: 16px;
  }
  .skin-preview-image-wrap {
    width: 100%;
    max-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }
  .skin-preview-image {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    border-radius: 8px;
  }
  .skin-preview-placeholder {
    color: #9ca3af;
    text-align: center;
    padding: 40px;
  }
  .skin-preview-placeholder .hint {
    font-size: 12px;
    color: #6b7280;
    margin-top: 8px;
  }
  .skin-preview-footer {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .rarity-badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
  }
  .rarity-badge.common { color: #9ca3af; }
  .rarity-badge.uncommon { color: #88cc44; }
  .rarity-badge.rare { color: #7db4ff; }
  .rarity-badge.epic { color: #c89bff; }
  .rarity-badge.legendary { color: #FFD700; }
  .rarity-badge.mythic { color: #FF4500; }
  .sold-tag {
    color: #ef4444;
    font-size: 12px;
    font-style: italic;
  }
</style>
