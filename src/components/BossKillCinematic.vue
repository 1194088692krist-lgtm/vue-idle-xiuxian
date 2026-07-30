<template>
  <!-- 击杀BOSS立绘突入演出层：纯CSS动画，GPU合成层，pointer-events:none不挡挂机 -->
  <teleport to="body">
    <div v-if="show" class="boss-kill-cinematic" aria-hidden="true">
      <!-- 全屏一闪：斩杀冲击白光 -->
      <div :key="`flash-${animKey}`" class="kill-flash"></div>
      <!-- 中心顿帧光晕 -->
      <div :key="`glow-${animKey}`" class="kill-glow"></div>
      <!-- 击杀者立绘：左下突入→中心旋转→右上消失，纯 transform+opacity 走 GPU 合成层 -->
      <!-- :key=animKey 强制每次击杀都重建 <img>，确保 CSS 动画可靠重启
           （旧实现复用同一 <img> 仅换 src 时 CSS 动画不会重启，导致挂机连斩第二只起立绘不再弹出） -->
      <img
        v-if="portraitUrl"
        :key="`portrait-${animKey}`"
        :src="portraitUrl"
        class="kill-portrait"
        :alt="killerName"
        @animationend="onPortraitAnimEnd"
      />
      <!-- 灵宠立绘：人物立绘弹出 1s 后从另一侧（右下→中心→左上）弹出，与人物相差约 1s -->
      <img
        v-if="petPortraitUrl && petShow"
        :key="`pet-${petAnimKey}`"
        :src="petPortraitUrl"
        class="kill-pet-portrait"
        :alt="petName"
        @animationend="onPetAnimEnd"
      />
      <!-- 几片飘动粒子（灵光） -->
      <div :key="`p1-${animKey}`" class="kill-particle p1"></div>
      <div :key="`p2-${animKey}`" class="kill-particle p2"></div>
      <div :key="`p3-${animKey}`" class="kill-particle p3"></div>
      <!-- 击杀文案 -->
      <div :key="`text-${animKey}`" class="kill-text">
        <div class="kill-subtitle">斩杀</div>
        <div class="kill-bossname">{{ bossName }}</div>
      </div>
      <!-- 连击特效：count（一杀）在立绘左侧垂直行文，text（成语）在立绘右侧垂直行文 -->
      <div
        v-if="comboText"
        :key="`combo-${animKey}`"
        class="kill-combo"
        :class="comboClass"
        :style="{ animationDelay: comboFadeDelay + 's', '--combo-font-size': comboFontSize }"
      >
        <div class="combo-count">
          <span
            v-for="(ch, i) in comboCountChars"
            :key="i"
            :style="{ animationDelay: (i * 0.2) + 's' }"
          >{{ ch }}</span>
        </div>
        <div class="combo-text">
          <span
            v-for="(ch, i) in comboTextChars"
            :key="i"
            class="combo-char"
            :style="{ animationDelay: (i * 0.168) + 's' }"
          >{{ ch }}</span>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, computed, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useIdleSystem } from '../composables/useIdleSystem'
import { usePlayerStore } from '../stores/player'
import { getCharacterAvatar, getCharacterSkinUrl, getSkinCount } from '../plugins/characters'
import { getPetAvatar, getPetSkinUrl, getPetSkinCount, getUnlockedSkinCount, getPetTemplateId } from '../plugins/pets'

const { bossKillEvent, teamMemberStates } = useIdleSystem()
const playerStore = usePlayerStore()
const route = useRoute()

const show = ref(false)
const portraitUrl = ref(null)
const killerName = ref('')
const bossName = ref('')
// 每次击杀递增的动画 key，强制 <img> 重建以重启 CSS 动画
const animKey = ref(0)

// 灵宠立绘状态：人物立绘弹出 1s 后再弹出，与人物相差约 1s
const petShow = ref(false)
const petPortraitUrl = ref(null)
const petName = ref('')
const petAnimKey = ref(0)
let petDelayTimer = null

