import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// 内存版 GameDB，模拟 IndexedDB 跨“刷新”持久化
const mem = new Map()
vi.mock('../db', () => ({
  GameDB: {
    setData: vi.fn(async (k, v) => { mem.set(k, v) }),
    getData: vi.fn(async (k) => mem.get(k) ?? null),
  },
}))
// 跳过云同步
vi.mock('../auth', () => ({
  useAuthStore: () => ({ isLoggedIn: false, devMode: false, token: null, authHeaders: () => ({}) }),
}))

const { usePlayerStore } = await import('../player')

const seedStore = (store) => {
  store.sectMembers = [
    { id: 'm1', name: '甲', equippedPet: null, equippedArtifacts: {} },
    { id: 'm2', name: '乙', equippedPet: null, equippedArtifacts: {} },
  ]
  store.items = [{ id: 'pet_1', name: '火灵', type: 'pet', rarity: 'spiritual', level: 1, star: 0 }]
}

describe('灵宠 存档→读档→卸下 全链路（修复：卸下直接消失）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mem.clear()
  })

  it('装备后存档，刷新读档，卸下后灵宠仍在背包', async () => {
    const store = usePlayerStore()
    seedStore(store)

    // 装备并立即存档
    store.equipCharacterPet('m1', store.items[0])
    expect(store.sectMembers[0].equippedPet).toBeTruthy()
    await store.saveData()

    // 模拟刷新：全新 pinia + 全新 store，从同一 GameDB 读档
    setActivePinia(createPinia())
    const reloaded = usePlayerStore()
    await reloaded.initializePlayer()

    // 读档后：灵宠应在 equippedPet，且不在 items
    expect(reloaded.sectMembers[0].equippedPet, '读档后灵宠应仍在装备位').toBeTruthy()
    expect(reloaded.items.find(p => p.id === 'pet_1'), '读档后灵宠不应在背包').toBeUndefined()

    // 卸下
    const r = reloaded.unequipCharacterPet('m1')
    expect(r.success).toBe(true)

    // 关键断言：卸下后灵宠回到背包，未丢失
    const back = reloaded.items.find(p => p.id === 'pet_1')
    expect(back, '卸下后灵宠必须回到背包').toBeTruthy()
    expect(reloaded.sectMembers[0].equippedPet).toBeNull()
  })
})
