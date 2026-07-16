<template>
  <div class="start-screen">
    <div class="start-bg"></div>
    <div class="bg-overlay"></div>
    <div class="start-content">
      <div class="game-title" @click="handleTitleClick">
        <div class="title-ornament top">✦ ✦ ✦</div>
        <div class="title-main">修仙问道</div>
        <div class="title-sub">Idle Cultivation</div>
        <div class="title-version">v1.1.0</div>
        <div class="title-ornament bottom">✦ ✦ ✦</div>
      </div>

      <!-- 未登录：登录 / 注册面板 -->
      <div v-if="!auth.isLoggedIn" class="auth-panel">
        <div class="auth-header">
          <div class="auth-title">登 录 修 仙</div>
          <div class="auth-sub">登录后即可开启云存档，多端续命</div>
        </div>
        <div class="auth-form">
          <div class="auth-field">
            <span class="auth-label">账 号</span>
            <input
              v-model="loginForm.username"
              class="auth-input"
              placeholder="请输入账号"
              maxlength="20"
              autocomplete="username"
            />
          </div>
          <div class="auth-field">
            <span class="auth-label">密 码</span>
            <input
              v-model="loginForm.password"
              type="password"
              class="auth-input"
              placeholder="请输入密码"
              maxlength="40"
              autocomplete="current-password"
              @keyup.enter="loginMode === 'login' ? handleLogin() : handleRegister()"
            />
          </div>
        </div>
        <div class="auth-buttons">
          <button
            class="btn-primary"
            :disabled="authBusy || !loginForm.username || !loginForm.password"
            @click="handleLogin"
          >
            <span class="btn-icon">🔑</span>
            <span class="btn-text">{{ authBusy && loginMode === 'login' ? '登录中…' : '登 录' }}</span>
          </button>
          <button
            class="btn-secondary"
            :disabled="authBusy || !loginForm.username || !loginForm.password"
            @click="handleRegister"
          >
            <span class="btn-icon">✨</span>
            <span class="btn-text">{{ authBusy && loginMode === 'register' ? '注册中…' : '注 册' }}</span>
          </button>
        </div>
        <div class="auth-hint">
          <span v-if="loginMode === 'login'">没有账号？<a @click="loginMode = 'register'">立即注册</a></span>
          <span v-else>已有账号？<a @click="loginMode = 'login'">前往登录</a></span>
        </div>
      </div>

      <!-- 已登录：主菜单 -->
      <template v-else>
        <div v-if="!showLoadMenu && !showCloudMenu" class="start-buttons">
          <div class="welcome-text">
            <span class="welcome-label">欢迎回来</span>
            <span class="welcome-name">{{ auth.user?.username }}</span>
          </div>
          <button class="btn-primary" @click="startNewGame">
            <span class="btn-icon">⚔</span>
            <span class="btn-text">新的开始</span>
          </button>
          <button class="btn-secondary" @click="showLoadMenu = true">
            <span class="btn-icon">📜</span>
            <span class="btn-text">读取存档</span>
          </button>
          <button class="btn-secondary" @click="showCloudMenu = true">
            <span class="btn-icon">☁</span>
            <span class="btn-text">云存档管理</span>
          </button>
          <button class="btn-logout" @click="handleLogout">
            <span class="btn-text">退出登录</span>
          </button>
        </div>

        <!-- 二级：读取存档 -->
        <div v-else-if="showLoadMenu" class="load-menu">
          <div class="menu-header">
            <button class="btn-back" @click="showLoadMenu = false">
              ← 返回
            </button>
            <span class="menu-title">选择存档</span>
            <span class="menu-spacer"></span>
          </div>

          <div class="slot-list">
            <div
              v-for="slot in saveSlots"
              :key="slot.slot"
              class="slot-item"
              :class="{ empty: !slot.name, damaged: slot.name === '存档损坏' }"
              @click="slot.name && slot.name !== '存档损坏' && loadGame(slot.slot)"
            >
              <div class="slot-number">{{ slot.slot }}</div>
              <div class="slot-info">
                <div class="slot-name">{{ slot.name || '空存档槽' }}</div>
                <div class="slot-realm" v-if="slot.realm">{{ slot.realm }}</div>
                <div class="slot-time" v-if="slot.saveTime">
                  {{ formatTime(slot.saveTime) }}
                </div>
              </div>
              <div class="slot-action">
                <button
                  v-if="slot.name && slot.name !== '存档损坏'"
                  class="btn-small btn-danger"
                  @click.stop="deleteSlot(slot.slot)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 二级：云存档管理 -->
        <div v-else-if="showCloudMenu" class="load-menu">
          <div class="menu-header">
            <button class="btn-back" @click="showCloudMenu = false">
              ← 返回
            </button>
            <span class="menu-title">云存档管理</span>
            <span class="menu-spacer"></span>
          </div>

          <div class="cloud-status">
            <span class="cloud-status-text">
              {{ playerStore.cloudSyncStatus || '当前账号：' + (auth.user?.username || '') }}
            </span>
          </div>

          <div class="cloud-buttons">
            <button class="btn-primary" :disabled="authBusy" @click="handleUploadToCloud">
              <span class="btn-icon">⬆</span>
              <span class="btn-text">上传本地到云端</span>
            </button>
            <button class="btn-secondary" :disabled="authBusy" @click="handleDownloadFromCloud">
              <span class="btn-icon">⬇</span>
              <span class="btn-text">下载云端覆盖本地</span>
            </button>
            <button class="btn-secondary" :disabled="authBusy" @click="handleSmartSync">
              <span class="btn-icon">🔄</span>
              <span class="btn-text">智能同步（合并）</span>
            </button>
          </div>

          <div class="cloud-hint">
            <p>· 上传：将本地全部存档槽位推送至云端</p>
            <p>· 下载：拉取云端覆盖本地（本地进度丢失）</p>
            <p>· 智能：对比各槽位时间戳，取最新者胜</p>
          </div>
        </div>
      </template>

      <div class="start-footer">
        <span>道可道 · 非常道</span>
      </div>
    </div>

    <!-- 分支③：云端 / 本地存档冲突对比弹窗 -->
    <div v-if="playerStore.cloudConflicts.length" class="modal-overlay" @click.self="cancelConflict">
      <div class="modal-content conflict-modal">
        <div class="modal-header">
          <h3>存档冲突</h3>
          <p class="modal-sub">检测到本地与云端都有存档，请为以下槽位选择保留哪一份</p>
        </div>
        <div class="modal-body conflict-body">
          <div v-for="c in playerStore.cloudConflicts" :key="c.slot" class="conflict-row">
            <div class="conflict-slot">槽位 {{ c.slot === 0 ? '当前档' : c.slot }}</div>
            <div class="conflict-compare">
              <div class="conflict-card local">
                <div class="conflict-side">本地存档</div>
                <div class="conflict-name">{{ c.local.name }}</div>
                <div class="conflict-detail">Lv.{{ c.local.level }} · {{ c.local.realm }}</div>
                <div class="conflict-time">{{ c.localTime ? formatTime(c.localTime) : '未知时间' }}</div>
                <button class="btn-conflict btn-local" @click="handleResolveConflict(c.slot, false)">用本地</button>
              </div>
              <div class="conflict-card cloud">
                <div class="conflict-side">云端存档</div>
                <div class="conflict-name">{{ c.cloud.name }}</div>
                <div class="conflict-detail">Lv.{{ c.cloud.level }} · {{ c.cloud.realm }}</div>
                <div class="conflict-time">{{ c.cloudTime ? formatTime(c.cloudTime) : '未知时间' }}</div>
                <button class="btn-conflict btn-cloud" @click="handleResolveConflict(c.slot, true)">用云端</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="resolveAllWithLocal">全部用本地</button>
          <button class="btn-primary" @click="resolveAllWithCloud">全部用云端</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { usePlayerStore } from '../stores/player'
