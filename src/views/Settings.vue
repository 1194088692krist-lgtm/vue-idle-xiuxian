<template>
  <div class="settings-page fade-in-up">
    <!-- 基础设置 -->
    <div class="main-card glass-card">
      <div class="card-header">
        <div class="header-icon">
          <SettingOutlined />
        </div>
        <div class="header-info">
          <h2 class="card-title gold-gradient-text">游戏设置</h2>
          <p class="card-subtitle">版本 {{ version }}</p>
        </div>
      </div>
      <div class="card-body">
        <!-- 修改洞天字号 -->
        <div class="setting-row">
          <label class="setting-label">修改洞天字号</label>
          <div class="setting-input-group">
            <input
              v-model="newName"
              class="setting-input"
              placeholder="输入新的洞天字号"
              :maxlength="maxLength"
            />
            <button class="btn btn-primary" :disabled="!newName.trim()" @click="handleChangeName">
              确认修改
            </button>
          </div>
          <p class="setting-hint">
            首次免费，之后每次消耗 {{ nameChangeCost }} 灵石
          </p>
        </div>

        <!-- 主题切换 -->
        <div class="setting-row">
          <label class="setting-label">界面主题</label>
          <div class="setting-input-group">
            <button
              class="btn"
              :class="!playerStore.isDarkMode ? 'btn-success' : 'btn-outline'"
              @click="toggleTheme(false)"
            >
              日间模式
            </button>
            <button
              class="btn"
              :class="playerStore.isDarkMode ? 'btn-success' : 'btn-outline'"
              @click="toggleTheme(true)"
            >
              夜间模式
            </button>
          </div>
        </div>

        <!-- 危险操作 -->
        <div class="setting-row">
          <label class="setting-label">其他操作</label>
          <div class="setting-input-group">
            <button class="btn btn-warning" @click="handleReincarnation">转世重修</button>
            <button class="btn btn-info" @click="handleExportSave">导出存档</button>
            <label class="btn btn-outline">
              导入存档
              <input
                type="file"
                accept=".json"
                style="display: none"
                @change="handleImportSave"
              />
            </label>
          </div>
        </div>

        <!-- 说明 -->
        <div class="tips-box">
          <InfoCircleOutlined />
          <span>本游戏为开源项目，如果您在任何地方通过付费方式购买了本游戏，请及时退款并投诉举报。</span>
        </div>
      </div>
    </div>

    <!-- 独立存档管理 -->
    <div class="main-card glass-card">
      <div class="card-header">
        <div class="header-icon">
          <SaveOutlined />
        </div>
        <div class="header-info">
          <h2 class="card-title gold-gradient-text">存档管理</h2>
          <p class="card-subtitle">独立存档槽位，可保存多个游戏进度</p>
        </div>
      </div>
      <div class="card-body">
        <div class="slots-list">
          <div
            v-for="slot in saveSlots"
            :key="slot.slot"
            class="slot-card"
            :class="{ empty: !slot.name }"
          >
            <div class="slot-info">
              <div class="slot-number">槽位 {{ slot.slot }}</div>
              <template v-if="slot.name">
                <div class="slot-name">{{ slot.name }}</div>
                <div class="slot-detail">
                  <span>{{ slot.realm }}</span>
                  <span v-if="slot.saveTime" class="slot-time">
                    {{ formatTime(slot.saveTime) }}
                  </span>
                </div>
              </template>
              <template v-else>
                <div class="slot-name empty-text">空槽位</div>
                <div class="slot-detail">点击"保存"创建存档</div>
              </template>
            </div>
            <div class="slot-actions">
              <button class="btn btn-small btn-primary" @click="handleSaveToSlot(slot.slot)">
                保存
              </button>
              <button
                v-if="slot.name"
                class="btn btn-small btn-success"
                @click="handleLoadFromSlot(slot.slot)"
              >
                读取
              </button>
              <button
                v-if="slot.name"
                class="btn btn-small btn-danger"
                @click="handleDeleteSlot(slot.slot)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    
  </div>
</template>

