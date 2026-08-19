<template>
  <div class="character-page fade-in-up">
    <!-- 1. 宗门概览 -->
    <div class="sect-overview glass-card">
      <h2 class="sect-title">宗门【{{ playerStore.name }}】</h2>
      <div class="sect-stats">
        <div class="sect-stat-item">
          <span class="sect-stat-label">成员</span>
          <span class="sect-stat-value">{{ sectSize }} / {{ sectMax }}</span>
        </div>
        <div class="sect-stat-item">
          <span class="sect-stat-label">出战队伍</span>
          <span class="sect-stat-value">{{ teamSize }} / {{ teamMax }}</span>
        </div>
        <div class="sect-stat-item">
          <span class="sect-stat-label">队伍总战力</span>
          <span class="sect-stat-value">{{ formatNumber(totalStrength) }}</span>
        </div>
        <div class="sect-stat-item">
          <span class="sect-stat-label">灵魂碎片</span>
          <span class="sect-stat-value">{{ playerStore.characterEssence }}</span>
        </div>
      </div>
    </div>

    <!-- 修为公共池 -->
    <div class="cultivation-pool glass-card">
      <h3 class="section-title">修为公共池</h3>
      <div class="pool-display">
        <div class="pool-amount">
          <span class="pool-value">{{ formatNumber(playerStore.getCultivationPool()) }}</span>
          <span class="pool-label">点修为</span>
        </div>
        <div class="pool-hint">修为可自由分配给宗门任意成员</div>
      </div>
      <div class="allocate-section" v-if="selectedMember">
        <div class="allocate-header">
          <span>分配给：{{ selectedMember.name }}</span>
          <span class="current-exp">当前：Lv.{{ selectedMember.level }} ({{ selectedMember.experience || 0 }} / {{ getRequiredExp(selectedMember.level) }})</span>
        </div>
        <div class="allocate-controls">
          <input 
            type="number" 
            v-model.number="allocateAmount" 
            min="1" 
            :max="Math.min(playerStore.getCultivationPool(), 9999999999)"
            placeholder="输入修为数量"
            class="allocate-input"
          />
          <button class="btn btn-small btn-primary" @click="allocateQuick(100000)">+10万</button>
          <button class="btn btn-small btn-primary" @click="allocateQuick(1000000)">+100万</button>
          <button class="btn btn-small btn-success" @click="doAllocate">分配</button>
        </div>
        <div class="allocate-quick">
          <button class="btn btn-small btn-outline" @click="allocateMax">一键拉满</button>
          <button class="btn btn-small btn-outline" @click="allocateToNextLevel">升到下一级</button>
        </div>
      </div>
    </div>

    <!-- 2. 角色选择区 -->
    <div class="member-select glass-card">
      <label>选择角色</label>
      <div class="member-select-row">
        <select v-model="selectedMemberId" @change="selectMember(selectedMemberId)">
          <optgroup v-if="teamMemberOptions.length > 0" label="出战成员">
            <option v-for="m in teamMemberOptions" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </optgroup>
        </select>
        <button
          v-if="nonTeamMemberOptions.length > 0"
          class="btn btn-small"
          @click="showCollectionModal = true"
        >
          未出战（{{ nonTeamMemberOptions.length }}）
        </button>
      </div>
    </div>

    <!-- 3. 选中角色详情面板 -->
    <div v-if="selectedMember" class="char-card glass-card">
      <div class="char-header">
        <div class="char-avatar-container">
          <div class="char-avatar" :class="selectedMember?.star >= 5 ? 'star-5' : (selectedMember?.star >= 4 ? 'star-4' : '')" @click="openPortrait">
            <img v-if="getCharacterAvatar(selectedMember)" :src="getCharacterThumbnail(selectedMember)" loading="lazy" decoding="async" />
            <span v-else>{{ selectedMember.name?.[0] || '仙' }}</span>
          </div>
          <span class="char-avatar-hint">点击查看立绘</span>
        </div>
        <div class="char-info">
          <div class="char-name-row">
            <h2 class="char-name">{{ selectedMember.name }}</h2>
            <span class="star-badge">{{ '★'.repeat(selectedMember.star || 1) }}</span>
          </div>
          <div class="char-meta">
            <span class="char-school">{{ characterSchools[selectedMember.school]?.name || selectedMember.school || '未知流派' }}</span>
            <span class="char-talent">{{ characterTalents[selectedMember.talent]?.name || selectedMember.talent || '未知天赋' }}</span>
          </div>
          <div class="char-level">Lv.{{ selectedMember.level }}</div>
          <div class="build-strength">
            <span class="build-label">战力</span>
            <span class="build-value">{{ formatNumber(getCachedStrength(selectedMember)) }}</span>
          </div>
          <span v-if="!isTeamMemberSelected" class="non-team-hint">未出战成员 · 详细面板请加入队伍后查看</span>
        </div>
      </div>

      <!-- 属性面板（仅出战成员渲染，节省计算资源） -->
      <div v-if="isTeamMemberSelected" class="attr-block">
        <h4 class="sub-title">属性面板 <span class="scroll-hint">（下滑查看更多）</span></h4>
        <div class="attr-table-wrap">
          <div class="attr-table scrollable-table">
            <div class="attr-row attr-head sticky-head">
              <span class="attr-col-label">属性</span>
              <span class="attr-col-base">基础</span>
              <span class="attr-col-delta">加成</span>
              <span class="attr-col-final">最终</span>
            </div>
            <div class="attr-group-title">基础属性</div>
            <div v-for="stat in mainStats" :key="stat.key" class="attr-row">
              <span class="attr-col-label">{{ stat.name }}</span>
              <span class="attr-col-base">{{ stat.base }}</span>
              <span class="attr-col-delta" :class="{ 'is-zero': stat.delta === 0 }">+{{ stat.delta }}</span>
              <span class="attr-col-final">{{ stat.final }}</span>
            </div>
            <div class="attr-group-title">战斗属性</div>
            <div v-for="stat in combatStats" :key="stat.key" class="attr-row">
              <span class="attr-col-label">{{ stat.name }}</span>
              <span class="attr-col-base">{{ stat.base }}</span>
              <span class="attr-col-delta" :class="{ 'is-zero': stat.delta === 0 }">+{{ stat.delta }}</span>
              <span class="attr-col-final">{{ stat.final }}</span>
            </div>
            <div class="attr-group-title">特殊属性</div>
            <div v-for="stat in specialStats" :key="stat.key" class="attr-row">
              <span class="attr-col-label">{{ stat.name }}</span>
              <span class="attr-col-base">{{ stat.base }}</span>
              <span class="attr-col-delta" :class="{ 'is-zero': stat.delta === 0 }">+{{ stat.delta }}</span>
              <span class="attr-col-final">{{ stat.final }}</span>
            </div>
            <div v-if="petBonusStats.length > 0" class="attr-group-title">灵宠加成</div>
            <div v-for="stat in petBonusStats" :key="stat.key" class="attr-row">
              <span class="attr-col-label">{{ stat.name }}</span>
              <span class="attr-col-base">-</span>
              <span class="attr-col-delta">+{{ stat.value }}</span>
              <span class="attr-col-final">{{ stat.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <p v-if="selectedMember.description" class="member-desc">{{ selectedMember.description }}</p>

      <div class="member-team-action">
        <button
          class="btn"
          :class="isInTeam(selectedMember.id) ? 'btn-warning' : 'btn-success'"
          @click="toggleTeam(selectedMember.id)"
        >
          {{ isInTeam(selectedMember.id) ? '退出' : '加入队伍' }}
        </button>
      </div>
    </div>

    <!-- 4. 装备区域（仅出战成员渲染） -->
    <div v-if="isTeamMemberSelected" class="stats-card glass-card">
      <h3 class="section-title">装备</h3>
      <div class="equip-actions">
        <button class="btn btn-primary" @click="autoEquip">一键装备</button>
        <button class="btn btn-warning" @click="autoUnequip">一键卸下</button>
      </div>
      <div class="equip-grid">
        <div
          v-for="slot in slots"
          :key="slot"
          class="equip-slot"
          :class="{ 
            empty: !selectedMember.equippedArtifacts?.[slot],
            [`equip-border-${selectedMember.equippedArtifacts?.[slot]?.quality || 'common'}`]: selectedMember.equippedArtifacts?.[slot],
            [`equip-bg-${selectedMember.equippedArtifacts?.[slot]?.quality || 'common'}`]: selectedMember.equippedArtifacts?.[slot]
          }"
          :style="{ backgroundImage: `url(${slotBgImages[slot]})` }"
          @click="selectedMember.equippedArtifacts?.[slot] ? unequipSlot(slot) : openEquipSelect(slot)"
        >
          <div class="equip-slot-label">{{ slotNames[slot] }}</div>
          <div
            v-if="selectedMember.equippedArtifacts?.[slot]"
            class="equip-slot-name"
            :style="{ color: getItemColor(selectedMember.equippedArtifacts[slot]) }"
            :class="'text-glow-' + (selectedMember.equippedArtifacts[slot].quality || 'common')"
          >
            {{ selectedMember.equippedArtifacts[slot].name }}
          </div>
          <div
            v-if="selectedMember.equippedArtifacts?.[slot]"
            class="equip-slot-score"
          >
            评分 {{ formatScore(selectedMember.equippedArtifacts[slot]) }}
          </div>
          <div v-else class="equip-slot-empty">空</div>
        </div>
      </div>
    </div>

    <!-- 5. 灵宠区域（仅出战成员渲染） -->
    <div v-if="isTeamMemberSelected" class="pet-card glass-card">
      <h3 class="section-title">灵宠</h3>
      <div v-if="selectedMember.equippedPet" class="pet-equipped">
        <img
          v-if="getPetThumbnail(selectedMember.equippedPet)"
          :src="getPetThumbnail(selectedMember.equippedPet)"
          class="pet-thumb"
          :alt="selectedMember.equippedPet.name"
          decoding="async"
          @click.stop="openPetPortrait(selectedMember.equippedPet)"
          @error="$event.target.style.display='none'"
        />
        <span class="pet-name" :style="{ color: getPetColor(selectedMember.equippedPet) }" @click="unequipPet">{{ selectedMember.equippedPet.name }}</span>
        <span class="pet-meta" @click="unequipPet">Lv.{{ selectedMember.equippedPet.level }} {{ selectedMember.equippedPet.rarity || '' }} · 点击卸下</span>
      </div>
      <div v-else class="pet-empty" @click="showPetSelect = true">
        <span class="pet-empty-icon">🐾</span>
        <span>未装备灵宠 · 点击选择</span>
      </div>
    </div>

    <!-- 6. 队伍管理区 -->
    <div class="stats-card glass-card">
      <h3 class="section-title">队伍管理</h3>
      <div class="team-actions">
        <button class="btn btn-success" @click="autoPickBestTeam">一键组建最强队伍</button>
        <button v-if="nonTeamMemberOptions.length > 0" class="btn btn-outline" @click="showCollectionModal = true">
          未出战（{{ nonTeamMemberOptions.length }}）
        </button>
      </div>
      <!-- 宗派共鸣信息 -->
      <div v-if="resonanceInfo && (resonanceInfo.uniform.length || resonanceInfo.combo.length)" class="resonance-panel">
        <div class="resonance-header">
          <span class="resonance-title">宗派共鸣</span>
          <span class="resonance-mult">战力加成 ×{{ resonanceMultiplier }}</span>
        </div>
        <div class="resonance-list">
          <div v-for="(u, idx) in resonanceInfo.uniform" :key="'u'+idx" class="resonance-item uniform">
            <span class="resonance-name">{{ u.name }}</span>
            <span class="resonance-level">{{ u.level }}人同宗</span>
            <span class="resonance-desc">{{ u.desc }}</span>
          </div>
          <div v-for="(c, idx) in resonanceInfo.combo" :key="'c'+idx" class="resonance-item combo">
            <span class="resonance-name">{{ c.name }}</span>
            <span class="resonance-desc">{{ c.desc }}</span>
          </div>
        </div>
      </div>
      <div v-else-if="teamMembers.length > 0" class="resonance-panel empty">
        <span class="resonance-title">宗派共鸣</span>
        <span class="resonance-hint">当前队伍宗派搭配未触发共鸣效果</span>
      </div>
      <!-- 仅渲染出战成员（避免未出战成员触发重计算） -->
      <div v-if="teamMembers.length" class="bench-list">
        <div v-for="m in teamMembers" :key="m.id" class="bench-card team-card">
          <div class="bench-avatar" @click="openMemberPortrait(m)" title="点击查看立绘">
            <img v-if="getCharacterAvatar(m)" :src="getCharacterThumbnail(m)" loading="lazy" decoding="async" />
            <span v-else>{{ m.name?.[0] || '仙' }}</span>
          </div>
          <div class="bench-info">
            <div class="bench-name">{{ m.name }} <span class="bench-stars">{{ '★'.repeat(m.star || 1) }}</span></div>
            <div class="bench-strength">战力 {{ formatNumber(getCachedStrength(m)) }}</div>
          </div>
          <button class="btn btn-info btn-small" @click="viewMemberDetail(m.id, $event)">详情</button>
          <button class="btn btn-small btn-warning" @click="toggleTeam(m.id)">退出</button>
        </div>
      </div>
      <div v-else class="bench-empty">暂无出战成员</div>
    </div>

    <!-- 人物详情弹窗（独立弹窗，不再切换顶部面板） -->
    <!-- 使用 Teleport 移到 body，避免父级 overflow-y:auto 容器导致 fixed 定位在移动端失效 -->
    <Teleport to="body">
      <div v-if="showMemberDetailModal && detailMember" class="equip-select-modal character-detail-modal" @click.self="closeMemberDetail">
        <div class="modal-content glass-card character-detail-content sect-member-modal-content" @click.stop :style="modalPositionStyle">
        <div class="char-detail-header">
          <div class="char-avatar large" :class="detailMember?.star >= 5 ? 'star-5' : (detailMember?.star >= 4 ? 'star-4' : '')" @click="openDetailPortrait" title="点击查看立绘">
            <img v-if="getCharacterAvatar(detailMember)" :src="getCharacterThumbnail(detailMember)" loading="lazy" decoding="async" />
            <span v-else>{{ detailMember.name?.[0] || '仙' }}</span>
            <span class="char-avatar-hint">点击查看立绘</span>
          </div>
          <div class="char-info">
            <div class="char-name-row">
              <h2 class="char-name">{{ detailMember.name }}</h2>
              <span class="star-badge">{{ '★'.repeat(detailMember.star || 1) }}</span>
            </div>
            <div class="char-meta">
              <span class="char-school" :style="{ color: detailMember.schoolColor }">
                {{ detailMember.schoolIcon }} {{ detailMember.schoolName }}
              </span>
              <span class="char-role" :style="{ color: detailMember.schoolColor }">
                {{ detailMember.roleIcon }} {{ detailMember.roleName }} · {{ detailMember.roleDesc }}
              </span>
            </div>
            <div class="char-talent-info">天赋: <b>{{ detailMember.talentName }}</b> · {{ detailMember.talentDesc }}</div>
            <div class="char-level">Lv.{{ detailMember.level }} · 战力 {{ formatNumber(getCachedStrength(detailMember)) }}</div>
            <div class="char-potential">
              <span>天赋值: {{ detailMember.talentValue || starConfig[detailMember.star]?.talentValue || 100 }}</span>
              <span class="divider">|</span>
              <span>努力值: {{ Math.round(detailMember.effortValue || 0) }}
                <span v-if="getEffortCap(detailMember.star) !== null"> / {{ getEffortCap(detailMember.star) }}</span>
                <span v-else>（无上限）</span>
              </span>
              <span class="divider">|</span>
              <span>突破: {{ detailMember.breakThrough || 0 }}/5</span>
            </div>
          </div>
          <button class="btn btn-warning btn-close" @click="closeMemberDetail">关闭</button>
        </div>

        <!-- 综合属性面板（合并基础/战斗/特殊属性，含灵宠加成，最多7条） -->
        <div class="attr-block">
          <h4 class="sub-title">属性面板 <span class="scroll-hint">（下滑查看更多）</span></h4>
          <div class="attr-table-wrap">
            <div class="attr-table scrollable-table">
              <div class="attr-row attr-head sticky-head">
                <span class="attr-col-label">属性</span>
                <span class="attr-col-base">基础</span>
                <span class="attr-col-delta">加成</span>
                <span class="attr-col-final">最终</span>
              </div>
              <div v-for="stat in mergedDetailStats" :key="stat.key" class="attr-row">
                <span class="attr-col-label">{{ stat.name }}</span>
                <span class="attr-col-base">{{ stat.base }}</span>
                <span class="attr-col-delta" :class="{ 'is-zero': stat.delta === 0 }">+{{ stat.delta }}</span>
                <span class="attr-col-final">{{ stat.final }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 技能面板 -->
        <div class="attr-block" v-if="detailMember && detailMember.skills && detailMember.skills.length">
          <h4 class="sub-title">技能 <span v-if="detailMember.skillSchoolName">{{ detailMember.skillSchoolIcon }} {{ detailMember.skillSchoolName }}</span></h4>

          <!-- 技能装备槽（3 槽位，垂直排列避免溢出） -->
          <div class="skill-equip-section" v-if="getActiveSkillsForEquip(detailMember).length > 0">
            <h5 class="equip-sub-title">技能装备槽</h5>
            <div class="skill-equip-slots">
              <div
                v-for="slotIdx in 3"
                :key="'slot-' + slotIdx"
                class="skill-equip-slot"
                :class="{ filled: !!getEquippedSkillAtSlot(detailMember, slotIdx - 1) }"
              >
                <span class="slot-label">槽{{ slotIdx }}</span>
                <template v-if="getEquippedSkillAtSlot(detailMember, slotIdx - 1)">
                  <span class="slot-skill-name">
                    {{ getSkillCategoryIcon(getEquippedSkillAtSlot(detailMember, slotIdx - 1).category) }}
                    {{ getEquippedSkillAtSlot(detailMember, slotIdx - 1).name }}
                  </span>
                  <button class="btn-unequip" @click.stop="onUnequipSkill(detailMember, slotIdx - 1)" title="卸下">✕</button>
                </template>
                <span v-else class="slot-empty-text">空</span>
              </div>
            </div>
          </div>

          <!-- 技能列表（含装备按钮，不再重复显示） -->
          <div class="skill-list">
            <div v-for="skill in detailMember.skills" :key="skill.id" class="skill-item" :class="skill.type">
              <div class="skill-icon">{{ getSkillCategoryIcon(skill.category) }}</div>
              <div class="skill-info">
                <div class="skill-name">{{ skill.name }}</div>
                <div class="skill-type">{{ getSkillTypeName(skill.type) }}</div>
              </div>
              <div class="skill-desc">{{ skill.description }}</div>
              <button
                v-if="skill.type === 'active'"
                class="btn-equip-toggle"
                :class="{ equipped: isSkillEquipped(detailMember, skill.id) }"
                @click="onEquipBtnClick(detailMember, skill)"
              >
                {{ isSkillEquipped(detailMember, skill.id) ? '已装' : '装备' }}
              </button>
            </div>
          </div>
          <!-- 灵宠入口：点击进入该角色正在装备的灵宠详情页（与背包灵宠详情页一致） -->
          <div class="attr-block detail-pet-section">
            <h4 class="sub-title">灵宠</h4>
            <div v-if="detailMember.equippedPet" class="detail-pet-info">
              <img
                v-if="getPetThumbnail(detailMember.equippedPet)"
                :src="getPetThumbnail(detailMember.equippedPet)"
                class="detail-pet-thumb"
                :alt="detailMember.equippedPet.name"
                loading="lazy"
                decoding="async"
                @error="$event.target.style.display='none'"
              />
              <div class="detail-pet-meta">
                <div class="detail-pet-name" :style="{ color: getPetColor(detailMember.equippedPet) }">
                  {{ detailMember.equippedPet.name }}
                </div>
                <div class="detail-pet-sub">
                  {{ getPetRarityName(detailMember.equippedPet) }} · Lv.{{ detailMember.equippedPet.level || 1 }} · ⭐{{ detailMember.equippedPet.star || 0 }}
                </div>
              </div>
              <button
                class="btn btn-small btn-primary detail-pet-btn"
                @click="openDetailPetPortrait"
                title="查看灵宠详情与立绘"
              >
                灵宠详情
              </button>
            </div>
            <div v-else class="detail-pet-empty">
              <span class="detail-pet-empty-icon">🐾</span>
              <span>未装备灵宠</span>
            </div>
          </div>

          <div class="breakthrough-section">
            <div v-if="detailMember.breakThrough < 5" class="skill-unlock-hint">
              ⚡ 每突破一次可获得 2 个新技能
            </div>
            <button
              v-if="(detailMember.breakThrough || 0) < 5"
              class="btn-small btn-breakthrough"
              @click="tryManualBreakthrough"
              :disabled="(playerStore.characterEssence || 0) < 1"
            >
              手动突破 (消耗1灵魂碎片)
            </button>
            <div v-if="(detailMember.breakThrough || 0) >= 5" class="breakthrough-max">
              ★ 已突破至最高境界 ★
            </div>
          </div>
        </div>

        <!-- 技能槽位选择弹窗：点击"装备"按钮后弹出，选择要装备到哪个槽位 -->
        <!-- 使用 Teleport 移到 body，避免父级 overflow-y:auto 容器导致 fixed 定位在移动端失效 -->
        <Teleport to="body">
          <div v-if="skillSlotPicker.show" class="skill-slot-picker-overlay" @click.self="closeSkillSlotPicker">
            <div class="skill-slot-picker">
              <div class="picker-header">
                <span>选择装备槽位</span>
                <button class="picker-close" @click="closeSkillSlotPicker">✕</button>
              </div>
              <div class="picker-skill-name">
                {{ getSkillCategoryIcon(skillSlotPicker.skill?.category) }} {{ skillSlotPicker.skill?.name }}
              </div>
              <div class="picker-slots">
                <button
                  v-for="slotIdx in 3"
                  :key="'pick-' + slotIdx"
                  class="picker-slot-btn"
                  @click="confirmEquipToSlot(slotIdx - 1)"
                >
                  <span class="picker-slot-label">槽位 {{ slotIdx }}</span>
                  <span class="picker-slot-current" v-if="getEquippedSkillAtSlot(detailMember, slotIdx - 1)">
                    {{ getEquippedSkillAtSlot(detailMember, slotIdx - 1).name }}
                  </span>
                  <span class="picker-slot-current empty" v-else>（空）</span>
                </button>
              </div>
            </div>
          </div>
        </Teleport>

        <!-- 装备区域（点击查看详情，详情页内可直接强化） -->
        <div class="attr-block" v-if="detailMember?.equippedArtifacts">
          <h4 class="sub-title">装备（点击查看详情）</h4>
          <div class="detail-equip-grid">
            <div
              v-for="slot in slots"
              :key="'detail_'+slot"
              class="detail-equip-slot"
              :class="{
                empty: !detailMember.equippedArtifacts?.[slot],
                [`equip-border-${detailMember.equippedArtifacts?.[slot]?.quality || 'common'}`]: detailMember.equippedArtifacts?.[slot]
              }"
              @click="openEquipDetail(slot)"
            >
              <div class="detail-equip-label">{{ slotNames[slot] }}</div>
              <div v-if="detailMember.equippedArtifacts?.[slot]" class="detail-equip-content">
                <div
                  class="detail-equip-name"
                  :style="{ color: getItemColor(detailMember.equippedArtifacts[slot]) }"
                >
                  {{ detailMember.equippedArtifacts[slot].name }}
                  <span v-if="detailMember.equippedArtifacts[slot].enhanceLevel > 0" class="enhance-lv">+{{ detailMember.equippedArtifacts[slot].enhanceLevel }}</span>
                </div>
                <button
                  class="btn btn-small btn-primary detail-enhance-btn"
                  @click.stop="openEquipDetail(slot)"
                >
                  详情
                </button>
              </div>
              <div v-else class="detail-equip-empty">空</div>
            </div>
          </div>
        </div>

        <!-- 三段式小传 -->
        <div class="attr-block" v-if="detailBiography">
          <h4 class="sub-title">人物小传</h4>
          <div class="bio-section">
            <p class="bio-text">{{ detailBiography.part1 }}</p>
          </div>
          <div class="bio-section" v-if="!detailBiography.isPart2Locked">
            <h5 class="bio-title">第二段 · 成长经历</h5>
            <p class="bio-text">{{ detailBiography.part2 }}</p>
          </div>
          <div v-else class="bio-locked">
            <h5 class="bio-title">第二段 · 成长经历</h5>
            <p>🔒 需要人物突破至 2 次以上解锁</p>
          </div>
          <div class="bio-section" v-if="!detailBiography.isPart3Locked">
            <h5 class="bio-title">第三段 · 终极目标</h5>
            <p class="bio-text">{{ detailBiography.part3 }}</p>
          </div>
          <div v-else class="bio-locked">
            <h5 class="bio-title">第三段 · 终极目标</h5>
            <p>🔒 需要人物突破至 4 次以上解锁</p>
          </div>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- 立绘查看器：复用抽卡时的角色立绘大图弹窗效果 -->
    <CharacterPortraitModal v-if="showPortrait" :character="portraitCharacter" @close="closePortrait" />
    <PetPortraitModal v-if="showPetPortrait" :pet="portraitPet" @close="closePetPortrait" @update-skin="onPetSkinChange" />

    <!-- 装备详情弹窗（宗门页长按装备触发，sect 模式：强化按钮替代出售/分解） -->
    <EquipmentDetailModal
      v-if="showEquipDetail"
      :equipment="equipDetailItem"
      mode="sect"
      :member-id="detailMember?.id"
      :slot="equipDetailSlot"
      @close="closeEquipDetail"
      @enhanced="onEquipDetailEnhanced"
    />

    <!-- 灵宠详情弹窗（人物详情页灵宠按钮触发，与背包灵宠详情页一致） -->
    <PetDetailModal
      v-if="showPetDetail"
      :pet="petDetailItem"
      @close="closePetDetail"
    />

    <!-- 装备选择弹窗 -->
    <div v-if="showEquipSelect" class="equip-select-modal" @click.self="closeEquipSelect">
      <div class="modal-content glass-card">
        <h3 class="section-title">选择 {{ slotNames[selectSlot] }}</h3>
        <div v-if="availableItemsForSlot.length" class="equip-select-list">
          <div
            v-for="item in availableItemsForSlot"
            :key="item.id || item.name"
            class="equip-select-item"
            @click="equipItem(item)"
          >
            <span class="item-name" :style="{ color: getItemColor(item) }">{{ item.name }}</span>
            <span class="item-score">评分 {{ formatEquipmentScore(item) }}</span>
          </div>
        </div>
        <div v-else class="equip-select-empty">没有可用的装备</div>
        <button class="btn btn-warning" @click="closeEquipSelect">取消</button>
      </div>
    </div>

    <!-- 灵宠选择弹窗 -->
    <div v-if="showPetSelect" class="equip-select-modal" @click.self="showPetSelect = false">
      <div class="modal-content glass-card">
        <h3 class="section-title">选择灵宠</h3>
        <div v-if="availablePets.length" class="equip-select-list">
          <div
            v-for="pet in availablePets"
            :key="pet.id || pet.name"
            class="equip-select-item pet-select-item"
            @click="equipPet(pet)"
          >
            <div class="pet-select-header">
              <span class="item-name" :style="{ color: getPetColor(pet) }">{{ pet.name }}</span>
              <span class="pet-score-badge">评分 {{ calculatePetScore(pet) }}</span>
            </div>
            <div class="pet-select-info">
              <span class="simple-tag" :style="{ color: getPetColor(pet) }">{{ getPetRarityName(pet) }}</span>
              <span>Lv.{{ pet.level || 1 }}</span>
              <span>⭐{{ pet.star || 0 }}</span>
            </div>
            <div class="pet-select-stats" v-if="pet.combatAttributes">
              <span v-if="pet.combatAttributes.attack">攻击: {{ pet.combatAttributes.attack }}</span>
              <span v-if="pet.combatAttributes.defense">防御: {{ pet.combatAttributes.defense }}</span>
              <span v-if="pet.combatAttributes.health">生命: {{ pet.combatAttributes.health }}</span>
            </div>
          </div>
        </div>
        <div v-else class="equip-select-empty">没有可用的灵宠</div>
        <button class="btn btn-warning" @click="showPetSelect = false">取消</button>
      </div>
    </div>

    <!-- 未出战弹窗：显示所有未出战宗门人物（点击时才渲染，避免首屏开销） -->
    <Teleport to="body">
      <div v-if="showCollectionModal" class="collection-overlay" @click.self="showCollectionModal = false">
        <div class="collection-modal">
          <div class="collection-header">
            <h3>未出战成员 · {{ nonTeamMemberOptions.length }} 位</h3>
            <button class="btn btn-small" @click="showCollectionModal = false">关闭</button>
          </div>
          <!-- 使用 v-memo 避免重渲染：仅在列表长度变化时重建 -->
          <div class="collection-list">
            <div v-for="m in nonTeamMemberOptions" :key="'col-' + m.id" class="collection-card">
              <div class="collection-avatar" @click="openMemberPortrait(m)" title="点击查看立绘">
                <img v-if="getCharacterAvatar(m)" :src="getCharacterThumbnail(m)" loading="lazy" decoding="async" />
                <span v-else>{{ m.name?.[0] || '仙' }}</span>
              </div>
              <div class="collection-info">
                <div class="collection-name">{{ m.name }} <span class="collection-stars">{{ '★'.repeat(m.star || 1) }}</span></div>
                <div class="collection-meta">Lv.{{ m.level }} · {{ characterSchools[m.school]?.name || m.school }}</div>
                <!-- 战力懒计算 + 缓存：点击详情时才计算，避免列表渲染时N次调用 -->
                <div class="collection-strength" v-if="strengthCache.has(m.id)">战力 {{ formatNumber(strengthCache.get(m.id)) }}</div>
                <div class="collection-strength lazy" v-else @click="getCachedStrength(m)">点击查看战力</div>
              </div>
              <div class="collection-actions">
                <button class="btn btn-info btn-small" @click="viewMemberDetail(m.id)">详情</button>
                <button class="btn btn-small btn-success" @click="toggleTeam(m.id)">加入</button>
              </div>
            </div>
          </div>
          <div v-if="nonTeamMemberOptions.length === 0" class="collection-empty">暂无未出战的人物</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
// 显式组件名，供 App.vue 的 keep-alive include 精确匹配
defineOptions({ name: 'Cultivation' })
import { usePlayerStore, computePetMultiplier } from '../stores/player'
import { ref, computed, watch, reactive } from 'vue'
import { useMessage } from 'naive-ui'
import { characterSchools, characterTalents, starConfig, getCharacterAvatar, getCharacterThumbnail, characterList, getEffectiveBaseStats, getEffortCap } from '../plugins/characters'
import { getExclusiveMultiplier } from '../plugins/exclusiveEquipment'
import { getSkillCategoryIcon, getSkillTypeName } from '../plugins/skills'
import { getRuneStats } from '../plugins/runes'
import { petRarities } from '../plugins/gacha'
import { getCharacterBiography } from '../plugins/characterBiographies'
import { calculateLevelExp } from '../plugins/cultivationSystem'
import { calculateEquipmentScore, formatEquipmentScore } from '../plugins/buildSystem'
import { getAllResonanceEffects, getResonanceDesc, getResonanceBuildMultiplier } from '../plugins/schoolResonance'
import CharacterPortraitModal from '../components/CharacterPortraitModal.vue'
import PetPortraitModal from '../components/PetPortraitModal.vue'
import PetDetailModal from '../components/PetDetailModal.vue'
import EquipmentDetailModal from '../components/EquipmentDetailModal.vue'
import { formatNumber } from '../utils/formatNumber.js'
import { getIconUrl } from '../plugins/icons'
import { getPetThumbnail } from '../plugins/pets'

const playerStore = usePlayerStore()
const message = useMessage()

const allocateAmount = ref(100)

const getRequiredExp = (level) => {
  return calculateLevelExp(level || 1)
}

const allocateQuick = (amount) => {
  allocateAmount.value = Math.min(
    (allocateAmount.value || 0) + amount,
    playerStore.getCultivationPool()
  )
}

const allocateMax = () => {
  allocateAmount.value = playerStore.getCultivationPool()
}

const allocateToNextLevel = () => {
  if (!selectedMember.value) return
  let required = calculateLevelExp(selectedMember.value.level) - (selectedMember.value.experience || 0)
  if (required <= 0) {
    let level = selectedMember.value.level + 1
    while (required <= 0 && level <= 100) {
      required += calculateLevelExp(level)
      level++
    }
  }
  if (required <= 0) {
    message.warning('该角色等级已达上限')
    return
  }
  allocateAmount.value = Math.min(required, playerStore.getCultivationPool())
}

const doAllocate = () => {
  if (!selectedMember.value || !allocateAmount.value || allocateAmount.value <= 0) {
    message.warning('请输入有效的修为数量')
    return
  }
  const result = playerStore.allocateCultivationToMember(selectedMember.value.id, allocateAmount.value)
  if (result.success) {
    message.success(result.message)
    allocateAmount.value = 100
  } else {
    message.error(result.message)
  }
}

const selectedMemberId = ref('')
const showEquipSelect = ref(false)
const selectSlot = ref('')
const showPetSelect = ref(false)
// 未出战成员弹窗控制
const showCollectionModal = ref(false)

// 战力缓存：避免列表渲染时重复调用 getCharacterBuildStrength（重计算开销大）
// 基于成员装备/宠物/等级/技能快照签名缓存，装备变化时自动失效重算
const strengthCache = new Map()
const getCachedStrength = (member) => {
  if (!member) return 0
  const sig = JSON.stringify({
    a: member.equippedArtifacts,
    p: member.equippedPet,
    l: member.level,
    s: member.skills,
    t: member.talentStats
  })
  const cached = strengthCache.get(member.id)
  if (cached && cached.sig === sig) return cached.value
  const value = playerStore.getCharacterBuildStrength(member)
  strengthCache.set(member.id, { value, sig })
  return value
}

const getPetRarityName = (pet) => {
  return petRarities[pet.rarity]?.name || '未知品质'
}

const calculatePetScore = (pet) => {
  if (!pet) return 0
  const rarityMap = { mortal: 1, spiritual: 1.5, mystic: 2, celestial: 3, divine: 5 }
  const rarityMult = rarityMap[pet.rarity] || 1
  const level = pet.level || 1
  const star = pet.star || 0
  const baseScore = (pet.combatAttributes?.attack || 0) * 5 +
                   (pet.combatAttributes?.health || 0) * 0.5 +
                   (pet.combatAttributes?.defense || 0) * 3
  return Math.round(baseScore * rarityMult * (1 + (level - 1) * 0.1) * (1 + star * 0.2))
}

// 计算属性
const teamMembers = computed(() => playerStore.teamMembers.map(id => playerStore.sectMembers.find(m => m.id === id)).filter(Boolean))
const allMembers = computed(() => playerStore.sectMembers || [])
const selectedMember = computed(() => playerStore.sectMembers.find(m => m.id === selectedMemberId.value))
const sortedMembers = computed(() => {
  const members = [...playerStore.sectMembers]
  return members.sort((a, b) => {
    const aInTeam = playerStore.teamMembers.includes(a.id)
    const bInTeam = playerStore.teamMembers.includes(b.id)
    if (aInTeam && !bInTeam) return -1
    if (!aInTeam && bInTeam) return 1
    return 0
  })
})

// 是否在队伍中（必须在使用它的 computed 之前定义，否则 watch 立即求值会触发 TDZ）
const isInTeam = (id) => playerStore.teamMembers.includes(id)

// 出战成员（始终显示）
const teamMemberOptions = computed(() => sortedMembers.value.filter(m => isInTeam(m.id)))
// 未出战成员（折叠显示）
const nonTeamMemberOptions = computed(() => sortedMembers.value.filter(m => !isInTeam(m.id)))

// 队伍变化时清空战力缓存（必须在 computed 定义之后，避免 TDZ）
watch([teamMembers, nonTeamMemberOptions], () => {
  strengthCache.clear()
})

// 是否选中了出战成员（用于控制重计算面板渲染，未出战成员不渲染以节省资源）
const isTeamMemberSelected = computed(() => selectedMember.value && isInTeam(selectedMember.value.id))

const sectSize = computed(() => playerStore.sectMembers?.length || 0)
const sectMax = computed(() => playerStore.maxSectSize || 0)
const teamSize = computed(() => playerStore.teamMembers?.length || 0)
const teamMax = computed(() => playerStore.maxTeamSize || 0)
const totalStrength = computed(() => {
  const base = teamMembers.value.reduce((sum, m) => sum + (getCachedStrength(m) || 0), 0)
  const mult = getResonanceBuildMultiplier(teamMembers.value)
  return Math.round(base * mult)
})

// 宗派共鸣信息
const resonanceInfo = computed(() => {
  const team = teamMembers.value
  if (team.length === 0) return null
  return getAllResonanceEffects(team)
})
const resonanceMultiplier = computed(() => getResonanceBuildMultiplier(teamMembers.value))
const resonanceDesc = computed(() => {
  const team = teamMembers.value
  if (team.length === 0) return []
  return getResonanceDesc(team)
})

// 槽位中文映射
const slotNames = { head:'头部', body:'衣服', legs:'裤子', feet:'鞋子', shoulder:'肩甲', hands:'手套', wrist:'护腕', necklace:'项链', ring1:'戒指1', ring2:'戒指2', belt:'腰带', artifact:'法宝' }
const slots = Object.keys(slotNames)
const slotBgImages = {
  head: getIconUrl('reward_eq_head.png'),
  body: getIconUrl('reward_eq_body.png'),
  legs: getIconUrl('reward_eq_legs.png'),
  feet: getIconUrl('reward_eq_feet.png'),
  shoulder: getIconUrl('reward_eq_shoulder.png'),
  hands: getIconUrl('reward_eq_wrist.png'),
  wrist: getIconUrl('reward_eq_wrist.png'),
  necklace: getIconUrl('reward_eq_necklace.png'),
  ring1: getIconUrl('reward_eq_ring.png'),
  ring2: getIconUrl('reward_eq_ring.png'),
  belt: getIconUrl('reward_eq_belt.png'),
  artifact: getIconUrl('reward_eq_artifact.png')
}

const rarityColorMap = {
  mortal: '#32CD32',
  spiritual: '#1E90FF',
  mystic: '#9932CC',
  celestial: '#FFD700',
  divine: '#FF0000',
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
  mythic: '#f44336'
}
const getItemColor = (item) => item?.color || rarityColorMap[item?.rarity] || rarityColorMap[item?.quality] || '#DAA520'
const getPetColor = (pet) => pet?.color || rarityColorMap[pet?.rarity] || '#9fe0ff'

// 装备评分格式化：1~9999 阿拉伯数字，1万~1亿 XXX万，1亿+ X.xxx亿
const formatScore = (equip) => formatEquipmentScore(equip)

const availableItemsForSlot = computed(() => {
  if (!selectSlot.value) return []
  return (playerStore.items || [])
    .filter(item => {
      if (item.equipped) return false
      if (item.slot === selectSlot.value || item.type === selectSlot.value) return true
      return false
    })
    // 默认按装备评分从高到低排序
    .sort((a, b) => (calculateEquipmentScore(b) || 0) - (calculateEquipmentScore(a) || 0))
})

const availablePets = computed(() => {
  // 排除已被任意角色装备的灵宠，确保同一灵宠不会被其他角色在界面上选中装备
  const equipped = new Set()
  ;(playerStore.sectMembers || []).forEach(m => {
    if (m.equippedPet) equipped.add(m.equippedPet.uid || m.equippedPet.id)
  })
  return (playerStore.items || []).filter(item => item.type === 'pet' && !equipped.has(item.uid || item.id))
})

// 角色属性计算系统
const STAT_NAMES = {
  attack: '攻击', health: '生命', defense: '防御', speed: '速度',
  critRate: '暴击率', comboRate: '连击率', counterRate: '反击率', stunRate: '眩晕率',
  dodgeRate: '闪避率', vampireRate: '吸血率',
  critResist: '抗暴击', comboResist: '抗连击', counterResist: '抗反击',
  stunResist: '抗眩晕', dodgeResist: '抗闪避', vampireResist: '抗吸血',
  healBoost: '治疗强化', critDamageBoost: '暴伤强化', critDamageReduce: '暴伤减免',
  finalDamageBoost: '最终增伤', finalDamageReduce: '最终减伤',
  combatBoost: '战意', resistanceBoost: '抗性'
}

const isPercentStat = (key) => ['critRate','comboRate','counterRate','stunRate','dodgeRate','vampireRate',
  'critResist','comboResist','counterResist','stunResist','dodgeResist','vampireResist',
  'healBoost','critDamageBoost','critDamageReduce','finalDamageBoost','finalDamageReduce',
  'combatBoost','resistanceBoost'].includes(key)

const formatStat = (key, val) => {
  if (isPercentStat(key)) return (val * 100).toFixed(1) + '%'
  return Math.floor(val)
}

const getMemberBaseStats = (member) => {
  if (!member) return {}
  const bs = member.baseStats || {}
  const ts = member.talentStats || {}
  const stats = {}
  
  const template = characterList.find(c => c.id === member.templateId)
  const templateBase = template?.baseStats || {}
  
  const effBase = getEffectiveBaseStats(member)
  
  for (const k of ['attack','health','defense','speed']) {
    let base = bs[k] || templateBase[k] || 0
    if (base <= 0) {
      const defaultBase = { attack: 10, health: 100, defense: 5, speed: 10 }
      base = defaultBase[k] || 0
    }
    const effVal = effBase[k] || base
    const talentBonus = ts[k] || 0
    stats[k] = Math.floor(effVal * (1 + talentBonus))
  }
  
  for (const k of ['critRate','comboRate','counterRate','stunRate','dodgeRate','vampireRate',
    'critResist','comboResist','counterResist','stunResist','dodgeResist','vampireResist',
    'healBoost','critDamageBoost','critDamageReduce','finalDamageBoost','finalDamageReduce',
    'combatBoost','resistanceBoost']) {
    const ca = member.combatAttributes || {}
    const cr = member.combatResistance || {}
    const sa = member.specialAttributes || {}
    const base = (bs[k] || 0) + (ca[k] || 0) + (cr[k] || 0) + (sa[k] || 0)
    const talentBonus = ts[k] || 0
    stats[k] = base + talentBonus
  }
  return stats
}

const getMemberEquipBonus = (member) => {
  if (!member) return {}
  const bonus = {}
  const artifacts = member.equippedArtifacts || {}
  Object.values(artifacts).forEach(eq => {
    if (!eq) return
    // 专属装备加成：对应角色穿戴时数值 ×1.3
    const exclMult = getExclusiveMultiplier(eq, member.templateId || member.id)
    if (eq.stats) {
      Object.entries(eq.stats).forEach(([k, v]) => {
        bonus[k] = (bonus[k] || 0) + Math.round((v || 0) * exclMult)
      })
    }
    if (eq.affixes) {
      eq.affixes.forEach(a => {
        const adjValue = a.value * exclMult
        if (a.stat && a.valueType === 'percent') {
          bonus['__pct_' + a.stat] = (bonus['__pct_' + a.stat] || 0) + Math.round(adjValue * 1000) / 1000
        } else if (a.stat) {
          bonus[a.stat] = (bonus[a.stat] || 0) + Math.round(adjValue * 1000) / 1000
        }
      })
    }
    // 灵纹词缀（含共鸣加成）：与 affixes 同口径纳入成员最终数值
    if (Array.isArray(eq.runes)) {
      getRuneStats(eq).forEach(rs => {
        const adjValue = rs.value * exclMult
        if (rs.stat && rs.valueType === 'percent') {
          bonus['__pct_' + rs.stat] = (bonus['__pct_' + rs.stat] || 0) + Math.round(adjValue * 1000) / 1000
        } else if (rs.stat) {
          bonus[rs.stat] = (bonus[rs.stat] || 0) + Math.round(adjValue * 1000) / 1000
        }
      })
    }
  })
  return bonus
}

const getMemberPetBonus = (member) => {
  if (!member || !member.equippedPet) return {}
  const pet = member.equippedPet
  const ca = pet.combatAttributes || {}
  const bonus = {}
  // Pet provides flat stat bonuses from its combat attributes
  for (const k of ['attack','health','defense','speed']) {
    if (ca[k]) bonus[k] = (bonus[k] || 0) + ca[k]
  }
  for (const k of ['critRate','comboRate','counterRate','stunRate','dodgeRate','vampireRate']) {
    if (ca[k]) bonus[k] = (bonus[k] || 0) + ca[k]
  }
  for (const k of ['critResist','comboResist','counterResist','stunResist','dodgeResist','vampireResist']) {
    if (ca[k]) bonus[k] = (bonus[k] || 0) + ca[k]
  }
  for (const k of ['healBoost','critDamageBoost','critDamageReduce','finalDamageBoost','finalDamageReduce','combatBoost','resistanceBoost']) {
    if (ca[k]) bonus[k] = (bonus[k] || 0) + ca[k]
  }
  return bonus
}

const getMemberFinalStats = (member) => {
  const base = getMemberBaseStats(member)
  const equipBonus = getMemberEquipBonus(member)
  const petBonus = getMemberPetBonus(member)
  // 灵宠百分比倍率（与 store recomputeAttributes 一致，含品质基础加成保底）
  const petMult = getMemberPetMult(member)
  const final = {}
  const allKeys = new Set([...Object.keys(base), ...Object.keys(equipBonus), ...Object.keys(petBonus)])
  allKeys.forEach(k => {
    if (k.startsWith('__pct_')) return
    const b = base[k] || 0
    const eFlat = equipBonus[k] || 0
    const ePct = equipBonus['__pct_' + k] || 0
    const p = petBonus[k] || 0
    let val = (b + eFlat + p) * (1 + ePct)
    // 四项基础属性额外乘以灵宠百分比倍率（与 player.recomputeAttributes 步骤5 一致）
    if (['attack', 'health', 'defense', 'speed'].includes(k)) {
      val = val * petMult
    }
    final[k] = val
  })
  return final
}

const buildStatRows = (member, keys) => {
  const base = getMemberBaseStats(member)
  const equipBonus = getMemberEquipBonus(member)
  const petBonus = getMemberPetBonus(member)
  const final = getMemberFinalStats(member)
  const petMult = getMemberPetMult(member)
  return keys.map(k => {
    const b = base[k] || 0
    const eFlat = equipBonus[k] || 0
    const ePct = equipBonus['__pct_' + k] || 0
    const p = petBonus[k] || 0
    // 最终值已含灵宠百分比倍率；delta = final - base
    const totalBonus = final[k] - b
    return {
      key: k,
      name: STAT_NAMES[k] || k,
      base: formatStat(k, b),
      delta: isPercentStat(k) ? (totalBonus * 100).toFixed(1) : Math.floor(Math.abs(totalBonus)),
      final: formatStat(k, final[k] || 0)
    }
  })
}

const mainStats = computed(() => {
  if (!selectedMember.value) return []
  // 仅保留纯基础属性，战斗属性（critRate/comboRate/dodgeRate 等）统一在"战斗属性"分组展示，避免重复
  return buildStatRows(selectedMember.value, ['attack','health','defense','speed'])
})

const combatStats = computed(() => {
  if (!selectedMember.value) return []
  return buildStatRows(selectedMember.value, ['critRate','comboRate','counterRate','stunRate','dodgeRate','vampireRate'])
})

const specialStats = computed(() => {
  if (!selectedMember.value) return []
  return buildStatRows(selectedMember.value, ['critResist','comboResist','counterResist','stunResist','dodgeResist','vampireResist','healBoost','critDamageBoost','critDamageReduce','finalDamageBoost','finalDamageReduce','combatBoost','resistanceBoost'])
})

// 计算灵宠百分比加成倍率（使用 store 共享函数 computePetMultiplier，确保面板显示 = 实际生效）
const getMemberPetMult = (member) => {
  if (!member || !member.equippedPet) return 1
  return computePetMultiplier(member.equippedPet)
}

const petBonusStats = computed(() => {
  if (!selectedMember.value || !selectedMember.value.equippedPet) return []
  const petMult = getMemberPetMult(selectedMember.value)
  const totalGrowth = petMult - 1 // 倍率转换为加成百分比
  if (totalGrowth <= 0) return []
  const pet = selectedMember.value.equippedPet
  const petLevel = pet.level || 1
  const petStar = pet.star || 0
  const petRarityName = petRarities[pet.rarity]?.name || pet.rarity || ''
  const pctStr = `${(totalGrowth * 100).toFixed(1)}%`
  const label = `${pctStr} (${petRarityName} Lv.${petLevel} ★${petStar})`
  // 灵宠对四项基础属性提供统一的复利百分比加成（与 Inventory 详情页显示一致）
  return [
    { key: 'attack', name: '攻击', value: label },
    { key: 'health', name: '生命', value: label },
    { key: 'defense', name: '防御', value: label },
    { key: 'speed', name: '速度', value: label }
  ]
})

// 方法
const selectMember = (id) => { selectedMemberId.value = id }

// 详情弹窗状态
const showMemberDetailModal = ref(false)
const detailMember = ref(null)

const memberDetailPosition = ref({ x: 0, y: 0 })

const modalPositionStyle = computed(() => {
  return {
    position: 'relative',
    left: 'auto',
    top: 'auto',
    transform: 'none'
  }
})

const viewMemberDetail = (id, event) => {
  const member = playerStore.sectMembers.find(m => m.id === id)
    || playerStore.benchMembers?.find(m => m.id === id)
    || (playerStore.player && playerStore.player.id === id ? playerStore.player : null)
  detailMember.value = member
  if (event) {
    const rect = event.target.getBoundingClientRect()
    memberDetailPosition.value = {
      x: rect.left,
      y: rect.top
    }
  } else {
    memberDetailPosition.value = { x: 0, y: 0 }
  }
  showMemberDetailModal.value = true
}

const closeMemberDetail = () => {
  showMemberDetailModal.value = false
}

// 详情弹窗内直接强化成员装备（无需脱下）
const handleDetailEnhance = (slot) => {
  if (!detailMember.value?.equippedArtifacts?.[slot]) return
  const equip = detailMember.value.equippedArtifacts[slot]
  const result = playerStore.enhanceMemberEquipment(detailMember.value.id, slot)
  if (result.success) {
    message.success(`强化成功！${equip.name} +${equip.enhanceLevel}`)
  } else {
    message.error(`强化失败：${result.message}`)
  }
}

// ===== 装备详情弹窗（点击触发） =====
// 点击装备槽或"详情"按钮即弹出与背包一致的装备详情页（sect 模式：强化按钮替代出售/分解）
const showEquipDetail = ref(false)
const equipDetailItem = ref(null)
const equipDetailSlot = ref(null)

const openEquipDetail = (slot) => {
  if (!detailMember.value?.equippedArtifacts?.[slot]) return
  equipDetailItem.value = detailMember.value.equippedArtifacts[slot]
  equipDetailSlot.value = slot
  showEquipDetail.value = true
}
const closeEquipDetail = () => {
  showEquipDetail.value = false
  equipDetailItem.value = null
  equipDetailSlot.value = null
}
const onEquipDetailEnhanced = () => {
  // 强化成功后刷新详情弹窗中的装备引用（装备对象是响应式的，此处仅提示）
  if (equipDetailItem.value) {
    message.success(`强化成功！${equipDetailItem.value.name} +${equipDetailItem.value.enhanceLevel}`)
  }
}

// ===== 灵宠详情入口（人物详情页灵宠按钮） =====
// 点击「灵宠详情」打开与背包一致的灵宠详情弹窗（含升级/升星/放生）
const showPetDetail = ref(false)
const petDetailItem = ref(null)
const openDetailPetPortrait = () => {
  if (!detailMember.value?.equippedPet) return
  petDetailItem.value = detailMember.value.equippedPet
  showPetDetail.value = true
}
const closePetDetail = () => {
  showPetDetail.value = false
  petDetailItem.value = null
}

// 立绘查看器：复用抽卡角色立绘大图弹窗
const showPortrait = ref(false)
const portraitCharacter = ref(null)

const openPortrait = () => {
  portraitCharacter.value = selectedMember.value
  showPortrait.value = true
}

const openDetailPortrait = () => {
  portraitCharacter.value = detailMember.value
  showPortrait.value = true
}

const openMemberPortrait = (member) => {
  portraitCharacter.value = member
  showPortrait.value = true
}

const closePortrait = () => {
  showPortrait.value = false
}

// 灵宠立绘弹窗（对称于人物立绘弹窗）：点击灵宠头像/缩略图触发
const showPetPortrait = ref(false)
const portraitPet = ref(null)
const openPetPortrait = (pet) => {
  if (!pet) return
  portraitPet.value = pet
  showPetPortrait.value = true
}
const closePetPortrait = () => { showPetPortrait.value = false }
const onPetSkinChange = ({ pet, skin }) => {
  if (!pet) return
  playerStore.setPetCurrentSkin(pet.id, skin)
}

// 详情弹窗中的属性统计
const detailBaseStats = computed(() => {
  if (!detailMember.value) return []
  const b = detailMember.value.baseStats || {}
  const bt = detailMember.value.breakThrough || 0
  const mult = Math.pow(1.2, bt)
  return [
    { name: '攻击', key: 'attack', base: Math.round((b.attack || 0) / mult), final: b.attack || 0, delta: Math.round((b.attack || 0) - (b.attack || 0) / mult) },
    { name: '生命', key: 'health', base: Math.round((b.health || 0) / mult), final: b.health || 0, delta: Math.round((b.health || 0) - (b.health || 0) / mult) },
    { name: '防御', key: 'defense', base: Math.round((b.defense || 0) / mult), final: b.defense || 0, delta: Math.round((b.defense || 0) - (b.defense || 0) / mult) },
    { name: '速度', key: 'speed', base: Math.round((b.speed || 0) / mult), final: b.speed || 0, delta: Math.round((b.speed || 0) - (b.speed || 0) / mult) }
  ]
})
const detailCombatStats = computed(() => {
  if (!detailMember.value || !detailMember.value.combatAttributes) return []
  const c = detailMember.value.combatAttributes
  return [
    { name: '暴击率', key: 'critRate', base: c.critRate || 0, delta: 0, final: c.critRate || 0 },
    { name: '连击率', key: 'comboRate', base: c.comboRate || 0, delta: 0, final: c.comboRate || 0 },
    { name: '反击率', key: 'counterRate', base: c.counterRate || 0, delta: 0, final: c.counterRate || 0 },
    { name: '眩晕率', key: 'stunRate', base: c.stunRate || 0, delta: 0, final: c.stunRate || 0 },
    { name: '闪避率', key: 'dodgeRate', base: c.dodgeRate || 0, delta: 0, final: c.dodgeRate || 0 },
    { name: '吸血率', key: 'vampireRate', base: c.vampireRate || 0, delta: 0, final: c.vampireRate || 0 }
  ]
})
const detailResistanceStats = computed(() => {
  if (!detailMember.value || !detailMember.value.combatResistance) return []
  const c = detailMember.value.combatResistance
  return [
    { name: '抗暴', key: 'critResist', base: c.critResist || 0, delta: 0, final: c.critResist || 0 },
    { name: '抗连', key: 'comboResist', base: c.comboResist || 0, delta: 0, final: c.comboResist || 0 },
    { name: '抗反击', key: 'counterResist', base: c.counterResist || 0, delta: 0, final: c.counterResist || 0 },
    { name: '抗眩晕', key: 'stunResist', base: c.stunResist || 0, delta: 0, final: c.stunResist || 0 },
    { name: '抗闪避', key: 'dodgeResist', base: c.dodgeResist || 0, delta: 0, final: c.dodgeResist || 0 },
    { name: '抗吸血', key: 'vampireResist', base: c.vampireResist || 0, delta: 0, final: c.vampireResist || 0 }
  ]
})
const detailSpecialStats = computed(() => {
  if (!detailMember.value || !detailMember.value.specialAttributes) return []
  const c = detailMember.value.specialAttributes
  return [
    { name: '治疗效果', key: 'healBoost', base: c.healBoost || 0, delta: 0, final: c.healBoost || 0 },
    { name: '暴伤加成', key: 'critDamageBoost', base: c.critDamageBoost || 0, delta: 0, final: c.critDamageBoost || 0 },
    { name: '暴伤减免', key: 'critDamageReduce', base: c.critDamageReduce || 0, delta: 0, final: c.critDamageReduce || 0 },
    { name: '最终增伤', key: 'finalDamageBoost', base: c.finalDamageBoost || 0, delta: 0, final: c.finalDamageBoost || 0 },
    { name: '最终减伤', key: 'finalDamageReduce', base: c.finalDamageReduce || 0, delta: 0, final: c.finalDamageReduce || 0 },
    { name: '战意', key: 'combatBoost', base: c.combatBoost || 0, delta: 0, final: c.combatBoost || 0 },
    { name: '抗性', key: 'resistanceBoost', base: c.resistanceBoost || 0, delta: 0, final: c.resistanceBoost || 0 }
  ]
})

const detailPetStats = computed(() => {
  if (!detailMember.value || !detailMember.value.equippedPet) return {}
  const pet = detailMember.value.equippedPet
  const ca = pet.combatAttributes || {}
  const stats = {}
  for (const k of ['attack','health','defense','speed']) {
    if (ca[k]) stats[k] = ca[k]
  }
  for (const k of ['critRate','comboRate','counterRate','stunRate','dodgeRate','vampireRate']) {
    if (ca[k]) stats[k] = ca[k]
  }
  for (const k of ['critResist','comboResist','counterResist','stunResist','dodgeResist','vampireResist']) {
    if (ca[k]) stats[k] = ca[k]
  }
  for (const k of ['healBoost','critDamageBoost','critDamageReduce','finalDamageBoost','finalDamageReduce','combatBoost','resistanceBoost']) {
    if (ca[k]) stats[k] = ca[k]
  }
  return stats
})

const percentStatKeys = ['critRate','comboRate','counterRate','stunRate','dodgeRate','vampireRate',
  'critResist','comboResist','counterResist','stunResist','dodgeResist','vampireResist',
  'healBoost','critDamageBoost','critDamageReduce','finalDamageBoost','finalDamageReduce',
  'combatBoost','resistanceBoost']

const formatStatValue = (key, val) => {
  if (percentStatKeys.includes(key)) return (val * 100).toFixed(1) + '%'
  return Math.floor(val)
}

const mergedDetailStats = computed(() => {
  if (!detailMember.value) return []
  const m = detailMember.value
  const b = m.baseStats || {}
  const bt = m.breakThrough || 0
  const mult = Math.pow(1.2, bt)
  const ca = m.combatAttributes || {}
  const cr = m.combatResistance || {}
  const sa = m.specialAttributes || {}
  const petStats = detailPetStats.value || {}
  
  const allStats = []
  
  const baseKeys = ['attack','health','defense','speed']
  baseKeys.forEach(k => {
    const baseVal = Math.round((b[k] || 0) / mult)
    const breakthroughDelta = Math.round((b[k] || 0) - baseVal)
    const petBonus = petStats[k] || 0
    const finalVal = (b[k] || 0) + petBonus
    allStats.push({
      name: { attack: '攻击', health: '生命', defense: '防御', speed: '速度' }[k] || k,
      key: k,
      base: baseVal,
      delta: formatStatValue(k, breakthroughDelta + petBonus),
      final: formatStatValue(k, finalVal)
    })
  })
  
  const combatKeys = ['critRate','comboRate','counterRate','stunRate','dodgeRate','vampireRate']
  combatKeys.forEach(k => {
    const baseVal = ca[k] || 0
    const petBonus = petStats[k] || 0
    const finalVal = baseVal + petBonus
    allStats.push({
      name: { critRate: '暴击率', comboRate: '连击率', counterRate: '反击率', stunRate: '眩晕率', dodgeRate: '闪避率', vampireRate: '吸血率' }[k] || k,
      key: k,
      base: formatStatValue(k, baseVal),
      delta: formatStatValue(k, petBonus),
      final: formatStatValue(k, finalVal)
    })
  })
  
  const resistanceKeys = ['critResist','comboResist','counterResist','stunResist','dodgeResist','vampireResist']
  resistanceKeys.forEach(k => {
    const baseVal = cr[k] || 0
    const petBonus = petStats[k] || 0
    const finalVal = baseVal + petBonus
    allStats.push({
      name: { critResist: '抗暴', comboResist: '抗连', counterResist: '抗反击', stunResist: '抗眩晕', dodgeResist: '抗闪避', vampireResist: '抗吸血' }[k] || k,
      key: k,
      base: formatStatValue(k, baseVal),
      delta: formatStatValue(k, petBonus),
      final: formatStatValue(k, finalVal)
    })
  })
  
  const specialKeys = ['healBoost','critDamageBoost','critDamageReduce','finalDamageBoost','finalDamageReduce','combatBoost','resistanceBoost']
  specialKeys.forEach(k => {
    const baseVal = sa[k] || 0
    const petBonus = petStats[k] || 0
    const finalVal = baseVal + petBonus
    allStats.push({
      name: { healBoost: '治疗效果', critDamageBoost: '暴伤加成', critDamageReduce: '暴伤减免', finalDamageBoost: '最终增伤', finalDamageReduce: '最终减伤', combatBoost: '战意', resistanceBoost: '抗性' }[k] || k,
      key: k,
      base: formatStatValue(k, baseVal),
      delta: formatStatValue(k, petBonus),
      final: formatStatValue(k, finalVal)
    })
  })
  
  return allStats.slice(0, 7)
})
const detailBiography = computed(() => {
  if (!detailMember.value) return null
  const charId = detailMember.value.templateId || detailMember.value.id
  return getCharacterBiography(charId, detailMember.value.breakThrough || 0)
})
// 手动突破（用 1 个灵魂碎片强制突破一次）
const tryManualBreakthrough = () => {
  if (!detailMember.value) return
  if ((detailMember.value.breakThrough || 0) >= 5) {
    message.warning('已突破至最高境界')
    return
  }
  if ((playerStore.characterEssence || 0) < 1) {
    message.error('灵魂碎片不足（需要 1 个）')
    return
  }
  playerStore.characterEssence -= 1
  const r = playerStore.breakThroughCharacter(detailMember.value.id)
  if (r.success) message.success(r.message)
  else message.error(r.message)
}

// ============ 技能装备系统（3 槽位 + 弹窗选择） ============
// 槽位选择弹窗状态
const skillSlotPicker = reactive({
  show: false,
  member: null,
  skill: null
})

// 取该角色所有已学主动技能（被动技能不可装备）
const getActiveSkillsForEquip = (member) => {
  if (!member || !Array.isArray(member.skills)) return []
  return member.skills.filter(s => s.type === 'active')
}

// 取指定槽位上已装备的技能对象
const getEquippedSkillAtSlot = (member, slotIdx) => {
  if (!member || !Array.isArray(member.equippedSkills)) return null
  const skillId = member.equippedSkills[slotIdx]
  if (!skillId) return null
  return (member.skills || []).find(s => s.id === skillId) || null
}

// 判断某个技能是否已装备（任意槽位）
const isSkillEquipped = (member, skillId) => {
  if (!member || !Array.isArray(member.equippedSkills)) return false
  return member.equippedSkills.includes(skillId)
}

// 点击技能后的"装备"按钮：打开槽位选择弹窗
const onEquipBtnClick = (member, skill) => {
  if (!member || !skill) return
  // 若已装备，点击则卸下
  if (isSkillEquipped(member, skill.id)) {
    const slotIdx = member.equippedSkills.indexOf(skill.id)
    if (slotIdx >= 0) {
      const r = playerStore.unequipSkill(member.id, slotIdx)
      if (r.success) message.success(r.message)
      else message.error(r.message)
    }
    return
  }
  // 未装备：弹出槽位选择弹窗
  skillSlotPicker.member = member
  skillSlotPicker.skill = skill
  skillSlotPicker.show = true
}

// 确认装备到指定槽位
const confirmEquipToSlot = (slotIdx) => {
  if (!skillSlotPicker.member || !skillSlotPicker.skill) return
  const r = playerStore.equipSkill(skillSlotPicker.member.id, slotIdx, skillSlotPicker.skill.id)
  if (r.success) message.success(r.message)
  else message.error(r.message)
  closeSkillSlotPicker()
}

// 关闭弹窗
const closeSkillSlotPicker = () => {
  skillSlotPicker.show = false
  skillSlotPicker.member = null
  skillSlotPicker.skill = null
}

// 卸下指定槽位的技能
const onUnequipSkill = (member, slotIdx) => {
  if (!member) return
  const r = playerStore.unequipSkill(member.id, slotIdx)
  if (r.success) message.success(r.message)
  else message.error(r.message)
}
const toggleTeam = (id) => {
  if (isInTeam(id)) {
    playerStore.removeFromTeam(id)
    message.success('已移出队伍')
  } else {
    const result = playerStore.addToTeam(id)
    if (result.success) message.success('已加入队伍')
    else message.error(result.message)
  }
}
const autoEquip = () => {
  if (!selectedMember.value) return
  const result = playerStore.autoEquipCharacter(selectedMember.value.id)
  if (result.success) message.success(result.message)
  else message.error(result.message)
}
const autoUnequip = () => {
  if (!selectedMember.value) return
  const result = playerStore.autoUnequipCharacter(selectedMember.value.id)
  if (result.success) message.success(result.message)
  else message.error(result.message)
}
const openEquipSelect = (slot) => { selectSlot.value = slot; showEquipSelect.value = true }
const closeEquipSelect = () => { showEquipSelect.value = false; selectSlot.value = '' }
const equipItem = (item) => {
  if (!selectedMember.value || !selectSlot.value) return
  const result = playerStore.equipCharacterArtifact(selectedMember.value.id, item, selectSlot.value)
  if (result.success) message.success(result.message)
  else message.error(result.message)
  closeEquipSelect()
}
const unequipSlot = (slot) => {
  if (!selectedMember.value) return
  const result = playerStore.unequipCharacterArtifact(selectedMember.value.id, slot)
  if (result.success) message.success(result.message)
  else message.error(result.message)
}
const equipPet = (pet) => {
  if (!selectedMember.value) return
  const result = playerStore.equipCharacterPet(selectedMember.value.id, pet)
  if (result.success) message.success(result.message)
  else message.error(result.message)
  showPetSelect.value = false
}
const unequipPet = () => {
  if (!selectedMember.value) return
  const result = playerStore.unequipCharacterPet(selectedMember.value.id)
  if (result.success) message.success(result.message)
  else message.error(result.message)
}
const autoPickBestTeam = () => {
  const sorted = [...playerStore.sectMembers].map(m => ({ m, s: getCachedStrength(m) })).sort((a, b) => b.s - a.s).map(x => x.m)
  const best = sorted.slice(0, playerStore.maxTeamSize).map(m => m.id)
  const result = playerStore.setTeamMembers(best)
  if (result.success) message.success(result.message)
  else message.error(result.message)
}

// 初始化：始终选中第一个出战成员
if (teamMembers.value.length > 0) selectedMemberId.value = teamMembers.value[0].id

// 当成员列表变化或未选中时，自动选中第一个出战成员
// 只选择出战成员，避免未出战成员被选中后触发属性面板空渲染
watch(teamMembers, () => {
  if (teamMembers.value.length === 0) return
  if (!selectedMemberId.value || !teamMembers.value.find(m => m.id === selectedMemberId.value)) {
    selectedMemberId.value = teamMembers.value[0].id
  }
}, { immediate: true })
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
  overflow: hidden;
  flex-shrink: 0;
}
.char-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}
.char-info {
  flex: 1;
  min-width: 0;
}
.char-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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
  color: #C9C4BA;
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
.progress-label { color: #C9C4BA; }
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
/* 中低端设备禁用常驻 shimmer 动画 */
html.fx-low .progress-glow,
html.fx-medium .progress-glow { animation: none; }
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.progress-percentage {
  text-align: right;
  font-size: 11px;
  color: #C9C4BA;
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
  color: #F5DEB3;
  font-weight: bold;
}
.attr-block { margin-top: 12px; }
.attr-table-wrap {
  border-radius: 8px;
  overflow: hidden;
}
.attr-table {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.scroll-hint {
  font-size: 11px;
  color: #C9C4BA;
  font-weight: normal;
  margin-left: 6px;
}
.scrollable-table {
  max-height: 260px;
  overflow-y: auto;
  padding-right: 4px;
}

.scrollable-table::-webkit-scrollbar {
  width: 6px;
}

.scrollable-table::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.scrollable-table::-webkit-scrollbar-thumb {
  background: rgba(218, 165, 32, 0.5);
  border-radius: 3px;
}

.scrollable-table::-webkit-scrollbar-thumb:hover {
  background: rgba(218, 165, 32, 0.7);
}

.sticky-head {
  position: sticky;
  top: 0;
  z-index: 2;
  backdrop-filter: blur(8px);
  background: rgba(35, 30, 50, 0.95) !important;
}

.attr-group-title {
  padding: 6px 8px;
  font-size: 12px;
  font-weight: bold;
  color: #DAA520;
  background: rgba(218, 165, 32, 0.08);
  border-radius: 4px;
  margin-top: 4px;
  margin-bottom: 2px;
}

.attr-row {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr 0.9fr 0.9fr;
  align-items: center;
  padding: 5px 8px;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 4px;
  font-size: 12px;
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
.attr-col-delta.is-zero { color: #8b93a8; font-weight: normal; }

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
.resource-label { font-size: 11px; color: #C9C4BA; }
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
.detail-label { color: #C9C4BA; }
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
  color: #C9C4BA;
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
.bonus-label { font-size: 10px; color: #C9C4BA; }
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
  color: #C9C4BA;
}
.rebirth-num {
  color: #FFD700;
  font-weight: bold;
  font-size: 18px;
}

/* ===== 新增样式 ===== */

/* 修为公共池 */
.cultivation-pool {
  padding: 16px;
  border-radius: 12px;
}
.pool-display {
  text-align: center;
  padding: 16px 0;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(218, 165, 32, 0.08));
  border-radius: 10px;
  margin-bottom: 16px;
  border: 1px solid rgba(218, 165, 32, 0.2);
}
.pool-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}
.pool-value {
  font-size: 28px;
  font-weight: bold;
  color: #DAA520;
  text-shadow: 0 0 20px rgba(218, 165, 32, 0.5);
}
.pool-label {
  font-size: 14px;
  color: #C9C4BA;
}
.pool-hint {
  font-size: 12px;
  color: #C9C4BA;
  margin-top: 6px;
}
.allocate-section {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 12px;
}
.allocate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #F5DEB3;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 6px;
}
.current-exp {
  color: #DAA520;
}
.allocate-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.allocate-input {
  flex: 1;
  min-width: 100px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(218, 165, 32, 0.3);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 14px;
  outline: none;
}
.allocate-input:focus {
  border-color: rgba(218, 165, 32, 0.6);
}
.allocate-quick {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.btn-outline {
  background: transparent;
  color: #DAA520;
  border: 1px solid rgba(218, 165, 32, 0.4);
}
.btn-outline:hover {
  background: rgba(218, 165, 32, 0.1);
}

/* 宗门概览 */
.sect-overview {
  padding: 16px;
  border-radius: 12px;
}
.sect-title {
  margin: 0 0 12px;
  font-size: 20px;
  color: #DAA520;
}
.sect-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.sect-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}
.sect-stat-label {
  font-size: 11px;
  color: #C9C4BA;
}
.sect-stat-value {
  font-size: 16px;
  color: #DAA520;
  font-weight: bold;
}

/* 角色选择 */
.member-select {
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.member-select label {
  font-size: 14px;
  color: #F5DEB3;
  white-space: nowrap;
}
.member-select select {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(218, 165, 32, 0.3);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 14px;
  outline: none;
}
.member-select select option,
.member-select select optgroup {
  background: #1a1a2e;
  color: #fff;
}

/* 角色详情补充 */
.char-meta {
  display: flex;
  gap: 8px;
  margin: 4px 0;
  font-size: 13px;
  flex-wrap: wrap;
}
.char-school {
  padding: 2px 8px;
  background: rgba(30, 144, 255, 0.15);
  color: #1E90FF;
  border-radius: 4px;
}
.char-talent {
  padding: 2px 8px;
  background: rgba(153, 50, 204, 0.15);
  color: #9932CC;
  border-radius: 4px;
}
.star-badge {
  color: #FFD700;
  font-size: 14px;
}
.member-desc {
  margin: 12px 0 0;
  font-size: 13px;
  color: #8b93a8;
  line-height: 1.5;
}
.member-team-action {
  margin-top: 12px;
}

/* 装备区域 */
.equip-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.equip-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.equip-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(218, 165, 32, 0.2);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 64px;
  text-align: center;
  background-size: 32px 32px;
  background-repeat: no-repeat;
  background-position: center center;
}
/* 详情弹窗装备网格（含强化按钮） */
.detail-equip-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.detail-equip-slot {
  display: flex;
  flex-direction: column;
  padding: 8px 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(218, 165, 32, 0.2);
  min-height: 70px;
  text-align: center;
}
.detail-equip-slot.empty { border-style: dashed; border-color: rgba(255,255,255,0.1); }
.detail-equip-label { font-size: 11px; color: #C9C4BA; margin-bottom: 4px; }
.detail-equip-content { display: flex; flex-direction: column; gap: 4px; align-items: center; }
.detail-equip-name { font-size: 12px; font-weight: bold; line-height: 1.3; }
.detail-equip-name .enhance-lv { color: #7CFC00; font-size: 11px; }
.detail-equip-empty { font-size: 12px; color: #666; }
.detail-enhance-btn { padding: 2px 12px; font-size: 12px; }
.equip-slot:hover {
  border-color: rgba(218, 165, 32, 0.5);
  background-color: rgba(0, 0, 0, 0.3);
}
.equip-slot.empty {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.1);
}
.equip-slot-label {
  font-size: 11px;
  color: #C9C4BA;
  margin-bottom: 4px;
}
.equip-slot-name {
  font-size: 13px;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
}
.equip-slot-score {
  font-size: 11px;
  color: #d4a017;
  margin-top: 2px;
  text-align: center;
}
.equip-slot-empty {
  font-size: 13px;
  color: #8b93a8;
}

/* 灵宠区域补充 */
.pet-equipped {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid rgba(140, 120, 255, 0.2);
  flex-wrap: wrap;
}
.pet-equipped:hover {
  border-color: rgba(140, 120, 255, 0.5);
}
.pet-thumb {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid rgba(140, 120, 255, 0.5);
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s ease, border-color 0.15s ease;
}
.pet-thumb:hover {
  transform: scale(1.12);
  border-color: rgba(140, 120, 255, 1);
}
.pet-meta {
  font-size: 12px;
  color: #C9C4BA;
}

/* 人物详情弹窗 - 灵宠区（此前该区块所有类名均无 CSS 定义，
   导致灵宠头像以原始尺寸渲染成大图、布局错乱。补齐尺寸约束与布局） */
.detail-pet-section {
  margin-top: 12px;
}
.detail-pet-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(140, 120, 255, 0.25);
  border-radius: 8px;
}
.detail-pet-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(140, 120, 255, 0.5);
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.3);
}
.detail-pet-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-pet-name {
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.detail-pet-sub {
  font-size: 12px;
  color: #C9C4BA;
}
.detail-pet-btn {
  flex-shrink: 0;
}
.detail-pet-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  color: #C9C4BA;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}
.detail-pet-empty-icon {
  font-size: 18px;
}

/* 队伍管理 */
.team-actions {
  margin-bottom: 12px;
}
.bench-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bench-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}
.bench-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B4513, #DAA520);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
}
.bench-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}
.bench-info {
  flex: 1;
  min-width: 0;
}
.bench-name {
  font-size: 14px;
  color: #fff;
  font-weight: bold;
}
.bench-stars {
  color: #FFD700;
  font-size: 12px;
}
.bench-strength {
  font-size: 12px;
  color: #DAA520;
  margin-top: 2px;
}
.bench-empty {
  text-align: center;
  padding: 16px;
  color: #8b93a8;
  font-size: 13px;
}

