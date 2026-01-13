# 📊 Hướng Dẫn Chi Tiết Về Các Biểu Đồ

Tài liệu này mô tả chi tiết tất cả các biểu đồ có sẵn trong hệ thống Crypto Analytics Platform, cách sử dụng và cách diễn giải chúng.

## 📑 Mục Lục

1. [Biểu Đồ Nến (Candlestick Chart)](#1-biểu-đồ-nến-candlestick-chart)
2. [Biểu Đồ Khối Lượng (Volume Chart)](#2-biểu-đồ-khối-lượng-volume-chart)
3. [RSI - Relative Strength Index](#3-rsi---relative-strength-index)
4. [MACD - Moving Average Convergence Divergence](#4-macd---moving-average-convergence-divergence)
5. [Bollinger Bands](#5-bollinger-bands)
6. [ATR - Average True Range](#6-atr---average-true-range)
7. [Order Book Depth](#7-order-book-depth)
8. [Price Correlation](#8-price-correlation)
9. [Volume Profile](#9-volume-profile)
10. [Return Distribution](#10-return-distribution)

---

## 1. Biểu Đồ Nến (Candlestick Chart)

### Mô Tả
Biểu đồ nến là biểu đồ chính để hiển thị giá của cryptocurrency theo thời gian. Nó hiển thị đầy đủ thông tin OHLCV (Open, High, Low, Close, Volume) và các đường trung bình động (Moving Averages).

### Tính Năng
- **Nến xanh (#0ECB81)**: Giá đóng cửa cao hơn giá mở cửa (tăng giá)
- **Nến đỏ (#F6465D)**: Giá đóng cửa thấp hơn giá mở cửa (giảm giá)
- **Volume**: Hiển thị khối lượng giao dịch dưới dạng histogram màu xanh/đỏ tương ứng với xu hướng giá
- **Moving Averages**: 
  - MA(7) - Vàng (#F0B90B): Trung bình động ngắn hạn
  - MA(25) - Tím (#C026D3): Trung bình động trung hạn
  - MA(99) - Xanh dương (#3B82F6): Trung bình động dài hạn

### Cách Đọc
- **Nến dài**: Biến động giá lớn trong khoảng thời gian đó
- **Bóng trên dài**: Áp lực bán mạnh, giá bị đẩy xuống từ mức cao
- **Bóng dưới dài**: Áp lực mua mạnh, giá được đẩy lên từ mức thấp
- **Giá vượt trên MA**: Xu hướng tăng
- **Giá dưới MA**: Xu hướng giảm
- **Volume cao**: Xác nhận xu hướng giá

### Thông Tin Hiển Thị
- **Legend**: Hiển thị Open, High, Low, Close, Change %, giá trị MA và Volume khi di chuột
- **Refresh Interval**: 15 giây
- **Default Params**: `limit: 200` (200 nến gần nhất)

### Ứng Dụng
- Phân tích xu hướng giá ngắn hạn và dài hạn
- Xác định điểm vào/ra
- Phân tích áp lực mua/bán
- Xác nhận tín hiệu từ các chỉ báo khác

---

## 2. Biểu Đồ Khối Lượng (Volume Chart)

### Mô Tả
Biểu đồ khối lượng hiển thị khối lượng giao dịch theo thời gian, giúp xác nhận xu hướng giá và phát hiện các điểm bất thường trong giao dịch.

### Tính Năng
- **Thanh xanh**: Khối lượng giao dịch khi giá tăng
- **Thanh đỏ**: Khối lượng giao dịch khi giá giảm
- **Format thông minh**: Tự động chuyển đổi đơn vị (K, M) cho số lớn

### Cách Đọc
- **Volume tăng + Giá tăng**: Xác nhận xu hướng tăng mạnh
- **Volume tăng + Giá giảm**: Xác nhận xu hướng giảm mạnh
- **Volume giảm**: Thị trường thiếu thanh khoản, có thể đảo chiều
- **Volume cao bất thường**: Có thể là điểm đảo chiều hoặc breakout

### Thông Tin Hiển Thị
- **Refresh Interval**: 15 giây
- **Default Params**: `limit: 200`

### Ứng Dụng
- Xác nhận xu hướng giá
- Phát hiện điểm breakout
- Phân tích thanh khoản thị trường
- Kết hợp với các chỉ báo khác để đưa ra quyết định

---

## 3. RSI - Relative Strength Index

### Mô Tả
RSI là chỉ báo động lượng đo lường tốc độ và độ lớn của biến động giá. RSI dao động từ 0 đến 100.

### Công Thức
RSI = 100 - (100 / (1 + RS))
- RS = Trung bình tăng / Trung bình giảm trong khoảng thời gian (mặc định 14)

### Tính Năng
- **Đường RSI**: Màu chủ đạo của theme
- **Vùng quá mua (Overbought)**: Đường đứt nét màu đỏ tại mức 70
- **Vùng quá bán (Oversold)**: Đường đứt nét màu xanh tại mức 30

### Cách Đọc
- **RSI > 70**: Thị trường quá mua, có thể điều chỉnh giảm
- **RSI < 30**: Thị trường quá bán, có thể phục hồi tăng
- **RSI = 50**: Trung tính, không có xu hướng rõ ràng
- **RSI tăng**: Động lượng tăng giá đang mạnh
- **RSI giảm**: Động lượng giảm giá đang mạnh

### Tín Hiệu Giao Dịch
- **Mua**: RSI vượt lên trên 30 từ vùng quá bán
- **Bán**: RSI giảm xuống dưới 70 từ vùng quá mua
- **Phân kỳ**: RSI tăng nhưng giá giảm (hoặc ngược lại) - tín hiệu đảo chiều mạnh

### Thông Tin Hiển Thị
- **Period**: 14 (mặc định)
- **Refresh Interval**: 15 giây
- **Default Params**: `period: 14, limit: 200`

### Ứng Dụng
- Xác định điểm vào/ra
- Phát hiện phân kỳ giá
- Đo lường động lượng thị trường
- Kết hợp với các chỉ báo khác để xác nhận tín hiệu

---

## 4. MACD - Moving Average Convergence Divergence

### Mô Tả
MACD là chỉ báo động lượng theo xu hướng, đo lường mối quan hệ giữa hai đường trung bình động của giá. MACD bao gồm 3 thành phần: MACD line, Signal line và Histogram.

### Công Thức
- **MACD Line**: EMA(12) - EMA(26)
- **Signal Line**: EMA(9) của MACD Line
- **Histogram**: MACD Line - Signal Line

### Tính Năng
- **MACD Line**: Đường vàng (#F0B90B) - EMA(12) - EMA(26)
- **Signal Line**: Đường tím (#B376F7) - EMA(9) của MACD
- **Histogram**: Cột xanh (dương) hoặc đỏ (âm) - Chênh lệch giữa MACD và Signal

### Cách Đọc
- **MACD cắt Signal từ dưới lên**: Tín hiệu mua (bullish crossover)
- **MACD cắt Signal từ trên xuống**: Tín hiệu bán (bearish crossover)
- **Histogram dương và tăng**: Động lượng tăng đang mạnh
- **Histogram âm và giảm**: Động lượng giảm đang mạnh
- **MACD trên đường 0**: Xu hướng tăng
- **MACD dưới đường 0**: Xu hướng giảm

### Tín Hiệu Giao Dịch
- **Mua**: MACD cắt Signal từ dưới lên, Histogram chuyển từ âm sang dương
- **Bán**: MACD cắt Signal từ trên xuống, Histogram chuyển từ dương sang âm
- **Phân kỳ**: MACD tạo đỉnh mới nhưng giá không tạo đỉnh mới - tín hiệu yếu

### Thông Tin Hiển Thị
- **Fast Period**: 12
- **Slow Period**: 26
- **Signal Period**: 9
- **Refresh Interval**: 15 giây
- **Default Params**: `fast_period: 12, slow_period: 26, signal_period: 9, limit: 200`

### Ứng Dụng
- Xác định xu hướng và động lượng
- Tìm điểm vào/ra
- Phát hiện phân kỳ
- Kết hợp với RSI và các chỉ báo khác

---

## 5. Bollinger Bands

### Mô Tả
Bollinger Bands là chỉ báo biến động giá, bao gồm một đường trung bình động (SMA) và hai dải trên/dưới dựa trên độ lệch chuẩn.

### Công Thức
- **Middle Band**: SMA(20)
- **Upper Band**: SMA(20) + (2 × Standard Deviation)
- **Lower Band**: SMA(20) - (2 × Standard Deviation)

### Tính Năng
- **Upper Band**: Dải trên màu vàng (#F0B90B) - Đường đứt nét
- **Lower Band**: Dải dưới màu vàng (#F0B90B) - Đường đứt nét
- **Middle Band**: SMA(20) màu tím (#B966F2) - Đường liền
- **Price Line**: Đường giá màu trắng (#EAECEF)
- **Vùng giữa**: Gradient màu vàng nhạt

### Cách Đọc
- **Giá chạm Upper Band**: Có thể quá mua, chuẩn bị điều chỉnh
- **Giá chạm Lower Band**: Có thể quá bán, chuẩn bị phục hồi
- **Dải mở rộng**: Biến động cao, có thể có breakout
- **Dải thu hẹp**: Biến động thấp, chuẩn bị có biến động lớn (squeeze)
- **Giá bật từ Lower Band**: Tín hiệu mua tiềm năng
- **Giá bật từ Upper Band**: Tín hiệu bán tiềm năng

### Tín Hiệu Giao Dịch
- **Mua**: Giá chạm Lower Band và bật lên, kèm theo volume tăng
- **Bán**: Giá chạm Upper Band và bật xuống, kèm theo volume tăng
- **Breakout**: Giá vượt ra khỏi dải, kèm theo volume cao

### Thông Tin Hiển Thị
- **Period**: 20
- **Standard Deviation**: 2
- **Refresh Interval**: 15 giây
- **Default Params**: `period: 20, std_dev: 2, limit: 200`

### Ứng Dụng
- Đo lường biến động giá
- Xác định điểm vào/ra
- Phát hiện breakout
- Phân tích độ căng của thị trường

---

## 6. ATR - Average True Range

### Mô Tả
ATR đo lường biến động giá trung bình trong một khoảng thời gian, không chỉ ra hướng giá mà chỉ đo độ lớn của biến động.

### Công Thức
True Range = Max(High - Low, |High - Previous Close|, |Low - Previous Close|)
ATR = Trung bình của True Range trong N kỳ (mặc định 14)

### Tính Năng
- **Đường ATR**: Đường màu chủ đạo của theme
- **Giá trị cao**: Biến động lớn
- **Giá trị thấp**: Biến động nhỏ

### Cách Đọc
- **ATR tăng**: Biến động đang tăng, thị trường không chắc chắn
- **ATR giảm**: Biến động đang giảm, thị trường ổn định
- **ATR cao**: Nên đặt stop-loss rộng hơn
- **ATR thấp**: Có thể đặt stop-loss chặt hơn

### Ứng Dụng
- **Đặt Stop-Loss**: ATR × 2 hoặc ATR × 3
- **Đặt Take-Profit**: ATR × 1.5 hoặc ATR × 2
- **Đo lường rủi ro**: ATR cao = rủi ro cao
- **Xác định breakout**: ATR tăng đột ngột có thể là breakout

### Thông Tin Hiển Thị
- **Period**: 14 (mặc định)
- **Refresh Interval**: 15 giây
- **Default Params**: `period: 14, limit: 200`

### Ứng Dụng
- Quản lý rủi ro
- Đặt stop-loss và take-profit
- Đo lường biến động thị trường
- Xác định điểm vào/ra dựa trên biến động

---

## 7. Order Book Depth

### Mô Tả
Biểu đồ Order Book Depth hiển thị độ sâu thị trường, thể hiện khối lượng mua (bids) và bán (asks) tại các mức giá khác nhau.

### Tính Năng
- **Bids (Mua)**: Vùng màu xanh (#0ECB81) - Gradient từ trên xuống
- **Asks (Bán)**: Vùng màu đỏ (#F6465D) - Gradient từ trên xuống
- **Mid Price**: Đường vàng (#F0B90B) đứt nét - Giá trung bình giữa bid và ask tốt nhất
- **Spread**: Chênh lệch giữa giá bid tốt nhất và ask tốt nhất

### Cách Đọc
- **Bids dày**: Nhiều lệnh mua, hỗ trợ giá mạnh
- **Asks dày**: Nhiều lệnh bán, kháng cự giá mạnh
- **Spread nhỏ**: Thanh khoản tốt, thị trường sôi động
- **Spread lớn**: Thanh khoản kém, thị trường yên tĩnh
- **Imbalance**: Bids nhiều hơn Asks (hoặc ngược lại) - có thể đẩy giá

### Metrics Hiển Thị
- **Mid Price**: Giá trung bình giữa bid và ask tốt nhất
- **Spread**: Chênh lệch giá tuyệt đối và phần trăm
- **Bid Volume**: Tổng khối lượng lệnh mua
- **Ask Volume**: Tổng khối lượng lệnh bán
- **Best Bid**: Giá mua tốt nhất
- **Best Ask**: Giá bán tốt nhất

### Ứng Dụng
- Phân tích thanh khoản thị trường
- Xác định hỗ trợ và kháng cự
- Phát hiện áp lực mua/bán
- Đánh giá độ sâu thị trường

### Thông Tin Hiển Thị
- **Refresh Interval**: 10 giây (real-time)
- **Data Provider**: `orderbook`

---

## 8. Price Correlation

### Mô Tả
Biểu đồ tương quan giá hiển thị mức độ tương quan giữa đồng coin chính với hai đồng coin khác trong cùng khoảng thời gian.

### Công Thức
Correlation = Covariance(Coin1, Coin2) / (StdDev(Coin1) × StdDev(Coin2))
- Giá trị từ -1 đến +1

### Tính Năng
- **Correlation Line 1**: Đường xanh dương (#3b82f6) - Tương quan với coin 1
- **Correlation Line 2**: Đường cam (#f97316) - Tương quan với coin 2
- **Trục Y**: Từ -1 đến +1

### Cách Đọc
- **Correlation = +1**: Hoàn toàn tương quan dương (cùng chiều)
- **Correlation = -1**: Hoàn toàn tương quan âm (ngược chiều)
- **Correlation = 0**: Không có tương quan
- **Correlation > 0.7**: Tương quan mạnh, cùng xu hướng
- **Correlation < -0.7**: Tương quan nghịch mạnh, ngược xu hướng

### Ứng Dụng
- **Diversification**: Chọn các coin có tương quan thấp để đa dạng hóa
- **Pairs Trading**: Tìm các cặp coin có tương quan cao để giao dịch chênh lệch
- **Market Analysis**: Hiểu mối quan hệ giữa các coin
- **Risk Management**: Đánh giá rủi ro danh mục

### Thông Tin Hiển Thị
- **Window**: 20 (số kỳ tính tương quan)
- **Interval**: 1m (1 phút)
- **Refresh Interval**: 15 giây
- **Default Params**: `window: 20, limit: 200, interval: '1m'`

### Ứng Dụng
- Phân tích danh mục đầu tư
- Tìm cơ hội pairs trading
- Đánh giá rủi ro
- Hiểu động lực thị trường

---

## 9. Volume Profile

### Mô Tả
Volume Profile phân tích phân bố khối lượng giao dịch theo các mức giá, giúp xác định các vùng hỗ trợ và kháng cự quan trọng.

### Tính Năng
- **Histogram ngang**: Khối lượng tại mỗi mức giá
- **POC (Point of Control)**: Mức giá có khối lượng giao dịch cao nhất - Đường vàng (#f59e0b) đứt nét
- **Value Area**: Vùng giá trị (70% khối lượng) - Đường xanh lá (#10b981) đứt nét
- **Color Coding**:
  - Vàng: POC
  - Xanh lá: Value Area
  - Xanh dương: Các mức giá khác

### Cách Đọc
- **POC**: Mức giá quan trọng nhất, thường là hỗ trợ/kháng cự mạnh
- **Value Area High**: Kháng cự tiềm năng
- **Value Area Low**: Hỗ trợ tiềm năng
- **Vùng dày**: Nhiều giao dịch, hỗ trợ/kháng cự mạnh
- **Vùng mỏng**: Ít giao dịch, dễ breakout

### Tín Hiệu Giao Dịch
- **Mua**: Giá chạm Value Area Low hoặc POC và bật lên
- **Bán**: Giá chạm Value Area High hoặc POC và bật xuống
- **Breakout**: Giá vượt ra khỏi Value Area với volume cao

### Metrics Hiển Thị
- **POC**: Mức giá có khối lượng cao nhất
- **VA Low**: Giá thấp nhất của Value Area
- **VA High**: Giá cao nhất của Value Area

### Thông Tin Hiển Thị
- **Bins**: 20 (số mức giá phân tích)
- **Refresh Interval**: 30 giây
- **Default Params**: `bins: 20, limit: 200`

### Ứng Dụng
- Xác định hỗ trợ và kháng cự
- Tìm điểm vào/ra
- Phân tích cấu trúc thị trường
- Đánh giá thanh khoản tại các mức giá

---

## 10. Return Distribution

### Mô Tả
Biểu đồ phân bố lợi nhuận hiển thị phân phối của các thay đổi giá (phần trăm) theo thời gian, giúp phân tích rủi ro và đặc điểm thống kê của giá.

### Tính Năng
- **Histogram**: Phân bố tần suất của các mức lợi nhuận
- **Màu xanh lá**: Lợi nhuận dương (tăng giá)
- **Màu đỏ**: Lợi nhuận âm (giảm giá)
- **Mean Line**: Đường xanh dương (#3b82f6) - Lợi nhuận trung bình
- **±1 Std Dev**: Đường tím (#8b5cf6) - Độ lệch chuẩn

### Cách Đọc
- **Phân bố chuẩn**: Hình chuông đối xứng - Thị trường ổn định
- **Lệch phải (Skewness > 0)**: Nhiều lợi nhuận dương nhỏ, một số lợi nhuận âm lớn
- **Lệch trái (Skewness < 0)**: Nhiều lợi nhuận âm nhỏ, một số lợi nhuận dương lớn
- **Kurtosis cao**: Nhiều biến động cực đoan (fat tails)
- **Kurtosis thấp**: Ít biến động cực đoan

### Risk Metrics
- **Mean**: Lợi nhuận trung bình
- **Std Dev**: Độ lệch chuẩn (rủi ro)
- **Skewness**: Độ lệch phân phối
- **Kurtosis**: Độ nhọn phân phối
- **Percentiles**: P5, P25, P50 (median), P75, P95

### Ứng Dụng
- **Risk Assessment**: Đánh giá rủi ro của tài sản
- **Portfolio Optimization**: Tối ưu hóa danh mục đầu tư
- **VaR Calculation**: Tính toán Value at Risk
- **Strategy Backtesting**: Kiểm tra chiến lược giao dịch

### Thông Tin Hiển Thị
- **Bins**: 30 (số nhóm phân tích)
- **Refresh Interval**: 30 giây
- **Default Params**: `bins: 30, limit: 200`

### Ứng Dụng
- Phân tích rủi ro
- Đánh giá hiệu suất
- Tối ưu hóa danh mục
- Phát triển chiến lược giao dịch

---

## 🎯 Kết Hợp Các Chỉ Báo

### Chiến Lược Cơ Bản
1. **Xác nhận xu hướng**: Candlestick + Volume + Moving Averages
2. **Tìm điểm vào**: RSI + MACD + Bollinger Bands
3. **Quản lý rủi ro**: ATR + Return Distribution
4. **Phân tích thanh khoản**: Order Book + Volume Profile

### Ví Dụ Kết Hợp
- **Tín hiệu mua mạnh**: 
  - Giá trên MA(7) và MA(25)
  - RSI từ dưới 30 vượt lên
  - MACD cắt Signal từ dưới lên
  - Volume tăng
  - Giá chạm Lower Bollinger Band và bật lên

- **Tín hiệu bán mạnh**:
  - Giá dưới MA(7) và MA(25)
  - RSI từ trên 70 giảm xuống
  - MACD cắt Signal từ trên xuống
  - Volume tăng
  - Giá chạm Upper Bollinger Band và bật xuống

---

## 📝 Lưu Ý Quan Trọng

1. **Không có chỉ báo nào hoàn hảo**: Luôn kết hợp nhiều chỉ báo để xác nhận
2. **Phân tích đa khung thời gian**: Xem cả khung ngắn hạn và dài hạn
3. **Quản lý rủi ro**: Luôn đặt stop-loss và take-profit
4. **Backtesting**: Kiểm tra chiến lược trên dữ liệu lịch sử
5. **Cập nhật thường xuyên**: Dữ liệu được làm mới tự động, nhưng nên kiểm tra định kỳ

---

## 🔄 Refresh Intervals

| Biểu Đồ | Refresh Interval | Lý Do |
|---------|-----------------|-------|
| Candlestick | 15 giây | Dữ liệu giá chính |
| Volume | 15 giây | Đồng bộ với giá |
| RSI | 15 giây | Tính toán nhanh |
| MACD | 15 giây | Tính toán nhanh |
| Bollinger Bands | 15 giây | Tính toán nhanh |
| ATR | 15 giây | Tính toán nhanh |
| Order Book | 10 giây | Real-time data |
| Correlation | 15 giây | Tính toán tương quan |
| Volume Profile | 30 giây | Tính toán phức tạp |
| Return Distribution | 30 giây | Tính toán phức tạp |

---

## 📚 Tài Liệu Tham Khảo

- [Binance API Documentation](https://binance-docs.github.io/apidocs/spot/en/)
- [Technical Analysis Guide](https://www.investopedia.com/technical-analysis-4689657)
- [Lightweight Charts Documentation](https://tradingview.github.io/lightweight-charts/)

---

**Cập nhật lần cuối**: 2026-01-14