<script setup>
  import { usePlayerStore } from '../stores/player'
  import { ref, onMounted, computed } from 'vue'
  import { useDialog, useMessage } from 'naive-ui'
  import { saveAs } from 'file-saver'
  import {
    SettingOutlined,
    SaveOutlined,
    InfoCircleOutlined,
    GithubOutlined
  } from '@ant-design/icons-vue'
  import { GAME_VERSION, GAME_VERSION_NAME, GAME_VERSION_DATE } from '../plugins/version'

  const clickCount = ref(0)
  const newName = ref('')
  const message = useMessage()
  const maxLength = 6
  const playerStore = usePlayerStore()
  const dialog = useDialog()
  const version = `${GAME_VERSION} · ${GAME_VERSION_NAME}（${GAME_VERSION_DATE}）`
  const qq = ref(false)

  // 存档槽位数据
  const saveSlots = ref([])

  const nameChangeCost = computed(() => {
    return playerStore.nameChangeCount === 0 ? 0 : Math.pow(2, playerStore.nameChangeCount) * 100
  })

  // 加载存档槽位列表
  const loadSaveSlots = async () => {
    try {
      saveSlots.value = await playerStore.getSaveSlots()
    } catch (error) {
      console.error('加载存档槽位失败:', error)
    }
  }

  // 保存到槽位
  const handleSaveToSlot = (slot) => {
    dialog.warning({
      title: '保存存档',
      content: `确定要将当前进度保存到槽位 ${slot} 吗？${saveSlots.value[slot - 1]?.name ? '该槽位已有存档，将被覆盖！' : ''}`,
      positiveText: '确定保存',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await playerStore.saveToSlot(slot)
          message.success(`已保存到槽位 ${slot}`)
          await loadSaveSlots()
        } catch (error) {
          message.error('保存失败：' + error.message)
        }
      }
    })
  }

  // 从槽位加载
  const handleLoadFromSlot = (slot) => {
    dialog.warning({
      title: '读取存档',
      content: `确定要读取槽位 ${slot} 的存档吗？当前未保存的进度将丢失！`,
      positiveText: '确定读取',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await playerStore.loadFromSlot(slot)
          message.success(`已读取槽位 ${slot} 的存档`)
          await loadSaveSlots()
        } catch (error) {
          message.error('读取失败：' + error.message)
        }
      }
    })
  }

  // 删除槽位
  const handleDeleteSlot = (slot) => {
    dialog.warning({
      title: '删除存档',
      content: `确定要删除槽位 ${slot} 的存档吗？此操作不可恢复！`,
      positiveText: '确定删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await playerStore.deleteSlot(slot)
          message.success(`已删除槽位 ${slot}`)
          await loadSaveSlots()
        } catch (error) {
          message.error('删除失败：' + error.message)
        }
      }
    })
  }

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const d = new Date(timestamp)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const minute = String(d.getMinutes()).padStart(2, '0')
    return `${month}/${day} ${hour}:${minute}`
  }

  // 导出存档
  const handleExportSave = async () => {
    try {
      const saveData = await playerStore.exportData()
      if (!saveData) {
        message.error('没有可导出的存档数据！')
        return
      }
      saveAs(
        new Blob([saveData], { type: 'application/json;charset=utf-8' }),
        `凡人修仙${version}版本存档数据-${new Date().toISOString().slice(0, 10)}-${Date.now()}.json`
      )
      message.success('存档导出成功！')
    } catch (error) {
      message.error('导出失败：' + error.message)
    }
  }

  // 导入存档
  const handleImportSave = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const encryptedData = e.target.result
        await playerStore.importData(encryptedData)
        message.success('存档导入成功！')
      } catch (error) {
        message.error('导入失败：' + error.message)
      }
    }
    reader.readAsText(file)
    // 清空 input 的值，允许重复导入同一文件
    event.target.value = ''
  }

  // 转世重修确认
  const handleReincarnation = () => {
    clickCount.value++
    if (clickCount.value >= 10) {
      dialog.warning({
        title: '提示',
        content: 'GM模式已开启！',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
          playerStore.isGMMode = true
          playerStore.saveData()
        }
      })
      return
    }
    dialog.warning({
      title: '转世重修确认',
      content: '确定要转世重修吗？这将清空所有数据重新开始！',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        dialog.warning({
          title: '最终确认',
          content: '这是最后的确认，转世后将无法恢复！确定继续吗？',
          positiveText: '确定转世',
          negativeText: '再想想',
          onPositiveClick: async () => {
            await playerStore.clearData()
            location.href = location.origin
          }
        })
      }
    })
  }

  // 修改洞天字号
  const handleChangeName = () => {
    if (!newName.value.trim()) {
      message.warning('洞天字号不能为空！')
      return
    }
    if (newName.value.trim().length > maxLength) {
      message.warning(`洞天字号长度不能超过${maxLength}个字符！`)
      return
    }
    const cost = playerStore.nameChangeCount === 0 ? 0 : Math.pow(2, playerStore.nameChangeCount) * 100
    if (playerStore.nameChangeCount > 0) {
      if (playerStore.spiritStones < cost) {
        message.error(`灵石不足！修改洞天字号需要${cost}颗灵石`)
        return
      }
      playerStore.spiritStones -= cost
    }
    playerStore.name = newName.value.trim()
    playerStore.nameChangeCount++
    playerStore.saveData()
    message.success(
      playerStore.nameChangeCount === 1 ? '洞天字号修改成功！首次修改免费' : `洞天字号修改成功！消耗${cost}颗灵石`
    )
    newName.value = ''
  }

  // 主题切换
  const toggleTheme = (dark) => {
    playerStore.isDarkMode = dark
    playerStore.updateHtmlDarkMode(dark)
    localStorage.setItem('darkMode', dark)
    playerStore.saveData()
  }

  onMounted(() => {
    loadSaveSlots()
  })
