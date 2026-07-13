<template>
  <div class="gm-tools">
    <div class="tools-header">
      <h2>资源管理工具</h2>
      <div class="tools-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="tools-content">
      <!-- 数值调整面板 -->
      <div v-if="activeTab === 'values'" class="panel">
        <div class="panel-section">
          <h3>修炼数值</h3>
          <div class="value-grid">
            <div class="value-item">
              <label>基础修炼消耗</label>
              <input type="number" v-model.number="gameValues.baseCultivationCost" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>消耗增长倍率</label>
              <input type="number" step="0.1" v-model.number="gameValues.cultivationCostMultiplier" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>基础修炼获得</label>
              <input type="number" v-model.number="gameValues.baseCultivationGain" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>获得增长倍率</label>
              <input type="number" step="0.1" v-model.number="gameValues.cultivationGainMultiplier" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>灵力获取速率</label>
              <input type="number" v-model.number="gameValues.spiritGainRate" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>境界突破倍率</label>
              <input type="number" step="0.1" v-model.number="gameValues.breakthroughMultiplier" @change="saveValues" />
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h3>战斗数值</h3>
          <div class="value-grid">
            <div class="value-item">
              <label>基础攻击</label>
              <input type="number" v-model.number="gameValues.baseAttack" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>基础生命</label>
              <input type="number" v-model.number="gameValues.baseHealth" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>基础防御</label>
              <input type="number" v-model.number="gameValues.baseDefense" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>基础速度</label>
              <input type="number" v-model.number="gameValues.baseSpeed" @change="saveValues" />
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h3>抽奖数值</h3>
          <div class="value-grid">
            <div class="value-item">
              <label>综合池价格</label>
              <input type="number" v-model.number="gameValues.gachaNormalCost" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>装备池价格</label>
              <input type="number" v-model.number="gameValues.gachaEquipmentCost" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>灵宠池价格</label>
              <input type="number" v-model.number="gameValues.gachaPetCost" @change="saveValues" />
            </div>
          </div>
        </div>

        <div class="panel-actions">
          <button class="btn-primary" @click="exportValues">导出配置</button>
          <button class="btn-secondary" @click="importValues">导入配置</button>
          <button class="btn-danger" @click="resetValues">重置默认</button>
        </div>
      </div>

      <!-- 装备编辑器 -->
      <div v-if="activeTab === 'equipment'" class="panel">
        <div class="editor-header">
          <button class="btn-add" @click="addEquipment">+ 新装备</button>
          <select v-model="equipmentFilter" class="filter-select">
            <option value="all">全部品质</option>
            <option value="common">凡品</option>
            <option value="uncommon">精品</option>
            <option value="rare">稀有</option>
            <option value="epic">史诗</option>
            <option value="legendary">传说</option>
            <option value="mythic">神话</option>
          </select>
        </div>
        <div class="equipment-list">
          <div 
            v-for="(eq, index) in filteredEquipment" 
            :key="eq.id"
            class="equipment-card"
            :class="eq.quality"
            @click="editEquipment(eq)"
          >
            <div class="eq-icon">{{ eq.type === 'weapon' ? '⚔️' : eq.type === 'body' ? '👕' : '💎' }}</div>
            <div class="eq-info">
              <div class="eq-name">{{ eq.name }}</div>
              <div class="eq-type">{{ getEquipmentTypeName(eq.type) }}</div>
            </div>
            <button class="btn-delete" @click.stop="deleteEquipment(index)">×</button>
          </div>
        </div>

        <!-- 装备编辑弹窗 -->
        <div v-if="editingEquipment" class="edit-modal">
          <div class="modal-content">
            <h3>编辑装备</h3>
            <div class="form-grid">
              <div class="form-item">
                <label>名称</label>
                <input type="text" v-model="editingEquipment.name" />
              </div>
              <div class="form-item">
                <label>类型</label>
                <select v-model="editingEquipment.type">
                  <option value="weapon">武器</option>
                  <option value="head">头部</option>
                  <option value="body">衣服</option>
                  <option value="legs">裤子</option>
                  <option value="feet">鞋子</option>
                  <option value="shoulder">肩甲</option>
                  <option value="accessory">饰品</option>
                </select>
              </div>
              <div class="form-item">
                <label>品质</label>
                <select v-model="editingEquipment.quality">
                  <option value="common">凡品</option>
                  <option value="uncommon">精品</option>
                  <option value="rare">稀有</option>
                  <option value="epic">史诗</option>
                  <option value="legendary">传说</option>
                  <option value="mythic">神话</option>
                </select>
              </div>
              <div class="form-item">
                <label>等级要求</label>
                <input type="number" v-model.number="editingEquipment.levelReq" />
              </div>
              <div class="form-item full">
                <label>攻击加成</label>
                <input type="number" v-model.number="editingEquipment.attackBonus" />
              </div>
              <div class="form-item full">
                <label>生命加成</label>
                <input type="number" v-model.number="editingEquipment.healthBonus" />
              </div>
              <div class="form-item full">
                <label>防御加成</label>
                <input type="number" v-model.number="editingEquipment.defenseBonus" />
              </div>
              <div class="form-item full">
                <label>速度加成</label>
                <input type="number" v-model.number="editingEquipment.speedBonus" />
              </div>
              <div class="form-item full">
                <label>图片路径</label>
                <input type="text" v-model="editingEquipment.image" placeholder="assets/equipment/xxx.png" />
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" @click="saveEquipment">保存</button>
              <button class="btn-secondary" @click="editingEquipment = null">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 灵宠编辑器 -->
      <div v-if="activeTab === 'pets'" class="panel">
        <div class="editor-header">
          <button class="btn-add" @click="addPet">+ 新灵宠</button>
          <select v-model="petFilter" class="filter-select">
            <option value="all">全部稀有度</option>
            <option value="mortal">凡品</option>
            <option value="spiritual">灵品</option>
            <option value="mystic">玄品</option>
            <option value="celestial">仙品</option>
            <option value="divine">神品</option>
          </select>
        </div>
        <div class="pet-list">
          <div 
            v-for="(pet, index) in filteredPets" 
            :key="pet.id"
            class="pet-card"
            :class="pet.rarity"
            @click="editPet(pet)"
          >
            <div class="pet-icon">🐾</div>
            <div class="pet-info">
              <div class="pet-name">{{ pet.name }}</div>
              <div class="pet-rarity">{{ getPetRarityName(pet.rarity) }}</div>
            </div>
            <button class="btn-delete" @click.stop="deletePet(index)">×</button>
          </div>
        </div>

        <!-- 灵宠编辑弹窗 -->
        <div v-if="editingPet" class="edit-modal">
          <div class="modal-content">
            <h3>编辑灵宠</h3>
            <div class="form-grid">
              <div class="form-item">
                <label>名称</label>
                <input type="text" v-model="editingPet.name" />
              </div>
              <div class="form-item">
                <label>稀有度</label>
                <select v-model="editingPet.rarity">
                  <option value="mortal">凡品</option>
                  <option value="spiritual">灵品</option>
                  <option value="mystic">玄品</option>
                  <option value="celestial">仙品</option>
                  <option value="divine">神品</option>
                </select>
              </div>
              <div class="form-item full">
                <label>攻击加成 (%)</label>
                <input type="number" v-model.number="editingPet.attackBonus" />
              </div>
              <div class="form-item full">
                <label>生命加成 (%)</label>
                <input type="number" v-model.number="editingPet.healthBonus" />
              </div>
              <div class="form-item full">
                <label>修炼加速 (%)</label>
                <input type="number" v-model.number="editingPet.cultivationSpeed" />
              </div>
              <div class="form-item full">
                <label>灵力加成 (%)</label>
                <input type="number" v-model.number="editingPet.spiritBonus" />
              </div>
              <div class="form-item full">
                <label>技能描述</label>
                <textarea v-model="editingPet.skillDesc"></textarea>
              </div>
              <div class="form-item full">
                <label>图片路径</label>
                <input type="text" v-model="editingPet.image" placeholder="assets/pets/xxx.png" />
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" @click="savePet">保存</button>
              <button class="btn-secondary" @click="editingPet = null">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 怪物编辑器 -->
      <div v-if="activeTab === 'monsters'" class="panel">
        <div class="editor-header">
          <button class="btn-add" @click="addMonster">+ 新怪物</button>
          <select v-model="monsterFilter" class="filter-select">
            <option value="all">全部难度</option>
            <option value="easy">简单</option>
            <option value="normal">普通</option>
            <option value="hard">困难</option>
            <option value="boss">Boss</option>
          </select>
        </div>
        <div class="monster-list">
          <div 
            v-for="(monster, index) in filteredMonsters" 
            :key="monster.id"
            class="monster-card"
            :class="monster.difficulty"
            @click="editMonster(monster)"
          >
            <div class="monster-icon">👹</div>
            <div class="monster-info">
              <div class="monster-name">{{ monster.name }}</div>
              <div class="monster-level">Lv.{{ monster.level }}</div>
            </div>
            <button class="btn-delete" @click.stop="deleteMonster(index)">×</button>
          </div>
        </div>

        <!-- 怪物编辑弹窗 -->
        <div v-if="editingMonster" class="edit-modal">
          <div class="modal-content">
            <h3>编辑怪物</h3>
            <div class="form-grid">
              <div class="form-item">
                <label>名称</label>
                <input type="text" v-model="editingMonster.name" />
              </div>
              <div class="form-item">
                <label>等级</label>
                <input type="number" v-model.number="editingMonster.level" />
              </div>
              <div class="form-item">
                <label>难度</label>
                <select v-model="editingMonster.difficulty">
                  <option value="easy">简单</option>
                  <option value="normal">普通</option>
                  <option value="hard">困难</option>
                  <option value="boss">Boss</option>
                </select>
              </div>
              <div class="form-item full">
                <label>攻击</label>
                <input type="number" v-model.number="editingMonster.attack" />
              </div>
              <div class="form-item full">
                <label>生命</label>
                <input type="number" v-model.number="editingMonster.health" />
              </div>
              <div class="form-item full">
                <label>防御</label>
                <input type="number" v-model.number="editingMonster.defense" />
              </div>
              <div class="form-item full">
                <label>灵石奖励</label>
                <input type="number" v-model.number="editingMonster.stoneReward" />
              </div>
              <div class="form-item full">
                <label>经验奖励</label>
                <input type="number" v-model.number="editingMonster.expReward" />
              </div>
              <div class="form-item full">
                <label>掉落装备ID</label>
                <input type="text" v-model="editingMonster.dropEquipmentId" placeholder="装备ID,留空无掉落" />
              </div>
              <div class="form-item full">
                <label>图片路径</label>
                <input type="text" v-model="editingMonster.image" placeholder="assets/monsters/xxx.png" />
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" @click="saveMonster">保存</button>
              <button class="btn-secondary" @click="editingMonster = null">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 素材管理面板 -->
      <div v-if="activeTab === 'assets'" class="panel">
        <div class="assets-upload">
          <h3>素材上传</h3>
          <div class="upload-area">
            <div class="upload-zone" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
              <input type="file" ref="fileInput" @change="handleFileSelect" multiple accept="image/*,audio/*" hidden />
              <div class="upload-icon">📁</div>
              <p>点击或拖拽上传图片/音频</p>
              <p class="upload-hint">支持 PNG, JPG, MP3, WAV</p>
            </div>
          </div>
        </div>

        <div class="assets-preview">
          <h3>已上传素材</h3>
          <div class="assets-tabs">
            <button :class="{ active: assetType === 'images' }" @click="assetType = 'images'">图片</button>
            <button :class="{ active: assetType === 'audio' }" @click="assetType = 'audio'">音频</button>
          </div>
          <div class="assets-grid">
            <div v-for="asset in filteredAssets" :key="asset.name" class="asset-item">
              <img v-if="asset.type === 'image'" :src="asset.url" class="asset-thumb" />
              <div v-else class="audio-thumb">
                <span>🎵</span>
                <audio :src="asset.url" controls></audio>
              </div>
              <div class="asset-name">{{ asset.name }}</div>
              <button class="btn-delete" @click="deleteAsset(asset.name)">×</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePlayerStore } from '../stores/player'

