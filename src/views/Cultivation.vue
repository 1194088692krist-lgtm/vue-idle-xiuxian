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
          <span class="sect-stat-value">{{ totalStrength }}</span>
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
            :max="Math.min(playerStore.getCultivationPool(), 999999)"
            placeholder="输入修为数量"
            class="allocate-input"
          />
          <button class="btn btn-small btn-primary" @click="allocateQuick(100)">+100</button>
          <button class="btn btn-small btn-primary" @click="allocateQuick(1000)">+1000</button>
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
      <select v-model="selectedMemberId" @change="selectMember(selectedMemberId)">
        <option v-for="m in sortedMembers" :key="m.id" :value="m.id">
          {{ isInTeam(m.id) ? '[出战] ' : '' }}{{ m.name }}
        </option>
      </select>
    </div>

    <!-- 3. 选中角色详情面板 -->
    <div v-if="selectedMember" class="char-card glass-card">
      <div class="char-header">
        <div class="char-avatar-container">
          <div class="char-avatar" @click="openAvatarViewer">
            <img v-if="getCharacterAvatar(selectedMember)" :src="getCharacterAvatar(selectedMember)" />
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
            <span class="build-value">{{ playerStore.getCharacterBuildStrength(selectedMember) }}</span>
          </div>
        </div>
      </div>

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

    <!-- 4. 装备区域 -->
    <div v-if="selectedMember" class="stats-card glass-card">
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
          <div v-else class="equip-slot-empty">空</div>
        </div>
      </div>
    </div>

    <!-- 5. 灵宠区域 -->
    <div v-if="selectedMember" class="pet-card glass-card">
      <h3 class="section-title">灵宠</h3>
      <div v-if="selectedMember.equippedPet" class="pet-equipped" @click="unequipPet">
        <span class="pet-name" :style="{ color: getPetColor(selectedMember.equippedPet) }">{{ selectedMember.equippedPet.name }}</span>
        <span class="pet-meta">Lv.{{ selectedMember.equippedPet.level }} {{ selectedMember.equippedPet.rarity || '' }}</span>
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
      </div>
      <div v-if="allMembers.length" class="bench-list">
        <div class="bench-pagination">
          <button class="btn btn-small" :disabled="benchPage <= 1" @click="benchPage--">上一页</button>
          <span class="page-info">{{ benchPage }} / {{ totalBenchPages }}</span>
          <button class="btn btn-small" :disabled="benchPage >= totalBenchPages" @click="benchPage++">下一页</button>
        </div>
        <div v-for="m in pagedSortedMembers" :key="m.id" class="bench-card">
          <div class="bench-avatar">
            <img v-if="getCharacterAvatar(m)" :src="getCharacterAvatar(m)" />
            <span v-else>{{ m.name?.[0] || '仙' }}</span>
          </div>
          <div class="bench-info">
            <div class="bench-name">{{ isInTeam(m.id) ? '[出战] ' : '' }}{{ m.name }} <span class="bench-stars">{{ '★'.repeat(m.star || 1) }}</span></div>
            <div class="bench-strength">战力 {{ playerStore.getCharacterBuildStrength(m) }}</div>
          </div>
          <button class="btn btn-info btn-small" @click="viewMemberDetail(m.id, $event)">详情</button>
          <button
            class="btn btn-small"
            :class="isInTeam(m.id) ? 'btn-warning' : 'btn-success'"
            @click="toggleTeam(m.id)"
          >
            {{ isInTeam(m.id) ? '退出' : '加入' }}
          </button>
        </div>
      </div>
      <div v-else class="bench-empty">暂无成员</div>
    </div>

    <!-- 人物详情弹窗（独立弹窗，不再切换顶部面板） -->
    <div v-if="showMemberDetailModal && detailMember" class="equip-select-modal character-detail-modal" @click.self="closeMemberDetail">
      <div class="modal-content glass-card character-detail-content sect-member-modal-content" @click.stop :style="modalPositionStyle">
        <div class="char-detail-header">
          <div class="char-avatar large">
            <img v-if="getCharacterAvatar(detailMember)" :src="getCharacterAvatar(detailMember)" />
            <span v-else>{{ detailMember.name?.[0] || '仙' }}</span>
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
            <div class="char-level">Lv.{{ detailMember.level }} · 战力 {{ playerStore.getCharacterBuildStrength(detailMember) }}</div>
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
          <div class="skill-list">
            <div v-for="skill in detailMember.skills" :key="skill.id" class="skill-item" :class="skill.type">
              <div class="skill-icon">{{ getSkillCategoryIcon(skill.category) }}</div>
              <div class="skill-info">
                <div class="skill-name">{{ skill.name }}</div>
                <div class="skill-type">{{ getSkillTypeName(skill.type) }}</div>
              </div>
              <div class="skill-desc">{{ skill.description }}</div>
            </div>
          </div>
          <div v-if="detailMember.breakThrough < 5" class="skill-unlock-hint">
            ⚡ 每突破一次可获得 2 个新技能
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

    <!-- 立绘查看器弹窗 -->
    <div v-if="showAvatarViewer" class="equip-select-modal avatar-viewer-modal" @click.self="closeAvatarViewer">
      <div class="modal-content glass-card avatar-viewer-content" @click.stop>
        <button class="btn btn-warning btn-close" @click="closeAvatarViewer">关闭</button>
        <div class="avatar-viewer-title">{{ avatarViewerMember?.name || '' }} - 立绘</div>
        <div class="avatar-viewer-image">
          <img v-if="avatarViewerMember && getCharacterAvatar(avatarViewerMember)" :src="getCharacterAvatar(avatarViewerMember)" />
          <div v-else class="avatar-viewer-placeholder">暂无立绘</div>
        </div>
      </div>
    </div>

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
            <span class="item-meta">{{ item.level ? 'Lv.' + item.level : '' }}</span>
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
  </div>
