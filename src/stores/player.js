import { defineStore } from 'pinia'
import { GameDB } from './db'
import { pillRecipes, tryCreatePill, calculatePillEffect } from '../plugins/pills'
import { encryptData, decryptData, validateData } from '../plugins/crypto'
import { getRealmName, getRealmLength } from '../plugins/realm'
import { getAffixesForSlot, getActiveSetBonuses, applySetBonusStats, calculateEquipmentScore, calculateBuildStrength, calculateTotalBuild } from '../plugins/buildSystem'

// 装备出售/分解相关常量
// 出售折价率：出售价 = max(1, round(装备评分 * SELL_DISCOUNT_RATE)) 灵石
const SELL_DISCOUNT_RATE = 0.1
// 分解产出映射（基于品质）：强化石数量 + 洗练石数量（凡品不产洗练石）
const EQUIPMENT_SLOTS = ['weapon', 'head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'necklace', 'ring1', 'ring2', 'belt', 'artifact']
const QUALITY_STONE_MAP = {
  mythic: 6,
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1
}
// 是否装备类物品（兼容 gacha 生成 type=槽位 与 挂机生成 type='equipment' 两种形态）
// 严格排除 pet/material 等非装备类型
const isEquipmentItem = item => !!item && item.type !== 'pet' && item.type !== 'material' && (item.type === 'equipment' || (item.slot && EQUIPMENT_SLOTS.includes(item.slot)))

export const usePlayerStore = defineStore('player', {
  state: () => ({
    // 保存防抖计时器（不持久化）
    saveTimer: null,
    pendingSave: false,
    lastSaveTime: 0,
    // 当前存档所在槽位（null 表示尚未指定，自动存档时默认写入槽位 1）
    currentSlot: null,
    // 是否新玩家
    isNewPlayer: true,
    // GM模式开关
    isGMMode: false,
    // 主题设置
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    // 灵宠系统
    activePet: null, // 当前出战的灵宠
    _petNaturalSnapshot: null, // 出战灵宠前的自然属性快照（用于精确还原，避免重复叠加）
    petEssence: 0, // 灵宠精华
    petConfig: {
      rarityMap: {
        divine: { name: '神品', color: '#FF0000', probability: 0.02, essenceBonus: 50 },
        celestial: { name: '仙品', color: '#FFD700', probability: 0.08, essenceBonus: 30 },
        mystic: { name: '玄品', color: '#9932CC', probability: 0.15, essenceBonus: 20 },
        spiritual: { name: '灵品', color: '#1E90FF', probability: 0.25, essenceBonus: 10 },
        mortal: { name: '凡品', color: '#32CD32', probability: 0.5, essenceBonus: 5 }
      }
    },
    // 基础属性
    name: '无名修士',
    nameChangeCount: 0, // 道号修改次数
    level: 1, // 境界等级
    realm: '练气期一层', // 当前境界名称
    cultivation: 0, // 当前修为值
    maxCultivation: 100, // 当前境界最大修为值
    spirit: 1000, // 灵力值
    maxSpirit: 1000, // 灵力上限
    spiritRate: 1, // 灵力获取倍率
    lastSpiritUpdate: Date.now(), // 上次灵力更新时间
    luck: 1, // 幸运值
    cultivationRate: 1, // 修炼速率
    herbRate: 1, // 灵草获取倍率
    alchemyRate: 1, // 炼丹成功率加成
    // 丹药系统
    pills: [], // 丹药库存
    pillFragments: {}, // 丹方残页（key为丹方ID，value为数量）
    pillRecipes: [], // 已获得的完整丹方
    activeEffects: [], // 当前生效的丹药效果列表
    pillsCrafted: 0, // 炼制丹药次数
    pillsConsumed: 0, // 服用丹药次数
    // 基础战斗属性
    baseAttributes: {
      attack: 10, // 攻击
      health: 100, // 生命
      defense: 5, // 防御
      speed: 10 // 速度
    },
    // 战斗属性
    combatAttributes: {
      critRate: 0, // 暴击率
      comboRate: 0, // 连击率
      counterRate: 0, // 反击率
      stunRate: 0, // 眩晕率
      dodgeRate: 0, // 闪避率
      vampireRate: 0 // 吸血率
    },
    // 战斗抗性
    combatResistance: {
      critResist: 0, // 抗暴击
      comboResist: 0, // 抗连击
      counterResist: 0, // 抗反击
      stunResist: 0, // 抗眩晕
      dodgeResist: 0, // 抗闪避
      vampireResist: 0 // 抗吸血
    },
    // 特殊属性
    specialAttributes: {
      healBoost: 0, // 强化治疗
      critDamageBoost: 0, // 强化爆伤
      critDamageReduce: 0, // 弱化爆伤
      finalDamageBoost: 0, // 最终增伤
      finalDamageReduce: 0, // 最终减伤
      combatBoost: 0, // 战斗属性提升
      resistanceBoost: 0 // 战斗抗性提升
    },
    // 裸身基线（无装备·无套装·含出战灵宠）——用于人物面板展示「基础值 vs 装备后最终值」对比
    nakedBaseAttributes: {
      attack: 10,
      health: 100,
      defense: 5,
      speed: 10
    },
    nakedCombatAttributes: {
      critRate: 0,
      comboRate: 0,
      counterRate: 0,
      stunRate: 0,
      dodgeRate: 0,
      vampireRate: 0
    },
    nakedCombatResistance: {
      critResist: 0,
      comboResist: 0,
      counterResist: 0,
      stunResist: 0,
      dodgeResist: 0,
      vampireResist: 0
    },
    // 资源
    spiritStones: 0, // 灵石数量
    phantomCrystals: 0, // 幻灵结晶数量
    reinforceStones: 0, // 强化石数量
    refinementStones: 0, // 洗练石数量
    petEssence: 0, // 灵宠精华
    petFragments: 0, // 灵宠升星碎片
    materials: [], // 统一素材库存（herb/ore/liquid/core/special）
    // 丹药沉淀与系统加成
    permanentBonuses: { attack: 0, health: 0, defense: 0, speed: 0 }, // 永久属性加成（洗髓/锻骨丹）
    breakthroughBonus: 0, // 突破成功率加成（如 0.1 = +10%，下次突破消耗）
    enhanceBonus: 0, // 装备强化成功率加成（下次强化消耗）
    reforgeSafeCharges: 0, // 洗练保底次数（定灵丹，洗练时不降属性）
    battlePills: [], // 战斗中可使用的丹药（疗伤/解厄），每项 {uid,type,value,...}
    pillEffects: [], // 临时增益（悟道丹 expGain / 寻宝丹 dropRate，带 expiry）
    items: [], // 物品库存
    artifacts: [], // 法宝装备
    // 装备栏位
    equippedArtifacts: {
      weapon: null, // 武器
      head: null, // 头部
      body: null, // 衣服
      legs: null, // 裤子
      feet: null, // 鞋子
      shoulder: null, // 肩甲
      hands: null, // 手套
      wrist: null, // 护腕
      necklace: null, // 项链
      ring1: null, // 戒指1
      ring2: null, // 戒指2
      belt: null, // 腰带
      artifact: null // 法宝
    },
    // 装备加成属性
    artifactBonuses: {
      // 基础属性加成
      attack: 0,
      health: 0,
      defense: 0,
      speed: 0,
      // 战斗属性加成
      critRate: 0,
      comboRate: 0,
      counterRate: 0,
      stunRate: 0,
      dodgeRate: 0,
      vampireRate: 0,
      // 抗性加成
      critResist: 0,
      comboResist: 0,
      counterResist: 0,
      stunResist: 0,
      dodgeResist: 0,
      vampireResist: 0,
      // 特殊属性加成
      healBoost: 0,
      critDamageBoost: 0,
      critDamageReduce: 0,
      finalDamageBoost: 0,
      finalDamageReduce: 0,
      combatBoost: 0,
      resistanceBoost: 0,
      // 修炼相关加成
      cultivationRate: 1,
      spiritRate: 1
    },
    // 统计数据
    totalCultivationTime: 0, // 总修炼时间
    breakthroughCount: 0, // 突破次数
    explorationCount: 0, // 探索次数
    itemsFound: 0, // 获得物品数量
    eventTriggered: 0, // 触发事件次数
    unlockedPillRecipes: 0, // 解锁丹方数量
    // 秘境相关数据
    dungeonDifficulty: 1, // 难度选择
    dungeonHighestFloor: 0, // 最高通关层数
    dungeonHighestFloor_2: 0, // 最高通关层数
    dungeonHighestFloor_5: 0, // 最高通关层数
    dungeonHighestFloor_10: 0, // 最高通关层数
    dungeonHighestFloor_100: 0, // 最高通关层数
    dungeonLastFailedFloor: 0, // 最后失败层数
    dungeonTotalRuns: 0, // 总探索次数
    dungeonBossKills: 0, // Boss击杀数
    dungeonEliteKills: 0, // 精英击杀数
    dungeonTotalKills: 0, // 总击杀数
    dungeonDeathCount: 0, // 死亡次数
    dungeonTotalRewards: 0, // 获得奖励次数
    // 自动出售相关设置
    autoSellQualities: [], // 选中的装备品质
    autoReleaseRarities: [], // 选中的灵宠品质
    // 心愿单相关设置
    wishlistEnabled: false, // 心愿单开关
    selectedWishEquipQuality: null,
    selectedWishPetRarity: null,
    // 成就与解锁项
    unlockedRealms: ['练气一层'], // 已解锁境界
    unlockedLocations: ['新手村'], // 已解锁地点
    unlockedSkills: [], // 已解锁功法
    completedAchievements: [], // 已完成成就
    beginnerRewardClaimed: false, // 是否已领取新手福利
    // 转生系统
    rebirthCount: 0, // 转生次数
    rebirthBonus: { // 转生加成
      attack: 0,
      health: 0,
      defense: 0,
      speed: 0,
      cultivationRate: 0,
      spiritRate: 0
    },
    // 挂机探索状态
    idleExploration: {
      isActive: false,
      zoneId: null,
      difficultyKey: null,
      startTime: 0,
      duration: 0, // 总时长(ms)
      encounterCount: 0,
      lastEncounterTime: 0,
      logs: [],
      stats: {
        victories: 0,
        defeats: 0,
        rewards: 0,
        spiritStones: 0,
        itemsFound: 0
      }
    },
    // 宗门系统
    sectMembers: [], // 宗门成员列表（最多100人）
    teamMembers: [], // 当前出战队伍（最多5人）
    maxSectSize: 100,
    maxTeamSize: 5
  }),
  getters: {
    // 获取灵宠的属性加成
    getPetBonus() {
      if (!this.activePet)
        return {
          attack: 0,
          defense: 0,
          health: 0,
          critRate: 0,
          comboRate: 0,
          counterRate: 0,
          stunRate: 0,
          dodgeRate: 0,
          vampireRate: 0,
          critResist: 0,
          comboResist: 0,
          counterResist: 0,
          stunResist: 0,
          dodgeResist: 0,
          vampireResist: 0,
          healBoost: 0,
          critDamageBoost: 0,
          critDamageReduce: 0,
          finalDamageBoost: 0,
          finalDamageReduce: 0,
          combatBoost: 0,
          resistanceBoost: 0
        }
      const qualityBonusMap = {
        divine: 0.15, // 神品基础加成15%
        celestial: 0.12, // 仙品基础加成12%
        mystic: 0.09, // 玄品基础加成9%
        spiritual: 0.06, // 灵品基础加成6%
        mortal: 0.03 // 凡品基础加成3%
      }
      const starBonusPerQuality = {
        divine: 0.02, // 神品每星+2%
        celestial: 0.01, // 仙品每星+1%
        mystic: 0.01, // 玄品每星+1%
        spiritual: 0.01, // 灵品每星+1%
        mortal: 0.01 // 凡品每星+1%
      }
      const baseBonus = qualityBonusMap[this.activePet.rarity] || 0
      const starBonus = (this.activePet.star || 0) * (starBonusPerQuality[this.activePet.rarity] || 0)
      const levelBonus = ((this.activePet.level || 1) - 1) * (baseBonus * 0.1)
      const totalBonus = baseBonus + starBonus + levelBonus
      const phase = Math.floor((this.activePet.star || 0) / 5)
      const phaseBonus = phase * (baseBonus * 0.5)
      const finalBonus = totalBonus + phaseBonus
      const combatBonus = finalBonus * 0.5
      return {
        attack: finalBonus,
        defense: finalBonus,
        health: finalBonus,
        critRate: combatBonus,
        comboRate: combatBonus,
        counterRate: combatBonus,
        stunRate: combatBonus,
        dodgeRate: combatBonus,
        vampireRate: combatBonus,
        critResist: combatBonus,
        comboResist: combatBonus,
        counterResist: combatBonus,
        stunResist: combatBonus,
        dodgeResist: combatBonus,
        vampireResist: combatBonus,
        healBoost: combatBonus,
        critDamageBoost: combatBonus,
        critDamageReduce: combatBonus,
        finalDamageBoost: combatBonus,
        finalDamageReduce: combatBonus,
        combatBoost: combatBonus,
        resistanceBoost: combatBonus
      }
    },
    buildStrength() {
      // 综合 Build：装备分 + 角色裸战力（含出战灵宠），并按修炼层级成长
      return calculateTotalBuild(this)
    },
    activeSetBonuses() {
      return getActiveSetBonuses(this.equippedArtifacts)
    },
    // 自然属性（含出战灵宠、不含装备）合并为单一映射，供属性面板对照展示
    getNaturalStats() {
      const merged = {}
      const groups = ['baseAttributes', 'combatAttributes', 'combatResistance', 'specialAttributes']
      groups.forEach(g => {
        const obj = this[g]
        if (obj) Object.entries(obj).forEach(([k, v]) => { merged[k] = (merged[k] || 0) + (Number(v) || 0) })
      })
      return merged
    },
    // 最终生效属性 = 自然属性 + 装备固定/百分比词条 + 套装激活加成
    getEffectiveStats() {
      // 务必拷贝！getNaturalStats 是带缓存的 getter，若直接引用并 mutate，会污染“自然属性”缓存，
      // 导致后续 getNaturalStats 读数被装备数值污染（出现 natAtk 异常偏高）。
      const merged = { ...this.getNaturalStats }
      const applyAffix = (stat, value, valueType) => {
        if (merged[stat] === undefined) return
        if (valueType === 'percent') merged[stat] = merged[stat] * (1 + value)
        else merged[stat] = merged[stat] + value
      }
      Object.values(this.equippedArtifacts || {}).forEach(eq => {
        if (!eq) return
        if (eq.stats) Object.entries(eq.stats).forEach(([st, v]) => applyAffix(st, v, 'flat'))
      })
      Object.values(this.equippedArtifacts || {}).forEach(eq => {
        if (!eq || !eq.affixes) return
        eq.affixes.forEach(a => applyAffix(a.stat, a.value, a.valueType))
      })
      // 套装激活加成（仅作用于已存在的属性键），最终属性 = 自然 + 装备 + 套装
      return applySetBonusStats(this.equippedArtifacts || {}, { ...merged })
    },
    // 兼容旧 UI：灵草即素材库中 kind==='herb' 的子集
    herbs() {
      return (this.materials || []).filter(m => m.kind === 'herb')
    },
    // 临时增益聚合（悟道丹修为加成 / 寻宝丹掉落加成），仅统计未过期项
    expBonus() {
      const now = Date.now()
      return (this.pillEffects || [])
        .filter(e => e.type === 'expGain' && e.endTime > now)
        .reduce((s, e) => s + (e.value || 0), 0)
    },
    dropBonus() {
      const now = Date.now()
      return (this.pillEffects || [])
        .filter(e => e.type === 'dropRate' && e.endTime > now)
        .reduce((s, e) => s + (e.value || 0), 0)
    }
  },
  actions: {
    // 更新HTML暗黑模式类
    updateHtmlDarkMode(isDarkMode) {
      const htmlEl = document.documentElement
      if (isDarkMode) {
        htmlEl.classList.add('dark')
      } else {
        htmlEl.classList.remove('dark')
      }
    },
    // 初始化玩家数据
    async initializePlayer() {
      try {
        const savedData = await GameDB.getData('playerData')
        if (savedData) {
          const decryptedData = decryptData(savedData)
          if (decryptedData && validateData(decryptedData)) {
            Object.assign(this.$state, decryptedData)
            // 迁移：旧版灵草库存并入统一素材库（kind='herb'），随后移除遗留 herbs 键
            if (Array.isArray(this.$state.herbs)) {
              if (!Array.isArray(this.materials)) this.materials = []
              for (const h of this.$state.herbs) {
                this.materials.push({
                  ...h,
                  kind: 'herb',
                  quality: h.quality || h.rarity || 'common',
                  source: h.source || 'legacy'
                })
              }
              delete this.$state.herbs
            }
            // 数据清理：移除被错误标记的混合数据
            // 1. type为'pet'但错误带有slot属性的物品（会被误判为装备）
            // 2. 名称像灵宠但格式错误的物品
            if (Array.isArray(this.items)) {
              const beforeCount = this.items.length
              this.items = this.items.filter(item => {
                if (!item) return false
                // 灵宠必须 type === 'pet' 且不能有 slot 属性
                if (item.type === 'pet') {
                  if (item.slot) {
                    console.warn('清理错误数据：type=pet 但带有 slot 属性的混合物品', item.name)
                    return false
                  }
                  return true
                }
                // 装备必须有 slot 或在 EQUIPMENT_SLOTS 中
                if (item.slot && EQUIPMENT_SLOTS.includes(item.slot)) return true
                if (item.type === 'equipment') return true
                // 资源类物品
                if (['spirit_stone', 'reinforce_stone', 'refinement_stone', 'pet_essence', 'pet_fragment'].includes(item.type)) return true
                console.warn('清理未知格式物品', item)
                return false
              })
              const removedCount = beforeCount - this.items.length
              if (removedCount > 0) {
                console.warn(`数据清理完成：移除了 ${removedCount} 个错误格式物品`)
              }
            }
          } else {
            console.error('存档数据验证失败，使用初始数据')
          }
        }
      } catch (error) {
        console.error('加载存档失败:', error)
      }
      // 重置非持久化的保存相关状态，避免加载旧计时器 ID 等无效值
      this.saveTimer = null
      this.pendingSave = false
      this.lastSaveTime = 0
      // 初始化主题设置
      this.isDarkMode = localStorage.getItem('darkMode') === 'true'
      // 同步暗黑模式状态到HTML标签
      this.updateHtmlDarkMode(this.isDarkMode)
      // 初始化GM模式设置
      const gmMode = localStorage.getItem('isGMMode')
      if (gmMode !== null) {
        this.isGMMode = gmMode === 'true'
      }
      // 从干净基线重算派生属性（装备/套装/灵宠），根治「存档重载后加成重复叠加」
      this.recomputeAttributes()
    },
    // 创建新玩家数据
    initNewPlayer() {
      this.name = '无名修士'
      this.level = 1
      this.realm = '练气期一层'
      this.cultivation = 0
      this.maxCultivation = 100
      this.spirit = 0
      this.spiritRate = 1
      this.luck = 1
      this.cultivationRate = 1
      this.herbRate = 1
      this.alchemyRate = 1
      this.spiritStones = 0
      this.petEssence = 0
      this.isNewPlayer = false
    },
    // 切换暗黑模式
    toggle() {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem('darkMode', this.isDarkMode)
      // 更新html标签的class
      this.updateHtmlDarkMode(this.isDarkMode)
      this.queueSave()
    },
    // 保存数据到IndexedDB
    async saveData() {
      // 清除待保存计时器，避免重复保存
      if (this.saveTimer) {
        clearTimeout(this.saveTimer)
        this.saveTimer = null
      }
      this.pendingSave = false
      const encryptedData = encryptData(this.$state)
      if (encryptedData) {
        try {
          await GameDB.setData('playerData', encryptedData)
          this.lastSaveTime = Date.now()
        } catch (error) {
          console.error('数据保存失败:', error)
        }
      } else {
        console.error('数据加密失败')
      }
    },
    // 防抖保存：高频操作使用此接口，避免每次调用都加密写入 IndexedDB
    // 连续活动时会合并保存，但最多 10 秒强制保存一次，防止进度丢失
    queueSave() {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer)
      }
      this.pendingSave = true
      const now = Date.now()
      const maxInterval = 10000
      const debounceDelay = 5000
      const delay = Math.max(debounceDelay, this.lastSaveTime + maxInterval - now)
      this.saveTimer = setTimeout(() => {
        this.saveData()
      }, delay)
    },
    // 导出存档数据
    async exportData() {
      try {
        const data = await GameDB.getData('playerData')
        return data
      } catch (error) {
        console.error('导出存档失败:', error)
        throw error
      }
    },
    // 导入存档数据
    async importData(encryptedData) {
      try {
        await GameDB.setData('playerData', encryptedData)
        this.$reset()
        await this.initializePlayer()
      } catch (error) {
        console.error('导入存档失败:', error)
        throw error
      }
    },
    // 清除存档数据
    async clearData() {
      try {
        await GameDB.setData('playerData', null)
      } catch (error) {
        console.error('清除存档失败:', error)
        throw error
      }
    },
    // === 多存档槽位功能 ===
    // 获取存档槽位列表
    async getSaveSlots() {
      const slots = []
      for (let i = 1; i <= 5; i++) {
        const slotKey = `saveSlot_${i}`
        const encryptedData = await GameDB.getData(slotKey)
        if (encryptedData) {
          try {
            const decryptedData = decryptData(encryptedData)
            slots.push({
              slot: i,
              name: decryptedData?.name || `修士${i}`,
              level: decryptedData?.level || 1,
              realm: decryptedData?.realm || '未知',
              saveTime: decryptedData?._saveTime || null
            })
          } catch {
            slots.push({ slot: i, name: '存档损坏', level: 0, realm: '未知', saveTime: null })
          }
        } else {
          slots.push({ slot: i, name: null, level: 0, realm: '', saveTime: null })
        }
      }
      return slots
    },
    // 保存到指定槽位
    async saveToSlot(slot) {
      try {
        // 先保存当前数据到主存档
        await this.saveData()
        const currentData = await GameDB.getData('playerData')
        if (!currentData) {
          throw new Error('当前没有可保存的存档数据')
        }
        const decryptedData = decryptData(currentData)
        if (!decryptedData) {
          throw new Error('数据解密失败')
        }
        decryptedData._saveTime = Date.now()
        const encryptedSlotData = encryptData(decryptedData)
        await GameDB.setData(`saveSlot_${slot}`, encryptedSlotData)
        this.currentSlot = slot
        return true
      } catch (error) {
        console.error('保存到槽位失败:', error)
        throw error
      }
    },
    // 保存到"当前所在槽位"：底部存档按钮与抽奖后自动存档均走此接口
    // 若尚未指定槽位，则默认写入槽位 1
    async saveToCurrentSlot() {
      const target = this.currentSlot ?? 1
      await this.saveToSlot(target)
      return target
    },
    // 从指定槽位加载
    async loadFromSlot(slot) {
      try {
        const encryptedSlotData = await GameDB.getData(`saveSlot_${slot}`)
        if (!encryptedSlotData) {
          throw new Error('该槽位没有存档')
        }
        const decryptedData = decryptData(encryptedSlotData)
        if (!decryptedData || !validateData(decryptedData)) {
          throw new Error('存档数据损坏或无效')
        }
        // 删除非游戏数据
        delete decryptedData._saveTime
        // 写入主存档
        const encryptedData = encryptData(decryptedData)
        await GameDB.setData('playerData', encryptedData)
        // 重新初始化
        this.$reset()
        await this.initializePlayer()
        this.currentSlot = slot
        return true
      } catch (error) {
        console.error('从槽位加载失败:', error)
        throw error
      }
    },
    // 删除指定槽位
    async deleteSlot(slot) {
      try {
        await GameDB.setData(`saveSlot_${slot}`, null)
        return true
      } catch (error) {
        console.error('删除槽位失败:', error)
        throw error
      }
    },
    // 获取灵力
    gainSpirit(amount) {
      this.spirit += amount * this.spiritRate
      this.spirit = Math.min(this.spirit, this.maxSpirit)
      this.queueSave()
    },
    // 恢复灵力（2小时回满上限），同时被动获取修为
    regenerateSpirit() {
      const now = Date.now()
      const elapsedMs = now - (this.lastSpiritUpdate || now)
      // 2小时 = 7200000ms 回满 maxSpirit
      const regenRate = this.maxSpirit / 7200000 // 每毫秒恢复量
      const recovered = elapsedMs * regenRate * this.spiritRate
      if (recovered > 0) {
        this.spirit = Math.min(this.maxSpirit, this.spirit + recovered)
        this.lastSpiritUpdate = now
        // 被动修为增长：每10秒根据等级和Build强度自动获得修为
        // 约每真实1小时可获得相当于手动修炼3-5次的修为量
        const passiveCultRate = Math.max(1, Math.floor(this.level * 0.8 + this.buildStrength * 0.00001))
        const passiveGain = Math.floor(elapsedMs / 10000) * passiveCultRate
        if (passiveGain > 0) {
          this.cultivate(passiveGain)
        }
        this.queueSave()
      }
      return recovered
    },
    // 修炼增加修为
    cultivate(amount) {
      const numAmount = Number(amount)
      if (!Number.isFinite(numAmount)) return
      this.cultivation = Number(this.cultivation) || 0
      // 悟道丹（expGain）提升修为获取
      const bonus = 1 + (this.expBonus || 0)
      this.cultivation += numAmount * bonus
      this.totalCultivationTime += 1 // 增加修炼时间统计
      if (this.cultivation >= this.maxCultivation) {
        this.tryBreakthrough()
      }
      this.queueSave()
    },
    // 尝试突破
    tryBreakthrough() {
      // 境界等级对应的境界名称和修为上限
      const realmsLength = getRealmLength()
      // 检查是否可以突破到下一个境界
      if (this.level < realmsLength) {
        // 突破成功率 = 基础(随境界缓降，保底 0.6) + 丹药加成(渡厄丹)
        const baseChance = Math.max(0.6, 1 - (this.level - 1) * 0.015)
        const chance = Math.min(1, baseChance + this.breakthroughBonus)
        if (Math.random() > chance) {
          // 突破受阻：修为已满但不重置，下次修炼将再次尝试（无惩罚）
          return false
        }
        const nextRealm = getRealmName(this.level)
        // 更新境界信息
        this.level += 1
        this.realm = nextRealm.name // 使用完整的境界名称（如：练气一层）
        this.maxCultivation = nextRealm.maxCultivation
        this.cultivation = 0 // 重置修为值
        this.breakthroughCount += 1 // 增加突破次数
        this.breakthroughBonus = 0 // 消耗一次突破加成（渡厄丹为"下次突破"保险）
        // 解锁新境界
        if (!this.unlockedRealms.includes(nextRealm.name)) {
          this.unlockedRealms.push(nextRealm.name)
        }
        // 突破奖励
        this.spirit += 100 * this.level // 获得灵力奖励
        this.spiritRate *= 1.2 // 提升灵力获取倍率
        this.queueSave()
        return true
      }
      return false
    },
    // 转生：重置等级但获得永久加成
    rebirth() {
      if (this.level < 50) return { success: false, message: '需达到50级才能转生' }

      const count = this.rebirthCount + 1
      // 永久加成
      const bonus = {
        attack: Math.floor(5 * count),
        health: Math.floor(50 * count),
        defense: Math.floor(3 * count),
        speed: Math.floor(2 * count),
        cultivationRate: 0.1 * count,
        spiritRate: 0.1 * count
      }

      this.rebirthCount = count
      this.rebirthBonus = bonus
      // 重置等级和修为
      this.level = 1
      this.realm = getRealmName(1).name
      this.cultivation = 0
      this.maxCultivation = getRealmName(1).maxCultivation
      // 应用永久加成到基础属性
      this.baseAttributes.attack = 10 + bonus.attack
      this.baseAttributes.health = 100 + bonus.health
      this.baseAttributes.defense = 5 + bonus.defense
      this.baseAttributes.speed = 10 + bonus.speed
      // 提升倍率
      this.spiritRate = 1 + bonus.spiritRate
      this.cultivationRate = 1 + bonus.cultivationRate
      // 保留灵石和物品
      this.queueSave()
      return { success: true, message: `转生成功！当前为第${count}世，获得永久属性加成` }
    },
    // 获得物品
    gainItem(item) {
      this.items.push(item)
      this.itemsFound++ // 增加获得物品统计
      this.queueSave()
    },
    // 获得单个素材（统一素材模型：{id,name,kind,quality,...}）
    gainMaterial(material) {
      if (!material) return
      if (!Array.isArray(this.materials)) this.materials = []
      this.materials.push(material)
      this.queueSave()
    },
    // 批量获得素材
    gainMaterials(arr) {
      if (!Array.isArray(arr) || arr.length === 0) return
      if (!Array.isArray(this.materials)) this.materials = []
      this.materials.push(...arr)
      this.queueSave()
    },
    // 出售素材（按种类+id，指定数量）
    sellMaterial(kind, materialId, count) {
      if (!Array.isArray(this.materials)) return { success: false, message: '没有素材' }
      let totalCount = 0
      for (const m of this.materials) {
        if (m.kind === kind && m.id === materialId) totalCount++
      }
      if (totalCount === 0) return { success: false, message: '没有该素材' }
      const sellCount = Math.min(count, totalCount)
      let pricePerUnit = 0
      const priceMap = { common: 5, uncommon: 10, rare: 25, epic: 60, legendary: 150, mythic: 400 }
      for (const m of this.materials) {
        if (m.kind === kind && m.id === materialId) {
          pricePerUnit = priceMap[m.quality] || 5
          break
        }
      }
      let removed = 0
      for (let i = this.materials.length - 1; i >= 0 && removed < sellCount; i--) {
        if (this.materials[i].kind === kind && this.materials[i].id === materialId) {
          this.materials.splice(i, 1)
          removed++
        }
      }
      const totalPrice = sellCount * pricePerUnit
      this.spiritStones += totalPrice
      this.queueSave()
      return { success: true, message: `出售 ${sellCount} 个，获得 ${totalPrice} 灵石`, sellCount, totalPrice }
    },
    // 清理过期临时增益
    pruneExpiredEffects() {
      const now = Date.now()
      if (Array.isArray(this.pillEffects)) {
        this.pillEffects = this.pillEffects.filter(e => (e.endTime || 0) > now)
      }
    },
    // 应用丹药效果（按 baseEffect.type 分支）
    applyPillEffect(effect) {
      if (!effect) return { success: false, message: '无效丹药' }
      const now = Date.now()
      this.pruneExpiredEffects()
      switch (effect.type) {
        case 'permanentStat': {
          // 永久提升基础属性并沉淀
          const stat = effect.stat
          const val = Math.round(effect.value)
          if (this.permanentBonuses[stat] !== undefined) this.permanentBonuses[stat] += val
          if (this.baseAttributes[stat] !== undefined) this.baseAttributes[stat] += val
          return { success: true, message: `永久提升${stat} +${val}` }
        }
        case 'breakthroughRate':
          this.breakthroughBonus = Math.min(0.9, this.breakthroughBonus + effect.value)
          return { success: true, message: `突破成功率 +${Math.round(effect.value * 100)}%` }
        case 'enhanceRate':
          this.enhanceBonus = Math.min(0.9, this.enhanceBonus + effect.value)
          return { success: true, message: `强化成功率 +${Math.round(effect.value * 100)}%` }
        case 'reforgeSafe':
          this.reforgeSafeCharges += Math.max(1, Math.round(effect.value))
          return { success: true, message: `获得洗练保底 ${Math.max(1, Math.round(effect.value))} 次` }
        case 'healBattle':
        case 'cleanse':
          // 进入战斗丹药队列，由战斗界面消耗
          this.battlePills.push({ ...effect, uid: `${effect.type}_${now}_${Math.floor(Math.random() * 1e6)}`, used: false })
          return { success: true, message: effect.type === 'healBattle' ? '疗伤丹已就绪（战斗中可使用）' : '解厄丹已就绪（战斗中可使用）' }
        case 'expGain':
        case 'dropRate':
          // 临时增益，带过期时间
          this.pillEffects.push({ ...effect, startTime: now, endTime: now + (effect.duration || 600) * 1000 })
          return { success: true, message: effect.type === 'expGain' ? '修为获取提升' : '探索掉落提升' }
        default:
          // 原限时 buff 逻辑
          this.activeEffects.push({ ...effect, startTime: now, endTime: now + (effect.duration || 0) * 1000 })
          this.activeEffects = this.activeEffects.filter(e => e.endTime > now)
          return { success: true, message: '使用丹药成功' }
      }
    },
    // 战斗界面消耗一枚战斗丹药，返回其效果供战斗逻辑使用
    consumeBattlePill(uid) {
      if (!Array.isArray(this.battlePills)) return null
      const idx = this.battlePills.findIndex(p => p.uid === uid)
      if (idx === -1) return null
      const p = this.battlePills[idx]
      this.battlePills.splice(idx, 1)
      this.queueSave()
      return p
    },
    // 使用物品（丹药或灵宠）
    useItem(item) {
      if (item.type === 'pill') {
        return this.usePill(item)
      } else if (item.type === 'pet') {
        return this.usePet(item)
      }
      return { success: false, message: '无法使用该物品' }
    },
    // 出售装备（获得灵石，按装备评分折价）
    async sellEquipment(equipment) {
      const index = this.items.findIndex(i => i.id === equipment.id)
      if (index === -1) {
        return { success: false, message: '装备不存在' }
      }
      const score = calculateEquipmentScore(equipment) || 0
      const gained = Math.max(1, Math.round(score * SELL_DISCOUNT_RATE))
      this.spiritStones += gained
      this.items.splice(index, 1)
      this.queueSave()
      return { success: true, message: `成功出售装备，获得 ${gained} 灵石（评分 ${score}）` }
    },
    // 分解装备（获得强化石 / 洗练石）
    async disassembleEquipment(equipment) {
      const index = this.items.findIndex(i => i.id === equipment.id)
      if (index === -1) {
        return { success: false, message: '装备不存在' }
      }
      const q = equipment.quality || 'common'
      const reinforce = QUALITY_STONE_MAP[q] || 1
      const refine = q === 'common' ? 0 : Math.max(1, (QUALITY_STONE_MAP[q] || 1) - 1)
      this.reinforceStones += reinforce
      this.refinementStones += refine
      this.items.splice(index, 1)
      this.queueSave()
      const parts = [`强化石×${reinforce}`]
      if (refine > 0) parts.push(`洗练石×${refine}`)
      return { success: true, message: `分解成功，获得 ${parts.join('、')}` }
    },
    // 批量出售装备（按当前筛选，统一折算为灵石）
    async batchSellEquipments(quality = null, equipmentType = null) {
      const toSell = this.items.filter(item => {
        if (!isEquipmentItem(item)) return false
        if (equipmentType && equipmentType !== 'all' && item.slot !== equipmentType) return false
        if (quality && item.quality !== quality) return false
        return true
      })
      if (toSell.length === 0) {
        return { success: false, message: '没有可出售的装备' }
      }
      let total = 0
      toSell.forEach(eq => {
        total += Math.max(1, Math.round((calculateEquipmentScore(eq) || 0) * SELL_DISCOUNT_RATE))
      })
      this.spiritStones += total
      const ids = new Set(toSell.map(e => e.id))
      this.items = this.items.filter(i => !ids.has(i.id))
      this.queueSave()
      return {
        success: true,
        message: `成功出售 ${toSell.length} 件装备，获得 ${total} 灵石`
      }
    },
    // 使用丹药
    usePill(pill) {
      const res = this.applyPillEffect(pill.effect)
      // 移除已使用的丹药
      const index = this.items.findIndex(i => i.id === pill.id)
      if (index > -1) {
        this.items.splice(index, 1)
        this.pillsConsumed++
      }
      this.queueSave()
      return { success: true, message: res.message || '使用丹药成功' }
    },
    // 炼制丹药
    craftPill(recipeId) {
      const recipe = pillRecipes.find(r => r.id === recipeId)
      if (!recipe) return { success: false, message: '丹方不存在' }
      // 尝试炼制丹药（以 player.materials 为材料来源）
      const result = tryCreatePill(
        recipe,
        this.materials,
        this,
        this.pillFragments[recipe.id] || 0,
        this.luck * this.alchemyRate
      )
      if (result.success) {
        // 消耗材料（按 kind+id 精确扣减）
        for (const material of recipe.materials) {
          const kind = material.kind || 'herb'
          const mid = material.id || material.herb
          let remaining = material.count
          for (let i = this.materials.length - 1; i >= 0 && remaining > 0; i--) {
            if (this.materials[i].kind === kind && this.materials[i].id === mid) {
              this.materials.splice(i, 1)
              remaining--
            }
          }
        }
        // 计算丹药效果
        const effect = calculatePillEffect(recipe, this.level)
        // 添加到物品栏
        this.items.push({
          id: `${recipe.id}_${Date.now()}`,
          name: recipe.name,
          type: 'pill',
          description: recipe.description,
          effect: effect
        })
        this.pillsCrafted++
        this.queueSave()
      }
      return result
    },
    // 使用灵宠（出战/召回）
    usePet(pet) {
      // 如果当前没有出战灵宠，直接出战新灵宠
      if (!this.activePet) {
        return this.deployPet(pet)
      }
      // 如果点击的是当前出战灵宠，则召回
      if (this.activePet.id === pet.id) {
        return this.recallPet()
      }
      // 如果点击的是其他灵宠，先召回当前灵宠，再出战新灵宠
      this.recallPet()
      return this.deployPet(pet)
    },
    // 幻灵结晶兑换（50灵石 = 1幻灵结晶）
    exchangeCrystals(amount) {
      const cost = amount * 50
      if (this.spiritStones < cost) {
        return { success: false, message: `灵石不足，需要 ${cost} 灵石` }
      }
      this.spiritStones -= cost
      this.phantomCrystals += amount
      this.queueSave()
      return { success: true, message: `成功兑换 ${amount} 幻灵结晶` }
    },
    // 召回灵宠
    recallPet() {
      if (!this.activePet) {
        return { success: false, message: '当前没有出战的灵宠' }
      }
      // 先解除出战，再从干净基线重算（移除灵宠加成）
      this.activePet = null
      this.resetPetBonuses()
      this.queueSave()
      return { success: true, message: '召回成功' }
    },
    // 出战灵宠
    deployPet(pet) {
      // 如果已有灵宠出战，先召回
      if (this.activePet) {
        this.recallPet()
      }
      // 出战新灵宠
      this.activePet = pet
      // 应用灵宠属性加成
      this.applyPetBonuses()
      this.queueSave()
      return { success: true, message: '出战成功' }
    },
    // 重置灵宠属性加成（统一走 recomputeAttributes，单一来源）
    resetPetBonuses() {
      this.recomputeAttributes()
    },
    // 应用灵宠属性加成（统一走 recomputeAttributes，单一来源）
    applyPetBonuses() {
      this.recomputeAttributes()
    },
    // 穿上装备
    // 重要：装备属性【不再写回】baseAttributes / combatAttributes 等“自然属性”。
    // 自然属性仅由“角色基础 + 出战灵宠缩放”构成；装备/套装效果统一由
    // getEffectiveStats 依据 equippedArtifacts 实时聚合（自然 + 装备固定/百分比词条 + 套装激活）。
    // 这样既能保证「基础/最终/加成」对照面板正确，又彻底杜绝装备/套装数值污染自然属性导致的重复叠加。
    equipArtifact(artifact, slot) {
      // 检查境界要求
      if (artifact.requiredRealm && this.level < artifact.requiredRealm) {
        return { success: false, message: '境界不足，无法装备此装备' }
      }
      // 先卸下当前装备
      if (this.equippedArtifacts[slot]) {
        this.unequipArtifact(slot)
      }
      // 从背包中移除装备
      const index = this.items.findIndex(item => item.id === artifact.id)
      if (index !== -1) {
        this.items.splice(index, 1)
      }
      // 穿上新装备（只登记到槽位，数值在 getEffectiveStats 中聚合）
      this.equippedArtifacts[slot] = artifact
      // 统一从干净基线重算（装备+套装+灵宠），避免逐项烘焙导致的叠加/漂移
      this.recomputeAttributes()
      this.queueSave()
      return { success: true, message: '装备成功' }
    },
    // 依据已装备物品，重新汇总“装备固定加成”镜像（attack/health/defense/speed 的平面值）。
    // 仅保留为兼容字段（个别旧逻辑/外部读取），最终属性一律以 getEffectiveStats 为准。
    recomputeArtifactBonuses() {
      const flatKeys = ['attack', 'health', 'defense', 'speed']
      const bonus = {}
      flatKeys.forEach(k => { bonus[k] = 0 })
      Object.values(this.equippedArtifacts || {}).forEach(eq => {
        if (!eq) return
        if (eq.stats) {
          Object.entries(eq.stats).forEach(([st, v]) => {
            if (st in bonus) bonus[st] += Number(v) || 0
          })
        }
        if (eq.affixes) {
          eq.affixes.forEach(a => {
            if (a.valueType !== 'percent' && (a.stat in bonus)) bonus[a.stat] += Number(a.value) || 0
          })
        }
      })
      this.artifactBonuses = { ...this.artifactBonuses, ...bonus }
    },
    // 一键装备最强装备：遍历所有槽位，自动装备背包中评分最高且满足境界要求的装备
    autoEquipBest() {
      const slots = ['weapon', 'head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'necklace', 'ring1', 'ring2', 'belt', 'artifact']
      const equipped = []
      let total = 0
      for (const slot of slots) {
        // 找到该槽位下所有可装备物品（按 slot 字段匹配，兼容 type=槽位 与 type='equipment' 两种形态）
        const candidates = this.items.filter(item => {
          if (!isEquipmentItem(item)) return false
          const itemSlot = item.slot || item.type
          if (itemSlot !== slot) return false
          // 满足境界要求
          if (item.requiredRealm && this.level < item.requiredRealm) return false
          return true
        })
        if (candidates.length === 0) continue
        // 按评分排序，取最高的
        candidates.sort((a, b) => (calculateEquipmentScore(b) || 0) - (calculateEquipmentScore(a) || 0))
        const best = candidates[0]
        // 如果当前已装备的评分更低，则替换（否则也替换，因为用户明确点了"一键装备"）
        this.equipArtifact(best, slot)
        equipped.push(`${this.equipmentSlotNames[slot] || slot}：${best.name}（${calculateEquipmentScore(best)}分）`)
        total++
      }
      this.queueSave()
      if (total === 0) {
        return { success: false, message: '没有可装备的装备' }
      }
      return { success: true, message: `已一键装备 ${total} 件最强装备`, equipped }
    },
    // 装备槽位中文名映射（供 autoEquipBest 使用）
    equipmentSlotNames: { weapon: '武器', head: '头部', body: '衣服', legs: '裤子', feet: '鞋子', shoulder: '肩甲', hands: '手套', wrist: '护腕', necklace: '项链', ring1: '戒指1', ring2: '戒指2', belt: '腰带', artifact: '法宝' },
    // 卸下装备：只把物品退回背包、清空槽位。自然属性本就不含装备数值，无需任何回退。
    unequipArtifact(slot) {
      const artifact = this.equippedArtifacts[slot]
      if (artifact) {
        // 从装备栏移除并放回背包，再从干净基线重算
        this.items.push(artifact)
        this.equippedArtifacts[slot] = null
        this.recomputeAttributes()
        this.queueSave()
        return true
      }
      return false
    },
    // 从干净基线重算全部派生属性：裸属性 → 装备(基础+词条) → 套装 → 灵宠
    // 取代逐项烘焙 + __setBonusApplied 非持久化追踪，根治「存档重载后套装加成重复叠加」与浮点漂移
    recomputeAttributes() {
      const INTRINSIC = { attack: 10, health: 100, defense: 5, speed: 10 }
      const intrinsic = {
        attack: INTRINSIC.attack + (this.rebirthBonus.attack || 0) + (this.permanentBonuses.attack || 0),
        health: INTRINSIC.health + (this.rebirthBonus.health || 0) + (this.permanentBonuses.health || 0),
        defense: INTRINSIC.defense + (this.rebirthBonus.defense || 0) + (this.permanentBonuses.defense || 0),
        speed: INTRINSIC.speed + (this.rebirthBonus.speed || 0) + (this.permanentBonuses.speed || 0)
      }
      // 1) 裸身基线（无装备·无套装·含出战灵宠）——先独立计算并保存，供面板对比展示
      const nakedBase = { attack: intrinsic.attack, health: intrinsic.health, defense: intrinsic.defense, speed: intrinsic.speed }
      const nakedCombat = {}
      const nakedResist = {}
      Object.keys(this.combatAttributes).forEach(k => { nakedCombat[k] = 0 })
      Object.keys(this.combatResistance).forEach(k => { nakedResist[k] = 0 })
      if (this.activePet && this.activePet.combatAttributes) {
        const pb = this.activePet.combatAttributes
        nakedBase.attack += pb.attack || 0
        nakedBase.defense += pb.defense || 0
        nakedBase.health += pb.health || 0
        nakedBase.speed += pb.speed || 0
        Object.keys(nakedCombat).forEach(k => { nakedCombat[k] += (pb[k] || 0) })
        Object.keys(nakedResist).forEach(k => { nakedResist[k] += (pb[k] || 0) })
      }
      this.nakedBaseAttributes = { ...nakedBase }
      this.nakedCombatAttributes = { ...nakedCombat }
      this.nakedCombatResistance = { ...nakedResist }

      // 2) 最终值 = 裸身基线 + 装备 + 套装；先以裸身基线为起点
      this.baseAttributes = { ...nakedBase }
      this.combatAttributes = { ...nakedCombat }
      this.combatResistance = { ...nakedResist }
      Object.keys(this.specialAttributes).forEach(k => { this.specialAttributes[k] = 0 })
      Object.assign(this.artifactBonuses, {
        attack: 0, health: 0, defense: 0, speed: 0,
        critRate: 0, comboRate: 0, counterRate: 0, stunRate: 0, dodgeRate: 0, vampireRate: 0,
        critResist: 0, comboResist: 0, counterResist: 0, stunResist: 0, dodgeResist: 0, vampireResist: 0,
        healBoost: 0, critDamageBoost: 0, critDamageReduce: 0, finalDamageBoost: 0, finalDamageReduce: 0,
        combatBoost: 0, resistanceBoost: 0, cultivationRate: 1, spiritRate: 1
      })
      // 3) 装备：基础属性 + 词条
      Object.values(this.equippedArtifacts).forEach(artifact => {
        if (!artifact) return
        if (artifact.stats) {
          Object.entries(artifact.stats).forEach(([key, value]) => {
            if (this.artifactBonuses[key] === undefined) return
            this.artifactBonuses[key] += value
            if (key in this.baseAttributes) this.baseAttributes[key] += value
            else if (key in this.combatAttributes) this.combatAttributes[key] = Math.min(1, this.combatAttributes[key] + value)
            else if (key in this.combatResistance) this.combatResistance[key] = Math.min(1, this.combatResistance[key] + value)
            else if (key in this.specialAttributes) this.specialAttributes[key] += value
          })
        }
        if (artifact.affixes && artifact.affixes.length) {
          artifact.affixes.forEach(affix => {
            const key = affix.stat
            const value = affix.value
            if (affix.valueType === 'percent') {
              if (key in this.baseAttributes) {
                const amt = this.baseAttributes[key] * affix.value
                this.baseAttributes[key] += amt
                if (this.artifactBonuses[key] !== undefined) this.artifactBonuses[key] += amt
              } else if (key in this.combatAttributes) {
                this.combatAttributes[key] = Math.min(1, this.combatAttributes[key] + affix.value)
                if (this.artifactBonuses[key] !== undefined) this.artifactBonuses[key] += affix.value
              } else if (key in this.combatResistance) {
                this.combatResistance[key] = Math.min(1, this.combatResistance[key] + affix.value)
                if (this.artifactBonuses[key] !== undefined) this.artifactBonuses[key] += affix.value
              } else if (key in this.specialAttributes) {
                this.specialAttributes[key] += affix.value
                if (this.artifactBonuses[key] !== undefined) this.artifactBonuses[key] += affix.value
              }
            } else {
              if (this.artifactBonuses[key] !== undefined) {
                this.artifactBonuses[key] += value
                if (key in this.baseAttributes) this.baseAttributes[key] += value
                else if (key in this.combatAttributes) this.combatAttributes[key] = Math.min(1, this.combatAttributes[key] + value)
                else if (key in this.combatResistance) this.combatResistance[key] = Math.min(1, this.combatResistance[key] + value)
                else if (key in this.specialAttributes) this.specialAttributes[key] += value
              }
            }
          })
        }
      })
      // 4) 套装加成
      const activeSets = getActiveSetBonuses(this.equippedArtifacts)
      const setList = []
      activeSets.forEach(setInfo => setInfo.bonuses.forEach(b => setList.push(b)))
      setList.forEach(bonus => {
        const key = bonus.stat
        if (bonus.valueType === 'percent') {
          if (key in this.baseAttributes) {
            const amt = this.baseAttributes[key] * bonus.value
            this.baseAttributes[key] += amt
            if (this.artifactBonuses[key] !== undefined) this.artifactBonuses[key] += amt
          } else if (key in this.combatAttributes) {
            this.combatAttributes[key] = Math.min(1, this.combatAttributes[key] + bonus.value)
            if (this.artifactBonuses[key] !== undefined) this.artifactBonuses[key] += bonus.value
          } else if (key in this.combatResistance) {
            this.combatResistance[key] = Math.min(1, this.combatResistance[key] + bonus.value)
            if (this.artifactBonuses[key] !== undefined) this.artifactBonuses[key] += bonus.value
          } else if (key in this.specialAttributes) {
            this.specialAttributes[key] += bonus.value
            if (this.artifactBonuses[key] !== undefined) this.artifactBonuses[key] += bonus.value
          }
        } else {
          if (this.artifactBonuses[key] !== undefined) {
            this.artifactBonuses[key] += bonus.value
            if (key in this.baseAttributes) this.baseAttributes[key] += bonus.value
            else if (key in this.combatAttributes) this.combatAttributes[key] = Math.min(1, this.combatAttributes[key] + bonus.value)
            else if (key in this.combatResistance) this.combatResistance[key] = Math.min(1, this.combatResistance[key] + bonus.value)
            else if (key in this.specialAttributes) this.specialAttributes[key] += bonus.value
          }
        }
      })
      // 5) 出战灵宠已并入裸身基线（步骤1），此处不再重复叠加，避免双重计算
    },
    // 兼容旧调用点：重算套装加成（现由 recomputeAttributes 统一处理）
    recalcSetBonuses() {
      this.recomputeAttributes()
    },
    // 获取装备总加成
    getArtifactBonus(type) {
      return this.artifactBonuses[type] || 1
    },
    // 开始挂机探索
    startIdleExploration(zoneId, difficultyKey, durationMinutes) {
      this.idleExploration = {
        isActive: true,
        zoneId,
        difficultyKey,
        startTime: Date.now(),
        duration: durationMinutes * 60 * 1000,
        encounterCount: 0,
        lastEncounterTime: Date.now(),
        logs: [],
        stats: {
          victories: 0,
          defeats: 0,
          rewards: 0,
          spiritStones: 0,
          itemsFound: 0
        }
      }
      this.queueSave()
    },
    // 更新挂机探索状态
    updateIdleExploration(data) {
      if (!this.idleExploration.isActive) return
      this.idleExploration = {
        ...this.idleExploration,
        ...data
      }
      this.queueSave()
    },
    // 停止挂机探索
    stopIdleExploration() {
      this.idleExploration.isActive = false
      this.queueSave()
    },
    // 获取挂机剩余时间
    getIdleRemainingTime() {
      if (!this.idleExploration.isActive) return 0
      const elapsed = Date.now() - this.idleExploration.startTime
      return Math.max(0, this.idleExploration.duration - elapsed)
    },
    // 检查挂机是否完成
    isIdleExplorationComplete() {
      if (!this.idleExploration.isActive) return true
      return Date.now() - this.idleExploration.startTime >= this.idleExploration.duration
    },
    // 获得丹方残页
    gainPillFragment(recipeId) {
      if (!this.pillFragments[recipeId]) {
        this.pillFragments[recipeId] = 0
      }
      this.pillFragments[recipeId]++
      // 检查是否可以合成完整丹方
      const recipe = pillRecipes.find(r => r.id === recipeId)
      if (recipe && this.pillFragments[recipeId] >= recipe.fragmentsNeeded) {
        this.pillFragments[recipeId] -= recipe.fragmentsNeeded
        if (!this.pillRecipes.includes(recipeId)) {
          this.pillRecipes.push(recipeId)
          this.unlockedPillRecipes++
        }
      }
      this.queueSave()
    },
    // 炼制丹药
    craftPill(recipeId) {
      const recipe = pillRecipes.find(r => r.id === recipeId)
      if (!recipe || !this.pillRecipes.includes(recipeId)) {
        return { success: false, message: '未掌握丹方' }
      }
      const fragments = this.pillFragments[recipeId] || 0
      const result = tryCreatePill(recipe, this.materials, this, fragments, this.luck * this.alchemyRate)
      if (result.success) {
        // 消耗材料（按 kind+id 精确扣减）
        recipe.materials.forEach(material => {
          const kind = material.kind || 'herb'
          const mid = material.id || material.herb
          let remaining = material.count
          for (let i = this.materials.length - 1; i >= 0 && remaining > 0; i--) {
            if (this.materials[i].kind === kind && this.materials[i].id === mid) {
              this.materials.splice(i, 1)
              remaining--
            }
          }
        })
        // 创建丹药
        const effect = calculatePillEffect(recipe, this.level)
        const pill = {
          id: `${recipe.id}_${Date.now()}`,
          name: recipe.name,
          description: recipe.description,
          type: 'pill',
          effect
        }
        this.items.push(pill)
        this.pillsCrafted++
        this.queueSave()
      }
      return result
    },
    // 使用丹药（与上方 usePill 统一逻辑）
    useItem(item) {
      if (item.type === 'pill') {
        return this.usePill(item)
      }
      return false
    },
    // 获取当前有效的丹药效果
    getActiveEffects() {
      const now = Date.now()
      return this.activeEffects.filter(effect => effect.endTime > now)
    },
    // 添加装备到背包
    addEquipment(equipment) {
      if (!this.items) {
        this.items = []
      }
      this.items.push(equipment)
      this.queueSave()
    },
    // 升级灵宠
    upgradePet(pet, essenceCount) {
      if (this.petEssence < essenceCount) {
        return { success: false, message: '灵宠精华不足' }
      }
      // 消耗精华并提升等级
      this.petEssence -= essenceCount
      const petIndex = this.items.findIndex(item => item.id === pet.id)
      if (petIndex > -1) {
        const currentPet = this.items[petIndex]
        currentPet.level = (currentPet.level || 1) + 1
        // 根据品质和等级提升战斗属性
        const qualityMultiplier =
          {
            divine: 2.0,
            celestial: 1.8,
            mystic: 1.6,
            spiritual: 1.4,
            mortal: 1.2
          }[currentPet.rarity] || 1.2
        // 更新战斗属性
        currentPet.combatAttributes = {
          attack: Math.floor(currentPet.combatAttributes.attack * (1 + 0.01 * qualityMultiplier)),
          health: Math.floor(currentPet.combatAttributes.health * (1 + 0.01 * qualityMultiplier)),
          defense: Math.floor(currentPet.combatAttributes.defense * (1 + 0.01 * qualityMultiplier)),
          speed: Math.floor(currentPet.combatAttributes.speed * (1 + 0.01 * qualityMultiplier)),

          critRate: currentPet.combatAttributes.critRate + 0.01 * qualityMultiplier,
          comboRate: currentPet.combatAttributes.comboRate + 0.01 * qualityMultiplier,
          counterRate: currentPet.combatAttributes.counterRate + 0.01 * qualityMultiplier,
          stunRate: currentPet.combatAttributes.stunRate + 0.01 * qualityMultiplier,
          dodgeRate: currentPet.combatAttributes.dodgeRate + 0.01 * qualityMultiplier,
          vampireRate: currentPet.combatAttributes.vampireRate + 0.01 * qualityMultiplier,

          critResist: currentPet.combatAttributes.critResist + 0.01 * qualityMultiplier, // 抗暴击
          comboResist: currentPet.combatAttributes.comboResist + 0.01 * qualityMultiplier, // 抗连击
          counterResist: currentPet.combatAttributes.counterResist + 0.01 * qualityMultiplier, // 抗反击
          stunResist: currentPet.combatAttributes.stunResist + 0.01 * qualityMultiplier, // 抗眩晕
          dodgeResist: currentPet.combatAttributes.dodgeResist + 0.01 * qualityMultiplier, // 抗闪避
          vampireResist: currentPet.combatAttributes.vampireResist + 0.01 * qualityMultiplier, // 抗吸血

          healBoost: currentPet.combatAttributes.healBoost + 0.01 * qualityMultiplier,
          critDamageBoost: currentPet.combatAttributes.critDamageBoost + 0.01 * qualityMultiplier,
          critDamageReduce: currentPet.combatAttributes.critDamageReduce + 0.01 * qualityMultiplier,
          finalDamageBoost: currentPet.combatAttributes.finalDamageBoost + 0.01 * qualityMultiplier,
          finalDamageReduce: currentPet.combatAttributes.finalDamageReduce + 0.01 * qualityMultiplier,
          combatBoost: currentPet.combatAttributes.combatBoost + 0.01 * qualityMultiplier,
          resistanceBoost: currentPet.combatAttributes.resistanceBoost + 0.01 * qualityMultiplier
        }
        // 如果是当前出战的灵宠，先还原再按新星级/等级重新应用加成（避免重复叠加）
        if (this.activePet && this.activePet.id === pet.id) {
          this.resetPetBonuses()
          this.applyPetBonuses()
        }
      }
      this.queueSave()
      return { success: true, message: '升级成功' }
    },
    // 升星灵宠
    evolvePet(pet) {
      const petIndex = this.items.findIndex(item => item.id === pet.id)
      if (petIndex === -1) {
        return { success: false, message: '灵宠不存在' }
      }
      const cost = this.getEvolveCost(pet)
      if (this.petFragments < cost) {
        return { success: false, message: `升星碎片不足，需要 ${cost} 个` }
      }
      this.petFragments -= cost
      this.items[petIndex].star = (this.items[petIndex].star || 0) + 1
      this.queueSave()
      return { success: true, message: `升星成功！${pet.name} 升至 ${this.items[petIndex].star} 星` }
    },
    getEvolveCost(pet) {
      const baseCost = { divine: 50, celestial: 30, mystic: 15, spiritual: 8, mortal: 3 }
      const starMult = 1 + (pet.star || 0) * 0.5
      return Math.floor((baseCost[pet.rarity] || 5) * starMult)
    },
    // === 宗门系统 ===
    // 添加宗门成员
    addSectMember(character) {
      if (!this.sectMembers) this.sectMembers = []
      if (this.sectMembers.length >= this.maxSectSize) {
        return { success: false, message: `宗门已满（上限${this.maxSectSize}人）` }
      }
      const existing = this.sectMembers.find(m => m.templateId === character.templateId)
      if (existing) {
        // 抽到同名角色：已突破<5次时，自动对已有人物突破一次（基础数值×1.2）
        if ((existing.breakThrough || 0) < 5) {
          const r = this.breakThroughCharacter(existing.id)
          if (r && r.success) {
            return {
              success: true,
              message: `${character.name} 突破成功（${existing.breakThrough}/5）`,
              duplicate: true,
              breakThrough: true
            }
          }
        }
        // 超过突破上限后才会转人精华
        const essenceAmount = character.star * 10 + (character.star >= 4 ? 20 : 0)
        if (!this.characterEssence) this.characterEssence = 0
        this.characterEssence += essenceAmount
        this.queueSave()
        return {
          success: true,
          message: `${character.name} 突破已达上限，自动转换为 ${essenceAmount} 人精华`,
          duplicate: true,
          essence: essenceAmount
        }
      }
      this.sectMembers.push(character)
      this.queueSave()
      return { success: true, message: `成功招募${character.name}加入宗门！` }
    },
    // 人物突破：每次 +1（最多5次），每次大幅提升基础数值（×1.2 复利）
    breakThroughCharacter(memberId) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      if ((member.breakThrough || 0) >= 5) {
        return { success: false, message: '已突破至最高境界（5/5）' }
      }
      member.breakThrough = (member.breakThrough || 0) + 1
      // 基础数值 ×1.2（复利）
      if (member.baseStats) {
        member.baseStats.attack = Math.round(member.baseStats.attack * 1.2)
        member.baseStats.health = Math.round(member.baseStats.health * 1.2)
        member.baseStats.defense = Math.round(member.baseStats.defense * 1.2)
        member.baseStats.speed = Math.round(member.baseStats.speed * 1.2)
      }
      // 战斗/抗性/特殊属性小幅成长（每次 +20% 效果）
      const growAttr = (obj) => {
        if (!obj) return
        for (const k in obj) {
          if (typeof obj[k] === 'number' && obj[k] !== 0) {
            obj[k] = Math.round(obj[k] * 1.2 * 100) / 100
          }
        }
      }
      growAttr(member.combatAttributes)
      growAttr(member.combatResistance)
      growAttr(member.specialAttributes)
      this.queueSave()
      return { success: true, message: `${member.name} 突破成功（${member.breakThrough}/5）`, breakThrough: member.breakThrough }
    },
    // 从宗门移除成员
    removeSectMember(memberId) {
      const index = this.sectMembers.findIndex(m => m.id === memberId)
      if (index === -1) return { success: false, message: '成员不存在' }
      const member = this.sectMembers[index]
      this.sectMembers.splice(index, 1)
      this.teamMembers = this.teamMembers.filter(id => id !== memberId)
      this.queueSave()
      return { success: true, message: `已将${member.name}移出宗门` }
    },
    // 设置出战队伍
    setTeamMembers(memberIds) {
      if (!Array.isArray(memberIds)) return { success: false, message: '无效的队伍配置' }
      if (memberIds.length > this.maxTeamSize) {
        return { success: false, message: `队伍人数超出上限（最多${this.maxTeamSize}人）` }
      }
      const validIds = memberIds.filter(id => this.sectMembers.some(m => m.id === id))
      if (validIds.length !== memberIds.length) {
        return { success: false, message: '存在无效的宗门成员' }
      }
      this.teamMembers = [...validIds]
      this.queueSave()
      return { success: true, message: '队伍配置成功' }
    },
    // 添加成员到队伍
    addToTeam(memberId) {
      if (this.teamMembers.length >= this.maxTeamSize) {
        return { success: false, message: `队伍已满（最多${this.maxTeamSize}人）` }
      }
      if (!this.sectMembers.some(m => m.id === memberId)) {
        return { success: false, message: '成员不在宗门中' }
      }
      if (this.teamMembers.includes(memberId)) {
        return { success: false, message: '成员已在队伍中' }
      }
      this.teamMembers.push(memberId)
      this.queueSave()
      return { success: true, message: '添加成功' }
    },
    // 从队伍移除成员
    removeFromTeam(memberId) {
      const index = this.teamMembers.indexOf(memberId)
      if (index === -1) return { success: false, message: '成员不在队伍中' }
      this.teamMembers.splice(index, 1)
      this.queueSave()
      return { success: true, message: '移除成功' }
    },
    // 获取队伍成员详情
    getTeamMembersDetail() {
      return this.teamMembers.map(id => this.sectMembers.find(m => m.id === id)).filter(Boolean)
    },
    // 获取队伍总Build强度
    getTeamTotalBuild() {
      return this.getTeamMembersDetail().reduce((sum, member) => {
        return sum + this.getCharacterBuildStrength(member)
      }, 0)
    },
    // 获取单个角色的Build强度
    getCharacterBuildStrength(character) {
      if (!character) return 0
      // Base stat score
      const bs = character.baseStats || {}
      const ts = character.talentStats || {}
      const baseScore = ((bs.attack || 0) + (ts.attack || 0)) * 5 +
                        ((bs.health || 0) + (ts.health || 0)) * 0.5 +
                        ((bs.defense || 0) + (ts.defense || 0)) * 3 +
                        ((bs.speed || 0) + (ts.speed || 0)) * 8
      // Equipment score
      let equipScore = 0
      const artifacts = character.equippedArtifacts || {}
      Object.values(artifacts).forEach(eq => {
        if (!eq) return
        equipScore += calculateEquipmentScore(eq)
      })
      // Pet score (flat contribution from pet combat attributes)
      let petScore = 0
      if (character.equippedPet) {
        const ca = character.equippedPet.combatAttributes || {}
        petScore = (ca.attack || 0) * 5 + (ca.health || 0) * 0.5 + (ca.defense || 0) * 3 + (ca.speed || 0) * 8
      }
      // Set bonus score
      let setScore = 0
      const activeSets = getActiveSetBonuses(artifacts)
      for (const sb of activeSets) {
        if (sb.count >= 2) setScore += 200
        if (sb.count >= 3) setScore += 100
        if (sb.count >= 4) setScore += 200
        if (sb.count >= 5) setScore += 300
      }
      const levelMult = 1 + ((character.level || 1) - 1) * 0.02
      return Math.round((baseScore + equipScore + petScore + setScore) * levelMult)
    },
    // 角色升级
    levelUpCharacter(memberId) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      if (member.experience < member.maxExperience) {
        return { success: false, message: '经验不足' }
      }
      member.level++
      member.experience -= member.maxExperience
      member.maxExperience = Math.round(member.maxExperience * 1.5)
      const starConfig = { 3: 1, 4: 1.2, 5: 1.5 }
      const growth = starConfig[member.star] || 1
      member.baseStats.attack = Math.round(member.baseStats.attack * (1 + 0.1 * growth))
      member.baseStats.health = Math.round(member.baseStats.health * (1 + 0.15 * growth))
      member.baseStats.defense = Math.round(member.baseStats.defense * (1 + 0.1 * growth))
      member.baseStats.speed = Math.round(member.baseStats.speed * (1 + 0.08 * growth))
      this.queueSave()
      return { success: true, message: `${member.name}升级到${member.level}级！` }
    },
    // 给角色装备物品
    equipCharacterArtifact(memberId, artifact, slot) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      if (!member.equippedArtifacts) member.equippedArtifacts = {}
      const oldArtifact = member.equippedArtifacts[slot]
      if (oldArtifact) {
        this.items.push(oldArtifact)
      }
      const itemIndex = this.items.findIndex(i => i.id === artifact.id)
      if (itemIndex !== -1) {
        this.items.splice(itemIndex, 1)
      }
      member.equippedArtifacts[slot] = artifact
      this.queueSave()
      return { success: true, message: '装备成功' }
    },
    // 给角色卸下装备
    unequipCharacterArtifact(memberId, slot) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      if (!member.equippedArtifacts || !member.equippedArtifacts[slot]) {
        return { success: false, message: '该槽位没有装备' }
      }
      const artifact = member.equippedArtifacts[slot]
      member.equippedArtifacts[slot] = null
      this.items.push(artifact)
      this.queueSave()
      return { success: true, message: '卸下成功' }
    },
    // 角色获得经验
    addCharacterExperience(memberId, amount) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      member.experience += amount
      let result = { success: true, message: `获得${amount}经验` }
      while (member.experience >= member.maxExperience) {
        const levelResult = this.levelUpCharacter(memberId)
        if (levelResult.success) {
          result = levelResult
        } else {
          break
        }
      }
      return result
    },
    // 更新角色头像
    updateCharacterAvatar(memberId, avatarData) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      member.avatar = avatarData
      this.queueSave()
      return { success: true, message: '头像更新成功' }
    },
    // 给角色装备灵宠
    equipCharacterPet(memberId, pet) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      // 卸下旧灵宠（归还到 items）
      if (member.equippedPet) {
        this.items.push(member.equippedPet)
      }
      // 从 items 中移除该灵宠
      const petIndex = this.items.findIndex(p => (p.uid === pet.uid || p.id === pet.id) && p.type === 'pet')
      if (petIndex !== -1) this.items.splice(petIndex, 1)
      member.equippedPet = pet
      this.queueSave()
      return { success: true, message: `${pet.name} 已装备给 ${member.name}` }
    },
    // 给角色卸下灵宠
    unequipCharacterPet(memberId) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      if (!member.equippedPet) return { success: false, message: '该角色没有装备灵宠' }
      const pet = member.equippedPet
      this.items.push(pet)
      member.equippedPet = null
      this.queueSave()
      return { success: true, message: `${pet.name} 已卸下` }
    },
    // 一键为角色装备背包中剩余的最高评分装备（未被其他角色占用的）
    autoEquipCharacter(memberId) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      if (!member.equippedArtifacts) member.equippedArtifacts = {}
      const slots = ['weapon', 'head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'necklace', 'ring1', 'ring2', 'belt']
      let equippedCount = 0
      const equippedIds = new Set()
      this.sectMembers.forEach(m => {
        if (m.equippedArtifacts) {
          Object.values(m.equippedArtifacts).forEach(eq => {
            if (eq && eq.id) equippedIds.add(eq.id)
          })
        }
      })
      for (const slot of slots) {
        const candidates = this.items.filter(i => {
          if (!i.slot || i.type === 'pet') return false
          if (i.slot !== slot) return false
          if (equippedIds.has(i.id)) return false
          if (i.requiredRealm && member.level < i.requiredRealm) return false
          return true
        })
        if (candidates.length === 0) continue
        candidates.sort((a, b) => {
          const scoreA = a.score || calculateEquipmentScore(a) || 0
          const scoreB = b.score || calculateEquipmentScore(b) || 0
          return scoreB - scoreA
        })
        const best = candidates[0]
        if (member.equippedArtifacts[slot]) {
          this.items.push(member.equippedArtifacts[slot])
          equippedIds.delete(member.equippedArtifacts[slot].id)
        }
        const itemIndex = this.items.findIndex(i => i.id === best.id)
        if (itemIndex !== -1) this.items.splice(itemIndex, 1)
        member.equippedArtifacts[slot] = best
        equippedIds.add(best.id)
        equippedCount++
      }
      this.queueSave()
      return { success: true, message: `已为 ${member.name} 自动装备 ${equippedCount} 件装备` }
    },
    // 一键卸下角色所有装备
    autoUnequipCharacter(memberId) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      if (!member.equippedArtifacts) return { success: false, message: '该角色没有装备' }
      let unequippedCount = 0
      for (const slot in member.equippedArtifacts) {
        const artifact = member.equippedArtifacts[slot]
        if (artifact) {
          this.items.push(artifact)
          member.equippedArtifacts[slot] = null
          unequippedCount++
        }
      }
      this.queueSave()
      return { success: true, message: `已卸下 ${member.name} 的 ${unequippedCount} 件装备` }
    },
    // 灵兽放生（报恩返还培养素养 + 素材 + 升星碎片）
    releasePet(petUid) {
      const petIndex = this.items.findIndex(i => (i.uid === petUid || i.id === petUid) && i.type === 'pet')
      if (petIndex === -1) return { success: false, message: '灵宠不存在' }
      const pet = this.items[petIndex]
      const rarityReturnMap = {
        divine: 100,
        celestial: 60,
        mystic: 35,
        spiritual: 20,
        mortal: 10
      }
      const returnAmount = (rarityReturnMap[pet.rarity] || 5) + (pet.level || 1) * 2 + (pet.star || 0) * 5
      this.petEssence += returnAmount
      // 返还升星碎片（根据星级返还）
      const fragmentReturn = (pet.star || 0) * 2 + Math.floor((rarityReturnMap[pet.rarity] || 5) / 10)
      this.petFragments += fragmentReturn
      this.items.splice(petIndex, 1)
      this.queueSave()
      return { success: true, message: `${pet.name}感恩离去，留下了 ${returnAmount} 灵宠精华、${fragmentReturn} 升星碎片作为报恩`, returnAmount }
    }
  }
})
