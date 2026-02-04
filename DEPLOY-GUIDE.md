# Ubuntu Docker 部署指南

## 📋 部署方式选择

### 方式一：直接上传文件部署

1. **在本地打包项目文件**
```bash
# 在项目根目录执行
tar -czf online-knowledge-base.tar.gz --exclude=node_modules --exclude=.nuxt --exclude=.output .
```

2. **上传到Ubuntu服务器**
```bash
# 使用scp上传（替换为你的服务器信息）
scp online-knowledge-base.tar.gz user@your-server-ip:/tmp/

# 或使用其他方式上传文件
```

3. **在服务器上解压和部署**
```bash
# SSH连接到服务器
ssh user@your-server-ip

# 创建应用目录
sudo mkdir -p /opt/online-knowledge-base
cd /opt/online-knowledge-base

# 解压文件
sudo tar -xzf /tmp/online-knowledge-base.tar.gz -C /opt/online-knowledge-base

# 设置权限
sudo chown -R $USER:$USER /opt/online-knowledge-base

# 运行部署脚本
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

### 方式二：使用Git部署

如果你的项目已经上传到Git仓库（GitHub、GitLab等）：

```bash
# SSH连接到服务器
ssh user@your-server-ip

# 克隆项目
git clone https://github.com/your-username/your-repo-name.git /opt/online-knowledge-base
cd /opt/online-knowledge-base

# 运行部署脚本
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

## 🚀 快速部署步骤

### 1. 准备Ubuntu服务器

确保你的Ubuntu服务器满足以下要求：
- Ubuntu 18.04+ 
- 至少2GB RAM
- 至少10GB可用磁盘空间
- 具有sudo权限的用户账户

### 2. 上传项目文件

选择上面的方式一或方式二上传项目文件到 `/opt/online-knowledge-base`

### 3. 运行自动部署脚本

```bash
cd /opt/online-knowledge-base
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

这个脚本会自动：
- 更新系统包
- 安装Docker和Docker Compose
- 配置防火墙
- 创建必要的目录

### 4. 配置环境变量

```bash
cd /opt/online-knowledge-base
cp .env.docker .env
vim .env
```

**重要**：修改以下配置：
```bash
# 设置强密码（至少12位）
POSTGRES_PASSWORD=your-very-secure-password-here

# 设置JWT密钥（至少32字符）
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
```

### 5. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 6. 初始化数据库

```bash
# 等待数据库完全启动（约30秒）
sleep 30

# 运行数据库迁移
docker-compose exec app npx prisma db push

# 可选：添加测试数据
docker-compose exec app npm run db:seed
```

## 🔍 验证部署

### 检查服务状态
```bash
# 查看所有容器状态
docker-compose ps

# 应该看到类似输出：
#     Name                   Command               State           Ports         
# --------------------------------------------------------------------------
# knowledge-base-app   docker-entrypoint.sh node ...   Up      0.0.0.0:3000->3000/tcp
# nginx-proxy          /docker-entrypoint.sh ngin ...   Up      0.0.0.0:443->443/tcp, 0.0.0.0:80->80/tcp
# postgres-kb          docker-entrypoint.sh postgres   Up      0.0.0.0:5432->5432/tcp
```

### 测试访问
```bash
# 测试本地访问
curl http://localhost

# 或在浏览器中访问
# http://your-server-ip
```

## 🔧 常用管理命令

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs app
docker-compose logs postgres
docker-compose logs nginx

# 实时查看日志
docker-compose logs -f app
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart app
```

### 停止服务
```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

### 更新应用
```bash
# 如果使用Git
git pull origin main

# 重新构建并启动
docker-compose build --no-cache
docker-compose up -d

# 运行数据库迁移
docker-compose exec app npx prisma db push
```

## 🔒 安全配置

### 1. 配置防火墙
```bash
# 启用防火墙
sudo ufw enable

# 允许SSH
sudo ufw allow ssh

# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 查看状态
sudo ufw status
```

### 2. 配置SSL证书（生产环境）

#### 使用Let's Encrypt
```bash
# 安装Certbot
sudo apt install certbot

# 停止nginx容器
docker-compose stop nginx

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 复制证书
sudo mkdir -p /opt/online-knowledge-base/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/online-knowledge-base/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/online-knowledge-base/ssl/key.pem
sudo chown $USER:$USER /opt/online-knowledge-base/ssl/*.pem

# 更新nginx配置启用HTTPS
vim nginx.conf  # 取消HTTPS部分的注释

# 重启nginx
docker-compose up -d nginx
```

## 📊 备份和恢复

### 数据库备份
```bash
# 手动备份
docker-compose exec postgres pg_dump -U postgres online_knowledge_base > backup_$(date +%Y%m%d).sql

# 恢复备份
docker-compose exec -T postgres psql -U postgres online_knowledge_base < backup_file.sql
```

### 文件备份
```bash
# 备份上传的文件
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 🆘 故障排除

### 常见问题

1. **容器无法启动**
```bash
# 查看详细错误
docker-compose logs app

# 检查端口占用
sudo netstat -tlnp | grep :3000
```

2. **数据库连接失败**
```bash
# 检查数据库状态
docker-compose exec postgres pg_isready -U postgres

# 重启数据库
docker-compose restart postgres
```

3. **访问403/404错误**
```bash
# 检查nginx配置
docker-compose exec nginx nginx -t

# 重启nginx
docker-compose restart nginx
```

4. **内存不足**
```bash
# 查看系统资源
free -h
docker stats

# 清理Docker缓存
docker system prune -a
```

## 📞 获取帮助

如果遇到问题：
1. 查看相关日志文件
2. 检查系统资源使用情况
3. 验证配置文件正确性
4. 参考故障排除部分

部署完成后，你可以通过 `http://your-server-ip` 访问系统！