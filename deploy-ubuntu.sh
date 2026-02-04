#!/bin/bash

# Ubuntu系统Docker部署脚本
set -e

echo "=== 在线知识库系统 Ubuntu Docker 部署脚本 ==="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

# 更新系统
echo "1. 更新系统包..."
apt update && apt upgrade -y

# 安装必要的软件包
echo "2. 安装必要软件..."
apt install -y curl wget git vim ufw

# 安装 Docker
echo "3. 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # 将当前用户添加到docker组
    usermod -aG docker $SUDO_USER
    
    # 启动并启用Docker服务
    systemctl start docker
    systemctl enable docker
    
    echo "Docker 安装完成"
else
    echo "Docker 已安装"
fi

# 安装 Docker Compose
echo "4. 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose 安装完成"
else
    echo "Docker Compose 已安装"
fi

# 配置防火墙
echo "5. 配置防火墙..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
echo "防火墙配置完成"

# 创建应用目录
echo "6. 创建应用目录..."
APP_DIR="/opt/online-knowledge-base"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/uploads
mkdir -p $APP_DIR/backups
mkdir -p $APP_DIR/ssl
mkdir -p $APP_DIR/logs

# 设置目录权限
chown -R $SUDO_USER:$SUDO_USER $APP_DIR

echo "7. 部署准备完成！"
echo ""
echo "接下来的步骤："
echo "1. 将项目文件上传到 $APP_DIR"
echo "   - 可以使用 scp, rsync 或者 git clone"
echo "2. 编辑 .env.docker 文件，设置安全的密码"
echo "3. 运行 'docker-compose up -d' 启动服务"
echo ""
echo "示例命令："
echo "# 如果使用 git："
echo "git clone https://github.com/SidTwinkle/online-wiki.git $APP_DIR"
echo ""
echo "# 或者使用 scp 上传文件："
echo "# scp -r /path/to/project/* user@server:$APP_DIR/"
echo ""
echo "cd $APP_DIR"
echo "cp .env.docker .env"
echo "vim .env  # 编辑配置"
echo "docker-compose up -d"
echo ""
echo "访问地址: http://your-server-ip"