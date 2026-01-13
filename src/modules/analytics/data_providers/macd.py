"""
MACD (Moving Average Convergence Divergence) data provider.
"""

import pandas as pd
import numpy as np
from .base import DataProvider


class MACDProvider(DataProvider):
    """Provider for MACD indicator data."""
    
    def get_data(self, symbol: str, **params):
        fast_period = params.get('fast_period', 12)
        slow_period = params.get('slow_period', 26)
        signal_period = params.get('signal_period', 9)
        limit = params.get('limit', 200)
        
        try:
            conn = self._get_connection()
            
            # Fetch data (lấy dư ra để tính EMA ban đầu cho chính xác)
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
            
            # 1. FIX QUAN TRỌNG: Ép kiểu sang float để numpy tính toán được
            df['close_price'] = df['close_price'].astype(float)
            
            # Reverse to get chronological order (Cũ nhất lên đầu)
            df = df.iloc[::-1].reset_index(drop=True)
            
            # Calculate EMAs
            prices = df['close_price'].values
            
            # Fast EMA
            ema_fast = self._calculate_ema(prices, fast_period)
            
            # Slow EMA
            ema_slow = self._calculate_ema(prices, slow_period)
            
            # MACD line
            macd_line = ema_fast - ema_slow
            
            # Signal line (EMA of MACD)
            # Lưu ý: Signal line tính trên MACD line, bỏ qua đoạn đầu chưa ổn định
            signal_line = self._calculate_ema(macd_line, signal_period)
            
            # Histogram
            histogram = macd_line - signal_line
            
            # Prepare result
            result = []
            # Chỉ lấy dữ liệu từ điểm đã có đủ cả MACD và Signal
            start_idx = slow_period + signal_period
            
            for i in range(len(df)):
                if i < start_idx: continue # Bỏ qua đoạn đầu chưa tính đủ chỉ báo
                
                result.append({
                    'time': self._format_datetime_to_utc(df.iloc[i]['open_time']),
                    'macd': round(float(macd_line[i]), 8),
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
        
        # Start with SMA for the first valid point
        # (Cách đơn giản: Lấy phần tử đầu tiên làm EMA đầu tiên)
        ema[0] = data[0] 
        
        # Calculate EMA recursive
        for i in range(1, len(data)):
            ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1]
        
        return ema
    
    def get_metadata(self):
        return {
            'name': 'MACD',
            'description': 'Trend indicator',
            'parameters': {
                'fast_period': {'type': 'integer', 'default': 12},
                'slow_period': {'type': 'integer', 'default': 26},
                'signal_period': {'type': 'integer', 'default': 9},
                'limit': {'type': 'integer', 'default': 200}
            }
        }