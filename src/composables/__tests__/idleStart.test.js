import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ===== 外部依赖 mock（让 runIdleEncounter 同步前缀可在测试中跑通，不触发真实插件/网络）=====
vi.mock('../../stores/player', () => {
  const members = [
    {
      id: 'm1', name: '测试弟子', role: 'vanguard', level: 1, schoolName: '剑宗',
      baseStats: { health: 300, attack: 80, defense: 30, speed: 20 },
      combatAttributes: {}, combatResistance: {}, specialAttributes: {}, talentStats: {},
      equippedArtifacts: {}, equippedPet: null, skills: [],
    },
  ]
  return {
    usePlayerStore: vi.fn(() => ({
      sectMembers: members,
      getTeamMembersDetail: () => members,
      baseAttributes: { attack: 100, health: 100, defense: 50, speed: 30 },
      spiritStones: 999999,
      cultivationPool: 1000,
      idleExploration: { isActive: true, zoneId: 'z', duration: 5 },
      items: [], itemsFound: 0, phantomCrystals: 0, petFragments: 0, pillRecipes: [], pillBuffs: [],
      getActivePillEffects: () => [],
      regenerateSpirit: vi.fn(),
      getCharacterBuildStrength: () => 1,
      startIdleExploration: vi.fn(),
      stopIdleExploration: vi.fn(),
      updateIdleExploration: vi.fn(),
      getIdleRemainingTime: () => 999999,
      queueSave: vi.fn(),
      saveData: vi.fn(),
      saveToCurrentSlot: () => Promise.resolve(),
      gainMaterial: vi.fn(), cultivate: vi.fn(), gainPillFragment: vi.fn(),
      getPillsByZone: () => [], addCharacterExperience: vi.fn(),
    })),
  }
})

// 难度配置：buildEffectiveZone 会把它合并进 effectiveZone，generateZoneEnemy 依赖 recommendedStats 等
const fakeDiff = {
  key: 'xiongxian', label: '游历', color: '#fff', spiritCost: 1,
  difficulty: 1, enemyScale: 1, dropBonus: 1, rewardMultiplier: 1,
  recommendedStats: { attack: 100, health: 100 },
}
vi.mock('../../plugins/zones', () => ({
  zones: [],
  getZoneById: () => ({ id: 'z', name: '测试秘境', monsters: ['测试妖兽'], minLevel: 1 }),
  getZoneDifficulty: () => fakeDiff,
}))
vi.mock('../../plugins/characters', () => ({ getCharacterThumbnail: () => '' }))
vi.mock('../../plugins/monsters', () => ({ getMonsterAvatarSync: () => '' }))

import { useIdleSystem } from '../useIdleSystem.js'

const idle = useIdleSystem()
const { startIdle, stopIdle, setSelectedZone, currentEncounter, currentIdleEnemy, idleCombatLog } = idle

const zoneStub = { id: 'z', name: '测试秘境', monsters: ['测试妖兽'], minLevel: 1 }

describe('点击挂机开始：实时战斗立即弹出 + 怪物信息仪表盘立即显示（Issues 1 & 2）', () => {
  beforeEach(() => {
    setSelectedZone(zoneStub)
  })

  afterEach(() => {
    // 停止挂机以清除 setInterval / setInterval 日志定时器，避免测试进程挂起
    try { stopIdle() } catch (e) { /* 忽略清理异常 */ }
  })

  it('startIdle 同步触发首场遭遇：currentEncounter 立即 inProgress 且 currentIdleEnemy 立即填充', () => {
    // startIdle 现在在 startIdleTimers() 之后立即调用 runIdleEncounter()，
    // 其同步前缀会创建 currentEncounter(inProgress=true) 并写入 currentIdleEnemy。
    // 因此无需等待 10 秒定时器，同步断言即可验证「立即弹出」与「仪表盘怪物立即显示」。
    startIdle(5)

    // Issue 2：实时战斗界面立即弹出（无 10 秒首延迟）
    expect(currentEncounter.value.inProgress).toBe(true)
    expect(currentEncounter.value.enemy).toBeTruthy()

    // Issue 1：怪物信息仪表盘立即显示（此前仅在战斗结束才赋值，导致战斗中面板为空）
    expect(currentIdleEnemy.value).not.toBeNull()
    expect(currentIdleEnemy.value.name).toBeTruthy()
    expect(currentIdleEnemy.value.maxHealth).toBeGreaterThan(0)
    // 战斗中即显示满血起始状态
    expect(currentIdleEnemy.value.currentHealth).toBe(currentIdleEnemy.value.maxHealth)
  })

  it('完整战斗日志：从挂机开始累积（含每场遭遇分隔符），而非仅当前回合', () => {
    // startIdle 的同步前缀会在创建首场遭遇时向 idleCombatLog 推入「第 N 次探索」分隔符，
    // 证明完整日志数据源是从挂机开始累积的累积源，而非仅当前 encounter.combatLog。
    startIdle(5)

    // 累积源已开场即初始化（首场遭遇分隔符已写入）
    expect(Array.isArray(idleCombatLog.value)).toBe(true)
    expect(idleCombatLog.value.length).toBeGreaterThanOrEqual(1)
    // 首条为「第 1 次探索」分隔符，便于按场次区分（区别于单场 combatLog）
    expect(idleCombatLog.value[0]).toContain('第 1 次探索')

    // startIdle 重置了上一场残留：累积源从空开始（分隔符是首条），证明每轮挂机重新累积
    expect(idleCombatLog.value[0].indexOf('第 1 次探索')).toBeGreaterThanOrEqual(0)
  })
})
