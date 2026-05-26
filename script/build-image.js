#!/usr/bin/env node

// const { execSync } = require('child_process')
// const fs = require('fs')

import { execSync } from 'child_process'
import fs from 'fs'

// ============================================================
// 终端输出美化
// ============================================================
const COLOR = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
}

const paint = (text, color) => `${COLOR[color] || ''}${text}${COLOR.reset}`
const info = (msg) => console.log(`${paint('ℹ', 'cyan')} ${msg}`)
const ok = (msg) => console.log(`${paint('✅', 'green')} ${msg}`)
const warn = (msg) => console.log(`${paint('⚠', 'yellow')} ${msg}`)
const fail = (msg) => console.error(`${paint('❌', 'red')} ${msg}`)

function header(title) {
  const line = '═'.repeat(56)
  console.log(`\n${paint(line, 'cyan')}`)
  console.log(`${paint('  ' + title, 'bold')}`)
  console.log(`${paint(line, 'cyan')}\n`)
}

// ============================================================
// 环境配置
// ============================================================
const ENVIRONMENTS = {
  dev: {
    aliases: ['development'],
    displayName: '开发环境',
    dockerfile: 'Dockerfile.dev',
    imageName: 'vue3-vite7-app',
    imageTag: 'dev',
    buildArgs: [],
    shouldExport: false,
    runScript: 'docker:run:dev',
    logsScript: null,
    runPort: 5173
  },
  test: {
    aliases: [],
    displayName: '测试环境',
    dockerfile: 'Dockerfile',
    imageName: 'vue3-vite7-app',
    imageTag: 'test',
    buildArgs: ['--build-arg', 'BUILD_MODE=test'],
    shouldExport: true,
    runScript: 'docker:run:test',
    logsScript: 'docker:logs:test',
    runPort: 8080
  },
  production: {
    aliases: ['prod'],
    displayName: '生产环境',
    dockerfile: 'Dockerfile',
    imageName: 'vue3-vite7-app',
    imageTag: 'prod',
    buildArgs: ['--build-arg', 'BUILD_MODE=production'],
    shouldExport: true,
    runScript: 'docker:run:prod',
    logsScript: 'docker:logs:prod',
    runPort: 80
  }
}

function normalizeEnv(value) {
  if (!value) return 'production'
  const lower = value.toLowerCase()

  if (ENVIRONMENTS[lower]) return lower

  const matched = Object.entries(ENVIRONMENTS).find(([, conf]) => conf.aliases.includes(lower))
  return matched ? matched[0] : lower
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
      env = normalizeEnv(args[++i] || 'production')
    }
    // 直接传环境名称 (如: build.bat production)
    else if (['dev', 'test', 'production', 'prod', 'development'].includes(arg)) {
      env = normalizeEnv(arg)
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
  production / prod  构建生产镜像（默认）

选项:
  --no-export        仅构建，不导出 tar
  --help, -h         显示此帮助信息

参数格式示例:
  node build-image.js                    # 默认生产环境
  node build-image.js production         # 生产环境
  node build-image.js prod               # 生产环境（简写）
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
    fail(`不支持的环境: ${env}`)
    info(`支持的环境: ${Object.keys(ENVIRONMENTS).join(', ')}（可用 prod 简写）`)
    process.exit(1)
  }

  const config = ENVIRONMENTS[env]
  const imageName = `${config.imageName}:${config.imageTag}`
  const artifactsDir = 'artifacts'
  const tarFile = `${artifactsDir}/${config.imageName}-${config.imageTag}.tar`
  const shouldExport = config.shouldExport && !noExport

  header('📦 Docker 镜像构建脚本')
  info(`环境: ${config.displayName} (${env})`)
  info(`Dockerfile: ${config.dockerfile}`)
  info(`镜像名称: ${imageName}`)
  info(`导出 tar: ${shouldExport ? '是' : '否'}`)

  try {
    // 验证文件
    info('检查必要文件...')
    if (!fs.existsSync(config.dockerfile)) {
      fail(`找不到 ${config.dockerfile}`)
      process.exit(1)
    }
    if (!fs.existsSync('package.json')) {
      fail('找不到 package.json')
      process.exit(1)
    }
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true })
    }
    ok('文件检查通过')

    // 构建镜像
    info('正在构建 Docker 镜像...')
    let buildCmd = `docker build -f ${config.dockerfile} -t ${imageName}`

    if (config.buildArgs.length > 0) {
      buildCmd += ` ${config.buildArgs.join(' ')}`
    }
    buildCmd += ' .'

    execSync(buildCmd, { stdio: 'inherit' })
    ok('镜像构建成功')

    // 导出镜像
    if (shouldExport) {
      info('正在导出镜像为 tar 文件...')

      if (fs.existsSync(tarFile)) {
        fs.unlinkSync(tarFile)
        warn(`已删除旧文件: ${tarFile}`)
      }

      execSync(`docker save -o ${tarFile} ${imageName}`)

      if (fs.existsSync(tarFile)) {
        const stats = fs.statSync(tarFile)
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)

        ok('镜像导出成功')
        info(`文件: ${tarFile}`)
        info(`大小: ${sizeMB} MB`)

        header('📋 后续步骤')
        console.log(`1. 上传到服务器:  scp ${tarFile} user@server:/path/to/`)
        console.log(`2. 加载镜像:      docker load -i ${config.imageName}-${config.imageTag}.tar`)
        console.log(`3. 启动容器:      docker run -d -p ${config.runPort}:80 ${imageName}`)
      }
    } else {
      if (!config.shouldExport) {
        warn('此环境不支持导出 tar')
      } else {
        warn('已跳过导出（--no-export）')
      }
    }

    header('✅ 完成')
    console.log(`docker images ${config.imageName}`)
    console.log(`pnpm ${config.runScript}`)
    if (config.logsScript) {
      console.log(`pnpm ${config.logsScript}`)
    }
  } catch (error) {
    header('❌ 操作失败')
    console.error(error.message)
    process.exit(1)
  }
}

// ES 模块入口检查
import.meta.url === `file://${process.argv[1]}` && main()
