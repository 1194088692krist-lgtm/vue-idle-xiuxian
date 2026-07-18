import { getRandomHerb, herbQualities } from './herbs'
import { pillRecipes } from './pills'

// 奇遇事件配置
// type: 'fortune'（福运）/ 'misfortune'（凶险）
// effect(s, ctx) 中 ctx 提供 zone（秘境信息）与 showMessage(severity, text) 回调
// 所有数值均按 ctx.zone.difficulty 缩放，使奇遇在不同秘境都具备实际价值
export const events = [
  // ============== 福运事件（强奖励） ==============
  {
    id: 'ancient_tablet',
    name: '古老石碑',
    description: '发现一块刻有上古功法的石碑。',
    type: 'fortune',
    chance: 0.10,
    effect: (s, ctx) => {
      const mult = ctx.zone?.difficulty || 1
      const bonus = Math.floor(50 * mult * (s.level / 5 + 1))
      s.cultivate(bonus)
      ctx.showMessage('success', `[古老石碑]领悟石碑上的功法，获得 ${bonus} 点修为`)
    }
  },
  {
    id: 'spirit_spring',
    name: '灵泉',
    description: '偶遇一处天然灵泉。',
    type: 'fortune',
    chance: 0.12,
    effect: (s, ctx) => {
      const mult = ctx.zone?.difficulty || 1
      const bonus = Math.floor(80 * mult * (s.level / 3 + 1))
      s.spirit += bonus
      ctx.showMessage('success', `[灵泉]饮用灵泉，灵力增加 ${bonus} 点`)
    }
  },
  {
    id: 'treasure_trove',
    name: '秘境宝藏',
    description: '发现一处上古修士遗留的宝藏。',
    type: 'fortune',
    chance: 0.08,
    effect: (s, ctx) => {
      const mult = ctx.zone?.difficulty || 1
      const stoneBonus = Math.floor(50 * mult * (s.level / 2 + 1))
      s.spiritStones += stoneBonus
      ctx.showMessage('success', `[秘境宝藏]获得 ${stoneBonus} 颗灵石`)
    }
  },
  {
    id: 'ancient_master',
    name: '古修遗府',
    description: '意外发现一位上古大能的洞府。',
    type: 'fortune',
    chance: 0.04,
    effect: (s, ctx) => {
      const mult = ctx.zone?.difficulty || 1
      const cultivationBonus = Math.floor(150 * mult * (s.level / 2 + 1))
      const spiritBonus = Math.floor(200 * mult * (s.level / 2 + 1))
      s.cultivate(cultivationBonus)
      s.spirit += spiritBonus
      ctx.showMessage('success', `[古修遗府]获得传承，修为 +${cultivationBonus}，灵力 +${spiritBonus}`)
    }
  },
  {
    id: 'enlightenment',
    name: '顿悟',
    description: '修炼中突然顿悟，功法精要尽数贯通。',
    type: 'fortune',
    chance: 0.06,
    effect: (s, ctx) => {
      const mult = ctx.zone?.difficulty || 1
      const bonus = Math.floor(80 * mult * (s.level / 4 + 1))
      s.cultivate(bonus)
      // 永久修炼速率 +5%（累加封顶 5 倍）
      s.cultivationRate = Math.min(5, (s.cultivationRate || 1) + 0.05)
      ctx.showMessage('success', `[顿悟]修为 +${bonus}，修炼速率永久 +5%（当前 ${(s.cultivationRate * 100).toFixed(0)}%）`)
    }
  },
  {
    id: 'forge_master',
    name: '锻造师传承',
    description: '寻得失传的锻造秘录，强化洗练造诣精进。',
    type: 'fortune',
    chance: 0.05,
    effect: (s, ctx) => {
      const mult = ctx.zone?.difficulty || 1
      const enhanceStones = Math.max(2, Math.floor(3 * mult))
      const reforgeStones = Math.max(1, Math.floor(mult / 2))
      s.reinforceStones = (s.reinforceStones || 0) + enhanceStones
      s.refinementStones = (s.refinementStones || 0) + reforgeStones
      ctx.showMessage('success', `[锻造师传承]获得 ${enhanceStones} 强化石 + ${reforgeStones} 洗练石`)
    }
  },
  {
    id: 'crystal_vein',
    name: '幻灵晶脉',
    description: '探得一处地下晶脉，结晶唾手可得。',
    type: 'fortune',
    chance: 0.04,
    effect: (s, ctx) => {
      const mult = ctx.zone?.difficulty || 1
      const crystals = Math.max(5, Math.floor(10 * mult))
      s.phantomCrystals = (s.phantomCrystals || 0) + crystals
      ctx.showMessage('success', `[幻灵晶脉]获得 ${crystals} 幻灵结晶`)
    }
  },
  {
    id: 'pill_recipe',
    name: '丹方残页',
    description: '于山野中发现丹方残页一卷。',
    type: 'fortune',
    chance: 0.06,
    effect: (s, ctx) => {
      const mult = ctx.zone?.difficulty || 1
      const count = Math.min(4, 1 + Math.floor(mult / 2))
      for (let i = 0; i < count; i++) {
        const randomRecipe = pillRecipes[Math.floor(Math.random() * pillRecipes.length)]
        if (randomRecipe) s.gainPillFragment(randomRecipe.id)
      }
      ctx.showMessage('success', `[丹方残页]获得 ${count} 张丹方残页`)
    }
  },
  {
    id: 'fortune_herb_garden',
    name: '灵草秘园',
    description: '踏入一片野生灵草秘园。',
    type: 'fortune',
    chance: 0.05,
    effect: (s, ctx) => {
      const mult = ctx.zone?.difficulty || 1
      const count = Math.min(6, 2 + Math.floor(mult / 2))
      for (let i = 0; i < count; i++) {
        const herb = getRandomHerb({ difficulty: mult })
        if (herb) s.gainMaterial(herb)
      }
      ctx.showMessage('success', `[灵草秘园]采得 ${count} 株灵草`)
    }
  },
  // ============== 凶险事件（损失） ==============
  {
    id: 'monster_attack',
    name: '妖兽袭击',
    description: '遭遇一只实力强大的妖兽。',
    type: 'misfortune',
    chance: 0.10,
    effect: (s, ctx) => {
      const mult = ctx.zone?.difficulty || 1
      const damage = Math.floor(60 * mult * (s.level / 4 + 1))
      s.spirit = Math.max(0, s.spirit - damage)
      ctx.showMessage('error', `[妖兽袭击]与妖兽激战，损失 ${damage} 点灵力`)
    }
  },
  {
    id: 'cultivation_deviation',
    name: '走火入魔',
    description: '修炼出现偏差，走火入魔。',
    type: 'misfortune',
    chance: 0.08,
    effect: (s, ctx) => {
      const mult = ctx.zone?.difficulty || 1
      const damage = Math.floor(40 * mult * (s.level / 3 + 1))
      s.cultivationPool = Math.max(0, s.cultivationPool - damage)
      ctx.showMessage('error', `[走火入魔]走火入魔，损失 ${damage} 点修为池`)
    }
  },
  {
    id: 'qi_deviation',
    name: '心魔侵扰',
    description: '遭受心魔侵扰，灵力修为俱损。',
    type: 'misfortune',
    chance: 0.10,
    effect: (s, ctx) => {
      const mult = ctx.zone?.difficulty || 1
      const damage = Math.floor(50 * mult * (s.level / 3 + 1))
      s.spirit = Math.max(0, s.spirit - damage)
      s.cultivationPool = Math.max(0, s.cultivationPool - Math.floor(damage / 2))
      ctx.showMessage('error', `[心魔侵扰]损失 ${damage} 灵力 + ${Math.floor(damage / 2)} 修为池`)
    }
  }
]

