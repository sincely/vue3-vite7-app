# Docker 构建脚本使用指南

本项目提供 `build-image.js` 脚本，支持多环境条件编译和镜像导出。

---

## 📋 快速参考

### Windows 用户

```bash
build.bat           # 构建生产镜像（默认）
build.bat dev       # 构建开发镜像
build.bat test      # 构建测试镜像
build.bat prod      # 构建生产镜像
```

### Linux/Mac 用户

```bash
node build-image.js --help        # 显示帮助
node build-image.js               # 构建生产镜像（默认）
node build-image.js dev           # 构建开发镜像
node build-image.js test          # 构建测试镜像
node build-image.js prod          # 构建生产镜像
```

---

## 🎯 详细用法

### 1. 构建开发镜像

**Windows**：
```bash
build.bat dev
```

**Linux/Mac**：
```bash
node build-image.js dev
```

**效果**：
- 使用 `Dockerfile.dev` 构建
- 读取 `.env.development` 配置
- 启动 Vite 开发服务器（端口 5173）
- **不导出 tar 文件**（本地开发使用）

**启动容器**：
```bash
pnpm docker:run:dev
```

---

### 2. 构建测试镜像

**Windows**：
```bash
build.bat test
```

**Linux/Mac**：
```bash
node build-image.js test
```

**效果**：
- 使用 `Dockerfile` 多阶段构建
- 读取 `.env.test` 配置
- 构建参数：`BUILD_MODE=test`
- **自动导出** `vue3-vite7-app-test.tar`（约 25MB）

**导出的文件**：
```
vue3-vite7-app-test.tar    # 可直接加载到其他服务器
```

**部署到服务器**：
```bash
# 1. 上传文件
scp vue3-vite7-app-test.tar user@test-server:/deploy/

# 2. 在服务器上加载
docker load -i vue3-vite7-app-test.tar

# 3. 启动容器
docker run -d -p 8080:80 vue3-vite7-app:test

# 4. 访问
curl http://localhost:8080
```

---

### 3. 构建生产镜像

**Windows**：
```bash
build.bat prod
# 或简写
build.bat
```

**Linux/Mac**：
```bash
node build-image.js prod
# 或简写
node build-image.js
```

**效果**：
- 使用 `Dockerfile` 多阶段构建
- 读取 `.env.production` 配置
- 构建参数：`BUILD_MODE=production`
- **自动导出** `vue3-vite7-app-prod.tar`（约 25MB）

**导出的文件**：
```
vue3-vite7-app-prod.tar     # 生产镜像
```

**部署到生产服务器**：
```bash
# 1. 上传文件
scp vue3-vite7-app-prod.tar user@prod-server:/deploy/

# 2. 在服务器上加载
docker load -i vue3-vite7-app-prod.tar

# 3. 启动容器（带自动重启）
docker run -d \
  -p 80:80 \
  --restart=unless-stopped \
  --name vue3-app-prod \
  vue3-vite7-app:prod

# 4. 验证
curl http://your-domain.com
```

---

## 🔧 高级用法

### 查看帮助

```bash
node build-image.js --help
```

输出所有可用选项和示例。

### 仅构建，不导出 tar

```bash
# 开发环境（原本就不导出）
node build-image.js dev

# 测试环境（禁止导出）
node build-image.js test --no-export

# 生产环境（禁止导出）
node build-image.js prod --no-export
```

**场景**：本地快速验证镜像，无需导出文件。

### 查看环境配置

```bash
node build-image.js test --show-env
```

**输出示例**：
```
📋 环境配置详情
ℹ️  环境: test
ℹ️  描述: 测试环境（完整构建）
ℹ️  Dockerfile: Dockerfile
ℹ️  配置文件: .env.test
ℹ️  构建模式: test
ℹ️  镜像名称: vue3-vite7-app:test
ℹ️  导出 tar: 是
ℹ️  端口: 8080
ℹ️  构建参数: --build-arg BUILD_MODE=test

环境变量：
  VITE_API_URL = https://test.api.example.com
  VITE_APP_TITLE = My App - Test
  VITE_ENABLE_MOCK = true
```

### 支持的参数格式

```bash
# 方式 1: 直接环境名（最简单）
node build-image.js dev

# 方式 2: 标准格式
node build-image.js --env test

# 方式 3: npm 兼容格式
node build-image.js --mode prod

# 方式 4: 简写格式
node build-image.js -e dev

# 方式 5: 组合选项
node build-image.js test --no-export --show-env
```

---

## 📊 环境对比表

| 维度 | dev | test | prod |
|------|-----|------|------|
| Dockerfile | Dockerfile.dev | Dockerfile | Dockerfile |
| 构建模式 | development | test | production |
| 配置文件 | .env.development | .env.test | .env.production |
| Vite 热更新 | ✅ 开启 | ❌ 关闭 | ❌ 关闭 |
| 导出 tar | ❌ 否 | ✅ 是 | ✅ 是 |
| 服务方式 | Vite 服务器 | Nginx | Nginx |
| 端口 | 5173 | 8080 | 80 |
| Volume 挂载 | ✅ 源码动态挂载 | ❌ 静态编译 | ❌ 静态编译 |
| 用途 | 本地开发 | 测试部署 | 正式发布 |

---

## 🔄 完整工作流

### 完整开发流程

```bash
# 1. 第一次构建开发环境
node build-image.js dev

# 2. 启动开发容器
pnpm docker:run:dev

# 3. 修改代码 → 容器自动刷新（HMR）

# 4. 停止开发
pnpm docker:stop:dev

# 5. 如果依赖有更新，重新构建
node build-image.js dev
```

