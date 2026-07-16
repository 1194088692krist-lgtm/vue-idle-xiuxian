import { res, requireUser } from '../_utils.js'

// 拉取当前玩家未领取的礼包列表
export async function onRequest({ request, env }) {
  if (request.method !== 'GET') return res({ ok: false, error: 'Method Not Allowed' }, 405)
  const u = await requireUser(request, env)
  if (!u.ok) return res(u, u.status)

  const rows = await env.DB.prepare(
    'SELECT id, items_json, message, created_at FROM gift_inbox WHERE user_id = ? AND claimed = 0 ORDER BY created_at DESC'
  ).bind(u.userId).all()
  return res({ ok: true, gifts: rows.results || [] })
}
