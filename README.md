# 🚀 Crypto Analytics Platform

A professional-grade cryptocurrency data pipeline and analytics platform with intelligent data management, real-time statistics, and technical indicators.

![Python](https://img.shields.io/badge/python-3.12+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 📊 Real-time Analytics
- **Live Price Tracking**: Monitor multiple cryptocurrency pairs simultaneously
- **24h Statistics**: Price changes, volume, high/low tracking
- **Technical Indicators**: RSI, MACD, Bollinger Bands
- **Interactive Charts**: Professional candlestick charts with zoom/pan

### 🧠 Intelligent Data Management
- **Incremental Extraction**: Fetches only new data to optimize API calls
- **Duplicate Prevention**: Automatic deduplication in database
- **Auto-archiving**: Old files automatically moved to archive (7+ days)
- **Auto-cleanup**: Archived files deleted after 30 days
- **Data Aggregation**: Pre-calculated hourly and daily summaries

### ⏰ Configurable Scheduler
- **Runtime Configuration**: Adjust collection intervals on-the-fly
- **Enable/Disable**: Pause/resume data collection via UI
- **Manual Triggers**: Run pipeline on-demand
- **Automatic Maintenance**: Weekly cleanup and optimization

### 🎨 Modern UI
- **Dark Theme**: Professional, eye-friendly interface
- **Multi-tab Dashboard**: Organized views for different features
- **Real-time Updates**: Auto-refresh every 15 seconds
- **Responsive Design**: Works on desktop and tablet

## 🚦 Quick Start

### Prerequisites
- Python 3.12+
- MySQL 8.0+
- Conda (recommended)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd CryptoSimpleDataPipeline
```

2. **Create conda environment**
```bash
conda create -n crypto_data_pipeline_env python=3.12
conda activate crypto_data_pipeline_env
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**

Create `.env` file from template:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crypto_pipeline
SYMBOLS=BTCUSDT,ETHUSDT,BNBUSDT
```

5. **Initialize database**
```bash
python rebuild_database.py
```

### Running the Application

Open two terminal windows:

**Terminal 1 - Backend API**
```bash
conda activate crypto_data_pipeline_env
python run_backend.py
```

**Terminal 2 - Frontend UI**
```bash
python run_frontend.py
```

**Access the dashboard**: http://localhost:8000

## 📁 Project Structure

```
CryptoSimpleDataPipeline/
├── frontend/                 # Web UI (Port 8000)
│   ├── index.html           # Multi-tab dashboard
│   ├── style.css            # Styling
│   └── app.js               # Frontend logic
├── src/
│   ├── config.py            # Configuration
│   ├── scheduler_config.py  # Runtime scheduler settings
│   ├── modules/
│   │   ├── extract/         # Data extraction (Binance API)
│   │   ├── transform/       # Data transformation & loading
│   │   ├── visualize/       # Data service & API
│   │   ├── stats/           # Technical indicators
│   │   ├── datalake/        # File management
│   │   └── warehouse/       # Data aggregation
│   └── web/
│       └── app.py           # Flask backend (Port 5001)
├── data_lake/
│   ├── raw/                 # Active JSON files
│   └── archive/             # Archived files
├── run_backend.py           # Backend launcher
├── run_frontend.py          # Frontend launcher
└── rebuild_database.py      # Database reset utility
```

## 🔧 Configuration

### Tracked Symbols
Edit in Settings tab or modify `src/config.py`:
```python
SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT"]
```

### Scheduler Interval
Configure via Scheduler tab or edit `scheduler_config.json`:
```json
{
  "interval_seconds": 60,
  "enabled": true
}
```

### Data Retention
Modify in source files:
- File archive: 7 days (configurable in `DataLakeManager`)
- Archive cleanup: 30 days
- Raw data cleanup: 90 days

## 📡 API Endpoints

### Configuration
- `GET /api/config/symbols` - Get tracked symbols
- `POST /api/config/symbols` - Update symbols

### Data & Analytics
- `GET /api/data/<symbol>` - Chart data
- `GET /api/stats/<symbol>` - 24h statistics
- `GET /api/indicators/<symbol>` - Technical indicators

### Pipeline Control
- `GET /api/pipeline/status` - Pipeline health
- `POST /api/trigger` - Manual pipeline trigger
- `GET /api/scheduler` - Scheduler configuration
- `POST /api/scheduler` - Update scheduler

### Maintenance
- `POST /api/maintenance/trigger` - Manual maintenance
- `GET /api/maintenance/stats` - Lake & warehouse stats

## 🗄️ Database Schema

### Fact Tables
- `fact_klines`: Minute-level OHLCV data
- `fact_orderbook`: Bid/ask snapshots

### Aggregation Tables
- `hourly_klines`: Hourly summaries
- `daily_klines`: Daily summaries

### Metadata Tables
- `extraction_metadata`: Incremental extraction tracking
- `processed_files`: File processing history

## 🛠️ Tech Stack

- **Backend**: Flask, APScheduler, MySQL Connector
- **Data Processing**: Pandas, NumPy
- **Frontend**: Vanilla JavaScript, Lightweight Charts
- **Database**: MySQL 8.0+
- **Styling**: CSS Grid, Flexbox

## 🔐 Security Notes

- Change default MySQL password in production
- Use environment variables for sensitive data
- Enable SSL for MySQL connections in production
- Configure CORS properly for production deployment

## 🤝 Contributing

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for development setup and guidelines.

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Data provided by [Binance API](https://binance-docs.github.io/apidocs/spot/en/)
- Charts powered by [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for intelligent cryptocurrency analytics**
