/**
 * ATR (Average True Range) chart component.
 * ATR measures market volatility.
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartProps } from '@/types/charts';
import { formatChartTime } from '@/utils/timeFormat';

interface ATRDataPoint {
    time: string;
    atr: number;
}

export function ATRChart({ data, params = {} }: ChartProps) {
    const period = params.period ?? 14;

    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                No ATR data available
            </div>
        );
    }

    // Format time to match candlestick chart (lightweight-charts)
    const chartData = data.map((item: ATRDataPoint) => ({
        time: formatChartTime(item.time), // HH:MM format, matches candlestick chart
        atr: item.atr,
    }));

    return (
        <div className="space-y-2">
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                        dataKey="time"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: `ATR(${period})`, angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        formatter={(value: number) => [value.toFixed(4), `ATR(${period})`]}
                    />

                    <Line
                        type="monotone"
                        dataKey="atr"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Info */}
            <div className="flex items-center justify-center text-xs text-muted-foreground">
                <span>Average True Range (Period: {period}) - Measures market volatility</span>
            </div>
        </div>
    );
}
