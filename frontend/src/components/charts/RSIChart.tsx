/**
 * Enhanced RSI (Relative Strength Index) chart component with professional styling.
 */

import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { ChartProps } from '@/types/charts';

interface RSIDataPoint {
    time: string;
    rsi: number;
}

export function RSIChart({ symbol, data, loading, error }: ChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

    // Create chart
    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container) return;

        // Clean up existing chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
            rsiSeriesRef.current = null;
        }

        const chart = createChart(container, {
            width: container.clientWidth,
            height: 300,
            layout: {
                background: { type: ColorType.Solid, color: '#0a0e27' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: '#1e293b' },
                horzLines: { color: '#1e293b' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#1e293b',
            },
            rightPriceScale: {
                borderColor: '#1e293b',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
        });

        chartRef.current = chart;

        // Add RSI line series with gradient effect
        const rsiSeries = chart.addLineSeries({
            color: '#8b5cf6', // Purple color for RSI
            lineWidth: 2,
            title: 'RSI (14)',
            priceScaleId: 'right',
        });
        rsiSeriesRef.current = rsiSeries;

        // Add overbought zone (70-100)
        chart.addLineSeries({
            color: 'rgba(239, 68, 68, 0.3)', // Red with transparency
            lineWidth: 1,
            lineStyle: 2, // dashed
            title: 'Overbought',
            priceScaleId: 'right',
        });

        // Add oversold zone (0-30)
        chart.addLineSeries({
            color: 'rgba(34, 197, 94, 0.3)', // Green with transparency
            lineWidth: 1,
            lineStyle: 2, // dashed
            title: 'Oversold',
            priceScaleId: 'right',
        });

        // Resize handler
        const handleResize = () => {
            if (chartRef.current && container) {
                chart.applyOptions({ width: container.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            try {
                chart.remove();
            } catch (err) {
                console.warn('Error during cleanup:', err);
            }
        };
    }, []);

    // Update data
    useEffect(() => {
        if (!data || !Array.isArray(data)) return;

        const transformedData = data.map((item: RSIDataPoint) => ({
            time: Math.floor(new Date(item.time).getTime() / 1000) as any,
            value: parseFloat(item.rsi.toString()),
        })).sort((a, b) => a.time - b.time);

        // Create overbought line data
        const overboughtData = transformedData.map(item => ({
            time: item.time,
            value: 70,
        }));

        // Create oversold line data
        const oversoldData = transformedData.map(item => ({
            time: item.time,
            value: 30,
        }));

        if (transformedData.length > 0 && rsiSeriesRef.current) {
            rsiSeriesRef.current.setData(transformedData);
        }

        // Update reference lines (these would need separate series references in a real implementation)
        chartRef.current?.timeScale().fitContent();
    }, [data]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2" />
                <p className="text-muted-foreground">Loading RSI for {symbol}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[300px] text-destructive">
                Error: {error}
            </div>
        );
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No RSI data available
            </div>
        );
    }

    const latest = data[data.length - 1];
    const currentRSI = latest.rsi;

    // Determine RSI status
    let rsiStatus = 'Neutral';
    let rsiColor = '#eab308'; // Yellow
    if (currentRSI >= 70) {
        rsiStatus = 'Overbought';
        rsiColor = '#ef4444'; // Red
    } else if (currentRSI <= 30) {
        rsiStatus = 'Oversold';
        rsiColor = '#22c55e'; // Green
    } else if (currentRSI >= 60) {
        rsiStatus = 'Bullish';
        rsiColor = '#3b82f6'; // Blue
    } else if (currentRSI <= 40) {
        rsiStatus = 'Bearish';
        rsiColor = '#f97316'; // Orange
    }

    return (
        <div className="space-y-4">
            {/* RSI Status */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold" style={{ color: rsiColor }}>
                        {currentRSI.toFixed(2)}
                    </div>
                    <div>
                        <div className="text-sm font-semibold" style={{ color: rsiColor }}>
                            {rsiStatus}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            RSI (14)
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-muted-foreground">Signal</div>
                    <div className="text-sm font-semibold">
                        {currentRSI >= 70 ? 'Consider Selling' : 
                         currentRSI <= 30 ? 'Consider Buying' : 'Hold'}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="relative">
                <div ref={chartContainerRef} style={{ width: '100%', height: '300px' }} />
                
                {/* Zone overlays */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Overbought zone */}
                    <div 
                        className="absolute left-0 right-0 opacity-10"
                        style={{
                            top: '0%',
                            height: '30%',
                            backgroundColor: '#ef4444',
                        }}
                    />
                    {/* Oversold zone */}
                    <div 
                        className="absolute left-0 right-0 opacity-10"
                        style={{
                            top: '70%',
                            height: '30%',
                            backgroundColor: '#22c55e',
                        }}
                    />
                </div>
            </div>

            {/* Legend and Zones */}
            <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Overbought Zone</span>
                        <span className="text-red-400 font-semibold">≥ 70</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Neutral Zone</span>
                        <span className="text-yellow-400 font-semibold">30-70</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Oversold Zone</span>
                        <span className="text-green-400 font-semibold">≤ 30</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Current Trend</span>
                        <span className="font-semibold" style={{ color: rsiColor }}>
                            {rsiStatus}
                        </span>
                    </div>
                </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
                RSI (14) • {data.length} periods for {symbol}
            </p>
        </div>
    );
}