const playerStore = usePlayerStore()
const activeTab = ref('values')
const tabs = [
  { key: 'values', label: '数值调整' },
  { key: 'equipment', label: '装备编辑' },
  { key: 'pets', label: '灵宠编辑' },
  { key: 'monsters', label: '怪物编辑' },
  { key: 'assets', label: '素材管理' }
]

// 默认游戏数值
const defaultValues = {
  baseCultivationCost: 10,
  cultivationCostMultiplier: 1.5,
  baseCultivationGain: 1,
  cultivationGainMultiplier: 1.2,
  spiritGainRate: 1,
  breakthroughMultiplier: 1.1,
  baseAttack: 10,
  baseHealth: 100,
  baseDefense: 5,
  baseSpeed: 10,
  gachaNormalCost: 100,
  gachaEquipmentCost: 150,
  gachaPetCost: 200
}

const gameValues = ref({ ...defaultValues })

// 装备数据
const equipmentList = ref([])
const equipmentFilter = ref('all')
const editingEquipment = ref(null)

const filteredEquipment = computed(() => {
  if (equipmentFilter.value === 'all') return equipmentList.value
  return equipmentList.value.filter(eq => eq.quality === equipmentFilter.value)
})

const getEquipmentTypeName = (type) => {
  const names = {
    weapon: '武器',
    head: '头部',
    body: '衣服',
    legs: '裤子',
    feet: '鞋子',
    shoulder: '肩甲',
    accessory: '饰品'
  }
  return names[type] || type
}

