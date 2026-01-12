/**
 * Volume Profile chart component.
 * Shows volume distribution across different price levels.
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { ChartProps } from '@/types/charts';

interface VolumeProfileDataPoint {
    price_level: number;
    volume: number;
    volume_percentage?: number;
    bin_index: number;
}

interface VolumeProfileData {
    profile: VolumeProfileDataPoint[];
    poc: {
        price: number;
        volume: number;
    };
    value_area: {
        min: number;
        max: number;
    };
    total_volume: number;
}

// Format volume for display
const formatVolume = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
};

export function VolumeProfileChart({ data }: ChartProps) {
    if (!data) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                No volume profile data available
            </div>
        );
    }

    // Handle both old format (array) and new format (object with profile)
    const profileData = (data as any).profile || data;
    const poc = (data as any).poc;
    const valueArea = (data as any).value_area;
    const totalVolume = (data as any).total_volume;

    if (!profileData || !Array.isArray(profileData) || profileData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                No volume profile data available
            </div>
        );
    }

    const chartData = (profileData as VolumeProfileDataPoint[]).map((item) => ({
        ...item,
        price: item.price_level,
    }));

    // Find max volume for color scaling
    const maxVolume = Math.max(...chartData.map(d => d.volume));

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as VolumeProfileDataPoint;
            return (
                <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-popover-foreground mb-2">
                        Price: ${data.price_level.toLocaleString()}
                    </p>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Volume:</span>
                            <span className="font-medium">{data.volume.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-2">
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                        type="number"
                        dataKey="volume"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatVolume}
                    />
                    <YAxis
                        type="category"
                        dataKey="price"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* POC (Point of Control) line - no label, color only */}
                    {poc && (
                        <ReferenceLine 
                            y={poc.price} 
                            stroke="#f59e0b" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                        />
                    )}
                    {/* Value Area lines - no labels, color only */}
                    {valueArea && (
                        <>
                            <ReferenceLine 
                                y={valueArea.min} 
                                stroke="#10b981" 
                                strokeDasharray="3 3"
                            />
                            <ReferenceLine 
                                y={valueArea.max} 
                                stroke="#10b981" 
                                strokeDasharray="3 3"
                            />
                        </>
                    )}
                    <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => {
                            // Highlight POC and value area
                            const isPOC = poc && Math.abs(entry.price_level - poc.price) < 0.01;
                            const isValueArea = valueArea && entry.price_level >= valueArea.min && entry.price_level <= valueArea.max;
                            
                            let color;
                            if (isPOC) {
                                color = '#f59e0b'; // Amber for POC
                            } else if (isValueArea) {
                                const intensity = entry.volume / maxVolume;
                                color = `hsl(142, 71%, ${60 - intensity * 20}%)`; // Green for value area
                            } else {
                                const intensity = entry.volume / maxVolume;
                                color = `hsl(217, 91%, ${60 - intensity * 30}%)`; // Blue gradient
                            }
                            return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Support/Resistance Info */}
            {(poc || valueArea) && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                    {poc && (
                        <div className="text-center p-2 bg-muted rounded">
                            <div className="text-muted-foreground">POC</div>
                            <div className="font-semibold text-amber-500">${poc.price.toLocaleString()}</div>
                        </div>
                    )}
                    {valueArea && (
                        <>
                            <div className="text-center p-2 bg-muted rounded">
                                <div className="text-muted-foreground">VA Low</div>
                                <div className="font-semibold text-green-500">${valueArea.min.toLocaleString()}</div>
                            </div>
                            <div className="text-center p-2 bg-muted rounded">
                                <div className="text-muted-foreground">VA High</div>
                                <div className="font-semibold text-green-500">${valueArea.max.toLocaleString()}</div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Info */}
            <div className="flex items-center justify-center text-xs text-muted-foreground">
                <span>Support/Resistance Analysis - Volume distribution across price levels</span>
            </div>
        </div>
    );
}
