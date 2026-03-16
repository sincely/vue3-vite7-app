#!/usr/bin/env node

// const { execSync } = require('child_process')
// const fs = require('fs')

import { execSync } from 'child_process'
import fs from 'fs'

// ============================================================
// 环境配置
// ============================================================
const ENVIRONMENTS = {
  dev: {
    dockerfile: 'Dockerfile.dev',
    imageName: 'vue3-vite7-app',
    imageTag: 'dev',
    buildArgs: [],
    shouldExport: false
  },
  test: {
    dockerfile: 'Dockerfile',
    imageName: 'vue3-vite7-app',
    imageTag: 'test',
    buildArgs: ['--build-arg', 'BUILD_MODE=test'],
    shouldExport: true
  },
  production: {
    dockerfile: 'Dockerfile',
    imageName: 'vue3-vite7-app',
    imageTag: 'production',
    buildArgs: ['--build-arg', 'BUILD_MODE=production'],
    shouldExport: true
  }
}

// ============================================================
// 解析参数
// ============================================================
function parseArgs() {
  const args = process.argv.slice(2)

  // 支持多种参数格式
  let env = 'production'
  let noExport = false
  let help = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    // 支持 --env, --mode, -e 多种格式
    if (arg === '--env' || arg === '--mode' || arg === '-e') {
      env = args[++i] || 'production'
    }
    // 直接传环境名称 (如: build.bat production)
    else if (['dev', 'test', 'production'].includes(arg)) {
      env = arg
    } else if (arg === '--no-export') {
      noExport = true
    } else if (arg === '--help' || arg === '-h') {
      help = true
    }
  }

  return { env, noExport, help }
}

// ============================================================
// 显示帮助
// ============================================================
function showHelp() {
  console.log(`
📦 Docker 镜像构建脚本

用法:
  node build-image.js [环境] [选项]
  build.bat [环境]

环境选项:
  dev                构建开发镜像（Vite HMR）
  test               构建测试镜像（完整构建，端口 8080）
  production         构建生产镜像（默认）

选项:
  --no-export        仅构建，不导出 tar
  --help, -h         显示此帮助信息

参数格式示例:
  node build-image.js                    # 默认生产环境
  node build-image.js production         # 生产环境
  node build-image.js --env test         # 测试环境
  node build-image.js --mode dev         # 开发环境
  node build-image.js -e dev             # 开发环境（简写）

  build.bat                              # 默认生产环境
  build.bat dev                          # 开发环境
  build.bat test --no-export             # 测试环境，不导出
  build.bat production                   # 生产环境
  `)
}

// ============================================================
// 主程序
// ============================================================
function main() {
  const { env, noExport, help } = parseArgs()

  if (help) {
    showHelp()
    process.exit(0)
  }

  if (!ENVIRONMENTS[env]) {
    console.error(`❌ 不支持的环境: ${env}`)
    console.error(`✓ 支持的环境: ${Object.keys(ENVIRONMENTS).join(', ')}`)
    process.exit(1)
  }

  const config = ENVIRONMENTS[env]
  const imageName = `${config.imageName}:${config.imageTag}`
  const tarFile = `${config.imageName}-${config.imageTag}.tar`
  const shouldExport = config.shouldExport && !noExport

  console.log(`
╔════════════════════════════════════════════════════╗
║  📦 Docker 镜像构建脚本                              ║
╚════════════════════════════════════════════════════╝

环境: ${env}
Dockerfile: ${config.dockerfile}
镜像名称: ${imageName}
导出 tar: ${shouldExport ? '是' : '否'}
  `)

  try {
    // 验证文件
    console.log('✓ 检查必要文件...')
    if (!fs.existsSync(config.dockerfile)) {
      console.error(`❌ 找不到 ${config.dockerfile}`)
      process.exit(1)
    }
    if (!fs.existsSync('package.json')) {
      console.error('❌ 找不到 package.json')
      process.exit(1)
    }
    console.log('✅ 文件检查通过\n')

    // 构建镜像
    console.log('🔨 正在构建 Docker 镜像...\n')
    let buildCmd = `docker build -f ${config.dockerfile} -t ${imageName}`

    if (config.buildArgs.length > 0) {
      buildCmd += ` ${config.buildArgs.join(' ')}`
    }
    buildCmd += ' .'

    execSync(buildCmd, { stdio: 'inherit' })
    console.log('\n✅ 镜像构建成功！\n')

    // 导出镜像
    if (shouldExport) {
      console.log('📦 正在导出镜像为 tar 文件...\n')

      if (fs.existsSync(tarFile)) {
        fs.unlinkSync(tarFile)
        console.log(`🗑️  已删除旧文件: ${tarFile}`)
      }

      execSync(`docker save -o ${tarFile} ${imageName}`)

      if (fs.existsSync(tarFile)) {
        const stats = fs.statSync(tarFile)
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)

        console.log('\n✅ 镜像导出成功！')
        console.log(`📁 文件: ${tarFile}`)
        console.log(`📊 大小: ${sizeMB} MB`)

        console.log(`
╔════════════════════════════════════════════════════╗
║  📋 后续步骤                                        ║
╚════════════════════════════════════════════════════╝

1️⃣  上传到服务器:
   scp ${tarFile} user@server:/path/to/

2️⃣  在服务器上加载镜像:
   docker load -i ${tarFile}

3️⃣  启动容器:
   docker run -d -p ${config.port || 80}:80 ${imageName}
        `)
      }
    } else {
      if (!config.shouldExport) {
        console.log('ℹ️  此环境不支持导出 tar')
      } else {
        console.log('ℹ️  已跳过导出（--no-export）')
      }
    }

    console.log(`
✅ 完成！

后续命令：
  docker images ${config.imageName}
  pnpm docker:run:${env}
  docker logs -f ${imageName}
    `)
  } catch (error) {
    console.error('\n❌ 操作失败：')
    console.error(error.message)
    process.exit(1)
  }
}

// ES 模块入口检查
import.meta.url === `file://${process.argv[1]}` && main()
