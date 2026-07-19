import { ref, computed } from 'vue'

// 资源管理：一键下载游戏静态资源到浏览器 Cache Storage，
// 二次访问直接从本地读取零网络等待；用户不清浏览器数据即可永久命中。
// Service Worker 已配置 cacheFirst 优先查所有 cache，所以这里写入的 user-assets
// 也会被 SW 命中，无需修改 SW 文件名。

const USER_CACHE = 'user-assets' // 客户端主动预下载的 cache 名（SW cacheFirst 会优先查它）

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

// 计算属性
const progress = computed(() => totalCount.value > 0 ? Math.round(doneCount.value / totalCount.value * 100) : 0)
const downloadedMB = computed(() => (downloadedBytes.value / 1024 / 1024).toFixed(2))
const speedKBps = computed(() => speed.value.toFixed(1))
const cachedMB = computed(() => (cachedBytes.value / 1024 / 1024).toFixed(2))
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
// 包括：人物立绘（50×2）、怪物立绘（28×2）、立绘清单 2 个、背景图 1 个、立绘动态视频 1 个
async function collectResourceUrls() {
  const urls = []
  // 1. 立绘清单
  const manifestUrls = ['./portraits/manifest.json', './monsters/manifest.json']
  for (const m of manifestUrls) {
    urls.push(m)
  }
  // 2. 背景图 + favicon
  urls.push('./assets/bg/main_bg.png')
  urls.push('./favicon.ico')
  // 3. 从立绘清单提取所有图片 URL
  try {
    const [portraitsRes, monstersRes] = await Promise.all(
      manifestUrls.map(u => fetch(urlFromPath(u)))
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
  } catch (e) {
    console.warn('[useAssetManager] 立绘清单加载失败', e)
    // 仍然继续，至少缓存清单和背景图
  }
  // 去重
  return [...new Set(urls)]
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
    const urls = await collectResourceUrls()
    totalCount.value = urls.length
    if (!('caches' in window)) {
      throw new Error('当前浏览器不支持 Cache Storage API')
    }
    const cache = await caches.open(USER_CACHE)
    // 并发 6 路下载
    const concurrency = 6
    let cursor = 0
    let failedCount = 0
    let skippedCount = 0
    const totalSize = { bytes: 0 }

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
        } catch (e) {
          failedCount++
          console.warn('[useAssetManager] 下载失败：', url, e.message)
        }
        doneCount.value++
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()))

    stopSpeedMonitor()
    lastDownloadResult.value = {
      success: true,
      total: urls.length,
      failed: failedCount,
      skipped: skippedCount,
      bytes: totalSize.bytes,
      elapsedSec: Math.round((Date.now() - startTime.value) / 1000)
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
        // 用 Content-Length header 估算（避免消费 body）
        const len = parseInt(res.headers.get('content-length') || '0', 10)
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
  // 立绘清单 manifest.json（在 portraits/ 或 monsters/ 目录下）
  if (/\/(portraits|monsters)\/manifest\.json(\?|$)/i.test(url)) return true
  // 图片/视频扩展名
  if (/\.(jpg|jpeg|png|webp|gif|svg|ico|avif|mp4|webm)$/i.test(url)) return true
  // 素材目录下的文件（保险起见，凡是路径含 /portraits/ /monsters/ /assets/bg/ /assets/icons/ /assets/zones/ 都算素材）
  if (/\/(portraits|monsters|assets\/bg|assets\/icons|assets\/zones)\//i.test(url)) return true
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
    // 计算属性
    progress,
    downloadedMB,
    speedKBps,
    cachedMB,
    etaSec,
    // 方法
    downloadAllAssets,
    clearAllAssets,
    refreshCacheStats
  }
}
