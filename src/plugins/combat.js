// 战斗状态
const CombatState = {
  READY: 'ready',
  IN_PROGRESS: 'in_progress',
  VICTORY: 'victory',
  DEFEAT: 'defeat'
}

// 战斗类型
const CombatType = {
  NORMAL: 'normal', // 普通战斗
  BOSS: 'boss', // Boss战斗
  ELITE: 'elite' // 精英战斗
}

// 基础战斗属性
class CombatStats {
  constructor(base = {}) {
    // 基础属性
    this.health = base.health || 100
    this.maxHealth = base.maxHealth || 100
    this.damage = base.damage || 10
    this.defense = base.defense || 5
    this.speed = base.speed || 10
    // 战斗属性（百分比）
    this.critRate = base.critRate || 0.05 // 暴击率
    this.comboRate = base.comboRate || 0 // 连击率
    this.counterRate = base.counterRate || 0 // 反击率
    this.stunRate = base.stunRate || 0 // 眩晕率
    this.dodgeRate = base.dodgeRate || 0.05 // 闪避率
    this.vampireRate = base.vampireRate || 0 // 吸血率
    // 战斗抗性（百分比）
    this.critResist = base.critResist || 0 // 抗暴击
    this.comboResist = base.comboResist || 0 // 抗连击
    this.counterResist = base.counterResist || 0 // 抗反击
    this.stunResist = base.stunResist || 0 // 抗眩晕
    this.dodgeResist = base.dodgeResist || 0 // 抗闪避
    this.vampireResist = base.vampireResist || 0 // 抗吸血
    // 特殊属性（百分比）
    this.healBoost = base.healBoost || 0 // 强化治疗
    this.critDamageBoost = base.critDamageBoost || 0.5 // 强化爆伤
    this.critDamageReduce = base.critDamageReduce || 0 // 弱化爆伤
    this.finalDamageBoost = base.finalDamageBoost || 0 // 最终增伤
    this.finalDamageReduce = base.finalDamageReduce || 0 // 最终减伤
    this.combatBoost = base.combatBoost || 0 // 战斗属性提升
    this.resistanceBoost = base.resistanceBoost || 0 // 战斗抗性提升
  }
  // 计算最终伤害
  calculateDamage(target) {
    // 应用战斗属性提升
    let damage = Math.abs(this.damage * (1 + this.combatBoost))
    let isCrit = false
    let isCombo = false
    let isVampire = false
    let isStun = false
    // 计算暴击（考虑目标的抗暴击，封顶 1.0）
    const finalCritRate = Math.min(1, Math.max(
      0,
      this.critRate * (1 + this.combatBoost) -
        (target ? target.stats.critResist * (1 + target.stats.resistanceBoost) : 0)
    ))
    if (Math.random() < finalCritRate) {
      damage *= 1.5 + this.critDamageBoost
      isCrit = true
    }
    // 计算连击（考虑目标的抗连击，封顶 1.0）
    const finalComboRate = Math.min(1, Math.max(
      0,
      this.comboRate * (1 + this.combatBoost) - (target ? target.stats.comboResist : 0)
    ))
    if (Math.random() < finalComboRate) {
      damage *= 1.3
      isCombo = true
    }
    // 计算吸血（考虑目标的抗吸血，封顶 1.0）
    const finalVampireRate = Math.min(1, Math.max(
      0,
      this.vampireRate * (1 + this.combatBoost) - (target ? target.stats.vampireResist : 0)
    ))
    if (Math.random() < finalVampireRate) {
      isVampire = true
    }
    // 计算眩晕（考虑目标的抗眩晕，封顶 1.0）
    const finalStunRate = Math.min(1, Math.max(0, this.stunRate * (1 + this.combatBoost) - (target ? target.stats.stunResist : 0)))
    if (Math.random() < finalStunRate) {
      isStun = true
    }
    // 应用最终伤害加成
    damage *= 1 + this.finalDamageBoost
    return { damage: Math.abs(damage), isCrit, isCombo, isVampire, isStun }
  }
  // 计算伤害减免
  calculateDamageReduction(incomingDamage, attackerStats) {
    let damage = Math.abs(incomingDamage)
    // 应用防御减伤（考虑战斗属性提升）
    // 平衡修复：原公式 100/(100+DEF) 在大数值下过度压缩伤害（DEF=2万时伤害仅剩 0.5%），
    // 导致玩家高 Build 仍打不动后期 BOSS。改用 sqrt 压缩 DEF，让高 DEF 仍有意义但边际递减：
    //   DEF=100   → 减伤 9%（原 50%）
    //   DEF=10000 → 减伤 50%（原 99%）
    //   DEF=20000 → 减伤 58%（原 99.5%）
    const effectiveDefense = this.defense * (1 + this.combatBoost)
    damage *= 100 / (100 + Math.sqrt(effectiveDefense))
    // 如果是暴击伤害，应用暴击伤害减免
    if (attackerStats && attackerStats.isCrit) {
      damage *= 1 - this.critDamageReduce
    }
    // 应用最终伤害减免
    damage *= 1 - this.finalDamageReduce
    // 确保最小伤害为1
    return Math.max(1, Math.abs(damage))
  }
}

