"""
Bollinger Bands data provider.
"""

import pandas as pd
import numpy as np
from .base import DataProvider


class BollingerProvider(DataProvider):
    """Provider for Bollinger Bands indicator data."""
    
    def get_data(self, symbol: str, **params):
        """
        Get Bollinger Bands indicator data.
        
        Args:
            symbol: Trading pair symbol
            period: Moving average period (default: 20)
            std_dev: Number of standard deviations (default: 2)
            limit: Number of data points (default: 200)
            
        Returns:
            List of Bollinger Bands data points with time, upper, middle, lower
        """
        period = params.get('period', 20)
        std_dev = params.get('std_dev', 2)
        limit = params.get('limit', 200)
        
        try:
            conn = self._get_connection()
            
            # Fetch more data than needed for calculation
            query = """
            SELECT 
                open_time,
                close_price
            FROM fact_klines
            WHERE symbol = %s AND interval_code = '1m'
            ORDER BY open_time DESC
            LIMIT %s
            """
            
            df = pd.read_sql(query, conn, params=(symbol, limit + period + 1))
            conn.close()
            
            if df.empty or len(df) < period:
                return []
            
            # Reverse to get chronological order
            df = df.iloc[::-1]
            
            # Calculate SMA (middle band)
            prices = df['close_price'].values
            sma = np.convolve(prices, np.ones(period) / period, mode='valid')
            
            # Calculate standard deviation
            std = []
            for i in range(len(sma)):
                window = prices[i:i + period]
                std.append(np.std(window))
            
            std = np.array(std)
            
            # Calculate upper and lower bands
            upper_band = sma + (std_dev * std)
            lower_band = sma - (std_dev * std)
            
            # Prepare result
            result = []
            for i in range(len(sma)):
                idx = i + period - 1
                if idx < len(df):
                    open_time_utc = df.iloc[idx]['open_time'].replace(tzinfo=None).isoformat() + 'Z'
                    result.append({
                        'time': open_time_utc,
                        'upper': round(float(upper_band[i]), 8),
                        'middle': round(float(sma[i]), 8),
                        'lower': round(float(lower_band[i]), 8),
                        'price': round(float(prices[idx]), 8)
                    })
            
            # Return only requested limit
            return result[-limit:]
            
        except Exception as e:
            print(f"Error calculating Bollinger Bands: {e}")
            return []
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'Bollinger Bands',
            'description': 'Volatility indicator with upper, middle, and lower bands',
            'parameters': {
                'period': {
                    'type': 'integer',
                    'default': 20,
                    'description': 'Moving average period'
                },
                'std_dev': {
                    'type': 'number',
                    'default': 2,
                    'description': 'Number of standard deviations'
                },
                'limit': {
                    'type': 'integer',
                    'default': 200,
                    'description': 'Number of data points'
                }
            },
            'data_format': 'Array of {time, upper, middle, lower, price}'
        }
