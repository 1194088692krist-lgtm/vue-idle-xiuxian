/**
 * 生成各属性系技能特效序列帧（程序化离屏 Canvas 渲染）
 *
 * 设计：
 * - 每系 16 帧 × 128×128 透明 PNG
 * - 白底素材（便于 PIXI tint 染色为不同属性色）
 * - 启动时按需懒生成，base64 dataURL 存内存，无网络请求
 * - 总数据量 < 30KB/系（小尺寸 + 简单形状）
 *
 * 13 系对应 fx 类型：
 *   flames(火) vortex(暗/鬼) lightning(雷) crystal(冰) cloud(毒)
 *   vines(木) slash(剑) spikes(土) tornado(风) waves(水)
 *   star(光) impact(战) hexagram(阵法)
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
 * 通用帧生成工厂：复用一个 canvas，按 drawFn 逐帧渲染并输出 dataURL 数组
 * @param {(ctx: CanvasRenderingContext2D, frameIdx: number) => void} drawFn
 * @returns {string[]}
 */
function makeFrames(drawFn) {
  const frames = []
  const canvas = document.createElement('canvas')
  canvas.width = FRAME_SIZE
  canvas.height = FRAME_SIZE
  const ctx = canvas.getContext('2d')
  for (let i = 0; i < FRAME_COUNT; i++) {
    drawFn(ctx, i)
    frames.push(canvas.toDataURL('image/png'))
  }
  return frames
}

/* ============ 火系 flames ============ */
function drawFlameFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const cx = size / 2
  const cy = size * 0.72
  const t = frameIdx / FRAME_COUNT

  ctx.clearRect(0, 0, size, size)

  const heightFactor = Math.sin(t * Math.PI)
  const flameH = 20 + heightFactor * 80
  const flameW = 24 + heightFactor * 36

  const grad = ctx.createRadialGradient(cx, cy - flameH * 0.3, 0, cx, cy - flameH * 0.3, Math.max(2, flameH))
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  grad.addColorStop(0.3, 'rgba(255, 240, 200, 0.85)')
  grad.addColorStop(0.6, 'rgba(255, 200, 100, 0.6)')
  grad.addColorStop(1, 'rgba(255, 100, 0, 0)')

  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(cx - flameW / 2, cy)
  ctx.bezierCurveTo(cx - flameW / 2, cy - flameH * 0.5, cx - flameW * 0.3, cy - flameH, cx, cy - flameH)
  ctx.bezierCurveTo(cx + flameW * 0.3, cy - flameH, cx + flameW / 2, cy - flameH * 0.5, cx + flameW / 2, cy)
  ctx.closePath()
  ctx.fill()

  const rand = mulberry32(frameIdx * 1000 + 42)
  ctx.fillStyle = 'rgba(255, 255, 200, 0.9)'
  for (let i = 0; i < 8; i++) {
    const px = cx + (rand() - 0.5) * flameW * 1.5
    const py = cy - flameH * (0.5 + rand() * 0.5) - t * 20
    const pr = 1 + rand() * 2
    if (py > 0 && py < size) {
      ctx.beginPath()
      ctx.arc(px, py, pr, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
export function generateFlameFrames() { return makeFrames(drawFlameFrame) }

/* ============ 暗系 vortex（鬼宗） ============ */
function drawVortexFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const cx = size / 2
  const cy = size / 2
  const t = frameIdx / FRAME_COUNT

  ctx.clearRect(0, 0, size, size)

  const progress = Math.sin(t * Math.PI)

  // 中心暗核
  const coreR = Math.max(2, 6 + progress * 18)
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR)
  coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  coreGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.55)')
  coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = coreGrad
  ctx.beginPath()
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2)
  ctx.fill()

  // 3 圈虚线环
  const baseAngle = t * Math.PI * 4
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

  // 螺旋吸入粒子
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
export function generateVortexFrames() { return makeFrames(drawVortexFrame) }

/* ============ 雷系 lightning ============ */
function drawLightningFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const cx = size / 2
  const t = frameIdx / FRAME_COUNT
  ctx.clearRect(0, 0, size, size)

  // 闪电闪动节奏：闪现/消散交替
  const flash = Math.abs(Math.sin(t * Math.PI * 4))
  const alpha = 0.35 + flash * 0.6

  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
  ctx.lineWidth = 2.5
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
  ctx.shadowBlur = 6

  // 主闪电 Z 字折线
  ctx.beginPath()
  ctx.moveTo(cx, 10)
  ctx.lineTo(cx - 20, 35)
  ctx.lineTo(cx + 15, 55)
  ctx.lineTo(cx - 10, 80)
  ctx.lineTo(cx, 118)
  ctx.stroke()
  // 分叉 2
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.moveTo(cx - 25, 15)
  ctx.lineTo(cx - 40, 40)
  ctx.lineTo(cx - 30, 70)
  ctx.lineTo(cx - 35, 100)
  ctx.stroke()
  // 分叉 3
  ctx.beginPath()
  ctx.moveTo(cx + 25, 15)
  ctx.lineTo(cx + 40, 40)
  ctx.lineTo(cx + 30, 70)
  ctx.lineTo(cx + 35, 100)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0

  // 节点发光圆
  const nodes = [[cx, 10], [cx - 20, 35], [cx + 15, 55], [cx - 10, 80], [cx, 118]]
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
  for (const [nx, ny] of nodes) {
    ctx.beginPath()
    ctx.arc(nx, ny, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }
}
export function generateLightningFrames() { return makeFrames(drawLightningFrame) }

