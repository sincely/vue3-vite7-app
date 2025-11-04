import 'nprogress/nprogress.css'

import axios from 'axios'
import md5 from 'md5'
import NProgress from 'nprogress'

import { useAppStore } from '@/store/modules/app'
import { useUserStore } from '@/store/modules/user'
import { closeToast, showToast } from '@/utils/toast'
// https://juejin.cn/post/7481117237729280000#heading-20
// 设置取消请求的 token
const { CancelToken } = axios
const pendingRequests = new Map() // 用于存储请求队列

// 生成请求 MD5 值的函数
const generateRequestKey = (config) => {
  const { method, url, params, data } = config
  // 使用时间戳确保每次请求 key 唯一 如果单位时间内防止重复请求的话时间条件和逻辑修改一下
  const timestamp = Date.now()
  const requestKey = `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}:${timestamp}`
  return md5(requestKey)
}

// 添加请求到队列
const addRequestToQueue = (config) => {
  if (config.cancelRequest === false) return

  const requestKey = generateRequestKey(config)
  config.cancelToken = new CancelToken((cancel) => {
    // 如果请求队列中没有该请求，则添加
    if (!pendingRequests.has(requestKey)) {
      pendingRequests.set(requestKey, cancel)
    }
  })

  console.log('pendingRequests', pendingRequests)
}

// 移除队列中的请求
const removePendingRequest = (config) => {
  if (config.cancelRequest === false) return

  const requestKey = generateRequestKey(config)
  // 如果请求队列中有该请求，则取消
  if (pendingRequests.has(requestKey)) {
    const cancel = pendingRequests.get(requestKey)
    cancel(requestKey)
    pendingRequests.delete(requestKey)
  }
}

// 清空请求队列（用于页面切换时取消请求）
export const clearRequestQueue = () => {
  pendingRequests.forEach((cancel, key) => {
    cancel(key)
  })
  pendingRequests.clear()
}

// 根据环境变量设置基础URL
const baseURL = process.env.NODE_ENV === 'production' ? import.meta.env.VITE_BASE_URL : import.meta.env.VITE_BASE_URL

// 创建 axios 实例
const service = axios.create({
  baseURL, // 根据环境变量设置基础URL
  timeout: 5000 // 超时时间
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const appStore = useAppStore()
    const userStore = useUserStore()
    // 显示全局loading
    if (config.showLoading !== false) {
      appStore.setLoading(true)
    }

    // 显示局部loading
    if (config.loadingTarget) {
      appStore.addLoadingTarget(config.loadingTarget)
    }

    // 启动进度条
    NProgress.start()
    // 添加请求到队列，防止重复请求
    removePendingRequest(config)
    addRequestToQueue(config)
    // 添加token
    const { token } = userStore
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      }
    }

    return config
  },
  (error) => {
    // 关闭进度条
    NProgress.done()
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const appStore = useAppStore()
    const { config } = response

    // 请求完成后移除请求
    removePendingRequest(config)

    // 关闭loading
    if (config.showLoading !== false) {
      appStore.setLoading(false)
    }

    // 关闭局部loading
    if (config.loadingTarget) {
      appStore.removeLoadingTarget(config.loadingTarget)
    }

    // 处理二进制数据
    if (response.request.responseType === 'blob' || response.request.responseType === 'arraybuffer') {
      return response.data
    }

    const { code, data, message } = response.data

    // 业务逻辑错误
    if (code !== 0 && code !== 200) {
      if (config.showErrorMessage !== false) {
        showToast(message || '请求失败', 'error')
      }
      return Promise.reject(new Error(message || '请求失败'))
    }

    // 缓存数据
    // if (config.cache) {
    //   const cacheKey = config.cacheKey || generateRequestKey(config)
    //   const cacheTime = config.cacheTime || 60 * 5 // 默认缓存5分钟
    //   const cacheData = {
    //     data,
    //     expire: Date.now() + cacheTime * 1000
    //   }
    //   localStorage.setItem(`http_cache_${cacheKey}`, JSON.stringify(cacheData))
    // }
    return data
  },
  (error) => {
    // 关闭进度条
    NProgress.done()
    const appStore = useAppStore()
    const userStore = useUserStore()

    // 关闭所有loading
    appStore.setLoading(false)
    appStore.clearLoadingTargets()

    // 取消请求不报错
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const config = error.config || {}

    // 请求完成后移除请求
    if (config) {
      removePendingRequest(config)
    }

    // 处理401未授权
    if (error.response?.status === 401) {
      userStore.logout()
      router.push('/login')
      showToast('登录已过期，请重新登录', 'warning')
      return Promise.reject(error)
    }

    // 处理网络错误
    // if (!navigator.onLine) {
    //   showToast('网络已断开，请检查网络连接', 'error')
    //   return Promise.reject(new Error('网络已断开，请检查网络连接'))
    // }

    // 处理超时
    if (error.message.includes('timeout')) {
      showToast('请求超时，请稍后重试', 'error')
      return Promise.reject(new Error('请求超时，请稍后重试'))
    }

    // 处理其他错误
    if (config.showErrorMessage !== false) {
      showToast(error.message || '请求失败', 'error')
    }
    return Promise.reject(error)
  }
)

export default service