/* 宗派共鸣面板 */
.resonance-panel {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(218, 165, 32, 0.25);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
}
.resonance-panel.empty {
  border-color: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 10px;
}
.resonance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.resonance-title {
  font-size: 14px;
  font-weight: bold;
  color: #DAA520;
}
.resonance-mult {
  font-size: 12px;
  color: #FFD700;
  background: rgba(218, 165, 32, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
}
.resonance-hint {
  font-size: 12px;
  color: #C9C4BA;
}
.resonance-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.resonance-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}
.resonance-item.uniform {
  border-left: 3px solid #ff6b6b;
}
.resonance-item.combo {
  border-left: 3px solid #4ecdc4;
}
.resonance-name {
  font-weight: bold;
  color: #fff;
  min-width: 80px;
}
.resonance-level {
  color: #DAA520;
  font-size: 11px;
  background: rgba(218, 165, 32, 0.12);
  padding: 1px 6px;
  border-radius: 4px;
}
.resonance-desc {
  color: #F5DEB3;
  flex: 1;
}

.btn-small {
  padding: 6px 10px;
  font-size: 12px;
  min-height: 32px;
  border-radius: 6px;
}

/* 弹窗 */
.equip-select-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.modal-content {
  width: 100%;
  max-width: 400px;
  max-height: 70vh;
  overflow-y: auto;
  padding: 16px;
  border-radius: 12px;
}
.equip-select-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.equip-select-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.equip-select-item:hover {
  background: rgba(0, 0, 0, 0.35);
}
.item-name {
  font-size: 14px;
  font-weight: bold;
}
.item-score {
  font-size: 12px;
  color: #C9A33D;
  font-weight: bold;
  white-space: nowrap;
}
.item-meta {
  font-size: 12px;
  color: #C9C4BA;
}
.equip-select-empty {
  text-align: center;
  padding: 20px;
  color: #8b93a8;
  font-size: 13px;
}

