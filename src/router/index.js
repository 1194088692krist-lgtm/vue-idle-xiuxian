import { createRouter, createWebHashHistory } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import { useAuthStore } from '../stores/auth'
import StartScreen from '../views/StartScreen.vue'

// 路由级懒加载：除首屏 StartScreen 外，所有视图组件按需加载
// 修复「启动时所有页面组件同步导入，导致卡很久才开始读条」的问题
// Vite 会自动为每个动态 import 切出独立 chunk，首屏只下载 StartScreen + 主框架代码
const Home = () => import('../views/Home.vue')
const Cultivation = () => import('../views/Cultivation.vue')
const Inventory = () => import('../views/Inventory.vue')
const Exploration = () => import('../views/Exploration.vue')
const Guide = () => import('../views/Guide.vue')
const Settings = () => import('../views/Settings.vue')
const GM = () => import('../views/GM.vue')
const GMTools = () => import('../views/GMTools.vue')
const Alchemy = () => import('../views/Alchemy.vue')
const Gacha = () => import('../views/Gacha.vue')

const routes = [
  {
    path: '/',
    name: 'StartScreen',
    component: StartScreen
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresGame: true }
  },
  {
    path: '/cultivation',
    name: 'Cultivation',
    component: Cultivation,
    meta: { requiresGame: true }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: Inventory,
    meta: { requiresGame: true }
  },
  {
    path: '/exploration',
    name: 'Exploration',
    component: Exploration,
    meta: { requiresGame: true }
  },
  {
    path: '/guide',
    name: 'Guide',
    component: Guide,
    meta: { requiresGame: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresGame: true }
  },
  {
    path: '/gm',
    name: 'gm',
    component: GM,
    meta: { requiresGame: true },
    beforeEnter: (to, from, next) => {
      const playerStore = usePlayerStore()
      if (!playerStore.isGMMode) {
        next('/cultivation')
      } else {
        next()
      }
    }
  },
  {
    path: '/gm-tools',
    name: 'GMTools',
    component: GMTools,
    meta: { requiresGame: true },
    beforeEnter: (to, from, next) => {
      const playerStore = usePlayerStore()
      if (!playerStore.isGMMode) {
        next('/cultivation')
      } else {
        next()
      }
    }
  },
  {
    path: '/alchemy',
    name: 'alchemy',
    component: Alchemy,
    meta: { requiresGame: true }
  },
  {
    path: '/gacha',
    name: 'Gacha',
    component: Gacha,
    meta: { requiresGame: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresGame) {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      // 未登录：跳回开始界面
      next('/')
      return
    }
    const playerStore = usePlayerStore()
    if (playerStore.isNewPlayer && !playerStore.name) {
      next('/')
      return
    }
  }
  next()
})

export default router
