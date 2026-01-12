"""
Bollinger Bands data provider.
"""

import pandas as pd
import numpy as np
from .base import DataProvider


class BollingerProvider(DataProvider):
    """Provider for Bollinger Bands indicator data."""
    
    def get_data(self, symbol: str, **params):
        period = params.get('period', 20)
        std_dev = params.get('std_dev', 2)
        limit = params.get('limit', 200)
        
        try:
            conn = self._get_connection()
            
            # Fetch data
            query = """
            SELECT 
                open_time,
                close_price
            FROM fact_klines
            WHERE symbol = %s AND interval_code = '1m'
            ORDER BY open_time DESC
            LIMIT %s
            """
            
            # Lấy dư thêm data để tính SMA đoạn đầu chính xác
            df = pd.read_sql(query, conn, params=(symbol, limit + period + 5))
            conn.close()
            
            if df.empty or len(df) < period:
                return []
            
            # 1. FIX QUAN TRỌNG: Convert Decimal sang float để numpy tính toán được
            df['close_price'] = df['close_price'].astype(float)

            # Reverse chronological order (Cũ nhất lên đầu)
            df = df.iloc[::-1].reset_index(drop=True)
            
            prices = df['close_price'].values

            # 2. Tính SMA (Middle Band)
            # mode='valid' sẽ trả về mảng ngắn hơn mảng gốc (len - period + 1)
            sma = np.convolve(prices, np.ones(period) / period, mode='valid')
            
            # 3. Tính Standard Deviation
            # Cần tính std cho từng cửa sổ tương ứng với SMA
            # Cách tối ưu hơn dùng Pandas Rolling thay vì loop
            df['sma'] = df['close_price'].rolling(window=period).mean()
            df['std'] = df['close_price'].rolling(window=period).std()
            
            # Cắt bỏ các giá trị NaN đầu tiên do rolling
            df_result = df.dropna().tail(limit)

            # 4. Tính Bands
            upper_band = df_result['sma'] + (df_result['std'] * std_dev)
            lower_band = df_result['sma'] - (df_result['std'] * std_dev)
            
            # Prepare result
            result = []
            for idx, row in df_result.iterrows():
                open_time_utc = row['open_time'].replace(tzinfo=None).isoformat() + 'Z'
                result.append({
                    'time': open_time_utc,
                    'upper': round(float(upper_band[idx]), 8),
                    'middle': round(float(row['sma']), 8),
                    'lower': round(float(lower_band[idx]), 8),
                    'price': round(float(row['close_price']), 8)
                })
            
            return result
            
        except Exception as e:
            print(f"Error calculating Bollinger Bands: {e}")
            return []
    
    def get_metadata(self):
        return {
            'name': 'Bollinger Bands',
            'description': 'Volatility indicator',
            'parameters': {
                'period': {'type': 'integer', 'default': 20},
                'std_dev': {'type': 'number', 'default': 2},
                'limit': {'type': 'integer', 'default': 200}
            }
        }