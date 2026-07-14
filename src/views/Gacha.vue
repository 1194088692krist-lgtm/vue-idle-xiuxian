<template>
  <div class="gacha-page fade-in-up">
    <div class="main-card glass-card">
      <div class="card-header">
        <div class="header-icon">
          <GiftOutlined />
        </div>
        <div class="header-info">
          <h2 class="card-title gold-gradient-text">天机阁</h2>
          <p class="card-subtitle">消耗灵石抽取珍稀人物、武器、法宝与灵宠</p>
        </div>
      </div>
      <div class="card-body">
        <div v-if="!playerStore.beginnerRewardClaimed" class="beginner-reward-box">
          <div class="beginner-reward-info">
            <div class="beginner-reward-icon">🎁</div>
            <div class="beginner-reward-text">
              <div class="beginner-reward-title">新手福利</div>
              <div class="beginner-reward-desc">新修士专属，领取 20,000 灵石开启修仙之旅！</div>
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
            <div class="pool-cost">{{ pool.cost }} 灵石/次</div>
            <div class="pool-desc">{{ pool.desc }}</div>
          </div>
        </div>

        <div class="gacha-actions">
          <div class="spirit-stone-display">
            <span class="label">当前灵石：</span>
            <span class="value">{{ formatNumber(playerStore.spiritStones) }}</span>
          </div>
          <div class="action-buttons">
            <button
              class="btn btn-primary"
              :class="{ disabled: playerStore.spiritStones < currentPoolConfig.cost }"
              @click="doSingleGacha"
            >
              <span>单抽（{{ currentPoolConfig.cost }}灵石）</span>
            </button>
            <button
              class="btn btn-success"
              :class="{ disabled: playerStore.spiritStones < currentPoolConfig.cost * 10 }"
              @click="doTenGacha"
            >
              <span>十连（{{ currentPoolConfig.cost * 10 }}灵石）</span>
            </button>
          </div>
        </div>

        <div v-if="gachaResults.length > 0" class="gacha-results">
          <h3 class="section-title">抽奖结果</h3>
          <div class="results-grid">
            <div
              v-for="(result, index) in gachaResults"
              :key="index"
              class="result-card"
              :class="getResultClass(result)"
              @click="showCharacterDetail(result)"
            >
              <div v-if="result.category === 'character' && getCharacterAvatar(result.item)" class="result-avatar">
                <img :src="getCharacterAvatar(result.item)" :alt="result.item.name" />
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
                <template v-else-if="result.category === 'equipment'">
                  <span>{{ equipmentTypeNames[result.item.type] || '装备' }}</span>
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
            <h3 class="section-title gold-gradient-text">抽奖日志</h3>
            <button class="btn btn-small btn-danger" @click="clearLogPanel">清空</button>
          </div>
          <log-panel ref="logRef" />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showCharModal" class="char-modal-overlay" @click="closeCharModal">
        <div class="char-modal" @click.stop>
          <div class="char-modal-close" @click="closeCharModal">✕</div>
          <div class="char-modal-content">
            <div class="char-portrait">
              <div v-if="getCharacterAvatar(selectedCharacter)" class="char-image">
                <img :src="getCharacterAvatar(selectedCharacter)" :alt="selectedCharacter?.name" />
              </div>
              <div v-else class="char-placeholder">
                <UserOutlined />
              </div>
              <div class="char-star-rating">
                <span v-for="i in selectedCharacter?.star" :key="i" class="star">★</span>
              </div>
            </div>
            <div class="char-info">
              <h2 class="char-name">{{ selectedCharacter?.name }}</h2>
              <p class="char-desc">{{ selectedCharacter?.description }}</p>
              <div class="char-school">
                <span class="label">流派：</span>
                <span class="value">{{ characterSchools[selectedCharacter?.school]?.name }}</span>
              </div>
              <div class="char-talent">
                <span class="label">天赋：</span>
                <span class="value">{{ characterTalents[selectedCharacter?.talent]?.name }}</span>
              </div>
              <div class="char-role">
                <span class="label">定位：</span>
                <span class="value">{{ characterRoles[selectedCharacter?.role]?.icon }} {{ characterRoles[selectedCharacter?.role]?.name }}</span>
                <span class="role-desc">{{ characterRoles[selectedCharacter?.role]?.desc }}</span>
              </div>
              <div class="char-stats">
                <div class="stat-item">
                  <span class="stat-label">攻击</span>
                  <span class="stat-value">{{ selectedCharacter?.baseStats?.attack }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">生命</span>
                  <span class="stat-value">{{ selectedCharacter?.baseStats?.health }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">防御</span>
                  <span class="stat-value">{{ selectedCharacter?.baseStats?.defense }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">速度</span>
                  <span class="stat-value">{{ selectedCharacter?.baseStats?.speed }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { usePlayerStore } from '../stores/player'
  import { ref, computed } from 'vue'
  import { useMessage } from 'naive-ui'
  import { GiftOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons-vue'
  import { getStatName } from '../plugins/stats'
  import {
    gachaPools,
    doGacha,
    doMultiGacha,
    equipmentTypeNames,
    petRarities,
    equipmentQualities
  } from '../plugins/gacha'
  import { setBonuses } from '../plugins/buildSystem'
  import LogPanel from '../components/LogPanel.vue'
  import { characterSchools, characterTalents, characterRoles, getCharacterAvatar } from '../plugins/characters'

  const playerStore = usePlayerStore()
  const message = useMessage()
  const logRef = ref(null)

  const currentPool = ref('all')
  const gachaResults = ref([])
  const showCharModal = ref(false)
  const selectedCharacter = ref(null)

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

  // 新手福利领取
  const claimBeginnerReward = () => {
    if (playerStore.beginnerRewardClaimed) return
    playerStore.spiritStones += 20000
    playerStore.beginnerRewardClaimed = true
    showMessage('success', '恭喜领取新手福利！获得 20,000 灵石！')
    playerStore.queueSave()
  }

  const formatNumber = num => {
    if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿'
    if (num >= 10000) return (num / 10000).toFixed(1) + '万'
    return num.toLocaleString()
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
    } else if (category === 'equipment') {
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
    if (playerStore.spiritStones < cost) {
      showMessage('error', '灵石不足！')
      return
    }
    playerStore.spiritStones -= cost
    const result = doGacha(currentPool.value, playerStore.level)
    if (!result) return
    grantReward(result)
    gachaResults.value = [result]
    showMessage('success', `抽奖获得：${getRewardName(result)}`)
    // 抽到4星/5星人物自动弹出立绘
    if (result.category === 'character' && result.item.star >= 4) {
      selectedCharacter.value = result.item
      showCharModal.value = true
    }
    playerStore.queueSave()
    playerStore.saveToCurrentSlot().catch(err => console.error('抽奖后自动存档失败:', err))
  }

  // 十连
  const doTenGacha = () => {
    const cost = currentPoolConfig.value.cost * 10
    if (playerStore.spiritStones < cost) {
      showMessage('error', '灵石不足！')
      return
    }
    playerStore.spiritStones -= cost
    const results = doMultiGacha(currentPool.value, 10, playerStore.level)
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
    showMessage('success', `十连抽奖完成：${parts.join('，')}`)
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
    }
  }

  // 关闭人物详情弹窗
  const closeCharModal = () => {
    showCharModal.value = false
    selectedCharacter.value = null
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
    if (result.category === 'equipment') return '装备'
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
    color: #888;
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
    color: #aaa;
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
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 16px;
  }

  @media (min-width: 480px) {
    .pool-selector {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .pool-card {
    padding: 14px;
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
    font-size: 16px;
    font-weight: bold;
    color: #F5DEB3;
    margin-bottom: 4px;
  }

  .pool-cost {
    font-size: 13px;
    color: #DAA520;
    margin-bottom: 4px;
  }

  .pool-desc {
    font-size: 11px;
    color: #888;
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
    color: #888;
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
    color: #aaa;
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

  /* 人物弹窗 */
  .char-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(8px);
  }

  .char-modal {
    background: linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(40, 30, 20, 0.95));
    border: 2px solid rgba(218, 165, 32, 0.5);
    border-radius: 16px;
    padding: 24px;
    max-width: 480px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    animation: modalAppear 0.3s ease-out;
  }

  @keyframes modalAppear {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .char-modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
    font-size: 20px;
    color: #888;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .char-modal-close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }

  .char-modal-content {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .char-portrait {
    flex-shrink: 0;
    width: 140px;
    height: 180px;
    position: relative;
  }

  .char-image {
    width: 100%;
    height: 100%;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid rgba(218, 165, 32, 0.5);
  }

  .char-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .char-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 12px;
    border: 2px solid rgba(218, 165, 32, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    font-size: 48px;
    color: rgba(218, 165, 32, 0.5);
  }

  .char-star-rating {
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
    background: rgba(0, 0, 0, 0.8);
    padding: 4px 12px;
    border-radius: 12px;
    border: 1px solid rgba(218, 165, 32, 0.5);
  }

  .char-star-rating .star {
    font-size: 16px;
    color: #FFD700;
  }

  .char-info {
    flex: 1;
  }

  .char-name {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: bold;
    color: #FFD700;
    font-family: var(--font-family-heading);
  }

  .char-desc {
    margin: 0 0 12px;
    font-size: 13px;
    color: #aaa;
    line-height: 1.5;
  }

  .char-school,
  .char-talent {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .char-school .label,
  .char-talent .label {
    color: #888;
  }

  .char-school .value,
  .char-talent .value {
    color: #F5DEB3;
    font-weight: bold;
  }

  .char-role {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 13px;
    flex-wrap: wrap;
    align-items: center;
  }

  .char-role .label {
    color: #888;
  }

  .char-role .value {
    color: #F5DEB3;
    font-weight: bold;
  }

  .role-desc {
    font-size: 11px;
    color: #888;
    width: 100%;
    margin-top: 2px;
  }

  .char-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(218, 165, 32, 0.2);
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
  }

  .stat-label {
    font-size: 12px;
    color: #888;
  }

  .stat-value {
    font-size: 14px;
    font-weight: bold;
    color: #FFD700;
  }
</style>
