import { res, requireUser } from '../_utils.js'

// 5 槽云同步：GET 拉全部 / POST 存单槽（upsert，最后写入获胜）
export async function onRequest({ request, env }) {
  const u = await requireUser(request, env)
  if (!u.ok) return res(u, u.status)

  if (request.method === 'GET') {
    const rows = await env.DB.prepare(
      'SELECT slot, data, updated_at FROM saves WHERE user_id = ?'
    ).bind(u.userId).all()
    return res({ ok: true, saves: rows.results || [] })
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const { slot, data, updated_at } = body
    if (!(slot >= 0 && slot <= 5)) return res({ ok: false, error: 'slot 越界（应为 0-5）' }, 400)
    if (typeof data !== 'string' || !data) return res({ ok: false, error: '缺少存档数据' }, 400)
    const ts = Number(updated_at) || Date.now()
    await env.DB.prepare(
      `INSERT INTO saves (user_id, slot, data, updated_at) VALUES (?,?,?,?)
       ON CONFLICT(user_id, slot) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`
    ).bind(u.userId, slot, data, ts).run()
    return res({ ok: true })
  }

  return res({ ok: false, error: 'Method Not Allowed' }, 405)
}
