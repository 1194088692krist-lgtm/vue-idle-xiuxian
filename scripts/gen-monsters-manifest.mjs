import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const monstersDir = join(root, 'public', 'monsters')
const manifestPath = join(monstersDir, 'manifest.json')

// 动态加载 sharp，未安装时优雅降级（跳过缩略图生成）
let sharp = null
try {
  sharp = (await import('sharp')).default
} catch {
  console.warn('[monsters] sharp 未安装，跳过缩略图生成')
}

const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])

// 从现有 manifest 读取怪物名 -> 文件名映射，保留中文 key
let existingManifest = {}
try {
  existingManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
} catch {
  console.warn('[monders] 现有 manifest.json 不存在或解析失败，将重建')
}

// 把 *_portrait.jpg 转为对应的 *_thumb.webp 缩略图（128x128, quality 70）
// 角色缩略图同为 sharp 128x128 webp q70，保持一致
async function processPortrait(file) {
  const ext = extname(file).toLowerCase()
  if (!IMG_EXT.has(ext)) return null
  if (file.includes('_thumb')) return null // 跳过已有缩略图

  const stem = basename(file, ext)
  // 仅处理 portrait 文件（full 立绘），thumbnail 由本脚本生成
  if (!file.includes('_portrait')) return null

  const portraitPath = join(monstersDir, file)
  const thumbFile = `${stem}_thumb.webp`
  const thumbPath = join(monstersDir, thumbFile)

  if (!existsSync(thumbPath)) {
    if (!sharp) {
      return { full: file, thumbFile: null, generated: false }
    }
    try {
      await sharp(portraitPath)
        .resize(128, 128, { fit: 'cover' })
        .webp({ quality: 70 })
        .toFile(thumbPath)
      return { full: file, thumbFile, generated: true }
    } catch (e) {
      console.warn(`[monsters] 生成缩略图失败 ${file}:`, e.message)
      return { full: file, thumbFile: null, generated: false }
    }
  }
  return { full: file, thumbFile, generated: false }
}

async function main() {
  const files = readdirSync(monstersDir)
  const manifest = {}
  let generated = 0

  // 先收集所有 portrait -> thumb 映射
  const portraitMap = {} // portraitStem -> { full, thumbFile }
  for (const file of files) {
    const result = await processPortrait(file)
    if (!result) continue
    if (result.generated) generated++
    const stem = basename(result.full, extname(result.full))
    portraitMap[stem] = result
  }

  // 根据现有 manifest 的中文 key 重建，thumbnail 指向 webp
  for (const [monsterName, entry] of Object.entries(existingManifest)) {
    if (!entry || !entry.full) continue
    const stem = basename(entry.full, extname(entry.full))
    const pm = portraitMap[stem]
    const fullFile = pm ? pm.full : entry.full
    const thumbFile = pm && pm.thumbFile ? pm.thumbFile : null
    manifest[monsterName] = {
      thumbnail: thumbFile || entry.thumbnail,
      full: fullFile
    }
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`[monsters] 已生成 manifest.json：${Object.keys(manifest).length} 个怪物，生成 ${generated} 张 webp 缩略图`)
}

main().catch(e => {
  console.error('[monsters] 脚本执行失败:', e)
  process.exit(1)
})
