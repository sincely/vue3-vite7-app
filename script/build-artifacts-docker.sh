#!/usr/bin/env bash

# 遇到错误立即退出；未定义变量时报错
set -euo pipefail

# 切换到项目根目录（确保从任意位置执行都可用）
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# 项目镜像基础名（与 package.json 脚本保持一致）
IMAGE_BASE="vue3-vite7-app"

# 构建产物目录（用于保存导出的 tar）
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
mkdir -p "$ARTIFACTS_DIR"

# 可选代理参数（例如：--build-arg HTTP_PROXY=... --build-arg HTTPS_PROXY=...）
# 如未设置 PROXY_ARG，则默认空字符串
PROXY_ARG="${PROXY_ARG:-}"

echo "开始构建项目 Docker 镜像..."

# 1) 构建测试镜像（对应 BUILD_MODE=test）
echo "构建测试镜像: ${IMAGE_BASE}:test"
docker build -f Dockerfile -t "${IMAGE_BASE}:test" --build-arg BUILD_MODE=test ${PROXY_ARG} .

# 2) 构建生产镜像（对应 BUILD_MODE=production）
echo "构建生产镜像: ${IMAGE_BASE}:prod"
docker build -f Dockerfile -t "${IMAGE_BASE}:prod" --build-arg BUILD_MODE=production ${PROXY_ARG} .

# 3) 导出镜像到 artifacts 目录，便于分发部署
echo "导出测试镜像到: ${ARTIFACTS_DIR}/${IMAGE_BASE}-test.tar"
docker save -o "${ARTIFACTS_DIR}/${IMAGE_BASE}-test.tar" "${IMAGE_BASE}:test"

echo "导出生产镜像到: ${ARTIFACTS_DIR}/${IMAGE_BASE}-prod.tar"
docker save -o "${ARTIFACTS_DIR}/${IMAGE_BASE}-prod.tar" "${IMAGE_BASE}:prod"

echo "构建完成。当前项目镜像："
docker images | grep -E "${IMAGE_BASE}[[:space:]]+(test|prod)" || true

echo "镜像导出文件："
ls -lh "${ARTIFACTS_DIR}/${IMAGE_BASE}-"*.tar
