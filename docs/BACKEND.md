# Backend Architecture

Complete documentation for the Python/Flask backend of the CryptoSimpleDataPipeline.

## Table of Contents

1. [Overview](#overview)
2. [Module Architecture](#module-architecture)
3. [Core Modules](#core-modules)
4. [Flask Application](#flask-application)
5. [Configuration](#configuration)
6. [Error Handling](#error-handling)
7. [Database Connections](#database-connections)
8. [Scheduler](#scheduler)

---

## Overview

The backend is built with **Python 3.12+** and **Flask**, structured into modular components following the Manager and Service Layer patterns.

**Design Principles**:
- **Modularity**: Each module has a single responsibility
- **Decoupling**: Modules communicate through defined interfaces
- **Testability**: Pure functions and dependency injection
- **Maintainability**: Clear separation of concerns

---

## Module Architecture

```
src/
├── config.py                    # Global configuration
├── scheduler_config.py          # Runtime scheduler settings
├── modules/
│   ├── extract/
│   │   └── manager.py          # ExtractionManager
│   ├── transform/
│   │   └── manager.py          # TransformManager
│   ├── warehouse/
│   │   └── aggregator.py       # WarehouseAggregator
│   ├── visualize/
│   │   └── service.py          # VisualizeService
│   ├── analytics/
│   │   ├── service.py          # AnalyticsService
│   │   └── data_providers/     # Extensible provider registry (NEW)
│   │       ├── base.py         # BaseDataProvider
│   │       ├── registry.py     # DataProviderRegistry
│   │       ├── candlestick.py  # Candlestick data provider
│   │       ├── volume.py       # Volume data provider
│   │       ├── rsi.py          # RSI indicator
│   │       ├── macd.py         # MACD indicator
│   │       ├── bollinger.py    # Bollinger Bands
│   │       └── ...             # More providers
│   ├── stats/
│   │   └── calculator.py       # StatsCalculator
│   └── datalake/
│       ├── minio_client.py     # MinIO S3-compatible client (NEW)
│       └── manager.py          # DataLakeManager
└── web/
    └── app.py                  # Flask application
```

---

## Core Modules

### 1. ExtractionManager (`modules/extract/manager.py`)

**Purpose**: Fetch data from Binance API and save to data lake

**Key Methods**:

```python
def run_cycle(self) -> List[str]:
    """
    Run one extraction cycle for all symbols.
    Returns list of generated file paths.
    """
    
def fetch_klines(self, symbol: str, start_time: datetime = None, limit: int = 100):
    """
    Fetch k-lines from Binance API.
    Supports incremental extraction.
    """
    
def fetch_depth(self, symbol: str, limit: int = 20):
    """
    Fetch orderbook depth from Binance API.
    """
    
def get_last_extraction_time(self, symbol: str, data_type: str) -> datetime:
    """
    Get last extraction time from metadata table.
    """
    
def update_extraction_metadata(self, symbol: str, data_type: str, 
                                last_open_time: datetime, count: int):
    """
    Update extraction metadata after successful fetch.
    """
```

**Dependencies**:
- `requests` - HTTP client
- `mysql.connector` - Database access
- `config` - Configuration

---

### 2. TransformManager (`modules/transform/manager.py`)

**Purpose**: Load JSON files into MySQL with deduplication

**Key Methods**:

```python
def process_recent_files(self) -> int:
    """
    Process today's files from data lake.
    Returns number of records processed.
    """
    
def process_file(self, filepath: str, force_process: bool = False) -> int:
    """
    Process a single JSON file.
    Skips if already processed unless force_process=True.
    """
    
def _process_klines(self, filepath: str, cursor):
    """
    Process k-lines file and insert into fact_klines table.
    Uses ON DUPLICATE KEY UPDATE for deduplication.
    """
    
def _process_depth(self, filepath: str, cursor):
    """
    Process orderbook file and insert into fact_orderbook table.
    """
    
def _detect_and_fill_gaps(self):
    """
    Detect gaps in k-lines data and fetch missing data from API.
    """
    
def run_maintenance(self):
    """
    Run all maintenance tasks:
    - Archive old files
    - Cleanup old archives
    - Cleanup old database records
    """
```

**Dependencies**:
- `DataLakeManager` - File management
- `WarehouseAggregator` - Data aggregation
- `mysql.connector` - Database access

---

### 3. WarehouseAggregator (`modules/warehouse/aggregator.py`)

**Purpose**: Create hourly and daily aggregations

**Key Methods**:

```python
def aggregate_hourly(self, symbol: str = None) -> int:
    """
    Create hourly aggregations from minute-level data.
    Returns number of rows affected.
    """
    
def aggregate_daily(self, symbol: str = None) -> int:
    """
    Create daily aggregations from hourly data.
    Returns number of rows affected.
    """
    
def cleanup_old_data(self, days_to_keep: int = 90) -> int:
    """
    Delete fact records older than specified days.
    Returns number of records deleted.
    """
    
def get_statistics(self) -> dict:
    """
    Get warehouse record counts.
    """
```

**Aggregation SQL**:
```python
query = """
INSERT INTO hourly_klines 
(symbol, hour_start, open_price, high_price, low_price, close_price, volume, trade_count)
SELECT 
    symbol,
    DATE_FORMAT(open_time, '%Y-%m-%d %H:00:00') as hour_start,
    SUBSTRING_INDEX(GROUP_CONCAT(open_price ORDER BY open_time ASC), ',', 1) as open_price,
    MAX(high_price) as high_price,
    MIN(low_price) as low_price,
    SUBSTRING_INDEX(GROUP_CONCAT(close_price ORDER BY open_time DESC), ',', 1) as close_price,
    SUM(volume) as volume,
    COUNT(*) as trade_count
FROM fact_klines
WHERE symbol = ? AND interval_code = '1m'
GROUP BY symbol, hour_start
ON DUPLICATE KEY UPDATE ...
"""
```

---

### 4. VisualizeService (`modules/visualize/service.py`)

**Purpose**: Provide data for visualization

**Key Methods**:

```python
def get_kline_data(self, symbol: str, limit: int = 500) -> List[dict]:
    """
    Get k-lines data for charting.
    """
    
def get_statistics(self, symbol: str) -> dict:
    """
    Calculate 24h statistics:
    - Current price
    - Price change (absolute and %)
    - 24h high/low
    - 24h volume
    """
    
def get_indicators(self, symbol: str, period: int = 100) -> dict:
    """
    Calculate technical indicators:
    - RSI
    - MACD
    - Bollinger Bands
    """
    
def get_pipeline_status(self) -> dict:
    """
    Get extraction metadata and pipeline health.
    """
    
def get_dashboard_metrics(self) -> dict:
    """
    Get comprehensive dashboard data for all symbols.
    """
```

---

### 5. AnalyticsService (`modules/analytics/service.py`)

**Purpose**: Advanced analytics for React frontend

**Key Methods**:

```python
def get_candlestick_data(self, symbol: str, limit: int = 200, 
                         interval: str = '1m') -> List[dict]:
    """
    Get candlestick data formatted for Lightweight Charts.
    """
    
def get_orderbook_snapshot(self, symbol: str, limit: int = 20) -> dict:
    """
    Get latest orderbook snapshot with bids and asks.
    """
```

---

### 6. StatsCalculator (`modules/stats/calculator.py`)

**Purpose**: Calculate technical indicators

**Static Methods**:

```python
@staticmethod
def calculate_rsi(prices: List[float], period: int = 14) -> float:
    """
    Calculate Relative Strength Index.
    """
    
@staticmethod
def calculate_macd(prices: List[float]) -> dict:
    """
    Calculate MACD indicator.
    Returns: {macd, signal, histogram}
    """
    
@staticmethod
def calculate_bollinger_bands(prices: List[float], period: int = 20, 
                               std_dev: int = 2) -> dict:
    """
    Calculate Bollinger Bands.
    Returns: {upper, middle, lower}
    """
```

---

### 7. DataLakeManager (`modules/datalake/manager.py`)

**Purpose**: Manage data lake files

**Key Methods**:

```python
def get_all_files(self) -> List[str]:
    """
    Get list of all files in raw data directory.
    """
    
def archive_old_files(self, days_old: int = 7):
    """
    Move files older than N days to archive.
    """
    
def cleanup_old_archives(self, days_old: int = 30):
    """
    Delete archived files older than N days.
    """
    
def get_statistics(self) -> dict:
    """
    Get data lake statistics.
    """
```

---

## Flask Application

### Application Structure (`web/app.py`)

```python
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize managers and services
extract_mgr = ExtractionManager()
transform_mgr = TransformManager()
visualize_svc = VisualizeService()
analytics_svc = AnalyticsService()
scheduler_config = SchedulerConfig()

# Background jobs
def pipeline_job():
    """Extract + Transform"""
    generated_files = extract_mgr.run_cycle()
    records = transform_mgr.process_recent_files()
    
def maintenance_job():
    """Weekly maintenance"""
    transform_mgr.run_maintenance()

# Endpoints
@app.route('/api/data/<symbol>')
def get_data(symbol):
    data = visualize_svc.get_kline_data(symbol)
    return jsonify(data)

# ... 20+ more endpoints
```

### CORS Configuration

```python
CORS(app, 
     resources={r"/api/*": {
         "origins": "*",  # All origins (dev only)
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": "*",
         "expose_headers": "*",
     }})
```

**Production Recommendation**:
```python
CORS(app, 
     resources={r"/api/*": {
         "origins": ["https://your-frontend-domain.com"],
         "methods": ["GET", "POST"],
     }})
```

---

## Configuration

### Global Config (`config.py`)

```python
import os
from dotenv import load_dotenv

load_dotenv()

# Database
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '123456')
DB_NAME = os.getenv('DB_NAME', 'crypto_pipeline')

# Data Lake
DATA_LAKE_DIR = os.getenv('DATA_LAKE_DIR', './data_lake')
RAW_DATA_DIR = os.path.join(DATA_LAKE_DIR, 'raw')

# Symbols
SYMBOLS_STR = os.getenv('SYMBOLS', 'BTCUSDT,ETHUSDT,BNBUSDT')
SYMBOLS = [s.strip() for s in SYMBOLS_STR.split(',') if s.strip()]

# Flask
FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
FLASK_PORT = int(os.getenv('FLASK_PORT', '5001'))
```

### Runtime Scheduler Config (`scheduler_config.py`)

```python
class SchedulerConfig:
    def __init__(self):
        self.config_file = 'scheduler_config.json'
        self.load_config()
    
    def load_config(self):
        """Load configuration from JSON file"""
        
    def update_config(self, updates: dict):
        """Update configuration and save to file"""
        
    def get_config(self) -> dict:
        """Get current configuration"""
        
    def is_enabled(self) -> bool:
        """Check if scheduler is enabled"""
```

**Config File Format** (`scheduler_config.json`):
```json
{
  "interval_seconds": 60,
  "enabled": true,
  "jobs": {
    "pipeline_job": {
      "interval": "60s",
      "enabled": true
    },
    "maintenance_job": {
      "schedule": "weekly",
      "enabled": true
    }
  }
}
```

---

## Error Handling

### Pattern

```python
try:
    # Operation
    result = perform_operation()
    return result
except SpecificException as e:
    print(f"❌ Error: {e}")
    # Log error
    return None
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    import traceback
    traceback.print_exc()
    return None
```

### API Error Responses

```python
@app.route('/api/data/<symbol>')
def get_data(symbol):
    try:
        data = visualize_svc.get_kline_data(symbol)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

---

## Database Connections

### Connection Pattern

```python
def get_db_connection(self):
    """Get MySQL database connection"""
    return mysql.connector.connect(
        host=config.DB_HOST,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME
    )
```

### Query Pattern

```python
def query_data(self, symbol: str):
    try:
        conn = self.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT * FROM table WHERE symbol = %s
        """, (symbol,))
        
        result = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return result
    except Exception as e:
        print(f"Database error: {e}")
        return []
```

### Connection Pooling (Future Enhancement)

Consider using `mysql.connector.pooling` for connection pooling in production:

```python
from mysql.connector import pooling

connection_pool = pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=5,
    pool_reset_session=True,
    host=config.DB_HOST,
    database=config.DB_NAME,
    user=config.DB_USER,
    password=config.DB_PASSWORD
)

def get_db_connection(self):
    return connection_pool.get_connection()
```

---

## Scheduler

### APScheduler Integration

```python
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler(daemon=False)

# Add job
scheduler.add_job(
    func=pipeline_job,
    trigger='interval',
    seconds=60,
    id='pipeline_job'
)

# Start scheduler
scheduler.start()
```

### Current Status

**Note**: The scheduler is currently **disabled** due to segfault issues in the conda environment. The pipeline is triggered manually via the `/api/trigger` endpoint.

### Background Jobs

1. **pipeline_job**:
   - Frequency: Every 60 seconds (configurable)
   - Tasks: Extract data → Transform data

2. **maintenance_job**:
   - Frequency: Weekly (Sunday 2:00 AM)
   - Tasks: Archive files → Cleanup archives → Cleanup old database records

---

## Related Documentation

- [System Architecture](ARCHITECTURE.md) - Overall system design
- [Data Pipeline](DATA_PIPELINE.md) - Data flow documentation
- [API Reference](API_REFERENCE.md) - API endpoint documentation
- [Database Schema](DATABASE_SCHEMA.md) - Database schema details
