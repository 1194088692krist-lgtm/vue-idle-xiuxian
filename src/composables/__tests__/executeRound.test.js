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

  it('契约3：盾系角色也会被怪物攻击（修复「怪物从不打盾系」恶性 bug）', async () => {
    // 队伍：1 个攻击手 + 1 个盾系（盾系只加盾不普攻，所以不会在 attackingPlayers 里）
    // 旧实现：executeTurn 只从 attackingPlayers 选目标 → 盾系永远不被攻击
    // 新实现：executeTurn 接收 allPlayers 参数，怪物可从全部存活玩家选目标
    teamMemberStates.value = [
      { memberId: 'm1', name: 'P_m1', hp: 100, maxHP: 100, role: 'vanguard', skills: [] },
      { memberId: 'm2', name: 'P_m2', hp: 200, maxHP: 200, role: 'shield', skills: [], defense: 50, hasShield: true }
    ]
    const attacker = makePlayer('m1', 100, 40)
    const tank = makePlayer('m2', 200, 10)
    tank.role = 'shield'
    tank.stats.defense = 50
    const enemy = makeEnemy(100000, 30) // 高血量高攻击，确保盾系有受击机会
    currentEncounter.value = {
      enemy,
      players: [attacker, tank],
      round: 0,
      inProgress: true,
      combatLog: [],
      combatStats: {},
      manager: null,
      enemyData: null,
    }

    // 跑 5 回合，统计盾系被攻击次数
    for (let i = 0; i < 5; i++) {
      await executeRound({})
    }

    const tankCS = currentEncounter.value.combatStats['m2']
    expect(tankCS).toBeTruthy()
    // 关键断言：盾系角色受到过怪物伤害（>0 说明怪物攻击过盾系）
    // 旧实现这里会是 0（盾系从不被攻击）
    expect(tankCS.playerTookDamage).toBeGreaterThan(0)
  })

  it('契约4：盾系 HP≥50% 时优先给队友加盾，HP<50% 时优先给自己加盾', async () => {
    // 场景 A：盾系满血，攻击手无盾 → 应给攻击手加盾（log 出现「为X添加护盾」）
    teamMemberStates.value = [
      { memberId: 'm1', name: 'P_m1', hp: 100, maxHP: 100, role: 'vanguard', skills: [], hasShield: false },
      { memberId: 'm2', name: 'P_m2', hp: 200, maxHP: 200, role: 'shield', skills: [{ id: 's1', type: 'active', category: 'shield', name: '剑盾', effect: { shieldPercent: 1.5, duration: 2 } }], defense: 50, hasShield: false }
    ]
    const attacker = makePlayer('m1', 100, 40)
    const tank = makePlayer('m2', 200, 10)
    tank.role = 'shield'
    tank.stats.defense = 50
    tank.memberId = 'm2'
    const enemy = makeEnemy(100000, 5)
    currentEncounter.value = {
      enemy,
      players: [attacker, tank],
      round: 0,
      inProgress: true,
      combatLog: [],
      combatStats: {},
      manager: null,
      enemyData: null,
    }
    await executeRound({})
    // 第 1 回合：盾系 HP≥50%，应给攻击手加盾
    const shieldLogA = currentEncounter.value.combatLog.find(l => l.includes('为') && l.includes('添加') && l.includes('护盾'))
    expect(shieldLogA).toBeTruthy()
    expect(shieldLogA).toContain(attacker.name) // 给攻击手加盾而非给自己

    // 场景 B：盾系 HP<50%，应给自己加盾
    teamMemberStates.value[1].hp = 80 // 200 的 40%，<50%
    currentEncounter.value.combatLog = []
    currentEncounter.value.manager = null
    // 同步实体血量
    tank.currentHealth = 80
    // 清掉旧盾让盾系可以再加
    tank.buffs = []
    teamMemberStates.value[1].hasShield = false
    teamMemberStates.value[0].hasShield = false

    await executeRound({})
    const shieldLogB = currentEncounter.value.combatLog.find(l => l.includes('添加') && l.includes('护盾'))
    expect(shieldLogB).toBeTruthy()
    expect(shieldLogB).toContain(tank.name) // 给自己加盾
  })

  it('契约5：角色会进行普通攻击（修复「所有人物每回合都放技能从不普攻」恶性 bug）', async () => {
    // 给攻击手装备一个 damage 技能：旧实现会因轮询机制失效导致每回合都放技能
    // 新实现：_skillRotation 队列含 null 普攻轮换，会按 1技能1普攻 交替
    teamMemberStates.value = [
      { memberId: 'm1', name: 'P_m1', hp: 100, maxHP: 100, role: 'vanguard',
        skills: [{ id: 'sk1', type: 'active', category: 'damage', name: '剑气斩', effect: { damagePercent: 1.5 } }] }
    ]
    const player = makePlayer('m1', 100, 40)
    const enemy = makeEnemy(100000, 5)
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

    // 跑 6 回合收集日志
    const logs = []
    for (let i = 0; i < 6; i++) {
      currentEncounter.value.combatLog = []
      await executeRound({})
      logs.push(...currentEncounter.value.combatLog)
    }

    // 攻击手应既有技能攻击日志（含「施展」），也有普攻日志（仅「攻击/对X造成」无「施展」）
    const hasSkillAttack = logs.some(l => l.includes('施展'))
    const hasNormalAttack = logs.some(l => l.includes('对') && l.includes('造成') && !l.includes('施展'))
    expect(hasSkillAttack).toBe(true)
    expect(hasNormalAttack).toBe(true)
  })
})
