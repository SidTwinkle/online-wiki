# 快速部署指南

## 🚀 一键部署到Ubuntu服务器

### 方法1：直接下载部署脚本

```bash
# 在Ubuntu服务器上执行
wget https://raw.githubusercontent.com/SidTwinkle/online-wiki/main/deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh

# 然后克隆项目
git clone https://github.com/SidTwinkle/online-wiki.git /opt/online-knowledge-base
cd /opt/online-knowledge-base

# 配置环境变量
cp .env.docker .env
vim .env  # 修改密码和密钥

# 启动服务
docker-compose up -d

# 初始化数据库
sleep 30
docker-compose exec app npx prisma db push
docker-compose exec app npm run db:seed
```

### 方法2：完整命令序列

```bash
# 1. 更新系统并安装Docker
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 2. 配置防火墙
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 3. 克隆项目
git clone https://github.com/SidTwinkle/online-wiki.git /opt/online-knowledge-base
cd /opt/online-knowledge-base

# 4. 配置环境变量
cp .env.docker .env

# 编辑配置文件，修改以下内容：
# POSTGRES_PASSWORD=your-secure-password-here
# JWT_SECRET=your-32-character-secret-key-here
nano .env

# 5. 启动服务
docker-compose up -d

# 6. 初始化数据库
sleep 30
docker-compose exec app npx prisma db push
docker-compose exec app npm run db:seed

# 7. 验证部署
docker-compose ps
curl http://localhost
```

## 🔧 配置要点

### 必须修改的环境变量

在 `.env` 文件中修改：

```bash
# 数据库密码（至少12位强密码）
POSTGRES_PASSWORD=MySecurePassword123!

# JWT密钥（至少32字符）
JWT_SECRET=your-super-secret-jwt-key-32-chars-min

# 数据库连接字符串（使用上面的密码）
DATABASE_URL=postgresql://postgres:MySecurePassword123!@postgres:5432/online_knowledge_base
```

### 验证部署成功

```bash
# 检查所有服务状态
docker-compose ps

# 查看应用日志
docker-compose logs app

# 测试访问
curl http://your-server-ip
```

## 🌐 访问系统

部署成功后：
- 访问地址：`http://your-server-ip`
- 默认登录：系统会引导你创建管理员账户

## 📊 管理命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 备份数据库
docker-compose exec postgres pg_dump -U postgres online_knowledge_base > backup.sql
```

## 🔒 生产环境安全

1. **修改默认密码**
2. **配置SSL证书**
3. **设置防火墙规则**
4. **定期备份数据**

完成部署后，你就可以开始使用在线知识库系统了！