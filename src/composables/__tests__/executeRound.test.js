import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CombatEntity } from '../../plugins/combat.js'

// 玩家仓库仅被 executeRound 内 store() 声明引用（返回值未实际使用），返回最小存根即可。
// 注意：本测试文件位于 src/composables/__tests__/，mock 路径需上溯两级到 src/stores/player。
vi.mock('../../stores/player', () => ({
  usePlayerStore: vi.fn(() => ({ sectMembers: [] })),
}))

import { useIdleSystem } from '../useIdleSystem.js'

// 该模块只导出组合式函数 useIdleSystem()，状态/方法均通过其返回值暴露（模块级单例）
const idle = useIdleSystem()
const { executeRound, teamMemberStates, currentEncounter } = idle

// ---- 测试辅助：构造战斗实体 ----
function makePlayer(memberId, maxHP, damage) {
  const e = new CombatEntity('P_' + memberId, 1, { maxHealth: maxHP, damage, defense: 5, speed: 10 }, '练气一层')
  e.memberId = memberId
  return e
}
function makeEnemy(maxHP, damage) {
  return new CombatEntity('Enemy', 1, { maxHealth: maxHP, damage, defense: 5, speed: 5 }, '练气一层')
}

describe('executeRound 契约：HP 跨场保留 + 逐回合实时渲染', () => {
  let randomSpy

  beforeEach(() => {
    // 固定随机：Math.random=0.99 ⇒ 不暴击/不闪避/不吸血/不眩晕，使伤害确定可断言
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
    // 重置模块级单例状态，避免用例间串扰
    teamMemberStates.value = []
    currentEncounter.value = {
      enemy: null,
      players: [],
      round: 0,
      inProgress: false,
      combatLog: [],
      combatStats: {},
      manager: null,
      enemyData: null,
    }
  })

  afterEach(() => {
    randomSpy.mockRestore()
  })

  it('契约1：战斗结束后将剩余血量写回 teamMemberStates，且不会回满', async () => {
    // 模拟“上一场继承的剩余血量” = 60（非满血），用于验证跨场保留、不重开满血
    teamMemberStates.value = [{ memberId: 'm1', hp: 60, maxHP: 100, role: 'vanguard', skills: [] }]
    const player = makePlayer('m1', 100, 40)
    player.currentHealth = 60
    const enemy = makeEnemy(120, 25) // 中等血量，确保会交战若干回合
    currentEncounter.value = {
      enemy,
      players: [player],
      round: 0,
      inProgress: true,
      combatLog: [],
      combatStats: {},
      manager: null,
      enemyData: null,
    }

    let result = { finished: false }
    let guard = 0
    while (!result.finished && guard < 200) {
      result = await executeRound({})
      guard++
    }

    expect(result.finished).toBe(true)
    expect(typeof result.victory).toBe('boolean')

    // 写回正确性：teamMemberStates 的 hp 等于实体最终 currentHealth
    expect(teamMemberStates.value[0].hp).toBe(Math.max(0, Math.round(player.currentHealth)))
    // 关键断言：未回满（证明状态保留到下一回合，而非每场重开满血）
    expect(teamMemberStates.value[0].hp).toBeLessThan(100)
    expect(teamMemberStates.value[0].maxHP).toBe(100)
  })

  it('契约2：逐回合结算即渲染（round 递增、combatLog 按回合累积，而非结束时一次性输出）', async () => {
    // executeRound 要求玩家在 teamMemberStates 中有对应条目才会行动、产生战斗日志
    teamMemberStates.value = [{ memberId: 'm1', hp: 100, maxHP: 100, role: 'vanguard', skills: [] }]
    const player = makePlayer('m1', 100, 40)
    const enemy = makeEnemy(10000, 5) // 高血量，确保两轮内不会结束战斗
    currentEncounter.value = {
      enemy,
      players: [player],
      round: 0,
      inProgress: true,
      combatLog: [],
      combatStats: {},
      manager: null,
      enemyData: null,
    }

    expect(currentEncounter.value.round).toBe(0)
    expect(currentEncounter.value.combatLog.length).toBe(0)

    const r1 = await executeRound({})
    expect(currentEncounter.value.round).toBe(1)
    expect(currentEncounter.value.combatLog.length).toBeGreaterThan(0)
    expect(r1.finished).toBe(false)

    const r2 = await executeRound({})
    expect(currentEncounter.value.round).toBe(2)
    // 每回合追加日志，而非战斗结束时一次性 dump
    expect(currentEncounter.value.combatLog.length).toBeGreaterThan(1)

    // 实时统计已按回合建立
    expect(currentEncounter.value.combatStats['m1']).toBeTruthy()
    expect(currentEncounter.value.combatStats['m1'].roundDetails.length).toBeGreaterThan(0)
  })
})
