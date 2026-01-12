/**
 * Correlation chart component - shows correlation between base coin and two comparison coins.
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartProps } from '@/types/charts';
import { formatChartTime, formatChartDateTime } from '@/utils/timeFormat';

interface CorrelationDataPoint {
    time: string;
    correlation1: number;
    correlation2: number;
    symbol1: string;
    symbol2: string;
}

export function CorrelationChart({ data }: ChartProps) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                No correlation data available
            </div>
        );
    }

    // Transform data for Recharts
    // Format time to match lightweight-charts (candlestick chart)
    // Backend sends UTC time with 'Z' suffix, browser automatically converts to local timezone
    const chartData = data.map((item: CorrelationDataPoint) => {
        const utcDate = new Date(item.time);
        
        return {
            time: formatChartTime(item.time), // Format as HH:MM (matches candlestick chart)
            fullTime: utcDate.toISOString(), // Keep full UTC time for reference
            localTime: formatChartDateTime(item.time), // Local timezone for tooltip
            correlation1: item.correlation1,
            correlation2: item.correlation2,
            symbol1: item.symbol1 || 'Coin 1',
            symbol2: item.symbol2 || 'Coin 2',
        };
    });

    // Get symbol names from first data point for legend
    const firstDataPoint = data[0] as CorrelationDataPoint;
    const symbol1Name = firstDataPoint?.symbol1 || 'Coin 1';
    const symbol2Name = firstDataPoint?.symbol2 || 'Coin 2';

    return (
        <div className="space-y-2">
            <ResponsiveContainer width="100%" height={300}>
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
                        domain={[-1, 1]}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Correlation', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        labelFormatter={(label, payload) => {
                            // Use localTime if available, otherwise format from fullTime
                            if (payload && payload[0] && payload[0].payload) {
                                if (payload[0].payload.localTime) {
                                    return payload[0].payload.localTime;
                                }
                                if (payload[0].payload.fullTime) {
                                    return formatChartDateTime(payload[0].payload.fullTime);
                                }
                            }
                            return label;
                        }}
                        formatter={(value: number, name: string) => [
                            value.toFixed(4),
                            name === 'correlation1' ? symbol1Name : symbol2Name
                        ]}
                    />
                    <Legend
                        formatter={(value) => {
                            if (value === 'correlation1') return symbol1Name;
                            if (value === 'correlation2') return symbol2Name;
                            return value;
                        }}
                    />

                    {/* First correlation line - Blue */}
                    <Line
                        type="monotone"
                        dataKey="correlation1"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={false}
                        name="correlation1"
                        activeDot={{ r: 4 }}
                    />

                    {/* Second correlation line - Orange */}
                    <Line
                        type="monotone"
                        dataKey="correlation2"
                        stroke="#f97316"
                        strokeWidth={3}
                        dot={false}
                        name="correlation2"
                        activeDot={{ r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-1 rounded" style={{ backgroundColor: '#3b82f6' }} />
                    <span className="font-medium">{symbol1Name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-1 rounded" style={{ backgroundColor: '#f97316' }} />
                    <span className="font-medium">{symbol2Name}</span>
                </div>
            </div>
        </div>
    );
}
