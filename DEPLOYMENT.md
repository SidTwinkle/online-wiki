# 部署指南

本文档提供了在线知识库系统的详细部署指南，包括开发环境、测试环境和生产环境的配置。

## 🏗️ 部署架构

### 系统要求

**最低要求:**
- CPU: 2核心
- 内存: 4GB RAM
- 存储: 20GB 可用空间
- 网络: 稳定的互联网连接

**推荐配置:**
- CPU: 4核心或更多
- 内存: 8GB RAM或更多
- 存储: 50GB SSD
- 网络: 高速互联网连接

### 支持的平台

- **云平台**: AWS, Google Cloud, Azure, DigitalOcean
- **容器**: Docker, Kubernetes
- **传统服务器**: Ubuntu 20.04+, CentOS 8+, Windows Server 2019+
- **PaaS**: Vercel, Netlify, Railway, Render

## 🐳 Docker 部署

### 1. 创建 Dockerfile

```dockerfile
# 多阶段构建
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

# 生产镜像
FROM node:18-alpine AS runner

WORKDIR /app

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

# 复制构建产物
COPY --from=builder --chown=nuxtjs:nodejs /app/.output /app/.output
COPY --from=builder --chown=nuxtjs:nodejs /app/package*.json /app/

# 创建上传目录
RUN mkdir -p /app/uploads && chown nuxtjs:nodejs /app/uploads

USER nuxtjs

EXPOSE 3000

ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

CMD ["node", ".output/server/index.mjs"]
```

### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/online_knowledge_base
      - JWT_SECRET=your-super-secret-jwt-key-change-in-production
      - NODE_ENV=production
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=online_knowledge_base
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./prisma/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### 3. 部署命令

```bash
# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 更新应用
docker-compose pull
docker-compose up -d --force-recreate
```

## ☁️ 云平台部署

### AWS 部署

#### 使用 AWS ECS

1. **创建 ECR 仓库**
```bash
aws ecr create-repository --repository-name online-knowledge-base
```

2. **构建并推送镜像**
```bash
# 获取登录令牌
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

# 构建镜像
docker build -t online-knowledge-base .

# 标记镜像
docker tag online-knowledge-base:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/online-knowledge-base:latest

# 推送镜像
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/online-knowledge-base:latest
```

3. **创建 ECS 任务定义**
```json
{
  "family": "online-knowledge-base",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "<account-id>.dkr.ecr.us-west-2.amazonaws.com/online-knowledge-base:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://username:password@rds-endpoint:5432/online_knowledge_base"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/online-knowledge-base",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 使用 AWS RDS

```bash
# 创建 PostgreSQL 实例
aws rds create-db-instance \
  --db-instance-identifier online-kb-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.9 \
  --master-username postgres \
  --master-user-password your-secure-password \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --storage-encrypted
```

### Google Cloud Platform 部署

#### 使用 Cloud Run

1. **构建并推送到 Container Registry**
```bash
# 配置 Docker 认证
gcloud auth configure-docker

# 构建镜像
docker build -t gcr.io/PROJECT-ID/online-knowledge-base .

# 推送镜像
docker push gcr.io/PROJECT-ID/online-knowledge-base
```

2. **部署到 Cloud Run**
```bash
gcloud run deploy online-knowledge-base \
  --image gcr.io/PROJECT-ID/online-knowledge-base \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="postgresql://user:pass@host:5432/db" \
  --set-env-vars JWT_SECRET="your-jwt-secret" \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10
```

#### 使用 Cloud SQL

```bash
# 创建 PostgreSQL 实例
gcloud sql instances create online-kb-db \
  --database-version POSTGRES_14 \
  --tier db-f1-micro \
  --region us-central1 \
  --storage-type SSD \
  --storage-size 10GB \
  --backup-start-time 03:00

# 创建数据库
gcloud sql databases create online_knowledge_base --instance online-kb-db

# 创建用户
gcloud sql users create appuser --instance online-kb-db --password your-secure-password
```

## 🔧 传统服务器部署

### Ubuntu/Debian 部署

1. **系统准备**
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y curl wget git nginx postgresql postgresql-contrib

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2
sudo npm install -g pm2
```

2. **数据库配置**
```bash
# 启动 PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql << EOF
CREATE DATABASE online_knowledge_base;
CREATE USER appuser WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE online_knowledge_base TO appuser;
\q
EOF
```

3. **应用部署**
```bash
# 克隆代码
git clone <repository-url> /opt/online-knowledge-base
cd /opt/online-knowledge-base

# 安装依赖
npm ci --only=production

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 构建应用
npm run build

# 数据库迁移
npx prisma generate
npx prisma db push

# 使用 PM2 启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

4. **Nginx 配置**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 配置
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 文件上传大小限制
    client_max_body_size 10M;

    # 代理到 Node.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 上传文件
    location /uploads/ {
        alias /opt/online-knowledge-base/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

### PM2 配置文件

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'online-knowledge-base',
    script: '.output/server/index.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://appuser:secure_password@localhost:5432/online_knowledge_base',
      JWT_SECRET: 'your-super-secret-jwt-key'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}
```

