# 🐳 Docker 详细使用指南 & 注意事项

> **版本适配**：Node 22-alpine | Nginx alpine | pnpm >= 8 | Docker 24.x
> **最后更新**：2026年3月16日

---

## 📋 快速导航

| 场景 | 快速命令 | 端口 |
|------|---------|------|
| **开发** | `pnpm docker:build:dev && pnpm docker:run:dev` | 5173 |
| **测试** | `pnpm docker:build:test && pnpm docker:run:test` | 8080 |
| **生产** | `pnpm docker:build:prod && pnpm docker:run:prod` | 80 |

---

## 🚀 三种使用场景详解

### 1️⃣ 开发环境（Dockerfile.dev）

**特点**：Vite 热更新（HMR），源码通过 Volume 挂载，修改即生效

```bash
# 第一次使用：构建镜像（含依赖安装）
pnpm docker:build:dev

# 启动开发容器
pnpm docker:run:dev

# 容器成功启动标志
# ➜ Local:   http://localhost:5173/
# ➜ press h + enter to show help
```

**Volume 挂载机制**：
- `/app` - 源码动态挂载（宿主机修改 → 容器立即响应）
- `/app/node_modules` - 容器内独立的依赖，避免 Windows 与 Linux 兼容问题

**访问方式**：
- **本机**: `http://localhost:5173`
- **局域网**: `http://<your-ip>:5173` （需在 `vite.config.js` 中确认 HMR 配置）

**停止容器**：
```bash
pnpm docker:stop:dev
# 或手动
docker stop vue3-vite7-app-dev
```

**常见问题**：
- ⚠️ 若依赖有更新，需重新执行 `pnpm docker:build:dev`
- ⚠️ Windows PowerShell 直接执行需用 `${PWD}` 替代 `%cd%`
- ⚠️ HMR 失效？检查防火墙开放 5173 端口

---

### 2️⃣ 测试环境（Dockerfile + BUILD_MODE=test）

**特点**：完整构建，读取 `.env.test` 配置，后台运行，自动清理

```bash
# 构建镜像（多阶段：builder → runner）
pnpm docker:build:test

# 启动容器（后台运行，--rm 自动清理退出容器）
pnpm docker:run:test

# 查看日志
pnpm docker:logs:test

# 停止容器（自动删除）
pnpm docker:stop:test
```

**构建流程**：
1. **Builder 阶段**（node:22-alpine）
   - 安装依赖：`pnpm install --frozen-lockfile`
   - 编译源码：`pnpm run build:test`
   - 生成 `dist/` 产物

2. **Runner 阶段**（nginx:alpine）
   - 复制 `dist/` 到 Nginx 静态目录
   - 启用健康检查、安全头、缓存策略
   - 镜像大小 **<30MB**

**环境变量区别**：
```
.env.test        → API_URL=https://test.api.com
.env.production  → API_URL=https://prod.api.com
```

**最终镜像内容**：
```
✅ Nginx（提供 HTTP 服务）
✅ 编译后的 HTML/JS/CSS/静态资源
❌ Node.js（已移除，减小体积）
❌ node_modules（已移除，不需要）
```

---

### 3️⃣ 生产环境（Dockerfile + BUILD_MODE=production）

**特点**：正式部署，自动重启，持久化容器

```bash
# 构建生产镜像
pnpm docker:build:prod

# 启动容器（--restart=unless-stopped 自动重启）
pnpm docker:run:prod

# 验证运行状态
docker ps | grep vue3-vite7-app-prod

# 查看日志
pnpm docker:logs:prod

# 查看容器健康状态
docker inspect --format='{{.State.Health}}' vue3-vite7-app-prod

# 停止容器
pnpm docker:stop:prod
```

**与测试环境的区别**：
| 维度 | 测试 | 生产 |
|------|------|------|
| `.env` 文件 | `.env.test` | `.env.production` |
| 容器启停 | 手动（--rm）| 自动重启 |
| 端口暴露 | 8080 | 80（HTTP 标准） |
| 日志保留 | 自动删除 | 持久化 |

