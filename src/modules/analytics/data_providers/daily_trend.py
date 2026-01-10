import pandas as pd
from .base import DataProvider

class DailyTrendProvider(DataProvider):
    """
    Lấy dữ liệu nến ngày và volume tổng hợp.
    """
    def get_data(self, symbol: str, **params):
        limit = params.get('limit', 30) # Mặc định 30 ngày
        
        try:
            conn = self._get_connection()
            query = """
            SELECT date, close_price, volume, trade_count
            FROM daily_klines
            WHERE symbol = %s
            ORDER BY date DESC
            LIMIT %s
            """
            
            df = pd.read_sql(query, conn, params=(symbol, limit))
            conn.close()
            
            if df.empty:
                return []
                
            df = df.iloc[::-1]
            
            # Format lại date thành string
            result = []
            for _, row in df.iterrows():
                result.append({
                    'date': row['date'].strftime('%Y-%m-%d'),
                    'price': float(row['close_price']),
                    'volume': float(row['volume']),
                    'trades': int(row['trade_count'])
                })
                
            return result
            
        except Exception as e:
            print(f"Error getting daily data: {e}")
            return []

    def get_metadata(self):
        return {
            'name': 'Daily Trend',
            'parameters': {'limit': {'type': 'int', 'default': 30}}
        }