// 连击文案：count（如"一杀"）与 text（如"势如破竹"）分两行显示
// 分离后 text 行字数固定为四字/五字/七字等，字号自适应只针对 text 行
// count 行小字固定字号，不再参与自适应，避免与 text 行相互挤压
const comboCount = ref('')
const comboText = ref('')
const comboClass = ref('')
// 逐字显示：将 text 拆成单字数组，配合 CSS animation-delay 实现一字一字弹出
const comboTextChars = computed(() => Array.from(comboText.value || ''))
// count 也拆字竖排：每个字单独 span，逐字淡入
const comboCountChars = computed(() => Array.from(comboCount.value || ''))
// 整体淡出延迟：等所有字逐字砸入完成 + 停留后，整体一起消失
// 节奏再次调快30%：逐字间隔 0.24→0.168，入场 0.6→0.42，停留 1.6→1.12
// 10 字文案总时长 = 9*0.168 + 0.42 + 1.12 = 3.05s，7s 间隔下充裕
const comboFadeDelay = computed(() => {
  const n = comboTextChars.value.length
  if (n === 0) return 0
  return (n - 1) * 0.168 + 0.42 + 1.12
})
// 字号自适应：仅针对 text 行（竖排），字数越多字号越小，避免竖排过高超出屏幕
// 竖排时每字占一行，10字 + gap 会很高，需要更激进的字号缩减
// ≤4字 → 68px，5字 → 56px，6-7字 → 46px，8-10字 → 36px，10+字 → 28px
const comboFontSize = computed(() => {
  const n = comboTextChars.value.length
  if (n <= 4) return 'clamp(48px, 8vw, 68px)'
  if (n === 5) return 'clamp(40px, 6.5vw, 56px)'
  if (n <= 7) return 'clamp(32px, 5.5vw, 46px)'
  if (n <= 10) return 'clamp(26px, 4.5vw, 36px)'
  return 'clamp(20px, 3.5vw, 28px)'
})

// ===== 连击系统：中文斩杀文案库 =====
// 按连杀次数分 10 个层级，强度递增（四字成语 → 五字 → 七字诗句 → 十字传奇）
// 文案来源：李白《侠客行》、贯休《献钱尚父》、古龙武侠、修仙小说常用意象
// 每层多条文案轮换，避免重复单调
// 每条文案格式：{ count: 'X杀', text: '成语/诗句' }
// 显示时 count 与 text 分两行，避免长文案单行撑爆屏幕，也更有层次感
const COMBO_TIERS = [
  // 第 1 杀：初斩·四字（凌厉但不夸张）
  { class: 'combo-1', lines: [
    { count: '一杀', text: '势如破竹' },
    { count: '一杀', text: '一击必杀' },
    { count: '一杀', text: '雷厉风行' },
    { count: '一杀', text: '剑出如虹' },
    { count: '一杀', text: '快如闪电' },
    { count: '一杀', text: '锋芒毕露' }
  ] },
  // 第 2 杀：连斩·四字（杀气渐起）
  { class: 'combo-2', lines: [
    { count: '二杀', text: '势不可挡' },
    { count: '二杀', text: '所向披靡' },
    { count: '二杀', text: '杀气腾腾' },
    { count: '二杀', text: '连斩双煞' },
    { count: '二杀', text: '双剑合璧' },
    { count: '二杀', text: '左右开弓' }
  ] },
  // 第 3 杀：凌厉·五字（如入无人境）
  { class: 'combo-3', lines: [
    { count: '三杀', text: '剑气纵横起' },
    { count: '三杀', text: '杀气盈原野' },
    { count: '三杀', text: '所向皆披靡' },
    { count: '三杀', text: '一剑斩乾坤' },
    { count: '三杀', text: '凌厉无匹敌' },
    { count: '三杀', text: '剑落惊风雨' }
  ] },
  // 第 4 杀：霸道·六字（横扫千军）
  { class: 'combo-4', lines: [
    { count: '四杀', text: '横扫千军如卷' },
    { count: '四杀', text: '一夫当关莫开' },
    { count: '四杀', text: '万军之中取首' },
    { count: '四杀', text: '剑气荡平八荒' },
    { count: '四杀', text: '杀伐果断无情' },
    { count: '四杀', text: '势若雷霆万钧' }
  ] },
  // 第 5 杀：王者·七字（大杀四方）
  { class: 'combo-5', lines: [
    { count: '五杀', text: '大杀四方震八荒' },
    { count: '五杀', text: '剑锋所指皆披靡' },
    { count: '五杀', text: '气吞山河万里红' },
    { count: '五杀', text: '杀尽奸邪不留行' },
    { count: '五杀', text: '一剑光寒动九州' },
    { count: '五杀', text: '血染黄沙战未休' }
  ] },
  // 第 6 杀：诗·七字（李白侠客行意象）
  { class: 'combo-6', lines: [
    { count: '六杀', text: '十步杀一人千里' },
    { count: '六杀', text: '事了拂衣深藏名' },
    { count: '六杀', text: '飒沓如流星杀尽' },
    { count: '六杀', text: '纵死侠骨犹留香' },
    { count: '六杀', text: '吴钩霜雪斩群魔' },
    { count: '六杀', text: '三杯吐诺重五岳' }
  ] },
  // 第 7 杀：狂·七字（贯休献钱尚父）
  { class: 'combo-7', lines: [
    { count: '七杀', text: '一剑霜寒十四州' },
    { count: '七杀', text: '满堂花醉三千客' },
    { count: '七杀', text: '冲天香阵透长安' },
    { count: '七杀', text: '剑气冲霄贯斗牛' },
    { count: '七杀', text: '杀气三声动天地' },
    { count: '七杀', text: '狂歌痛饮斩天骄' }
  ] },
  // 第 8 杀：超凡·八字（踏碎凌霄）
  { class: 'combo-8', lines: [
    { count: '八杀', text: '踏碎凌霄放肆桀骜' },
    { count: '八杀', text: '气吞万里猛如虎' },
    { count: '八杀', text: '一身转战三千里' },
    { count: '八杀', text: '一剑曾当百万师' },
    { count: '八杀', text: '剑破苍穹碎虚空' },
    { count: '八杀', text: '杀伐决断震九霄' }
  ] },
  // 第 9 杀：神威·九字（一剑光寒）
  { class: 'combo-9', lines: [
    { count: '九杀', text: '剑气纵横三万里' },
    { count: '九杀', text: '一剑光寒十九州' },
    { count: '九杀', text: '十步杀尽千人挡' },
    { count: '九杀', text: '千里不留行无踪' },
    { count: '九杀', text: '杀尽苍生不见血' },
    { count: '九杀', text: '剑出星辰皆黯淡' }
  ] },
  // 第 10+ 杀：传奇·十字（诗剑双绝）
  { class: 'combo-legendary', lines: [
    { count: '十杀', text: '剑气纵横三万里，一剑光寒十九州' },
    { count: '十杀', text: '十步杀一人，千里不留行' },
    { count: '十杀', text: '事了拂衣去，深藏身与名' },
    { count: '十杀', text: '一身转战三千里，一剑曾当百万师' },
    { count: '十杀', text: '满堂花醉三千客，一剑霜寒十四州' }
  ] }
]