.bench-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  margin-bottom: 6px;
}

.team-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.char-avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.char-avatar-hint {
  font-size: 10px;
  color: #C9C4BA;
}


.sect-member-modal {
  z-index: 100;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
}

.character-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 0;
  z-index: 1000;
  overflow: hidden;
}

.sect-member-modal-content {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  padding: 16px;
  overflow-y: auto;
  border-radius: 16px 16px 0 0;
  background: rgba(15, 20, 25, 0.98);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-bottom: none;
}

/* 桌面端居中显示 */
@media (min-width: 769px) {
  .character-detail-modal {
    align-items: center;
    padding: 16px;
  }
  .sect-member-modal-content {
    width: 95%;
    border-radius: 12px;
    border: 1px solid rgba(218, 165, 32, 0.3);
  }
}

.char-detail-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.char-detail-header .char-avatar.large {
  width: 70px;
  height: 70px;
  flex-shrink: 0;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
}

.char-detail-header .char-avatar.large:hover {
  transform: scale(1.05);
}

.char-detail-header .char-avatar.large .char-avatar-hint {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #F5DEB3;
  white-space: nowrap;
  opacity: 0.85;
  pointer-events: none;
}

.char-detail-header .char-avatar.large:hover .char-avatar-hint {
  color: #ffd700;
  opacity: 1;
}

