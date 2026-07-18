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
                    <span class="material-source">{{ getMaterialSource(material) }}</span>
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
              <div class="craft-count-row">
                <span class="craft-count-label">炼制数量</span>
                <n-input-number v-model:value="craftCount" :min="1" :max="maxCraftCount" :disabled="maxCraftCount <= 1" style="width: 120px;" />
              </div>
              <button
                class="btn btn-primary craft-button"
                :class="{ disabled: !selectedRecipe || !checkMaterials(selectedRecipe, craftCount) }"
                @click="craftPill"
              >
                <span class="btn-icon"><FireOutlined /></span>
                <span>{{ !checkMaterials(selectedRecipe, craftCount) ? '材料不足' : (craftCount > 1 ? `批量炼制 ×${craftCount}` : '开始炼制') }}</span>
              </button>
            </div>
          </template>
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
                      <div class="enhance-value">+{{ (selectedForgeEquip.enhanceLevel || 0) + 1 }}</div>
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
                      <span>强化: {{ equip.enhanceLevel || 0 }}/{{ enhanceConfig.maxLevel }}</span>
                      <span class="equip-score-badge">评分 {{ calculateEquipmentScore(equip) }}</span>
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
                  <h3 class="section-title">洗练方式</h3>
                  <div class="reforge-mode">
                    <button
                      class="btn-primary"
                      :class="{ active: reforgeMode === 'all' }"
                      @click="reforgeMode = 'all'"
                    >
                      全部洗练
                    </button>
                    <button
                      class="btn-info"
                      :class="{ active: reforgeMode === 'single' }"
                      :disabled="Object.keys(cleanAffixStats).length === 0"
                      @click="reforgeMode = 'single'"
                    >
                      {{ Object.keys(cleanAffixStats).length === 0 ? '无可用词条' : '单条洗练' }}
                    </button>
                  </div>
                </div>

                <template v-if="reforgeMode === 'single'">
                  <div class="section forge-actions-section">
                    <h3 class="section-title">选择词条</h3>
                    <div v-if="Object.keys(cleanAffixStats).length === 0" class="empty-state">该装备无可洗练词条</div>
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
                  <h3 class="section-title">洗练消耗</h3>
                  <div class="cost-list">
                    <div class="cost-item">
                      <span class="cost-name">洗练石</span>
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
                    洗练
                  </button>
                </div>

                <template v-if="reforgeResult">
                  <div class="section forge-actions-section">
                    <h3 class="section-title">洗练结果</h3>
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
                      <span class="equip-score-badge">评分 {{ calculateEquipmentScore(equip) }}</span>
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
                      <span class="equip-score-badge">评分 {{ calculateEquipmentScore(equip) }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="forgeFilteredInventory.length === 0" class="empty-state">没有符合条件的装备</div>
              </div>
            </template>
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
  import { zones, DIFFICULTY_TEMPLATES } from '../plugins/zones'
  import { starConfig, getEffortCap } from '../plugins/characters'
  import LogPanel from '../components/LogPanel.vue'
  import { useMessage } from 'naive-ui'
  import {
    MedicineBoxOutlined,
    InfoCircleOutlined,
    FireOutlined
  } from '@ant-design/icons-vue'
  import { enhanceConfig, reforgeConfig, rarityConfig, getEnhanceSpiritStoneCost, getEnhanceStoneCost, getEnhanceBossMaterialCost, calculateEquipmentScore } from '../plugins/equipment'
  import { getReforgeBossMaterial } from '../plugins/cultivationSystem'

  const playerStore = usePlayerStore()
  const message = useMessage()
  const logRef = ref(null)

  const activeTab = ref('pill')
  const selectedRecipe = ref(null)
  const craftCount = ref(1)
  const selectedRebirthMember = ref(null)
  const showRebirthConfirm = ref(false)

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

  const selectRecipe = recipe => {
    selectedRecipe.value = recipe
  }

  const checkMaterials = (recipe, count = 1) => {
    if (!recipe) return false
    return recipe.materials.every(material => {
      const owned = playerStore.materials.filter(m => m.kind === (material.kind || 'herb') && m.id === material.id).length
      return owned >= material.count * count
    })
  }

  const maxCraftCount = computed(() => {
    if (!selectedRecipe.value) return 1
    const maxCounts = selectedRecipe.value.materials.map(material => {
      const owned = playerStore.materials.filter(m => m.kind === (material.kind || 'herb') && m.id === material.id).length
      return Math.floor(owned / material.count) || 0
    })
    return Math.max(1, Math.min(...maxCounts))
  })

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
  })

  const craftPill = () => {
    if (!selectedRecipe.value) return
    const count = Math.min(Math.max(1, craftCount.value || 1), maxCraftCount.value)
    const result = playerStore.craftPill(selectedRecipe.value.id, count)
    if (result.success) {
      const successCount = result.successCount || 1
      window.$message?.success(`获得 ${selectedRecipe.value.name}${successCount > 1 ? ` ×${successCount}` : ''}`)
      logRef.value?.addLog('success', result.message)
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
    // 若新装备无可用词条，自动切回全部洗练
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

  const getEnhanceSuccessRate = (equip) => {
    if (!equip) return 0
    const level = equip.enhanceLevel || 0
    let rate = enhanceConfig.baseSuccessRate
    if (level >= 4) rate -= 0.05
    if (level >= 8) rate -= 0.05
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

  const canEnhance = (equip) => {
    if (!equip) return false
    const level = equip.enhanceLevel || 0
    if (level >= enhanceConfig.maxLevel) return false
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
      message.success('洗练完成！')
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

  /* ===== 装备锻打样式 ===== */
  .forge-sub-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .forge-sub-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
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
</style>
