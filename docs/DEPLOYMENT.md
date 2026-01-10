# Deployment Guide

Complete guide for deploying the CryptoSimpleDataPipeline to production.

## Table of Contents

1. [Production Requirements](#production-requirements)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Scaling Strategies](#scaling-strategies)

---

## Production Requirements

### Hardware

**Minimum**:
- CPU: 2 cores
- RAM: 4 GB
- Storage: 50 GB SSD
- Network: 100 Mbps

**Recommended**:
- CPU: 4+ cores
- RAM: 8+ GB
- Storage: 100+ GB SSD
- Network: 1 Gbps

### Software

- **OS**: Linux (Ubuntu 22.04 LTS recommended)
- **Python**: 3.12+
- **MySQL**: 8.0+
- **Node.js**: 18+ (for frontend build)
- **Nginx**: Latest (reverse proxy)
- **SSL Certificate**: Let's Encrypt or commercial

---

## Environment Setup

### 1. System Updates

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.12 python3-pip python3-venv mysql-server nginx certbot python3-certbot-nginx
```

### 2. Create Application User

```bash
sudo useradd -m -s /bin/bash cryptoapp
sudo usermod -aG sudo cryptoapp
```

### 3. Clone Repository

```bash
sudo su - cryptoapp
cd /opt
git clone <repository-url> CryptoSimpleDataPipeline
cd CryptoSimpleDataPipeline
```

### 4. Python Environment

```bash
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Environment Variables

Create production `.env`:

```bash
nano .env
```

```bash
# Database
DB_HOST=localhost
DB_USER=cryptoapp
DB_PASSWORD=<strong-password>
DB_NAME=crypto_pipeline

# Symbols
SYMBOLS=BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,ADAUSDT

# Flask
FLASK_DEBUG=False
FLASK_PORT=5001

# Data Lake
DATA_LAKE_DIR=/var/lib/crypto-pipeline/data_lake
```

**Security**: Never commit `.env` to git. Use environment-specific values.

---

## Database Configuration

### 1. MySQL Secure Installation

```bash
sudo mysql_secure_installation
```

Follow prompts:
- Set root password: Yes
- Remove anonymous users: Yes
- Disallow root login remotely: Yes
- Remove test database: Yes
- Reload privilege tables: Yes

### 2. Create Database and User

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE crypto_pipeline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cryptoapp'@'localhost' IDENTIFIED BY '<strong-password>';
GRANT ALL PRIVILEGES ON crypto_pipeline.* TO 'cryptoapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Initialize Schema

```bash
python rebuild_database.py
```

### 4. MySQL Configuration for Production

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# Performance
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
max_connections = 200

# Security
bind-address = 127.0.0.1

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

---

## Backend Deployment

### 1. Install Gunicorn

```bash
pip install gunicorn
```

### 2. Create Gunicorn Service

Create `/etc/systemd/system/crypto-backend.service`:

```ini
[Unit]
Description=Crypto Pipeline Backend
After=network.target mysql.service

[Service]
Type=notify
User=cryptoapp
Group=cryptoapp
WorkingDirectory=/opt/CryptoSimpleDataPipeline
Environment="PATH=/opt/CryptoSimpleDataPipeline/venv/bin"
ExecStart=/opt/CryptoSimpleDataPipeline/venv/bin/gunicorn \
    --bind 127.0.0.1:5001 \
    --workers 4 \
    --timeout 120 \
    --access-logfile /var/log/crypto-backend/access.log \
    --error-logfile /var/log/crypto-backend/error.log \
    src.web.app:app

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Create Log Directory

```bash
sudo mkdir -p /var/log/crypto-backend
sudo chown cryptoapp:cryptoapp /var/log/crypto-backend
```

### 4. Create Data Lake Directory

```bash
sudo mkdir -p /var/lib/crypto-pipeline/data_lake/{raw,archive}
sudo chown -R cryptoapp:cryptoapp /var/lib/crypto-pipeline
```

### 5. Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable crypto-backend
sudo systemctl start crypto-backend
sudo systemctl status crypto-backend
```

### 6. Setup Scheduler (Cron)

Since APScheduler has issues, use cron for scheduling:

```bash
crontab -e
```

Add:
```cron
# Run pipeline every 5 minutes
*/5 * * * * cd /opt/CryptoSimpleDataPipeline && /opt/CryptoSimpleDataPipeline/venv/bin/python -c "from src.web.app import pipeline_job; pipeline_job()" >> /var/log/crypto-backend/pipeline.log 2>&1

# Run maintenance every Sunday at 2 AM
0 2 * * 0 cd /opt/CryptoSimpleDataPipeline && /opt/CryptoSimpleDataPipeline/venv/bin/python -c "from src.web.app import maintenance_job; maintenance_job()" >> /var/log/crypto-backend/maintenance.log 2>&1
```

---

## Frontend Deployment

### 1. Build Frontend

```bash
cd frontend
npm install
npm run build
```

**Output**: `frontend/dist/`

### 2. Nginx Configuration

Create `/etc/nginx/sites-available/crypto-pipeline`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend (React SPA)
    root /opt/CryptoSimpleDataPipeline/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### 3. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/crypto-pipeline /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d your-domain.com
```

Follow prompts and test auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## Security Hardening

### 1. Firewall (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. Restrict MySQL Access

Ensure MySQL only listens on localhost:
```bash
sudo netstat -an | grep 3306
```

Should show: `127.0.0.1:3306`

### 3. Secure Environment Variables

```bash
chmod 600 .env
chown cryptoapp:cryptoapp .env
```

### 4. Update CORS in Production

Edit `src/web/app.py`:

```python
CORS(app, 
     resources={r"/api/*": {
         "origins": ["https://your-domain.com"],  # Specific domain only
         "methods": ["GET", "POST"],
     }})
```

### 5. Disable Debug Mode

Ensure `.env` has:
```bash
FLASK_DEBUG=False
```

### 6. Regular Updates

```bash
# Weekly
sudo apt update && sudo apt upgrade -y
sudo certbot renew
```

---

## Monitoring & Logging

### 1. Application Logs

**Backend Logs**:
- Access: `/var/log/crypto-backend/access.log`
- Error: `/var/log/crypto-backend/error.log`
- Pipeline: `/var/log/crypto-backend/pipeline.log`
- Maintenance: `/var/log/crypto-backend/maintenance.log`

**Nginx Logs**:
- Access: `/var/log/nginx/access.log`
- Error: `/var/log/nginx/error.log`

**MySQL Logs**:
- Error: `/var/log/mysql/error.log`
- Slow Query: `/var/log/mysql/slow-query.log`

### 2. Log Rotation

Create `/etc/logrotate.d/crypto-pipeline`:

```
/var/log/crypto-backend/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 cryptoapp cryptoapp
    sharedscripts
    postrotate
        systemctl reload crypto-backend
    endscript
}
```

### 3. Monitoring Tools

**Recommended**:
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Application Monitoring**: Sentry (error tracking)
- **Server Monitoring**: Netdata, Prometheus + Grafana
- **Log Aggregation**: ELK Stack, Loki

### 4. Health Check Endpoint

Add to `src/web/app.py`:

```python
@app.route('/health')
def health_check():
    try:
        conn = mysql.connector.connect(**db_config)
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"}), 200
    except:
        return jsonify({"status": "unhealthy", "database": "disconnected"}), 503
