# =============================================================
# 全局构建参数（必须在所有 FROM 之前声明才能在 FROM 行中使用）
# 修改版本时同步更新 Dockerfile.dev 中的 ARG NODE_VERSION
# =============================================================
ARG NODE_VERSION=22-alpine
ARG NGINX_VERSION=alpine

# =============================================================
# 阶段一：构建阶段 (builder)
# 使用 Node 22-alpine 镜像安装依赖并打包前端资源
# =============================================================
FROM node:${NODE_VERSION} AS builder

# 创建工作目录（类似在服务器上建一个专门的文件夹放代码）
WORKDIR /app

# 安装 pnpm（版本与 package.json engines 字段保持一致）
RUN npm install -g pnpm@latest --registry=https://registry.npmmirror.com

# 优先复制依赖声明文件，利用 Docker 层缓存
# 只有 package.json / pnpm-lock.yaml 变化时才重新安装依赖
COPY package.json pnpm-lock.yaml ./

# 安装依赖（生产 + 开发，构建需要 devDependencies）
# --frozen-lockfile 保证 lock 文件一致性
RUN pnpm install --frozen-lockfile --registry=https://registry.npmmirror.com

# 复制源码（.dockerignore 已排除 node_modules / dist 等）
COPY . .

# 构建参数：通过 --build-arg 指定打包模式（默认 production）
#
ARG BUILD_MODE=production

# 执行构建，产物输出到 /app/dist
RUN pnpm run build:${BUILD_MODE}

# =============================================================
# 阶段二：运行阶段 (runner)
# 使用轻量 Nginx Alpine 镜像提供静态文件服务
# =============================================================
FROM nginx:${NGINX_VERSION} AS runner

# 镜像元信息
LABEL maintainer="成舟<1738248438@qq.com.com>"
LABEL org.opencontainers.image.title="vue3-vite7-app"
LABEL org.opencontainers.image.description="Vue3 + Vite7 前端应用，使用 Nginx 提供静态资源服务"
LABEL org.opencontainers.image.version="0.0.2"

# 删除默认 Nginx 配置，替换为项目自定义配置
RUN rm -f /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf

# 复制自定义 Nginx 配置
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# 从构建阶段复制编译产物到Nginx静态资源目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 确保Nginx日志目录权限正确（可选Alpine下nginx用户已有权限）
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

# EXPOSE不会实际开放端口，单纯的语法，不写也行（NGINX默认就是80端口）
EXPOSE 80

# 健康检查：每 30 秒检测一次，确保 Nginx 正常响应
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

# 启动 Nginx（前台运行，保持容器存活）
CMD ["nginx", "-g", "daemon off;"]
