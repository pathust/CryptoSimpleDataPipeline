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
            List of volume data points with time and volume
        """
        limit = params.get('limit', 200)
        interval = params.get('interval', '1m')
        
        try:
            conn = self._get_connection()
            
            query = """
            SELECT 
                open_time,
                volume,
                close_price
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
            volume_data = []
            for _, row in df.iterrows():
                open_time_utc = row['open_time'].replace(tzinfo=None).isoformat() + 'Z' if pd.notna(row['open_time']) else None
                volume_data.append({
                    'time': open_time_utc,
                    'volume': float(row['volume']) if pd.notna(row['volume']) else 0,
                    'price': float(row['close_price']) if pd.notna(row['close_price']) else 0
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
            'data_format': 'Array of {time, volume, price}'
        }
