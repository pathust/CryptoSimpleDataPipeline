import pandas as pd
from .base import DataProvider

class SpreadProvider(DataProvider):
    """
    Tính chênh lệch (Spread) giữa Best Ask và Best Bid theo thời gian.
    """
    def get_data(self, symbol: str, **params):
        limit = params.get('limit', 100)
        
        try:
            conn = self._get_connection()
            # Logic: Group theo thời gian, lấy (Min Ask - Max Bid)
            # Lưu ý: side trong DB của bạn là 'bid' (thường) nên tôi giả định chiều bán là 'ask'
            query = """
            SELECT 
                captured_at as time,
                (MIN(CASE WHEN side = 'ask' THEN price END) - MAX(CASE WHEN side = 'bid' THEN price END)) as spread_value,
                (MIN(CASE WHEN side = 'ask' THEN price END) - MAX(CASE WHEN side = 'bid' THEN price END)) / MIN(CASE WHEN side = 'ask' THEN price END) * 10000 as spread_bps
            FROM fact_orderbook
            WHERE symbol = %s
            GROUP BY captured_at
            HAVING spread_value IS NOT NULL AND spread_value > 0
            ORDER BY captured_at DESC
            LIMIT %s
            """
            
            df = pd.read_sql(query, conn, params=(symbol, limit))
            conn.close()
            
            if df.empty:
                return []
            
            # Đảo chiều để vẽ từ quá khứ -> hiện tại
            df = df.iloc[::-1]
            
            return df.to_dict('records')
            
        except Exception as e:
            print(f"Error calculating spread: {e}")
            return []

    def get_metadata(self):
        return {
            'name': 'Spread History',
            'parameters': {'limit': {'type': 'int', 'default': 100}}
        }