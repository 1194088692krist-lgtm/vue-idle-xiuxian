<template>
  <div class="gm-tools">
    <div class="tools-header">
      <h2>资源管理工具</h2>
      <div class="tools-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="tools-content">
      <!-- 数值调整面板 -->
      <div v-if="activeTab === 'values'" class="panel">
        <div class="panel-section">
          <h3>修炼数值</h3>
          <div class="value-grid">
            <div class="value-item">
              <label>基础修炼消耗</label>
              <input type="number" v-model.number="gameValues.baseCultivationCost" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>消耗增长倍率</label>
              <input type="number" step="0.1" v-model.number="gameValues.cultivationCostMultiplier" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>基础修炼获得</label>
              <input type="number" v-model.number="gameValues.baseCultivationGain" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>获得增长倍率</label>
              <input type="number" step="0.1" v-model.number="gameValues.cultivationGainMultiplier" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>灵力获取速率</label>
              <input type="number" v-model.number="gameValues.spiritGainRate" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>境界突破倍率</label>
              <input type="number" step="0.1" v-model.number="gameValues.breakthroughMultiplier" @change="saveValues" />
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h3>战斗数值</h3>
          <div class="value-grid">
            <div class="value-item">
              <label>基础攻击</label>
              <input type="number" v-model.number="gameValues.baseAttack" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>基础生命</label>
              <input type="number" v-model.number="gameValues.baseHealth" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>基础防御</label>
              <input type="number" v-model.number="gameValues.baseDefense" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>基础速度</label>
              <input type="number" v-model.number="gameValues.baseSpeed" @change="saveValues" />
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h3>抽奖数值</h3>
          <div class="value-grid">
            <div class="value-item">
              <label>综合池价格</label>
              <input type="number" v-model.number="gameValues.gachaNormalCost" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>装备池价格</label>
              <input type="number" v-model.number="gameValues.gachaEquipmentCost" @change="saveValues" />
            </div>
            <div class="value-item">
              <label>灵宠池价格</label>
              <input type="number" v-model.number="gameValues.gachaPetCost" @change="saveValues" />
            </div>
          </div>
        </div>

        <div class="panel-actions">
          <button class="btn-primary" @click="exportValues">导出配置</button>
          <button class="btn-secondary" @click="importValues">导入配置</button>
          <button class="btn-danger" @click="resetValues">重置默认</button>
        </div>
      </div>

      <!-- 主题配置面板 -->
      <div v-if="activeTab === 'theme'" class="panel">
        <div class="theme-import-export">
          <button class="btn-primary" @click="bulkExport">📦 一键导出全部</button>
          <button class="btn-secondary" @click="bulkImport">📥 一键批量导入</button>
        </div>

        <div class="theme-tabs">
          <button :class="{ active: themeSection === 'colors' }" @click="themeSection = 'colors'">色彩</button>
          <button :class="{ active: themeSection === 'start' }" @click="themeSection = 'start'">开始界面</button>
          <button :class="{ active: themeSection === 'cultivation' }" @click="themeSection = 'cultivation'">修炼界面</button>
          <button :class="{ active: themeSection === 'audio' }" @click="themeSection = 'audio'">音效</button>
          <button :class="{ active: themeSection === 'effects' }" @click="themeSection = 'effects'">特效</button>
        </div>

        <div v-if="themeSection === 'colors'" class="theme-section">
          <h3>主题色彩</h3>
          <div class="value-grid">
            <div class="value-item">
              <label>主色调</label>
              <input type="color" v-model="themeData.colors.primary" />
            </div>
            <div class="value-item">
              <label>亮色</label>
              <input type="color" v-model="themeData.colors.primaryLight" />
            </div>
            <div class="value-item">
              <label>暗色</label>
              <input type="color" v-model="themeData.colors.primaryDark" />
            </div>
            <div class="value-item">
              <label>主背景</label>
              <input type="color" v-model="themeData.colors.bgMain" />
            </div>
            <div class="value-item">
              <label>主文字</label>
              <input type="color" v-model="themeData.colors.textMain" />
            </div>
            <div class="value-item">
              <label>副文字</label>
              <input type="color" v-model="themeData.colors.textSecondary" />
            </div>
          </div>
        </div>

        <div v-if="themeSection === 'start'" class="theme-section">
          <h3>开始界面配置</h3>
          <div class="value-grid">
            <div class="value-item full">
              <label>游戏标题</label>
              <input type="text" v-model="themeData.startScreen.logo.title" />
            </div>
            <div class="value-item full">
              <label>副标题</label>
              <input type="text" v-model="themeData.startScreen.logo.subtitle" />
            </div>
            <div class="value-item full">
              <label>底部文字</label>
              <input type="text" v-model="themeData.startScreen.footerText" />
            </div>
            <div class="value-item full">
              <label>背景图片URL (留空使用渐变色)</label>
              <input type="text" v-model="themeData.startScreen.background.image" placeholder="assets/bg/start.png" />
              <div class="asset-selector">
                <select v-model="themeData.startScreen.background.image">
                  <option value="">选择已上传图片...</option>
                  <option v-for="asset in imageAssets" :key="asset.name" :value="asset.name">{{ asset.name }}</option>
                </select>
              </div>
            </div>
            <div class="value-item">
              <label>背景色1</label>
              <input type="color" v-model="themeData.startScreen.background.gradient[0]" />
            </div>
            <div class="value-item">
              <label>背景色2</label>
              <input type="color" v-model="themeData.startScreen.background.gradient[1]" />
            </div>
          </div>
          <div class="resource-list">
            <h4>📋 开始界面资源清单</h4>
            <ul>
              <li>✅ 背景图 (1080x1920 / 1920x1080) - <code>bg_start.png</code></li>
              <li>✅ Logo图 (512x512 透明PNG) - <code>logo.png</code></li>
              <li>✅ 新的开始按钮图标 - <code>btn_newgame.png</code></li>
              <li>✅ 读取存档按钮图标 - <code>btn_load.png</code></li>
              <li>✅ 开始界面BGM - <code>bgm_start.mp3</code></li>
              <li>✅ 按钮点击音效 - <code>sfx_click.mp3</code></li>
            </ul>
          </div>
        </div>

        <div v-if="themeSection === 'cultivation'" class="theme-section">
    <h3>修炼界面配置</h3>
    <div class="value-grid">
      <div class="value-item full">
        <label>修士立绘URL</label>
        <input type="text" v-model="themeData.cultivationScreen.character.image" placeholder="assets/char/monk.png" />
        <div class="asset-selector">
          <select v-model="themeData.cultivationScreen.character.image">
            <option value="">选择已上传图片...</option>
            <option v-for="asset in imageAssets" :key="asset.name" :value="asset.name">{{ asset.name }}</option>
          </select>
        </div>
      </div>
      <div class="value-item full">
        <label>背景图片URL</label>
        <input type="text" v-model="themeData.cultivationScreen.background.image" placeholder="assets/bg/cultivation.png" />
        <div class="asset-selector">
          <select v-model="themeData.cultivationScreen.background.image">
            <option value="">选择已上传图片...</option>
            <option v-for="asset in imageAssets" :key="asset.name" :value="asset.name">{{ asset.name }}</option>
          </select>
        </div>
      </div>
            <div class="value-item">
              <label>背景色1</label>
              <input type="color" v-model="themeData.cultivationScreen.background.gradient[0]" />
            </div>
            <div class="value-item">
              <label>背景色2</label>
              <input type="color" v-model="themeData.cultivationScreen.background.gradient[1]" />
            </div>
            <div class="value-item">
              <label>进度条光效色</label>
              <input type="color" v-model="themeData.cultivationScreen.progressBar.glowColor" />
            </div>
          </div>
          <div class="resource-list">
            <h4>📋 修炼界面资源清单</h4>
            <ul>
              <li>✅ 背景图 - <code>bg_cultivation.png</code></li>
              <li>✅ 修士打坐立绘 (多境界版本) - <code>char_stage1.png ~ char_stage12.png</code></li>
              <li>✅ 修炼灵气粒子特效 - <code>effect_qi.png</code></li>
              <li>✅ 境界突破特效 - <code>effect_breakthrough.png</code></li>
              <li>✅ 修炼界面BGM - <code>bgm_cultivation.mp3</code></li>
              <li>✅ 修炼音效 - <code>sfx_cultivate.mp3</code></li>
              <li>✅ 突破音效 - <code>sfx_breakthrough.mp3</code></li>
            </ul>
          </div>
        </div>

        <div v-if="themeSection === 'audio'" class="theme-section">
          <h3>音效配置</h3>
          <div class="value-grid">
            <div class="value-item full">
              <label>开始界面BGM</label>
              <input type="text" v-model="themeData.audio.bgm.startScreen" placeholder="assets/audio/bgm_start.mp3" />
              <div class="asset-selector">
                <select v-model="themeData.audio.bgm.startScreen">
                  <option value="">选择已上传音频...</option>
                  <option v-for="asset in audioAssets" :key="asset.name" :value="asset.name">{{ asset.name }}</option>
                </select>
              </div>
            </div>
            <div class="value-item full">
              <label>修炼界面BGM</label>
              <input type="text" v-model="themeData.audio.bgm.cultivation" placeholder="assets/audio/bgm_cultivate.mp3" />
              <div class="asset-selector">
                <select v-model="themeData.audio.bgm.cultivation">
                  <option value="">选择已上传音频...</option>
                  <option v-for="asset in audioAssets" :key="asset.name" :value="asset.name">{{ asset.name }}</option>
                </select>
              </div>
            </div>
            <div class="value-item full">
              <label>点击音效</label>
              <input type="text" v-model="themeData.audio.sfx.click" placeholder="assets/audio/sfx_click.mp3" />
              <div class="asset-selector">
                <select v-model="themeData.audio.sfx.click">
                  <option value="">选择已上传音频...</option>
                  <option v-for="asset in audioAssets" :key="asset.name" :value="asset.name">{{ asset.name }}</option>
                </select>
              </div>
            </div>
            <div class="value-item full">
              <label>修炼音效</label>
              <input type="text" v-model="themeData.audio.sfx.cultivate" placeholder="assets/audio/sfx_cultivate.mp3" />
              <div class="asset-selector">
                <select v-model="themeData.audio.sfx.cultivate">
                  <option value="">选择已上传音频...</option>
                  <option v-for="asset in audioAssets" :key="asset.name" :value="asset.name">{{ asset.name }}</option>
                </select>
              </div>
            </div>
            <div class="value-item full">
              <label>突破音效</label>
              <input type="text" v-model="themeData.audio.sfx.breakthrough" placeholder="assets/audio/sfx_break.mp3" />
              <div class="asset-selector">
                <select v-model="themeData.audio.sfx.breakthrough">
                  <option value="">选择已上传音频...</option>
                  <option v-for="asset in audioAssets" :key="asset.name" :value="asset.name">{{ asset.name }}</option>
                </select>
              </div>
            </div>
            <div class="value-item">
              <label>BGM音量</label>
              <input type="range" min="0" max="1" step="0.1" v-model.number="themeData.audio.volume.bgm" />
            </div>
            <div class="value-item">
              <label>音效音量</label>
              <input type="range" min="0" max="1" step="0.1" v-model.number="themeData.audio.volume.sfx" />
            </div>
          </div>
        </div>

        <div v-if="themeSection === 'effects'" class="theme-section">
          <h3>特效配置</h3>
          <div class="value-grid">
            <div class="value-item">
              <label>灵气粒子数量</label>
              <input type="number" v-model.number="themeData.effects.cultivation.particleCount" />
            </div>
            <div class="value-item">
              <label>粒子速度</label>
              <input type="number" step="0.5" v-model.number="themeData.effects.cultivation.speed" />
            </div>
            <div class="value-item">
              <label>粒子颜色</label>
              <input type="color" v-model="themeData.effects.cultivation.particleColor" />
            </div>
            <div class="value-item">
              <label>突破特效时长(ms)</label>
              <input type="number" v-model.number="themeData.effects.breakthrough.duration" />
            </div>
            <div class="value-item">
              <label>突破特效颜色</label>
              <input type="color" v-model="themeData.effects.breakthrough.color" />
            </div>
          </div>
        </div>

        <div class="panel-actions">
          <button class="btn-primary" @click="saveTheme">保存应用</button>
          <button class="btn-secondary" @click="exportThemeConfig">导出主题</button>
          <button class="btn-secondary" @click="importThemeConfig">导入主题</button>
          <button class="btn-danger" @click="resetThemeConfig">重置默认</button>
        </div>
      </div>

      <!-- 装备编辑器 -->
      <div v-if="activeTab === 'equipment'" class="panel">
        <div class="editor-header">
          <button class="btn-add" @click="addEquipment">+ 新装备</button>
          <select v-model="equipmentFilter" class="filter-select">
            <option value="all">全部品质</option>
            <option value="common">凡品</option>
            <option value="uncommon">精品</option>
            <option value="rare">稀有</option>
            <option value="epic">史诗</option>
            <option value="legendary">传说</option>
            <option value="mythic">神话</option>
          </select>
        </div>
        <div class="equipment-list">
          <div 
            v-for="(eq, index) in filteredEquipment" 
            :key="eq.id"
            class="equipment-card"
            :class="eq.quality"
            @click="editEquipment(eq)"
          >
            <div class="eq-icon">{{ eq.type === 'weapon' ? '⚔️' : eq.type === 'body' ? '👕' : eq.type === 'head' ? '🪖' : eq.type === 'feet' ? '👢' : eq.type === 'legs' ? '👖' : eq.type === 'shoulder' ? '🦾' : eq.type === 'necklace' ? '📿' : eq.type === 'belt' ? '💼' : eq.type === 'wrist' ? '🧤' : eq.type === 'ring1' || eq.type === 'ring2' ? '💍' : eq.type === 'artifact' ? '🔮' : '💎' }}</div>
            <div class="eq-info">
              <div class="eq-name">{{ eq.name }}</div>
              <div class="eq-type">{{ getEquipmentTypeName(eq.type) }}</div>
              <div class="eq-score">评分: {{ calculateEquipmentScore(eq) }}</div>
            </div>
            <button class="btn-delete" @click.stop="deleteEquipment(index)">×</button>
          </div>
        </div>

        <!-- 装备编辑弹窗 -->
        <div v-if="editingEquipment" class="edit-modal">
          <div class="modal-content">
            <h3>编辑装备</h3>
            <div class="form-grid">
              <div class="form-item">
                <label>名称</label>
                <input type="text" v-model="editingEquipment.name" />
              </div>
              <div class="form-item">
                <label>类型</label>
                <select v-model="editingEquipment.type">
                  <option value="weapon">武器</option>
                  <option value="head">头部</option>
                  <option value="body">衣服</option>
                  <option value="legs">裤子</option>
                  <option value="feet">鞋子</option>
                  <option value="shoulder">肩甲</option>
                  <option value="necklace">项链</option>
                  <option value="belt">腰带</option>
                  <option value="wrist">护腕</option>
                  <option value="hands">手套</option>
                  <option value="ring1">戒指1</option>
                  <option value="ring2">戒指2</option>
                  <option value="artifact">法宝</option>
                </select>
              </div>
              <div class="form-item">
                <label>品质</label>
                <select v-model="editingEquipment.quality">
                  <option value="common">凡品</option>
                  <option value="uncommon">良品</option>
                  <option value="rare">上品</option>
                  <option value="epic">极品</option>
                  <option value="legendary">仙品</option>
                  <option value="mythic">神品</option>
                </select>
              </div>
              <div class="form-item">
                <label>等级要求</label>
                <input type="number" v-model.number="editingEquipment.levelReq" />
              </div>
              <div class="form-item">
                <label>套装</label>
                <select v-model="editingEquipment.setId">
                  <option value="">无套装</option>
                  <option v-for="set in setBonuses" :key="set.id" :value="set.id">{{ set.name }}</option>
                </select>
              </div>
              <div class="form-item">
                <label>强化等级</label>
                <input type="number" v-model.number="editingEquipment.enhanceLevel" />
              </div>
              <div class="form-item full">
                <label>基础属性 (JSON格式)</label>
                <textarea v-model="equipmentStatsJson" rows="4"></textarea>
              </div>
              <div class="form-item full">
                <label>词条列表</label>
                <div class="affix-list">
                  <div v-for="(affix, idx) in editingEquipment.affixes" :key="idx" class="affix-item">
                    <select v-model="affix.id">
                      <option v-for="poolAffix in getAvailableAffixes()" :key="poolAffix.id" :value="poolAffix.id">{{ poolAffix.name }}</option>
                    </select>
                    <input type="number" :step="affix.valueType === 'percent' ? '0.001' : '1'" v-model.number="affix.value" />
                    <button class="btn-delete" @click="editingEquipment.affixes.splice(idx, 1)">×</button>
                  </div>
                  <button class="btn-add" @click="addAffixToEquipment">+ 添加词条</button>
                </div>
              </div>
              <div class="form-item full">
                <label>图片路径</label>
                <input type="text" v-model="editingEquipment.image" placeholder="assets/equipment/xxx.png" />
              </div>
              <div class="form-item full">
                <label>装备评分</label>
                <span class="equipment-score">{{ calculateEquipmentScore(editingEquipment) }}</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" @click="saveEquipment">保存</button>
              <button class="btn-secondary" @click="editingEquipment = null">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 词条编辑器 -->
      <div v-if="activeTab === 'affixes'" class="panel">
        <div class="editor-header">
          <button class="btn-add" @click="addAffix">+ 新词条</button>
          <select v-model="affixFilter" class="filter-select">
            <option value="all">全部等级</option>
            <option value="1">T1基础</option>
            <option value="2">T2战斗</option>
            <option value="3">T3稀有</option>
          </select>
        </div>
        <div class="affix-list-panel">
          <div 
            v-for="(affix, index) in filteredAffixes" 
            :key="affix.id"
            class="affix-card"
            :class="'affix-tier-' + affix.tier"
            @click="editAffix(affix)"
          >
            <div class="affix-icon">{{ affix.tier === 1 ? '🌿' : affix.tier === 2 ? '⚡' : '💎' }}</div>
            <div class="affix-info">
              <div class="affix-name">{{ affix.name }}</div>
              <div class="affix-stat">{{ getStatName(affix.stat) }} {{ affix.valueType === 'percent' ? '%' : '' }}</div>
            </div>
            <div class="affix-tier-badge">T{{ affix.tier }}</div>
            <button class="btn-delete" @click.stop="deleteAffix(index)">×</button>
          </div>
        </div>

        <!-- 词条编辑弹窗 -->
        <div v-if="editingAffix" class="edit-modal">
          <div class="modal-content">
            <h3>编辑词条</h3>
            <div class="form-grid">
              <div class="form-item">
                <label>ID</label>
                <input type="text" v-model="editingAffix.id" />
              </div>
              <div class="form-item">
                <label>名称</label>
                <input type="text" v-model="editingAffix.name" />
              </div>
              <div class="form-item">
                <label>属性</label>
                <select v-model="editingAffix.stat">
                  <option v-for="stat in allStats" :key="stat.key" :value="stat.key">{{ stat.name }}</option>
                </select>
              </div>
              <div class="form-item">
                <label>数值类型</label>
                <select v-model="editingAffix.valueType">
                  <option value="flat">固定值</option>
                  <option value="percent">百分比</option>
                </select>
              </div>
              <div class="form-item">
                <label>等级</label>
                <select v-model.number="editingAffix.tier">
                  <option :value="1">T1 基础</option>
                  <option :value="2">T2 战斗</option>
                  <option :value="3">T3 稀有</option>
                </select>
              </div>
              <div class="form-item">
                <label>数值范围</label>
                <input type="text" v-model="affixRange" placeholder="[min, max]" />
              </div>
              <div class="form-item full">
                <label>适用部位</label>
                <select multiple v-model="editingAffix.slots" class="multi-select">
                  <option v-for="slot in equipmentSlots" :key="slot.key" :value="slot.key">{{ slot.name }}</option>
                </select>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" @click="saveAffix">保存</button>
              <button class="btn-secondary" @click="editingAffix = null">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 套装编辑器 -->
      <div v-if="activeTab === 'sets'" class="panel">
        <div class="editor-header">
          <button class="btn-add" @click="addSet">+ 新套装</button>
        </div>
        <div class="set-list">
          <div 
            v-for="(set, index) in setBonuses" 
            :key="set.id"
            class="set-card"
            :style="{ borderColor: set.color }"
            @click="editSet(set)"
          >
            <div class="set-icon">🔮</div>
            <div class="set-info">
              <div class="set-name" :style="{ color: set.color }">{{ set.name }}</div>
              <div class="set-pieces">{{ set.pieces.length }}件套</div>
            </div>
            <div class="set-bonuses">
              <span v-if="set.bonus2">2件+</span>
              <span v-if="set.bonus3">3件+</span>
              <span v-if="set.bonus4">4件+</span>
              <span v-if="set.bonus5">5件+</span>
            </div>
            <button class="btn-delete" @click.stop="deleteSet(index)">×</button>
          </div>
        </div>

        <!-- 套装编辑弹窗 -->
        <div v-if="editingSet" class="edit-modal">
          <div class="modal-content">
            <h3>编辑套装</h3>
            <div class="form-grid">
              <div class="form-item">
                <label>ID</label>
                <input type="text" v-model="editingSet.id" />
              </div>
              <div class="form-item">
                <label>名称</label>
                <input type="text" v-model="editingSet.name" />
              </div>
              <div class="form-item">
                <label>颜色</label>
                <input type="color" v-model="editingSet.color" />
              </div>
              <div class="form-item">
                <label>描述</label>
                <textarea v-model="editingSet.description" rows="3"></textarea>
              </div>
              <div class="form-item full">
                <label>套装部件</label>
                <select multiple v-model="editingSet.pieces" class="multi-select">
                  <option v-for="slot in equipmentSlots" :key="slot.key" :value="slot.key">{{ slot.name }}</option>
                </select>
              </div>
              <div class="form-item full">
                <label>2件套效果</label>
                <input type="text" v-model="editingSet.bonus2.label" placeholder="例如: 攻击+10%" />
                <div class="bonus-detail">
                  <select v-model="editingSet.bonus2.stat">
                    <option v-for="stat in allStats" :key="stat.key" :value="stat.key">{{ stat.name }}</option>
                  </select>
                  <input type="number" step="0.01" v-model.number="editingSet.bonus2.value" placeholder="数值" />
                  <select v-model="editingSet.bonus2.valueType">
                    <option value="percent">%</option>
                    <option value="flat">固定</option>
                  </select>
                </div>
              </div>
              <div v-if="editingSet.bonus3" class="form-item full">
                <label>3件套效果</label>
                <input type="text" v-model="editingSet.bonus3.label" placeholder="例如: 暴击+10%" />
                <div class="bonus-detail">
                  <select v-model="editingSet.bonus3.stat">
                    <option v-for="stat in allStats" :key="stat.key" :value="stat.key">{{ stat.name }}</option>
                  </select>
                  <input type="number" step="0.01" v-model.number="editingSet.bonus3.value" placeholder="数值" />
                  <select v-model="editingSet.bonus3.valueType">
                    <option value="percent">%</option>
                    <option value="flat">固定</option>
                  </select>
                </div>
              </div>
              <div v-if="editingSet.bonus4" class="form-item full">
                <label>4件套效果</label>
                <input type="text" v-model="editingSet.bonus4.label" placeholder="例如: 增伤+15%" />
                <div class="bonus-detail">
                  <select v-model="editingSet.bonus4.stat">
                    <option v-for="stat in allStats" :key="stat.key" :value="stat.key">{{ stat.name }}</option>
                  </select>
                  <input type="number" step="0.01" v-model.number="editingSet.bonus4.value" placeholder="数值" />
                  <select v-model="editingSet.bonus4.valueType">
                    <option value="percent">%</option>
                    <option value="flat">固定</option>
                  </select>
                </div>
              </div>
              <div v-if="editingSet.bonus5" class="form-item full">
                <label>5件套效果</label>
                <input type="text" v-model="editingSet.bonus5.label" placeholder="例如: 最终增伤+20%" />
                <div class="bonus-detail" v-if="editingSet.bonus5">
                  <select v-model="editingSet.bonus5.stat">
                    <option v-for="stat in allStats" :key="stat.key" :value="stat.key">{{ stat.name }}</option>
                  </select>
                  <input type="number" step="0.01" v-model.number="editingSet.bonus5.value" placeholder="数值" />
                  <select v-model="editingSet.bonus5.valueType">
                    <option value="percent">%</option>
                    <option value="flat">固定</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" @click="saveSet">保存</button>
              <button class="btn-secondary" @click="editingSet = null">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 人物编辑器 -->
      <div v-if="activeTab === 'characters'" class="panel">
        <div class="editor-header">
          <button class="btn-add" @click="addCharacter">+ 新人物</button>
          <select v-model="characterFilter" class="filter-select">
            <option value="all">全部星级</option>
            <option value="3">3星</option>
            <option value="4">4星</option>
            <option value="5">5星</option>
          </select>
          <button class="btn-secondary" @click="exportCharacters">📤 导出</button>
          <button class="btn-secondary" @click="importCharacters">📥 导入</button>
        </div>

        <!-- 批量导入立绘 -->
        <div class="batch-portrait">
          <div class="batch-portrait-bar">
            <span class="batch-title">🖼️ 批量导入立绘（本地预览）</span>
            <button class="btn-secondary" @click="triggerBatchPortrait">选择图片（可多选 / 拖拽）</button>
            <input type="file" ref="batchPortraitInput" @change="handleBatchPortraitSelect" accept="image/*" multiple hidden />
          </div>
          <p class="batch-hint">此处上传仅本机预览（IndexedDB）。要让 <b>所有玩家</b>都能看到，把立绘图片放进项目的 <code>public/portraits/</code> 目录（文件名用角色名或ID，如 <code>墨风.png</code> / <code>char_001.png</code>），提交推送后 CI 构建会自动生成清单并同源部署，无需再导出或另行共享。</p>
          <div class="batch-dropzone" @click="triggerBatchPortrait" @dragover.prevent @drop.prevent="handleBatchPortraitDrop">
            将多张立绘拖到此处，按文件名自动匹配角色（如 <code>李青.png</code> 或 <code>char_001.png</code>），匹配项可下拉改配
          </div>
          <div v-if="batchMatches.length" class="batch-preview">
            <table class="batch-table">
              <thead>
                <tr><th>文件名</th><th>匹配角色</th><th>预览</th><th>状态</th></tr>
              </thead>
              <tbody>
                <tr v-for="(m, i) in batchMatches" :key="i">
                  <td class="batch-file">{{ m.fileName }}</td>
                  <td>
                    <select v-model="m.matchedId">
                      <option value="">— 未匹配，手动选择 —</option>
                      <option v-for="c in characterListGM" :key="c.id" :value="c.id">{{ c.name }} ({{ c.id }})</option>
                    </select>
                  </td>
                  <td><img :src="m.base64" class="batch-thumb" alt="预览" /></td>
                  <td>
                    <span v-if="m.matchedId" class="batch-ok">✓ {{ batchMatchedName(m.matchedId) }}</span>
                    <span v-else class="batch-warn">未匹配</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="batch-actions">
              <button class="btn-primary" @click="confirmBatchPortrait">确认导入（{{ batchMatchedCount }} 张）</button>
              <button class="btn-secondary" @click="batchMatches = []">清空</button>
            </div>
          </div>
        </div>

        <div class="character-list">
          <div 
            v-for="(char, index) in filteredCharacters" 
            :key="char.id"
            class="character-card"
            :class="'star-' + char.star"
            @click="editCharacter(char)"
          >
            <div class="char-avatar">
              <img v-if="char.avatar" :src="char.avatar" class="char-img" />
              <span v-else class="char-placeholder">{{ char.name[0] }}</span>
            </div>
            <div class="char-info">
              <div class="char-name">{{ char.name }}</div>
              <div class="char-stars">
                <span v-for="i in char.star" :key="i" class="star">★</span>
              </div>
              <div class="char-school">{{ getSchoolName(char.school) }}</div>
            </div>
            <button class="btn-delete" @click.stop="deleteCharacter(index)">×</button>
          </div>
        </div>

        <!-- 人物编辑弹窗 -->
        <div v-if="editingCharacter" class="edit-modal wide">
          <div class="modal-content">
            <h3>编辑人物</h3>
            <div class="form-grid">
              <div class="form-item">
                <label>ID</label>
                <input type="text" v-model="editingCharacter.id" />
              </div>
              <div class="form-item">
                <label>名称</label>
                <input type="text" v-model="editingCharacter.name" />
              </div>
              <div class="form-item">
                <label>星级</label>
                <select v-model.number="editingCharacter.star">
                  <option :value="3">3星</option>
                  <option :value="4">4星</option>
                  <option :value="5">5星</option>
                </select>
              </div>
              <div class="form-item">
                <label>流派</label>
                <select v-model="editingCharacter.school">
                  <option v-for="(school, key) in characterSchools" :key="key" :value="key">{{ school.name }}</option>
                </select>
              </div>
              <div class="form-item">
                <label>天赋</label>
                <select v-model="editingCharacter.talent">
                  <option v-for="(talent, key) in characterTalents" :key="key" :value="key">{{ talent.name }}</option>
                </select>
              </div>
              <div class="form-item">
                <label>等级</label>
                <input type="number" v-model.number="editingCharacter.level" />
              </div>
              <div class="form-item full">
                <label>描述</label>
                <textarea v-model="editingCharacter.description" rows="2"></textarea>
              </div>
              <div class="form-item">
                <label>攻击</label>
                <input type="number" v-model.number="editingCharacter.baseStats.attack" />
              </div>
              <div class="form-item">
                <label>生命</label>
                <input type="number" v-model.number="editingCharacter.baseStats.health" />
              </div>
              <div class="form-item">
                <label>防御</label>
                <input type="number" v-model.number="editingCharacter.baseStats.defense" />
              </div>
              <div class="form-item">
                <label>速度</label>
                <input type="number" v-model.number="editingCharacter.baseStats.speed" />
              </div>
              <div class="form-item full">
                <label>立绘上传</label>
                <div class="avatar-upload-area">
                  <div class="avatar-preview" v-if="editingCharacter.avatar">
                    <img :src="editingCharacter.avatar" class="avatar-img" />
                    <button class="btn-delete" @click="removeAvatar">×</button>
                  </div>
                  <div v-else class="avatar-placeholder" @click="triggerAvatarUpload">
                    <span>点击上传立绘</span>
                  </div>
                  <input type="file" ref="avatarInput" @change="handleAvatarUpload" accept="image/*" hidden />
                </div>
              </div>
              <div class="form-item full">
                <label>立绘URL (可选，优先使用上传图片)</label>
                <input type="text" v-model="editingCharacter.avatarUrl" placeholder="assets/characters/xxx.png" />
                <div class="asset-selector">
                  <select v-model="editingCharacter.avatarUrl">
                    <option value="">选择已上传图片...</option>
                    <option v-for="asset in imageAssets" :key="asset.name" :value="asset.name">{{ asset.name }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" @click="saveCharacter">保存</button>
              <button class="btn-secondary" @click="editingCharacter = null">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 灵宠编辑器 -->
      <div v-if="activeTab === 'pets'" class="panel">
        <div class="editor-header">
          <button class="btn-add" @click="addPet">+ 新灵宠</button>
          <select v-model="petFilter" class="filter-select">
            <option value="all">全部稀有度</option>
            <option value="mortal">凡品</option>
            <option value="spiritual">灵品</option>
            <option value="mystic">玄品</option>
            <option value="celestial">仙品</option>
            <option value="divine">神品</option>
          </select>
        </div>
        <div class="pet-list">
          <div 
            v-for="(pet, index) in filteredPets" 
            :key="pet.id"
            class="pet-card"
            :class="pet.rarity"
            @click="editPet(pet)"
          >
            <div class="pet-icon">🐾</div>
            <div class="pet-info">
              <div class="pet-name">{{ pet.name }}</div>
              <div class="pet-rarity">{{ getPetRarityName(pet.rarity) }}</div>
            </div>
            <button class="btn-delete" @click.stop="deletePet(index)">×</button>
          </div>
        </div>

        <!-- 灵宠编辑弹窗 -->
        <div v-if="editingPet" class="edit-modal">
          <div class="modal-content">
            <h3>编辑灵宠</h3>
            <div class="form-grid">
              <div class="form-item">
                <label>名称</label>
                <input type="text" v-model="editingPet.name" />
              </div>
              <div class="form-item">
                <label>稀有度</label>
                <select v-model="editingPet.rarity">
                  <option value="mortal">凡品</option>
                  <option value="spiritual">灵品</option>
                  <option value="mystic">玄品</option>
                  <option value="celestial">仙品</option>
                  <option value="divine">神品</option>
                </select>
              </div>
              <div class="form-item full">
                <label>攻击加成 (%)</label>
                <input type="number" v-model.number="editingPet.attackBonus" />
              </div>
              <div class="form-item full">
                <label>生命加成 (%)</label>
                <input type="number" v-model.number="editingPet.healthBonus" />
              </div>
              <div class="form-item full">
                <label>修炼加速 (%)</label>
                <input type="number" v-model.number="editingPet.cultivationSpeed" />
              </div>
              <div class="form-item full">
                <label>灵力加成 (%)</label>
                <input type="number" v-model.number="editingPet.spiritBonus" />
              </div>
              <div class="form-item full">
                <label>技能描述</label>
                <textarea v-model="editingPet.skillDesc"></textarea>
              </div>
              <div class="form-item full">
                <label>图片路径</label>
                <input type="text" v-model="editingPet.image" placeholder="assets/pets/xxx.png" />
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" @click="savePet">保存</button>
              <button class="btn-secondary" @click="editingPet = null">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 怪物编辑器 -->
      <div v-if="activeTab === 'monsters'" class="panel">
        <div class="editor-header">
          <button class="btn-add" @click="addMonster">+ 新怪物</button>
          <select v-model="monsterFilter" class="filter-select">
            <option value="all">全部难度</option>
            <option value="easy">简单</option>
            <option value="normal">普通</option>
            <option value="hard">困难</option>
            <option value="boss">Boss</option>
          </select>
        </div>
        <div class="monster-list">
          <div 
            v-for="(monster, index) in filteredMonsters" 
            :key="monster.id"
            class="monster-card"
            :class="monster.difficulty"
            @click="editMonster(monster)"
          >
            <div class="monster-icon">👹</div>
            <div class="monster-info">
              <div class="monster-name">{{ monster.name }}</div>
              <div class="monster-level">Lv.{{ monster.level }}</div>
            </div>
            <button class="btn-delete" @click.stop="deleteMonster(index)">×</button>
          </div>
        </div>

        <!-- 怪物编辑弹窗 -->
        <div v-if="editingMonster" class="edit-modal">
          <div class="modal-content">
            <h3>编辑怪物</h3>
            <div class="form-grid">
              <div class="form-item">
                <label>名称</label>
                <input type="text" v-model="editingMonster.name" />
              </div>
              <div class="form-item">
                <label>等级</label>
                <input type="number" v-model.number="editingMonster.level" />
              </div>
              <div class="form-item">
                <label>难度</label>
                <select v-model="editingMonster.difficulty">
                  <option value="easy">简单</option>
                  <option value="normal">普通</option>
                  <option value="hard">困难</option>
                  <option value="boss">Boss</option>
                </select>
              </div>
              <div class="form-item full">
                <label>攻击</label>
                <input type="number" v-model.number="editingMonster.attack" />
              </div>
              <div class="form-item full">
                <label>生命</label>
                <input type="number" v-model.number="editingMonster.health" />
              </div>
              <div class="form-item full">
                <label>防御</label>
                <input type="number" v-model.number="editingMonster.defense" />
              </div>
              <div class="form-item full">
                <label>灵石奖励</label>
                <input type="number" v-model.number="editingMonster.stoneReward" />
              </div>
              <div class="form-item full">
                <label>经验奖励</label>
                <input type="number" v-model.number="editingMonster.expReward" />
              </div>
              <div class="form-item full">
                <label>掉落装备ID</label>
                <input type="text" v-model="editingMonster.dropEquipmentId" placeholder="装备ID,留空无掉落" />
              </div>
              <div class="form-item full">
                <label>图片路径</label>
                <input type="text" v-model="editingMonster.image" placeholder="assets/monsters/xxx.png" />
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" @click="saveMonster">保存</button>
              <button class="btn-secondary" @click="editingMonster = null">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 素材管理面板 -->
      <div v-if="activeTab === 'assets'" class="panel">
        <div class="assets-upload">
          <h3>素材上传</h3>
          <div class="upload-area">
            <div class="upload-zone" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
              <input type="file" ref="fileInput" @change="handleFileSelect" multiple accept="image/*,audio/*" hidden />
              <div class="upload-icon">📁</div>
              <p>点击或拖拽上传图片/音频</p>
              <p class="upload-hint">支持 PNG, JPG, MP3, WAV</p>
            </div>
            <div class="upload-actions">
              <button
                class="btn btn-success"
                :disabled="committingRepo || !pendingImageFiles.length"
                @click="commitImagesToRepo"
              >
                {{ committingRepo ? '提交中…' : `提交 ${pendingImageFiles.length || ''} 张立绘到仓库` }}
              </button>
              <span class="upload-hint" style="margin-left:8px">
                （调用 server/ 后端代理，GitHub PAT 不会下发到浏览器）
              </span>
            </div>
            <div v-if="repoCommitResult" class="upload-result" :class="repoCommitResult.ok ? 'ok' : 'err'">
              {{ repoCommitResult.message }}
            </div>
          </div>
        </div>

        <div class="assets-preview">
          <h3>已上传素材</h3>
          <div class="assets-tabs">
            <button :class="{ active: assetType === 'images' }" @click="assetType = 'images'">图片</button>
            <button :class="{ active: assetType === 'audio' }" @click="assetType = 'audio'">音频</button>
          </div>
          <div class="assets-grid">
            <div v-for="asset in filteredAssets" :key="asset.name" class="asset-item">
              <img v-if="asset.type === 'image'" :src="asset.url" class="asset-thumb" />
              <div v-else class="audio-thumb">
                <span>🎵</span>
                <audio :src="asset.url" controls></audio>
              </div>
              <div class="asset-name">{{ asset.name }}</div>
              <button class="btn-delete" @click="deleteAsset(asset.name)">×</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePlayerStore } from '../stores/player'
