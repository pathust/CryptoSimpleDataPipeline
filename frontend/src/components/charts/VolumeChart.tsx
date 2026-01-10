/**
 * Volume chart component using Recharts.
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartProps } from '@/types/charts';

interface VolumeDataPoint {
    time: string;
    volume: number;
    price: number;
}

export function VolumeChart({ data }: ChartProps) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                No volume data available
            </div>
        );
    }

    // Transform data for Recharts
    const chartData = data.map((item: VolumeDataPoint) => ({
        time: new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        volume: item.volume,
        price: item.price,
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
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
                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    formatter={(value: number, name: string) => {
                        if (name === 'volume') {
                            return [value.toFixed(2), 'Volume'];
                        }
                        return [value.toFixed(2), 'Price'];
                    }}
                />
                <Bar
                    dataKey="volume"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
