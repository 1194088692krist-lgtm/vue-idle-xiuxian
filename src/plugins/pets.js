// 灵宠立绘资源管理（对称于 characters.js 的角色立绘系统）
//
// 灵宠立绘资源布局（与人物立绘同构）：
//   public/pets/
//   ├── pet_kind_01.jpg                  # 原立绘（每种灵宠一张）
//   ├── pet_kind_01_skin1.jpg            # 皮肤 1
//   ├── pet_kind_01_skin2.jpg            # 皮肤 2
//   ├── thumbnails/
//   │   └── pet_kind_01_thumb.webp       # 缩略图（列表场景用，体积更小）
//   ├── manifest.json                    # 立绘清单（含 full/thumbnail）
//   └── skins.json                       # 皮肤数量清单（不含原立绘）
//
// 灵宠种类（templateId）来源：generatePet 按 nameBase 在 petNameParts 中的索引分配
// petNameParts 共 18 种（火灵/水灵/.../灵龟），templateId 形如 'pet_kind_01'..'pet_kind_18'
//
// 皮肤解锁规则：每升 5 星（即每进一阶）解锁 1 个皮肤
//   star < 5      → 仅原立绘
//   5 <= star < 10 → 原立绘 + skin1
//   10 <= star < 15 → 原立绘 + skin1 + skin2
//   以此类推，最多受 skins.json 中该种类实际拥有的皮肤数限制

import { reactive } from 'vue'
import { petNameParts } from './gacha'

// 立绘清单：templateId -> { full, thumbnail }
export const petPortraitMap = reactive({})

// 皮肤清单：templateId -> 皮肤数量（不含原立绘）
export const petSkinMap = reactive({})

let petSkinsLoaded = false
let petPortraitsLoaded = false

/**
 * 由灵宠对象计算 templateId。
 * - 优先用 pet.templateId（generatePet 时分配）
 * - 兼容旧存档：若灵宠没有 templateId，按 name 反查 petNameParts 推断
 *   name 形如「火灵·凡品」，取「·」前的部分作为 nameBase
 * - 都查不到时回退到 'pet_kind_00'，调用方应处理立绘 404
 */
export function getPetTemplateId(pet) {
  if (!pet) return null
  if (pet.templateId) return pet.templateId
  if (pet.name) {
    const nameBase = String(pet.name).split('·')[0]
    const idx = petNameParts.indexOf(nameBase)
    if (idx >= 0) return `pet_kind_${String(idx + 1).padStart(2, '0')}`
  }
  return 'pet_kind_00'
}

/**
 * 后台异步加载 skins.json（不阻塞游戏加载），填充 petSkinMap
 * skins.json 形如 { "pet_kind_01": 2, "pet_kind_02": 3, ... }
 */
export async function loadPetSkinsManifest() {
  if (petSkinsLoaded) return
  petSkinsLoaded = true
  const base = import.meta.env.BASE_URL || './'
  fetch(`${base}pets/skins.json`, { cache: 'force-cache' })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
    .then(map => {
      if (map && typeof map === 'object') {
        Object.entries(map).forEach(([id, count]) => { petSkinMap[id] = count })
      }
    })
    .catch(e => console.warn('[petSkins] 加载 pets/skins.json 失败，灵宠皮肤切换不可用:', e.message))
}

/**
 * 后台加载 pets/manifest.json，填充 petPortraitMap（含 full/thumbnail）。
 * 与角色立绘一致：先用静态回退立即填，再异步加载 manifest 补全。
 */
export async function loadSharedPetPortraits() {
  if (petPortraitsLoaded) return
  const base = import.meta.env.BASE_URL || './'
  // 按 petNameParts 预填静态回退，让立绘立即可见（图片尚未提供时会 404，但不会阻塞 UI）
  petNameParts.forEach((_, idx) => {
    const id = `pet_kind_${String(idx + 1).padStart(2, '0')}`
    if (!petPortraitMap[id]) {
      petPortraitMap[id] = {
        full: `${base}pets/${id}.jpg`,
        thumbnail: `${base}pets/thumbnails/${id}_thumb.webp`
      }
    }
  })
  petPortraitsLoaded = true

  fetch(`${base}pets/manifest.json`, { cache: 'force-cache' })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
    .then(manifest => {
      if (!manifest || typeof manifest !== 'object') return
      Object.entries(manifest).forEach(([id, data]) => {
        if (typeof data === 'object' && data.full) {
          petPortraitMap[id] = {
            full: `${base}pets/${data.full}`,
            thumbnail: data.thumbnail ? `${base}pets/${data.thumbnail}` : null
          }
        } else if (typeof data === 'string') {
          petPortraitMap[id] = { full: `${base}pets/${data}`, thumbnail: null }
        }
      })
      console.log('[petPortraits] pets/manifest.json 后台加载完成，灵宠立绘资源已更新')
    })
    .catch(e => {
      console.warn('[petPortraits] 后台加载 pets/manifest.json 失败，使用静态回退:', e.message)
    })
}

/**
 * 获取灵宠立绘 URL（全尺寸）。
 * size: 'full' (默认) 或 'thumbnail'
 */
export function getPetAvatar(pet, size = 'full') {
  if (!pet) return null
  const id = getPetTemplateId(pet)
  if (!id) return null
  const portrait = petPortraitMap[id]
  if (portrait) {
    if (typeof portrait === 'object') {
      return size === 'thumbnail' && portrait.thumbnail ? portrait.thumbnail : portrait.full
    }
    return portrait
  }
  // 静态回退：petPortraitMap 尚未加载完成时，按命名规则构造默认 URL
  const base = import.meta.env.BASE_URL || './'
  return size === 'thumbnail'
    ? `${base}pets/thumbnails/${id}_thumb.webp`
    : `${base}pets/${id}.jpg`
}

export function getPetThumbnail(pet) {
  return getPetAvatar(pet, 'thumbnail')
}

/**
 * 获取灵宠拥有的皮肤数量（不含原立绘）。0 表示无额外皮肤。
 */
export function getPetSkinCount(pet) {
  if (!pet) return 0
  const id = getPetTemplateId(pet)
  return petSkinMap[id] || 0
}

/**
 * 获取指定皮肤（skin>=1）的立绘 URL。
 * skin 超过该灵宠拥有的皮肤数时返回 null（调用方回退原立绘）。
 * 返回形如 `${base}pets/pet_kind_XX_skinN.jpg`
 */
export function getPetSkinUrl(pet, skin) {
  if (!pet || !skin || skin < 1) return null
  const id = getPetTemplateId(pet)
  if (!id) return null
  const count = petSkinMap[id] || 0
  if (skin > count) return null
  const base = import.meta.env.BASE_URL || './'
  return `${base}pets/${id}_skin${skin}.jpg`
}

/**
 * 计算灵宠当前已解锁的皮肤数（按升星逐级解锁：每 5 星解锁 1 个皮肤）。
 * 实际可切换的最大皮肤索引 = min(已解锁数, 该种类实际拥有的皮肤数)
 */
export function getUnlockedSkinCount(pet) {
  if (!pet) return 0
  const star = pet.star || 0
  const unlocked = Math.floor(star / 5) // 每 5 星解锁 1 个皮肤
  const available = getPetSkinCount(pet)
  return Math.min(unlocked, available)
}
