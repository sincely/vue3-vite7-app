import * as elementIcons from '@element-plus/icons-vue'
// 全局注册antd图标
export default function setupIcon(app) {
  Object.keys(elementIcons).forEach((key) => {
    app.component(key, elementIcons[key])
  })
}
