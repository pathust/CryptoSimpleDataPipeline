import mysql.connector
from datetime import datetime, timedelta
import src.config as config

class WarehouseAggregator:
    def __init__(self):
        pass
    
    def get_db_connection(self):
        return mysql.connector.connect(
            host=config.DB_HOST,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME
        )
    
    def aggregate_hourly(self, symbol=None):
        """Create hourly aggregations from minute data."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            symbol_filter = f"AND symbol = '{symbol}'" if symbol else ""
            
            # Aggregate into hourly_klines
            query = f"""
            INSERT INTO hourly_klines 
            (symbol, hour_start, open_price, high_price, low_price, close_price, volume, trade_count)
            SELECT 
                symbol,
                DATE_FORMAT(open_time, '%Y-%m-%d %H:00:00') as hour_start,
                (SELECT open_price FROM fact_klines f2 
                 WHERE f2.symbol = f1.symbol 
                 AND DATE_FORMAT(f2.open_time, '%Y-%m-%d %H:00:00') = DATE_FORMAT(f1.open_time, '%Y-%m-%d %H:00:00')
                 ORDER BY open_time ASC LIMIT 1) as open_price,
                MAX(high_price) as high_price,
                MIN(low_price) as low_price,
                (SELECT close_price FROM fact_klines f3 
                 WHERE f3.symbol = f1.symbol 
                 AND DATE_FORMAT(f3.open_time, '%Y-%m-%d %H:00:00') = DATE_FORMAT(f1.open_time, '%Y-%m-%d %H:00:00')
                 ORDER BY open_time DESC LIMIT 1) as close_price,
                SUM(volume) as volume,
                COUNT(*) as trade_count
            FROM fact_klines f1
            WHERE 1=1 {symbol_filter}
            GROUP BY symbol, DATE_FORMAT(open_time, '%Y-%m-%d %H:00:00')
            ON DUPLICATE KEY UPDATE
                open_price = VALUES(open_price),
                high_price = VALUES(high_price),
                low_price = VALUES(low_price),
                close_price = VALUES(close_price),
                volume = VALUES(volume),
                trade_count = VALUES(trade_count)
            """
            
            cursor.execute(query)
            rows = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"📊 Aggregated {rows} hourly records")
            return rows
            
        except Exception as e:
            print(f"Error aggregating hourly data: {e}")
            return 0
    
    def aggregate_daily(self, symbol=None):
        """Create daily aggregations from hourly data."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            symbol_filter = f"AND symbol = '{symbol}'" if symbol else ""
            
            # Aggregate into daily_klines
            query = f"""
            INSERT INTO daily_klines 
            (symbol, date, open_price, high_price, low_price, close_price, volume, trade_count)
            SELECT 
                symbol,
                DATE(hour_start) as date,
                (SELECT open_price FROM hourly_klines h2 
                 WHERE h2.symbol = h1.symbol 
                 AND DATE(h2.hour_start) = DATE(h1.hour_start)
                 ORDER BY hour_start ASC LIMIT 1) as open_price,
                MAX(high_price) as high_price,
                MIN(low_price) as low_price,
                (SELECT close_price FROM hourly_klines h3 
                 WHERE h3.symbol = h1.symbol 
                 AND DATE(h3.hour_start) = DATE(h1.hour_start)
                 ORDER BY hour_start DESC LIMIT 1) as close_price,
                SUM(volume) as volume,
                SUM(trade_count) as trade_count
            FROM hourly_klines h1
            WHERE 1=1 {symbol_filter}
            GROUP BY symbol, DATE(hour_start)
            ON DUPLICATE KEY UPDATE
                open_price = VALUES(open_price),
                high_price = VALUES(high_price),
                low_price = VALUES(low_price),
                close_price = VALUES(close_price),
                volume = VALUES(volume),
                trade_count = VALUES(trade_count)
            """
            
            cursor.execute(query)
            rows = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"📊 Aggregated {rows} daily records")
            return rows
            
        except Exception as e:
            print(f"Error aggregating daily data: {e}")
            return 0
    
    def cleanup_old_data(self, days_to_keep=90):
        """Delete raw klines older than specified days."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)
            
            # Delete old fact_klines
            cursor.execute("""
                DELETE FROM fact_klines 
                WHERE created_at < %s
            """, (cutoff_date,))
            klines_deleted = cursor.rowcount
            
            # Delete old fact_orderbook
            cursor.execute("""
                DELETE FROM fact_orderbook 
                WHERE created_at < %s
            """, (cutoff_date,))
            orderbook_deleted = cursor.rowcount
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"🗑️  Deleted {klines_deleted} old klines, {orderbook_deleted} old orderbook records")
            return klines_deleted + orderbook_deleted
            
        except Exception as e:
            print(f"Error cleaning up old data: {e}")
            return 0
    
    def get_statistics(self):
        """Get warehouse statistics."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("SELECT COUNT(*) as count FROM fact_klines")
            klines = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM hourly_klines")
            hourly = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM daily_klines")
            daily = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM fact_orderbook")
            orderbook = cursor.fetchone()['count']
            
            cursor.close()
            conn.close()
            
            return {
                "klines_count": klines,
                "hourly_count": hourly,
                "daily_count": daily,
                "orderbook_count": orderbook
            }
        except Exception as e:
            print(f"Error getting warehouse statistics: {e}")
            return {}
