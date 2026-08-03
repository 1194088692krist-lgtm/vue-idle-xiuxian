// 扫描 public/assets/ 目录，生成 assets/manifest.json
// 供 useAssetManager 一键离线下载时收集 icons/zones/bg 等静态素材
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const assetsDir = join(root, 'public', 'assets')

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'])

function walk(dir, base = '') {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const rel = base ? `${base}/${name}` : name
    if (statSync(full).isDirectory()) {
      out.push(...walk(full, rel))
    } else {
      out.push(rel)
    }
  }
  return out
}

const files = walk(assetsDir).filter(f => IMG_EXT.has('.' + f.split('.').pop().toLowerCase()))
const manifest = { _version: `v_assets_${Date.now()}`, files }
const outPath = join(assetsDir, 'manifest.json')
writeFileSync(outPath, JSON.stringify(manifest, null, 2))
console.log(`[assets] 已生成 manifest.json：${files.length} 个素材文件`)