// 连击窗口：每次击杀BOSS后 15 秒内再次击杀则连击+1，超时重置
const COMBO_WINDOW_MS = 15000
let comboTimerId = null
let currentCombo = 0

// 根据连杀数取对应层级文案（随机选一条，避免重复）
// 返回 { count: 'X杀', text: '成语/诗句', class: 'combo-N' }
function getComboTier(count) {
  if (count < 1) return { count: '', text: '', class: '' }
  const tierIdx = Math.min(count, COMBO_TIERS.length) - 1
  const tier = COMBO_TIERS[tierIdx]
  const line = tier.lines[Math.floor(Math.random() * tier.lines.length)]
  return { count: line.count, text: line.text, class: tier.class }
}

// 连击锁：防止两次击杀事件几乎同时到达时，bumpCombo 交错执行导致两组文字共存
// 场景：挂机一轮战斗可能连斩多只 BOSS，事件密集触发
// 修复：完全同步设置 comboText（不用 nextTick），Vue 响应式批处理会在 tick 结束后
// 只渲染一次；:key 绑定 animKey 确保每次都是全新 DOM 节点，旧节点被销毁不会共存
let comboBumping = false
function bumpCombo() {
  if (comboBumping) {
    // 上一次还在渲染中，直接累加计数但不重复触发渲染
    currentCombo++
    if (comboTimerId) clearTimeout(comboTimerId)
    comboTimerId = setTimeout(() => {
      currentCombo = 0
      comboCount.value = ''
      comboText.value = ''
      comboClass.value = ''
      comboTimerId = null
    }, COMBO_WINDOW_MS)
    return
  }
  comboBumping = true
  currentCombo++
  const tier = getComboTier(currentCombo)
  // 完全同步设置：与 watch 中的 animKey++ 在同一同步执行栈内
  // Vue 会在本次 tick 结束后批量渲染：旧节点（旧 animKey）销毁，新节点（新 animKey）创建
  // 不会有"旧节点渲染新文案字符"的中间态
  comboCount.value = tier.count
  comboText.value = tier.text
  comboClass.value = tier.class
  // 锁在下一次宏任务（setTimeout 0）释放，确保 Vue 已完成本次渲染
  setTimeout(() => { comboBumping = false }, 0)
  // 重置连击窗口计时器
  if (comboTimerId) clearTimeout(comboTimerId)
  comboTimerId = setTimeout(() => {
    currentCombo = 0
    comboCount.value = ''
    comboText.value = ''
    comboClass.value = ''
    comboTimerId = null
  }, COMBO_WINDOW_MS)
}

