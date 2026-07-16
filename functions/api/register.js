import { res, signJWT } from '../_utils.js'

// 注册：写 users（明文密码，仅区分用户），签发 JWT
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return res({ ok: false, error: 'Method Not Allowed' }, 405)
  const { username, password } = await request.json().catch(() => ({}))
  if (!username || !password) return res({ ok: false, error: '缺少 username / password' }, 400)
  if (username.length < 2 || username.length > 20) return res({ ok: false, error: '账号长度需 2-20 位' }, 400)
  if (password.length < 4) return res({ ok: false, error: '密码至少 4 位' }, 400)

  const exist = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
  if (exist) return res({ ok: false, error: '该账号已存在' }, 409)

  const r = await env.DB.prepare('INSERT INTO users (username, password, created_at) VALUES (?,?,?)')
    .bind(username, password, Date.now()).run()
  const userId = r.meta?.last_row_id
  if (!userId) return res({ ok: false, error: '注册失败' }, 500)

  const token = await signJWT(
    { sub: userId, username, iat: Date.now(), exp: Date.now() + 1000 * 60 * 60 * 24 * 30 },
    env.JWT_SECRET || 'dev-secret'
  )
  return res({ ok: true, token, user: { id: userId, username } })
}