import { GameDB } from '../stores/db'
import { importTheme, exportTheme, resetTheme, getCurrentTheme, defaultTheme } from '../plugins/theme'
import { equipmentQualities, equipmentTypeNames, petRarities, equipmentNameParts, petNameParts, petDescriptions, equipmentStatPool } from '../plugins/gacha'
import { rarityConfig, affixPool, setBonuses, calculateEquipmentScore, getAffixesForSlot } from '../plugins/buildSystem'
import { characterList, characterSchools, characterTalents, generateCharacterById, getCharacterAvatar, initCharacterDefs, characterDefMap, syncCharacterDefs } from '../plugins/characters'

const playerStore = usePlayerStore()
const activeTab = ref('values')
const tabs = [
  { key: 'values', label: '数值调整' },
  { key: 'theme', label: '主题配置' },
  { key: 'characters', label: '人物编辑' },
  { key: 'equipment', label: '装备编辑' },
  { key: 'affixes', label: '词条编辑' },
  { key: 'sets', label: '套装编辑' },
  { key: 'pets', label: '灵宠编辑' },
  { key: 'monsters', label: '怪物编辑' },
  { key: 'assets', label: '素材管理' }
]

// 默认游戏数值
const defaultValues = {
  baseCultivationCost: 10,
  cultivationCostMultiplier: 1.5,
  baseCultivationGain: 1,
  cultivationGainMultiplier: 1.2,
  spiritGainRate: 1,
  breakthroughMultiplier: 1.1,
  baseAttack: 10,
  baseHealth: 100,
  baseDefense: 5,
  baseSpeed: 10,
  gachaNormalCost: 100,
  gachaEquipmentCost: 150,
  gachaPetCost: 200
}

