# MinIO Setup Guide

## Overview

**MinIO is MANDATORY** for this application. The system no longer supports local file storage - all data lake operations require a running MinIO instance.

## Quick Start

### 1. Start Docker Desktop

**MacOS**: Mở ứng dụng Docker Desktop từ Applications hoặc Spotlight

Đợi cho đến khi thấy Docker icon ở menu bar và status là "Running"

### 2. Start MinIO Server

```bash
cd /Users/taiphan/Documents/CryptoSimpleDataPipeline

# Start MinIO
docker-compose up -d

# Verify MinIO is running
docker-compose ps
```

Bạn sẽ thấy:
```
NAME                           STATUS          PORTS
crypto_pipeline_minio          Up X seconds    0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp
```

### 3. Access MinIO Console

Mở browser: **http://localhost:9001**

- Username: `minioadmin`
- Password: `minioadmin123`

### 4. Start Backend

**IMPORTANT**: Backend sẽ không khởi động nếu MinIO không available.

```bash
conda activate crypto_data_pipeline_env
python run_backend.py
```

Kiểm tra logs, bạn sẽ thấy:
```
ExtractionManager initialized with MinIO storage
DataLakeManager initialized with MinIO storage
```

Nếu MinIO không chạy, backend sẽ fail với error message rõ ràng.

---

## Troubleshooting

### Error: "Cannot connect to the Docker daemon"

**Nguyên nhân**: Docker Desktop chưa chạy

**Giải pháp**:
1. Mở Docker Desktop
2. Đợi cho đến khi status là "Running"
3. Chạy lại `docker-compose up -d`

### Error: MinIO Client Initialization Failed

**Nguyên nhân**: MinIO container có issue hoặc chưa ready

**Giải pháp**:
```bash
# Check MinIO logs
docker-compose logs minio

# Restart MinIO
docker-compose restart minio

# Hoặc stop và start lại
docker-compose down
docker-compose up -d
```

### Backend Fails to Start

**Nguyên nhân**: MinIO không available

**Giải pháp**:
- Ensure Docker is running
- Ensure MinIO container is up: `docker-compose ps`
- Check MinIO health: `curl http://localhost:9000/minio/health/live`
- Check backend logs for specific error messages

---

## Testing MinIO

Sau khi setup xong, test bằng:

```bash
conda activate crypto_data_pipeline_env
python test_minio.py
```

Hoặc trigger pipeline qua API:
```bash
curl -X POST http://localhost:5001/api/trigger
```

Sau đó kiểm tra MinIO console để xem file đã được upload.

---

## Important Notes

- ⚠️ **NO FALLBACK**: Local file storage is NOT supported. MinIO is required.
- 🔒 **Data Location**: All data stored in MinIO buckets `crypto-raw` and `crypto-archive`
- 💾 **Persistence**: Data persists in `./minio_data/` directory (don't delete unless you want to reset)
- 🔄 **Migration**: Use `migrate_to_minio.py` to move existing local data to MinIO

---

## Stopping MinIO

Khi không dùng:
```bash
docker-compose down
```

Restart khi cần:
```bash
docker-compose up -d
```
