import { res, randomHex } from '../../_utils.js'

// GM 登录：校验 gm_accounts 明文密码，签发随机长 token 写入 gm_tokens
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return res({ ok: false, error: 'Method Not Allowed' }, 405)
  const { username, password } = await request.json().catch(() => ({}))
  if (!username || !password) return res({ ok: false, error: '缺少 username / password' }, 400)

  const gm = await env.DB.prepare('SELECT id, password FROM gm_accounts WHERE username = ?')
    .bind(username).first()
  if (!gm || gm.password !== password) return res({ ok: false, error: 'GM 账号或密码错误' }, 401)

  const token = randomHex(32)
  await env.DB.prepare(
    'INSERT INTO gm_tokens (token, gm_account_id, label, created_at, expires_at) VALUES (?,?,?,?,NULL)'
  ).bind(token, gm.id, 'gm-console', Date.now()).run()

  return res({ ok: true, token, username })
}
