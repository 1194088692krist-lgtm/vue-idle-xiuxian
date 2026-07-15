import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { zones, getZoneById, getZoneDifficulty } from '../plugins/zones'
import { CombatManager, CombatEntity, CombatType } from '../plugins/combat'
import { getRandomHerb, getRandomOre, getRandomLiquid, getRandomCore, getRandomSpecial } from '../plugins/materials'
import { getAffixesForSlot, setBonuses, rarityConfig, calculateEquipmentScore } from '../plugins/buildSystem'
import { equipmentNameParts } from '../plugins/gacha'
import { BOSS_MATERIALS, getBossEncounterChance, ZONE_BOSSES } from '../plugins/cultivationSystem'

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
const runStats = ref({ victories: 0, defeats: 0, spiritStones: 0, cultivation: 0, equipment: 0, exp: 0, healAmount: 0, buffCount: 0, shieldAmount: 0, damageBoost: 0, phantomCrystals: 0 })
const foundEquipment = ref([])       // 本次挂机获得的装备列表
const currentEncounterSummary = ref(null) // 实时显示当前最新结算画面
const idleBuffs = ref([])            // 本次挂机中生效的小剧场 buff

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
      const bleed = Math.floor((memberState.baseStats?.attack || memberState.damage || 0) * 0.15)
      return { type: 'damage_over_time', value: bleed, desc: `${memberState.name}触发刀锋连击，敌人陷入流血状态，每秒受到 ${bleed} 伤害` }
    }
  },
  herb: {
    name: '药引治疗',
    effect: (memberState, teamStates) => {
      const healAmount = Math.floor((memberState.baseStats?.health || memberState.maxHealth || 0) * 0.15)
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
      const absorb = Math.floor((memberState.baseStats?.defense || memberState.defense || 0) * 0.2)
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
  return team.reduce((sum, member) => sum + s.getCharacterBuildStrength(member), 0)
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

// 在线每场遭遇间隔：15 秒
const ENCOUNTER_INTERVAL = 15000

let _store = null
function store() {
  if (!_store) _store = usePlayerStore()
  return _store
}

let idleInterval = null
let idleTimer = null
let isRunning = false // 重入锁
let idleEncounterErrorCount = 0 // 挂机遭遇异常日志去重计数（避免刷屏）

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

function addLog(type, text, detail = null) {
  if (!isIdling.value) {
    logs.value.push({ type, text, detail, time: new Date().toLocaleTimeString() })
    if (logs.value.length > 400) logs.value = logs.value.slice(-400)
    return
  }

  if (pendingLogs.value.length === 0) {
    firstPendingLogTime = Date.now()
  }
  pendingLogs.value.push({ type, text, detail, time: new Date().toLocaleTimeString() })

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

// 品质权重：低品质权重高，高品质极低，避免高稀有度物品泛滥
const EQUIP_RARITY_WEIGHTS = {
  common: 500, uncommon: 45, rare: 10, epic: 10, legendary: 0.3, mythic: 0.075
}
const PET_RARITY_WEIGHTS = {
  mortal: 500, spiritual: 30, mystic: 6, celestial: 0.45, divine: 0.075
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
  uncommon:  { icon: '🌿', word: '获得', flair: '，微光初绽' },
  rare:      { icon: '💎', word: '获得', flair: '，蓝光流转' },
  spiritual: { icon: '🌿', word: '收服', flair: '，灵光乍现' },
  epic:      { icon: '🌟', word: '获得', flair: '，紫气东来' },
  mystic:    { icon: '✨', word: '收服', flair: '，玄光环绕' },
  legendary: { icon: '🔥', word: '获得', flair: '，金光万丈，天地同贺' },
  celestial: { icon: '🌟', word: '收服', flair: '，仙光普照' },
  mythic:    { icon: '⚡', word: '获得', flair: '，神辉冲霄，异象惊世' },
  divine:    { icon: '🔆', word: '收服', flair: '，神兽降世，瑞彩千条' }
}

function buildDropText(reward, info) {
  const rarity = reward.rarity
  if (rarity === 'common' || rarity === 'mortal') {
    return `⚔️ ${reward.type === 'pet' ? '收服' : '获得'}【${reward.name}】（${info.name}）`
  }
  const t = DROP_TEXT[rarity] || DROP_TEXT.uncommon
  return `${t.icon} ${t.word}【${reward.name}】${t.flair}！`
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
    dropBonus: diff.dropBonus
  }
}

// ============ 装备 / 灵宠 / 敌人生成 ============
const SLOTS = ['weapon', 'head', 'body', 'legs', 'feet', 'shoulder', 'hands', 'wrist', 'necklace', 'ring1', 'ring2', 'belt']
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

function createBossEnemy(bossData, effectiveZone) {
  const secretLv = effectiveZone.difficulty
  const baseStats = {
    health: bossData.stats.health,
    maxHealth: bossData.stats.health,
    damage: bossData.stats.attack,
    defense: bossData.stats.defense || 0,
    speed: bossData.stats.speed || 10,
    critRate: Math.min(0.2, 0.02 + secretLv * 0.01 + 0.1),
    comboRate: Math.min(0.1, 0.01 + secretLv * 0.005),
    counterRate: Math.min(0.1, 0.01 + secretLv * 0.005),
    stunRate: Math.min(0.08, 0.01 + secretLv * 0.003),
    dodgeRate: Math.min(0.12, 0.02 + secretLv * 0.008),
    vampireRate: Math.min(0.08, 0.01 + secretLv * 0.003),
    critResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    comboResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    counterResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    stunResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    dodgeResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    vampireResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    healBoost: 0,
    critDamageBoost: 0.3,
    critDamageReduce: 0,
    finalDamageBoost: Math.min(0.2, secretLv * 0.01 + 0.1),
    finalDamageReduce: Math.min(0.1, secretLv * 0.01),
    combatBoost: 0,
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
  
  const baseStats = {
    health: Math.floor(effectiveZone.recommendedStats.health * 0.6 * scale),
    damage: Math.floor(effectiveZone.recommendedStats.attack * 0.4 * scale),
    defense: Math.floor(effectiveZone.recommendedStats.attack * 0.1 * scale),
    speed: 5 + secretLv * 2,
    critRate: Math.min(0.15, 0.02 + secretLv * 0.01),
    comboRate: Math.min(0.1, 0.01 + secretLv * 0.005),
    counterRate: Math.min(0.1, 0.01 + secretLv * 0.005),
    stunRate: Math.min(0.08, 0.01 + secretLv * 0.003),
    dodgeRate: Math.min(0.12, 0.02 + secretLv * 0.008),
    vampireRate: Math.min(0.08, 0.01 + secretLv * 0.003),
    critResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    comboResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    counterResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    stunResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    dodgeResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    vampireResist: Math.min(0.1, 0.01 + secretLv * 0.003),
    healBoost: 0,
    critDamageBoost: 0.3,
    critDamageReduce: 0,
    finalDamageBoost: Math.min(0.1, secretLv * 0.01),
    finalDamageReduce: Math.min(0.1, secretLv * 0.01),
    combatBoost: 0,
    resistanceBoost: 0,
    maxHealth: Math.floor(effectiveZone.recommendedStats.health * 0.6 * scale)
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
  const bossMaterials = BOSS_MATERIALS[zoneId]
  if (!bossMaterials || !enemy.bossData) return drops
  
  const zoneBosses = ZONE_BOSSES[zoneId]
  const bossInfo = zoneBosses?.find(b => b.name === enemy.name)
  
  if (bossInfo) {
    const materialId = bossInfo.dropMaterial
    const dropChance = bossInfo.dropChance
    const material = bossMaterials.find(m => m.id === materialId)
    
    if (material && Math.random() < dropChance) {
      const materialItem = {
        id: materialId,
        name: material.name,
        type: 'boss_material',
        description: material.description
      }
      s.items.push(materialItem)
      drops.push(materialItem)
    }
  }
  
  return drops
}

function grantCombatDrops(enemy, zoneId = null) {
  const s = store()
  const drops = []
  const tier = enemy?.tier || 'normal'
  if (tier === 'boss') {
    if (Math.random() < 0.6) { const c = getRandomCore('boss'); s.gainMaterial(c); drops.push(c) }
    if (Math.random() < 0.08) { const sp = getRandomSpecial(); s.gainMaterial(sp); drops.push(sp) }
    if (Math.random() < 0.25) { const h = getRandomHerb({ difficulty: 9 }); s.gainMaterial(h); drops.push(h) }
    if (zoneId) {
      const bossDrops = grantBossMaterialDrops(enemy, zoneId)
      drops.push(...bossDrops)
    }
  } else if (tier === 'elite') {
    if (Math.random() < 0.5) { const c = getRandomCore('elite'); s.gainMaterial(c); drops.push(c) }
    const beast = getRandomCore('normal'); s.gainMaterial(beast); drops.push(beast)
  } else {
    if (Math.random() < 0.4) { const c = getRandomCore('normal'); s.gainMaterial(c); drops.push(c) }
  }
  return drops
}

function grantReward(effectiveZone, isIdleMode = false) {
  const s = store()
  const rewards = []
  const dropBonus = effectiveZone.dropBonus || 1
  // 掉落加成：小幅提升高品质概率
  const upgradeChance = Math.max(0, (dropBonus - 1) * 0.35)
  for (const rw of effectiveZone.rewards) {
    if (Math.random() < rw.chance) {
      const amount = Array.isArray(rw.amount)
        ? Math.floor(Math.random() * (rw.amount[1] - rw.amount[0] + 1)) + rw.amount[0]
        : rw.amount || 1
      const multiplied = Math.floor(amount * effectiveZone.rewardMultiplier)
      if (rw.type === 'spirit_stone') {
        s.spiritStones += multiplied
        runStats.value.spiritStones += multiplied
        rewards.push({ type: 'spirit_stone', amount: multiplied, name: '灵石' })
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
        const pool = [
          getRandomHerb({ difficulty: 9 }),
          ...(effectiveZone.difficulty >= 5 ? [getRandomOre({ difficulty: 9 }), getRandomLiquid({ difficulty: 9 })] : []),
          getRandomSpecial()
        ].filter(Boolean)
        const pickItem = pool[Math.floor(Math.random() * pool.length)]
        if (pickItem) { s.gainMaterial(pickItem); rewards.push({ type: 'fortune', amount: 1, name: '奇遇·' + pickItem.name, material: pickItem }) }
      } else if (rw.type === 'cultivation') {
        s.cultivate(multiplied)
        runStats.value.cultivation += multiplied
        rewards.push({ type: 'cultivation', amount: multiplied, name: '修为' })
      } else if (rw.type === 'equipment') {
        let rarity = pickRarityByWeight(rw.rarity, EQUIP_RARITY_WEIGHTS)
        if (Math.random() < upgradeChance) {
          const idx = rw.rarity.indexOf(rarity)
          if (idx >= 0 && idx < rw.rarity.length - 1) rarity = rw.rarity[idx + 1]
        }
        const equip = generateEquipment(rarity, effectiveZone)
        s.items.push(equip); s.itemsFound++
        runStats.value.equipment++
        const info = rarityInfo[rarity] || rarityInfo.common
        rewards.push({ type: 'equipment', name: equip.name, rarity, info, item: equip })
      } else if (rw.type === 'pet') {
        let rarity = pickRarityByWeight(rw.rarity, PET_RARITY_WEIGHTS)
        if (Math.random() < upgradeChance) {
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
  const crystalAmount = Math.max(1, Math.floor(crystalBase * (0.8 + Math.random() * 0.4)))
  s.phantomCrystals += crystalAmount
  runStats.value.phantomCrystals += crystalAmount
  rewards.push({ type: 'phantom_crystal', amount: crystalAmount, name: '幻灵结晶' })
  
  // 升星碎片：难度3以上有概率掉落，难度越高概率越大
  if (diff >= 3 && Math.random() < (diff - 2) * 0.15) {
    const fragmentAmount = Math.floor(1 + Math.random() * diff)
    s.petFragments += fragmentAmount
    rewards.push({ type: 'pet_fragment', amount: fragmentAmount, name: '升星碎片' })
  }
  
  return rewards
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function runSingleCombat(playerEntity, enemy, isIdleMode = false) {
  const manager = new CombatManager(playerEntity, enemy)
  manager.start()
  if (!isIdleMode) {
    combatState.value = { inCombat: true, combatManager: manager }
  }
  let safetyGuard = 0
  while (manager.state === 'in_progress' && safetyGuard < 200) {
    safetyGuard++
    const result = manager.executeTurn()
    if (!isIdleMode && result) {
      if (result.results && result.results.length > 0) {
        const firstAttack = result.results[0]
        if (firstAttack.attacker === playerEntity.name) {
          animState.value.playerAttack = true; animState.value.enemyHurt = true
          await sleep(400)
          animState.value.playerAttack = false; animState.value.enemyHurt = false
        } else {
          animState.value.enemyAttack = true; animState.value.playerHurt = true
          await sleep(400)
          animState.value.enemyAttack = false; animState.value.playerHurt = false
        }
      }
      if (!combatState.value.inCombat) break
      await sleep(300)
    }
    if (!result) break
    if (result.state === 'victory') {
      return { victory: true, manager, enemy }
    } else if (result.state === 'defeat') {
      return { victory: false, manager, enemy }
    }
  }
  return { victory: false, manager, enemy }
}

async function runExploreCombat(effectiveZone, encounterCount, isIdleMode = false, difficultyKey = 'xiongxian') {
  const playerEntity = createPlayerEntity()
  const enemyData = generateZoneEnemy(effectiveZone, encounterCount, difficultyKey)
  const allDrops = []
  
  if (enemyData.hasBoss && enemyData.allBosses.length > 1) {
    let finalVictory = true
    let lastManager = null
    let lastEnemy = null
    
    for (let i = 0; i < enemyData.allBosses.length; i++) {
      const boss = enemyData.allBosses[i]
      const result = await runSingleCombat(playerEntity, boss, isIdleMode)
      lastManager = result.manager
      lastEnemy = result.enemy
      
      if (!result.victory) {
        finalVictory = false
        break
      }
      
      const drops = grantCombatDrops(boss, effectiveZone.id)
      allDrops.push(...drops)
    }
    
    return { victory: finalVictory, manager: lastManager, enemy: lastEnemy || enemyData.mainEnemy, drops: allDrops, allBosses: enemyData.allBosses }
  }
  
  const mainEnemy = enemyData.mainEnemy
  const result = await runSingleCombat(playerEntity, mainEnemy, isIdleMode)
  
  if (result.victory) {
    const drops = grantCombatDrops(mainEnemy, effectiveZone.id)
    return { ...result, drops, allBosses: enemyData.allBosses }
  }
  
  return { ...result, drops: allDrops, allBosses: enemyData.allBosses }
}

// ============ 宝物高亮弹窗 ============
let flashTimer = null
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
  const duration = 5000
  treasureFlash.value = { show: true, tier, title, desc, icon, color: info.color }
  flashTimer = setTimeout(() => { treasureFlash.value.show = false }, duration)
}

function hideTreasureFlash() {
  if (flashTimer) clearTimeout(flashTimer)
  treasureFlash.value.show = false
}

// ============ 生动日志：单场遭遇 ============
function logEncounter(zone, diff, count, enemy, victory, rewards, loss, combatResults = [], roleEffects = []) {
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
      const damage = combatResult?.combatStats?.playerDamage || 0
      const tookDamage = combatResult?.combatStats?.playerTookDamage || 0
      const damageText = damage > 0 ? `\u521B\u6210 ${Math.floor(damage)} 点伤害` : ''
      const tookDamageText = tookDamage > 0 ? `\u53D7\u5230 ${Math.floor(tookDamage)} 点伤害` : ''
      const damageInfo = [damageText, tookDamageText].filter(Boolean).join('，')
      
      if (extras.length > 0 || damageInfo) {
        text += '（' + [...extras, damageInfo].filter(Boolean).join('·') + '）'
      }
      
      addLog('combat', text)
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
    const enemyStatusEffects = ['stun', 'bleed']
    const enemyStatusCount = 1 + Math.floor(Math.random() * 2)
    const shuffledStatus = [...enemyStatusEffects].sort(() => Math.random() - 0.5)
    const selectedStatus = shuffledStatus.slice(0, enemyStatusCount)
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
      addLog(cls, buildDropText(r, info), detail)
      showTreasureFlash(r)
    }

    for (const r of petRewards) {
      const info = r.info
      const detail = formatItemDetail(r.item, r.type, r.rarity)
      const rarity = r.rarity
      const cls = (rarity === 'common' || rarity === 'mortal') ? 'reward-normal' : 'drop-' + rarity
      addLog(cls, buildDropText(r, info), detail)
      showTreasureFlash(r)
    }

    for (const r of bossMaterialRewards) {
      addLog('drop-rare', `👑 获得 BOSS 素材【${r.name}】！此乃 ${enemy.name} 身上的珍贵材料，极为稀有！`)
      showTreasureFlash(r)
    }

    for (const r of fortuneRewards) {
      addLog('fortune', pick(FORTUNE_LINES)(r.material?.name || r.name))
      showTreasureFlash(r)
    }

    if (materialRewards.length > 0 || currencyRewards.length > 0) {
      const materialParts = []
      for (const r of materialRewards) {
        const icons = { herb: '🌿', ore: '⛏️', liquid: '💧', core: '💎', pet_fragment: '🌟', phantom_crystal: '✨' }
        const names = { herb: '灵草', ore: '矿料', liquid: '灵液', core: '妖兽内丹', pet_fragment: '升星碎片', phantom_crystal: '幻灵结晶' }
        materialParts.push(`${icons[r.type] || '🎁'} ${r.amount} ${names[r.type] || r.name}`)
      }
      for (const r of currencyRewards) {
        if (r.type === 'spirit_stone') {
          materialParts.push(`💰 ${r.amount} 灵石`)
        } else if (r.type === 'cultivation') {
          materialParts.push(`📈 ${r.amount} 修为`)
        }
      }
      addLog('reward-normal', `🎁 获得：${materialParts.join('，')}！`)
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

// ============ 挂机单次遭遇（在线，完整战斗模拟） ============
async function runIdleEncounter() {
  if (!isIdling.value) return
  // 防御：若 selectedZone 丢失（极端情况下组件状态异常），从持久化的 idleExploration.zoneId 恢复，
  // 确保后台挂机不会因状态丢失而静默中断（切换界面不应停止挂机）
  if (!selectedZone.value) {
    const saved = store().idleExploration
    if (saved && saved.zoneId) {
      const z = getZoneById(saved.zoneId)
      if (z) selectedZone.value = z
    }
    if (!selectedZone.value) return
  }
  if (isRunning) return
  isRunning = true
  const s = store()
  const zone = selectedZone.value
  const diff = getZoneDifficulty(zone, selectedDifficultyKey.value)
  // 难度配置缺失则跳过本次（不卡死重入锁，也不停止挂机）
  if (!diff) return
  // 注意：isRunning 必须在 try 内赋值，确保任何异常都能在 finally 中重置，
  // 否则重入锁会永久卡在 true，导致后续所有遭遇被跳过（表现为「挂机静默死掉」）
  let effectiveZone
  try {
    isRunning = true
    effectiveZone = buildEffectiveZone(zone, diff)
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
    const underBuilt = Math.max(0, 1 - ratio)
    
    let allDead = true
    let aliveCount = 0
    const teamResults = []
    
    for (const memberState of teamMemberStates.value) {
      if (memberState.hp <= 0) continue
      allDead = false
      aliveCount++
      
      const memberRatio = memberState.buildStrength / (currentRecommendedBuild.value / teamMemberStates.value.length)
      const memberUnderBuilt = Math.max(0, 1 - memberRatio)
      
      const result = await runExploreCombatForMember(effectiveZone, count, memberState, true, selectedDifficultyKey.value)
      teamResults.push({ member: memberState, result })
      
      if (result.victory) {
        const maxHP = memberState.maxHP
        const scrape = Math.round(maxHP * (0.05 + 0.15 * memberUnderBuilt))
        memberState.hp = Math.min(maxHP, memberState.hp + Math.round(maxHP * 0.10) - scrape)
      } else {
        const maxHP = memberState.maxHP
        const hurt = Math.round(maxHP * (0.30 + 0.40 * memberUnderBuilt))
        memberState.hp -= hurt
        memberState.hp = Math.max(0, memberState.hp)
      }
    }
    
    const victory = teamResults.some(r => r.result.victory)
    let rewards = []
    let loss = 0
    let roleEffects = []
    
    if (victory) {
      rewards = grantReward(effectiveZone, true)
      s.dungeonTotalKills++; s.explorationCount++
      const recoverRatio = Math.max(0.3, 0.8 - effectiveZone.difficulty * 0.06)
      const recovered = Math.max(1, Math.round(diff.spiritCost * recoverRatio))
      s.spiritStones += recovered
      runStats.value.spiritStones += recovered
      const cultBonus = Math.round(5 * effectiveZone.difficulty * (1 + ratio * 0.5))
      s.cultivate(cultBonus)
      runStats.value.cultivation += cultBonus
      if (count % 20 === 0 && Math.random() < 0.5) {
        const fortunePool = [getRandomHerb({ difficulty: 9 }), getRandomOre({ difficulty: 9 }), getRandomLiquid({ difficulty: 9 }), getRandomSpecial()].filter(Boolean)
        const fp = fortunePool[Math.floor(Math.random() * fortunePool.length)]
        if (fp) { s.gainMaterial(fp); rewards.push({ type: 'fortune', amount: 1, name: '奇遇·' + fp.name, material: fp }) }
      }
      runStats.value.victories++
      const expGain = Math.round(10 * effectiveZone.difficulty)
      runStats.value.exp += expGain
      teamMemberStates.value.forEach(ms => {
        if (ms.hp > 0) {
          s.addCharacterExperience(ms.memberId, expGain)
        }
      })
      
      rewards.forEach(r => {
        if (r.type === 'equipment') {
          r.item._pickedAt = Date.now()
          foundEquipment.value.push(r.item)
        }
      })
      
      // 触发角色定位特殊效果
      for (const memberState of teamMemberStates.value) {
        if (memberState.hp <= 0) continue
        const member = s.sectMembers.find(m => m.id === memberState.memberId)
        if (!member) continue
        const role = member.role || 'vanguard'
        const roleEffect = ROLE_EFFECTS[role]
        if (roleEffect) {
          const effectResult = roleEffect.effect(memberState, teamMemberStates.value)
          if (effectResult) {
            roleEffects.push({ ...effectResult, memberName: member.name })
            // 更新统计数据
            if (effectResult.type === 'heal') {
              runStats.value.healAmount += effectResult.value
            } else if (effectResult.type === 'shield') {
              runStats.value.shieldAmount += effectResult.value
            } else if (effectResult.type === 'damage_boost' || effectResult.type === 'attack_buff') {
              runStats.value.damageBoost++
            } else if (effectResult.type === 'damage_over_time') {
              runStats.value.buffCount++
            }
          }
        }
      }
    } else {
      loss = Math.floor(s.cultivationPool * 0.05)
      s.cultivationPool = Math.max(0, s.cultivationPool - loss)
      s.dungeonDeathCount++
      runStats.value.defeats++
    }
    
    const firstResult = teamResults[0]
    const enemyData = firstResult?.result?.enemy ? { mainEnemy: firstResult.result.enemy, allBosses: firstResult.result.allBosses || [] } : generateZoneEnemy(effectiveZone, count, selectedDifficultyKey.value)
    const enemy = enemyData.mainEnemy
    
    // 收集所有成员的战斗结果数据
    const combatResults = teamResults.map(tr => ({
      memberId: tr.member.memberId,
      memberName: tr.member.name,
      victory: tr.result.victory,
      combatStats: tr.result.combatStats || {},
      enemy: tr.result.enemy
    }))
    
    logEncounter(zone, diff, count, enemy, victory, rewards, loss, combatResults, roleEffects)
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
      finishIdle()
      return
    }
  } catch (err) {
    // 单次遭遇异常只跳过本次，不卡死重入锁、不终止挂机；最多记录 3 次避免刷屏
    if (idleEncounterErrorCount < 3) {
      addLog('warning', '挂机遭遇结算异常，已跳过本次并继续：' + (err && err.message ? err.message : String(err)))
      idleEncounterErrorCount++
    }
  } finally {
    isRunning = false
  }
}

async function runExploreCombatForMember(effectiveZone, encounterCount, memberState, isIdleMode = false, difficultyKey = 'xiongxian') {
  const s = store()
  const member = s.sectMembers.find(m => m.id === memberState.memberId)
  if (!member) {
    return { victory: false, enemy: null }
  }
  
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
  
  const playerEntity = new CombatEntity(member.name, member.level, stats, member.schoolName)
  const enemyData = generateZoneEnemy(effectiveZone, encounterCount, difficultyKey)
  const allDrops = []
  
  const combatStats = {
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
    vampireCount: 0
  }
  
  const collectTurnResults = (results) => {
    if (!results) return
    for (const r of results) {
      if (r.attacker === playerEntity.name) {
        combatStats.playerDamage += r.damage
        if (r.isCrit) combatStats.critCount++
        if (r.isCombo) combatStats.comboCount++
      } else {
        combatStats.enemyDamage += r.damage
        combatStats.playerTookDamage += r.damage
      }
      if (r.isDodged) combatStats.dodgeCount++
    }
  }
  
  if (enemyData.hasBoss && enemyData.allBosses.length > 1) {
    let finalVictory = true
    let lastManager = null
    let lastEnemy = null
    
    for (let i = 0; i < enemyData.allBosses.length; i++) {
      const boss = enemyData.allBosses[i]
      const manager = new CombatManager(playerEntity, boss)
      manager.start()
      
      let safetyGuard = 0
      let combatResult = null
      while (manager.state === 'in_progress' && safetyGuard < 200) {
        safetyGuard++
        const result = manager.executeTurn()
        combatStats.rounds++
        collectTurnResults(result?.results)
        if (!result) break
        if (result.state === 'victory' || result.state === 'defeat') {
          combatResult = result
          break
        }
      }
      
      lastManager = manager
      lastEnemy = boss
      
      if (!combatResult || combatResult.state !== 'victory') {
        finalVictory = false
        break
      }
      
      const drops = grantCombatDrops(boss, effectiveZone.id)
      allDrops.push(...drops)
    }
    
    return { victory: finalVictory, manager: lastManager, enemy: lastEnemy || enemyData.mainEnemy, drops: allDrops, allBosses: enemyData.allBosses, combatStats }
  }
  
  const mainEnemy = enemyData.mainEnemy
  const manager = new CombatManager(playerEntity, mainEnemy)
  manager.start()
  
  let safetyGuard = 0
  while (manager.state === 'in_progress' && safetyGuard < 200) {
    safetyGuard++
    const result = manager.executeTurn()
    combatStats.rounds++
    collectTurnResults(result?.results)
    if (!result) break
    if (result.state === 'victory') {
      const drops = grantCombatDrops(mainEnemy, effectiveZone.id)
      return { victory: true, manager, enemy: mainEnemy, drops, allBosses: enemyData.allBosses, combatStats }
    } else if (result.state === 'defeat') {
      return { victory: false, manager, enemy: mainEnemy, allBosses: enemyData.allBosses, combatStats }
    }
  }
  return { victory: false, manager, enemy: mainEnemy, allBosses: enemyData.allBosses, combatStats }
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
  const recBuild = diff.recommendedBuild || 1
  const ratio = (s.buildStrength || 1) / recBuild
  const winChance = Math.min(0.97, Math.max(0.08,
    0.5 + (ratio - 1) * 0.45 + (pAtk - diff.recommendedStats.attack) * 0.005 + (pHp - diff.recommendedStats.health) * 0.0005))
  const victory = Math.random() < winChance
  const effectiveZone = buildEffectiveZone(zone, diff)
  if (victory) {
    const rewards = grantReward(effectiveZone, true)
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
    if (remaining <= 0) finishIdle()
  }, 1000)
}

function startIdle(durationMinutes) {
  const s = store()
  if (!selectedZone.value) return
  const diff = getZoneDifficulty(selectedZone.value, selectedDifficultyKey.value)
  if (s.spiritStones < diff.spiritCost) return
  s.startIdleExploration(selectedZone.value.id, selectedDifficultyKey.value, durationMinutes)
  isIdling.value = true
  idleEncounterErrorCount = 0
  idleEncounterCount.value = 0
  runStats.value = { victories: 0, defeats: 0, spiritStones: 0, cultivation: 0, equipment: 0, exp: 0, healAmount: 0, buffCount: 0, shieldAmount: 0, damageBoost: 0, phantomCrystals: 0 }
  foundEquipment.value = []
  logs.value = []
  currentEncounterSummary.value = null
  idleBuffs.value = []

  const team = s.getTeamMembersDetail()
  teamMemberStates.value = team.map(member => {
    let maxHP = member.baseStats?.health || 0
    const talentStats = member.talentStats || {}
    const talentHealthMult = 1 + (talentStats.health || 0)
    maxHP = Math.floor(maxHP * talentHealthMult)
    
    const artifacts = member.equippedArtifacts || {}
    let equipHealthFlat = 0
    let equipHealthPct = 0
    Object.values(artifacts).forEach(eq => {
      if (!eq) return
      if (eq.stats?.health) equipHealthFlat += eq.stats.health
      if (eq.affixes) {
        eq.affixes.forEach(a => {
          if (a.stat === 'health') {
            if (a.valueType === 'percent') equipHealthPct += a.value
            else equipHealthFlat += a.value
          }
        })
      }
    })
    maxHP = Math.floor((maxHP + equipHealthFlat) * (1 + equipHealthPct))
    
    if (member.equippedPet?.combatAttributes?.health) {
      maxHP += member.equippedPet.combatAttributes.health
    }
    
    return {
      memberId: member.id,
      name: member.name,
      hp: maxHP,
      maxHP: maxHP,
      buildStrength: s.getCharacterBuildStrength(member)
    }
  })
  
  logs.value.push({ type: 'info', text: `开始挂机探索【${selectedZone.value.name}·${diff.label}】，预计 ${durationMinutes} 分钟，每 ${ENCOUNTER_INTERVAL / 1000} 秒一场遭遇`, time: new Date().toLocaleTimeString() })
  logs.value.push({ type: 'info', text: `🚀 出战阵容：${team.map(m => m.name).join('、') || '无成员'}`, time: new Date().toLocaleTimeString() })
  const match = Math.round(buildRatio.value * 100)
  if (buildRatio.value < 1) {
    logs.value.push({ type: 'warning', text: `⚠️ 队伍 Build 强度（${Math.round(playerBuildStrength.value)}）低于推荐值（${Math.round(currentRecommendedBuild.value)}），匹配度 ${match}%，成员气血可能不支、挂机或提前力竭。`, time: new Date().toLocaleTimeString() })
  } else {
    logs.value.push({ type: 'info', text: `🛡️ Build 匹配度 ${match}%，队伍气血充盈，可稳定挂机。`, time: new Date().toLocaleTimeString() })
  }
  startIdleTimers()
  s.queueSave()
  s.saveToCurrentSlot().catch(err => console.error('挂机开始自动存档失败:', err))
}

function stopIdle() { finishIdle() }

function finishIdle() {
  if (!isIdling.value) return
  if (idleInterval) clearInterval(idleInterval)
  if (idleTimer) clearInterval(idleTimer)
  idleInterval = null; idleTimer = null
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
    defeated: allDead,
    logs: [...logs.value],
    equipmentList: [...foundEquipment.value],
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
  const s = store()
  const idleState = s.idleExploration
  if (!idleState || !idleState.isActive) return
  const zone = getZoneById(idleState.zoneId)
  if (!zone) { s.stopIdleExploration(); return }
  const diff = getZoneDifficulty(zone, idleState.difficultyKey)
  const now = Date.now()
  const elapsed = now - idleState.startTime
  const totalDuration = idleState.duration
  const expected = Math.floor(elapsed / ENCOUNTER_INTERVAL)
  const missed = Math.max(0, expected - idleState.encounterCount)
  if (missed > 0) {
    logs.value.push({ type: 'info', text: `⏳ 离线期间完成了 ${missed} 次探索，正在结算……`, time: new Date().toLocaleTimeString() })
    for (let i = 0; i < missed; i++) {
      runOfflineEncounter(zone, diff, idleState.encounterCount + i + 1)
    }
    // 离线补算结算后立即同步落盘，防止补算收益丢失
    s.saveData()
  }
  finishIdle()
}

// App.vue 常驻初始化：恢复挂机状态并启动推进
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
      runStats.value = { victories: 0, defeats: 0, spiritStones: 0, cultivation: 0, equipment: 0, exp: 0, healAmount: 0, buffCount: 0, shieldAmount: 0, damageBoost: 0, phantomCrystals: 0 }
      logs.value = []
      startIdleTimers()
      processOfflineIdle()
    } else {
      s.stopIdleExploration()
    }
  }
}

const displayLogs = computed(() => (isIdling.value ? logs.value : lastSummary.value?.logs || []))
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
      slotName: ({weapon:'武器',head:'头部',body:'衣服',legs:'裤子',feet:'鞋子',shoulder:'肩甲',hands:'手套',wrist:'护腕',necklace:'项链',ring1:'戒指1',ring2:'戒指2',belt:'腰带',artifact:'法宝'})[eq.slot || eq.type] || (eq.slot || eq.type),
      rarity: eq.rarity,
      rarityName: (eq.qualityInfo && eq.qualityInfo.name) || eq.rarity || '',
      color: (eq.qualityInfo && eq.qualityInfo.color) || '#9e9e9e',
      score: calculateEquipmentScore(eq),
      stats: eq.stats,
      affixes: eq.affixes,
      time: eq._pickedAt || Date.now()
    })),
    totalPhantomCrystals: runStats.value.phantomCrystals
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
    // Build 强度 / 血条
    playerBuildStrength,
    currentRecommendedBuild,
    buildRatio,
    idleDashboard,
    // 方法
    setSelectedZone: (z) => { selectedZone.value = z },
    setDifficulty: (k) => { selectedDifficultyKey.value = k },
    startIdle,
    stopIdle,
    initIdle,
    runExploreCombat,
    grantReward,
    showTreasureFlash,
    hideTreasureFlash,
    buildEffectiveZone,
    getZoneDifficulty
  }
}
