#!/bin/bash

# 彩色输出函数
color_echo() {
    local color=$1
    local message=$2
    case $color in
        "green") echo -e "\033[0;32m$message\033[0m" ;;
        "blue") echo -e "\033[0;34m$message\033[0m" ;;
        "yellow") echo -e "\033[1;33m$message\033[0m" ;;
        "red") echo -e "\033[0;31m$message\033[0m" ;;
        "purple") echo -e "\033[0;35m$message\033[0m" ;;
        *) echo "$message" ;;
    esac
}

# 欢迎信息
color_echo "purple" "========================================"
color_echo "purple" "🎄 Grand Luxury Interactive Christmas Tree"
color_echo "purple" "========================================"
color_echo "blue" "正在准备项目启动...\n"

# 检查Node.js是否安装
color_echo "blue" "🔍 检查Node.js安装情况..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    color_echo "green" "✓ Node.js已安装: $NODE_VERSION"
else
    color_echo "red" "✗ Node.js未安装"
    color_echo "yellow" "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
color_echo "blue" "🔍 检查npm安装情况..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    color_echo "green" "✓ npm已安装: $NPM_VERSION"
else
    color_echo "red" "✗ npm未安装"
    color_echo "yellow" "请先安装npm: https://www.npmjs.com/get-npm"
    exit 1
fi

# 检查是否存在node_modules目录
if [ -d "node_modules" ]; then
    color_echo "blue" "🔍 检查依赖是否已安装..."
    color_echo "green" "✓ 依赖已存在，跳过安装"
else
    color_echo "blue" "📦 正在安装项目依赖..."
    if npm install; then
        color_echo "green" "✓ 依赖安装成功"
    else
        color_echo "red" "✗ 依赖安装失败"
        color_echo "yellow" "请检查网络连接或npm配置后重试"
        exit 1
    fi
fi

# 下载模型文件（如果需要）
color_echo "blue" "🔄 检查并下载手势识别模型..."
npm run download-model

# 启动开发服务器
color_echo "blue" "🚀 正在启动项目..."
color_echo "yellow" "项目将在浏览器中自动打开: http://localhost:3010/"
color_echo "yellow" "按 Ctrl+C 可以停止服务器"
color_echo "\n"

# 启动项目并在浏览器中打开
npm run dev
