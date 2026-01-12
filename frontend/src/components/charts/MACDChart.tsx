import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { formatChartTime } from '@/utils/timeFormat';

interface MACDDataPoint {
    time: string;
    macd: number;
    signal: number;
    histogram: number;
}

interface ChartProps {
    data: MACDDataPoint[];
}

export function MACDChart({ data }: ChartProps) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] bg-[#0B0E11] text-gray-500 border border-[#1E2329] rounded-lg">
                No MACD data available
            </div>
        );
    }

    // Format time to match candlestick chart (lightweight-charts)
    const chartData = data.map((item: MACDDataPoint) => ({
        time: formatChartTime(item.time), // HH:MM format, matches candlestick chart
        macd: item.macd,
        signal: item.signal,
        histogram: item.histogram,
    }));

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0B0E11] border border-[#2B3139] rounded-md p-3 shadow-xl">
                    <p className="text-gray-400 text-xs mb-2">{payload[0].payload.time}</p>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-gray-400">MACD:</span>
                            <span className="text-xs font-medium text-[#F0B90B]">
                                {payload.find((p: any) => p.dataKey === 'macd')?.value.toFixed(5)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-gray-400">Signal:</span>
                            <span className="text-xs font-medium text-[#B376F7]">
                                {payload.find((p: any) => p.dataKey === 'signal')?.value.toFixed(5)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-gray-400">Histogram:</span>
                            <span className={`text-xs font-medium ${
                                payload.find((p: any) => p.dataKey === 'histogram')?.value >= 0 
                                    ? 'text-[#0ECB81]' 
                                    : 'text-[#F6465D]'
                            }`}>
                                {payload.find((p: any) => p.dataKey === 'histogram')?.value.toFixed(5)}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full bg-[#0B0E11] rounded-lg border border-[#1E2329] p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-200">MACD</h3>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#F0B90B]"></div>
                        <span className="text-gray-400">MACD(12,26)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#B376F7]"></div>
                        <span className="text-gray-400">Signal(9)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm bg-[#0ECB81] opacity-60"></div>
                        <span className="text-gray-400">Histogram</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="macdGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F0B90B" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#F0B90B" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    
                    <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#1E2329" 
                        vertical={false}
                        opacity={0.5}
                    />
                    
                    <XAxis
                        dataKey="time"
                        stroke="#474D57"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#1E2329' }}
                        minTickGap={40}
                        tick={{ fill: '#848E9C' }}
                    />
                    
                    <YAxis
                        stroke="#474D57"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#1E2329' }}
                        tick={{ fill: '#848E9C' }}
                        tickFormatter={(value) => value.toFixed(3)}
                        width={65}
                    />
                    
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#474D57', strokeWidth: 1 }} />

                    {/* Zero reference line */}
                    <ReferenceLine y={0} stroke="#2B3139" strokeWidth={1.5} />

                    {/* Histogram bars with dynamic coloring */}
                    <Bar dataKey="histogram" radius={[2, 2, 0, 0]} maxBarSize={8}>
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.histogram >= 0 ? '#0ECB81' : '#F6465D'} 
                                opacity={0.7}
                            />
                        ))}
                    </Bar>

                    {/* MACD line - Gold/Yellow */}
                    <Line
                        type="monotone"
                        dataKey="macd"
                        stroke="#F0B90B"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#F0B90B', stroke: '#0B0E11', strokeWidth: 2 }}
                    />

                    {/* Signal line - Purple */}
                    <Line
                        type="monotone"
                        dataKey="signal"
                        stroke="#B376F7"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#B376F7', stroke: '#0B0E11', strokeWidth: 2 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>

            {/* Footer info */}
            <div className="mt-3 pt-3 border-t border-[#1E2329] flex items-center justify-between text-xs text-gray-500">
                <span>Fast: 12 | Slow: 26 | Signal: 9</span>
                <span>Timeframe: 1m</span>
            </div>
        </div>
    );
}