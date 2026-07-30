import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/theme.css'
import { installDebugLog } from './composables/useDebugLog'

// 启用日志收集（环形缓冲 200 条，dev/prod 都启用，供调试面板查看）
// 必须在 createApp 之前安装，才能拦截到 Vue 初始化期间的日志
installDebugLog()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

// 启动时立即同步「禁用下拉刷新」状态到 <html>（默认锁定，避免首屏未加载完时误触刷新丢档）
// 必须在 mount 之后、player store initializePlayer 之前生效，所以从 localStorage 直接读取
try {
  const ptrSaved = localStorage.getItem('disablePullToRefresh')
  const disabled = ptrSaved === null ? true : ptrSaved === 'true'
  if (disabled) document.documentElement.classList.add('disable-pull-refresh')
} catch (e) { /* localStorage 不可用时静默兜底 */ }

// 启动时立即同步特效档位到 <html>（CSS 通过 html.fx-low/medium 控制动画降级）
// 必须在 player store initializePlayer 之前生效，避免首屏闪过全特效再降级的抖动
try {
  const fxq = localStorage.getItem('fxQuality')
  const quality = (fxq === 'high' || fxq === 'medium' || fxq === 'low')
    ? fxq
    : (window.innerWidth <= 768 ? 'medium' : 'high')
  document.documentElement.classList.add('fx-' + quality)
} catch (e) { /* localStorage 不可用时静默兜底，默认全特效 */ }

// 注册 Service Worker：缓存静态资源（人物头像/怪物头像/图标/UI/背景图）到本地
// 二次访问直接从 Cache Storage 返回，零网络等待；用户不清浏览器数据即可永久命中
// 仅在生产环境注册（开发环境 vite HMR 频繁变化，SW 会干扰调试）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .catch(err => console.warn('[SW] 注册失败：', err.message))
  })
  // 修复（严重 bug）：原实现监听 SW controllerchange 后无条件 window.location.reload()，
  // 导致每次站点部署后所有在线玩家页面被强制刷新，挂机中断、存档可能丢失。
  // 改为：不自动 reload，仅提示用户「有新版本」，由用户主动刷新。
  // 新版本会在下次自然进入页面时生效（SW 已 skipWaiting 接管，旧 JS 仍在内存跑完当前会话）。
  // 这样挂机中的玩家不会被中断，玩家可在挂机结束后自行刷新获取新版本。
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_UPDATED') {
      // 仅提示一次，避免重复弹窗
      if (window.__swUpdateNotified) return
      window.__swUpdateNotified = true
      console.info('[SW] 检测到新版本，将在下次启动时生效。如需立即更新请手动刷新页面。')
      // 非阻塞提示：不使用 alert/confirm，避免打断挂机
      try {
        const banner = document.createElement('div')
        banner.textContent = '游戏有新版本，下次启动自动生效（当前挂机不受影响）'
        banner.style.cssText = [
          'position:fixed', 'bottom:16px', 'left:50%', 'transform:translateX(-50%)',
          'background:rgba(0,0,0,0.85)', 'color:#FFD700', 'padding:10px 20px',
          'border-radius:8px', 'font-size:13px', 'z-index:99999',
          'box-shadow:0 4px 12px rgba(0,0,0,0.4)', 'max-width:90vw', 'text-align:center',
          'pointer-events:none', 'opacity:0', 'transition:opacity 0.4s'
        ].join(';')
        document.body.appendChild(banner)
        requestAnimationFrame(() => { banner.style.opacity = '1' })
        // 6s 后自动消失
        setTimeout(() => {
          banner.style.opacity = '0'
          setTimeout(() => banner.remove(), 400)
        }, 6000)
      } catch (e) { /* DOM 操作失败则静默，仅 console 提示 */ }
    }
  })
}
