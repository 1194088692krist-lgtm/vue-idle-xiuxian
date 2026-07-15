import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const portraitsDir = join(root, 'public', 'portraits')
const thumbnailsDir = join(portraitsDir, 'thumbnails')
const charFile = join(root, 'src', 'plugins', 'characters.js')

const idName = []
try {
  const src = readFileSync(charFile, 'utf-8')
  const re = /\{\s*id:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'/g
  let m
  while ((m = re.exec(src))) idName.push({ id: m[1], name: m[2] })
} catch (e) {
  console.warn('[portraits] 无法读取 characters.js，跳过角色名匹配：', e.message)
}

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'])

if (!existsSync(portraitsDir)) mkdirSync(portraitsDir, { recursive: true })
if (!existsSync(thumbnailsDir)) mkdirSync(thumbnailsDir, { recursive: true })

async function processFile(file) {
  const ext = extname(file).toLowerCase()
  if (!IMG_EXT.has(ext)) return null
  
  const filePath = join(portraitsDir, file)
  const stem = basename(file, ext)
  
  if (filePath.startsWith(thumbnailsDir)) return null
  
  const key = stem.trim().toLowerCase()
  let hit = idName.find(c => c.id.toLowerCase() === key)
  if (!hit) hit = idName.find(c => c.name.toLowerCase() === key)
  if (!hit) hit = idName.find(c => key.includes(c.id.toLowerCase()) || key.includes(c.name.toLowerCase()))
  const id = hit ? hit.id : stem
  
  const thumbnailFile = `${stem}_thumb.webp`
  const thumbnailPath = join(thumbnailsDir, thumbnailFile)
  
  if (!existsSync(thumbnailPath)) {
    try {
      await sharp(filePath)
        .resize(128, 128, { fit: 'cover' })
        .webp({ quality: 70 })
        .toFile(thumbnailPath)
      return { id, file, thumbnailFile, generated: true }
    } catch (e) {
      console.warn(`[portraits] 生成缩略图失败 ${file}:`, e.message)
    }
  }
  
  return { id, file, thumbnailFile, generated: false }
}

async function main() {
  const manifest = {}
  const files = readdirSync(portraitsDir)
  let thumbnailsGenerated = 0
  
  for (const file of files) {
    const result = await processFile(file)
    if (result) {
      if (result.generated) thumbnailsGenerated++
      manifest[result.id] = {
        full: result.file,
        thumbnail: `thumbnails/${result.thumbnailFile}`
      }
    }
  }
  
  const manifestPath = join(portraitsDir, 'manifest.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`[portraits] 已生成 manifest.json：${Object.keys(manifest).length} 张立绘，生成 ${thumbnailsGenerated} 张缩略图`)
}

main().catch(e => {
  console.error('[portraits] 脚本执行失败:', e)
  process.exit(1)
})
