import { describe, it, expect } from 'vitest'
import { compressSave, decompressSave, isCompressed } from '../saveCompression'

// 构造一个“像真实存档”的大体积、高重复 JSON 字符串（宗门材料数组会无限膨胀，正是云存档膨胀主因）
function makeBigSave(size = 8000) {
  const materials = []
  for (let i = 0; i < size; i++) {
    materials.push({ kind: 'ore', id: 'common_enhance_stone', name: '普通强化石' })
  }
  return JSON.stringify({
    name: '测试道友',
    level: 99,
    realm: '大乘期',
    _saveTime: Date.now(),
    sectMembers: Array.from({ length: 100 }, (_, i) => ({ id: 'm' + i, name: '弟子' + i, equippedArtifacts: {} })),
    materials,
  })
}

describe('云存档压缩 saveCompression（gzip 前置压缩，兼容旧存档）', () => {
  it('压缩→解压可无损还原，且压缩后体积更小并带标记', async () => {
    const original = makeBigSave(8000)
    const compressed = await compressSave(original)

    // 高熵 AES 无法压缩，故必须在加密前压明文：压缩后体积应显著小于原文
    expect(compressed.length).toBeLessThan(original.length)
    expect(isCompressed(compressed)).toBe(true)

    const restored = await decompressSave(compressed)
    expect(restored).toBe(original)
  })

  it('含中文/特殊字符的明文也能无损还原', async () => {
    const original = JSON.stringify({ name: '李·雷霆「剑修」', note: '★☆♦含 emoji 🐉🔥 与换行\n制表\t', nested: { a: [1, 2, 3], b: '測試' } })
    const restored = await decompressSave(await compressSave(original))
    expect(restored).toBe(original)
  })

  it('向后兼容：未压缩（旧存档）字符串解压后原样返回', async () => {
    const legacy = '{"name":"旧存档","_saveTime":123}'
    expect(isCompressed(legacy)).toBe(false)
    expect(await decompressSave(legacy)).toBe(legacy)
  })

  it('空字符串/非字符串输入安全降级为原样返回', async () => {
    expect(await decompressSave('')).toBe('')
    expect(await decompressSave(undefined)).toBeUndefined()
    // compressSave 对非法输入也原样返回（不抛错）
    expect(await compressSave(undefined)).toBeUndefined()
  })

  it('环境不支持 CompressionStream 时降级为不压缩，但仍可无损回退', async () => {
    const original = makeBigSave(200)
    const origCS = globalThis.CompressionStream
    const origDS = globalThis.DecompressionStream
    // 模拟老旧环境：全局无 CompressionStream / DecompressionStream
    globalThis.CompressionStream = undefined
    globalThis.DecompressionStream = undefined
    try {
      const fallback = await compressSave(original)
      expect(isCompressed(fallback)).toBe(false)
      // 降级后传输明文，解压应原样返回（与未压缩旧存档一致）
      expect(await decompressSave(fallback)).toBe(original)
    } finally {
      globalThis.CompressionStream = origCS
      globalThis.DecompressionStream = origDS
    }
  })
})