const addEquipment = () => {
  editingEquipment.value = {
    id: `eq_${Date.now()}`,
    name: '新装备',
    type: 'weapon',
    quality: 'common',
    levelReq: 1,
    attackBonus: 0,
    healthBonus: 0,
    defenseBonus: 0,
    speedBonus: 0,
    image: ''
  }
}

const editEquipment = (eq) => {
  editingEquipment.value = { ...eq }
}

const saveEquipment = () => {
  const index = equipmentList.value.findIndex(eq => eq.id === editingEquipment.value.id)
  if (index >= 0) {
    equipmentList.value[index] = { ...editingEquipment.value }
  } else {
    equipmentList.value.push({ ...editingEquipment.value })
  }
  editingEquipment.value = null
  saveToStorage()
}

const deleteEquipment = (index) => {
  equipmentList.value.splice(index, 1)
  saveToStorage()
}

// 灵宠数据
const petList = ref([])
const petFilter = ref('all')
const editingPet = ref(null)

const filteredPets = computed(() => {
  if (petFilter.value === 'all') return petList.value
  return petList.value.filter(pet => pet.rarity === petFilter.value)
})

const getPetRarityName = (rarity) => {
  const names = {
    mortal: '凡品',
    spiritual: '灵品',
    mystic: '玄品',
    celestial: '仙品',
    divine: '神品'
  }
  return names[rarity] || rarity
}

