/**
 * usePixiFx — 技能特效 WebGL 序列帧播放器单例管理
 *
 * 设计目标（性能 + 鲁棒性）：
 * 1. 动态 import('pixi.js')：只在首次演出时加载 PixiJS（~250KB gzipped），未触发演出 = 0 加载。
 *    通过 vite 的 manualChunks 把 pixi 独立成 chunk，避免影响首屏。
 * 2. 单例 Application：全局只创建一个 WebGL Context，避免多次创建上下文导致 GPU 内存泄漏。
 *    Canvas 用 position:fixed 铺满屏幕，pointer-events:none，z-index 与 .skill-cinematic 同级。
 * 3. WebGL 不可用回退：try/catch 包住 init，失败置 webglAvailable=false，调用方回退 CSS 动画。
 * 4. 纹理生命周期：每次演出加载一组 PNG → 播完调用 texture.destroy(true) 释放 GPU 显存。
 *    spritesheet 纹理缓存按 url 去重，避免同一素材重复加载。
 * 5. 渲染节流：只在播放中开启 ticker，空闲 ticker.stop() 释放 CPU。
 *
 * 使用：
 *   const fx = usePixiFx()
 *   await fx.ensureReady()          // 初始化（WebGL 不可用返回 false）
 *   await fx.play({ frames, fps, color, onDone })
 *   fx.stop()                       // 提前停止并销毁当前精灵
 */

import { ref } from 'vue'

// 单例状态（模块级，跨组件共享）
let pixiApp = null          // PIXI.Application 实例
let pixiModule = null       // PIXI 模块对象（动态 import 后缓存）
let canvasEl = null         // 挂载到 body 的 canvas DOM
let currentSprite = null    // 当前播放中的 AnimatedSprite
let currentTextures = []    // 当前 sprite 的纹理数组（销毁用）
let currentSide = 'center' // 当前精灵方位（resize 时复用）
let tickerStarted = false   // ticker 是否运行中

// Vue 响应式状态：暴露给组件判断
const webglAvailable = ref(null)  // null=未检测 / true=可用 / false=不可用
const isPlaying = ref(false)

// 限制单帧最大尺寸，防止 4K 屏吃显存
const MAX_TEXTURE_SIZE = 512

/**
 * 检测 WebGL 是否可用（在创建 Application 之前）
 * 用一个临时 canvas 测试，避免 PIXI 直接抛错
 */
function detectWebGL() {
  if (webglAvailable.value !== null) return webglAvailable.value
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl')
    webglAvailable.value = !!(gl && gl instanceof WebGLRenderingContext)
  } catch (e) {
    webglAvailable.value = false
  }
  return webglAvailable.value
}

/**
 * 获取 canvas 的实际显示尺寸（CSS 像素）
 * - 外部 canvas（嵌入 BattleStage）：用 clientWidth/clientHeight，反映战斗窗口真实尺寸
 *   这样 PixiJS 渲染分辨率与显示尺寸 1:1，精灵不会因全屏分辨率而被放大过巨
 * - 自建 canvas（兜底全屏）：用 window.innerWidth/innerHeight
 * - 0 尺寸兜底（组件刚挂载布局未结算）：回退 window 尺寸
 * @returns {{width:number, height:number}}
 */
function getCanvasSize() {
  if (canvasEl) {
    const w = canvasEl.clientWidth
    const h = canvasEl.clientHeight
    if (w > 0 && h > 0) return { width: w, height: h }
  }
  return { width: window.innerWidth, height: window.innerHeight }
}

/**
 * 动态加载 PixiJS 并初始化 Application
 * 幂等：已初始化直接返回
 * @param {HTMLCanvasElement} [externalCanvas]  外部传入的 canvas 元素
 *   若提供，则 PixiJS 使用该 canvas（推荐：由 Vue 组件提供，z-index 自然正确）
 *   若不提供，则自建 canvas 挂到 body 末尾（z-index:9998，与 .skill-cinematic 同级）
 * @returns {Promise<boolean>} true=可用，false=不可用（调用方应回退 CSS）
 */
