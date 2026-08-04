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
    // 清理非当前版本的核心/资产缓存，但保留 user-assets
    // user-assets 是用户主动通过"一键下载"缓存的素材（人物立绘/怪物立绘/背景图等），
    // 不应被 SW 版本更新清理，否则用户辛苦下载的素材会在下次发版后丢失
    const PRESERVE_CACHES = [CORE_CACHE, ASSET_CACHE, 'user-assets']
    await Promise.all(
      keys
        .filter(k => !PRESERVE_CACHES.includes(k))
        .map(k => caches.delete(k))
    )
    // 立即接管所有页面（不必等刷新）
    await self.clients.claim()
    // 预打开常用缓存句柄，后续 fetch 阶段直接复用，避免每次请求 caches.open 异步开销
    await Promise.all(SEARCH_CACHES.map(k => getCache(k)))
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

  // /assets/ 路径下的 hash 文件名资源（JS/CSS 带 contenthash）是 immutable 的，
  // 用纯 Cache-First 避免 SWR 的无意义后台 revalidate 请求（每次都返回 304 也是浪费）
  if (path.includes('/assets/') && /\.[a-f0-9]{8,}\.(js|css)$/i.test(path)) {
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

// 需要查找命中的缓存列表：仅限本版本资产缓存 + 用户主动预载的 user-assets。
// 原实现每次请求都 caches.keys() 遍历并打开「所有」缓存（含 235MB 立绘、29MB 怪物、
// 及历史遗留缓存）来查找，挂机刷怪高频加载立绘时产生大量无谓的异步 open/match 开销。
// 改为固定顺序只查这两个缓存：命中率不变，但避免每次请求遍历全部缓存。
const SEARCH_CACHES = ['user-assets', ASSET_CACHE]

// 预打开的缓存句柄缓存：避免每次请求都 caches.open() 产生异步开销
// 在 activate 阶段预初始化，后续 findInCaches 直接复用
const _cacheHandles = new Map()
async function getCache(name) {
  if (!_cacheHandles.has(name)) {
    _cacheHandles.set(name, caches.open(name))
  }
  return _cacheHandles.get(name)
}

// 在固定缓存列表里查找命中（优先 user-assets，兼容客户端 useAssetManager 预载入的素材）
async function findInCaches(req) {
  for (const k of SEARCH_CACHES) {
    try {
      const cache = await getCache(k)
      const hit = await cache.match(req)
      if (hit) return hit
    } catch (e) { /* 该缓存不存在或不可用，跳过继续 */ }
  }
  return null
}

// Cache-First：缓存优先（图片）
// 命中缓存→立即返回；未命中→网络获取并写入缓存
async function cacheFirst(req, cacheName) {
  // 1. 在固定缓存列表查找命中（兼容客户端预下载的 user-assets）
  const cached = await findInCaches(req)
  if (cached) return cached
  // 2. 未命中：走网络并写入默认 cache
  try {
    const res = await fetch(req)
    // 仅缓存同源基础响应（opaque 跨域响应不缓存）
    if (res && res.ok && res.type === 'basic') {
      const cache = await caches.open(cacheName)
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
// 这样用户预载到 user-assets 的 pixi-fx chunk 也能命中，首次技能演出 0 网络等待
async function staleWhileRevalidate(req, cacheName) {
  // 1. 在固定缓存列表查找命中
  const cached = await findInCaches(req)
  // 2. 后台刷新（命中或未命中都执行，保证下次拿到最新版本）
  const cache = await caches.open(cacheName)
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