// 清理所有挂起的延时任务，防止组件卸载后仍 setState
function clearPendingTimers() {
  if (comboTimerId) { clearTimeout(comboTimerId); comboTimerId = null }
  if (petDelayTimer) { clearTimeout(petDelayTimer); petDelayTimer = null }
  if (hideTimerId) { clearTimeout(hideTimerId); hideTimerId = null }
}

onUnmounted(() => {
  clearPendingTimers()
})

// 监听路由变化：特效播放中途切走到其他页面时立即隐藏
// 用户期望切走即不显示战斗特效，避免残留演出遮挡其他页面
watch(() => route.path, (newPath) => {
  if (newPath !== '/exploration' && show.value) {
    show.value = false
    portraitUrl.value = null
    petShow.value = false
    petPortraitUrl.value = null
    // 连击状态也一并清空
    comboCount.value = ''
    comboText.value = ''
    comboClass.value = ''
    if (comboTimerId) { clearTimeout(comboTimerId); comboTimerId = null }
    if (petDelayTimer) { clearTimeout(petDelayTimer); petDelayTimer = null }
    if (hideTimerId) { clearTimeout(hideTimerId); hideTimerId = null }
  }
})

// ===== 兜底隐藏：动画结束后或超时后强制隐藏，防止 animationend 未触发导致 show 卡死 =====
// 时长全部延长为原两倍后，兜底时长同步翻倍
let hideTimerId = null
function scheduleAutoHide() {
  if (hideTimerId) clearTimeout(hideTimerId)
  // 立绘 3.6s + 灵宠 2s 延迟 + 3.6s ≈ 9.2s，文案最后一字 delay ≈ 9*0.36+0.9+2.4+1.0 ≈ 7.5s，给 16s 兜底
  hideTimerId = setTimeout(() => {
    if (show.value) {
      show.value = false
      portraitUrl.value = null
      petShow.value = false
      petPortraitUrl.value = null
    }
    hideTimerId = null
  }, 16000)
}

// 记录已演出过的批次：同批次连挑仅第 0 场演出立绘，避免 N 次全屏动画叠加卡顿
let lastShownBatchId = null

