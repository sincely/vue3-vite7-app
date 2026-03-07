import { createRouter, createWebHashHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

import layouts from '@/layouts/index.vue'
import home from '@/views/home/index.vue'
import { useUserStore } from '@/store/modules/user'

const files = import.meta.glob('./modules/*.js', {
  eager: true
})
// 路由暂存
const routeModuleList = []

// 遍历路由模块
Object.keys(files).forEach((key) => {
  const module = files[key].default || {}
  const moduleList = Array.isArray(module) ? [...module] : [module]
  routeModuleList.push(...moduleList)
})

// 存放动态路由
const asyncRouterList = [...routeModuleList]

// 存放固定路由
const defaultRouterList = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登录',
      keepAlive: false
    }
  },
  {
    path: '/',
    component: layouts,
    redirect: '/home',
    children: [
      {
        path: '/home',
        component: home,
        name: 'home',
        meta: {
          title: '首页',
          keepAlive: true
        }
      }
    ]
  }
]

const routes = [...defaultRouterList, ...asyncRouterList]
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return {
      el: '#app',
      top: 0,
      behavior: 'smooth'
    }
  }
})

// 白名单
const whiteList = ['/login', '/404']

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  const userStore = useUserStore()
  const { token } = userStore

  if (token) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      if (userStore.userInfo) {
        next()
      } else {
        try {
          await userStore.getUserInfoAction()
          next({ ...to, replace: true })
        } catch (error) {
          userStore.resetUserState()
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
