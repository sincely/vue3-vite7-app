#!/bin/bash

echo "🚀 开始部署Docker镜像到服务器..."

# 配置变量（镜像名称在构建时指定，容器名称在运行时指定）
CONTAINER_NAME="html-app-container"
IMAGE_NAME="my-html-app"
TAR_FILE="${IMAGE_NAME}.tar"
PORT="20000"

# 检查tar文件是否存在
if [ ! -f "$TAR_FILE" ]; then
    echo "❌ 找不到镜像文件: $TAR_FILE"
    echo "请确保已将镜像文件复制到当前目录"
    exit 1
fi

echo "📁 找到镜像文件: $TAR_FILE"

# 停止并删除现有容器（如果存在）
echo "🛑 停止并删除现有容器..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# 删除现有镜像（如果存在）
echo "🗑️  删除现有镜像..."
docker rmi $IMAGE_NAME:latest 2>/dev/null || true

# 导入镜像
echo "📥 导入Docker镜像..."
docker load -i $TAR_FILE

# 运行容器
echo "🚀 启动新容器..."
docker run -d -p $PORT:80 --name $CONTAINER_NAME $IMAGE_NAME:latest

# 检查容器状态
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 部署成功！"
    echo "📊 容器状态:"
    docker ps | grep $CONTAINER_NAME
    echo ""
    echo "🌐 访问地址:"
    echo "   直接访问: http://localhost:$PORT"
    echo "   通过nginx代理: https://ashuai.site/dockerDemo/"
    echo ""
    echo "📋 有用的命令:"
    echo "   查看日志: docker logs $CONTAINER_NAME"
    echo "   停止容器: docker stop $CONTAINER_NAME"
    echo "   重启容器: docker restart $CONTAINER_NAME"
else
    echo "❌ 容器启动失败"
    exit 1
fi
