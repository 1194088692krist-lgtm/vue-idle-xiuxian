// ===== 装备系统 M0 Playtest 模拟（paper simulation + 自动化 playtest）=====
// 用法：node scripts/playtest-equip.mjs
// 目的：在真机 playtest 前，用真实代码大规模模拟，验证经济曲线 / 品质追逐 / craft 手感 / 战力差距是否健康。
// 说明：仅依赖纯逻辑模块（buildSystem.js / craftCurrency.js），无需 Pinia/Vue，可脱离浏览器运行。
// ZONE_INDEX / DIFF_ILVL_BONUS / DIFF_DROP 镜像 useIdleSystem.js 与 zones.js（改动需同步）。
import { getAffixesForSlot, calculateEquipmentScore, affixPool } from '../src/plugins/buildSystem.js'
import {
  craftCurrencies, pickCraftCurrency, CRAFT_DROP_CHANCE_BY_ZONE,
  upgradeAffixTier, rerollAffixValues, rerollAllAffixes, toggleAffixLock, addAffix, annulAffix, lawStoneCost
} from '../src/plugins/craftCurrency.js'

// ---- 镜像 useIdleSystem/zones 的常量（改动需同步）----
const ZONE_INDEX = { forest_edge:1, misty_valley:2, phoenix_cave:3, dragon_abyss:4, ghost_wasteland:5, ice_palace:6, immortal_ruins:7, chaos_realm:8 }
const ZONE_NAMES = ['青萝林','迷雾谷','凤凰窟','龙渊','鬼荒原','冰雪宫','仙墟','混沌境']
const DIFF_ILVL_BONUS = { 1:0, 2:0, 3:1, 4:2, 5:3 }   // 难度序号 1~5
const DIFF_DROP = { 1:1.0, 2:1.15, 3:1.3, 4:1.5, 5:1.8 } // 难度 drop 倍率
const DIFF_NAMES = { 1:'游历', 2:'试炼', 3:'凶险', 4:'绝境', 5:'灭世' }

const ilvlOf = (zoneIdx, diff) => Math.min(11, zoneIdx + (DIFF_ILVL_BONUS[diff] || 0))
const fmt = n => (Math.round(n * 1000) / 1000)
const pct = n => (n * 100).toFixed(1) + '%'
const bar = (rate, scale = 1) => '█'.repeat(Math.max(0, Math.round(rate * 100 * scale)))

// ============ Sim A：工艺货币掉落经济 ============
function simCurrencyDrops() {
  console.log('\n========== Sim A：工艺货币掉落经济（每图 N=20000 roll）==========')
  console.log('成功标准：青萝林只掉洗练石；鬼荒原起出凝律石；高难货币(凝律/血祭)稀缺；掉率随图递增')
  const N = 20000
  for (let z = 1; z <= 8; z++) {
    // 用凶险(3)难度作为该图代表
    const diff = 3
    const chance = (CRAFT_DROP_CHANCE_BY_ZONE[z] || 0) * DIFF_DROP[diff]
    let drops = 0
    const byCur = {}
    for (let i = 0; i < N; i++) {
      if (Math.random() < chance) {
        drops++
        const cur = pickCraftCurrency(z, false)
        byCur[cur] = (byCur[cur] || 0) + 1
      }
    }
    const top = Object.entries(byCur).sort((a,b)=>b[1]-a[1]).slice(0,4)
      .map(([id,c]) => `${craftCurrencies[id].name}${pct(c/drops)}`).join(' ')
    console.log(`  ${ZONE_NAMES[z-1]}(${z}) 掉率${pct(chance)} 实得${drops}次/2万 roll ${bar(drops/N, 3)}`)
    console.log(`      分布: ${top}`)
  }
  // 单次挂机估算（假设每分钟 4 次 roll，凶险档）
  const rollsPerMin = 4
  console.log('\n  -- 货币获取速率估算（凶险档，4 roll/分钟）--')
  for (const z of [1, 3, 5, 8]) {
    const chance = (CRAFT_DROP_CHANCE_BY_ZONE[z] || 0) * DIFF_DROP[3]
    const perHour = chance * rollsPerMin * 60
    console.log(`  ${ZONE_NAMES[z-1]}(${z}): ≈${fmt(perHour)} 货币/小时`)
  }
}