```

Monitor with:
```bash
curl https://your-domain.com/health
```

---

## Backup & Recovery

### 1. Database Backup

**Automated Daily Backup**:

Create `/opt/scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR=/var/backups/crypto-pipeline
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -u cryptoapp -p$DB_PASSWORD crypto_pipeline | gzip > $BACKUP_DIR/crypto_pipeline_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

Make executable:
```bash
chmod +x /opt/scripts/backup-db.sh
```

Add to crontab:
```cron
0 3 * * * /opt/scripts/backup-db.sh >> /var/log/crypto-backend/backup.log 2>&1
```

### 2. Data Lake Backup

**Daily Sync to S3 (optional)**:

```bash
aws s3 sync /var/lib/crypto-pipeline/data_lake/ s3://your-bucket/data_lake/ --delete
```

### 3. Restore Procedure

**Database**:
```bash
gunzip < /var/backups/crypto-pipeline/crypto_pipeline_20260109_030000.sql.gz | mysql -u cryptoapp -p crypto_pipeline
```

**Data Lake**:
```bash
aws s3 sync s3://your-bucket/data_lake/ /var/lib/crypto-pipeline/data_lake/
```

---

## Scaling Strategies

### Horizontal Scaling (Multiple Backend Instances)

**Setup**:
1. Deploy backend to multiple servers
2. Use shared MySQL database
3. Use shared storage (NFS/S3) for data lake
4. Add load balancer (nginx/HAProxy)

**Nginx Load Balancer Config**:

```nginx
upstream backend {
    least_conn;
    server 10.0.1.10:5001;
    server 10.0.1.11:5001;
    server 10.0.1.12:5001;
}

server {
    location /api/ {
        proxy_pass http://backend;
    }
}
```

**Scheduler**: Run on **only one** backend instance to avoid duplicate extraction.

### Database Scaling

**Read Replicas**:
1. Setup MySQL replication
2. Direct read queries to replicas
3. Direct write queries to primary

**Connection Pooling**:
```python
from mysql.connector import pooling

connection_pool = pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=10,
    host=config.DB_HOST,
    database=config.DB_NAME,
    user=config.DB_USER,
    password=config.DB_PASSWORD
)
```

### Caching Layer

Add Redis for frequently accessed data:

```bash
sudo apt install redis-server
pip install redis
```

**Cache Example**:
```python
import redis
import json

cache = redis.Redis(host='localhost', port=6379, db=0)

def get_stats_cached(symbol):
    cache_key = f"stats:{symbol}"
    cached = cache.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    stats = calculate_stats(symbol)
    cache.setex(cache_key, 60, json.dumps(stats))  # 60s TTL
    return stats
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
sudo journalctl -u crypto-backend.service -n 50

# Check port binding
sudo netstat -tulpn | grep 5001

# Test gunicorn manually
cd /opt/CryptoSimpleDataPipeline
source venv/bin/activate
gunicorn src.web.app:app --bind 127.0.0.1:5001
```

### Database Connection Issues

```bash
# Test connection
mysql -u cryptoapp -p crypto_pipeline

# Check MySQL status
sudo systemctl status mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### High CPU/Memory Usage

```bash
# Check processes
top
htop

# Check Gunicorn workers
ps aux | grep gunicorn

# Reduce workers if needed
# Edit /etc/systemd/system/crypto-backend.service
```

---

## Related Documentation

- [System Architecture](ARCHITECTURE.md) - Overall system design
- [Backend Architecture](BACKEND.md) - Backend implementation
- [Database Schema](DATABASE_SCHEMA.md) - Database details
- [API Reference](API_REFERENCE.md) - API endpoints