import { useAuthStore } from '../stores/auth'
import { loadTheme } from '../plugins/theme'

const router = useRouter()
const playerStore = usePlayerStore()
const auth = useAuthStore()
const message = useMessage()
const dialog = useDialog()

const showLoadMenu = ref(false)
const showCloudMenu = ref(false)
const saveSlots = ref([])
const loginForm = ref({ username: '', password: '' })
const loginMode = ref('login')
const authBusy = ref(false)

const loadSlots = async () => {
  try {
    saveSlots.value = await playerStore.getSaveSlots()
  } catch (error) {
    console.error('加载存档槽位失败:', error)
  }
}

const startNewGame = async () => {
  try {
    dialog.warning({
      title: '开启新篇章',
      content: '开始新游戏将清空当前进度（仅清空内存中的活动档），是否继续？',
      positiveText: '确定开始',
      negativeText: '取消',
      onPositiveClick: async () => {
        await playerStore.clearData()
        playerStore.$reset()
        playerStore.initNewPlayer()
        await playerStore.saveData()
        // 已登录则自动云同步
        if (auth.isLoggedIn) {
          try { await playerStore.syncToCloud() } catch (e) { console.warn(e) }
        }
        router.push('/cultivation')
      }
    })
  } catch (error) {
    console.error('开始新游戏失败:', error)
  }
}

