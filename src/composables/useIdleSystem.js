import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { zones, getZoneById, getZoneDifficulty } from '../plugins/zones'
import { CombatManager, CombatEntity, CombatType, isBattleOver } from '../plugins/combat'
import { getAllResonanceEffects, applyResonanceToCombatStats } from '../plugins/schoolResonance'
import { getRandomHerb, getRandomOre, getRandomLiquid, getRandomCore, getRandomSpecial, getRandomZoneMaterial } from '../plugins/materials'
import { getAffixesForSlot, setBonuses, rarityConfig, calculateEquipmentScore } from '../plugins/buildSystem'
import { equipmentNameParts } from '../plugins/gacha'
import { BOSS_MATERIALS, getBossEncounterChance, ZONE_BOSSES, getBossMaterialByBossId, BOSS_TICKETS, getBossTicketByBossId } from '../plugins/cultivationSystem'
import { getCharacterThumbnail } from '../plugins/characters'
import { getInitialSkills } from '../plugins/skills'
import { getMonsterAvatarSync } from '../plugins/monsters'
import { getIconUrl } from '../plugins/icons'
import { getPillsByZone, pillRecipes } from '../plugins/pills'
import { triggerRandomEvent } from '../plugins/events'

// Buff 百分比格式化：最多保留两位小数，去除多余小数位
// 例：0.1 -> "10%"，0.123 -> "12.3%"，0.1234 -> "12.34%"
const formatBuffPercent = (value) => {
  const pct = value * 100
  // 先四舍五入到两位小数，再去除多余的 .00 / .x0
  const str = pct.toFixed(2).replace(/\.?0+$/, '')
  return str + '%'
}

// ============ 单例状态（模块级，跨组件共享） ============
const selectedZone = ref(null)
const selectedDifficultyKey = ref('xiongxian')
const isIdling = ref(false)
const logs = ref([])                 // 挂机日志（仅内存，不写入存档）
const idleEncounterCount = ref(0)
const idleProgress = ref(0)
const idleTimeRemaining = ref('')
const lastSummary = ref(null)
const combatState = ref({ inCombat: false, combatManager: null })
const animState = ref({ playerAttack: false, playerHurt: false, enemyAttack: false, enemyHurt: false })
const treasureFlash = ref({ show: false, tier: '', title: '', desc: '', icon: '' })
const runStats = ref({ victories: 0, defeats: 0, spiritStones: 0, cultivation: 0, equipment: 0, exp: 0, healAmount: 0, buffCount: 0, shieldAmount: 0, damageBoost: 0, phantomCrystals: 0, totalDamageDealt: 0, totalDamageTaken: 0, bossTickets: 0, bossMaterials: 0 })
const foundEquipment = ref([])       // 本次挂机获得的装备列表
const currentEncounterSummary = ref(null) // 实时显示当前最新结算画面
const currentIdleEnemy = ref(null) // 实时显示当前挂机遭遇的怪物（用于挂机仪表盘怪物状态面板）
const battlePlayback = ref(null)   // 战斗回放数据：每场遭遇后设置，驱动 BattleStage 组件播放动画
// 诊断面板状态：实时显示 runIdleEncounter 的执行轨迹与捕获的异常，便于玩家无控制台时定位问题
const idleDiag = ref({
  lastCall: '',           // 最近一次 runIdleEncounter 触发时间戳
  lastStage: '',          // 最近执行到的阶段
  lastError: '',          // 最近一次异常的完整信息（含堆栈）
  errorCount: 0,          // 累计异常次数
  callCount: 0,           // runIdleEncounter 被调用次数
  skipCount: 0,           // 因各种条件被跳过的次数
  isRunningStuck: false,  // isRunning 是否卡住
  lastZone: '',           // 最近一次的 zone id
  lastDiff: '',           // 最近一次的 difficulty key
  lastPlayerCount: 0,     // 最近一次创建的玩家实体数
  lastEnemyName: '',      // 最近一次的敌人名称
  lastFinished: '',       // 最近一次战斗结果
  lastPlaybackSet: ''     // 最近一次 battlePlayback 设置时间
})
const currentEncounter = ref({
  enemy: null,           // 当前怪物 CombatEntity
  players: [],           // 当前参战玩家 CombatEntity[]
  round: 0,              // 当前回合计数
  inProgress: false,     // 是否进行中
  combatLog: [],         // 本回合战斗日志
  combatStats: {},       // memberId -> 战斗统计
  manager: null,         // CombatManager 实例
  enemyData: null        // 额外敌人信息
})
// 本次挂机「完整战斗日志」累积源：跨所有遭遇（每场战斗）的战斗日志文本，
// 从挂机开始持续累积到当前，供 BattleStage「查看完整日志」弹窗展示（而非仅当前回合）。
const idleCombatLog = ref([])
// 按轮 BOSS 调度（核心玩法）：每轮 5 分钟 = 前 4 分钟小怪 + 后 1 分钟限时 BOSS，多轮递进。
// 1 分钟内未击杀 BOSS 则本轮失败，强制进入下一轮（4 分钟小怪 + 1 分钟 BOSS）。
const IDLE_ROUND_MS = 5 * 60 * 1000    // 每轮总时长 5 分钟
const ROUND_MOB_MS = 4 * 60 * 1000     // 每轮前 4 分钟为小怪阶段
const BOSS_TIME_LIMIT_MS = 60 * 1000   // BOSS 限时 1 分钟
const bossSpawned = ref(false)         // 当前轮是否已有 BOSS 战进行中
const bossDefeated = ref(false)        // 本次挂机是否曾击杀任意一轮 BOSS（用于横幅/结算）
const bossSpawnRound = ref(-1)         // 当前进行中 BOSS 所属的轮次索引（-1 表示无）
const bossAttemptedRound = ref(-1)     // 已刷出过 BOSS 的轮次索引，防止同轮重复刷新
const bossSpawnTime = ref(0)           // BOSS 刷出时刻（ms 时间戳），用于 1 分钟限时判定
const bossRoundsCleared = ref(0)       // 已击杀 BOSS 的轮次数（通过核心挑战的轮次）
const bossRoundsFailed = ref(0)        // BOSS 未击杀（失败/超时）的轮次数
const bossTimeRemaining = ref('')     // BOSS 限时剩余（mm:ss），供 UI 倒计时展示
let encounterAborted = false           // 由 1 分钟超时触发，令进行中的遭遇循环立即中断（不结束挂机）
const idleBuffs = ref([])            // 本次挂机中生效的小剧场 buff
const sessionMaterials = ref({})    // 本次挂机获得的各类素材累计（type -> 数量）
// BOSS 挑战系统：玩家从探索页直接选择某个 BOSS 进行多次挑战的结果反馈
// 结构：{ zoneId, bossId, bossName, count, victories, defeats, drops: [], ticketId, ticketName, message, success }
const bossChallengeResult = ref(null)
// BOSS 挑战实时战斗状态：挑战进行中复用 currentEncounter + executeRound + BattleStage，
// 让玩家像挂机一样观看实时战斗、查看仪表盘与结算（与探索挂机体验一致）
const isBossChallengeInProgress = ref(false)  // 是否正在 BOSS 挑战战斗中
const bossChallengeRound = ref(0)              // 当前第几场（1-based）
const bossChallengeTotalRounds = ref(0)       // 共 N 场
const bossChallengeBossName = ref('')         // 当前挑战的 BOSS 名
const bossChallengeZoneName = ref('')         // 当前挑战的秘境名
const bossChallengeSummary = ref(null)        // 全部挑战结束后的总结算（替代 lastSummary 展示）

// 素材类型展示信息（用于结算栏汇总显示）
// 注：原 fortune(奇遇材料) 类型已废弃——奇遇奖励内部的素材（定灵珠/天玄碎片/灵草等）
// 已在发放时按其本身 kind 累计到对应类别（herb/ore/liquid/special），不再单独存在
const MATERIAL_ORDER = ['herb', 'ore', 'liquid', 'core', 'special', 'pet_fragment', 'phantom_crystal', 'boss_material', 'boss_ticket']
const MATERIAL_DISPLAY = {
  herb: { name: '灵草', icon: getIconUrl('reward_mat_herb.png') },
  ore: { name: '矿料', icon: getIconUrl('reward_mat_ore.png') },
  liquid: { name: '灵液', icon: getIconUrl('reward_mat_liquid.png') },
  core: { name: '妖兽内丹', icon: getIconUrl('reward_mat_core.png') },
  special: { name: '至宝', icon: getIconUrl('reward_mat_core.png') },
  pet_fragment: { name: '升星碎片', icon: getIconUrl('reward_mat_pet_fragment.png') },
  phantom_crystal: { name: '幻灵结晶', icon: getIconUrl('reward_mat_phantom_crystal.png') },
  boss_material: { name: 'BOSS素材', icon: getIconUrl('reward_mat_core.png') },
  boss_ticket: { name: '挑战券', icon: getIconUrl('reward_mat_core.png') }
}
// 将一次遭遇的奖励累计进本次挂机素材统计
// 支持 reward.type 字段（如 herb/ore/liquid/phantom_crystal）以及 material 对象的 kind 字段
// （boss_material/boss_ticket/core 等通过 grantCombatDrops 返回的 material 对象）
// fortune 类型特殊处理：累计到 r.materialKind（即 pickItem.kind）下，让结算栏展示真实素材
function accumulateMaterials(rewards) {
  if (!rewards || !rewards.length) return
  const next = { ...sessionMaterials.value }
  for (const r of rewards) {
    // fortune 类型按其 materialKind（pickItem.kind）累计到对应类别
    if (r.type === 'fortune' && r.materialKind && MATERIAL_DISPLAY[r.materialKind]) {
      next[r.materialKind] = (next[r.materialKind] || 0) + (r.amount || 1)
      continue
    }
    // 优先取 type 字段，再回退到 kind 字段（material 对象）
    const key = r.type || r.kind
    if (key && MATERIAL_DISPLAY[key]) {
      next[key] = (next[key] || 0) + (r.amount || 1)
    }
  }
  sessionMaterials.value = next
}
// 生成结算栏展示用的素材汇总（仅含数量>0的项，按固定顺序）
function buildMaterialSummary() {
  return MATERIAL_ORDER.filter(t => sessionMaterials.value[t]).map(t => ({
    type: t,
    name: MATERIAL_DISPLAY[t].name,
    amount: sessionMaterials.value[t],
    icon: MATERIAL_DISPLAY[t].icon
  }))
}

// 角色定位特殊作用（每场战斗后触发）
const ROLE_EFFECTS = {
  vanguard: {
    name: '先锋冲锋',
    effect: (memberState, teamStates) => {
      const bonusPercent = 0.05
      return { type: 'damage_boost', value: bonusPercent, desc: `${memberState.name}发动先锋冲锋，全队攻击力提升 ${formatBuffPercent(bonusPercent)}` }
    }
  },
  blade: {
    name: '刀锋连击',
    effect: (memberState, teamStates) => {
      const bleed = Math.floor((memberState.damage || memberState.attack || 0) * 0.15)
      return { type: 'damage_over_time', value: bleed, desc: `${memberState.name}触发刀锋连击，敌人陷入流血状态，每秒受到 ${bleed} 伤害` }
    }
  },
  herb: {
    name: '药引治疗',
    effect: (memberState, teamStates) => {
      const healAmount = Math.floor((memberState.maxHealth || memberState.maxHP || 0) * 0.15)
      let healed = 0
      for (const ts of teamStates) {
        if (ts.hp > 0 && ts.hp < ts.maxHP) {
          const actualHeal = Math.min(healAmount, ts.maxHP - ts.hp)
          ts.hp += actualHeal
          healed += actualHeal
        }
      }
      return { type: 'heal', value: healed, desc: `${memberState.name}施展药引治疗，为全队恢复 ${healed} 气血` }
    }
  },
  shield: {
    name: '护法护盾',
    effect: (memberState, teamStates) => {
      const absorb = Math.floor((memberState.defense || 0) * 0.2)
      return { type: 'shield', value: absorb, desc: `${memberState.name}开启护法护盾，全队获得吸收 ${absorb} 伤害的护盾` }
    }
  },
  tactician: {
    name: '掌阵阵法',
    effect: (memberState, teamStates) => {
      const buffAmount = 0.1
      return { type: 'attack_buff', value: buffAmount, desc: `${memberState.name}布置掌阵阵法，全队攻击力提升 ${formatBuffPercent(buffAmount)}` }
    }
  }
}
const SKITS = [
  { text: '${m1}在篝火旁给${m2}讲了个笑话，${m2}笑得差点岔气，修炼效率提升了！', buff: { type: 'cultivation', value: 0.15, duration: 5, name: '心情愉悦' } },
  { text: '${m1}发现了一株灵草，${m2}却抢先一步摘走，两人争执不下，${m3}出面调停才平息。', buff: { type: 'combat', value: -0.10, duration: 3, name: '内讧' } },
  { text: '${m1}在山涧中发现了一汪灵泉，大家轮流饮用，感觉精神百倍！', buff: { type: 'combat', value: 0.15, duration: 5, name: '灵泉滋养' } },
  { text: '${m2}修炼时走火入魔，${m1}及时出手相助，两人配合更加默契了。', buff: { type: 'combat', value: 0.10, duration: 5, name: '默契提升' } },
  { text: '夜晚扎营时，${m1}讲起了一段往事，众人陷入沉思，心性有所提升。', buff: { type: 'cultivation', value: 0.10, duration: 4, name: '心性感悟' } },
  { text: '${m3}不慎踩中妖兽陷阱，${m2}奋力救援，虽然脱险但消耗了不少体力。', buff: { type: 'combat', value: -0.12, duration: 3, name: '受惊' } },
  { text: '${m1}与${m2}切磋武艺，剑光交错间双方都有所领悟，攻击力提升了！', buff: { type: 'attack', value: 0.20, duration: 4, name: '切磋增益' } },
  { text: '众人在废弃洞府中发现一处古修士留下的阵法残留，${m1}参悟片刻，灵力恢复加快。', buff: { type: 'cultivation', value: 0.20, duration: 5, name: '阵法感悟' } },
  { text: '${m2}被一只毒虫蛰了，${m3}连忙施药解毒，但大家都有些紧张。', buff: { type: 'combat', value: -0.08, duration: 3, name: '中毒虚惊' } },
  { text: '${m1}发现了一块古碑，拓印下来后发现是失传的功法残篇，众人轮流参悟。', buff: { type: 'cultivation', value: 0.25, duration: 6, name: '功法感悟' } },
  { text: '路遇一位游方老道，${m3}与他攀谈数语，老道满意离去，众人获得一缕气运加持。', buff: { type: 'luck', value: 0.30, duration: 5, name: '气运加持' } },
  { text: '${m1}和${m2}为了争夺一块矿石大打出手，${m3}无奈摇头，士气下降了。', buff: { type: 'combat', value: -0.15, duration: 3, name: '士气低落' } },
  { text: '${m1}夜观星象，预判明日方位大吉，队伍信心倍增。', buff: { type: 'combat', value: 0.12, duration: 4, name: '星象指引' } },
  { text: '众人围坐分享干粮，${m2}拿出了珍藏的灵果，大家恢复了不少体力。', buff: { type: 'combat', value: 0.10, duration: 4, name: '灵果滋补' } },
  { text: '${m3}在溪边洗手时摸到了一枚古丹药，服用后感觉身体轻盈了不少。', buff: { type: 'speed', value: 0.15, duration: 5, name: '身轻如燕' } }
]

// 队伍角色各自的战斗动作描写
const MEMBER_ACTIONS = {
  vanguard: [
    '${n}挺身而出，以凌厉攻势直取敌人要害，「吃我一记！」',
    '${n}浑身灵力爆发，一记重击轰得敌人踉跄后退，战意昂扬！',
    '${n}作为先锋冲入敌阵，剑锋所过之处血光飞溅，气势如虹！',
    '${n}大喝一声，灵力化形巨掌拍下，将敌人按入地面碎石崩飞！',
    '${n}剑走中宫，一往无前！正面对决的气势令敌人不敢硬接！',
    '${n}灵力灌入双臂，一拳轰出如山崩，正面强攻势不可挡！',
    '${n}以身为刃冲入敌群，每一击都带着破釜沉舟的决绝！',
    '${n}真气燃烧至极限，兵刃上灵光暴涨三丈，一剑劈落天崩地裂！',
    '${n}罡气护体直冲敌阵核心，无论多少攻击都挡不住这股锐势！',
    '${n}脚踏罡步，每一击都震得大地微颤，拳拳到肉、势若疯虎！',
    '${n}战意如虹，长啸一声灵力暴涨，一记横扫千军逼退群敌！',
    '${n}以攻代守，连绵攻势如潮水般涌来，根本不给敌人喘息之机！'
  ],
  blade: [
    '${n}身影如鬼魅般闪烁，快剑连斩三道，敌人来不及反应已身中数创！',
    '${n}从侧翼杀出，一刀割过敌人腰际，干净利落、不拖泥带水！',
    '${n}抓住敌人攻击间隙，反手一剑封喉，刁钻而致命！',
    '${n}身形旋转如陀螺，兵刃划出弧月寒光，在敌阵中切割出血路！',
    '${n}隐于暗影中窥伺时机，敌人露出破绽的一瞬——剑光已至咽喉！',
    '${n}以诡异的步法绕至敌后，一记暗刺精准命中灵力薄弱处！',
    '${n}双刃翻飞如蝶，每一道残影后都藏着致命一击！',
    '${n}低身掠过地面，剑尖划出一道弧线，在敌人腿上留下深可见骨的伤痕！',
    '${n}身化流光，在敌人周围游走不停，每一闪现都带来一道新伤！',
    '${n}虚实相生的一剑，敌人挡住了幻影，真剑却已从另一个角度刺入！',
    '${n}无声无息贴身而近，匕首般的短兵直取敌人太阳穴！',
    '${n}反手背刺！敌人的护体灵气在背后形成了一个极小的死角！'
  ],
  herb: [
    '${n}退后一步，指尖凝出碧绿灵光，为${n2}恢复了些许气血！',
    '${n}抛出一枚丹药，灵力化盾护住全队，低声道：「稳住，有我在」',
    '${n}以灵力催动药香，弥漫间队友们感到精力恢复、伤痛减轻。',
    '${n}手法如风，在${n2}背后连点数穴，止住了伤口流血！',
    '${n}取出一枚灵丹塞入${n2}口中，药力化开，伤势肉眼可见地好转！',
    '${n}双手结印，一道柔和的灵光笼罩全队，所有人感到灵力运转顺畅了几分。',
    '${n}从药囊中洒出一片金粉，落在伤口上即刻止血生肌，效果立竿见影！',
    '${n}催动内力，一股温和的暖流注入${n2}经脉，修补着受损的灵脉！',
    '${n}默念清心咒，一道清灵之气弥漫开来，驱散了队友们心头的疲惫与恐惧。',
    '${n}将灵液滴在掌心，双手一合拍出灵雾，全队伤势都在灵雾中缓缓愈合。',
    '${n}轻声念诵疗伤经文，字字化作灵光落向伤者，伤口以肉眼可见的速度愈合！',
    '${n}以银针渡穴之法为${n2}行针，三针落下，面色已由白转红！'
  ],
  shield: [
    '${n}横身挡在队伍前方，护体真气化作金钟罩，硬扛了敌人的狂暴一击！',
    '${n}以肉身吸引火力，大盾横扫逼退敌人，「休想伤我队友！」',
    '${n}稳如磐石，承受了敌人致命一击却纹丝不动，为队友争取了反击时机！',
    '${n}怒目圆睁，浑身护体灵光暴涨，将敌人的攻击尽数弹开！',
    '${n}铁壁横移挡在${n2}身前，以肩头硬接了敌人一记重击，闷哼一声却未退半步！',
    '${n}罡气凝为实质铠甲覆盖全身，敌人的利爪在上面只留下浅浅白痕！',
    '${n}将灵力注入脚下，与大地融为一体，任凭狂风骤雨般的攻击也岿然不动！',
    '${n}怒喝一声，灵力爆发形成护盾，将全队笼罩其中！',
    '${n}以身为墙，每一道攻击打在身上都只留下浅痕，却为队友赢得了宝贵的喘息！',
    '${n}将盾牌猛然顿入地面，灵力激荡形成一面半透明的光墙，挡下了漫天弹雨！',
    '${n}不闪不避正面对冲，以身撞敌，以伤换伤的打法令敌人反而心生畏惧！',
    '${n}运转玄功，皮肤泛起金属光泽，敌人的攻击如同打在铁壁上，铿锵作响！'
  ],
  tactician: [
    '${n}在后方掐指推算，指点道：「左翼包抄，中军压上！」全队攻势大增！',
    '${n}布下一道简易阵法，灵力流转间限制了敌人行动，「此刻，动手！」',
    '${n}冷静分析敌人弱点，高声提醒队友攻击方位，全队效率倍增！',
    '${n}以灵识牵引天地灵气为己用，为队友创造了一个完美的输出窗口！',
    '${n}灵识探入敌阵，精准捕捉到敌方阵型的薄弱环节，「攻其左翼！」',
    '${n}一枚阵旗掷出，灵力在空中编织成网，将敌人的退路尽数封死！',
    '${n}运筹帷幄，提前预判了敌人的攻击路线，全队提前闪避毫发无伤！',
    '${n}以道心推演战局变化，在最关键的时刻发出指令，全队攻势如行云流水！',
    '${n}手指虚画符箓，一道增益阵纹在队友脚下亮起，灵力运转速度骤增！',
    '${n}观察战局后改变阵型，全队位置微调间，攻防效率都提升了一个层次！',
    '${n}引动地脉灵力为己用，战场环境瞬间偏向己方，敌人举步维艰！',
    '${n}掐指一算，高喊：「三息之后它会有一个破绽！」——果不其然！'
  ]
}

// 怪物攻击动作描写
const ENEMY_ATTACK_ACTIONS = {
  normal: [
    '${n}发出低沉咆哮，利爪带着腥风横扫而至，空气被撕裂出刺耳尖啸！',
    '${n}猛地扑跃而起，血盆大口直咬向队伍前排，獠牙上还滴落着涎水！',
    '${n}尾巴如钢鞭般抽击过来，所过之处碎石飞溅、草木成齑！',
    '${n}猛地一跺脚，震得大地微微颤栗，一股冲击波向四周扩散开来！',
    '${n}张口喷出一团腥臭黑雾，雾气所过之处草木瞬间枯萎发黑！',
    '${n}身形陡然加速，化作一道黑影直扑而来，速度快得令人咋舌！',
    '${n}双爪在胸前一划，两道弧形气刃交叉斩出，所过之处寸草不生！',
    '${n}仰头发出震天嘶吼，声波化作实质冲击，震得众人气血翻涌！',
    '${n}猛吸一口气，腹部鼓起如球，随即喷出一道灼热的吐息！',
    '${n}利爪在地面划出深深沟壑，借着反作用力猛冲而至！'
  ],
  elite: [
    '${n}浑身灵光暴涨，气息节节攀升，显然动了真格！一掌拍出灵力凝聚成兽形虚影！',
    '${n}双目猩红，周身煞气凝成实质，化作数道黑色利箭破空射来！',
    '${n}身形一晃分出三道残影，从不同方向同时发动攻击，虚实难辨！',
    '${n}仰天怒吼，天地间灵气竟被牵引而来，在其头顶凝聚成一颗巨大能量球！',
    '${n}利爪撕裂虚空，一道漆黑空间裂缝骤然出现，吞噬着周遭一切！',
    '${n}体表鳞甲泛起幽光，防御力骤增的同时发起了狂暴的连续攻击！',
    '${n}脚踏诡异步法，身形忽左忽右，每一次现身都伴随着致命一击！',
    '${n}张口吐出一颗内丹，内丹悬浮半空放射出万道光芒，攻势倍增！',
    '${n}周身浮现出古老符文，符文流转间威力倍增，一拳轰出地动山摇！',
    '${n}双翼猛地展开，掀起滔天狂风，风中还夹杂着无数风刃！'
  ],
  boss: [
    '${n}威压如山，举手投足间引动天地法则变色，一只遮天巨手凌空拍下！',
    '${n}冷笑一声，指尖凝聚出毁天灭地的能量光束，所过之处空间都在崩碎！',
    '${n}身化万千残影，每一道都拥有本尊八成实力，铺天盖地的攻势从四面八方涌来！',
    '${n}召唤出领域之力，整个战场都被其法则笼罩，众人只觉灵力运转都变得滞涩！',
    '${n}口中念念有词，古老的咒语回响在天地间，降下一道道毁灭神雷！',
    '${n}一掌按向地面，大地崩裂，无尽地火岩浆喷涌而出，化作焚天火海！',
    '${n}双目绽放出慑人神光，两道实质化的目光贯穿虚空，直射众人心神！',
    '${n}召唤出本命法宝，法宝悬于头顶大放异彩，一道道恐怖术法接连不断！',
    '${n}身形暴涨百丈，如远古巨兽般俯瞰众生，一脚踩下仿佛天都要塌了！',
    '${n}施展出禁忌秘术，以自身精血为引，爆发出远超平常的恐怖战力！',
    '${n}操控空间之力，身形在战场中瞬间挪移，每一次出现都带来致命打击！',
    '${n}周身浮现出九道法相，法相同步结印，九道不同属性的攻击同时降临！'
  ]
}

