import mysql.connector
import pandas as pd
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
import src.config as config


class AnalyticsService:
    """Service for advanced analytics and market data."""
    
    def __init__(self):
        self.db_config = {
            'host': config.DB_HOST,
            'user': config.DB_USER,
            'password': config.DB_PASSWORD,
            'database': config.DB_NAME
        }
    
    def _get_connection(self):
        """Get database connection."""
        return mysql.connector.connect(**self.db_config)
    
    def get_candlestick_data(self, symbol, limit=200, interval='1m'):
        """
        Get candlestick (OHLCV) data for charting.
        
        Args:
            symbol: Trading pair symbol
            limit: Number of candles to return
            interval: Time interval (default '1m')
            
        Returns:
            List of candlestick data dictionaries
        """
        try:
            conn = self._get_connection()
            
            query = """
            SELECT 
                open_time,
                open_price,
                high_price,
                low_price,
                close_price,
                volume
            FROM fact_klines
            WHERE symbol = %s AND interval_code = %s
            ORDER BY open_time DESC
            LIMIT %s
            """
            
            df = pd.read_sql(query, conn, params=(symbol, interval, limit))
            conn.close()
            
            if df.empty:
                return []
            
            # Reverse to get chronological order
            df = df.iloc[::-1]
            
            # Convert to list of dictionaries
            candlesticks = []
            for _, row in df.iterrows():
                # Use replace(tzinfo=UTC) then isoformat() to get proper UTC indicator
                open_time_utc = row['open_time'].replace(tzinfo=None).isoformat() + 'Z' if pd.notna(row['open_time']) else None
                candlesticks.append({
                    'time': open_time_utc,
                    'open': float(row['open_price']) if pd.notna(row['open_price']) else 0,
                    'high': float(row['high_price']) if pd.notna(row['high_price']) else 0,
                    'low': float(row['low_price']) if pd.notna(row['low_price']) else 0,
                    'close': float(row['close_price']) if pd.notna(row['close_price']) else 0,
                    'volume': float(row['volume']) if pd.notna(row['volume']) else 0
                })
            
            return candlesticks
            
        except Exception as e:
            print(f"Error getting candlestick data: {e}")
            return []
    
    def get_orderbook_snapshot(self, symbol, limit=20):
        """
        Get latest orderbook snapshot.
        
        Args:
            symbol: Trading pair symbol
            limit: Number of price levels per side
            
        Returns:
            Dictionary with bids and asks
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Get latest timestamp
            cursor.execute("""
                SELECT MAX(captured_at) as latest
                FROM fact_orderbook
                WHERE symbol = %s
            """, (symbol,))
            
            result = cursor.fetchone()
            if not result or not result['latest']:
                conn.close()
                return {'bids': [], 'asks': []}
            
            latest_time = result['latest']
            
            # Get bids (buy orders)
            cursor.execute("""
                SELECT price, quantity
                FROM fact_orderbook
                WHERE symbol = %s 
                AND side = 'bid'
                AND captured_at = %s
                ORDER BY price DESC
                LIMIT %s
            """, (symbol, latest_time, limit))
            
            bids = [{'price': float(row['price']), 'quantity': float(row['quantity'])} 
                   for row in cursor.fetchall()]
            
            # Get asks (sell orders)
            cursor.execute("""
                SELECT price, quantity
                FROM fact_orderbook
                WHERE symbol = %s 
                AND side = 'ask'
                AND captured_at = %s
                ORDER BY price ASC
                LIMIT %s
            """, (symbol, latest_time, limit))
            
            asks = [{'price': float(row['price']), 'quantity': float(row['quantity'])} 
                   for row in cursor.fetchall()]
            
            conn.close()
            
            return {
                'bids': bids,
                'asks': asks,
                'timestamp': latest_time.isoformat() if latest_time else None
            }
            
        except Exception as e:
            print(f"Error getting orderbook: {e}")
            return {'bids': [], 'asks': []}
