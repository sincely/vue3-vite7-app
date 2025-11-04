import 'nprogress/nprogress.css'

import NProgress from 'nprogress'
import { createRouter, createWebHistory } from 'vue-router'

import { useUserStore } from '@/store/user'
import { showToast } from '@/utils/toast'

// 静态路由
export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', hidden: true }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'dashboard' }
      }
    ]
  }
]

// 异步路由(需要根据权限动态加载)
export const asyncRoutes = [
  {
    path: '/system',
    component: () => import('@/layout/index.vue'),
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'system', roles: ['admin'] },
    children: [
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/system/user/index.vue'),
        meta: { title: '用户管理', permissions: ['system:user:list'] }
      },
      {
        path: 'role',
        name: 'Role',
        component: () => import('@/views/system/role/index.vue'),
        meta: { title: '角色管理', permissions: ['system:role:list'] }
      }
    ]
  },
  // 通配符路由，必须放在最后
  { path: '/:pathMatch(.*)*', redirect: '/404', meta: { hidden: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ top: 0 })
})

// 白名单
const whiteList = ['/login', '/404']

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  NProgress.start()

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 后台管理系统` : '后台管理系统'

  const userStore = useUserStore()
  const { token } = userStore

  if (token) {
    if (to.path === '/login') {
      // 已登录，跳转到首页
      next({ path: '/' })
      NProgress.done()
    } else {
      if (userStore.userInfo) {
        next()
      } else {
        try {
          // 获取用户信息
          await userStore.getUserInfoAction()

          // 动态添加路由
          const accessRoutes = filterAsyncRoutes(asyncRoutes, userStore)
          accessRoutes.forEach((route) => {
            router.addRoute(route)
          })

          // 重定向到同一个路由会导致死循环，所以需要判断
          next({ ...to, replace: true })
        } catch (error) {
          // 用户信息获取失败，登出
          userStore.resetUserState()
          showToast('登录状态已过期，请重新登录', 'error')
          next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
          NProgress.done()
        }
      }
    }
  } else {
    // 未登录
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
      NProgress.done()
    }
  }
})

// 全局后置守卫
router.afterEach(() => {
  NProgress.done()
})

/**
 * 过滤异步路由
 */
function filterAsyncRoutes(routes, userStore) {
  const res = []

  routes.forEach((route) => {
    const tmp = { ...route }
    if (hasPermission(tmp, userStore)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, userStore)
      }
      res.push(tmp)
    }
  })

  return res
}

/**
 * 检查路由权限
 */
function hasPermission(route, userStore) {
  if (route.meta) {
    // 检查角色权限
    if (route.meta.roles) {
      return route.meta.roles.some((role) => userStore.roles.includes(role))
    }

    // 检查细粒度权限
    if (route.meta.permissions) {
      return route.meta.permissions.some((permission) => userStore.permissions.includes(permission))
    }
  }

  return true
}

export default router
