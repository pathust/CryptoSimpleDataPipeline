# 👨‍💻 Developer Guide

This guide is for developers who want to understand, extend, or contribute to the Crypto Analytics Platform.

## 📖 Documentation Index

Before diving into development, familiarize yourself with the complete documentation:

- **[Architecture](docs/ARCHITECTURE.md)** - System design and component overview
- **[Data Pipeline](docs/DATA_PIPELINE.md)** - How data flows through the system
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- **[Frontend](docs/FRONTEND.md)** - React/TypeScript architecture
- **[Backend](docs/BACKEND.md)** - Python modules and services
- **[Database Schema](docs/DATABASE_SCHEMA.md)** - Database tables and relationships
- **[Deployment](docs/DEPLOYMENT.md)** - Production deployment guide

## 📚 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Code Structure](#code-structure)
4. [Data Flow](#data-flow)
5. [Adding Features](#adding-features)
6. [Database Management](#database-management)
7. [Testing](#testing)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

The system follows a modular, decoupled architecture:

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend  │────────▶│   Backend    │────────▶│   Database   │
│  (Port 8000)│  CORS   │  Flask API   │  MySQL  │   (MySQL)    │
│             │         │  (Port 5001) │         │              │
└─────────────┘         └──────────────┘         └──────────────┘
                               │
                               │ APScheduler
                               ▼
                        ┌──────────────┐
                        │   Pipeline   │
                        │   Jobs       │
                        └──────────────┘
```

### Components

**Frontend (SPA)**
- HTML with Tailwind CSS (CDN) and vanilla JavaScript
- No build process required
- Lightweight Charts for candlestick visualizations
- Fetch API for backend communication
- Multi-tab interface (Dashboard, Charts, Indicators, Data Tables, Scheduler, Settings)

**Backend (Flask)**
- RESTful API design
- CORS enabled for decoupled frontend
- Background jobs via APScheduler
- MySQL for data persistence

**Data Pipeline**
- Extract: Binance API → JSON files (incremental)
- Transform: JSON → MySQL (with deduplication)
- Load: Fact tables + Aggregation tables

**Frontend Tabs**
- **Dashboard**: Real-time 24h statistics cards for all symbols
- **Charts**: Interactive candlestick charts with Lightweight Charts
- **Indicators**: Technical indicators (RSI, MACD, Bollinger Bands)
- **Data Tables**: Paginated k-lines and orderbook data with CSV export
- **Scheduler**: Configure pipeline intervals and manual triggers
- **Settings**: Manage tracked cryptocurrency symbols

---

## 🛠️ Development Setup

### 1. Install Development Tools

```bash
# Install conda (if not already installed)
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh
bash Miniconda3-latest-MacOSX-arm64.sh

# Create development environment
conda create -n crypto_dev python=3.12
conda activate crypto_dev

# Install dependencies
pip install -r requirements.txt

# Install development dependencies (optional)
pip install pytest black flake8 mypy
```

### 2. Database Setup

```bash
# Start MySQL
brew services start mysql  # macOS
# or
sudo systemctl start mysql  # Linux

# Create database
python rebuild_database.py
```

### 3. IDE Configuration

**VSCode Recommended Extensions:**
- Python
- Pylance
- MySQL
- REST Client

**VSCode Settings:**
```json
{
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true
}
```

---

## 📂 Code Structure

### Module Organization

```
src/
├── config.py                    # Global configuration
├── scheduler_config.py          # Runtime scheduler settings
├── modules/
│   ├── extract/
│   │   └── manager.py          # ExtractionManager class
│   ├── transform/
│   │   └── manager.py          # TransformManager class
│   ├── visualize/
│   │   └── service.py          # VisualizeService class
│   ├── stats/
│   │   └── calculator.py       # StatsCalculator (RSI, MACD, etc.)
│   ├── datalake/
│   │   └── manager.py          # DataLakeManager (file tracking)
│   └── warehouse/
│       └── aggregator.py       # WarehouseAggregator (hourly/daily)
└── web/
    └── app.py                  # Flask application (16 endpoints)
```

### Design Patterns

**Singleton Pattern**: Configuration classes
```python
class SchedulerConfig:
    def __init__(self):
        self.load_config()  # Loads from JSON once
```

**Manager Pattern**: All module managers
```python
class ExtractionManager:
    def run_cycle(self):
        # Orchestrates extraction logic
        pass
```

**Service Layer**: Visualize service separates API from business logic
```python
class VisualizeService:
    def get_statistics(self, symbol):
        # Business logic for statistics
        pass
```

---

## 🔄 Data Flow

### Extraction Flow

```
1. APScheduler triggers pipeline_job()
2. ExtractionManager.run_cycle()
   ├─ get_last_extraction_time(symbol)  # Check metadata
   ├─ fetch_klines(symbol, start_time)  # Incremental fetch
   ├─ save_to_datalake()                # Save JSON
   └─ update_extraction_metadata()      # Update tracking
```

### Transform Flow

```
1. TransformManager.process_recent_files()
2. For each file:
   ├─ is_file_processed()               # Skip if processed
   ├─ _process_klines() or _process_depth()
   │  └─ INSERT ... ON DUPLICATE KEY UPDATE
   ├─ mark_file_processed()             # Track in DB
   └─ warehouse_agg.aggregate_hourly()  # Create summaries
```

### Maintenance Flow

```
1. Weekly cron job triggers maintenance_job()
2. TransformManager.run_maintenance()
   ├─ datalake_mgr.archive_old_files(7 days)
   ├─ datalake_mgr.cleanup_old_archives(30 days)
   └─ warehouse_agg.cleanup_old_data(90 days)
```

---

## ➕ Adding Features

### Adding a New Technical Indicator

**1. Add calculation to StatsCalculator**

```python
# src/modules/stats/calculator.py
@staticmethod
def calculate_stochastic_oscillator(prices, period=14):
    """Calculate Stochastic Oscillator %K."""
    # Implementation here
    pass
```

**2. Update VisualizeService**

```python
# src/modules/visualize/service.py
def get_indicators(self, symbol, period=100):
    # ... existing code ...
    
    stoch = StatsCalculator.calculate_stochastic_oscillator(prices)
    
    return {
        # ... existing indicators ...
        "stochastic": stoch
    }
```

**3. Update Frontend**

```javascript
// frontend/app.js - loadIndicators()
const stoch = ind.stochastic || 'N/A';
html += `<div>Stochastic: ${stoch}</div>`;
```

### Adding a New Data Source

**1. Create new extraction module**

```python
# src/modules/extract/coinbase_manager.py
class CoinbaseExtractManager:
    def fetch_data(self, symbol):
        # Fetch from Coinbase API
        pass
```

**2. Update pipeline job**

```python
# src/web/app.py
coinbase_mgr = CoinbaseExtractManager()

def pipeline_job():
    binance_files = extract_mgr.run_cycle()
    coinbase_files = coinbase_mgr.run_cycle()
    # ...
```

### Adding a New API Endpoint

```python
# src/web/app.py
@app.route('/api/custom/<symbol>')
def custom_endpoint(symbol):
    """Your custom logic here."""
    try:
        # Business logic
        result = custom_service.process(symbol)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

### Adding a New Frontend Tab

**1. Update HTML structure**

```html
<!-- frontend/index.html -->
<!-- Add navigation item -->
<li><a href="#" onclick="switchTab('mytab')"
    class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 text-gray-400">
    📊 My Tab
</a></li>

<!-- Add tab content -->
<div id="mytab-tab" class="tab-content hidden">
    <div id="mytab-container"></div>
</div>
```

**2. Add JavaScript handler**

```javascript
// frontend/app.js
async function loadMyTab() {
    const response = await fetch(`${API_BASE}/api/mydata`);
    const data = await response.json();
    document.getElementById('mytab-container').innerHTML = renderMyData(data);
}

// Update switchTab() to handle 'mytab'
```

---

## 🗄️ Database Management

### Schema Migration Pattern

**1. Create migration script**

```python
# migrations/add_new_table.py
def upgrade(conn):
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE new_table (
            id INT PRIMARY KEY,
            data VARCHAR(255)
        )
    """)
    conn.commit()

def downgrade(conn):
    cursor = conn.cursor()
    cursor.execute("DROP TABLE new_table")
    conn.commit()
```

**2. Run migration**

```python
import mysql.connector
from migrations.add_new_table import upgrade

conn = mysql.connector.connect(...)
upgrade(conn)
```

### Performance Optimization

**Indexing Strategy:**
```sql
-- For time-series queries
CREATE INDEX idx_symbol_time ON fact_klines(symbol, open_time);

-- For aggregation queries
CREATE INDEX idx_hour ON hourly_klines(hour_start);
```

**Query Optimization:**
```python
# BAD: Fetches all data then filters
df = pd.read_sql("SELECT * FROM fact_klines", conn)
df = df[df['symbol'] == 'BTCUSDT']

# GOOD: Filters in database
df = pd.read_sql(
    "SELECT * FROM fact_klines WHERE symbol = %s",
    conn,
    params=('BTCUSDT',)
)
```

---

## 🧪 Testing

### Unit Tests

```python
# tests/test_stats.py
import pytest
from src.modules.stats.calculator import StatsCalculator

def test_rsi_calculation():
    prices = [44, 44.34, 44.09, 43.61, 44.33, 44.83,
              45.10, 45.42, 45.84, 46.08, 45.89, 46.03,
              45.61, 46.28, 46.28, 46.00]
    rsi = StatsCalculator.calculate_rsi(prices)
    assert 60 <= rsi <= 70  # Expected range for this dataset

def test_rsi_insufficient_data():
    prices = [44, 45, 46]  # Too few points
    rsi = StatsCalculator.calculate_rsi(prices)
    assert rsi is None
```

### Integration Tests

```python
# tests/test_pipeline.py
def test_full_pipeline():
    # Setup
    extract_mgr = ExtractionManager()
    transform_mgr = TransformManager()
    
    # Extract
    files = extract_mgr.run_cycle()
    assert len(files) > 0
    
    # Transform
    records = transform_mgr.process_recent_files()
    assert records > 0
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_stats.py

# Run with coverage
pytest --cov=src tests/
```

---

## ✅ Best Practices

### Code Style

**Follow PEP 8:**
```bash
# Format code
black src/

# Check linting
flake8 src/

# Type checking
mypy src/
```

**Naming Conventions:**
- Classes: `PascalCase`
- Functions/Variables: `snake_case`
- Constants: `UPPER_SNAKE_CASE`
- Private methods: `_leading_underscore`

### Error Handling

```python
# GOOD: Specific exceptions with logging
try:
    data = fetch_api_data()
except requests.RequestException as e:
    print(f"API Error: {e}")
    return None
except json.JSONDecodeError as e:
    print(f"JSON Parse Error: {e}")
    return None

# BAD: Bare except
try:
    data = fetch_api_data()
except:
    pass  # Silent failure
```

### Database Connections

```python
# GOOD: Context managers and cleanup
def get_data():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ...")
        result = cursor.fetchall()
        return result
    finally:
        cursor.close()
        conn.close()

# BAD: No cleanup
def get_data():
    conn = get_db_connection()
    return conn.cursor().execute("SELECT ...").fetchall()
```

### Configuration Management

```python
# GOOD: Environment variables for sensitive data
import os
DB_PASSWORD = os.getenv('DB_PASSWORD', 'default_dev_password')

# BAD: Hardcoded credentials
DB_PASSWORD = "my_secret_password"
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Port already in use**
```bash
# Find process on port 5001
lsof -ti:5001

# Kill process
lsof -ti:5001 | xargs kill -9
```

**Issue: MySQL connection refused**
```bash
# Check MySQL status
brew services list | grep mysql

# Restart MySQL
brew services restart mysql
```

**Issue: Import errors**
```bash
# Ensure correct Python path
export PYTHONPATH="${PYTHONPATH}:/path/to/CryptoSimpleDataPipeline"

# Or run with module
python -m src.web.app
```

**Issue: Empty charts**
```bash
# Check if data exists
mysql -u root -p crypto_pipeline -e "SELECT COUNT(*) FROM fact_klines"

# Manually trigger pipeline
curl -X POST http://localhost:5001/api/trigger
```

### Debug Mode

```python
# Enable Flask debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable SQL echo in mysql connector
conn = mysql.connector.connect(..., get_warnings=True)
```

---

## 📖 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Pandas Documentation](https://pandas.pydata.org/docs/)
- [MySQL Connector/Python](https://dev.mysql.com/doc/connector-python/en/)
- [Binance API Documentation](https://binance-docs.github.io/apidocs/spot/en/)
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)

---

## 🎯 Next Steps for Contributors

1. **Easy Tasks**: Add new symbols, adjust UI colors
2. **Medium Tasks**: Add new indicators, create new endpoints
3. **Advanced Tasks**: Implement caching layer, add WebSocket support
4. **Expert Tasks**: Distributed processing, machine learning integration

---

**Happy coding! 🚀**
