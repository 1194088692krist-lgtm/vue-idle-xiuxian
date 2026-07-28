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
    isDev: s => s.devMode,
    // token 是否已过期（前端解码 JWT payload.exp 判断，提前 60s 视为过期避免边界请求失败）
    // 用于在发起云同步前主动提示用户重新登录，而非等到 401
    tokenExpired: s => {
      if (!s.token) return false  // 无 token 时不报过期（由 isLoggedIn 拦截）
      try {
        const parts = s.token.split('.')
        if (parts.length !== 3) return true
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
        if (!payload.exp) return false
        return payload.exp < Date.now() + 60000  // 提前 60s 判定过期
      } catch {
        return true  // token 格式异常视为过期
      }
    }
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
      // 同时退出开发者模式：否则 devMode 仍为 true 会使 isLoggedIn 持续为真，
      // 表现为“开发者模式免登录后无法退出登录”
      this.devMode = false
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(DEV_KEY)
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
