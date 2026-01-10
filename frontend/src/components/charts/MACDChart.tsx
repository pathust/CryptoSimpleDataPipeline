/**
 * MACD (Moving Average Convergence Divergence) chart component.
 */

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartProps } from '@/types/charts';

interface MACDDataPoint {
    time: string;
    macd: number;
    signal: number;
    histogram: number;
}

export function MACDChart({ data }: ChartProps) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                No MACD data available
            </div>
        );
    }

    // Transform data for Recharts
    const chartData = data.map((item: MACDDataPoint) => ({
        time: new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        macd: item.macd,
        signal: item.signal,
        histogram: item.histogram,
    }));

    return (
        <div className="space-y-2">
            <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                        dataKey="time"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value.toFixed(4)}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        formatter={(value: number, name: string) => {
                            const labels: Record<string, string> = {
                                macd: 'MACD',
                                signal: 'Signal',
                                histogram: 'Histogram',
                            };
                            return [value.toFixed(6), labels[name] || name];
                        }}
                    />

                    {/* Zero line */}
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />

                    {/* Histogram */}
                    <Bar
                        dataKey="histogram"
                        fill="hsl(var(--muted))"
                        opacity={0.5}
                        radius={[2, 2, 0, 0]}
                    />

                    {/* MACD line */}
                    <Line
                        type="monotone"
                        dataKey="macd"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                    />

                    {/* Signal line */}
                    <Line
                        type="monotone"
                        dataKey="signal"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                        dot={false}
                    />
                </ComposedChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-primary" />
                    <span>MACD</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-destructive" />
                    <span>Signal</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-1 bg-muted opacity-50" />
                    <span>Histogram</span>
                </div>
            </div>
        </div>
    );
}
