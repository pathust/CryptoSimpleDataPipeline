"""
MACD (Moving Average Convergence Divergence) data provider.
"""

import pandas as pd
import numpy as np
from .base import DataProvider


class MACDProvider(DataProvider):
    """Provider for MACD indicator data."""
    
    def get_data(self, symbol: str, **params):
        """
        Get MACD indicator data.
        
        Args:
            symbol: Trading pair symbol
            fast_period: Fast EMA period (default: 12)
            slow_period: Slow EMA period (default: 26)
            signal_period: Signal line period (default: 9)
            limit: Number of data points (default: 200)
            
        Returns:
            List of MACD data points with time, macd, signal, histogram
        """
        fast_period = params.get('fast_period', 12)
        slow_period = params.get('slow_period', 26)
        signal_period = params.get('signal_period', 9)
        limit = params.get('limit', 200)
        
        try:
            conn = self._get_connection()
            
            # Fetch more data than needed for calculation
            fetch_limit = limit + slow_period + signal_period + 50
            query = """
            SELECT 
                open_time,
                close_price
            FROM fact_klines
            WHERE symbol = %s AND interval_code = '1m'
            ORDER BY open_time DESC
            LIMIT %s
            """
            
            df = pd.read_sql(query, conn, params=(symbol, fetch_limit))
            conn.close()
            
            if df.empty or len(df) < slow_period + signal_period:
                return []
            
            # Reverse to get chronological order
            df = df.iloc[::-1]
            
            # Calculate EMAs
            prices = df['close_price'].values
            
            # Fast EMA
            ema_fast = self._calculate_ema(prices, fast_period)
            
            # Slow EMA
            ema_slow = self._calculate_ema(prices, slow_period)
            
            # MACD line
            macd_line = ema_fast - ema_slow
            
            # Signal line (EMA of MACD)
            signal_line = self._calculate_ema(macd_line[slow_period:], signal_period)
            
            # Histogram
            histogram = macd_line[slow_period + signal_period - 1:] - signal_line
            
            # Prepare result
            result = []
            start_idx = slow_period + signal_period - 1
            for i in range(len(histogram)):
                idx = start_idx + i
                if idx < len(df):
                    open_time_utc = df.iloc[idx]['open_time'].replace(tzinfo=None).isoformat() + 'Z'
                    result.append({
                        'time': open_time_utc,
                        'macd': round(float(macd_line[idx]), 8),
                        'signal': round(float(signal_line[i]), 8),
                        'histogram': round(float(histogram[i]), 8)
                    })
            
            # Return only requested limit
            return result[-limit:]
            
        except Exception as e:
            print(f"Error calculating MACD: {e}")
            return []
    
    def _calculate_ema(self, data, period):
        """Calculate Exponential Moving Average."""
        ema = np.zeros(len(data))
        multiplier = 2 / (period + 1)
        
        # Start with SMA
        ema[period - 1] = np.mean(data[:period])
        
        # Calculate EMA
        for i in range(period, len(data)):
            ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1]
        
        return ema
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'MACD',
            'description': 'Moving Average Convergence Divergence - trend indicator',
            'parameters': {
                'fast_period': {
                    'type': 'integer',
                    'default': 12,
                    'description': 'Fast EMA period'
                },
                'slow_period': {
                    'type': 'integer',
                    'default': 26,
                    'description': 'Slow EMA period'
                },
                'signal_period': {
                    'type': 'integer',
                    'default': 9,
                    'description': 'Signal line period'
                },
                'limit': {
                    'type': 'integer',
                    'default': 200,
                    'description': 'Number of data points'
                }
            },
            'data_format': 'Array of {time, macd, signal, histogram}'
        }
