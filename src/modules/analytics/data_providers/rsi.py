"""
RSI (Relative Strength Index) data provider.
"""

import pandas as pd
import numpy as np
from .base import DataProvider


class RSIProvider(DataProvider):
    """Provider for RSI indicator data."""
    
    def get_data(self, symbol: str, **params):
        """
        Get RSI indicator data.
        
        Args:
            symbol: Trading pair symbol
            period: RSI period (default: 14)
            limit: Number of data points (default: 200)
            
        Returns:
            List of RSI data points with time and rsi value
        """
        period = params.get('period', 14)
        limit = params.get('limit', 200)
        interval = params.get('interval', '1m')
        
        multiplier = 1
        if interval.endswith('m'):
            multiplier = int(interval.replace('m', ''))
        elif interval.endswith('h'):
            multiplier = int(interval.replace('h', '')) * 60
        elif interval.endswith('d'):
            multiplier = int(interval.replace('d', '')) * 1440
            
        needed_candles = limit + period + 1 
        fetch_limit = needed_candles * multiplier

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
            
            df = pd.read_sql(query, conn, params=(symbol, fetch_limit))
            conn.close()
            
            if df.empty or len(df) < period + 1:
                return []
            
            # Reverse to get chronological order
            df = df.iloc[::-1]
            df['open_time'] = pd.to_datetime(df['open_time'])
            df['close_price'] = df['close_price'].astype(float)

            if interval != '1m':
                df.set_index('open_time', inplace=True)
                p_interval = interval.replace('m', 'min').replace('h', 'H').replace('d', 'D')
                df = df.resample(p_interval).agg({'close_price': 'last'}).dropna()
                df = df.reset_index()

            if len(df) < period + 1:
                return []

            # Calculate RSI
            prices = df['close_price'].values
            deltas = np.diff(prices)
            gains = np.where(deltas > 0, deltas, 0)
            losses = np.where(deltas < 0, -deltas, 0)
            
            # Calculate average gains and losses
            avg_gains = []
            avg_losses = []
            
            # Initial averages
            avg_gain = np.mean(gains[:period])
            avg_loss = np.mean(losses[:period])
            avg_gains.append(avg_gain)
            avg_losses.append(avg_loss)
            
            # Smoothed averages
            for i in range(period, len(gains)):
                avg_gain = (avg_gain * (period - 1) + gains[i]) / period
                avg_loss = (avg_loss * (period - 1) + losses[i]) / period
                avg_gains.append(avg_gain)
                avg_losses.append(avg_loss)
            
            # Calculate RSI
            rsi_values = []
            for avg_gain, avg_loss in zip(avg_gains, avg_losses):
                if avg_loss == 0:
                    rsi = 100
                else:
                    rs = avg_gain / avg_loss
                    rsi = 100 - (100 / (1 + rs))
                rsi_values.append(rsi)
            
            # Prepare result
            result = []
            for i in range(len(rsi_values)):
                idx = i + period
                if idx < len(df):
                    result.append({
                        'time': self._format_datetime_to_utc(df.iloc[idx]['open_time']),
                        'rsi': round(rsi_values[i], 2)
                    })
            
            # Return only requested limit
            return result[-limit:]
            
        except Exception as e:
            print(f"Error calculating RSI: {e}")
            return []
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'RSI',
            'description': 'Relative Strength Index - momentum indicator',
            'parameters': {
                'period': {
                    'type': 'integer',
                    'default': 14,
                    'description': 'RSI calculation period'
                },
                'limit': {
                    'type': 'integer',
                    'default': 200,
                    'description': 'Number of data points'
                }
            },
            'data_format': 'Array of {time, rsi}'
        }