const gameValues = ref({ ...defaultValues })

// 主题配置
const themeData = ref({ ...defaultTheme })
const themeSection = ref('start')

// 词条编辑器数据
const affixFilter = ref('all')
const editingAffix = ref(null)
const affixRange = ref('')

const equipmentSlots = [
  { key: 'weapon', name: '武器' },
  { key: 'head', name: '头部' },
  { key: 'body', name: '衣服' },
  { key: 'legs', name: '裤子' },
  { key: 'feet', name: '鞋子' },
  { key: 'shoulder', name: '肩甲' },
  { key: 'necklace', name: '项链' },
  { key: 'belt', name: '腰带' },
  { key: 'wrist', name: '护腕' },
  { key: 'hands', name: '手套' },
  { key: 'ring1', name: '戒指1' },
  { key: 'ring2', name: '戒指2' },
  { key: 'artifact', name: '法宝' }
]

const allStats = [
  { key: 'attack', name: '攻击' },
  { key: 'health', name: '生命' },
  { key: 'defense', name: '防御' },
  { key: 'speed', name: '速度' },
  { key: 'critRate', name: '暴击率' },
  { key: 'critDamageBoost', name: '暴击伤害' },
  { key: 'comboRate', name: '连击率' },
  { key: 'counterRate', name: '反击率' },
  { key: 'stunRate', name: '眩晕率' },
  { key: 'dodgeRate', name: '闪避率' },
  { key: 'vampireRate', name: '吸血率' },
  { key: 'healBoost', name: '治疗效果' },
  { key: 'finalDamageBoost', name: '最终增伤' },
  { key: 'finalDamageReduce', name: '最终减伤' },
  { key: 'combatBoost', name: '战斗属性' },
  { key: 'resistanceBoost', name: '战斗抗性' },
  { key: 'spiritRate', name: '灵力获取' },
  { key: 'cultivationRate', name: '修炼效率' },
  { key: 'critResist', name: '抗暴' },
  { key: 'comboResist', name: '抗连' },
  { key: 'dodgeResist', name: '命击' },
  { key: 'stunResist', name: '抗晕' },
  { key: 'vampireResist', name: '抗吸血' },
  { key: 'counterResist', name: '抗反击' }
]

