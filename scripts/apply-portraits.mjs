// 将 GMTools「导出共享立绘包」产生的 portraits-bundle.json 落盘为部署用资源。
// 用法：node scripts/apply-portraits.mjs portraits-bundle.json
// 产出：public/portraits/<id>.<ext> 与 public/portraits/manifest.json（id -> 文件名）
// 之后提交并部署站点，所有玩家即可同源加载这些立绘。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const portraitsDir = join(root, 'public', 'portraits')

const bundlePath = process.argv[2]
if (!bundlePath) {
  console.error('用法: node scripts/apply-portraits.mjs <portraits-bundle.json>')
  process.exit(1)
}

const bundle = JSON.parse(readFileSync(bundlePath, 'utf-8'))
const images = bundle.images || {}
if (!Object.keys(images).length) {
  console.error('bundle 中没有立绘数据 (images 为空)')
  process.exit(1)
}

if (!existsSync(portraitsDir)) mkdirSync(portraitsDir, { recursive: true })

const extOf = (mime) => {
  switch (mime) {
    case 'image/png': return 'png'
    case 'image/jpeg': return 'jpg'
    case 'image/webp': return 'webp'
    case 'image/gif': return 'gif'
    case 'image/svg+xml': return 'svg'
    default: return 'png'
  }
}

const manifestPath = join(portraitsDir, 'manifest.json')
let manifest = {}
if (existsSync(manifestPath)) {
  try { manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) } catch (e) { manifest = {} }
}

let count = 0
for (const [id, dataUri] of Object.entries(images)) {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(dataUri)
  if (!m) {
    console.warn(`跳过 ${id}: 非法的 data URI`)
    continue
  }
  const ext = extOf(m[1])
  const buf = Buffer.from(m[2], 'base64')
  const file = `${id}.${ext}`
  writeFileSync(join(portraitsDir, file), buf)
  manifest[id] = file
  count++
  console.log(`写入 ${file}`)
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
console.log(`\n完成：已写入 ${count} 张立绘，manifest.json 已更新。`)
console.log('下一步：git add public/portraits && git commit && git push，然后部署站点即可对所有玩家生效。')
