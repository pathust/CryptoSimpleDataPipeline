/**
 * Price Distribution chart component.
 * Shows distribution of closing prices over time.
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { ChartProps } from '@/types/charts';

interface PriceDistributionDataPoint {
    price_min: number;
    price_max: number;
    price_center: number;
    count: number;
    percentage: number;
}

interface PriceDistributionData {
    histogram: PriceDistributionDataPoint[];
    statistics: {
        mean: number;
        median: number;
        std_dev: number;
        min: number;
        max: number;
        range: number;
    };
}

export function PriceDistributionChart({ data }: ChartProps) {
    if (!data) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                No price distribution data available
            </div>
        );
    }

    // Handle both old format (array) and new format (object with histogram)
    const distributionData = (data as any).histogram || data;
    const statistics = (data as any).statistics;

    if (!distributionData || !Array.isArray(distributionData) || distributionData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                No price distribution data available
            </div>
        );
    }

    const chartData = (distributionData as PriceDistributionDataPoint[]).map((item) => ({
        ...item,
        price: item.price_center,
    }));

    // Find max count for color scaling
    const maxCount = Math.max(...chartData.map(d => d.count));

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as PriceDistributionDataPoint;
            return (
                <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-popover-foreground mb-2">
                        Price Range: ${data.price_min.toLocaleString()} - ${data.price_max.toLocaleString()}
                    </p>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Center:</span>
                            <span className="font-medium">${data.price_center.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Count:</span>
                            <span className="font-medium">{data.count}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Percentage:</span>
                            <span className="font-medium">{data.percentage.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-2">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                        dataKey="price"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Mean line - no label, color only */}
                    {statistics && (
                        <ReferenceLine 
                            x={statistics.mean} 
                            stroke="#3b82f6" 
                            strokeDasharray="3 3"
                        />
                    )}
                    {/* Median line - no label, color only */}
                    {statistics && (
                        <ReferenceLine 
                            x={statistics.median} 
                            stroke="#10b981" 
                            strokeDasharray="3 3"
                        />
                    )}
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => {
                            // Color intensity based on count
                            const intensity = entry.count / maxCount;
                            const color = `hsl(142, 71%, ${60 - intensity * 30}%)`; // Green gradient
                            return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Statistics for Market State */}
            {statistics && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted rounded">
                        <div className="text-muted-foreground">Mean</div>
                        <div className="font-semibold">${statistics.mean.toLocaleString()}</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                        <div className="text-muted-foreground">Median</div>
                        <div className="font-semibold">${statistics.median.toLocaleString()}</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                        <div className="text-muted-foreground">Std Dev</div>
                        <div className="font-semibold">${statistics.std_dev.toLocaleString()}</div>
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="flex items-center justify-center text-xs text-muted-foreground">
                <span>Market State Analysis - Distribution of closing prices</span>
            </div>
        </div>
    );
}
