import { res, requireUser } from '../_utils.js'

// 5 槽云同步：GET 拉全部 / POST 存单槽（upsert，最后写入获胜）
// D1 TEXT 列可承载更大体积；前端已有数据修剪逻辑控制体积，后端再校验一次作为兜底
// 体积上限提升至 20MB：游戏存档包含装备/丹药/灵宠/挂机日志等大量数据，
// 原 3MB/8MB 上限过低易触发"存档失败→回档"恶性循环。
const DATA_MAX_BYTES = 20 * 1024 * 1024

export async function onRequest({ request, env }) {
  const u = await requireUser(request, env)
  if (!u.ok) return res(u, u.status)

  if (request.method === 'GET') {
    try {
      const rows = await env.DB.prepare(
        'SELECT slot, data, updated_at FROM saves WHERE user_id = ?'
      ).bind(u.userId).all()
      return res({ ok: true, saves: rows.results || [] })
    } catch (e) {
      console.error('[save] GET 查询失败', u.userId, e && e.message)
      return res({ ok: false, error: '读取云端存档失败，请稍后重试' }, 500)
    }
  }

  if (request.method === 'POST') {
    let body
    try {
      body = await request.json()
    } catch (e) {
      // 原 .catch(() => ({})) 会吞掉解析失败，导致后续报"缺少存档数据"误导定位
      // 真实原因通常是 body 过大被边缘截断、或非 JSON 网关错误页
      console.error('[save] POST JSON 解析失败', u.userId, e && e.message)
      return res({ ok: false, error: '存档数据解析失败（可能体积过大或网络中断），请检查存档大小后重试' }, 400)
    }
    const { slot, data, updated_at } = body || {}
    if (!(slot >= 0 && slot <= 5)) return res({ ok: false, error: 'slot 越界（应为 0-5）' }, 400)
    if (typeof data !== 'string' || !data) return res({ ok: false, error: '缺少存档数据' }, 400)
    // 兜底体积校验：防止超大 body 写入 D1 失败
    const dataSize = new TextEncoder().encode(data).length
    if (dataSize > DATA_MAX_BYTES) {
      return res({ ok: false, error: `存档体积过大（${(dataSize / 1024 / 1024).toFixed(2)}MB > 20MB），请清理部分数据后重试` }, 413)
    }
    // ⚠️ 时间戳兜底修复：原 `Number(updated_at) || Date.now()` 在前端传入 0/缺失时
    // 用当前时间写入 updated_at，导致云端拿到"新时间戳 + 旧数据"，下次 migrate 必然走
    // cloudTime >= localTime 覆盖本地较强档（"突然回档到上午"恶性 bug 的根因之一）。
    // 现策略：前端已保证仅在 _saveTime 有效时才上传；后端再做一次防御：
    // - 前端传入有效 ts → 用前端值
    // - 前端传入 0/缺失 → 拒绝写入并返回 400，强制前端用真实 _saveTime 重试
    const tsNum = Number(updated_at)
    if (!isFinite(tsNum) || tsNum <= 0) {
      return res({ ok: false, error: 'updated_at 缺失或无效，请刷新后重试（避免旧数据覆盖云端较新存档）' }, 400)
    }
    const ts = tsNum
    try {
      await env.DB.prepare(
        `INSERT INTO saves (user_id, slot, data, updated_at) VALUES (?,?,?,?)
         ON CONFLICT(user_id, slot) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`
      ).bind(u.userId, slot, data, ts).run()
      return res({ ok: true })
    } catch (e) {
      // D1 不可用 / 写入失败时返回明确错误，便于前端重试与定位
      console.error('[save] POST D1 写入失败', u.userId, 'slot=' + slot, e && e.message)
      return res({ ok: false, error: '云端写入失败，请稍后重试' }, 500)
    }
  }

  return res({ ok: false, error: 'Method Not Allowed' }, 405)
}
