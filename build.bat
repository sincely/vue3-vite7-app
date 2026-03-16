@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM Docker 镜像构建脚本（Windows Batch）
REM ============================================================
REM 用法:
REM   build.bat                      构建生产镜像（默认）
REM   build.bat dev                  构建开发镜像
REM   build.bat test                 构建测试镜像
REM   build.bat production                 构建生产镜像
REM ============================================================

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║        Docker 镜像构建脚本 (Windows)                   ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM 默认环境为 production
set ENV=production

REM 检查是否提供了参数
if not "%~1"=="" (
    set ENV=%~1
)

echo 📦 环境: %ENV%
echo.

REM 执行 Node.js 构建脚本
node build-image.js --env %ENV%

if %ERRORLEVEL% equ 0 (
    echo.
    echo ✅ Docker 镜像构建完成！
    echo.
    echo 后续命令：
    echo   查看镜像：docker images vue3-vite7-app
    echo   启动容器：pnpm docker:run:%ENV%
    echo.
) else (
    echo.
    echo ❌ Docker 镜像构建失败！
    echo.
    pause
    exit /b 1
)

endlocal
