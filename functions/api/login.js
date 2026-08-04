import { res, signJWT, verifyPassword, hashPassword } from '../_utils.js'

// 登录：校验密码（哈希优先，兼容旧明文），签发 JWT
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return res({ ok: false, error: 'Method Not Allowed' }, 405)
  const { username, password } = await request.json().catch(() => ({}))
  if (!username || !password) return res({ ok: false, error: '缺少 username / password' }, 400)

  const user = await env.DB.prepare('SELECT id, username, password FROM users WHERE username = ?').bind(username).first()
  if (!user) return res({ ok: false, error: '账号或密码错误' }, 401)

  const ok = await verifyPassword(password, user.password)
  if (!ok) return res({ ok: false, error: '账号或密码错误' }, 401)

  // 旧版明文密码登录成功 → 立即迁移为哈希存储（不改变用户任何体验）
  if (!user.password.startsWith('pbkdf2$')) {
    const passwordHash = await hashPassword(password)
    await env.DB.prepare('UPDATE users SET password = ? WHERE id = ?').bind(passwordHash, user.id).run()
  }

  const token = await signJWT(
    { sub: user.id, username, iat: Date.now(), exp: Date.now() + 1000 * 60 * 60 * 24 * 30 },
    env.JWT_SECRET || 'dev-secret'
  )
  return res({ ok: true, token, user: { id: user.id, username } })
}