const loadGame = async (slot) => {
  try {
    await playerStore.loadFromSlot(slot)
    playerStore.regenerateSpirit() // 加载存档后恢复离线灵力
    // 已登录则自动云同步当前档
    if (auth.isLoggedIn) {
      try { await playerStore.syncToCloud() } catch (e) { console.warn(e) }
    }
    router.push('/cultivation')
  } catch (error) {
    console.error('加载存档失败:', error)
    message.error('加载存档失败: ' + error.message)
  }
}

const deleteSlot = async (slot) => {
  dialog.warning({
    title: '删除存档',
    content: '确定要删除这个存档吗？此操作不可恢复。',
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await playerStore.deleteSlot(slot)
        await loadSlots()
        message.success('已删除')
      } catch (error) {
        console.error('删除存档失败:', error)
        message.error('删除失败: ' + (error.message || error))
      }
    }
  })
}

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) return
  authBusy.value = true
  loginMode.value = 'login'
  try {
    const data = await auth.login(loginForm.value.username.trim(), loginForm.value.password)
    message.success(`欢迎回来，${data.user.username}`)
    loginForm.value.password = ''
    // 登录后拉取云端迁移（分支③冲突交由弹窗）
    try {
      const res = await playerStore.migrate({ interactive: true })
      if (!res.conflicts?.length) message.success('已与云端同步')
    } catch (e) {
      console.warn('云端迁移失败：', e)
    }
  } catch (e) {
    message.error('登录失败：' + (e.message || e))
  } finally {
    authBusy.value = false
  }
}

const handleRegister = async () => {
  if (!loginForm.value.username || !loginForm.value.password) return
  authBusy.value = true
  loginMode.value = 'register'
  try {
    const data = await auth.register(loginForm.value.username.trim(), loginForm.value.password)
    message.success(`注册成功，已自动登录 ${data.user.username}`)
    loginForm.value.password = ''
  } catch (e) {
    message.error('注册失败：' + (e.message || e))
  } finally {
    authBusy.value = false
  }
}

const handleLogout = () => {
  dialog.warning({
    title: '退出登录',
    content: '退出后将无法继续同步云存档，确定退出？',
    positiveText: '确定退出',
    negativeText: '取消',
    onPositiveClick: () => {
      auth.logout()
      message.success('已退出登录')
    }
  })
}