// 战斗特效描写
const COMBAT_EFFECTS = {
  crit: [
    '⚡ 暴击！这一击精准命中要害，敌人发出痛苦的嘶吼，鲜血喷涌而出！',
    '💥 致命一击！灵力在敌人体内轰然爆发，造成了难以置信的伤害！',
    '🎯 完美命中！找到了敌人灵力运转的破绽，这一击的威力提升了数倍！',
    '🔥 暴击！真火焚尽敌人护体灵气，直接作用在其本体之上，焦糊味弥漫开来！',
    '⚔️ 暴击！兵刃深深没入敌人身体，鲜血顺着刃尖滴滴答答洒落一地！'
  ],
  combo: [
    '🌀 连击！攻势如行云流水般连绵不绝，敌人根本无从招架！',
    '⚡ 连击！一快再快，剑光闪烁间敌人已身中数创，毫无还手之力！',
    '💨 连击！身形化作残影，从各个角度发动猛攻，敌人只能被动挨打！',
    '✨ 连击！招式衔接得天衣无缝，一波未平一波又起，彻底压制了敌人！',
    '🗡️ 连击！数道攻击同时命中，每一击都落在相同位置，伤害层层叠加！'
  ],
  dodge: [
    '💨 闪避！身形一侧，堪堪躲过了这记致命攻击，发丝被劲风削断数缕！',
    '🌀 闪避！脚下踏着玄妙步法，在间不容发之际避开了敌人的锋芒！',
    '✨ 闪避！身形如柳絮般轻飘飘荡开，敌人的攻击尽数落空，威势大减！',
    '🌊 闪避！顺着敌人的攻势借力打力，轻巧地从攻击缝隙中穿梭而过！',
    '⚡ 闪避！电光火石间身形挪移，敌人的攻击擦着衣角掠过，好险！'
  ],
  vampire: [
    '🩸 吸血！攻击中带着奇异力量，敌人的气血顺着兵刃流入体内，伤势有所恢复！',
    '🌙 吸血！月牙形的灵力刃划过敌人身体，鲜血化作红光被吸入体内！',
    '💫 吸血！施展出吸血秘术，敌人的生命力正以肉眼可见的速度流失！',
    '🔴 吸血！每一次攻击都抽取着敌人的精气，转化为自身的灵力！',
    '✨ 吸血！血光闪烁间，敌人变得萎靡不振，而我方却精神焕发！'
  ],
  stun: [
    '💫 眩晕！这一击正中敌人头部，它晃了晃脑袋，身形踉跄，一时竟无法行动！',
    '⚡ 眩晕！灵力冲击着敌人的识海，它目光涣散，呆立在原地动弹不得！',
    '🌟 眩晕！神魂震荡，敌人如同被施了定身术一般，直挺挺地站在那里！',
    '🌀 眩晕！天旋地转，敌人连站都站不稳，更别说发动攻击了！',
    '💥 眩晕！一记重击轰在敌人天灵盖上，它眼冒金星，彻底懵了！'
  ],
  counter: [
    '🛡️ 反击！借着敌人攻击的力道顺势反击，这一击来得又快又猛！',
    '⚔️ 反击！敌人攻击落空的瞬间，我方抓住破绽反手一剑，正中要害！',
    '💥 反击！以彼之道还施彼身，敌人的攻势越猛，这记反击就越狠！',
    '🌀 反击！身法一转绕到敌人侧面，趁其旧力已尽新力未生之时发动猛攻！',
    '✨ 反击！卸力之后顺势反攻，敌人避无可避，只能硬生生吃下这一击！'
  ],
  shield: [
    '🛡️ 护盾！一道灵光护盾骤然展开，硬生生挡下了这记杀招，护盾上泛起阵阵涟漪！',
    '💎 护盾！罡气凝为实质铠甲，敌人的攻击打在上面只留下浅浅白痕！',
    '✨ 护盾！护体灵光暴涨，将敌人的攻击尽数弹开，毫发无伤！',
    '🔮 护盾！阵法光芒亮起，一层半透明的光罩笼罩全身，防御力大增！',
    '🌀 护盾！灵力激荡形成防护屏障，任凭狂风骤雨般的攻击也岿然不动！'
  ],
  heal: [
    '💚 治疗！一道碧绿灵光笼罩全身，伤口以肉眼可见的速度愈合着！',
    '🌿 治疗！药力化开，气血翻涌间伤势好转，精神也振奋了不少！',
    '✨ 治疗！温和的灵力游走于四肢百骸，修补着受损的经脉与肉身！',
    '💫 治疗！疗伤圣药效果立竿见影，苍白的面色渐渐变得红润起来！',
    '🌸 治疗！花瓣般的灵光飘落，每一片都带来生机，滋养着受损的躯体！'
  ],
  bleed: [
    '🩸 流血！敌人身上的伤口血流不止，气息渐渐变得虚弱！',
    '🌙 流血！月牙形的伤痕深可见骨，鲜血如泉涌般喷出，染红了地面！',
    '💔 流血：每一次动作都牵扯着伤口，鲜血不断渗出，敌人的动作越来越慢！',
    '🔴 流血：创伤处血液根本无法凝固，敌人的生命力在飞速流逝！',
    '💧 流血：鲜血顺着身体不断滴落，地上已经积了一小滩，敌人面色惨白！'
  ]
}

// ============ 队伍成员挂机状态（每人独立血条和build） ============
const teamMemberStates = ref([])

// 兼容旧版血条变量（ZoneSelector.vue 使用）
const idlePlayerHP = ref(100)
const idlePlayerMaxHP = ref(100)
const idlePlayerDefeated = ref(false)

// 队伍总 Build 强度（所有出战成员之和）
const playerBuildStrength = computed(() => {
  const s = store()
  const team = s.getTeamMembersDetail()
  if (team.length === 0) return s.buildStrength
  // 与宗府页「队伍总战力」口径一致：先求三人 Build 之和，再乘宗派共鸣战力加成
  // （getTeamTotalBuild 内部已封装 base * getResonanceBuildMultiplier）
  return s.getTeamTotalBuild()
})
// 当前地图/难度推荐的 Build 强度（挂机能否成功的基础属性）
const currentRecommendedBuild = computed(() => {
  if (!selectedZone.value) return 0
  const diff = getZoneDifficulty(selectedZone.value, selectedDifficultyKey.value)
  return diff ? (diff.recommendedBuild || 0) : 0
})
// Build 匹配度 = 自身 / 推荐，<1 表示强度不足，可能在挂机中因气血耗尽提前失败
const buildRatio = computed(() => {
  const rec = currentRecommendedBuild.value
  return rec > 0 ? playerBuildStrength.value / rec : 1
})

