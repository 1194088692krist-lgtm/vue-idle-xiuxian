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

        <!-- 全屏切换 -->
        <div class="setting-row">
          <label class="setting-label">显示模式</label>
          <div class="setting-input-group">
            <button class="btn btn-primary" @click="toggleFullscreen">
              {{ isFullscreen ? '退出全屏' : '进入全屏' }}
            </button>
          </div>
        </div>

        <!-- 立绘动态效果 -->
        <div class="setting-row">
          <label class="setting-label">立绘动态效果</label>
          <div class="setting-input-group">
            <button
              class="btn"
              :class="playerStore.dynamicPortrait ? 'btn-success' : 'btn-outline'"
              @click="toggleDynamicPortrait"
            >
              {{ playerStore.dynamicPortrait ? '已开启（点击立绘播放视频）' : '已关闭（仅静态立绘）' }}
            </button>
          </div>
          <p class="setting-hint">
            开启后，点击已配置动态视频的角色立绘会自动加载并播放；关闭则始终显示静态立绘，更省流量。
          </p>
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

    <!-- 账号 / 云存档 / 礼包 -->
    <div class="main-card glass-card">
      <div class="card-header">
        <div class="header-icon">
          <UserOutlined />
        </div>
        <div class="header-info">
          <h2 class="card-title gold-gradient-text">账号与云存档</h2>
          <p class="card-subtitle">登录后存档自动云同步，支持多端续玩</p>
        </div>
      </div>
      <div class="card-body">
        <!-- 未登录：登录 / 注册 -->
        <template v-if="!auth.isLoggedIn">
          <div class="setting-row">
            <label class="setting-label">账号（用户ID）</label>
            <input
              v-model="loginForm.username"
              class="setting-input"
              placeholder="输入账号"
              maxlength="20"
            />
          </div>
          <div class="setting-row">
            <label class="setting-label">密码</label>
            <input
              v-model="loginForm.password"
              type="password"
              class="setting-input"
              placeholder="输入密码"
              maxlength="40"
              @keyup.enter="loginMode === 'login' ? handleLogin() : handleRegister()"
            />
          </div>
          <div class="setting-input-group">
            <button
              class="btn btn-primary"
              :disabled="authBusy || !loginForm.username || !loginForm.password"
              @click="handleLogin"
            >
              登录
            </button>
            <button
              class="btn btn-outline"
              :disabled="authBusy || !loginForm.username || !loginForm.password"
              @click="handleRegister"
            >
              注册新账号
            </button>
          </div>
          <p class="setting-hint">
            登录仅用于云端存档备份与跨设备续玩；密码为明文存储，请勿使用重要密码。
          </p>
        </template>

        <!-- 已登录：信息 + 操作 -->
        <template v-else>
          <div class="setting-row">
            <label class="setting-label">当前账号</label>
            <div class="setting-input-group">
              <span class="account-name">{{ auth.user?.username }}</span>
              <button class="btn btn-danger" @click="handleLogout">退出登录</button>
            </div>
          </div>
          <div class="setting-row">
            <label class="setting-label">云存档操作</label>
            <div class="setting-input-group">
              <button class="btn btn-success" :disabled="authBusy" @click="handleUploadToCloud">
                上传到云端
              </button>
              <button class="btn btn-primary" :disabled="authBusy" @click="handleDownloadFromCloud">
                从云端下载
              </button>
              <span class="sync-status">{{ playerStore.cloudSyncStatus || '已开启自动云同步' }}</span>
            </div>
          </div>

          <!-- 礼包收件箱 -->
          <div class="setting-row">
            <label class="setting-label">
              我的礼包
              <span v-if="playerStore.gifts.length" class="badge">{{ playerStore.gifts.length }}</span>
            </label>
            <div v-if="playerStore.gifts.length" class="gift-list">
              <div v-for="g in playerStore.gifts" :key="g.id" class="gift-item">
                <div class="gift-info">
                  <div class="gift-msg">{{ g.message || 'GM 赠送的礼包' }}</div>
                  <div class="gift-items">{{ formatGift(g.items_json) }}</div>
                </div>
                <button class="btn btn-small btn-primary" @click="handleClaim(g.id)">领取</button>
              </div>
            </div>
            <p v-else class="setting-hint">暂无礼包，GM 发放的奖励会显示在这里。</p>
          </div>
        </template>

        <!-- 本地备份（无需登录，存于本机） -->
        <div class="setting-row">
          <label class="setting-label">本地备份</label>
          <div class="setting-input-group">
            <button class="btn btn-info" @click="createBackup">创建本地备份</button>
          </div>
          <div v-if="localBackups.length" class="backup-list">
            <div v-for="b in localBackups" :key="b.key" class="backup-item">
              <div class="backup-info">
                <span class="backup-name">{{ b.name }}</span>
                <span class="backup-time">Lv.{{ b.level }} · {{ b.realm }} · {{ formatTime(b.time) }}</span>
              </div>
              <div class="backup-actions">
                <button class="btn btn-small btn-success" @click="restoreBackup(b)">恢复</button>
                <button class="btn btn-small btn-danger" @click="deleteBackup(b)">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分支③：云端 / 本地存档冲突对比弹窗 -->
    <div v-if="playerStore.cloudConflicts.length" class="modal-overlay">
      <div class="modal-content conflict-modal glass-card">
        <div class="modal-header">
          <h3>存档冲突</h3>
        </div>
        <div class="modal-body conflict-body">
          <p class="conflict-tip">检测到本地与云端都有存档，请为以下槽位选择保留哪一份：</p>
          <div v-for="c in playerStore.cloudConflicts" :key="c.slot" class="conflict-row">
            <div class="conflict-slot">槽位 {{ c.slot === 0 ? '当前档' : c.slot }}</div>
            <div class="conflict-compare">
              <div class="conflict-card">
                <div class="conflict-side">本地存档</div>
                <div class="conflict-name">{{ c.local.name }}</div>
                <div class="conflict-detail">Lv.{{ c.local.level }} · {{ c.local.realm }}</div>
                <div class="conflict-time">{{ c.localTime ? formatTime(c.localTime) : '未知时间' }}</div>
                <button class="btn btn-small btn-success" @click="resolveConflict(c.slot, false)">用本地</button>
              </div>
              <div class="conflict-card">
                <div class="conflict-side">云端存档</div>
                <div class="conflict-name">{{ c.cloud.name }}</div>
                <div class="conflict-detail">Lv.{{ c.cloud.level }} · {{ c.cloud.realm }}</div>
                <div class="conflict-time">{{ c.cloudTime ? formatTime(c.cloudTime) : '未知时间' }}</div>
                <button class="btn btn-small btn-primary" @click="resolveConflict(c.slot, true)">用云端</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
  import { usePlayerStore } from '../stores/player'
  import { useAuthStore } from '../stores/auth'
  import { GameDB } from '../stores/db'
  import { decryptData } from '../plugins/crypto'
  import { ref, onMounted, computed, onUnmounted } from 'vue'
  import { useDialog, useMessage } from 'naive-ui'
  import { saveAs } from 'file-saver'
  import {
    SettingOutlined,
    SaveOutlined,
    InfoCircleOutlined,
    GithubOutlined,
    UserOutlined
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
  const isFullscreen = ref(false)

  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        message.error('全屏功能不支持或被浏览器阻止')
      })
    } else {
      document.exitFullscreen().catch(() => {
        message.error('退出全屏失败')
      })
    }
  }

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

  // 立绘动态效果开关
  const toggleDynamicPortrait = () => {
    playerStore.dynamicPortrait = !playerStore.dynamicPortrait
    localStorage.setItem('dynamicPortrait', playerStore.dynamicPortrait)
    playerStore.saveData()
  }

  // ===== 账号 / 云存档 / 礼包 / 本地备份 =====
  const auth = useAuthStore()
  const loginForm = ref({ username: '', password: '' })
  const loginMode = ref('login')
  const authBusy = ref(false)

  const handleLogin = async () => {
    authBusy.value = true
    try {
      const data = await auth.login(loginForm.value.username.trim(), loginForm.value.password)
      message.success(`欢迎回来，${data.user.username}`)
      loginForm.value.password = ''
      // 登录后默认拉取最新云存档（分支③弹窗对比，由用户抉择）
      const res = await playerStore.migrate({ interactive: true })
      if (!res.conflicts.length) message.success('已与云端存档同步')
      await loadGifts()
    } catch (e) {
      message.error(e.message || '登录失败')
    } finally {
      authBusy.value = false
    }
  }
  const handleRegister = async () => {
    authBusy.value = true
    try {
      const data = await auth.register(loginForm.value.username.trim(), loginForm.value.password)
      message.success(`注册成功，已登录 ${data.user.username}`)
      loginForm.value.password = ''
      await loadGifts()
    } catch (e) {
      message.error(e.message || '注册失败')
    } finally {
      authBusy.value = false
    }
  }
  const handleLogout = () => {
    auth.logout()
    playerStore.gifts = []
    message.success('已退出登录（本地存档保留）')
  }
  const handleUploadToCloud = async () => {
    dialog.warning({
      title: '上传到云端',
      content: '确定将本地所有存档上传到云端？云端已有存档将被覆盖！',
      positiveText: '确定上传',
      negativeText: '取消',
      onPositiveClick: async () => {
        authBusy.value = true
        try {
          await playerStore.syncToCloud()
          message.success('已上传到云端')
        } catch (e) {
          message.error('上传失败：' + (e.message || e))
        } finally {
          authBusy.value = false
        }
      }
    })
  }
  const handleDownloadFromCloud = async () => {
    dialog.warning({
      title: '从云端下载',
      content: '确定从云端下载存档覆盖本地？本地未保存的进度将丢失！',
      positiveText: '确定下载',
      negativeText: '取消',
      onPositiveClick: async () => {
        authBusy.value = true
        try {
          await playerStore.pullFromCloud()
          message.success('已从云端下载')
        } catch (e) {
          message.error('下载失败：' + (e.message || e))
        } finally {
          authBusy.value = false
        }
      }
    })
  }

  // 礼包收件箱：复用 player store 的全局 gifts（与顶部铃铛红点同源）
  const loadGifts = () => playerStore.loadGifts()
  const formatGift = (json) => {
    try {
      const it = JSON.parse(json)
      const parts = []
      if (it.num) for (const [k, v] of Object.entries(it.num)) parts.push(`${k}:${v}`)
      if (it.materials) for (const m of it.materials) parts.push(`${m.name}×${m.count}`)
      return parts.join('，') || '（空）'
    } catch {
      return '（内容解析失败）'
    }
  }
  const handleClaim = async (id) => {
    try {
      await playerStore.claimGift(id)
      message.success('礼包已领取并入存档')
      // 领取后刷新全局收件箱（同步顶部红点与列表）
      await playerStore.loadGifts()
    } catch (e) {
      message.error(e.message || '领取失败')
    }
  }

  // 本地备份（存于本机 IndexedDB）
  const localBackups = ref([])
  const BACKUP_KEY = 'xx_backups'
  const loadBackups = () => {
    try { localBackups.value = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]') } catch { localBackups.value = [] }
  }
  const createBackup = async () => {
    try {
      const blob = await playerStore.exportData()
      if (!blob) { message.error('当前没有可导出的存档'); return }
      const ts = Date.now()
      const key = `backup_${ts}`
      await GameDB.setData(key, blob)
      const d = decryptData(blob)
      const list = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]')
      list.unshift({ key, time: ts, name: d?.name || '未知', level: d?.level || 1, realm: d?.realm || '' })
      localStorage.setItem(BACKUP_KEY, JSON.stringify(list.slice(0, 20)))
      message.success('已创建本地备份')
      loadBackups()
    } catch (e) {
      message.error('备份失败：' + (e.message || e))
    }
  }
  const restoreBackup = (b) => {
    dialog.warning({
      title: '恢复本地备份',
      content: `确定恢复到 ${b.name}（${formatTime(b.time)}）吗？当前未保存的进度将丢失！`,
      positiveText: '恢复',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          const blob = await GameDB.getData(b.key)
          if (!blob) { message.error('备份数据缺失'); return }
          await playerStore.importData(blob)
          message.success('已从本地备份恢复')
          await loadBackups()
        } catch (e) {
          message.error('恢复失败：' + (e.message || e))
        }
      }
    })
  }
  const deleteBackup = (b) => {
    dialog.warning({
      title: '删除备份',
      content: `确定删除本地备份 ${b.name} 吗？此操作不可恢复！`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        await GameDB.setData(b.key, null)
        const list = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]').filter(x => x.key !== b.key)
        localStorage.setItem(BACKUP_KEY, JSON.stringify(list))
        loadBackups()
        message.success('已删除备份')
      }
    })
  }

  // 分支③：玩家抉择某一槽位用本地还是云端
  const resolveConflict = async (slot, useCloud) => {
    try {
      await playerStore.resolveConflict(slot, useCloud)
      if (!playerStore.cloudConflicts.length) message.success('存档冲突已解决，已重新载入')
    } catch (e) {
      message.error('处理失败：' + (e.message || e))
    }
  }

  onMounted(() => {
    loadSaveSlots()
    loadBackups()
    if (auth.isLoggedIn) loadGifts()
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    isFullscreen.value = !!document.fullscreenElement
  })

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
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
    color: #C9C4BA;
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
    color: #C9C4BA;
  }

  .tips-box {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(255, 193, 7, 0.1);
    border-radius: 8px;
    margin-top: 12px;
    color: #F5DEB3;
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
    color: #C9C4BA;
    margin-bottom: 2px;
  }

  .slot-name {
    font-size: 15px;
    font-weight: bold;
    color: #F5DEB3;
  }

  .slot-name.empty-text {
    color: #C9C4BA;
    font-weight: normal;
  }

  .slot-detail {
    display: flex;
    gap: 10px;
    font-size: 12px;
    color: #F5DEB3;
    margin-top: 2px;
  }

  .slot-time {
    color: #C9C4BA;
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

  /* 账号与云存档 */
  .account-name {
    font-size: 16px;
    font-weight: bold;
    color: #F5DEB3;
  }

  .sync-status {
    font-size: 12px;
    color: #C9C4BA;
    align-self: center;
  }

  .badge {
    display: inline-block;
    min-width: 18px;
    padding: 0 6px;
    border-radius: 9px;
    background: #DAA520;
    color: #2b1700;
    font-size: 12px;
    font-weight: bold;
    text-align: center;
    margin-left: 6px;
  }

  /* 礼包 */
  .gift-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .gift-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(139, 69, 19, 0.2);
    border-radius: 10px;
  }

  .gift-msg {
    font-size: 14px;
    color: #F5DEB3;
  }

  .gift-items {
    font-size: 12px;
    color: #F5DEB3;
    margin-top: 2px;
  }

  /* 本地备份 */
  .backup-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  .backup-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(139, 69, 19, 0.2);
    border-radius: 10px;
  }

  .backup-name {
    font-size: 14px;
    color: #F5DEB3;
  }

  .backup-time {
    font-size: 12px;
    color: #C9C4BA;
    margin-left: 8px;
  }

  .backup-actions {
    display: flex;
    gap: 6px;
  }

  /* 分支③冲突对比弹窗 */
  .conflict-modal {
    max-width: 560px;
  }

  .conflict-body {
    flex-direction: column;
    gap: 16px;
  }

  .conflict-tip {
    margin: 0;
    font-size: 13px;
    color: #F5F0E8;
  }

  .conflict-row {
    border: 1px solid rgba(139, 69, 19, 0.3);
    border-radius: 10px;
    padding: 10px;
  }

  .conflict-slot {
    font-size: 13px;
    color: #DAA520;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .conflict-compare {
    display: flex;
    gap: 12px;
  }

  .conflict-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(139, 69, 19, 0.2);
    border-radius: 8px;
  }

  .conflict-side {
    font-size: 12px;
    color: #C9C4BA;
  }

  .conflict-name {
    font-size: 15px;
    font-weight: bold;
    color: #F5DEB3;
  }

  .conflict-detail {
    font-size: 12px;
    color: #F5DEB3;
  }

  .conflict-time {
    font-size: 12px;
    color: #C9C4BA;
    margin-bottom: 4px;
  }
</style>
