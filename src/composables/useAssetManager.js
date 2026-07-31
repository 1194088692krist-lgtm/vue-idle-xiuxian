import { ref, computed } from 'vue'

// 资源管理：一键下载游戏静态资源到浏览器 Cache Storage，
// 二次访问直接从本地读取零网络等待；用户不清浏览器数据即可永久命中。
// Service Worker 已配置 cacheFirst 优先查所有 cache，所以这里写入的 user-assets
// 也会被 SW 命中，无需修改 SW 文件名。

const USER_CACHE = 'user-assets' // 客户端主动预下载的 cache 名（SW cacheFirst 会优先查它）

// 资源版本号机制：
// skins.json / pets/skins.json 顶部带 _version 字段。
// 当服务器版本与 localStorage 中存的 lastAssetVersion 不一致时（说明皮肤资源已更新），
// 强制删除所有 skin 立绘缓存条目，让 downloadOne 重新下载。
// 这能确保「一键下载」按钮真正覆盖错误的旧 skin3 立绘，避免缓存命中导致无法修复。
const SKIN_VERSION_KEY = 'lastAssetVersion'
// 全量资源签名 key：存储上次成功下载时的远程清单签名，用于判断是否需要更新
const ASSET_SIGNATURE_KEY = 'lastAssetSignature'

// 判断 URL 是否为皮肤立绘（强制更新时按此模式匹配删除缓存）
function isSkinAssetUrl(url) {
  return /\/(portraits|pets)\/[^/]*_skin\d+\.(jpg|jpeg|png|webp)$/i.test(url)
}

// 计算远程清单签名：拉取所有清单文件（cache: 'no-store' 绕过 SW），
// 用内容长度+首尾片段拼接成签名串。签名一致 → 服务器资源未变更 → 无需更新。
async function computeRemoteAssetSignature() {
  const ts = Date.now()
  const manifestPaths = [
    `./portraits/manifest.json?_t=${ts}`,
    `./monsters/manifest.json?_t=${ts}`,
    `./portraits/skins.json?v=8&_t=${ts}`,
    `./pets/manifest.json?_t=${ts}`,
    `./pets/skins.json?v=8&_t=${ts}`,
    `./fx-manifest.json?_t=${ts}`
  ]
  const responses = await Promise.all(
    manifestPaths.map(u => fetch(urlFromPath(u), { cache: 'no-store' }).catch(() => null))
  )
  let sig = ''
  for (const res of responses) {
    if (res && res.ok) {
      const text = await res.text()
      // 用长度+首尾 50 字符做轻量签名，避免完整 JSON hash 的性能开销
      sig += `${text.length}:${text.slice(0, 50)}${text.slice(-50)}|`
    } else {
      sig += 'MISS|'
    }
  }
  return sig
}

// 检查资源版本号是否变化；变化时清除所有 skin 立绘缓存，确保旧 skin3 不再出现
async function checkAssetVersionAndInvalidate(cache) {
  try {
    // 加动态时间戳绕过 Service Worker 的 SWR 缓存：
    // SW 的 staleWhileRevalidate 会 cache.match(req) 返回旧版 skins.json(count=3)，
    // 导致版本号检测拿到旧 _version，误判"版本一致"不清理缓存。
    // 时间戳使 URL 每次不同，cache.match 永不命中，必定走网络拿最新版本。
    const ts = Date.now()
    const [skinsRes, petSkinsRes] = await Promise.all([
      fetch(urlFromPath(`./portraits/skins.json?v=8&_t=${ts}`), { cache: 'no-store' }),
      fetch(urlFromPath(`./pets/skins.json?v=8&_t=${ts}`), { cache: 'no-store' })
    ])
    let serverVersion = ''
    if (skinsRes.ok) {
      const data = await skinsRes.json()
      serverVersion = data._version || ''
    }
    if (petSkinsRes.ok) {
      const data = await petSkinsRes.json()
      // 两个清单共用同一个版本号；取并集
      const v2 = data._version || ''
      if (v2 && serverVersion && v2 !== serverVersion) {
        // 不一致时取较新者作为本地基准（理论上应该一致，此处兜底）
        serverVersion = v2 > serverVersion ? v2 : serverVersion
      } else if (!serverVersion) {
        serverVersion = v2
      }
    }
    if (!serverVersion) return // 服务器未声明版本号，跳过
    const localVersion = localStorage.getItem(SKIN_VERSION_KEY) || ''
    if (localVersion === serverVersion) return // 版本一致，无需清理
    // 版本不一致：删除所有 skin 立绘缓存条目
    const keys = await caches.keys()
    let deleted = 0
    for (const k of keys) {
      const c = await caches.open(k)
      const reqs = await c.keys()
      for (const req of reqs) {
        if (isSkinAssetUrl(req.url || '')) {
          await c.delete(req)
          deleted++
        }
      }
    }
    if (deleted > 0) {
      console.log(`[useAssetManager] 资源版本变化（${localVersion || '∅'} → ${serverVersion}），已清除 ${deleted} 个旧 skin 立绘缓存`)
    }
    localStorage.setItem(SKIN_VERSION_KEY, serverVersion)
  } catch (e) {
    console.warn('[useAssetManager] 版本号检测失败，跳过缓存清理:', e.message)
  }
}