const handleUploadToCloud = () => {
  dialog.warning({
    title: '上传到云端',
    content: '确定将本地全部存档上传到云端？云端已有存档将被覆盖！',
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

const handleDownloadFromCloud = () => {
  dialog.warning({
    title: '从云端下载',
    content: '确定从云端下载存档覆盖本地？本地未上传的进度将丢失！',
    positiveText: '确定下载',
    negativeText: '取消',
    onPositiveClick: async () => {
      authBusy.value = true
      try {
        await playerStore.pullFromCloud()
        await loadSlots()
        message.success('已从云端下载')
      } catch (e) {
        message.error('下载失败：' + (e.message || e))
      } finally {
        authBusy.value = false
      }
    }
  })
}

const handleSmartSync = () => {
  dialog.info({
    title: '智能同步',
    content: '将自动比较各槽位时间戳，取最新者胜。是否继续？',
    positiveText: '开始同步',
    negativeText: '取消',
    onPositiveClick: async () => {
      authBusy.value = true
      try {
        const res = await playerStore.migrate({ interactive: false })
        const n = res?.conflicts?.length || 0
        message.success(n ? `已合并（${n} 个槽位云端较新已覆盖）` : '已是最新')
        await loadSlots()
      } catch (e) {
        message.error('同步失败：' + (e.message || e))
      } finally {
        authBusy.value = false
      }
    }
  })
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// ===== 冲突解决（分支③）=====
const handleResolveConflict = async (slot, useCloud) => {
  try {
    await playerStore.resolveConflict(slot, useCloud)
    if (!playerStore.cloudConflicts.length) {
      message.success('冲突已解决')
      await loadSlots()
    }
  } catch (e) {
    message.error('解决冲突失败：' + (e.message || e))
  }
}

const resolveAllWithLocal = async () => {
  for (const c of [...playerStore.cloudConflicts]) {
    await handleResolveConflict(c.slot, false)
  }
}

const resolveAllWithCloud = async () => {
  for (const c of [...playerStore.cloudConflicts]) {
    await handleResolveConflict(c.slot, true)
  }
}

const cancelConflict = () => {
  // 关闭冲突弹窗：用户选择稍后处理，清空列表（保留原云端数据）
  playerStore.cloudConflicts = []
  message.info('已跳过冲突解决，可到设置页处理')
}

let clickCount = 0
let clickTimer = null

const handleTitleClick = () => {
  clickCount++
  if (clickTimer) clearTimeout(clickTimer)
  if (clickCount >= 5) {
    playerStore.isGMMode = !playerStore.isGMMode
    localStorage.setItem('isGMMode', playerStore.isGMMode)
    message.success(playerStore.isGMMode ? 'GM模式已开启' : 'GM模式已关闭')
    clickCount = 0
  } else {
    clickTimer = setTimeout(() => {
      clickCount = 0
    }, 2000)
  }
}

onMounted(() => {
  loadTheme()
  loadSlots()
})
</script>

<style scoped>
.start-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 1000;
}

.start-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('https://i.postimg.cc/MpkhQqtd/start.png');
  background-size: cover;
  background-position: center top;
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.25) 20%,
    rgba(0, 0, 0, 0.35) 50%,
    rgba(0, 0, 0, 0.6) 80%,
    rgba(0, 0, 0, 0.8) 100%
  );
}

.bg-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    ellipse at center top,
    rgba(255, 215, 0, 0.15) 0%,
    transparent 50%
  );
}

.start-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 20px;
  max-width: 420px;
  width: 100%;
}

.game-title {
  margin-bottom: 40px;
  cursor: default;
}

.title-ornament {
  font-size: 14px;
  color: #B8860B;
  letter-spacing: 8px;
  text-shadow: 0 0 10px rgba(184, 134, 11, 0.5);
  margin-bottom: 12px;
}

.title-ornament.bottom {
  margin-bottom: 0;
  margin-top: 12px;
}

.title-main {
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif;
  font-size: 56px;
  color: #FFD700;
  text-shadow:
    0 0 12px rgba(255, 215, 0, 0.6),
    0 0 24px rgba(255, 215, 0, 0.4),
    0 0 36px rgba(255, 215, 0, 0.2),
    2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 10px;
  letter-spacing: 10px;
  font-weight: normal;
}