**监控与调试**：
```bash
# 查看 Nginx 错误日志
docker exec vue3-vite7-app-prod tail -f /var/log/nginx/error.log

# 查看访问日志
docker exec vue3-vite7-app-prod tail -f /var/log/nginx/access.log

# 进入容器 Shell
docker exec -it vue3-vite7-app-prod sh

# 查看容器资源占用
docker stats vue3-vite7-app-prod
```

---

## 🔧 构建参数详解

### 全局构建参数

```dockerfile
# 在 Dockerfile 第一行声明
ARG NODE_VERSION=22-alpine
ARG NGINX_VERSION=alpine
ARG BUILD_MODE=production
```

### 自定义构建示例

```bash
# 指定 Node 版本
docker build \
  --build-arg NODE_VERSION=20-alpine \
  --build-arg BUILD_MODE=production \
  -t vue3-vite7-app:prod-node20 \
  .

# 禁用缓存，完整重建
docker build \
  --no-cache \
  --build-arg BUILD_MODE=production \
  -t vue3-vite7-app:prod \
  .

# 指定代理（网络慢时使用）
docker build \
  --build-arg http_proxy=http://proxy:7890 \
  --build-arg https_proxy=http://proxy:7890 \
  --build-arg BUILD_MODE=production \
  -t vue3-vite7-app:prod \
  .

# 跨平台编译（Intel/ARM）
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg BUILD_MODE=production \
  -t vue3-vite7-app:prod \
  .
```

---

## 🌐 Nginx 配置深度解析

### 1. SPA 路由支持

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**工作原理**：
1. 请求 `/dashboard` → 查找文件 `/dashboard`（不存在）
2. 查找目录 `/dashboard/`（不存在）
3. **回退到 `/index.html` → 由 Vue Router 处理**

❌ **错误场景**（无此配置）：
```
用户访问 /dashboard → Nginx 404 → 白屏
```

✅ **正确场景**：
```
用户访问 /dashboard → Nginx 返回 /index.html
→ 前端加载 app.js → Vue Router 识别路由 → 渲染 Dashboard 组件
```

---

### 2. 缓存策略

```nginx
# JS/CSS/字体/图片：1年不变，完全缓存
location ~* \.(js|css|woff2?|ttf|eot|svg|ico|png|jpg|jpeg|gif|webp)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;  # 关闭日志节省空间
}

# HTML 文件：不缓存，保证版本更新立即生效
location ~* \.html$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    expires 0;
}
```

**为何如此设计**？

Vite 构建时，文件名带 Hash：
```
dist/assets/index.abc123.js    # 内容更新 → Hash 变化 → 新文件
dist/assets/index.xyz456.js    # 旧版本消失
dist/index.html                # 始终是 index.html
```

用户首次访问：
1. 浏览器加载 `index.html`（不缓存）
2. 读取新的 script 标签：`<script src="index.abc123.js">`
3. 缓存该 JS 文件 1 年

更新版本后：
1. 新构建生成 `index.def789.js`
2. `index.html` 更新指向新文件
3. 用户因 HTML 不缓存，立即获取最新版本

---

### 3. Gzip 压缩

```nginx
gzip on;
gzip_comp_level 6;              # 压缩级别 1-9，6 是平衡点
gzip_min_length 256;            # 小于 256B 的不压缩
gzip_types
    text/plain
    text/css
    application/javascript
    application/json;
```

**效果**：
- 原始 JS 大小：500KB
- Gzip 后：150KB（↓70%）
- 用户下载速度提升 **3-5 倍**

---

### 4. 安全响应头

