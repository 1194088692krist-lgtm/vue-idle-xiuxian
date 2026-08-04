import { res, randomHex, verifyPassword, hashPassword } from '../../_utils.js'

// GM 登录：校验 gm_accounts 密码（哈希优先，兼容旧明文），签发随机长 token 写入 gm_tokens
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return res({ ok: false, error: 'Method Not Allowed' }, 405)
  const { username, password } = await request.json().catch(() => ({}))
  if (!username || !password) return res({ ok: false, error: '缺少 username / password' }, 400)

  const gm = await env.DB.prepare('SELECT id, username, password FROM gm_accounts WHERE username = ?')
    .bind(username).first()
  if (!gm) return res({ ok: false, error: 'GM 账号或密码错误' }, 401)

  const ok = await verifyPassword(password, gm.password)
  if (!ok) return res({ ok: false, error: 'GM 账号或密码错误' }, 401)

  // 旧版明文密码登录成功 → 立即迁移为哈希存储
  if (!gm.password.startsWith('pbkdf2$')) {
    const passwordHash = await hashPassword(password)
    await env.DB.prepare('UPDATE gm_accounts SET password = ? WHERE id = ?').bind(passwordHash, gm.id).run()
  }

  const token = randomHex(32)
  await env.DB.prepare(
    'INSERT INTO gm_tokens (token, gm_account_id, label, created_at, expires_at) VALUES (?,?,?,?,NULL)'
  ).bind(token, gm.id, 'gm-console', Date.now()).run()

  return res({ ok: true, token, username })
}
