#  Docker 部署指南  vue3-vite7-app

> **适用版本**：Node  20.19.0  pnpm  8  Docker  24.x

---

## 目录

- [文件结构说明](#文件结构说明)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
  - [开发环境（热更新）](#开发环境热更新)
  - [测试环境](#测试环境)
  - [生产环境](#生产环境)
- [Dockerfile 说明](#dockerfile-说明)
- [构建参数](#构建参数)
- [npm 脚本速查](#npm-脚本速查)
- [使用构建脚本](#使用构建脚本)
- [Nginx 配置说明](#nginx-配置说明)
- [推送镜像到仓库](#推送镜像到仓库)
- [常用命令速查](#常用命令速查)
- [常见问题 FAQ](#常见问题-faq)
- [注意事项](#注意事项)

---

## 文件结构说明

```
项目根目录/
 Dockerfile                        # 多阶段构建（测试 / 生产）
 Dockerfile.dev                    # 开发环境（Vite HMR）
 .dockerignore                     # 构建上下文排除规则
 nginx/
    nginx.conf                    # 自定义 Nginx 配置
 scripts/
     docker-build-linux.sh         # Linux/macOS 构建脚本
     docker-build-windows.ps1     # Windows PowerShell 构建脚本
```

---

## 环境要求

| 工具 | 最低版本 | 检查命令 |
|------|----------|----------|
| Docker Desktop / Docker Engine | 24.x | `docker --version` |

> **Windows 用户**：推荐使用 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)，启用 WSL 2 后端可获得最佳性能。

---

## 快速开始

### 开发环境（热更新）

使用 `Dockerfile.dev` 启动 Vite 开发服务器，源码通过 Volume 挂载到容器，保存文件即触发 HMR，无需重建镜像。

```bash
# 1. 构建开发镜像（首次或依赖变更时执行）
pnpm docker:build:dev

# 2. 启动容器
pnpm docker:run:dev

# 访问 http://localhost:5173

# 停止容器
pnpm docker:stop:dev
```

>  `docker:run:dev` 使用 `%cd%` 挂载源码，**请在项目根目录运行**。通过 `pnpm` 执行时会以 cmd 作为 shell，`%cd%` 自动生效。

---

### 测试环境

使用 `Dockerfile` 多阶段构建，`BUILD_MODE=test` 读取 `.env.test` 配置文件。

```bash
# 1. 构建镜像
pnpm docker:build:test

# 2. 启动容器（后台运行）
pnpm docker:run:test

# 访问 http://localhost:8080

# 查看日志
pnpm docker:logs:test

# 停止并自动删除容器
pnpm docker:stop:test
```

---

### 生产环境

使用 `Dockerfile` 多阶段构建，`BUILD_MODE=production` 读取 `.env.production` 配置文件。

```bash
# 1. 构建镜像
pnpm docker:build:prod

# 2. 启动容器（端口 80，自动重启）
pnpm docker:run:prod

# 访问 http://localhost

# 查看日志
pnpm docker:logs:prod

# 停止容器
pnpm docker:stop:prod
```

---

## Dockerfile 说明

### Dockerfile（测试 / 生产）

多阶段构建，最终镜像只包含静态资源和 Nginx，体积 < 30 MB。

| 阶段 | 基础镜像 | 作用 |
|------|----------|------|
| `builder` | `node:22-alpine` | 安装依赖、执行 Vite 构建 |
| `runner` | `nginx:alpine` | 托管静态资源 |

### Dockerfile.dev（开发）

单阶段镜像，直接运行 Vite 开发服务器。

| 基础镜像 | 暴露端口 | 启动命令 |
|----------|----------|----------|
| `node:22-alpine` | `5173` | `pnpm run serve -- --host 0.0.0.0` |

运行时通过 Volume 将宿主机源码挂载到 `/app`，`node_modules` 保持容器内隔离，避免平台兼容问题。

---

## 构建参数

`Dockerfile` 支持以下 `--build-arg` 参数：

| 参数 | 默认值 | 可选值 | 说明 |
|------|--------|--------|------|
| `BUILD_MODE` | `production` | `test` / `production` | Vite 构建模式，决定读取的 `.env.*` 文件 |
| `NODE_VERSION` | `22-alpine` | 任意 Node Alpine 标签 | Node.js 基础镜像版本 |
| `NGINX_VERSION` | `alpine` | 任意 Nginx Alpine 标签 | Nginx 基础镜像版本 |

**直接使用 `docker build` 示例：**

```bash
# 测试环境
docker build --build-arg BUILD_MODE=test -t vue3-vite7-app:test .

# 生产环境
docker build --build-arg BUILD_MODE=production -t vue3-vite7-app:prod .

# 开发镜像
docker build -f Dockerfile.dev -t vue3-vite7-app:dev .

# 禁用缓存，强制完整重建
docker build --no-cache --build-arg BUILD_MODE=production -t vue3-vite7-app:prod .

# 指定 Node 版本
docker build --build-arg NODE_VERSION=20-alpine --build-arg BUILD_MODE=production -t vue3-vite7-app:prod .
```

---

## npm 脚本速查

| 脚本 | 等效 Docker 命令 | 说明 |
|------|-----------------|------|
| `pnpm docker:build:dev` | `docker build -f Dockerfile.dev -t vue3-vite7-app:dev .` | 构建开发镜像 |
| `pnpm docker:build:test` | `docker build --build-arg BUILD_MODE=test -t vue3-vite7-app:test .` | 构建测试镜像 |
| `pnpm docker:build:prod` | `docker build --build-arg BUILD_MODE=production -t vue3-vite7-app:prod .` | 构建生产镜像 |
| `pnpm docker:run:dev` | `docker run -it --rm -p 5173:5173 -v "%cd%:/app" ...` | 启动开发容器（Volume 热更新） |
| `pnpm docker:run:test` | `docker run -d --rm -p 8080:80 ...` | 启动测试容器（后台，端口 8080） |
| `pnpm docker:run:prod` | `docker run -d -p 80:80 --restart=unless-stopped ...` | 启动生产容器（后台，端口 80） |
| `pnpm docker:stop:dev` | `docker stop vue3-vite7-app-dev` | 停止开发容器 |
| `pnpm docker:stop:test` | `docker stop vue3-vite7-app-test` | 停止测试容器 |
| `pnpm docker:stop:prod` | `docker stop vue3-vite7-app-prod` | 停止生产容器 |
| `pnpm docker:logs:test` | `docker logs -f vue3-vite7-app-test` | 实时查看测试容器日志 |
| `pnpm docker:logs:prod` | `docker logs -f vue3-vite7-app-prod` | 实时查看生产容器日志 |

---

## 使用构建脚本

如需高级选项（跨平台编译、推送镜像到仓库、Tag 管理等），使用 `scripts/` 目录下的构建脚本。

#### Windows PowerShell

```powershell
# 构建开发镜像
.\scripts\docker-build-windows.ps1 -Mode dev

# 构建测试镜像，指定 Tag
.\scripts\docker-build-windows.ps1 -Mode test -Tag v1.0.0

# 构建生产镜像
.\scripts\docker-build-windows.ps1 -Mode production -Tag v1.2.0

# 禁用缓存强制重建
.\scripts\docker-build-windows.ps1 -Mode production -NoCache

# 指定目标平台（交叉编译）
.\scripts\docker-build-windows.ps1 -Mode production -Platform linux/amd64

# 构建并推送到私有仓库
.\scripts\docker-build-windows.ps1 -Mode production -Tag v1.2.0 -Push -Registry "registry.cn-hangzhou.aliyuncs.com/myorg/vue3-app"
```

>  首次运行 `.ps1` 遇到执行策略限制：
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

#### Linux / macOS

```bash
chmod +x scripts/docker-build-linux.sh

bash scripts/docker-build-linux.sh -m dev
bash scripts/docker-build-linux.sh -m test -t v1.0.0
bash scripts/docker-build-linux.sh -m production -t v1.2.0
bash scripts/docker-build-linux.sh -m production --no-cache
bash scripts/docker-build-linux.sh -m production -t v1.2.0 -p -r registry.cn-hangzhou.aliyuncs.com/myorg/vue3-app
```

---

## Nginx 配置说明

`nginx/nginx.conf` 包含以下核心配置：

### SPA History 路由

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

所有未匹配到静态文件的路径回退到 `index.html`，由 Vue Router 接管，保证刷新不出现 404。

### 静态资源缓存策略

| 资源类型 | 缓存策略 | 说明 |
|----------|----------|------|
| JS / CSS / 图片 | `1年 immutable` | 文件名带 Hash，安全长缓存 |
| HTML 文件 | `不缓存` | 保证部署后立即生效 |

### Gzip 压缩

已开启，压缩级别 6，覆盖 JS、CSS、JSON、SVG 等类型。

### 安全响应头

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 反向代理 API（可选）

编辑 `nginx/nginx.conf`，取消 `location /api/` 注释并修改 `proxy_pass` 地址：

```nginx
location /api/ {
    proxy_pass http://your-backend-service:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## 推送镜像到仓库

### 推送到 Docker Hub

```bash
docker login

docker tag vue3-vite7-app:prod your-dockerhub-username/vue3-vite7-app:latest
docker push your-dockerhub-username/vue3-vite7-app:latest
```

### 推送到阿里云容器镜像服务（ACR）

```bash
docker login --username=<阿里云账号> registry.cn-hangzhou.aliyuncs.com

docker tag vue3-vite7-app:prod registry.cn-hangzhou.aliyuncs.com/<命名空间>/vue3-vite7-app:latest
docker push registry.cn-hangzhou.aliyuncs.com/<命名空间>/vue3-vite7-app:latest
```

---

## 常用命令速查

```bash
#  构建 
docker build -t vue3-vite7-app:prod .                                        # 生产镜像
docker build --build-arg BUILD_MODE=test -t vue3-vite7-app:test .            # 测试镜像
docker build -f Dockerfile.dev -t vue3-vite7-app:dev .                       # 开发镜像
docker build --no-cache -t vue3-vite7-app:prod .                             # 禁用缓存

#  运行 
# 测试（后台，自动清理）
docker run -d --rm -p 8080:80 -e TZ=Asia/Shanghai \
  --name vue3-vite7-app-test vue3-vite7-app:test

# 生产（后台，自动重启）
docker run -d -p 80:80 -e TZ=Asia/Shanghai --restart=unless-stopped \
  --name vue3-vite7-app-prod vue3-vite7-app:prod

# 开发（交互，Volume 热更新） Linux/macOS
docker run -it --rm -p 5173:5173 \
  -v "$(pwd):/app" -v /app/node_modules \
  -e TZ=Asia/Shanghai -e VITE_CJS_IGNORE_WARNING=true -e NODE_ENV=development \
  --name vue3-vite7-app-dev vue3-vite7-app:dev

# 开发（交互，Volume 热更新） Windows PowerShell
docker run -it --rm -p 5173:5173 `
  -v "${PWD}:/app" -v /app/node_modules `
  -e TZ=Asia/Shanghai -e VITE_CJS_IGNORE_WARNING=true -e NODE_ENV=development `
  --name vue3-vite7-app-dev vue3-vite7-app:dev

#  容器操作 
docker ps                                                    # 查看运行中的容器
docker ps -a                                                 # 查看所有容器
docker stop vue3-vite7-app-prod                              # 停止容器
docker rm vue3-vite7-app-prod                                # 删除容器
docker exec -it vue3-vite7-app-prod sh                       # 进入容器 Shell
docker logs -f vue3-vite7-app-prod                           # 实时查看日志
docker stats vue3-vite7-app-prod                             # 查看资源占用

#  镜像管理 
docker images                                                # 列出本地镜像
docker rmi vue3-vite7-app:prod                               # 删除镜像
docker image prune -f                                        # 清理悬空镜像
docker system prune -f                                       # 清理所有未用资源（谨慎）

#  健康检查 
docker inspect --format='{{.State.Health.Status}}' vue3-vite7-app-prod
```

---

## 常见问题 FAQ

### Q1：构建时 pnpm install 失败，提示网络超时？

**原因**：国内网络访问 npm 官方源较慢。

**解决**：Dockerfile 中已配置淘宝镜像 `--registry=https://registry.npmmirror.com`，若仍超时，可传入代理：

```bash
docker build \
  --build-arg http_proxy=http://your-proxy:7890 \
  --build-arg https_proxy=http://your-proxy:7890 \
  --build-arg BUILD_MODE=production \
  -t vue3-vite7-app:prod .
```

---

### Q2：刷新页面出现 404？

**原因**：SPA 路由由 Vue Router 管理，Nginx 需将所有路径回退到 `index.html`。

**检查**：确认 `nginx/nginx.conf` 存在以下配置：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

### Q3：`.env.production` 中 `VITE_BASE_URL = '/h5/'`，访问路径不对？

**解决**：修改 `nginx/nginx.conf` 中的 `location` 块：

```nginx
location /h5/ {
    try_files $uri $uri/ /h5/index.html;
}
```

---

### Q4：如何修改容器对外暴露的端口？

直接修改运行命令中的端口映射，例如改为 9090：

```bash
docker run -d -p 9090:80 -e TZ=Asia/Shanghai --restart=unless-stopped \
  --name vue3-vite7-app-prod vue3-vite7-app:prod
```

---

### Q5：如何查看 Nginx 访问日志？

```bash
docker exec -it vue3-vite7-app-prod tail -f /var/log/nginx/access.log
# 或
docker logs -f vue3-vite7-app-prod
```

---

### Q6：构建缓存问题，代码修改后镜像没有更新？

Dockerfile 中依赖层与源码层分开复制：

- 只修改源码  只重新执行 `pnpm run build`，**依赖层使用缓存**，速度快
- 修改了 `package.json` 或 `pnpm-lock.yaml`  重新安装依赖

如确认代码已更新但镜像未变，强制禁用缓存：

```bash
docker build --no-cache --build-arg BUILD_MODE=production -t vue3-vite7-app:prod .
```

---

### Q7：开发容器 `docker:run:dev` 路径挂载失败？

`%cd%` 是 Windows cmd 变量，通过 `pnpm` 执行 npm 脚本会自动使用 cmd，正常生效。

若在 **PowerShell** 中直接执行 `docker run` 命令，请改用 `${PWD}`：

```powershell
docker run -it --rm -p 5173:5173 `
  -v "${PWD}:/app" -v /app/node_modules `
  -e TZ=Asia/Shanghai -e VITE_CJS_IGNORE_WARNING=true -e NODE_ENV=development `
  --name vue3-vite7-app-dev vue3-vite7-app:dev
```

---

## 注意事项

###  安全注意事项

1. **不要将敏感信息写入 Dockerfile 或镜像**
   - 数据库密码、API Key 等应通过运行时 `-e` 参数注入
   - `VITE_*` 变量会被打包进前端代码，**不适合存储机密信息**

2. **生产环境建议配置 HTTPS**
   - 在 Nginx 前部署反向代理（Traefik、Caddy）或直接在 Nginx 中配置 SSL 证书

3. **定期更新基础镜像**
   - 及时拉取最新 `node:22-alpine` 和 `nginx:alpine` 以修复安全漏洞

###  镜像大小优化

- 多阶段构建已将 `node_modules` 完全剔除，运行镜像仅含静态文件和 Nginx
- Vite 构建已启用 Gzip 预压缩（`vite-plugin-compression`），Nginx 直接提供 `.gz` 文件

###  版本管理建议

```bash
# 推荐同时打语义化版本 Tag 和 latest
docker build --build-arg BUILD_MODE=production \
  -t vue3-vite7-app:0.0.2 \
  -t vue3-vite7-app:latest \
  .
```

###  CI/CD 集成示例

```yaml
# GitHub Actions 示例
- name: Build Docker Image
  run: |
    docker build \
      --build-arg BUILD_MODE=production \
      -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
      -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest \
      .

- name: Push to Registry
  run: docker push --all-tags ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
```

###  时区设置

容器默认时区为 UTC，运行命令中已通过 `-e TZ=Asia/Shanghai` 设置为北京时间。

---

> 如有问题，欢迎提交 Issue 或联系维护者。