.title-sub {
  font-size: 14px;
  color: #DAA520;
  font-weight: 300;
  letter-spacing: 6px;
  margin-bottom: 6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.title-version {
  font-size: 11px;
  color: #8B7355;
  letter-spacing: 2px;
}

/* ===== 登录/注册面板 ===== */
.auth-panel {
  background: linear-gradient(180deg, rgba(15, 12, 8, 0.97) 0%, rgba(5, 4, 2, 0.98) 100%);
  border-radius: 4px;
  padding: 24px 22px 18px;
  border: 1px solid #8B6914;
  position: relative;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.8),
    0 0 60px rgba(218, 165, 32, 0.1),
    inset 0 1px 0 rgba(218, 165, 32, 0.1);
}

.auth-panel::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  bottom: 4px;
  border: 1px solid rgba(139, 105, 20, 0.3);
  pointer-events: none;
  border-radius: 2px;
}

.auth-header {
  margin-bottom: 18px;
  text-align: center;
}

.auth-title {
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif;
  font-size: 24px;
  color: #FFD700;
  letter-spacing: 6px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
  margin-bottom: 6px;
}

.auth-sub {
  font-size: 12px;
  color: #8B7355;
  letter-spacing: 1px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.auth-field {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(10, 8, 5, 0.7);
  border: 1px solid rgba(139, 105, 20, 0.4);
  border-radius: 2px;
  padding: 0 12px;
  transition: all 0.2s ease;
}

.auth-field:focus-within {
  border-color: #DAA520;
  box-shadow: 0 0 0 1px rgba(218, 165, 32, 0.25);
}

.auth-label {
  font-size: 13px;
  color: #8B7355;
  letter-spacing: 2px;
  flex-shrink: 0;
  font-family: 'Ma Shan Zheng', serif;
}

.auth-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #F5DEB3;
  font-size: 14px;
  padding: 12px 0;
  font-family: inherit;
  letter-spacing: 1px;
}

.auth-input::placeholder {
  color: #5B4B2F;
}

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.auth-hint {
  text-align: center;
  font-size: 12px;
  color: #8B7355;
  letter-spacing: 1px;
}

.auth-hint a {
  color: #DAA520;
  cursor: pointer;
  text-decoration: none;
  border-bottom: 1px dashed rgba(218, 165, 32, 0.4);
  padding-bottom: 1px;
  margin-left: 4px;
  transition: all 0.2s ease;
}

.auth-hint a:hover {
  color: #FFD700;
  border-bottom-color: #FFD700;
}

