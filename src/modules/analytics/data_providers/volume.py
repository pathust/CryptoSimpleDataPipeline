"""
Volume data provider for volume analysis charts.
"""

import pandas as pd
from .base import DataProvider


class VolumeProvider(DataProvider):
    """Provider for trading volume data."""
    
    def get_data(self, symbol: str, **params):
        """
        Get volume data over time.
        Args:
            symbol: Trading pair symbol
            limit: Number of data points (default: 200)
            interval: Time interval (default: '1m')
        Returns:
            List of volume data points with time, volume, close_price, open_price
        """
        limit = params.get('limit', 200)
        interval = params.get('interval', '1m')
        multiplier = 1
        if interval.endswith('m'):
            multiplier = int(interval.replace('m', ''))
        elif interval.endswith('h'):
            multiplier = int(interval.replace('h', '')) * 60
        elif interval.endswith('d'):
            multiplier = int(interval.replace('d', '')) * 1440
            
        fetch_limit = limit * multiplier

        try:
            conn = self._get_connection()
            
            query = """
            SELECT 
                open_time,
                volume,
                open_price,
                close_price
            FROM fact_klines
            WHERE symbol = %s AND interval_code = '1m'
            ORDER BY open_time DESC
            LIMIT %s
            """
            
            df = pd.read_sql(query, conn, params=(symbol, fetch_limit))
            conn.close()
            
            if df.empty:
                return []
            
            # Reverse to get chronological order
            df = df.iloc[::-1]
            df['open_time'] = pd.to_datetime(df['open_time'])

            if interval != '1m':
                df.set_index('open_time', inplace=True)
                p_interval = interval.replace('m', 'min').replace('h', 'H').replace('d', 'D')
                
                df = df.resample(p_interval).agg({
                    'volume': 'sum',
                    'open_price': 'first',
                    'close_price': 'last'
                }).dropna()
                df = df.reset_index()

            df = df.tail(limit)
            # Convert to list of dictionaries
            volume_data = []
            for _, row in df.iterrows():
                volume_data.append({
                    'time': self._format_datetime_to_utc(row['open_time']),
                    'volume': float(row['volume']) if pd.notna(row['volume']) else 0,
                    'price': float(row['close_price']) if pd.notna(row['close_price']) else 0,
                    'open': float(row['open_price']) if pd.notna(row['open_price']) else 0
                })
            
            return volume_data
            
        except Exception as e:
            print(f"Error getting volume data: {e}")
            return []
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'Volume',
            'description': 'Trading volume over time',
            'parameters': {
                'limit': {'type': 'integer', 'default': 200},
                'interval': {'type': 'string', 'default': '1m'}
            }
        }