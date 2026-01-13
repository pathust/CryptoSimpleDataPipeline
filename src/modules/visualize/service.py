import mysql.connector
import pandas as pd
import src.config as config
from datetime import datetime, timedelta
from src.modules.stats.calculator import StatsCalculator
from src.modules.datalake.manager import DataLakeManager

class VisualizeService:
    def get_db_connection(self):
        return mysql.connector.connect(
            host=config.DB_HOST,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME
        )

    def get_kline_data(self, symbol, limit=500):
        try:
            conn = self.get_db_connection()
            query = f"""
            SELECT open_time, open_price, high_price, low_price, close_price, volume
            FROM fact_klines
            WHERE symbol = '{symbol}'
            ORDER BY open_time ASC
            LIMIT {limit}
            """
            
            df = pd.read_sql(query, conn)
            conn.close()
            
            if df.empty:
                return []

            data = []
            for _, row in df.iterrows():
                data.append({
                    'time': int(row['open_time'].timestamp()),
                    'open': float(row['open_price']),
                    'high': float(row['high_price']),
                    'low': float(row['low_price']),
                    'close': float(row['close_price']),
                    'volume': float(row['volume'])
                })
            return data
            
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            return []
    

    def get_kline_data_with_interval(self, symbol, interval='1m', limit=500):
        try:
            multiplier = 1
            if interval.endswith('m'):
                multiplier = int(interval.replace('m', ''))
            elif interval.endswith('h'):
                multiplier = int(interval.replace('h', '')) * 60
            elif interval.endswith('d'):
                multiplier = int(interval.replace('d', '')) * 1440
            
            fetch_limit = limit * multiplier

            conn = self.get_db_connection()
            query = f"""
            SELECT open_time, open_price, high_price, low_price, close_price, volume
            FROM fact_klines
            WHERE symbol = %s
            ORDER BY open_time DESC
            LIMIT %s
            """
            
            df = pd.read_sql(query, conn, params=(symbol, fetch_limit))
            conn.close()
            
            if df.empty:
                return []

            df = df.sort_values('open_time')
            
            if interval != '1m':
                df['open_time'] = pd.to_datetime(df['open_time'])
                df.set_index('open_time', inplace=True)
                
                logic = {
                    'open_price': 'first',
                    'high_price': 'max',
                    'low_price': 'min',
                    'close_price': 'last',
                    'volume': 'sum'
                }
                
                pandas_interval = interval.replace('m', 'min')
                
                df = df.resample(pandas_interval).agg(logic).dropna()
                df.reset_index(inplace=True)

            df = df.tail(limit)
            
            data = []
            for _, row in df.iterrows():
                data.append({
                    'time': int(row['open_time'].timestamp()),
                    'open': float(row['open_price']),
                    'high': float(row['high_price']),
                    'low': float(row['low_price']),
                    'close': float(row['close_price']),
                    'volume': float(row['volume'])
                })
            return data
            
        except Exception as e:
            print(f"Error fetching data for {symbol} with interval {interval}: {e}")
            return []

    def get_statistics(self, symbol):
        """Get market statistics for a symbol."""
        try:
            conn = self.get_db_connection()
            
            # Get last 24 hours data
            query = f"""
            SELECT open_time, open_price, high_price, low_price, close_price, volume
            FROM fact_klines
            WHERE symbol = '{symbol}' 
            AND open_time >= NOW() - INTERVAL 24 HOUR
            ORDER BY open_time ASC
            """
            
            df = pd.read_sql(query, conn)
            conn.close()
            
            if df.empty:
                return {"error": "No data available"}
            
            current_price = float(df['close_price'].iloc[-1])
            open_24h = float(df['open_price'].iloc[0])
            high_24h = float(df['high_price'].max())
            low_24h = float(df['low_price'].min())
            volume_24h = float(df['volume'].sum())
            
            change_24h = StatsCalculator.calculate_price_change(current_price, open_24h)
            
            # Calculate moving averages
            close_prices = df['close_price'].astype(float).tolist()
            ma_values = StatsCalculator.calculate_moving_averages(close_prices)
            
            return {
                "symbol": symbol,
                "current_price": round(current_price, 2),
                "change_24h": change_24h,
                "high_24h": round(high_24h, 2),
                "low_24h": round(low_24h, 2),
                "volume_24h": round(volume_24h, 2),
                "data_points": len(df),
                "moving_averages": ma_values,
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error calculating statistics for {symbol}: {e}")
            return {"error": str(e)}
    
    def get_indicators(self, symbol, period=100):
        """Get technical indicators for a symbol."""
        try:
            conn = self.get_db_connection()
            query = f"""
            SELECT close_price
            FROM fact_klines
            WHERE symbol = '{symbol}'
            ORDER BY open_time DESC
            LIMIT {period}
            """
            
            df = pd.read_sql(query, conn)
            conn.close()
            
            if df.empty or len(df) < 14:
                return {"error": "Insufficient data"}
            
            prices = df['close_price'].astype(float).tolist()
            prices.reverse()  # Oldest first
            
            rsi = StatsCalculator.calculate_rsi(prices)
            macd, signal, histogram = StatsCalculator.calculate_macd(prices)
            bb_upper, bb_middle, bb_lower = StatsCalculator.calculate_bollinger_bands(prices)
            volatility = StatsCalculator.calculate_volatility(prices)
            
            return {
                "symbol": symbol,
                "rsi": rsi,
                "macd": {
                    "macd": macd,
                    "signal": signal,
                    "histogram": histogram
                },
                "bollinger_bands": {
                    "upper": bb_upper,
                    "middle": bb_middle,
                    "lower": bb_lower
                },
                "volatility": volatility,
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error calculating indicators for {symbol}: {e}")
            return {"error": str(e)}
    
    def get_pipeline_status(self):
        """Get pipeline execution status."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Get metadata for all symbols
            cursor.execute("""
                SELECT symbol, data_type, last_fetch_time, record_count
                FROM extraction_metadata
                ORDER BY symbol, data_type
            """)
            metadata = cursor.fetchall()
            
            # Get total record counts
            cursor.execute("SELECT COUNT(*) as count FROM fact_klines")
            klines_count = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM fact_orderbook")
            orderbook_count = cursor.fetchone()['count']
            
            conn.close()
            
            return {
                "status": "active",
                "metadata": metadata,
                "total_klines": klines_count,
                "total_orderbook": orderbook_count,
                "symbols": config.SYMBOLS,
                "last_checked": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting pipeline status: {e}")
            return {"status": "error", "message": str(e)}
    
    def get_dashboard_metrics(self):
        """Get comprehensive dashboard metrics."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            #  Total ingested records
            cursor.execute("SELECT COUNT(*) as count FROM fact_klines")
            total_klines = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM fact_orderbook")
            total_orderbook = cursor.fetchone()['count']
            
            total_ingested = total_klines + total_orderbook
            
            # Active pipelines (count of symbols with recent data)
            cursor.execute("""
                SELECT COUNT(DISTINCT symbol) as count
                FROM extraction_metadata
                WHERE last_fetch_time >= NOW() - INTERVAL 1 HOUR
            """)
            active_pipelines = cursor.fetchone()['count'] or len(config.SYMBOLS)
            
            # Warehouse storage (estimate in GB)
            cursor.execute("""
                SELECT 
                    SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024 / 1024 as size_gb
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = %s
            """, (config.DB_NAME,))
            result = cursor.fetchone()
            warehouse_storage = round(float(result['size_gb']) if result['size_gb'] else 0.001, 3)
            
            # 24h volume (sum of trading volume)
            cursor.execute("""
                SELECT SUM(volume) as total_volume
                FROM fact_klines
                WHERE open_time >= NOW() - INTERVAL 24 HOUR
            """)
            result = cursor.fetchone()
            volume_24h = float(result['total_volume']) if result['total_volume'] else 0
            
            # Calculate current price for volume estimation
            total_value_24h = 0
            for symbol in config.SYMBOLS:
                cursor.execute("""
                    SELECT close_price, volume
                    FROM fact_klines
                    WHERE symbol = %s
                    AND open_time >= NOW() - INTERVAL 24 HOUR
                    ORDER BY open_time DESC
                    LIMIT 1
                """, (symbol,))
                row = cursor.fetchone()
                if row:
                    total_value_24h += float(row['close_price']) * float(row['volume'])
            
            conn.close()
            
            return {
                "totalIngested": {
                    "value": total_ingested,
                    "change": 15.2,  # Placeholder - calculate real change later
                    "unit": "records"
                },
                "activePipelines": {
                    "value": active_pipelines,
                    "change": 0,
                    "unit": "pipelines"
                },
                "warehouseStorage": {
                    "value": warehouse_storage,
                    "change": 8.5,
                    "unit": "GB"
                },
                "volume24h": {
                    "value": total_value_24h,
                    "change": 12.3,
                    "unit": "USD"
                }
            }
            
        except Exception as e:
            print(f"Error getting dashboard metrics: {e}")
            return {
                "totalIngested": {"value": 0, "change": 0, "unit": "records"},
                "activePipelines": {"value": 0, "change": 0, "unit": "pipelines"},
                "warehouseStorage": {"value": 0, "change": 0, "unit": "GB"},
                "volume24h": {"value": 0, "change": 0, "unit": "USD"}
            }
    
    def get_ingestion_logs(self, limit=50, offset=0):
        """Get recent ingestion logs with pagination."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Get total count
            cursor.execute("SELECT COUNT(*) as total FROM processed_files")
            total = cursor.fetchone()['total']
            
            # Get paginated logs
            cursor.execute("""
                SELECT 
                    file_name,
                    symbol,
                    data_type,
                    record_count,
                    processed_at,
                    archived
                FROM processed_files
                ORDER BY processed_at DESC
                LIMIT %s OFFSET %s
            """, (limit, offset))
            
            logs = []
            for row in cursor.fetchall():
                logs.append({
                    'fileName': row['file_name'],
                    'symbol': row['symbol'],
                    'dataType': row['data_type'],
                    'recordCount': row['record_count'],
                    'processedAt': row['processed_at'].isoformat() if row['processed_at'] else None,
                    'archived': bool(row['archived']),
                    'status': 'archived' if row['archived'] else 'active'
                })
            
            conn.close()
            
            return {
                'logs': logs,
                'total': total,
                'limit': limit,
                'offset': offset
            }
            
        except Exception as e:
            print(f"Error getting ingestion logs: {e}")
            return {'logs': [], 'total': 0, 'limit': limit, 'offset': offset}
    
    def get_deduplication_stats(self):
        """Get deduplication statistics."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Total processed files
            cursor.execute("SELECT COUNT(*) as total FROM processed_files")
            total_files = cursor.fetchone()['total']
            
            # Total records inserted
            cursor.execute("SELECT SUM(record_count) as total FROM processed_files")
            result = cursor.fetchone()
            total_records = result['total'] if result['total'] else 0
            
            # Actual records in database (after deduplication)
            cursor.execute("SELECT COUNT(*) as count FROM fact_klines")
            actual_klines = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM fact_orderbook")
            actual_orderbook = cursor.fetchone()['count']
            
            actual_records = actual_klines + actual_orderbook
            
            # Calculate deduplication rate
            if total_records > 0:
                duplicates = total_records - actual_records
                dedup_rate = (duplicates / total_records) * 100
            else:
                duplicates = 0
                dedup_rate = 0
            
            conn.close()
            
            return {
                'totalProcessed': int(total_records),
                'uniqueRecords': int(actual_records),
                'duplicatesRemoved': int(duplicates),
                'deduplicationRate': round(dedup_rate, 2),
                'filesProcessed': int(total_files)
            }
            
        except Exception as e:
            print(f"Error getting deduplication stats: {e}")
            return {
                'totalProcessed': 0,
                'uniqueRecords': 0,
                'duplicatesRemoved': 0,
                'deduplicationRate': 0,
                'filesProcessed': 0
            }
    
    def get_storage_health(self):
        """Get storage health metrics for data lake and warehouse."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Data Lake stats
            cursor.execute("""
                SELECT 
                    COUNT(*) as active_files,
                    SUM(CASE WHEN archived = FALSE THEN 1 ELSE 0 END) as unarchived,
                    SUM(CASE WHEN archived = TRUE THEN 1 ELSE 0 END) as archived
                FROM processed_files
            """)
            lake_stats = cursor.fetchone()
            
            # Warehouse table sizes
            cursor.execute("""
                SELECT 
                    TABLE_NAME as table_name,
                    TABLE_ROWS as row_count,
                    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = %s
                AND TABLE_NAME IN ('fact_klines', 'fact_orderbook', 'hourly_klines', 'daily_klines')
            """, (config.DB_NAME,))
            
            tables = []
            total_size_mb = 0
            for row in cursor.fetchall():
                size = float(row['size_mb']) if row['size_mb'] else 0
                total_size_mb += size
                tables.append({
                    'name': row['table_name'],
                    'rows': int(row['row_count']) if row['row_count'] else 0,
                    'sizeMB': size
                })
            
            conn.close()
            
            return {
                'dataLake': {
                    'totalFiles': int(lake_stats['active_files']) if lake_stats else 0,
                    'activeFiles': int(lake_stats['unarchived']) if lake_stats else 0,
                    'archivedFiles': int(lake_stats['archived']) if lake_stats else 0
                },
                'warehouse': {
                    'tables': tables,
                    'totalSizeMB': round(total_size_mb, 2)
                }
            }
            
        except Exception as e:
            print(f"Error getting storage health: {e}")
            return {
                'dataLake': {'totalFiles': 0, 'activeFiles': 0, 'archivedFiles': 0},
                'warehouse': {'tables': [], 'totalSizeMB': 0}
            }
