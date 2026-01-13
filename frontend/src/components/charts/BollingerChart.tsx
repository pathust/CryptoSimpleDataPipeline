import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { ChartProps } from '@/types/charts';
import { formatChartTime } from '@/utils/timeFormat';

// Cấu hình màu (Giữ nguyên theme tối)
const THEME = {
  bg: '#161A25',
  grid: '#2B2F36',
  textMain: '#EAECEF',
  textSub: '#848E9C',
  brand: '#F0B90B',
  purple: '#B966F2',
};

interface BollingerDataPoint {
  time: string;
  upper: number;
  middle: number;
  lower: number;
  price: number;
}


// Chart Component
// ------------------------------------------------------------------
export function BollingerChart({ data, params = {} }: ChartProps) {
  const period = params.period ?? 20;
  const stdDev = params.std_dev ?? 2;

  // Custom Tooltip (defined inside to access period)
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1E2329] border border-[#474D57] rounded p-3 shadow-xl text-xs min-w-[160px]">
          <p className="text-[#848E9C] mb-2 font-medium">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry, index) => {
              let displayName = entry.name;
              let displayColor = entry.color;

              if (entry.dataKey === 'price') {
                displayName = 'Price';
                displayColor = THEME.textMain;
              } else if (entry.dataKey === 'upper') {
                displayName = 'Upper Band';
                displayColor = THEME.brand;
              } else if (entry.dataKey === 'lower') {
                displayName = 'Lower Band';
                displayColor = THEME.brand;
              } else if (entry.dataKey === 'middle') {
                displayName = `SMA (${period})`;
                displayColor = THEME.purple;
              }

              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: displayColor }} />
                    <span style={{ color: '#848E9C' }}>{displayName}</span>
                  </div>
                  <span className="font-mono font-medium" style={{ color: displayColor }}>
                    {entry.value?.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-[#161A25] text-[#848E9C] border border-[#2B2F36] rounded-lg">
        No Bollinger Bands data available
      </div>
    );
  }

  // Format time to match candlestick chart (lightweight-charts)
  const chartData = data.map((item: BollingerDataPoint) => ({
    time: formatChartTime(item.time), // HH:MM format, matches candlestick chart
    upper: item.upper,
    middle: item.middle,
    lower: item.lower,
    price: item.price,
  }));

  const allValues = data.flatMap((d) => [d.upper, d.lower, d.price]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const domainPadding = (maxVal - minVal) * 0.1;

  return (
    <div className="w-full bg-[#161A25] rounded-lg border border-[#2B2F36] p-4">
      <div className="flex items-center gap-2 mb-4 text-xs font-medium">
        <span style={{ color: THEME.textMain }}>Bollinger Bands ({period}, {stdDev})</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={THEME.brand} stopOpacity={0.2} />
              <stop offset="95%" stopColor={THEME.brand} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />

          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            minTickGap={30}
            tick={{ fill: THEME.textSub, fontSize: 11 }}
            dy={10}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toFixed(2)}
            domain={[minVal - domainPadding, maxVal + domainPadding]}
            orientation="right"
            tick={{ fill: THEME.textSub, fontSize: 11 }}
            width={50}
          />

          {/* SỬ DỤNG CUSTOM TOOLTIP TẠI ĐÂY */}
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: THEME.textSub, strokeDasharray: '3 3', strokeOpacity: 0.5 }}
          />

          {/* Các thành phần vẽ biểu đồ (Layers) */}
          {/* Lớp nền Gradient */}
          <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGradient)" animationDuration={300} />

          {/* Lớp che (Mask) để tạo vùng giữa Upper và Lower */}
          <Area type="monotone" dataKey="lower" stroke="none" fill={THEME.bg} fillOpacity={1} animationDuration={300} />

          {/* Các đường chỉ báo */}
          <Line type="monotone" dataKey="upper" stroke={THEME.brand} strokeWidth={1} dot={false} strokeOpacity={0.5} strokeDasharray="3 3" animationDuration={300} />
          <Line type="monotone" dataKey="lower" stroke={THEME.brand} strokeWidth={1} dot={false} strokeOpacity={0.5} strokeDasharray="3 3" animationDuration={300} />
          <Line type="monotone" dataKey="middle" stroke={THEME.purple} strokeWidth={1.5} dot={false} strokeOpacity={0.8} animationDuration={300} />

          {/* Đường giá (Vẽ cuối cùng để đè lên trên) */}
          <Line type="monotone" dataKey="price" stroke={THEME.textMain} strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}