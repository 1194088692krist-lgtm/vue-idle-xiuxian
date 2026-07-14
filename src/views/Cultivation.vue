<template>
  <div class="character-page fade-in-up">
    <!-- 1. 宗门概览 -->
    <div class="sect-overview glass-card">
      <h2 class="sect-title">宗门</h2>
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
          <span class="sect-stat-label">人精华</span>
          <span class="sect-stat-value">{{ playerStore.characterEssence }}</span>
        </div>
      </div>
    </div>

    <!-- 2. 角色选择区 -->
    <div class="member-select glass-card">
      <label>选择角色</label>
      <select v-model="selectedMemberId" @change="selectMember(selectedMemberId)">
        <optgroup v-if="teamMembers.length" label="出战队伍">
          <option v-for="m in teamMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
        </optgroup>
        <optgroup label="宗门成员">
          <option v-for="m in allMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
        </optgroup>
      </select>
    </div>

    <!-- 3. 选中角色详情面板 -->
    <div v-if="selectedMember" class="char-card glass-card">
      <div class="char-header">
        <div class="char-avatar">
          <img v-if="getCharacterAvatar(selectedMember)" :src="getCharacterAvatar(selectedMember)" />
          <span v-else>{{ selectedMember.name?.[0] || '仙' }}</span>
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
        <h4 class="sub-title">属性面板</h4>
        <div class="attr-table">
          <div class="attr-row attr-head">
            <span class="attr-col-label">属性</span>
            <span class="attr-col-base">基础</span>
            <span class="attr-col-delta">加成</span>
            <span class="attr-col-final">最终</span>
          </div>
          <div v-for="stat in mainStats" :key="stat.key" class="attr-row">
            <span class="attr-col-label">{{ stat.name }}</span>
            <span class="attr-col-base">{{ stat.base }}</span>
            <span class="attr-col-delta" :class="{ 'is-zero': stat.delta === 0 }">+{{ stat.delta }}</span>
            <span class="attr-col-final">{{ stat.final }}</span>
          </div>
        </div>
        <div class="attr-table" style="margin-top:10px">
          <div class="attr-row attr-head">
            <span class="attr-col-label">战斗属性</span>
            <span class="attr-col-base">基础</span>
            <span class="attr-col-delta">加成</span>
            <span class="attr-col-final">最终</span>
          </div>
          <div v-for="stat in combatStats" :key="stat.key" class="attr-row">
            <span class="attr-col-label">{{ stat.name }}</span>
            <span class="attr-col-base">{{ stat.base }}</span>
            <span class="attr-col-delta" :class="{ 'is-zero': stat.delta === 0 }">+{{ stat.delta }}</span>
            <span class="attr-col-final">{{ stat.final }}</span>
          </div>
        </div>
        <div class="attr-table" style="margin-top:10px">
          <div class="attr-row attr-head">
            <span class="attr-col-label">特殊属性</span>
            <span class="attr-col-base">基础</span>
            <span class="attr-col-delta">加成</span>
            <span class="attr-col-final">最终</span>
          </div>
          <div v-for="stat in specialStats" :key="stat.key" class="attr-row">
            <span class="attr-col-label">{{ stat.name }}</span>
            <span class="attr-col-base">{{ stat.base }}</span>
            <span class="attr-col-delta" :class="{ 'is-zero': stat.delta === 0 }">+{{ stat.delta }}</span>
            <span class="attr-col-final">{{ stat.final }}</span>
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
          {{ isInTeam(selectedMember.id) ? '移出队伍' : '加入队伍' }}
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
          :class="{ empty: !selectedMember.equippedArtifacts?.[slot] }"
          @click="selectedMember.equippedArtifacts?.[slot] ? unequipSlot(slot) : openEquipSelect(slot)"
        >
          <div class="equip-slot-label">{{ slotNames[slot] }}</div>
          <div
            v-if="selectedMember.equippedArtifacts?.[slot]"
            class="equip-slot-name"
            :style="{ color: getItemColor(selectedMember.equippedArtifacts[slot]) }"
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
      <h4 class="sub-title">未出战成员</h4>
      <div v-if="benchMembers.length" class="bench-list">
        <div class="bench-pagination">
          <button class="btn btn-small" :disabled="benchPage <= 1" @click="benchPage--">上一页</button>
          <span class="page-info">{{ benchPage }} / {{ totalBenchPages }}</span>
          <button class="btn btn-small" :disabled="benchPage >= totalBenchPages" @click="benchPage++">下一页</button>
        </div>
        <div v-for="m in pagedBenchMembers" :key="m.id" class="bench-card">
          <div class="bench-avatar">
            <img v-if="getCharacterAvatar(m)" :src="getCharacterAvatar(m)" />
            <span v-else>{{ m.name?.[0] || '仙' }}</span>
          </div>
          <div class="bench-info">
            <div class="bench-name">{{ m.name }} <span class="bench-stars">{{ '★'.repeat(m.star || 1) }}</span></div>
            <div class="bench-strength">战力 {{ playerStore.getCharacterBuildStrength(m) }}</div>
          </div>
          <button class="btn btn-info btn-small" @click="viewMemberDetail(m.id)">详情</button>
          <button class="btn btn-success btn-small" @click="toggleTeam(m.id)">加入</button>
        </div>
      </div>
      <div v-else class="bench-empty">所有成员均已出战</div>
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
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { characterSchools, characterTalents, starConfig, getCharacterAvatar } from '../plugins/characters'
import { petRarities } from '../plugins/gacha'

const playerStore = usePlayerStore()
const message = useMessage()

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
const benchMembers = computed(() => playerStore.sectMembers.filter(m => !playerStore.teamMembers.includes(m.id)))
const totalBenchPages = computed(() => Math.max(1, Math.ceil(benchMembers.value.length / benchPageSize)))
const pagedBenchMembers = computed(() => {
  const start = (benchPage.value - 1) * benchPageSize
  return benchMembers.value.slice(start, start + benchPageSize)
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
  // Main stats
  for (const k of ['attack','health','defense','speed']) {
    stats[k] = (bs[k] || 0) + (ts[k] || 0)
  }
  // Combat stats
  for (const k of ['critRate','comboRate','counterRate','stunRate','dodgeRate','vampireRate',
    'critResist','comboResist','counterResist','stunResist','dodgeResist','vampireResist',
    'healBoost','critDamageBoost','critDamageReduce','finalDamageBoost','finalDamageReduce',
    'combatBoost','resistanceBoost']) {
    stats[k] = (bs[k] || 0) + (ts[k] || 0)
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

// 方法
const selectMember = (id) => { selectedMemberId.value = id }
const viewMemberDetail = (id) => {
  selectedMemberId.value = id
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

/* ===== 新增样式 ===== */

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
</style>
