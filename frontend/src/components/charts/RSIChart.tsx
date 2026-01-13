/**
 * RSI (Relative Strength Index) chart component.
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartProps } from '@/types/charts';
import { formatChartTime } from '@/utils/timeFormat';

interface RSIDataPoint {
    time: string;
    rsi: number;
}

export function RSIChart({ data, params = {} }: ChartProps) {
    const period = params.period ?? 14;

    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                No RSI data available
            </div>
        );
    }

    // Format time to match candlestick chart (lightweight-charts)
    const chartData = data.map((item: RSIDataPoint) => ({
        time: formatChartTime(item.time), // HH:MM format, matches candlestick chart
        rsi: item.rsi,
    }));

    return (
        <div className="space-y-2">
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                        dataKey="time"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        domain={[0, 100]}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        formatter={(value: number) => [value.toFixed(2), `RSI(${period})`]}
                    />

                    {/* Overbought line */}
                    <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />

                    {/* Oversold line */}
                    <ReferenceLine y={30} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" />

                    <Line
                        type="monotone"
                        dataKey="rsi"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-destructive" />
                    <span>Overbought (70)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-chart-2" />
                    <span>Oversold (30)</span>
                </div>
                <div className="flex items-center gap-1">
                    <span>Period: {period}</span>
                </div>
            </div>
        </div>
    );
}
