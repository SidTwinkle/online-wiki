# Docker 部署指南

本指南将帮助你在 Ubuntu 系统上使用 Docker 部署在线知识库系统。

## 🚀 快速部署

### 1. 系统要求

- Ubuntu 18.04+ 或其他 Linux 发行版
- 至少 2GB RAM
- 至少 10GB 可用磁盘空间
- 具有 sudo 权限的用户

### 2. 自动安装脚本

```bash
# 下载并运行部署脚本
wget https://raw.githubusercontent.com/SidTwinkle/online-wiki/main/deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

### 3. 手动部署步骤

#### 步骤 1: 安装 Docker 和 Docker Compose

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 重新登录以应用组权限
newgrp docker
```

#### 步骤 2: 克隆项目

```bash
# 克隆项目到服务器
git clone https://github.com/SidTwinkle/online-wiki.git /opt/online-knowledge-base
cd /opt/online-knowledge-base

# 或者手动上传文件到服务器
# scp -r /path/to/project/* user@server:/opt/online-knowledge-base/
```

#### 步骤 3: 配置环境变量

```bash
# 复制环境变量文件
cp .env.docker .env

# 编辑配置文件
vim .env
```

**重要**: 修改以下配置项：
- `POSTGRES_PASSWORD`: 设置强密码
- `JWT_SECRET`: 设置至少32字符的随机字符串

#### 步骤 4: 启动服务

```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 步骤 5: 初始化数据库

```bash
# 等待数据库启动后，运行数据库迁移
docker-compose exec app npx prisma db push

# 可选：添加种子数据
docker-compose exec app npm run db:seed
```

## 📁 文件结构

```
/opt/online-knowledge-base/
├── docker-compose.yml          # 开发环境配置
├── docker-compose.prod.yml     # 生产环境配置
├── Dockerfile                  # 应用镜像构建文件
├── nginx.conf                  # Nginx 配置
├── .env                       # 环境变量
├── uploads/                   # 文件上传目录
├── backups/                   # 数据库备份目录
├── ssl/                       # SSL 证书目录
└── logs/                      # 日志目录
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `POSTGRES_PASSWORD` | PostgreSQL 密码 | `your-secure-password` |
| `JWT_SECRET` | JWT 密钥 | `your-32-char-secret-key` |
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://...` |
| `UPLOAD_DIR` | 文件上传目录 | `/app/uploads` |
| `MAX_FILE_SIZE` | 最大文件大小 | `10485760` (10MB) |

### 端口配置

- **80**: HTTP 访问端口
- **443**: HTTPS 访问端口 (需要SSL证书)
- **3000**: 应用内部端口
- **5432**: PostgreSQL 数据库端口

## 🔒 生产环境部署

### 1. 使用生产配置

```bash
# 使用生产环境配置文件
docker-compose -f docker-compose.prod.yml up -d
```

### 2. 配置 SSL 证书

#### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

#### 更新 Nginx 配置

编辑 `nginx.conf`，取消 HTTPS 部分的注释并更新域名。

### 3. 配置防火墙

```bash
# 启用 UFW 防火墙
sudo ufw enable

# 允许必要端口
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 查看状态
sudo ufw status
```

## 📊 监控和维护

### 查看服务状态

```bash
# 查看所有服务状态
docker-compose ps

# 查看特定服务日志
docker-compose logs app
docker-compose logs postgres
docker-compose logs nginx

# 实时查看日志
docker-compose logs -f app
```

### 数据库备份

```bash
# 手动备份
docker-compose exec postgres pg_dump -U postgres online_knowledge_base > backup_$(date +%Y%m%d).sql

# 使用备份脚本
docker-compose --profile backup run backup

# 恢复备份
docker-compose exec -T postgres psql -U postgres online_knowledge_base < backup_file.sql
```

### 更新应用

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose build --no-cache
docker-compose up -d

# 运行数据库迁移
docker-compose exec app npx prisma db push
```

## 🛠️ 故障排除

### 常见问题

#### 1. 容器启动失败

```bash
# 查看详细错误信息
docker-compose logs app

# 检查容器状态
docker-compose ps

# 重启服务
docker-compose restart app
```

#### 2. 数据库连接失败

```bash
# 检查数据库状态
docker-compose exec postgres pg_isready -U postgres

# 查看数据库日志
docker-compose logs postgres

# 重启数据库
docker-compose restart postgres
```

#### 3. 文件上传失败

```bash
# 检查上传目录权限
ls -la uploads/

# 修复权限
sudo chown -R 1001:1001 uploads/
sudo chmod -R 755 uploads/
```

#### 4. 内存不足

```bash
# 查看系统资源使用
docker stats

# 查看系统内存
free -h

# 重启服务释放内存
docker-compose restart
```

### 性能优化

#### 1. 数据库优化

```bash
# 进入数据库容器
docker-compose exec postgres psql -U postgres online_knowledge_base

# 创建索引
CREATE INDEX CONCURRENTLY idx_documents_content ON documents USING GIN(to_tsvector('english', content));
```

#### 2. 应用优化

编辑 `docker-compose.yml`，调整资源限制：

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```

## 🔄 自动化部署

### GitHub Actions

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/online-knowledge-base
          git pull origin main
          docker-compose build --no-cache
          docker-compose up -d
          docker-compose exec app npx prisma db push
```

### 定时备份

添加到 crontab：

```bash
# 编辑 crontab
crontab -e

# 添加每日备份任务
0 2 * * * cd /opt/online-knowledge-base && docker-compose --profile backup run backup
```

## 📞 支持

如果遇到问题：

1. 查看相关日志文件
2. 检查系统资源使用情况
3. 验证配置文件正确性
4. 参考故障排除部分
5. 提交 Issue 到项目仓库

## 🎯 部署检查清单

- [ ] 系统要求满足
- [ ] Docker 和 Docker Compose 已安装
- [ ] 环境变量已正确配置
- [ ] 防火墙规则已设置
- [ ] SSL 证书已配置（生产环境）
- [ ] 数据库备份策略已设置
- [ ] 监控和日志已配置
- [ ] 应用可以正常访问

部署完成后，访问 `http://your-server-ip` 即可使用系统！