// ============ Sim B：T1 品质追逐（按图）============
function simTierChase() {
  console.log('\n========== Sim B：T1 品质追逐（每图 5000 装备，统计词缀 T1 占比）==========')
  console.log('成功标准：仙墟(7)/混沌境(8)可出 T1；青萝林/迷雾谷不出 T1；T1 率合理(均匀档≈16.7%)')
  const N = 5000
  for (let z = 1; z <= 8; z++) {
    const diff = 3 // 凶险
    const ilvl = ilvlOf(z, diff)
    let t1 = 0, total = 0
    const tierCount = { 1:0,2:0,3:0,4:0,5:0,6:0 }
    for (let i = 0; i < N; i++) {
      const affixes = getAffixesForSlot('artifact', 'legendary', ilvl)
      affixes.forEach(a => { total++; tierCount[a.qualityTier]++; if (a.qualityTier === 1) t1++ })
    }
    const dist = [1,2,3,4,5,6].map(t => `T${t}:${pct(tierCount[t]/total)}`).join(' ')
    console.log(`  ${ZONE_NAMES[z-1]}(${z}) ilvl=${ilvl} T1占比=${pct(t1/total)} ${t1>0?'✓出T1':'✗不出T1'}`)
    console.log(`      ${dist}`)
  }
}

// ============ Sim C：Craft 解谜（定向打造到全 T1/T2 的货币消耗）============
function measureCraftCost(goalTier, runs = 400) {
  const costs = []
  for (let r = 0; r < runs; r++) {
    const eq = { slot:'artifact', rarity:'legendary', ilvl:7, affixes: getAffixesForSlot('artifact','legendary',7) }
    let cost = 0, guard = 0
    const isDone = () => eq.affixes.every(a => a.qualityTier <= goalTier)
    while (!isDone() && guard++ < 2000) {
      if (eq.affixes.length < 5) { addAffix(eq); cost++; continue }
      const target = eq.affixes.find(a => a.qualityTier > goalTier)
      if (target) { cost += lawStoneCost(target.qualityTier); upgradeAffixTier(eq, target.id) }
    }
    costs.push(cost)
  }
  const avg = costs.reduce((a,b)=>a+b,0) / runs
  const sorted = [...costs].sort((a,b)=>a-b)
  return { avg, p50: sorted[Math.floor(runs*0.5)], p90: sorted[Math.floor(runs*0.9)], min: sorted[0], max: sorted[runs-1] }
}

function simCraftPuzzle() {
  console.log('\n========== Sim C：Craft 解谜（定向打造毕业装的货币消耗）==========')
  console.log('成功标准：全 T1（毕业）消耗 30~150 货币（有追逐感但不劝退）；凝律石为稀缺货币')
  const t2 = measureCraftCost(2)
  const t1 = measureCraftCost(1)
  console.log(`  全词缀≤T2（小毕业）: 平均 ${fmt(t2.avg)} | 中位 ${t2.p50} | P90 ${t2.p90}`)
  console.log(`  全词缀=T1（真·毕业）: 平均 ${fmt(t1.avg)} | 中位 ${t1.p50} | P90 ${t1.p90} | 最多 ${t1.max}`)
  // 凝律石稀缺度：鬼荒原起 weight2，占比低；全 T1 需多少凝律石？
  const verdict = t1.avg >= 30 && t1.avg <= 150 ? '✓ 手感合理（毕业可达但有追逐）' : (t1.avg < 30 ? '⚠ 太便宜，建议加大升档成本或降低高难货币掉率' : '⚠ 太肝')
  console.log(`  判定: ${verdict}`)
}

// ============ Sim D：战力差距（T1 装满 vs T6 装满）============
function simPowerGap() {
  console.log('\n========== Sim D：词缀 roll 品质的战力差距（仅词缀贡献，剔除基础属性稀释）==========')
  console.log('成功标准：词缀贡献差距 2.5x~6x（T1 极品有强感知；实战中词缀为乘算，影响更大）')
  // 仅看词缀评分贡献：同一词缀取 T1 满值 vs T6 底值
  const gapOf = a => {
    const [lo, hi] = a.baseRange
    const mid = (lo + hi) / 2
    const t1v = mid * 2.0 * 1.08, t6v = mid * 0.6 * 0.92
    return t1v / t6v   // 数值比（再乘品质评分加成 1.35/0.85≈1.59）
  }
  const sample = affixPool.filter(a => a.slots.includes('artifact'))
  const gaps = sample.map(gapOf)
  const avgGap = gaps.reduce((a,b)=>a+b,0) / gaps.length
  const qMult = 1.35 / 0.85  // AFFIX_QUALITY_MULT T1/T6
  console.log(`  单词缀数值差距(平均)=${fmt(avgGap)}x | 含品质评分加成后≈${fmt(avgGap * qMult)}x`)
  // 总评分口径（含基础属性，供参考）：词缀占比越高，差距越接近词缀真实差距
  console.log('  注：装备"总评分"会被基础属性/强化倍率稀释（词缀占比低时总差距≈1.3x），')
  console.log('      但实战中词缀多为乘算（最终伤害/暴击等），真实战力影响接近词缀层差距。')
  console.log(`  判定: ${avgGap >= 2.5 && avgGap <= 6 ? '✓ 词缀 roll 差距健康，极品追逐有意义' : '⚠ 需调档距'}`)
}

simCurrencyDrops()
simTierChase()
simCraftPuzzle()
simPowerGap()
console.log('\n========== Playtest 模拟完成 ==========\n')
