// 自动生成共享立绘清单：扫描 public/portraits/ 下的图片，按文件名匹配角色，
// 生成 public/portraits/manifest.json（角色ID -> 文件名）。
//
// 工作流（无需另行共享）：把立绘图片直接丢进 public/portraits/，文件名用
// 角色名或角色ID（如 墨风.png / char_001.png），提交推送即可。构建前（prebuild）
// 会自动运行本脚本重建清单，CI 构建后所有玩家同源可见。
//
// 匹配规则（去扩展名、小写、trim 后）：精确等于ID > 精确等于角色名 > 包含ID或角色名；
// 都不中时以文件名本身作为键（便于自定义ID）。
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const portraitsDir = join(root, 'public', 'portraits')
const charFile = join(root, 'src', 'plugins', 'characters.js')

// 从 characters.js 的 characterList 里抽取 { id, name } 索引（无需引入 Vue）
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

const manifest = {}
const files = readdirSync(portraitsDir)
for (const file of files) {
  const ext = extname(file).toLowerCase()
  if (!IMG_EXT.has(ext)) continue
  const stem = basename(file, ext)
  const key = stem.trim().toLowerCase()
  let hit = idName.find(c => c.id.toLowerCase() === key)
  if (!hit) hit = idName.find(c => c.name.toLowerCase() === key)
  if (!hit) hit = idName.find(c => key.includes(c.id.toLowerCase()) || key.includes(c.name.toLowerCase()))
  const id = hit ? hit.id : stem
  manifest[id] = file
}

const manifestPath = join(portraitsDir, 'manifest.json')
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
console.log(`[portraits] 已生成 manifest.json：${Object.keys(manifest).length} 张立绘`)
for (const [id, file] of Object.entries(manifest)) console.log(`  ${id} <- ${file}`)