```nginx
# 防止点击劫持
X-Frame-Options: SAMEORIGIN
# 防止 MIME 嗅探攻击
X-Content-Type-Options: nosniff
# 启用 XSS 防护
X-XSS-Protection: 1; mode=block
# 严格的 Referrer 策略
Referrer-Policy: strict-origin-when-cross-origin
# HTTPS 下启用（强制 HTTPS，预加载清单）
# Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

### 5. 反向代理后端 API

**场景**：前后端同域或需要 CORS 解决方案

```nginx
location /api/ {
    # 后端地址（容器内网通信）
    proxy_pass http://backend-service:3000/;

    # HTTP 版本（支持长连接）
    proxy_http_version 1.1;

    # WebSocket 支持
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';

    # 关键：传递原始请求信息给后端
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # 超时时间
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

**Docker Compose 示例**：
```yaml
services:
  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    image: your-api:latest
    ports:
      - "3000:3000"
```

在容器内，前端访问后端用 `http://backend-service:3000`（Docker DNS 自动解析）

---

## ⚙️ 环境变量管理

### 三个环境的配置区别

| 文件 | 用途 | 示例值 |
|------|------|--------|
| `.env.development` | 本地开发 | `VITE_API_URL=http://localhost:3000` |
| `.env.test` | 测试部署 | `VITE_API_URL=https://test.api.com` |
| `.env.production` | 生产部署 | `VITE_API_URL=https://api.com` |

### Vite 构建时注入

```javascript
// vite.config.js
import { defineConfig, loadEnv } from 'vite'

export default defineConfig({
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL),
  }
})
```

### 运行时环境变量（通过 -e 传入）

```bash
# 不会被编译进 JS（适合机密信息）
docker run -e DATABASE_PASSWORD=secret123 ...

# 在容器内可通过 process.env 读取
# 但前端 JS 无法直接访问（仅服务端）
```

---

## 📦 多镜像版本管理

### 语义化版本标签

```bash
# 同时打多个 tag（推荐方案）
docker build \
  --build-arg BUILD_MODE=production \
  -t vue3-vite7-app:0.0.2 \
  -t vue3-vite7-app:latest \
  -t myregistry.com/vue3-app:0.0.2 \
  .

# 查看镜像
docker images | grep vue3-vite7-app
# vue3-vite7-app    0.0.2              abc123...   15MB
# vue3-vite7-app    latest             abc123...   15MB
```

### 推送到镜像仓库

**Docker Hub**：
```bash
docker login  # 输入 username/password

docker tag vue3-vite7-app:latest your-username/vue3-vite7-app:latest
docker push your-username/vue3-vite7-app:latest
```

**阿里云容器镜像服务**：
```bash
docker login --username=<阿里云账号> registry.cn-hangzhou.aliyuncs.com

docker tag vue3-vite7-app:latest registry.cn-hangzhou.aliyuncs.com/<namespace>/vue3-app:latest
docker push registry.cn-hangzhou.aliyuncs.com/<namespace>/vue3-app:latest
```

**私有 Harbor 仓库**：
```bash
docker login harbor.company.com

docker tag vue3-vite7-app:latest harbor.company.com/project/vue3-app:latest
docker push harbor.company.com/project/vue3-app:latest
```

---

## 🚨 关键注意事项

### 🔴 安全风险

#### 1. 敏感信息不要写入镜像

❌ **错误做法**：
```dockerfile
ENV API_KEY=sk-abc123xyz
ENV DATABASE_PASSWORD=root123
```
**问题**：镜像被泄露 → 密钥暴露 → 安全事件

✅ **正确做法**：
```bash
# 运行时传入
docker run -e API_KEY=$API_KEY -e DATABASE_PASSWORD=$DB_PASS ...

# 使用 Secret 管理（Kubernetes）
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
data:
  api-key: c2stYWJjMTIzeHl6  # base64 编码
```

#### 2. 前端敏感信息的真相

```javascript
// 打包后的 dist/assets/index.abc123.js
// 所有 VITE_* 变量都会被硬编码到 JS 文件中！
const API_KEY = "sk-abc123xyz";  // 用户可在浏览器控制台看到
```

**解决方案**：
- `VITE_*` 变量：仅用于**非敏感配置**（API 地址、APP ID 等）
- 机密信息（密钥、口令）：
  - 通过后端代理
  - 使用 token 交换机制
  - 基于会话的权限验证

---

### 🟠 性能优化

#### 1. 镜像体积

**当前方案**：多阶段构建 `<30MB`

```bash
# 查看镜像大小
docker images vue3-vite7-app
# REPOSITORY          TAG      SIZE
# vue3-vite7-app      prod     25MB
# vue3-vite7-app      test     25MB
```

**为何这么小**？
- ✅ Builder 阶段（700MB）被丢弃
- ✅ 仅包含 Nginx + 编译后的静态文件
- ✅ Alpine Linux 基础镜像 <10MB

#### 2. 构建缓存利用

Dockerfile 分层设计充分利用 Docker 层缓存：

```dockerfile
# 第 1 层：安装 pnpm（基础镜像 → pnpm）
RUN npm install -g pnpm

# 第 2 层：复制 package.json（依赖信息）
COPY package.json pnpm-lock.yaml ./

# 第 3 层：安装依赖（耗时最多）
RUN pnpm install --frozen-lockfile

# 第 4 层：复制源码
COPY . .

# 第 5 层：编译
RUN pnpm run build:production
```

**缓存命中率**：
- 只改源码 → 重新执行第 4、5 层（快 ⚡）
- 改 package.json → 重新执行第 3、4、5 层（中等 ⚙️）
- 改基础镜像 → 全部重建（慢 🐌）

**强制禁用缓存**：
```bash
docker build --no-cache -t vue3-vite7-app:prod .
```

---

### 🟡 运行时风险

#### 1. 容器重启策略

```bash
# ❌ 没有重启策略（容器挂掉 → 服务不可用）
docker run -d -p 80:80 vue3-vite7-app:prod

# ✅ 自动重启（推荐生产环境）
docker run -d -p 80:80 --restart=unless-stopped vue3-vite7-app:prod

# ✅ 限制重启次数
docker run -d -p 80:80 --restart=on-failure:5 vue3-vite7-app:prod
```

**重启策略对比**：
| 策略 | 手动停止后 | 容器异常退出 | 生产适用 |
|------|----------|-----------|---------|
| no | 保持停止 | 不重启 | ❌ |
| always | 重新启动 | 立即重启 | ⚠️ 可能无限重启 |
| unless-stopped | 保持停止 | 立即重启 | ✅ 推荐 |
| on-failure:5 | 保持停止 | 最多重启 5 次 | ✅ 推荐 |

#### 2. 资源限制

```bash
# 限制内存（防止 OOM）
docker run -d \
  -p 80:80 \
  --memory=512m \
  --memory-reservation=256m \
  vue3-vite7-app:prod

# 限制 CPU 使用（防止占用过多计算资源）
docker run -d \
  -p 80:80 \
  --cpus="0.5" \
  vue3-vite7-app:prod
```

#### 3. 健康检查

```dockerfile
# Dockerfile 中已配置
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1
```

**验证健康状态**：
```bash
docker inspect --format='{{.State.Health.Status}}' vue3-vite7-app-prod
# healthy / unhealthy / none

# 查看健康检查历史
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' vue3-vite7-app-prod
```

**Kubernetes 中的健康检查**：
```yaml
livenessProbe:
  httpGet:
    path: /
    port: 80
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /
    port: 80
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

### 🔵 网络问题

#### 1. 跨平台构建（Intel vs ARM）

```bash
# 当前构建仅支持当前平台
docker build -t vue3-vite7-app:prod .

# 跨平台构建（需 Docker buildx）
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t vue3-vite7-app:latest \
  --push \
  .
```

**应用场景**：
- Mac M1/M2 本地开发 → 推送镜像
- 在 Linux x86 服务器运行
- 不能直接用 `linux/amd64` 镜像（兼容性差）

#### 2. 网络超时

```bash
# 构建时 pnpm install 超时
# 原因：npm 官方源国内访问慢

# 解决方案 1：Dockerfile 已配置淘宝镜像
RUN pnpm install --registry=https://registry.npmmirror.com

# 解决方案 2：指定代理
docker build \
  --build-arg http_proxy=http://your-proxy:7890 \
  --build-arg https_proxy=http://your-proxy:7890 \
  -t vue3-vite7-app:prod \
  .
```

#### 3. 容器间网络通信

```bash
# 创建自定义网络（容器间 DNS 解析）
docker network create app-net

# 启动后端
docker run -d --name backend --network app-net node:20 ...

# 启动前端（可用 backend:3000 访问）
docker run -d --name frontend --network app-net -p 80:80 vue3-vite7-app:prod
```

**Docker Compose 自动处理**：
```yaml
services:
  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend
  backend:
    image: node:20
    # 前端访问：http://backend:3000（自动 DNS 解析）
```

---

### ⚫ 日志与监控

#### 1. 查看容器日志

```bash
# 实时查看（-f 持续跟踪）
docker logs -f vue3-vite7-app-prod

# 查看最后 100 行
docker logs --tail=100 vue3-vite7-app-prod

# 查看特定时间的日志
docker logs --since 2h vue3-vite7-app-prod
docker logs --until 5m vue3-vite7-app-prod

# 添加时间戳
docker logs -t vue3-vite7-app-prod
```

#### 2. Nginx 日志位置

```bash
# 访问日志
docker exec vue3-vite7-app-prod cat /var/log/nginx/access.log

# 错误日志
docker exec vue3-vite7-app-prod cat /var/log/nginx/error.log

# 实时监控
docker exec -it vue3-vite7-app-prod tail -f /var/log/nginx/access.log
```

#### 3. 监控容器资源

```bash
# 实时查看 CPU、内存、网络 I/O
docker stats vue3-vite7-app-prod

# 查看历史数据
docker stats --no-stream vue3-vite7-app-prod
```

---

## 🛠️ 高级用法

### Docker Compose 完整示例

```yaml
version: '3.9'

services:
  # 前端应用
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        BUILD_MODE: production
    container_name: vue3-app-prod
    ports:
      - "80:80"
    environment:
      TZ: Asia/Shanghai
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - backend
    networks:
      - app-network

  # 后端 API（示例）
  backend:
    image: your-api:latest
    container_name: api-server
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://...
      TZ: Asia/Shanghai
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  db-data:
    driver: local
```

**启动所有服务**：
```bash
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f frontend

# 停止所有服务
docker-compose down
```

---

### CI/CD 集成（GitHub Actions）

```yaml
# .github/workflows/docker-build.yml
name: Build & Push Docker Image

on:
  push:
    tags:
      - 'v*'
    branches:
      - main

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/vue3-app

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=ref,event=branch
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: |
            BUILD_MODE=production
            NODE_VERSION=22-alpine
```

---

## ✅ 操作检查清单

### 本地开发前

- [ ] Docker Desktop 已安装（`docker --version` ≥ 24.0）
- [ ] 项目根目录存在 `.dockerignore`
- [ ] `.env.development` 配置正确
- [ ] 端口 5173 未被占用

### 测试前

- [ ] `.env.test` 已配置
- [ ] 构建成功：`pnpm docker:build:test`
- [ ] 镜像大小检查：`docker images | grep test`（应 <50MB）
- [ ] 容器启动无错：`pnpm docker:run:test && docker logs -f vue3-vite7-app-test`
- [ ] 访问正常：`curl http://localhost:8080`

### 生产发布前

- [ ] `.env.production` 已配置且无敏感信息
- [ ] 版本号已更新：`package.json` 中 `version` 字段
- [ ] 构建成功：`pnpm docker:build:prod`
- [ ] 镜像标签正确：`docker images | grep prod`
- [ ] 健康检查通过：`curl http://localhost`
- [ ] 日志无错误：`pnpm docker:logs:prod`
- [ ] 性能基准测试
- [ ] 镜像安全扫描：`docker scout cves vue3-vite7-app:prod`

---

## 📞 故障排查速查表

| 问题 | 原因 | 解决方案 |
|------|------|--------|
| 容器无法启动 | Nginx 配置错误 | `docker logs -f <name>` 查看错误，检查 nginx.conf 语法 |
| 404 路由错误 | SPA 路由未配置 | 确认 nginx.conf 有 `try_files $uri $uri/ /index.html` |
| 页面样式缺失 | 缓存问题 | 清浏览器缓存或使用新的 tag 重新部署 |
| API 请求失败 | 后端地址错误 | 检查 `.env.*` 中的 `VITE_API_URL` 和后端 CORS 配置 |
| 内存持续增长 | 内存泄漏 | 设置内存限制 `--memory=512m`，升级镜像版本 |
| 构建超时 | 网络慢 | 使用代理或更换 npm 源 |

---

## 📚 参考资源

- [Docker 官方文档](https://docs.docker.com/)
- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Vite 构建配置](https://vitejs.dev/config/)
- [Vue3 路由](https://router.vuejs.org/)
- [Docker Compose](https://docs.docker.com/compose/)

---

**最后更新**: 2026年3月16日
**维护者**: 成舟 <1738248438@qq.com>
