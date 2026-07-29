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
 *   left=我方一侧，right=敌方一侧，center=居中
 */
function centerSprite(sprite, side = 'center') {
  sprite.anchor.set(0.5)
  if (side === 'left') {
    sprite.x = pixiApp.screen.width * 0.25
  } else if (side === 'right') {
    sprite.x = pixiApp.screen.width * 0.75
  } else {
    sprite.x = pixiApp.screen.width / 2
  }
  // 略偏下：与 .skill-cinematic 的 padding-bottom:22vh 一致
  sprite.y = pixiApp.screen.height * 0.78
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
 * 仅用于 data URL：规避 PixiJS 8 Assets.load 对 dataURL 走 Worker 路径导致
 * createImageBitmap(blob) 在部分环境下返回 width=0 / source.valid=false 的问题
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
 * 加载单帧纹理
 * - data URL：主线程 Image+decode → Texture.from(img)，绕过 PixiJS Worker 路径
 *   （PixiJS 8 Assets.load 对 dataURL 走 WorkerManager.loadImageBitmap → fetch+createImageBitmap，
 *    在部分浏览器/Worker 环境下 createImageBitmap 返回损坏 bitmap，source.valid=false）
 * - 普通 URL：走 Assets.load 正常异步流程
 * @param {string} url
 * @returns {Promise<Texture>}
 */
async function loadTexture(url) {
  if (textureCache.has(url)) return textureCache.get(url)

  let tex
  if (isDataUrl(url)) {
    // dataURL 路径：主线程加载并解码，确保 ImageSource 资源就绪
    const img = await loadImageElement(url)
    // 进一步 await decode()，确保浏览器完成图像解码
    if (typeof img.decode === 'function') {
      try { await img.decode() } catch (_) { /* decode 失败也继续，onload 已保证加载完成 */ }
    }
    const { Texture } = pixiModule
    tex = Texture.from(img)
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
    // 校验纹理有效性：PixiJS 8 的 TextureSource 没有 valid 属性（那是 v7 BaseTexture 的 API），
    // 改用 source 存在 + width/height > 0 判断。dataURL 经主线程 Image+decode 加载，
    // onload 触发即代表解码完成，Texture.from(img) 同步构造，纹理必然有效。
    const badIndices = []
    textures.forEach((t, i) => {
      if (!t || !t.source || !t.source.width || !t.source.height) badIndices.push(i)
    })
    if (badIndices.length > 0) {
      console.warn('[usePixiFx] 部分纹理未就绪，回退 CSS。失败帧索引:', badIndices,
        '总数:', textures.length,
        '首帧详情:', textures[0] ? { hasSource: !!textures[0].source, width: textures[0].source?.width, height: textures[0].source?.height } : 'null')
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
