// 词缀 roll 品质（T1~T6）展示辅助：标签、配色类名、最佳档计算
// 供装备卡片 / 详情面板 / 掉落与战斗奖励详情复用，保证"极品"视觉口径统一。
// T1 最好（极品）→ T6 最差；配色遵循游戏既有稀有度色系（金=顶、紫=高、蓝=中、绿=低、灰=差）。

// 返回 'T1'..'T6' 标签（无档位时返回空串，避免旧装/异常数据显示 undefined）
export function qualityTierLabel(t) {
  return t ? `T${t}` : ''
}

// 返回语义化 CSS 类名 qtier-1..qtier-6，供各组件 CSS 着色
export function qualityTierClass(t) {
  return t ? `qtier-${t}` : ''
}

// 计算一组词缀的最佳品质档（用于装备卡片"极品度"一览徽章）
// 返回最小的 qualityTier（数值越小越好）；无词缀或无档位返回 null
export function bestAffixTier(affixes) {
  if (!Array.isArray(affixes) || affixes.length === 0) return null
  const tiers = affixes.map(a => a && a.qualityTier).filter(t => typeof t === 'number' && t >= 1)
  if (tiers.length === 0) return null
  return Math.min(...tiers)
}

// 最佳档文案（卡片徽章用）：'极品'/'上佳'/'一般'，配合颜色更有辨识度
export function bestAffixTierTag(t) {
  if (t === 1) return '极品'
  if (t === 2) return '上佳'
  return null // T3 及以下不打扰，保持卡片干净
}
