/**
 * Candlestick chart using lightweight-charts library
 * Adapted to work with new ChartProps interface
 */

import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { ChartProps } from '@/types/charts';

export function CandlestickChartWrapper({ symbol, data, loading, error }: ChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

    // Create chart
    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container) return;

        // Clean up existing chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
            candleSeriesRef.current = null;
        }

        const chart = createChart(container, {
            width: container.clientWidth,
            height: 500,
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
            },
        });

        chartRef.current = chart;

        // Add candlestick series
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderUpColor: '#10b981',
            borderDownColor: '#ef4444',
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });
        candleSeriesRef.current = candleSeries;

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
        if (!candleSeriesRef.current || !data || !Array.isArray(data)) return;

        const transformedData = data.map((item: any) => ({
            time: Math.floor(new Date(item.time).getTime() / 1000) as any,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
        })).sort((a, b) => a.time - b.time);

        if (transformedData.length > 0) {
            candleSeriesRef.current.setData(transformedData);
            chartRef.current?.timeScale().fitContent();
        }
    }, [data]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2" />
                <p className="text-muted-foreground">Loading {symbol}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[500px] text-destructive">
                Error: {error}
            </div>
        );
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                No candlestick data available
            </div>
        );
    }

    const latest = data[data.length - 1];

    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-5 gap-4">
                <div>
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="text-lg font-bold">${parseFloat(latest.close).toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Open</p>
                    <p className="text-sm font-semibold">${parseFloat(latest.open).toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">High</p>
                    <p className="text-sm font-semibold text-green-500">${parseFloat(latest.high).toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Low</p>
                    <p className="text-sm font-semibold text-red-500">${parseFloat(latest.low).toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="text-sm font-semibold">{latest.volume ? parseFloat(latest.volume).toFixed(2) : 'N/A'}</p>
                </div>
            </div>

            {/* Chart */}
            <div ref={chartContainerRef} style={{ width: '100%', height: '500px' }} />

            <p className="text-xs text-muted-foreground text-center">
                Showing {data.length} candles for {symbol}
            </p>
        </div>
    );
}