const filteredAffixes = computed(() => {
  if (affixFilter.value === 'all') return affixPool
  return affixPool.filter(a => a.tier === parseInt(affixFilter.value))
})

const getStatName = (stat) => {
  const found = allStats.find(s => s.key === stat)
  return found ? found.name : stat
}

const addAffix = () => {
  editingAffix.value = {
    id: `affix_${Date.now()}`,
    name: '新词条',
    stat: 'attack',
    valueType: 'flat',
    baseRange: [5, 15],
    tier: 1,
    slots: ['weapon']
  }
  affixRange.value = '[5, 15]'
}

const editAffix = (affix) => {
  editingAffix.value = { ...affix, slots: [...affix.slots] }
  affixRange.value = JSON.stringify(affix.baseRange)
}

const saveAffix = () => {
  try {
    editingAffix.value.baseRange = JSON.parse(affixRange.value)
  } catch (e) {
    alert('数值范围格式错误')
    return
  }
  const index = affixPool.findIndex(a => a.id === editingAffix.value.id)
  if (index >= 0) {
    affixPool[index] = { ...editingAffix.value }
  } else {
    affixPool.push({ ...editingAffix.value })
  }
  editingAffix.value = null
  alert('词条已保存！')
}

const deleteAffix = (index) => {
  if (confirm('确定删除此词条吗？')) {
    affixPool.splice(index, 1)
  }
}