// 监听击杀事件，触发立绘突入动画
watch(bossKillEvent, (evt) => {
  // 诊断日志：确认 watch 是否被触发（排查挂机立绘不弹出的关键证据）
  console.log('[BossKillCinematic] watch 触发', evt)
  if (!evt || !evt.ts) {
    console.warn('[BossKillCinematic] 事件无效，跳过', evt)
    return
  }
  // 同批次去重：手动连挑 N 场时，仅第 0 场演出立绘动画（batchIndex === 0）
  // 后续场次仍会触发连击计数（bumpCombo），但不再弹出全屏立绘，避免 N 次动画叠加导致卡顿
  if (evt.batchId && evt.batchId === lastShownBatchId) {
    console.log('[BossKillCinematic] 同批次已演出，跳过立绘（batchIndex=' + evt.batchIndex + '）')
    // 仅累计连击，不演出立绘
    bumpCombo()
    return
  }
  // 仅在探索挂机页显示斩杀演出：切换到背包/炼丹等其他页面时不弹特效
  // 避免打断玩家在其他页面的操作，挂机仍正常进行只是不显示视觉演出
  if (route.path !== '/exploration') {
    console.log('[BossKillCinematic] 非探索页，跳过演出', route.path)
    return
  }
  // 设置开关关闭则不触发
  if (!playerStore.bossKillAnimation) {
    console.log('[BossKillCinematic] bossKillAnimation 设置已关闭，跳过')
    return
  }
  // 记录本批次 ID，后续同批次事件跳过立绘演出
  if (evt.batchId) lastShownBatchId = evt.batchId

  // ===== 人物立绘来源 =====
  // 修复立绘错配 bug：原实现随机抽存活队员显示立绘，忽略 evt.killerMemberId，
  // 导致「惊鸿击杀」却显示净世光使立绘。改为优先用 killerMemberId 反查真实击杀者，
  // 仅当 killerMemberId 缺失或对应成员已阵亡时才回退到随机抽存活队员。
  let member = null
  // 从 teamMemberStates 获取实时血量，用于过滤阵亡角色
  const statesMap = {}
  if (teamMemberStates && teamMemberStates.value) {
    for (const ms of teamMemberStates.value) {
      statesMap[ms.memberId] = ms.hp
    }
  }
  // 优先：用事件中的 killerMemberId 反查真实击杀者
  if (evt.killerMemberId) {
    const killer = playerStore.sectMembers.find(m => m.id === evt.killerMemberId)
      || playerStore.sectMembers.find(m => (m.templateId || m.id) === evt.killerMemberId)
    if (killer) {
      // 确认击杀者存活（hp > 0 或无状态记录时默认存活）
      const hp = statesMap[killer.id]
      if (hp === undefined || hp > 0) {
        member = killer
      }
    }
  }
  // 兜底1：killerMemberId 未命中（member 已被移除/重招募）时，用 killerName 按名匹配
  // 修复日志中立绘与 killerName 不一致：evt.killerName 来自 pickBossKillKiller 选中的真实击杀者，
  // member 查找回退到随机会导致立绘与名字错配（如净世光使击杀却显示玄玑仙子立绘）。
  if (!member && evt.killerName) {
    const byName = playerStore.sectMembers.find(m => m.name === evt.killerName)
    if (byName) {
      const hp = statesMap[byName.id]
      if (hp === undefined || hp > 0) {
        member = byName
      }
    }
  }
  // 兜底2：killerMemberId 和 killerName 都未命中时，才随机抽存活队员
  if (!member && playerStore.teamMembers && playerStore.teamMembers.length > 0) {
    const aliveMembers = playerStore.teamMembers
      .map(id => playerStore.sectMembers.find(m => m.id === id))
      .filter(m => m && m.id)
      .filter(m => {
        const hp = statesMap[m.id]
        return hp === undefined || hp > 0
      })
    if (aliveMembers.length > 0) {
      member = aliveMembers[Math.floor(Math.random() * aliveMembers.length)]
    }
  }
  if (!member) return

  // 立绘索引：使用该角色自己的击杀立绘设置（characterKillSkins[memberId]）
  // 关键修复：键必须与 CharacterPortraitModal 保存时一致，即 templateId 优先（与
  // getCharacterAvatar / getCharacterSkinUrl 内部 id 取值口径一致）
  // 旧实现用 member.id || member.templateId，与保存时的 templateId || id 不匹配，
  // 导致查找结果恒为 undefined，立绘永远回退到原皮肤（用户反馈的 bug）
  const characterKey = member.templateId || member.id
  const skinIdx = Number(playerStore.characterKillSkins?.[characterKey]) || 0
  let url = null
  if (skinIdx > 0) {
    const skinCount = getSkinCount(member)
    if (skinIdx <= skinCount) {
      url = getCharacterSkinUrl(member, skinIdx)
    }
  }
  if (!url) url = getCharacterAvatar(member, 'full')
  if (!url) return

  // 触发连击计数
  bumpCombo()

  // ===== 重启动画的可靠方案：递增 animKey 让 Vue 销毁旧 <img> 并创建新 <img> =====
  // 旧实现靠 show=false → nextTick → show=true 切换，nextTick 在 Vue 内部可能与
  // 同 tick 的其他状态变更合并，导致 <img> 未真正卸载，CSS 动画无法重启，
  // 表现为「挂机连斩第二只起立绘不再弹出」。
  // 新方案：所有子元素（img/光晕/粒子/连击/文案）都通过 :key="...-${animKey}" 绑定，
  // 每次 animKey++ 让 Vue 创建全新 DOM 节点，浏览器从 0% 重新开始 CSS 动画，
  // 旧节点被卸载后其动画自然停止（不会触发错误的 animationend 干扰新动画）。
  // 先清理上一次的灵宠延时（防止上一个宠物立绘抢点）
  if (petDelayTimer) { clearTimeout(petDelayTimer); petDelayTimer = null }
  petShow.value = false
  petPortraitUrl.value = null

  portraitUrl.value = url
  killerName.value = member.name || ''
  bossName.value = evt.bossName || ''
  animKey.value++
  show.value = true
  scheduleAutoHide()
  schedulePetPortrait()
  console.log('[BossKillCinematic] 立绘已设置，show=true', { url: url.slice(0, 50), killerName: killerName.value, bossName: bossName.value })
}, { deep: true })