async function ensureReady(externalCanvas) {
  if (!detectWebGL()) return false
  if (pixiApp) {
    // 已初始化：如果传入新 canvas，需要销毁重建
    if (externalCanvas && externalCanvas !== canvasEl) {
      cleanup()
    } else {
      return true
    }
  }

  try {
    // 动态 import：vite 会自动把这个 chunk 拆出来，首屏不加载
    pixiModule = await import('pixi.js')
    const { Application } = pixiModule

    if (externalCanvas) {
      // 使用外部 canvas：由 Vue 组件提供，嵌入 BattleStage 内
      // position/inset/z-index 由组件 scoped CSS 控制（absolute 定位覆盖 battle-stage）
      // 此处只设运行时需要的 opacity/transition，避免 inline style 覆盖 CSS
      canvasEl = externalCanvas
      canvasEl.style.pointerEvents = 'none'
      canvasEl.style.opacity = '0'
      canvasEl.style.transition = 'opacity 0.1s'
    } else {
      // 兜底：自建 canvas 挂到 body 末尾
      canvasEl = document.createElement('canvas')
      canvasEl.dataset.pixiOwned = 'true'  // 标记为自建，cleanup 时才移除 DOM
      canvasEl.style.cssText = [
        'position:fixed',
        'inset:0',
        'width:100vw',
        'height:100vh',
        'pointer-events:none',
        'z-index:9998',
        'opacity:0',
        'transition:opacity 0.1s'
      ].join(';')
      document.body.appendChild(canvasEl)
    }

    // 创建 Application：用现有 canvas，透明背景，antialias=false（特效不需要抗锯齿，省 GPU）
    // 渲染尺寸取 canvas 实际显示尺寸（嵌入 BattleStage 时为战斗窗口大小，非全屏）
    const size = getCanvasSize()
    pixiApp = new Application()
    await pixiApp.init({
      canvas: canvasEl,
      width: size.width,
      height: size.height,
      backgroundAlpha: 0,
      antialias: false,
      resolution: 1,            // 不用 devicePixelRatio，避免移动端高清屏吃显存
      autoDensity: false,
      powerPreference: 'high-performance',
      // 不启动 ticker：手动 start/stop
      preference: 'webgl'
    })
    return true
  } catch (e) {
    console.warn('[usePixiFx] WebGL init failed, fallback to CSS:', e)
    webglAvailable.value = false
    cleanup()
    return false
  }
}

/**
 * 清理 Application 与 DOM（彻底失败或组件卸载时调用）
 * 注意：externalCanvas 模式下不删除 canvas DOM（由 Vue 组件管理生命周期）
 */
function cleanup() {
  if (currentSprite) {
    try { pixiApp?.stage.removeChild(currentSprite) } catch (_) {}
    currentSprite = null
  }
  destroyTextures()
  if (pixiApp) {
    try { pixiApp.destroy(true, { children: true }) } catch (_) {}
    pixiApp = null
  }
  // 自建 canvas 才移除 DOM；外部 canvas 由 Vue 管理，不删除
  if (canvasEl && canvasEl.dataset.pixiOwned === 'true' && canvasEl.parentNode) {
    canvasEl.parentNode.removeChild(canvasEl)
  }
  canvasEl = null
  pixiModule = null
  tickerStarted = false
  isPlaying.value = false
}

function destroyTextures() {
  for (const t of currentTextures) {
    try { t.destroy(true) } catch (_) {}
  }
  currentTextures = []
}

/**
 * 处理窗口缩放：重新设置 renderer 尺寸（取 canvas 实际显示尺寸）
 */
function handleResize() {
  if (!pixiApp) return
  const size = getCanvasSize()
  pixiApp.renderer.resize(size.width, size.height)
  if (currentSprite) {
    centerSprite(currentSprite, currentSide)
  }
}

/**
 * 定位精灵到指定方位
 * @param {PIXI.Sprite} sprite
 * @param {'left'|'right'|'center'} side  横向方位：
 *   left=我方一侧（贴近队员头像），right=敌方一侧（贴近怪物头像），center=居中
 *   百分比与 SkillCinematic.vue 的 --fx-x 保持一致，确保 WebGL 精灵与 CSS 特效同位
 */
