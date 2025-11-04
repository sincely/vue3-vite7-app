import { createVNode, render } from 'vue'

import Toast from '@/components/Toast/index.vue'

let toastInstance = null

export function showToast(message, type = 'info') {
  // 关闭已存在的Toast
  if (toastInstance) {
    closeToast()
  }

  // 处理参数
  const options = typeof message === 'string' ? { message, type } : { ...message }

  // 创建容器
  const container = document.createElement('div')
  container.className = 'toast-container'

  // 创建VNode
  const vnode = createVNode(Toast, {
    ...options,
    onDestroy: () => {
      render(null, container)
      document.body.removeChild(container)
      toastInstance = null
      options.onClose?.()
    }
  })

  // 渲染
  render(vnode, container)
  document.body.appendChild(container)

  // 保存实例
  toastInstance = vnode.component
}

export function closeToast() {
  if (toastInstance) {
    toastInstance.exposed.close()
  }
}
