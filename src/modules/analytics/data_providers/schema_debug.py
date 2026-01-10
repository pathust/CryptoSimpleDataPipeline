import pandas as pd
from .base import DataProvider

class SchemaDebugProvider(DataProvider):
    """
    Provider dùng để kiểm tra cấu trúc bảng và data mẫu.
    """
    
    def get_data(self, symbol: str, **params):
        # Danh sách các bảng cần kiểm tra để vẽ chart
        target_tables = [
            'fact_orderbook',   # Quan trọng cho Depth Chart & Spread
            'fact_klines',      # Quan trọng cho Candlestick & Volume Profile
            'daily_klines',     # Quan trọng cho thống kê dài hạn
            'fact_liquidations' # (Nếu bạn đã tạo bảng này theo hướng dẫn trước)
        ]
        
        report = {}
        conn = self._get_connection()
        
        try:
            for table in target_tables:
                try:
                    # 1. Lấy thông tin cột (Field, Type, Null, Key, etc.)
                    # DESCRIBE là lệnh chuẩn trong MySQL
                    desc_query = f"DESCRIBE {table}"
                    df_desc = pd.read_sql(desc_query, conn)
                    
                    # 2. Lấy 2 dòng dữ liệu mẫu để xem format (ví dụ format thời gian, string...)
                    sample_query = f"SELECT * FROM {table} LIMIT 2"
                    df_sample = pd.read_sql(sample_query, conn)
                    
                    # Convert các kiểu dữ liệu đặc biệt (datetime, decimal) sang string để dễ đọc JSON
                    report[table] = {
                        "columns": df_desc[['Field', 'Type']].to_dict('records'),
                        "sample_data": df_sample.astype(str).to_dict('records') 
                    }
                except Exception as table_err:
                    report[table] = f"Error or Table not found: {str(table_err)}"
                    
            return report

        except Exception as e:
            return {"error": f"Critical error in schema debug: {str(e)}"}
        finally:
            if conn:
                conn.close()
    
    def get_metadata(self):
        return {
            'name': 'Schema Debugger',
            'description': 'Returns table schema and sample rows',
            'parameters': {}
        }