/* ============ 冰系 crystal ============ */
function drawCrystalFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const cx = size / 2
  const cy = size / 2
  const t = frameIdx / FRAME_COUNT
  ctx.clearRect(0, 0, size, size)

  const progress = Math.sin(t * Math.PI)
  const scale = Math.max(0.1, 0.3 + progress * 0.9)
  const rot = t * Math.PI * 2

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot)
  ctx.scale(scale, scale)

  // 中心六角形
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2
    const px = Math.cos(a) * 30
    const py = Math.sin(a) * 30
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()

  // 6 条冰晶臂
  ctx.lineWidth = 1.8
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(a) * 50, Math.sin(a) * 50)
    ctx.stroke()
  }
  ctx.restore()

  // 中心光点
  const cr = Math.max(2, 10 * progress)
  const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr)
  cg.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
  cg.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = cg
  ctx.beginPath()
  ctx.arc(cx, cy, cr, 0, Math.PI * 2)
  ctx.fill()
}
export function generateCrystalFrames() { return makeFrames(drawCrystalFrame) }

/* ============ 毒系 cloud ============ */
function drawCloudFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const t = frameIdx / FRAME_COUNT
  ctx.clearRect(0, 0, size, size)

  // 6 个气泡错相位上升膨胀
  const rand = mulberry32(42)
  for (let i = 0; i < 6; i++) {
    const phase = i / 6
    const localT = (t + phase) % 1
    const localProg = Math.sin(localT * Math.PI)
    const bx = 20 + i * 15 + (rand() - 0.5) * 8
    const by = 110 - localProg * 70
    const br = Math.max(2, 8 + localProg * 14)
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    g.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
    g.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)')
    g.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fill()
  }
}
export function generateCloudFrames() { return makeFrames(drawCloudFrame) }

/* ============ 木系 vines ============ */
function drawVinesFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const t = frameIdx / FRAME_COUNT
  ctx.clearRect(0, 0, size, size)

  const progress = Math.min(1, t * 1.2)
  // 5 条藤蔓向上生长
  for (let i = 0; i < 5; i++) {
    const vx = 15 + i * 25
    const fullH = 100
    const curH = fullH * progress
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(vx, 120)
    ctx.lineTo(vx, 120 - curH)
    ctx.stroke()
    // 末端叶子（生长后期绽放）
    if (progress > 0.7) {
      const leafProg = (progress - 0.7) / 0.3
      ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * leafProg})`
      ctx.beginPath()
      ctx.ellipse(vx - 5, 120 - curH, 5, 3, -0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(vx + 5, 120 - curH, 5, 3, 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
export function generateVinesFrames() { return makeFrames(drawVinesFrame) }

/* ============ 剑系 slash ============ */
function drawSlashFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const cx = size / 2
  const cy = size / 2
  const t = frameIdx / FRAME_COUNT
  ctx.clearRect(0, 0, size, size)

  // 3 道剑光，不同角度和相位
  const angles = [-Math.PI / 4, Math.PI / 4, Math.PI / 2]
  for (let i = 0; i < 3; i++) {
    const phase = i * 0.2
    const localT = (t + phase) % 1
    const prog = Math.sin(localT * Math.PI)
    const len = 100 * prog
    if (len < 1) continue
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angles[i])
    const g = ctx.createLinearGradient(-len / 2, 0, len / 2, 0)
    g.addColorStop(0, 'rgba(255, 255, 255, 0)')
    g.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)')
    g.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.strokeStyle = g
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(-len / 2, 0)
    ctx.lineTo(len / 2, 0)
    ctx.stroke()
    ctx.restore()
  }
}
export function generateSlashFrames() { return makeFrames(drawSlashFrame) }

/* ============ 土系 spikes ============ */
function drawSpikesFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const t = frameIdx / FRAME_COUNT
  ctx.clearRect(0, 0, size, size)

  // 7 个尖刺，错相位升起
  for (let i = 0; i < 7; i++) {
    const phase = i * 0.08
    const localT = Math.max(0, Math.min(1, (t - phase) * 1.3))
    const sx = 10 + i * 17
    const fullH = 70
    const curH = fullH * localT
    if (curH < 1) continue
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.beginPath()
    ctx.moveTo(sx - 8, 120)
    ctx.lineTo(sx + 8, 120)
    ctx.lineTo(sx, 120 - curH)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}
export function generateSpikesFrames() { return makeFrames(drawSpikesFrame) }

/* ============ 风系 tornado ============ */
function drawTornadoFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const cx = size / 2
  const t = frameIdx / FRAME_COUNT
  ctx.clearRect(0, 0, size, size)

  const progress = Math.sin(t * Math.PI)
  const rot = t * Math.PI * 6
  // 4 层椭圆环，从下到上递减
  for (let i = 0; i < 4; i++) {
    const yBase = 100 - i * 22
    const w = Math.max(2, 50 - i * 8 + progress * 6)
    const h = Math.max(2, 12 - i * 2)
    ctx.save()
    ctx.translate(cx, yBase)
    ctx.rotate(rot + i * 0.3)
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 - i * 0.12})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}
export function generateTornadoFrames() { return makeFrames(drawTornadoFrame) }

/* ============ 水系 waves ============ */
function drawWavesFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const cx = size / 2
  const cy = size / 2
  const t = frameIdx / FRAME_COUNT
  ctx.clearRect(0, 0, size, size)

  // 3 条波纹错相位扩散
  for (let i = 0; i < 3; i++) {
    const phase = i * 0.25
    const localT = (t + phase) % 1
    const prog = Math.sin(localT * Math.PI)
    const r = Math.max(2, 20 + prog * 50)
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 - i * 0.2})`
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }
}
export function generateWavesFrames() { return makeFrames(drawWavesFrame) }

