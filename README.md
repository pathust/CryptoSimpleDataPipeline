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
- **MinIO Data Lake**: S3-compatible object storage for scalable data management
- **Incremental Extraction**: Fetches only new data to optimize API calls
- **Duplicate Prevention**: Automatic deduplication in database
- **Auto-archiving**: Old data automatically moved to archive bucket (7+ days)
- **Auto-cleanup**: Archived data deleted after 30 days
- **Data Aggregation**: Pre-calculated hourly and daily summaries

### ⏰ Configurable Scheduler
- **Runtime Configuration**: Adjust collection intervals on-the-fly
- **Enable/Disable**: Pause/resume data collection via UI
- **Manual Triggers**: Run pipeline on-demand
- **Automatic Maintenance**: Weekly cleanup and optimization

### 🎨 Modern UI
- **Dark Theme**: Professional, eye-friendly interface with Tailwind CSS
- **Multi-tab Dashboard**: Organized views for different features (Dashboard, Charts, Indicators, Data Tables, Scheduler, Settings)
- **Real-time Updates**: Auto-refresh every 15 seconds
- **Responsive Design**: Works on desktop and tablet
- **Data Tables**: View and export raw k-lines and orderbook data with pagination

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

| Document | Description |
|----------|-------------|
| [📐 Architecture](docs/ARCHITECTURE.md) | System design, components, and technology stack |
| [🔄 Data Pipeline](docs/DATA_PIPELINE.md) | Complete data flow from source to visualization |
| [📊 Charts Guide](docs/CHARTS_GUIDE.md) | Detailed guide for all charts and indicators |
| [🔌 API Reference](docs/API_REFERENCE.md) | All API endpoints with examples |
| [⚛️ Frontend](docs/FRONTEND.md) | React/TypeScript architecture and components |
| [🐍 Backend](docs/BACKEND.md) | Python modules and Flask application |
| [🗄️ Database Schema](docs/DATABASE_SCHEMA.md) | Complete database schema and ER diagrams |
| [🚀 Deployment](docs/DEPLOYMENT.md) | Production deployment guide |
| [👨‍💻 Developer Guide](DEVELOPER_GUIDE.md) | Development setup and best practices |

**Start Here**: New to the project? Begin with the [Architecture](docs/ARCHITECTURE.md) document, then review the [Data Pipeline](docs/DATA_PIPELINE.md) to understand how data flows through the system.


### Prerequisites
- Python 3.12+
- MySQL 8.0+
- Docker & Docker Compose (for MinIO)
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

6. **Start MinIO (Data Lake)**
```bash
docker-compose up -d
```

Access MinIO console at http://localhost:9001 (credentials: `minioadmin` / `minioadmin123`)

### Running the Application

Open three terminal windows:

**Terminal 1 - MinIO (Data Lake)**
```bash
docker-compose up -d
# Access MinIO Console: http://localhost:9001
# Login: minioadmin / minioadmin123
```

**Terminal 2 - Backend API**
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
├── frontend/                 # Web UI (Port 8000 - React/TypeScript)
│   ├── src/
│   │   ├── pages/           # Page components (Dashboard, Analytics, etc.)
│   │   ├── components/      # Reusable components (charts, UI)
│   │   ├── hooks/           # Custom React hooks
│   │   └── config/          # Frontend configuration
│   ├── index.html           # HTML template
│   └── vite.config.ts       # Vite build configuration
├── src/
│   ├── config.py            # Configuration (environment variables)
│   ├── scheduler_config.py  # Runtime scheduler settings
│   ├── modules/
│   │   ├── extract/         # Data extraction (Binance API)
│   │   │   └── manager.py   # ExtractionManager
│   │   ├── transform/       # Data transformation & loading
│   │   │   └── manager.py   # TransformManager
│   │   ├── analytics/       # Advanced analytics (NEW)
│   │   │   ├── service.py   # AnalyticsService
│   │   │   └── data_providers/ # Extensible provider registry
│   │   ├── visualize/       # Data service & API
│   │   │   └── service.py   # VisualizeService
│   │   ├── stats/           # Technical indicators
│   │   │   └── calculator.py # StatsCalculator
│   │   ├── datalake/        # MinIO storage management (PRIMARY)
│   │   │   ├── minio_client.py # MinIO S3-compatible client
│   │   │   └── manager.py   # DataLakeManager
│   │   └── warehouse/       # Data aggregation
│   │       └── aggregator.py # WarehouseAggregator
│   └── web/
│       └── app.py           # Flask backend (Port 5001)
├── minio_data/              # MinIO storage volumes (Docker - PRIMARY STORAGE)
│   ├── crypto-raw/          # Active data bucket
│   └── crypto-archive/      # Archived data bucket
├── data_lake/               # Legacy local files (DEPRECATED - use MinIO)
│   ├── raw/                 # Old raw JSON files
│   └── archive/             # Old archived files
├── docker-compose.yml       # MinIO service definition
├── migrate_to_minio.py      # Migration utility (file → MinIO)
├── run_backend.py           # Backend launcher
├── run_frontend.py          # Frontend launcher
├── rebuild_database.py      # Database reset utility
└── requirements.txt         # Python dependencies
```

## 🔧 Configuration

### Tracked Symbols
Edit in Settings tab or modify `.env` file:
```bash
SYMBOLS=BTCUSDT,ETHUSDT,BNBUSDT
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
- MinIO archive: 7 days (files moved from `crypto-raw` to `crypto-archive` bucket)
- Archive cleanup: 30 days (files deleted from `crypto-archive` bucket)
- Database raw data cleanup: 90 days (fact tables in MySQL)

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

### Data Tables
- `GET /api/klines/table` - Paginated k-lines data (params: symbol, page, per_page)
- `GET /api/orderbook/table` - Paginated orderbook data (params: symbol, page, per_page)

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

## 🔐 Security Notes

- Change default MySQL password in production
- Use environment variables for sensitive data
- Enable SSL for MySQL connections in production
- Configure CORS properly for production deployment

## 🤝 Contributing

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for development setup and guidelines.

## 📝 License

MIT License - See LICENSE file for details

## 🚀 What's New

- **✨ Data Tables**: View and export raw k-lines and orderbook data
- **🎨 Tailwind UI**: Modern, responsive design with Tailwind CSS
- **📊 Enhanced Charts**: Professional candlestick charts
- **⚡ Smart Pipeline**: Incremental data extraction and auto-archiving
- **🔧 Runtime Config**: Adjust scheduler without restart

## 🙏 Acknowledgments

- Data provided by [Binance API](https://binance-docs.github.io/apidocs/spot/en/)
- Charts powered by [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for intelligent cryptocurrency analytics**