.char-detail-header .char-info {
  flex: 1;
  min-width: 0;
}

.char-detail-header .char-name {
  font-size: 18px;
}

.char-detail-header .char-meta {
  font-size: 11px;
  gap: 6px;
  flex-wrap: wrap;
}

.char-detail-header .char-talent-info {
  font-size: 11px;
  margin-top: 4px;
  line-height: 1.4;
}

.char-detail-header .char-level {
  font-size: 12px;
  margin-top: 2px;
}

.char-detail-header .char-potential {
  font-size: 12px;
  margin-top: 4px;
  color: #ffd700;
  display: flex;
  gap: 8px;
  align-items: center;
}

.char-detail-header .char-potential .divider {
  color: #C9C4BA;
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid;
}

.skill-item.active {
  border-left-color: #4caf50;
}

.skill-item.passive {
  border-left-color: #2196f3;
}

.skill-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.skill-info {
  flex-shrink: 0;
}

.skill-name {
  font-weight: bold;
  color: #fff;
}

.skill-type {
  font-size: 10px;
  color: #C9C4BA;
  margin-top: 2px;
}

.skill-desc {
  flex: 1;
  font-size: 12px;
  color: #ccc;
  display: flex;
  align-items: center;
}

.skill-unlock-hint {
  font-size: 12px;
  color: #ff9800;
  margin-top: 8px;
  text-align: center;
}

