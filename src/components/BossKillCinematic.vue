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
      <!-- 连击特效：四字成语 / 诗句，逐字砸入出现，全部到齐后整体一起消失 -->
      <!-- 外层 .kill-combo 负责整体淡出（统一延迟，所有字一起消失） -->
      <!-- 内层 .combo-char 仅负责逐字砸入出现（按 delay），不再独立 out -->
      <div
        v-if="comboLabel"
        :key="`combo-${animKey}`"
        class="kill-combo"
        :class="comboClass"
        :style="{ animationDelay: comboFadeDelay + 's', '--combo-font-size': comboFontSize }"
      >
        <span
          v-for="(ch, i) in comboLabelChars"
          :key="i"
          class="combo-char"
          :style="{ animationDelay: (i * 0.18) + 's' }"
        >{{ ch }}</span>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'
import { useIdleSystem } from '../composables/useIdleSystem'
import { usePlayerStore } from '../stores/player'
import { getCharacterAvatar, getCharacterSkinUrl, getSkinCount } from '../plugins/characters'
import { getPetAvatar, getPetSkinUrl, getPetSkinCount, getUnlockedSkinCount, getPetTemplateId } from '../plugins/pets'

const { bossKillEvent } = useIdleSystem()
const playerStore = usePlayerStore()

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

const comboLabel = ref('')
const comboClass = ref('')
// 逐字显示：将文案拆成单字数组，配合 CSS animation-delay 实现一字一字弹出
const comboLabelChars = computed(() => Array.from(comboLabel.value || ''))
// 整体淡出延迟：等所有字逐字砸入完成 + 停留 1.2s 后，整体一起消失
// 计算 = 最后一字的入场 delay (n-1)*0.18 + 入场时长 0.45 + 停留 1.2
const comboFadeDelay = computed(() => {
  const n = comboLabelChars.value.length
  if (n === 0) return 0
  return (n - 1) * 0.18 + 0.45 + 1.2
})
// 字号自适应：字数越多字号越小，保证单排居中显示不超出屏幕
// 细化梯度：5字单独一档（比6-7字更大），让五字诗句也突出美观
// ≤4字 → 64px，5字 → 54px，6-7字 → 46px，8-10字 → 36px，10+字 → 28px
const comboFontSize = computed(() => {
  const n = comboLabelChars.value.length
  if (n <= 4) return 'clamp(44px, 7.5vw, 64px)'
  if (n === 5) return 'clamp(38px, 6.5vw, 54px)'
  if (n <= 7) return 'clamp(32px, 5.5vw, 46px)'
  if (n <= 10) return 'clamp(24px, 4vw, 36px)'
  return 'clamp(18px, 3vw, 28px)'
})

// ===== 连击系统：中文斩杀文案库 =====
// 按连杀次数分 10 个层级，强度递增（四字成语 → 五字 → 七字诗句 → 十字传奇）
// 文案来源：李白《侠客行》、贯休《献钱尚父》、古龙武侠、修仙小说常用意象
// 每层多条文案轮换，避免重复单调
const COMBO_TIERS = [
  // 第 1 杀：初斩·四字（凌厉但不夸张）
  { class: 'combo-1', lines: ['一击必杀', '势如破竹', '雷厉风行', '剑出如虹', '快如闪电', '锋芒毕露'] },
  // 第 2 杀：连斩·四字（杀气渐起）
  { class: 'combo-2', lines: ['连斩双煞', '双剑合璧', '左右开弓', '势不可挡', '杀气腾腾', '所向披靡'] },
  // 第 3 杀：凌厉·五字（如入无人境）
  { class: 'combo-3', lines: ['剑气纵横起', '杀气盈原野', '所向皆披靡', '一剑斩乾坤', '凌厉无匹敌', '剑落惊风雨'] },
  // 第 4 杀：霸道·六字（横扫千军）
  { class: 'combo-4', lines: ['横扫千军如卷', '一夫当关莫开', '万军之中取首', '剑气荡平八荒', '杀伐果断无情', '势若雷霆万钧'] },
  // 第 5 杀：王者·七字（大杀四方）
  { class: 'combo-5', lines: ['大杀四方震八荒', '剑锋所指皆披靡', '气吞山河万里红', '杀尽奸邪不留行', '一剑光寒动九州', '血染黄沙战未休'] },
  // 第 6 杀：诗·七字（李白侠客行意象）
  { class: 'combo-6', lines: ['十步杀一人千里', '事了拂衣深藏名', '飒沓如流星杀尽', '纵死侠骨犹留香', '吴钩霜雪斩群魔', '三杯吐诺重五岳'] },
  // 第 7 杀：狂·七字（贯休献钱尚父）
  { class: 'combo-7', lines: ['一剑霜寒十四州', '满堂花醉三千客', '冲天香阵透长安', '剑气冲霄贯斗牛', '杀气三声动天地', '狂歌痛饮斩天骄'] },
  // 第 8 杀：超凡·八字（踏碎凌霄）
  { class: 'combo-8', lines: ['踏碎凌霄放肆桀骜', '气吞万里猛如虎', '一身转战三千里', '一剑曾当百万师', '剑破苍穹碎虚空', '杀伐决断震九霄'] },
  // 第 9 杀：神威·九字（一剑光寒）
  { class: 'combo-9', lines: ['剑气纵横三万里', '一剑光寒十九州', '十步杀尽千人挡', '千里不留行无踪', '杀尽苍生不见血', '剑出星辰皆黯淡'] },
  // 第 10+ 杀：传奇·十字（诗剑双绝）
  { class: 'combo-legendary', lines: ['剑气纵横三万里，一剑光寒十九州', '十步杀一人，千里不留行', '事了拂衣去，深藏身与名', '一身转战三千里，一剑曾当百万师', '满堂花醉三千客，一剑霜寒十四州'] }
]