// ===== 灵宠立绘：人物立绘弹出 1s 后从另一侧弹出 =====
// 触发概率：每次人物立绘播放时，仅 30% 概率同时播放该出战人物的灵宠立绘
// （避免每次击杀都强制弹出灵宠，节奏过于喧宾夺主；30% 让灵宠出现保持新鲜感）
const PET_PORTRAIT_CHANCE = 0.3
function schedulePetPortrait() {
  const pet = playerStore.activePet
  if (!pet) return
  // 30% 概率才播放灵宠立绘；未命中则本次不弹出灵宠
  if (Math.random() > PET_PORTRAIT_CHANCE) return
  // 灵宠立绘 URL（按灵宠自己的击杀立绘设置取皮肤，未设默认原立绘）
  const petKey = getPetTemplateId(pet)
  const petSkinIdx = Number(playerStore.petKillSkins?.[petKey]) || 0
  let petUrl = null
  if (petSkinIdx > 0) {
    const petSkinCount = getPetSkinCount(pet)
    const unlocked = getUnlockedSkinCount(pet, playerStore.petSkinUnlockRecord)
    // 仅当该皮肤已解锁且确实存在时才使用
    if (petSkinIdx <= petSkinCount && petSkinIdx <= unlocked) {
      petUrl = getPetSkinUrl(pet, petSkinIdx)
    }
  }
  if (!petUrl) petUrl = getPetAvatar(pet, 'full')
  if (!petUrl) return

  // 2s 延迟（原 1s 翻倍）：人物立绘先弹出，2s 后灵宠从另一侧弹出
  petDelayTimer = setTimeout(() => {
    petPortraitUrl.value = petUrl
    petName.value = pet.name || ''
    petAnimKey.value++
    petShow.value = true
    petDelayTimer = null
  }, 2000)
}

const onPortraitAnimEnd = () => {
  // 诊断日志：确认人物立绘动画结束事件触发
  console.log('[BossKillCinematic] 人物立绘 animationend')
  // 人物立绘动画播完：移除外层节点
  // 若灵宠立绘仍在播放则保留外层（petShow 仍 true）
  if (!petShow.value) {
    show.value = false
    portraitUrl.value = null
    if (hideTimerId) { clearTimeout(hideTimerId); hideTimerId = null }
  }
}

const onPetAnimEnd = () => {
  // 诊断日志：确认灵宠立绘动画结束事件触发
  console.log('[BossKillCinematic] 灵宠立绘 animationend')
  // 灵宠立绘动画播完：清除灵宠状态，并连同外层一起隐藏
  petShow.value = false
  petPortraitUrl.value = null
  show.value = false
  portraitUrl.value = null
  if (hideTimerId) { clearTimeout(hideTimerId); hideTimerId = null }
}
</script>

<style scoped>
.boss-kill-cinematic {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* 不挡挂机点击 */
  overflow: hidden;
}

/* 人物立绘主体：左下突入→中心旋转顿帧→右上消失，纯 transform+opacity 走 GPU 合成层 */
/* 性能优化：移除 filter:drop-shadow（旋转时持续重绘），改用外层 .kill-portrait-wrap 的
   box-shadow 光晕叠加，避免每帧 Paint */
.kill-portrait {
  position: relative;
  width: min(60vw, 440px);
  max-height: 72vh; /* 正居中显示，占据中心区域 */
  object-fit: contain;
  border-radius: 12px;
  animation: boss-slash 3.6s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
  will-change: transform, opacity;
}

@keyframes boss-slash {
  0% {
    transform: translate(-60vw, 60vh) rotate(-200deg) scale(0.6);
    opacity: 0;
  }
  35% {
    transform: translate(0, 0) rotate(0deg) scale(1.15);
    opacity: 1;
  }
  55% {
    transform: translate(0, 0) rotate(8deg) scale(1.15);
    opacity: 1; /* 中心顿帧 */
  }
  100% {
    transform: translate(60vw, -60vh) rotate(200deg) scale(0.6);
    opacity: 0;
  }
}

/* 灵宠立绘：右下突入→中心顿帧→左上消失，与人物立绘轨迹镜像对称
   - 与人物立绘相差约 2s 出现（由 JS setTimeout(2000) 控制）
   - 动画时长 3.6s（原 1.8s 翻倍） */
.kill-pet-portrait {
  position: absolute;
  width: min(50vw, 360px);
  max-height: 60vh;
  object-fit: contain;
  border-radius: 12px;
  animation: pet-slash 3.6s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
  will-change: transform, opacity;
  /* 偏右下角定位，避免与人物立绘在中心位置完全重叠 */
  right: 8%;
  bottom: 18%;
}
@keyframes pet-slash {
  0% {
    transform: translate(60vw, 60vh) rotate(200deg) scale(0.5);
    opacity: 0;
  }
  35% {
    transform: translate(0, 0) rotate(0deg) scale(1.1);
    opacity: 1;
  }
  55% {
    transform: translate(0, 0) rotate(-8deg) scale(1.1);
    opacity: 1; /* 中心顿帧 */
  }
  100% {
    transform: translate(-60vw, -60vh) rotate(-200deg) scale(0.5);
    opacity: 0;
  }
}

