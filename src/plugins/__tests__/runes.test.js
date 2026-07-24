import { describe, it, expect } from 'vitest'
import {
  runes, getSocketsByRarity, getRuneSynergy, getRuneStats, getRandomRune, RUNE_ELEMENTS
} from '../runes'
import { calculateEquipmentScore } from '../buildSystem'

const runeOf = (element, stat = 'attack', value = 0.06, valueType = 'percent') =>
  ({ id: 'x', name: '测试纹', element, stat, value, valueType, rarity: 'rare', uid: Math.random() })

describe('灵纹镶嵌系统（M1）', () => {
  it('品质决定开槽数：凡0/良1/极2/神3', () => {
    expect(getSocketsByRarity('common')).toBe(0)
    expect(getSocketsByRarity('uncommon')).toBe(1)
    expect(getSocketsByRarity('epic')).toBe(2)
    expect(getSocketsByRarity('mythic')).toBe(3)
  })

  it('相邻同元素触发共鸣，非同元素/不相邻不触发', () => {
    const eq = { runes: [runeOf('fire'), runeOf('fire'), runeOf('water')] }
    const syn = getRuneSynergy(eq)
    expect(syn.length).toBe(1)               // 仅 fire-fire 一对相邻同元素
    expect(syn[0].element).toBe('fire')
    // 不相邻（中间隔空槽）不共鸣
    const eq2 = { runes: [runeOf('fire'), null, runeOf('fire')] }
    expect(getRuneSynergy(eq2).length).toBe(0)
  })

  it('getRuneStats 汇总灵纹词缀 + 共鸣加成', () => {
    const eq = { runes: [runeOf('fire', 'attack', 0.06, 'percent'), runeOf('fire', 'critDamageBoost', 0.08, 'percent')] }
    const stats = getRuneStats(eq)
    // 2 条灵纹词缀 + 1 条共鸣（critDamageBoost +0.05）
    expect(stats.length).toBe(3)
    const syn = stats.find(s => s.stat === 'critDamageBoost' && Math.abs(s.value - 0.05) < 1e-9)
    expect(syn).toBeTruthy()
  })

  it('getRandomRune 产出带 uid 的灵纹实例', () => {
    const r = getRandomRune(5)
    expect(r.uid).toBeTruthy()
    expect(RUNE_ELEMENTS[r.element]).toBeTruthy()
    expect(r.stat).toBeTruthy()
  })

  it('灵纹计入装备评分（镶满 > 空槽）', () => {
    const base = { rarity: 'legendary', enhanceLevel: 0, stats: { attack: 100 }, affixes: [], runes: [null, null] }
    const filled = { ...base, runes: [runeOf('metal', 'finalDamageBoost', 0.06, 'percent'), runeOf('metal', 'defense', 0.06, 'percent')] }
    expect(calculateEquipmentScore(filled)).toBeGreaterThan(calculateEquipmentScore(base))
  })
})
