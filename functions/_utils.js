// 共享工具模块（下划线开头，不会被路由）
// 提供：响应构造 / 无依赖 JWT(HS256, Web Crypto) / 玩家鉴权 / GM 凭证校验 / 礼包白名单校验

export function res(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  })
}

// ---- base64url 编解码（Web Crypto 输出为 Uint8Array）----
function b64url(bytes) {
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = str.length % 4 ? 4 - (str.length % 4) : 0
  str += '='.repeat(pad)
  const bin = atob(str)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// ---- HMAC-SHA256（无第三方依赖，使用 Workers 内置 Web Crypto）----
async function hmacSHA256(message, secret) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return b64url(new Uint8Array(sig))
}

// ---- JWT 签发 / 校验 ----
export async function signJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const h = b64url(new TextEncoder().encode(JSON.stringify(header)))
  const p = b64url(new TextEncoder().encode(JSON.stringify(payload)))
  const signingInput = `${h}.${p}`
  const sig = await hmacSHA256(signingInput, secret)
  return `${signingInput}.${sig}`
}

export async function verifyJWT(token, secret) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [h, p, sig] = parts
  const expected = await hmacSHA256(`${h}.${p}`, secret)
  if (expected !== sig) return null
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p)))
    if (payload.exp && payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

// ---- 玩家鉴权：取 Bearer <JWT> 并验签 ----
export async function requireUser(request, env) {
  const auth = request.headers.get('Authorization') || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m) return { ok: false, status: 401, error: '缺少登录凭证' }
  const payload = await verifyJWT(m[1].trim(), env.JWT_SECRET || 'dev-secret')
  if (!payload) return { ok: false, status: 401, error: '登录凭证无效或已过期' }
  return { ok: true, userId: payload.sub, username: payload.username }
}

// ---- GM 凭证校验：取 Bearer <gm_token>，查 gm_tokens（联 gm_accounts），校验存在且未过期 ----
export async function requireGM(request, env) {
  const auth = request.headers.get('Authorization') || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m) return { ok: false, status: 401, error: '缺少 GM Token' }
  const token = m[1].trim()
  const row = await env.DB.prepare(
    `SELECT t.gm_account_id AS id, a.username
       FROM gm_tokens t JOIN gm_accounts a ON a.id = t.gm_account_id
      WHERE t.token = ? AND (t.expires_at IS NULL OR t.expires_at > ?)`
  ).bind(token, Date.now()).first()
  if (!row) return { ok: false, status: 403, error: 'GM Token 无效或已过期' }
  return { ok: true, gm: row }
}

// ---- 礼包白名单校验：只允许已知资源 + 正数，杜绝越权改任意字段 ----
// 仅允许的数值资源键（对应 player.js 真实字段）
const ALLOWED_NUM = ['spiritStones', 'phantomCrystals', 'reinforceStones', 'refinementStones', 'petEssence']
// 物品型素材（id → 名称）
const MATERIAL_NAMES = {
  common_enhance_stone: '普通强化石',
  advanced_enhance_stone: '高级强化石',
  supreme_enhance_stone: '至尊强化石',
  reforge_stone: '洗练石'
}

export function validateItems(items) {
  const out = { num: {}, materials: [] }
  if (items && items.resources) {
    for (const k of ALLOWED_NUM) {
      const v = Number(items.resources[k])
      if (Number.isFinite(v) && v > 0) out.num[k] = v
    }
  }
  if (items && Array.isArray(items.materials)) {
    for (const it of items.materials) {
      if (MATERIAL_NAMES[it.id] && Number(it.count) > 0) {
        out.materials.push({
          id: it.id,
          name: MATERIAL_NAMES[it.id],
          count: Math.floor(Number(it.count))
        })
      }
    }
  }
  if (!Object.keys(out.num).length && !out.materials.length) {
    return { ok: false, error: '礼包内容为空或含非法资源' }
  }
  return { ok: true, items: out }
}

// 生成随机十六进制串（用于 gm_token）
export function randomHex(bytes = 32) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}