/* 全屏一闪：0.3s 白光冲击 */
.kill-flash {
  position: absolute;
  inset: 0;
  background: #fff;
  opacity: 0;
  animation: flash-anim 0.3s ease-out forwards;
}
@keyframes flash-anim {
  0% { opacity: 0; }
  30% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 中心光晕：立绘顿帧时的金色辐射 */
.kill-glow {
  position: absolute;
  width: 60vmin;
  height: 60vmin;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.45) 0%, rgba(255, 140, 0, 0.2) 40%, transparent 70%);
  opacity: 0;
  animation: glow-anim 3.6s ease-out forwards;
}
@keyframes glow-anim {
  0% { opacity: 0; transform: scale(0.5); }
  35% { opacity: 0.9; transform: scale(1); }
  60% { opacity: 0.6; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(1.3); }
}

/* 飘动粒子：3片灵光，各自 transform 动画 */
.kill-particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #FFD700;
  box-shadow: 0 0 8px #FFD700;
  opacity: 0;
}
.p1 { left: 30%; top: 40%; animation: particle-1 3.6s ease-out forwards; }
.p2 { left: 60%; top: 50%; animation: particle-2 3.6s ease-out forwards; }
.p3 { left: 50%; top: 30%; animation: particle-3 3.6s ease-out forwards; }

@keyframes particle-1 {
  0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translate(-120px, -80px) scale(1.2); }
}
@keyframes particle-2 {
  0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
  40% { opacity: 1; }
  100% { opacity: 0; transform: translate(100px, -60px) scale(1.1); }
}
@keyframes particle-3 {
  0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
  50% { opacity: 1; }
  100% { opacity: 0; transform: translate(0, -140px) scale(1.3); }
}

/* 击杀文案 */
.kill-text {
  position: absolute;
  /* 立绘 max-height 68vh，底部约在 84vh
     斩杀文案 bottom:6% = 94vh，文字顶部约 88vh > 84vh，不与立绘重叠 */
  bottom: 6%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: #FFD700;
  text-shadow: 0 0 12px rgba(0, 0, 0, 0.9), 0 2px 4px rgba(0, 0, 0, 0.8);
  opacity: 0;
  animation: text-anim 3.6s ease-out forwards;
}
.kill-subtitle {
  font-size: 18px;
  letter-spacing: 6px;
  opacity: 0.85;
}
.kill-bossname {
  font-size: 32px;
  font-weight: bold;
  margin-top: 4px;
}
@keyframes text-anim {
  0% { opacity: 0; transform: translate(-50%, 20px); }
  40% { opacity: 1; transform: translate(-50%, 0); }
  75% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -10px); }
}

