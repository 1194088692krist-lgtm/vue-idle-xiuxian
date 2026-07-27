import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '../player'

// 灵宠卸下回归测试：装备后卸下，灵宠必须回到背包，不能丢失。
describe('灵宠卸下后回到背包（修复：卸下直接消失）', () => {
  let store
  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePlayerStore()
    store.sectMembers = [
      { id: 'm1', name: '甲', equippedPet: null, equippedArtifacts: {} },
      { id: 'm2', name: '乙', equippedPet: null, equippedArtifacts: {} }
    ]
    store.items = [{ id: 'pet_1', name: '火灵', type: 'pet' }]
    store.queueSave = () => {}
    store.saveData = () => {}
  })

  it('装备灵宠后卸下，灵宠回到背包', () => {
    const pet = store.items[0]
    store.equipCharacterPet('m1', pet)
    expect(store.sectMembers[0].equippedPet).toBe(pet)
    expect(store.items.find(p => p.id === 'pet_1')).toBeUndefined()

    const r = store.unequipCharacterPet('m1')
    expect(r.success).toBe(true)
    expect(store.sectMembers[0].equippedPet).toBeNull()
    // 关键：卸下后灵宠必须回到背包
    expect(store.items.find(p => p.id === 'pet_1')).toBeDefined()
  })

  it('装备到 A 后卸下，再装备到 B，灵宠不丢失', () => {
    const pet = store.items[0]
    store.equipCharacterPet('m1', pet)
    store.unequipCharacterPet('m1')
    expect(store.items.find(p => p.id === 'pet_1')).toBeDefined()

    // 重新从背包取出装备到 B
    const petAgain = store.items.find(p => p.id === 'pet_1')
    store.equipCharacterPet('m2', petAgain)
    expect(store.sectMembers[1].equippedPet).toBe(petAgain)
    expect(store.items.find(p => p.id === 'pet_1')).toBeUndefined()

    const r = store.unequipCharacterPet('m2')
    expect(r.success).toBe(true)
    expect(store.items.find(p => p.id === 'pet_1')).toBeDefined()
  })

  it('重复卸下不会造成灵宠重复持有', () => {
    const pet = store.items[0]
    store.equipCharacterPet('m1', pet)
    store.unequipCharacterPet('m1')
    // 再次卸下（不应再 push 一份）
    store.unequipCharacterPet('m1')
    const count = store.items.filter(p => p.id === 'pet_1').length
    expect(count).toBe(1)
  })

  it('一键卸下（autoUnequipCharacter）也会把灵宠归还背包', () => {
    const pet = store.items[0]
    store.equipCharacterPet('m1', pet)
    expect(store.sectMembers[0].equippedPet).toBe(pet)
    expect(store.items.find(p => p.id === 'pet_1')).toBeUndefined()

    const r = store.autoUnequipCharacter('m1')
    expect(r.success).toBe(true)
    expect(store.sectMembers[0].equippedPet).toBeNull()
    // 关键：一键卸下后灵宠必须回到背包
    expect(store.items.find(p => p.id === 'pet_1')).toBeDefined()
  })
})
