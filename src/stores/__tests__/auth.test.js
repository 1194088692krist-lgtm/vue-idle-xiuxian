import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

// 登出回归测试：开发者模式免登录后也必须能真正退出
describe('auth 登出（修复：开发者模式免登录后无法退出登录）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('开发者模式下 logout 后真正退出：isLoggedIn=false 且 devMode 清除', () => {
    const auth = useAuthStore()
    auth.enableDevMode()
    expect(auth.isLoggedIn).toBe(true)
    expect(auth.devMode).toBe(true)

    auth.logout()

    // 关键：logout 必须让 isLoggedIn 变回 false，否则路由守卫继续放行、UI 仍显示已登录
    expect(auth.isLoggedIn).toBe(false)
    expect(auth.devMode).toBe(false)
    expect(localStorage.getItem('xx_dev')).toBeNull()
  })

  it('正常登录后 logout 清除 token', () => {
    const auth = useAuthStore()
    auth.token = 'abc'
    localStorage.setItem('xx_token', 'abc')
    expect(auth.isLoggedIn).toBe(true)

    auth.logout()
    expect(auth.isLoggedIn).toBe(false)
    expect(localStorage.getItem('xx_token')).toBeNull()
  })

  it('disableDevMode 单独调用也应清掉 devMode 与本地标记', () => {
    const auth = useAuthStore()
    auth.enableDevMode()
    auth.disableDevMode()
    expect(auth.devMode).toBe(false)
    expect(auth.isLoggedIn).toBe(false)
    expect(localStorage.getItem('xx_dev')).toBeNull()
  })
})
