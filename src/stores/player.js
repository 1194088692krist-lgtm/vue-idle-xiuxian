import { defineStore } from 'pinia'
import { GameDB } from './db'
import { useAuthStore } from './auth'
import { pillRecipes, tryCreatePill, calculatePillEffect } from '../plugins/pills'
import { encryptData, decryptData, validateData } from '../plugins/crypto'
import { getRealmName, getRealmLength } from '../plugins/realm'
import { getAffixesForSlot, getActiveSetBonuses, applySetBonusStats, calculateEquipmentScore, calculateBuildStrength, calculateTotalBuild, migrateEquipmentFields } from '../plugins/buildSystem'
import { craftCurrencies, applyCraftCurrency, disassembleCurrencyRewards, getCraftCost } from '../plugins/craftCurrency'
import { getRuneStats, getRandomRune, RUNE_ELEMENTS } from '../plugins/runes'
import { getSkillsForBreakthrough } from '../plugins/skills'
import { calculateLevelExp, calculateStatIncrease, calculateBreakthroughCost, getRealmByLevel, getReforgeBossMaterial } from '../plugins/cultivationSystem'
import { getEffortCap, rebirthCharacter, getEffectiveBaseStats, recalculateMemberBaseStats, isMemberBaseStatsAbnormal, GROWTH_RATE, starConfig as characterStarConfig } from '../plugins/characters'
import { enhanceEquipment, reforgeEquipment, disassembleEquipment, enhanceConfig, reforgeConfig, getEnhanceBossMaterialCost } from '../plugins/equipment'
import { getResonanceBuildMultiplier } from '../plugins/schoolResonance'

