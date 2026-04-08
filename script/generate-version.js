import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取当前模块的路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 定义版本号
const versionInfo = {
  version: Date.now(),
  releaseTime: new Date().toLocaleString()
}

// 确定输出路径（项目根目录/public）
const outputDir = path.resolve(__dirname, '../public')
// 先写入 public 目录，打包时会自动复制到 dist

const filePath = path.join(outputDir, 'version.json')

// 写入文件
fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(filePath, JSON.stringify(versionInfo, null, 2))

console.log(`✅ [Version] 版本文件已生成: ${filePath}`)
console.log(`✅ [Version] 当前版本标识: ${versionInfo.version}`)
