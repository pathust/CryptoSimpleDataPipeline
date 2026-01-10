/**
 * Bollinger Bands chart component.
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ChartProps } from '@/types/charts';

interface BollingerDataPoint {
    time: string;
    upper: number;
    middle: number;
    lower: number;
    price: number;
}

export function BollingerChart({ data }: ChartProps) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                No Bollinger Bands data available
            </div>
        );
    }

    // Transform data for Recharts
    const chartData = data.map((item: BollingerDataPoint) => ({
        time: new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        upper: item.upper,
        middle: item.middle,
        lower: item.lower,
        price: item.price,
    }));

    return (
        <div className="space-y-2">
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                        </linearGradient>
                    </defs>
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
                        tickFormatter={(value) => value.toFixed(2)}
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
                                upper: 'Upper Band',
                                middle: 'Middle Band (SMA)',
                                lower: 'Lower Band',
                                price: 'Price',
                            };
                            return [value.toFixed(6), labels[name] || name];
                        }}
                    />

                    {/* Band area */}
                    <Area
                        type="monotone"
                        dataKey="upper"
                        stroke="none"
                        fill="url(#bandGradient)"
                        fillOpacity={1}
                    />
                    <Area
                        type="monotone"
                        dataKey="lower"
                        stroke="none"
                        fill="hsl(var(--background))"
                        fillOpacity={1}
                    />

                    {/* Upper band */}
                    <Line
                        type="monotone"
                        dataKey="upper"
                        stroke="hsl(var(--primary))"
                        strokeWidth={1.5}
                        dot={false}
                        strokeDasharray="5 5"
                    />

                    {/* Middle band (SMA) */}
                    < Line
                        type="monotone"
                        dataKey="middle"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={2}
                        dot={false}
                    />

                    {/* Lower band */}
                    <Line
                        type="monotone"
                        dataKey="lower"
                        stroke="hsl(var(--primary))"
                        strokeWidth={1.5}
                        dot={false}
                        strokeDasharray="5 5"
                    />

                    {/* Price */}
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        dot={false}
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 border-t-2 border-dashed border-primary" />
                    <span>Bands</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-muted-foreground" />
                    <span>SMA</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-chart-2" />
                    <span>Price</span>
                </div>
            </div>
        </div>
    );
}