// 套装编辑器数据
const editingSet = ref(null)

const addSet = () => {
  editingSet.value = {
    id: `set_${Date.now()}`,
    name: '新套装',
    description: '',
    pieces: ['weapon', 'head'],
    color: '#FFD700',
    bonus2: { stat: 'attack', value: 0.1, valueType: 'percent', label: '' },
    bonus3: null,
    bonus4: null,
    bonus5: null
  }
}

const editSet = (set) => {
  editingSet.value = { 
    ...set, 
    pieces: [...set.pieces],
    bonus2: set.bonus2 ? { ...set.bonus2 } : null,
    bonus3: set.bonus3 ? { ...set.bonus3 } : null,
    bonus4: set.bonus4 ? { ...set.bonus4 } : null,
    bonus5: set.bonus5 ? { ...set.bonus5 } : null
  }
}

const saveSet = () => {
  const index = setBonuses.findIndex(s => s.id === editingSet.value.id)
  if (index >= 0) {
    setBonuses[index] = { ...editingSet.value }
  } else {
    setBonuses.push({ ...editingSet.value })
  }
  editingSet.value = null
  alert('套装已保存！')
}

const deleteSet = (index) => {
  if (confirm('确定删除此套装吗？')) {
    setBonuses.splice(index, 1)
  }
}

const loadThemeData = () => {
  themeData.value = getCurrentTheme()
}

const saveTheme = () => {
  importTheme(themeData.value)
  alert('主题配置已保存并应用！')
}

const exportThemeConfig = () => {
  const data = exportTheme()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'theme-config.json'
  a.click()
}

const importThemeConfig = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = importTheme(e.target.result)
        if (result.success) {
          themeData.value = result.theme
          alert('主题配置导入成功！')
        } else {
          alert('导入失败：' + result.error)
        }
      } catch (err) {
        alert('导入失败：无效的JSON文件')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

const bulkImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        let count = 0
        if (data.gameValues) {
          gameValues.value = { ...gameValues.value, ...data.gameValues }
          localStorage.setItem('gm_gameValues', JSON.stringify(gameValues.value))
          count++
        }
        if (data.characters) {
          characterListGM.value = data.characters
          count++
        }
        if (data.equipment) {
          equipmentList.value = data.equipment
          count++
        }
        if (data.pets) {
          petList.value = data.pets
          count++
        }
        if (data.monsters) {
          monsterList.value = data.monsters
          count++
        }
        if (data.theme) {
          importTheme(data.theme)
          themeData.value = getCurrentTheme()
          count++
        }
        saveToStorage()
        alert(`批量导入成功！导入了 ${count} 项配置`)
      } catch (err) {
        alert('批量导入失败：' + err.message)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

const bulkExport = () => {
  const data = {
    version: '1.0.0',
    exportTime: new Date().toISOString(),
    gameValues: gameValues.value,
    characters: characterListGM.value,
    equipment: equipmentList.value,
    pets: petList.value,
    monsters: monsterList.value,
    theme: getCurrentTheme()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'game-config-full.json'
  a.click()
}

const resetThemeConfig = () => {
  if (confirm('确定要重置主题为默认值吗？')) {
    resetTheme()
    themeData.value = getCurrentTheme()
  }
}

// 装备数据
const equipmentList = ref([])
const equipmentFilter = ref('all')
const editingEquipment = ref(null)

const filteredEquipment = computed(() => {
  if (equipmentFilter.value === 'all') return equipmentList.value
  return equipmentList.value.filter(eq => eq.quality === equipmentFilter.value)
})

const getEquipmentTypeName = (type) => {
  const names = {
    weapon: '武器',
    head: '头部',
    body: '衣服',
    legs: '裤子',
    feet: '鞋子',
    shoulder: '肩甲',
    necklace: '项链',
    belt: '腰带',
    wrist: '护腕',
    hands: '手套',
    ring1: '戒指1',
    ring2: '戒指2',
    artifact: '法宝'
  }
  return names[type] || type
}

const equipmentStatsJson = ref('')

const addEquipment = () => {
  editingEquipment.value = {
    id: `eq_${Date.now()}`,
    name: '新装备',
    type: 'weapon',
    quality: 'common',
    levelReq: 1,
    stats: { attack: 0, health: 0, defense: 0, speed: 0 },
    affixes: [],
    setId: '',
    enhanceLevel: 0,
    image: ''
  }
  equipmentStatsJson.value = JSON.stringify(editingEquipment.value.stats, null, 2)
}

const editEquipment = (eq) => {
  editingEquipment.value = { ...eq, affixes: eq.affixes ? [...eq.affixes] : [], stats: eq.stats ? { ...eq.stats } : {} }
  equipmentStatsJson.value = JSON.stringify(editingEquipment.value.stats, null, 2)
}

const getAvailableAffixes = () => {
  if (!editingEquipment.value) return []
  return affixPool.filter(a => a.slots.includes(editingEquipment.value.type))
}

const addAffixToEquipment = () => {
  if (!editingEquipment.value) return
  const available = getAvailableAffixes()
  if (available.length === 0) return
  const affix = available[0]
  editingEquipment.value.affixes.push({
    id: affix.id,
    name: affix.name,
    stat: affix.stat,
    value: affix.valueType === 'percent' ? 0.05 : 10,
    valueType: affix.valueType,
    tier: affix.tier
  })
}

const saveEquipment = () => {
  try {
    editingEquipment.value.stats = JSON.parse(equipmentStatsJson.value)
  } catch (e) {
    alert('属性JSON格式错误')
    return
  }
  const index = equipmentList.value.findIndex(eq => eq.id === editingEquipment.value.id)
  if (index >= 0) {
    equipmentList.value[index] = { ...editingEquipment.value }
  } else {
    equipmentList.value.push({ ...editingEquipment.value })
  }
  editingEquipment.value = null
  saveToStorage()
}

const deleteEquipment = (index) => {
  equipmentList.value.splice(index, 1)
  saveToStorage()
}

// 人物数据
const characterListGM = ref([])
const characterFilter = ref('all')
const editingCharacter = ref(null)
const avatarInput = ref(null)

const filteredCharacters = computed(() => {
  if (characterFilter.value === 'all') return characterListGM.value
  return characterListGM.value.filter(c => c.star === parseInt(characterFilter.value))
})

const imageAssets = computed(() => {
  return assetsList.value.filter(a => a.type === 'image')
})

const getSchoolName = (schoolKey) => {
  return characterSchools[schoolKey]?.name || schoolKey
}

const addCharacter = () => {
  editingCharacter.value = {
    id: `char_${Date.now()}`,
    name: '新人物',
    star: 3,
    school: 'sword',
    talent: 'sword_mastery',
    description: '一位神秘的修士',
    level: 1,
    baseStats: { attack: 15, health: 80, defense: 8, speed: 12 },
    avatar: null,
    avatarUrl: ''
  }
}

const editCharacter = (char) => {
  editingCharacter.value = {
    ...char,
    baseStats: { ...char.baseStats }
  }
}

const saveCharacter = () => {
  const char = { ...editingCharacter.value }
  if (char.avatarUrl && !char.avatar) {
    char.avatar = char.avatarUrl
  }
  const index = characterListGM.value.findIndex(c => c.id === char.id)
  if (index >= 0) {
    characterListGM.value[index] = char
  } else {
    characterListGM.value.push(char)
  }
  editingCharacter.value = null
  saveToStorage()
  alert('人物已保存！')
}

const deleteCharacter = (index) => {
  if (confirm('确定删除此人物吗？')) {
    characterListGM.value.splice(index, 1)
    saveToStorage()
  }
}

const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    if (editingCharacter.value) {
      editingCharacter.value.avatar = e.target.result
      const cid = editingCharacter.value.id
      if (cid) characterDefMap[cid] = { ...(characterDefMap[cid] || {}), avatar: e.target.result }
    }
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

const removeAvatar = () => {
  if (editingCharacter.value) {
    editingCharacter.value.avatar = null
  }
}

// ===== 批量导入立绘 =====
const batchPortraitInput = ref(null)
const batchMatches = ref([])

const triggerBatchPortrait = () => batchPortraitInput.value?.click()

const matchPortraitToCharacter = (fileName) => {
  const base = fileName.replace(/\.[^.]+$/, '').trim()
  const lower = base.toLowerCase()
  const byId = characterListGM.value.find(c => c.id && c.id.toLowerCase() === lower)
  if (byId) return byId
  const byName = characterListGM.value.find(c => c.name && c.name.trim().toLowerCase() === lower)
  if (byName) return byName
  return characterListGM.value.find(c =>
    (c.id && lower.includes(c.id.toLowerCase())) ||
    (c.name && (lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower)))
  ) || null
}

const processPortraitFiles = (fileList) => {
  const files = Array.from(fileList || [])
  if (!files.length) return
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target.result
      const matched = matchPortraitToCharacter(file.name)
      batchMatches.value.push({
        fileName: file.name,
        base64,
        matchedId: matched ? matched.id : ''
      })
    }
    reader.readAsDataURL(file)
  })
}

