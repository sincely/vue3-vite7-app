import { createRouter, createWebHashHistory } from 'vue-router'

import layouts from '@/layouts/index.vue'
import home from '@/views/home/index.vue'

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

export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