## 🔒 安全配置

### SSL/TLS 证书

#### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 防火墙配置

```bash
# UFW 配置
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# 或者使用 iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -j DROP
```

### 数据库安全

```bash
# PostgreSQL 安全配置
sudo -u postgres psql << EOF
-- 修改默认密码
ALTER USER postgres PASSWORD 'strong_password';

-- 创建应用专用用户
CREATE USER appuser WITH PASSWORD 'app_password';
GRANT CONNECT ON DATABASE online_knowledge_base TO appuser;
GRANT USAGE ON SCHEMA public TO appuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO appuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO appuser;

-- 限制连接
ALTER DATABASE online_knowledge_base CONNECTION LIMIT 20;
\q
EOF
```

## 📊 监控和日志

### 应用监控

1. **PM2 监控**
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs

# 监控面板
pm2 monit
```

2. **系统监控**
```bash
# 安装 htop
sudo apt install htop

# 查看系统资源
htop
```

### 日志管理

1. **应用日志**
```bash
# PM2 日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

2. **Nginx 日志**
```nginx
# 在 nginx.conf 中配置
access_log /var/log/nginx/access.log combined;
error_log /var/log/nginx/error.log warn;

# 日志轮转
sudo logrotate -d /etc/logrotate.d/nginx
```

### 性能监控

1. **数据库性能**
```sql
-- 查看慢查询
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 查看连接数
SELECT count(*) FROM pg_stat_activity;
```

2. **应用性能**
```bash
# 使用 clinic.js 进行性能分析
npm install -g clinic
clinic doctor -- node .output/server/index.mjs
```

## 🔄 备份和恢复

### 数据库备份

```bash
# 创建备份脚本
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="online_knowledge_base"

mkdir -p $BACKUP_DIR

# 创建数据库备份
pg_dump -h localhost -U appuser -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
EOF

chmod +x /opt/backup-db.sh

# 设置定时备份
crontab -e
# 添加: 0 2 * * * /opt/backup-db.sh
```

### 文件备份

```bash
# 备份上传文件
rsync -av /opt/online-knowledge-base/uploads/ /opt/backups/uploads/

# 使用 rclone 同步到云存储
rclone sync /opt/backups/ remote:backups/
```

### 恢复流程

```bash
# 恢复数据库
gunzip -c /opt/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | psql -h localhost -U appuser -d online_knowledge_base

# 恢复文件
rsync -av /opt/backups/uploads/ /opt/online-knowledge-base/uploads/

# 重启应用
pm2 restart online-knowledge-base
```

## 🚀 自动化部署

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
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/online-knowledge-base
          git pull origin main
          npm ci --only=production
          npm run build
          npx prisma generate
          npx prisma db push
          pm2 restart online-knowledge-base
```

## 📈 性能优化

### 数据库优化

```sql
-- 创建索引
CREATE INDEX CONCURRENTLY idx_documents_content_vector ON documents USING GIN(content_vector);
CREATE INDEX CONCURRENTLY idx_documents_path ON documents USING GIST(path);
CREATE INDEX CONCURRENTLY idx_sessions_token ON sessions(token);

-- 配置 PostgreSQL
-- 在 postgresql.conf 中:
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 应用优化

```javascript
// nuxt.config.ts 生产优化
export default defineNuxtConfig({
  nitro: {
    compressPublicAssets: true,
    minify: true
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "~/assets/scss/variables.scss" as *;'
      }
    }
  },
  build: {
    transpile: ['@headlessui/vue']
  }
})
```

## 🆘 故障排除

### 常见问题

1. **数据库连接失败**
```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 检查连接
psql -h localhost -U appuser -d online_knowledge_base

# 查看日志
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

2. **应用启动失败**
```bash
# 查看 PM2 日志
pm2 logs online-knowledge-base

# 检查端口占用
sudo netstat -tlnp | grep :3000

# 手动启动调试
cd /opt/online-knowledge-base
NODE_ENV=production node .output/server/index.mjs
```

3. **文件上传失败**
```bash
# 检查目录权限
ls -la /opt/online-knowledge-base/uploads/

# 修复权限
sudo chown -R www-data:www-data /opt/online-knowledge-base/uploads/
sudo chmod -R 755 /opt/online-knowledge-base/uploads/
```

### 性能问题

1. **内存使用过高**
```bash
# 查看内存使用
free -h
ps aux --sort=-%mem | head

# 调整 PM2 配置
pm2 delete online-knowledge-base
pm2 start ecosystem.config.js
```

2. **数据库查询慢**
```sql
-- 启用查询日志
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- 分析查询计划
EXPLAIN ANALYZE SELECT * FROM documents WHERE content_vector @@ to_tsquery('search term');
```

## 📞 支持

如果在部署过程中遇到问题，请：

1. 查看相关日志文件
2. 检查系统资源使用情况
3. 验证配置文件正确性
4. 参考故障排除部分
5. 提交 Issue 到项目仓库

---

**部署成功后，记得定期更新系统和应用依赖，保持安全性！**