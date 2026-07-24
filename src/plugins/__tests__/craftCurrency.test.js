import { describe, it, expect } from 'vitest'
import {
  craftCurrencies, disassembleCurrencyRewards, pickCraftCurrency,
  upgradeAffixTier, rerollAffixValues, rerollAllAffixes, toggleAffixLock,
  addAffix, annulAffix, corruptEquipment, applyCraftCurrency, CRAFT_DROP_CHANCE_BY_ZONE
} from '../craftCurrency'
import { getAffixesForSlot } from '../buildSystem'

function makeEquip() {
  return {
    id: 1, type: 'equipment', slot: 'artifact', rarity: 'legendary', ilvl: 8, enhanceLevel: 0,
    stats: { attack: 100 }, affixes: getAffixesForSlot('artifact', 'legendary', 8)
  }
}

describe('工艺货币体系（M0-B）', () => {
  it('凝律石：指定词缀提升一档', () => {
    const eq = makeEquip()
    const af = eq.affixes[0]
    af.qualityTier = 4
    const r = upgradeAffixTier(eq, af.id)
    expect(r.success).toBe(true)
    expect(eq.affixes[0].qualityTier).toBe(3)
  })

  it('锁灵符锁定后，点化石不改其数值', () => {
    const eq = makeEquip()
    const af = eq.affixes[0]
    toggleAffixLock(eq, af.id)
    expect(af.locked).toBe(true)
    const v = af.value
    rerollAffixValues(eq)
    expect(eq.affixes[0].value).toBe(v)
  })

  it('重铸灵砂保留锁定词缀且不超上限', () => {
    const eq = makeEquip()
    const af = eq.affixes[0]
    toggleAffixLock(eq, af.id)
    const lockedId = af.id
    rerollAllAffixes(eq)
    expect(eq.affixes.some(a => a.id === lockedId)).toBe(true)
    expect(eq.affixes.length).toBeLessThanOrEqual(5)
  })

  it('增幅石满词缀时被拒', () => {
    const eq = makeEquip()
    while (eq.affixes.length < 5) { if (!addAffix(eq).success) break }
    expect(eq.affixes.length).toBe(5)
    expect(addAffix(eq).success).toBe(false)
  })

  it('抹除露默认保底 1 条，allowEmpty 可清空', () => {
    const eq = makeEquip()
    eq.affixes = [eq.affixes[0]]
    expect(annulAffix(eq, false).success).toBe(false)
    expect(annulAffix(eq, true).success).toBe(true)
    expect(eq.affixes.length).toBe(0)
  })

  it('血祭符标记腐化，腐化后不可再 craft', () => {
    const eq = makeEquip()
    const r = corruptEquipment(eq)
    expect(r.success).toBe(true)
    expect(eq.corrupted === true || r.shattered).toBe(true)
    expect(applyCraftCurrency(eq, 'refine_stone').success).toBe(false)
  })

  it('掉落图门：青萝林只掉已解锁货币，概率随图递增', () => {
    expect(CRAFT_DROP_CHANCE_BY_ZONE[8]).toBeGreaterThan(CRAFT_DROP_CHANCE_BY_ZONE[1])
    const z1 = new Set()
    for (let i = 0; i < 200; i++) z1.add(pickCraftCurrency(1, false))
    z1.forEach(id => expect(craftCurrencies[id].dropZoneMin).toBeLessThanOrEqual(1))
  })

  it('分解 mythic 返凝律石', () => {
    const rewards = disassembleCurrencyRewards('mythic')
    expect((rewards.law_stone || 0)).toBeGreaterThanOrEqual(1)
  })

  it('applyCraftCurrency 统一入口（增幅石）', () => {
    const eq = makeEquip()
    const n0 = eq.affixes.length
    const r = applyCraftCurrency(eq, 'exalt_stone')
    expect(r.success).toBe(true)
    expect(eq.affixes.length).toBe(n0 + 1)
  })
})