// 战斗实体基类
class CombatEntity {
  constructor(name, level, baseStats = {}, realm = '练气一层') {
    const stats = { ...baseStats }
    this.name = name
    this.level = level
    this.realm = realm
    // 确保maxHealth与health保持一致
    if (stats.health && !stats.maxHealth) {
      stats.maxHealth = stats.health
    }
    this.stats = new CombatStats(stats)
    this.currentHealth = this.stats.maxHealth
    this.effects = []
    this.buffs = []
  }
  // 添加buff
  addBuff(buff) {
    this.buffs.push(buff)
  }
  // 应用正面buff效果（如持续治疗、光环）
  applyBuffs() {
    for (const buff of [...this.buffs]) {
      if (buff.duration <= 0) continue
      if (buff.type === 'heal_over_time') {
        this.heal(buff.value)
      }
    }
  }
  // 获取受 buff 影响后的有效属性值
  // 支持 attack_up/defense_up/speed_up 等百分比增益 buff
  getEffectiveStat(statName) {
    const base = this.stats[statName] || 0
    let mult = 1
    for (const buff of (this.buffs || [])) {
      if (buff.duration > 0 && buff.type === statName + '_up') {
        mult += (buff.value || 0)
      }
    }
    return base * mult
  }
  // 结算负面效果并减少duration
  tickDebuffs() {
    let totalDamage = 0
    for (const buff of [...this.buffs]) {
      if (buff.duration > 0) {
        if (buff.type === 'damage_over_time') {
          const dmg = Math.min(this.currentHealth, Math.max(1, Math.floor(buff.value)))
          this.currentHealth = Math.max(0, Math.floor(this.currentHealth - dmg))
          totalDamage += dmg
        }
        buff.duration--
      }
    }
    // 修复护盾滞留：duration 归零或 value<=0 的护盾一律清除
    this.buffs = this.buffs.filter(b => b.duration > 0 && !(b.type === 'shield' && b.value <= 0))
    return totalDamage
  }
  // 检查是否被眩晕
  isStunned() {
    return this.buffs.some(b => b.type === 'stun' && b.duration > 0)
  }
  // 受到伤害
  takeDamage(amount, source) {
    // 计算实际闪避率（考虑攻击方的抗闪避）
    const actualDodgeRate = Math.max(0, Math.min(1, this.stats.dodgeRate - (source ? source.stats.dodgeResist : 0)))
    // 闪避判定
    if (Math.random() < actualDodgeRate) {
      return { dodged: true, damage: 0, shieldAbsorbed: 0 }
    }
    // 计算实际伤害（取整，避免 HP 出现小数尾）
    let reducedDamage = Math.floor(this.stats.calculateDamageReduction(amount))
    // 护盾吸收：优先使用 shield 类型 buff 吸收伤害，剩余伤害再扣减生命值
    // 多个护盾按剩余吸收量从大到小依次消耗（让最厚的护盾先扛，避免碎片护盾被一次清空浪费）
    let shieldAbsorbed = 0
    const shields = (this.buffs || []).filter(b => b.type === 'shield' && b.duration > 0 && b.value > 0)
      .sort((a, b) => b.value - a.value)
    for (const shield of shields) {
      if (reducedDamage <= 0) break
      const absorb = Math.min(reducedDamage, shield.value)
      shield.value -= absorb
      reducedDamage -= absorb
      shieldAbsorbed += absorb
    }
    // 移除已耗尽的护盾（value<=0），避免下一击继续被当作可用护盾
    // 修复 BUG B：原条件 shields.length > 0 会导致所有护盾耗尽时不清理，残留空壳护盾让 hasShield 误报
    this.buffs = this.buffs.filter(b => !(b.type === 'shield' && b.value <= 0))
    // 扣减生命值
    this.currentHealth = Math.max(0, Math.floor(this.currentHealth - reducedDamage))
    // 计算反击（考虑攻击方的抗反击）
    let isCounter = false
    if (source) {
      const finalCounterRate = Math.max(0, Math.min(1, this.stats.counterRate - source.stats.counterResist))
      if (Math.random() < finalCounterRate) {
        isCounter = true
      }
    }
    return {
      dodged: false,
      damage: reducedDamage,
      rawDamage: Math.floor(this.stats.calculateDamageReduction(amount)),
      shieldAbsorbed,
      currentHealth: this.currentHealth,
      isDead: this.currentHealth <= 0,
      isCounter: isCounter
    }
  }
  // 恢复生命值（应用 healBoost 强化治疗加成）
  heal(amount) {
    const oldHealth = this.currentHealth
    // healBoost 为正数时增疗，为负时减疗；乘法叠加
    const boosted = Math.floor(amount * (1 + (this.stats.healBoost || 0)))
    this.currentHealth = Math.min(this.stats.maxHealth, Math.floor(this.currentHealth + boosted))
    return Math.floor(this.currentHealth - oldHealth)
  }
  // 添加效果
  addEffect(effect) {
    this.effects.push(effect)
    effect.apply(this)
  }
  // 移除效果
  removeEffect(effectId) {
    const index = this.effects.findIndex(e => e.id === effectId)
    if (index >= 0) {
      const effect = this.effects[index]
      effect.remove(this)
      this.effects.splice(index, 1)
    }
  }
}
// 战斗管理器
class CombatManager {
  constructor(player, enemy, type = CombatType.NORMAL) {
    this.player = player
    this.enemy = enemy
    this.players = player ? [player] : []
    this.type = type
    this.state = CombatState.READY
    this.round = 0
    this.log = []
  }
  // 开始战斗
  start() {
    this.state = CombatState.IN_PROGRESS
    return this.state
  }
  // 执行回合（支持多玩家）
  // 参数：players 本回合参与攻击的玩家；enemy 敌人；allPlayers 用于怪物选目标的完整存活列表
  // （allPlayers 与 players 分离，让只加盾/治疗不普攻的盾系/医者也能被怪物攻击）
  executeTurn(players, enemy, allPlayers) {
    const activePlayers = players || this.players || (this.player ? [this.player] : [])
    const activeEnemy = enemy || this.enemy
    // 怪物选目标的候选池：优先用调用方传入的 allPlayers（含未参与攻击的盾系/医者），
    // 没传则退化为 activePlayers（保持向后兼容）
    const targetPool = (allPlayers && allPlayers.length > 0) ? allPlayers : activePlayers
    if (this.state !== CombatState.IN_PROGRESS) return null
    if (!activeEnemy) return null
    this.round++
    const results = []

    // 收集所有存活参战者
    const allActors = [
      ...activePlayers.filter(p => p && p.currentHealth > 0 && !p.isStunned()),
      ...(activeEnemy.currentHealth > 0 && !activeEnemy.isStunned() ? [activeEnemy] : [])
    ]

    // 按速度排序（速度高的先行动）
    allActors.sort((a, b) => {
      const sa = (a.stats.speed || 0) * (1 + (a.stats.combatBoost || 0))
      const sb = (b.stats.speed || 0) * (1 + (b.stats.combatBoost || 0))
      return sb - sa
    })

    for (const attacker of allActors) {
      if (this.state !== CombatState.IN_PROGRESS) break
      if (attacker.currentHealth <= 0) continue

      // 确定目标
      let defender
      const isEnemy = attacker === activeEnemy
      if (isEnemy) {
        // 怪物选目标从 targetPool（含盾系/医者）中选，而非只从 attackingPlayers 中选
        const alivePlayers = targetPool.filter(p => p && p.currentHealth > 0)
        if (alivePlayers.length === 0) break
        // 嘲讽机制：防御型角色(role='shield')天生吸引仇恨，怪物优先攻击他们
        // - 50% 概率优先选防御型角色（嘲讽被动效果）
        // - 50% 概率随机攻击（保留不确定性，避免完全可预测）
        // - 无防御型角色存活时退化为随机
        const tanks = alivePlayers.filter(p => p.role === 'shield')
        if (tanks.length > 0 && Math.random() < 0.5) {
          defender = tanks[Math.floor(Math.random() * tanks.length)]
        } else {
          defender = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
        }
      } else {
        if (activeEnemy.currentHealth <= 0) break
        defender = activeEnemy
      }

      // 攻击
      // 应用 buff 增益：attack_up/defense_up 等 buff 在攻击/防御时生效
      // 临时替换 stats 字段，攻击结束后恢复原值
      const _origDamage = attacker.stats.damage
      const _origDefense = defender.stats.defense
      if (typeof attacker.getEffectiveStat === 'function') {
        attacker.stats.damage = attacker.getEffectiveStat('damage')
      }
      if (typeof defender.getEffectiveStat === 'function') {
        defender.stats.defense = defender.getEffectiveStat('defense')
      }
      const attack = attacker.stats.calculateDamage(defender)
      const result = defender.takeDamage(attack.damage, attacker)
      // 恢复原始 stats（buff 增益仅在本次攻击计算时生效，不持久修改）
      attacker.stats.damage = _origDamage
      defender.stats.defense = _origDefense

      // 吸血
      if (attack.isVampire && !result.dodged) {
        const healAmount = result.damage * 0.3
        attacker.heal(healAmount)
      }

      // 记录日志
      let attackLog = `${attacker.name}攻击${defender.name}`
      if (result.dodged) {
        attackLog += `，被闪避了！`
      } else {
        // 显示伤害明细：原始伤害 → 护盾吸收 → 实际扣血
        const totalDmg = (result.rawDamage !== undefined ? result.rawDamage : result.damage) + (result.shieldAbsorbed || 0)
        attackLog += `，造成${totalDmg.toFixed(1)}点伤害`
        if (result.shieldAbsorbed > 0) {
          attackLog += `（护盾吸收${result.shieldAbsorbed.toFixed(1)}点，实际扣血${result.damage.toFixed(1)}点）`
        }
        if (attack.isCrit) attackLog += `（暴击！）`
        if (attack.isCombo) attackLog += `（连击！）`
        if (attack.isVampire) attackLog += `（吸血恢复${(result.damage * 0.3).toFixed(1)}点生命值！）`
        if (attack.isStun) attackLog += `（眩晕目标！）`
      }
      this.log.push(attackLog)

      results.push({
        attacker: attacker.name,
        defender: defender.name,
        damage: result.damage,
        rawDamage: result.rawDamage !== undefined ? result.rawDamage : result.damage,
        shieldAbsorbed: result.shieldAbsorbed || 0,
        isCrit: attack.isCrit,
        isCombo: attack.isCombo,
        isDodged: result.dodged,
        isVampire: attack.isVampire,
        isStun: attack.isStun,
        isCounter: result.isCounter || false,
        attackerHP: Math.round(attacker.currentHealth),
        defenderHP: Math.round(defender.currentHealth),
        attackerMaxHP: attacker.stats.maxHealth,
        defenderMaxHP: defender.stats.maxHealth
      })

      // 检查被攻击者是否死亡
      if (result.isDead) {
        if (defender === activeEnemy) {
          this.state = CombatState.VICTORY
          this.log.push(`${attacker.name}击败了${defender.name}！`)
        } else {
          // 团灭判定：检查 targetPool（含盾系/医者）所有玩家是否全灭
          const allPlayersDead = targetPool.every(p => !p || p.currentHealth <= 0)
          if (allPlayersDead) {
            this.state = CombatState.DEFEAT
            this.log.push(`全队阵亡，${attacker.name}获得胜利！`)
          }
        }
      }
    }

    const firstPlayer = activePlayers[0]
    return {
      results,
      state: this.state,
      round: this.round,
      playerCurrentHealth: firstPlayer ? Math.round(firstPlayer.currentHealth) : 0,
      enemyCurrentHealth: Math.round(activeEnemy.currentHealth)
    }
  }
  // 获取战斗日志
  getCombatLog() {
    return this.log
  }
}

