import { res, requireGM, validateItems } from '../../_utils.js'

// GM 给指定用户（username）发礼包，资源走白名单校验
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return res({ ok: false, error: 'Method Not Allowed' }, 405)
  const gm = await requireGM(request, env)          // ← GM 凭证校验
  if (!gm.ok) return res(gm, gm.status)

  const { username, items, message } = await request.json().catch(() => ({}))
  if (!username || !items) return res({ ok: false, error: '缺少 username 或 items' }, 400)

  const user = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
  if (!user) return res({ ok: false, error: `用户 ${username} 不存在` }, 404)

  const v = validateItems(items)
  if (!v.ok) return res({ ok: false, error: v.error }, 400)

  await env.DB.prepare(
    'INSERT INTO gift_inbox (user_id, items_json, message, created_at, claimed) VALUES (?,?,?,?,0)'
  ).bind(user.id, JSON.stringify(v.items), message || '', Date.now()).run()

  return res({ ok: true, to: username, items: v.items })
}