// 状态
const isDownloading = ref(false)
const isCleaning = ref(false)
const totalCount = ref(0)
const doneCount = ref(0)
const downloadedBytes = ref(0) // 累计已下载字节
const currentFile = ref('')
const startTime = ref(0)
const lastBytes = ref(0)
const lastTime = ref(0)
const speed = ref(0) // 当前速度 KB/s
const errorMessage = ref('')
const cachedFileCount = ref(0)
const cachedBytes = ref(0) // 已缓存总字节
const lastDownloadResult = ref(null) // 上次下载完成结果
const estimatedTotalBytes = ref(0) // 预估总下载字节（所有资源大小之和，含已缓存和未缓存）

// 计算属性
const progress = computed(() => totalCount.value > 0 ? Math.round(doneCount.value / totalCount.value * 100) : 0)
const downloadedMB = computed(() => (downloadedBytes.value / 1024 / 1024).toFixed(2))
const speedKBps = computed(() => speed.value.toFixed(1))
const cachedMB = computed(() => (cachedBytes.value / 1024 / 1024).toFixed(2))
// 预估总下载量 MB（所有资源大小之和，与是否已下载无关）
const estimatedTotalMB = computed(() => (estimatedTotalBytes.value / 1024 / 1024).toFixed(1))
// 预计剩余时间（秒）
const etaSec = computed(() => {
  if (speed.value <= 0 || doneCount.value >= totalCount.value) return 0
  const remainFiles = totalCount.value - doneCount.value
  const avgFileBytes = downloadedBytes.value / Math.max(1, doneCount.value)
  const remainBytes = remainFiles * avgFileBytes
  return Math.ceil(remainBytes / 1024 / speed.value)
})

// 工具：拼接相对 URL（兼容 base: './' 部署）
function urlFromPath(p) {
  // 浏览器会自动以当前文档 URL 为 base 解析相对路径
  return new URL(p, window.location.href).href
}