// 奖励处理函数（保留供外部调用）
export const handleReward = (reward, playerStore, showMessage) => {
  switch (reward.type) {
    case 'spirit_stone':
      playerStore.spiritStones += reward.amount
      showMessage('success', `[灵石获取]获得${reward.amount}颗灵石`)
      break
    case 'herb':
      for (let i = 0; i < reward.amount; i++) {
        const herb = getRandomHerb()
        if (herb) {
          playerStore.gainMaterial(herb)
          showMessage('success', `[灵草获取]获得${herbQualities[herb.quality].name}品质的${herb.name}`)
        }
      }
      break
    case 'cultivation':
      playerStore.cultivate(reward.amount)
      showMessage('success', `[修为获取]获得${reward.amount}点修为`)
      if (playerStore.cultivation >= playerStore.maxCultivation) {
        if (playerStore.tryBreakthrough()) {
          showMessage('success', `[突破]突破成功！当前境界：${playerStore.realm}`)
        }
      }
      break
    case 'pill_fragment':
      for (let i = 0; i < reward.amount; i++) {
        const randomRecipe = pillRecipes[Math.floor(Math.random() * pillRecipes.length)]
        if (randomRecipe) {
          playerStore.gainPillFragment(randomRecipe.id)
          showMessage('success', `[丹方获取]获得${randomRecipe.name}的丹方残页`)
        }
      }
      break
  }
}

// 随机获取奖励（保留供外部调用）
export const getRandomReward = rewards => {
  const rand = Math.random()
  let cumulative = 0
  for (const reward of rewards) {
    cumulative += reward.chance
    if (rand <= cumulative) {
      const amount = Math.floor(Math.random() * (reward.amount[1] - reward.amount[0] + 1)) + reward.amount[0]
      return { type: reward.type, amount }
    }
  }
  return null
}

// 触发随机事件：按 chance 独立判定，命中首个即触发
// ctx: { zone, showMessage }，showMessage 形如 (severity, text)
export const triggerRandomEvent = (playerStore, ctx) => {
  const showMessage = ctx?.showMessage || (() => {})
  for (const event of events) {
    if (Math.random() <= event.chance) {
      showMessage('info', `[${event.name}]${event.description}`)
      try {
        event.effect(playerStore, ctx)
      } catch (err) {
        // 单事件异常不应中断挂机
        console.error('[events]', event.id, err)
      }
      playerStore.eventTriggered++
      playerStore.queueSave()
      return event
    }
  }
  return null
}
