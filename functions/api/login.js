import { res, signJWT } from '../_utils.js'

// 登录：校验明文密码，签发 JWT
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return res({ ok: false, error: 'Method Not Allowed' }, 405)
  const { username, password } = await request.json().catch(() => ({}))
  if (!username || !password) return res({ ok: false, error: '缺少 username / password' }, 400)

  const user = await env.DB.prepare('SELECT id, password FROM users WHERE username = ?').bind(username).first()
  if (!user || user.password !== password) return res({ ok: false, error: '账号或密码错误' }, 401)

  const token = await signJWT(
    { sub: user.id, username, iat: Date.now(), exp: Date.now() + 1000 * 60 * 60 * 24 * 30 },
    env.JWT_SECRET || 'dev-secret'
  )
  return res({ ok: true, token, user: { id: user.id, username } })
}