const addPet = () => {
  editingPet.value = {
    id: `pet_${Date.now()}`,
    name: '新灵宠',
    rarity: 'mortal',
    attackBonus: 0,
    healthBonus: 0,
    cultivationSpeed: 0,
    spiritBonus: 0,
    skillDesc: '',
    image: ''
  }
}

const editPet = (pet) => {
  editingPet.value = { ...pet }
}

const savePet = () => {
  const index = petList.value.findIndex(pet => pet.id === editingPet.value.id)
  if (index >= 0) {
    petList.value[index] = { ...editingPet.value }
  } else {
    petList.value.push({ ...editingPet.value })
  }
  editingPet.value = null
  saveToStorage()
}

const deletePet = (index) => {
  petList.value.splice(index, 1)
  saveToStorage()
}

// 怪物数据
const monsterList = ref([])
const monsterFilter = ref('all')
const editingMonster = ref(null)

const filteredMonsters = computed(() => {
  if (monsterFilter.value === 'all') return monsterList.value
  return monsterList.value.filter(m => m.difficulty === monsterFilter.value)
})

const addMonster = () => {
  editingMonster.value = {
    id: `monster_${Date.now()}`,
    name: '新怪物',
    level: 1,
    difficulty: 'normal',
    attack: 10,
    health: 100,
    defense: 5,
    stoneReward: 10,
    expReward: 5,
    dropEquipmentId: '',
    image: ''
  }
}