</script>

<style scoped>
  .settings-page {
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 100%;
  }

  .main-card {
    padding: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(139, 69, 19, 0.2);
    margin-bottom: 16px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(139, 69, 19, 0.3), rgba(218, 165, 32, 0.2));
    border-radius: 12px;
    font-size: 24px;
    color: var(--color-accent-gold);
  }

  .card-title {
    margin: 0;
    font-size: 22px;
    font-family: var(--font-family-heading);
  }

  .card-subtitle {
    margin: 4px 0 0;
    color: #888;
    font-size: 13px;
  }

  .setting-row {
    margin-bottom: 18px;
  }

  .setting-label {
    display: block;
    font-size: 14px;
    color: #F5DEB3;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .setting-input-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .setting-input {
    flex: 1;
    min-width: 120px;
    padding: 10px 14px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(139, 69, 19, 0.3);
    border-radius: 8px;
    color: #F5DEB3;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  .setting-input:focus {
    border-color: #DAA520;
  }

  .setting-hint {
    margin: 6px 0 0;
    font-size: 12px;
    color: #888;
  }

  .tips-box {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(255, 193, 7, 0.1);
    border-radius: 8px;
    margin-top: 12px;
    color: #aaa;
    font-size: 13px;
  }

  /* 按钮 */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    min-height: 42px;
    text-decoration: none;
  }

  .btn-primary {
    background: linear-gradient(135deg, #8B4513, #DAA520);
    color: #fff;
  }

  .btn-success {
    background: linear-gradient(135deg, #2E7D32, #66BB6A);
    color: #fff;
  }

  .btn-warning {
    background: linear-gradient(135deg, #E65100, #FF9800);
    color: #fff;
  }

  .btn-info {
    background: linear-gradient(135deg, #1565C0, #42A5F5);
    color: #fff;
  }

  .btn-danger {
    background: rgba(220, 53, 69, 0.3);
    color: #DC3545;
    border: 1px solid rgba(220, 53, 69, 0.3);
  }

  .btn-outline {
    background: transparent;
    color: #F5DEB3;
    border: 1px solid rgba(139, 69, 19, 0.4);
  }

  .btn-small {
    padding: 6px 12px;
    font-size: 12px;
    min-height: auto;
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* 存档槽位 */
  .slots-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .slot-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(139, 69, 19, 0.2);
    border-radius: 10px;
    transition: all 0.2s;
  }

  .slot-card.empty {
    border-style: dashed;
    opacity: 0.7;
  }

  .slot-info {
    flex: 1;
  }

  .slot-number {
    font-size: 12px;
    color: #888;
    margin-bottom: 2px;
  }

  .slot-name {
    font-size: 15px;
    font-weight: bold;
    color: #F5DEB3;
  }

  .slot-name.empty-text {
    color: #666;
    font-weight: normal;
  }

  .slot-detail {
    display: flex;
    gap: 10px;
    font-size: 12px;
    color: #aaa;
    margin-top: 2px;
  }

  .slot-time {
    color: #888;
  }

  .slot-actions {
    display: flex;
    gap: 6px;
  }

  /* 关于 */
  .about-links {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* 弹窗 */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-content {
    padding: 20px;
    border-radius: 12px;
    max-width: 400px;
    width: 100%;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .modal-header h3 {
    margin: 0;
    color: #F5DEB3;
  }

  .modal-body {
    display: flex;
    gap: 10px;
  }
</style>