const handleBatchPortraitSelect = (e) => { processPortraitFiles(e.target.files); e.target.value = '' }
const handleBatchPortraitDrop = (e) => processPortraitFiles(e.dataTransfer.files)

const batchMatchedName = (id) => {
  const c = characterListGM.value.find(x => x.id === id)
  return c ? `${c.name} (${c.id})` : ''
}
const batchMatchedCount = computed(() => batchMatches.value.filter(m => m.matchedId).length)

const confirmBatchPortrait = () => {
  let n = 0
  batchMatches.value.forEach(m => {
    if (!m.matchedId) return
    const idx = characterListGM.value.findIndex(c => c.id === m.matchedId)
    if (idx >= 0) {
      characterListGM.value[idx] = { ...characterListGM.value[idx], avatar: m.base64 }
      characterDefMap[m.matchedId] = { ...(characterDefMap[m.matchedId] || {}), avatar: m.base64 }
      n++
    }
  })
  saveToStorage()
  batchMatches.value = []
  alert(`已批量导入 ${n} 张人物立绘（base64 内嵌，离线可用，大陆稳定加载）`)
}

const exportCharacters = () => {
  const data = JSON.stringify(characterListGM.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'characters.json'
  a.click()
}

const importCharacters = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (Array.isArray(data)) {
          characterListGM.value = data
          saveToStorage()
          alert(`成功导入 ${data.length} 个人物！`)
        } else {
          alert('导入失败：数据格式不正确')
        }
      } catch (err) {
        alert('导入失败：无效的JSON文件')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

// 灵宠数据
const petList = ref([])
const petFilter = ref('all')
const editingPet = ref(null)

const filteredPets = computed(() => {
  if (petFilter.value === 'all') return petList.value
  return petList.value.filter(pet => pet.rarity === petFilter.value)
})

const getPetRarityName = (rarity) => {
  const names = {
    mortal: '凡品',
    spiritual: '灵品',
    mystic: '玄品',
    celestial: '仙品',
    divine: '神品'
  }
  return names[rarity] || rarity
}

const addPet = () => {
  editingPet.value = {
    id: `pet_${Date.now()}`,
    name: '新灵宠',
    rarity: 'mortal',
    attackBonus: 0,
    healthBonus: 0,
    cultivationSpeed: 0,
    spiritBonus: 0,
    skillDesc: '',
    image: ''
  }
}

const editPet = (pet) => {
  editingPet.value = { ...pet }
}

const savePet = () => {
  const index = petList.value.findIndex(pet => pet.id === editingPet.value.id)
  if (index >= 0) {
    petList.value[index] = { ...editingPet.value }
  } else {
    petList.value.push({ ...editingPet.value })
  }
  editingPet.value = null
  saveToStorage()
}

const deletePet = (index) => {
  petList.value.splice(index, 1)
  saveToStorage()
}

// 怪物数据
const monsterList = ref([])
const monsterFilter = ref('all')
const editingMonster = ref(null)

const filteredMonsters = computed(() => {
  if (monsterFilter.value === 'all') return monsterList.value
  return monsterList.value.filter(m => m.difficulty === monsterFilter.value)
})

const addMonster = () => {
  editingMonster.value = {
    id: `monster_${Date.now()}`,
    name: '新怪物',
    level: 1,
    difficulty: 'normal',
    attack: 10,
    health: 100,
    defense: 5,
    stoneReward: 10,
    expReward: 5,
    dropEquipmentId: '',
    image: ''
  }
}

const editMonster = (monster) => {
  editingMonster.value = { ...monster }
}

const saveMonster = () => {
  const index = monsterList.value.findIndex(m => m.id === editingMonster.value.id)
  if (index >= 0) {
    monsterList.value[index] = { ...editingMonster.value }
  } else {
    monsterList.value.push({ ...editingMonster.value })
  }
  editingMonster.value = null
  saveToStorage()
}

const deleteMonster = (index) => {
  monsterList.value.splice(index, 1)
  saveToStorage()
}

const generateDefaultEquipment = () => {
  const equipment = []
  const types = Object.keys(equipmentTypeNames)
  const qualities = Object.keys(equipmentQualities)
  
  types.forEach(type => {
    qualities.forEach(quality => {
      const qualityInfo = equipmentQualities[quality]
      const parts = equipmentNameParts[type] || equipmentNameParts.weapon
      const namePart = parts[Math.floor(Math.random() * parts.length)]
      
      let baseStats = {}
      const statKeys = Object.keys(equipmentStatPool)
      const numStats = type === 'weapon' ? 2 : type === 'artifact' ? 3 : 2
      
      for (let i = 0; i < numStats; i++) {
        const stat = statKeys[Math.floor(Math.random() * statKeys.length)]
        const pool = equipmentStatPool[stat]
        const qualityIndex = qualities.indexOf(quality)
        const min = pool.min[qualityIndex] || pool.min[0]
        const max = pool.max[qualityIndex] || pool.max[0]
        baseStats[stat] = Math.floor(min + Math.random() * (max - min)) * (1 + qualityIndex * 0.2)
      }
      
      equipment.push({
        id: `eq_${type}_${quality}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${qualityInfo.name}${namePart}`,
        type,
        quality,
        qualityInfo,
        levelReq: qualityIndex * 5 + 1,
        stats: baseStats,
        enhanceLevel: 0,
        image: ''
      })
    })
  })
  
  return equipment.slice(0, 30)
}

const generateDefaultPets = () => {
  const pets = []
  const rarities = Object.keys(petRarities)
  
  rarities.forEach(rarity => {
    const rarityInfo = petRarities[rarity]
    const rarityIndex = rarities.indexOf(rarity)
    
    for (let i = 0; i < 3; i++) {
      const namePart1 = petNameParts[Math.floor(Math.random() * petNameParts.length)]
      const namePart2 = petNameParts[Math.floor(Math.random() * petNameParts.length)]
      const desc = petDescriptions[Math.floor(Math.random() * petDescriptions.length)]
      
      pets.push({
        id: `pet_${rarity}_${Date.now()}_${i}`,
        name: `${namePart1}${namePart2}`,
        rarity,
        rarityInfo,
        levelReq: rarityIndex * 10 + 1,
        stats: {
          attack: (5 + rarityIndex * 10) * (1 + Math.random() * 0.3),
          defense: (3 + rarityIndex * 6) * (1 + Math.random() * 0.3),
          health: (20 + rarityIndex * 50) * (1 + Math.random() * 0.3),
          critRate: 0.02 + rarityIndex * 0.03,
          comboRate: 0.01 + rarityIndex * 0.02
        },
        description: desc,
        image: ''
      })
    }
  })
  
  return pets
}

const generateDefaultMonsters = () => {
  const monsters = [
    { id: 'monster_1', name: '野猪精', level: 3, difficulty: 'easy', stats: { health: 50, damage: 8, defense: 3, speed: 8 }, rewards: { spiritStones: [5, 15], experience: 10 } },
    { id: 'monster_2', name: '山匪', level: 5, difficulty: 'easy', stats: { health: 80, damage: 12, defense: 5, speed: 10 }, rewards: { spiritStones: [10, 25], experience: 15 } },
    { id: 'monster_3', name: '猛虎', level: 8, difficulty: 'normal', stats: { health: 150, damage: 20, defense: 10, speed: 15 }, rewards: { spiritStones: [20, 50], experience: 30 } },
    { id: 'monster_4', name: '骷髅兵', level: 12, difficulty: 'normal', stats: { health: 200, damage: 25, defense: 15, speed: 8 }, rewards: { spiritStones: [30, 80], experience: 45 } },
    { id: 'monster_5', name: '妖狼', level: 15, difficulty: 'normal', stats: { health: 300, damage: 35, defense: 18, speed: 20 }, rewards: { spiritStones: [50, 120], experience: 60 } },
    { id: 'monster_6', name: '僵尸王', level: 20, difficulty: 'hard', stats: { health: 500, damage: 50, defense: 25, speed: 12 }, rewards: { spiritStones: [100, 200], experience: 100 } },
    { id: 'monster_7', name: '毒蛇', level: 25, difficulty: 'hard', stats: { health: 400, damage: 60, defense: 20, speed: 25 }, rewards: { spiritStones: [150, 300], experience: 150 } },
    { id: 'monster_8', name: '血魔', level: 30, difficulty: 'expert', stats: { health: 800, damage: 80, defense: 35, speed: 18 }, rewards: { spiritStones: [300, 500], experience: 250 } },
    { id: 'monster_9', name: '噬魂鬼', level: 35, difficulty: 'expert', stats: { health: 1000, damage: 100, defense: 40, speed: 22 }, rewards: { spiritStones: [500, 800], experience: 350 } },
    { id: 'monster_10', name: '远古妖龙', level: 40, difficulty: 'expert', stats: { health: 2000, damage: 150, defense: 60, speed: 25 }, rewards: { spiritStones: [1000, 2000], experience: 500 } }
  ]
  return monsters
}

// 素材管理
const fileInput = ref(null)
const assetType = ref('images')
const assetsList = ref([])

const filteredAssets = computed(() => {
  return assetsList.value.filter(a => 
    assetType.value === 'images' ? a.type === 'image' : a.type === 'audio'
  )
})

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e) => {
  const files = e.target.files
  processFiles(files)
  e.target.value = ''
}