// 连击窗口：每次击杀BOSS后 15 秒内再次击杀则连击+1，超时重置
const COMBO_WINDOW_MS = 15000
let comboTimerId = null
let currentCombo = 0

// 根据连杀数取对应层级文案（随机选一条，避免重复）
function getComboTier(count) {
  if (count < 1) return { label: '', class: '' }
  const tierIdx = Math.min(count, COMBO_TIERS.length) - 1
  const tier = COMBO_TIERS[tierIdx]
  const label = tier.lines[Math.floor(Math.random() * tier.lines.length)]
  return { label, class: tier.class }
}

function bumpCombo() {
  currentCombo++
  const tier = getComboTier(currentCombo)
  comboLabel.value = tier.label
  comboClass.value = tier.class
  // 重置连击窗口计时器
  if (comboTimerId) clearTimeout(comboTimerId)
  comboTimerId = setTimeout(() => {
    currentCombo = 0
    comboLabel.value = ''
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

// ===== 兜底隐藏：动画结束后或超时后强制隐藏，防止 animationend 未触发导致 show 卡死 =====
// 斩杀文案逐字砸入后停留 3.5s 才淡出，整体时延长，需更长兜底；多次击杀时重新计时
let hideTimerId = null
function scheduleAutoHide() {
  if (hideTimerId) clearTimeout(hideTimerId)
  // 人物立绘 1.8s + 灵宠 1s 延迟 + 1.8s ≈ 4.6s，但斩杀文案最后一字砸入后停留 3.5s + 0.5s 淡出
  // 10 字诗句最后一字 delay ≈ 9*0.18 + 0.55 + 3.5 + 0.5 ≈ 6.2s，给 8s 兜底
  hideTimerId = setTimeout(() => {
    if (show.value) {
      show.value = false
      portraitUrl.value = null
      petShow.value = false
      petPortraitUrl.value = null
    }
    hideTimerId = null
  }, 8000)
}

// 监听击杀事件，触发立绘突入动画
watch(bossKillEvent, (evt) => {
  // 诊断日志：确认 watch 是否被触发（排查挂机立绘不弹出的关键证据）
  console.log('[BossKillCinematic] watch 触发', evt)
  if (!evt || !evt.ts) {
    console.warn('[BossKillCinematic] 事件无效，跳过', evt)
    return
  }
  // 设置开关关闭则不触发
  if (!playerStore.bossKillAnimation) {
    console.log('[BossKillCinematic] bossKillAnimation 设置已关闭，跳过')
    return
  }

  // ===== 人物立绘来源 =====
  // 按出战人数均分播放概率：3 人 → 各 1/3，2 人 → 各 1/2，1 人 → 100%
  // 旧实现优先使用 killerMemberId（实际斩杀者），但实际斩杀者往往是同一角色
  // （最强DPS每次都补刀），导致 9/10 次都显示同一角色，无法看到其他角色的击杀立绘。
  // 改为纯随机：Math.floor(Math.random() * N) 在 N 个出战人物中均匀取一个，自然均分概率。
  let member = null
  if (playerStore.teamMembers && playerStore.teamMembers.length > 0) {
    const aliveMembers = playerStore.teamMembers
      .map(id => playerStore.sectMembers.find(m => m.id === id))
      .filter(m => m && m.id)
    if (aliveMembers.length > 0) {
      member = aliveMembers[Math.floor(Math.random() * aliveMembers.length)]
    }
  }
  // 兜底：队伍为空时尝试用事件中的 killerMemberId
  if (!member && evt.killerMemberId) {
    member = playerStore.sectMembers.find(m => m.id === evt.killerMemberId)
      || playerStore.sectMembers.find(m => (m.templateId || m.id) === evt.killerMemberId)
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

  // 1s 延迟：人物立绘先弹出，1s 后灵宠从另一侧弹出
  // 两者出现/消失相差约 1s，避免动画过于拖沓
  petDelayTimer = setTimeout(() => {
    petPortraitUrl.value = petUrl
    petName.value = pet.name || ''
    petAnimKey.value++
    petShow.value = true
    petDelayTimer = null
  }, 1000)
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
.kill-portrait {
  position: relative;
  width: min(70vw, 520px);
  max-height: 80vh;
  object-fit: contain;
  border-radius: 12px;
  filter: drop-shadow(0 0 24px rgba(255, 215, 0, 0.7));
  animation: boss-slash 1.8s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
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
   - 与人物立绘相差约 1s 出现（由 JS setTimeout(1000) 控制）
   - 动画时长同为 1.8s，确保整体节奏紧凑不拖沓 */
.kill-pet-portrait {
  position: absolute;
  width: min(50vw, 360px);
  max-height: 60vh;
  object-fit: contain;
  border-radius: 12px;
  filter: drop-shadow(0 0 20px rgba(120, 220, 100, 0.7));
  animation: pet-slash 1.8s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
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
  animation: glow-anim 1.8s ease-out forwards;
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
.p1 { left: 30%; top: 40%; animation: particle-1 1.8s ease-out forwards; }
.p2 { left: 60%; top: 50%; animation: particle-2 1.8s ease-out forwards; }
.p3 { left: 50%; top: 30%; animation: particle-3 1.8s ease-out forwards; }

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
  bottom: 12%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: #FFD700;
  text-shadow: 0 0 12px rgba(0, 0, 0, 0.9), 0 2px 4px rgba(0, 0, 0, 0.8);
  opacity: 0;
  animation: text-anim 1.8s ease-out forwards;
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

/* ===== 连击特效：逐字砸入出现，全部到齐后整体一起消失 ===== */
/* 外层 .kill-combo：负责整体淡出 + 居中定位
   内层 .combo-char：仅负责逐字砸入出现（纯 translateY+opacity，无 scale/blur 避免残影） */
.kill-combo {
  position: absolute;
  /* 屏幕上方居中：宽度自适应内容，整体水平居中
     用 left:50% + translateX(-50%) 而非 left:0;right:0，避免容器撑满 100vw 导致字间距松散 */
  top: 14%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  /* 字间距用 gap 统一控制，不用 letter-spacing（letter-spacing 会在末字后也加间距导致偏移） */
  gap: 6px;
  white-space: nowrap;
  /* 整体淡出：所有字一起消失。延迟时间由 comboFadeDelay computed 动态计算
     注意：外层 transform 是静态值（translateX(-50%)），不在动画中改变，不会与内层叠加
     combo-fade-out 只控制 opacity，不触碰 transform，避免覆盖居中定位 */
  opacity: 1;
  animation: combo-fade-out 0.5s ease-in forwards;
}
@keyframes combo-fade-out {
  /* 前段保持 opacity:1 不动，到延迟时间才开始淡出 */
  0%, 99% { opacity: 1; }
  100% { opacity: 0; }
}
.combo-char {
  display: inline-block;
  /* 坚实有力字体：Ma Shan Zheng 毛笔楷书，回退到系统楷体/黑体 */
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', 'STHeiti', 'Microsoft YaHei', serif;
  /* 字号由 --combo-font-size CSS 变量控制（JS 根据字数动态计算） */
  font-size: var(--combo-font-size, clamp(36px, 6.5vw, 60px));
  font-weight: 900;
  /* 不用 letter-spacing，间距由外层 gap 统一控制，避免末字多余间距 */
  letter-spacing: 0;
  line-height: 1;
  opacity: 0;
  /* 逐字砸入：纯 translateY + opacity，绝对不产生 scale/blur 残影
     每字 0.45s 完成，间隔 0.18s */
  animation: combo-char-in 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
  /* 坚实有力：四方向黑色粗描边 + 右下立体投影
     不用 -webkit-text-stroke（栅格化不同步会重影）
     不用 0 0 Xpx currentColor 外发光（opacity 渐变时与文字本体不同步形成光晕重影） */
  text-shadow:
    -2px -2px 0 rgba(0, 0, 0, 0.95),
    2px -2px 0 rgba(0, 0, 0, 0.95),
    -2px 2px 0 rgba(0, 0, 0, 0.95),
    2px 2px 0 rgba(0, 0, 0, 0.95),
    3px 3px 0 rgba(0, 0, 0, 0.7);
  /* 不用 will-change，避免强制创建合成层导致栅格化残影 */
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
  animation: combo-char-in 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) forwards,
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
