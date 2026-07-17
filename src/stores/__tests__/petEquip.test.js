import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '../player'

// 灵宠装备排他性回归测试：同一灵宠（按 uid/id）同时只能被一个角色装备。
// 覆盖：背包移除、被其他角色占用时先卸下原角色、不出现双角色共享同一灵宠对象。
describe('灵宠装备排他性（修复：其他角色可重复装备同一灵宠）', () => {
  let store
  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePlayerStore()
    // 最小化状态，避免触发真实存档/云同步副作用
    store.sectMembers = [
      { id: 'm1', name: '甲', equippedPet: null },
      { id: 'm2', name: '乙', equippedPet: null }
    ]
    store.items = [{ id: 'pet_1', name: '火灵', type: 'pet' }]
    store.queueSave = () => {}
    store.saveData = () => {}
  })

  it('角色装备灵宠后，灵宠从背包移除', () => {
    const pet = store.items[0]
    const r = store.equipCharacterPet('m1', pet)
    expect(r.success).toBe(true)
    expect(store.sectMembers[0].equippedPet).toBe(pet)
    expect(store.items.find(p => p.id === 'pet_1')).toBeUndefined()
  })

  it('同一灵宠被 A 占用后，B 装备会先卸下 A，不会出现双角色共享', () => {
    const pet = store.items[0]
    store.equipCharacterPet('m1', pet)
    expect(store.sectMembers[0].equippedPet).toBe(pet)

    // B 装备同一灵宠对象
    store.equipCharacterPet('m2', pet)
    expect(store.sectMembers[1].equippedPet).toBe(pet)
    // A 已被卸下，且不会把 A 的灵宠错误回收到背包造成重复持有
    expect(store.sectMembers[0].equippedPet).toBeNull()
    // 背包中仍不应存在该灵宠
    expect(store.items.filter(p => p.id === 'pet_1').length).toBe(0)
  })

  it('成员不存在时返回失败，不修改任何状态', () => {
    const pet = store.items[0]
    const r = store.equipCharacterPet('no-such', pet)
    expect(r.success).toBe(false)
    expect(store.sectMembers[0].equippedPet).toBeNull()
    expect(store.sectMembers[1].equippedPet).toBeNull()
    expect(store.items.find(p => p.id === 'pet_1')).toBe(pet)
  })
})
