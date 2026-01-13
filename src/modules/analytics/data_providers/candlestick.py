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
        print(f"Fetching {limit} candlesticks for {symbol} at interval {interval}")
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
            SELECT open_time, open_price, high_price, low_price, close_price, volume
            FROM fact_klines
            WHERE symbol = %s
            ORDER BY open_time DESC
            LIMIT %s
            """
            
            df = pd.read_sql(query, conn, params=(symbol, fetch_limit))
            conn.close()
            
            if df.empty:
                print("No candlestick data found.")                
                return []
            
            df = df.iloc[::-1]
            
            # if interval != '1m':
            df['open_time'] = pd.to_datetime(df['open_time'])
            df.set_index('open_time', inplace=True)
            
            p_interval = interval.replace('m', 'min')
            
            df = df.resample(p_interval).agg({
                'open_price': 'first',
                'high_price': 'max',
                'low_price': 'min',
                'close_price': 'last',
                'volume': 'sum'
            }).dropna()
            df = df.reset_index()

            df = df.tail(limit)

            candlesticks = []
            for _, row in df.iterrows():
                t_val = row['open_time'] if 'open_time' in row else row.name
                open_time_local = t_val.replace(tzinfo=None).isoformat() + 'Z'
                
                candlesticks.append({
                    'time': open_time_local,
                    'open': float(row['open_price']),
                    'high': float(row['high_price']),
                    'low': float(row['low_price']),
                    'close': float(row['close_price']),
                    'volume': float(row['volume'])
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
