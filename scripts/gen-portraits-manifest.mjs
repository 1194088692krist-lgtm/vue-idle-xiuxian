import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const portraitsDir = join(root, 'public', 'portraits')
const thumbnailsDir = join(portraitsDir, 'thumbnails')
const charFile = join(root, 'src', 'plugins', 'characters.js')

// 动态加载 sharp，未安装时优雅降级（跳过缩略图生成）
let sharp = null
try {
  sharp = (await import('sharp')).default
} catch {
  console.warn('[portraits] sharp 未安装，跳过缩略图生成')
}

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
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.ogg'])

if (!existsSync(portraitsDir)) mkdirSync(portraitsDir, { recursive: true })
if (!existsSync(thumbnailsDir)) mkdirSync(thumbnailsDir, { recursive: true })

async function processFile(file) {
  const ext = extname(file).toLowerCase()
  const filePath = join(portraitsDir, file)
  if (filePath.startsWith(thumbnailsDir)) return null
  // 动态立绘视频：合并到同名角色的 manifest 条目（video 字段）
  if (VIDEO_EXT.has(ext)) {
    const stem = basename(file, ext)
    const key = stem.trim().toLowerCase()
    let hit = idName.find(c => c.id.toLowerCase() === key)
    if (!hit) hit = idName.find(c => c.name.toLowerCase() === key)
    if (!hit) hit = idName.find(c => key.includes(c.id.toLowerCase()) || key.includes(c.name.toLowerCase()))
    const id = hit ? hit.id : stem
    return { id, videoFile: file }
  }
  if (!IMG_EXT.has(ext)) return null
  
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
    if (!sharp) {
      // sharp 不可用时，manifest 仍记录图片但无缩略图
      return { id, file, thumbnailFile: null, generated: false }
    }
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
    if (!result) continue
    if (result.generated) thumbnailsGenerated++
    // 视频：合并到对应角色的条目（保留已存在的 full/thumbnail）
    if (result.videoFile) {
      if (!manifest[result.id]) manifest[result.id] = {}
      manifest[result.id].video = result.videoFile
    } else {
      const entry = {
        full: result.file,
        thumbnail: result.thumbnailFile ? `thumbnails/${result.thumbnailFile}` : null
      }
      // 若视频已于本次扫描中先注册，则保留 video 字段
      if (manifest[result.id] && manifest[result.id].video) {
        entry.video = manifest[result.id].video
      }
      manifest[result.id] = entry
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
