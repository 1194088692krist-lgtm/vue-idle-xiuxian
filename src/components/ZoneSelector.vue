<template>
  <div class="zone-selector">
    <!-- 标题 -->
    <div class="exploration-header">
      <div class="header-icon">探索</div>
      <div class="header-info">
        <h2 class="card-title">探索秘境</h2>
        <p class="card-subtitle">八大秘境全数开放，各藏五重修为试炼</p>
      </div>
    </div>

    <!-- 难度筛选（按秘境等级） -->
    <div class="filter-bar">
      <div
        v-for="f in filters"
        :key="f.key"
        class="filter-chip"
        :class="{ active: activeFilter === f.key }"
        @click="activeFilter = f.key"
      >
        {{ f.label }}
      </div>
      <button class="boss-challenge-btn" @click="showBossChallengePanel = true">
        👑 BOSS 挑战
      </button>
    </div>

    <!-- 区域网格 -->
    <div class="zones-grid">
      <div
        v-for="zone in filteredZones"
        :key="zone.id"
        class="zone-card"
        :class="{ selected: selectedZone?.id === zone.id }"
        @click="selectZone(zone)"
      >
        <div class="zone-banner" :style="{ borderTopColor: zone.difficultyColor }">
          <div class="zone-icon-area">
            <img v-if="zone.image" :src="zone.image" class="zone-icon-img" :alt="zone.name" />
            <span v-else class="zone-icon">{{ getZoneIcon(zone.id) }}</span>
          </div>
          <div class="zone-difficulty-badge" :style="{ backgroundColor: zone.difficultyColor }">
            {{ zone.difficultyLabel }}
          </div>
        </div>
        <div class="zone-body">
          <div class="zone-name">{{ zone.name }}</div>
          <div class="zone-meta">
            <span class="meta-item">5 档难度</span>
            <span class="meta-item">x{{ zone.difficulty === 8 ? 10 : zone.rewardMultiplier }}奖励</span>
          </div>
          <div class="zone-monsters">
            <span v-for="m in zone.monsters" :key="m" class="monster-tag">{{ m }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中区域详情 -->
    <div v-if="selectedZone" class="zone-detail glass-card">
      <div class="detail-header">
        <div>
          <h3 class="detail-title">
            <img v-if="selectedZone.image" :src="selectedZone.image" class="detail-zone-icon" :alt="selectedZone.name" />
            <span v-else>{{ getZoneIcon(selectedZone.id) }}</span>
            {{ selectedZone.name }}
          </h3>
          <p class="detail-desc">{{ selectedZone.description }}</p>
        </div>
        <div class="difficulty-badge" :style="{ backgroundColor: selectedZone.difficultyColor }">
          {{ selectedZone.difficultyLabel }}
        </div>
      </div>
      <img v-if="selectedZone.image" :src="selectedZone.image" class="zone-image" :alt="selectedZone.name" />

      <!-- 队伍选择 -->
      <div class="team-selector">
        <div class="team-header">
          <div class="team-title">
            <span class="team-icon">🚀</span>
            <span>出战队伍</span>
            <span class="team-count">{{ playerStore.teamMembers.length }}/{{ playerStore.maxTeamSize }}</span>
          </div>
          <button
            class="btn btn-small btn-secondary"
            @click="toggleTeamModal"
          >
            {{ showTeamModal ? '关闭' : '选择' }}
          </button>
        </div>
        <div class="team-members">
          <div v-if="teamMembersDetail.length === 0" class="team-empty">
            <span>暂无出战成员，请从宗门选择</span>
          </div>
          <div
            v-for="member in teamMembersDetail"
            :key="member.id"
            class="team-member-card"
          >
            <div class="member-avatar" @click.stop="openAvatarViewer(member)">
              <img v-if="getCharacterAvatar(member)" :src="getCharacterThumbnail(member)" class="member-avatar-img" :alt="member.name" loading="lazy" decoding="async" />
              <span v-else>{{ member.name[0] }}</span>
              <div class="member-stars">
                <span v-for="i in member.star" :key="i" class="star">★</span>
              </div>
            </div>
            <div class="member-info">
              <div class="member-name">{{ member.name }}</div>
              <div class="member-school">{{ characterSchools[member.school]?.name || member.school }}</div>
            </div>
            <div class="member-build">
              <span class="build-label">Build</span>
              <span class="build-value">{{ formatNumber(playerStore.getCharacterBuildStrength(member)) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 难度档选择 -->
      <div class="difficulty-selector">
        <div class="diff-label">试炼难度</div>
        <div class="diff-chips">
          <div
            v-for="d in selectedZone.difficulties"
            :key="d.key"
            class="diff-chip"
            :class="{ active: selectedDifficultyKey === d.key }"
            :style="{ '--chip-color': d.color }"
            @click="setDifficulty(d.key)"
          >
            {{ d.label }}
          </div>
        </div>
        <div v-if="currentDifficulty" class="diff-info">
          <span>推荐Build <b>{{ formatNumber(currentDifficulty.recommendedBuild) }}</b></span>
          <span class="gold-text">奖励 x{{ currentDifficulty.rewardMultiplier }}</span>
          <span>{{ currentDifficulty.spiritCost }} 灵石/场</span>
        </div>
      </div>

      <div class="detail-stats">
        <div class="stat-row">
          <span class="stat-label">当前难度</span>
          <span class="stat-value">{{ currentDifficulty?.label }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">推荐Build</span>
          <span class="stat-value">{{ formatNumber(currentDifficulty?.recommendedBuild) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">你的Build</span>
          <span class="stat-value" :style="{ color: matchColor }">{{ formatNumber(playerBuildStrength) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">匹配度</span>
          <span class="stat-value" :style="{ color: matchColor }">{{ Math.round(buildRatio * 100) }}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">奖励倍率</span>
          <span class="stat-value gold-text">x{{ currentDifficulty?.rewardMultiplier }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">灵石消耗</span>
          <span class="stat-value">{{ currentDifficulty?.spiritCost }} 灵石/场</span>
        </div>
      </div>

      <!-- Build 强度提示 -->
      <div class="build-hint" :style="{ borderColor: matchColor }">
        <span class="build-hint-dot" :style="{ background: matchColor }"></span>
        <span :style="{ color: matchColor }">{{ matchText }}</span>
        <span class="build-hint-sub">（推荐 {{ formatNumber(currentRecommendedBuild) }} · 你的 {{ formatNumber(playerBuildStrength) }}）</span>
      </div>

      <!-- 奖励预览 -->
      <div class="rewards-preview">
        <div class="rewards-title">可能获得的报酬</div>
        <div class="rewards-list">
          <div v-for="rw in selectedZone.rewards" :key="rw.name" class="reward-row">
            <img :src="getRewardIcon(rw.type)" class="reward-icon" :alt="getRewardTypeName(rw.type, rw.name)" />
            <span class="reward-name">{{ getRewardTypeName(rw.type, rw.name) }}</span>
            <span class="reward-chance">{{ (rw.chance * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>

      <!-- 丹方解锁提示 -->
      <div class="pill-unlock-hint">
        <span class="pill-icon">📜</span>
        <span class="pill-text">通关 {{ selectedZone.name }} 第5重难度可获得丹方：</span>
        <span class="pill-names">{{ getZonePillNames(selectedZone.id) }}</span>
      </div>

      <!-- 战斗丹药快捷栏（实时战斗中显示） -->
      <div v-if="currentEncounter && currentEncounter.inProgress && playerStore.battlePills.length" class="battle-pills">
        <span class="battle-pills-label">战斗丹药:</span>
        <button
          v-for="p in playerStore.battlePills"
          :key="p.uid"
          class="battle-pill-btn"
          :class="p.type"
          @click="useBattlePill(p)"
        >
          {{ p.type === 'healBattle' ? '疗伤丹' : '解厄丹' }}
        </button>
      </div>

      <!-- 实时战斗舞台（挂机与手动探索共用，实时渲染 currentEncounter） -->
      <!-- 战斗结束后保留显示胜利/败北 badge，直到下一场遭遇或停止挂机 -->
      <BattleStage v-if="currentEncounter && currentEncounter.enemy && currentEncounter.players && currentEncounter.players.length" :encounter="currentEncounter" />

      <!-- 挂机探索区域（开始探索/气血条 已并入挂机面板，简化交互） -->
      <div v-if="!combatState.inCombat" class="idle-section">
        <div class="idle-title">挂机探索</div>
        <div v-if="!isIdling" class="idle-options">
          <div
            v-for="dur in idleDurations"
            :key="dur.minutes"
            class="idle-card"
            :class="{ selected: selectedDuration === dur.minutes }"
            @click="selectedDuration = dur.minutes"
          >
            <div class="dur-time">{{ dur.minutes }}分钟</div>
            <div class="dur-info">{{ dur.encounters }}次探索</div>
            <div class="dur-cost">{{ currentDifficulty ? currentDifficulty.spiritCost * dur.encounters : 0 }}灵石</div>
          </div>
        </div>
        <button
          v-if="!isIdling"
          class="btn btn-success"
          :disabled="!canStartIdle"
          @click="startIdle(selectedDuration)"
        >
          开始挂机（{{ selectedDuration }}分钟 · 约 {{ idleEncounterEstimate }} 场 · {{ idleStoneEstimate }} 灵石）
        </button>
        <!-- 挂机进行中 -->
        <div v-if="isIdling" class="idle-running" :class="{ 'in-boss-phase': bossSpawned }">
          <div class="idle-status">
            <div class="idle-timer">{{ idleTimeRemaining }}</div>
            <div class="idle-progress-bar">
              <div class="idle-progress-fill" :style="{ width: idleProgress + '%' }"></div>
            </div>
            <div class="idle-count">已完成 {{ idleEncounterCount }} 次探索</div>
            <!-- BOSS 决战阶段提示（核心玩法：最后 1/5 时间击杀 BOSS） -->
            <div v-if="bossSpawned" class="boss-phase-banner">
              <div class="bp-icon">👑</div>
              <div class="bp-body">
                <div class="bp-title">⚔️ 第 {{ bossSpawnRound + 1 }} 轮 BOSS 决战 · 限时击杀</div>
                <div class="bp-sub">在剩余 <b class="bp-time">{{ bossTimeRemaining || '1:00' }}</b> 内击杀 BOSS，否则本轮挑战失败、强制进入下一轮</div>
              </div>
              <div class="bp-countdown">{{ bossTimeRemaining || '1:00' }}</div>
            </div>
          </div>
          <button class="btn btn-danger" @click="stopIdle">停止挂机</button>
        </div>
        <!-- 挂机仪表盘 -->
        <div v-if="isIdling && idleDashboard" class="idle-dashboard">
          <div class="dashboard-title">📊 挂机仪表盘</div>
          <div class="dashboard-grid">
            <div class="dash-item">
              <span class="dash-label">胜/负</span>
              <span class="dash-value">{{ idleDashboard.victories }}/{{ idleDashboard.defeats }}</span>
            </div>
            <div class="dash-item">
              <span class="dash-label">匹配度</span>
              <span class="dash-value" :style="{ color: idleDashboard.buildRatio >= 1 ? '#4caf50' : '#ff5252' }">{{ Math.round(idleDashboard.buildRatio * 100) }}%</span>
            </div>
            <div class="dash-item">
              <span class="dash-label">灵石</span>
              <span class="dash-value gold-text">+{{ idleDashboard.totalSpiritStones }}</span>
            </div>
            <div class="dash-item">
              <span class="dash-label">幻灵结晶</span>
              <span class="dash-value" style="color:#9370db">+{{ idleDashboard.totalPhantomCrystals }}</span>
            </div>
            <div class="dash-item">
              <span class="dash-label">修为</span>
              <span class="dash-value">+{{ idleDashboard.totalCultivation }}</span>
            </div>
            <div class="dash-item">
              <span class="dash-label">装备</span>
              <span class="dash-value">+{{ idleDashboard.totalEquipment }}</span>
            </div>
            <!-- BOSS 挑战券获得统计（击杀 BOSS 时按 30% 掉落 1~2 张） -->
            <div class="dash-item" v-if="idleDashboard.totalBossTickets > 0">
              <span class="dash-label">🎟️ 挑战券</span>
              <span class="dash-value" style="color:#FF8C00">+{{ idleDashboard.totalBossTickets }}</span>
            </div>
            <!-- BOSS 素材获得统计 -->
            <div class="dash-item" v-if="idleDashboard.totalBossMaterials > 0">
              <span class="dash-label">👹 BOSS素材</span>
              <span class="dash-value" style="color:#FF4500">+{{ idleDashboard.totalBossMaterials }}</span>
            </div>
            <!-- 角色定位效果统计 -->
            <div class="dash-item" v-if="idleDashboard.roleEffects.healAmount > 0">
              <span class="dash-label">💚 治疗</span>
              <span class="dash-value" style="color:#4caf50">+{{ idleDashboard.roleEffects.healAmount }}</span>
            </div>
            <!-- 真实伤害统计：按各场遭遇 combatStats 累加 -->
            <div class="dash-item" v-if="idleDashboard.totalDamageDealt > 0">
              <span class="dash-label">⚔️ 总伤害</span>
              <span class="dash-value" style="color:#ff5722">{{ formatNumber(idleDashboard.totalDamageDealt) }}</span>
            </div>
            <div class="dash-item" v-if="idleDashboard.totalDamageTaken > 0">
              <span class="dash-label">🩸 总受伤</span>
              <span class="dash-value" style="color:#e53935">{{ formatNumber(idleDashboard.totalDamageTaken) }}</span>
            </div>
          </div>
          <!-- 生效中的小剧场 Buff -->
          <div v-if="idleDashboard.activeBuffs.length" class="dash-buffs">
            <div class="dash-buffs-title">🎭 生效增益</div>
            <div v-for="buff in idleDashboard.activeBuffs" :key="buff.name" class="dash-buff-item" :class="{ positive: buff.value > 0, negative: buff.value < 0 }">
              <span class="buff-name">{{ buff.name }}</span>
              <span class="buff-effect">{{ buff.typeName }}{{ buff.valueText }}</span>
              <span class="buff-remaining">剩{{ buff.remaining }}场</span>
            </div>
          </div>
          <!-- 生效中的丹药 Buff -->
          <div v-if="activePillBuffList.length" class="dash-pill-buffs">
            <div class="dash-pill-buffs-title">💊 丹药增益</div>
            <div v-for="buff in activePillBuffList" :key="buff.pillId + '_' + buff.expiresAt" class="dash-pill-buff-item">
              <span class="pill-buff-name">{{ buff.name }}</span>
              <span class="pill-buff-effect">{{ buff.typeName }}{{ buff.valueText }}</span>
              <span class="pill-buff-remaining">剩{{ buff.remainingText }}</span>
            </div>
          </div>
          <!-- 秘境怪物属性面板（无血条，统一在 BattleStage 显示） -->
          <div v-if="idleDashboard.enemy" class="dash-enemy no-hp" :class="{ 'boss-emphasis': idleDashboard.enemy.tier === 'boss' }">
            <div class="dash-enemy-title">
              <span class="dash-enemy-emoji">👹</span>
              <span>{{ idleDashboard.enemy.tier === 'boss' ? '👑 限时 BOSS 决战 · 击杀即过本轮' : '秘境怪物信息' }}</span>
              <span class="enemy-tier-badge" :class="'tier-' + idleDashboard.enemy.tier">{{ { boss: 'BOSS', elite: '精英', normal: '普通' }[idleDashboard.enemy.tier] || '普通' }}</span>
            </div>
            <div class="dash-enemy-name">
              {{ idleDashboard.enemy.name }}
              <span v-if="idleDashboard.enemy.realm" class="enemy-realm">{{ idleDashboard.enemy.realm }}</span>
            </div>
            <div class="enemy-stats-grid compact">
              <div class="enemy-stat"><span class="es-label">攻击</span><span class="es-value">{{ idleDashboard.enemy.damage }}</span></div>
              <div class="enemy-stat"><span class="es-label">防御</span><span class="es-value">{{ idleDashboard.enemy.defense }}</span></div>
              <div class="enemy-stat"><span class="es-label">速度</span><span class="es-value">{{ idleDashboard.enemy.speed }}</span></div>
              <div class="enemy-stat"><span class="es-label">暴击</span><span class="es-value">{{ idleDashboard.enemy.critRate }}</span></div>
            </div>
            <div v-if="idleDashboard.enemy.effects && idleDashboard.enemy.effects.length" class="enemy-effects">
              <span v-for="(fx, i) in idleDashboard.enemy.effects" :key="i" class="enemy-effect" :class="fx.type">{{ fx.name }}</span>
            </div>
          </div>
          <!-- 最近获得的装备（即时显示） -->
          <div v-if="idleDashboard.recentEquipment && idleDashboard.recentEquipment.length" class="dash-equipment">
            <div class="dash-equipment-title">
              <span class="dash-equip-emoji">⚔️</span>
              最近获得装备（点击查看）
            </div>
            <div class="dash-equipment-list">
              <div
                v-for="eq in idleDashboard.recentEquipment"
                :key="eq.id + '_' + eq.time"
                class="dash-equipment-item"
                :class="getDashEqEffect(eq.rarity)"
                :style="{ borderColor: eq.color, color: eq.color }"
                @click="showDashEquipment(eq)"
              >
                <span class="eq-emoji">{{ getEquipEmoji(eq.type || eq.slot) }}</span>
                <span class="eq-name">{{ eq.name }}</span>
                <span class="eq-slot">{{ eq.slotName }}</span>
                <span class="eq-rarity">{{ eq.rarityName }}</span>
                <span class="eq-score" v-if="eq.score">评分 {{ eq.score }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 仪表盘点击的装备详情弹窗 -->
    <div v-if="showDashEqModal && dashEqDetail" class="equip-select-modal" @click.self="showDashEqModal = false">
      <div class="modal-content glass-card">
        <h3 class="section-title" :style="{ color: dashEqDetail.color }">{{ dashEqDetail.name }}</h3>
        <div class="char-meta" style="margin-bottom: 12px">
          <span>{{ dashEqDetail.slotName }}</span>
          <span>·</span>
          <span>{{ dashEqDetail.rarityName }}</span>
          <span>·</span>
          <span>评分 {{ dashEqDetail.score || 0 }}</span>
        </div>
        <div v-if="dashEqDetail.stats" class="attr-block">
          <h4 class="sub-title">基础数据</h4>
          <div class="attr-table">
            <div v-for="(v, k) in dashEqDetail.stats" :key="k" class="attr-row">
              <span class="attr-col-label">{{ getStatName(k) }}</span>
              <span class="attr-col-final">{{ formatStatValue(k, v) }}</span>
            </div>
          </div>
        </div>
        <div v-if="dashEqDetail.affixes && dashEqDetail.affixes.length" class="attr-block">
          <h4 class="sub-title">词条</h4>
          <div v-for="a in dashEqDetail.affixes" :key="a.id" class="attr-row">
            <span class="attr-col-label" :class="'affix-tier-' + a.tier">{{ a.name }}</span>
            <span class="attr-col-final">{{ a.valueType === 'percent' ? (a.value * 100).toFixed(1) + '%' : a.value }}</span>
          </div>
        </div>
        <button class="btn btn-warning" style="margin-top: 12px" @click="showDashEqModal = false">关闭</button>
      </div>
    </div>

    <!-- 挂机结算栏 -->
    <div v-if="lastSummary && !isIdling" class="idle-summary-section glass-card">
      <div class="idle-summary-header">
        <h3 class="section-title">挂机结算</h3>
        <span class="idle-summary-meta">
          {{ lastSummary.zoneName }} · {{ Math.round(lastSummary.duration / 60000) }}分钟 · {{ lastSummary.encounters }}次探索
        </span>
      </div>

      <!-- 挂机统计 -->
      <div class="idle-summary">
        <div class="summary-item">
          <span class="summary-label">总探索</span>
          <span class="summary-value">{{ lastSummary.encounters }}次</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">胜利</span>
          <span class="summary-value green">{{ lastSummary.victories }}次</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">失败</span>
          <span class="summary-value red">{{ lastSummary.defeats }}次</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">获得灵石</span>
          <span class="summary-value gold">{{ lastSummary.totalStones }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">获得幻灵结晶</span>
          <span class="summary-value" style="color:#9370db">{{ lastSummary.totalPhantomCrystals || 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">获得修为</span>
          <span class="summary-value">{{ lastSummary.totalCultivation }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">获得装备</span>
          <span class="summary-value">{{ lastSummary.totalEquipment }}</span>
        </div>
        <div class="summary-item" v-if="lastSummary.totalBossTickets > 0">
          <span class="summary-label">🎟️ 挑战券</span>
          <span class="summary-value" style="color:#FF8C00">+{{ lastSummary.totalBossTickets }}</span>
        </div>
        <div class="summary-item" v-if="lastSummary.totalBossMaterials > 0">
          <span class="summary-label">👹 BOSS素材</span>
          <span class="summary-value" style="color:#FF4500">+{{ lastSummary.totalBossMaterials }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">总伤害</span>
          <span class="summary-value" style="color:#ff5722">{{ formatNumber(lastSummary.totalDamageDealt || 0) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">总受伤</span>
          <span class="summary-value" style="color:#e53935">{{ formatNumber(lastSummary.totalDamageTaken || 0) }}</span>
        </div>
      </div>

      <!-- 获得素材汇总 -->
      <div v-if="lastSummary.materialSummary && lastSummary.materialSummary.length" class="material-detail-section">
        <div class="material-detail-header">
          <span class="material-detail-title">📦 获得素材</span>
        </div>
        <div class="material-detail-list">
          <div
            v-for="m in lastSummary.materialSummary"
            :key="m.type"
            class="material-detail-item"
          >
            <img v-if="m.icon" :src="m.icon" class="material-icon" :alt="m.name" />
            <span class="material-name">{{ m.name }}</span>
            <span class="material-amount">×{{ formatNumber(m.amount) }}</span>
          </div>
        </div>
      </div>

      <!-- 获得装备详情 -->
      <div v-if="lastSummary.equipmentList && lastSummary.equipmentList.length > 0" class="equipment-detail-section">
        <div class="equipment-detail-header">
          <span class="equipment-detail-title">🎁 获得装备详情</span>
        </div>
        <div class="equipment-detail-list">
          <div
            v-for="(eq, index) in lastSummary.equipmentList"
            :key="index"
            class="equipment-detail-item"
            :style="{ borderColor: eq.qualityInfo?.color || '#888' }"
            @click="openBattleRewardEquipDetail(eq)"
          >
            <div class="eq-name" :style="{ color: eq.qualityInfo?.color || '#fff' }">
              {{ eq.name }}
              <span class="eq-quality">{{ eq.qualityInfo?.name || '' }}</span>
              <span class="eq-score">评分 {{ getEquipScore(eq) }}</span>
            </div>
            <div class="eq-type">{{ getEquipSlotName(eq) }}</div>
            <div class="eq-stats">
              <span v-for="(value, key) in (eq.mainAttributes || eq.stats || {})" :key="key" class="eq-stat">
                {{ getStatName(key) }} +{{ formatStatValue(key, value) }}
              </span>
            </div>
            <div v-if="eq.affixes && eq.affixes.length > 0" class="eq-affixes">
              <span v-for="(affix, idx) in eq.affixes" :key="idx" class="eq-affix">
                {{ affix.name }}
              </span>
            </div>
            <div class="eq-click-hint">点击查看详情</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 队伍选择弹窗 -->
    <Teleport to="body">
      <div v-if="showTeamModal" class="team-modal-overlay" @click="toggleTeamModal">
        <div class="team-modal" @click.stop>
          <div class="team-modal-header">
            <h3>选择出战队伍</h3>
            <button class="modal-close" @click="toggleTeamModal">✕</button>
          </div>
          <div class="team-modal-body">
            <div class="sect-members-list">
              <div class="sect-members-title">宗门成员（{{ playerStore.sectMembers.length }}/{{ playerStore.maxSectSize }}）</div>
              <div class="sect-members-grid">
                <div
                  v-for="member in playerStore.sectMembers"
                  :key="member.id"
                  class="sect-member-card"
                  :class="{ selected: isMemberInTeam(member.id) }"
                  @click="toggleMemberInTeam(member.id)"
                >
                  <div class="sect-avatar" @click.stop="openAvatarViewer(member)">
                    <img v-if="getCharacterAvatar(member)" :src="getCharacterThumbnail(member)" class="sect-avatar-img" :alt="member.name" loading="lazy" decoding="async" />
                    <span v-else>{{ member.name[0] }}</span>
                  </div>
                  <div class="sect-member-info">
                    <div class="sect-member-name">{{ member.name }}</div>
                    <div class="sect-member-stars">
                      <span v-for="i in member.star" :key="i" class="star">★</span>
                    </div>
                  </div>
                  <div class="sect-member-build">{{ formatNumber(playerStore.getCharacterBuildStrength(member)) }}</div>
                  <div class="sect-member-school">{{ characterSchools[member.school]?.name || member.school }}</div>
                  <div v-if="isMemberInTeam(member.id)" class="sect-member-selected">✓</div>
                </div>
              </div>
            </div>
          </div>
          <div class="team-modal-footer">
            <button class="btn btn-primary" @click="saveTeam">确认队伍</button>
            <button class="btn btn-secondary" @click="clearTeam">清空队伍</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 战斗奖励装备详情弹窗 -->
    <Teleport to="body">
      <div v-if="showBattleRewardEqDetail && battleRewardEqDetail" class="equip-select-modal" @click.self="closeBattleRewardEquipDetail">
        <div class="modal-content glass-card" @click.stop>
          <button class="btn btn-warning btn-close" @click="closeBattleRewardEquipDetail">关闭</button>
          <div class="modal-header" :style="{ borderColor: battleRewardEqDetail.color }">
            <span class="modal-title" :style="{ color: battleRewardEqDetail.color }">{{ battleRewardEqDetail.name }}</span>
            <span>{{ battleRewardEqDetail.rarityName }}</span>
            <span>·</span>
            <span>评分 {{ battleRewardEqDetail.score || 0 }}</span>
          </div>
          <div v-if="battleRewardEqDetail.stats && Object.keys(battleRewardEqDetail.stats).length" class="attr-block">
            <h4 class="sub-title">基础数据</h4>
            <div class="attr-table">
              <div v-for="(v, k) in battleRewardEqDetail.stats" :key="k" class="attr-row">
                <span class="attr-col-label">{{ getStatName(k) }}</span>
                <span class="attr-col-final">{{ formatStatValue(k, v) }}</span>
              </div>
            </div>
          </div>
          <div v-if="battleRewardEqDetail.affixes && battleRewardEqDetail.affixes.length" class="attr-block">
            <h4 class="sub-title">词条</h4>
            <div v-for="a in battleRewardEqDetail.affixes" :key="a.id" class="attr-row">
              <span class="attr-col-label" :class="'affix-tier-' + a.tier">{{ a.name }}</span>
              <span class="attr-col-final">{{ a.valueType === 'percent' ? (a.value * 100).toFixed(1) + '%' : a.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 全屏立绘查看器 -->
    <Teleport to="body">
      <div v-if="showAvatarViewer" class="avatar-fullscreen" @click="closeAvatarViewer">
        <img
          v-if="avatarViewerMember && getCharacterAvatar(avatarViewerMember)"
          :src="getCharacterAvatar(avatarViewerMember)"
          class="avatar-fullscreen-img"
          @click.stop
        />
        <div v-else class="avatar-fullscreen-placeholder">暂无立绘</div>
        <div class="avatar-fullscreen-name">{{ avatarViewerMember?.name || '' }}</div>
        <div class="avatar-fullscreen-hint">点击任意位置关闭</div>
      </div>
    </Teleport>

    <!-- BOSS 挑战面板 -->
    <Teleport to="body">
      <div v-if="showBossChallengePanel" class="boss-challenge-overlay" @click.self="closeBossChallengePanel">
        <div class="boss-challenge-modal" @click.stop>
          <div class="boss-challenge-header">
            <h3>👑 BOSS 挑战</h3>
            <button class="modal-close" @click="closeBossChallengePanel">✕</button>
          </div>
          <div class="boss-challenge-body">
            <!-- 当前 Build 提示 -->
            <div class="boss-challenge-build-info">
              <span>当前 Build 强度：{{ formatNumber(playerBuildStrength) }}</span>
              <span class="boss-challenge-tip">挑战需消耗对应 BOSS 专属挑战券（挂机该秘境击杀 BOSS 时 ~30% 概率掉落 1~2 张）</span>
            </div>

            <!-- BOSS 选择网格（按秘境分组） -->
            <div v-if="!selectedBossTarget" class="boss-groups">
              <div v-for="group in bossChallengeGroups" :key="group.zoneId" class="boss-group">
                <div class="boss-group-title">
                  <span class="boss-group-name">{{ group.zoneName }}</span>
                  <span class="boss-group-badge" :style="{ backgroundColor: group.zoneDifficultyColor }">{{ group.zoneDifficultyLabel }}</span>
                </div>
                <div class="boss-cards-row">
                  <div
                    v-for="boss in group.bosses"
                    :key="boss.bossId"
                    class="boss-target-card"
                    :class="{ disabled: boss.ticketCount <= 0 }"
                    @click="boss.ticketCount > 0 ? selectBossTarget(group.zoneId, boss) : null"
                  >
                    <div class="boss-target-name">{{ boss.name }}</div>
                    <div class="boss-target-stats">
                      <span>攻 {{ formatNumber(boss.stats?.attack || 0) }}</span>
                      <span>血 {{ formatNumber(boss.stats?.health || 0) }}</span>
                    </div>
                    <div class="boss-target-ticket" :class="{ none: boss.ticketCount <= 0 }">
                      🎟️ {{ boss.ticketName }} ×{{ boss.ticketCount }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- BOSS 挑战确认/执行面板 -->
            <div v-else class="boss-challenge-confirm">
              <button class="btn-back" @click="selectedBossTarget = null">← 返回选择</button>
              <div class="boss-confirm-info">
                <div class="boss-confirm-name">
                  {{ selectedBossTarget.boss?.name || '' }}
                  <span class="boss-confirm-zone">（{{ zones.find(z => z.id === selectedBossTarget.zoneId)?.name }}）</span>
                </div>
                <div class="boss-confirm-desc">{{ selectedBossTarget.boss?.description }}</div>
                <div class="boss-confirm-stats">
                  <span>攻击：{{ formatNumber(selectedBossTarget.boss?.stats?.attack || 0) }}</span>
                  <span>生命：{{ formatNumber(selectedBossTarget.boss?.stats?.health || 0) }}</span>
                  <span>防御：{{ formatNumber(selectedBossTarget.boss?.stats?.defense || 0) }}</span>
                  <span>速度：{{ formatNumber(selectedBossTarget.boss?.stats?.speed || 0) }}</span>
                </div>
                <div class="boss-confirm-traits" v-if="selectedBossTarget.boss?.traits?.length">
                  <span v-for="t in selectedBossTarget.boss.traits" :key="t" class="boss-trait-tag">{{ t }}</span>
                </div>
                <div class="boss-confirm-meta">
                  <div class="meta-row">
                    <span class="meta-label">🎟️ 挑战券</span>
                    <span class="meta-value" :style="{ color: selectedBossTicketCount > 0 ? '#FF8C00' : '#EF5350' }">
                      {{ selectedBossTarget.boss?.name }}挑战券 ×{{ selectedBossTicketCount }}
                    </span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">⚔️ 预估胜率</span>
                    <span class="meta-value" :style="{ color: selectedBossWinChance >= 50 ? '#66BB6A' : '#EF5350' }">{{ selectedBossWinChance }}%</span>
                  </div>
                </div>
              </div>

              <!-- 挑战次数选择 -->
              <div class="boss-count-selector">
                <label class="count-label">挑战次数：</label>
                <div class="count-options">
                  <button
                    v-for="opt in BOSS_CHALLENGE_COUNT_OPTIONS"
                    :key="opt"
                    class="count-opt"
                    :class="{ active: bossChallengeCount === opt }"
                    @click="bossChallengeCount = opt"
                  >{{ opt }} 次</button>
                </div>
                <input
                  type="number"
                  class="count-input"
                  v-model.number="bossChallengeCount"
                  min="1"
                  :max="selectedBossTicketCount"
                  step="1"
                />
                <button class="count-max-btn" @click="bossChallengeCount = selectedBossTicketCount">全部</button>
              </div>

              <!-- 挑战按钮 -->
              <button
                class="btn-execute-challenge"
                :disabled="selectedBossTicketCount <= 0 || bossChallengeCount <= 0"
                @click="executeBossChallenge"
              >
                ⚔️ 挑战 {{ selectedBossTarget.boss?.name }} ×{{ Math.max(1, Math.floor(bossChallengeCount) || 1) }}
                （消耗 {{ Math.min(Math.max(1, Math.floor(bossChallengeCount) || 1), selectedBossTicketCount) }} 张挑战券）
              </button>

              <!-- 挑战结果展示 -->
              <div v-if="bossChallengeResult && bossChallengeResult.success && bossChallengeResult.bossId === selectedBossTarget.bossId" class="boss-challenge-result">
                <div class="result-summary">
                  <span class="result-victory">✅ 胜利 {{ bossChallengeResult.victories }}</span>
                  <span class="result-defeat">❌ 失败 {{ bossChallengeResult.defeats }}</span>
                </div>
                <div v-if="bossChallengeDropSummary.length" class="result-drops">
                  <div class="result-drops-title">📦 本次获得</div>
                  <div class="result-drops-list">
                    <div v-for="d in bossChallengeDropSummary" :key="d.type" class="result-drop-item">
                      <span class="drop-name">{{ d.name }}</span>
                      <span class="drop-amount">×{{ d.amount }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 挑战失败提示（券不足等） -->
              <div v-else-if="bossChallengeResult && !bossChallengeResult.success && bossChallengeResult.bossId === selectedBossTarget.bossId" class="boss-challenge-error">
                ⚠️ {{ bossChallengeResult.message }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePlayerStore } from '../stores/player'
import { zones, BUILD_TIERS } from '../plugins/zones'
import { useIdleSystem } from '../composables/useIdleSystem'
import { characterSchools, getCharacterAvatar, getCharacterThumbnail } from '../plugins/characters'
import { getStatName, formatStatValue } from '../plugins/stats'
import { formatNumber } from '../utils/formatNumber.js'
import { calculateEquipmentScore } from '../plugins/buildSystem'
import { getPillsByZone } from '../plugins/pills'
import { BOSS_TICKETS, getBossTicketByBossId } from '../plugins/cultivationSystem'
import BattleStage from './BattleStage.vue'

// 装备槽位中文映射（结算栏装备展示用）
const SLOT_NAME_MAP = {
  head: '头部', body: '衣服', legs: '裤子', feet: '鞋子',
  shoulder: '肩甲', hands: '手套', wrist: '护腕', necklace: '项链',
  ring1: '戒指1', ring2: '戒指2', belt: '腰带', artifact: '法宝'
}
const getEquipSlotName = (eq) => {
  if (!eq) return ''
  if (eq.typeName) return eq.typeName
  return SLOT_NAME_MAP[eq.slot || eq.type] || eq.type || ''
}
// 装备评分：优先用已缓存的 score，否则实时计算
const getEquipScore = (eq) => {
  if (!eq) return 0
  if (typeof eq.score === 'number' && eq.score > 0) return eq.score
  try { return calculateEquipmentScore(eq) || 0 } catch (e) { return 0 }
}

const playerStore = usePlayerStore()
const {
  selectedZone,
  selectedDifficultyKey,
  isIdling,
  idleEncounterCount,
  idleProgress,
  idleTimeRemaining,
  lastSummary,
  combatState,
  animState,
  canStartIdle,
  playerBuildStrength,
  currentRecommendedBuild,
  buildRatio,
  idlePlayerHP,
  idlePlayerMaxHP,
  idlePlayerDefeated,
  idleDashboard,
  activePillBuffList,
  setSelectedZone,
  setDifficulty,
  startIdle,
  stopIdle,
  runManualBattle,
  grantReward,
  showTreasureFlash,
  buildEffectiveZone,
  getZoneDifficulty,
  currentEncounter,
  idleDiag,
  bossSpawned,
  bossDefeated,
  bossSpawnRound,
  bossTimeRemaining,
  // BOSS 挑战系统
  bossChallengeResult,
  runBossChallenge
} = useIdleSystem()

// 匹配度配色
const matchColor = computed(() => {
  const r = buildRatio.value
  if (r >= 1) return '#66BB6A'
  if (r >= 0.6) return '#DAA520'
  return '#EF5350'
})
const matchText = computed(() => {
  const r = buildRatio.value
  if (r >= 1) return '气血充盈，可稳定挂机'
  if (r >= 0.6) return '稍有压力，需注意气血'
  return 'Build 不足，挂机可能提前力竭'
})

// 全屏立绘查看器
const showAvatarViewer = ref(false)
const avatarViewerMember = ref(null)
// 诊断面板折叠状态
const diagCollapsed = ref(false)
const openAvatarViewer = (member) => {
  if (!member || !getCharacterAvatar(member)) return
  avatarViewerMember.value = member
  showAvatarViewer.value = true
}
const closeAvatarViewer = () => {
  showAvatarViewer.value = false
  avatarViewerMember.value = null
}

// ============ BOSS 挑战系统 ============
// BOSS 挑战面板显隐
const showBossChallengePanel = ref(false)
// 当前选中的 BOSS（{ zoneId, bossId, boss }）
const selectedBossTarget = ref(null)
// 当前选择的挑战次数
const bossChallengeCount = ref(1)
// 预设挑战次数选项
const BOSS_CHALLENGE_COUNT_OPTIONS = [1, 5, 10, 20]
// 展开的 BOSS 挑战面板：按秘境分组列出所有 16 个 BOSS
const bossChallengeGroups = computed(() => {
  // 显式访问 playerStore.materials 让 Vue 追踪依赖，确保素材库变化时本 computed 重算
  const materials = playerStore.materials || []
  return zones.map(zone => ({
    zoneId: zone.id,
    zoneName: zone.name,
    zoneDifficulty: zone.difficulty,
    zoneDifficultyLabel: zone.difficultyLabel,
    zoneDifficultyColor: zone.difficultyColor,
    bosses: (zone.bosses || []).map(boss => {
      const ticketDef = getBossTicketByBossId(zone.id, boss.id)
      // 直接在 materials 数组上 filter 计数（避免 countMaterial action 闭包问题）
      const ticketId = ticketDef?.id
      const ticketCount = ticketId
        ? materials.filter(m => m && m.kind === 'boss_ticket' && m.id === ticketId).length
        : 0
      return {
        zoneId: zone.id,
        bossId: boss.id,
        name: boss.name,
        description: boss.description,
        stats: boss.stats,
        traits: boss.traits || [],
        ticketId: ticketId || null,
        ticketName: ticketDef?.name || '挑战券',
        ticketCount
      }
    })
  }))
})
// 当前选中 BOSS 的挑战券数量（响应式，会随玩家素材库变化）
const selectedBossTicketCount = computed(() => {
  if (!selectedBossTarget.value) return 0
  const ticketDef = getBossTicketByBossId(selectedBossTarget.value.zoneId, selectedBossTarget.value.bossId)
  if (!ticketDef) return 0
  // 显式访问 playerStore.materials 让 Vue 追踪依赖
  const materials = playerStore.materials || []
  return materials.filter(m => m && m.kind === 'boss_ticket' && m.id === ticketDef.id).length
})
// 当前选中 BOSS 的胜率预测（基于 Build 与 BOSS 推荐 Build 比例）
const selectedBossWinChance = computed(() => {
  if (!selectedBossTarget.value) return 0
  const zone = zones.find(z => z.id === selectedBossTarget.value.zoneId)
  if (!zone) return 0
  const diff = (zone.difficulties || []).find(d => d.key === 'xiongxian') || zone.difficulties?.[2]
  if (!diff) return 0
  const match = String(selectedBossTarget.value.bossId || '').match(/_(\d+)$/)
  const idx = match ? Math.max(0, parseInt(match[1], 10) - 1) : 0
  const bossBuild = Math.max(1, Math.floor((diff.recommendedBuild || 1) * (1 + idx * 0.15)))
  const ratio = (playerStore.buildStrength || 1) / bossBuild
  const chance = Math.min(0.97, Math.max(0.05, 0.5 + (ratio - 1) * 0.4))
  return Math.round(chance * 100)
})
// 选择挑战目标 BOSS
const selectBossTarget = (zoneId, boss) => {
  selectedBossTarget.value = { zoneId, bossId: boss.id, boss }
  bossChallengeCount.value = 1
}
// 关闭 BOSS 挑战面板
const closeBossChallengePanel = () => {
  showBossChallengePanel.value = false
  selectedBossTarget.value = null
}
// 执行 BOSS 挑战
const executeBossChallenge = () => {
  if (!selectedBossTarget.value) return
  const count = Math.max(1, Math.floor(bossChallengeCount.value) || 1)
  runBossChallenge(selectedBossTarget.value.zoneId, selectedBossTarget.value.bossId, count)
}
// 挑战结果汇总展示用：按 type 聚合 drops
const bossChallengeDropSummary = computed(() => {
  const r = bossChallengeResult.value
  if (!r || !r.drops || !r.drops.length) return []
  const map = {}
  for (const d of r.drops) {
    const key = d.type || d.kind || d.id
    if (!map[key]) {
      map[key] = { type: key, name: d.name, amount: 0 }
    }
    map[key].amount += (d.amount || 1)
  }
  return Object.values(map)
})

// 血条百分比
const idleHpPercent = computed(() => {
  if (!idlePlayerMaxHP.value) return 0
  return Math.max(0, Math.min(100, (idlePlayerHP.value / idlePlayerMaxHP.value) * 100))
})

// 筛选（按秘境等级）
const filters = [
  { key: 'all', label: '全部' },
  { key: 'low', label: '初境' },
  { key: 'mid', label: '中境' },
  { key: 'high', label: '上境' }
]
const activeFilter = ref('all')
const filteredZones = computed(() => {
  if (activeFilter.value === 'low') return zones.filter(z => z.difficulty <= 2)
  if (activeFilter.value === 'mid') return zones.filter(z => z.difficulty >= 3 && z.difficulty <= 5)
  if (activeFilter.value === 'high') return zones.filter(z => z.difficulty >= 6)
  return zones
})

// 八图全开：不再等级锁
const canEnter = () => true
const selectZone = (zone) => {
  setSelectedZone(zone)
  setDifficulty(zone.difficulties[2].key)
}

// 仪表盘点击查看装备详情
const showDashEqModal = ref(false)
const dashEqDetail = ref(null)
const showDashEquipment = (eq) => {
  dashEqDetail.value = eq
  showDashEqModal.value = true
}

// 最近获得装备：按稀有度映射发光/渐变流光特效档位（稀有及以上保留宝物高亮提示）
const DASH_EQ_EFFECT = {
  rare: 'is-rare',
  epic: 'is-epic',
  legendary: 'is-legendary',
  mythic: 'is-mythic',
  spiritual: 'is-rare',
  mystic: 'is-epic',
  celestial: 'is-legendary',
  divine: 'is-mythic'
}
const getDashEqEffect = (rarity) => DASH_EQ_EFFECT[rarity] || ''

// 队伍选择相关
const showTeamModal = ref(false)
const tempTeam = ref([])

const toggleTeamModal = () => {
  if (!showTeamModal.value) {
    tempTeam.value = [...playerStore.teamMembers]
  }
  showTeamModal.value = !showTeamModal.value
}

const teamMembersDetail = computed(() => {
  return playerStore.getTeamMembersDetail()
})

const isMemberInTeam = (memberId) => {
  return tempTeam.value.includes(memberId)
}

const toggleMemberInTeam = (memberId) => {
  const index = tempTeam.value.indexOf(memberId)
  if (index > -1) {
    tempTeam.value.splice(index, 1)
  } else {
    if (tempTeam.value.length < playerStore.maxTeamSize) {
      tempTeam.value.push(memberId)
    }
  }
}

const saveTeam = () => {
  playerStore.setTeamMembers(tempTeam.value)
  showTeamModal.value = false
}

const clearTeam = () => {
  tempTeam.value = []
}

const getZoneIcon = (id) => {
  const icons = {
    forest_edge: '🌲', misty_valley: '🌫️', phoenix_cave: '🔥', dragon_abyss: '🐉',
    ghost_wasteland: '💀', ice_palace: '❄️', immortal_ruins: '🏛️', chaos_realm: '🌀'
  }
  return icons[id] || '⛰️'
}

const EQUIP_ICON_MAP = {
  head: '/assets/icons/reward_eq_head.png',
  body: '/assets/icons/reward_eq_body.png',
  legs: '/assets/icons/reward_eq_legs.png',
  feet: '/assets/icons/reward_eq_feet.png',
  shoulder: '/assets/icons/reward_eq_shoulder.png',
  hands: '/assets/icons/reward_eq_wrist.png',
  wrist: '/assets/icons/reward_eq_wrist.png',
  necklace: '/assets/icons/reward_eq_necklace.png',
  ring1: '/assets/icons/reward_eq_ring.png',
  ring2: '/assets/icons/reward_eq_ring.png',
  belt: '/assets/icons/reward_eq_belt.png',
  artifact: '/assets/icons/reward_eq_artifact.png',
  equipment: '/assets/icons/reward_eq_default.png',
  pet: '/assets/icons/reward_pet.png'
}

const EQUIP_EMOJI_MAP = {
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
  pet: '🐾'
}

const REWARD_TYPE_ICON_MAP = {
  spirit_stone: '/assets/icons/reward_eq_default.png',
  herb: '/assets/icons/reward_mat_herb.png',
  ore: '/assets/icons/reward_mat_ore.png',
  liquid: '/assets/icons/reward_mat_liquid.png',
  fortune: '/assets/icons/reward_mat_core.png',
  cultivation: '/assets/icons/reward_eq_default.png',
  equipment: '/assets/icons/reward_eq_default.png',
  pet: '/assets/icons/reward_pet.png'
}

const REWARD_TYPE_NAME_MAP = {
  spirit_stone: '灵石',
  herb: '灵草',
  ore: '矿料',
  liquid: '灵液',
  fortune: '奇遇',
  cultivation: '修为',
  equipment: '装备',
  pet: '灵宠'
}

const getRewardTypeName = (type, name) => {
  return name || REWARD_TYPE_NAME_MAP[type] || type
}

const getEquipIcon = (slot) => {
  return EQUIP_ICON_MAP[slot] || '/assets/icons/reward_eq_default.png'
}

const getEquipEmoji = (slot) => {
  return EQUIP_EMOJI_MAP[slot] || '📦'
}

const getRewardIcon = (type) => {
  return REWARD_TYPE_ICON_MAP[type] || '/assets/icons/reward_eq_default.png'
}

const getZonePillNames = (zoneId) => {
  const pills = getPillsByZone(zoneId)
  if (pills.length === 0) return '暂无'
  return pills.map(p => p.name).join('、')
}

// 当前选中难度信息
const currentDifficulty = computed(() =>
  selectedZone.value ? getZoneDifficulty(selectedZone.value, selectedDifficultyKey.value) : null
)

// 挂机时长选项
const idleDurations = [
  { minutes: 5, encounters: 1 },
  { minutes: 10, encounters: 2 },
  { minutes: 15, encounters: 3 },
  { minutes: 20, encounters: 4 },
  { minutes: 30, encounters: 6 }
]
const selectedDuration = ref(5)
// 约 15 秒一场遭遇
const idleEncounterEstimate = computed(() => Math.max(1, Math.round((selectedDuration.value * 60) / 15)))
const idleStoneEstimate = computed(() =>
  currentDifficulty.value ? currentDifficulty.value.spiritCost * idleEncounterEstimate.value : 0
)

// 手动探索（实时战斗：逐回合结算并实时反馈，状态跨场保留）
const startExplore = async () => {
  if (!selectedZone.value || combatState.value.inCombat || isIdling.value) return
  playerStore.regenerateSpirit()
  playerStore.explorationCount++
  playerStore.queueSave()
  const diff = getZoneDifficulty(selectedZone.value, selectedDifficultyKey.value)
  const effectiveZone = buildEffectiveZone(selectedZone.value, diff)
  // runManualBattle 内部已实时推进战斗并写回角色血量，这里只负责发放奖励
  const result = await runManualBattle(effectiveZone)
  if (result.victory) {
    const rewards = grantReward(effectiveZone, false)
    if (result.drops && result.drops.length) {
      result.drops.forEach(d => rewards.push({ type: 'core', amount: 1, name: d.name, material: d }))
    }
    playerStore.dungeonTotalKills++
    playerStore.queueSave()
    rewards.forEach(showTreasureFlash)
  } else {
    const loss = Math.floor(playerStore.cultivation * 0.1)
    playerStore.cultivation = Math.max(0, playerStore.cultivation - loss)
    playerStore.dungeonDeathCount++
    playerStore.queueSave()
  }
  combatState.value = { inCombat: false, combatManager: null }
}

// 战斗丹药（实时战斗：作用于 currentEncounter 中的存活队员实体）
const useBattlePill = (pill) => {
  const enc = currentEncounter.value
  if (!enc || !enc.inProgress || !enc.players || !enc.players.length) return
  const target = enc.players.find(p => p.currentHealth > 0) || enc.players[0]
  const consumed = playerStore.consumeBattlePill(pill.uid)
  if (!consumed) return
  if (consumed.type === 'healBattle') {
    const amount = Math.round(target.stats.maxHealth * (consumed.value || 0.3))
    target.heal(amount)
  } else if (consumed.type === 'cleanse') {
    const amount = Math.round(target.stats.maxHealth * 0.15)
    target.heal(amount)
    if (Array.isArray(target.effects)) target.effects = []
  }
}


// 战斗奖励装备详情弹窗
const battleRewardEqDetail = ref(null)
const showBattleRewardEqDetail = ref(false)

const openBattleRewardEquipDetail = (eq) => {
  battleRewardEqDetail.value = {
    id: eq.id,
    name: eq.name,
    type: eq.type,
    typeName: getEquipSlotName(eq),
    rarity: eq.rarity,
    rarityName: eq.qualityInfo?.name || '',
    color: eq.qualityInfo?.color || '#9e9e9e',
    score: getEquipScore(eq),
    stats: eq.mainAttributes || eq.stats || {},
    affixes: eq.affixes || []
  }
  showBattleRewardEqDetail.value = true
}

const closeBattleRewardEquipDetail = () => {
  showBattleRewardEqDetail.value = false
  battleRewardEqDetail.value = null
}

onMounted(() => {
  playerStore.regenerateSpirit()
  if (selectedZone.value && !selectedDifficultyKey.value) {
    setDifficulty(selectedZone.value.difficulties[2].key)
  }
})
onUnmounted(() => {
  // userScrollTimer 历史遗留引用已移除，此处保留 onUnmounted 钩子占位，避免未来需要清理资源时遗漏
})
</script>

<style scoped>
.zone-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exploration-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.15), rgba(218, 165, 32, 0.08));
  border-radius: 12px;
}
.header-icon {
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #8B4513, #DAA520);
  border-radius: 12px;
  font-size: 14px;
  color: #fff;
  font-weight: bold;
}
.card-title {
  margin: 0;
  font-size: 20px;
  color: var(--color-accent-gold, #DAA520);
}
.card-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #C9C4BA;
}

/* 筛选 */
.filter-bar {
  display: flex;
  gap: 8px;
  padding: 0 4px;
}
.filter-chip {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}
.filter-chip.active {
  background: linear-gradient(135deg, #8B4513, #DAA520);
  border-color: #DAA520;
  color: #fff;
}

/* 区域网格 */
.zones-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.zone-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}
.zone-card:hover {
  transform: translateY(-2px);
  border-color: rgba(218, 165, 32, 0.4);
}
.zone-card.selected {
  border-color: #DAA520;
  box-shadow: 0 0 12px rgba(218, 165, 32, 0.3);
}
.zone-banner {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 3px solid;
  position: relative;
  background: rgba(0, 0, 0, 0.3);
}
.zone-icon-area {
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.zone-icon-img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
}
.detail-zone-icon {
  width: 28px;
  height: 28px;
  object-fit: cover;
  border-radius: 4px;
  vertical-align: middle;
  margin-right: 8px;
}
.zone-difficulty-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  color: #fff;
  font-weight: bold;
}
.zone-body {
  padding: 8px 10px;
}
.zone-name {
  font-size: 14px;
  font-weight: bold;
  color: #DAA520;
  margin-bottom: 4px;
}
.zone-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}
.meta-item {
  font-size: 11px;
  color: #C9C4BA;
}
.zone-monsters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.monster-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: #F5DEB3;
}

/* 详情 */
.zone-detail {
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.detail-title {
  margin: 0 0 4px;
  font-size: 18px;
  color: #DAA520;
}
.detail-desc {
  margin: 0;
  font-size: 13px;
  color: #C9C4BA;
  max-width: 70%;
}
.zone-image {
  width: 100%;
  max-height: 240px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 12px;
  opacity: 0.85;
  background-color: rgba(0, 0, 0, 0.2);
}
.difficulty-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #fff;
  font-weight: bold;
}
.detail-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-size: 13px;
}
.stat-label { color: #C9C4BA; }
.stat-value { color: #fff; font-weight: bold; }
.gold-text { color: #DAA520; }

/* 难度档选择 */
.difficulty-selector {
  padding: 10px 12px;
  margin-bottom: 12px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.diff-label {
  font-size: 12px;
  color: #C9C4BA;
  margin-bottom: 8px;
}
.diff-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.diff-chip {
  padding: 6px 16px;
  border-radius: 18px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid var(--chip-color, #888);
  color: #F5F0E8;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s;
}
.diff-chip.active {
  background: var(--chip-color, #DAA520);
  color: #fff;
  font-weight: bold;
  box-shadow: 0 0 10px var(--chip-color, #DAA520);
}
.diff-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #F5DEB3;
}
.diff-info b {
  color: #DAA520;
  font-size: 13px;
}

/* Build 强度提示条 */
.build-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding: 8px 12px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left-width: 3px;
  border-radius: 8px;
}
.build-hint-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}
.build-hint-sub {
  color: #C9C4BA;
  font-size: 11px;
}

/* 奖励预览 */
.rewards-preview {
  margin-bottom: 12px;
}
.rewards-title {
  font-size: 13px;
  color: #C9C4BA;
  margin-bottom: 8px;
}
.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.reward-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.reward-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}
.reward-name {
  flex: 1;
  color: #F5F0E8;
}
.reward-chance {
  width: 40px;
  text-align: right;
  color: #ffd700;
  font-weight: 600;
}

.pill-unlock-hint {
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(218, 165, 32, 0.08);
  border: 1px solid rgba(218, 165, 32, 0.2);
  border-radius: 8px;
  font-size: 12px;
  color: #C9C4BA;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.pill-icon {
  font-size: 14px;
}
.pill-text {
  color: #F5DEB3;
}
.pill-names {
  color: #ffd700;
  font-weight: 500;
}

/* 战斗区域 */
.combat-area {
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin-bottom: 12px;
}
.battle-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.battle-pills-label {
  font-size: 13px;
  color: #F5DEB3;
}
.battle-pill-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 16px;
  font-size: 13px;
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.battle-pill-btn:hover {
  transform: translateY(-1px);
}
.battle-pill-btn.healBattle {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
}
.battle-pill-btn.cleanse {
  background: linear-gradient(135deg, #3498db, #2980b9);
}
.combat-round {
  text-align: center;
  font-size: 12px;
  color: #C9C4BA;
  margin-bottom: 8px;
}
.combat-scene {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 12px;
}
.combatant {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 45%;
}
.combatant-name {
  font-size: 12px;
  color: #F5F0E8;
}
.combatant-avatar {
  width: 50px; height: 50px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  font-weight: bold;
}
.player-avatar {
  background: linear-gradient(135deg, #1E90FF, #4169E1);
  color: #fff;
}
.enemy-avatar {
  background: linear-gradient(135deg, #8B0000, #FF4500);
  color: #fff;
}
.hp-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
}
.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #2E7D32, #66BB6A);
  transition: width 0.3s;
}
.enemy-hp {
  background: linear-gradient(90deg, #C62828, #EF5350);
}
.hp-text {
  font-size: 10px;
  color: #C9C4BA;
}
.vs-text {
  font-size: 14px;
  color: #DAA520;
  font-weight: bold;
}
.combatant.attack .combatant-avatar {
  animation: attackAnim 0.4s ease;
}
.combatant.hurt .combatant-avatar {
  animation: hurtAnim 0.4s ease;
}
@keyframes attackAnim {
  0% { transform: scale(1); }
  50% { transform: scale(1.2) translateX(10px); }
  100% { transform: scale(1); }
}
@keyframes hurtAnim {
  0%, 100% { filter: none; }
  50% { filter: brightness(2) hue-rotate(-30deg); }
}

/* 按钮 */
.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-primary {
  background: linear-gradient(135deg, #8B4513, #DAA520);
  color: #fff;
}
.btn-success {
  background: linear-gradient(135deg, #2E7D32, #66BB6A);
  color: #fff;
}
.btn-danger {
  background: linear-gradient(135deg, #C62828, #EF5350);
  color: #fff;
}

/* 挂机探索 */
.idle-section {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 12px;
}
.idle-title {
  font-size: 15px;
  color: #DAA520;
  margin-bottom: 8px;
  font-weight: bold;
}
.idle-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}
.idle-card {
  padding: 8px 4px;
  text-align: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.idle-card.selected {
  border-color: #DAA520;
  background: rgba(218, 165, 32, 0.1);
}
.dur-time {
  font-size: 13px;
  color: #fff;
  font-weight: bold;
}
.dur-info {
  font-size: 10px;
  color: #C9C4BA;
  margin-top: 2px;
}
.dur-cost {
  font-size: 10px;
  color: #DAA520;
}
.idle-running {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.idle-status {
  text-align: center;
}
.idle-timer {
  font-size: 28px;
  font-weight: bold;
  color: #DAA520;
  font-family: monospace;
}
.idle-progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  overflow: hidden;
  margin: 8px 0;
}
.idle-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2E7D32, #66BB6A);
  transition: width 0.5s;
}
.idle-count {
  font-size: 13px;
  color: #C9C4BA;
}

/* BOSS 决战阶段提示（核心玩法：最后 1/5 时间击杀 BOSS） */
.in-boss-phase .idle-progress-fill {
  background: linear-gradient(90deg, #B8860B, #FFD700);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
}
.boss-phase-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(184, 134, 11, 0.22), rgba(196, 77, 77, 0.22));
  border: 1px solid rgba(255, 215, 0, 0.55);
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.18);
  animation: bossPulse 1.6s ease-in-out infinite;
}
.boss-phase-banner.boss-slain {
  background: linear-gradient(135deg, rgba(46, 125, 50, 0.22), rgba(102, 187, 106, 0.22));
  border-color: rgba(102, 187, 106, 0.6);
  box-shadow: 0 0 16px rgba(102, 187, 106, 0.2);
  animation: none;
}
@keyframes bossPulse {
  0%, 100% { box-shadow: 0 0 12px rgba(255, 215, 0, 0.15); }
  50% { box-shadow: 0 0 22px rgba(255, 215, 0, 0.45); }
}
.bp-icon {
  font-size: 26px;
  line-height: 1;
}
.bp-body { flex: 1; text-align: left; }
.bp-title {
  font-size: 14px;
  font-weight: bold;
  color: #FFD86B;
}
.boss-phase-banner.boss-slain .bp-title { color: #8FE08F; }
.bp-sub {
  font-size: 12px;
  color: #EADFC9;
  margin-top: 2px;
}
.bp-time {
  color: #FFD700;
  font-family: monospace;
  font-size: 13px;
}
.bp-countdown {
  font-size: 20px;
  font-weight: bold;
  color: #FFD700;
  font-family: monospace;
  background: rgba(0, 0, 0, 0.35);
  padding: 4px 8px;
  border-radius: 6px;
}

/* 挂机血条 */
.idle-hp {
  margin-top: 4px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}
.idle-hp-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
}
.idle-hp-label {
  font-size: 12px;
  color: #F5DEB3;
}
.idle-hp-num {
  font-size: 12px;
  color: #fff;
  font-family: monospace;
}
.idle-hp-bar {
  height: 12px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  overflow: hidden;
}
.idle-hp-bar .hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #2E7D32, #66BB6A);
  transition: width 0.4s ease;
}
.idle-hp-bar .hp-fill.hp-low {
  background: linear-gradient(90deg, #C62828, #EF5350);
  animation: hpPulse 1s ease-in-out infinite;
}
@keyframes hpPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
.idle-hp-warn {
  margin-top: 5px;
  font-size: 11px;
  color: #EF5350;
}

/* 挂机日志 */
.idle-log-section {
  position: relative;
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.idle-log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.idle-log-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.log-toggle-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(218, 165, 32, 0.4);
  background: rgba(218, 165, 32, 0.15);
  color: #FFD86B;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.log-toggle-btn:hover {
  background: rgba(218, 165, 32, 0.3);
}
.section-title {
  margin: 0;
  font-size: 15px;
  color: #DAA520;
}
.log-meta {
  font-size: 12px;
  color: #C9C4BA;
}
.idle-log-body {
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.log-line {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1.5;
  word-break: break-word;
  border-left: 2px solid transparent;
  animation: logIn 0.35s ease;
  font-family: 'Segoe UI', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.log-avatar {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  margin-top: 1px;
}
.log-inline-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  vertical-align: middle;
  margin-right: 4px;
  margin-left: 4px;
}
.log-content {
  flex: 1;
  min-width: 0;
}
.log-text { display: block; position: relative; z-index: 1; }
@keyframes logIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

/* 探索场景：氛围、幽暗 */
.log-line.scene {
  color: #8aa0bf;
  font-style: italic;
  font-size: 11.5px;
  border-left-color: rgba(138, 160, 191, 0.4);
  background: rgba(138, 160, 191, 0.05);
}
/* 敌人现身 */
.log-line.enemy-normal {
  color: #c8b89a;
  border-left-color: rgba(200, 184, 154, 0.5);
}
.log-line.enemy-elite {
  color: #c89bff;
  font-weight: bold;
  border-left-color: #9932CC;
  background: rgba(153, 50, 204, 0.12);
  text-shadow: 0 0 8px rgba(153, 50, 204, 0.5);
}
.log-line.enemy-boss {
  color: #FFD700;
  font-weight: bold;
  border-left-color: #FF4444;
  background: rgba(255, 68, 68, 0.12);
  text-shadow: 0 0 10px rgba(255, 68, 68, 0.7);
  animation: bossAppear 0.6s ease, logIn 0.35s ease;
}
@keyframes bossAppear {
  0% { transform: scale(0.92); letter-spacing: 2px; }
  60% { transform: scale(1.04); letter-spacing: 0; }
  100% { transform: scale(1); }
}
/* 战斗动作：流光扫过（背景位移动画，避免绝对定位覆盖层在移动端遮挡文字） */
.log-line.combat {
  color: #ffd9a0;
  border-left-color: rgba(255, 176, 64, 0.6);
  background: linear-gradient(90deg, rgba(255, 176, 64, 0.04), rgba(255, 176, 64, 0.14), rgba(255, 176, 64, 0.04));
  background-size: 200% 100%;
  animation: combatGlow 2.2s ease-in-out infinite;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
@keyframes combatGlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 200% 50%; }
}
/* 胜利 */
.log-line.victory {
  color: #7CE38B;
  border-left-color: #66BB6A;
  background: rgba(102, 187, 106, 0.08);
}
.log-line.defeat {
  color: #FF6B6B;
  border-left-color: #EF5350;
  background: rgba(239, 83, 80, 0.1);
  animation: defeatShake 0.4s ease, logIn 0.35s ease;
}
@keyframes defeatShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
/* 奖励 */
.log-line.reward-normal {
  color: #d8d8d8;
  border-left-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.03);
}
/* 普通品质装备掉落：让【名称】更醒目 */
.log-line.reward-normal :deep(.log-text) b {
  color: #b8c4d6;
}
.log-line.reward-highlight {
  color: #7db4ff;
  font-weight: bold;
  border-left-color: #4488ff;
  background: rgba(68, 136, 255, 0.12);
}
.log-line.reward-epic {
  color: #c89bff;
  font-weight: bold;
  border-left-color: #aa44ff;
  background: rgba(170, 68, 255, 0.15);
  animation: logIn 0.35s ease, epicGlowLoop 1.4s ease-in-out infinite;
}
@keyframes epicGlowLoop {
  0%, 100% { box-shadow: 0 0 4px rgba(170, 68, 255, 0.3); }
  50% { box-shadow: 0 0 14px rgba(170, 68, 255, 0.7); }
}
.log-line.reward-legendary {
  color: #FFD700;
  font-weight: bold;
  border-left-color: #FFD700;
  background: rgba(255, 215, 0, 0.18);
  border: 1px solid rgba(255, 215, 0, 0.5);
  animation: logIn 0.35s ease, legendaryGlowLoop 1.8s ease-in-out infinite;
}
@keyframes legendaryGlowLoop {
  0%, 100% { box-shadow: 0 0 6px rgba(255, 215, 0, 0.4); }
  50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.9); }
}
/* 掉落分级特效：凡品/凡品灵宠保持普通(reward-normal)；其余品质按稀有度递增发光/流光/脉冲 */
.log-line.drop-uncommon,
.log-line.drop-spiritual {
  color: #88cc44;
  font-weight: bold;
  border-left-color: #88cc44;
  background: rgba(136, 204, 68, 0.1);
  text-shadow: 0 0 6px rgba(136, 204, 68, 0.5);
}
.log-line.drop-rare,
.log-line.drop-mystic {
  color: #7db4ff;
  font-weight: bold;
  border-left-color: #4488ff;
  background: rgba(68, 136, 255, 0.12);
  box-shadow: 0 0 6px rgba(68, 136, 255, 0.35);
}
.log-line.drop-epic,
.log-line.drop-celestial {
  color: #c89bff;
  font-weight: bold;
  border-left-color: #aa44ff;
  background: rgba(170, 68, 255, 0.15);
  box-shadow: 0 0 4px rgba(170, 68, 255, 0.3);
  animation: logIn 0.35s ease, epicGlowLoop 1.4s ease-in-out infinite;
}
.log-line.drop-legendary {
  color: #FFD700;
  font-weight: bold;
  border-left-color: #FFD700;
  background: rgba(255, 215, 0, 0.18);
  border: 1px solid rgba(255, 215, 0, 0.5);
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
  animation: logIn 0.35s ease, legendaryGlowLoop 1.8s ease-in-out infinite, dropPulse 2.6s ease-in-out infinite;
}
.log-line.drop-divine {
  color: #ff5a5a;
  font-weight: bold;
  border-left-color: #FF0000;
  background: rgba(255, 0, 0, 0.16);
  border: 1px solid rgba(255, 0, 0, 0.55);
  box-shadow: 0 0 8px rgba(255, 0, 0, 0.5);
  animation: logIn 0.35s ease, epicGlowLoop 1.2s ease-in-out infinite, dropPulse 2.2s ease-in-out infinite;
}
.log-line.drop-mythic {
  color: #FF4500;
  font-weight: bold;
  border-left-color: #FF4500;
  background: rgba(255, 69, 0, 0.2);
  border: 1px solid rgba(255, 69, 0, 0.6);
  box-shadow: 0 0 10px rgba(255, 69, 0, 0.6);
  animation: logIn 0.35s ease, mythicGlowLoop 1.5s ease-in-out infinite, dropPulse 2s ease-in-out infinite;
}
/* 极品及以上：文字流光（渐变扫过），越稀有越华丽 */
.log-line.drop-epic .log-text,
.log-line.drop-celestial .log-text,
.log-line.drop-legendary .log-text,
.log-line.drop-divine .log-text,
.log-line.drop-mythic .log-text {
  background: linear-gradient(100deg, currentColor 20%, #ffffff 50%, currentColor 80%);
  background-size: 220% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: dropShimmer 3s linear infinite;
}
@keyframes dropShimmer {
  0% { background-position: 200% center; }
  100% { background-position: 0% center; }
}
@keyframes dropPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.018); }
}
@keyframes mythicGlowLoop {
  0%, 100% { box-shadow: 0 0 8px rgba(255, 69, 0, 0.5); }
  50% { box-shadow: 0 0 22px rgba(255, 69, 0, 1); }
}
/* 奇遇：流光溢彩 */
.log-line.fortune {
  color: #ffd1f0;
  font-weight: bold;
  border-left-color: #ff66cc;
  background: linear-gradient(90deg, rgba(255, 102, 204, 0.12), rgba(255, 215, 0, 0.08));
  background-size: 220% 100%;
  animation: fortuneHue 3s linear infinite;
}
@keyframes fortuneHue {
  0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
  100% { background-position: 220% 50%; filter: hue-rotate(40deg); }
}
/* 标题 / 警告 */
.log-line.header {
  color: #FFD700;
  font-weight: bold;
  font-size: 12.5px;
  letter-spacing: 0.5px;
  border-left-color: #DAA520;
  background: rgba(218, 165, 32, 0.1);
}
.log-line.warning {
  color: #f0a85e;
  border-left-color: #f0883e;
  background: rgba(240, 136, 62, 0.1);
}
/* 奖励明细（装备/灵宠基础数据） */
.log-detail {
  margin-top: 3px;
  padding: 5px 10px;
  font-size: 11.5px;
  line-height: 1.6;
  color: #b9c4d6;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 0 0 6px 6px;
  border-top: 1px dashed rgba(255, 255, 255, 0.15);
  font-family: 'Segoe UI', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', Consolas, Menlo, monospace, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji';
  letter-spacing: 0.3px;
}

/* 挂机结算栏 */
.idle-summary-section {
  position: relative;
  padding: 16px;
  border-radius: 12px;
  background: var(--color-bg-card);
  border: 1px solid rgba(255, 255, 255, 0.12);
  margin-top: 16px;
}
.idle-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.idle-summary-header .section-title {
  margin: 0;
  font-size: 15px;
  color: #DAA520;
}
.idle-summary-meta {
  font-size: 12px;
  color: #E8E2D5;
  font-weight: 500;
}

/* 挂机统计 */
.idle-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.summary-item {
  text-align: center;
}
.summary-label {
  display: block;
  font-size: 10px;
  color: #E8E2D5;
}
.summary-value {
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}
.summary-value.green { color: #66BB6A; }
.summary-value.red { color: #EF5350; }
.summary-value.gold { color: #DAA520; }

/* 宝物高亮弹窗 */
.treasure-flash {
  position: sticky;
  top: 0;
  z-index: 100;
  pointer-events: auto;
  margin-bottom: 8px;
}
.flash-content {
  text-align: center;
  padding: 24px 32px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
}
.flash-icon {
  font-size: 48px;
  margin-bottom: 8px;
}
.flash-icon-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  margin-bottom: 8px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
.flash-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}
.flash-desc {
  font-size: 14px;
  color: #F5F0E8;
}
.treasure-flash.highlight .flash-content {
  border: 2px solid #4488ff;
  box-shadow: 0 0 30px rgba(68, 136, 255, 0.6);
}
.treasure-flash.highlight .flash-title {
  color: #4488ff;
}
.treasure-flash.epic .flash-content {
  border: 2px solid #aa44ff;
  box-shadow: 0 0 40px rgba(170, 68, 255, 0.8);
  animation: epicPulse 2.5s ease;
}
.treasure-flash.epic .flash-title {
  color: #aa44ff;
}
.treasure-flash.legendary .flash-content {
  border: 2px solid #FFD700;
  box-shadow: 0 0 60px rgba(255, 215, 0, 1);
  animation: legendaryPulse 3s ease;
  background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(50,30,0,0.95));
}
.treasure-flash.legendary .flash-title {
  color: #FFD700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
}
.treasure-flash.legendary .flash-icon {
  animation: spinFlash 3s ease;
}
@keyframes epicPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(170, 68, 255, 0.4); }
  50% { box-shadow: 0 0 50px rgba(170, 68, 255, 0.9); }
}
@keyframes legendaryPulse {
  0% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); transform: scale(0.9); }
  30% { box-shadow: 0 0 80px rgba(255, 215, 0, 1); transform: scale(1); }
  100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.3); transform: scale(1); }
}
@keyframes spinFlash {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.3); }
  100% { transform: rotate(360deg) scale(1); }
}
/* 宝物弹窗：颜色随稀有度(var(--flash-color)由 JS 传入)，发光强度随档位递增 */
.treasure-flash .flash-content {
  border: 2px solid var(--flash-color, #FFD700);
  box-shadow: 0 0 30px var(--flash-color, #FFD700);
}
.treasure-flash .flash-title,
.treasure-flash .flash-icon {
  color: var(--flash-color, #FFD700);
}
.treasure-flash.uncommon .flash-content {
  box-shadow: 0 0 16px var(--flash-color, #88cc44);
}
.treasure-flash.rare .flash-content {
  box-shadow: 0 0 28px var(--flash-color, #4488ff);
}
.treasure-flash.epic .flash-content {
  box-shadow: 0 0 44px var(--flash-color, #aa44ff);
  animation: epicPulse 2.5s ease;
}
.treasure-flash.legendary .flash-content {
  box-shadow: 0 0 64px var(--flash-color, #FFD700);
  animation: legendaryPulse 3s ease;
  background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(50,30,0,0.95));
}
.treasure-flash.mythic .flash-content {
  box-shadow: 0 0 100px var(--flash-color, #FF4500);
  animation: mythicFlashPulse 3.4s ease;
  background: linear-gradient(135deg, rgba(0,0,0,0.92), rgba(60,12,0,0.96));
}
.treasure-flash.legendary .flash-icon,
.treasure-flash.mythic .flash-icon {
  animation: spinFlash 3s ease;
}
@keyframes mythicFlashPulse {
  0% { box-shadow: 0 0 30px var(--flash-color, #FF4500); transform: scale(0.9); }
  30% { box-shadow: 0 0 120px var(--flash-color, #FF4500); transform: scale(1); }
  100% { box-shadow: 0 0 50px var(--flash-color, #FF4500); transform: scale(1); }
}
.flash-enter-active, .flash-leave-active {
  transition: all 0.3s ease;
}
.flash-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}
.flash-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.2);
}

/* 队伍选择器 */
.team-selector {
  padding: 12px;
  margin-bottom: 12px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.team-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #DAA520;
}

.team-icon {
  font-size: 16px;
}

.team-count {
  font-size: 12px;
  color: #C9C4BA;
  font-weight: normal;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.team-members {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.team-empty {
  width: 100%;
  text-align: center;
  padding: 16px;
  color: #C9C4BA;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.team-member-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  min-width: 140px;
}

.member-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B4513, #DAA520);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  overflow: hidden;
}

.member-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.member-stars {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1px;
  background: rgba(0, 0, 0, 0.8);
  padding: 1px 4px;
  border-radius: 6px;
}

.member-stars .star {
  font-size: 8px;
  color: #FFD700;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 13px;
  font-weight: bold;
  color: #fff;
}

.member-school {
  font-size: 11px;
  color: #C9C4BA;
}

.member-build {
  text-align: right;
}

.build-label {
  display: block;
  font-size: 10px;
  color: #C9C4BA;
}

.build-value {
  display: block;
  font-size: 12px;
  font-weight: bold;
  color: #DAA520;
}

/* 队伍弹窗 */
.team-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.team-modal {
  background: linear-gradient(135deg, rgba(20, 20, 30, 0.98), rgba(40, 30, 20, 0.98));
  border: 2px solid rgba(218, 165, 32, 0.5);
  border-radius: 16px;
  padding: 20px;
  max-width: 90vw;
  width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.team-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(218, 165, 32, 0.2);
}

.team-modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #DAA520;
}

.modal-close {
  font-size: 20px;
  color: #C9C4BA;
  cursor: pointer;
  background: none;
  border: none;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.team-modal-body {
  flex: 1;
  overflow-y: auto;
}

.sect-members-title {
  font-size: 14px;
  color: #DAA520;
  margin-bottom: 12px;
  font-weight: bold;
}

.sect-members-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.sect-member-card {
  position: relative;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.sect-member-card:hover {
  border-color: rgba(218, 165, 32, 0.4);
  background: rgba(218, 165, 32, 0.05);
}

.sect-member-card.selected {
  border-color: #DAA520;
  background: rgba(218, 165, 32, 0.15);
  box-shadow: 0 0 10px rgba(218, 165, 32, 0.2);
}

.sect-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B4513, #DAA520);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8px;
  overflow: hidden;
}

.sect-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sect-member-info {
  margin-bottom: 8px;
}

.sect-member-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.sect-member-stars {
  display: flex;
  gap: 2px;
  margin-top: 2px;
}

.sect-member-stars .star {
  font-size: 11px;
  color: #DAA520;
}

.sect-member-build {
  font-size: 12px;
  font-weight: bold;
  color: #DAA520;
  margin-bottom: 4px;
}

.sect-member-school {
  font-size: 11px;
  color: #C9C4BA;
}

.sect-member-selected {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #DAA520;
  color: #000;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.team-modal-footer {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(218, 165, 32, 0.2);
}

.team-modal-footer .btn {
  flex: 1;
}

/* 装备详情区域 */
.equipment-detail-section {
  margin-top: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 10px;
  border: 1px solid rgba(218, 165, 32, 0.25);
}

/* 素材汇总区域 */
.material-detail-section {
  margin-top: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 10px;
  border: 1px solid rgba(122, 158, 126, 0.35);
}

.material-detail-header {
  margin-bottom: 10px;
}

.material-detail-title {
  font-size: 14px;
  font-weight: bold;
  color: #9AC89A;
}

.material-detail-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.material-detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(122, 158, 126, 0.18);
  border: 1px solid rgba(122, 158, 126, 0.35);
  border-radius: 8px;
  font-size: 13px;
}

.material-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.material-name {
  color: #E8E2D4;
}

.material-amount {
  color: #C9A33D;
  font-weight: bold;
}

.equipment-detail-header {
  margin-bottom: 10px;
}

.equipment-detail-title {
  font-size: 14px;
  font-weight: bold;
  color: #DAA520;
}

.equipment-detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.equipment-detail-item {
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid;
}

.eq-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.eq-quality {
  font-size: 11px;
  margin-left: 6px;
  padding: 1px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.eq-type {
  font-size: 11px;
  color: #E8E2D5;
  margin-bottom: 6px;
}

.eq-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.eq-stat {
  font-size: 12px;
  color: #FFE8C4;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 4px;
}

.eq-affixes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.eq-affix {
  font-size: 11px;
  color: #FFA500;
  padding: 2px 6px;
  background: rgba(255, 165, 0, 0.1);
  border-radius: 4px;
}

/* 挂机诊断面板 */
.idle-diag-panel {
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 180, 0, 0.4);
  border-radius: 8px;
  font-size: 12px;
}
.diag-title {
  color: #FFB400;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.diag-toggle {
  color: #8FB88C;
  cursor: pointer;
  font-size: 11px;
  font-weight: 400;
}
.diag-body {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.diag-row {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.diag-label {
  color: #8B8376;
  min-width: 80px;
  flex-shrink: 0;
}
.diag-value {
  color: #D8D0C0;
  word-break: break-all;
}
.diag-warn { color: #FFB400 !important; }
.diag-error { color: #FF5252 !important; font-weight: 600; }
.diag-error-box {
  margin-top: 8px;
  padding: 8px;
  background: rgba(255, 82, 82, 0.15);
  border: 1px solid rgba(255, 82, 82, 0.5);
  border-radius: 4px;
}
.diag-error-title {
  color: #FF5252;
  font-weight: 600;
  margin-bottom: 4px;
}
.diag-error-pre {
  color: #FFCDD2;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  font-size: 11px;
  line-height: 1.4;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}
.diag-hint {
  margin-top: 8px;
  padding: 8px;
  background: rgba(255, 180, 0, 0.12);
  border: 1px solid rgba(255, 180, 0, 0.4);
  border-radius: 4px;
  color: #FFB400;
}

/* 挂机仪表盘 */
.idle-dashboard {
  margin-top: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border: 1px solid rgba(255, 215, 0, 0.15);
}
.dashboard-title {
  font-size: 15px;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 10px;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.dash-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
}
.dash-label {
  font-size: 11px;
  color: #C9C4BA;
}
.dash-value {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}
.dash-buffs {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.dash-buffs-title {
  font-size: 13px;
  color: #FFD700;
  margin-bottom: 6px;
}
.dash-buff-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 12px;
}
.dash-buff-item.positive {
  background: rgba(76, 175, 80, 0.12);
  color: #4caf50;
}
.dash-buff-item.negative {
  background: rgba(255, 82, 82, 0.12);
  color: #ff5252;
}
.buff-name {
  font-weight: bold;
}
.buff-effect {
  flex: 1;
}
.buff-remaining {
  color: #C9C4BA;
  font-size: 11px;
}
.dash-pill-buffs {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.dash-pill-buffs-title {
  font-size: 13px;
  color: #FF69B4;
  margin-bottom: 6px;
}
.dash-pill-buff-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 12px;
  background: rgba(255, 105, 180, 0.12);
  color: #ffb6c1;
}
.pill-buff-name {
  font-weight: bold;
}
.pill-buff-effect {
  flex: 1;
}
.pill-buff-remaining {
  color: #C9C4BA;
  font-size: 11px;
}
.dash-team {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.dash-team-title {
  font-size: 13px;
  color: #FFD700;
  margin-bottom: 6px;
}
.dash-team-member {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
}
.team-name {
  min-width: 50px;
  color: #F5F0E8;
}
.team-hp-bar {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}
.team-hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 4px;
  transition: width 0.3s;
}
.team-hp-fill.hp-low {
  background: linear-gradient(90deg, #ff5252, #ff9800);
}
.team-hp-text {
  min-width: 36px;
  text-align: right;
  color: #F5DEB3;
  font-size: 11px;
}

.dash-equipment {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.dash-equipment-title {
  font-size: 13px;
  color: #FFD700;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dash-equip-emoji {
  font-size: 18px;
}
.dash-equipment-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dash-equipment-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid;
  cursor: pointer;
}
.dash-equipment-item:hover {
  opacity: 0.8;
}
/* 最近获得装备：稀有及以上 发光文本框 + 渐变流光文字（保留宝物高亮特效） */
.dash-equipment-item.is-rare,
.dash-equipment-item.is-epic,
.dash-equipment-item.is-legendary,
.dash-equipment-item.is-mythic {
  border-width: 1.5px;
}
.dash-equipment-item.is-rare {
  box-shadow: 0 0 8px rgba(68, 136, 255, 0.45);
  animation: logIn 0.35s ease;
}
.dash-equipment-item.is-epic {
  box-shadow: 0 0 8px rgba(170, 68, 255, 0.5);
  animation: logIn 0.35s ease, epicGlowLoop 1.4s ease-in-out infinite;
}
.dash-equipment-item.is-legendary {
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.55);
  animation: logIn 0.35s ease, legendaryGlowLoop 1.8s ease-in-out infinite, dropPulse 2.6s ease-in-out infinite;
}
.dash-equipment-item.is-mythic {
  box-shadow: 0 0 12px rgba(255, 69, 0, 0.6);
  animation: logIn 0.35s ease, mythicGlowLoop 1.5s ease-in-out infinite, dropPulse 2s ease-in-out infinite;
}
/* 稀有及以上：名称渐变滚动流光 */
.dash-equipment-item.is-rare .eq-name,
.dash-equipment-item.is-epic .eq-name,
.dash-equipment-item.is-legendary .eq-name,
.dash-equipment-item.is-mythic .eq-name {
  display: inline-block;
  background: linear-gradient(100deg, currentColor 20%, #ffffff 50%, currentColor 80%);
  background-size: 220% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: dropShimmer 3s linear infinite;
}
.eq-emoji {
  font-size: 16px;
}
.eq-name {
  font-weight: bold;
}
.eq-slot {
  color: #C9C4BA;
  font-size: 11px;
}
.eq-rarity {
  color: #F5DEB3;
  font-size: 11px;
}
.eq-score {
  margin-left: auto;
  color: #DAA520;
  font-size: 11px;
}

/* 秘境怪物状态面板（挂机仪表盘内，队伍信息下方） */
.dash-enemy {
  margin-top: 10px;
  padding: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.22);
  border-radius: 8px;
}
.dash-enemy-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: bold;
  color: #FF6B6B;
  margin-bottom: 6px;
}
.dash-enemy-emoji {
  font-size: 15px;
}
.enemy-tier-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: bold;
  padding: 1px 7px;
  border-radius: 10px;
  letter-spacing: 1px;
}
.enemy-tier-badge.tier-boss { background: rgba(196, 77, 77, 0.25); color: #FF8A8A; border: 1px solid rgba(196, 77, 77, 0.5); }
.enemy-tier-badge.tier-elite { background: rgba(122, 90, 160, 0.25); color: #C9A0E8; border: 1px solid rgba(122, 90, 160, 0.5); }
.enemy-tier-badge.tier-normal { background: rgba(122, 158, 126, 0.25); color: #B6D4B8; border: 1px solid rgba(122, 158, 126, 0.5); }
.dash-enemy.boss-emphasis {
  border: 1px solid rgba(255, 215, 0, 0.6) !important;
  box-shadow: 0 0 18px rgba(255, 215, 0, 0.25) !important;
  background: linear-gradient(135deg, rgba(184, 134, 11, 0.16), rgba(196, 77, 77, 0.12)) !important;
}
.dash-enemy-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 6px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.enemy-realm {
  font-size: 11px;
  font-weight: normal;
  color: #b0a89c;
}
.enemy-hp-bar {
  position: relative;
  height: 16px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 4px;
}
.enemy-hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff5252, #ff8a50);
  border-radius: 8px;
  transition: width 0.3s;
}
.enemy-hp-text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 11px;
  line-height: 16px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
.enemy-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: 6px;
}
.enemy-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 2px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}
.es-label {
  font-size: 10px;
  color: #9e968a;
}
.es-value {
  font-size: 14px;
  font-weight: bold;
  color: #ffd9b0;
}
.enemy-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.enemy-effect {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 10px;
}
.enemy-effect.buff { background: rgba(76, 175, 80, 0.2); color: #7ed47f; border: 1px solid rgba(76, 175, 80, 0.4); }
.enemy-effect.debuff { background: rgba(255, 82, 82, 0.2); color: #ff8a8a; border: 1px solid rgba(255, 82, 82, 0.4); }

/* 全屏立绘查看器 */
.avatar-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.96);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 300px;
  cursor: pointer;
  animation: avatarFadeIn 0.25s ease;
}

@keyframes avatarFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.avatar-fullscreen-img {
  max-width: 100vw;
  max-height: 100vh;
  width: auto;
  height: auto;
  object-fit: contain;
  cursor: default;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
}

.avatar-fullscreen-placeholder {
  font-size: 28px;
  color: #C9C4BA;
  padding: 60px;
}

.avatar-fullscreen-name {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
  pointer-events: none;
}

.avatar-fullscreen-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
}

.member-avatar,
.sect-avatar {
  cursor: pointer;
}

/* ===== 日间模式：挂机仪表盘配色覆盖（深墨文字 + 浅色容器） ===== */
html:not(.dark) .idle-section {
  border-top-color: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .idle-title {
  color: #FFD86B;
}
html:not(.dark) .idle-card {
  background: rgba(60, 59, 57, 0.85);
  border-color: rgba(255, 255, 255, 0.1);
}
html:not(.dark) .idle-card.selected {
  border-color: #DAA520;
  background: rgba(80, 70, 50, 0.85);
}
html:not(.dark) .dur-time {
  color: #F5F0E8;
}
html:not(.dark) .dur-info,
html:not(.dark) .idle-count,
html:not(.dark) .log-meta {
  color: #C9C4BA;
}
html:not(.dark) .dur-cost {
  color: #FFD86B;
}
html:not(.dark) .idle-timer {
  color: #FFD86B;
}
html:not(.dark) .idle-hp {
  background: rgba(0, 0, 0, 0.25);
}
html:not(.dark) .idle-hp-label {
  color: #C9C4BA;
}
html:not(.dark) .idle-hp-num {
  color: #F5F0E8;
}
html:not(.dark) .idle-count {
  color: #C9C4BA;
}
html:not(.dark) .idle-log-section {
  background: rgba(60, 59, 57, 0.85);
  border-color: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .section-title {
  color: #FFD86B;
}
html:not(.dark) .log-line.scene {
  color: #C9C4BA;
  border-left-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.04);
}
html:not(.dark) .log-line.enemy-normal {
  color: #E8E3DB;
  border-left-color: rgba(122, 158, 126, 0.6);
}
html:not(.dark) .log-line.enemy-elite {
  color: #D8B8F0;
  border-left-color: #9A6BC8;
  background: rgba(122, 90, 160, 0.15);
  text-shadow: none;
}
html:not(.dark) .log-line.enemy-boss {
  color: #FFD86B;
  border-left-color: #C44D4D;
  background: rgba(196, 77, 77, 0.15);
  text-shadow: none;
}
html:not(.dark) .idle-hp-warn {
  color: #FF8585;
}
html:not(.dark) .material-detail-section {
  background: rgba(60, 59, 57, 0.85);
  border-color: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .equipment-detail-section {
  background: rgba(60, 59, 57, 0.85);
  border-color: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .equipment-detail-item {
  background: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .equipment-detail-title {
  color: #FFD86B;
}
html:not(.dark) .eq-type {
  color: #E8E2D5;
}
html:not(.dark) .material-detail-title {
  color: #FFD86B;
}
html:not(.dark) .material-detail-item {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .material-name {
  color: #F5F0E8;
}
html:not(.dark) .material-amount {
  color: #FFD86B;
}

/* 日间模式：挂机仪表盘深色底衬（与宗门页风格一致） */
html:not(.dark) .idle-section {
  background: rgba(45, 44, 42, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
}
html:not(.dark) .idle-dashboard {
  background: rgba(55, 54, 52, 0.85);
  border-color: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .dashboard-title {
  color: #FFD86B;
}
html:not(.dark) .dash-value {
  color: #FBF7EF;
}
html:not(.dark) .dash-label {
  color: #D9D2C5;
}
html:not(.dark) .dash-buffs-title,
html:not(.dark) .dash-team-title,
html:not(.dark) .dash-equipment-title {
  color: #FFD86B;
}
html:not(.dark) .dash-buff-item.positive {
  background: rgba(76, 175, 80, 0.22);
  color: #B6E6B8;
}
html:not(.dark) .dash-buff-item.negative {
  background: rgba(255, 82, 82, 0.22);
  color: #FFB3B3;
}
html:not(.dark) .buff-remaining {
  color: #C9C2B6;
}
html:not(.dark) .team-name {
  color: #EFE9DD;
}
html:not(.dark) .team-hp-text {
  color: #D9D2C5;
}
html:not(.dark) .eq-slot,
html:not(.dark) .eq-rarity {
  color: #CFC8BC;
}

/* 日间模式：秘境怪物状态面板深色底衬（与宗门页风格一致） */
html:not(.dark) .dash-enemy {
  background: rgba(60, 59, 57, 0.85);
}
html:not(.dark) .dash-enemy-title {
  color: #FF8585;
}
html:not(.dark) .dash-enemy-name {
  color: #FBF7EF;
}
html:not(.dark) .enemy-realm {
  color: #C9C2B6;
}
html:not(.dark) .enemy-hp-bar {
  background: rgba(0, 0, 0, 0.4);
}
html:not(.dark) .enemy-hp-text {
  color: #FBF7EF;
}
html:not(.dark) .es-label {
  color: #C9C2B6;
}
html:not(.dark) .es-value {
  color: #FFD9B0;
}
html:not(.dark) .enemy-effect.buff {
  background: rgba(76, 175, 80, 0.25);
  color: #B6E6B8;
  border-color: rgba(76, 175, 80, 0.45);
}
html:not(.dark) .enemy-effect.debuff {
  background: rgba(255, 82, 82, 0.25);
  color: #FFB3B3;
  border-color: rgba(255, 82, 82, 0.45);
}

/* 日间模式：可能获得报酬栏增加底衬，文字改为醒目的浅色 */
html:not(.dark) .rewards-preview {
  padding: 10px;
  background: rgba(33, 29, 24, 0.32);
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.18);
}
html:not(.dark) .rewards-title {
  color: #FFD86B;
}
html:not(.dark) .reward-name {
  color: #FBF7EF;
}
html:not(.dark) .reward-chance {
  color: #FFD86B;
}
html:not(.dark) .pill-unlock-hint {
  background: rgba(218, 165, 32, 0.15);
}

/* 日间模式：探索页统一使用宗门页式深色卡片策略，确保所有文字清晰可读 */
html:not(.dark) .exploration-header {
  background: rgba(45, 44, 42, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
html:not(.dark) .card-subtitle {
  color: #C9C4BA;
}
html:not(.dark) .filter-chip:not(.active) {
  background: rgba(45, 44, 42, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
  color: #E8E3DB;
}
html:not(.dark) .zone-card {
  background: rgba(45, 44, 42, 0.9);
  border-color: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .zone-card:hover {
  border-color: rgba(218, 165, 32, 0.5);
}
html:not(.dark) .zone-body {
  background: transparent;
}
html:not(.dark) .meta-item,
html:not(.dark) .monster-tag {
  color: #C9C4BA;
  background: rgba(255, 255, 255, 0.06);
}
html:not(.dark) .zone-detail {
  background: rgba(45, 44, 42, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
html:not(.dark) .detail-desc {
  color: #C9C4BA;
}
html:not(.dark) .team-selector {
  background: rgba(55, 54, 52, 0.85);
  border-color: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .team-count {
  color: #C9C4BA;
  background: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .team-member-card {
  background: rgba(60, 59, 57, 0.85);
  border-color: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .member-school,
html:not(.dark) .build-label {
  color: #C9C4BA;
}
html:not(.dark) .team-empty {
  color: #C9C4BA;
  background: rgba(55, 54, 52, 0.85);
}
html:not(.dark) .difficulty-selector {
  background: rgba(55, 54, 52, 0.85);
  border-color: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .diff-label,
html:not(.dark) .diff-info {
  color: #C9C4BA;
}
html:not(.dark) .diff-chip:not(.active) {
  background: rgba(60, 59, 57, 0.85);
  color: #E8E3DB;
}
html:not(.dark) .detail-stats .stat-row {
  background: rgba(60, 59, 57, 0.85);
}
html:not(.dark) .stat-label {
  color: #C9C4BA;
}
html:not(.dark) .build-hint {
  background: rgba(55, 54, 52, 0.85);
  border-color: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .build-hint-sub {
  color: #C9C4BA;
}
html:not(.dark) .rewards-preview {
  background: rgba(55, 54, 52, 0.85);
  border-color: rgba(255, 255, 255, 0.08);
}
html:not(.dark) .pill-unlock-hint {
  background: rgba(55, 54, 52, 0.85);
  border-color: rgba(218, 165, 32, 0.25);
}
html:not(.dark) .pill-text {
  color: #C9C4BA;
}

/* 日间模式：装备详情弹窗同步使用深色卡片 */
html:not(.dark) .equip-select-modal .modal-content.glass-card {
  background: rgba(45, 44, 42, 0.96);
  color: #F5F0E8;
  border-color: rgba(255, 255, 255, 0.1);
}
html:not(.dark) .equip-select-modal .modal-header {
  color: #C9C4BA;
}
html:not(.dark) .equip-select-modal .sub-title {
  color: #C9C4BA;
}
html:not(.dark) .equip-select-modal .attr-col-label {
  color: #C9C4BA;
}
html:not(.dark) .equip-select-modal .attr-col-final {
  color: #FFD86B;
}

/* ============ BOSS 挑战系统 ============ */
.boss-challenge-btn {
  margin-left: auto;
  padding: 6px 14px;
  background: linear-gradient(135deg, #FF8C00 0%, #FF4500 100%);
  color: #fff;
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 18px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(255, 69, 0, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.boss-challenge-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 69, 0, 0.5);
}

.boss-challenge-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.boss-challenge-modal {
  width: min(680px, 96vw);
  max-height: 90vh;
  background: linear-gradient(180deg, #2a1a0e 0%, #1a1308 100%);
  border: 1px solid rgba(255, 140, 0, 0.4);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(255, 69, 0, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.boss-challenge-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 140, 0, 0.25);
  background: linear-gradient(90deg, rgba(255, 140, 0, 0.18) 0%, rgba(255, 69, 0, 0.05) 100%);
}
.boss-challenge-header h3 {
  margin: 0;
  color: #FFB347;
  font-size: 18px;
  font-weight: 700;
}
.boss-challenge-header .modal-close {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}
.boss-challenge-header .modal-close:hover {
  background: rgba(255, 82, 82, 0.3);
}
.boss-challenge-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 18px;
  color: #E8DCC4;
}
.boss-challenge-build-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(255, 140, 0, 0.08);
  border: 1px solid rgba(255, 140, 0, 0.25);
  border-radius: 8px;
  margin-bottom: 14px;
  font-size: 13px;
}
.boss-challenge-build-info > span:first-child {
  color: #FFB347;
  font-weight: 600;
}
.boss-challenge-tip {
  color: #B8A88A;
  font-size: 12px;
}

.boss-groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.boss-group {
  border: 1px solid rgba(255, 140, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
}
.boss-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 140, 0, 0.1);
  border-bottom: 1px solid rgba(255, 140, 0, 0.2);
}
.boss-group-name {
  font-weight: 600;
  color: #FFB347;
  font-size: 14px;
}
.boss-group-badge {
  padding: 2px 8px;
  border-radius: 10px;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}
.boss-cards-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 10px;
}
.boss-target-card {
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.boss-target-card:hover {
  background: rgba(255, 140, 0, 0.12);
  border-color: rgba(255, 140, 0, 0.4);
  transform: translateY(-1px);
}
.boss-target-card.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.boss-target-card.disabled:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: none;
}
.boss-target-name {
  font-weight: 600;
  color: #FFD86B;
  font-size: 14px;
  margin-bottom: 4px;
}
.boss-target-stats {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: #B8A88A;
  margin-bottom: 4px;
}
.boss-target-ticket {
  font-size: 12px;
  color: #FF8C00;
  font-weight: 600;
}
.boss-target-ticket.none {
  color: #EF5350;
  font-weight: 400;
}

.boss-challenge-confirm {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.btn-back {
  align-self: flex-start;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #B8A88A;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.btn-back:hover {
  background: rgba(255, 255, 255, 0.06);
}
.boss-confirm-info {
  padding: 12px;
  background: rgba(255, 140, 0, 0.06);
  border: 1px solid rgba(255, 140, 0, 0.25);
  border-radius: 8px;
}
.boss-confirm-name {
  font-size: 16px;
  font-weight: 700;
  color: #FFD86B;
  margin-bottom: 4px;
}
.boss-confirm-zone {
  font-size: 12px;
  color: #B8A88A;
  font-weight: 400;
}
.boss-confirm-desc {
  font-size: 12px;
  color: #B8A88A;
  margin-bottom: 8px;
  font-style: italic;
}
.boss-confirm-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #E8DCC4;
  margin-bottom: 8px;
}
.boss-confirm-traits {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}
.boss-trait-tag {
  padding: 2px 8px;
  background: rgba(255, 69, 0, 0.2);
  border: 1px solid rgba(255, 69, 0, 0.4);
  border-radius: 10px;
  font-size: 11px;
  color: #FFB347;
}
.boss-confirm-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 140, 0, 0.2);
}
.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.meta-label {
  color: #B8A88A;
}
.meta-value {
  font-weight: 600;
}

.boss-count-selector {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
}
.count-label {
  font-size: 13px;
  color: #E8DCC4;
}
.count-options {
  display: flex;
  gap: 4px;
}
.count-opt {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #B8A88A;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s ease;
}
.count-opt:hover {
  background: rgba(255, 140, 0, 0.1);
  color: #FFB347;
}
.count-opt.active {
  background: rgba(255, 140, 0, 0.25);
  border-color: rgba(255, 140, 0, 0.5);
  color: #FFB347;
  font-weight: 600;
}
.count-input {
  width: 60px;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #FFB347;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}
.count-max-btn {
  padding: 4px 10px;
  background: rgba(255, 140, 0, 0.15);
  border: 1px solid rgba(255, 140, 0, 0.35);
  color: #FFB347;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.count-max-btn:hover {
  background: rgba(255, 140, 0, 0.25);
}

.btn-execute-challenge {
  padding: 12px 16px;
  background: linear-gradient(135deg, #FF8C00 0%, #FF4500 100%);
  color: #fff;
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(255, 69, 0, 0.4);
  transition: all 0.15s ease;
}
.btn-execute-challenge:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(255, 69, 0, 0.55);
}
.btn-execute-challenge:disabled {
  background: rgba(80, 80, 80, 0.5);
  border-color: rgba(255, 255, 255, 0.1);
  color: #888;
  cursor: not-allowed;
  box-shadow: none;
}

.boss-challenge-result {
  padding: 12px;
  background: rgba(76, 175, 80, 0.08);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 8px;
}
.result-summary {
  display: flex;
  gap: 16px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}
.result-victory {
  color: #66BB6A;
}
.result-defeat {
  color: #EF5350;
}
.result-drops-title {
  font-size: 12px;
  color: #B8A88A;
  margin-bottom: 4px;
}
.result-drops-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.result-drop-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 140, 0, 0.12);
  border: 1px solid rgba(255, 140, 0, 0.3);
  border-radius: 4px;
  font-size: 12px;
}
.drop-name {
  color: #FFB347;
}
.drop-amount {
  color: #FFD86B;
  font-weight: 600;
}

.boss-challenge-error {
  padding: 10px;
  background: rgba(255, 82, 82, 0.1);
  border: 1px solid rgba(255, 82, 82, 0.35);
  border-radius: 6px;
  color: #FFB3B3;
  font-size: 13px;
}

/* 日间模式：BOSS 挑战面板配色调整 */
html:not(.dark) .boss-challenge-modal {
  background: linear-gradient(180deg, #fff5e6 0%, #f8e8cc 100%);
  border-color: rgba(255, 140, 0, 0.5);
  color: #5a3a1a;
}
html:not(.dark) .boss-challenge-header {
  background: linear-gradient(90deg, rgba(255, 140, 0, 0.25) 0%, rgba(255, 69, 0, 0.08) 100%);
  border-bottom-color: rgba(255, 140, 0, 0.35);
}
html:not(.dark) .boss-challenge-header h3 {
  color: #c2410c;
}
html:not(.dark) .boss-challenge-body {
  color: #5a3a1a;
}
html:not(.dark) .boss-challenge-build-info {
  background: rgba(255, 140, 0, 0.12);
  border-color: rgba(255, 140, 0, 0.35);
}
html:not(.dark) .boss-challenge-build-info > span:first-child {
  color: #c2410c;
}
html:not(.dark) .boss-challenge-tip {
  color: #8a5a2a;
}
html:not(.dark) .boss-group {
  border-color: rgba(255, 140, 0, 0.3);
}
html:not(.dark) .boss-group-title {
  background: rgba(255, 140, 0, 0.15);
  border-bottom-color: rgba(255, 140, 0, 0.3);
}
html:not(.dark) .boss-group-name {
  color: #c2410c;
}
html:not(.dark) .boss-target-card {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(180, 120, 60, 0.25);
}
html:not(.dark) .boss-target-card:hover {
  background: rgba(255, 140, 0, 0.15);
  border-color: rgba(255, 140, 0, 0.5);
}
html:not(.dark) .boss-target-name {
  color: #c2410c;
}
html:not(.dark) .boss-target-stats {
  color: #8a5a2a;
}
html:not(.dark) .boss-target-ticket {
  color: #ea580c;
}
html:not(.dark) .boss-target-ticket.none {
  color: #dc2626;
}
html:not(.dark) .btn-back {
  color: #8a5a2a;
  border-color: rgba(180, 120, 60, 0.3);
}
html:not(.dark) .boss-confirm-info {
  background: rgba(255, 140, 0, 0.1);
  border-color: rgba(255, 140, 0, 0.35);
}
html:not(.dark) .boss-confirm-name {
  color: #c2410c;
}
html:not(.dark) .boss-confirm-zone,
html:not(.dark) .boss-confirm-desc {
  color: #8a5a2a;
}
html:not(.dark) .boss-confirm-stats {
  color: #5a3a1a;
}
html:not(.dark) .meta-label {
  color: #8a5a2a;
}
html:not(.dark) .boss-count-selector {
  background: rgba(255, 255, 255, 0.5);
}
html:not(.dark) .count-label {
  color: #5a3a1a;
}
html:not(.dark) .count-opt {
  color: #8a5a2a;
  border-color: rgba(180, 120, 60, 0.3);
}
html:not(.dark) .count-input {
  background: rgba(255, 255, 255, 0.7);
  color: #c2410c;
  border-color: rgba(180, 120, 60, 0.3);
}
html:not(.dark) .boss-challenge-result {
  background: rgba(76, 175, 80, 0.12);
  border-color: rgba(76, 175, 80, 0.4);
}
html:not(.dark) .result-drop-item {
  background: rgba(255, 140, 0, 0.15);
  border-color: rgba(255, 140, 0, 0.4);
}
html:not(.dark) .drop-name {
  color: #c2410c;
}
html:not(.dark) .drop-amount {
  color: #ea580c;
}
html:not(.dark) .boss-challenge-error {
  background: rgba(255, 82, 82, 0.12);
  border-color: rgba(255, 82, 82, 0.4);
  color: #dc2626;
}
</style>
