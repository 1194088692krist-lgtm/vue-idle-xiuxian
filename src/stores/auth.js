// 账号 store：登录 / 注册 / 登出，token 持久化到 localStorage
import { defineStore } from 'pinia'

const TOKEN_KEY = 'xx_token'
const USER_KEY = 'xx_user'
const DEV_KEY = 'xx_dev'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
    // 开发者通道：免登录进入游戏，仅使用本地存档，跳过云同步
    // 专为智能体调试设计，无需密码，仅通过隐藏入口触发
    devMode: localStorage.getItem(DEV_KEY) === 'true'
  }),
  getters: {
    // 开发者模式下视为已登录，路由守卫放行
    isLoggedIn: s => !!s.token || s.devMode,
    isDev: s => s.devMode
  },
  actions: {
    async login(username, password) {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data.ok) throw new Error(data.error || '登录失败')
      this.token = data.token
      this.user = data.user
      localStorage.setItem(TOKEN_KEY, this.token)
      localStorage.setItem(USER_KEY, JSON.stringify(this.user))
      return data
    },
    async register(username, password) {
      const r = await fetch('/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data.ok) throw new Error(data.error || '注册失败')
      this.token = data.token
      this.user = data.user
      localStorage.setItem(TOKEN_KEY, this.token)
      localStorage.setItem(USER_KEY, JSON.stringify(this.user))
      return data
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
    authHeaders() {
      return this.token ? { Authorization: `Bearer ${this.token}` } : {}
    },
    // 开发者通道：直接启用，无需密码（专为智能体调试设计）
    enableDevMode() {
      this.devMode = true
      this.user = { username: '开发者', dev: true }
      localStorage.setItem(DEV_KEY, 'true')
    },
    disableDevMode() {
      this.devMode = false
      if (this.user && this.user.dev) this.user = null
      localStorage.removeItem(DEV_KEY)
    }
  }
})
