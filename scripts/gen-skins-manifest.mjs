// 基于 public/portraits 目录下实际存在的 _skinN.jpg 文件，重新生成 skins.json 清单
// 命名规则：{charId}_skin{N}.jpg，统计每个角色的最大皮肤数量
// 用法：node scripts/gen-skins-manifest.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const portraitsDir = join(rootDir, 'public', 'portraits')
const skinsJsonPath = join(portraitsDir, 'skins.json')

const skinFilePattern = /^(char_\d+)_skin(\d+)\.(jpg|jpeg|png|webp)$/i

// 已知立绘内容错误的皮肤（图片存在但内容性别错配等）——虽文件存在也不计入清单。
// 与 src/plugins/shopConfig.js 的 SKIN_SHOP_CONFIG.excludedSkins 保持一致（单一事实来源镜像）。
//   - char_039 杀生佛、char_017 裂魂：skin6/7 图片为女性立绘，与角色（男）不符
const EXCLUDED_SKINS = {
  char_039: [6, 7], // 杀生佛
  char_017: [6, 7]  // 裂魂
}
const isExcluded = (charId, skinNum) => {
  const list = EXCLUDED_SKINS[charId]
  return Array.isArray(list) && list.includes(skinNum)
}

// 读取旧版本号（若存在），递增以便前端缓存失效
let version = 'v_scan_1'
try {
  const old = JSON.parse(readFileSync(skinsJsonPath, 'utf-8'))
  if (old._version) {
    const m = old._version.match(/v_scan_(\d+)/)
    version = `v_scan_${(m ? Number(m[1]) : 0) + 1}`
  }
} catch { /* 旧文件不存在或解析失败，用默认版本号 */ }

const files = readdirSync(portraitsDir)
const skinMap = {}

for (const file of files) {
  const m = file.match(skinFilePattern)
  if (!m) continue
  const charId = m[1]
  const skinNum = Number(m[2])
  // 跳过已知内容错误的皮肤：文件虽在磁盘上，但立绘内容错误（性别错配），
  // 不应被识别为有效皮肤，否则商店会摆出错误商品、立绘预览会显示错图
  if (isExcluded(charId, skinNum)) continue
  const cur = skinMap[charId] || 0
  if (skinNum > cur) skinMap[charId] = skinNum
}

// 按 charId 排序输出，便于 diff 审查
const sorted = {}
const keys = Object.keys(skinMap).sort()
for (const k of keys) sorted[k] = skinMap[k]
sorted._version = version

writeFileSync(skinsJsonPath, JSON.stringify(sorted, null, 2) + '\n')
console.log(`[skins] 已生成 skins.json：${keys.length} 个角色，版本号 ${version}`)
for (const k of keys) console.log(`  ${k}: ${sorted[k]}`)
