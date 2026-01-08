import mysql.connector
import pandas as pd
import src.config as config
from datetime import datetime, timedelta
from src.modules.stats.calculator import StatsCalculator

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