// 收集所有需要预下载的资源 URL
// 包括：人物立绘（50×2）+ 皮肤立绘（100）、怪物立绘（28×2）、灵宠立绘（18×4）、立绘清单、背景图、立绘动态视频 1 个
// 特效：PixiJS chunk（懒加载 chunk，预载后 SW cacheFirst 命中，首次火系演出零网络等待）
async function collectResourceUrls() {
  const urls = []
  // 1. 立绘清单（人物/怪物/灵宠 + 人物皮肤清单）
  // portraits/skins.json 带 ?v=8 缓存破坏参数：与 characters.js loadSkinsManifest 一致，
  // 确保收集到 count=6/7 的新版，从而把 skin4/5/6/7 URL 加入下载列表
  const manifestUrls = [
    './portraits/manifest.json',
    './monsters/manifest.json',
    './portraits/skins.json?v=8',
    './portraits/defeated.json',
    './pets/manifest.json',
    './pets/skins.json?v=8'
  ]
  for (const m of manifestUrls) {
    urls.push(m)
  }
  // 2. 背景图 + favicon
  urls.push('./assets/bg/main_bg.png')
  urls.push('./favicon.ico')
  // 2.1 特效清单（fx-manifest.json 由 vite 构建后生成，含 pixi-fx chunk URL）
  //     清单本身也加入预载，下次读取零网络
  urls.push('./fx-manifest.json')
  // 3. 从立绘清单提取所有图片 URL
  try {
    // fetch 时对 skins.json 加动态时间戳绕过 SW 的 SWR 缓存：
    // SW 的 staleWhileRevalidate 会返回缓存的旧版 skins.json(count=3)，
    // 导致 collectResourceUrls 只收集 skin1-3 的 URL，漏掉 skin4/skin5。
    // 时间戳使 URL 每次不同，cache.match 永不命中，必定走网络拿最新 count=5。
    // 注意：下载列表 urls 里存的仍是固定 ?v=5 的 URL（上方 manifestUrls），
    // 时间戳版本仅用于本次 fetch 拿最新数据，不加入缓存列表。
    const bustTs = Date.now()
    const fetchUrls = manifestUrls.map(u =>
      u.includes('skins.json') ? `${u}&_t=${bustTs}` : u
    )
    const [portraitsRes, monstersRes, skinsRes, defeatedRes, petManifestRes, petSkinsRes, fxManifestRes] = await Promise.all(
      fetchUrls.map(u => fetch(urlFromPath(u))).concat([fetch(urlFromPath('./fx-manifest.json'))])
    )
    const portraitsData = await portraitsRes.json()
    const monstersData = await monstersRes.json()
    // 人物立绘：full + thumbnail + 可选 video
    for (const key in portraitsData) {
      const entry = portraitsData[key]
      if (entry.full) urls.push('./portraits/' + entry.full)
      if (entry.thumbnail) urls.push('./portraits/' + entry.thumbnail)
      if (entry.video) urls.push('./portraits/' + entry.video)
    }
    // 怪物立绘
    for (const key in monstersData) {
      const entry = monstersData[key]
      if (entry.full) urls.push('./monsters/' + entry.full)
      if (entry.thumbnail) urls.push('./monsters/' + entry.thumbnail)
    }
    // 皮肤立绘：skins.json 结构为 { "char_001": 2, ... }，值为每个角色的皮肤数量
    // 需为每个角色下载 skin1~skinN 的立绘文件
    if (skinsRes.ok) {
      const skinsData = await skinsRes.json()
      for (const charId in skinsData) {
        const count = skinsData[charId] || 0
        for (let i = 1; i <= count; i++) {
          urls.push(`./portraits/${charId}_skin${i}.jpg`)
        }
      }
    }
    // 击败立绘：defeated.json 为角色 id 数组 ["char_001", ...]
    // 仅包含已有击败立绘的角色，缺失的角色不会加入下载列表（避免 404）
    if (defeatedRes.ok) {
      const defeatedIds = await defeatedRes.json()
      if (Array.isArray(defeatedIds)) {
        for (const charId of defeatedIds) {
          urls.push(`./portraits/${charId}_defeated.jpg`)
        }
      }
    }
    // 灵宠立绘：manifest.json 含 full/thumbnail/skins 数组
    if (petManifestRes.ok) {
      const petManifestData = await petManifestRes.json()
      for (const petId in petManifestData) {
        const entry = petManifestData[petId]
        if (entry.full) urls.push('./pets/' + entry.full)
        if (entry.thumbnail) urls.push('./pets/' + entry.thumbnail)
        if (Array.isArray(entry.skins)) {
          for (const skinFile of entry.skins) {
            urls.push('./pets/' + skinFile)
          }
        }
      }
    }
    // 特效 chunk：把 pixi-fx chunk URL 加入预载列表
    // 用户预载后，触发 import('pixi.js') 时 SW SWR 命中本地 cache，0 网络延迟
    if (fxManifestRes.ok) {
      const fxManifest = await fxManifestRes.json()
      if (fxManifest.pixiChunk) {
        urls.push('./' + fxManifest.pixiChunk)
      }
    }
  } catch (e) {
    console.warn('[useAssetManager] 立绘清单加载失败', e)
    // 仍然继续，至少缓存清单和背景图
  }
  // 去重
  return [...new Set(urls)]
}

