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
            <span class="zone-icon">{{ getZoneIcon(zone.id) }}</span>
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
          <h3 class="detail-title">{{ getZoneIcon(selectedZone.id) }} {{ selectedZone.name }}</h3>
          <p class="detail-desc">{{ selectedZone.description }}</p>
        </div>
        <div class="difficulty-badge" :style="{ backgroundColor: selectedZone.difficultyColor }">
          {{ selectedZone.difficultyLabel }}
        </div>
      </div>

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
            <div class="member-avatar">
              <img v-if="getCharacterAvatar(member)" :src="getCharacterAvatar(member)" class="member-avatar-img" :alt="member.name" />
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
              <span class="build-value">{{ formatBuild(playerStore.getCharacterBuildStrength(member)) }}</span>
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
          <span>推荐Build <b>{{ formatBuild(currentDifficulty.recommendedBuild) }}</b></span>
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
          <span class="stat-value">{{ formatBuild(currentDifficulty?.recommendedBuild) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">你的Build</span>
          <span class="stat-value" :style="{ color: matchColor }">{{ formatBuild(playerBuildStrength) }}</span>
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
        <span class="build-hint-sub">（推荐 {{ formatBuild(currentRecommendedBuild) }} · 你的 {{ formatBuild(playerBuildStrength) }}）</span>
      </div>

      <!-- 奖励预览 -->
      <div class="rewards-preview">
        <div class="rewards-title">可能获得的报酬</div>
        <div class="rewards-list">
          <div v-for="rw in selectedZone.rewards" :key="rw.name" class="reward-row">
            <span class="reward-name">{{ rw.name }}</span>
            <div class="reward-bar-wrap">
              <div class="reward-bar" :style="{ width: rw.chance * 100 + '%' }"></div>
            </div>
            <span class="reward-chance">{{ (rw.chance * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>

      <!-- 战斗动画区域 -->
      <div v-if="combatState.inCombat && combatState.combatManager" class="combat-area">
        <div class="combat-round">
          第 {{ combatState.combatManager.round }} / {{ combatState.combatManager.maxRounds }} 回合
        </div>
        <div class="combat-scene">
          <div class="combatant player" :class="{ attack: animState.playerAttack, hurt: animState.playerHurt }">
            <div class="combatant-name">{{ combatState.combatManager.player.name }}</div>
            <div class="combatant-avatar player-avatar">
              {{ combatState.combatManager.player.name[0] }}
            </div>
            <div class="hp-bar">
              <div
                class="hp-fill"
                :style="{ width: (combatState.combatManager.player.currentHealth / combatState.combatManager.player.stats.maxHealth) * 100 + '%' }"
              ></div>
            </div>
            <div class="hp-text">
              {{ Math.ceil(combatState.combatManager.player.currentHealth) }} /
              {{ combatState.combatManager.player.stats.maxHealth }}
            </div>
          </div>
          <div class="vs-text">VS</div>
          <div class="combatant enemy" :class="{ attack: animState.enemyAttack, hurt: animState.enemyHurt }">
            <div class="combatant-name">{{ combatState.combatManager.enemy.name }}</div>
            <div class="combatant-avatar enemy-avatar">
              {{ combatState.combatManager.enemy.name[0] }}
            </div>
            <div class="hp-bar">
              <div
                class="hp-fill enemy-hp"
                :style="{ width: (combatState.combatManager.enemy.currentHealth / combatState.combatManager.enemy.stats.maxHealth) * 100 + '%' }"
              ></div>
            </div>
            <div class="hp-text">
              {{ Math.ceil(combatState.combatManager.enemy.currentHealth) }} /
              {{ combatState.combatManager.enemy.stats.maxHealth }}
            </div>
          </div>
        </div>
        <!-- 战斗丹药快捷栏 -->
        <div v-if="playerStore.battlePills.length" class="battle-pills">
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
      </div>

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
            <div class="dur-cost">{{ dur.encounters * 100 }}灵石</div>
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
        <div v-if="isIdling" class="idle-running">
          <div class="idle-status">
            <div class="idle-timer">{{ idleTimeRemaining }}</div>
            <div class="idle-progress-bar">
              <div class="idle-progress-fill" :style="{ width: idleProgress + '%' }"></div>
            </div>
            <div class="idle-count">已完成 {{ idleEncounterCount }} 次探索</div>
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
            <!-- 角色定位效果统计 -->
            <div class="dash-item" v-if="idleDashboard.roleEffects.healAmount > 0">
              <span class="dash-label">💚 治疗</span>
              <span class="dash-value" style="color:#4caf50">+{{ idleDashboard.roleEffects.healAmount }}</span>
            </div>
            <div class="dash-item" v-if="idleDashboard.roleEffects.shieldAmount > 0">
              <span class="dash-label">🛡️ 护盾</span>
              <span class="dash-value" style="color:#2196f3">+{{ idleDashboard.roleEffects.shieldAmount }}</span>
            </div>
            <div class="dash-item" v-if="idleDashboard.roleEffects.damageBoost > 0">
              <span class="dash-label">⚔️ 攻击加成</span>
              <span class="dash-value" style="color:#ff5722">+{{ idleDashboard.roleEffects.damageBoost }}</span>
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
          <!-- 队伍气血 -->
          <div v-if="idleDashboard.teamHP.length" class="dash-team">
            <div class="dash-team-title">🏥 队伍状态</div>
            <div v-for="m in idleDashboard.teamHP" :key="m.name" class="dash-team-member">
              <span class="team-name">{{ m.name }}</span>
              <div class="team-hp-bar">
                <div class="team-hp-fill" :class="{ 'hp-low': parseInt(m.hpPercent) <= 30 }" :style="{ width: m.hpPercent }"></div>
              </div>
              <span class="team-hp-text">{{ m.hpPercent }}</span>
            </div>
          </div>
          <!-- 最近获得的装备（即时显示） -->
          <div v-if="idleDashboard.recentEquipment && idleDashboard.recentEquipment.length" class="dash-equipment">
            <div class="dash-equipment-title">⚔️ 最近获得装备（点击查看）</div>
            <div class="dash-equipment-list">
              <div
                v-for="eq in idleDashboard.recentEquipment"
                :key="eq.id + '_' + eq.time"
                class="dash-equipment-item"
                :style="{ borderColor: eq.color, color: eq.color }"
                @click="showDashEquipment(eq)"
              >
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
            <span class="attr-col-final">{{ a.value }}</span>
          </div>
        </div>
        <button class="btn btn-warning" style="margin-top: 12px" @click="showDashEqModal = false">关闭</button>
      </div>
    </div>

    <!-- 挂机日志区域 -->
    <div v-if="isIdling || lastSummary" class="idle-log-section glass-card">
      <div class="idle-log-header">
        <h3 class="section-title">{{ isIdling ? '挂机日志（实时）' : '上次挂机日志' }}</h3>
        <span v-if="lastSummary && !isIdling" class="log-meta">
          {{ lastSummary.zoneName }} · {{ Math.round(lastSummary.duration / 60000) }}分钟 ·
          {{ lastSummary.encounters }}次探索
        </span>
      </div>
      <!-- 宝物高亮弹窗（日志上方） -->
      <transition name="flash">
        <div v-if="treasureFlash.show" class="treasure-flash" :class="treasureFlash.tier" :style="{ '--flash-color': treasureFlash.color || '#FFD700' }">
          <button class="btn btn-close btn-warning" @click.stop="hideTreasureFlash" style="position: absolute; top: 8px; right: 8px; padding: 2px 8px; font-size: 12px;">×</button>
          <div class="flash-content" @click="hideTreasureFlash">
            <div class="flash-icon">{{ treasureFlash.icon }}</div>
            <div class="flash-title">{{ treasureFlash.title }}</div>
            <div class="flash-desc">{{ treasureFlash.desc }}</div>
          </div>
        </div>
      </transition>
      <div class="idle-log-body" ref="idleLogRef">
        <div
          v-for="(log, idx) in displayLogs"
          :key="idx"
          class="log-line"
          :class="log.type"
        >
          <div class="log-text">{{ log.text }}</div>
          <div v-if="log.detail" class="log-detail">{{ log.detail }}</div>
        </div>
      </div>
      <!-- 挂机统计 -->
      <div v-if="lastSummary && !isIdling" class="idle-summary">
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
          <span class="summary-label">获得修为</span>
          <span class="summary-value">{{ lastSummary.totalCultivation }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">获得装备</span>
          <span class="summary-value">{{ lastSummary.totalEquipment }}</span>
        </div>
      </div>

      <!-- 获得装备详情 -->
      <div v-if="lastSummary && !isIdling && lastSummary.equipmentList && lastSummary.equipmentList.length > 0" class="equipment-detail-section">
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
              <span class="eq-score">评分 {{ eq.score || 0 }}</span>
            </div>
            <div class="eq-type">{{ eq.typeName || eq.type }}</div>
            <div class="eq-stats">
              <span v-for="(value, key) in eq.mainAttributes" :key="key" class="eq-stat">
                {{ getStatName(key) }} +{{ value }}
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
                  <div class="sect-avatar">
                    <img v-if="getCharacterAvatar(member)" :src="getCharacterAvatar(member)" class="sect-avatar-img" :alt="member.name" />
                    <span v-else>{{ member.name[0] }}</span>
                  </div>
                  <div class="sect-member-info">
                    <div class="sect-member-name">{{ member.name }}</div>
                    <div class="sect-member-stars">
                      <span v-for="i in member.star" :key="i" class="star">★</span>
                    </div>
                  </div>
                  <div class="sect-member-build">{{ formatBuild(playerStore.getCharacterBuildStrength(member)) }}</div>
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { usePlayerStore } from '../stores/player'
import { zones, BUILD_TIERS } from '../plugins/zones'
import { useIdleSystem } from '../composables/useIdleSystem'
import { characterSchools, getCharacterAvatar } from '../plugins/characters'
import { getStatName, formatStatValue } from '../plugins/stats'

const playerStore = usePlayerStore()
const {
  selectedZone,
  selectedDifficultyKey,
  isIdling,
  displayLogs,
  idleEncounterCount,
  idleProgress,
  idleTimeRemaining,
  lastSummary,
  combatState,
  animState,
  treasureFlash,
  hideTreasureFlash,
  canStartIdle,
  playerBuildStrength,
  currentRecommendedBuild,
  buildRatio,
  idlePlayerHP,
  idlePlayerMaxHP,
  idlePlayerDefeated,
  idleDashboard,
  setSelectedZone,
  setDifficulty,
  startIdle,
  stopIdle,
  runExploreCombat,
  grantReward,
  showTreasureFlash,
  buildEffectiveZone,
  getZoneDifficulty
} = useIdleSystem()

// Build 强度数值格式化（万/亿）
const formatBuild = (v) => {
  if (v == null || v === 0) return '0'
  if (v >= 100000000) return (v / 100000000).toFixed(2) + '亿'
  if (v >= 10000) return (v / 10000).toFixed(1) + '万'
  return Math.round(v).toString()
}
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

// 手动探索（战斗有动画）
const startExplore = async () => {
  if (!selectedZone.value || combatState.value.inCombat || isIdling.value) return
  playerStore.regenerateSpirit()
  playerStore.explorationCount++
  playerStore.queueSave()
  const diff = getZoneDifficulty(selectedZone.value, selectedDifficultyKey.value)
  const effectiveZone = buildEffectiveZone(selectedZone.value, diff)
  const result = await runExploreCombat(effectiveZone, 0, false)
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

// 战斗丹药
const useBattlePill = (pill) => {
  if (!combatState.value.combatManager) return
  const player = combatState.value.combatManager.player
  const consumed = playerStore.consumeBattlePill(pill.uid)
  if (!consumed) return
  if (consumed.type === 'healBattle') {
    const amount = Math.round(player.stats.maxHealth * (consumed.value || 0.3))
    player.heal(amount)
  } else if (consumed.type === 'cleanse') {
    const amount = Math.round(player.stats.maxHealth * 0.15)
    player.heal(amount)
    if (Array.isArray(player.effects)) player.effects = []
  }
}

// 修复：挂机日志自动滚动到底部
const idleLogRef = ref(null)
watch(
  () => displayLogs.value.length,
  () => {
    nextTick(() => {
      if (idleLogRef.value) idleLogRef.value.scrollTop = idleLogRef.value.scrollHeight
    })
  }
)

// 战斗奖励装备详情弹窗
const battleRewardEqDetail = ref(null)
const showBattleRewardEqDetail = ref(false)

const openBattleRewardEquipDetail = (eq) => {
  battleRewardEqDetail.value = {
    id: eq.id,
    name: eq.name,
    type: eq.type,
    typeName: eq.typeName,
    rarity: eq.rarity,
    rarityName: eq.qualityInfo?.name || '',
    color: eq.qualityInfo?.color || '#9e9e9e',
    score: eq.score || 0,
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
  // 挂机计时器由 useIdleSystem 单例常驻管理，组件卸载不清理（实现离开页面仍后台挂机）
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
  color: #888;
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
  color: #888;
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
  color: #aaa;
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
  color: #888;
  max-width: 70%;
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
.stat-label { color: #888; }
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
  color: #888;
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
  color: #ccc;
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
  color: #aaa;
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
  color: #888;
  font-size: 11px;
}

/* 奖励预览 */
.rewards-preview {
  margin-bottom: 12px;
}
.rewards-title {
  font-size: 13px;
  color: #888;
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
.reward-name {
  width: 80px;
  color: #ccc;
}
.reward-bar-wrap {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  overflow: hidden;
}
.reward-bar {
  height: 100%;
  background: linear-gradient(90deg, #8B4513, #DAA520);
  border-radius: 3px;
}
.reward-chance {
  width: 36px;
  text-align: right;
  color: #888;
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
  color: #aaa;
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
  color: #888;
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
  color: #ccc;
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
  color: #888;
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
  color: #888;
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
  color: #888;
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
  color: #aaa;
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
.section-title {
  margin: 0;
  font-size: 15px;
  color: #DAA520;
}
.log-meta {
  font-size: 12px;
  color: #888;
}
.idle-log-body {
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  scroll-behavior: smooth;
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
  color: #888;
}
.summary-value {
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
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
.flash-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}
.flash-desc {
  font-size: 14px;
  color: #ccc;
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
  color: #888;
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
  color: #888;
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
  color: #888;
}

.member-build {
  text-align: right;
}

.build-label {
  display: block;
  font-size: 10px;
  color: #888;
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
  color: #888;
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
  color: #888;
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
  background: rgba(0, 0, 0, 0.25);
  border-radius: 10px;
  border: 1px solid rgba(218, 165, 32, 0.2);
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
  background: rgba(255, 255, 255, 0.03);
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
  color: #888;
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
  color: #F5DEB3;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.3);
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
  color: #888;
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
  color: #888;
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
  color: #ccc;
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
  color: #aaa;
  font-size: 11px;
}
</style>
