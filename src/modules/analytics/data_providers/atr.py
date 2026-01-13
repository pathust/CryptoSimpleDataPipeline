"""
ATR (Average True Range) data provider.
ATR measures market volatility by calculating the average of true ranges over a period.
"""

import pandas as pd
import numpy as np
from .base import DataProvider


class ATRProvider(DataProvider):
    """Provider for ATR indicator data."""
    
    def get_data(self, symbol: str, **params):
        """
        Get ATR indicator data.
        
        Args:
            symbol: Trading pair symbol
            period: ATR period (default: 14)
            limit: Number of data points (default: 200)
            interval: Time interval (default: '1m')
            
        Returns:
            List of ATR data points with time and atr value
        """
        period = params.get('period', 14)
        limit = params.get('limit', 200)
        interval = params.get('interval', '1m')
        
        try:
            conn = self._get_connection()
            
            # Fetch more data than needed for calculation
            query = """
            SELECT 
                open_time,
                high_price,
                low_price,
                close_price
            FROM fact_klines
            WHERE symbol = %s AND interval_code = %s
            ORDER BY open_time DESC
            LIMIT %s
            """
            
            df = pd.read_sql(query, conn, params=(symbol, interval, limit + period + 1))
            conn.close()
            
            if df.empty or len(df) < period + 1:
                return []
            
            # Reverse to get chronological order
            df = df.iloc[::-1]
            
            # Calculate True Range
            # TR = max(high - low, abs(high - prev_close), abs(low - prev_close))
            high = df['high_price'].values
            low = df['low_price'].values
            close = df['close_price'].values
            
            # Shift close price for previous period
            prev_close = np.roll(close, 1)
            prev_close[0] = close[0]  # First value uses current close
            
            # Calculate True Range
            tr1 = high - low
            tr2 = np.abs(high - prev_close)
            tr3 = np.abs(low - prev_close)
            
            true_range = np.maximum(tr1, np.maximum(tr2, tr3))
            
            # Calculate ATR using Wilder's smoothing method (same as RSI)
            # Initial ATR = Simple Average of first period TRs
            atr_values = []
            atr = np.mean(true_range[:period])
            atr_values.append(atr)
            
            # Subsequent ATR = ((period - 1) * previous_ATR + current_TR) / period
            for i in range(period, len(true_range)):
                atr = ((period - 1) * atr + true_range[i]) / period
                atr_values.append(atr)
            
            # Prepare result
            result = []
            for i in range(len(atr_values)):
                idx = i + period - 1
                if idx < len(df):
                    result.append({
                        'time': self._format_datetime_to_utc(df.iloc[idx]['open_time']),
                        'atr': round(atr_values[i], 4)
                    })
            
            # Return only requested limit
            return result[-limit:]
            
        except Exception as e:
            print(f"Error calculating ATR: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'ATR',
            'description': 'Average True Range - volatility indicator',
            'parameters': {
                'period': {
                    'type': 'integer',
                    'default': 14,
                    'description': 'ATR calculation period'
                },
                'limit': {
                    'type': 'integer',
                    'default': 200,
                    'description': 'Number of data points'
                },
                'interval': {
                    'type': 'string',
                    'default': '1m',
                    'description': 'Time interval'
                }
            },
            'data_format': 'Array of {time, atr}'
        }