function centerSprite(sprite, side = 'center') {
  sprite.anchor.set(0.5)
  if (side === 'left') {
    // team-side(46%) 内头像居中，约在 23% 处
    sprite.x = pixiApp.screen.width * 0.23
  } else if (side === 'right') {
    // enemy-side(30% 靠右) 内头像居中，约在 85% 处
    sprite.x = pixiApp.screen.width * 0.85
  } else {
    sprite.x = pixiApp.screen.width / 2
  }
  // 垂直居中：与 SkillCinematic CSS 特效的 top:50% 对齐，
  // 让 WebGL 精灵与 CSS 光晕/图形特效在同一垂直位置
  sprite.y = pixiApp.screen.height / 2
}

// 纹理缓存：同一 url 不重复加载
const textureCache = new Map()

/**
 * 判断 URL 是否为 data URL（base64 内联资源）
 */
function isDataUrl(url) {
  return typeof url === 'string' && url.startsWith('data:')
}

/**
 * 在主线程用 HTMLImageElement + decode() 加载图片，解码完成后返回 Image 元素
 * 仅用于 data URL 的回退路径（首选走 createImageBitmap，见 loadTexture）
 * @param {string} dataUrl
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(new Error('Image load failed: ' + (e?.type || 'unknown')))
    img.src = dataUrl
  })
}

/**
 * dataURL → Blob 转换（用于 createImageBitmap 路径）
 * 优先用 fetch(dataUrl)（现代浏览器原生支持 data URL），失败回退 base64 手动解码
 * @param {string} dataUrl
 * @returns {Promise<Blob>}
 */