// 判断战斗是否结束
function isBattleOver(players, enemy) {
  const allPlayersDead = (players || []).every(p => !p || p.currentHealth <= 0)
  if (allPlayersDead) return { over: true, victory: false }
  if (!enemy || enemy.currentHealth <= 0) return { over: true, victory: true }
  return { over: false, victory: false }
}

// 生成敌人
function generateEnemy(level, type = CombatType.NORMAL, difficulty = 1) {
  const baseStats = {
    // 基础属性
    health: 100 + difficulty * level * 200,
    damage: 8 + difficulty * level * 2,
    defense: 3 + difficulty * level * 2,
    speed: 5 + difficulty * level * 2,
    // 战斗属性（百分比）
    critRate: 0.05 + difficulty * level * 0.02,
    comboRate: 0.03 + difficulty * level * 0.02,
    counterRate: 0.03 + difficulty * level * 0.02,
    stunRate: 0.02 + difficulty * level * 0.01,
    dodgeRate: 0.05 + difficulty * level * 0.02,
    vampireRate: 0.02 + difficulty * level * 0.01,
    // 战斗抗性（百分比）
    critResist: 0.02 + difficulty * level * 0.01,
    comboResist: 0.02 + difficulty * level * 0.01,
    counterResist: 0.02 + difficulty * level * 0.01,
    stunResist: 0.02 + difficulty * level * 0.01,
    dodgeResist: 0.02 + difficulty * level * 0.01,
    vampireResist: 0.02 + difficulty * level * 0.01,
    // 特殊属性（百分比）
    healBoost: 0.05 + difficulty * level * 0.02,
    critDamageBoost: 0.2 + difficulty * level * 0.1,
    critDamageReduce: 0.1 + difficulty * level * 0.05,
    finalDamageBoost: 0.05 + difficulty * level * 0.02,
    finalDamageReduce: 0.05 + difficulty * level * 0.02,
    combatBoost: 0.03 + difficulty * level * 0.02,
    resistanceBoost: 0.03 + difficulty * level * 0.02
  }
  // 根据类型调整属性
  switch (type) {
    case CombatType.ELITE:
      Object.keys(baseStats).forEach(key => {
        if (typeof baseStats[key] === 'number') {
          if (key.includes('Rate') || key.includes('Resist') || key.includes('Boost') || key.includes('Reduce')) {
            baseStats[key] = Math.min(0.8, baseStats[key] * 1.3) // 百分比属性最高限制在80%
          } else {
            baseStats[key] *= 1.5
          }
        }
      })
      break
    case CombatType.BOSS:
      Object.keys(baseStats).forEach(key => {
        if (typeof baseStats[key] === 'number') {
          if (key.includes('Rate') || key.includes('Resist') || key.includes('Boost') || key.includes('Reduce')) {
            baseStats[key] = Math.min(0.9, baseStats[key] * 1.5) // 百分比属性最高限制在90%
          } else {
            baseStats[key] *= 2
          }
        }
      })
      // 平衡调整：盾系实装后 BOSS 普遍偏弱，所有能力值再统一提升 50%
      // 在原 ×2 强化基础上叠加，百分比类上限放宽到 95% 避免必然暴击/闪避
      Object.keys(baseStats).forEach(key => {
        if (typeof baseStats[key] !== 'number') return
        const boosted = baseStats[key] * 1.5
        if (key.includes('Rate') || key.includes('Resist') || key.includes('Boost') || key.includes('Reduce')) {
          baseStats[key] = Math.min(0.95, boosted)
        } else {
          baseStats[key] = boosted
        }
      })
      break
  }
  // 根据类型和等级生成敌人名称
  let enemyName = ''
  const normalNames = ['野狼', '山猪', '毒蛇', '黑熊', '猛虎', '恶狼', '巨蟒', '狂狮']
  const eliteNames = ['赤焰虎', '玄冰蟒', '紫电豹', '金刚猿', '幽冥狼', '碧水蛟', '雷霆鹰', '烈风豹']
  const bossNames = ['九尾天狐', '万年龙蟒', '太古神虎', '玄天冰凤', '幽冥魔龙', '混沌巨兽', '远古天蟒', '不死火凤']
  switch (type) {
    case CombatType.BOSS:
      enemyName = bossNames[Math.floor(level / 10) % bossNames.length]
      break
    case CombatType.ELITE:
      enemyName = eliteNames[Math.floor(level / 5) % eliteNames.length]
      break
    default:
      enemyName = normalNames[level % normalNames.length]
  }
  return new CombatEntity(enemyName, level, baseStats, '练气一层')
}
export { CombatState, CombatType, CombatStats, CombatEntity, CombatManager, generateEnemy, isBattleOver }
