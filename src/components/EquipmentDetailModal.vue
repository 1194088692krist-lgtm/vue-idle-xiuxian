<template>
  <!-- 装备详情弹窗（复刻自 Inventory.vue 第 465-630 行）-->
  <Teleport to="body">
  <div v-if="equipment" class="simple-modal equipment-detail-modal" @click.self="$emit('close')">
    <div class="simple-modal-content equipment-detail-content">
      <div class="modal-header">
        <h3>{{ equipment.name || '装备详情' }}</h3>
        <button class="btn-small" @click="$emit('close')">关闭</button>
      </div>
      <div class="modal-body">
        <div class="detail-row">
          <span>品质</span>
          <span class="simple-tag" :style="{ color: qualityInfoOf(equipment).color }">
            {{ qualityInfoOf(equipment).name }}
          </span>
        </div>
        <div class="detail-row">
          <span>类型</span><span>{{ equipmentTypes[equipment.slot || equipment.type] }}</span>
        </div>
        <div class="detail-row">
          <span>强化等级</span><span>+{{ equipment.enhanceLevel || 0 }}</span>
        </div>
        <div class="detail-row">
          <span>装备评分</span><span class="equipment-score">{{ formatEquipmentScore(equipment) }}</span>
        </div>
        <div v-if="equipment.setId" class="detail-row">
          <span>套装</span>
          <span class="set-tag" :style="{ color: getSetInfo(equipment.setId)?.color }">
            {{ getSetInfo(equipment.setId)?.name }}
          </span>
        </div>
        <div class="simple-divider">基础属性</div>
        <div class="detail-row stat-header">
          <span class="stat-name">属性</span>
          <span class="stat-base">基础</span>
          <span class="stat-final">最终</span>
        </div>
        <div v-for="(value, stat) in filteredEquipmentStats" :key="stat" class="detail-row stat-row">
          <span class="stat-name">{{ getStatName(stat) }}</span>
          <span class="stat-base">{{ formatStatValue(stat, value) }}</span>
          <span class="stat-final">{{ formatStatValue(stat, equipmentFinalStats[stat] ?? value) }}</span>
        </div>
        <div v-if="equipment.affixes && equipment.affixes.length > 0" class="affixes-section">
          <div class="simple-divider">词条</div>
          <div v-for="affix in equipment.affixes" :key="affix.id" class="affix-row">
            <span class="affix-left">
              <span v-if="affix.qualityTier" class="qtier-badge" :class="qualityTierClass(affix.qualityTier)">{{ qualityTierLabel(affix.qualityTier) }}</span>
              <span class="affix-name" :class="'affix-tier-' + affix.tier">{{ affix.name }}</span>
            </span>
            <span>{{ getStatName(affix.stat) }} {{ affix.valueType === 'percent' ? '+' + (affix.value * 100).toFixed(1) + '%' : '+' + affix.value }}</span>
          </div>
        </div>
        <div v-if="equipment.setId" class="set-bonus-section">
          <div class="simple-divider">套装效果</div>
          <div v-for="bonus in getSetBonuses(equipment.setId)" :key="bonus.stat" class="set-bonus-row">
            <span>{{ bonus.label }}</span>
          </div>
        </div>
        <!-- 工艺面板（M0-B）：定向打造词缀 -->
        <div class="craft-section">
          <div class="simple-divider">工艺 · 定向打造</div>
          <div v-if="equipment.corrupted" class="craft-corrupted-hint">⚠ 该装备已腐化，仅可使用「血祭符」</div>
          <div class="craft-currency-list">
            <button
              v-for="cur in craftCurrencyList"
              :key="cur.id"
              class="craft-currency-btn"
              :class="{ active: selectedCraftCurrency === cur.id, 'is-empty': cur.count === 0 }"
              :disabled="cur.count === 0 || (equipment.corrupted && cur.id !== 'blood_sigil')"
              :title="cur.desc"
              @click="selectCraftCurrency(cur.id)"
            >
              {{ cur.name }}<em class="cur-count">×{{ cur.count }}</em>
            </button>
          </div>
          <div v-if="currentCraftCurrency" class="craft-detail">
            <p class="craft-desc">{{ currentCraftCurrency.desc }}</p>
            <div v-if="currentCraftCurrency.needTarget" class="craft-target-list">
              <span
                v-for="affix in (equipment.affixes || [])"
                :key="affix.id"
                class="craft-target-affix"
                :class="{ active: selectedTargetAffix === affix.id, locked: affix.locked }"
                @click="selectedTargetAffix = affix.id"
              >
                {{ affix.name }}<em v-if="affix.qualityTier" class="cur-count">·T{{ affix.qualityTier }}</em><em v-if="affix.locked">🔒</em>
              </span>
            </div>
            <button class="btn-small craft-apply-btn" :disabled="!canApplyCraft" @click="applyCraft">
              使用{{ currentCraftCurrency.name }}
            </button>
            <p v-if="craftMessage" class="craft-message" :class="{ error: craftMessageError }">{{ craftMessage }}</p>
          </div>
          <p v-else class="craft-hint">选择一种工艺货币开始打造；货币由挂机掉落与分解装备获得。</p>
        </div>
        <!-- 灵纹槽（M1） -->
        <div v-if="(equipment.runes && equipment.runes.length > 0)" class="rune-section">
          <div class="simple-divider">灵纹槽（{{ equipment.runes.filter(r=>r).length }}/{{ equipment.runes.length }}）</div>
          <div class="rune-slots">
            <div
              v-for="(r, idx) in equipment.runes"
              :key="idx"
              class="rune-slot"
              :class="{ filled: !!r, ['re-' + (r ? r.element : '')]: !!r }"
              @click="onRuneSlotClick(idx)"
            >
              <template v-if="r">
                <span class="rune-name">{{ r.name }}</span>
                <span class="rune-desc">{{ runeStatDesc(r) }}</span>
                <span class="rune-remove" title="卸下" @click.stop="unsocketRune(idx)">×</span>
              </template>
              <span v-else class="rune-empty">空槽 ＋</span>
            </div>
          </div>
          <div v-if="runeSynergyList.length" class="rune-synergy">
            <span v-for="(s, i) in runeSynergyList" :key="i" class="synergy-tag">共鸣·{{ elementName(s.element) }} {{ synergyDesc(s) }}</span>
          </div>
          <div v-if="socketingSlot !== null" class="rune-picker">
            <div class="simple-divider">选择灵纹 → 槽位 {{ socketingSlot + 1 }}</div>
            <div v-if="playerRunes.length === 0" class="rune-hint">暂无灵纹，可通过 Boss / 高难挂机获得</div>
            <div class="rune-picker-list">
              <span
                v-for="r in playerRunes"
                :key="r.id || r.name"
                class="rune-chip"
                :class="['re-' + r.element, { 'rune-chip-disabled': r.count <= 0 }]"
                @click="r.count > 0 && doSocketRune(r)"
              >
                {{ r.name }}<em>{{ runeStatDesc(r) }}</em>
                <span class="rune-count">×{{ r.count }}</span>
              </span>
            </div>
            <button class="btn-small" @click="socketingSlot = null">取消</button>
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
              <span>{{ formatEquipmentScore(p.score) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-actions four-grid">
          <button
            class="btn-small"
            :disabled="playerStore.level < (equipment?.requiredRealm || 1)"
            @click="$emit('equip')"
          >
            装备
          </button>
          <!-- sect 模式：强化按钮替代出售/分解 -->
          <button
            v-if="mode === 'sect'"
            class="btn-small btn-primary"
            :disabled="!canEnhance"
            @click="handleEnhance"
          >
            强化
          </button>
          <!-- inventory 模式：出售/分解（与原版一致）-->
          <button
            v-else
            class="btn-small btn-danger"
            @click="showSellDisassemble = true"
          >
            出售/分解
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 出售 / 分解 选择弹窗（仅 inventory 模式，行为与原版一致：选择后交由父组件处理）-->
  <div
    v-if="equipment && mode === 'inventory' && showSellDisassemble"
    class="simple-modal sell-disassemble-modal"
    @click.self="showSellDisassemble = false"
  >
    <div class="simple-modal-content sell-disassemble-content">
      <div class="modal-header">
        <h3>出售 / 分解</h3>
        <button class="btn-small" @click="showSellDisassemble = false">关闭</button>
      </div>
      <div class="modal-body">
        <div class="detail-row">
          <span>装备</span><span>{{ equipment.name }}</span>
        </div>
        <div class="detail-row">
          <span>预计灵石</span><span class="equipment-score">{{ sellPreview }}</span>
        </div>
        <p class="craft-hint">出售按装备评分折算为灵石；分解可获得强化石 / 洗练石。</p>
        <div class="modal-actions four-grid">
          <button class="btn-small btn-warning" @click="onSellClick">出售</button>
          <button class="btn-small btn-info" @click="onDisassembleClick">分解</button>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useMessage } from 'naive-ui'
  import { usePlayerStore } from '../stores/player'
  import { getStatName, formatStatValue } from '../plugins/stats'
  import { calculateEquipmentScore, formatEquipmentScore, rarityConfig, setBonuses } from '../plugins/buildSystem'
  import { enhanceConfig } from '../plugins/equipment'
  import { qualityTierLabel, qualityTierClass } from '../utils/affixQuality'
  import { craftCurrencies } from '../plugins/craftCurrency'
  import { getRuneSynergy, RUNE_ELEMENTS, getRuneStats } from '../plugins/runes'

  const props = defineProps({
    // 装备对象（null 时弹窗不显示）
    equipment: { type: Object, default: null },
    // 模式：'inventory'（背包，显示装备+出售分解）/ 'sect'（宗门，显示强化按钮替代出售分解）
    mode: { type: String, default: 'inventory' },
    // 宗门模式专用：装备所属的成员 ID（用于调用 enhanceMemberEquipment）
    memberId: { type: [String, Number], default: null },
    // 宗门模式专用：装备槽位（用于调用 enhanceMemberEquipment）
    slot: { type: String, default: null }
  })

  const emit = defineEmits(['close', 'equip', 'sell', 'disassemble', 'enhanced'])

  const message = useMessage()
  const playerStore = usePlayerStore()

  // 装备槽位中文名映射
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

  // 兼容 qualityInfo 缺失的装备（如挂机生成），回退到 rarityConfig
  const qualityInfoOf = (equip) => {
    if (equip && equip.qualityInfo && equip.qualityInfo.name) return equip.qualityInfo
    const cfg = rarityConfig[equip?.quality]
    if (cfg) return { name: cfg.name, color: cfg.color }
    return { name: equip?.quality || '未知', color: '#999' }
  }

  const getSetInfo = (setId) => setBonuses.find(s => s.id === setId)

  const getSetBonuses = (setId) => {
    const setData = setBonuses.find(s => s.id === setId)
    if (!setData) return []
    const bonuses = []
    if (setData.bonus2) bonuses.push(setData.bonus2)
    if (setData.bonus3) bonuses.push(setData.bonus3)
    if (setData.bonus4) bonuses.push(setData.bonus4)
    if (setData.bonus5) bonuses.push(setData.bonus5)
    return bonuses
  }

  // 过滤掉值为 0/NaN/null 的无意义词条，基础属性始终显示
  const filteredEquipmentStats = computed(() => {
    if (!props.equipment || !props.equipment.stats) return {}
    const result = {}
    Object.entries(props.equipment.stats).forEach(([stat, value]) => {
      if (['attack', 'health', 'defense', 'speed'].includes(stat) || (value && value !== 0 && !Number.isNaN(value))) {
        result[stat] = value
      }
    })
    return result
  })

  // 基础属性经强化、词条、打造、灵纹后的最终数值
  const equipmentFinalStats = computed(() => {
    if (!props.equipment || !props.equipment.stats) return {}
    const base = { ...props.equipment.stats }
    const final = { ...base }
    const apply = (stat, value, valueType) => {
      if (final[stat] === undefined) final[stat] = 0
      if (valueType === 'percent') final[stat] = final[stat] * (1 + value)
      else final[stat] = final[stat] + value
    }
    // 词条（含打造后的结果）
    ;(props.equipment.affixes || []).forEach(a => apply(a.stat, a.value, a.valueType))
    // 灵纹 + 共鸣
    getRuneStats(props.equipment).forEach(rs => apply(rs.stat, rs.value, rs.valueType))
    return final
  })

  // 强化预览：计算 +1 到 +12 的属性
  const enhancePreview = computed(() => {
    if (!props.equipment) return []
    const base = props.equipment
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

  // 装备最大强化等级：专属装备 +15，普通装备 +12
  const getEquipMaxEnhanceLevel = (equip) => {
    if (!equip) return enhanceConfig.maxLevel
    return equip.isExclusive ? (enhanceConfig.exclusiveMaxLevel || 15) : enhanceConfig.maxLevel
  }

  // 是否可继续强化（已达上限时禁用强化按钮）
  const canEnhance = computed(() => {
    if (!props.equipment) return false
    return (props.equipment.enhanceLevel || 0) < getEquipMaxEnhanceLevel(props.equipment)
  })

  // 宗门模式：直接强化该成员装备，成功后 emit 'enhanced'
  const handleEnhance = () => {
    if (props.mode !== 'sect') return
    if (!props.memberId || !props.slot || !props.equipment) return
    const result = playerStore.enhanceMemberEquipment(props.memberId, props.slot)
    if (result.success) {
      message.success(`强化成功！${props.equipment.name} +${props.equipment.enhanceLevel}`)
      emit('enhanced')
    } else {
      message.error(`强化失败：${result.message}`)
    }
  }

  // ===== 工艺面板（M0-B）=====
  const selectedCraftCurrency = ref(null)
  const selectedTargetAffix = ref(null)
  const craftMessage = ref('')
  const craftMessageError = ref(false)
  // 展示全部货币（含 0，便于发现系统），附实时数量
  const craftCurrencyList = computed(() => {
    return Object.values(craftCurrencies).map(c => ({ ...c, count: playerStore.getCraftCurrencyCount(c.id) }))
  })
  const currentCraftCurrency = computed(() => (selectedCraftCurrency.value ? craftCurrencies[selectedCraftCurrency.value] : null))
  const canApplyCraft = computed(() => {
    const c = currentCraftCurrency.value
    if (!c || !props.equipment) return false
    if (playerStore.getCraftCurrencyCount(c.id) < 1) return false
    if (props.equipment.corrupted && c.id !== 'blood_sigil') return false
    if (c.needTarget && !selectedTargetAffix.value) return false
    return true
  })
  const selectCraftCurrency = (id) => {
    selectedCraftCurrency.value = id
    selectedTargetAffix.value = null
    craftMessage.value = ''
  }
  const applyCraft = () => {
    const c = currentCraftCurrency.value
    if (!c || !props.equipment) return
    const result = playerStore.craftEquipmentWithCurrency(props.equipment.id, c.id, selectedTargetAffix.value)
    craftMessage.value = result.message || ''
    craftMessageError.value = !result.success
    if (result.success) {
      selectedTargetAffix.value = null
      // 血祭碎裂：装备已消失，关闭详情
      if (result.shattered) emit('close')
    }
  }

  // ===== 灵纹镶嵌（M1）=====
  const socketingSlot = ref(null)
  // 灵纹选择列表：按种类（id）聚合，同种类只显示一次并附带持有数量
  const playerRunes = computed(() => {
    const all = playerStore.runes || []
    const aggMap = {}
    for (const r of all) {
      const rid = r.id || r.name
      if (!aggMap[rid]) {
        aggMap[rid] = { ...r, count: 0, _uids: [] }
      }
      aggMap[rid].count++
      aggMap[rid]._uids.push(r.uid)
    }
    return Object.values(aggMap).filter(r => r.count > 0)
  })
  const runeSynergyList = computed(() => (props.equipment ? getRuneSynergy(props.equipment) : []))
  const onRuneSlotClick = (idx) => {
    const r = props.equipment?.runes?.[idx]
    if (!r) socketingSlot.value = idx   // 空槽 → 打开灵纹选择
  }
  const unsocketRune = (idx) => {
    const res = playerStore.unsocketRune(props.equipment.id, idx)
    if (res.success) message.success(res.message); else message.error(res.message)
  }
  // 镶嵌：传入聚合后的符文对象，从中取一个可用 uid 进行镶嵌
  const doSocketRune = (runeAgg) => {
    const uid = runeAgg && Array.isArray(runeAgg._uids) && runeAgg._uids[0]
    if (!uid) { message.error('该灵纹已用完'); return }
    const res = playerStore.socketRune(props.equipment.id, socketingSlot.value, uid)
    if (res.success) { message.success(res.message); socketingSlot.value = null } else message.error(res.message)
  }
  const runeStatDesc = (r) => `${getStatName(r.stat)} ${r.valueType === 'percent' ? '+' + (r.value * 100).toFixed(1) + '%' : '+' + r.value}`
  const elementName = (el) => RUNE_ELEMENTS[el]?.name || el
  const synergyDesc = (s) => `${getStatName(s.stat)} ${s.valueType === 'percent' ? '+' + (s.value * 100).toFixed(0) + '%' : '+' + s.value}`

  // ===== 出售 / 分解（inventory 模式）=====
  // 实际出售/分解动作交由父组件处理（父组件持有装备归属与对应 store action），
  // 这里仅复刻原版“出售/分解”选择弹窗的交互，并通过 emit 通知父组件。
  const showSellDisassemble = ref(false)
  // 出售预览灵石（按评分折价）
  const sellPreview = computed(() => {
    if (!props.equipment) return 0
    return Math.max(1, Math.round((calculateEquipmentScore(props.equipment) || 0) * 0.1))
  })
  const onSellClick = () => {
    showSellDisassemble.value = false
    emit('sell')
  }
  const onDisassembleClick = () => {
    showSellDisassemble.value = false
    emit('disassemble')
  }
</script>

<style scoped>
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
    z-index: 10000;
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

  /* 装备详情弹窗：移动端靠下端显示，桌面端居中 */
  .simple-modal.equipment-detail-modal {
    padding: 0;
    align-items: flex-end;
  }

  .equipment-detail-modal .equipment-detail-content {
    width: 100%;
    max-width: 100%;
    max-height: 85vh;
    border-radius: 14px 14px 0 0;
    padding: 16px 16px 24px;
    margin-bottom: 0;
  }

  @media (min-width: 769px) {
    .simple-modal.equipment-detail-modal {
      padding: 0;
      align-items: flex-end;
      justify-content: flex-end;
    }

    .equipment-detail-modal .equipment-detail-content {
      width: 45vw;
      max-width: 480px;
      max-height: 75vh;
      border-radius: 14px 14px 0 0;
      padding: 18px 20px 24px;
      margin-bottom: 0;
    }
  }

  /* 出售/分解选择弹窗：窄宽居中 */
  .sell-disassemble-content {
    max-width: 340px;
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
    color: #F5DEB3;
  }

  .detail-row span:first-child {
    color: #C9C4BA;
  }

  /* 基础属性三列：属性 | 基础 | 最终 */
  .stat-row,
  .stat-header {
    display: grid;
    grid-template-columns: 1fr 90px 90px;
    gap: 8px;
    align-items: center;
  }
  .stat-header {
    font-size: 11px;
    opacity: 0.65;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }
  .stat-header .stat-name,
  .stat-header .stat-base,
  .stat-header .stat-final {
    color: #C9C4BA;
  }
  .stat-base,
  .stat-final {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .stat-final {
    color: #FFD86B;
    font-weight: 600;
  }

  .modal-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }

  /* 装备详情动作按钮区（两列） */
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

  /* ===== 词缀 roll 品质档徽章（T1 极品 → T6 最差）===== */
  .qtier-badge {
    display: inline-block;
    padding: 0 5px;
    margin-right: 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: bold;
    line-height: 1.5;
    border: 1px solid currentColor;
    vertical-align: middle;
  }
  .affix-left { display: inline-flex; align-items: center; }
  .qtier-1 { color: #FFD700; text-shadow: 0 0 6px rgba(255, 215, 0, 0.6); background: rgba(255, 215, 0, 0.12); }
  .qtier-2 { color: #FF8C00; background: rgba(255, 140, 0, 0.10); }
  .qtier-3 { color: #1E90FF; background: rgba(30, 144, 255, 0.10); }
  .qtier-4 { color: #32CD32; background: rgba(50, 205, 50, 0.10); }
  .qtier-5 { color: #9E9E9E; background: rgba(158, 158, 158, 0.10); }
  .qtier-6 { color: #6B6B6B; background: rgba(107, 107, 107, 0.10); }

  /* ===== 工艺面板（M0-B）===== */
  .craft-section { margin-top: 8px; }
  .craft-corrupted-hint { font-size: 12px; color: #FF8A8A; margin: 4px 0; }
  .craft-currency-list { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
  .craft-currency-btn {
    padding: 4px 8px; font-size: 12px; border-radius: 4px; cursor: pointer;
    background: rgba(255, 255, 255, 0.06); color: #E8E0D0;
    border: 1px solid rgba(255, 255, 255, 0.15); transition: all 0.15s;
  }
  .craft-currency-btn:hover:not(:disabled) { border-color: #FFD700; }
  .craft-currency-btn.active { background: rgba(255, 215, 0, 0.15); border-color: #FFD700; color: #FFD700; }
  .craft-currency-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .craft-currency-btn .cur-count { font-style: normal; opacity: 0.75; margin-left: 2px; }
  .craft-desc { font-size: 12px; opacity: 0.8; margin: 4px 0; }
  .craft-target-list { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
  .craft-target-affix {
    padding: 3px 8px; font-size: 12px; border-radius: 4px; cursor: pointer;
    background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); transition: all 0.15s;
  }
  .craft-target-affix:hover { border-color: #1E90FF; }
  .craft-target-affix.active { background: rgba(30, 144, 255, 0.18); border-color: #1E90FF; color: #7FB8FF; }
  .craft-target-affix.locked { border-color: #FFD700; }
  .craft-apply-btn { margin-top: 6px; }
  .craft-message { font-size: 12px; margin-top: 6px; color: #66BB6A; }
  .craft-message.error { color: #FF8A8A; }
  .craft-hint { font-size: 12px; opacity: 0.6; margin: 4px 0; }

  /* ===== 灵纹槽（M1）===== */
  .rune-section { margin-top: 8px; }
  .rune-slots { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
  .rune-slot {
    position: relative; min-width: 88px; padding: 6px 8px; border-radius: 5px; cursor: pointer;
    background: rgba(255, 255, 255, 0.05); border: 1px dashed rgba(255, 255, 255, 0.2);
    display: flex; flex-direction: column; align-items: center; font-size: 12px; transition: all 0.15s;
  }
  .rune-slot.filled { border-style: solid; }
  .rune-slot:hover { border-color: #FFD700; }
  .rune-name { font-weight: bold; }
  .rune-desc { font-size: 11px; opacity: 0.8; }
  .rune-empty { opacity: 0.5; }
  .rune-remove { position: absolute; top: 2px; right: 5px; font-size: 14px; color: #FF8A8A; cursor: pointer; line-height: 1; }
  .rune-remove:hover { color: #FF4444; }
  .rune-slot.re-fire, .rune-chip.re-fire { border-color: #FF4500; color: #FF7A50; }
  .rune-slot.re-water, .rune-chip.re-water { border-color: #1E90FF; color: #6FB6FF; }
  .rune-slot.re-metal, .rune-chip.re-metal { border-color: #C9C9C9; color: #E0E0E0; }
  .rune-slot.re-wood, .rune-chip.re-wood { border-color: #3CB371; color: #6FD6A0; }
  .rune-slot.re-earth, .rune-chip.re-earth { border-color: #D2691E; color: #E89B5A; }
  .rune-synergy { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0; }
  .synergy-tag { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(255, 215, 0, 0.12); border: 1px solid #FFD700; color: #FFD700; }
  .rune-picker { margin-top: 6px; }
  .rune-picker-list { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
  .rune-chip {
    padding: 4px 8px; font-size: 12px; border-radius: 4px; cursor: pointer;
    background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); transition: all 0.15s;
  }
  .rune-chip:hover { transform: translateY(-1px); }
  .rune-chip em { font-style: normal; opacity: 0.75; margin-left: 4px; font-size: 11px; }
  .rune-chip .rune-count { margin-left: 6px; font-weight: bold; color: #FFD700; font-size: 11px; }
  .rune-chip-disabled { opacity: 0.4; cursor: not-allowed; }
  .rune-chip-disabled:hover { transform: none; }
  .rune-hint { font-size: 12px; opacity: 0.6; margin: 4px 0; }

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
</style>
