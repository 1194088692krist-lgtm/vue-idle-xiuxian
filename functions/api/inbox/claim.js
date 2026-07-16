import { res, requireUser } from '../../_utils.js'

// 领取礼包：标记 claimed=1，并返回礼包内容（前端并入 player store）
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return res({ ok: false, error: 'Method Not Allowed' }, 405)
  const u = await requireUser(request, env)
  if (!u.ok) return res(u, u.status)

  const { gift_id } = await request.json().catch(() => ({}))
  const row = await env.DB.prepare(
    'SELECT * FROM gift_inbox WHERE id = ? AND user_id = ? AND claimed = 0'
  ).bind(gift_id, u.userId).first()
  if (!row) return res({ ok: false, error: '礼包不存在或已领取' }, 404)

  await env.DB.prepare('UPDATE gift_inbox SET claimed = 1 WHERE id = ?').bind(gift_id).run()
  return res({ ok: true, items: JSON.parse(row.items_json), message: row.message })
}