const handleDrop = (e) => {
  const files = e.dataTransfer.files
  processFiles(files)
}

// 提交素材中的图片到 GitHub 仓库（走后端代理）
const committingRepo = ref(false)
const repoCommitResult = ref(null)
const pendingImageFiles = ref([])

// 自动检测后端代理地址：优先使用同源相对路径（部署同域时），本地开发时用 localhost
const GMTOOLS_SERVER = import.meta.env.DEV
  ? (import.meta.env.VITE_GMTOOLS_SERVER || `http://${location.hostname}:8787`)
  : (import.meta.env.VITE_GMTOOLS_SERVER || '')

const commitImagesToRepo = async () => {
  if (!pendingImageFiles.value.length) return
  committingRepo.value = true
  repoCommitResult.value = null
  let okCount = 0
  let errCount = 0
  const errors = []
  for (const file of pendingImageFiles.value) {
    const form = new FormData()
    form.append('file', file)
    form.append('path', 'public/portraits')
    try {
      const uploadUrl = GMTOOLS_SERVER ? `${GMTOOLS_SERVER}/api/upload` : '/api/upload'
      const r = await fetch(uploadUrl, { method: 'POST', body: form })
      if (!r.ok) {
        const txt = await r.text().catch(() => '')
        errCount++
        errors.push(`${file.name}: HTTP ${r.status} ${txt.slice(0, 100)}`)
        continue
      }
      const j = await r.json()
      if (j.ok) okCount++
      else { errCount++; errors.push(`${file.name}: ${j.error}`) }
    } catch (e) {
      errCount++
      const hint = e.message === 'Failed to fetch'
        ? '无法连接后端代理，请确认 server/ 已启动（cd server && node index.js）'
        : e.message
      errors.push(`${file.name}: ${hint}`)
    }
  }
  committingRepo.value = false
  repoCommitResult.value = {
    ok: errCount === 0,
    message: errCount === 0
      ? `✅ 已成功提交 ${okCount} 张立绘到仓库`
      : `❌ 成功 ${okCount}，失败 ${errCount}。${errors.slice(0, 3).join('；')}`
  }
  if (errCount === 0) pendingImageFiles.value = []
}

const processFiles = (files) => {
  for (const file of files) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const type = file.type.startsWith('image') ? 'image' : 'audio'
      assetsList.value.push({
        name: file.name,
        type,
        url: e.target.result,
        data: e.target.result
      })
      // 把图片同时加入"待提交到仓库"列表
      if (type === 'image' && !pendingImageFiles.value.find(f => f.name === file.name)) {
        pendingImageFiles.value.push(file)
      }
      saveToStorage()
    }
    reader.readAsDataURL(file)
  }
}

const deleteAsset = (name) => {
  const index = assetsList.value.findIndex(a => a.name === name)
  if (index >= 0) {
    assetsList.value.splice(index, 1)
    saveToStorage()
  }
}

// 数值操作
const saveValues = () => {
  localStorage.setItem('gm_gameValues', JSON.stringify(gameValues.value))
}

const exportValues = () => {
  const data = JSON.stringify(gameValues.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'game-values.json'
  a.click()
}

const importValues = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        gameValues.value = JSON.parse(e.target.result)
        saveValues()
      } catch (err) {
        alert('导入失败：无效的JSON文件')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

const resetValues = () => {
  if (confirm('确定要重置所有数值为默认值吗？')) {
    gameValues.value = { ...defaultValues }
    saveValues()
  }
}

// 本地存储
const saveToStorage = () => {
  localStorage.setItem('gm_characters', JSON.stringify(characterListGM.value))
  // 立绘 base64 容量大，持久化到 IndexedDB（gm_characters）以免 localStorage 5MB 上限
  GameDB.setData('gm_characters', characterListGM.value).catch(err => console.error('保存立绘失败:', err))
  syncCharacterDefs(characterListGM.value)
  localStorage.setItem('gm_equipment', JSON.stringify(equipmentList.value))
  localStorage.setItem('gm_pets', JSON.stringify(petList.value))
  localStorage.setItem('gm_monsters', JSON.stringify(monsterList.value))
  localStorage.setItem('gm_assets', JSON.stringify(assetsList.value))
}

const loadFromStorage = async () => {
  try {
    const values = localStorage.getItem('gm_gameValues')
    if (values) gameValues.value = JSON.parse(values)

    // 角色：优先 IndexedDB（容量大，可存 base64 立绘），回退 localStorage / 静态表
    let characters = null
    try { characters = await GameDB.getData('gm_characters') } catch (e) { characters = null }
    if (!Array.isArray(characters) || !characters.length) {
      const raw = localStorage.getItem('gm_characters')
      if (raw) characters = JSON.parse(raw)
    }
    if (Array.isArray(characters) && characters.length) {
      characterListGM.value = characters
    } else {
      characterListGM.value = characterList.map(c => ({
        id: c.id,
        templateId: c.templateId || c.id,
        name: c.name,
        star: c.star,
        school: c.school,
        talent: c.talent,
        description: c.description,
        level: c.level || 1,
        baseStats: { ...c.baseStats },
        avatar: c.avatar || null,
        avatarUrl: ''
      }))
    }
    syncCharacterDefs(characterListGM.value)

    const equipment = localStorage.getItem('gm_equipment')
    if (equipment) equipmentList.value = JSON.parse(equipment)
    if (equipmentList.value.length === 0) equipmentList.value = generateDefaultEquipment()

    const pets = localStorage.getItem('gm_pets')
    if (pets) petList.value = JSON.parse(pets)
    if (petList.value.length === 0) petList.value = generateDefaultPets()

    const monsters = localStorage.getItem('gm_monsters')
    if (monsters) monsterList.value = JSON.parse(monsters)
    if (monsterList.value.length === 0) monsterList.value = generateDefaultMonsters()

    const assets = localStorage.getItem('gm_assets')
    if (assets) assetsList.value = JSON.parse(assets)
  } catch (err) {
    console.error('加载配置失败:', err)
  }
}

onMounted(async () => {
  await loadFromStorage()
  loadThemeData()
})
</script>

<style scoped>
.gm-tools {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.tools-header {
  margin-bottom: 20px;
}

.tools-header h2 {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 24px;
  color: #FFD700;
  margin-bottom: 15px;
}

.tools-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 8px;
  color: #8B8B8B;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: rgba(218, 165, 32, 0.1);
}

.tab-btn.active {
  background: rgba(218, 165, 32, 0.2);
  border-color: #DAA520;
  color: #FFD700;
}

.panel {
  background: rgba(20, 25, 30, 0.8);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(218, 165, 32, 0.2);
}

.panel-section {
  margin-bottom: 25px;
}

.panel-section h3 {
  font-size: 16px;
  color: #DAA520;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(218, 165, 32, 0.2);
}

.value-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.value-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.value-item label {
  font-size: 12px;
  color: #8B8B8B;
}

.value-item input {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 6px;
  color: #F5DEB3;
  font-size: 14px;
}

.value-item input:focus {
  outline: none;
  border-color: #DAA520;
}

.panel-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #DAA520, #FFD700);
  color: #0D0D12;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #F5DEB3;
  border: 1px solid rgba(218, 165, 32, 0.3);
}

