#!/bin/bash

# 数据库备份脚本
set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="online_knowledge_base"
DB_USER="postgres"
DB_HOST="postgres"

echo "开始数据库备份..."

# 创建备份目录
mkdir -p $BACKUP_DIR

# 创建数据库备份
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "数据库备份完成: db_backup_$DATE.sql.gz"

# 备份文件列表
echo "当前备份文件:"
ls -la $BACKUP_DIR/db_backup_*.sql.gz