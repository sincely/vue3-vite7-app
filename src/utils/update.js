// import { ElMessageBox } from 'element-plus'
// import 'element-plus/es/components/message-box/style/index'
// 存储本地版本号
let localHash = null
// 记录已提示过的服务端版本，避免重复弹窗
let notifiedHash = null
// 防止弹窗并发/重复打开
let isUpdateDialogVisible = false

// 检测间隔 (毫秒)，建议 60秒 或 5分钟
const CHECK_INTERVAL = 5 * 1000

async function checkAppVersion() {
  try {
    // 1. 请求 version.json
    // 必须加上时间戳参数 t=... 防止浏览器缓存这个 GET 请求本身
    const res = await fetch(`/version.json?t=${Date.now()}`)

    if (!res.ok) throw new Error('Version file not found')

    const data = await res.json()
    const serverHash = data.version

    // 2. 首次加载，只记录不比对
    if (!localHash) {
      localHash = serverHash
      console.log(`-----------------------[Updater] 当前版本已锁定-----------------------: ${localHash}`)
      return
    }

    // 3. 比对版本
    if (serverHash !== localHash) {
      // 同一新版本只提示一次；弹窗已显示时不重复提示
      if (notifiedHash === serverHash || isUpdateDialogVisible) return

      notifiedHash = serverHash
      console.log(`-----------------[Updater] 检测到新版本------------------------: ${serverHash} (当前: ${localHash})`)

      showUpdateNotification()
    }

    console.log(`----------------------[Test] 执行检测-----------------------: ${localHash}`)
  } catch (err) {
    // 静默失败，不打扰用户 (可能是网络波动)
    console.warn('---------------------[Updater] 版本检测失败:--------------------------', err)
  }
}

async function showUpdateNotification() {
  if (isUpdateDialogVisible) return
  isUpdateDialogVisible = true

  try {
    // const { ElMessageBox } = await import('element-plus')

    await ElMessageBox.confirm('系统检测到有新版本发布，请点击"确定"刷新页面以获取最新功能。', '版本更新提示', {
      confirmButtonText: '立即刷新',
      cancelButtonText: '稍后再说',
      type: 'warning',
      center: true,
      modal: false // 不遮罩背景
    })

    window.location.reload()
  } catch {
    // 用户点击取消，不做任何操作
  } finally {
    isUpdateDialogVisible = false
  }
}

// --- 启动检测监听 ---

// 1. 启动定时轮询
setInterval(checkAppVersion, CHECK_INTERVAL)

// 2. 智能监听：当用户切换标签页回来时，立即检查一次
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkAppVersion()
  }
})

// 3. 初始化检查
checkAppVersion()
