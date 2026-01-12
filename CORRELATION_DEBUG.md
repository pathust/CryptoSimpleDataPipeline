# Correlation Chart Debug Guide

## Vấn đề: "No correlation data available"

Nếu bạn thấy thông báo này trên frontend, có thể do các nguyên nhân sau:

### 1. Backend chưa được restart
Sau khi thêm correlation provider, bạn cần restart backend server:
```bash
# Stop backend nếu đang chạy (Ctrl+C)
# Sau đó start lại
python run_backend.py
# hoặc
python src/web/app.py
```

### 2. Kiểm tra API endpoint
Test API endpoint trực tiếp:
```bash
curl "http://localhost:5001/api/analytics/data/correlation/BTCUSDT?window=20&limit=50"
```

Nếu trả về mảng rỗng `[]`, kiểm tra:
- Database có đủ dữ liệu cho cả 3 symbols (BTCUSDT, ETHUSDT, BNBUSDT)?
- Có đủ timestamps chung giữa các symbols?

### 3. Kiểm tra logs backend
Backend sẽ in ra các thông báo debug như:
- `Correlation: No data found for symbols...`
- `Correlation: Missing symbols...`
- `Correlation: Not enough data points...`

Xem logs để xác định vấn đề cụ thể.

### 4. Kiểm tra database
Đảm bảo có dữ liệu trong bảng `fact_klines`:
```sql
SELECT COUNT(*) FROM fact_klines WHERE symbol IN ('BTCUSDT', 'ETHUSDT', 'BNBUSDT') AND interval_code = '1m';
```

Kiểm tra timestamps chung:
```sql
SELECT open_time, COUNT(DISTINCT symbol) as symbol_count
FROM fact_klines
WHERE symbol IN ('BTCUSDT', 'ETHUSDT', 'BNBUSDT') AND interval_code = '1m'
GROUP BY open_time
HAVING symbol_count = 3
ORDER BY open_time DESC
LIMIT 10;
```

### 5. Giảm window size
Nếu không đủ dữ liệu, thử giảm window size trong frontend:
- Mở Developer Tools → Network tab
- Xem request đến `/api/analytics/data/correlation/...`
- Thử thay đổi `window=10` thay vì `window=20`

### 6. Kiểm tra config
Đảm bảo `src/config.py` có đúng symbols:
```python
SYMBOLS_STR = os.getenv('SYMBOLS', 'BTCUSDT,ETHUSDT,BNBUSDT')
```
