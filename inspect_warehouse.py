import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import json

# 1. Load cấu hình môi trường giống như src/config.py
load_dotenv()

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '123456')
DB_NAME = os.getenv('DB_NAME', 'crypto_pipeline')

def inspect_database():
    print(f"--- Đang kết nối đến database: {DB_NAME} tại {DB_HOST} ---")
    
    # Tạo chuỗi kết nối (Sử dụng mysql-connector hoặc pymysql)
    # Cần cài đặt: pip install mysql-connector-python sqlalchemy
    db_connection_str = f'mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}'
    db_connection = create_engine(db_connection_str)

    try:
        with db_connection.connect() as conn:
            # 2. Lấy danh sách TẤT CẢ các bảng hiện có
            tables_query = text("SHOW TABLES")
            tables = pd.read_sql(tables_query, conn)
            
            if tables.empty:
                print("CẢNH BÁO: Không tìm thấy bảng nào trong database!")
                return

            table_list = tables.iloc[:, 0].tolist()
            print(f"Tìm thấy các bảng: {table_list}\n")

            full_report = {}

            # 3. Duyệt qua từng bảng để lấy Schema và Data mẫu
            for table in table_list:
                print(f"Đang kiểm tra bảng: {table}...")
                
                # Lấy cấu trúc bảng (Schema)
                try:
                    desc_df = pd.read_sql(text(f"DESCRIBE {table}"), conn)
                    schema_info = desc_df[['Field', 'Type']].to_dict('records')
                except Exception as e:
                    schema_info = f"Error reading schema: {str(e)}"

                # Lấy 3 dòng dữ liệu mẫu mới nhất (nếu có cột created_at hoặc id)
                try:
                    # Thử sort theo created_at hoặc id để lấy data mới nhất
                    if 'created_at' in desc_df['Field'].values:
                        query = f"SELECT * FROM {table} ORDER BY created_at DESC LIMIT 3"
                    elif 'id' in desc_df['Field'].values:
                        query = f"SELECT * FROM {table} ORDER BY id DESC LIMIT 3"
                    else:
                        query = f"SELECT * FROM {table} LIMIT 3"
                        
                    data_df = pd.read_sql(text(query), conn)
                    # Convert sang string để tránh lỗi datetime khi print JSON
                    sample_data = data_df.astype(str).to_dict('records')
                except Exception as e:
                    sample_data = f"Error reading data: {str(e)}"

                full_report[table] = {
                    "columns": schema_info,
                    "sample_data": sample_data
                }

            # 4. Xuất kết quả dưới dạng JSON
            print("\n" + "="*20 + " KẾT QUẢ JSON (HÃY COPY ĐOẠN DƯỚI ĐÂY) " + "="*20)
            print(json.dumps(full_report, indent=2, ensure_ascii=False))
            print("="*60)

    except Exception as e:
        print(f"\nLỖI KẾT NỐI HOẶC TRUY VẤN: {e}")
        print("Gợi ý: Hãy kiểm tra lại DB_USER, DB_PASSWORD trong file .env")

if __name__ == "__main__":
    inspect_database()