/* ===== 已登录主菜单 ===== */
.welcome-text {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.welcome-label {
  font-size: 12px;
  color: #8B7355;
  letter-spacing: 4px;
}

.welcome-name {
  font-family: 'Ma Shan Zheng', serif;
  font-size: 20px;
  color: #FFD700;
  letter-spacing: 3px;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

.start-buttons {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
}

.btn-primary,
.btn-secondary,
.btn-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 48px;
  border-radius: 2px;
  font-size: 17px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  width: 100%;
  max-width: 300px;
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: linear-gradient(135deg, #8B6914 0%, #DAA520 50%, #FFD700 100%);
  color: #0a0a0a;
  border: 2px solid #FFD700;
  box-shadow:
    0 4px 20px rgba(218, 165, 32, 0.5),
    0 0 40px rgba(218, 165, 32, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border: 1px solid rgba(139, 105, 20, 0.5);
  pointer-events: none;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 6px 28px rgba(255, 215, 0, 0.6),
    0 0 60px rgba(255, 215, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-secondary {
  background: rgba(10, 10, 10, 0.85);
  color: #DAA520;
  border: 2px solid #8B6914;
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(218, 165, 32, 0.1);
}

.btn-secondary::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border: 1px solid rgba(139, 105, 20, 0.3);
  pointer-events: none;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(20, 15, 5, 0.9);
  border-color: #DAA520;
  color: #FFD700;
  box-shadow:
    0 4px 15px rgba(218, 165, 32, 0.3),
    inset 0 1px 0 rgba(218, 165, 32, 0.2);
}

.btn-logout {
  background: transparent;
  color: #8B7355;
  border: 1px dashed rgba(139, 105, 20, 0.4);
  font-size: 13px;
  padding: 10px 32px;
  font-weight: normal;
}

.btn-logout:hover {
  color: #CD5C5C;
  border-color: rgba(205, 92, 92, 0.5);
  background: rgba(40, 10, 5, 0.4);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 18px;
}

.btn-text {
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif;
  letter-spacing: 4px;
  font-weight: normal;
}

/* ===== 二级菜单（读取存档 / 云存档） ===== */
.load-menu {
  background: linear-gradient(180deg, rgba(15, 12, 8, 0.97) 0%, rgba(5, 4, 2, 0.98) 100%);
  border-radius: 4px;
  padding: 22px 18px;
  backdrop-filter: blur(8px);
  border: 1px solid #8B6914;
  position: relative;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.8),
    0 0 60px rgba(218, 165, 32, 0.1),
    inset 0 1px 0 rgba(218, 165, 32, 0.1);
}

.load-menu::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  bottom: 4px;
  border: 1px solid rgba(139, 105, 20, 0.3);
  pointer-events: none;
  border-radius: 2px;
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(139, 105, 20, 0.4);
}

.btn-back {
  background: transparent;
  border: none;
  color: #8B7355;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-family: 'Ma Shan Zheng', serif;
}

.btn-back:hover {
  background: rgba(218, 165, 32, 0.1);
  color: #DAA520;
}

.menu-title {
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif;
  font-size: 20px;
  color: #FFD700;
  letter-spacing: 4px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
}

.menu-spacer {
  width: 60px;
}

.slot-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: linear-gradient(180deg, rgba(20, 16, 10, 0.9) 0%, rgba(10, 8, 5, 0.95) 100%);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid rgba(139, 105, 20, 0.3);
}

.slot-item:hover:not(.empty):not(.damaged) {
  background: linear-gradient(180deg, rgba(30, 24, 12, 0.95) 0%, rgba(15, 12, 6, 0.98) 100%);
  border-color: #DAA520;
  box-shadow:
    0 2px 12px rgba(218, 165, 32, 0.2),
    inset 0 1px 0 rgba(218, 165, 32, 0.1);
}

.slot-item.empty {
  cursor: default;
  opacity: 0.4;
}

.slot-item.damaged {
  cursor: default;
  opacity: 0.5;
  border-color: rgba(178, 34, 34, 0.4);
}

.slot-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1510 0%, #0a0805 100%);
  color: #DAA520;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  border: 1px solid #8B6914;
  font-family: 'Ma Shan Zheng', serif;
  flex-shrink: 0;
}

.slot-info {
  flex: 1;
  text-align: left;
  min-width: 0;
}

