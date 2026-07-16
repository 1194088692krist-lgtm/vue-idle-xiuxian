<template>
  <div class="dungeon-page">
    <n-card title="秘境探索" class="dungeon-card">
      <template #header-extra>
        <n-space>
          <n-select
            v-model:value="playerStore.dungeonDifficulty"
            @update:value="handleUpdateValue"
            placeholder="请选择难度"
            :options="dungeonOptions"
            style="width: 120px"
            :disabled="dungeonState.inCombat || dungeonState.showingOptions"
          />
          <n-button
            type="primary"
            @click="startDungeon"
            :disabled="dungeonState.inCombat || dungeonState.showingOptions"
          >
            开始探索
          </n-button>
        </n-space>
      </template>
      <n-space vertical>
        <!-- 层数显示 -->
        <n-statistic label="当前层数" :value="dungeonState.floor" />
        <!-- 当前遭遇怪物状态面板（常驻显示） -->
        <n-card
          v-if="dungeonState.combatManager?.enemy"
          class="enemy-status-card"
          :bordered="false"
          style="margin-bottom: 12px"
        >
          <template #header>
            <span class="enemy-status-title">👹 当前遭遇：{{ dungeonState.combatManager.enemy.name }}</span>
          </template>
          <!-- 血条 -->
          <div class="es-hp-row">
            <span class="es-hp-label">生命</span>
            <div class="es-hp-bar">
              <div
                class="es-hp-fill"
                :style="{
                  width: `${
                    (dungeonState.combatManager.enemy.currentHealth /
                      dungeonState.combatManager.enemy.stats.maxHealth) *
                    100
                  }%`
                }"
              ></div>
            </div>
            <span class="es-hp-text">
              {{ dungeonState.combatManager.enemy.currentHealth.toFixed(1) }} /
              {{ dungeonState.combatManager.enemy.stats.maxHealth.toFixed(1) }}
            </span>
          </div>
          <!-- 数值信息 -->
          <div class="es-stats-grid">
            <div class="es-stat"><span>攻击力</span><b>{{ dungeonState.combatManager.enemy.stats.damage.toFixed(1) }}</b></div>
            <div class="es-stat"><span>防御力</span><b>{{ dungeonState.combatManager.enemy.stats.defense.toFixed(1) }}</b></div>
            <div class="es-stat"><span>速度</span><b>{{ dungeonState.combatManager.enemy.stats.speed.toFixed(1) }}</b></div>
            <div class="es-stat"><span>生命上限</span><b>{{ dungeonState.combatManager.enemy.stats.maxHealth.toFixed(1) }}</b></div>
          </div>
          <!-- 正面/负面状态 -->
          <div class="es-status-group">
            <div class="es-status-col">
              <div class="es-status-title positive">正面状态</div>
              <div v-for="s in enemyPositiveStatuses" :key="s.name" class="es-status-chip positive">
                {{ s.name }} {{ (s.value * 100).toFixed(1) }}%
              </div>
              <div v-if="enemyPositiveStatuses.length === 0" class="es-status-empty">无</div>
            </div>
            <div class="es-status-col">
              <div class="es-status-title negative">负面状态</div>
              <div v-for="s in enemyNegativeStatuses" :key="s.name" class="es-status-chip negative">
                {{ s.name }} {{ (s.value * 100).toFixed(1) }}%
              </div>
              <div v-if="enemyNegativeStatuses.length === 0" class="es-status-empty">无</div>
            </div>
          </div>
        </n-card>
        <!-- 选项界面 -->
        <n-card v-if="dungeonState.showingOptions" title="选择增益">
          <template #header-extra>
            <n-space>
              <n-button type="primary" @click="handleRefreshOptions" :disabled="refreshNumber === 0">
                刷新增益({{ refreshNumber }})
              </n-button>
            </n-space>
          </template>
          <div class="option-cards">
            <div
              v-for="option in dungeonState.currentOptions"
              :key="option.id"
              class="option-card"
              :style="{ borderColor: getOptionColor(option.type).color }"
              @click="selectOption(option)"
            >
              <div class="option-name">{{ option.name }}</div>
              <div class="option-description">{{ option.description }}</div>
              <div class="option-quality" :style="{ color: getOptionColor(option.type).color }">
                {{ getOptionColor(option.type).name }}
              </div>
            </div>
          </div>
        </n-card>
        <!-- 战斗界面 -->
        <template v-if="dungeonState.inCombat && dungeonState.combatManager">
          <n-card :bordered="false">
            <n-divider>
              {{ dungeonState.combatManager.round }} / {{ dungeonState.combatManager.maxRounds }}回合
            </n-divider>
            <!-- 添加战斗场景 -->
            <div class="combat-scene">
              <div class="character player" :class="{ attack: playerAttacking, hurt: playerHurt }">
                <div v-if="playerAttacking" class="attack-effect player-effect"></div>
                <n-button class="character-name" type="info" dashed @click="infoCliclk('player')">
                  {{ dungeonState.combatManager.player.name }}
                </n-button>
                <div class="character-avatar player-avatar">
                  {{ dungeonState.combatManager.player.name[0] }}
                </div>
                <div class="health-bar">
                  <div
                    class="health-fill"
                    :style="{
                      width: `${
                        (dungeonState.combatManager.player.currentHealth /
                          dungeonState.combatManager.player.stats.maxHealth) *
                        100
                      }%`
                    }"
                  ></div>
                </div>
              </div>
              <div class="character enemy" :class="{ attack: enemyAttacking, hurt: enemyHurt }">
                <div v-if="enemyAttacking" class="attack-effect enemy-effect"></div>
                <n-button class="character-name" type="error" dashed @click="infoCliclk('enemy')">
                  {{ dungeonState.combatManager.enemy.name }}
                </n-button>
                <div class="character-avatar enemy-avatar">
                  {{ dungeonState.combatManager.enemy.name[0] }}
                </div>
                <div class="health-bar">
                  <div
                    class="health-fill"
                    :style="{
                      width: `${
                        (dungeonState.combatManager.enemy.currentHealth /
                          dungeonState.combatManager.enemy.stats.maxHealth) *
                        100
                      }%`
                    }"
                  ></div>
                </div>
              </div>
            </div>
            <n-modal
              v-model:show="infoShow"
              preset="dialog"
              :title="`${
                infoType == 'player' ? dungeonState.combatManager.player.name : dungeonState.combatManager.enemy.name
              }的属性`"
            >
              <n-card :bordered="false">
                <!-- 玩家属性 -->
                <template v-if="infoType == 'player'">
                  <n-divider>基础属性</n-divider>
                  <n-descriptions bordered :column="2">
                    <n-descriptions-item label="生命值">
                      {{ dungeonState.combatManager.player.currentHealth.toFixed(1) }} /
                      {{ dungeonState.combatManager.player.stats.maxHealth.toFixed(1) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="攻击力">
                      {{ dungeonState.combatManager.player.stats.damage.toFixed(1) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="防御力">
                      {{ dungeonState.combatManager.player.stats.defense.toFixed(1) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="速度">
                      {{ dungeonState.combatManager.player.stats.speed.toFixed(1) }}
                    </n-descriptions-item>
                  </n-descriptions>
                  <n-divider>战斗属性</n-divider>
                  <n-descriptions bordered :column="3">
                    <n-descriptions-item label="暴击率">
                      {{ (dungeonState.combatManager.player.stats.critRate * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="连击率">
                      {{ (dungeonState.combatManager.player.stats.comboRate * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="反击率">
                      {{ (dungeonState.combatManager.player.stats.counterRate * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="眩晕率">
                      {{ (dungeonState.combatManager.player.stats.stunRate * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="闪避率">
                      {{ (dungeonState.combatManager.player.stats.dodgeRate * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="吸血率">
                      {{ (dungeonState.combatManager.player.stats.vampireRate * 100).toFixed(1) }}%
                    </n-descriptions-item>
                  </n-descriptions>
                  <n-divider>战斗抗性</n-divider>
                  <n-descriptions bordered :column="3">
                    <n-descriptions-item label="抗暴击">
                      {{ (dungeonState.combatManager.player.stats.critResist * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="抗连击">
                      {{ (dungeonState.combatManager.player.stats.comboResist * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="抗反击">
                      {{ (dungeonState.combatManager.player.stats.counterResist * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="抗眩晕">
                      {{ (dungeonState.combatManager.player.stats.stunResist * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="抗闪避">
                      {{ (dungeonState.combatManager.player.stats.dodgeResist * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="抗吸血">
                      {{ (dungeonState.combatManager.player.stats.vampireResist * 100).toFixed(1) }}%
                    </n-descriptions-item>
                  </n-descriptions>
                  <n-divider>特殊属性</n-divider>
                  <n-descriptions bordered :column="4">
                    <n-descriptions-item label="强化治疗">
                      {{ (dungeonState.combatManager.player.stats.healBoost * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="强化爆伤">
                      {{ (dungeonState.combatManager.player.stats.critDamageBoost * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="弱化爆伤">
                      {{ (dungeonState.combatManager.player.stats.critDamageReduce * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="最终增伤">
                      {{ (dungeonState.combatManager.player.stats.finalDamageBoost * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="最终减伤">
                      {{ (dungeonState.combatManager.player.stats.finalDamageReduce * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="战斗属性提升">
                      {{ (dungeonState.combatManager.player.stats.combatBoost * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="战斗抗性提升">
                      {{ (dungeonState.combatManager.player.stats.resistanceBoost * 100).toFixed(1) }}%
                    </n-descriptions-item>
                  </n-descriptions>
                </template>
                <!-- 敌人属性 -->
                <template v-else>
                  <n-divider>基础属性</n-divider>
                  <n-descriptions bordered :column="2">
                    <n-descriptions-item label="生命值">
                      {{ dungeonState.combatManager.enemy.currentHealth.toFixed(1) }} /
                      {{ dungeonState.combatManager.enemy.stats.maxHealth.toFixed(1) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="攻击力">
                      {{ dungeonState.combatManager.enemy.stats.damage.toFixed(1) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="防御力">
                      {{ dungeonState.combatManager.enemy.stats.defense.toFixed(1) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="速度">
                      {{ dungeonState.combatManager.enemy.stats.speed.toFixed(1) }}
                    </n-descriptions-item>
                  </n-descriptions>
                  <n-divider>战斗属性</n-divider>
                  <n-descriptions bordered :column="3">
                    <n-descriptions-item label="暴击率">
                      {{ (dungeonState.combatManager.enemy.stats.critRate * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="连击率">
                      {{ (dungeonState.combatManager.enemy.stats.comboRate * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="反击率">
                      {{ (dungeonState.combatManager.enemy.stats.counterRate * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="眩晕率">
                      {{ (dungeonState.combatManager.enemy.stats.stunRate * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="闪避率">
                      {{ (dungeonState.combatManager.enemy.stats.dodgeRate * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="吸血率">
                      {{ (dungeonState.combatManager.enemy.stats.vampireRate * 100).toFixed(1) }}%
                    </n-descriptions-item>
                  </n-descriptions>
                  <n-divider>战斗抗性</n-divider>
                  <n-descriptions bordered :column="3">
                    <n-descriptions-item label="抗暴击">
                      {{ (dungeonState.combatManager.enemy.stats.critResist * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="抗连击">
                      {{ (dungeonState.combatManager.enemy.stats.comboResist * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="抗反击">
                      {{ (dungeonState.combatManager.enemy.stats.counterResist * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="抗眩晕">
                      {{ (dungeonState.combatManager.enemy.stats.stunResist * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="抗闪避">
                      {{ (dungeonState.combatManager.enemy.stats.dodgeResist * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="抗吸血">
                      {{ (dungeonState.combatManager.enemy.stats.vampireResist * 100).toFixed(1) }}%
                    </n-descriptions-item>
                  </n-descriptions>
                  <n-divider>特殊属性</n-divider>
                  <n-descriptions bordered :column="3">
                    <n-descriptions-item label="强化治疗">
                      {{ (dungeonState.combatManager.enemy.stats.healBoost * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="强化爆伤">
                      {{ (dungeonState.combatManager.enemy.stats.critDamageBoost * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="弱化爆伤">
                      {{ (dungeonState.combatManager.enemy.stats.critDamageReduce * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="最终增伤">
                      {{ (dungeonState.combatManager.enemy.stats.finalDamageBoost * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="最终减伤">
                      {{ (dungeonState.combatManager.enemy.stats.finalDamageReduce * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="战斗属性提升">
                      {{ (dungeonState.combatManager.enemy.stats.combatBoost * 100).toFixed(1) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="战斗抗性提升">
                      {{ (dungeonState.combatManager.enemy.stats.resistanceBoost * 100).toFixed(1) }}%
                    </n-descriptions-item>
                  </n-descriptions>
                </template>
              </n-card>
            </n-modal>
            <!-- 战斗日志 -->
            <log-panel ref="logRef" :messages="combatLog" style="margin-top: 16px" />
          </n-card>
        </template>
      </n-space>
    </n-card>
  </div>
</template>

<script setup>
  import { ref, computed, onUnmounted, reactive } from 'vue'
  import { usePlayerStore } from '../stores/player'
  import { getRealmName } from '../plugins/realm'
  import { CombatManager, CombatEntity, generateEnemy, CombatType } from '../plugins/combat'
  import { getRandomOptions } from '../plugins/dungeon'
  import dungeonBuffs from '../plugins/dungeonBuffs'
  import { useMessage } from 'naive-ui'
  import LogPanel from '../components/LogPanel.vue'

  // 战斗循环清理
  let combatTimer = null
  let combatResolve = null
  const sleep = ms => new Promise(resolve => {
    combatResolve = resolve
    combatTimer = setTimeout(() => {
      combatTimer = null
      combatResolve = null
      resolve()
    }, ms)
  })
  const stopCombatLoop = () => {
    dungeonState.inCombat = false
    if (combatTimer) {
      clearTimeout(combatTimer)
      combatTimer = null
    }
    if (combatResolve) {
      combatResolve()
      combatResolve = null
    }
  }

  const playerStore = usePlayerStore()
  const message = useMessage()
  const logRef = ref(null)
  const playerAttacking = ref(false)
  const playerHurt = ref(false)
  const enemyAttacking = ref(false)
  const enemyHurt = ref(false)
  const infoShow = ref(false)
  const infoType = ref('')

  const floorData = computed(() => {
    switch (playerStore.dungeonDifficulty) {
      case 1:
        return playerStore.dungeonHighestFloor
      case 2:
        return playerStore.dungeonHighestFloor_2
      case 5:
        return playerStore.dungeonHighestFloor_5
      case 10:
        return playerStore.dungeonHighestFloor_10
      case 100:
        return playerStore.dungeonHighestFloor_100
      default:
        return playerStore.dungeonHighestFloor
    }
  })

  // 副本状态
  const dungeonState = reactive({
    floor: floorData.value,
    inCombat: false,
    showingOptions: false,
    currentOptions: [],
    combatManager: null
  })

  // 当前遭遇怪物的正面状态（抗性类等对怪物有利的战斗状态）
  const enemyPositiveStatuses = computed(() => {
    const e = dungeonState.combatManager?.enemy
    if (!e || !e.stats) return []
    const s = e.stats
    return [
      { name: '抗眩晕', value: s.stunResist || 0 },
      { name: '抗吸血', value: s.vampireResist || 0 },
      { name: '抗暴击', value: s.critResist || 0 },
      { name: '抗反击', value: s.counterResist || 0 },
      { name: '抗闪避', value: s.dodgeResist || 0 }
    ].filter(x => x.value > 0)
  })

  // 当前遭遇怪物的负面状态（眩晕/吸血等异常类、对玩家不利的战斗状态）
  const enemyNegativeStatuses = computed(() => {
    const e = dungeonState.combatManager?.enemy
    if (!e || !e.stats) return []
    const s = e.stats
    return [
      { name: '眩晕', value: s.stunRate || 0 },
      { name: '吸血', value: s.vampireRate || 0 },
      { name: '反击', value: s.counterRate || 0 },
      { name: '暴击', value: s.critRate || 0 },
      { name: '连击', value: s.comboRate || 0 }
    ].filter(x => x.value > 0)
  })

  // 当前战斗日志
  const combatLog = ref([])

  // 根据选项类型获取颜色
  const getOptionColor = type => {
    const types = {
      epic: {
        name: '史诗',
        color: '#e91e63'
      },
      rare: {
        name: '稀有',
        color: '#2196f3'
      },
      common: {
        name: '普通',
        color: '#4caf50'
      }
    }
    return types[type]
  }

  // 创建玩家战斗实体
  const createPlayerEntity = () => {
    // 基础属性
    const baseStats = {
      health: playerStore.baseAttributes.health,
      damage: playerStore.baseAttributes.attack,
      defense: playerStore.baseAttributes.defense,
      speed: playerStore.baseAttributes.speed,
      // 战斗属性
      critRate: playerStore.combatAttributes.critRate,
      comboRate: playerStore.combatAttributes.comboRate,
      counterRate: playerStore.combatAttributes.counterRate,
      stunRate: playerStore.combatAttributes.stunRate,
      dodgeRate: playerStore.combatAttributes.dodgeRate,
      vampireRate: playerStore.combatAttributes.vampireRate,
      // 战斗抗性
      critResist: playerStore.combatResistance.critResist,
      comboResist: playerStore.combatResistance.comboResist,
      counterResist: playerStore.combatResistance.counterResist,
      stunResist: playerStore.combatResistance.stunResist,
      dodgeResist: playerStore.combatResistance.dodgeResist,
      vampireResist: playerStore.combatResistance.vampireResist,
      // 特殊属性
      healBoost: playerStore.specialAttributes.healBoost,
      critDamageBoost: playerStore.specialAttributes.critDamageBoost,
      critDamageReduce: playerStore.specialAttributes.critDamageReduce,
      finalDamageBoost: playerStore.specialAttributes.finalDamageBoost,
      finalDamageReduce: playerStore.specialAttributes.finalDamageReduce,
      combatBoost: playerStore.specialAttributes.combatBoost,
      resistanceBoost: playerStore.specialAttributes.resistanceBoost,
      // 其他属性
      spiritDamage: playerStore.spirit * 0.1,
      maxHealth: playerStore.baseAttributes.health
    }
    const entity = new CombatEntity(playerStore.name, playerStore.level, baseStats, playerStore.realm)
    // 应用所有激活的增益效果
    const activeBuffs = dungeonBuffs.getActiveBuffs()
    activeBuffs.forEach(buff => {
      if (typeof buff.effect === 'function') {
        buff.effect(entity)
      }
    })
    return entity
  }

  // 开始新的副本
  const startDungeon = () => {
    const startingFloor = floorData.value
    dungeonState.floor = startingFloor
    dungeonState.inCombat = false
    dungeonState.showingOptions = false
    dungeonState.currentOptions = []
    dungeonState.combatManager = null
    playerStore.dungeonTotalRuns++ // 增加总探索次数
    nextFloor()
  }

  // 进入下一层
  const nextFloor = () => {
    dungeonState.floor = dungeonState.floor + 1
    const floor = dungeonState.floor
    // 检查是否需要显示选项
    if (floor === 1 || floor % 5 === 0) {
      const randRefres = Math.floor(Math.random() * 3) + 1
      message.success(`获得了${randRefres}刷新次数`)
      refreshNumber.value = randRefres
      showOptions()
      return
    }
    startCombat()
  }

  // 显示随机选项
  const showOptions = () => {
    dungeonState.showingOptions = true
    dungeonState.currentOptions = getRandomOptions(dungeonState.floor)
  }

  // 选择选项
  const selectOption = option => {
    dungeonBuffs.apply(playerStore, option)
    message.success(`选择了：${option.name}`)
    dungeonState.showingOptions = false
    dungeonState.currentOptions = []
    startCombat()
  }

  // 处理失败
  const handleDefeat = () => {
    dungeonState.inCombat = false
    infoShow.value = false
    infoType.value = ''
    message.error(`在第 ${dungeonState.floor} 层被击败了...`)
    playerStore.dungeonDeathCount++
    // 清除所有临时增益效果
    dungeonBuffs.clear(playerStore)
    // 记录失败层数
    playerStore.dungeonLastFailedFloor = dungeonState.floor
    // 随机跌落境界或修为
    if (playerStore.dungeonDifficulty !== 100) {
      // 损失一定修为值作为惩罚
      const cultivationLossRate = Math.random() * 0.4 + 0.1 // 随机10%到50%
      const cultivationLoss = Math.floor(playerStore.cultivation * cultivationLossRate)
      playerStore.cultivation = Math.max(0, playerStore.cultivation - cultivationLoss)
      message.error(`战斗失败！损失了${cultivationLoss}点修为。`)
    } else {
      // 跌落境界作为惩罚
      const randomGradeLoss = Math.floor(Math.random() * 3) + 1 // 随机损失1-3个境界
      const playerLevel = Math.max(1, playerStore.level - randomGradeLoss) // 降低境界
      playerStore.level = playerLevel
      playerStore.cultivation = 0 // 移除所有灵力
      playerStore.maxCultivation = getRealmName(playerLevel).maxCultivation // 降低所需最大灵力值
      message.error(`战斗失败！跌落了${playerLevel}个境界。`)
    }
  }

  // 开始战斗
  const startCombat = () => {
    const floor = dungeonState.floor
    const isBossFloor = floor % 10 === 0
    const isEliteFloor = floor % 5 === 0
    const enemyType = isBossFloor ? CombatType.BOSS : isEliteFloor ? CombatType.ELITE : CombatType.NORMAL
    // 创建玩家战斗实体，并应用所有增益效果
    const playerEntity = createPlayerEntity()
    // 创建敌人
    const enemy = generateEnemy(floor, enemyType, playerStore.dungeonDifficulty)
    // 创建战斗管理器
    dungeonState.combatManager = new CombatManager(playerEntity, enemy, log => {
      if (logRef.value) {
        logRef.value.addLog(log)
      }
    })
    dungeonState.inCombat = true
    dungeonState.combatManager.start() // 初始化战斗状态
    autoCombat() // 开始自动战斗
  }

  // 自动战斗
  const autoCombat = async () => {
    while (dungeonState.inCombat) {
      const result = dungeonState.combatManager.executeTurn()
      if (result) {
        dungeonState.combatManager.enemy.currentHealth = result.enemyCurrentHealth
        dungeonState.combatManager.player.currentHealth = result.playerCurrentHealth
      }
      const getCombatLog = dungeonState.combatManager.getCombatLog()
      // 添加动画效果
      if (result && result.attacker === dungeonState.combatManager.player) {
        playerAttacking.value = true
        enemyHurt.value = true
        await sleep(500)
        playerAttacking.value = false
        enemyHurt.value = false
      } else if (result) {
        enemyAttacking.value = true
        playerHurt.value = true
        await sleep(500)
        enemyAttacking.value = false
        playerHurt.value = false
      }
      if (!result || !dungeonState.inCombat) break
      // 更新战斗日志
      getCombatLog.forEach(item => {
        logRef.value?.addLog('info', item)
      })
      // 检查战斗是否结束
      if (result.state === 'victory') {
        handleVictory()
        break
      } else if (result.state === 'defeat') {
        handleDefeat()
        break
      }
      // 添加延迟使战斗动画更流畅
      await sleep(500)
    }
  }

  onUnmounted(() => {
    stopCombatLoop()
    dungeonState.combatManager = null
    combatLog.value = []
  })

  // 处理胜利
  const handleVictory = () => {
    dungeonState.inCombat = false
    message.success(`击败了第 ${dungeonState.floor} 层的敌人！`)
    // 更新统计数据
    playerStore.dungeonTotalKills++
    if (dungeonState.floor % 10 === 0) {
      playerStore.dungeonBossKills++
    } else if (dungeonState.floor % 5 === 0) {
      // 增加洗练石
      playerStore.refinementStones += playerStore.dungeonDifficulty
      playerStore.dungeonEliteKills++
      message.success(`获得了${playerStore.dungeonDifficulty}颗洗练石`)
    }
    // 更新最高层数记录
    if (dungeonState.floor > playerStore.dungeonHighestFloor) {
      playerStore.dungeonHighestFloor = dungeonState.floor
    }
    // 获得奖励
    const rewards = generateRewards()
    rewards.forEach(reward => {
      playerStore.spiritStones += reward.amount
      message.success(`获得了 ${reward.amount} 灵石！`)
      playerStore.dungeonTotalRewards++
    })
    // 进入下一层
    nextFloor()
  }

  // 生成奖励
  const generateRewards = () => {
    const rewards = []
    // 灵石奖励
    const baseStones = 10 * dungeonState.floor * playerStore.dungeonDifficulty
    rewards.push({
      type: 'spirit_stones',
      amount: baseStones
    })
    return rewards
  }

  const infoCliclk = type => {
    infoShow.value = true
    infoType.value = type
  }

  const dungeonOptions = [
    {
      label: '简单',
      value: 1
    },
    {
      label: '普通',
      value: 2
    },
    {
      label: '困难',
      value: 5
    },
    {
      label: '地狱',
      value: 10
    },
    {
      label: '通天',
      value: 100
    }
  ]

  const handleUpdateValue = (value, option) => {
    if (value === 100) {
      message.warning('警告! 通天难度挑战失败后会跌落境界')
    }
  }
  const refreshNumber = ref(3)
  // 刷新选择
  const handleRefreshOptions = () => {
    showOptions()
    refreshNumber.value--
  }
</script>

<style scoped>
  .dungeon-page {
    padding: 0;
    min-height: 100%;
  }

  .dungeon-card {
    background: var(--color-bg-card);
  }

  .option-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 0;
    margin: 0 auto;
  }

  .option-card {
    position: relative;
    padding: 16px;
    border: 2px solid;
    border-radius: 12px;
    background: var(--n-color);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    min-height: 80px;
    width: 100%;
  }

  .option-card:hover {
    transform: translateX(5px);
    box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.1);
  }

  .option-name {
    font-size: 1.2em;
    font-weight: bold;
    margin-bottom: 8px;
    padding-right: 60px;
  }

  .option-description {
    flex-grow: 1;
    font-size: 1em;
    color: var(--n-text-color);
    line-height: 1.6;
    margin-bottom: 8px;
  }

  .option-quality {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 0.9em;
    font-weight: bold;
    padding: 4px 12px;
    border-radius: 20px;
    background: var(--n-color);
  }

  .combat-scene {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 12px;
    margin-bottom: 16px;
    min-height: 160px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
  }

  .character {
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.3s ease;
  }

  .character-avatar {
    width: 52px;
    height: 52px;
    font-size: 20px;
    margin: 8px 0;
  }

  .character-name {
    font-weight: bold;
    margin-bottom: 8px;
    font-size: 12px;
  }

  .health-bar {
    width: 80px;
    height: 8px;
    background: #ff000033;
    border-radius: 4px;
    overflow: hidden;
  }

  .health-fill {
    height: 100%;
    background: #ff0000;
    transition: width 0.3s ease;
  }

  /* 当前遭遇怪物状态面板 */
  .enemy-status-card {
    margin-bottom: 16px;
    background: linear-gradient(135deg, rgba(60, 10, 20, 0.55), rgba(20, 10, 30, 0.55));
    border: 1px solid rgba(233, 30, 99, 0.4);
    border-radius: 12px;
    box-shadow: 0 4px 18px rgba(233, 30, 99, 0.15);
  }

  .enemy-status-title {
    font-weight: 700;
    font-size: 15px;
    color: #ff8aa8;
    letter-spacing: 0.5px;
  }

  .es-hp-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .es-hp-label {
    font-size: 12px;
    color: #ffb3c6;
    white-space: nowrap;
  }

  .es-hp-bar {
    flex: 1;
    height: 16px;
    background: rgba(0, 0, 0, 0.45);
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .es-hp-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff4d4f, #ff7875);
    transition: width 0.4s ease;
    box-shadow: 0 0 8px rgba(255, 77, 79, 0.6);
  }

  .es-hp-text {
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
  }

  .es-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }

  .es-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 4px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .es-stat span {
    font-size: 11px;
    color: #c9c9c9;
    margin-bottom: 4px;
  }

  .es-stat b {
    font-size: 15px;
    color: #ffd666;
    font-weight: 700;
  }

  .es-status-group {
    display: flex;
    gap: 12px;
  }

  .es-status-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .es-status-title {
    font-size: 12px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 6px;
    text-align: center;
  }

  .es-status-title.positive {
    color: #95de64;
    background: rgba(82, 196, 26, 0.12);
    border: 1px solid rgba(82, 196, 26, 0.4);
  }

  .es-status-title.negative {
    color: #ff7875;
    background: rgba(255, 77, 79, 0.12);
    border: 1px solid rgba(255, 77, 79, 0.4);
  }

  .es-status-chip {
    font-size: 12px;
    padding: 5px 8px;
    border-radius: 6px;
    text-align: center;
    font-weight: 600;
  }

  .es-status-chip.positive {
    color: #b7eb8f;
    background: rgba(82, 196, 26, 0.18);
    border: 1px solid rgba(82, 196, 26, 0.5);
  }

  .es-status-chip.negative {
    color: #ffccc7;
    background: rgba(255, 77, 79, 0.18);
    border: 1px solid rgba(255, 77, 79, 0.5);
  }

  .es-status-empty {
    font-size: 12px;
    color: #888;
    padding: 4px 8px;
    text-align: center;
    font-style: italic;
  }

  .character.attack {
    animation: attack 0.5s ease;
  }

  .character.hurt {
    animation: hurt 0.5s ease;
  }

  .character-avatar {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    margin: 8px 0;
    color: #fff;
  }

  .player-avatar {
    background: linear-gradient(135deg, #4caf50, #2196f3);
    border-radius: 12px;
  }

  .enemy-avatar {
    background: linear-gradient(135deg, #ff5722, #e91e63);
    clip-path: polygon(50% 0%, 100% 38%, 100% 100%, 0 100%, 0% 38%);
  }

  .attack-effect {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    pointer-events: none;
  }

  .player-effect {
    background: radial-gradient(circle, #4caf50, #2196f3);
    animation: player-attack-effect 0.5s ease-out;
    right: -10px;
  }

  .enemy-effect {
    background: radial-gradient(circle, #ff5722, #e91e63);
    animation: enemy-attack-effect 0.5s ease-out;
    left: -10px;
  }

  .enemy.attack {
    animation: enemy-attack 0.5s ease;
  }

  @keyframes player-attack-effect {
    0% {
      transform: scale(0.5) translateX(0);
      opacity: 1;
    }
    100% {
      transform: scale(1.5) translateX(200px);
      opacity: 0;
    }
  }

  @keyframes enemy-attack-effect {
    0% {
      transform: scale(0.5) translateX(0);
      opacity: 1;
    }
    100% {
      transform: scale(1.5) translateX(-200px);
      opacity: 0;
    }
  }

  @keyframes attack {
    0% {
      transform: translateX(0) rotate(0deg);
    }
    25% {
      transform: translateX(20px) rotate(5deg);
    }
    50% {
      transform: translateX(40px) rotate(0deg);
    }
    75% {
      transform: translateX(20px) rotate(-5deg);
    }
    100% {
      transform: translateX(0) rotate(0deg);
    }
  }

  @keyframes hurt {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-10px);
    }
    75% {
      transform: translateX(10px);
    }
    100% {
      transform: translateX(0);
    }
  }

  @keyframes enemy-attack {
    0% {
      transform: translateX(0) rotate(0deg);
    }
    25% {
      transform: translateX(-20px) rotate(-5deg);
    }
    50% {
      transform: translateX(-40px) rotate(0deg);
    }
    75% {
      transform: translateX(-20px) rotate(5deg);
    }
    100% {
      transform: translateX(0) rotate(0deg);
    }
  /* 日间模式：怪物面板改为深色卡片 + 亮色文字（遵循暗底亮字原则） */
  html:not(.dark) .enemy-status-card {
    background: rgba(45, 44, 42, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
  }

  html:not(.dark) .enemy-status-title {
    color: #FFD86B;
  }

  html:not(.dark) .es-hp-label {
    color: #C9C4BA;
  }

  html:not(.dark) .es-hp-bar {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
  }

  html:not(.dark) .es-hp-text {
    color: #F5F0E8;
  }

  html:not(.dark) .es-stat {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
  }

  html:not(.dark) .es-stat span {
    color: #C9C4BA;
  }

  html:not(.dark) .es-stat b {
    color: #FFD86B;
  }

  html:not(.dark) .es-status-title.positive {
    color: #B6E6B8;
    background: rgba(122, 158, 126, 0.18);
    border-color: rgba(122, 158, 126, 0.5);
  }

  html:not(.dark) .es-status-title.negative {
    color: #FF9B9B;
    background: rgba(196, 77, 77, 0.18);
    border-color: rgba(196, 77, 77, 0.5);
  }

  html:not(.dark) .es-status-chip.positive {
    color: #B6E6B8;
    background: rgba(122, 158, 126, 0.18);
    border-color: rgba(122, 158, 126, 0.5);
  }

  html:not(.dark) .es-status-chip.negative {
    color: #FF9B9B;
    background: rgba(196, 77, 77, 0.15);
    border-color: rgba(196, 77, 77, 0.5);
  }

  html:not(.dark) .es-status-empty {
    color: #C9C4BA;
  }

</style>
