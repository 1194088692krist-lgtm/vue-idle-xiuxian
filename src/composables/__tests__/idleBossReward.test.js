import { describe, it, expect, vi } from 'vitest'

// 玩家仓库最小存根（与 idleDrops.test.js 同范式）。getPillBuffMultiplier 为内部函数，默认返回 1。
vi.mock('../../stores/player', () => ({
  usePlayerStore: vi.fn(() => ({
    sectMembers: [],
    items: [],
    itemsFound: 0,
    phantomCrystals: 0,
    petFragments: 0,
    pillRecipes: [],
    pillBuffs: [],
    getActivePillEffects: () => [],
    gainMaterial: vi.fn(),
    cultivate: vi.fn(),
    gainPillFragment: vi.fn(),
    getPillsByZone: () => [],
  })),
}))

import { useIdleSystem } from '../useIdleSystem.js'

const idle = useIdleSystem()
const { grantReward } = idle

// 手工构造 effectiveZone：绕过 buildEffectiveZone，直接喂给 grantReward。
function makeZone(rewards) {
  return {
    id: 'test-zone',
    name: '测试秘境',
    rewards,
    dropBonus: 1,
    difficulty: 5,
    enemyScale: 1,
    rewardMultiplier: 1,
    recommendedStats: { attack: 100, health: 100 },
  }
}

describe('Boss 奖励区分：数量 ×10 与高稀有度加权（不破爆率）', () => {
  it('数量型奖励 Boss 是普怪的 10 倍（爆率 chance 不变）', () => {
    // 固定 Math.random = 0.4：chance=1 必然命中；数字 amount 不受随机影响
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.4)
    const zone = makeZone([
      { type: 'spirit_stone', chance: 1, amount: 10 },
      { type: 'herb', chance: 1, amount: 2 },
    ])
    const normal = grantReward(zone, true, false)
    const boss = grantReward(zone, true, true)
    const nStone = normal.find(r => r.type === 'spirit_stone').amount
    const bStone = boss.find(r => r.type === 'spirit_stone').amount
    const nHerb = normal.find(r => r.type === 'herb').amount
    const bHerb = boss.find(r => r.type === 'herb').amount
    expect(bStone).toBe(nStone * 10)
    expect(bHerb).toBe(nHerb * 10)
    spy.mockRestore()
  })

  it('高稀有度物品 Boss 获取概率显著高于普怪（约 10 倍，爆率不变）', () => {
    const zone = makeZone([
      { type: 'equipment', chance: 1, rarity: ['epic', 'legendary'], amount: 1 },
    ])
    const N = 2000
    let normalHigh = 0
    let bossHigh = 0
    for (let i = 0; i < N; i++) {
      const nr = grantReward(zone, true, false)
      const br = grantReward(zone, true, true)
      if (nr.some(r => r.type === 'equipment' && r.rarity === 'legendary')) normalHigh++
      if (br.some(r => r.type === 'equipment' && r.rarity === 'legendary')) bossHigh++
    }
    const normalRate = normalHigh / N
    const bossRate = bossHigh / N
    // Boss 最高稀有度档权重 ×10，期望约为普怪 10 倍（宽松断言避免随机抖动）
    expect(bossRate).toBeGreaterThan(normalRate * 5)
    expect(bossRate).toBeGreaterThan(0.15)
  })

  it('普通（非 Boss）模式下高稀有度权重不变，保持原爆率与品质分布', () => {
    const zone = makeZone([
      { type: 'equipment', chance: 1, rarity: ['epic', 'legendary'], amount: 1 },
    ])
    const N = 2000
    let high = 0
    for (let i = 0; i < N; i++) {
      const r = grantReward(zone, true, false)
      if (r.some(x => x.type === 'equipment' && x.rarity === 'legendary')) high++
    }
    const rate = high / N
    // 普怪 legendary 权重 0.3 / (10+0.3) ≈ 0.029，断言在合理小范围内
    expect(rate).toBeLessThan(0.1)
    expect(rate).toBeGreaterThan(0.01)
  })
})