.slot-name {
  font-size: 14px;
  color: #F5DEB3;
  margin-bottom: 2px;
  font-family: 'Ma Shan Zheng', serif;
  letter-spacing: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot-realm {
  font-size: 11px;
  color: #DAA520;
  margin-bottom: 2px;
}

.slot-time {
  font-size: 10px;
  color: #665544;
}

.slot-action {
  flex-shrink: 0;
}

.btn-small {
  padding: 5px 12px;
  border-radius: 2px;
  font-size: 11px;
  border: 1px solid rgba(178, 34, 34, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Ma Shan Zheng', serif;
  letter-spacing: 2px;
}

.btn-danger {
  background: rgba(30, 10, 5, 0.8);
  color: #CD5C5C;
}

.btn-danger:hover {
  background: rgba(50, 15, 10, 0.9);
  border-color: rgba(205, 92, 92, 0.6);
}

/* ===== 云存档菜单 ===== */
.cloud-status {
  text-align: center;
  margin-bottom: 14px;
  padding: 8px 12px;
  background: rgba(10, 8, 5, 0.6);
  border: 1px solid rgba(139, 105, 20, 0.3);
  border-radius: 2px;
}

.cloud-status-text {
  font-size: 12px;
  color: #DAA520;
  letter-spacing: 1px;
}

.cloud-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.cloud-buttons .btn-primary,
.cloud-buttons .btn-secondary {
  font-size: 15px;
  padding: 14px 32px;
  max-width: none;
}

.cloud-hint {
  font-size: 11px;
  color: #8B7355;
  line-height: 1.8;
  text-align: left;
  padding: 0 6px;
  letter-spacing: 0.5px;
}

.cloud-hint p {
  margin: 0;
}

.start-footer {
  margin-top: 50px;
  font-size: 12px;
  color: #6B5B3F;
  letter-spacing: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  font-family: 'Ma Shan Zheng', serif;
}

@media (min-width: 769px) {
  .start-screen {
    max-width: 520px;
    margin: 0 auto;
    border-left: 1px solid rgba(139, 105, 20, 0.3);
    border-right: 1px solid rgba(139, 105, 20, 0.3);
    box-shadow: 0 0 60px rgba(0, 0, 0, 0.8);
  }
}

/* ===== 冲突对比弹窗 ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.conflict-modal {
  background: linear-gradient(180deg, rgba(15, 12, 8, 0.98) 0%, rgba(5, 4, 2, 0.99) 100%);
  border-radius: 4px;
  border: 1px solid #8B6914;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px 18px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.9), 0 0 60px rgba(218, 165, 32, 0.15);
  position: relative;
}

.conflict-modal::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  bottom: 4px;
  border: 1px solid rgba(139, 105, 20, 0.3);
  pointer-events: none;
  border-radius: 2px;
}

.conflict-modal .modal-header {
  text-align: center;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(139, 105, 20, 0.4);
}

.conflict-modal .modal-header h3 {
  margin: 0 0 6px;
  font-family: 'Ma Shan Zheng', serif;
  font-size: 22px;
  color: #FFD700;
  letter-spacing: 4px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
}

.modal-sub {
  margin: 0;
  font-size: 11px;
  color: #8B7355;
  letter-spacing: 1px;
}

.conflict-row {
  margin-bottom: 12px;
  padding: 10px;
  background: rgba(10, 8, 5, 0.6);
  border: 1px solid rgba(139, 105, 20, 0.3);
  border-radius: 2px;
}

.conflict-slot {
  text-align: center;
  font-size: 12px;
  color: #DAA520;
  letter-spacing: 2px;
  margin-bottom: 8px;
  font-family: 'Ma Shan Zheng', serif;
}

.conflict-compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.conflict-card {
  padding: 10px 8px;
  background: rgba(20, 16, 10, 0.9);
  border: 1px solid rgba(139, 105, 20, 0.4);
  border-radius: 2px;
  text-align: center;
}

.conflict-card.cloud {
  border-color: rgba(100, 149, 237, 0.4);
}

.conflict-side {
  font-size: 11px;
  color: #8B7355;
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.conflict-card.cloud .conflict-side {
  color: #6495ED;
}

.conflict-name {
  font-size: 14px;
  color: #F5DEB3;
  font-family: 'Ma Shan Zheng', serif;
  letter-spacing: 1px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conflict-detail {
  font-size: 11px;
  color: #DAA520;
  margin-bottom: 4px;
}

.conflict-time {
  font-size: 10px;
  color: #665544;
  margin-bottom: 8px;
}

.btn-conflict {
  width: 100%;
  padding: 6px;
  border: 1px solid;
  border-radius: 2px;
  font-size: 12px;
  font-family: 'Ma Shan Zheng', serif;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-local {
  background: rgba(40, 80, 40, 0.6);
  color: #98FB98;
  border-color: rgba(152, 251, 152, 0.4);
}

.btn-local:hover {
  background: rgba(60, 120, 60, 0.7);
  border-color: #98FB98;
}

.btn-cloud {
  background: rgba(30, 60, 100, 0.6);
  color: #87CEEB;
  border-color: rgba(135, 206, 235, 0.4);
}

.btn-cloud:hover {
  background: rgba(50, 90, 150, 0.7);
  border-color: #87CEEB;
}

.conflict-modal .modal-footer {
  display: flex;
  gap: 10px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(139, 105, 20, 0.4);
}

.conflict-modal .modal-footer .btn-primary,
.conflict-modal .modal-footer .btn-secondary {
  flex: 1;
  font-size: 14px;
  padding: 10px;
  max-width: none;
}
</style>
