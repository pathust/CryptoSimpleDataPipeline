# API Reference

Complete reference for all REST API endpoints exposed by the CryptoSimpleDataPipeline backend.

## Table of Contents

1. [Base URL](#base-url)
2. [Response Format](#response-format)
3. [Configuration Endpoints](#configuration-endpoints)
4. [Data & Analytics Endpoints](#data--analytics-endpoints)
5. [Pipeline Control Endpoints](#pipeline-control-endpoints)
6. [Maintenance Endpoints](#maintenance-endpoints)
7. [Dashboard Endpoints](#dashboard-endpoints)
8. [Data Tables Endpoints](#data-tables-endpoints)
9. [Scheduler Endpoints](#scheduler-endpoints)
10. [Error Handling](#error-handling)

---

## Base URL

```
Development: http://localhost:5001/api
Production:  https://your-domain.com/api
```

All endpoints are prefixed with `/api`.

---

## Response Format

All responses are in JSON format.

**Success Response**:
```json
{
  "data": { ... },
  "status": "success"
}
```

**Error Response**:
```json
{
  "error": "Error message",
  "status": "error"
}
```

---

## Configuration Endpoints

### Get Tracked Symbols

Get list of currently tracked cryptocurrency symbols.

**Endpoint**: `GET /api/config/symbols`

**Response**:
```json
{
  "symbols": ["BTCUSDT", "ETHUSDT", "BNBUSDT"]
}
```

**Example**:
```bash
curl http://localhost:5001/api/config/symbols
```

---

### Update Tracked Symbols

Update the list of tracked cryptocurrency symbols.

**Endpoint**: `POST /api/config/symbols`

**Request Body**:
```json
{
  "symbols": ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
}
```

**Response**:
```json
{
  "status": "success",
  "symbols": ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
}
```

**Example**:
```bash
curl -X POST http://localhost:5001/api/config/symbols \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["BTCUSDT", "ETHUSDT", "SOLUSDT"]}'
```

---

## Data & Analytics Endpoints

### Get K-line Data

Get historical candlestick data for charting.

**Endpoint**: `GET /api/data/<symbol>`

**Path Parameters**:
- `symbol` (string, required): Trading pair symbol (e.g., "BTCUSDT")

**Response**:
```json
[
  {
    "open_time": "2026-01-09T14:30:00",
    "open_price": 42500.00,
    "high_price": 42600.00,
    "low_price": 42450.00,
    "close_price": 42550.00,
    "volume": 125.45
  },
  ...
]
```

**Example**:
```bash
curl http://localhost:5001/api/data/BTCUSDT
```

---

### Get 24h Statistics

Get 24-hour market statistics for a symbol.

**Endpoint**: `GET /api/stats/<symbol>`

**Path Parameters**:
- `symbol` (string, required): Trading pair symbol

**Response**:
```json
{
  "symbol": "BTCUSDT",
  "current_price": 42550.00,
  "price_change_24h": 1250.50,
  "price_change_pct_24h": 3.02,
  "high_24h": 43000.00,
  "low_24h": 41000.00,
  "volume_24h": 125000.50
}
```

**Example**:
```bash
curl http://localhost:5001/api/stats/BTCUSDT
```

---

### Get Technical Indicators

Get calculated technical indicators for a symbol.

**Endpoint**: `GET /api/indicators/<symbol>`

**Path Parameters**:
- `symbol` (string, required): Trading pair symbol

**Response**:
```json
{
  "symbol": "BTCUSDT",
  "rsi": 65.42,
  "macd": {
    "macd": 125.50,
    "signal": 115.30,
    "histogram": 10.20
  },
  "bollinger_bands": {
    "upper": 43500.00,
    "middle": 42500.00,
    "lower": 41500.00
  }
}
```

**Example**:
```bash
curl http://localhost:5001/api/indicators/BTCUSDT
```

---

### Get Analytics Data (Generic Endpoint)

**NEW**: Get data from any registered analytics provider.

**Endpoint**: `GET /api/analytics/data/<provider>/<symbol>`

**Path Parameters**:
- `provider` (string, required): Data provider name (candlestick, volume, rsi, macd, bollinger, orderbook)
- `symbol` (string, required): Trading pair symbol (no underscore, e.g., "BTCUSDT")

**Query Parameters** (provider-specific):
- `limit` (integer, optional): Number of records (default varies by provider)
- Provider-specific parameters (see examples below)

**Examples**:

**Candlestick Data**:
```bash
curl "http://localhost:5001/api/analytics/data/candlestick/BTCUSDT?limit=200"
```
Response:
```json
[
  {
    "time": "2026-01-09T14:30:00Z",
    "open": 42500.00,
    "high": 42600.00,
    "low": 42450.00,
    "close": 42550.00,
    "volume": 125.45
  }
]
```

**Volume Data**:
```bash
curl "http://localhost:5001/api/analytics/data/volume/BTCUSDT?limit=200"
```
Response:
```json
[
  {
    "time": "2026-01-09T14:30:00Z",
    "price": 42550.00,
    "volume": 125.45
  }
]
```

**RSI Indicator**:
```bash
curl "http://localhost:5001/api/analytics/data/rsi/BTCUSDT?period=14&limit=200"
```
Response:
```json
[
  {
    "time": "2026-01-09T14:30:00Z",
    "rsi": 65.42,
    "price": 42550.00
  }
]
```

**MACD Indicator**:
```bash
curl "http://localhost:5001/api/analytics/data/macd/BTCUSDT?fast_period=12&slow_period=26&signal_period=9&limit=200"
```
Response:
```json
[
  {
    "time": "2026-01-09T14:30:00Z",
    "macd": 125.50,
    "signal": 115.30,
    "histogram": 10.20,
    "price": 42550.00
  }
]
```

**Bollinger Bands**:
```bash
curl "http://localhost:5001/api/analytics/data/bollinger/BTCUSDT?period=20&std_dev=2&limit=200"
```
Response:
```json
[
  {
    "time": "2026-01-09T14:30:00Z",
    "upper": 43500.00,
    "middle": 42500.00,
    "lower": 41500.00,
    "price": 42550.00
  }
]
```

**Orderbook Snapshot**:
```bash
curl "http://localhost:5001/api/analytics/data/orderbook/BTCUSDT?limit=20"
```
Response:
```json
{
  "bids": [
    {"price": 42500.00, "quantity": 1.25}
  ],
  "asks": [
    {"price": 42500.50, "quantity": 1.10}
  ],
  "timestamp": "2026-01-09T14:30:00.123456"
}
```

---

### List Analytics Providers

Get metadata about all registered data providers.

**Endpoint**: `GET /api/analytics/providers`

**Response**:
```json
{
  "candlestick": {
    "name": "Candlestick Data",
    "description": "OHLCV candlestick data",
    "parameters": ["limit"]
  },
  "volume": {
    "name": "Volume Data",
    "description": "Trading volume over time",
    "parameters": ["limit"]
  },
  "rsi": {
    "name": "RSI",
    "description": "Relative Strength Index",
    "parameters": ["period", "limit"]
  },
  "macd": {
    "name": "MACD",
    "description": "Moving Average Convergence Divergence",
    "parameters": ["fast_period", "slow_period", "signal_period", "limit"]
  },
  "bollinger": {
    "name": "Bollinger Bands",
    "description": "Volatility indicator",
    "parameters": ["period", "std_dev", "limit"]
  },
  "orderbook": {
    "name": "Order Book",
    "description": "Market depth snapshot",
    "parameters": ["limit"]
  }
}
```

**Example**:
```bash
curl http://localhost:5001/api/analytics/providers
```

---

### Legacy Endpoints (Deprecated)

The following endpoints are deprecated in favor of the generic analytics endpoint above:
- `GET /api/analytics/candlestick/<symbol>` → Use `/api/analytics/data/candlestick/<symbol>`
- `GET /api/analytics/orderbook/<symbol>` → Use `/api/analytics/data/orderbook/<symbol>`

---

## Pipeline Control Endpoints

### Get Pipeline Status

Get current pipeline execution status and metadata.

**Endpoint**: `GET /api/pipeline/status`

**Response**:
```json
{
  "metadata": [
    {
      "symbol": "BTCUSDT",
      "data_type": "klines",
      "last_fetch_time": "2026-01-09T14:30:00",
      "last_open_time": "2026-01-09T14:29:00",
      "record_count": 125000
    },
    ...
  ],
  "status": "healthy"
}
```

**Example**:
```bash
curl http://localhost:5001/api/pipeline/status
```

---

### Manual Pipeline Trigger

Manually trigger the data pipeline (extract + transform).

**Endpoint**: `POST /api/trigger`

**Response**:
```json
{
  "status": "Pipeline triggered"
}
```

**Example**:
```bash
curl -X POST http://localhost:5001/api/trigger
```

> **Note**: The pipeline runs synchronously and may take several seconds to complete.

---

### Get Scheduler Configuration

Get current scheduler configuration.

**Endpoint**: `GET /api/scheduler`

**Response**:
```json
{
  "interval_seconds": 60,
  "enabled": true,
  "last_run": "2026-01-09T14:30:00"
}
```

**Example**:
```bash
curl http://localhost:5001/api/scheduler
```

---

### Update Scheduler Configuration

Update scheduler interval and enabled status.

**Endpoint**: `POST /api/scheduler`

**Request Body**:
```json
{
  "interval_seconds": 300,
  "enabled": true
}
```

**Response**:
```json
{
  "status": "success",
  "config": {
    "interval_seconds": 300,
    "enabled": true
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:5001/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"interval_seconds": 300, "enabled": true}'
```

---

## Maintenance Endpoints

### Manual Maintenance Trigger

Manually trigger maintenance tasks (archive, cleanup, aggregate).

**Endpoint**: `POST /api/maintenance/trigger`

**Response**:
```json
{
  "status": "Maintenance triggered"
}
```

**Example**:
```bash
curl -X POST http://localhost:5001/api/maintenance/trigger
```

---

### Get Maintenance Statistics

Get storage statistics for data lake and warehouse.

**Endpoint**: `GET /api/maintenance/stats`

**Response**:
```json
{
  "data_lake": {
    "total_files": 15000,
    "active_files": 10000,
    "archived_files": 5000,
    "total_size_mb": 250.5
  },
  "warehouse": {
    "klines_count": 125000,
    "hourly_count": 2500,
    "daily_count": 100,
    "orderbook_count": 50000
  }
}
```

**Example**:
```bash
curl http://localhost:5001/api/maintenance/stats
```

---

## Dashboard Endpoints

### Get Dashboard Metrics

Get comprehensive dashboard metrics for all symbols.

**Endpoint**: `GET /api/dashboard/metrics`

**Response**:
```json
{
  "symbols": [
    {
      "symbol": "BTCUSDT",
      "current_price": 42550.00,
      "price_change_24h": 1250.50,
      "price_change_pct_24h": 3.02,
      "high_24h": 43000.00,
      "low_24h": 41000.00,
      "volume_24h": 125000.50
    },
    ...
  ],
  "pipeline_status": {
    "last_extraction": "2026-01-09T14:30:00",
    "status": "healthy"
  },
  "warehouse_stats": {
    "total_records": 175000
  }
}
```

**Example**:
```bash
curl http://localhost:5001/api/dashboard/metrics
```

---

### Get Ingestion Logs

Get recent data ingestion logs with pagination.

**Endpoint**: `GET /api/pipeline/ingestion-logs`

**Query Parameters**:
- `limit` (integer, optional): Records per page (default: 50)
- `offset` (integer, optional): Offset for pagination (default: 0)

**Response**:
```json
{
  "logs": [
    {
      "filename": "BTCUSDT_klines_1736428800123.json",
      "processed_at": "2026-01-09T14:30:15",
      "records_inserted": 100,
      "status": "success"
    },
    ...
  ],
  "total": 15000,
  "limit": 50,
  "offset": 0
}
```

**Example**:
```bash
curl "http://localhost:5001/api/pipeline/ingestion-logs?limit=20&offset=0"
```

---

### Get Deduplication Statistics

Get statistics about duplicate records prevented.

**Endpoint**: `GET /api/pipeline/deduplication-stats`

**Response**:
```json
{
  "total_inserts": 125000,
  "duplicates_prevented": 5000,
  "deduplication_rate": 4.0
}
```

**Example**:
```bash
curl http://localhost:5001/api/pipeline/deduplication-stats
```

---

### Get Storage Health

Get health metrics for data lake and warehouse.

**Endpoint**: `GET /api/pipeline/storage-health`

**Response**:
```json
{
  "data_lake": {
    "status": "healthy",
    "disk_usage_pct": 45.2,
    "oldest_file_age_days": 25
  },
  "warehouse": {
    "status": "healthy",
    "connection": "active",
    "table_sizes_mb": {
      "fact_klines": 150.5,
      "fact_orderbook": 80.3,
      "hourly_klines": 5.2,
      "daily_klines": 0.5
    }
  }
}
```

**Example**:
```bash
curl http://localhost:5001/api/pipeline/storage-health
```

---

## Data Tables Endpoints

### Get K-lines Table Data

Get paginated k-lines data for table display.

**Endpoint**: `GET /api/tables/klines`

**Query Parameters**:
- `symbol` (string, optional): Trading pair (default: first symbol)
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Records per page (default: 50)

**Response**:
```json
{
  "data": [
    {
      "symbol": "BTCUSDT",
      "interval_code": "1m",
      "open_time": "2026-01-09 14:30:00",
      "open_price": 42500.00,
      "high_price": 42600.00,
      "low_price": 42450.00,
      "close_price": 42550.00,
      "volume": 125.45,
      "close_time": "2026-01-09 14:30:59"
    },
    ...
  ],
  "total": 125000,
  "page": 1,
  "limit": 50,
  "total_pages": 2500
}
```

**Example**:
```bash
curl "http://localhost:5001/api/tables/klines?symbol=BTCUSDT&page=1&limit=10"
```

---

### Get Orderbook Table Data

Get paginated orderbook data for table display.

**Endpoint**: `GET /api/tables/orderbook`

**Query Parameters**:
- `symbol` (string, optional): Trading pair (default: first symbol)
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Records per page (default: 50)

**Response**:
```json
{
  "data": [
    {
      "symbol": "BTCUSDT",
      "side": "bid",
      "price": 42500.00,
      "quantity": 1.25,
      "captured_at": "2026-01-09 14:30:00"
    },
    ...
  ],
  "total": 50000,
  "page": 1,
  "limit": 50,
  "total_pages": 1000
}
```

**Example**:
```bash
curl "http://localhost:5001/api/tables/orderbook?symbol=BTCUSDT&page=1&limit=10"
```

---

## Scheduler Endpoints

### Get All Scheduler Jobs

Get configuration for all scheduled jobs.

**Endpoint**: `GET /api/scheduler/jobs`

**Response**:
```json
{
  "jobs": [
    {
      "id": "pipeline_job",
      "name": "Data Pipeline",
      "interval": "60s",
      "enabled": true,
      "last_run": "2026-01-09T14:30:00",
      "next_run": "2026-01-09T14:31:00"
    },
    {
      "id": "maintenance_job",
      "name": "Maintenance",
      "schedule": "weekly",
      "enabled": true,
      "last_run": "2026-01-07T02:00:00"
    }
  ]
}
```

**Example**:
```bash
curl http://localhost:5001/api/scheduler/jobs
```

---

### Update Scheduler Job

Update configuration for a specific job.

**Endpoint**: `PUT /api/scheduler/jobs/<job_id>`

**Path Parameters**:
- `job_id` (string, required): Job identifier ("pipeline_job" or "maintenance_job")

**Request Body**:
```json
{
  "interval": "5m",
  "enabled": true
}
```

**Response**:
```json
{
  "status": "success"
}
```

**Example**:
```bash
curl -X PUT http://localhost:5001/api/scheduler/jobs/pipeline_job \
  -H "Content-Type: application/json" \
  -d '{"interval": "5m", "enabled": true}'
```

**Interval Format**:
- Seconds: `"30s"`, `"60s"`
- Minutes: `"1m"`, `"5m"`, `"10m"`
- Hours: `"1h"`, `"2h"`

---

### Manually Run Scheduler Job

Trigger a specific job to run immediately.

**Endpoint**: `POST /api/scheduler/jobs/<job_id>/run`

**Path Parameters**:
- `job_id` (string, required): Job identifier

**Response**:
```json
{
  "status": "Pipeline job triggered"
}
```

**Example**:
```bash
curl -X POST http://localhost:5001/api/scheduler/jobs/pipeline_job/run
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error occurred |

### Error Response Format

```json
{
  "error": "Detailed error message",
  "status": "error"
}
```

### Common Errors

**Invalid Symbol**:
```json
{
  "error": "Symbol not found",
  "status": "error"
}
```

**Database Connection Error**:
```json
{
  "error": "Database connection failed: ...",
  "status": "error"
}
```

**API Rate Limit**:
```json
{
  "error": "Binance API rate limit exceeded",
  "status": "error"
}
```

---

## CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) with the following configuration:

- **Allowed Origins**: `*` (all origins in development)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: `*`
- **Credentials**: Not supported

**Production Recommendation**: Restrict `origins` to specific frontend domains.

---

## Rate Limiting

Currently, there is **no built-in rate limiting** on the API endpoints. The Binance API has its own rate limits (1200 requests/minute), which the backend respects.

**Recommended for Production**:
- Implement API rate limiting (e.g., Flask-Limiter)
- Add authentication/API keys
- Monitor and log excessive requests

---

## Authentication

Currently, the API **does not require authentication**. All endpoints are publicly accessible.

**Recommended for Production**:
- Implement JWT or API key authentication
- Protect write endpoints (POST, PUT, DELETE)
- Add user roles and permissions

---

## Related Documentation

- [System Architecture](ARCHITECTURE.md) - Overall system design
- [Data Pipeline](DATA_PIPELINE.md) - Data flow documentation
- [Frontend Architecture](FRONTEND.md) - Frontend integration guide
- [Backend Architecture](BACKEND.md) - Backend implementation details
