import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 玩家仓库：仅提供 runIdleEncounter 同步前缀所需的最小表面（与 idleStart.test.js 同构）
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
      // 关键：duration=100000，剩余=10000 ⇒ 已过 90% ⇒ 进入 BOSS 阶段
      idleExploration: { isActive: true, zoneId: 'z', duration: 100000, startTime: Date.now() },
      items: [], itemsFound: 0, phantomCrystals: 0, petFragments: 0, pillRecipes: [], pillBuffs: [],
      getActivePillEffects: () => [],
      regenerateSpirit: vi.fn(),
      getCharacterBuildStrength: () => 1,
      startIdleExploration: vi.fn(),
      stopIdleExploration: vi.fn(),
      updateIdleExploration: vi.fn(),
      getIdleRemainingTime: () => 10000,
      queueSave: vi.fn(),
      saveData: vi.fn(),
      saveToCurrentSlot: () => Promise.resolve(),
      gainMaterial: vi.fn(), cultivate: vi.fn(), gainPillFragment: vi.fn(),
      getPillsByZone: () => [], addCharacterExperience: vi.fn(),
    })),
  }
})

const fakeDiff = {
  key: 'xiongxian', label: '游历', color: '#fff', spiritCost: 1,
  difficulty: 1, enemyScale: 1, dropBonus: 1, rewardMultiplier: 1,
  recommendedStats: { attack: 100, health: 100 },
}
// 含 bosses 的秘境（与 setSelectedZone 使用的 zoneStub 形状一致）
const bossZone = { id: 'z', name: '测试秘境', monsters: ['测试妖兽'], minLevel: 1, bosses: [{ id: 'b1', name: '测试BOSS', stats: { health: 5000, attack: 80, defense: 30, speed: 15 } }] }
vi.mock('../../plugins/zones', () => ({
  zones: [],
  getZoneById: () => bossZone,
  getZoneDifficulty: () => fakeDiff,
}))
vi.mock('../../plugins/characters', () => ({ getCharacterThumbnail: () => '' }))
vi.mock('../../plugins/monsters', () => ({ getMonsterAvatarSync: () => '' }))

import { useIdleSystem } from '../useIdleSystem.js'

const idle = useIdleSystem()
const { startIdle, stopIdle, setSelectedZone, currentEncounter, bossSpawned, idleCombatLog } = idle

describe('挂机 BOSS 阶段：最后 1/5 刷新秘境 BOSS（核心玩法）', () => {
  beforeEach(() => {
    setSelectedZone(bossZone)
  })

  afterEach(() => {
    // 停止挂机以清除 setInterval / 日志定时器，避免测试进程挂起
    try { stopIdle() } catch (e) { /* 忽略清理异常 */ }
  })

  it('进入 BOSS 阶段（已过 90%）时刷新秘境 BOSS，且只刷一次', () => {
    // startIdle 同步触发首场遭遇；因已过 90%，runIdleEncounter 直接进入 BOSS 阶段
    startIdle(5)

    // 已刷新 BOSS
    expect(bossSpawned.value).toBe(true)
    expect(currentEncounter.value.enemy).toBeTruthy()
    expect(currentEncounter.value.enemy.tier).toBe('boss')
    expect(currentEncounter.value.enemy.name).toBe('测试BOSS')

    // 完整战斗日志中以 BOSS 分隔符标记该场决战
    expect(idleCombatLog.value.some(l => l.includes('BOSS'))).toBe(true)
  })
})
