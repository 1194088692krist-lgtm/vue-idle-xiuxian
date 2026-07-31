// 云存档压缩工具
// ------------------------------------------------------------
// 为什么必须“先压明文再加密”：AES 密文是高熵数据，gzip 对其几乎压不动（7-8MB 密文压完还是 7MB）。
// 而游戏存档 JSON（尤其 materials 这种高度重复的扁平数组）压缩率极高（通常 8-12 倍），
// 7-8MB 明文经 gzip 可降到 <1MB。这样既能解决“境外服务器上传卡顿”（上行数据量骤减），
// 又能满足“上传容量只有 3MB”的硬性限制，无需换服务器、无需额外付费、无需玩家操作。
//
// 设计要点：
// - 仅在“上传前压缩 / 下载后解压”两个唯一出入口处理（pushSlotToCloud / fetchCloudSaves），
//   写入本地 IndexedDB 与云端 D1 的仍是普通加密密文，下游 initializePlayer / decryptData 完全不用改。
// - 带 GZ1: 标记；旧存档（无标记）解压时原样返回，天然向后兼容。
// - 浏览器与 Cloudflare Workers 均内置 CompressionStream；老旧环境无该 API 时降级为“不压缩”，
//   保证任何情况下都不会丢档（只是不省体积）。

const GZIP_PREFIX = 'GZ1:' // 压缩标记。crypto-js 加密结果固定以 "U2FsdGVkX1" 开头，不会与本标记冲突

// ---- 字节 <-> base64（浏览器/Node 通用，避免对环境的额外依赖）----
function bytesToBase64(bytes) {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}
function base64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// ---- 流压缩 / 解压辅助（基于 Web Streams，浏览器与 Workers 原生支持）----
async function gzipBytes(inputBytes) {
  const cs = new CompressionStream('gzip')
  const writer = cs.writable.getWriter()
  writer.write(inputBytes)
  writer.close()
  const ab = await new Response(cs.readable).arrayBuffer()
  return new Uint8Array(ab)
}
async function gunzipBytes(inputBytes) {
  const ds = new DecompressionStream('gzip')
  const writer = ds.writable.getWriter()
  writer.write(inputBytes)
  writer.close()
  const ab = await new Response(ds.readable).arrayBuffer()
  return new Uint8Array(ab)
}

// 是否为本模块压缩过的存档（带 GZ1: 标记）
export function isCompressed(str) {
  return typeof str === 'string' && str.startsWith(GZIP_PREFIX)
}

// 压缩：明文/密文字符串 -> "GZ1:" + base64(gzip(utf8(str)))
// 环境不支持 CompressionStream 或压缩异常时，降级返回原串（不压缩，但不丢数据）
export async function compressSave(str) {
  if (typeof str !== 'string' || typeof CompressionStream === 'undefined') {
    return str
  }
  try {
    const input = new TextEncoder().encode(str)
    const out = await gzipBytes(input)
    return GZIP_PREFIX + bytesToBase64(out)
  } catch (e) {
    console.error('[compressSave] 压缩失败，降级为明文传输:', e)
    return str
  }
}

// 解压：带 GZ1: 标记则 gzip 还原；否则原样返回（兼容旧存档）
// 标记存在但环境不支持解压时明确抛错（数据已压缩却读不出，不应静默当成明文）
export async function decompressSave(str) {
  if (typeof str !== 'string' || !str.startsWith(GZIP_PREFIX)) {
    return str
  }
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('存档为压缩格式，但当前环境不支持解压')
  }
  try {
    const b64 = str.slice(GZIP_PREFIX.length)
    const bytes = base64ToBytes(b64)
    const out = await gunzipBytes(bytes)
    return new TextDecoder().decode(out)
  } catch (e) {
    console.error('[decompressSave] 解压失败:', e)
    throw e
  }
}