// 装备出售/分解相关常量
// 出售折价率：出售价 = max(1, round(装备评分 * SELL_DISCOUNT_RATE)) 灵石
const SELL_DISCOUNT_RATE = 0.1
// 分解产出映射（基于品质）：强化石数量 + 洗练石数量（凡品不产洗练石）
const EQUIPMENT_SLOTS = ['head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'necklace', 'ring1', 'ring2', 'belt', 'artifact']
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

// 云同步节流计时器（模块级，不进入存档）
let cloudSyncTimer = null

export const usePlayerStore = defineStore('player', {
  state: () => ({
    // 保存防抖计时器（不持久化）
    saveTimer: null,
    pendingSave: false,
    lastSaveTime: 0,
    // 云存档：登录后保存自动同步；cloudConflicts 为分支③待用户抉择的冲突列表
    cloudConflicts: [],
    cloudSyncStatus: '',
    // GM 礼包收件箱（全局）：登录/启动自动拉取，供顶部铃铛红点与设置页共用
    gifts: [],
    // 当前存档所在槽位（null 表示尚未指定，自动存档时默认写入槽位 1）
    currentSlot: null,
    // 是否新玩家
    isNewPlayer: true,
    // GM模式开关
    isGMMode: false,
    // 主题设置：默认日间模式（需用户主动开启才为夜间）
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    // 立绘动态效果开关（点击立绘时加载并播放视频），默认开启
    dynamicPortrait: localStorage.getItem('dynamicPortrait') !== 'false',
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
    nameChangeCount: 0, // 洞天字号修改次数
    level: 1, // 境界等级
    realm: '练气期一层', // 当前境界名称
    cultivation: 0, // 当前修为值（兼容旧存档）
    maxCultivation: 100, // 当前境界最大修为值（兼容旧存档）
    cultivationPool: 0, // 公共修为池
    spirit: 1000, // 灵力值
    maxSpirit: 1000, // 灵力上限
    spiritRate: 1, // 灵力获取倍率
    currentSlot: null, // 当前手动选择的存档槽位
    autoSaveSlot: null, // 自动保存槽位（null表示使用临时自动保存位置）
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
    ownedPills: {}, // 丹药持有（pillId -> { count, craftedAt }）
    activePillBuffs: [], // 生效中的丹药 buff（全局）
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
    craftCurrencies: {}, // 工艺货币库存（M0-B，{ currencyId: count }）
    runes: [], // 灵纹库存（M1，镶嵌用的灵纹实例数组）
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
    // 人物池五星保底计数器（跨抽奖累计，抽出五星时归零）
    gachaFiveStarPity: 0,
    // 人物池四星保底计数器（跨抽奖累计，抽出四星或以上时归零）
    gachaFourStarPity: 0,
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
    teamMembers: [], // 当前出战队伍（最多3人）
    maxSectSize: 100,
    maxTeamSize: 3,
    // 宗门成员 baseStats 重算版本号：升级到此版本时会按 templateId+level+突破次数
    // 用新成长公式重算所有成员 baseStats，修复历史「全0 / 回填默认值 / 成长膨胀到3万+」问题。
    // 每次修改成长公式或重算逻辑时递增此版本号。
    characterStatsVersion: 0
  }),
  getters: {
    // 待领取礼包数量（驱动顶部铃铛红点）
    giftCount: s => (s.gifts || []).length,
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
      // M1：应用已镶嵌灵纹词缀 + 相邻同元素共鸣加成
      Object.values(this.equippedArtifacts || {}).forEach(eq => {
        if (!eq || !Array.isArray(eq.runes)) return
        getRuneStats(eq).forEach(rs => applyAffix(rs.stat, rs.value, rs.valueType))
      })
      // 套装激活加成（仅作用于已存在的属性键），最终属性 = 自然 + 装备 + 套装
      return applySetBonusStats(this.equippedArtifacts || {}, { ...merged })
    },
    // 兼容旧 UI：灵草即素材库中 kind==='herb' 的子集
    herbs() {
      return (this.materials || []).filter(m => m.kind === 'herb')
    },
    // 临时增益聚合（悟道丹修为加成 / 寻宝丹掉落加成），仅统计未过期项
    // P2-A：原 getter 双读 pillEffects + activePillBuffs，会与 P0-B 的"同步刷新"逻辑重复计数。
    // 现统一只读 activePillBuffs（pillEffects 已无写入路径，仅旧存档兼容字段）
    expBonus() {
      const now = Date.now()
      return (this.activePillBuffs || [])
        .filter(e => e.type === 'expGain' && e.expiresAt > now)
        .reduce((s, e) => s + (e.value || 0), 0)
    },
    dropBonus() {
      const now = Date.now()
      return (this.activePillBuffs || [])
        .filter(e => e.type === 'dropRate' && e.expiresAt > now)
        .reduce((s, e) => s + (e.value || 0), 0)
    }
  },
  actions: {
    getCultivationPool() {
      return this.cultivationPool || 0
    },
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
            // 迁移：旧版 weapon 槽位合并入 artifact（统一为法宝）
            if (this.equippedArtifacts && this.equippedArtifacts.weapon) {
              const w = this.equippedArtifacts.weapon
              if (!this.equippedArtifacts.artifact) {
                this.equippedArtifacts.artifact = w
                console.log('数据迁移：旧武器已自动转入法宝槽位', w.name)
              } else {
                // 法宝槽已有装备，将旧武器放入背包
                if (!Array.isArray(this.items)) this.items = []
                this.items.push({ ...w, slot: 'artifact' })
                console.log('数据迁移：旧武器已放入背包（法宝槽已被占用）', w.name)
              }
              delete this.equippedArtifacts.weapon
            }
            // 清理背包中 slot 为 weapon 的装备，统一改为 artifact
            if (Array.isArray(this.items)) {
              this.items.forEach(item => {
                if (item && item.slot === 'weapon') {
                  item.slot = 'artifact'
                }
                if (item && item.type === 'weapon') {
                  item.type = 'artifact'
                }
              })
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
            // 数据清理：移除装备中数值为 0 的属性（旧版洗练可能残留 0 值无意义词条，如 吸血=0）
            // 基础属性(stats)与词条(affixes)一并清理，避免详情页/八卦炉显示无意义的 0 数值
            const cleanZeroStats = (eq) => {
              if (!eq || typeof eq !== 'object') return
              if (eq.stats && typeof eq.stats === 'object') {
                Object.keys(eq.stats).forEach(k => {
                  if (eq.stats[k] === 0 || eq.stats[k] === null || eq.stats[k] === undefined) delete eq.stats[k]
                })
              }
              if (Array.isArray(eq.affixes)) {
                eq.affixes = eq.affixes.filter(a => a && Number(a.value) !== 0)
              }
            }
            if (Array.isArray(this.items)) this.items.forEach(cleanZeroStats)
            if (this.equippedArtifacts && typeof this.equippedArtifacts === 'object') {
              Object.values(this.equippedArtifacts).forEach(cleanZeroStats)
            }
            // M0 迁移：为旧装备补齐 ilvl / qualityTier / 镶嵌与腐化字段（幂等）
            if (Array.isArray(this.items)) this.items.forEach(migrateEquipmentFields)
            if (this.equippedArtifacts && typeof this.equippedArtifacts === 'object') {
              Object.values(this.equippedArtifacts).forEach(migrateEquipmentFields)
            }
            // M0-B 迁移：旧档补工艺货币库存
            if (!this.craftCurrencies || typeof this.craftCurrencies !== 'object') this.craftCurrencies = {}
            // M1 迁移：旧档补灵纹库存
            if (!Array.isArray(this.runes)) this.runes = []
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
      this.cloudConflicts = []
      // 初始化主题设置：默认暗色模式
      const savedDarkMode = localStorage.getItem('darkMode')
      this.isDarkMode = savedDarkMode === null ? true : savedDarkMode === 'true'
      // 同步暗黑模式状态到HTML标签
      this.updateHtmlDarkMode(this.isDarkMode)
      // 初始化动态立绘设置：默认开启
      const dynPortrait = localStorage.getItem('dynamicPortrait')
      this.dynamicPortrait = dynPortrait === null ? true : dynPortrait === 'true'
      // 初始化GM模式设置
      const gmMode = localStorage.getItem('isGMMode')
      if (gmMode !== null) {
        this.isGMMode = gmMode === 'true'
      }
      // 兼容初始化：旧存档可能没有新字段
      if (!this.ownedPills || typeof this.ownedPills !== 'object') this.ownedPills = {}
      if (!Array.isArray(this.activePillBuffs)) this.activePillBuffs = []
      // 关键状态对象空值保护，防止 recomputeAttributes 中 Object.keys(null) 崩溃
      if (!this.combatAttributes || typeof this.combatAttributes !== 'object') this.combatAttributes = {}
      if (!this.combatResistance || typeof this.combatResistance !== 'object') this.combatResistance = {}
      if (!this.specialAttributes || typeof this.specialAttributes !== 'object') this.specialAttributes = {}
      if (!this.equippedArtifacts || typeof this.equippedArtifacts !== 'object') this.equippedArtifacts = {}
      if (!this.baseAttributes || typeof this.baseAttributes !== 'object') this.baseAttributes = {}
      if (!this.artifactBonuses || typeof this.artifactBonuses !== 'object') this.artifactBonuses = {}
      if (!this.rebirthBonus || typeof this.rebirthBonus !== 'object') this.rebirthBonus = {}
      if (!this.permanentBonuses || typeof this.permanentBonuses !== 'object') this.permanentBonuses = {}
      // 宗门成员 baseStats 版本化重算：
      //   - 旧存档 characterStatsVersion < 1：存在「全0 / 被回填为玩家默认值 / 旧公式膨胀到3万+」等问题，
      //     一律按 templateId + level + 突破次数 用新成长公式重算（洗点）。
      //   - 之后每次读档只修复异常成员（isMemberBaseStatsAbnormal），不再全量洗点，
      //     避免清掉玩家通过丹药获得的额外加成。
      const TARGET_STATS_VERSION = 1
      if (!this.characterStatsVersion || this.characterStatsVersion < TARGET_STATS_VERSION) {
        if (Array.isArray(this.sectMembers)) {
          let fixed = 0
          this.sectMembers.forEach(m => {
            if (recalculateMemberBaseStats(m)) fixed++
          })
          if (fixed > 0) {
            console.log(`[characterStats] 版本升级到 v${TARGET_STATS_VERSION}，重算 ${fixed} 个宗门成员 baseStats`)
          }
        }
        this.characterStatsVersion = TARGET_STATS_VERSION
      } else {
        // 已是新版存档：仅修复偶发异常（如存档损坏）
        if (Array.isArray(this.sectMembers)) {
          this.sectMembers.forEach(m => {
            if (isMemberBaseStatsAbnormal(m)) {
              recalculateMemberBaseStats(m)
            }
          })
        }
      }
      // 从干净基线重算派生属性（装备/套装/灵宠），根治「存档重载后加成重复叠加」
      try {
        this.recomputeAttributes()
      } catch (e) {
        console.error('重算属性失败，使用默认值:', e)
      }
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
      // 写入时间戳与战力快照：migrate() 依赖 _saveTime 判断新旧，存档列表依赖 _teamPower 显示战力
      // 之前未写 _saveTime 导致 migrate 把本地当成时间戳 0，无差别用云端覆盖本地，造成 cultivationPool 异常回滚
      this._saveTime = Date.now()
      this._teamPower = this._snapshotTeamPower()
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
      // 登录后：本地落盘即自动云同步（节流）
      this._scheduleCloudSync()
    },
    // 队伍总战力快照（与挂机系统 playerBuildStrength 口径一致）
    // 无队伍时返回主角 buildStrength，有队伍时返回 getTeamTotalBuild()
    _snapshotTeamPower() {
      try {
        const team = this.getTeamMembersDetail ? this.getTeamMembersDetail() : []
        if (!team || team.length === 0) return this.buildStrength || 0
        return this.getTeamTotalBuild ? this.getTeamTotalBuild() : (this.buildStrength || 0)
      } catch {
        return this.buildStrength || 0
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
    // ===== 云存档同步 / 迁移 =====
    // 取云端全部槽位：返回 { slot: { data, updated_at } }
    // 失败时抛出带明确原因的 Error（不再吞成 null，便于定位是 401/5xx/网络）
    // 对 5xx / 网络等可重试错误自动重试一次（缓解 Cloudflare Functions / D1 冷启动瞬时失败）
    async fetchCloudSaves() {
      const auth = useAuthStore()
      if (!auth.isLoggedIn) throw new Error('请先登录后再拉取云端存档')
      // 开发者模式仅用本地存档、无真实账号 token，不支持云同步
      if (auth.devMode && !auth.token) throw new Error('开发者模式仅使用本地存档，不支持云同步')
      let lastErr = null
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 300))
        try {
          const r = await fetch('/api/save', { headers: { ...auth.authHeaders() } })
          let data = {}
          try { data = await r.json() } catch { /* 响应体非 JSON（如网关错误页）*/ }
          if (r.ok && data.ok) {
            const map = {}
            for (const s of data.saves || []) map[s.slot] = { data: s.data, updated_at: s.updated_at }
            return map
          }
          const reason = data.error || ('HTTP ' + r.status)
          // 4xx（含 401 鉴权失败）不重试，直接抛出明确原因
          if (r.status >= 400 && r.status < 500) {
            throw new Error(`拉取云端存档失败：${reason}`)
          }
          // 5xx 等可重试错误：记录后进入下一次重试
          lastErr = new Error(`拉取云端存档失败：${reason}`)
        } catch (e) {
          // 已在上方明确抛出的 4xx 错误，原样向上抛
          if (e && e.message && e.message.startsWith('拉取云端存档失败')) throw e
          lastErr = new Error('拉取云端存档失败：网络请求异常（' + (e && e.message ? e.message : '无法连接服务器') + '）')
        }
      }
      throw lastErr || new Error('拉取云端存档失败')
    },
    // 上传单槽到云端；返回是否成功（调用方据此如实上报，避免假成功）
    async pushSlotToCloud(slot, encryptedBlob, updatedAt) {
      const auth = useAuthStore()
      if (!auth.isLoggedIn) return false
      try {
        const r = await fetch('/api/save', {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...auth.authHeaders() },
          body: JSON.stringify({ slot, data: encryptedBlob, updated_at: updatedAt })
        })
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          console.warn('云同步上传失败', r.status, data.error || '')
          return false
        }
        return true
      } catch (e) {
        console.warn('云同步上传失败', e)
        return false
      }
    },
    // 从密文 blob 提取基础信息（用于分支③对比弹窗）
    _slotInfo(blob) {
      const d = decryptData(blob)
      if (!d) return { name: '（损坏）', level: '-', realm: '-', teamPower: 0, time: null }
      return {
        name: d.name || '未知',
        level: d.level || 1,
        realm: d.realm || '未知',
        teamPower: d._teamPower || 0,
        time: d._saveTime || null
      }
    },
    // 从云端下载覆盖本地
    async pullFromCloud() {
      const auth = useAuthStore()
      if (!auth.isLoggedIn) throw new Error('请先登录')
      this.cloudSyncStatus = '下载中…'
      try {
        // fetchCloudSaves 失败时已抛出带原因的 Error，这里不再重复判断
        const cloud = await this.fetchCloudSaves()
        let count = 0
        const slots = [0, 1, 2, 3, 4, 5]
        for (const slot of slots) {
          const key = slot === 0 ? 'playerData' : `saveSlot_${slot}`
          const cloudBlob = cloud[slot]?.data
          if (cloudBlob) {
            await GameDB.setData(key, cloudBlob)
            count++
          }
        }
        this.$reset()
        await this.initializePlayer()
        this.cloudSyncStatus = `已从云端下载 ${count} 个存档槽位`
      } catch (e) {
        this.cloudSyncStatus = '下载失败'
        throw e
      }
    },
    // 保存后节流自动云同步：上传活动档(0) + 当前手动槽位
    _scheduleCloudSync() {
      const auth = useAuthStore()
      if (!auth.isLoggedIn) return
      if (cloudSyncTimer) return
      cloudSyncTimer = setTimeout(() => {
        cloudSyncTimer = null
        this.syncToCloud()
      }, 3000)
    },
    async syncToCloud() {
      const auth = useAuthStore()
      if (!auth.isLoggedIn) return
      this.cloudSyncStatus = '同步中…'
      try {
        let okAll = true
        const blob = await GameDB.getData('playerData')
        if (blob) okAll = (await this.pushSlotToCloud(0, blob, Date.now())) && okAll
        const slot = this.currentSlot || this.autoSaveSlot
        if (slot) {
          const slotBlob = await GameDB.getData(`saveSlot_${slot}`)
          if (slotBlob) okAll = (await this.pushSlotToCloud(slot, slotBlob, Date.now())) && okAll
        }
        // 如实上报：任一槽位上传失败则标记为失败，不再假成功
        this.cloudSyncStatus = okAll ? '已同步到云端' : '云同步失败'
      } catch (e) {
        this.cloudSyncStatus = '云同步失败'
        console.warn(e)
      }
    },
    // 迁移决策树（登录后调用）
    // interactive=true 时，分支③(本地+云端都有) 收集为冲突交由 UI 弹窗抉择；
    // interactive=false（启动自动）时以 updated_at 较新者胜（最后写入获胜）。
    async migrate({ interactive = false } = {}) {
      const auth = useAuthStore()
      if (!auth.isLoggedIn) throw new Error('请先登录')
      // fetchCloudSaves 失败时已抛出带原因的 Error
      const cloud = await this.fetchCloudSaves()

      const slots = [0, 1, 2, 3, 4, 5]
      const conflicts = []
      for (const slot of slots) {
        const key = slot === 0 ? 'playerData' : `saveSlot_${slot}`
        const localBlob = await GameDB.getData(key)
        let localTime = 0
        if (localBlob) {
          const d = decryptData(localBlob)
          localTime = d?._saveTime || 0
        }
        const cloudSlot = cloud[slot]
        const cloudBlob = cloudSlot?.data
        const cloudTime = cloudSlot?.updated_at || 0

        if (cloudBlob && !localBlob) {
          // ② 云端有、本地无 → 下载
          await GameDB.setData(key, cloudBlob)
        } else if (!cloudBlob && localBlob) {
          // ① 本地有、云端无 → 上传
          await this.pushSlotToCloud(slot, localBlob, localTime || Date.now())
        } else if (cloudBlob && localBlob) {
          // ③ 两边都有 → 冲突
          if (interactive) {
            conflicts.push({
              slot,
              local: this._slotInfo(localBlob),
              cloud: this._slotInfo(cloudBlob),
              localTime,
              cloudTime
            })
          } else if (cloudTime >= localTime) {
            // 兜底保护：若本地修为池显著大于云端（>1.5 倍），即便云端时间戳较新
            // 也保留本地较大值，避免因时间戳异常（如旧版未写 _saveTime）造成 cultivationPool 回滚损失
            const localDecoded = decryptData(localBlob)
            const cloudDecoded = decryptData(cloudBlob)
            const localPool = typeof localDecoded?.cultivationPool === 'number' ? localDecoded.cultivationPool : 0
            const cloudPool = typeof cloudDecoded?.cultivationPool === 'number' ? cloudDecoded.cultivationPool : 0
            if (localPool > cloudPool * 1.5 && localPool > 0) {
              cloudDecoded.cultivationPool = localPool
              cloudDecoded._saveTime = cloudDecoded._saveTime || Date.now()
              const mergedBlob = encryptData(cloudDecoded)
              await GameDB.setData(key, mergedBlob || cloudBlob)
              if (mergedBlob) {
                await this.pushSlotToCloud(slot, mergedBlob, cloudDecoded._saveTime)
              }
              console.warn(`[migrate] slot=${slot} 保护本地 cultivationPool=${localPool}（云端仅 ${cloudPool}）`)
            } else {
              await GameDB.setData(key, cloudBlob)
            }
          } else {
            await this.pushSlotToCloud(slot, localBlob, localTime)
          }
        }
        // ④ 都没有 → 跳过
      }

      if (conflicts.length) {
        this.cloudConflicts = conflicts
        return { conflicts }
      }
      // 无冲突，统一重新初始化
      this.$reset()
      await this.initializePlayer()
      this.cloudConflicts = []
      return { conflicts: [] }
    },
    // 分支③：用户抉择某一槽位用本地还是云端
    async resolveConflict(slot, useCloud) {
      const key = slot === 0 ? 'playerData' : `saveSlot_${slot}`
      if (useCloud) {
        const cloud = await this.fetchCloudSaves()
        const blob = cloud?.[slot]?.data
        if (blob) await GameDB.setData(key, blob)
      } else {
        const localBlob = await GameDB.getData(key)
        if (localBlob) {
          const d = decryptData(localBlob)
          await this.pushSlotToCloud(slot, localBlob, d?._saveTime || Date.now())
        }
      }
      this.cloudConflicts = this.cloudConflicts.filter(c => c.slot !== slot)
      if (!this.cloudConflicts.length) {
        this.$reset()
        await this.initializePlayer()
      }
    },
    // 拉取当前玩家的待领取礼包（全局，供顶部铃铛与设置页共用）
    async loadGifts() {
      const auth = useAuthStore()
      if (!auth.isLoggedIn) { this.gifts = []; return }
      try {
        const r = await fetch('/api/inbox', { headers: { ...auth.authHeaders() } })
        const data = await r.json().catch(() => ({}))
        this.gifts = data.ok ? (data.gifts || []) : []
      } catch {
        this.gifts = []
      }
    },
    // 领取礼包：标记并入存档
    async claimGift(giftId) {
      const auth = useAuthStore()
      if (!auth.isLoggedIn) throw new Error('请先登录')
      const r = await fetch('/api/inbox/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...auth.authHeaders() },
        body: JSON.stringify({ gift_id: giftId })
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data.ok) throw new Error(data.error || '领取失败')
      const items = data.items
      if (items?.num) {
        for (const [k, v] of Object.entries(items.num)) {
          if (typeof this[k] === 'number') this[k] += v
        }
      }
      if (Array.isArray(items?.materials)) {
        if (!Array.isArray(this.materials)) this.materials = []
        for (const m of items.materials) {
          for (let i = 0; i < m.count; i++) {
            this.materials.push({ kind: 'ore', id: m.id, name: m.name })
          }
        }
      }
      // 即时落盘（不再走防抖 queueSave）：领取结果立刻写入本地 + 触发云同步，
      // 避免在网络同步/页面卸载前被领取前的旧存档覆盖，确保玩家「真的收到」
      await this.saveData()
      return items
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
              teamPower: decryptedData?._teamPower || 0,
              saveTime: decryptedData?._saveTime || null
            })
          } catch {
            slots.push({ slot: i, name: '存档损坏', level: 0, realm: '未知', teamPower: 0, saveTime: null })
          }
        } else {
          slots.push({ slot: i, name: null, level: 0, realm: '', teamPower: 0, saveTime: null })
        }
      }
      return slots
    },
    // 保存到指定槽位
    async saveToSlot(slot) {
      try {
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
        this.autoSaveSlot = slot
        return true
      } catch (error) {
        console.error('保存到槽位失败:', error)
        throw error
      }
    },
    async saveToCurrentSlot() {
      if (this.autoSaveSlot !== null) {
        await this.saveToSlot(this.autoSaveSlot)
        return this.autoSaveSlot
      }
      const currentData = await GameDB.getData('playerData')
      if (!currentData) {
        throw new Error('当前没有可保存的存档数据')
      }
      const decryptedData = decryptData(currentData)
      if (!decryptedData) {
        throw new Error('数据解密失败')
      }
      decryptedData._saveTime = Date.now()
      const encryptedAutoSaveData = encryptData(decryptedData)
      await GameDB.setData('autoSaveTemp', encryptedAutoSaveData)
      return 'auto'
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
        // 删除非游戏数据（_saveTime / _teamPower 仅为存档列表摘要使用，运行时不需要）
        delete decryptedData._saveTime
        delete decryptedData._teamPower
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
      // 悟道丹（expGain）提升修为获取
      const bonus = 1 + (this.expBonus || 0)
      const gained = numAmount * bonus
      this.addCultivationToPool(gained)
      this.totalCultivationTime += 1 // 增加修炼时间统计
      this.queueSave()
    },
    // 增加公共池修为
    addCultivationToPool(amount) {
      const numAmount = Number(amount)
      if (!Number.isFinite(numAmount) || numAmount <= 0) return
      this.cultivationPool = (this.cultivationPool || 0) + numAmount
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
      let index = this.items.findIndex(i => i.id === equipment.id)
      if (index === -1) {
        for (const slot of EQUIPMENT_SLOTS) {
          if (this.equippedArtifacts[slot]?.id === equipment.id) {
            return { success: false, message: '请先卸下装备再分解' }
          }
        }
        return { success: false, message: '装备不存在' }
      }
      const result = disassembleEquipment(equipment)
      if (!result.success) {
        return result
      }
      const rewards = result.rewards
      if (rewards.common_enhance_stone) {
        for (let i = 0; i < rewards.common_enhance_stone; i++) {
          this.materials.push({ kind: 'ore', id: 'common_enhance_stone', name: '普通强化石' })
        }
      }
      if (rewards.advanced_enhance_stone) {
        for (let i = 0; i < rewards.advanced_enhance_stone; i++) {
          this.materials.push({ kind: 'ore', id: 'advanced_enhance_stone', name: '高级强化石' })
        }
      }
      if (rewards.supreme_enhance_stone) {
        for (let i = 0; i < rewards.supreme_enhance_stone; i++) {
          this.materials.push({ kind: 'ore', id: 'supreme_enhance_stone', name: '至尊强化石' })
        }
      }
      if (rewards.reforge_stone) {
        this.refinementStones += rewards.reforge_stone
      }
      // M0-B：分解额外返工艺货币（按品质，净 sink）
      const currencyRewards = disassembleCurrencyRewards(equipment.rarity || 'common')
      Object.entries(currencyRewards).forEach(([cid, n]) => this.gainCraftCurrency(cid, n))
      this.items.splice(index, 1)
      this.queueSave()
      const parts = []
      if (rewards.common_enhance_stone) parts.push(`普通强化石×${rewards.common_enhance_stone}`)
      if (rewards.advanced_enhance_stone) parts.push(`高级强化石×${rewards.advanced_enhance_stone}`)
      if (rewards.supreme_enhance_stone) parts.push(`至尊强化石×${rewards.supreme_enhance_stone}`)
      if (rewards.reforge_stone) parts.push(`洗练石×${rewards.reforge_stone}`)
      Object.entries(currencyRewards).forEach(([cid, n]) => parts.push(`${craftCurrencies[cid]?.name || cid}×${n}`))
      return { success: true, message: `分解成功，获得 ${parts.join('、')}` }
    },
    // ===== M0-B 工艺货币 =====
    // 增加货币
    gainCraftCurrency(currencyId, count = 1) {
      if (!this.craftCurrencies || typeof this.craftCurrencies !== 'object') this.craftCurrencies = {}
      this.craftCurrencies[currencyId] = (this.craftCurrencies[currencyId] || 0) + count
    },
    // 查询货币数量
    getCraftCurrencyCount(currencyId) {
      return (this.craftCurrencies && this.craftCurrencies[currencyId]) || 0
    },
    hasCraftCurrency(currencyId, count = 1) {
      return this.getCraftCurrencyCount(currencyId) >= count
    },
    // 消耗货币（不足返回 false）
    consumeCraftCurrency(currencyId, count = 1) {
      if (!this.hasCraftCurrency(currencyId, count)) return false
      this.craftCurrencies[currencyId] -= count
      if (this.craftCurrencies[currencyId] <= 0) delete this.craftCurrencies[currencyId]
      return true
    },
    // 对装备使用工艺货币（craft 面板入口）
    craftEquipmentWithCurrency(equipmentId, currencyId, targetAffixId = null) {
      // 定位装备（背包或已装备）
      let equip = this.items.find(i => i.id === equipmentId)
      if (!equip) {
        for (const slot of EQUIPMENT_SLOTS) {
          if (this.equippedArtifacts[slot]?.id === equipmentId) { equip = this.equippedArtifacts[slot]; break }
        }
      }
      if (!equip) return { success: false, message: '装备不存在' }
      if (equip.corrupted && currencyId !== 'blood_sigil') return { success: false, message: '已腐化装备不可再 craft' }
      // 锁灵符特殊：解锁免费，仅"锁定"消耗 1 个
      let cost = 1
      if (currencyId === 'lock_rune') {
        const af = (equip.affixes || []).find(a => a.id === targetAffixId)
        if (!af) return { success: false, message: '词缀不存在' }
        if (af.locked) cost = 0 // 解锁免费
      } else {
        cost = getCraftCost(currencyId, equip, targetAffixId) // 凝律石等按档位递增
      }
      if (cost > 0 && !this.consumeCraftCurrency(currencyId, cost)) {
        return { success: false, message: `${craftCurrencies[currencyId]?.name}不足（需 ${cost} 个）` }
      }
      const result = applyCraftCurrency(equip, currencyId, targetAffixId, { allowEmpty: !!this.allowRiskyAnnul })
      if (!result.success) {
        // 失败则退回货币（除血祭已腐化的情况）
        if (currencyId !== 'blood_sigil' && cost > 0) this.gainCraftCurrency(currencyId, cost)
        return result
      }
      // 血祭碎裂：移除装备
      if (result.shattered) {
        const idx = this.items.findIndex(i => i.id === equipmentId)
        if (idx !== -1) this.items.splice(idx, 1)
        for (const slot of EQUIPMENT_SLOTS) {
          if (this.equippedArtifacts[slot]?.id === equipmentId) this.equippedArtifacts[slot] = null
        }
      }
      this.queueSave()
      return result
    },
    // ===== M1 灵纹镶嵌 =====
    // 获得灵纹（掉落/Boss）
    gainRune(rune) {
      if (!rune) return
      if (!Array.isArray(this.runes)) this.runes = []
      this.runes.push(rune)
    },
    // 定位装备（背包或已装备）
    _findEquipmentById(equipmentId) {
      let equip = this.items.find(i => i.id === equipmentId)
      if (!equip) {
        for (const slot of EQUIPMENT_SLOTS) {
          if (this.equippedArtifacts[slot]?.id === equipmentId) { equip = this.equippedArtifacts[slot]; break }
        }
      }
      return equip || null
    },
    // 镶嵌灵纹到装备指定槽位
    socketRune(equipmentId, slotIdx, runeUid) {
      const equip = this._findEquipmentById(equipmentId)
      if (!equip) return { success: false, message: '装备不存在' }
      if (!Array.isArray(equip.runes) || slotIdx < 0 || slotIdx >= equip.runes.length) return { success: false, message: '该槽位不可用' }
      if (equip.runes[slotIdx]) return { success: false, message: '该槽位已有灵纹，请先卸下' }
      const rIdx = (this.runes || []).findIndex(r => r.uid === runeUid)
      if (rIdx === -1) return { success: false, message: '灵纹不存在' }
      const rune = this.runes[rIdx]
      this.runes.splice(rIdx, 1)
      equip.runes[slotIdx] = rune
      this.queueSave()
      return { success: true, message: `已将「${rune.name}」镶嵌到槽位 ${slotIdx + 1}` }
    },
    // 卸下装备指定槽位的灵纹（退回灵纹库存）
    unsocketRune(equipmentId, slotIdx) {
      const equip = this._findEquipmentById(equipmentId)
      if (!equip) return { success: false, message: '装备不存在' }
      if (!Array.isArray(equip.runes) || slotIdx < 0 || slotIdx >= equip.runes.length) return { success: false, message: '该槽位不可用' }
      const rune = equip.runes[slotIdx]
      if (!rune) return { success: false, message: '该槽位为空' }
      equip.runes[slotIdx] = null
      if (!Array.isArray(this.runes)) this.runes = []
      this.runes.push(rune)
      this.queueSave()
      return { success: true, message: `已卸下「${rune.name}」` }
    },
    // 批量分解装备
    async batchDisassembleEquipments(equipmentIds) {
      if (!equipmentIds || equipmentIds.length === 0) {
        return { success: false, message: '请选择要分解的装备' }
      }
      let totalCommon = 0, totalAdvanced = 0, totalSupreme = 0, totalReforge = 0
      const ids = new Set(equipmentIds)
      const toDisassemble = this.items.filter(item => ids.has(item.id))
      for (const equip of toDisassemble) {
        const result = disassembleEquipment(equip)
        if (result.success) {
          totalCommon += result.rewards.common_enhance_stone || 0
          totalAdvanced += result.rewards.advanced_enhance_stone || 0
          totalSupreme += result.rewards.supreme_enhance_stone || 0
          totalReforge += result.rewards.reforge_stone || 0
        }
      }
      for (let i = 0; i < totalCommon; i++) {
        this.materials.push({ kind: 'ore', id: 'common_enhance_stone', name: '普通强化石' })
      }
      for (let i = 0; i < totalAdvanced; i++) {
        this.materials.push({ kind: 'ore', id: 'advanced_enhance_stone', name: '高级强化石' })
      }
      for (let i = 0; i < totalSupreme; i++) {
        this.materials.push({ kind: 'ore', id: 'supreme_enhance_stone', name: '至尊强化石' })
      }
      this.refinementStones += totalReforge
      this.items = this.items.filter(i => !ids.has(i.id))
      this.queueSave()
      const parts = []
      if (totalCommon) parts.push(`普通强化石×${totalCommon}`)
      if (totalAdvanced) parts.push(`高级强化石×${totalAdvanced}`)
      if (totalSupreme) parts.push(`至尊强化石×${totalSupreme}`)
      if (totalReforge) parts.push(`洗练石×${totalReforge}`)
      return { success: true, message: `成功分解 ${toDisassemble.length} 件装备，获得 ${parts.join('、')}` }
    },
    // 强化装备
    enhanceEquipmentItem(equipment) {
      let targetEquip = equipment
      let isEquipped = false
      if (!this.items.find(i => i.id === equipment.id)) {
        for (const slot of EQUIPMENT_SLOTS) {
          if (this.equippedArtifacts[slot]?.id === equipment.id) {
            targetEquip = this.equippedArtifacts[slot]
            isEquipped = true
            break
          }
        }
      }
      if (!targetEquip) {
        return { success: false, message: '装备不存在' }
      }
      const usedBonus = this.enhanceBonus || 0
      const result = enhanceEquipment(targetEquip, this.spiritStones, this.materials, usedBonus)
      if (!result.success) {
        if (result.isFailure) {
          this.queueSave()
        }
        return result
      }
      this.spiritStones -= result.goldCost
      const stoneType = result.stoneCost.type
      let remaining = result.stoneCost.count
      for (let i = this.materials.length - 1; i >= 0 && remaining > 0; i--) {
        if (this.materials[i].kind === 'ore' && this.materials[i].id === stoneType) {
          this.materials.splice(i, 1)
          remaining--
        }
      }
      // 12 阶强化每阶消耗对应难度 BOSS 素材 1 个（仅成功时消耗；失败回退不消耗）
      const bossCost = result.bossCost
      if (bossCost) {
        let bossRemaining = bossCost.count
        for (let i = this.materials.length - 1; i >= 0 && bossRemaining > 0; i--) {
          if (this.materials[i].kind === 'boss_material' && this.materials[i].id === bossCost.id) {
            this.materials.splice(i, 1)
            bossRemaining--
          }
        }
      }
      if (usedBonus > 0) {
        this.enhanceBonus = 0
      }
      this.queueSave()
      return result
    },
    // 洗练装备
    reforgeEquipmentItem(equipment, targetStat = null) {
      let targetEquip = equipment
      let isEquipped = false
      if (!this.items.find(i => i.id === equipment.id)) {
        for (const slot of EQUIPMENT_SLOTS) {
          if (this.equippedArtifacts[slot]?.id === equipment.id) {
            targetEquip = this.equippedArtifacts[slot]
            isEquipped = true
            break
          }
        }
      }
      if (!targetEquip) {
        return { success: false, message: '装备不存在' }
      }
      const usedSafe = this.reforgeSafeCharges > 0
      const result = reforgeEquipment(targetEquip, this.refinementStones, false, usedSafe, targetStat, this.materials)
      if (!result.success) {
        return result
      }
      return result
    },
    // 确认洗练结果
    confirmReforge(equipment, newStats) {
      let targetEquip = equipment
      for (const slot of EQUIPMENT_SLOTS) {
        if (this.equippedArtifacts[slot]?.id === equipment.id) {
          targetEquip = this.equippedArtifacts[slot]
          break
        }
      }
      if (!targetEquip) {
        return { success: false, message: '装备不存在' }
      }
      targetEquip.stats = { ...newStats }
      this.refinementStones -= reforgeConfig.costPerAttempt
      const usedSafe = this.reforgeSafeCharges > 0
      if (usedSafe) {
        this.reforgeSafeCharges = Math.max(0, this.reforgeSafeCharges - 1)
      }
      this.queueSave()
      return { success: true, message: '洗练成功' }
    },
    reforgeEquipmentPreview(equipment, mode = 'all', targetStat = null) {
      let targetEquip = equipment
      if (!this.items.find(i => i.id === equipment.id)) {
        for (const slot of EQUIPMENT_SLOTS) {
          if (this.equippedArtifacts[slot]?.id === equipment.id) {
            targetEquip = this.equippedArtifacts[slot]
            break
          }
        }
      }
      if (!targetEquip) {
        return { success: false, message: '装备不存在' }
      }
      if (this.refinementStones < reforgeConfig.costPerAttempt) {
        return { success: false, message: '洗练石不足' }
      }
      if (mode === 'single' && !targetStat) {
        return { success: false, message: '请选择要洗练的词条' }
      }
      // 按装备品级预检 BOSS 素材（凡品对应青萝林狼王素材）
      const rarity = targetEquip.rarity || 'common'
      const bossDef = getReforgeBossMaterial(rarity)
      if (bossDef) {
        const have = this.materials.filter(m => m.kind === 'boss_material' && m.id === bossDef.id).length
        if (have < 1) {
          return { success: false, message: `BOSS素材【${bossDef.name}】不足` }
        }
      }
      const usedSafe = this.reforgeSafeCharges > 0
      // 点击洗练立即扣费
      this.refinementStones -= reforgeConfig.costPerAttempt
      if (usedSafe) {
        this.reforgeSafeCharges = Math.max(0, this.reforgeSafeCharges - 1)
      }
      // 同步扣除 BOSS 素材 1 个
      if (bossDef) {
        for (let i = this.materials.length - 1; i >= 0; i--) {
          if (this.materials[i].kind === 'boss_material' && this.materials[i].id === bossDef.id) {
            this.materials.splice(i, 1)
            break
          }
        }
      }
      const result = reforgeEquipment(targetEquip, this.refinementStones, false, usedSafe, targetStat, this.materials)
      if (!result.success) {
        return result
      }
      return {
        success: true,
        newStats: result.newStats,
        wasSafe: usedSafe,
        oldStats: result.oldStats
      }
    },
    reforgeEquipmentConfirm(equipment, newStats) {
      let targetEquip = equipment
      if (!this.items.find(i => i.id === equipment.id)) {
        for (const slot of EQUIPMENT_SLOTS) {
          if (this.equippedArtifacts[slot]?.id === equipment.id) {
            targetEquip = this.equippedArtifacts[slot]
            break
          }
        }
      }
      if (!targetEquip) {
        return { success: false, message: '装备不存在' }
      }
      if (this.refinementStones < reforgeConfig.costPerAttempt) {
        return { success: false, message: '洗练石不足' }
      }
      targetEquip.stats = { ...newStats }
      this.queueSave()
      return { success: true, message: '洗练成功' }
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
    // 妖兽核兑换幻灵结晶（1 妖兽核 = 5 幻灵结晶）
    exchangeBeastCoreForCrystals(amount) {
      if (!amount || amount <= 0) {
        return { success: false, message: '兑换数量必须大于 0' }
      }
      if (!Array.isArray(this.materials)) this.materials = []
      const beastCoreIndices = []
      for (let i = 0; i < this.materials.length; i++) {
        if (this.materials[i].kind === 'core' && this.materials[i].id === 'beast_core') {
          beastCoreIndices.push(i)
        }
      }
      if (beastCoreIndices.length < amount) {
        return { success: false, message: `妖兽核不足，需要 ${amount} 个，当前 ${beastCoreIndices.length} 个` }
      }
      // 从后往前删，避免索引错位
      for (let i = 0; i < amount; i++) {
        this.materials.splice(beastCoreIndices[beastCoreIndices.length - 1 - i], 1)
      }
      const crystals = amount * 5
      this.phantomCrystals += crystals
      this.queueSave()
      return { success: true, message: `成功使用 ${amount} 个妖兽核兑换 ${crystals} 幻灵结晶` }
    },
    // 消耗 BOSS 挑战券（按 id 删除指定数量，从后往前删避免索引错位）
    consumeBossTicket(ticketId, count) {
      if (!ticketId || !count || count <= 0) {
        return { success: false, message: '消耗参数无效' }
      }
      if (!Array.isArray(this.materials)) this.materials = []
      const ticketIndices = []
      for (let i = 0; i < this.materials.length; i++) {
        if (this.materials[i].kind === 'boss_ticket' && this.materials[i].id === ticketId) {
          ticketIndices.push(i)
        }
      }
      if (ticketIndices.length < count) {
        return { success: false, message: `挑战券不足，需要 ${count} 张，当前 ${ticketIndices.length} 张` }
      }
      for (let i = 0; i < count; i++) {
        this.materials.splice(ticketIndices[ticketIndices.length - 1 - i], 1)
      }
      this.queueSave()
      return { success: true, message: `消耗 ${count} 张挑战券` }
    },
    // 统计某种素材的数量（按 kind+id）
    countMaterial(kind, id) {
      if (!Array.isArray(this.materials)) return 0
      return this.materials.filter(m => m.kind === kind && m.id === id).length
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
    // 一键装备最强装备：遍历所有槽位，自动装备背包中评分最高且未被占用的装备
    autoEquipBest() {
      const slots = ['head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'necklace', 'ring1', 'ring2', 'belt', 'artifact']
      const equipped = []
      let total = 0
      const occupiedIds = new Set()
      // 收集所有已被占用的装备ID（玩家自身 + 宗门成员）
      Object.values(this.equippedArtifacts || {}).forEach(e => { if (e?.id) occupiedIds.add(e.id) })
      this.sectMembers.forEach(m => {
        if (m.equippedArtifacts) {
          Object.values(m.equippedArtifacts).forEach(e => { if (e?.id) occupiedIds.add(e.id) })
        }
      })
      for (const slot of slots) {
        // 找到该槽位下所有可装备物品（按 slot 字段匹配，兼容 type=槽位 与 type='equipment' 两种形态）
        const candidates = this.items.filter(item => {
          if (!item || typeof item !== 'object') return false
          // 排除非装备类型
          if (item.type === 'pet' || item.type === 'material') return false
          // 获取装备槽位：优先使用 slot 字段，其次使用 type 字段
          const itemSlot = item.slot || item.type
          if (!itemSlot || !slots.includes(itemSlot)) return false
          if (itemSlot !== slot) return false
          // 满足境界要求
          if (item.requiredRealm && this.level < item.requiredRealm) return false
          // 未被其他角色占用
          if (item.id && occupiedIds.has(item.id)) return false
          return true
        })
        if (candidates.length === 0) continue
        // 按评分排序，取最高的
        candidates.sort((a, b) => {
          const scoreA = calculateEquipmentScore(a) || 0
          const scoreB = calculateEquipmentScore(b) || 0
          return scoreB - scoreA
        })
        const best = candidates[0]
        const score = calculateEquipmentScore(best) || 0
        // 装备
        const result = this.equipArtifact(best, slot)
        if (result.success) {
          occupiedIds.add(best.id)
          equipped.push(`${this.equipmentSlotNames[slot] || slot}：${best.name}（${score}分）`)
          total++
        }
      }
      this.queueSave()
      if (total === 0) {
        return { success: false, message: '没有可装备的装备' }
      }
      return { success: true, message: `已一键装备 ${total} 件最强装备`, equipped }
    },
    // 装备槽位中文名映射（供 autoEquipBest 使用）
    equipmentSlotNames: { head: '头部', body: '衣服', legs: '裤子', feet: '鞋子', shoulder: '肩甲', hands: '手套', wrist: '护腕', necklace: '项链', ring1: '戒指1', ring2: '戒指2', belt: '腰带', artifact: '法宝' },
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
    // 炼制丹药（支持批量）
    craftPill(recipeId, count = 1) {
      const recipe = pillRecipes.find(r => r.id === recipeId)
      if (!recipe || !this.pillRecipes.includes(recipeId)) {
        return { success: false, message: '未掌握丹方' }
      }
      if (count < 1) {
        return { success: false, message: '炼制数量至少为1' }
      }
      const fragments = this.pillFragments[recipeId] || 0
      // 检查材料是否足够 N 倍
      for (const material of recipe.materials) {
        const kind = material.kind || 'herb'
        const mid = material.id || material.herb
        const have = this.materials.filter(m => m.kind === kind && m.id === mid).length
        if (have < material.count * count) {
          return { success: false, message: '材料不足' }
        }
      }
      let successCount = 0
      let failCount = 0
      // P1-B：失败损失 50% 材料（向上取整），让"成功率"重新成为真实的代价杠杆
      // （原实现失败不扣料，等于免费重试，让品阶难度形同虚设）
      const FAILURE_LOSS_RATIO = 0.5
      for (let n = 0; n < count; n++) {
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
          // 创建丹药并加入持有
          if (!this.ownedPills[recipeId]) {
            this.ownedPills[recipeId] = { count: 0, craftedAt: Date.now() }
          }
          this.ownedPills[recipeId].count++
          this.ownedPills[recipeId].craftedAt = Date.now()
          this.pillsCrafted++
          successCount++
        } else if (result.message === '炼制失败') {
          // 仅"炼制失败"才扣料（"材料不足"不扣——根本没材料可扣）
          failCount++
          recipe.materials.forEach(material => {
            const kind = material.kind || 'herb'
            const mid = material.id || material.herb
            const loss = Math.ceil(material.count * FAILURE_LOSS_RATIO)
            let remaining = loss
            for (let i = this.materials.length - 1; i >= 0 && remaining > 0; i--) {
              if (this.materials[i].kind === kind && this.materials[i].id === mid) {
                this.materials.splice(i, 1)
                remaining--
              }
            }
          })
        } else {
          // 材料不足等其它原因：直接中止后续批量
          failCount++
          break
        }
      }
      if (successCount > 0) {
        this.queueSave()
      }
      if (count === 1) {
        return successCount > 0
          ? { success: true, message: '炼制成功' }
          : { success: false, message: '炼制失败' }
      }
      return {
        success: successCount > 0,
        message: successCount > 0 ? `批量炼制完成，成功 ${successCount} 颗，失败 ${failCount} 颗` : '批量炼制全部失败',
        successCount,
        failCount
      }
    },
    // 获取当前未过期的全局丹药 buff
    getActivePillEffects() {
      const now = Date.now()
      return (this.activePillBuffs || []).filter(buff => buff.expiresAt > now)
    },
    // 服用丹药（从 ownedPills 消耗）
    consumePill(pillId, memberId) {
      const owned = this.ownedPills[pillId]
      if (!owned || owned.count <= 0) {
        window.$message?.error('丹药不足')
        return { success: false, message: '丹药不足' }
      }
      const recipe = pillRecipes.find(r => r.id === pillId)
      if (!recipe) {
        window.$message?.error('未知丹药')
        return { success: false, message: '未知丹药' }
      }
      const baseEffect = recipe.baseEffect
      const effect = calculatePillEffect(recipe, this.level)
      const now = Date.now()
      const expiresAt = now + (baseEffect.duration || 0) * 1000
      const changes = []
      const statNameMap = { attack: '攻击', health: '生命', defense: '防御', speed: '速度' }

      const globalTypes = ['spiritStoneRate', 'cultivationRate', 'dropRate', 'expGain']
      const memberTypes = ['permanentStat', 'permanentStatMulti', 'effortGain', 'healBattle', 'cleanse', 'breakthroughRate', 'enhanceRate', 'reforgeSafe']

      if (globalTypes.includes(baseEffect.type)) {
        // P0-B：同类丹药改为"刷新而非叠加"——服用新 buff 前清除同类型旧 buff
        // （否则玩家可囤药击穿封顶，与 getPillBuffMultiplier 的 Math.min 配合实现"以最新为准"）
        this.activePillBuffs = (this.activePillBuffs || []).filter(b => b.type !== baseEffect.type)
        this.activePillBuffs.push({
          pillId,
          type: baseEffect.type,
          value: effect.value,
          expiresAt,
          scope: 'global'
        })
        // 兼容旧 getter：expGain / dropRate 同步刷新 pillEffects（先清后写，避免双写累积）
        if (baseEffect.type === 'expGain' || baseEffect.type === 'dropRate') {
          this.pillEffects = (this.pillEffects || []).filter(e => e.type !== baseEffect.type)
          this.pillEffects.push({
            type: baseEffect.type,
            value: effect.value,
            startTime: now,
            endTime: expiresAt
          })
        }
        const globalStatMap = {
          spiritStoneRate: '灵石获取',
          cultivationRate: '修炼速度',
          dropRate: '掉落加成',
          expGain: '修为获取'
        }
        const pct = Math.round(effect.value * 100)
        changes.push({
          stat: globalStatMap[baseEffect.type] || baseEffect.type,
          old: 0,
          new: pct,
          delta: pct,
          isGlobal: true,
          unit: '%'
        })
      } else if (memberTypes.includes(baseEffect.type)) {
        if (!memberId) {
          window.$message?.error('该丹药需要指定服用角色')
          return { success: false, message: '该丹药需要指定服用角色' }
        }
        const member = this.sectMembers.find(m => m.id === memberId)
        if (!member) {
          window.$message?.error('角色不存在')
          return { success: false, message: '角色不存在' }
        }
        if (!member.activePills) member.activePills = []
        member.activePills.push({
          pillId,
          type: baseEffect.type,
          value: effect.value,
          expiresAt,
          scope: 'member',
          memberId
        })
        // 即时生效逻辑
        switch (baseEffect.type) {
          case 'permanentStat':
          case 'permanentStatMulti': {
            // P0-A：永久丹必须消耗"努力值预算"——这是星级稀有度的总闸门
            // 5★ 无上限跳过；3★/4★ 校验 member.effortValue + cost <= cap
            if (!member.star) member.star = 3
            if (typeof member.effortValue !== 'number') member.effortValue = 0
            const effortCost = effect.effortCost || 0
            const cap = getEffortCap(member.star)
            if (effortCost > 0 && member.effortValue + effortCost > cap) {
              window.$message?.error(`${member.name}的努力值不足（${member.effortValue}/${cap}，需要 ${effortCost}）`)
              return { success: false, message: '努力值不足（受星级上限限制）' }
            }
            if (effortCost > 0) {
              const oldEffort = member.effortValue
              member.effortValue += effortCost
              changes.push({ stat: '努力值', old: oldEffort, new: member.effortValue, delta: effortCost, note: `（占用 ${effortCost}）` })
            }
            if (baseEffect.type === 'permanentStat') {
              const stat = effect.stat
              const val = Math.round(effect.value)
              if (!member.permanentBonuses) member.permanentBonuses = { attack: 0, health: 0, defense: 0, speed: 0 }
              if (member.permanentBonuses[stat] !== undefined) member.permanentBonuses[stat] += val
              const oldBase = member.baseStats?.[stat] || 0
              if (member.baseStats && member.baseStats[stat] !== undefined) {
                member.baseStats[stat] += val
                changes.push({ stat: statNameMap[stat] || stat, old: oldBase, new: oldBase + val, delta: val })
              }
            } else {
              // permanentStatMulti：仙灵丹/五行丹一次性永久提升多属性
              if (!member.permanentBonuses) member.permanentBonuses = { attack: 0, health: 0, defense: 0, speed: 0 }
              if (!member.baseStats) member.baseStats = { attack: 10, health: 100, defense: 5, speed: 10 }
              const stats = effect.stats || baseEffect.stats || {}
              Object.entries(stats).forEach(([stat, val]) => {
                const roundedVal = Math.round(val)
                if (roundedVal <= 0) return
                const oldBase = member.baseStats[stat] || 0
                member.baseStats[stat] = oldBase + roundedVal
                if (member.permanentBonuses[stat] !== undefined) {
                  member.permanentBonuses[stat] += roundedVal
                } else {
                  member.permanentBonuses[stat] = roundedVal
                }
                changes.push({ stat: statNameMap[stat] || stat, old: oldBase, new: oldBase + roundedVal, delta: roundedVal })
              })
            }
            break
          }
          case 'effortGain': {
            // 培元丹系列：作为"努力值来源"，受 cap 约束（与永久丹消费方向相反）
            if (!member.star) member.star = 3
            if (typeof member.effortValue !== 'number') member.effortValue = 0
            const gain = effect.value || 0
            const ignoreCap = effect.ignoreCap
            const cap = getEffortCap(member.star)
            if (!ignoreCap && member.effortValue >= cap) {
              window.$message?.error(`${member.name}的努力值已达上限`)
              return { success: false, message: '努力值已达上限' }
            }
            const oldValue = member.effortValue
            let newValue = oldValue + gain
            if (!ignoreCap) newValue = Math.min(newValue, cap)
            const actualGain = Math.round(newValue - oldValue)
            if (actualGain <= 0) {
              window.$message?.error('努力值没有提升')
              return { success: false, message: '努力值没有提升' }
            }
            member.effortValue = Math.round(newValue)
            changes.push({ stat: '努力值', old: Math.round(oldValue), new: Math.round(newValue), delta: actualGain })
            // 直接属性增益（培元丹附赠属性，不消耗 effort，由 effortGain 自身的发放预算承担）
            if (effect.extraStats) {
              if (!member.permanentBonuses) member.permanentBonuses = { attack: 0, health: 0, defense: 0, speed: 0 }
              Object.entries(effect.extraStats).forEach(([stat, val]) => {
                const roundedVal = Math.round(val)
                if (roundedVal <= 0) return
                if (!member.baseStats) member.baseStats = { attack: 10, health: 100, defense: 5, speed: 10 }
                const oldStat = member.baseStats[stat] || 0
                member.baseStats[stat] = oldStat + roundedVal
                if (member.permanentBonuses[stat] !== undefined) {
                  member.permanentBonuses[stat] += roundedVal
                } else {
                  member.permanentBonuses[stat] = roundedVal
                }
                changes.push({ stat: statNameMap[stat] || stat, old: oldStat, new: oldStat + roundedVal, delta: roundedVal })
              })
            }
            break
          }
          case 'healBattle':
          case 'cleanse':
            // 进入战斗丹药队列，由战斗界面消耗
            this.battlePills.push({
              ...effect,
              uid: `${effect.type}_${now}_${Math.floor(Math.random() * 1e6)}`,
              used: false
            })
            break
          case 'breakthroughRate': {
            const oldVal = member.breakthroughBonus || 0
            if (!member.breakthroughBonus) member.breakthroughBonus = 0
            member.breakthroughBonus = Math.min(0.9, member.breakthroughBonus + effect.value)
            changes.push({ stat: '突破成功率', old: Math.round(oldVal * 100), new: Math.round(member.breakthroughBonus * 100), delta: Math.round(effect.value * 100), unit: '%' })
            break
          }
          case 'enhanceRate': {
            const oldVal = member.enhanceBonus || 0
            if (!member.enhanceBonus) member.enhanceBonus = 0
            member.enhanceBonus = Math.min(0.9, member.enhanceBonus + effect.value)
            changes.push({ stat: '强化成功率', old: Math.round(oldVal * 100), new: Math.round(member.enhanceBonus * 100), delta: Math.round(effect.value * 100), unit: '%' })
            break
          }
          case 'reforgeSafe': {
            const oldVal = member.reforgeSafeCharges || 0
            if (!member.reforgeSafeCharges) member.reforgeSafeCharges = 0
            member.reforgeSafeCharges += Math.max(1, Math.round(effect.value))
            changes.push({ stat: '洗练保底', old: oldVal, new: member.reforgeSafeCharges, delta: Math.max(1, Math.round(effect.value)) })
            break
          }
        }
      } else {
        // 未知类型默认全局
        this.activePillBuffs.push({
          pillId,
          type: baseEffect.type,
          value: effect.value,
          expiresAt,
          scope: 'global'
        })
      }

      owned.count--
      if (owned.count <= 0) {
        delete this.ownedPills[pillId]
      }
      this.pillsConsumed++
      this.queueSave()

      return { success: true, message: `服用${recipe.name}成功`, changes }
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
        // 超过突破上限后才会转灵魂碎片（突破5层后，重复角色仅给1枚通用灵魂碎片）
        const essenceAmount = 1
        if (!this.characterEssence) this.characterEssence = 0
        this.characterEssence += essenceAmount
        this.queueSave()
        return {
          success: true,
          message: `${character.name} 突破已达上限，自动转换为 1 枚通用灵魂碎片`,
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
      // 突破前防御性校验：baseStats 异常时先重算，避免在 0 值上 ×1.2 仍是 0
      if (isMemberBaseStatsAbnormal(member)) {
        recalculateMemberBaseStats(member)
      }
      // 基础数值 ×BREAKTHROUGH_MULT（复利，与 recalculateMemberBaseStats 一致）
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
      // 突破获得新技能（每突破一次获得2个）
      const newSkills = getSkillsForBreakthrough(member.role, member.breakThrough)
      if (newSkills.length > 0) {
        if (!member.skills) member.skills = []
        member.skills.push(...newSkills)
      }
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
    // 获取队伍总Build强度（含宗派共鸣加成）
    getTeamTotalBuild() {
      const team = this.getTeamMembersDetail()
      const baseTotal = team.reduce((sum, member) => {
        return sum + this.getCharacterBuildStrength(member)
      }, 0)
      // 应用宗派共鸣战力加成
      const resonanceMultiplier = getResonanceBuildMultiplier(team)
      return Math.round(baseTotal * resonanceMultiplier)
    },
    // 获取单个角色的Build强度
    // 平衡修复（v2）：原公式装备占 60%，但装备评分被小数值百分比词条（critRate/combatBoost 等
    // value 仅 0.05~0.3 的词条每条 × 300 分）虚高堆分，导致 build 133% 的玩家实际攻击力不够破防。
    // 现调整：人物基础属性（attack/health/defense/speed）占 55%，装备占 45%，
    // 让 build 更忠实反映"能造成多少伤害/能扛多久"，而非"堆了多少词条"。
    getCharacterBuildStrength(character) {
      if (!character) return 0
      const effStats = getEffectiveBaseStats(character)
      const ts = character.talentStats || {}
      // 主属性权重提高：attack 从 5→8、health 从 0.5→0.8、defense 从 3→5、speed 从 8→12
      const charBaseScore = ((effStats.attack || 0) + (ts.attack || 0)) * 8 +
                        ((effStats.health || 0) + (ts.health || 0)) * 0.8 +
                        ((effStats.defense || 0) + (ts.defense || 0)) * 5 +
                        ((effStats.speed || 0) + (ts.speed || 0)) * 12
      let equipScore = 0
      const artifacts = character.equippedArtifacts || {}
      Object.values(artifacts).forEach(eq => {
        if (!eq) return
        equipScore += calculateEquipmentScore(eq)
      })
      let petScore = 0
      if (character.equippedPet) {
        const ca = character.equippedPet.combatAttributes || {}
        petScore = (ca.attack || 0) * 8 + (ca.health || 0) * 0.8 + (ca.defense || 0) * 5 + (ca.speed || 0) * 12
      }
      let setScore = 0
      const activeSets = getActiveSetBonuses(artifacts)
      for (const sb of activeSets) {
        if (sb.count >= 2) setScore += 200
        if (sb.count >= 3) setScore += 100
        if (sb.count >= 4) setScore += 200
        if (sb.count >= 5) setScore += 300
      }
      let skillScore = 0
      const skills = character.skills || []
      for (const skill of skills) {
        const effect = skill.effect || {}
        if (skill.type === 'passive') {
          if (effect.stat === 'attack') skillScore += (effect.value || 0) * 1000
          if (effect.stat === 'health') skillScore += (effect.value || 0) * 500
          if (effect.stat === 'defense') skillScore += (effect.value || 0) * 800
          if (effect.stat === 'speed') skillScore += (effect.value || 0) * 1200
          if (effect.armorPenetration) skillScore += effect.armorPenetration * 800
          if (effect.damagePercent) skillScore += effect.damagePercent * 500
          if (effect.finalDamageReduce) skillScore += effect.finalDamageReduce * 600
          if (effect.vampireRate) skillScore += effect.vampireRate * 400
        } else {
          if (effect.damagePercent) skillScore += effect.damagePercent * 200
          if (effect.stat === 'attack') skillScore += (effect.value || 0) * 400
          if (effect.stat === 'defense') skillScore += (effect.value || 0) * 300
        }
      }
      const characterPower = charBaseScore + skillScore + petScore * 0.5
      const equipmentPower = equipScore + setScore
      // 人物占 55%（原 40%），装备占 45%（原 60%）
      const totalPower = characterPower * 0.55 + equipmentPower * 0.45
      const levelMult = 1 + ((character.level || 1) - 1) * 0.02
      return Math.round(totalPower * levelMult)
    },
    // 角色升级
    levelUpCharacter(memberId) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      const requiredExp = calculateLevelExp(member.level)
      if (member.maxExperience !== requiredExp) {
        member.maxExperience = requiredExp
      }
      if (member.experience < member.maxExperience) {
        return { success: false, message: '经验不足' }
      }
      // 防御性校验：baseStats 异常（全0/缺失/被回填为玩家默认值）时先按 templateId 重算，
      // 否则乘法复利会把 0 永久保留，或从 10/100/5/10 低基数成长导致「二十几级仍很低」。
      if (isMemberBaseStatsAbnormal(member)) {
        recalculateMemberBaseStats(member)
      }
      member.level++
      member.experience -= member.maxExperience
      member.maxExperience = calculateLevelExp(member.level)
      // 成长公式统一走 GROWTH_RATE × starCfg.growthRate，避免内联硬编码与 characters.js 重复
      const growth = characterStarConfig[member.star]?.growthRate || 1
      member.baseStats.attack = Math.round(member.baseStats.attack * (1 + GROWTH_RATE.attack * growth))
      member.baseStats.health = Math.round(member.baseStats.health * (1 + GROWTH_RATE.health * growth))
      member.baseStats.defense = Math.round(member.baseStats.defense * (1 + GROWTH_RATE.defense * growth))
      member.baseStats.speed = Math.round(member.baseStats.speed * (1 + GROWTH_RATE.speed * growth))
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
    // 从公共池分配修为给角色
    allocateCultivationToMember(memberId, amount) {
      const numAmount = Number(amount)
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        return { success: false, message: '无效的修为数量' }
      }
      if (!this.cultivationPool || this.cultivationPool < numAmount) {
        return { success: false, message: '公共修为池不足' }
      }
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) {
        return { success: false, message: '成员不存在' }
      }
      if (!member.level) member.level = 1
      if (!member.experience) member.experience = 0
      // baseStats 异常时按 templateId 重算（而非回填玩家默认值 10/100/5/10，
      // 否则 5 星角色从低基数成长，二十几级仍远低于正常 1 级数值）
      if (isMemberBaseStatsAbnormal(member)) {
        recalculateMemberBaseStats(member)
      }
      this.cultivationPool -= numAmount
      member.experience += numAmount
      let levelsGained = 0
      let breakthroughCount = 0
      let safetyCounter = 0
      const MAX_LEVEL = 999
      while (safetyCounter < 200) {
        safetyCounter++
        const requiredExp = calculateLevelExp(member.level)
        if (member.experience < requiredExp) break
        if (member.level >= MAX_LEVEL) break
        const nextLevel = member.level + 1
        // 突破检查：材料不足时仍然允许升级，但不消耗材料、不计入突破次数
        let didBreakthrough = false
        if (member.level % 9 === 0 && member.level > 0) {
          const breakthroughCost = calculateBreakthroughCost(member.level)
          if (this.spiritStones >= breakthroughCost.spiritStones) {
            let hasAllMaterials = true
            if (breakthroughCost.materials && breakthroughCost.materials.length > 0) {
              for (const mat of breakthroughCost.materials) {
                const matCount = this.materials.filter(m => m.id === mat.id).length
                if (matCount < mat.amount) {
                  hasAllMaterials = false
                  break
                }
              }
            }
            if (hasAllMaterials) {
              this.spiritStones -= breakthroughCost.spiritStones
              if (breakthroughCost.materials && breakthroughCost.materials.length > 0) {
                for (const mat of breakthroughCost.materials) {
                  let remaining = mat.amount
                  for (let i = this.materials.length - 1; i >= 0 && remaining > 0; i--) {
                    if (this.materials[i].id === mat.id) {
                      this.materials.splice(i, 1)
                      remaining--
                    }
                  }
                }
              }
              breakthroughCount++
              didBreakthrough = true
            }
          }
        }
        member.experience -= requiredExp
        member.level = nextLevel
        member.maxExperience = calculateLevelExp(member.level)
        const growth = characterStarConfig[member.star]?.growthRate || 1
        member.baseStats.attack = Math.round(member.baseStats.attack * (1 + GROWTH_RATE.attack * growth))
        member.baseStats.health = Math.round(member.baseStats.health * (1 + GROWTH_RATE.health * growth))
        member.baseStats.defense = Math.round(member.baseStats.defense * (1 + GROWTH_RATE.defense * growth))
        member.baseStats.speed = Math.round(member.baseStats.speed * (1 + GROWTH_RATE.speed * growth))
        levelsGained++
      }
      this.queueSave()
      let message = `成功分配 ${numAmount} 修为给 ${member.name}`
      if (levelsGained > 0) {
        message += `，升级 ${levelsGained} 级`
        if (breakthroughCount > 0) {
          message += `（突破 ${breakthroughCount} 次大境界）`
        }
      }
      return {
        success: true,
        message,
        levelsGained,
        breakthroughCount,
        newLevel: member.level
      }
    },
    // 回炉重造（升星）：80级后可升星到下一级
    rebirthCharacter(memberId) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      if (!member.star) member.star = 3
      if (member.level < 80) {
        return { success: false, message: '角色需达到80级才能回炉重造' }
      }
      if (member.star >= 5) {
        return { success: false, message: '五星角色已达最高星级' }
      }
      const result = rebirthCharacter(member)
      if (!result.success) {
        return { success: false, message: result.message }
      }
      // 保存突破次数（回炉重造保留突破数据）
      const savedBreakThrough = member.breakThrough || 0
      // 应用新的基础属性和天赋值
      member.talentValue = result.newTalent
      member.baseStats = result.newBaseStats
      member.star = result.newStar
      member.effortValue = 0
      // 恢复突破次数
      member.breakThrough = savedBreakThrough
      member.experience = 0
      member.level = 1
      member.maxExperience = calculateLevelExp(1)
      this.queueSave()
      return {
        success: true,
        message: `${member.name}回炉重造成功！晋升${member.star}星，天赋值 ${result.oldTalent} → ${result.newTalent}`,
        oldStar: result.oldStar,
        newStar: result.newStar,
        oldTalent: result.oldTalent,
        newTalent: result.newTalent,
        inheritedBonus: result.inheritedBonus
      }
    },
    // 更新角色头像
    updateCharacterAvatar(memberId, avatarData) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      member.avatar = avatarData
      this.queueSave()
      return { success: true, message: '头像更新成功' }
    },
    // 给角色装备灵宠（排他：同一灵宠按 uid/id 同时只能被一个角色装备）
    equipCharacterPet(memberId, pet) {
      const member = this.sectMembers.find(m => m.id === memberId)
      if (!member) return { success: false, message: '成员不存在' }
      if (!pet || pet.type !== 'pet') return { success: false, message: '目标不是灵宠' }
      const petKey = (p) => p && (p.uid || p.id)
      const targetKey = petKey(pet)
      // 排他性：若该灵宠已被其他角色装备，先从其他角色卸下（不回背包，避免同一灵宠被两个角色同时持有）
      this.sectMembers.forEach(m => {
        if (m.id !== memberId && m.equippedPet && (petKey(m.equippedPet) === targetKey || m.equippedPet === pet)) {
          m.equippedPet = null
        }
      })
      // 卸下当前角色旧灵宠（归还背包）
      if (member.equippedPet) {
        this.items.push(member.equippedPet)
      }
      // 从背包移除该灵宠（按 uid/id 精确匹配，清除历史上可能重复的同 id 条目）
      let petIndex
      while ((petIndex = this.items.findIndex(p => (p.uid === pet.uid || p.id === pet.id) && p.type === 'pet')) !== -1) {
        this.items.splice(petIndex, 1)
      }
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
      const slots = ['head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'necklace', 'ring1', 'ring2', 'belt', 'artifact']
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
      // 检查是否为出战灵宠
      if (this.activePet && (this.activePet.uid === pet.uid || this.activePet.id === pet.id)) {
        return { success: false, message: '出战中的灵宠无法放生，请先收回' }
      }
      // 检查是否被宗门成员装备
      for (const m of this.sectMembers) {
        if (m.equippedPet && (m.equippedPet.uid === pet.uid || m.equippedPet.id === pet.id)) {
          return { success: false, message: `${m.name}正在装备该灵宠，无法放生` }
        }
      }
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
