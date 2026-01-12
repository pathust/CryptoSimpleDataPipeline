import pandas as pd
from .base import DataProvider

class OrderBookProvider(DataProvider):
    def get_data(self, symbol: str, **params):
        try:
            conn = self._get_connection()
            
            # 1. Tìm thời điểm snapshot mới nhất của symbol đó
            # Lưu ý: Dùng captured_at như trong schema bạn gửi
            query_time = "SELECT MAX(captured_at) FROM fact_orderbook WHERE symbol = %s"
            latest_time = pd.read_sql(query_time, conn, params=(symbol,)).iloc[0, 0]
            
            if not latest_time:
                return {'bids': [], 'asks': []}

            # 2. Lấy dữ liệu tại thời điểm đó
            query_data = """
            SELECT side, price, quantity
            FROM fact_orderbook
            WHERE symbol = %s AND captured_at = %s
            ORDER BY price ASC
            """
            
            df = pd.read_sql(query_data, conn, params=(symbol, latest_time))
            conn.close()
            
            if df.empty:
                return {'bids': [], 'asks': []}
            
            # Chuẩn hóa dữ liệu về float
            df['price'] = df['price'].astype(float)
            df['quantity'] = df['quantity'].astype(float)
            
            # 3. Tách Bid/Ask dựa trên value 'bid' trong schema
            # Giả định bên bán là 'ask'
            bids_df = df[df['side'] == 'bid'].sort_values('price', ascending=False)
            asks_df = df[df['side'] == 'ask'].sort_values('price', ascending=True)
            
            # 4. Tính tổng tích lũy (Cumulative Sum) để vẽ dốc
            bids_df['total'] = bids_df['quantity'].cumsum()
            asks_df['total'] = asks_df['quantity'].cumsum()
            
            return {
                'bids': bids_df[['price', 'quantity', 'total']].to_dict('records'),
                'asks': asks_df[['price', 'quantity', 'total']].to_dict('records')
            }
            
        except Exception as e:
            print(f"Error getting orderbook: {e}")
            return {'bids': [], 'asks': []}
    
    def get_metadata(self):
        return {
            'name': 'Order Book',
            'parameters': {}
        }