const editMonster = (monster) => {
  editingMonster.value = { ...monster }
}

const saveMonster = () => {
  const index = monsterList.value.findIndex(m => m.id === editingMonster.value.id)
  if (index >= 0) {
    monsterList.value[index] = { ...editingMonster.value }
  } else {
    monsterList.value.push({ ...editingMonster.value })
  }
  editingMonster.value = null
  saveToStorage()
}

const deleteMonster = (index) => {
  monsterList.value.splice(index, 1)
  saveToStorage()
}

// 素材管理
const fileInput = ref(null)
const assetType = ref('images')
const assetsList = ref([])

const filteredAssets = computed(() => {
  return assetsList.value.filter(a => 
    assetType.value === 'images' ? a.type === 'image' : a.type === 'audio'
  )
})

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e) => {
  const files = e.target.files
  processFiles(files)
}

const handleDrop = (e) => {
  const files = e.dataTransfer.files
  processFiles(files)
}

const processFiles = (files) => {
  for (const file of files) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const type = file.type.startsWith('image') ? 'image' : 'audio'
      assetsList.value.push({
        name: file.name,
        type,
        url: e.target.result,
        data: e.target.result
      })
      saveToStorage()
    }
    reader.readAsDataURL(file)
  }
}

const deleteAsset = (name) => {
  const index = assetsList.value.findIndex(a => a.name === name)
  if (index >= 0) {
    assetsList.value.splice(index, 1)
    saveToStorage()
  }
}

// 数值操作
const saveValues = () => {
  localStorage.setItem('gm_gameValues', JSON.stringify(gameValues.value))
}

const exportValues = () => {
  const data = JSON.stringify(gameValues.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'game-values.json'
  a.click()
}

const importValues = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        gameValues.value = JSON.parse(e.target.result)
        saveValues()
      } catch (err) {
        alert('导入失败：无效的JSON文件')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

const resetValues = () => {
  if (confirm('确定要重置所有数值为默认值吗？')) {
    gameValues.value = { ...defaultValues }
    saveValues()
  }
}

// 本地存储
const saveToStorage = () => {
  localStorage.setItem('gm_equipment', JSON.stringify(equipmentList.value))
  localStorage.setItem('gm_pets', JSON.stringify(petList.value))
  localStorage.setItem('gm_monsters', JSON.stringify(monsterList.value))
  localStorage.setItem('gm_assets', JSON.stringify(assetsList.value))
}

const loadFromStorage = () => {
  try {
    const values = localStorage.getItem('gm_gameValues')
    if (values) gameValues.value = JSON.parse(values)

    const equipment = localStorage.getItem('gm_equipment')
    if (equipment) equipmentList.value = JSON.parse(equipment)

    const pets = localStorage.getItem('gm_pets')
    if (pets) petList.value = JSON.parse(pets)

    const monsters = localStorage.getItem('gm_monsters')
    if (monsters) monsterList.value = JSON.parse(monsters)

    const assets = localStorage.getItem('gm_assets')
    if (assets) assetsList.value = JSON.parse(assets)
  } catch (err) {
    console.error('加载配置失败:', err)
  }
}

onMounted(() => {
  loadFromStorage()
})
</script>

<style scoped>
.gm-tools {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.tools-header {
  margin-bottom: 20px;
}

.tools-header h2 {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 24px;
  color: #FFD700;
  margin-bottom: 15px;
}

.tools-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 8px;
  color: #8B8B8B;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: rgba(218, 165, 32, 0.1);
}

.tab-btn.active {
  background: rgba(218, 165, 32, 0.2);
  border-color: #DAA520;
  color: #FFD700;
}

.panel {
  background: rgba(20, 25, 30, 0.8);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(218, 165, 32, 0.2);
}

.panel-section {
  margin-bottom: 25px;
}

.panel-section h3 {
  font-size: 16px;
  color: #DAA520;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(218, 165, 32, 0.2);
}

.value-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.value-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.value-item label {
  font-size: 12px;
  color: #8B8B8B;
}

.value-item input {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 6px;
  color: #F5DEB3;
  font-size: 14px;
}

.value-item input:focus {
  outline: none;
  border-color: #DAA520;
}

.panel-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #DAA520, #FFD700);
  color: #0D0D12;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #F5DEB3;
  border: 1px solid rgba(218, 165, 32, 0.3);
}