// 当前生效丹药 buff 列表（用于 UI 显示），自动清理过期项
const activePillBuffList = computed(() => {
  cleanExpiredPillBuffs()
  const s = store()
  const effects = s.getActivePillEffects ? s.getActivePillEffects() : []
  const now = Date.now()
  const typeNames = {
    spiritStoneRate: '灵石获取',
    cultivationRate: '修炼速度',
    expGain: '修为获取',
    dropRate: '掉落加成',
    combatBoost: '战斗加成',
    allAttributes: '全属性'
  }
  return effects.map(buff => {
    const recipe = pillRecipes.find(r => r.id === buff.pillId)
    const remainingMs = Math.max(0, buff.expiresAt - now)
    const remainingSec = Math.ceil(remainingMs / 1000)
    const minutes = Math.floor(remainingSec / 60)
    const seconds = remainingSec % 60
    return {
      ...buff,
      name: recipe?.name || buff.pillId || '未知丹药',
      description: recipe?.description || '',
      typeName: typeNames[buff.type] || buff.type,
      valueText: (buff.value > 0 ? '+' : '') + formatBuffPercent(buff.value || 0),
      remainingText: minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`,
      remainingMs
    }
  })
})

// 在线每场遭遇间隔：2.5 秒（怪物死亡后寻怪2-3秒再进入下次战斗，节奏紧凑）
const ENCOUNTER_INTERVAL = 2500
// 回合内动画延时：等待 BattleStage 播完当前回合的所有动作（攻击/buff/回复/技能/战场情况），
// 每动作 1 秒(ACTION_DELAY)，3玩家队伍约 3-4 动作/回合，故等待约 3.5 秒让动画播完再进入下一回合，
// 避免回合切换太快导致人物抖动频闪
const ROUND_ANIM_DELAY = 3500

let _store = null
function store() {
  if (!_store) _store = usePlayerStore()
  return _store
}

// 清理已过期丹药 buff
function cleanExpiredPillBuffs() {
  const s = store()
  if (!Array.isArray(s.activePillBuffs)) return
  const now = Date.now()
  s.activePillBuffs = s.activePillBuffs.filter(buff => buff.expiresAt > now)
}

// 丹药 buff 加成：读取 playerStore 生效效果，同类型 value 累加并封顶，返回 1 + total
// P0-B：原实现纯加法无封顶，玩家可囤药击穿经济。现对每类增益封顶 +100%（即最大 2 倍）。
const PILL_BUFF_CAPS = {
  spiritStoneRate: 1.0,
  cultivationRate: 1.0,
  dropRate: 1.0,
  expGain: 1.0
}
function getPillBuffMultiplier(type) {
  const s = store()
  cleanExpiredPillBuffs()
  const effects = s.getActivePillEffects ? s.getActivePillEffects() : []
  const total = effects.filter(e => e.type === type).reduce((sum, e) => sum + (e.value || 0), 0)
  const cap = PILL_BUFF_CAPS[type] ?? 2.0
  return 1 + Math.min(cap, total)
}

let idleInterval = null
let idleTimer = null
let visibilityHandler = null // 页面可见性监听器引用（息屏/切后台返回时补算挂机进度）
let isRunning = false // 重入锁
let idleEncounterErrorCount = 0 // 挂机遭遇异常日志去重计数（避免刷屏）
let isFinishingIdle = false // 挂机待结束标志：全队力竭后延迟结束期间置 true，阻止定时器再次触发遭遇
let idleSessionId = 0 // 挂机会话 ID：每次 startIdle 递增，runIdleEncounter 捕获并校验，确保新挂机能中断上一场残留的遭遇循环

// ============ 生动日志文案库（修仙风） ============
// 通用场景（无专属描写时回退）
const SCENES = [
  '林间雾气氤氲如纱，众人屏息敛息，灵识如涟漪般扫过每一寸草木，捕捉着最细微的灵机波动。',
  '山风呼啸掠过乱石，众人踏歌而行、足下生风，对周遭潜藏的煞气浑然不惧。',
  '洞府幽深，火灵翻涌如潮，炽浪扑面而来，将众人的衣袂灼得微微卷曲。',
  '深渊幽暗无光，龙吟隐隐自地底传来，刺骨寒意顺着经脉悄然蔓延周身。',
  '荒原寂寥，白骨皑皑铺成血色长路，冲霄怨气令空气都凝滞了几分。',
  '冰雪封山，琼楼玉宇在朔风中若隐若现，厉风如刀，割得面皮生疼。',
  '残垣断壁间仙光流转，似有古人长叹穿越千年，余音绕梁、久久不散。',
  '混沌虚无之地，法则崩坏、时空错位，每一步都踏在天地裂隙的边缘。',
  '古木参天蔽日，藤蔓缠绕如蛇，潮湿的空气中弥漫着腐叶与灵药混杂的气息。',
  '涧水潺潺，灵鱼跃出水面溅起一串珍珠般的水珠，两岸奇花异草争相绽放。',
  '断崖之上云海翻涌，夕阳将天际染成一片赤金，远处群峰如岛浮于云涛之上。',
  '幽谷深处传来悠远的钟声，每一下都震得灵台清明、神魂安定。',
  '石林嶙峋如剑丛，风穿其间发出尖锐的啸声，似有万千亡魂在哀嚎。',
  '月华如练倾泻而下，映得山间溪流银光粼粼，夜风送来若有若无的花香。',
  '雷云低垂，电蛇在厚重的云层中游走，空气中的灵力浓稠得几乎凝为实质。',
  '古战场遗迹遍地残戈，锈蚀的兵刃上依稀可见当年的道纹铭刻。'
]
// 八图专属探索描写（更详尽、各有意境）
const ZONE_SCENES = {
  forest_edge: [
    '林缘古木参天，藤蔓垂落如帘，拨开半人高的荒草，听见远处灵兽啃噬浆果的细响。',
    '晨露未晞，林间浮起一层淡金灵雾，踩着湿润的苔径，灵识悄然探入树海深处。',
    '松涛阵阵如潮，落叶铺满小径，一缕花香从密林深处飘来，引得众人加快了脚步。',
    '老树根须盘踞如龙，脚下苔藓厚软如毯，偶尔有灵蝶翩翩掠过，留下荧光点点。',
    '暮色四合，林间升起淡蓝色灵雾，树影幢幢间似有精怪窥视，令人背脊微凉。'
  ],
  misty_valley: [
    '雾谷终年云雾缭绕，能见度不过丈许，以灵识代目，循着一缕若有若无的灵泉之音前行。',
    '谷中雾气忽聚忽散，隐约现出一座半塌的石桥，桥下灵泉汩汩，映着朦胧月色。',
    '浓雾中传来断断续续的琴声，如泣如诉，辨不清方向，只觉灵力被牵引着微微波动。',
    '踩在湿滑的青石上，雾气沾衣欲湿，远处隐约有灯火明灭，不知是仙是妖。',
    '雾中偶现奇花，花瓣上凝着露珠如宝石，伸手去摘却又在指间化作灵雾散去。'
  ],
  phoenix_cave: [
    '火凤洞内岩浆奔流如河，热浪扭曲了视线，运转护体真气，踏着冷却的玄武岩步步深入。',
    '洞壁嵌满赤红火晶，每一次心跳都仿佛与地火共鸣，焦糊的硫磺味扑面而来。',
    '岩壁上的火纹时明时暗，像是某种古老的封印，炽热的气流卷着火星扑面而来。',
    '地底传来低沉的轰鸣，脚下的岩石微微震颤，一道火柱从裂缝中喷涌而出！',
    '洞顶倒悬着钟乳石，其上流淌着火红的熔岩，映得整个洞穴如血般殷红。'
  ],
  dragon_abyss: [
    '龙渊深不见底，黑水之上寒气凝结成霜，御风悬于渊口，隐约瞥见水底有庞然黑影游弋。',
    '渊底龙吟低沉如雷，震得崖壁簌簌落石，屏息凝神，灵识小心翼翼探向那片幽暗。',
    '崖壁上的古老道纹散发着微弱光芒，似在诉说着远古龙族于此陨落的传说。',
    '深渊中偶尔浮起巨大的气泡，破裂时释放出浓郁的龙气，吸入体内竟隐隐有龙吟回响。',
    '渊底黑水忽然翻涌，一个巨大的漩涡缓缓成形，似有什么东西即将从深渊中苏醒。'
  ],
  ghost_wasteland: [
    '鬼荒之地白骨蔽野，残魂如萤火飘荡，凄厉怨啸缠上神魂，以清心诀压下心头寒意。',
    '断戟朽甲散落满地，一缕缕黑气自尸骸中渗出，汇成偌大的怨气漩涡缓缓旋转。',
    '荒原尽头矗立着一座歪斜的石碑，上面的文字已被岁月侵蚀殆尽，只余森森鬼气。',
    '脚下的泥土呈暗红色，每踩一步都有细微的哀嚎从地底渗出，令人毛骨悚然。',
    '一阵阴风掠过，枯草沙沙作响，恍惚间似有无数幽魂在荒原上列阵行军。'
  ],
  ice_palace: [
    '冰宫玉砌银装，千年不化的玄冰倒悬如剑，每一步落足都激起清脆如磬的回响。',
    '宫殿深处宝光莹莹，冰封的仙池下似有残阵流转，朔风卷着冰屑拂过眉间。',
    '冰墙上封存着远古修士的身影，面容栩栩如生，仿佛下一刻就会破冰而出。',
    '穹顶悬挂着巨大的冰晶吊灯，折射出七彩霞光，照亮了殿中冰封的千军万马。',
    '冰宫深处传来悠扬的仙乐，循声而去只见一汪冰池，池中莲开并蒂、灵光流转。'
  ],
  immortal_ruins: [
    '仙墟断壁残垣爬满古老的道纹，虽已残破，仍透出令人心悸的法则余威。',
    '废墟中央矗立半截碑文，字迹被岁月蚀去大半，驻足凝望，似有所悟又怅然若失。',
    '破碎的阵盘仍在缓缓运转，投下的光影在地面画出复杂的纹路，隐约可辨星宿方位。',
    '坍塌的藏书阁中散落着残卷，纸页虽已泛黄，上面的金文仍在微微发光。',
    '一道空间裂缝在废墟上空时开时合，偶尔有仙器碎片从裂缝中坠落，引发灵力风暴。'
  ],
  chaos_realm: [
    '混沌界中五行颠倒、光暗交错，脚下的大地时而化为流沙、时而凝作坚铁。',
    '此处时空如碎镜，看见数个残影在不同方向行走，法则的碎屑在指缝间流过。',
    '混沌灵气狂暴无序，每一次呼吸都像是在吞咽刀锋，灵力运转变得艰难而迟缓。',
    '天地间没有上下之分，悬浮在虚空之中，远处有星域崩塌的壮观景象正在上演。',
    '混沌深处传来太古的回响，似开天辟地之初的声浪，震得神魂几欲离体而出。'
  ]
}
// 敌人现身描写（按层级）
const ENEMY_APPEAR = {
  boss: [
    (n) => `👑 天穹骤暗，${n} 自虚空裂隙中降临，威压如万钧大山轰然压下，天地为之失色！`,
    (n) => `👑 一声长啸震碎云霄，${n} 裹挟滔天煞气现身，周遭法则都在其怒意下微微颤栗！`,
    (n) => `👑 大地震裂，${n} 从地底深渊中缓缓升腾，万兽伏地、百鸟惊飞！`,
    (n) => `👑 虚空震荡，${n} 踏着血色祥云而来，每一次呼吸都引发灵力海啸！`,
    (n) => `👑 天雷劈落，${n} 在电光中显现真身，恐怖的灵压令空间都出现了裂痕！`
  ],
  elite: [
    (n) => `⚡ 一股凶煞之气破空袭来——${n}（精英）自暗影中横空而出，双目猩红、气势逼人！`,
    (n) => `⚡ 林木倒卷，${n}（精英）踏碎山石逼近，鳞甲上还沾着未干的温热血迹！`,
    (n) => `⚡ 灵气骤然凝滞，${n}（精英）如鬼魅般现身，浑身灵光流转不定！`,
    (n) => `⚡ 一道黑影掠过头顶，${n}（精英）凌空而降，落地之处碎石崩飞！`,
    (n) => `⚡ ${n}（精英）从地底钻出，泥土飞溅间已露出满口獠牙！`
  ],
  normal: [
    (n) => `一头${n}自草莽暗处扑出，獠牙森森、腥风扑面，杀意凛然！`,
    (n) => `${n}自岩后悄然探出头颅，目光如钩，死死锁定了猎物！`,
    (n) => `前方传来窸窣响动，${n}从灌木丛中窜出，挡住了去路！`,
    (n) => `一阵怪风卷过，${n}的身影在烟尘中若隐若现，杀气蒸腾！`,
    (n) => `${n}从水潭中一跃而起，水花四溅间已张开了血盆大口！`,
    (n) => `枯木后传来低沉的咆哮，${n}缓缓走出，铜铃般的巨目中满是凶光！`,
    (n) => `${n}自崖顶俯冲而下，利爪划破空气发出尖锐的啸声！`,
    (n) => `草丛中一阵沙沙作响，${n}钻出巢穴，对闯入者露出了敌意。`
  ]
}
// 战斗动作（带招式名，多段描写）
const COMBAT_ACTIONS = [
  { type: 'combat', text: '⚡ 剑光一闪，破空之声尚未落下，敌人的护体灵气已被撕裂！' },
  { type: 'combat', text: '🔥 凌厉的灵力波动横扫而出，灼热的气浪将周遭草木都卷入其中！' },
  { type: 'combat', text: '🌀 身形闪动如残影，数道剑气从不同角度同时命中！' },
  { type: 'combat', text: '🛡️ 一道灵光护盾骤然展开，硬生生挡下了这记杀招！' },
  { type: 'combat', text: '🌟 灵力灌入兵刃，一道璀璨剑芒破空斩出，直取要害！' },
  { type: 'combat', text: '💥 一记重掌拍出，掌风裹挟着碎裂的虚空气劲，轰然炸响！' },
  { type: 'combat', text: '🗡️ 剑走偏锋，刁钻的角度绕过防御，在敌人侧肋留下一道血痕！' },
  { type: 'combat', text: '❄️ 寒气凝冰，一道冰棱穿射而出，将敌人的行动迟滞了半息！' },
  { type: 'combat', text: '🔥 真火焚天，烈焰吞没方圆数丈，敌人被灼得连连后退！' },
  { type: 'combat', text: '⚡ 雷霆万钧！一道天雷凭空劈落，正中敌人天灵！' },
  { type: 'combat', text: '🌊 灵潮涌动，无形压力笼罩战场，敌人的灵力运转骤然凝滞！' },
  { type: 'combat', text: '🗡️ 杀意凝为实质，一柄虚影长剑直刺敌人神魂！' },
  { type: 'combat', text: '💥 拳劲透体而出，闷响声中敌人的护体灵光碎裂如琉璃！' },
  { type: 'combat', text: '🌀 阵法余韵流转，脚下灵纹一闪，攻击威力暴增数分！' },
  { type: 'combat', text: '🛡️ 金钟罩震荡不休，将敌人的攻势尽数弹飞！' },
  { type: 'combat', text: '🌟 灵识锁定气机破绽，一记精准刺击贯穿了敌人的防御空隙！' },
  { type: 'combat', text: '❄️ 冰魄寒光掠过，敌人的动作慢了半拍，露出致命破绽！' },
  { type: 'combat', text: '⚡ 遁光一闪绕至身后，反手一剑在敌人背心划出三尺血槽！' },
  { type: 'combat', text: '🔥 灵力化形为凤凰虚影，展翅俯冲而下，焚尽一切！' },
  { type: 'combat', text: '🌊 巨浪灵力排山倒海涌来，敌人立足不稳被冲出数丈！' },
  { type: 'combat', text: '💥 一记肘击贴身轰出，灵力透体爆发，敌人闷哼一声口溢鲜血！' },
  { type: 'combat', text: '🗡️ 剑意纵横交织成网，将敌人困于方寸之间动弹不得！' },
  { type: 'combat', text: '🌟 一道冲天灵柱拔地而起，将敌人掀翻在地！' },
  { type: 'combat', text: '⚡ 罡风裹挟细碎雷弧，密集如雨点般轰击在敌人身上！' },
  { type: 'combat', text: '❄️ 霜华漫天飞舞，每一片冰晶都裹着锋锐的灵力碎片！' },
  { type: 'combat', text: '🔥 三昧真火凝于指尖，一指点出，火蛇咆哮着扑向敌人！' },
  { type: 'combat', text: '🌀 虚空震荡，一掌拍出竟是隔空伤敌，掌印印在敌人胸口！' },
  { type: 'combat', text: '🛡️ 铁壁横移，以身为盾硬抗攻击后反手一撞，震得敌人气血翻涌！' },
  { type: 'combat', text: '🌊 潮汐灵力一涨一落，敌人的攻势在潮涌间被化解殆尽！' },
  { type: 'combat', text: '💥 蓄力已久的一拳终于轰出，拳风过处虚空都微微扭曲！' },
]
const VICTORY_LINES = [
  (e) => `🗡️ ${e} 轰然倒地，尘烟散尽，众人悠然收兵，衣袂不染纤尘。`,
  (e) => `✨ ${e} 在连绵攻势中溃散成灵光碎屑，消弭于天地之间。`,
  (e) => `🌿 ${e} 力竭倒伏，众人神色淡然，仿佛只是拂去肩头落雪。`,
  (e) => `🔥 ${e} 化作飞灰，余烬中散出的灵气被众人尽数吸收。`,
  (e) => `⚡ ${e} 授首殒命，一道灵光从其体内飞出，融入了战利品中。`,
  (e) => `🌟 ${e} 终于伏诛，战场上残留的灵力波动渐渐平息。`,
  (e) => `🌊 ${e} 在潮汐般的攻势下崩溃瓦解，再无还手之力。`,
  (e) => `❄️ ${e} 被冰封在最后一击中，姿态定格于绝望的一瞬。`,
  (e) => `💥 ${e} 承受不住最后一记重击，身躯炸裂化作漫天灵光！`,
  (e) => `🛡️ ${e} 精疲力竭，再也无法维持战斗姿态，颓然倒地。`,
  (e) => `🗡️ 剑光一收，${e} 已无声倒下，鲜血在地面洇开如花。`,
  (e) => `✨ 灵力最后一波爆发将${e}彻底击溃，战场归于沉寂。`,
]
const DEFEAT_LINES = [
  (e, l) => `😱 不敌 ${e} 之威，众人狼狈遁走，灵力枯竭，折损修为 ${l} 点。`,
  (e, l) => `💢 ${e} 一击重创全队，众人险象环生、踉跄败退，折损修为 ${l} 点。`,
  (e, l) => `🩸 ${e} 的攻势势不可挡，队伍被迫后撤，折损修为 ${l} 点。`,
  (e, l) => `💀 ${e} 释放了毁灭性一击，全队溃散，折损修为 ${l} 点。`,
  (e, l) => `😤 ${e} 的反击凌厉无比，队伍扛不住压力被迫撤退，折损修为 ${l} 点。`,
  (e, l) => `⚠️ 敌人实力远超预期，${e} 的威压令全队气血逆流，折损修为 ${l} 点。`,
  (e, l) => `💢 战局急转直下，${e} 抓住破绽一击得手，队伍仓皇后撤，折损修为 ${l} 点。`,
  (e, l) => `😱 ${e} 气势如虹，全队抵挡不住这股洪流，折损修为 ${l} 点。`,
]
const FORTUNE_LINES = [
  (n) => `🌀 机缘巧合，于石缝灵脉间寻得${n}，此乃天赐造化，福缘匪浅！`,
  (n) => `🌿 一株${n}破土而生、灵光流转，小心翼翼采下，周身灵气为之一振！`,
  (n) => `✨ 奇遇骤降，于残阵中寻得${n}，宝光温润，似有古老封印仍未散去。`,
  (n) => `🌟 一道灵光引路，在隐秘角落发现了${n}，当真是造化弄人！`,
  (n) => `🔥 烈焰退去后露出了${n}的踪迹，赶在灵机消散前将其收好。`,
  (n) => `❄️ 冰层之下隐有灵气涌动，破冰之后竟得${n}，令人惊喜！`,
  (n) => `⚡ 雷击之地灵气汇聚，从碎裂的石缝中拾得${n}！`,
  (n) => `🌊 潮水退去，岸边的灵石间竟露出了${n}的光芒，实乃天赐！`,
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a

// 日志分类优先级（数字越小越先显示）
// 1=玩家队伍攻击和反应, 2=怪物攻击和反应, 3=战场状态/buff, 4=获得物品/奖励
const LOG_CATEGORY_ORDER = {
  // 玩家队伍攻击和反应
  'combat': 1,
  // 怪物攻击和反应
  'enemy-normal': 2,
  'enemy-elite': 2,
  'enemy-boss': 2,
  // 战场状态/buff/场景
  'header': 3,
  'scene': 3,
  'skit': 3,
  'victory': 3,
  'defeat': 3,
  'warning': 3,
  // 获得物品/奖励
  'reward-normal': 4,
  'fortune': 4,
  'drop-common': 4,
  'drop-uncommon': 4,
  'drop-rare': 4,
  'drop-epic': 4,
  'drop-legendary': 4,
  'drop-mythic': 4,
}

const pendingLogs = ref([])
let logDisplayTimer = null
let firstPendingLogTime = 0

const showPendingLog = () => {
  if (pendingLogs.value.length === 0) {
    firstPendingLogTime = 0
    if (logDisplayTimer) {
      clearInterval(logDisplayTimer)
      logDisplayTimer = null
    }
    return
  }

  const now = Date.now()
  const timeSinceFirstLog = now - firstPendingLogTime

  if (timeSinceFirstLog >= 14000) {
    while (pendingLogs.value.length > 0) {
      const next = pendingLogs.value.shift()
      logs.value.push(next)
    }
    firstPendingLogTime = 0
    if (logs.value.length > 400) logs.value = logs.value.slice(-400)
    if (logDisplayTimer) {
      clearInterval(logDisplayTimer)
      logDisplayTimer = null
    }
    return
  }

  const next = pendingLogs.value.shift()
  if (next) {
    logs.value.push(next)
    if (logs.value.length > 400) logs.value = logs.value.slice(-400)
  }
}

function addLog(type, text, detail = null, avatar = null, parts = null) {
  if (!isIdling.value) {
    logs.value.push({ type, text, detail, avatar, parts, time: new Date().toLocaleTimeString() })
    if (logs.value.length > 400) logs.value = logs.value.slice(-400)
    return
  }

  if (pendingLogs.value.length === 0) {
    firstPendingLogTime = Date.now()
  }
  pendingLogs.value.push({ type, text, detail, avatar, parts, time: new Date().toLocaleTimeString() })

  if (!logDisplayTimer) {
    showPendingLog()
    logDisplayTimer = setInterval(showPendingLog, 1000)
  }
}

const flushAllPendingLogs = () => {
  if (logDisplayTimer) {
    clearInterval(logDisplayTimer)
    logDisplayTimer = null
  }
  while (pendingLogs.value.length > 0) {
    const next = pendingLogs.value.shift()
    logs.value.push(next)
  }
  if (logs.value.length > 400) logs.value = logs.value.slice(-400)
}

// 将装备/灵宠的基础数据格式化为日志明细子行
function formatItemDetail(item, type, rarity) {
  if (!item) return ''
  const st = item.stats || item.combatAttributes || {}
  // 使用普通空格和 ASCII 分隔符替代全角空格（U+3000），避免部分设备渲染为乱码方块
  if (type === 'equipment') {
    let s = `攻+${st.attack ?? 0} 生+${st.health ?? 0} 防+${st.defense ?? 0} 速+${st.speed ?? 0}`
    const affixes = item.affixes || []
    if (affixes.length) s += ' | ' + affixes.map(a => a.name).join('·')
    if (item.setId) {
      const setData = setBonuses.find(x => x.id === item.setId)
      if (setData) s += ' | 套装·' + setData.name
    }
    return s
  }
  if (type === 'pet') {
    const rName = (rarityInfo[rarity] && rarityInfo[rarity].name) || ''
    return `${rName}灵宠 攻+${st.attack ?? 0} 防+${st.defense ?? 0} 生+${st.health ?? 0}`
  }
  return ''
}

// ============ 奖励品质信息 ============
const rarityInfo = {
  common: { name: '凡品', color: '#aaaaaa', tier: 'normal' },
  uncommon: { name: '良品', color: '#88cc44', tier: 'normal' },
  rare: { name: '稀有', color: '#4488ff', tier: 'highlight' },
  epic: { name: '史诗', color: '#aa44ff', tier: 'epic' },
  legendary: { name: '传说', color: '#ff8800', tier: 'epic' },
  mythic: { name: '仙品', color: '#ff4444', tier: 'legendary' },
  mortal: { name: '凡品灵宠', color: '#32CD32', tier: 'normal' },
  spiritual: { name: '灵品灵宠', color: '#1E90FF', tier: 'highlight' },
  mystic: { name: '玄品灵宠', color: '#9932CC', tier: 'epic' },
  celestial: { name: '仙品灵宠', color: '#FFD700', tier: 'legendary' },
  divine: { name: '神品灵宠', color: '#FF0000', tier: 'legendary' }
}

// 稀有度 → 特效档位（用于日志/弹窗的分级表现）。凡品/凡品灵宠为 plain（不改动显示规则）。
const RARITY_TIER = {
  common: 'plain', uncommon: 'uncommon', rare: 'rare', epic: 'epic', legendary: 'legendary', mythic: 'mythic',
  mortal: 'plain', spiritual: 'uncommon', mystic: 'epic', celestial: 'legendary', divine: 'mythic'
}

// 品质权重：按稀有度梯度递减，高品质极低
const EQUIP_RARITY_WEIGHTS = {
  common: 500, uncommon: 150, rare: 40, epic: 10, legendary: 0.3, mythic: 0.075
}
const PET_RARITY_WEIGHTS = {
  mortal: 500, spiritual: 80, mystic: 6, celestial: 0.45, divine: 0.075
}

// Boss 奖励倍率：数量型奖励 Boss 是普怪的 10 倍（仅放大产出数量，不触碰爆率 chance）
const BOSS_REWARD_MULT = 10
// Boss 品质权重：列表中最高稀有度档权重 ×10（其余档不变），使高稀有度/高评分物品
// 获取期望 ≈ 普怪 10 倍；爆率 chance 全程不变，仅命中后的品质分布向高档倾斜。
function bossRarityWeights(rarityList, baseWeights) {
  const w = {}
  const maxIdx = rarityList.length - 1
  rarityList.forEach((r, i) => {
    w[r] = (baseWeights[r] || 1) * (i === maxIdx ? BOSS_REWARD_MULT : 1)
  })
  return w
}

// 从 rarity 数组中按权重随机选择品质（而非等概率）
function pickRarityByWeight(rarityList, weightMap) {
  if (!rarityList || rarityList.length === 0) return 'common'
  if (rarityList.length === 1) return rarityList[0]
  const weights = rarityList.map(r => weightMap[r] || 1)
  const total = weights.reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (let i = 0; i < rarityList.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return rarityList[i]
  }
  return rarityList[rarityList.length - 1]
}

// 各品质掉落的日志文案（越稀有描写越华丽）。plain 单独走普通格式。
const DROP_TEXT = {
  uncommon:  { word: '获得', flair: '，微光初绽' },
  rare:      { word: '获得', flair: '，蓝光流转' },
  spiritual: { word: '收服', flair: '，灵光乍现' },
  epic:      { word: '获得', flair: '，紫气东来' },
  mystic:    { word: '收服', flair: '，玄光环绕' },
  legendary: { word: '获得', flair: '，金光万丈，天地同贺' },
  celestial: { word: '收服', flair: '，仙光普照' },
  mythic:    { word: '获得', flair: '，神辉冲霄，异象惊世' },
  divine:    { word: '收服', flair: '，神兽降世，瑞彩千条' }
}

function buildDropParts(reward, info) {
  const rarity = reward.rarity
  const iconUrl = REWARD_ICON_MAP[reward.slot] || REWARD_ICON_MAP[reward.type] || null
  if (rarity === 'common' || rarity === 'mortal') {
    const word = reward.type === 'pet' ? '收服' : '获得'
    return [
      { icon: iconUrl, text: '' },
      { icon: null, text: `${word}【${reward.name}】（${info.name}）` }
    ]
  }
  const t = DROP_TEXT[rarity] || DROP_TEXT.uncommon
  return [
    { icon: iconUrl, text: '' },
    { icon: null, text: `${t.word}【${reward.name}】${t.flair}！` }
  ]
}

// 合并难度参数，生成一个「有效区域」供战斗/奖励逻辑使用
function buildEffectiveZone(zone, diff) {
  return {
    ...zone,
    rewardMultiplier: diff.rewardMultiplier,
    recommendedStats: diff.recommendedStats,
    difficultyLabel: diff.label,
    difficultyColor: diff.color,
    enemyScale: diff.enemyScale,
    dropBonus: diff.dropBonus,
    difficulty: diff.difficulty
  }
}

// ============ 装备 / 灵宠 / 敌人生成 ============
const SLOTS = ['artifact', 'head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'necklace', 'ring1', 'ring2', 'belt']
const RARITY_MULT = { common: 1, uncommon: 1.3, rare: 1.8, epic: 2.5, legendary: 4, mythic: 7 }

// 使用真实装备名库（与抽卡系统一致），避免挂机产出「良品戒」这类虚拟命名
function getEquipName(slot, rarity, setId = null) {
  const nameParts = equipmentNameParts[slot] || ['未知']
  const nameBase = nameParts[Math.floor(Math.random() * nameParts.length)]
  const qualityName = (rarityConfig[rarity] || {}).name || rarity
  if (setId) {
    const setData = setBonuses.find(s => s.id === setId)
    if (setData) return `${setData.name}·${nameBase}`
  }
  return `${nameBase}·${qualityName}`
}

function generateEquipment(rarity, effectiveZone) {
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)]
  const mult = RARITY_MULT[rarity] || 1
  const affixes = getAffixesForSlot(slot, rarity)
  let setId = null
  if (['epic', 'legendary', 'mythic'].includes(rarity) && Math.random() < 0.3) {
    const availableSets = setBonuses.filter(s => s.pieces.includes(slot))
    if (availableSets.length > 0) setId = availableSets[Math.floor(Math.random() * availableSets.length)].id
  }
  return {
    id: Date.now() + Math.random(),
    type: 'equipment',
    slot,
    name: getEquipName(slot, rarity, setId),
    quality: rarity,
    rarity,
    qualityInfo: { name: (rarityConfig[rarity] || {}).name || rarity, color: (rarityConfig[rarity] || {}).color || '#999' },
    stats: {
      attack: Math.floor(effectiveZone.recommendedStats.attack * 0.22 * mult),
      health: Math.floor(effectiveZone.recommendedStats.health * 0.16 * mult),
      defense: Math.floor(effectiveZone.recommendedStats.attack * 0.13 * mult),
      speed: Math.floor(8 * mult)
    },
    affixes,
    setId,
    enhanceLevel: 0,
    value: Math.floor(50 * effectiveZone.difficulty * mult)
  }
}

function generatePet(rarity, effectiveZone) {
  const petNames = ['灵狐', '仙鹤', '青鸾', '玉兔', '玄龟', '朱雀', '白虎', '麒麟']
  // 与抽卡灵宠一致：输出 combatAttributes，使出战/升级/显示逻辑统一生效
  const rarityMult = { mortal: 1, spiritual: 1.5, mystic: 2, celestial: 3, divine: 5 }[rarity] || 1
  const zAtk = effectiveZone.recommendedStats.attack
  const zHp = effectiveZone.recommendedStats.health
  const combatAttributes = {
    attack: Math.floor(zAtk * 0.16 * rarityMult),
    defense: Math.floor(zAtk * 0.09 * rarityMult),
    health: Math.floor(zHp * 0.09 * rarityMult),
    speed: Math.floor(6 * rarityMult),
    critRate: Math.min(0.5, 0.05 * rarityMult),
    comboRate: Math.min(0.5, 0.05 * rarityMult),
    counterRate: Math.min(0.5, 0.04 * rarityMult),
    stunRate: Math.min(0.5, 0.04 * rarityMult),
    dodgeRate: Math.min(0.5, 0.05 * rarityMult),
    vampireRate: Math.min(0.5, 0.04 * rarityMult),
    critResist: Math.min(0.5, 0.04 * rarityMult),
    comboResist: Math.min(0.5, 0.04 * rarityMult),
    counterResist: Math.min(0.5, 0.04 * rarityMult),
    stunResist: Math.min(0.5, 0.04 * rarityMult),
    dodgeResist: Math.min(0.5, 0.04 * rarityMult),
    vampireResist: Math.min(0.5, 0.04 * rarityMult),
    healBoost: 0,
    critDamageBoost: 0,
    critDamageReduce: 0,
    finalDamageBoost: 0,
    finalDamageReduce: 0,
    combatBoost: 0,
    resistanceBoost: 0
  }
  return {
    id: Date.now() + Math.random(),
    type: 'pet',
    name: petNames[Math.floor(Math.random() * petNames.length)],
    rarity,
    level: 1,
    star: 0,
    combatAttributes
  }
}

function createPlayerEntity() {
  const s = store()
  // 战斗单位直接采用「最终属性」（自然属性 + 已装备 + 套装 + 出战灵宠），
  // 与人物属性对照面板、Build 计算口径完全一致，确保装备/灵宠真实作用于战斗。
  const eff = s.getEffectiveStats
  const baseStats = {
    health: eff.health || 0,
    damage: eff.attack || 0,
    defense: eff.defense || 0,
    speed: eff.speed || 0,
    critRate: eff.critRate || 0,
    comboRate: eff.comboRate || 0,
    counterRate: eff.counterRate || 0,
    stunRate: eff.stunRate || 0,
    dodgeRate: eff.dodgeRate || 0,
    vampireRate: eff.vampireRate || 0,
    critResist: eff.critResist || 0,
    comboResist: eff.comboResist || 0,
    counterResist: eff.counterResist || 0,
    stunResist: eff.stunResist || 0,
    dodgeResist: eff.dodgeResist || 0,
    vampireResist: eff.vampireResist || 0,
    healBoost: eff.healBoost || 0,
    critDamageBoost: eff.critDamageBoost || 0,
    critDamageReduce: eff.critDamageReduce || 0,
    finalDamageBoost: eff.finalDamageBoost || 0,
    finalDamageReduce: eff.finalDamageReduce || 0,
    combatBoost: eff.combatBoost || 0,
    resistanceBoost: eff.resistanceBoost || 0,
    spiritDamage: s.spirit * 0.1,
    maxHealth: s.baseAttributes.health
  }
  // 注意：s.baseAttributes 已由 store.recomputeAttributes 统一烘焙「装备 + 套装 + 出战灵宠」的全部加成，
  // 此处直接读取即可，切勿再叠加 getPetBonus / artifactBonuses，否则会造成双重计算、属性翻倍。
  return new CombatEntity(s.name, s.level, baseStats, s.realm)
}

// BOSS 整体实力倍率：用户要求将 BOSS 整体实力提升
// 统一应用于所有 BOSS 战斗数值（血量/攻击/防御/速度），不影响 zones.js 资料卡显示数值
const BOSS_POWER_MULTIPLIER = 1.8

// 后期秘境额外强化系数（小怪与 BOSS 共用）
// 用户反馈：凤凰窟之后的秘境怪物实力羸弱，需要重点强化
// 越往后倍率越高，让后期秘境对高 build 玩家仍具威胁，但前期秘境保持轻量影响
const LATE_ZONE_ENEMY_MULT = {
  phoenix_cave: 1.15,
  dragon_abyss: 1.30,
  ghost_wasteland: 1.50,
  ice_palace: 1.70,
  immortal_ruins: 2.00,
  chaos_realm: 2.30
}

// 获取秘境的后期强化倍率（前期秘境返回 1，无影响）
function getLateZoneMult(zoneId) {
  return LATE_ZONE_ENEMY_MULT[zoneId] || 1
}

function createBossEnemy(bossData, effectiveZone) {
  const secretLv = effectiveZone.difficulty
  // boss 基础 stats 现已与 recommendedStats（凶险档）量级对齐，
  // 再按 enemyScale 缩放：游历0.30/试炼0.60/凶险1.00/绝境1.60/灭世2.50
  // 这样灭世档 boss 是凶险档的 2.5 倍，避免高难度档仍被秒杀。
  // 应用 BOSS_POWER_MULTIPLIER（1.8 倍）+ 后期秘境额外倍率（LATE_ZONE_ENEMY_MULT）
  const scale = effectiveZone.enemyScale || 1
  const lateMult = getLateZoneMult(effectiveZone.id)
  const totalBossMult = BOSS_POWER_MULTIPLIER * lateMult
  const scaledHealth = Math.floor(bossData.stats.health * scale * totalBossMult)
  const scaledAttack = Math.floor(bossData.stats.attack * scale * totalBossMult)
  const scaledDefense = Math.floor((bossData.stats.defense || 0) * scale * totalBossMult)
  const scaledSpeed = Math.floor((bossData.stats.speed || 10) * BOSS_POWER_MULTIPLIER * Math.sqrt(lateMult))
  // 高难度档 boss 附加额外战斗属性，让其对高 build 玩家有真实威胁
  // combatBoost 提升自身全部战斗属性（攻击/速度/暴击等综合）
  const bossCombatBoost = Math.min(0.6, Math.max(0, (scale - 1) * 0.22) + (lateMult - 1) * 0.15)
  // finalDamageBoost 提升最终伤害（独立乘区），后期秘境 boss 显著强化
  const bossFinalDamageBoost = Math.min(0.6, 0.1 + Math.max(0, (scale - 1) * 0.22) + (lateMult - 1) * 0.18)
  // finalDamageReduce 让 boss 抗打（降低承受伤害）
  const bossFinalDamageReduce = Math.min(0.5, Math.max(0, (scale - 1) * 0.18) + (lateMult - 1) * 0.12)
  const baseStats = {
    health: scaledHealth,
    maxHealth: scaledHealth,
    damage: scaledAttack,
    defense: scaledDefense,
    speed: scaledSpeed,
    critRate: Math.min(0.35, 0.05 + secretLv * 0.02),
    comboRate: Math.min(0.2, 0.02 + secretLv * 0.01),
    counterRate: Math.min(0.2, 0.02 + secretLv * 0.01),
    stunRate: Math.min(0.15, 0.02 + secretLv * 0.006),
    dodgeRate: Math.min(0.2, 0.03 + secretLv * 0.015),
    vampireRate: Math.min(0.15, 0.02 + secretLv * 0.006),
    critResist: Math.min(0.25, 0.05 + secretLv * 0.02),
    comboResist: Math.min(0.25, 0.05 + secretLv * 0.02),
    counterResist: Math.min(0.25, 0.05 + secretLv * 0.02),
    stunResist: Math.min(0.25, 0.05 + secretLv * 0.02),
    dodgeResist: Math.min(0.25, 0.05 + secretLv * 0.02),
    vampireResist: Math.min(0.25, 0.05 + secretLv * 0.02),
    healBoost: 0,
    critDamageBoost: 0.5,
    critDamageReduce: 0,
    finalDamageBoost: bossFinalDamageBoost,
    finalDamageReduce: bossFinalDamageReduce,
    combatBoost: bossCombatBoost,
    resistanceBoost: 0
  }
  const enemy = new CombatEntity(bossData.name, effectiveZone.minLevel, baseStats, 'BOSS')
  enemy.tier = 'boss'
  enemy.bossId = bossData.id
  enemy.bossData = bossData
  return enemy
}

function generateBossEnemies(effectiveZone, difficultyKey) {
  const bosses = []
  if (!effectiveZone.bosses || effectiveZone.bosses.length === 0) return bosses
  
  const bossChance = getBossEncounterChance(difficultyKey)
  if (Math.random() >= bossChance) return bosses
  
  let bossCount = 1
  if (['xiongxian', 'juejing', 'mieshi'].includes(difficultyKey)) {
    bossCount = Math.random() < 0.5 ? 1 : 2
  }
  
  for (let i = 0; i < bossCount; i++) {
    const bossData = effectiveZone.bosses[Math.floor(Math.random() * effectiveZone.bosses.length)]
    bosses.push(createBossEnemy(bossData, effectiveZone))
  }
  
  return bosses
}

function generateZoneEnemy(effectiveZone, encounterCount, difficultyKey = 'xiongxian') {
  const bossEnemies = generateBossEnemies(effectiveZone, difficultyKey)
  const hasBoss = bossEnemies.length > 0
  const isElite = !hasBoss && encounterCount > 0 && encounterCount % 5 === 0
  const type = hasBoss ? CombatType.BOSS : isElite ? CombatType.ELITE : CombatType.NORMAL
  const secretLv = effectiveZone.difficulty
  const scale = effectiveZone.enemyScale
  
  if (hasBoss) {
    return { mainEnemy: bossEnemies[0], allBosses: bossEnemies, hasBoss: true, isElite: false }
  }
  
  // 小怪整体强化（用户反馈小怪实力羸弱）：
  // - HP 倍率 0.7 → 0.85（+21%）
  // - ATK 倍率 0.5 → 0.6（+20%）
  // - DEF 倍率 0.12 → 0.15（+25%）
  // 后期秘境额外应用 LATE_ZONE_ENEMY_MULT，重点强化凤凰窟之后的怪物
  const lateMult = getLateZoneMult(effectiveZone.id)
  const smallHpBase = Math.floor(effectiveZone.recommendedStats.health * 0.85 * scale * lateMult)
  const smallAtkBase = Math.floor(effectiveZone.recommendedStats.attack * 0.6 * scale * lateMult)
  const smallDefBase = Math.floor(effectiveZone.recommendedStats.attack * 0.15 * scale * lateMult)
  // 后期秘境小怪速度小幅提升，让其能跟上后期玩家
  const smallSpeedBonus = Math.floor((lateMult - 1) * 8)
  const baseStats = {
    health: smallHpBase,
    damage: smallAtkBase,
    defense: smallDefBase,
    speed: 5 + secretLv * 2 + smallSpeedBonus,
    critRate: Math.min(0.22, 0.02 + secretLv * 0.012 + (lateMult - 1) * 0.04),
    comboRate: Math.min(0.18, 0.01 + secretLv * 0.008 + (lateMult - 1) * 0.03),
    counterRate: Math.min(0.18, 0.01 + secretLv * 0.008 + (lateMult - 1) * 0.03),
    stunRate: Math.min(0.14, 0.01 + secretLv * 0.005 + (lateMult - 1) * 0.02),
    dodgeRate: Math.min(0.22, 0.02 + secretLv * 0.012 + (lateMult - 1) * 0.04),
    vampireRate: Math.min(0.14, 0.01 + secretLv * 0.005 + (lateMult - 1) * 0.02),
    critResist: Math.min(0.18, 0.02 + secretLv * 0.008 + (lateMult - 1) * 0.04),
    comboResist: Math.min(0.18, 0.02 + secretLv * 0.008 + (lateMult - 1) * 0.04),
    counterResist: Math.min(0.18, 0.02 + secretLv * 0.008 + (lateMult - 1) * 0.04),
    stunResist: Math.min(0.18, 0.02 + secretLv * 0.008 + (lateMult - 1) * 0.04),
    dodgeResist: Math.min(0.18, 0.02 + secretLv * 0.008 + (lateMult - 1) * 0.04),
    vampireResist: Math.min(0.18, 0.02 + secretLv * 0.008 + (lateMult - 1) * 0.04),
    healBoost: 0,
    critDamageBoost: 0.3,
    critDamageReduce: 0,
    // 高难度档+后期秘境普通怪获得显著 finalDamageBoost/combatBoost，
    // 让绝境/灭世档 + 后期秘境的小怪对高 build 玩家有真实威胁（不再被一击秒杀全场）
    finalDamageBoost: Math.min(0.35, Math.max(0, (scale - 1) * 0.16) + (lateMult - 1) * 0.1),
    finalDamageReduce: Math.min(0.30, Math.max(0, (scale - 1) * 0.13) + (lateMult - 1) * 0.08),
    combatBoost: Math.min(0.40, Math.max(0, (scale - 1) * 0.19) + (lateMult - 1) * 0.1),
    resistanceBoost: 0,
    maxHealth: smallHpBase
  }

  let monsterName
  if (isElite) {
    monsterName = effectiveZone.monsters[Math.floor(Math.random() * effectiveZone.monsters.length)]
    baseStats.health = Math.floor(baseStats.health * 1.5)
    baseStats.maxHealth = baseStats.health
    baseStats.damage = Math.floor(baseStats.damage * 1.3)
    baseStats.critRate = Math.min(0.2, baseStats.critRate + 0.05)
  } else {
    monsterName = effectiveZone.monsters[Math.floor(Math.random() * effectiveZone.monsters.length)]
  }

  const enemy = new CombatEntity(monsterName, effectiveZone.minLevel, baseStats, isElite ? '精英' : effectiveZone.difficultyLabel)
  enemy.tier = isElite ? 'elite' : 'normal'
  return { mainEnemy: enemy, allBosses: [], hasBoss: false, isElite }
}

function grantBossMaterialDrops(enemy, zoneId) {
  const s = store()
  const drops = []
  if (!enemy.bossData) return drops

  // 旧实现用 enemy.name 与 cultivationSystem.ZONE_BOSSES 的中文名做关联，
  // 但 zones.js（bossData 来源）与 cultivationSystem.ZONE_BOSSES 的 boss 名字/id 完全不匹配
  // （如 zones.js「狼王」vs cultivationSystem.js「野猪王」），导致永远找不到 bossInfo，从未掉落。
  // 现改为用 boss id 末尾数字（_1/_2）解析 boss 序号，再查 BOSS_MATERIALS[zoneId][index]。
  const bossId = enemy.bossData.id || enemy.bossId
  const materialDef = getBossMaterialByBossId(zoneId, bossId)
  if (!materialDef) return drops

  // 同时从 ZONE_BOSSES 取该 boss 的掉落概率（按序号匹配）
  const zoneBosses = ZONE_BOSSES[zoneId] || []
  const match = String(bossId || '').match(/_(\d+)$/)
  const idx = match ? Math.max(0, parseInt(match[1], 10) - 1) : 0
  const bossInfo = zoneBosses[idx]
  const dropChance = bossInfo?.dropChance ?? 0.10

  if (Math.random() < dropChance) {
    const materialItem = {
      id: materialDef.id,
      name: materialDef.name,
      kind: 'boss_material',
      quality: 'rare',
      description: materialDef.description,
      baseValue: 80,
      source: 'boss'
    }
    s.gainMaterial(materialItem)
    drops.push({ ...materialItem, type: 'boss_material' })
  }

  return drops
}

function grantCombatDrops(enemy, zoneId = null) {
  const s = store()
  const drops = []
  const tier = enemy?.tier || 'normal'
  // 取当前秘境对象，用于「天玄碎片仅仙墟/混沌界掉落」等 zone 门控
  const zone = zoneId ? getZoneById(zoneId) : null
  if (tier === 'boss') {
    if (Math.random() < 0.6) { const c = getRandomCore('boss'); s.gainMaterial(c); drops.push(c) }
    // 天玄碎片仅从仙墟/混沌界获得；其余秘境 boss 仍可掉定灵珠
    if (Math.random() < 0.08) { const sp = getRandomSpecial(zone); s.gainMaterial(sp); drops.push(sp) }
    if (Math.random() < 0.25) { const h = getRandomHerb({ difficulty: 9 }); s.gainMaterial(h); drops.push(h) }
    // 定向素材：BOSS 必掉 1~2 个该秘境丹药所需素材（解决"洗髓花等关键主料从未获取"）
    // 配合 zoneMaterialPool：每个秘境 BOSS 都掉对应丹方所需素材
    if (zoneId) {
      const zoneMatCount = 1 + (Math.random() < 0.4 ? 1 : 0)
      for (let i = 0; i < zoneMatCount; i++) {
        const zm = getRandomZoneMaterial(zoneId)
        if (zm) { s.gainMaterial(zm); drops.push(zm) }
      }
    }
    if (zoneId) {
      const bossDrops = grantBossMaterialDrops(enemy, zoneId)
      // 统计 BOSS 素材获得次数（用于仪表盘/结算栏）
      if (bossDrops.length > 0) {
        runStats.value.bossMaterials += bossDrops.length
      }
      drops.push(...bossDrops)
      // 击杀该秘境 BOSS 时按 ~30% 概率掉落 1~2 张对应专属挑战券
      const ticketDrops = grantBossTicketDrops(enemy, zoneId)
      if (ticketDrops.length > 0) {
        runStats.value.bossTickets += ticketDrops.reduce((sum, d) => sum + (d.amount || 1), 0)
      }
      drops.push(...ticketDrops)
    }
  } else if (tier === 'elite') {
    if (Math.random() < 0.5) { const c = getRandomCore('elite'); s.gainMaterial(c); drops.push(c) }
    const beast = getRandomCore('normal'); s.gainMaterial(beast); drops.push(beast)
    // 精英怪 40% 概率掉 1 个该秘境定向素材（让低难玩家也有途径）
    if (zoneId && Math.random() < 0.40) {
      const zm = getRandomZoneMaterial(zoneId)
      if (zm) { s.gainMaterial(zm); drops.push(zm) }
    }
  } else {
    if (Math.random() < 0.4) { const c = getRandomCore('normal'); s.gainMaterial(c); drops.push(c) }
    // 普通怪 18% 概率掉 1 个该秘境定向素材（让前期玩家也能稳定获取丹药主料）
    if (zoneId && Math.random() < 0.18) {
      const zm = getRandomZoneMaterial(zoneId)
      if (zm) { s.gainMaterial(zm); drops.push(zm) }
    }
  }
  return drops
}

// BOSS 挑战券掉落：仅在挂机击杀对应秘境 BOSS 时触发，~30% 概率掉 1~2 张专属挑战券
// 返回数组项：{ type:'boss_ticket', amount, name, id, ... }，会被 accumulateMaterials 累计并展示在仪表盘/结算栏
function grantBossTicketDrops(enemy, zoneId) {
  const s = store()
  const drops = []
  if (!enemy?.bossData || !zoneId) return drops
  const bossId = enemy.bossData.id || enemy.bossId
  const ticketDef = getBossTicketByBossId(zoneId, bossId)
  if (!ticketDef) return drops
  if (Math.random() < 0.30) {
    const amount = Math.floor(Math.random() * 2) + 1 // 1~2 张
    const ticketItem = {
      id: ticketDef.id,
      name: ticketDef.name,
      kind: 'boss_ticket',
      quality: 'rare',
      description: ticketDef.description,
      baseValue: 50,
      source: 'boss'
    }
    for (let i = 0; i < amount; i++) s.gainMaterial(ticketItem)
    drops.push({ ...ticketItem, type: 'boss_ticket', amount })
  }
  return drops
}

// BOSS 挑战专属掉落：每次挑战胜利时调用（独立于挂机掉落，不污染 runStats）
// - 50% 概率掉落对应 BOSS 素材 ×1（比挂机掉落更慷慨，因为消耗了挑战券）
// - 10% 概率返还 1 张对应挑战券（让玩家偶尔能延续挑战链）
function grantBossChallengeDrops(zoneId, bossId) {
  const s = store()
  const drops = []
  // BOSS 素材（50% 概率）
  const materialDef = getBossMaterialByBossId(zoneId, bossId)
  if (materialDef && Math.random() < 0.50) {
    const materialItem = {
      id: materialDef.id,
      name: materialDef.name,
      kind: 'boss_material',
      quality: 'rare',
      description: materialDef.description,
      baseValue: 80,
      source: 'boss_challenge'
    }
    s.gainMaterial(materialItem)
    drops.push({ ...materialItem, type: 'boss_material', amount: 1 })
  }
  // BOSS 挑战券返还（10% 概率，1 张）
  const ticketDef = getBossTicketByBossId(zoneId, bossId)
  if (ticketDef && Math.random() < 0.10) {
    const ticketItem = {
      id: ticketDef.id,
      name: ticketDef.name,
      kind: 'boss_ticket',
      quality: 'rare',
      description: ticketDef.description,
      baseValue: 50,
      source: 'boss_challenge'
    }
    s.gainMaterial(ticketItem)
    drops.push({ ...ticketItem, type: 'boss_ticket', amount: 1 })
  }
  return drops
}

// BOSS 挑战：消耗对应 BOSS 的挑战券，逐场进入实时战斗（与挂机同款 executeRound + BattleStage）
// zoneId: 秘境 id（如 'forest_edge'）
// bossId: BOSS id（如 'forest_boss_1'，对应 zones.js 中的 bosses[].id）
// count: 挑战次数
// 异步函数：每场战斗逐回合推进，结果实时反映到 currentEncounter / idleDashboard / currentEncounterSummary
// 全部结束后写入 bossChallengeResult（汇总）+ bossChallengeSummary（结算栏数据源）
async function runBossChallenge(zoneId, bossId, count) {
  const s = store()
  const result = {
    zoneId,
    bossId,
    count,
    victories: 0,
    defeats: 0,
    drops: [],          // 本次挑战所有掉落（含 boss 素材、返还挑战券等）
    ticketId: null,
    ticketName: null,
    bossName: '',
    message: '',
    success: false
  }

  const zone = getZoneById(zoneId)
  if (!zone) {
    result.message = '秘境不存在'
    bossChallengeResult.value = result
    return result
  }

  // 查找 boss 数据
  const boss = (zone.bosses || []).find(b => b.id === bossId)
  if (!boss) {
    result.message = 'BOSS 不存在'
    bossChallengeResult.value = result
    return result
  }
  result.bossName = boss.name

  // 查找挑战券定义
  const ticketDef = getBossTicketByBossId(zoneId, bossId)
  if (!ticketDef) {
    result.message = '挑战券配置缺失'
    bossChallengeResult.value = result
    return result
  }
  result.ticketId = ticketDef.id
  result.ticketName = ticketDef.name

  // 校验挑战次数
  if (!count || count <= 0) {
    result.message = '挑战次数必须大于 0'
    bossChallengeResult.value = result
    return result
  }

  // 检查挑战券数量
  const ticketCount = s.countMaterial('boss_ticket', ticketDef.id)
  if (ticketCount < count) {
    result.message = `挑战券不足，需要 ${count} 张，当前 ${ticketCount} 张`
    bossChallengeResult.value = result
    return result
  }

  // 消耗挑战券
  const consumeResult = s.consumeBossTicket(ticketDef.id, count)
  if (!consumeResult.success) {
    result.message = consumeResult.message
    bossChallengeResult.value = result
    return result
  }

  // 取该秘境「凶险」难度作为 BOSS 推荐难度基准（boss stats 与 ZONE_BUILD_BASE 对齐）
  const diff = (zone.difficulties || []).find(d => d.key === 'xiongxian') || zone.difficulties?.[2]
  if (!diff) {
    result.message = '秘境难度配置缺失'
    bossChallengeResult.value = result
    return result
  }

  // 构建 BOSS 战的 effective zone（用于 grantReward 发放奖励 + createBossEnemy 强化倍率）
  const effectiveZone = buildEffectiveZone(zone, diff)

  // ===== 重置挑战会话状态（与挂机 startIdle 对齐，确保仪表盘/结算栏从 0 开始累积） =====
  runStats.value = { victories: 0, defeats: 0, spiritStones: 0, cultivation: 0, equipment: 0, exp: 0, healAmount: 0, buffCount: 0, shieldAmount: 0, damageBoost: 0, phantomCrystals: 0, totalDamageDealt: 0, totalDamageTaken: 0, bossTickets: 0, bossMaterials: 0 }
  sessionMaterials.value = {}
  foundEquipment.value = []
  logs.value = []
  currentEncounterSummary.value = null
  idleCombatLog.value = []
  currentIdleEnemy.value = null
  currentEncounter.value = { enemy: null, players: [], round: 0, inProgress: false, combatLog: [], combatStats: {}, manager: null, enemyData: null }
  bossChallengeSummary.value = null
  bossChallengeResult.value = null
  // 队伍满血（BOSS 挑战视为独立战次，不继承挂机残血）
  ensureTeamMemberStates()
  const team = s.getTeamMembersDetail()
  teamMemberStates.value = team.map(member => buildTeamMemberState(member, s))

  // ===== 进入 BOSS 挑战实时战斗状态 =====
  isBossChallengeInProgress.value = true
  bossChallengeTotalRounds.value = count
  bossChallengeBossName.value = boss.name
  bossChallengeZoneName.value = zone.name
  bossChallengeRound.value = 0

  addLog('header', `👑 开始挑战【${zone.name}】${boss.name}，共 ${count} 场`)

  // 逐场实时战斗
  for (let i = 0; i < count; i++) {
    bossChallengeRound.value = i + 1

    // 全队阵亡保护：无法继续挑战
    if (teamMemberStates.value.every(ms => ms.hp <= 0)) {
      addLog('defeat', `💀 全队力竭，BOSS 挑战被迫提前终止（已完成 ${i}/${count} 场）`)
      break
    }

    // 创建 BOSS 实体（createBossEnemy 已应用 3 倍强化）
    const bossEnemy = createBossEnemy(boss, effectiveZone)
    bossEnemy.avatar = getMonsterAvatarSync(bossEnemy.name, 'thumbnail')
    bossEnemy.portrait = getMonsterAvatarSync(bossEnemy.name, 'full')

    // 创建玩家实体（继承上一场剩余血量）
    const playerEntities = []
    for (const ms of teamMemberStates.value) {
      if (ms.hp <= 0) continue
      const member = s.sectMembers.find(m => m.id === ms.memberId)
      if (!member) continue
      const entity = createMemberCombatEntity(member)
      entity.currentHealth = Math.min(ms.hp, entity.stats.maxHealth)
      entity.memberId = ms.memberId
      entity.role = member.role || 'vanguard'
      entity.avatar = getCharacterThumbnail(member)
      playerEntities.push(entity)
    }
    if (playerEntities.length === 0) break

    // 设置 currentEncounter（驱动 BattleStage 实时渲染）
    currentEncounter.value = {
      enemy: bossEnemy,
      players: playerEntities,
      round: 0,
      inProgress: true,
      combatLog: [],
      combatStats: {},
      manager: null,
      enemyData: { mainEnemy: bossEnemy, allBosses: [bossEnemy], hasBoss: true, isElite: false }
    }
    // 设置挂机仪表盘怪物快照，让仪表盘怪物面板实时显示 BOSS 状态
    currentIdleEnemy.value = buildIdleEnemySnapshot(bossEnemy, bossEnemy.currentHealth)

    addLog('header', `⚔️ 第 ${i + 1}/${count} 场 BOSS 挑战：${boss.name}！`)
    idleCombatLog.value.push(`—— 第 ${i + 1} 场 BOSS 挑战 · ${boss.name} ——`)

    // 推进战斗（逐回合，每回合间隔 750ms 让 BattleStage 实时反馈）
    let roundResult = { finished: false }
    let roundsExecuted = 0
    let combatLogSynced = currentEncounter.value.combatLog.length
    while (!roundResult.finished && roundsExecuted < 50) {
      roundsExecuted++
      roundResult = await executeRound(effectiveZone)
      // 增量追加战斗日志到完整日志累积源
      const cl = currentEncounter.value.combatLog
      if (cl.length > combatLogSynced) {
        for (let j = combatLogSynced; j < cl.length; j++) idleCombatLog.value.push(cl[j])
        combatLogSynced = cl.length
      }
      // 逐回合刷新仪表盘怪物血量
      if (currentIdleEnemy.value) {
        const liveHP = currentEncounter.value.enemy.currentHealth
        const liveMax = currentEncounter.value.enemy.stats.maxHealth || 0
        currentIdleEnemy.value.currentHealth = Math.round(liveHP)
        currentIdleEnemy.value.hpPercent = liveMax > 0
          ? Math.max(0, Math.min(100, (liveHP / liveMax) * 100)).toFixed(0) + '%'
          : '0%'
        currentIdleEnemy.value.dead = liveHP <= 0
      }
      await new Promise(resolve => setTimeout(resolve, 750))
    }

    // 处理本场战斗结果
    const victory = roundResult.victory
    let rewards = []
    let loss = 0

    if (victory) {
      result.victories++
      // 发放 BOSS 标准奖励（10x 数量型奖励，参考挂机 BOSS）
      rewards = grantReward(effectiveZone, false, true)
      // BOSS 挑战专属掉落（boss 素材 + 返还挑战券）
      const challengeDrops = grantBossChallengeDrops(zoneId, bossId)
      for (const d of challengeDrops) {
        rewards.push({ type: d.type, name: d.name, amount: d.amount || 1, ...d })
      }
      result.drops.push(...challengeDrops)
      accumulateMaterials(rewards)
      accumulateMaterials(challengeDrops)
      runStats.value.victories++
      // 装备掉落也累计到 foundEquipment（仪表盘「最近装备」展示）
      rewards.forEach(r => {
        if (r.type === 'equipment' && r.item) {
          r.item._pickedAt = Date.now()
          foundEquipment.value.push(r.item)
        }
      })
      addLog('victory', `✅ 第 ${i + 1} 场挑战胜利！击杀 ${boss.name}`)
    } else {
      result.defeats++
      loss = Math.floor((s.cultivationPool || 0) * 0.05)
      s.cultivationPool = Math.max(0, (s.cultivationPool || 0) - loss)
      runStats.value.defeats++
      addLog('defeat', `❌ 第 ${i + 1} 场挑战失败，损失修为 ${loss}`)
    }

    // 同步玩家血量到 teamMemberStates（跨场保留）
    for (const p of currentEncounter.value.players) {
      const ms = teamMemberStates.value.find(m => m.memberId === p.memberId)
      if (ms) ms.hp = Math.max(0, Math.round(p.currentHealth))
    }

    // 累计本场真实伤害到总统计（仪表盘「总伤害/总受伤」）
    for (const p of currentEncounter.value.players) {
      const cs = currentEncounter.value.combatStats[p.memberId]
      if (!cs) continue
      runStats.value.totalDamageDealt += Math.max(0, Math.round(cs.playerDamage || 0))
      runStats.value.totalDamageTaken += Math.max(0, Math.round(cs.enemyDamage || 0))
    }

    // 实时更新当前结算画面（单场结算）
    currentEncounterSummary.value = {
      count: i + 1,
      victory,
      enemyName: boss.name,
      enemyTier: 'boss',
      rewards: rewards.map(r => ({ type: r.type, name: r.name, amount: r.amount, rarity: r.rarity, info: r.info })),
      loss,
      teamStates: teamMemberStates.value.map(ms => ({ name: ms.name, hp: ms.hp, maxHP: ms.maxHP })),
      buffs: []
    }

    // 战斗结束：仅置 inProgress=false，保留 enemy/players 让 BattleStage 显示胜负 badge
    currentEncounter.value = { ...currentEncounter.value, inProgress: false }

    // 间隔 1.5s 让玩家看本场结算，再进入下一场（最后一场不延迟）
    if (i < count - 1 && !teamMemberStates.value.every(ms => ms.hp <= 0)) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }

  // 清空 currentEncounter（避免残留战斗画面）
  currentEncounter.value = { enemy: null, players: [], round: 0, inProgress: false, combatLog: [], combatStats: {}, manager: null, enemyData: null }

  // 构建 BOSS 挑战总结算（与挂机 lastSummary 结构对齐，结算栏 UI 可直接复用）
  bossChallengeSummary.value = {
    zoneName: zone.name,
    bossName: boss.name,
    difficulty: 'xiongxian',
    duration: 0,
    encounters: count,
    victories: runStats.value.victories,
    defeats: runStats.value.defeats,
    totalStones: runStats.value.spiritStones,
    totalCultivation: runStats.value.cultivation,
    totalEquipment: runStats.value.equipment,
    totalPhantomCrystals: runStats.value.phantomCrystals,
    totalExp: runStats.value.exp,
    totalDamageDealt: runStats.value.totalDamageDealt,
    totalDamageTaken: runStats.value.totalDamageTaken,
    totalBossTickets: runStats.value.bossTickets,
    totalBossMaterials: runStats.value.bossMaterials,
    defeated: teamMemberStates.value.every(ms => ms.hp <= 0),
    bossResult: null,
    logs: [...logs.value],
    equipmentList: [...foundEquipment.value],
    materialSummary: buildMaterialSummary(),
    teamStates: [...teamMemberStates.value]
  }

  result.success = true
  result.message = `挑战 ${boss.name} ${count} 次：胜 ${result.victories} / 败 ${result.defeats}`
  bossChallengeResult.value = result

  addLog('header', `🎯 ${result.message}`)
  flushAllPendingLogs()

  // 退出 BOSS 挑战状态
  isBossChallengeInProgress.value = false
  s.queueSave()
  s.saveToCurrentSlot().catch(err => console.error('BOSS 挑战自动存档失败:', err))
  return result
}

function grantReward(effectiveZone, isIdleMode = false, isBoss = false) {
  const s = store()
  const rewards = []
  const dropBonus = effectiveZone.dropBonus || 1
  // 掉落加成：小幅提升高品质概率
  const upgradeChance = Math.max(0, (dropBonus - 1) * 0.35)
  const dropRateMult = getPillBuffMultiplier('dropRate')
  // 挂机模式下，装备/法宝（equipment 槽位含 artifact）与灵宠（pet）获得几率提升 2.5 倍
  // （原 5 倍，用户反馈过于激进，在最新数值基础上降低 2 倍 → 5 / 2 = 2.5）
  const IDLE_DROP_BOOST = 2.5
  const idleBoost = (rw) => (isIdleMode && (rw.type === 'equipment' || rw.type === 'pet'))
    ? IDLE_DROP_BOOST
    : 1
  // Boss 奖励区分：数量型（灵石/修为/材料/结晶/碎片）Boss 是普怪的 10 倍；
  // 装备/灵宠在品质上显著区分（最高稀有度权重 ×10 + 升档概率提升），均不突破现有爆率 chance。
  const BOSS_STACKABLE = ['spirit_stone', 'cultivation', 'herb', 'ore', 'liquid', 'phantom_crystal', 'pet_fragment']
  for (const rw of effectiveZone.rewards) {
    const chance = ['spirit_stone', 'cultivation'].includes(rw.type)
      ? rw.chance
      : Math.min(1, rw.chance * dropRateMult * idleBoost(rw))
    if (Math.random() < chance) {
      const amount = Array.isArray(rw.amount)
        ? Math.floor(Math.random() * (rw.amount[1] - rw.amount[0] + 1)) + rw.amount[0]
        : rw.amount || 1
      // Boss：数量型奖励 ×10（仅放大产出数量，不触碰爆率 chance）
      const bossAmountMult = (isBoss && BOSS_STACKABLE.includes(rw.type)) ? BOSS_REWARD_MULT : 1
      const multiplied = Math.floor(amount * bossAmountMult * effectiveZone.rewardMultiplier)
      if (rw.type === 'spirit_stone') {
        const final = Math.floor(multiplied * getPillBuffMultiplier('spiritStoneRate'))
        s.spiritStones += final
        runStats.value.spiritStones += final
        rewards.push({ type: 'spirit_stone', amount: final, name: '灵石' })
      } else if (rw.type === 'herb') {
        for (let i = 0; i < multiplied; i++) { const h = getRandomHerb(effectiveZone); if (h) s.gainMaterial(h) }
        rewards.push({ type: 'herb', amount: multiplied, name: '灵草' })
      } else if (rw.type === 'ore') {
        for (let i = 0; i < multiplied; i++) { const o = getRandomOre(effectiveZone); if (o) s.gainMaterial(o) }
        rewards.push({ type: 'ore', amount: multiplied, name: '矿料' })
      } else if (rw.type === 'liquid') {
        for (let i = 0; i < multiplied; i++) { const l = getRandomLiquid(effectiveZone); if (l) s.gainMaterial(l) }
        rewards.push({ type: 'liquid', amount: multiplied, name: '灵液' })
      } else if (rw.type === 'fortune') {
        // 奇遇奖励：从高难素材池中随机抽一个（定灵珠/天玄碎片/灵草/矿料/灵液）
        // 累计到 buildMaterialSummary 时按 pickItem.kind 分类，让结算栏能展示真实素材
        const pool = [
          getRandomHerb({ difficulty: 9 }),
          ...(effectiveZone.difficulty >= 5 ? [getRandomOre({ difficulty: 9 }), getRandomLiquid({ difficulty: 9 })] : []),
          getRandomSpecial(effectiveZone)
        ].filter(Boolean)
        const pickItem = pool[Math.floor(Math.random() * pool.length)]
        if (pickItem) {
          s.gainMaterial(pickItem)
          // 保留 type='fortune' 用于日志分类显示（addLog 'fortune'），但
          // 在 accumulateMaterials 中按 pickItem.kind 累计到对应类别下
          rewards.push({ type: 'fortune', amount: 1, name: '奇遇·' + pickItem.name, material: pickItem, materialKind: pickItem.kind })
        }
      } else if (rw.type === 'cultivation') {
        const final = Math.floor(multiplied * getPillBuffMultiplier('expGain'))
        s.cultivate(final)
        runStats.value.cultivation += final
        rewards.push({ type: 'cultivation', amount: final, name: '修为' })
      } else if (rw.type === 'equipment') {
        // Boss：最高稀有度档权重 ×10，且升档概率更高，显著区分品质
        let rarity = pickRarityByWeight(rw.rarity, isBoss ? bossRarityWeights(rw.rarity, EQUIP_RARITY_WEIGHTS) : EQUIP_RARITY_WEIGHTS)
        // Boss 仅靠「最高稀有度权重 ×10」实现约 10 倍区分，不再额外升档（避免叠加超额）；
        // 普怪沿用 upgradeChance 小幅升档。两者爆率 chance 均不变。
        const upChance = isBoss ? 0 : upgradeChance
        if (Math.random() < upChance) {
          const idx = rw.rarity.indexOf(rarity)
          if (idx >= 0 && idx < rw.rarity.length - 1) rarity = rw.rarity[idx + 1]
        }
        const equip = generateEquipment(rarity, effectiveZone)
        s.items.push(equip); s.itemsFound++
        runStats.value.equipment++
        const info = rarityInfo[rarity] || rarityInfo.common
        rewards.push({ type: 'equipment', name: equip.name, rarity, info, item: equip })
      } else if (rw.type === 'pet') {
        let rarity = pickRarityByWeight(rw.rarity, isBoss ? bossRarityWeights(rw.rarity, PET_RARITY_WEIGHTS) : PET_RARITY_WEIGHTS)
        const upChance = isBoss ? 0 : upgradeChance
        if (Math.random() < upChance) {
          const idx = rw.rarity.indexOf(rarity)
          if (idx >= 0 && idx < rw.rarity.length - 1) rarity = rw.rarity[idx + 1]
        }
        const pet = generatePet(rarity, effectiveZone)
        s.items.push(pet); s.itemsFound++
        runStats.value.equipment++
        const info = rarityInfo[rarity] || rarityInfo.mortal
        rewards.push({ type: 'pet', name: pet.name, rarity, info, item: pet })
      }
    }
  }
  // 幻灵结晶：每场遭遇独立产出（青萝林·游历5min≈15，混沌界·灭世30min<1000）。
  // 此前比例偏高（2+diff*1.5+scale*3），现下调约 60%，让灵石/结晶产出更平衡。
  const diff = effectiveZone.difficulty || 1
  const scale = effectiveZone.enemyScale || 1
  const crystalBase = Math.floor(1 + diff * 0.6 + scale * 1.2)
  const crystalMult = isBoss ? BOSS_REWARD_MULT : 1
  const crystalAmount = Math.max(1, Math.floor(crystalBase * (0.8 + Math.random() * 0.4) * crystalMult))
  s.phantomCrystals += crystalAmount
  runStats.value.phantomCrystals += crystalAmount
  rewards.push({ type: 'phantom_crystal', amount: crystalAmount, name: '幻灵结晶' })
  
  // 升星碎片：难度3以上有概率掉落，难度越高概率越大
  if (diff >= 3 && Math.random() < (diff - 2) * 0.15) {
    const fragMult = isBoss ? BOSS_REWARD_MULT : 1
    const fragmentAmount = Math.floor((1 + Math.random() * diff) * fragMult)
    s.petFragments += fragmentAmount
    rewards.push({ type: 'pet_fragment', amount: fragmentAmount, name: '升星碎片' })
  }

  // 通关灭世难度：一次性解锁该秘境所有未解锁丹方
  // 修复「通关迷雾谷灭世后只解锁培元丹，其他 5 个丹方未解锁」的问题
  // 之前逻辑：15% 概率触发 + 随机选 1 个解锁，导致通关多次仍可能只解锁 1 个
  // 新逻辑：通关灭世直接解锁该秘境所有未解锁丹方，符合「通关最高难度」的奖励期望
  if (diff >= 5) {
    const pills = getPillsByZone(effectiveZone.id)
    const lockedPills = pills.filter(p => !s.pillRecipes.includes(p.id))
    for (const pill of lockedPills) {
      // 给足够多残页直接合成解锁（灭世难度奖励）
      const fragmentsNeeded = pill.fragmentsNeeded || 10
      for (let i = 0; i < fragmentsNeeded; i++) {
        s.gainPillFragment(pill.id)
      }
      rewards.push({ type: 'pill_recipe', name: pill.name + '丹方', amount: 1 })
    }
  }

  return rewards
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))


// ============ 手动「探索」实时战斗（逐回合实时引擎，HP 跨场保留） ============
// 复用挂机同款逐回合实时引擎（executeRound + currentEncounter）：
// 每回合结算后立即反映到 currentEncounter（BattleStage 实时渲染血量/日志），
// 战斗结束自动写回 teamMemberStates，从而让角色 HP/状态跨场保留，不再每场满血重建。
const MANUAL_ROUND_INTERVAL = 750 // 手动战斗每回合间隔(ms)，实时反馈节奏
async function runManualBattle(effectiveZone) {
  const s = store()
  ensureTeamMemberStates()

  // 全队阵亡保护（ensureTeamMemberStates 已复活）仍为空则无法出战
  if (teamMemberStates.value.every(ms => ms.hp <= 0)) {
    return { victory: false, enemy: null, finished: true }
  }

  const enemyData = generateZoneEnemy(effectiveZone, 1, selectedDifficultyKey.value)
  const enemy = enemyData.mainEnemy
  enemy.avatar = getMonsterAvatarSync(enemy.name, 'thumbnail')
  enemy.portrait = getMonsterAvatarSync(enemy.name, 'full')

  const playerEntities = []
  for (const ms of teamMemberStates.value) {
    if (ms.hp <= 0) continue
    const member = s.sectMembers.find(m => m.id === ms.memberId)
    if (!member) continue
    const entity = createMemberCombatEntity(member)
    // 继承上一次战斗后的剩余血量（跨场保留）
    entity.currentHealth = Math.min(ms.hp, entity.stats.maxHealth)
    entity.memberId = ms.memberId
    entity.role = member.role || 'vanguard'
    entity.avatar = getCharacterThumbnail(member)
    playerEntities.push(entity)
  }
  if (playerEntities.length === 0) {
    return { victory: false, enemy: null, finished: true }
  }

  currentEncounter.value = {
    enemy,
    players: playerEntities,
    round: 0,
    inProgress: true,
    combatLog: [],
    combatStats: {},
    manager: null,
    enemyData
  }
  combatState.value = { inCombat: true, combatManager: null }

  let guard = 0
  let victory = false
  while (guard < 400) {
    guard++
    const r = await executeRound(effectiveZone)
    if (r.finished) {
      victory = r.victory
      break
    }
    // 实时节奏：每回合停顿，让 BattleStage 实时反馈本回合结果
    await sleep(MANUAL_ROUND_INTERVAL)
  }

  combatState.value = { inCombat: false, combatManager: null }
  // 怪物掉落（仅胜利时）
  let drops = []
  if (victory && enemy) drops = grantCombatDrops(enemy, effectiveZone.id)
  // 保留最终画面短暂时间，让 BattleStage 展示胜负结果与最终血量，再收尾重置
  currentEncounter.value = { ...currentEncounter.value, inProgress: false }
  await sleep(1600)
  currentEncounter.value = { enemy: null, players: [], round: 0, inProgress: false, combatLog: [], combatStats: {}, manager: null, enemyData: null }
  return { victory, enemy, finished: true, drops }
}


// ============ 宝物高亮弹窗 ============
let flashTimer = null
// 奖励类型对应图标路径（通过 icons.js 统一获取，已内联为 base64 data URI）
const REWARD_ICON_MAP = {
  head: getIconUrl('reward_eq_head.png'),
  body: getIconUrl('reward_eq_body.png'),
  legs: getIconUrl('reward_eq_legs.png'),
  feet: getIconUrl('reward_eq_feet.png'),
  shoulder: getIconUrl('reward_eq_shoulder.png'),
  hands: getIconUrl('reward_eq_wrist.png'),
  wrist: getIconUrl('reward_eq_wrist.png'),
  necklace: getIconUrl('reward_eq_necklace.png'),
  ring1: getIconUrl('reward_eq_ring.png'),
  ring2: getIconUrl('reward_eq_ring.png'),
  belt: getIconUrl('reward_eq_belt.png'),
  artifact: getIconUrl('reward_eq_artifact.png'),
  equipment: getIconUrl('reward_eq_default.png'),
  pet: getIconUrl('reward_pet.png'),
  herb: getIconUrl('reward_mat_herb.png'),
  ore: getIconUrl('reward_mat_ore.png'),
  liquid: getIconUrl('reward_mat_liquid.png'),
  core: getIconUrl('reward_mat_core.png'),
  pet_fragment: getIconUrl('reward_mat_pet_fragment.png'),
  phantom_crystal: getIconUrl('reward_mat_phantom_crystal.png'),
  monster: getIconUrl('reward_monster.png'),
  spirit_stone: getIconUrl('reward_eq_default.png'),
  cultivation: getIconUrl('reward_eq_default.png'),
  fortune: getIconUrl('reward_eq_default.png')
}

// 奖励类型对应 emoji
const REWARD_EMOJI_MAP = {
  head: '👑',
  body: '🦺',
  legs: '🩳',
  feet: '👢',
  shoulder: '🛡️',
  hands: '🧤',
  wrist: '💍',
  necklace: '📿',
  ring1: '💍',
  ring2: '💍',
  belt: '🎖️',
  artifact: '🔮',
  equipment: '📦',
  pet: '🐾',
  herb: '🌿',
  ore: '💎',
  liquid: '🧪',
  core: '💀',
  pet_fragment: '✨',
  phantom_crystal: '💠',
  monster: '👹',
  spirit_stone: '💎',
  cultivation: '🌟',
  fortune: '⭐'
}

function showTreasureFlash(reward) {
  if (flashTimer) clearTimeout(flashTimer)
  const info = reward.info || rarityInfo[reward.rarity] || rarityInfo.common
  const tier = RARITY_TIER[reward.rarity] || 'plain'
  if (tier === 'plain' || tier === 'uncommon') return
  const isPet = reward.type === 'pet'
  const kind = isPet ? '灵宠' : '装备'
  const flashTitles = {
    rare: '稀有宝物！',
    epic: '极品宝物！',
    legendary: '仙品降临！',
    mythic: '神品现世！'
  }
  const flashDescs = {
    rare: `获得${info.name}${kind}！蓝光流转，瑞气盈门。`,
    epic: `获得${info.name}${kind}！紫气东来，瑞光环绕。`,
    legendary: `获得${info.name}${kind}！金光万丈，天地同贺！`,
    mythic: `获得${info.name}${kind}！神辉冲霄，异象惊世，万法臣服！`
  }
  const title = flashTitles[tier] || '宝物现世！'
  const desc = flashDescs[tier] || `获得${info.name}${kind}！`
  const icon = isPet ? '🐉' : '⚔️'
  const iconImage = REWARD_ICON_MAP[reward.slot] || REWARD_ICON_MAP[reward.type] || null
  const duration = 5000
  treasureFlash.value = { show: true, tier, title, desc, icon, iconImage, color: info.color }
  flashTimer = setTimeout(() => { treasureFlash.value.show = false }, duration)
}

function hideTreasureFlash() {
  if (flashTimer) clearTimeout(flashTimer)
  treasureFlash.value.show = false
}

// ============ 生动日志：单场遭遇 ============
function logEncounter(zone, diff, count, enemy, victory, rewards, loss, combatResults = [], roleEffects = [], enemyStatusEffects = []) {
  const s = store()
  const team = s.getTeamMembersDetail()

  addLog('header', `【${zone.name}·${diff.label}】第 ${count} 次探索`)

  const scenePool = (ZONE_SCENES[zone.id] && ZONE_SCENES[zone.id].length) ? ZONE_SCENES[zone.id] : SCENES
  addLog('scene', pick(scenePool))

  const appearPool = ENEMY_APPEAR[enemy.tier] || ENEMY_APPEAR.normal
  addLog('enemy-' + enemy.tier, pick(appearPool)(enemy.name))

  if (team.length > 0) {
    for (const member of team) {
      const memberState = teamMemberStates.value.find(ms => ms.memberId === member.id)
      if (memberState && memberState.hp <= 0) {
        addLog('combat', `${member.name}气血耗尽，无法参战……`)
        continue
      }
      const role = member.role || 'vanguard'
      const actionPool = MEMBER_ACTIONS[role] || MEMBER_ACTIONS.vanguard
      let text = pick(actionPool)
      text = text.replace(/\$\{n\}/g, member.name)
      const otherMember = team.find(m => m.id !== member.id)
      text = text.replace(/\$\{n2\}/g, otherMember?.name || '队友')
      
      const extras = []
      if (member.talentName) {
        extras.push(`【${member.talentName}】`)
      }
      const passiveSkills = (member.skills || []).filter(s => s.type === 'passive')
      passiveSkills.forEach(skill => extras.push(`【${skill.name}】`))
      
      const combatResult = combatResults.find(cr => cr.memberId === member.id)
      const cs = combatResult?.combatStats
      const damage = cs?.playerDamage || 0
      const tookDamage = cs?.playerTookDamage || 0
      const critCount = cs?.critCount || 0
      const comboCount = cs?.comboCount || 0
      const dodgeCount = cs?.dodgeCount || 0
      const vampireCount = cs?.vampireCount || 0
      const stunCount = cs?.stunCount || 0
      const rounds = cs?.rounds || 0
      
      const damageText = damage > 0 ? `造成 ${Math.floor(damage)} 点伤害` : ''
      const tookDamageText = tookDamage > 0 ? `受到 ${Math.floor(tookDamage)} 点伤害` : ''
      const critText = critCount > 0 ? `暴击×${critCount}` : ''
      const comboText = comboCount > 0 ? `连击×${comboCount}` : ''
      const dodgeText = dodgeCount > 0 ? `闪避×${dodgeCount}` : ''
      const vampireText = vampireCount > 0 ? `吸血×${vampireCount}` : ''
      const stunText = stunCount > 0 ? `眩晕×${stunCount}` : ''
      const roundsText = rounds > 0 ? `${rounds}回合` : ''
      
      const damageInfo = [damageText, tookDamageText, critText, comboText, dodgeText, vampireText, stunText, roundsText].filter(Boolean).join('，')
      
      if (extras.length > 0 || damageInfo) {
        text += '（' + [...extras, damageInfo].filter(Boolean).join('·') + '）'
      }

      // 显示每回合详细战斗数据
      const roundDetails = cs?.roundDetails || []
      if (roundDetails.length > 0) {
        const memberRounds = roundDetails.filter(r => r.attacker === member.name || r.defender === member.name)
        if (memberRounds.length > 0 && memberRounds.length <= 6) {
          for (const rd of memberRounds) {
            const hpPercent = rd.defenderMaxHP > 0 ? Math.round(rd.defenderHP / rd.defenderMaxHP * 100) : 0
            const attackerHPPercent = rd.attackerMaxHP > 0 ? Math.round(rd.attackerHP / rd.attackerMaxHP * 100) : 0
            let roundText = `第${rd.round}回合 `
            if (rd.isPlayerAttack) {
              if (rd.isDodged) {
                roundText += `${rd.attacker}攻击被闪避`
              } else {
                roundText += `${rd.attacker}→${rd.defender} ${rd.damage}伤害`
                if (rd.isCrit) roundText += ' [暴击]'
                if (rd.isCombo) roundText += ' [连击]'
                if (rd.isVampire) roundText += ' [吸血]'
                if (rd.isStun) roundText += ' [眩晕]'
              }
              roundText += ` (敌方剩余${hpPercent}%`
            } else {
              if (rd.isDodged) {
                roundText += `${rd.defender}闪避了${rd.attacker}的攻击`
              } else {
                roundText += `${rd.attacker}→${rd.defender} ${rd.damage}伤害`
                if (rd.isCounter) roundText += ' [反击]'
              }
              roundText += ` (${rd.defender}剩余${hpPercent}%`
            }
            roundText += `/${rd.attacker}剩余${attackerHPPercent}%)`
            addLog('combat', roundText)
          }
        }
      }

      const avatarUrl = getCharacterThumbnail(member)
      addLog('combat', text, null, avatarUrl)
    }
  } else {
    const actions = 2 + (enemy.tier !== 'normal' ? 1 : 0)
    for (let i = 0; i < actions; i++) {
      const a = pick(COMBAT_ACTIONS); addLog('combat', a.text)
    }
  }

  const enemyAttackCount = enemy.tier === 'boss' ? 3 : 2
  const enemyAttackPool = ENEMY_ATTACK_ACTIONS[enemy.tier] || ENEMY_ATTACK_ACTIONS.normal
  const usedEnemyAttacks = new Set()
  for (let i = 0; i < enemyAttackCount; i++) {
    let idx
    do {
      idx = Math.floor(Math.random() * enemyAttackPool.length)
    } while (usedEnemyAttacks.has(idx) && usedEnemyAttacks.size < enemyAttackPool.length)
    usedEnemyAttacks.add(idx)
    let attackText = enemyAttackPool[idx]
    attackText = attackText.replace(/\$\{n\}/g, enemy.name)
    
    const totalEnemyDamage = combatResults.reduce((sum, cr) => sum + (cr.combatStats?.enemyDamage || 0), 0)
    const avgDamage = enemyAttackCount > 0 ? Math.floor(totalEnemyDamage / enemyAttackCount) : 0
    if (avgDamage > 0 && i === 0) {
      attackText += `\uFF08\u521B\u6210 ${avgDamage} 点伤害\uFF09`
    }
    
    addLog('enemy-' + enemy.tier, attackText)
  }

  const effectTypes = ['crit', 'combo', 'dodge', 'vampire', 'stun', 'counter', 'shield', 'heal']
  const effectCount = 2 + Math.floor(Math.random() * 2)
  const shuffledEffects = [...effectTypes].sort(() => Math.random() - 0.5)
  const selectedEffects = shuffledEffects.slice(0, effectCount)
  for (const effectType of selectedEffects) {
    const effectPool = COMBAT_EFFECTS[effectType]
    if (effectPool && effectPool.length > 0) {
      addLog('combat', pick(effectPool))
    }
  }

  if (victory) {
    // 优先使用调用方传入的状态效果列表（与仪表盘怪物面板同步），否则本地随机
    const selectedStatus = enemyStatusEffects.length > 0
      ? enemyStatusEffects
      : (() => {
          const possibleStatus = ['stun', 'bleed']
          const statusCount = 1 + Math.floor(Math.random() * 2)
          return [...possibleStatus].sort(() => Math.random() - 0.5).slice(0, statusCount)
        })()
    for (const statusType of selectedStatus) {
      const statusPool = COMBAT_EFFECTS[statusType]
      if (statusPool && statusPool.length > 0) {
        addLog('enemy-' + enemy.tier, pick(statusPool))
      }
    }
  }

  if (victory && roleEffects.length > 0) {
    for (const effect of roleEffects) {
      addLog('combat', effect.desc)
    }
  }

  if (count % 5 === 0 && team.length >= 2 && Math.random() < 0.6) {
    triggerSkit(team)
  }

  if (victory) {
    addLog('victory', pick(VICTORY_LINES)(enemy.name))
    
    const equipmentRewards = rewards.filter(r => r.type === 'equipment')
    const petRewards = rewards.filter(r => r.type === 'pet')
    const fortuneRewards = rewards.filter(r => r.type === 'fortune')
    const bossMaterialRewards = rewards.filter(r => r.type === 'boss_material')
    const materialRewards = rewards.filter(r => ['herb', 'ore', 'liquid', 'core', 'pet_fragment', 'phantom_crystal'].includes(r.type))
    const currencyRewards = rewards.filter(r => ['spirit_stone', 'cultivation'].includes(r.type))

    for (const r of equipmentRewards) {
      const info = r.info
      const detail = formatItemDetail(r.item, r.type, r.rarity)
      const rarity = r.rarity
      const cls = (rarity === 'common' || rarity === 'mortal') ? 'reward-normal' : 'drop-' + rarity
      addLog(cls, '', detail, null, buildDropParts(r, info))
      showTreasureFlash(r)
    }

    for (const r of petRewards) {
      const info = r.info
      const detail = formatItemDetail(r.item, r.type, r.rarity)
      const rarity = r.rarity
      const cls = (rarity === 'common' || rarity === 'mortal') ? 'reward-normal' : 'drop-' + rarity
      addLog(cls, '', detail, null, buildDropParts(r, info))
      showTreasureFlash(r)
    }

    for (const r of bossMaterialRewards) {
      addLog('drop-rare', '', null, null, [
        { icon: getIconUrl('reward_mat_core.png'), text: '' },
        { icon: null, text: `获得 BOSS 素材【${r.name}】！此乃 ${enemy.name} 身上的珍贵材料，极为稀有！` }
      ])
      showTreasureFlash(r)
    }

    for (const r of fortuneRewards) {
      addLog('fortune', '', null, null, [
        { icon: getIconUrl('reward_mat_core.png'), text: '' },
        { icon: null, text: pick(FORTUNE_LINES)(r.material?.name || r.name) }
      ])
      showTreasureFlash(r)
    }

    if (materialRewards.length > 0 || currencyRewards.length > 0) {
      const materialParts = []
      for (const r of materialRewards) {
        const iconUrls = { herb: getIconUrl('reward_mat_herb.png'), ore: getIconUrl('reward_mat_ore.png'), liquid: getIconUrl('reward_mat_liquid.png'), core: getIconUrl('reward_mat_core.png'), pet_fragment: getIconUrl('reward_mat_pet_fragment.png'), phantom_crystal: getIconUrl('reward_mat_phantom_crystal.png') }
        const names = { herb: '灵草', ore: '矿料', liquid: '灵液', core: '妖兽内丹', pet_fragment: '升星碎片', phantom_crystal: '幻灵结晶' }
        materialParts.push({ icon: iconUrls[r.type], text: `${r.amount} ${names[r.type] || r.name}` })
      }
      for (const r of currencyRewards) {
        if (r.type === 'spirit_stone') {
          materialParts.push({ icon: null, text: `${r.amount} 灵石` })
        } else if (r.type === 'cultivation') {
          materialParts.push({ icon: null, text: `${r.amount} 修为` })
        }
      }
      addLog('reward-normal', '获得：', null, null, materialParts)
    }

  } else {
    addLog('defeat', pick(DEFEAT_LINES)(enemy.name, loss))
  }
}

// 触发小剧场
function triggerSkit(team) {
  const skit = pick(SKITS)
  const m1 = team[0]?.name || '某人'
  const m2 = team[1]?.name || '某人'
  const m3 = team[2]?.name || team[0]?.name || '某人'
  let text = skit.text
    .replace(/\$\{m1\}/g, m1)
    .replace(/\$\{m2\}/g, m2)
    .replace(/\$\{m3\}/g, m3)
  addLog('skit', `🎭 ${text}`)
  // 添加 buff
  const buff = { ...skit.buff, remaining: skit.buff.duration }
  idleBuffs.value.push(buff)
  const buffTypeNames = { cultivation: '修炼效率', combat: '战斗能力', attack: '攻击力', speed: '速度', luck: '气运' }
  const buffTypeName = buffTypeNames[buff.type] || buff.type
  addLog('skit', `📊 获得「${buff.name}」效果：${buffTypeName}${buff.value > 0 ? '+' : ''}${formatBuffPercent(buff.value)}，持续 ${buff.duration} 场`)
}

// 根据 sectMembers 中的成员数据，计算完整的战斗属性
function buildMemberCombatStats(member) {
  const baseStats = member.baseStats || {}
  const combatAttrs = member.combatAttributes || {}
  const combatResist = member.combatResistance || {}
  const specialAttrs = member.specialAttributes || {}
  const talentStats = member.talentStats || {}

  const calcFinalStat = (key, baseValue) => {
    const talentVal = talentStats[key] || 0
    if (['attack', 'health', 'defense', 'speed'].includes(key)) {
      return Math.floor(baseValue * (1 + talentVal))
    }
    return baseValue + talentVal
  }

  let finalHealth = calcFinalStat('health', baseStats.health || 0)
  let finalDamage = calcFinalStat('attack', baseStats.attack || 0)
  let finalDefense = calcFinalStat('defense', baseStats.defense || 0)
  let finalSpeed = calcFinalStat('speed', baseStats.speed || 0)

  const equipBonus = {}
  const artifacts = member.equippedArtifacts || {}
  Object.values(artifacts).forEach(eq => {
    if (!eq) return
    if (eq.stats) {
      Object.entries(eq.stats).forEach(([k, v]) => {
        equipBonus[k] = (equipBonus[k] || 0) + v
      })
    }
    if (eq.affixes) {
      eq.affixes.forEach(a => {
        if (a.valueType === 'percent') {
          equipBonus['__pct_' + a.stat] = (equipBonus['__pct_' + a.stat] || 0) + a.value
        } else if (a.stat) {
          equipBonus[a.stat] = (equipBonus[a.stat] || 0) + a.value
        }
      })
    }
  })

  const applyEquipBonus = (key, baseVal) => {
    const flat = equipBonus[key] || 0
    const pct = equipBonus['__pct_' + key] || 0
    return (baseVal + flat) * (1 + pct)
  }

  finalHealth = Math.floor(applyEquipBonus('health', finalHealth))
  finalDamage = Math.floor(applyEquipBonus('attack', finalDamage))
  finalDefense = Math.floor(applyEquipBonus('defense', finalDefense))
  finalSpeed = Math.floor(applyEquipBonus('speed', finalSpeed))

  const pet = member.equippedPet
  if (pet && pet.combatAttributes) {
    const pca = pet.combatAttributes
    finalHealth += pca.health || 0
    finalDamage += pca.attack || 0
    finalDefense += pca.defense || 0
    finalSpeed += pca.speed || 0
  }

  const stats = {
    health: finalHealth,
    maxHealth: finalHealth,
    damage: finalDamage,
    defense: finalDefense,
    speed: finalSpeed,
    critRate: Math.min(1, calcFinalStat('critRate', combatAttrs.critRate || 0) + (equipBonus.critRate || 0) + (pet?.combatAttributes?.critRate || 0)),
    comboRate: Math.min(1, calcFinalStat('comboRate', combatAttrs.comboRate || 0) + (equipBonus.comboRate || 0) + (pet?.combatAttributes?.comboRate || 0)),
    counterRate: Math.min(1, calcFinalStat('counterRate', combatAttrs.counterRate || 0) + (equipBonus.counterRate || 0) + (pet?.combatAttributes?.counterRate || 0)),
    stunRate: Math.min(1, calcFinalStat('stunRate', combatAttrs.stunRate || 0) + (equipBonus.stunRate || 0) + (pet?.combatAttributes?.stunRate || 0)),
    dodgeRate: Math.min(1, calcFinalStat('dodgeRate', combatAttrs.dodgeRate || 0) + (equipBonus.dodgeRate || 0) + (pet?.combatAttributes?.dodgeRate || 0)),
    vampireRate: Math.min(1, calcFinalStat('vampireRate', combatAttrs.vampireRate || 0) + (equipBonus.vampireRate || 0) + (pet?.combatAttributes?.vampireRate || 0)),
    critResist: Math.min(1, calcFinalStat('critResist', combatResist.critResist || 0) + (equipBonus.critResist || 0) + (pet?.combatAttributes?.critResist || 0)),
    comboResist: Math.min(1, calcFinalStat('comboResist', combatResist.comboResist || 0) + (equipBonus.comboResist || 0) + (pet?.combatAttributes?.comboResist || 0)),
    counterResist: Math.min(1, calcFinalStat('counterResist', combatResist.counterResist || 0) + (equipBonus.counterResist || 0) + (pet?.combatAttributes?.counterResist || 0)),
    stunResist: Math.min(1, calcFinalStat('stunResist', combatResist.stunResist || 0) + (equipBonus.stunResist || 0) + (pet?.combatAttributes?.stunResist || 0)),
    dodgeResist: Math.min(1, calcFinalStat('dodgeResist', combatResist.dodgeResist || 0) + (equipBonus.dodgeResist || 0) + (pet?.combatAttributes?.dodgeResist || 0)),
    vampireResist: Math.min(1, calcFinalStat('vampireResist', combatResist.vampireResist || 0) + (equipBonus.vampireResist || 0) + (pet?.combatAttributes?.vampireResist || 0)),
    healBoost: calcFinalStat('healBoost', specialAttrs.healBoost || 0) + (equipBonus.healBoost || 0) + (pet?.combatAttributes?.healBoost || 0),
    critDamageBoost: calcFinalStat('critDamageBoost', specialAttrs.critDamageBoost || 0) + (equipBonus.critDamageBoost || 0) + (pet?.combatAttributes?.critDamageBoost || 0),
    critDamageReduce: calcFinalStat('critDamageReduce', specialAttrs.critDamageReduce || 0) + (equipBonus.critDamageReduce || 0) + (pet?.combatAttributes?.critDamageReduce || 0),
    finalDamageBoost: calcFinalStat('finalDamageBoost', specialAttrs.finalDamageBoost || 0) + (equipBonus.finalDamageBoost || 0) + (pet?.combatAttributes?.finalDamageBoost || 0),
    finalDamageReduce: calcFinalStat('finalDamageReduce', specialAttrs.finalDamageReduce || 0) + (equipBonus.finalDamageReduce || 0) + (pet?.combatAttributes?.finalDamageReduce || 0),
    combatBoost: calcFinalStat('combatBoost', specialAttrs.combatBoost || 0) + (equipBonus.combatBoost || 0) + (pet?.combatAttributes?.combatBoost || 0),
    resistanceBoost: calcFinalStat('resistanceBoost', specialAttrs.resistanceBoost || 0) + (equipBonus.resistanceBoost || 0) + (pet?.combatAttributes?.resistanceBoost || 0)
  }

  // 应用宗派共鸣加成（基于当前出战队伍）
  const s = store()
  const team = s.getTeamMembersDetail()
  const resonanceEffects = getAllResonanceEffects(team)
  return applyResonanceToCombatStats(stats, resonanceEffects)
}

function createMemberCombatEntity(member) {
  const stats = buildMemberCombatStats(member)
  return new CombatEntity(member.name, member.level, stats, member.schoolName)
}

// 职业AI行为选择（基于角色真实技能）
function chooseMemberAction(memberState, teamStates, enemy) {
  const role = memberState.role || 'vanguard'
  const hpPercent = memberState.hp / (memberState.maxHP || memberState.maxHealth || 1)
  const activeSkills = (memberState.skills || []).filter(s => s.type === 'active')

  // 辅助函数：从技能效果中提取数值
  const getSkillEffectValue = (skill, key, fallback) => {
    if (!skill || !skill.effect) return fallback
    return skill.effect[key] !== undefined ? skill.effect[key] : fallback
  }

  switch (role) {
    case 'vanguard': {
      // 血量<30%时，查找是否有攻击/Buff类技能可用
      if (hpPercent < 0.3) {
        const buffSkill = activeSkills.find(s => s.category === 'buff')
        if (buffSkill) {
          const stat = getSkillEffectValue(buffSkill, 'stat', 'attack')
          const value = getSkillEffectValue(buffSkill, 'value', 0.2)
          const duration = getSkillEffectValue(buffSkill, 'duration', 2)
          return { type: 'buff', target: memberState, buffType: stat + '_up', value, duration, skillName: buffSkill.name }
        }
        const damageSkill = activeSkills.find(s => s.category === 'damage')
        if (damageSkill) {
          return { type: 'skill_attack', skill: damageSkill, skillName: damageSkill.name }
        }
      }
      // 查找伤害技能
      const damageSkill = activeSkills.find(s => s.category === 'damage')
      if (damageSkill) {
        return { type: 'skill_attack', skill: damageSkill, skillName: damageSkill.name }
      }
      return { type: 'attack' }
    }
    case 'blade': {
      // 优先使用伤害技能，尤其是高倍率的
      const damageSkills = activeSkills.filter(s => s.category === 'damage')
      if (damageSkills.length > 0) {
        // 优先选择倍率最高的
        damageSkills.sort((a, b) => (b.effect?.damagePercent || 0) - (a.effect?.damagePercent || 0))
        return { type: 'skill_attack', skill: damageSkills[0], skillName: damageSkills[0].name }
      }
      return { type: 'attack' }
    }
    case 'herb': {
      // 有队友HP<50%则优先治疗
      const wounded = teamStates.filter(t => t.hp > 0 && t.hp / (t.maxHP || t.maxHealth || 1) < 0.5)
      if (wounded.length > 0) {
        wounded.sort((a, b) => (a.hp / (a.maxHP || a.maxHealth || 1)) - (b.hp / (b.maxHP || b.maxHealth || 1)))
        const target = wounded[0]
        // 查找治疗技能
        const healSkill = activeSkills.find(s => s.category === 'heal')
        if (healSkill) {
          const healPercent = getSkillEffectValue(healSkill, 'healPercent', 1.0)
          const isTeam = getSkillEffectValue(healSkill, 'target', 'single') === 'team'
          const healAmount = isTeam
            ? Math.floor((memberState.attack || memberState.damage || 0) * healPercent)
            : Math.floor((memberState.attack || memberState.damage || 0) * healPercent)
          return { type: 'heal', target: isTeam ? null : target, value: Math.max(1, healAmount), skillName: healSkill.name, isTeam }
        }
        // 没有治疗技能则使用基础治疗
        const healAmount = Math.floor((memberState.maxHP || memberState.maxHealth || 0) * 0.15)
        return { type: 'heal', target, value: Math.max(1, healAmount) }
      }
      // 没有伤员时，查找Buff技能
      const buffSkill = activeSkills.find(s => s.category === 'buff')
      if (buffSkill) {
        const target = teamStates.filter(t => t.hp > 0).sort((a, b) => (b.attack || b.damage || 0) - (a.attack || a.damage || 0))[0] || memberState
        const stat = getSkillEffectValue(buffSkill, 'stat', 'attack')
        const value = getSkillEffectValue(buffSkill, 'value', 0.1)
        const duration = getSkillEffectValue(buffSkill, 'duration', 3)
        return { type: 'buff', target, buffType: stat + '_up', value, duration, skillName: buffSkill.name }
      }
      // 既没有治疗也没有Buff，尝试攻击
      const damageSkill = activeSkills.find(s => s.category === 'damage')
      if (damageSkill) return { type: 'skill_attack', skill: damageSkill, skillName: damageSkill.name }
      return { type: 'attack' }
    }
    case 'shield': {
      // 有队友血量危急时，优先使用护盾/防御技能
      const weakAlly = teamStates.find(t => t.memberId !== memberState.memberId && t.hp > 0 && t.hp / (t.maxHP || 1) < 0.4)
      if (weakAlly) {
        const shieldSkill = activeSkills.find(s => s.category === 'shield')
        if (shieldSkill) {
          return { type: 'defend', target: weakAlly, value: Math.floor((memberState.defense || 0) * 0.5), duration: 2, skillName: shieldSkill.name }
        }
        const buffSkill = activeSkills.find(s => s.category === 'buff')
        if (buffSkill && Math.random() < 0.5) {
          return { type: 'buff', target: weakAlly, buffType: 'defense_up', value: 0.15, duration: 2, skillName: buffSkill.name }
        }
      }
      // 查找嘲讽/控制技能
      const controlSkill = activeSkills.find(s => s.category === 'control')
      if (controlSkill && Math.random() < 0.3) {
        return { type: 'skill_attack', skill: controlSkill, skillName: controlSkill.name }
      }
      // 否则攻击
      const damageSkill = activeSkills.find(s => s.category === 'damage')
      if (damageSkill) return { type: 'skill_attack', skill: damageSkill, skillName: damageSkill.name }
      return { type: 'attack' }
    }
    case 'tactician': {
      // 掌阵优先释放增益Buff
      memberState._tacticianCooldown = (memberState._tacticianCooldown || 0) - 1
      if (memberState._tacticianCooldown > 0) {
        const damageSkill = activeSkills.find(s => s.category === 'damage')
        if (damageSkill) return { type: 'skill_attack', skill: damageSkill, skillName: damageSkill.name }
        return { type: 'attack' }
      }
      const buffSkill = activeSkills.find(s => s.category === 'buff')
      if (buffSkill) {
        memberState._tacticianCooldown = 3
        const target = teamStates.filter(t => t.hp > 0).sort((a, b) => (b.attack || b.damage || 0) - (a.attack || a.damage || 0))[0] || memberState
        const stat = getSkillEffectValue(buffSkill, 'stat', 'attack')
        const value = getSkillEffectValue(buffSkill, 'value', 0.15)
        const duration = getSkillEffectValue(buffSkill, 'duration', 3)
        return { type: 'buff', target, buffType: stat + '_up', value, duration, skillName: buffSkill.name }
      }
      const damageSkill = activeSkills.find(s => s.category === 'damage')
      if (damageSkill) return { type: 'skill_attack', skill: damageSkill, skillName: damageSkill.name }
      return { type: 'attack' }
    }
    default:
      return { type: 'attack' }
  }
}

// 执行一回合战斗（用于挂机遭遇）
async function executeRound(effectiveZone) {
  const encounter = currentEncounter.value
  if (!encounter.inProgress) return { finished: false }

  const players = encounter.players
  const enemy = encounter.enemy
  encounter.round++
  const roundLog = []

  // 初始化每个玩家的 combatStats（如果还没有）
  for (const p of players) {
    if (!encounter.combatStats[p.memberId]) {
      encounter.combatStats[p.memberId] = {
        playerDamage: 0,
        playerHeal: 0,
        playerTookDamage: 0,
        enemyDamage: 0,
        rounds: 0,
        critCount: 0,
        comboCount: 0,
        dodgeCount: 0,
        counterCount: 0,
        stunCount: 0,
        vampireCount: 0,
        playerMaxHP: p.stats.maxHealth,
        enemyMaxHP: enemy.stats.maxHealth,
        playerFinalHP: 0,
        enemyFinalHP: 0,
        roundDetails: []
      }
    }
  }

  // 1. 结算正面效果（减少 buff duration、触发光环）
  for (const p of players) {
    if (p.currentHealth > 0) {
      p.applyBuffs()
      p.tickDebuffs()
    }
  }
  if (enemy.currentHealth > 0) {
    enemy.applyBuffs()
    enemy.tickDebuffs()
  }

  // 2. 玩家行动：每个存活角色按职业AI选择行为
  const attackingPlayers = []
  const s = store()
  for (const p of players) {
    if (p.currentHealth <= 0) continue
    const memberState = teamMemberStates.value.find(ms => ms.memberId === p.memberId)
    if (!memberState) continue
    const action = chooseMemberAction(memberState, teamMemberStates.value, enemy)

    if (action.type === 'attack') {
      attackingPlayers.push(p)
    } else if (action.type === 'skill_attack') {
      // 技能攻击：临时应用技能倍率
      const skill = action.skill
      const damagePercent = skill?.effect?.damagePercent || 1.0
      p._originalDamage = p.stats.damage
      p.stats.damage = Math.floor(p.stats.damage * damagePercent)
      p._skillName = action.skillName
      attackingPlayers.push(p)
    } else if (action.type === 'heal') {
      if (action.isTeam) {
        for (const pl of players) {
          if (pl.currentHealth > 0) {
            const healed = pl.heal(action.value)
            const cs = encounter.combatStats[p.memberId]
            if (cs) cs.playerHeal += healed
          }
        }
        roundLog.push(`💚 ${p.name}施展${action.skillName || '治疗'}，全队恢复${Math.floor(action.value)}点气血`)
      } else {
        const targetEntity = players.find(pl => pl.name === action.target?.name) || p
        const healed = targetEntity.heal(action.value)
        const cs = encounter.combatStats[p.memberId]
        if (cs) cs.playerHeal += healed
        roundLog.push(`💚 ${p.name}施展${action.skillName || '治疗'}，为${targetEntity.name}恢复${Math.floor(healed)}点气血`)
      }
    } else if (action.type === 'buff') {
      const targetEntity = players.find(pl => pl.name === action.target?.name) || p
      targetEntity.addBuff({ type: action.buffType, value: action.value, duration: action.duration, source: p.name })
      roundLog.push(`✨ ${p.name}施展${action.skillName || '增益'}，${targetEntity.name}获得${action.buffType}（持续${action.duration}回合）`)
    } else if (action.type === 'defend') {
      const targetEntity = players.find(pl => pl.name === action.target?.name) || p
      targetEntity.addBuff({ type: 'defense_up', value: action.value, duration: action.duration, source: p.name })
      roundLog.push(`🛡️ ${p.name}施展${action.skillName || '防御'}，为${targetEntity.name}展开防御姿态，防御提升`)
    }
  }

  // 3. 怪物行动 + 玩家攻击：executeTurn 按速度排序处理所有攻击者
  if (!encounter.manager) {
    encounter.manager = new CombatManager(null, null)
    encounter.manager.start()
  }
  const turnResult = encounter.manager.executeTurn(attackingPlayers, enemy)

  // 收集 executeTurn 结果到 combatStats 和 roundLog
  if (turnResult && turnResult.results) {
    for (const r of turnResult.results) {
      const attackerPlayer = players.find(pl => pl.name === r.attacker)
      const defenderPlayer = players.find(pl => pl.name === r.defender)
      const isPlayerAttacker = !!attackerPlayer

      // 更新 combatStats
      if (isPlayerAttacker && attackerPlayer) {
        const cs = encounter.combatStats[attackerPlayer.memberId]
        if (cs) {
          cs.playerDamage += r.damage
          cs.rounds = encounter.round
          if (r.isCrit) cs.critCount++
          if (r.isCombo) cs.comboCount++
          if (r.isVampire) cs.vampireCount++
          if (r.isStun) cs.stunCount++
        }
      } else if (defenderPlayer) {
        const cs = encounter.combatStats[defenderPlayer.memberId]
        if (cs) {
          cs.playerTookDamage += r.damage
          cs.enemyDamage += r.damage
          if (r.isCounter) cs.counterCount++
        }
      }
      if (r.isDodged) {
        const cs = encounter.combatStats[attackerPlayer?.memberId || defenderPlayer?.memberId]
        if (cs) cs.dodgeCount++
      }

      // 记录 roundDetails
      for (const pid of Object.keys(encounter.combatStats)) {
        const cs = encounter.combatStats[pid]
        if (cs.roundDetails.length < 30) {
          cs.roundDetails.push({
            round: encounter.round,
            attacker: r.attacker,
            defender: r.defender,
            damage: Math.round(r.damage),
            isCrit: r.isCrit || false,
            isCombo: r.isCombo || false,
            isDodged: r.isDodged || false,
            isVampire: r.isVampire || false,
            isStun: r.isStun || false,
            isCounter: r.isCounter || false,
            attackerHP: r.attackerHP || 0,
            defenderHP: r.defenderHP || 0,
            attackerMaxHP: r.attackerMaxHP || 0,
            defenderMaxHP: r.defenderMaxHP || 0,
            isPlayerAttack: isPlayerAttacker
          })
        }
      }

      // 战斗日志文本
      const skillName = isPlayerAttacker && attackerPlayer?._skillName
      if (r.isDodged) {
        roundLog.push(`💨 ${r.attacker}${skillName ? '施展「' + skillName + '」' : '攻击'}${r.defender}被闪避`)
      } else {
        let txt = skillName
          ? `🔥 ${r.attacker}施展「${skillName}」对${r.defender}造成${Math.floor(r.damage)}点伤害`
          : `⚔️ ${r.attacker}对${r.defender}造成${Math.floor(r.damage)}点伤害`
        if (r.isCrit) txt += ' [暴击]'
        if (r.isCombo) txt += ' [连击]'
        if (r.isVampire) txt += ' [吸血]'
        if (r.isStun) txt += ' [眩晕]'
        if (r.isCounter) txt += ' [反击]'
        roundLog.push(txt)
      }
    }
  }

  // 恢复被技能修改的伤害值
  for (const p of attackingPlayers) {
    if (p._originalDamage !== undefined) {
      p.stats.damage = p._originalDamage
      delete p._originalDamage
      delete p._skillName
    }
  }

  // 4. 结算负面效果（DoT伤害）
  for (const p of players) {
    if (p.currentHealth <= 0) continue
    const dotDmg = p.tickDebuffs()
    if (dotDmg > 0) {
      roundLog.push(`🔥 ${p.name}受到${dotDmg}点持续伤害`)
      const cs = encounter.combatStats[p.memberId]
      if (cs) cs.playerTookDamage += dotDmg
    }
  }
  const enemyDot = enemy.tickDebuffs()
  if (enemyDot > 0) {
    roundLog.push(`🔥 ${enemy.name}受到${enemyDot}点持续伤害`)
  }

  // 5. 播报战场状态
  encounter.combatLog.push(...roundLog)

  // 检查战斗是否结束
  const battleStatus = isBattleOver(players, enemy)
  if (battleStatus.over) {
    // 同步血量回 teamMemberStates
    for (const p of players) {
      const ms = teamMemberStates.value.find(m => m.memberId === p.memberId)
      if (ms) {
        ms.hp = Math.max(0, Math.round(p.currentHealth))
      }
      const cs = encounter.combatStats[p.memberId]
      if (cs) {
        cs.playerFinalHP = Math.round(p.currentHealth)
        cs.enemyFinalHP = Math.round(enemy.currentHealth)
      }
    }
    return { finished: true, victory: battleStatus.victory }
  }

  return { finished: false }
}

// 构建挂机仪表盘怪物快照（怪物信息面板数据源：currentIdleEnemy）
// currentHealth 传入实时血量，便于战斗中逐回合刷新；statusEffects 仅在战斗结束时附带 debuff
function buildIdleEnemySnapshot(enemy, currentHealth, statusEffects = []) {
  const maxHealth = Math.round(enemy.stats?.maxHealth || enemy.maxHealth || 0)
  const curHP = Math.round(currentHealth ?? maxHealth)
  const hpPercent = maxHealth > 0
    ? Math.max(0, Math.min(100, (curHP / maxHealth) * 100)).toFixed(0) + '%'
    : '0%'
  return {
    name: enemy.name,
    tier: enemy.tier || 'normal',
    realm: enemy.realm || '',
    currentHealth: curHP,
    maxHealth,
    hpPercent,
    dead: curHP <= 0,
    damage: Math.round(enemy.stats?.damage || 0),
    defense: Math.round(enemy.stats?.defense || 0),
    speed: Math.round(enemy.stats?.speed || 0),
    critRate: enemy.stats?.critRate != null ? (enemy.stats.critRate * 100).toFixed(0) + '%' : '—',
    effects: statusEffects.map(statusType => ({
      type: 'debuff',
      name: statusType === 'stun' ? '眩晕' : '流血',
      duration: statusType === 'stun' ? 1 : 3
    }))
  }
}

// ============ 挂机单次遭遇（在线，完整战斗模拟） ============
async function runIdleEncounter() {
  idleDiag.value.callCount++
  idleDiag.value.lastCall = new Date().toLocaleTimeString()
  idleDiag.value.lastStage = '入口'
  idleDiag.value.isRunningStuck = isRunning
  if (!isIdling.value) { idleDiag.value.lastStage = '跳过:isIdling=false'; idleDiag.value.skipCount++; return }
  if (isFinishingIdle) { idleDiag.value.lastStage = '跳过:待结束中'; idleDiag.value.skipCount++; return }
  // 防御：若 selectedZone 丢失（极端情况下组件状态异常），从持久化的 idleExploration.zoneId 恢复，
  // 确保后台挂机不会因状态丢失而静默中断（切换界面不应停止挂机）
  if (!selectedZone.value) {
    const saved = store().idleExploration
    if (saved && saved.zoneId) {
      const z = getZoneById(saved.zoneId)
      if (z) selectedZone.value = z
    }
    if (!selectedZone.value) { idleDiag.value.lastStage = '跳过:selectedZone为空'; idleDiag.value.skipCount++; return }
  }
  if (isRunning) { idleDiag.value.lastStage = '跳过:isRunning重入锁'; idleDiag.value.skipCount++; return }
  isRunning = true
  encounterAborted = false // 新一轮遭遇开始，清除上一场可能的超时中断标记
  const mySessionId = idleSessionId // 捕获当前挂机会话 ID，用于循环中校验是否已被新挂机中断
  const s = store()
  const zone = selectedZone.value
  const diff = getZoneDifficulty(zone, selectedDifficultyKey.value)
  // 难度配置缺失则跳过本次（不卡死重入锁，也不停止挂机）
  if (!diff) { idleDiag.value.lastStage = '跳过:diff为空'; idleDiag.value.skipCount++; isRunning = false; return }
  let effectiveZone
  // 注意：isBossEncounter 必须在 if (!currentEncounter.value.inProgress) 块外声明，
  // 否则在下方「战斗结束发放奖励」分支引用时会抛 ReferenceError（被 try/catch 静默吞掉），
  // 导致 currentEncounter.inProgress 永久为 true，后续不再刷怪、不再发奖。
  let isBossEncounter = false
  try {
    isRunning = true
    effectiveZone = buildEffectiveZone(zone, diff)
    idleDiag.value.lastZone = zone.id
    idleDiag.value.lastDiff = diff.key
    idleDiag.value.lastStage = 'effectiveZone已构建'
    s.regenerateSpirit()
    if (s.spiritStones < diff.spiritCost) {
      addLog('warning', '灵石不足，挂机探索暂停，恢复灵石后可继续。')
      stopIdle()
      return
    }
    s.spiritStones -= diff.spiritCost
    idleEncounterCount.value++
    const count = idleEncounterCount.value
    const ratio = buildRatio.value
    idleDiag.value.lastStage = '遭遇#' + count + '开始(team=' + teamMemberStates.value.length + ',ratio=' + ratio.toFixed(2) + ')'

    // 按轮阶段判定：每轮 5 分钟，前 4 分钟小怪阶段，最后 1 分钟为 BOSS 决战窗口
    const ie = s.idleExploration
    const idleDuration = (ie && ie.duration) || 1    // ms
    const idleRemaining = s.getIdleRemainingTime()   // ms
    const elapsedMs = Math.max(0, idleDuration - idleRemaining)
    const roundIndex = Math.floor(elapsedMs / IDLE_ROUND_MS)
    const roundElapsed = elapsedMs - roundIndex * IDLE_ROUND_MS
    // 仅当本轮 BOSS 窗口起点落在总挂机时间内，才在本轮刷 BOSS（避免不完整尾轮误刷）
    const roundHasBossWindow = (roundIndex * IDLE_ROUND_MS + ROUND_MOB_MS) < idleDuration
    const inBossPhase = roundElapsed >= ROUND_MOB_MS && roundHasBossWindow
    // 前 4 分钟小怪阶段：每次遭遇有 ~7% 概率额外遇到 BOSS（区间 5~10%，仅本轮尚未刷过 BOSS 时生效）
    // 最后一分钟（inBossPhase）：必遇到 BOSS
    const farmPhaseRandomBoss = !inBossPhase
      && bossAttemptedRound.value !== roundIndex
      && effectiveZone.bosses && effectiveZone.bosses.length
      && Math.random() < 0.07  // 7% 概率，落点在 5~10% 区间内

    // 停止挂机或新挂机已启动时立即退出，避免清空 currentEncounter 后又被创建新遭遇覆盖
    if (!isIdling.value || isFinishingIdle || mySessionId !== idleSessionId) {
      isRunning = false
      idleDiag.value.lastStage = '遭遇前中断退出(isIdling=' + isIdling.value + ',sessionChanged=' + (mySessionId !== idleSessionId) + ')'
      return
    }

    // 1. 如果当前没有进行中的遭遇，初始化新遭遇
    if (!currentEncounter.value.inProgress) {
      // 二次校验：进入创建分支前再次确认挂机仍活跃（防止 finishIdle 在此期间清空了 currentEncounter）
      if (!isIdling.value || isFinishingIdle || mySessionId !== idleSessionId) {
        isRunning = false
        return
      }
      idleDiag.value.lastStage = '创建新遭遇'
      let enemyData
      let enemy
      if (inBossPhase && bossAttemptedRound.value !== roundIndex && effectiveZone.bosses && effectiveZone.bosses.length) {
        // ===== 本轮 BOSS 决战窗口（最后 1 分钟）：必刷新秘境 BOSS（限时 1 分钟，失败则进入下一轮） =====
        isBossEncounter = true
        bossSpawned.value = true
        bossSpawnRound.value = roundIndex
        bossAttemptedRound.value = roundIndex
        bossSpawnTime.value = Date.now()
        const bossData = effectiveZone.bosses[Math.floor(Math.random() * effectiveZone.bosses.length)]
        enemy = createBossEnemy(bossData, effectiveZone)
        enemyData = { mainEnemy: enemy, allBosses: [enemy], hasBoss: true, isElite: false }
        idleDiag.value.lastEnemyName = 'BOSS ' + enemy.name + '(HP=' + enemy.stats.maxHealth + ',ATK=' + enemy.stats.damage + ')'
        addLog('header', `👑【${zone.name}·${diff.label}】第 ${roundIndex + 1} 轮 BOSS 决战：${enemy.name}！限时 1 分钟内击杀，失败则进入下一轮！`)
        // 在完整战斗日志中插入本轮 BOSS 分隔符，便于「查看完整日志」按场次区分
        idleCombatLog.value.push(`—— 第 ${roundIndex + 1} 轮 BOSS · ${enemy.name} ——`)
      } else if (farmPhaseRandomBoss) {
        // ===== 前 4 分钟小怪阶段：~7% 概率偶遇 BOSS（同样计入本轮 BOSS 已刷标记，避免重复刷） =====
        isBossEncounter = true
        bossSpawned.value = true
        bossSpawnRound.value = roundIndex
        bossAttemptedRound.value = roundIndex
        bossSpawnTime.value = Date.now()
        const bossData = effectiveZone.bosses[Math.floor(Math.random() * effectiveZone.bosses.length)]
        enemy = createBossEnemy(bossData, effectiveZone)
        enemyData = { mainEnemy: enemy, allBosses: [enemy], hasBoss: true, isElite: false }
        idleDiag.value.lastEnemyName = 'BOSS ' + enemy.name + '(HP=' + enemy.stats.maxHealth + ',ATK=' + enemy.stats.damage + ')'
        addLog('header', `👑【${zone.name}·${diff.label}】偶遇 BOSS：${enemy.name}！限时 1 分钟内击杀！`)
        idleCombatLog.value.push(`—— 第 ${roundIndex + 1} 轮 BOSS · ${enemy.name} ——`)
      } else {
        if (inBossPhase && bossAttemptedRound.value !== roundIndex) {
          // 到达 BOSS 窗口但本秘境无 BOSS 配置：退化为普通遭遇继续刷（极少见，避免卡死）
          idleDiag.value.lastStage = 'BOSS窗口但无boss配置，退化为普通遭遇'
        }
        enemyData = generateZoneEnemy(effectiveZone, count, selectedDifficultyKey.value)
        enemy = enemyData.mainEnemy
        idleDiag.value.lastEnemyName = enemy.name + '(HP=' + enemy.stats.maxHealth + ',ATK=' + enemy.stats.damage + ')'
      }
      enemy.avatar = getMonsterAvatarSync(enemy.name, 'thumbnail')
      enemy.portrait = getMonsterAvatarSync(enemy.name, 'full')

      // 创建玩家 CombatEntity（继承 teamMemberStates 当前血量）
      const playerEntities = []
      for (const ms of teamMemberStates.value) {
        if (ms.hp <= 0) { continue }
        const member = s.sectMembers.find(m => m.id === ms.memberId)
        if (!member) { continue }
        const entity = createMemberCombatEntity(member)
        entity.currentHealth = Math.min(ms.hp, entity.stats.maxHealth)
        entity.memberId = ms.memberId
        entity.role = member.role || 'vanguard'
        entity.avatar = getCharacterThumbnail(member)
        playerEntities.push(entity)
      }
      idleDiag.value.lastPlayerCount = playerEntities.length

      if (playerEntities.length === 0) {
        idleDiag.value.lastStage = '终止:playerEntities=0(队伍为空或全灭)'
        addLog('defeat', `💀 全队力竭！你的队伍 Build 强度（${Math.round(playerBuildStrength.value)}）不足以撑过【${zone.name}·${diff.label}】（推荐 ${Math.round(currentRecommendedBuild.value)}），挂机被迫提前终止。`)
        finishIdle()
        return
      }

      currentEncounter.value = {
        enemy,
        players: playerEntities,
        round: 0,
        inProgress: true,
        combatLog: [],
        combatStats: {},
        manager: null,
        enemyData
      }

      // 战斗开始即设置挂机仪表盘怪物快照，修复"挂机中怪物信息仪表盘消失"
      // （此前 currentIdleEnemy 仅在战斗结束才赋值，导致战斗中面板为空/显示上一场残留）
      currentIdleEnemy.value = buildIdleEnemySnapshot(enemy, enemy.currentHealth)

      // 普通遭遇：插入场次分隔符与开场叙事日志（BOSS 场已在上面单独处理）
      if (!isBossEncounter) {
        idleCombatLog.value.push(`—— 第 ${count} 次探索 · ${zone.name}·${diff.label} ——`)
        addLog('header', `【${zone.name}·${diff.label}】第 ${count} 次探索`)
        const scenePool = (ZONE_SCENES[zone.id] && ZONE_SCENES[zone.id].length) ? ZONE_SCENES[zone.id] : SCENES
        addLog('scene', pick(scenePool))
        const appearPool = ENEMY_APPEAR[enemy.tier] || ENEMY_APPEAR.normal
        addLog('enemy-' + enemy.tier, pick(appearPool)(enemy.name))
      }
    }

    // 2. 连续推进回合直到战斗结束（挂机模式下单次遭遇应在一轮内打完，否则奖励永远不发放）
    //    最大回合数保护：防止极端情况（如双方闪避/治疗过高）导致死循环
    //    每回合之间让出一次事件循环，确保 BattleStage 能实时渲染中间状态（避免一气呵成跑完50回合导致战斗界面"过了好久才弹出"）
    //    循环条件检查 isIdling/isFinishingIdle：停止挂机或全队力竭待结束时立即中断，避免战斗界面不终止
    const MAX_IDLE_ROUNDS = 50
    let roundResult = { finished: false }
    let roundsExecuted = 0
    // 追踪已同步到完整战斗日志的行数，确保逐回合增量追加（含进行中的当前场）
    let combatLogSynced = currentEncounter.value.combatLog.length
    while (isIdling.value && !isFinishingIdle && mySessionId === idleSessionId && !encounterAborted && !roundResult.finished && roundsExecuted < MAX_IDLE_ROUNDS) {
      roundsExecuted++
      idleDiag.value.lastStage = '执行回合#' + currentEncounter.value.round + '(本轮第' + roundsExecuted + '次)'
      idleDiag.value.lastPlaybackSet = '是(回合#' + currentEncounter.value.round + ')'
      roundResult = await executeRound(effectiveZone)
      // 将本回合新增的战斗日志增量追加到「完整战斗日志」累积源（实时覆盖进行中的当前场）
      const cl = currentEncounter.value.combatLog
      if (cl.length > combatLogSynced) {
        for (let i = combatLogSynced; i < cl.length; i++) idleCombatLog.value.push(cl[i])
        combatLogSynced = cl.length
      }
      // 逐回合刷新仪表盘怪物血量，让挂机中怪物信息面板实时反映 currentEncounter.enemy
      if (currentIdleEnemy.value) {
        const liveHP = currentEncounter.value.enemy.currentHealth
        const liveMax = currentEncounter.value.enemy.stats.maxHealth || 0
        currentIdleEnemy.value.currentHealth = Math.round(liveHP)
        currentIdleEnemy.value.hpPercent = liveMax > 0
          ? Math.max(0, Math.min(100, (liveHP / liveMax) * 100)).toFixed(0) + '%'
          : '0%'
        currentIdleEnemy.value.dead = liveHP <= 0
      }
      // 等待 BattleStage 播完当前回合的攻击/受击动画再进入下一回合，
      // 避免回合切换太快导致动画堆叠跳动
      await new Promise(resolve => setTimeout(resolve, ROUND_ANIM_DELAY))
    }
    idleDiag.value.lastFinished = 'finished=' + roundResult.finished + ',victory=' + roundResult.victory + ',rounds=' + roundsExecuted

    // 挂机被停止（isIdling=false）、全队力竭待结束（isFinishingIdle=true）、或新挂机已启动（sessionId 变化）时，
    // 不做本场结算直接退出。finishIdle 会负责清理 currentEncounter 与生成挂机总结，避免读取已被清空的 currentEncounter。
    if (!isIdling.value || isFinishingIdle || mySessionId !== idleSessionId) {
      isRunning = false
      idleDiag.value.lastStage = '中断退出(isIdling=' + isIdling.value + ',isFinishingIdle=' + isFinishingIdle + ',sessionChanged=' + (mySessionId !== idleSessionId) + ')'
      return
    }

    // 3. 如果战斗结束，发放奖励/惩罚，重置 currentEncounter
    if (roundResult.finished) {
      const victory = roundResult.victory
      const encounter = currentEncounter.value
      const enemy = encounter.enemy
      let rewards = []
      let loss = 0
      let roleEffects = []
      // BOSS 被击杀：标记通过核心挑战（用于结算「最后 1/5 能否击杀 BOSS」）
      if (bossSpawned.value && victory) bossDefeated.value = true

      if (victory) {
        rewards = grantReward(effectiveZone, true, isBossEncounter)
        s.dungeonTotalKills++; s.explorationCount++
        const recoverRatio = Math.max(0.3, 0.8 - effectiveZone.difficulty * 0.06)
        const recovered = Math.max(1, Math.round(diff.spiritCost * recoverRatio))
        s.spiritStones += recovered
        runStats.value.spiritStones += recovered
        const cultBonus = Math.round(5 * effectiveZone.difficulty * (1 + ratio * 0.5) * getPillBuffMultiplier('cultivationRate'))
        s.cultivate(cultBonus)
        runStats.value.cultivation += cultBonus
        // 奇遇系统：每 10 次探索有较高概率触发一次事件（events.js）
        // 事件奖励按当前秘境难度缩放，包含修为/灵力/灵石/强化石/洗练石/幻灵结晶/丹方残页等
        if (count % 10 === 0 && Math.random() < 0.7) {
          const eventCtx = {
            zone: effectiveZone,
            showMessage: (severity, text) => {
              const logType = severity === 'error' ? 'warning' : (severity === 'success' ? 'fortune' : 'scene')
              addLog(logType, text)
            }
          }
          const triggered = triggerRandomEvent(s, eventCtx)
          if (triggered) {
            rewards.push({ type: 'fortune', amount: 1, name: `奇遇·${triggered.name}` })
          }
        }
        runStats.value.victories++
        const expGain = Math.round(10 * effectiveZone.difficulty)
        runStats.value.exp += expGain
        teamMemberStates.value.forEach(ms => {
          if (ms.hp > 0) s.addCharacterExperience(ms.memberId, expGain)
        })
        rewards.forEach(r => {
          if (r.type === 'equipment') {
            r.item._pickedAt = Date.now()
            foundEquipment.value.push(r.item)
          }
        })
        accumulateMaterials(rewards)

        // 战斗掉落
        const drops = grantCombatDrops(enemy, effectiveZone.id)
        for (const d of drops) {
          rewards.push({ type: d.type, name: d.name, amount: 1, ...d })
        }
        // 将 boss_material / boss_ticket 等「带 type 字段的掉落」也累计进挂机素材统计
        // （其它掉落如 core/herb/special 因不带 type 字段会被 accumulateMaterials 自然跳过）
        accumulateMaterials(drops)

        // 触发角色定位特殊效果
        for (const ms of teamMemberStates.value) {
          if (ms.hp <= 0) continue
          const member = s.sectMembers.find(m => m.id === ms.memberId)
          if (!member) continue
          const role = member.role || 'vanguard'
          const roleEffect = ROLE_EFFECTS[role]
          if (roleEffect) {
            const effectResult = roleEffect.effect(ms, teamMemberStates.value)
            if (effectResult) {
              roleEffects.push({ ...effectResult, memberName: member.name })
              if (effectResult.type === 'heal') runStats.value.healAmount += effectResult.value
              else if (effectResult.type === 'shield') runStats.value.shieldAmount += effectResult.value
              else if (effectResult.type === 'damage_boost' || effectResult.type === 'attack_buff') runStats.value.damageBoost++
              else if (effectResult.type === 'damage_over_time') runStats.value.buffCount++
            }
          }
        }
      } else {
        loss = Math.floor(s.cultivationPool * 0.05)
        s.cultivationPool = Math.max(0, s.cultivationPool - loss)
        s.dungeonDeathCount++
        runStats.value.defeats++
      }

      // 怪物状态效果
      let enemyStatusEffects = []
      if (victory) {
        const possibleStatus = ['stun', 'bleed']
        const statusCount = 1 + Math.floor(Math.random() * 2)
        enemyStatusEffects = [...possibleStatus].sort(() => Math.random() - 0.5).slice(0, statusCount)
      }

      // 构建怪物快照（战斗结束时带入 debuff 状态，覆盖战斗中逐回合刷新的快照）
      currentIdleEnemy.value = buildIdleEnemySnapshot(enemy, enemy.currentHealth, enemyStatusEffects)

      // 构建 combatResults（兼容 logEncounter）
      const combatResults = []
      for (const p of encounter.players) {
        const cs = encounter.combatStats[p.memberId] || {}
        combatResults.push({
          memberId: p.memberId,
          memberName: p.name,
          victory,
          combatStats: cs,
          enemy
        })
      }

      // 累加本场遭遇的真实伤害数据到挂机总统计（仪表盘「总造成伤害/总受到伤害」）
      for (const p of encounter.players) {
        const cs = encounter.combatStats[p.memberId]
        if (!cs) continue
        runStats.value.totalDamageDealt += Math.max(0, Math.round(cs.playerDamage || 0))
        runStats.value.totalDamageTaken += Math.max(0, Math.round(cs.enemyDamage || 0))
      }

      logEncounter(zone, diff, count, enemy, victory, rewards, loss, combatResults, roleEffects, enemyStatusEffects)

      // 实时战斗模式：currentEncounter 已在 runIdleEncounter 中按回合推进，
      // BattleStage 直接渲染 currentEncounter。战斗结束后仅置 inProgress=false，
      // 保留 enemy/players 让 BattleStage 显示胜利/败北 badge，直到下一场遭遇或停止挂机。
      idleDiag.value.lastStage = '遭遇结束(victory=' + victory + ')'
      idleDiag.value.lastPlaybackSet = ''
      currentEncounter.value = { ...currentEncounter.value, inProgress: false }

      // 实时更新当前结算画面
      currentEncounterSummary.value = {
        count,
        victory,
        enemyName: enemy.name,
        enemyTier: enemy.tier,
        rewards: rewards.map(r => ({ type: r.type, name: r.name, amount: r.amount, rarity: r.rarity, info: r.info })),
        loss,
        teamStates: teamMemberStates.value.map(ms => ({ name: ms.name, hp: ms.hp, maxHP: ms.maxHP })),
        buffs: [...idleBuffs.value]
      }

      // 衰减 buff 剩余场次
      idleBuffs.value.forEach(b => b.remaining--)
      idleBuffs.value = idleBuffs.value.filter(b => b.remaining > 0)
      s.updateIdleExploration({ encounterCount: count, lastEncounterTime: Date.now() })
      s.queueSave()
      idleEncounterErrorCount = 0

      if (teamMemberStates.value.every(ms => ms.hp <= 0)) {
        addLog('defeat', `💀 全队力竭！你的队伍 Build 强度（${Math.round(playerBuildStrength.value)}）不足以撑过【${zone.name}·${diff.label}】（推荐 ${Math.round(currentRecommendedBuild.value)}），挂机被迫提前终止。`)
        // 延迟结束挂机：先让 BattleStage 显示败北动画（finishIdle 会清空 currentEncounter），
        // 否则玩家会看到"直接结算"而看不到战斗失败画面
        isFinishingIdle = true
        setTimeout(() => { finishIdle() }, 4000)
        return
      }
    } else {
      // 战斗未结束（达到最大回合数仍未分出胜负，视为僵局）
      const encounter = currentEncounter.value
      addLog('combat', `—— 第 ${encounter.round} 回合（已达最大回合数，本场僵局收场）——`)
      // 播报战场状态
      for (const p of encounter.players) {
        const hpPct = p.stats.maxHealth > 0 ? Math.round((p.currentHealth / p.stats.maxHealth) * 100) : 0
        addLog('combat', `${p.name}: ${Math.round(p.currentHealth)}/${p.stats.maxHealth} (${hpPct}%)`)
      }
      const e = encounter.enemy
      const eHpPct = e.stats.maxHealth > 0 ? Math.round((e.currentHealth / e.stats.maxHealth) * 100) : 0
      addLog('combat', `${e.name}: ${Math.round(e.currentHealth)}/${e.stats.maxHealth} (${eHpPct}%)`)

      // 僵局收场：仅置 inProgress=false，保留 enemy/players 让 BattleStage 显示当前状态，
      // 下次遭遇开始时会重新创建 currentEncounter
      currentEncounter.value = { ...currentEncounter.value, inProgress: false }
      // 同步玩家血量到 teamMemberStates
      for (const p of encounter.players) {
        const ms = teamMemberStates.value.find(m => m.memberId === p.memberId)
        if (ms) ms.hp = Math.max(0, Math.round(p.currentHealth))
      }

      // 僵局同样累加本场遭遇的真实伤害数据到挂机总统计（仪表盘「总造成伤害/总受到伤害」）
      for (const p of encounter.players) {
        const cs = encounter.combatStats[p.memberId]
        if (!cs) continue
        runStats.value.totalDamageDealt += Math.max(0, Math.round(cs.playerDamage || 0))
        runStats.value.totalDamageTaken += Math.max(0, Math.round(cs.enemyDamage || 0))
      }

      s.updateIdleExploration({ encounterCount: count, lastEncounterTime: Date.now() })
      s.queueSave()
    }

    // 本轮 BOSS 战结束（胜/负/僵局）：记录结果，准备进入下一轮，不再立即结束挂机
    // （核心玩法：每轮后段安排限时 BOSS，击杀则过本轮、失败则进入下一轮继续）
    if (bossSpawned.value) {
      if (roundResult.victory) bossRoundsCleared.value++
      else bossRoundsFailed.value++
      idleDiag.value.lastStage = roundResult.victory
        ? `第${bossSpawnRound.value + 1}轮BOSS击杀·进入下一轮`
        : `第${bossSpawnRound.value + 1}轮BOSS未击杀·进入下一轮`
      // 解除本轮 BOSS 进行中标记；bossAttemptedRound 保留，避免同轮重复刷新
      bossSpawned.value = false
      bossSpawnRound.value = -1
      // 总挂机时间已耗尽则结束；否则下一轮小怪由计时器按时触发
    }
  } catch (err) {
    // 单次遭遇异常只跳过本次，不卡死重入锁、不终止挂机
    // 完整异常信息写入 idleDiag.lastError，供页面诊断面板展示
    const errMsg = err && err.message ? err.message : String(err)
    const errStack = err && err.stack ? err.stack : '(无堆栈)'
    idleDiag.value.lastError = '[' + new Date().toLocaleTimeString() + '] ' + errMsg + '\n' + errStack
    idleDiag.value.errorCount++
    idleDiag.value.lastStage = '异常:' + errMsg
    if (idleEncounterErrorCount < 3) {
      addLog('warning', '挂机遭遇结算异常，已跳过本次并继续：' + errMsg)
      idleEncounterErrorCount++
    }
  } finally {
    isRunning = false
    idleDiag.value.isRunningStuck = false
  }
}


// ============ 离线补算（轻量结算，避免卡顿） ============
function runOfflineEncounter(zone, diff, count) {
  const s = store()
  s.regenerateSpirit()
  if (s.spiritStones < diff.spiritCost) return false
  s.spiritStones -= diff.spiritCost
  // s.baseAttributes 已含 装备+套装+灵宠 加成（recomputeAttributes 统一烘焙），无需再叠加
  const pAtk = s.baseAttributes.attack
  const pHp = s.baseAttributes.health
  // 离线胜率同样以 Build 匹配度为基准（兼容旧数值，做平滑过渡）
  // 改为无量纲比例公式：避免不同秘境 recommendedStats 量级差异导致系数失效
  const recBuild = diff.recommendedBuild || 1
  const ratio = (s.buildStrength || 1) / recBuild
  const recAtk = Math.max(1, diff.recommendedStats.attack)
  const recHp = Math.max(1, diff.recommendedStats.health)
  const atkRatio = pAtk / recAtk - 1
  const hpRatio = pHp / recHp - 1
  const winChance = Math.min(0.97, Math.max(0.05,
    0.5 + (ratio - 1) * 0.4 + atkRatio * 0.2 + hpRatio * 0.15))
  const victory = Math.random() < winChance
  const effectiveZone = buildEffectiveZone(zone, diff)
  if (victory) {
    const rewards = grantReward(effectiveZone, true)
    accumulateMaterials(rewards)
    s.dungeonTotalKills++; s.explorationCount++
    logEncounter(zone, diff, count, { name: zone.monsters[0], tier: 'normal' }, true, rewards, 0)
    runStats.value.victories++
  } else {
    const loss = Math.floor(s.cultivationPool * 0.05)
    s.cultivationPool = Math.max(0, s.cultivationPool - loss)
    s.dungeonDeathCount++
    logEncounter(zone, diff, count, { name: zone.monsters[0], tier: 'normal' }, false, [], loss)
    runStats.value.defeats++
  }
  return victory
}

// ============ 挂机控制 ============
function startIdleTimers() {
  if (idleInterval) clearInterval(idleInterval)
  if (idleTimer) clearInterval(idleTimer)
  idleInterval = setInterval(() => { runIdleEncounter() }, ENCOUNTER_INTERVAL)
  // 监听页面可见性：移动端息屏/切后台时 setInterval 会被浏览器节流导致挂机停滞，
  // 亮屏返回时补算漏掉的遭遇，使挂机进度在息屏后依然推进。
  if (!visibilityHandler) {
    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        // 守卫：如果正在实时战斗中（含 BOSS 挑战），跳过补算，避免与实时战斗并发造成状态混乱
        // 实时战斗有自己的 sessionId 校验机制，熄屏恢复后会自行继续或被新遭遇取代
        if (isRunning || (currentEncounter.value && currentEncounter.value.inProgress)) {
          return
        }
        // 防抖：亮屏后延迟 200ms 再补算，避免某些浏览器连续触发 visibilitychange
        setTimeout(() => {
          if (document.visibilityState === 'visible' && !isRunning) {
            catchUpMissedEncounters({ forceFinish: false })
          }
        }, 200)
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)
  }
  idleTimer = setInterval(() => {
    // 守卫：仅当挂机真正进行中且存档状态一致时才推进/结束，避免状态不一致时误触发 finishIdle
    if (!isIdling.value || !store().idleExploration.isActive) return
    const remaining = store().getIdleRemainingTime()
    const elapsed = store().idleExploration.duration - remaining
    const total = store().idleExploration.duration
    idleProgress.value = total > 0 ? (elapsed / total) * 100 : 0
    const min = Math.floor(remaining / 60000)
    const sec = Math.floor((remaining % 60000) / 1000)
    idleTimeRemaining.value = `${min}:${String(sec).padStart(2, '0')}`
    // 按轮阶段：进入某轮的 BOSS 窗口且本轮尚未刷过 BOSS 时，立即刷新 BOSS（避免等 2.5s 定时才有首场）
    const elapsedMs = Math.max(0, elapsed * 1000)
    const roundIndex = Math.floor(elapsedMs / IDLE_ROUND_MS)
    const roundElapsed = elapsedMs - roundIndex * IDLE_ROUND_MS
    const roundHasBossWindow = (roundIndex * IDLE_ROUND_MS + ROUND_MOB_MS) < total
    if (roundElapsed >= ROUND_MOB_MS && roundHasBossWindow && !bossSpawned.value && bossAttemptedRound.value !== roundIndex) {
      runIdleEncounter()
    }
    // BOSS 限时 1 分钟：超时仍未击杀则本轮挑战失败，令当前遭遇循环中断，进入下一轮
    if (bossSpawned.value && bossSpawnTime.value && (Date.now() - bossSpawnTime.value) > BOSS_TIME_LIMIT_MS) {
      encounterAborted = true
      addLog('warning', `⏳ 第 ${bossSpawnRound.value + 1} 轮 BOSS 战超时（1 分钟未击杀），本轮挑战失败，进入下一轮！`)
    }
    // BOSS 限时倒计时展示（供 UI）
    if (bossSpawned.value && bossSpawnTime.value) {
      const left = Math.max(0, BOSS_TIME_LIMIT_MS - (Date.now() - bossSpawnTime.value))
      const bmin = Math.floor(left / 60000)
      const bsec = Math.floor((left % 60000) / 1000)
      bossTimeRemaining.value = `${bmin}:${String(bsec).padStart(2, '0')}`
    } else {
      bossTimeRemaining.value = ''
    }
    // 总挂机时间耗尽
    if (remaining <= 0) {
      // 时间耗尽时若仍有 BOSS 进行中且未击杀：本轮挑战失败
      if (bossSpawned.value && !bossDefeated.value) {
        addLog('warning', `⏳ 时间耗尽，未能在限定时间内击杀 BOSS【${currentEncounter.value.enemy?.name || '秘境BOSS'}】——本轮挑战失败。`)
      }
      finishIdle()
    }
  }, 1000)
}

// 由队伍成员构建单条战斗状态（含天赋/装备/灵宠加成）
// 抽离出来，供 startIdle（每次挂机重置为满血）与 ensureTeamMemberStates（跨场保留血量）共用
function buildTeamMemberState(member, s) {
  const baseStats = member.baseStats || {}
  const talentStats = member.talentStats || {}

  const calcFinalStat = (key, baseValue) => {
    const talentVal = talentStats[key] || 0
    if (['attack', 'health', 'defense', 'speed'].includes(key)) {
      return Math.floor(baseValue * (1 + talentVal))
    }
    return baseValue + talentVal
  }

  let finalHealth = calcFinalStat('health', baseStats.health || 0)
  let finalAttack = calcFinalStat('attack', baseStats.attack || 0)
  let finalDefense = calcFinalStat('defense', baseStats.defense || 0)
  let finalSpeed = calcFinalStat('speed', baseStats.speed || 0)

  const equipBonus = {}
  const artifacts = member.equippedArtifacts || {}
  Object.values(artifacts).forEach(eq => {
    if (!eq) return
    if (eq.stats) {
      Object.entries(eq.stats).forEach(([k, v]) => {
        equipBonus[k] = (equipBonus[k] || 0) + v
      })
    }
    if (eq.affixes) {
      eq.affixes.forEach(a => {
        if (a.valueType === 'percent') {
          equipBonus['__pct_' + a.stat] = (equipBonus['__pct_' + a.stat] || 0) + a.value
        } else if (a.stat) {
          equipBonus[a.stat] = (equipBonus[a.stat] || 0) + a.value
        }
      })
    }
  })

  const applyEquipBonus = (key, baseVal) => {
    const flat = equipBonus[key] || 0
    const pct = equipBonus['__pct_' + key] || 0
    return (baseVal + flat) * (1 + pct)
  }

  finalHealth = Math.floor(applyEquipBonus('health', finalHealth))
  finalAttack = Math.floor(applyEquipBonus('attack', finalAttack))
  finalDefense = Math.floor(applyEquipBonus('defense', finalDefense))
  finalSpeed = Math.floor(applyEquipBonus('speed', finalSpeed))

  const pet = member.equippedPet
  if (pet && pet.combatAttributes) {
    const pca = pet.combatAttributes
    finalHealth += pca.health || 0
    finalAttack += pca.attack || 0
    finalDefense += pca.defense || 0
    finalSpeed += pca.speed || 0
  }

  // 确保角色有技能（兼容旧存档）
  let memberSkills = member.skills
  if (!memberSkills || memberSkills.length === 0) {
    memberSkills = getInitialSkills(member.role)
    member.skills = memberSkills
  }

  return {
    memberId: member.id,
    name: member.name,
    role: member.role || 'vanguard',
    hp: finalHealth,
    maxHP: finalHealth,
    maxHealth: finalHealth,
    attack: finalAttack,
    damage: finalAttack,
    defense: finalDefense,
    speed: finalSpeed,
    skills: memberSkills,
    buildStrength: s.getCharacterBuildStrength(member)
  }
}

// 确保 teamMemberStates 已初始化（仅在为空时）。
// 用于手动「探索」等未走 startIdle 的路径：保留上一次战斗后的剩余血量/状态，
// 避免每次探索都满血重建（即用户要求的“角色状态保留到下一回合/下一场”）。
// 若全队阵亡（上一场团灭），则整体复活至满血，避免软锁无法再次出战。
function ensureTeamMemberStates() {
  const s = store()
  if (teamMemberStates.value && teamMemberStates.value.length > 0) {
    // 已初始化：若全队阵亡，整体复活至满血，防止无法再次出战
    if (teamMemberStates.value.every(ms => ms.hp <= 0)) {
      teamMemberStates.value = teamMemberStates.value.map(ms => ({ ...ms, hp: ms.maxHP }))
    }
    return
  }
  const team = s.getTeamMembersDetail()
  teamMemberStates.value = team.map(member => buildTeamMemberState(member, s))
}

function startIdle(durationMinutes) {
  const s = store()
  if (!selectedZone.value) return
  const diff = getZoneDifficulty(selectedZone.value, selectedDifficultyKey.value)
  if (s.spiritStones < diff.spiritCost) return
  s.startIdleExploration(selectedZone.value.id, selectedDifficultyKey.value, durationMinutes)
  isIdling.value = true
  idleEncounterErrorCount = 0
  isFinishingIdle = false // 重置待结束标志，避免上次延迟的 finishIdle 影响新挂机
  idleSessionId++ // 递增会话 ID，让上一场残留的 runIdleEncounter 循环检测到变化并立即退出
  // 启动新挂机前清理上一场残留的实时战斗状态，避免 BattleStage 卡在老战斗
  currentEncounter.value = { enemy: null, players: [], round: 0, inProgress: false, combatLog: [], combatStats: {}, manager: null, enemyData: null }
  currentIdleEnemy.value = null
  idleCombatLog.value = [] // 重置完整战斗日志累积源，从本次挂机开始重新累积
  bossSpawned.value = false // 重置 BOSS 阶段标记，本次挂机重新进入 farm 阶段
  bossDefeated.value = false
  bossSpawnRound.value = -1
  bossAttemptedRound.value = -1
  bossRoundsCleared.value = 0
  bossRoundsFailed.value = 0
  bossTimeRemaining.value = ''
  bossSpawnTime.value = 0
  encounterAborted = false
  isRunning = false // 重置重入锁，确保新挂机的遭遇能正常触发（上一场残留的 runIdleEncounter 会通过 sessionId 校验自行退出）
  idleEncounterCount.value = 0
  runStats.value = { victories: 0, defeats: 0, spiritStones: 0, cultivation: 0, equipment: 0, exp: 0, healAmount: 0, buffCount: 0, shieldAmount: 0, damageBoost: 0, phantomCrystals: 0, totalDamageDealt: 0, totalDamageTaken: 0, bossTickets: 0, bossMaterials: 0 }
  foundEquipment.value = []
  logs.value = []
  currentEncounterSummary.value = null
  idleBuffs.value = []
  sessionMaterials.value = {}

  const team = s.getTeamMembersDetail()
  // 每次开始挂机都重置为满血（新的一轮挂机 = 全新队伍状态）
  teamMemberStates.value = team.map(member => buildTeamMemberState(member, s))
  
  logs.value.push({ type: 'info', text: `开始挂机探索【${selectedZone.value.name}·${diff.label}】，预计 ${durationMinutes} 分钟，每 ${ENCOUNTER_INTERVAL / 1000} 秒一场遭遇`, time: new Date().toLocaleTimeString() })
  logs.value.push({ type: 'info', text: `🚀 出战阵容：${team.map(m => m.name).join('、') || '无成员'}`, time: new Date().toLocaleTimeString() })
  const match = Math.round(buildRatio.value * 100)
  if (buildRatio.value < 1) {
    logs.value.push({ type: 'warning', text: `⚠️ 队伍 Build 强度（${Math.round(playerBuildStrength.value)}）低于推荐值（${Math.round(currentRecommendedBuild.value)}），匹配度 ${match}%，成员气血可能不支、挂机或提前力竭。`, time: new Date().toLocaleTimeString() })
  } else {
    logs.value.push({ type: 'info', text: `🛡️ Build 匹配度 ${match}%，队伍气血充盈，可稳定挂机。`, time: new Date().toLocaleTimeString() })
  }
  startIdleTimers()
  // 立即触发首场遭遇，消除 setInterval 的 10 秒首延迟：点击挂机开始即弹出实时战斗界面
  runIdleEncounter()
  s.queueSave()
  s.saveToCurrentSlot().catch(err => console.error('挂机开始自动存档失败:', err))
}

function stopIdle() { finishIdle() }

function finishIdle() {
  if (!isIdling.value) return
  if (idleInterval) clearInterval(idleInterval)
  if (idleTimer) clearInterval(idleTimer)
  idleInterval = null; idleTimer = null
  // 注销页面可见性监听，避免挂机结束后残留监听触发补算
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
    visibilityHandler = null
  }
  isFinishingIdle = false // 清除待结束标志
  idleSessionId++ // 递增会话 ID，让残留的 runIdleEncounter 循环检测到变化并立即退出，避免清空后又被覆盖
  // 清理实时战斗舞台，避免停止挂机后 BattleStage 仍渲染旧战斗
  currentEncounter.value = { enemy: null, players: [], round: 0, inProgress: false, combatLog: [], combatStats: {}, manager: null, enemyData: null }
  currentIdleEnemy.value = null
  idleCombatLog.value = [] // 清空完整战斗日志累积源
  bossSpawned.value = false // 复位 BOSS 阶段标记
  bossDefeated.value = false
  bossSpawnRound.value = -1
  bossAttemptedRound.value = -1
  bossRoundsCleared.value = 0
  bossRoundsFailed.value = 0
  bossTimeRemaining.value = ''
  bossSpawnTime.value = 0
  encounterAborted = false
  // 挂机结束时，flush 所有待显示日志
  flushAllPendingLogs()
  const s = store()
  const allDead = teamMemberStates.value.every(ms => ms.hp <= 0)
  
  lastSummary.value = {
    zoneName: selectedZone.value?.name || '未知',
    difficulty: selectedDifficultyKey.value,
    duration: s.idleExploration.duration,
    encounters: idleEncounterCount.value,
    victories: runStats.value.victories,
    defeats: runStats.value.defeats,
    totalStones: runStats.value.spiritStones,
    totalCultivation: runStats.value.cultivation,
    totalEquipment: runStats.value.equipment,
    totalPhantomCrystals: runStats.value.phantomCrystals,
    totalExp: runStats.value.exp,
    totalDamageDealt: runStats.value.totalDamageDealt,
    totalDamageTaken: runStats.value.totalDamageTaken,
    totalBossTickets: runStats.value.bossTickets,
    totalBossMaterials: runStats.value.bossMaterials,
    defeated: allDead,
    bossResult: (bossRoundsCleared.value > 0 || bossRoundsFailed.value > 0)
      ? { cleared: bossRoundsCleared.value, failed: bossRoundsFailed.value }
      : null,
    logs: [...logs.value],
    equipmentList: [...foundEquipment.value],
    materialSummary: buildMaterialSummary(),
    teamStates: [...teamMemberStates.value]
  }
  s.stopIdleExploration()
  s.saveData()
  s.saveToCurrentSlot().catch(err => console.error('挂机结束自动存档失败:', err))
  isIdling.value = false
  idleProgress.value = 100
  idleTimeRemaining.value = '已完成'
  
  if (foundEquipment.value.length > 0) {
    logs.value.push({ type: 'reward-equipment', text: `🎁 获得装备：${foundEquipment.value.map(e => `${e.name}(${e.rarity})`).join('、')}`, time: new Date().toLocaleTimeString() })
  }
  
  if (logs.value.length) {
    const tail = allDead
      ? `挂机因全队力竭提前终止！共探索 ${idleEncounterCount.value} 次，胜 ${runStats.value.victories} / 败 ${runStats.value.defeats}`
      : `挂机结束！共探索 ${idleEncounterCount.value} 次，胜 ${runStats.value.victories} / 败 ${runStats.value.defeats}`
    logs.value.push({ type: 'info', text: tail, time: new Date().toLocaleTimeString() })
  }
}

function processOfflineIdle() {
  // 启动恢复时统一走补算流程并强制收尾（原行为：离线期间按概率结算后直接出结算页）
  // 改为异步：不阻塞 loadGame，让游戏先进入界面，补算在后台分批进行
  catchUpMissedEncounters({ forceFinish: true })
}

// 补算漏掉的遭遇：移动端息屏/切后台期间 setInterval 被浏览器节流，导致 runIdleEncounter 未触发，
// 遭遇数与奖励落后于墙钟。页面恢复可见时调用本函数，用轻量的 runOfflineEncounter（概率结算）补齐。
// forceFinish=true 时无论时长是否到都收尾（用于启动恢复）；否则仅当墙钟耗尽才收尾，继续实时挂机。
// 优化：改为异步分批补算（每批 30 场，用 setTimeout(0) 让出主线程），避免一次性补算 500 场卡死 UI
let catchUpInProgress = false
async function catchUpMissedEncounters({ forceFinish = false } = {}) {
  // 防止重入：熄屏恢复时如果上一次补算还没结束，直接跳过
  if (catchUpInProgress) return
  const s = store()
  const idleState = s.idleExploration
  if (!idleState || !idleState.isActive) return
  // 挂机正在收尾时跳过，避免与 finishIdle 竞争
  if (isFinishingIdle) return
  const zone = getZoneById(idleState.zoneId)
  if (!zone) { s.stopIdleExploration(); return }
  const diff = getZoneDifficulty(zone, idleState.difficultyKey)
  if (!diff) return
  const now = Date.now()
  const elapsed = now - idleState.startTime
  const totalDuration = idleState.duration
  const expected = Math.floor(elapsed / ENCOUNTER_INTERVAL)
  const missed = Math.max(0, expected - idleState.encounterCount)
  if (missed > 0) {
    // 上限保护：避免一次性补算过多卡死 UI（例如挂机数小时后返回）
    // 进一步降低上限：补算过多意义不大（收益已封顶），200 场足够覆盖 8 分钟息屏
    const MAX_CATCHUP = 200
    const BATCH_SIZE = 30  // 每批 30 场，让出主线程避免卡顿
    const toCatch = Math.min(missed, MAX_CATCHUP)
    const tip = missed > toCatch
      ? `⏳ 后台/息屏期间漏掉 ${missed} 场遭遇，补算最近 ${toCatch} 场……`
      : `⏳ 后台/息屏期间漏掉 ${missed} 场遭遇，正在补算……`
    logs.value.push({ type: 'info', text: tip, time: new Date().toLocaleTimeString() })
    const baseCount = idleState.encounterCount
    catchUpInProgress = true
    try {
      for (let i = 0; i < toCatch; i += BATCH_SIZE) {
        const end = Math.min(i + BATCH_SIZE, toCatch)
        for (let j = i; j < end; j++) {
          runOfflineEncounter(zone, diff, baseCount + j + 1)
        }
        // 每批之间让出主线程，让 UI 能响应（加载进度条/动画不卡死）
        await new Promise(r => setTimeout(r, 0))
        // 中途检测挂机是否已被用户手动停止，避免补算到已结束的会话
        if (!s.idleExploration || !s.idleExploration.isActive) break
      }
      // 同步本地计数与持久化状态，使后续实时遭遇从正确序号继续
      const newCount = baseCount + toCatch
      idleEncounterCount.value = newCount
      s.updateIdleExploration({ encounterCount: newCount, lastEncounterTime: Date.now() })
      // 补算收益立即落盘，防止丢失
      s.saveData()
    } finally {
      catchUpInProgress = false
    }
  }
  // 时间耗尽或强制结束 → 收尾；否则继续实时挂机
  if (forceFinish || elapsed >= totalDuration) {
    finishIdle()
  }
}

// App.vue 常驻初始化：恢复挂机状态并启动推进
// 优化：先启动定时器与 UI，再延后异步补算离线遭遇，避免阻塞 loadGame 的 80% 阶段
function initIdle() {
  const s = store()
  s.regenerateSpirit()
  const idleState = s.idleExploration
  if (idleState && idleState.isActive) {
    const zone = getZoneById(idleState.zoneId)
    if (zone) {
      selectedZone.value = zone
      selectedDifficultyKey.value = idleState.difficultyKey || 'xiongxian'
      isIdling.value = true
      idleEncounterCount.value = idleState.encounterCount || 0
      idlePlayerDefeated.value = false
      const probe = createPlayerEntity()
      idlePlayerMaxHP.value = probe.stats.maxHealth
      idlePlayerHP.value = probe.stats.maxHealth
      runStats.value = { victories: 0, defeats: 0, spiritStones: 0, cultivation: 0, equipment: 0, exp: 0, healAmount: 0, buffCount: 0, shieldAmount: 0, damageBoost: 0, phantomCrystals: 0, totalDamageDealt: 0, totalDamageTaken: 0, bossTickets: 0, bossMaterials: 0 }
      logs.value = []
      // 先启动定时器，让 UI 立即显示挂机进行中的状态
      startIdleTimers()
      // 延后异步补算：用 setTimeout(0) 推到下一个事件循环，让 loadGame 先完成（isLoading=false）
      // 这样补算即使耗时，用户也已看到游戏界面，不会感觉卡在加载中
      setTimeout(() => {
        processOfflineIdle()
      }, 0)
    } else {
      s.stopIdleExploration()
    }
  }
}

const displayLogs = computed(() => {
  // 挂机中或 BOSS 挑战进行中：展示实时 logs（BattleStage「查看完整日志」按当前会话累积）
  if (isIdling.value || isBossChallengeInProgress.value) return logs.value
  // 否则展示上一次挂机/BOSS 挑战结束后的总结算日志
  return lastSummary.value?.logs || bossChallengeSummary.value?.logs || []
})

// 清空当前展示中的实时战斗日志：挂机中清空 logs，挂机结束后清空 lastSummary.logs
// 由 BattleStage「查看完整日志」弹窗的「清空日志」按钮调用
function clearIdleLogs() {
  logs.value = []
  pendingLogs.value = []
  if (logDisplayTimer) {
    clearInterval(logDisplayTimer)
    logDisplayTimer = null
  }
  if (lastSummary.value) {
    lastSummary.value = { ...lastSummary.value, logs: [] }
  }
}
const canStartIdle = computed(() => {
  const s = store()
  const zone = selectedZone.value
  if (!zone) return false
  const diff = getZoneDifficulty(zone, selectedDifficultyKey.value)
  return s.spiritStones >= diff.spiritCost
})

const idleDashboard = computed(() => {
  const s = store()
  return {
    victories: runStats.value.victories,
    defeats: runStats.value.defeats,
    winRate: (runStats.value.victories + runStats.value.defeats) > 0
      ? ((runStats.value.victories / (runStats.value.victories + runStats.value.defeats)) * 100).toFixed(1) + '%'
      : '0%',
    totalSpiritStones: runStats.value.spiritStones,
    totalCultivation: runStats.value.cultivation,
    totalEquipment: runStats.value.equipment,
    encounterCount: idleEncounterCount.value,
    buildRatio: buildRatio.value,
    totalPhantomCrystals: runStats.value.phantomCrystals,
    // 真实伤害统计（仪表盘「总造成伤害/总受到伤害」，按场累加）
    totalDamageDealt: runStats.value.totalDamageDealt,
    totalDamageTaken: runStats.value.totalDamageTaken,
    // BOSS 挑战券与 BOSS 素材获得统计（仪表盘显示）
    totalBossTickets: runStats.value.bossTickets,
    totalBossMaterials: runStats.value.bossMaterials,
    // 角色定位效果统计
    roleEffects: {
      healAmount: runStats.value.healAmount,
      shieldAmount: runStats.value.shieldAmount,
      damageBoost: runStats.value.damageBoost + '次',
      buffCount: runStats.value.buffCount
    },
    activeBuffs: idleBuffs.value.map(b => ({
      name: b.name,
      type: b.type,
      typeName: { cultivation: '修炼效率', combat: '战斗能力', attack: '攻击力', speed: '速度', luck: '气运' }[b.type] || b.type,
      value: b.value,
      valueText: (b.value > 0 ? '+' : '') + formatBuffPercent(b.value),
      remaining: b.remaining
    })),
    teamHP: teamMemberStates.value.map(ms => ({
      name: ms.name,
      hp: ms.hp,
      maxHP: ms.maxHP,
      hpPercent: ms.maxHP > 0 ? ((ms.hp / ms.maxHP) * 100).toFixed(0) + '%' : '0%'
    })),
    // 最近获得的装备（按时间倒序，最多展示 6 件），即时反映到仪表盘
    recentEquipment: (foundEquipment.value || []).slice(-6).reverse().map(eq => ({
      id: eq.id,
      name: eq.name,
      slot: eq.slot || eq.type,
      slotName: ({head:'头部',body:'衣服',legs:'裤子',feet:'鞋子',shoulder:'肩甲',hands:'手套',wrist:'护腕',necklace:'项链',ring1:'戒指1',ring2:'戒指2',belt:'腰带',artifact:'法宝'})[eq.slot || eq.type] || (eq.slot || eq.type),
      rarity: eq.rarity,
      rarityName: (eq.qualityInfo && eq.qualityInfo.name) || eq.rarity || '',
      color: (eq.qualityInfo && eq.qualityInfo.color) || '#9e9e9e',
      score: calculateEquipmentScore(eq),
      stats: eq.stats,
      affixes: eq.affixes,
      time: eq._pickedAt || Date.now()
    })),
    totalPhantomCrystals: runStats.value.phantomCrystals,
    // 当前挂机遭遇的怪物状态（挂机仪表盘怪物状态面板）
    enemy: currentIdleEnemy.value || null
  }
})

export function useIdleSystem() {
  return {
    // 状态
    zones,
    selectedZone,
    selectedDifficultyKey,
    isIdling,
    logs,
    displayLogs,
    clearIdleLogs,
    idleEncounterCount,
    idleProgress,
    idleTimeRemaining,
    lastSummary,
    combatState,
    animState,
    treasureFlash,
    canStartIdle,
    teamMemberStates,
    foundEquipment,
    currentEncounterSummary,
    idleBuffs,
    idlePlayerHP,
    idlePlayerMaxHP,
    idlePlayerDefeated,
    currentIdleEnemy,
    currentEncounter,
    idleCombatLog,
    bossSpawned,
    bossDefeated,
    bossSpawnRound,
    bossTimeRemaining,
    bossRoundsCleared,
    bossRoundsFailed,
    idleDiag,
    // BOSS 挑战系统
    bossChallengeResult,
    runBossChallenge,
    isBossChallengeInProgress,
    bossChallengeRound,
    bossChallengeTotalRounds,
    bossChallengeBossName,
    bossChallengeZoneName,
    bossChallengeSummary,
    // Build 强度 / 血条
    playerBuildStrength,
    currentRecommendedBuild,
    buildRatio,
    idleDashboard,
    // 丹药 buff
    activePillBuffList,
    getPillBuffMultiplier,
    // 方法
    setSelectedZone: (z) => { selectedZone.value = z },
    setDifficulty: (k) => { selectedDifficultyKey.value = k },
    startIdle,
    stopIdle,
    initIdle,
    runManualBattle,
    executeRound,
    grantReward,
    showTreasureFlash,
    hideTreasureFlash,
    buildEffectiveZone,
    getZoneDifficulty
  }
}
