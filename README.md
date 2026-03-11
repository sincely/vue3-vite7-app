# vue3-vite7-app

基于 **Vue 3 + Vite 7** 构建的前端应用模板，集成 Element Plus、Pinia、Vue Router 4、ECharts 等主流生态，使用 Nginx 容器化部署。

---

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Vue 3.x + Composition API |
| 构建工具 | Vite 7.x |
| UI 组件 | Element Plus |
| 状态管理 | Pinia + pinia-plugin-persistedstate |
| 路由 | Vue Router 4 |
| 图表 | ECharts 5 |
| 动画 | GSAP |
| HTTP | Axios |
| CSS 预处理 | SCSS |
| 代码规范 | ESLint + Prettier + Stylelint + Commitlint |
| 包管理 | pnpm ≥ 8 |
| 容器化 | Docker 多阶段构建 + Nginx |

---

## 环境要求

| 工具 | 最低版本 |
|------|----------|
| Node.js | ≥ 20.19.0 |
| pnpm | ≥ 8 |
| Docker | ≥ 24.x（容器化部署时） |

---

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（http://localhost:5173）
pnpm serve

# 构建测试包
pnpm build:test

# 构建生产包
pnpm build:production
```

---

## Docker 部署

镜像采用**多阶段构建**：`node:22-alpine` 编译 → `nginx:alpine` 托管，最终镜像 < 30 MB。

### 快速开始

#### 开发环境（Vite HMR 热更新）

```bash
pnpm docker:build:dev   # 构建开发镜像
pnpm docker:run:dev     # 启动容器，访问 http://localhost:5173
pnpm docker:stop:dev    # 停止容器
```

> 源码通过 Volume 挂载到容器，保存文件即触发热更新。

#### 测试环境

```bash
pnpm docker:build:test  # 构建测试镜像（读取 .env.test）
pnpm docker:run:test    # 启动容器，访问 http://localhost:8080
pnpm docker:stop:test   # 停止容器
```

#### 生产环境

```bash
pnpm docker:build:prod  # 构建生产镜像（读取 .env.production）
pnpm docker:run:prod    # 启动容器，访问 http://localhost:80
pnpm docker:stop:prod   # 停止容器
```

### Docker 脚本速查

| 脚本 | 说明 |
|------|------|
| `pnpm docker:build:dev` | 构建开发镜像（`Dockerfile.dev`） |
| `pnpm docker:build:test` | 构建测试镜像（`BUILD_MODE=test`） |
| `pnpm docker:build:prod` | 构建生产镜像（`BUILD_MODE=production`） |
| `pnpm docker:run:dev` | 启动开发容器（端口 5173，Volume 热更新） |
| `pnpm docker:run:test` | 启动测试容器（端口 8080，后台运行） |
| `pnpm docker:run:prod` | 启动生产容器（端口 80，自动重启） |
| `pnpm docker:stop:dev` | 停止开发容器 |
| `pnpm docker:stop:test` | 停止测试容器 |
| `pnpm docker:stop:prod` | 停止生产容器 |
| `pnpm docker:logs:test` | 实时查看测试容器日志 |
| `pnpm docker:logs:prod` | 实时查看生产容器日志 |

> 完整 Docker 文档（构建参数、Nginx 配置、镜像推送等）请参阅 [docker.md](docker.md)

---

## 代码规范

```bash
pnpm eslint:fix      # ESLint 检查并修复
pnpm prettier:fix    # Prettier 格式化
pnpm stylelint:fix   # Stylelint 检查并修复
```

---

## 版本发布

```bash
pnpm release          # 交互式发布
pnpm release:patch    # 发布 patch 版本
pnpm release:minor    # 发布 minor 版本
pnpm release:major    # 发布 major 版本
pnpm release:dry-run  # 模拟发布（不实际执行）
```

---

## 目录结构

```
├── Dockerfile              # 多阶段构建（测试 / 生产）
├── Dockerfile.dev          # 开发环境（Vite HMR）
├── nginx/nginx.conf        # 自定义 Nginx 配置
├── scripts/                # 构建脚本（Linux / Windows）
├── build/                  # Vite 构建配置
├── mock/                   # Mock 数据
├── public/                 # 静态资源
└── src/
    ├── api/                # 接口请求
    ├── assets/             # 图片等资源
    ├── components/         # 公共组件
    ├── composables/        # 组合式函数
    ├── directives/         # 自定义指令
    ├── hooks/              # Hooks
    ├── layouts/            # 布局组件
    ├── plugins/            # 插件注册
    ├── router/             # 路由配置
    ├── store/              # Pinia 状态
    ├── styles/             # 全局样式
    ├── utils/              # 工具函数
    └── views/              # 页面视图
```
