import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database Configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '123456')
DB_NAME = os.getenv('DB_NAME', 'crypto_pipeline')

# Data Lake Configuration
DATA_LAKE_DIR = os.getenv('DATA_LAKE_DIR', './data_lake')
RAW_DATA_DIR = os.path.join(DATA_LAKE_DIR, 'raw')

# Tracked Symbols
SYMBOLS_STR = os.getenv('SYMBOLS', 'BTCUSDT,ETHUSDT,BNBUSDT')
SYMBOLS = [s.strip() for s in SYMBOLS_STR.split(',') if s.strip()]

# API Configuration (optional - for future authenticated endpoints)
BINANCE_API_KEY = os.getenv('BINANCE_API_KEY', '')
BINANCE_API_SECRET = os.getenv('BINANCE_API_SECRET', '')

# Flask Configuration
FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
FLASK_PORT = int(os.getenv('FLASK_PORT', '5001'))

# Frontend Configuration
FRONTEND_PORT = int(os.getenv('FRONTEND_PORT', '8000'))

# MinIO Configuration (Data Lake)
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'localhost:9000')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'minioadmin123')
MINIO_BUCKET_RAW = os.getenv('MINIO_BUCKET_RAW', 'crypto-raw')
MINIO_BUCKET_ARCHIVE = os.getenv('MINIO_BUCKET_ARCHIVE', 'crypto-archive')
MINIO_SECURE = os.getenv('MINIO_SECURE', 'False').lower() == 'true'
