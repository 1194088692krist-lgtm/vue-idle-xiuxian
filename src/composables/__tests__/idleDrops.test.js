import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 玩家仓库：grantReward 仅用到 items / itemsFound / phantomCrystals / petFragments /
// pillRecipes / 各 gain* / cultivate / getActivePillEffects / getPillsByZone，提供最小存根。
// 注意：本测试文件位于 src/composables/__tests__/，mock 路径需上溯两级到 src/stores/player。
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
// recommendedStats 必须存在（generateEquipment/generatePet 会读取做数值缩放）。
function makeZone() {
  return {
    id: 'test-zone',
    name: '测试秘境',
    rewards: [
      { type: 'equipment', chance: 0.2, rarity: ['common'], amount: 1 },
      { type: 'pet', chance: 0.2, rarity: ['mortal'], amount: 1 },
      { type: 'spirit_stone', chance: 1, amount: 1 },
    ],
    dropBonus: 1,
    difficulty: 1,
    enemyScale: 1,
    rewardMultiplier: 1,
    recommendedStats: { attack: 100, health: 100 },
  }
}

describe('挂机掉落：装备/法宝/灵宠几率提升 5 倍', () => {
  let randomSpy

  beforeEach(() => {
    // 固定 Math.random = 0.5：
    //   - 非挂机装备/灵宠有效几率 = 0.2*1 = 0.2 < 0.5 ⇒ 不掉
    //   - 挂机装备/灵宠有效几率 = min(1, 0.2*1*5) = 1.0  > 0.5 ⇒ 必掉
    // 该值跨越了两种模式阈值，可确定性区分，不受 dropRate buff（=1）影响。
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    randomSpy.mockRestore()
  })

  it('非挂机模式：chance=0.2 的装备/灵宠不应掉落', () => {
    const rewards = grantReward(makeZone(), false)
    expect(rewards.some(r => r.type === 'equipment')).toBe(false)
    expect(rewards.some(r => r.type === 'pet')).toBe(false)
    // 对照：灵石（不受倍率影响）始终掉落
    expect(rewards.some(r => r.type === 'spirit_stone')).toBe(true)
  })

  it('挂机模式：装备/灵宠获得几率提升 5 倍（chance 0.2 → 有效 1.0，必掉）', () => {
    const rewards = grantReward(makeZone(), true)
    expect(rewards.some(r => r.type === 'equipment')).toBe(true)
    expect(rewards.some(r => r.type === 'pet')).toBe(true)
  })

  it('倍率仅作用于 idle 且只针对 equipment/pet（灵石不受影响）', () => {
    const zone = makeZone()
    // 灵石 chance=1，挂机与否都应掉落
    const idleRewards = grantReward(zone, true)
    expect(idleRewards.some(r => r.type === 'spirit_stone')).toBe(true)
    // 倍率不放大灵石/修为（它们是固定 chance）
    const nonIdle = grantReward(makeZone(), false)
    expect(nonIdle.some(r => r.type === 'spirit_stone')).toBe(true)
  })
})
