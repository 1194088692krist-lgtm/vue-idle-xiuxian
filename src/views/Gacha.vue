<template>
  <div class="gacha-page fade-in-up">
    <div class="main-card glass-card">
      <div class="card-header">
        <div class="header-icon">
          <GiftOutlined />
        </div>
        <div class="header-info">
          <h2 class="card-title gold-gradient-text">仙缘祈福</h2>
          <p class="card-subtitle">消耗幻灵结晶祈求仙缘，获得人物、武器、法宝与灵宠</p>
        </div>
      </div>
      <div class="card-body">
        <div v-if="!playerStore.beginnerRewardClaimed" class="beginner-reward-box">
          <div class="beginner-reward-info">
            <div class="beginner-reward-icon">🎁</div>
            <div class="beginner-reward-text">
              <div class="beginner-reward-title">新手福利</div>
              <div class="beginner-reward-desc">新修士专属，领取 20,000 幻灵结晶 + 10,000 灵石开启修仙之旅！</div>
            </div>
          </div>
          <button class="btn btn-beginner" @click="claimBeginnerReward">
            领取福利
          </button>
        </div>

        <div class="tips-box">
          <InfoCircleOutlined />
          <span>装备需通过挂机获得，抽卡可获取人物、武器、法宝和灵宠。</span>
        </div>

        <div class="pool-selector">
          <div
            v-for="pool in poolList"
            :key="pool.key"
            class="pool-card"
            :class="{ active: currentPool === pool.key }"
            @click="switchPool(pool.key)"
          >
            <div class="pool-name">{{ pool.name }}</div>
            <div class="pool-cost">{{ pool.cost }} 幻灵结晶/次</div>
            <div class="pool-desc">{{ pool.desc }}</div>
          </div>
        </div>

        <div class="gacha-actions">
          <div class="spirit-stone-display">
            <span class="label">当前幻灵结晶：</span>
            <span class="value">{{ formatNumber(playerStore.phantomCrystals) }}</span>
          </div>
          <div class="action-buttons">
            <button
              class="btn btn-primary"
              :class="{ disabled: playerStore.phantomCrystals < currentPoolConfig.cost }"
              @click="doSingleGacha"
            >
              <span>单抽（{{ currentPoolConfig.cost }}幻灵结晶）</span>
            </button>
            <button
              class="btn btn-success"
              :class="{ disabled: playerStore.phantomCrystals < currentPoolConfig.cost * 9 }"
              @click="doTenGacha"
            >
              <span>九连（{{ currentPoolConfig.cost * 9 }}幻灵结晶）</span>
            </button>
          </div>
        </div>

        <div class="crystal-exchange">
          <div class="exchange-info">
            <span class="label">灵石 → 幻灵结晶</span>
            <span class="rate">50 灵石 = 1 幻灵结晶</span>
          </div>
          <div class="exchange-actions">
            <button class="btn btn-info" :disabled="playerStore.spiritStones < 500" @click="exchangeCrystals(10)">兑换10</button>
            <button class="btn btn-info" :disabled="playerStore.spiritStones < 2500" @click="exchangeCrystals(50)">兑换50</button>
            <button class="btn btn-info" :disabled="playerStore.spiritStones < 5000" @click="exchangeCrystals(100)">兑换100</button>
            <button class="btn btn-info" :disabled="playerStore.spiritStones < 50000" @click="exchangeCrystals(1000)">兑换1000</button>
          </div>
        </div>

        <div class="crystal-exchange beast-core-exchange">
          <div class="exchange-info">
            <span class="label">妖兽核 → 幻灵结晶</span>
            <span class="rate">1 妖兽核 = 5 幻灵结晶（持有 {{ beastCoreCount }} 个）</span>
          </div>
          <div class="exchange-actions">
            <button class="btn btn-info" :disabled="beastCoreCount < 1" @click="exchangeBeastCore(1)">兑换1</button>
            <button class="btn btn-info" :disabled="beastCoreCount < 10" @click="exchangeBeastCore(10)">兑换10</button>
            <button class="btn btn-info" :disabled="beastCoreCount < 100" @click="exchangeBeastCore(100)">兑换100</button>
            <button class="btn btn-info" :disabled="beastCoreCount < 1" @click="exchangeBeastCoreAll">全部</button>
          </div>
        </div>

        <div v-if="gachaResults.length > 0" class="gacha-results">
          <h3 class="section-title">祈福结果</h3>
          <div class="results-grid">
            <div
              v-for="(result, index) in gachaResults"
              :key="index"
              class="result-card"
              :class="getResultClass(result)"
              @click="showCharacterDetail(result)"
            >
              <div v-if="result.category === 'character' && getCharacterAvatar(result.item)" class="result-avatar" :class="result.item.star >= 5 ? 'star-5-glow' : (result.item.star >= 4 ? 'star-4-glow' : '')">
                <img :src="getCharacterThumbnail(result.item)" :alt="result.item.name" loading="lazy" decoding="async" />
              </div>
              <div class="result-type" :style="{ color: getResultColor(result) }">
                {{ getResultTypeName(result) }}
              </div>
              <div class="result-name" :style="{ color: getResultColor(result) }">
                {{ result.item.name || getResultTypeName(result) }}
              </div>
              <div class="result-detail">
                <template v-if="result.category === 'character'">
                  <div class="star-rating">
                    <span v-for="i in result.item.star" :key="i" class="star">★</span>
                  </div>
                  <span>{{ characterSchools[result.item.school]?.name || '' }}</span>
                </template>
                <template v-else-if="result.category === 'artifact' || result.category === 'equipment'">
                  <span>{{ result.category === 'artifact' || result.item.slot === 'artifact' ? '法宝' : '武器' }}</span>
                  <span>{{ result.item.qualityInfo?.name || '' }}</span>
                  <div v-if="result.item.setId" class="result-set" :style="{ color: getSetColor(result.item.setId) }">
                    {{ getSetName(result.item.setId) }}
                  </div>
                  <div v-if="result.item.affixes && result.item.affixes.length" class="result-affixes">
                    <span
                      v-for="a in result.item.affixes"
                      :key="a.id"
                      class="result-affix"
                      :class="'affix-tier-' + a.tier"
                    >{{ a.name }}</span>
                  </div>
                </template>
                <template v-else-if="result.category === 'pet'">
                  <span>{{ petRarities[result.item.rarity]?.name || '' }}</span>
                </template>
                <template v-else>
                  <span>+{{ result.item.amount }}</span>
                  <span>{{ resourceNames[result.item.type] || '资源' }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="log-section">
          <div class="log-header">
            <h3 class="section-title gold-gradient-text">祈福日志</h3>
            <button class="btn btn-small btn-danger" @click="clearLogPanel">清空</button>
          </div>
          <log-panel ref="logRef" />
        </div>
      </div>
    </div>

    <CharacterPortraitModal v-if="showCharModal" :character="selectedCharacter" @close="closeCharModal" />

    <!-- 祈福物品详情弹窗（装备/法宝/灵宠） -->
    <div v-if="showGachaItemDetail" class="simple-modal" @click.self="closeGachaItemDetail">
      <div class="simple-modal-content">
        <div class="modal-header">
          <h3>{{ selectedGachaItem?.name || '物品详情' }}</h3>
          <button class="btn-small" @click="closeGachaItemDetail">关闭</button>
        </div>
        <div v-if="selectedGachaItem" class="modal-body">
          <!-- 装备 / 法宝 -->
          <template v-if="isGachaItemEquipment(selectedGachaItem)">
            <div class="detail-row">
              <span>品质</span>
              <span class="simple-tag" :style="{ color: gachaQualityInfo(selectedGachaItem).color }">
                {{ gachaQualityInfo(selectedGachaItem).name }}
              </span>
            </div>
            <div class="detail-row">
              <span>类型</span><span>{{ gachaEquipmentType(selectedGachaItem) }}</span>
            </div>
            <div class="detail-row">
              <span>强化等级</span><span>+{{ selectedGachaItem.enhanceLevel || 0 }}</span>
            </div>
            <div class="detail-row">
              <span>装备评分</span><span class="equipment-score">{{ calculateEquipmentScore(selectedGachaItem) }}</span>
            </div>
            <div v-if="selectedGachaItem.setId" class="detail-row">
              <span>套装</span>
              <span class="set-tag" :style="{ color: gachaSetInfo(selectedGachaItem.setId)?.color }">
                {{ gachaSetInfo(selectedGachaItem.setId)?.name }}
              </span>
            </div>
            <div class="simple-divider">基础属性</div>
            <div v-for="(value, stat) in selectedGachaItem.stats" :key="stat" class="detail-row">
              <span>{{ getStatName(stat) }}</span><span>{{ formatStatValue(stat, value) }}</span>
            </div>
            <div v-if="selectedGachaItem.affixes && selectedGachaItem.affixes.length > 0" class="affixes-section">
              <div class="simple-divider">词条</div>
              <div v-for="affix in selectedGachaItem.affixes" :key="affix.id" class="affix-row">
                <span class="affix-name" :class="'affix-tier-' + affix.tier">{{ affix.name }}</span>
                <span>{{ getStatName(affix.stat) }} {{ affix.valueType === 'percent' ? '+' + (affix.value * 100).toFixed(1) + '%' : '+' + affix.value }}</span>
              </div>
            </div>
            <div v-if="selectedGachaItem.setId" class="set-bonus-section">
              <div class="simple-divider">套装效果</div>
              <div v-for="(bonus, idx) in gachaSetBonuses(selectedGachaItem.setId)" :key="idx" class="set-bonus-row">
                <span>{{ bonus.label }}</span>
              </div>
            </div>
          </template>

          <!-- 灵宠 -->
          <template v-else>
            <div class="detail-row">
              <span>品质</span>
              <span class="simple-tag" :style="{ color: petRarities[selectedGachaItem.rarity]?.color }">
                {{ petRarities[selectedGachaItem.rarity]?.name }}
              </span>
            </div>
            <div class="detail-row">
              <span>等级</span><span>{{ selectedGachaItem.level || 1 }}</span>
            </div>
            <div class="detail-row">
              <span>星级</span><span>{{ selectedGachaItem.star || 0 }}</span>
            </div>
            <div v-if="selectedGachaItem.description" class="pet-desc">
              {{ selectedGachaItem.description }}
            </div>
            <div class="simple-divider">战斗属性</div>
            <div v-for="(value, stat) in selectedGachaItem.combatAttributes" :key="stat" class="detail-row">
              <span>{{ getStatName(stat) }}</span><span>{{ formatStatValue(stat, value) }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { usePlayerStore } from '../stores/player'
  import { ref, computed } from 'vue'
  import { useMessage } from 'naive-ui'
  import { GiftOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
  import { getStatName, formatStatValue } from '../plugins/stats'
  import { formatNumber } from '../utils/formatNumber.js'
  import {
    gachaPools,
    doGacha,
    doMultiGacha,
    doMultiGachaWithPity,
    equipmentTypeNames,
    petRarities,
    equipmentQualities
  } from '../plugins/gacha'
  import { setBonuses, calculateEquipmentScore, rarityConfig } from '../plugins/buildSystem'
  import LogPanel from '../components/LogPanel.vue'
  import CharacterPortraitModal from '../components/CharacterPortraitModal.vue'
  import { characterSchools, characterTalents, characterRoles, getCharacterAvatar, getCharacterThumbnail } from '../plugins/characters'

  const playerStore = usePlayerStore()
  const message = useMessage()
  const logRef = ref(null)

  const currentPool = ref('all')
  const gachaResults = ref([])
  const showCharModal = ref(false)
  const selectedCharacter = ref(null)
  const selectedGachaItem = ref(null)
  const showGachaItemDetail = ref(false)

  const poolList = computed(() => [
    { key: 'all', name: '综合池', cost: gachaPools.all.cost, desc: '人物/武器/法宝/灵宠/资源' },
    { key: 'equipment', name: '装备池', cost: gachaPools.equipment.cost, desc: '武器/法宝为主' },
    { key: 'pet', name: '灵宠池', cost: gachaPools.pet.cost, desc: '灵宠为主' },
    { key: 'character', name: '人物池', cost: gachaPools.character.cost, desc: '人物为主' }
  ])

  const currentPoolConfig = computed(() => gachaPools[currentPool.value])

  const resourceNames = {
    spirit_stone: '灵石',
    reinforce_stone: '强化石',
    refinement_stone: '洗练石',
    pet_essence: '灵宠精华'
  }

  // 新手福利领取：20,000 幻灵结晶 + 10,000 灵石
  const claimBeginnerReward = () => {
    if (playerStore.beginnerRewardClaimed) return
    playerStore.phantomCrystals += 20000
    playerStore.spiritStones += 10000
    playerStore.beginnerRewardClaimed = true
    showMessage('success', '恭喜领取新手福利！获得 20,000 幻灵结晶 + 10,000 灵石！')
    playerStore.queueSave()
  }

  const switchPool = key => {
    currentPool.value = key
    gachaResults.value = []
  }

  const showMessage = (type, content) => {
    logRef.value?.addLog(type, content)
  }

  // 发放奖励
  const grantReward = (result) => {
    const { category, item } = result
    if (category === 'character') {
      const addResult = playerStore.addSectMember(item)
      if (addResult.success) {
        showMessage('success', addResult.message)
      } else {
        showMessage('warning', addResult.message)
      }
    } else if (category === 'artifact' || category === 'equipment') {
      playerStore.items.push(item)
    } else if (category === 'pet') {
      playerStore.items.push(item)
    } else if (category === 'resource') {
      switch (item.type) {
        case 'spirit_stone':
          playerStore.spiritStones += item.amount
          break
        case 'reinforce_stone':
          playerStore.reinforceStones += item.amount
          break
        case 'refinement_stone':
          playerStore.refinementStones += item.amount
          break
        case 'pet_essence':
          playerStore.petEssence += item.amount
          break
      }
    }
  }

  // 格式化奖励名
  const getRewardName = (result) => {
    const { category, item } = result
    if (category === 'character') return `${item.star}星人物·${item.name}`
    if (category === 'equipment') return item.name
    if (category === 'pet') return item.name
    return `${resourceNames[item.type] || '资源'}+${item.amount}`
  }

  // 单抽
  const doSingleGacha = () => {
    const cost = currentPoolConfig.value.cost
    if (playerStore.phantomCrystals < cost) {
      showMessage('error', '幻灵结晶不足！')
      return
    }
    playerStore.phantomCrystals -= cost
    // 人物池/综合池：传入持久化保底计数
    const isCharPool = currentPool.value === 'character' || currentPool.value === 'all'
    const pityState = isCharPool
      ? { fiveStarPity: playerStore.gachaFiveStarPity, fourStarPity: playerStore.gachaFourStarPity }
      : null
    const result = doGacha(currentPool.value, playerStore.level, pityState)
    if (!result) return
    // 同步回 store
    if (isCharPool && pityState) {
      playerStore.gachaFiveStarPity = pityState.fiveStarPity
      playerStore.gachaFourStarPity = pityState.fourStarPity
    }
    grantReward(result)
    gachaResults.value = [result]
    showMessage('success', `祈福获得：${getRewardName(result)}`)
    // 抽到4星/5星人物自动弹出立绘
    if (result.category === 'character' && result.item.star >= 4) {
      selectedCharacter.value = result.item
      showCharModal.value = true
    }
    playerStore.queueSave()
    playerStore.saveToCurrentSlot().catch(err => console.error('抽奖后自动存档失败:', err))
  }

  // 九连
  const doTenGacha = () => {
    const cost = currentPoolConfig.value.cost * 9
    if (playerStore.phantomCrystals < cost) {
      showMessage('error', '幻灵结晶不足！')
      return
    }
    playerStore.phantomCrystals -= cost
    // 人物池/综合池：传入持久化保底计数（跨调用累计）
    const isCharPool = currentPool.value === 'character' || currentPool.value === 'all'
    const pityState = isCharPool
      ? { fiveStarPity: playerStore.gachaFiveStarPity, fourStarPity: playerStore.gachaFourStarPity }
      : null
    const fn = isCharPool ? doMultiGachaWithPity : doMultiGacha
    const results = fn(currentPool.value, 9, playerStore.level, pityState)
    // 同步回 store
    if (isCharPool && pityState) {
      playerStore.gachaFiveStarPity = pityState.fiveStarPity
      playerStore.gachaFourStarPity = pityState.fourStarPity
    }
    results.forEach(r => grantReward(r))
    gachaResults.value = results
    const summary = {}
    results.forEach(r => {
      const key = r.category === 'resource' ? r.item.type : r.category
      if (!summary[key]) summary[key] = 0
      summary[key]++
    })
    const parts = []
    if (summary.character) parts.push(`人物×${summary.character}`)
    if (summary.equipment) parts.push(`装备×${summary.equipment}`)
    if (summary.pet) parts.push(`灵宠×${summary.pet}`)
    if (summary.spirit_stone) parts.push(`灵石奖励×${summary.spirit_stone}`)
    if (summary.reinforce_stone) parts.push(`强化石奖励×${summary.reinforce_stone}`)
    if (summary.refinement_stone) parts.push(`洗练石奖励×${summary.refinement_stone}`)
    if (summary.pet_essence) parts.push(`灵宠精华奖励×${summary.pet_essence}`)
    // 提示保底进度
    let pityHint = ''
    if (isCharPool) {
      const fp = playerStore.gachaFiveStarPity
      const fhp = playerStore.gachaFourStarPity
      if (fp >= 40) pityHint = `（五星保底${50 - fp}抽）`
      else if (fhp >= 3) pityHint = `（四星保底${5 - fhp}抽）`
    }
    showMessage('success', `九连祈福完成：${parts.join('，')}${pityHint}`)
    // 十连中抽到4星/5星人物自动弹出立绘（取最高星级）
    const bestChar = results
      .filter(r => r.category === 'character' && r.item.star >= 4)
      .sort((a, b) => b.item.star - a.item.star)[0]
    if (bestChar) {
      selectedCharacter.value = bestChar.item
      showCharModal.value = true
    }
    playerStore.queueSave()
    playerStore.saveToCurrentSlot().catch(err => console.error('抽奖后自动存档失败:', err))
  }

  // 显示人物详情弹窗
  const showCharacterDetail = (result) => {
    if (result.category === 'character') {
      selectedCharacter.value = result.item
      showCharModal.value = true
    } else if (result.category === 'equipment' || result.category === 'artifact' || result.category === 'pet') {
      selectedGachaItem.value = result.item
      showGachaItemDetail.value = true
    }
  }

  // 关闭人物详情弹窗
  const closeCharModal = () => {
    showCharModal.value = false
    selectedCharacter.value = null
  }

  // 关闭祈福物品详情弹窗
  const closeGachaItemDetail = () => {
    showGachaItemDetail.value = false
    selectedGachaItem.value = null
  }

  // 判断当前选中的祈福物品是否为装备/法宝
  const isGachaItemEquipment = (item) => {
    if (!item) return false
    return item.type !== 'pet'
  }

  // 装备品质信息（兼容 qualityInfo 缺失的情况）
  const gachaQualityInfo = (item) => {
    if (item && item.qualityInfo && item.qualityInfo.name) return item.qualityInfo
    const cfg = rarityConfig[item?.quality]
    if (cfg) return { name: cfg.name, color: cfg.color }
    return { name: item?.quality || '未知', color: '#999' }
  }

  // 装备类型名称
  const gachaEquipmentType = (item) => {
    const slot = item?.slot || item?.type
    return equipmentTypeNames[slot] || slot || '装备'
  }

  // 套装信息
  const gachaSetInfo = (setId) => setBonuses.find(s => s.id === setId)
  const gachaSetBonuses = (setId) => {
    const setData = setBonuses.find(s => s.id === setId)
    if (!setData) return []
    const bonuses = []
    if (setData.bonus2) bonuses.push(setData.bonus2)
    if (setData.bonus3) bonuses.push(setData.bonus3)
    if (setData.bonus4) bonuses.push(setData.bonus4)
    if (setData.bonus5) bonuses.push(setData.bonus5)
    return bonuses
  }

  // 幻灵结晶兑换
  const exchangeCrystals = (amount) => {
    const result = playerStore.exchangeCrystals(amount)
    if (result.success) showMessage('success', result.message)
    else showMessage('error', result.message)
  }

  // 妖兽核数量（响应式：随 materials 自动更新）
  const beastCoreCount = computed(() => playerStore.countMaterial('core', 'beast_core'))

  // 妖兽核 → 幻灵结晶（1 = 5）
  const exchangeBeastCore = (amount) => {
    const result = playerStore.exchangeBeastCoreForCrystals(amount)
    if (result.success) showMessage('success', result.message)
    else showMessage('error', result.message)
  }
  const exchangeBeastCoreAll = () => {
    const all = beastCoreCount.value
    if (all <= 0) {
      showMessage('error', '妖兽核不足')
      return
    }
    exchangeBeastCore(all)
  }

  const clearLogPanel = () => {
    logRef.value?.clearLogs()
  }

  // 结果卡片样式
  const getResultClass = (result) => {
    if (result.category === 'character') {
      return `character-star-${result.item.star}`
    } else if (result.category === 'equipment') {
      return `quality-${result.item.quality}`
    } else if (result.category === 'pet') {
      return `rarity-${result.item.rarity}`
    }
    return 'quality-resource'
  }

  const getResultColor = (result) => {
    if (result.category === 'character') {
      if (result.item.star === 5) return '#FFD700'
      if (result.item.star === 4) return '#9932CC'
      return '#6fb3ff'
    } else if (result.category === 'equipment') {
      return result.item.qualityInfo?.color || '#F5DEB3'
    } else if (result.category === 'pet') {
      return petRarities[result.item.rarity]?.color || '#F5DEB3'
    }
    return '#DAA520'
  }

  const getResultTypeName = (result) => {
    if (result.category === 'character') return `人物`
    if (result.category === 'artifact') return '法宝'
    if (result.category === 'equipment') {
      if (result.item.slot === 'artifact' || result.item.type === 'artifact') return '法宝'
      return '武器'
    }
    if (result.category === 'pet') return '灵宠'
    return resourceNames[result.item.type] || '资源'
  }

  const getSetName = (setId) => {
    const s = setBonuses.find(x => x.id === setId)
    return s ? s.name : ''
  }
  const getSetColor = (setId) => {
    const s = setBonuses.find(x => x.id === setId)
    return s ? s.color : '#DAA520'
  }
</script>

<style scoped>
  .gacha-page {
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 100%;
  }

  .main-card {
    padding: 16px;
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

  .tips-box {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(139, 69, 19, 0.1);
    border-radius: 8px;
    margin-bottom: 16px;
    color: #F5DEB3;
    font-size: 13px;
  }

  /* 新手福利 */
  .beginner-reward-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: linear-gradient(135deg, rgba(218, 165, 32, 0.15), rgba(255, 215, 0, 0.08));
    border: 1px solid rgba(218, 165, 32, 0.4);
    border-radius: 12px;
    margin-bottom: 16px;
    animation: beginnerGlow 2s ease-in-out infinite;
  }

  @keyframes beginnerGlow {
    0%, 100% { box-shadow: 0 0 8px rgba(218, 165, 32, 0.2); }
    50% { box-shadow: 0 0 20px rgba(218, 165, 32, 0.4); }
  }

  .beginner-reward-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .beginner-reward-icon {
    font-size: 36px;
    animation: bounce 1.5s ease-in-out infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  .beginner-reward-title {
    font-size: 16px;
    font-weight: bold;
    color: #FFD700;
    margin-bottom: 2px;
  }

  .beginner-reward-desc {
    font-size: 12px;
    color: #DAA520;
  }

  .btn-beginner {
    background: linear-gradient(135deg, #DAA520, #FFD700);
    color: #0D0D12;
    font-weight: bold;
    font-size: 14px;
    padding: 10px 24px;
    border-radius: 20px;
    border: none;
    cursor: pointer;
    transition: all 0.3s;
    flex-shrink: 0;
  }

  .btn-beginner:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  }

  .btn-beginner:active {
    transform: scale(0.98);
  }

  /* 奖池选择 */
  .pool-selector {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }

  @media (min-width: 480px) {
    .pool-selector {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .pool-card {
    padding: 10px 6px;
    background: rgba(0, 0, 0, 0.25);
    border: 2px solid rgba(139, 69, 19, 0.2);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .pool-card.active {
    border-color: #DAA520;
    background: rgba(218, 165, 32, 0.1);
    box-shadow: 0 0 12px rgba(218, 165, 32, 0.2);
  }

  .pool-name {
    font-size: 14px;
    font-weight: bold;
    color: #F5DEB3;
    margin-bottom: 2px;
  }

  .pool-cost {
    font-size: 11px;
    color: #DAA520;
    margin-bottom: 2px;
  }

  .pool-desc {
    font-size: 11px;
    color: #C9C4BA;
  }

  /* 抽奖按钮 */
  .gacha-actions {
    margin-bottom: 16px;
  }

  .spirit-stone-display {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: rgba(218, 165, 32, 0.08);
    border-radius: 8px;
    border: 1px solid rgba(218, 165, 32, 0.2);
    margin-bottom: 12px;
  }

  .spirit-stone-display .label {
    font-size: 13px;
    color: #C9C4BA;
  }

  .spirit-stone-display .value {
    font-size: 16px;
    font-weight: bold;
    color: #DAA520;
  }

  .action-buttons {
    display: flex;
    gap: 10px;
  }

  .btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 16px;
    border-radius: 10px;
    font-size: 15px;
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

  .btn-success {
    background: linear-gradient(135deg, #2E7D32, #66BB6A);
    color: #fff;
    box-shadow: 0 4px 15px rgba(34, 139, 34, 0.3);
  }

  .btn-danger {
    background: rgba(220, 53, 69, 0.3);
    color: #DC3545;
    border: 1px solid rgba(220, 53, 69, 0.3);
  }

  .btn-small {
    padding: 6px 12px;
    font-size: 12px;
    min-height: auto;
    flex: none;
  }

  .btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* 幻灵结晶兑换 */
  .crystal-exchange {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: rgba(140, 80, 255, 0.08);
    border: 1px solid rgba(140, 80, 255, 0.25);
    border-radius: 10px;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .crystal-exchange.beast-core-exchange {
    background: rgba(192, 57, 43, 0.08);
    border-color: rgba(192, 57, 43, 0.3);
  }
  .beast-core-exchange .exchange-info .label {
    color: #ff8a78;
  }
  .exchange-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .exchange-info .label {
    font-size: 14px;
    color: #c0a0ff;
    font-weight: bold;
  }
  .exchange-info .rate {
    font-size: 11px;
    color: #C9C4BA;
  }
  .exchange-actions {
    display: flex;
    gap: 6px;
  }
  .exchange-actions .btn {
    padding: 6px 12px;
    font-size: 12px;
    min-height: 32px;
    background: linear-gradient(135deg, rgba(140, 80, 255, 0.6), rgba(100, 50, 200, 0.4));
    color: #fff;
    border: 1px solid rgba(140, 80, 255, 0.4);
  }
  .exchange-actions .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* 抽奖结果 */
  .gacha-results {
    margin-bottom: 16px;
  }

  .section-title {
    margin: 0 0 12px;
    font-size: 18px;
    color: #fff;
    font-family: var(--font-family-heading);
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }

  .result-card {
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(139, 69, 19, 0.2);
    border-radius: 8px;
    text-align: center;
    transition: all 0.2s;
    cursor: pointer;
  }

  .result-card:hover {
    transform: translateY(-2px);
    border-color: rgba(218, 165, 32, 0.5);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .result-avatar {
    width: 64px;
    height: 64px;
    margin: 0 auto 8px;
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid rgba(255, 215, 0, 0.5);
    background: rgba(0, 0, 0, 0.4);
  }

  .result-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* 4星/5星 抽卡结果头像光效（复刻宗门头像仙气/神气特效） */
  @keyframes gachaStar4Glow {
    0%, 100% { box-shadow: 0 0 8px 2px rgba(120, 220, 240, 0.55), 0 0 14px 4px rgba(80, 180, 220, 0.35); }
    50% { box-shadow: 0 0 12px 3px rgba(160, 240, 255, 0.75), 0 0 22px 6px rgba(100, 200, 240, 0.5); }
  }
  @keyframes gachaStar5Glow {
    0%, 100% { box-shadow: 0 0 10px 3px rgba(255, 200, 80, 0.7), 0 0 20px 5px rgba(255, 160, 40, 0.5); }
    50% { box-shadow: 0 0 16px 4px rgba(255, 220, 120, 0.9), 0 0 32px 8px rgba(255, 180, 60, 0.7); }
  }
  .result-avatar.star-4-glow {
    animation: gachaStar4Glow 3s ease-in-out infinite;
    border-color: rgba(120, 220, 240, 0.7);
  }
  .result-avatar.star-5-glow {
    animation: gachaStar5Glow 2.2s ease-in-out infinite;
    border-color: rgba(255, 200, 80, 0.8);
  }

  .result-card.quality-mythic,
  .result-card.rarity-divine {
    border-color: #FF0000;
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.2);
  }

  .result-card.quality-legendary,
  .result-card.rarity-celestial {
    border-color: #FFD700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
  }

  .result-card.quality-epic,
  .result-card.rarity-mystic {
    border-color: #9932CC;
    box-shadow: 0 0 8px rgba(153, 50, 204, 0.15);
  }

  .result-type {
    font-size: 11px;
    margin-bottom: 4px;
    opacity: 0.8;
  }

  .result-name {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 6px;
    word-break: break-all;
  }

  .result-detail {
    display: flex;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    color: #F5DEB3;
    flex-wrap: wrap;
  }

  .result-set {
    width: 100%;
    font-size: 12px;
    font-weight: bold;
    margin-top: 2px;
  }

  .result-affixes {
    width: 100%;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }

  .result-affix {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #c8c8d0;
  }

  .result-affix.affix-tier-1 {
    color: #9fe09f;
    border-color: rgba(159, 224, 159, 0.4);
  }

  .result-affix.affix-tier-2 {
    color: #6fb3ff;
    border-color: rgba(111, 179, 255, 0.4);
  }

  .result-affix.affix-tier-3 {
    color: #ffcf5e;
    border-color: rgba(255, 207, 94, 0.5);
  }

  .log-section {
    margin-top: auto;
  }

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  /* 人物星级 */
  .star-rating {
    display: flex;
    justify-content: center;
    gap: 2px;
    margin-bottom: 4px;
  }

  .star-rating .star {
    font-size: 14px;
    color: #DAA520;
  }

  .result-card.character-star-5 {
    border-color: #FFD700;
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
    background: rgba(255, 215, 0, 0.08);
  }

  .result-card.character-star-4 {
    border-color: #9932CC;
    box-shadow: 0 0 12px rgba(153, 50, 204, 0.3);
    background: rgba(153, 50, 204, 0.06);
  }

  .result-card.character-star-3 {
    border-color: #6fb3ff;
    box-shadow: 0 0 10px rgba(111, 179, 255, 0.2);
    background: rgba(111, 179, 255, 0.04);
  }

  /* 祈福物品详情弹窗 */
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

  .simple-tag {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    background: rgba(0, 0, 0, 0.3);
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
    display: inline-block;
    width: 30%;
    height: 1px;
    background: rgba(218, 165, 32, 0.3);
    vertical-align: middle;
    margin: 0 8px;
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

  .affix-name.affix-tier-1 {
    color: #32CD32;
  }

  .affix-name.affix-tier-2 {
    color: #1E90FF;
  }

  .affix-name.affix-tier-3 {
    color: #ffcf5e;
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

  .pet-desc {
    margin: 10px 0;
    padding: 8px 10px;
    background: rgba(139, 69, 19, 0.08);
    border-radius: 6px;
    font-size: 13px;
    color: #F5F0E8;
    line-height: 1.5;
  }

  /* 日间模式：祈福物品详情弹窗改为深色卡片 + 亮色文字（遵循暗底亮字原则） */
  html:not(.dark) .simple-modal-content {
    background: rgba(45, 44, 42, 0.96);
    border-color: rgba(255, 255, 255, 0.12);
    color: #F5F0E8;
  }
  html:not(.dark) .simple-modal-content .modal-header h3 {
    color: #FFD86B;
  }
  html:not(.dark) .simple-modal-content .detail-row {
    color: #F5F0E8;
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
  html:not(.dark) .simple-modal-content .detail-row span:first-child {
    color: #C9C4BA;
  }
  html:not(.dark) .simple-modal-content .modal-body {
    color: #F5F0E8;
  }

</style>
