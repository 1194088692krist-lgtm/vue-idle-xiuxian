/**
 * 生成火系特效序列帧（程序化离屏 Canvas 渲染）
 *
 * 设计：
 * - 16 帧 × 128×128 透明 PNG
 * - 白底放射火焰（便于 PIXI tint 染色为不同属性色）
 * - 启动时一次性生成，base64 dataURL 存内存，无网络请求
 * - 总数据量 < 30KB（小尺寸 + 简单形状）
 *
 * 该函数同时用于其他属性系的"白底素材"：通过 PIXI.tint 染色适配
 */

const FRAME_COUNT = 16
const FRAME_SIZE = 128

// 伪随机数生成器（固定种子，保证每次生成的帧一致）
function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 生成单帧火焰图像
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} frameIdx 0..FRAME_COUNT-1
 */
function drawFlameFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const cx = size / 2
  const cy = size * 0.72  // 火焰底部稍下
  const t = frameIdx / FRAME_COUNT  // 0..1 进度

  ctx.clearRect(0, 0, size, size)

  // 进度对应火焰高度：0% 起爆（小）→ 50% 最高（大）→ 100% 散尽
  const heightFactor = Math.sin(t * Math.PI)  // 0→1→0
  const flameH = 20 + heightFactor * 80       // 20..100
  const flameW = 24 + heightFactor * 36       // 24..60

  // 火焰主体：多层径向渐变（白热→外层）
  const grad = ctx.createRadialGradient(cx, cy - flameH * 0.3, 0, cx, cy - flameH * 0.3, flameH)
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')        // 中心白热
  grad.addColorStop(0.3, 'rgba(255, 240, 200, 0.85)')
  grad.addColorStop(0.6, 'rgba(255, 200, 100, 0.6)')
  grad.addColorStop(1, 'rgba(255, 100, 0, 0)')              // 边缘透明

  ctx.fillStyle = grad
  ctx.beginPath()
  // 火焰形状：贝塞尔绘制水滴形
  ctx.moveTo(cx - flameW / 2, cy)
  ctx.bezierCurveTo(
    cx - flameW / 2, cy - flameH * 0.5,
    cx - flameW * 0.3, cy - flameH,
    cx, cy - flameH
  )
  ctx.bezierCurveTo(
    cx + flameW * 0.3, cy - flameH,
    cx + flameW / 2, cy - flameH * 0.5,
    cx + flameW / 2, cy
  )
  ctx.closePath()
  ctx.fill()

  // 飘散的火星粒子（每帧位置略有差异制造动态感）
  const rand = mulberry32(frameIdx * 1000 + 42)
  ctx.fillStyle = 'rgba(255, 255, 200, 0.9)'
  for (let i = 0; i < 8; i++) {
    const px = cx + (rand() - 0.5) * flameW * 1.5
    const py = cy - flameH * (0.5 + rand() * 0.5) - t * 20  // 随时间上飘
    const pr = 1 + rand() * 2
    if (py > 0 && py < size) {
      ctx.beginPath()
      ctx.arc(px, py, pr, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/**
 * 生成全部帧并返回 dataURL 数组
 * @returns {string[]} dataURL 数组，长度 FRAME_COUNT
 */
export function generateFlameFrames() {
  const frames = []
  // 复用一个 canvas 节省内存
  const canvas = document.createElement('canvas')
  canvas.width = FRAME_SIZE
  canvas.height = FRAME_SIZE
  const ctx = canvas.getContext('2d')

  for (let i = 0; i < FRAME_COUNT; i++) {
    drawFlameFrame(ctx, i)
    frames.push(canvas.toDataURL('image/png'))
  }
  return frames
}

/**
 * 生成鬼宗/暗系黑洞漩涡单帧
 * 设计：中心暗核 + 3 圈虚线旋转环 + 螺旋吸入粒子
 * 白底素材，经 PIXI tint 染色为暗紫等属性色
 */
function drawVortexFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const cx = size / 2
  const cy = size / 2
  const t = frameIdx / FRAME_COUNT  // 0..1 进度

  ctx.clearRect(0, 0, size, size)

  // 进度：0→1→0（起爆→最强→消散）
  const progress = Math.sin(t * Math.PI)

  // 1. 中心暗核：白色径向渐变，随进度膨胀
  const coreR = Math.max(2, 6 + progress * 18)
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR)
  coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  coreGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.55)')
  coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = coreGrad
  ctx.beginPath()
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2)
  ctx.fill()

  // 2. 3 圈虚线环：白色描边，旋转制造漩涡感
  const baseAngle = t * Math.PI * 4  // 总共转 2 圈
  for (let r = 0; r < 3; r++) {
    const ringR = Math.max(4, 18 + r * 14 + progress * 8)
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.75 - r * 0.18})`
    ctx.lineWidth = 1.8
    ctx.setLineDash([7, 4])
    ctx.lineDashOffset = -baseAngle * 20 - r * 5
    ctx.beginPath()
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.setLineDash([])

  // 3. 螺旋吸入粒子：从外围向中心螺旋
  const rand = mulberry32(frameIdx * 1000 + 7)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  for (let i = 0; i < 10; i++) {
    const ang0 = (i / 10) * Math.PI * 2
    const spiralAngle = ang0 + t * Math.PI * 3
    const radius = Math.max(2, 48 - progress * 28 + (rand() - 0.5) * 8)
    const px = cx + Math.cos(spiralAngle) * radius
    const py = cy + Math.sin(spiralAngle) * radius
    const pr = Math.max(0.5, 1 + rand() * 1.5)
    ctx.beginPath()
    ctx.arc(px, py, pr, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function generateVortexFrames() {
  const frames = []
  const canvas = document.createElement('canvas')
  canvas.width = FRAME_SIZE
  canvas.height = FRAME_SIZE
  const ctx = canvas.getContext('2d')
  for (let i = 0; i < FRAME_COUNT; i++) {
    drawVortexFrame(ctx, i)
    frames.push(canvas.toDataURL('image/png'))
  }
  return frames
}

/**
 * 通用工厂：按 fx 类型生成对应序列帧
 * @param {string} fxType  fx 类型（flames/vortex/...）
 * @returns {string[]|null}  dataURL 数组，未知类型返回 null（调用方回退 CSS）
 */
export function generateFxFramesByType(fxType) {
  switch (fxType) {
    case 'flames': return generateFlameFrames()
    case 'vortex': return generateVortexFrames()
    default: return null
  }
}

export { FRAME_COUNT, FRAME_SIZE }