.btn-danger {
  background: rgba(255, 99, 71, 0.2);
  color: #FF6347;
  border: 1px solid rgba(255, 99, 71, 0.3);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-add {
  padding: 10px 20px;
  background: rgba(50, 205, 50, 0.2);
  border: 1px solid rgba(50, 205, 50, 0.3);
  border-radius: 8px;
  color: #32CD32;
  cursor: pointer;
}

.filter-select {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 6px;
  color: #F5DEB3;
}

.equipment-list,
.pet-list,
.monster-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.equipment-card,
.pet-card,
.monster-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.equipment-card:hover,
.pet-card:hover,
.monster-card:hover {
  background: rgba(218, 165, 32, 0.1);
  border-color: rgba(218, 165, 32, 0.3);
}

.eq-icon,
.pet-icon,
.monster-icon {
  font-size: 24px;
}

.eq-info,
.pet-info,
.monster-info {
  flex: 1;
}

.eq-name,
.pet-name,
.monster-name {
  font-size: 14px;
  color: #F5DEB3;
  font-weight: bold;
}

.eq-type,
.pet-rarity,
.monster-level {
  font-size: 12px;
  color: #8B8B8B;
}

.btn-delete {
  width: 24px;
  height: 24px;
  background: rgba(255, 99, 71, 0.2);
  border: none;
  border-radius: 50%;
  color: #FF6347;
  cursor: pointer;
  font-size: 14px;
}

.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(20, 25, 30, 0.95);
  border-radius: 16px;
  padding: 25px;
  max-width: 500px;
  width: 90%;
  border: 1px solid rgba(218, 165, 32, 0.3);
}

.modal-content h3 {
  font-size: 18px;
  color: #FFD700;
  margin-bottom: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-item.full {
  grid-column: span 2;
}

.form-item label {
  font-size: 12px;
  color: #8B8B8B;
}

.form-item input,
.form-item select,
.form-item textarea {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 6px;
  color: #F5DEB3;
  font-size: 14px;
}

.form-item textarea {
  min-height: 60px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}

.assets-upload {
  margin-bottom: 30px;
}

.assets-upload h3 {
  font-size: 16px;
  color: #DAA520;
  margin-bottom: 15px;
}

.upload-zone {
  padding: 40px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px dashed rgba(218, 165, 32, 0.3);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-zone:hover {
  border-color: #DAA520;
  background: rgba(218, 165, 32, 0.05);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.upload-zone p {
  color: #8B8B8B;
  margin-bottom: 5px;
}

.upload-hint {
  font-size: 12px;
  color: #555;
}

.assets-preview h3 {
  font-size: 16px;
  color: #DAA520;
  margin-bottom: 15px;
}

.assets-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.assets-tabs button {
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 6px;
  color: #8B8B8B;
  cursor: pointer;
}

.assets-tabs button.active {
  background: rgba(218, 165, 32, 0.2);
  color: #FFD700;
}

.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.asset-item {
  position: relative;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  text-align: center;
}

.asset-thumb {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.audio-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.audio-thumb span {
  font-size: 32px;
}

.audio-thumb audio {
  width: 100%;
  height: 30px;
}

.asset-name {
  font-size: 12px;
  color: #8B8B8B;
  margin-top: 5px;
  word-break: break-all;
}

.asset-item .btn-delete {
  position: absolute;
  top: 5px;
  right: 5px;
}

@media (max-width: 600px) {
  .value-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-item.full {
    grid-column: span 1;
  }
}
</style>