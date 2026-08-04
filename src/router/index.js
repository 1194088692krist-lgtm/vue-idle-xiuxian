import { createRouter, createWebHashHistory } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import { useAuthStore } from '../stores/auth'

// 视图全部改为路由懒加载：首屏只加载入口视图对应 chunk，
// 其余页面（宗门/背包/探索/八卦炉/抽卡等）按需分包，显著降低首屏 JS 体积
const routes = [
  {
    path: '/',
    name: 'StartScreen',
    component: () => import('../views/StartScreen.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresGame: true }
  },
  {
    path: '/cultivation',
    name: 'Cultivation',
    component: () => import('../views/Cultivation.vue'),
    meta: { requiresGame: true }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('../views/Inventory.vue'),
    meta: { requiresGame: true }
  },
  {
    path: '/exploration',
    name: 'Exploration',
    component: () => import('../views/Exploration.vue'),
    meta: { requiresGame: true }
  },
  {
    path: '/guide',
    name: 'Guide',
    component: () => import('../views/Guide.vue'),
    meta: { requiresGame: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresGame: true }
  },
  {
    path: '/gm',
    name: 'gm',
    component: () => import('../views/GM.vue'),
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
    component: () => import('../views/GMTools.vue'),
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
    component: () => import('../views/Alchemy.vue'),
    meta: { requiresGame: true }
  },
  {
    path: '/gacha',
    name: 'Gacha',
    component: () => import('../views/Gacha.vue'),
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