// 预估总下载量：对所有资源 URL 并发 HEAD 请求获取 Content-Length 累加
// 用于在"首次约下载 XX MB"提示中显示准确的预估数据（而非已下载量）
// 采用并发 10 路 + 超时保护，避免阻塞 UI
export async function estimateTotalSize() {
  try {
    const urls = await collectResourceUrls()
    const concurrency = 10
    let totalBytes = 0
    let cursor = 0

    async function worker() {
      while (cursor < urls.length) {
        const url = urls[cursor++]
        try {
          const fullUrl = urlFromPath(url)
          // HEAD 请求获取 Content-Length（不下载 body）
          const res = await fetch(fullUrl, { method: 'HEAD' })
          const len = parseInt(res.headers.get('content-length') || '0', 10)
          if (len > 0) totalBytes += len
        } catch (e) {
          // 忽略单个文件失败
        }
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()))
    estimatedTotalBytes.value = totalBytes
    return totalBytes
  } catch (e) {
    console.warn('[useAssetManager] 预估总量失败', e)
    return 0
  }
}

// 并发下载单个资源到 Cache Storage
async function downloadOne(cache, url) {
  const fullUrl = urlFromPath(url)
  // 先检查是否已缓存，已缓存则跳过
  const existing = await cache.match(fullUrl)
  if (existing) {
    // 已缓存：计入 doneCount 但不增加 downloadedBytes（避免速度虚高）
    const size = await getResponseSize(existing)
    return { ok: true, size, skipped: true }
  }
  // 走网络下载
  const res = await fetch(fullUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  // clone 后写入 cache（原 res 还能被读取 size）
  await cache.put(fullUrl, res.clone())
  const size = await getResponseSize(res)
  return { ok: true, size, skipped: false }
}

// 获取响应体字节大小（response.body 已被消费则返回 0）
async function getResponseSize(res) {
  try {
    // 如果已被 clone 过且 body 还可读，用 arrayBuffer 测
    if (res.bodyUsed) return 0
    const buf = await res.arrayBuffer()
    return buf.byteLength
  } catch (e) {
    return 0
  }
}

// 速度采样：每 500ms 计算一次
let speedTimer = null
function startSpeedMonitor() {
  stopSpeedMonitor()
  lastBytes.value = 0
  lastTime.value = Date.now()
  speedTimer = setInterval(() => {
    const now = Date.now()
    const dt = (now - lastTime.value) / 1000
    if (dt <= 0) return
    const dBytes = downloadedBytes.value - lastBytes.value
    speed.value = dBytes / 1024 / dt // KB/s
    lastBytes.value = downloadedBytes.value
    lastTime.value = now
  }, 500)
}
function stopSpeedMonitor() {
  if (speedTimer) {
    clearInterval(speedTimer)
    speedTimer = null
  }
  // 最后一次刷新
  if (startTime.value > 0) {
    const totalDt = (Date.now() - startTime.value) / 1000
    if (totalDt > 0) {
      speed.value = downloadedBytes.value / 1024 / totalDt
    }
  }
}

// 一键下载所有游戏资源到本地
// 并发数 6，避免浏览器卡死
export async function downloadAllAssets() {
  if (isDownloading.value) return
  isDownloading.value = true
  errorMessage.value = ''
  totalCount.value = 0
  doneCount.value = 0
  downloadedBytes.value = 0
  currentFile.value = ''
  startTime.value = Date.now()
  lastDownloadResult.value = null
  speed.value = 0
  startSpeedMonitor()

  try {
    // 预检查阶段：先刷新本地缓存统计，确保 cachedFileCount 准确，
    // 再拉取远程清单签名与本地签名比对。
    // 若签名一致且本地已有缓存文件 → 资源已是最新，跳过整个下载流程。
    await refreshCacheStats()
    let remoteSignature = ''
    try {
      remoteSignature = await computeRemoteAssetSignature()
    } catch (e) {
      console.warn('[useAssetManager] 远程签名计算失败，继续全量检查:', e.message)
    }
    const localSignature = localStorage.getItem(ASSET_SIGNATURE_KEY) || ''
    if (remoteSignature && remoteSignature === localSignature && cachedFileCount.value > 0) {
      // 签名一致且本地已有缓存：资源已是最新，无需更新
      lastDownloadResult.value = {
        success: true,
        total: 0,
        failed: 0,
        skipped: cachedFileCount.value,
        bytes: 0,
        elapsedSec: 0,
        upToDate: true
      }
      isDownloading.value = false
      stopSpeedMonitor()
      return lastDownloadResult.value
    }

    const urls = await collectResourceUrls()
    totalCount.value = urls.length
    if (!('caches' in window)) {
      throw new Error('当前浏览器不支持 Cache Storage API')
    }
    const cache = await caches.open(USER_CACHE)
    // 检查资源版本号；若变化则先删除所有 skin 立绘缓存，确保旧 skin3 被强制覆盖
    await checkAssetVersionAndInvalidate(cache)
    // 并发 6 路下载
    const concurrency = 6
    let cursor = 0
    let failedCount = 0
    let skippedCount = 0
    const totalSize = { bytes: 0 }
    // 累计所有文件大小（含已缓存跳过的），用于更新预估总量
    const allFilesSize = { bytes: 0 }

    async function worker() {
      while (cursor < urls.length) {
        const url = urls[cursor++]
        currentFile.value = url
        try {
          const result = await downloadOne(cache, url)
          if (result.skipped) skippedCount++
          else {
            downloadedBytes.value += result.size
            totalSize.bytes += result.size
          }
          // 无论是否跳过，都累加到预估总量
          if (result.size > 0) allFilesSize.bytes += result.size
        } catch (e) {
          failedCount++
          console.warn('[useAssetManager] 下载失败：', url, e.message)
        }
        doneCount.value++
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()))

    // 下载完成后用实际文件大小更新预估总量（比 HEAD 请求更准确）
    if (allFilesSize.bytes > 0) estimatedTotalBytes.value = allFilesSize.bytes

    stopSpeedMonitor()
    lastDownloadResult.value = {
      success: true,
      total: urls.length,
      failed: failedCount,
      skipped: skippedCount,
      bytes: totalSize.bytes,
      elapsedSec: Math.round((Date.now() - startTime.value) / 1000)
    }
    // 下载成功且无失败时，保存远程签名，下次可跳过全量下载
    if (remoteSignature && failedCount === 0) {
      localStorage.setItem(ASSET_SIGNATURE_KEY, remoteSignature)
    }
    // 刷新缓存统计
    await refreshCacheStats()
    return lastDownloadResult.value
  } catch (e) {
    errorMessage.value = e.message || String(e)
    stopSpeedMonitor()
    lastDownloadResult.value = { success: false, error: e.message }
    throw e
  } finally {
    isDownloading.value = false
    currentFile.value = ''
  }
}

// 刷新缓存统计：遍历所有 cache，统计已缓存文件数 + 总字节
export async function refreshCacheStats() {
  if (!('caches' in window)) return
  let count = 0
  let bytes = 0
  const keys = await caches.keys()
  for (const k of keys) {
    const cache = await caches.open(k)
    const requests = await cache.keys()
    for (const req of requests) {
      const res = await cache.match(req)
      if (res) {
        count++
        // 优先用 Content-Length header 估算（不消费 body，性能好）
        let len = parseInt(res.headers.get('content-length') || '0', 10)
        // 修复：很多缓存响应（SW 写入 / 压缩传输 / 缺少 header）没有 Content-Length，
        // 导致 cachedBytes 严重偏小、显示失真。fallback 读取 blob 测量真实字节大小。
        // 用 clone() 避免消费原 response（cache.match 返回的副本读 blob 不影响缓存条目）
        if (!(len > 0)) {
          try {
            const blob = await res.clone().blob()
            len = blob.size
          } catch (e) {
            // 读取失败时跳过，不计入（保持计数但不增加体积）
          }
        }
        if (len > 0) bytes += len
      }
    }
  }
  cachedFileCount.value = count
  cachedBytes.value = bytes
}

// 判定一个缓存条目是否为「素材文件」（应被清理）
// 素材 = 图片(jpg/png/webp/svg/ico/avif/gif) + 视频(mp4/webm) + 立绘清单 JSON
// 代码文件 = JS/CSS/HTML/字体等，应保留
function isAssetFile(url) {
  if (!url) return false
  // 立绘清单 manifest.json（在 portraits/ 或 monsters/ 或 pets/ 目录下）
  if (/\/(portraits|monsters|pets)\/manifest\.json(\?|$)/i.test(url)) return true
  if (/\/(portraits|monsters|pets)\/skins\.json(\?|$)/i.test(url)) return true
  // 击败立绘清单 portraits/defeated.json
  if (/\/portraits\/defeated\.json(\?|$)/i.test(url)) return true
  // 图片/视频扩展名
  if (/\.(jpg|jpeg|png|webp|gif|svg|ico|avif|mp4|webm)$/i.test(url)) return true
  // 素材目录下的文件（保险起见，凡是路径含 /portraits/ /monsters/ /pets/ /assets/bg/ /assets/icons/ /assets/zones/ 都算素材）
  if (/\/(portraits|monsters|pets|assets\/bg|assets\/icons|assets\/zones)\//i.test(url)) return true
  return false
}

// 一键清理本地资源：仅清理各类素材文件（图片/立绘/视频/立绘清单 JSON）
// 保留所有代码文件（JS/CSS/HTML/字体），避免重新下载代码导致版本错乱
// 同时保留 Service Worker 注册（SW 本身是代码，且负责缓存管理）
export async function clearAllAssets() {
  if (isCleaning.value) return
  isCleaning.value = true
  errorMessage.value = ''
  try {
    if (!('caches' in window)) {
      throw new Error('当前浏览器不支持 Cache Storage API')
    }
    // 1. 遍历所有 cache，仅删除素材条目（保留 JS/CSS/HTML 等代码文件）
    const keys = await caches.keys()
    let deletedCount = 0
    for (const k of keys) {
      const cache = await caches.open(k)
      const requests = await cache.keys()
      for (const req of requests) {
        const url = req.url || ''
        if (isAssetFile(url)) {
          await cache.delete(req)
          deletedCount++
        }
      }
    }
    // 2. 不注销 Service Worker —— SW 是代码，且负责缓存管理
    // 注销 SW 反而会丢失已缓存的代码文件，导致下次访问重新下载全部 JS/CSS
    // 2.1 清除资源签名，使下次「更新本地资源」能正常走全量检查而非误判"已是最新"
    localStorage.removeItem(ASSET_SIGNATURE_KEY)
    // 3. 刷新统计
    await refreshCacheStats()
    lastDownloadResult.value = null
    return { deletedFiles: deletedCount }
  } catch (e) {
    errorMessage.value = e.message || String(e)
    throw e
  } finally {
    isCleaning.value = false
  }
}

// 导出响应式状态供组件使用
export function useAssetManager() {
  return {
    // 状态
    isDownloading,
    isCleaning,
    totalCount,
    doneCount,
    downloadedBytes,
    currentFile,
    speed,
    errorMessage,
    cachedFileCount,
    cachedBytes,
    lastDownloadResult,
    estimatedTotalBytes,
    // 计算属性
    progress,
    downloadedMB,
    speedKBps,
    cachedMB,
    estimatedTotalMB,
    etaSec,
    // 方法
    downloadAllAssets,
    clearAllAssets,
    refreshCacheStats,
    estimateTotalSize
  }
}
