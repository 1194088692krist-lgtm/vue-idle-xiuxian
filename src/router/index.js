import { createRouter, createWebHashHistory } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import StartScreen from '../views/StartScreen.vue'
import Home from '../views/Home.vue'
import Cultivation from '../views/Cultivation.vue'
import Inventory from '../views/Inventory.vue'
import Exploration from '../views/Exploration.vue'
import Guide from '../views/Guide.vue'
import Settings from '../views/Settings.vue'
import GM from '../views/GM.vue'
import GMTools from '../views/GMTools.vue'
import Alchemy from '../views/Alchemy.vue'
import Gacha from '../views/Gacha.vue'

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
    const playerStore = usePlayerStore()
    if (playerStore.isNewPlayer && !playerStore.name) {
      next('/')
      return
    }
  }
  next()
})

export default router