### 完整测试流程

```bash
# 1. 检查环境配置
node build-image.js test --show-env

# 2. 构建测试镜像（自动导出 tar）
node build-image.js test

# 3. 本地验证
docker run -d -p 8080:80 vue3-vite7-app:test
curl http://localhost:8080
docker logs -f $(docker ps --filter "ancestor=vue3-vite7-app:test" -q)

# 4. 上传到测试服务器
scp vue3-vite7-app-test.tar user@test-server:/deploy/

# 5. 在服务器上部署
ssh user@test-server
cd /deploy
docker load -i vue3-vite7-app-test.tar
docker run -d -p 8080:80 --name test-app vue3-vite7-app:test
docker logs -f test-app
```

### 完整生产发布流程

```bash
# 1. 检查生产环境配置
node build-image.js prod --show-env

# 2. 构建生产镜像
node build-image.js prod

# 3. 本地验证
docker run -d -p 80:80 vue3-vite7-app:prod
curl http://localhost

# 4. 查看镜像信息
docker images | grep vue3-vite7-app
docker inspect vue3-vite7-app:prod

# 5. 上传到生产服务器
scp vue3-vite7-app-prod.tar user@prod-server:/deploy/

# 6. 在生产服务器上部署
ssh user@prod-server
cd /deploy
docker load -i vue3-vite7-app-prod.tar

# 7. 启动容器（带自动重启和资源限制）
docker run -d \
  --name vue3-app \
  -p 80:80 \
  --restart=unless-stopped \
  --memory=512m \
  --cpus=0.5 \
  vue3-vite7-app:prod

# 8. 验证部署
docker ps
docker logs -f vue3-app
curl http://your-production-domain.com

# 9. 监控容器
docker stats vue3-app
```

---

## 🧪 故障排查

### 问题 1: 找不到 Dockerfile

```
❌ 找不到 Dockerfile
```

**原因**：当前目录不对，或 Dockerfile 已删除

**解决**：
```bash
# 确认在项目根目录
pwd  # 应该包含 vue3-vite7-app

# 检查文件存在
ls -la Dockerfile Dockerfile.dev

# 重新构建
node build-image.js dev
```

### 问题 2: Docker 不可用

```
❌ Docker 不可用或未安装
```

**原因**：Docker 未安装或未启动

**解决**：
```bash
# macOS：启动 Docker Desktop
open -a Docker

# Linux：检查 Docker 服务
sudo systemctl start docker

# 验证
docker --version
docker ps
```

### 问题 3: 镜像导出失败

```
❌ 镜像导出失败
```

**原因**：磁盘空间不足

**解决**：
```bash
# 检查磁盘空间
df -h

# 清理 Docker 资源
docker system prune -f

# 重新导出
node build-image.js test
```

### 问题 4: 权限错误（Linux）

```
❌ permission denied while trying to connect to Docker daemon
```

**解决**：
```bash
# 方式 1：添加用户到 docker 组
sudo usermod -aG docker $USER
# 然后注销并重新登录

# 方式 2：使用 sudo
sudo node build-image.js prod
```

---

## 💡 最佳实践

### ✅ 推荐做法

1. **开发环境**
   ```bash
   # 快速迭代，使用脚本或 pnpm docker:run:dev
   node build-image.js dev
   pnpm docker:run:dev
   ```

2. **测试部署**
   ```bash
   # 完整验证，导出 tar 上传
   node build-image.js test
   # 上传并部署到测试服务器
   ```

3. **生产发布**
   ```bash
   # 严格验证，备份镜像
   node build-image.js prod
   # 保存 tar 文件作为备份
   # 上传并部署到生产服务器
   ```

### ❌ 避免做法

1. **不要频繁在生产环境测试**
   ```bash
   # ❌ 不要这样做
   node build-image.js prod --no-export  # 本地频繁测试
   ```

2. **不要混用多种构建方式**
   ```bash
   # 保持一致性，选择其中一种
   docker build vs node build-image.js vs pnpm docker:build:prod
   ```

3. **不要忽视环境配置**
   ```bash
   # 务必检查 .env 文件是否正确
   node build-image.js prod --show-env
   ```

---

## 📚 相关文件

- [README.md](README.md) - 项目总览
- [docker.md](docker.md) - Docker 完整文档
- [DOCKER_GUIDE.md](DOCKER_GUIDE.md) - Docker 详细指南
- [Dockerfile](Dockerfile) - 生产/测试镜像定义
- [Dockerfile.dev](Dockerfile.dev) - 开发环境定义
- [.env.development](.env.development) - 开发环境变量
- [.env.test](.env.test) - 测试环境变量
- [.env.production](.env.production) - 生产环境变量

---

## 📞 常见问题

**Q: 为什么开发环境不导出 tar？**
A: 开发环境使用 Vite 热更新，代码在容器内编译。导出 tar 没有意义，建议用 Volume 挂载。

**Q: 如何在 CI/CD 中使用这个脚本？**
A: 参考 docker.md 中的 CI/CD 示例，使用 `--no-cache` 强制重建。

**Q: 如何自定义镜像名称或版本号？**
A: 编辑 `build-image.js` 中的 `ENVIRONMENTS` 配置，或 fork 项目自定义。

**Q: 生成的 tar 文件能在其他机器上运行吗？**
A: 可以。只要目标机器安装了 Docker，就能 `docker load` 加载并运行。

---

**最后更新**: 2026 年 3 月 16 日
