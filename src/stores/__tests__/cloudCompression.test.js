import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// 内存版 GameDB
const mem = new Map()
vi.mock('../db', () => ({
  GameDB: {
    setData: vi.fn(async (k, v) => { mem.set(k, v) }),
    getData: vi.fn(async (k) => mem.get(k) ?? null),
  },
}))
// 模拟“已登录”，走真实云同步路径
vi.mock('../auth', () => ({
  useAuthStore: () => ({ isLoggedIn: true, devMode: false, token: 't', tokenExpired: false, authHeaders: () => ({ Authorization: 'Bearer t' }) }),
}))

const { usePlayerStore } = await import('../player')
const { encryptData, decryptData, decryptToString, recompressBlob } = await import('../../plugins/crypto')
const { decompressSave, isCompressed } = await import('../../utils/saveCompression')

// 一个像真实存档的大体积对象（materials 高度重复，正是云存档膨胀主因）
function makeBigSave() {
  const materials = []
  for (let i = 0; i < 8000; i++) materials.push({ kind: 'ore', id: 'common_enhance_stone', name: '普通强化石' })
  return { _saveTime: Date.now(), name: '测试道友', level: 99, sectMembers: Array.from({ length: 50 }, (_, i) => ({ id: 'm' + i })), materials }
}

describe('云存档压缩：上传压缩 / 下载解压（唯一出入口接缝）', () => {
  beforeEach(() => { setActivePinia(createPinia()); mem.clear() })

  it('pushSlotToCloud 上传前压缩，且密文解密后可无损还原为原存档', async () => {
    const store = usePlayerStore()
    const payload = makeBigSave()
    const blob = encryptData(payload) // 本地未压缩加密 blob

    let capturedBody = null
    global.fetch = vi.fn(async (url, opts) => {
      if (url === '/api/save' && (opts?.method || 'GET') === 'POST') {
        capturedBody = opts.body
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      return new Response(JSON.stringify({ ok: true, saves: [] }), { status: 200 })
    })

    await store.pushSlotToCloud(0, blob, payload._saveTime)

    expect(capturedBody).not.toBeNull()
    const posted = JSON.parse(capturedBody)
    // 上传的数据是“压缩后再加密”：解密出明文 JSON 应带 GZ1: 标记
    const plain = decryptToString(posted.data)
    expect(isCompressed(plain)).toBe(true)
    // 解压后能精确还原为原始存档对象
    const restored = JSON.parse(await decompressSave(plain))
    expect(restored).toEqual(payload)
    // 压缩后体积应显著小于原文（7-8MB 明文 -> <1MB）
    expect(posted.data.length).toBeLessThan(blob.length)
  })

  it('fetchCloudSaves 把云端压缩 blob 转回本地未压缩格式，旧存档也能兼容', async () => {
    const store = usePlayerStore()
    const payload = makeBigSave()

    // 云端存的是“压缩后再加密”的 blob
    const compressedBlob = await recompressBlob(encryptData(payload))

    global.fetch = vi.fn(async (url, opts) => {
      if (url === '/api/save' && (opts?.method || 'GET') === 'GET') {
        return new Response(JSON.stringify({ ok: true, saves: [{ slot: 0, data: compressedBlob, updated_at: 123 }] }), { status: 200 })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })

    const map = await store.fetchCloudSaves()
    expect(map[0]).toBeTruthy()
    // 下载后已是“本地未压缩加密 blob”，可直接 decryptData 还原
    const restored = decryptData(map[0].data)
    expect(restored).toEqual(payload)
    // 且不再是压缩格式（写入 GameDB 后下游无需改动）
    expect(isCompressed(decryptToString(map[0].data))).toBe(false)

    // 旧存档（云端未压缩 blob）同样能正确下载还原
    const legacyBlob = encryptData(payload)
    global.fetch = vi.fn(async (url, opts) => {
      if (url === '/api/save' && (opts?.method || 'GET') === 'GET') {
        return new Response(JSON.stringify({ ok: true, saves: [{ slot: 1, data: legacyBlob, updated_at: 456 }] }), { status: 200 })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    const map2 = await store.fetchCloudSaves()
    expect(decryptData(map2[1].data)).toEqual(payload)
  })
})
