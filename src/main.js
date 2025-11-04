import '@/styles/index.scss' // 全局样式

import { createApp } from 'vue'

import App from '@/App.vue'
import router from '@/router' // 路由

import { setupIcon } from './plugins' // 全局注册antd图标
import { setupStore } from './store' // 状态管理

async function setupApp() {
  const app = createApp(App)
  setupIcon(app)
  setupStore(app)
  app.use(router)
  app.mount('#app')
  app.config.performance = true
}

setupApp()