</template>

<script setup>
import { usePlayerStore } from '../stores/player'
import { ref, computed, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { characterSchools, characterTalents, starConfig, getCharacterAvatar, characterList } from '../plugins/characters'
import { getSkillCategoryIcon, getSkillTypeName } from '../plugins/skills'
import { petRarities } from '../plugins/gacha'
import { getCharacterBiography } from '../plugins/characterBiographies'
import { calculateLevelExp } from '../plugins/cultivationSystem'

const playerStore = usePlayerStore()
const message = useMessage()

const allocateAmount = ref(100)

const formatNumber = num => {
  if (!num) return 0
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿'
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  return Math.floor(num).toLocaleString()
}

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
const benchPage = ref(1)
const benchPageSize = 10

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
const totalBenchPages = computed(() => Math.max(1, Math.ceil(sortedMembers.value.length / benchPageSize)))
const pagedSortedMembers = computed(() => {
  const start = (benchPage.value - 1) * benchPageSize
  return sortedMembers.value.slice(start, start + benchPageSize)
})

const sectSize = computed(() => playerStore.sectMembers?.length || 0)
const sectMax = computed(() => playerStore.maxSectSize || 0)
const teamSize = computed(() => playerStore.teamMembers?.length || 0)
const teamMax = computed(() => playerStore.maxTeamSize || 0)
const totalStrength = computed(() => teamMembers.value.reduce((sum, m) => sum + (playerStore.getCharacterBuildStrength(m) || 0), 0))

// 槽位中文映射
const slotNames = { weapon:'武器', head:'头部', body:'衣服', legs:'裤子', feet:'鞋子', shoulder:'肩甲', hands:'手套', wrist:'护腕', necklace:'项链', ring1:'戒指1', ring2:'戒指2', belt:'腰带' }
const slots = Object.keys(slotNames)

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

const availableItemsForSlot = computed(() => {
  if (!selectSlot.value) return []
  return (playerStore.items || []).filter(item => {
    if (item.equipped) return false
    if (item.slot === selectSlot.value || item.type === selectSlot.value) return true
    return false
  })
})

const availablePets = computed(() => {
  return (playerStore.items || []).filter(item => item.type === 'pet')
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
  
  for (const k of ['attack','health','defense','speed']) {
    let base = bs[k] || templateBase[k] || 0
    if (base <= 0) {
      const defaultBase = { attack: 10, health: 100, defense: 5, speed: 10 }
      base = defaultBase[k] || 0
    }
    const talentBonus = ts[k] || 0
    stats[k] = Math.floor(base * (1 + talentBonus))
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
    if (eq.stats) {
      Object.entries(eq.stats).forEach(([k, v]) => {
        bonus[k] = (bonus[k] || 0) + (v || 0)
      })
    }
    if (eq.affixes) {
      eq.affixes.forEach(a => {
        if (a.stat && a.valueType === 'percent') {
          bonus['__pct_' + a.stat] = (bonus['__pct_' + a.stat] || 0) + a.value
        } else if (a.stat) {
          bonus[a.stat] = (bonus[a.stat] || 0) + a.value
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
  const final = {}
  const allKeys = new Set([...Object.keys(base), ...Object.keys(equipBonus), ...Object.keys(petBonus)])
  allKeys.forEach(k => {
    if (k.startsWith('__pct_')) return
    const b = base[k] || 0
    const eFlat = equipBonus[k] || 0
    const ePct = equipBonus['__pct_' + k] || 0
    const p = petBonus[k] || 0
    final[k] = (b + eFlat + p) * (1 + ePct)
  })
  return final
}

const buildStatRows = (member, keys) => {
  const base = getMemberBaseStats(member)
  const equipBonus = getMemberEquipBonus(member)
  const petBonus = getMemberPetBonus(member)
  const final = getMemberFinalStats(member)
  return keys.map(k => {
    const b = base[k] || 0
    const eFlat = equipBonus[k] || 0
    const ePct = equipBonus['__pct_' + k] || 0
    const p = petBonus[k] || 0
    const totalBonus = (b + eFlat + p) * (1 + ePct) - b
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
  return buildStatRows(selectedMember.value, ['attack','health','defense','speed','critRate','comboRate','dodgeRate'])
})

const combatStats = computed(() => {
  if (!selectedMember.value) return []
  return buildStatRows(selectedMember.value, ['critRate','comboRate','counterRate','stunRate','dodgeRate','vampireRate'])
})

const specialStats = computed(() => {
  if (!selectedMember.value) return []
  return buildStatRows(selectedMember.value, ['critResist','comboResist','counterResist','stunResist','dodgeResist','vampireResist','healBoost','critDamageBoost','critDamageReduce','finalDamageBoost','finalDamageReduce','combatBoost','resistanceBoost'])
})

const petBonusStats = computed(() => {
  if (!selectedMember.value) return []
  const petBonus = getMemberPetBonus(selectedMember.value)
  const stats = []
  for (const k of ['attack','health','defense','speed','critRate','comboRate','counterRate','stunRate','dodgeRate','vampireRate','critResist','comboResist','counterResist','stunResist','dodgeResist','vampireResist','healBoost','critDamageBoost','critDamageReduce','finalDamageBoost','finalDamageReduce','combatBoost','resistanceBoost']) {
    if (petBonus[k]) {
      stats.push({
        key: k,
        name: STAT_NAMES[k] || k,
        value: isPercentStat(k) ? (petBonus[k] * 100).toFixed(1) + '%' : Math.floor(petBonus[k])
      })
    }
  }
  return stats
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

// 立绘查看器状态
const showAvatarViewer = ref(false)
const avatarViewerMember = ref(null)

const openAvatarViewer = () => {
  avatarViewerMember.value = selectedMember.value
  showAvatarViewer.value = true
}

const closeAvatarViewer = () => {
  showAvatarViewer.value = false
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
const isInTeam = (id) => playerStore.teamMembers.includes(id)
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
  const sorted = [...playerStore.sectMembers].sort((a, b) => playerStore.getCharacterBuildStrength(b) - playerStore.getCharacterBuildStrength(a))
  const best = sorted.slice(0, playerStore.maxTeamSize).map(m => m.id)
  const result = playerStore.setTeamMembers(best)
  if (result.success) message.success(result.message)
  else message.error(result.message)
}

// 初始化
if (teamMembers.value.length > 0) selectedMemberId.value = teamMembers.value[0].id
else if (allMembers.value.length > 0) selectedMemberId.value = allMembers.value[0].id

// 当成员列表变化或未选中时，自动选中第一个成员，确保属性面板/装备区域/一键装备始终显示
watch([allMembers, teamMembers], () => {
  if (!selectedMemberId.value || !allMembers.value.find(m => m.id === selectedMemberId.value)) {
    if (teamMembers.value.length > 0) selectedMemberId.value = teamMembers.value[0].id
    else if (allMembers.value.length > 0) selectedMemberId.value = allMembers.value[0].id
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
  color: #888;
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
  color: #888;
}
.pool-hint {
  font-size: 12px;
  color: #666;
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
  color: #aaa;
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
  color: #888;
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
  color: #aaa;
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
}
.equip-slot:hover {
  border-color: rgba(218, 165, 32, 0.5);
  background: rgba(0, 0, 0, 0.3);
}
.equip-slot.empty {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.1);
}
.equip-slot-label {
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
}
.equip-slot-name {
  font-size: 13px;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
}
.equip-slot-empty {
  font-size: 13px;
  color: #5a6378;
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
.pet-meta {
  font-size: 12px;
  color: #888;
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
  color: #5a6378;
  font-size: 13px;
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
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  padding-bottom: 80px;
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
  display: flex;
  flex-direction: column;
  gap: 6px;
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
.item-meta {
  font-size: 12px;
  color: #888;
}
.equip-select-empty {
  text-align: center;
  padding: 20px;
  color: #5a6378;
  font-size: 13px;
}

.bench-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.page-info {
  color: #aaa;
  font-size: 13px;
  min-width: 60px;
  text-align: center;
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
.char-avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.char-avatar-hint {
  font-size: 10px;
  color: #9e9e9e;
}

.avatar-viewer-modal {
  z-index: 100;
  align-items: flex-start !important;
  padding-top: 250px !important;
}

.avatar-viewer-content {
  max-width: 80%;
  max-height: 80vh;
  padding: 20px;
}

.avatar-viewer-title {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #fff;
}

.avatar-viewer-image {
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 60vh;
}

.avatar-viewer-image img {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.avatar-viewer-placeholder {
  font-size: 24px;
  color: #9e9e9e;
  padding: 40px;
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
  padding-bottom: 20px;
}

.sect-member-modal-content {
  width: 95%;
  max-width: 400px;
  max-height: 80vh;
  padding: 16px;
  overflow-y: auto;
  border-radius: 12px;
  background: rgba(15, 20, 25, 0.98);
  border: 1px solid rgba(218, 165, 32, 0.3);
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
  color: #9e9e9e;
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
</style>
