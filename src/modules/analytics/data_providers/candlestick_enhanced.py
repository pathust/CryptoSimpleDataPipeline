"""
Enhanced candlestick data provider with EMA and Bollinger Bands.
"""

import pandas as pd
import numpy as np
from .base import DataProvider


class CandlestickEnhancedProvider(DataProvider):
    """Provider for enhanced candlestick data with technical indicators."""
    
    def get_data(self, symbol: str, **params):
        """
        Get enhanced candlestick data with EMA 20, EMA 50, and Bollinger Bands.
        
        Args:
            symbol: Trading pair symbol
            limit: Number of candles to return (default: 200)
            interval: Time interval (default: '1m')
            
        Returns:
            List of enhanced candlestick dictionaries with indicators
        """
        limit = params.get('limit', 200)
        interval = params.get('interval', '1m')
        
        try:
            conn = self._get_connection()
            
            # Get more data for accurate indicator calculations
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
            
            df = pd.read_sql(query, conn, params=(symbol, interval, limit + 50))
            conn.close()
            
            if df.empty:
                return []
            
            # Reverse to get chronological order
            df = df.iloc[::-1]
            
            # Calculate EMAs
            df['ema20'] = df['close_price'].ewm(span=20, adjust=False).mean()
            df['ema50'] = df['close_price'].ewm(span=50, adjust=False).mean()
            
            # Calculate Bollinger Bands (20 period, 2 standard deviations)
            df['bb_middle'] = df['close_price'].rolling(window=20).mean()
            bb_std = df['close_price'].rolling(window=20).std()
            df['bb_upper'] = df['bb_middle'] + (bb_std * 2)
            df['bb_lower'] = df['bb_middle'] - (bb_std * 2)
            
            # Convert to list of dictionaries, skipping first 50 rows for indicator accuracy
            candlesticks = []
            start_idx = 50  # Skip initial rows for accurate EMA calculations
            
            for idx in range(start_idx, len(df)):
                row = df.iloc[idx]
                open_time_utc = row['open_time'].replace(tzinfo=None).isoformat() + 'Z' if pd.notna(row['open_time']) else None
                
                candlesticks.append({
                    'time': open_time_utc,
                    'open': float(row['open_price']) if pd.notna(row['open_price']) else 0,
                    'high': float(row['high_price']) if pd.notna(row['high_price']) else 0,
                    'low': float(row['low_price']) if pd.notna(row['low_price']) else 0,
                    'close': float(row['close_price']) if pd.notna(row['close_price']) else 0,
                    'volume': float(row['volume']) if pd.notna(row['volume']) else 0,
                    'ema20': float(row['ema20']) if pd.notna(row['ema20']) else None,
                    'ema50': float(row['ema50']) if pd.notna(row['ema50']) else None,
                    'bb_upper': float(row['bb_upper']) if pd.notna(row['bb_upper']) else None,
                    'bb_middle': float(row['bb_middle']) if pd.notna(row['bb_middle']) else None,
                    'bb_lower': float(row['bb_lower']) if pd.notna(row['bb_lower']) else None,
                })
            
            return candlesticks
            
        except Exception as e:
            print(f"Error getting enhanced candlestick data: {e}")
            return []
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'Enhanced Candlestick',
            'description': 'OHLCV candlestick data with EMA 20/50 and Bollinger Bands',
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
            'data_format': 'Array of {time, open, high, low, close, volume, ema20, ema50, bb_upper, bb_middle, bb_lower}',
            'indicators': {
                'ema20': 'Exponential Moving Average 20 (Yellow/Neon)',
                'ema50': 'Exponential Moving Average 50 (Blue)',
                'bollinger_bands': 'Bollinger Bands (20, 2) - Upper, Middle, Lower'
            }
        }