/* 技能装备系统样式 */
.skill-equip-section {
  margin: 10px 0 14px;
  padding: 10px;
  background: rgba(106, 61, 240, 0.06);
  border: 1px solid rgba(142, 68, 255, 0.25);
  border-radius: 8px;
}

.equip-sub-title {
  margin: 0 0 8px;
  font-size: 13px;
  color: #d4c5f9;
  font-weight: bold;
}

.skill-equip-slots {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.skill-equip-slot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  min-height: 34px;
}

.skill-equip-slot.filled {
  background: rgba(76, 175, 80, 0.1);
  border-color: rgba(76, 175, 80, 0.4);
}

.slot-label {
  font-size: 10px;
  color: #8b7fa8;
  flex-shrink: 0;
  width: 28px;
}

.slot-skill-name {
  font-size: 12px;
  color: #fff;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot-empty-text {
  font-size: 11px;
  color: #6b6280;
  flex: 1;
}

.btn-unequip {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.4);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  cursor: pointer;
  line-height: 1;
  flex-shrink: 0;
}

.btn-unequip:hover {
  background: rgba(244, 67, 54, 0.3);
}

/* 技能列表项的装备按钮 */
.btn-equip-toggle {
  background: rgba(142, 68, 255, 0.2);
  color: #d4c5f9;
  border: 1px solid rgba(142, 68, 255, 0.4);
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.btn-equip-toggle:hover {
  background: rgba(142, 68, 255, 0.35);
}

.btn-equip-toggle.equipped {
  background: rgba(76, 175, 80, 0.15);
  color: #66bb6a;
  border-color: rgba(76, 175, 80, 0.4);
}

/* 槽位选择弹窗 */
.skill-slot-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.skill-slot-picker {
  background: #1e1b2e;
  border: 1px solid rgba(142, 68, 255, 0.5);
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: bold;
  color: #d4c5f9;
}

.picker-close {
  background: none;
  border: none;
  color: #8b7fa8;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
}

.picker-skill-name {
  font-size: 13px;
  color: #fff;
  padding: 8px 10px;
  background: rgba(142, 68, 255, 0.1);
  border-radius: 6px;
  margin-bottom: 10px;
}

.picker-slots {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-slot-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.picker-slot-btn:hover {
  background: rgba(142, 68, 255, 0.15);
  border-color: rgba(142, 68, 255, 0.5);
}

.picker-slot-label {
  font-size: 12px;
  color: #d4c5f9;
  font-weight: bold;
}

.picker-slot-current {
  font-size: 11px;
  color: #ccc;
}

.picker-slot-current.empty {
  color: #6b6280;
}

.breakthrough-section {
  margin-top: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.btn-breakthrough {
  background: linear-gradient(135deg, #6a3df0, #8e44ff);
  color: #fff;
  border: 1px solid rgba(142, 68, 255, 0.6);
  box-shadow: 0 2px 10px rgba(142, 68, 255, 0.35);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-breakthrough:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(142, 68, 255, 0.5);
}

.btn-breakthrough:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.breakthrough-max {
  font-size: 14px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  padding: 6px 0;
}

/* 成员选择行布局 */
.member-select-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.member-select-row select {
  flex: 1;
  min-width: 120px;
}

/* 未出战提示 */
.non-team-hint {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 8px;
  font-size: 12px;
  color: #ffa726;
  background: rgba(255, 167, 38, 0.1);
  border: 1px solid rgba(255, 167, 38, 0.3);
  border-radius: 4px;
}

/* 图鉴弹窗 */
.collection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 16px;
}

.collection-modal {
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  background: rgba(15, 20, 25, 0.98);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 12px;
  padding: 16px;
  overflow-y: auto;
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(218, 165, 32, 0.2);
}

.collection-header h3 {
  margin: 0;
  color: #FFD700;
}

.collection-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.collection-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.collection-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B4513, #DAA520);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.collection-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collection-avatar span {
  font-size: 20px;
  color: #fff;
}

.collection-info {
  flex: 1;
  min-width: 0;
}

.collection-name {
  font-weight: bold;
  font-size: 14px;
  color: #fff;
  margin-bottom: 4px;
}

.collection-stars {
  color: #FFD700;
  font-size: 12px;
}

.collection-meta {
  font-size: 12px;
  color: #aaa;
  margin-bottom: 2px;
}

.collection-strength {
  font-size: 12px;
  color: #DAA520;
  cursor: default;
}
.collection-strength.lazy {
  color: #888;
  cursor: pointer;
  text-decoration: underline dashed;
}

.collection-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.collection-empty {
  text-align: center;
  color: #aaa;
  padding: 40px 0;
}

/* 移动端图鉴弹窗适配 */
@media (max-width: 768px) {
  .collection-overlay {
    padding: 8px;
    align-items: flex-end;
  }
  .collection-modal {
    max-height: 92vh;
    border-radius: 12px 12px 0 0;
  }
  .collection-card {
    flex-wrap: wrap;
  }
  .collection-actions {
    width: 100%;
    justify-content: flex-end;
  }
}</style>