/* ===== 连击特效：count（一杀）在立绘左侧垂直行文，text（成语）在立绘右侧垂直行文 ===== */
/* 外层 .kill-combo：透明容器，撑满全屏，只负责整体淡出 */
.kill-combo {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* 整体淡出：所有字一起消失。延迟时间由 comboFadeDelay computed 动态计算 */
  opacity: 1;
  animation: combo-fade-out 1s ease-in forwards;
}
@keyframes combo-fade-out {
  0%, 99% { opacity: 1; }
  100% { opacity: 0; }
}
/* count（一杀）：绝对定位在立绘左侧，垂直居中，纵向排列每个字 */
.combo-count {
  position: absolute;
  top: 50%;
  /* 左侧：距离屏幕左缘 8vw，落在立绘左缘外侧
     立绘宽 min(60vw,440px) 居中，左缘约在 50%-30vw=20vw 处，8vw 在其外侧 */
  left: 8vw;
  transform: translateY(-50%);
  /* 纵向排列：每个字一行，居中对齐 */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', 'STHeiti', 'Microsoft YaHei', serif;
  font-size: clamp(40px, 6.5vw, 64px);
  font-weight: 900;
  line-height: 1;
  opacity: 0;
  animation: combo-count-in 1s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
  text-shadow:
    -3px -3px 0 rgba(0, 0, 0, 0.95),
    3px -3px 0 rgba(0, 0, 0, 0.95),
    -3px 3px 0 rgba(0, 0, 0, 0.95),
    3px 3px 0 rgba(0, 0, 0, 0.95),
    4px 4px 0 rgba(0, 0, 0, 0.8);
}
/* count 的每个字 span：逐字淡入 */
.combo-count span {
  display: block;
  opacity: 0;
  animation: combo-count-char-in 0.8s ease-out forwards;
}
@keyframes combo-count-char-in {
  0% { opacity: 0; transform: translateY(-8px); }
  100% { opacity: 0.92; transform: translateY(0); }
}
@keyframes combo-count-in {
  0% { opacity: 0; transform: translate(-12px, -50%) scale(1.2); }
  60% { opacity: 1; transform: translate(0, -50%) scale(0.95); }
  100% { opacity: 1; transform: translate(0, -50%) scale(1); }
}
/* text 行：绝对定位在立绘右侧，垂直居中，纵向排列单字 */
.combo-text {
  position: absolute;
  top: 50%;
  /* 右侧：距离屏幕右缘 8vw，落在立绘右缘外侧 */
  right: 8vw;
  transform: translateY(-50%);
  /* 纵向排列：每个字一行 */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.combo-char {
  display: block;
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', 'STHeiti', 'Microsoft YaHei', serif;
  font-size: var(--combo-font-size, clamp(36px, 6.5vw, 60px));
  font-weight: 900;
  line-height: 1;
  opacity: 0;
  /* 逐字砸入：纯 translateY + opacity，无 scale/blur 避免残影
     时长 0.42s，逐字间隔 0.168s，10字文案总时长约 3s，7s间隔下充裕 */
  animation: combo-char-in 0.42s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
  /* 刚硬描边：四方向粗黑描边 + 立体投影 */
  text-shadow:
    -2px -2px 0 rgba(0, 0, 0, 0.95),
    2px -2px 0 rgba(0, 0, 0, 0.95),
    -2px 2px 0 rgba(0, 0, 0, 0.95),
    2px 2px 0 rgba(0, 0, 0, 0.95),
    3px 3px 0 rgba(0, 0, 0, 0.7);
}
@keyframes combo-char-in {
  0% {
    opacity: 0;
    /* 从上方 32px 砸下，无 scale/rotate/blur，避免大字缩放残影 */
    transform: translateY(-32px);
  }
  60% {
    /* 轻微过冲：向下多走 4px 模拟落地顿挫 */
    opacity: 1;
    transform: translateY(4px);
  }
  100% {
    /* 定格：回到原位 */
    opacity: 1;
    transform: translateY(0);
  }
}

/* 连击等级配色：从白蓝→青→金→橙→红→紫→品红→深红→金红→传奇彩，强度递增
   颜色饱和度提高，配合粗描边让字更坚实 */
.combo-1 { color: #E1F5FE; }        /* 浅白蓝：初斩，凌厉但克制 */
.combo-2 { color: #4FC3F7; }        /* 亮蓝：连斩，杀气渐起 */
.combo-3 { color: #26C6DA; }        /* 青：凌厉，剑气纵横 */
.combo-4 { color: #FFB300; }        /* 金橙：霸道，横扫千军 */
.combo-5 { color: #FF6E40; }        /* 橙红：王者，大杀四方 */
.combo-6 { color: #FF5252; }        /* 红：诗·李白，杀气浓烈 */
.combo-7 { color: #FF1744; }        /* 深红：狂·贯休，杀伐果断 */
.combo-8 { color: #D500F9; }        /* 品红：超凡，踏碎凌霄 */
.combo-9 { color: #FFD600; }        /* 金黄：神威，一剑光寒 */
/* 传奇层级：金红交替发光，配合 legendary-glow 持续脉冲（在淡出前持续发光）
   注意：不再有 combo-char-out，由外层 .kill-combo 统一淡出 */
.combo-legendary { color: #FFD600; }
.combo-legendary .combo-char {
  animation: combo-char-in 0.9s cubic-bezier(0.2, 0.8, 0.3, 1) forwards,
             legendary-glow 0.8s ease-in-out infinite alternate 0.6s;
}
@keyframes legendary-glow {
  0% {
    color: #FFD600;
    text-shadow:
      -2px -2px 0 rgba(0,0,0,0.95), 2px -2px 0 rgba(0,0,0,0.95),
      -2px 2px 0 rgba(0,0,0,0.95), 2px 2px 0 rgba(0,0,0,0.95),
      3px 3px 0 rgba(0,0,0,0.7);
  }
  50% {
    color: #FF1744;
    text-shadow:
      -2px -2px 0 rgba(0,0,0,0.95), 2px -2px 0 rgba(0,0,0,0.95),
      -2px 2px 0 rgba(0,0,0,0.95), 2px 2px 0 rgba(0,0,0,0.95),
      3px 3px 0 rgba(0,0,0,0.7);
  }
  100% {
    color: #FFD600;
    text-shadow:
      -2px -2px 0 rgba(0,0,0,0.95), 2px -2px 0 rgba(0,0,0,0.95),
      -2px 2px 0 rgba(0,0,0,0.95), 2px 2px 0 rgba(0,0,0,0.95),
      3px 3px 0 rgba(0,0,0,0.7);
  }
}

/* 尊重无障碍：减弱动画偏好下不播放演出 */
@media (prefers-reduced-motion: reduce) {
  .boss-kill-cinematic { display: none; }
}
</style>