async function dataUrlToBlob(dataUrl) {
  // 优先 fetch（简洁、原生优化）
  if (typeof fetch === 'function') {
    try {
      const resp = await fetch(dataUrl)
      if (resp.ok) return await resp.blob()
    } catch (_) { /* fetch 失败回退手动解码 */ }
  }
  // 手动 base64 解码（兼容不支持 fetch(dataUrl) 的环境）
  const [meta, b64] = dataUrl.split(',')
  const mime = (meta.match(/data:(.*?);/) || [])[1] || 'image/png'
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

/**
 * 判定一个 Texture 是否真正可用（source 存在且尺寸>0）
 * PixiJS 8 的 TextureSource 没有 valid 属性（那是 v7 BaseTexture 的 API），
 * 用 width>0 作为有效判据——资源未就绪时 TextureSource 构造会回退到 width=1，
 * 但真正的有效纹理 width 来自 resourceWidth/naturalWidth，必然 >1（帧尺寸 128）
 * @param {Object|null|undefined} tex
 * @returns {boolean}
 */
function isTextureUsable(tex) {
  return !!(tex && tex.source && tex.source.width > 1 && tex.source.height > 1)
}

/**
 * 加载单帧纹理（彻底修复 hasSource:false）
 *
 * 根因分析（PixiJS 8.19.0）：
 * 1. TextureSource 没有 valid 属性（原 waitForSourceValid 等的是不存在的属性，永远超时）
 * 2. HTMLImageElement 的 naturalWidth 在 onload 后仍可能异步传播，导致 ImageSource
 *    构造时取到 width=1（回退值），Texture.source.width<=0 判定失败
 * 3. Texture.from(img) 走 PixiJS 内部 Cache，缓存损坏时返回 undefined
 *
 * 彻底方案：主线程 createImageBitmap 解码，ImageBitmap.width/height 立即可用且为同步数字属性，
 * 显式传 width/height 给 ImageSource 构造，彻底消除异步传播问题。
 *
 * 三级降级：
 *  - L1: dataURL → Blob → createImageBitmap → ImageSource(显式 w/h) → Texture
 *  - L2: HTMLImageElement + decode + ImageSource(显式 naturalWidth/Height) → Texture
 *  - L3: Texture.from(img, true) skipCache 兜底（绕过 PixiJS 内部缓存损坏）
 *
 * @param {string} url
 * @returns {Promise<Texture>}
 */
async function loadTexture(url) {
  if (textureCache.has(url)) {
    const cached = textureCache.get(url)
    if (isTextureUsable(cached)) return cached
    textureCache.delete(url)
  }

  let tex = null

  if (isDataUrl(url)) {
    const { Texture, ImageSource } = pixiModule

    // L1: createImageBitmap 方案（首选）——主线程解码，width/height 同步可用
    if (typeof createImageBitmap === 'function' && ImageSource) {
      try {
        const blob = await dataUrlToBlob(url)
        const bitmap = await createImageBitmap(blob)
        // ImageBitmap 解码已完成，width/height 是同步数字属性
        if (bitmap.width > 0 && bitmap.height > 0) {
          // 显式传 width/height，避免 TextureSource 构造时读 resourceWidth getter 的不确定性
          const source = new ImageSource({
            resource: bitmap,
            width: bitmap.width,
            height: bitmap.height
          })
          tex = new Texture({ source })
        }
      } catch (_) { /* L1 失败，降级 L2 */ }
    }

    // L2: HTMLImageElement + decode + 显式 naturalWidth/Height
    if (!isTextureUsable(tex) && ImageSource) {
      try {
        const img = await loadImageElement(url)
        if (typeof img.decode === 'function') {
          try { await img.decode() } catch (_) {}
        }
        const nw = img.naturalWidth || img.width || 0
        const nh = img.naturalHeight || img.height || 0
        // 只有 naturalWidth 真正就绪时才构造，避免 width=1 的空纹理
        if (nw > 1 && nh > 1) {
          const source = new ImageSource({
            resource: img,
            width: nw,
            height: nh
          })
          tex = new Texture({ source })
        }
      } catch (_) { /* L2 失败，降级 L3 */ }
    }

    // L3: Texture.from(img, true) 兜底——skipCache=true 绕过 PixiJS 内部缓存损坏
    if (!isTextureUsable(tex)) {
      try {
        const img = await loadImageElement(url)
        if (typeof img.decode === 'function') {
          try { await img.decode() } catch (_) {}
        }
        // skipCache=true 避免 PixiJS Cache.get 返回损坏的 undefined
        const nw = img.naturalWidth || img.width || 0
        if (nw > 1) {
          tex = Texture.from(img, true)
        }
      } catch (_) { /* 所有方案均失败，tex 保持 null，play 阶段会回退 CSS */ }
    }
  } else {
    // 普通 URL 路径：走 PixiJS 完整异步加载
    const { Assets } = pixiModule
    tex = await Assets.load(url)
  }

  textureCache.set(url, tex)
  return tex
}

/**
 * 播放一组序列帧
 * @param {Object} opts
 * @param {string[]} opts.frames  PNG 帧的 URL 数组（必填）
 * @param {number}   opts.fps     帧率，默认 24
 * @param {string}   opts.tint    16 进制色字符串如 '#FF5252'，给精灵染色（按属性系调色）
 * @param {number}   opts.scale   缩放，默认 1
 * @param {Function} opts.onDone  播完回调
 * @param {boolean}  opts.loop    是否循环，默认 false（一次性演出）
 * @param {'left'|'right'|'center'} opts.side  精灵横向方位：left=我方一侧，right=敌方一侧，默认 center
 * @returns {Promise<boolean>}    true=成功播放，false=加载失败
 */
async function play({ frames, fps = 24, tint, scale = 1, onDone, loop = false, side = 'center' }) {
  if (!pixiApp || !pixiModule) return false
  if (!frames || frames.length === 0) return false

  // 先停止上一个演出
  stop()

  // 加载所有帧纹理
    try {
    const textures = await Promise.all(frames.map(loadTexture))
    // 加载过程中如果已被 stop，放弃
    if (!pixiApp) return false
    // 校验纹理有效性：统一用 isTextureUsable（source 存在且 width/height > 1）
    // width>1 是关键判据——PixiJS 8 TextureSource 构造时资源未就绪会回退到 width=1，
    // 真正的有效纹理 width 来自 createImageBitmap.width 或 naturalWidth，必然 >1（帧尺寸 128）
    const badIndices = []
    textures.forEach((t, i) => {
      if (!isTextureUsable(t)) badIndices.push(i)
    })
    if (badIndices.length > 0) {
      // 诊断：输出 tex 的实际类型和 source 状态，定位是 L1/L2/L3 全失败还是其他问题
      const t0 = textures[0]
      console.warn('[usePixiFx] 部分纹理未就绪，回退 CSS。失败帧索引:', badIndices,
        '总数:', textures.length,
        '首帧详情:', t0 ? {
          isTexture: t0.isTexture === true,
          hasSource: !!t0.source,
          width: t0.source?.width,
          height: t0.source?.height,
          resourceType: t0.source?.resource?.constructor?.name || typeof t0.source?.resource
        } : 'null')
      return false
    }

    const { AnimatedSprite } = pixiModule
    const sprite = new AnimatedSprite(textures)
    sprite.animationSpeed = fps / 60  // PIXI 8 以 60fps 为基准
    sprite.loop = loop
    currentSide = side
    // 渲染分辨率同步：canvas 实际显示尺寸可能与初始化时不同
    // （warmup 时 canvas 尺寸为 0 回退了窗口尺寸，或窗口缩放后未触发 resize）
    // 播放前对齐一次，确保精灵坐标/缩放基于真实战斗窗口尺寸
    const cur = getCanvasSize()
    if (Math.abs(cur.width - pixiApp.screen.width) > 1 || Math.abs(cur.height - pixiApp.screen.height) > 1) {
      pixiApp.renderer.resize(cur.width, cur.height)
    }
    centerSprite(sprite, side)

    // 缩放：按 canvas（战斗窗口）高度自适应，限制最大纹理尺寸防爆显存
    // 嵌入 BattleStage 后 canvas 高度远小于窗口，必须用 pixiApp.screen.height 而非 window.innerHeight，
    // 否则精灵会被放得过大溢出战斗窗口
    const canvasH = pixiApp.screen.height
    const targetH = Math.min(canvasH * 0.6, MAX_TEXTURE_SIZE * 2)
    const baseH = textures[0]?.height || 256
    const autoScale = targetH / baseH
    sprite.scale.set(scale * autoScale)

    // 染色：让同一组白底素材适配不同属性色
    if (tint) {
      try { sprite.tint = parseInt(tint.replace('#', ''), 16) } catch (_) {}
    }

    // 播完回调
    if (!loop) {
      sprite.onComplete = () => {
        stop()
        if (typeof onDone === 'function') onDone()
      }
    }

    pixiApp.stage.addChild(sprite)
    sprite.gotoAndPlay(0)

    // 启动 ticker
    if (!tickerStarted) {
      pixiApp.ticker.start()
      tickerStarted = true
    }
    // 显示 canvas
    canvasEl.style.opacity = '1'

    currentSprite = sprite
    currentTextures = textures
    isPlaying.value = true
    return true
  } catch (e) {
    console.warn('[usePixiFx] play failed:', e)
    stop()
    return false
  }
}

/**
 * 停止当前播放并销毁精灵（保留 Application 与纹理缓存）
 * 纹理缓存保留是因为同技能第二次施放时无需重新加载
 */
function stop() {
  if (currentSprite && pixiApp) {
    try {
      currentSprite.stop()
      pixiApp.stage.removeChild(currentSprite)
      currentSprite.destroy({ children: true, texture: false })
    } catch (_) {}
  }
  currentSprite = null
  // 停 ticker 省 CPU
  if (pixiApp && tickerStarted) {
    pixiApp.ticker.stop()
    tickerStarted = false
  }
  if (canvasEl) canvasEl.style.opacity = '0'
  isPlaying.value = false
}

/**
 * 释放所有缓存的纹理（组件卸载或长期不演出时调用）
 * 注意：演出进行中调用会清空当前素材，调用方需先 stop()
 */
function releaseCache() {
  destroyTextures()
  textureCache.clear()
}

// 全局 resize 监听只挂一次
if (typeof window !== 'undefined') {
  window.addEventListener('resize', handleResize)
}

export function usePixiFx() {
  return {
    // 状态
    webglAvailable,
    isPlaying,
    // 生命周期
    ensureReady,
    cleanup,
    releaseCache,
    // 播放
    play,
    stop
  }
}
