// 修仙梦途 Service Worker
// 让常用静态资源（人物头像、图标、UI、怪物头像、背景图）缓存到本地，
// 二次访问直接从 Cache Storage 返回，零网络等待；用户不清浏览器数据即可永久命中。
//
// 缓存策略：
// - HTML 文档: Network-First（保证用户拿到最新版本，离线时回退缓存）
// - JS/CSS: Stale-While-Revalidate（缓存优先立即响应，后台并发刷新；hash 文件名保证安全）
// - 图片(jpg/png/webp/svg/ico): Cache-First（基本不变，缓存优先，未命中再走网络并写入缓存）
// - JSON manifest: Stale-While-Revalidate（立绘清单可能更新，缓存优先 + 后台刷新）
// - 跨域请求/动态 API: 直接走网络，不缓存
//
// 版本更新：CACHE_VERSION 由 vite 构建时注入（v{version}_{timestamp}），
// SW 文件变化触发浏览器自动更新 SW，activate 阶段清理旧版本缓存

const CACHE_VERSION = '__SW_VERSION__' // 由 vite 构建时注入
const CORE_CACHE = `core-${CACHE_VERSION}`
const ASSET_CACHE = `assets-${CACHE_VERSION}`

// 预缓存的核心启动资源（install 阶段立即缓存）
const CORE_RESOURCES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.ico',
  './portraits/manifest.json',
  './monsters/manifest.json',
  './assets/bg/main_bg.png'
]

// ===== Install：预缓存核心资源 + 立即激活 =====
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE_CACHE)
    // 容忍部分失败（某资源缺失不阻断安装）
    await Promise.all(
      CORE_RESOURCES.map(async (url) => {
        try { await cache.add(url) } catch (e) { /* 忽略单项失败 */ }
      })
    )
    // install 后立即激活，不等旧 SW 退出
    await self.skipWaiting()
  })())
})

// ===== Activate：清理旧版本缓存 + 立即接管页面 =====
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    // 清理非当前版本的所有缓存
    await Promise.all(
      keys
        .filter(k => k !== CORE_CACHE && k !== ASSET_CACHE)
        .map(k => caches.delete(k))
    )
    // 立即接管所有页面（不必等刷新）
    await self.clients.claim()
    // 通知所有客户端有新版本
    const clients = await self.clients.matchAll({ type: 'window' })
    clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }))
  })())
})

// ===== Fetch：分类型路由缓存策略 =====
self.addEventListener('fetch', event => {
  const req = event.request
  // 只处理 GET 请求；POST/PUT 等不缓存
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // 只缓存同源请求；跨域资源（如 CDN）走原生网络
  if (url.origin !== self.location.origin) return

  const path = url.pathname
  // 不缓存动态 API（项目使用 IndexedDB + GameDB，无网络 API；保险起见过滤）
  if (path.includes('/api/')) return

  // HTML 文档：Network-First
  if (req.mode === 'navigate' ||
      req.destination === 'document' ||
      path.endsWith('.html') ||
      path === '/' || path === './') {
    event.respondWith(networkFirst(req))
    return
  }

  // 图片：Cache-First（图片基本不变，最大化命中）
  if (/\.(jpg|jpeg|png|webp|gif|svg|ico)$/i.test(path)) {
    event.respondWith(cacheFirst(req, ASSET_CACHE))
    return
  }

  // JS/CSS/JSON/字体：Stale-While-Revalidate
  if (/\.(js|css|json|woff2?|ttf|eot|mp4)$/i.test(path)) {
    event.respondWith(staleWhileRevalidate(req, ASSET_CACHE))
    return
  }

  // 其他资源默认走浏览器原生处理（不调用 event.respondWith）
})

// ===== 缓存策略实现 =====

// Cache-First：缓存优先（图片）
// 命中缓存→立即返回；未命中→网络获取并写入缓存
async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  if (cached) return cached
  try {
    const res = await fetch(req)
    // 仅缓存同源基础响应（opaque 跨域响应不缓存）
    if (res && res.ok && res.type === 'basic') {
      cache.put(req, res.clone())
    }
    return res
  } catch (e) {
    // 网络失败且无缓存：返回 504 离线响应（避免页面报错）
    return new Response('', { status: 504, statusText: 'Offline' })
  }
}

// Stale-While-Revalidate：缓存优先 + 后台刷新（JS/CSS/JSON）
// 命中缓存→立即返回 + 后台异步更新；未命中→网络获取并写入缓存
async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  const fetchPromise = fetch(req)
    .then(res => {
      if (res && res.ok && res.type === 'basic') {
        cache.put(req, res.clone())
      }
      return res
    })
    .catch(() => cached) // 网络失败回退缓存
  return cached || fetchPromise
}

// Network-First：网络优先（HTML 文档）
// 网络成功→返回并更新缓存；网络失败→回退缓存（离线可用）
async function networkFirst(req) {
  try {
    const res = await fetch(req)
    if (res && res.ok && res.type === 'basic') {
      const cache = await caches.open(CORE_CACHE)
      cache.put(req, res.clone())
    }
    return res
  } catch (e) {
    // 网络失败：回退到缓存的 HTML（保证 SPA 路由可用）
    const cache = await caches.open(CORE_CACHE)
    const cached = await cache.match(req) || await cache.match('./index.html')
    if (cached) return cached
    return new Response('You are offline', { status: 503, statusText: 'Offline' })
  }
}

// ===== 消息通信：允许客户端主动触发跳过等待 =====
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
