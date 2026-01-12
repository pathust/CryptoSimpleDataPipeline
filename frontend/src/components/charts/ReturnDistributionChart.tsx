/**
 * Return Distribution chart component.
 * Shows distribution of price returns (percentage changes) over time.
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { ChartProps } from '@/types/charts';

interface ReturnDistributionDataPoint {
    return_min: number;
    return_max: number;
    return_center: number;
    count: number;
    percentage: number;
}

interface RiskMetrics {
    mean: number;
    std_dev: number;
    min: number;
    max: number;
    skewness: number;
    kurtosis: number;
    percentiles: {
        p5: number;
        p25: number;
        p50: number;
        p75: number;
        p95: number;
    };
}

interface ReturnDistributionData {
    histogram: ReturnDistributionDataPoint[];
    risk_metrics: RiskMetrics;
}

export function ReturnDistributionChart({ data }: ChartProps) {
    if (!data) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                No return distribution data available
            </div>
        );
    }

    // Handle both old format (array) and new format (object with histogram)
    const distributionData = (data as any).histogram || data;
    const riskMetrics = (data as any).risk_metrics;

    if (!distributionData || !Array.isArray(distributionData) || distributionData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                No return distribution data available
            </div>
        );
    }

    const chartData = (distributionData as ReturnDistributionDataPoint[]).map((item) => ({
        ...item,
        return_pct: item.return_center,
    }));

    // Find max count for color scaling
    const maxCount = Math.max(...chartData.map(d => d.count));

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as ReturnDistributionDataPoint;
            return (
                <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-popover-foreground mb-2">
                        Return Range: {data.return_min.toFixed(4)}% - {data.return_max.toFixed(4)}%
                    </p>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Center:</span>
                            <span className={`font-medium ${data.return_center >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {data.return_center >= 0 ? '+' : ''}{data.return_center.toFixed(4)}%
                            </span>
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
                        dataKey="return_pct"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                        tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`}
                    />
                    <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Zero line */}
                    <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    {/* Mean return line - no label, color only */}
                    {riskMetrics && (
                        <ReferenceLine 
                            x={riskMetrics.mean} 
                            stroke="#3b82f6" 
                            strokeDasharray="3 3"
                        />
                    )}
                    {/* ±1 Std Dev lines - no labels, color only */}
                    {riskMetrics && (
                        <>
                            <ReferenceLine 
                                x={riskMetrics.mean + riskMetrics.std_dev} 
                                stroke="#8b5cf6" 
                                strokeDasharray="2 2"
                            />
                            <ReferenceLine 
                                x={riskMetrics.mean - riskMetrics.std_dev} 
                                stroke="#8b5cf6" 
                                strokeDasharray="2 2"
                            />
                        </>
                    )}
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => {
                            // Color based on positive/negative return
                            const intensity = entry.count / maxCount;
                            const isPositive = entry.return_center >= 0;
                            const color = isPositive
                                ? `hsl(142, 71%, ${60 - intensity * 30}%)` // Green for positive
                                : `hsl(0, 84%, ${60 - intensity * 30}%)`; // Red for negative
                            return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Risk Metrics */}
            {riskMetrics && (
                <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted rounded">
                        <div className="text-muted-foreground">Mean</div>
                        <div className={`font-semibold ${riskMetrics.mean >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {riskMetrics.mean >= 0 ? '+' : ''}{riskMetrics.mean.toFixed(4)}%
                        </div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                        <div className="text-muted-foreground">Std Dev</div>
                        <div className="font-semibold">{riskMetrics.std_dev.toFixed(4)}%</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                        <div className="text-muted-foreground">Skewness</div>
                        <div className="font-semibold">{riskMetrics.skewness.toFixed(2)}</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                        <div className="text-muted-foreground">Kurtosis</div>
                        <div className="font-semibold">{riskMetrics.kurtosis.toFixed(2)}</div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-2 rounded bg-green-500" />
                    <span>Positive Returns</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-2 rounded bg-red-500" />
                    <span>Negative Returns</span>
                </div>
            </div>
        </div>
    );
}