/* ============ 光系 star ============ */
function drawStarFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const cx = size / 2
  const cy = size / 2
  const t = frameIdx / FRAME_COUNT
  ctx.clearRect(0, 0, size, size)

  const progress = Math.sin(t * Math.PI)
  // 8 道光线放射
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2
    const len = 50 * progress
    if (len < 1) continue
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(ang)
    const g = ctx.createLinearGradient(0, 0, len, 0)
    g.addColorStop(0, 'rgba(255, 255, 255, 0)')
    g.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)')
    g.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.strokeStyle = g
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(len, 0)
    ctx.stroke()
    ctx.restore()
  }
  // 中心光球
  const cr = Math.max(2, 10 + progress * 12)
  const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr)
  cg.addColorStop(0, 'rgba(255, 255, 255, 1)')
  cg.addColorStop(0.6, 'rgba(255, 255, 255, 0.5)')
  cg.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = cg
  ctx.beginPath()
  ctx.arc(cx, cy, cr, 0, Math.PI * 2)
  ctx.fill()
}
export function generateStarFrames() { return makeFrames(drawStarFrame) }

/* ============ 战系 impact ============ */
function drawImpactFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const cx = size / 2
  const cy = size / 2
  const t = frameIdx / FRAME_COUNT
  ctx.clearRect(0, 0, size, size)

  // 3 圈菱形冲击波，旋转 45°，错相位扩张
  for (let i = 0; i < 3; i++) {
    const phase = i * 0.15
    const localT = (t - phase + 1) % 1
    const prog = Math.sin(localT * Math.PI)
    const r = Math.max(2, 20 + prog * 40)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(Math.PI / 4)
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 - i * 0.2})`
    ctx.lineWidth = 2.5
    ctx.strokeRect(-r, -r, r * 2, r * 2)
    ctx.restore()
  }
  // 中心爆点
  const progress = Math.sin(t * Math.PI)
  const cr = Math.max(2, 8 + progress * 10)
  ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * progress})`
  ctx.beginPath()
  ctx.arc(cx, cy, cr, 0, Math.PI * 2)
  ctx.fill()
}
export function generateImpactFrames() { return makeFrames(drawImpactFrame) }

/* ============ 阵法系 hexagram ============ */
function drawHexagramFrame(ctx, frameIdx) {
  const size = FRAME_SIZE
  const cx = size / 2
  const cy = size / 2
  const t = frameIdx / FRAME_COUNT
  ctx.clearRect(0, 0, size, size)

  const progress = Math.sin(t * Math.PI)
  const rot = t * Math.PI * 2
  const r = 45

  // 外圆
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * progress + 0.3})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  // 六芒星：两个三角形叠加
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 2
  // 向上三角
  ctx.beginPath()
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2
    const px = Math.cos(a) * r
    const py = Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
  // 向下三角
  ctx.beginPath()
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2
    const px = Math.cos(a) * r
    const py = Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.restore()
}
export function generateHexagramFrames() { return makeFrames(drawHexagramFrame) }

/**
 * 通用工厂：按 fx 类型生成对应序列帧
 * @param {string} fxType  fx 类型
 * @returns {string[]|null}  dataURL 数组，未知类型返回 null（调用方回退 CSS）
 */
export function generateFxFramesByType(fxType) {
  switch (fxType) {
    case 'flames': return generateFlameFrames()
    case 'vortex': return generateVortexFrames()
    case 'lightning': return generateLightningFrames()
    case 'crystal': return generateCrystalFrames()
    case 'cloud': return generateCloudFrames()
    case 'vines': return generateVinesFrames()
    case 'slash': return generateSlashFrames()
    case 'spikes': return generateSpikesFrames()
    case 'tornado': return generateTornadoFrames()
    case 'waves': return generateWavesFrames()
    case 'star': return generateStarFrames()
    case 'impact': return generateImpactFrames()
    case 'hexagram': return generateHexagramFrames()
    default: return null
  }
}

export { FRAME_COUNT, FRAME_SIZE }
