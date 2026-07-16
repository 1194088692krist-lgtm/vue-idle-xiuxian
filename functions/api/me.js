import { res, requireUser } from '../_utils.js'

// 获取当前登录用户信息
export async function onRequest({ request, env }) {
  if (request.method !== 'GET') return res({ ok: false, error: 'Method Not Allowed' }, 405)
  const u = await requireUser(request, env)
  if (!u.ok) return res(u, u.status)
  return res({ ok: true, user: { id: u.userId, username: u.username } })
}
