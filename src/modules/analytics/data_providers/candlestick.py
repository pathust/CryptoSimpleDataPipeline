"""
Candlestick data provider for OHLCV chart data.
"""

import pandas as pd
from .base import DataProvider


class CandlestickProvider(DataProvider):
    """Provider for candlestick (OHLCV) data."""
    
    def get_data(self, symbol: str, **params):
        """
        Get candlestick data for charting.
        
        Args:
            symbol: Trading pair symbol
            limit: Number of candles to return (default: 200)
            interval: Time interval (default: '1m')
            
        Returns:
            List of candlestick dictionaries with time, open, high, low, close, volume
        """
        limit = params.get('limit', 200)
        interval = params.get('interval', '1m')
        
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
                open_time_local = row['open_time'].replace(tzinfo=None).isoformat() + 'Z' if pd.notna(row['open_time']) else None
                candlesticks.append({
                    'time': open_time_local,
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
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'Candlestick',
            'description': 'OHLCV candlestick data for price charts',
            'parameters': {
                'limit': {
                    'type': 'integer',
                    'default': 200,
                    'description': 'Number of candles to return'
                },
                'interval': {
                    'type': 'string',
                    'default': '1m',
                    'description': 'Time interval (1m, 5m, 1h, 1d)'
                }
            },
            'data_format': 'Array of {time, open, high, low, close, volume}'
        }
