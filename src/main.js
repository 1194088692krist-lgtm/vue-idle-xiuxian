import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/theme.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

// 注册 Service Worker：缓存静态资源（人物头像/怪物头像/图标/UI/背景图）到本地
// 二次访问直接从 Cache Storage 返回，零网络等待；用户不清浏览器数据即可永久命中
// 仅在生产环境注册（开发环境 vite HMR 频繁变化，SW 会干扰调试）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .catch(err => console.warn('[SW] 注册失败：', err.message))
  })
  // 修复：监听 SW 更新，新 SW 接管后自动刷新页面。
  // 否则用户浏览器永远停留在旧 JS（旧 bug 不会消失），即使新代码已部署。
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}
