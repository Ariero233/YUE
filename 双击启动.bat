@echo off
chcp 65001 >nul

cd /d "%~dp0"
echo =======================================
echo 🎄 Grand Luxury Interactive Christmas Tree
echo =======================================
echo 正在准备项目启动...
echo.

rem 检查Node.js是否安装
echo 🔍 检查Node.js安装情况...
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✓ Node.js已安装: %NODE_VERSION%
) else (
    echo ✗ Node.js未安装
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

rem 检查npm是否安装
echo 🔍 检查npm安装情况...
where npm >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✓ npm已安装: %NPM_VERSION%
) else (
    echo ✗ npm未安装
    echo 请先安装npm: https://www.npmjs.com/get-npm
    pause
    exit /b 1
)

rem 检查是否存在node_modules目录
if exist "node_modules" (
    echo 🔍 检查依赖是否已安装...
    echo ✓ 依赖已存在，跳过安装
) else (
    echo 📦 正在安装项目依赖...
    call npm install
    if %errorlevel% equ 0 (
        echo ✓ 依赖安装成功
    ) else (
        echo ✗ 依赖安装失败
        echo 请检查网络连接或npm配置后重试
        pause
        exit /b 1
    )
)

rem 下载模型文件（如果需要）
echo 🔄 检查并下载手势识别模型...
call npm run download-model

rem 启动开发服务器
echo 🚀 正在启动项目...
echo 项目将在浏览器中自动打开: http://localhost:3010/
echo 按 Ctrl+C 可以停止服务器
echo.

rem 启动项目并在浏览器中打开
call npm run dev