.btn-danger {
  background: rgba(255, 99, 71, 0.2);
  color: #FF6347;
  border: 1px solid rgba(255, 99, 71, 0.3);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-add {
  padding: 10px 20px;
  background: rgba(50, 205, 50, 0.2);
  border: 1px solid rgba(50, 205, 50, 0.3);
  border-radius: 8px;
  color: #32CD32;
  cursor: pointer;
}

.filter-select {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 6px;
  color: #F5DEB3;
}

.equipment-list,
.character-list,
.pet-list,
.monster-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.character-card,
.equipment-card,
.pet-card,
.monster-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  position: relative;
}

.character-card:hover,
.equipment-card:hover,
.pet-card:hover,
.monster-card:hover {
  background: rgba(218, 165, 32, 0.1);
  border-color: rgba(218, 165, 32, 0.3);
}

.character-card.star-5 {
  border-color: #FFD700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
}

.character-card.star-4 {
  border-color: #9932CC;
  box-shadow: 0 0 8px rgba(153, 50, 204, 0.2);
}

.character-card.star-3 {
  border-color: #6fb3ff;
}

.char-avatar {
  width: 40px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(139, 69, 19, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.char-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.char-placeholder {
  font-size: 18px;
  color: #DAA520;
  font-weight: bold;
}

.char-info {
  flex: 1;
  min-width: 0;
}

.char-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 2px;
}

.char-stars {
  display: flex;
  gap: 1px;
  margin-bottom: 2px;
}

.char-stars .star {
  font-size: 10px;
  color: #FFD700;
}

.char-school {
  font-size: 11px;
  color: #888;
}

.avatar-upload-area {
  display: flex;
  gap: 16px;
  align-items: center;
}

.avatar-preview {
  position: relative;
  width: 100px;
  height: 130px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(218, 165, 32, 0.5);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100px;
  height: 130px;
  border-radius: 8px;
  border: 2px dashed rgba(218, 165, 32, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.2);
  font-size: 12px;
  color: #888;
  transition: all 0.2s;
}

.avatar-placeholder:hover {
  border-color: #DAA520;
  color: #DAA520;
  background: rgba(218, 165, 32, 0.1);
}

.asset-selector {
  margin-top: 6px;
}

.asset-selector select {
  width: 100%;
  padding: 6px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
}

.edit-modal.wide .modal-content {
  max-width: 600px;
}

.eq-icon,
.pet-icon,
.monster-icon {
  font-size: 24px;
}

.eq-info,
.pet-info,
.monster-info {
  flex: 1;
}

.eq-name,
.pet-name,
.monster-name {
  font-size: 14px;
  color: #F5DEB3;
  font-weight: bold;
}

.eq-type,
.pet-rarity,
.monster-level {
  font-size: 12px;
  color: #8B8B8B;
}

.btn-delete {
  width: 24px;
  height: 24px;
  background: rgba(255, 99, 71, 0.2);
  border: none;
  border-radius: 50%;
  color: #FF6347;
  cursor: pointer;
  font-size: 14px;
}

.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(20, 25, 30, 0.95);
  border-radius: 16px;
  padding: 25px;
  max-width: 500px;
  width: 90%;
  border: 1px solid rgba(218, 165, 32, 0.3);
}

.modal-content h3 {
  font-size: 18px;
  color: #FFD700;
  margin-bottom: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-item.full {
  grid-column: span 2;
}

.form-item label {
  font-size: 12px;
  color: #8B8B8B;
}

.form-item input,
.form-item select,
.form-item textarea {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 6px;
  color: #F5DEB3;
  font-size: 14px;
}

.form-item textarea {
  min-height: 60px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}

.assets-upload {
  margin-bottom: 30px;
}

.assets-upload h3 {
  font-size: 16px;
  color: #DAA520;
  margin-bottom: 15px;
}

.upload-zone {
  padding: 40px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px dashed rgba(218, 165, 32, 0.3);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-zone:hover {
  border-color: #DAA520;
  background: rgba(218, 165, 32, 0.05);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.upload-zone p {
  color: #8B8B8B;
  margin-bottom: 5px;
}

.upload-hint {
  font-size: 12px;
  color: #555;
}

.assets-preview h3 {
  font-size: 16px;
  color: #DAA520;
  margin-bottom: 15px;
}

.assets-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.assets-tabs button {
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 6px;
  color: #8B8B8B;
  cursor: pointer;
}

.assets-tabs button.active {
  background: rgba(218, 165, 32, 0.2);
  color: #FFD700;
}

.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.asset-item {
  position: relative;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  text-align: center;
}

.asset-thumb {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.audio-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.audio-thumb span {
  font-size: 32px;
}

.audio-thumb audio {
  width: 100%;
  height: 30px;
}

.asset-name {
  font-size: 12px;
  color: #8B8B8B;
  margin-top: 5px;
  word-break: break-all;
}

.asset-item .btn-delete {
  position: absolute;
  top: 5px;
  right: 5px;
}

.theme-import-export {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.theme-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  border-bottom: 1px solid rgba(218, 165, 32, 0.2);
  padding-bottom: 15px;
}

.theme-tabs button {
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 8px;
  color: #8B8B8B;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-tabs button.active {
  background: rgba(218, 165, 32, 0.2);
  border-color: #DAA520;
  color: #FFD700;
}

.theme-section {
  margin-bottom: 25px;
}

.theme-section h3 {
  font-size: 16px;
  color: #DAA520;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(218, 165, 32, 0.2);
}

.value-item.full {
  grid-column: span 2;
}

.value-item input[type="color"] {
  width: 100%;
  height: 40px;
  padding: 2px;
  cursor: pointer;
}

.value-item input[type="range"] {
  width: 100%;
  cursor: pointer;
}

.resource-list {
  margin-top: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(218, 165, 32, 0.1);
}

.resource-list h4 {
  font-size: 14px;
  color: #FFD700;
  margin-bottom: 10px;
}

.resource-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.resource-list li {
  font-size: 13px;
  color: #F5DEB3;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.resource-list li:last-child {
  border-bottom: none;
}

.asset-selector {
  margin-top: 8px;
}

.asset-selector select {
  width: 100%;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 6px;
  color: #F5DEB3;
  font-size: 13px;
  cursor: pointer;
}

.asset-selector select option {
  background: #1A1A2E;
  color: #F5DEB3;
}

.eq-score {
  font-size: 12px;
  color: #FFD700;
}

.equipment-score {
  font-size: 18px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.affix-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.affix-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.affix-item select {
  flex: 1;
}

.affix-item input {
  width: 100px;
}

.affix-list-panel {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.affix-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.affix-card:hover {
  background: rgba(218, 165, 32, 0.1);
  border-color: rgba(218, 165, 32, 0.3);
}

.affix-icon {
  font-size: 20px;
}

.affix-info {
  flex: 1;
}

.affix-name {
  font-size: 14px;
  color: #F5DEB3;
  font-weight: bold;
}

.affix-stat {
  font-size: 12px;
  color: #8B8B8B;
}

.affix-tier-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.affix-tier-1 {
  border-color: #32CD32;
}

.affix-tier-1 .affix-tier-badge {
  background: rgba(50, 205, 50, 0.2);
  color: #32CD32;
}

.affix-tier-2 {
  border-color: #1E90FF;
}

.affix-tier-2 .affix-tier-badge {
  background: rgba(30, 144, 255, 0.2);
  color: #1E90FF;
}

.affix-tier-3 {
  border-color: #FFD700;
}

.affix-tier-3 .affix-tier-badge {
  background: rgba(255, 215, 0, 0.2);
  color: #FFD700;
}

.set-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.set-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.set-card:hover {
  background: rgba(218, 165, 32, 0.1);
}

.set-icon {
  font-size: 24px;
}

.set-info {
  flex: 1;
}

.set-name {
  font-size: 14px;
  font-weight: bold;
}

.set-pieces {
  font-size: 12px;
  color: #8B8B8B;
}

.set-bonuses {
  display: flex;
  gap: 4px;
}

.set-bonuses span {
  font-size: 10px;
  padding: 2px 4px;
  background: rgba(255, 215, 0, 0.1);
  color: #FFD700;
  border-radius: 4px;
}

.multi-select {
  height: 120px;
}

.bonus-detail {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.bonus-detail select,
.bonus-detail input {
  flex: 1;
}

.batch-portrait {
  margin: 16px 0;
  padding: 16px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 12px;
}

.batch-portrait-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.batch-title {
  font-size: 16px;
  font-weight: 600;
  color: #FFD700;
}

.batch-hint {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(245, 222, 179, 0.7);
}

.batch-hint code {
  background: rgba(0, 0, 0, 0.4);
  padding: 1px 6px;
  border-radius: 4px;
  color: #FFD700;
  font-size: 11px;
}

.batch-dropzone {
  padding: 24px 16px;
  border: 2px dashed rgba(218, 165, 32, 0.45);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: #F5DEB3;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  line-height: 1.6;
}

.batch-dropzone:hover {
  border-color: #FFD700;
  background: rgba(218, 165, 32, 0.12);
}

.batch-dropzone code {
  background: rgba(0, 0, 0, 0.4);
  padding: 1px 6px;
  border-radius: 4px;
  color: #FFD700;
  font-size: 13px;
}

.batch-preview {
  margin-top: 14px;
  overflow-x: auto;
}

.batch-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: #F5DEB3;
}

.batch-table th,
.batch-table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(218, 165, 32, 0.2);
  text-align: left;
  vertical-align: middle;
}

.batch-table th {
  color: #FFD700;
  font-weight: 600;
  white-space: nowrap;
}

.batch-table select {
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 6px;
  color: #F5DEB3;
  max-width: 220px;
}

.batch-file {
  max-width: 200px;
  word-break: break-all;
}

.batch-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(218, 165, 32, 0.4);
}

.batch-ok {
  color: #32CD32;
  font-weight: 600;
  white-space: nowrap;
}

.batch-warn {
  color: #FFA500;
  white-space: nowrap;
}

.batch-actions {
  display: flex;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .value-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-item.full,
  .value-item.full {
    grid-column: span 1;
  }
}
</style>