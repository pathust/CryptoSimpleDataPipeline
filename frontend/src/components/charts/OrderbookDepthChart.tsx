/**
 * Order Book Depth chart showing bid/ask walls
 * Creates "mountain" effect with green (bids) and red (asks) facing each other
 */

import { useEffect, useRef, useMemo } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { ChartProps } from '@/types/charts';

export function OrderbookDepthChart({ symbol, data, loading, error }: ChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const bidSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
    const askSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);

    // Process data for chart
    const chartData = useMemo(() => {
        console.log('🔍 OrderBookDepthChart: Processing data', data);
        
        if (!data || !data.bids || !data.asks) {
            console.log('❌ OrderBookDepthChart: No valid data structure', data);
            return { bidData: [], askData: [] };
        }

        // Process bids (buy orders) - create mountain effect
        const bidData = data.bids.map((bid: any, index: number) => {
            const point = {
                time: bid.price,
                value: bid.cumulative_volume || bid.volume,
            };
            console.log(`📊 Bid ${index}:`, point);
            return point;
        });

        // Process asks (sell orders) - create mountain effect
        const askData = data.asks.map((ask: any, index: number) => {
            const point = {
                time: ask.price,
                value: ask.cumulative_volume || ask.volume,
            };
            console.log(`📊 Ask ${index}:`, point);
            return point;
        });

        console.log('✅ OrderBookDepthChart: Processed data', { bidData, askData });
        return { bidData, askData };
    }, [data]);

    // Create chart
    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container) return;

        // Clean up existing chart
        if (chartRef.current) {
            try {
                chartRef.current.remove();
            } catch (err) {
                console.warn('Error removing existing chart:', err);
            }
            chartRef.current = null;
            bidSeriesRef.current = null;
            askSeriesRef.current = null;
        }

        const chart = createChart(container, {
            width: container.clientWidth,
            height: 400,
            layout: {
                background: { type: ColorType.Solid, color: '#0a0e27' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: '#1e293b' },
                horzLines: { color: '#1e293b' },
            },
            timeScale: {
                timeVisible: false,
                borderColor: '#1e293b',
            },
            rightPriceScale: {
                borderColor: '#1e293b',
            },
            leftPriceScale: {
                visible: true,
                borderColor: '#1e293b',
            },
        });

        chartRef.current = chart;

        // Add bid series (green mountain)
        const bidSeries = chart.addAreaSeries({
            topColor: 'rgba(34, 197, 94, 0.8)',     // Green-500 with opacity
            bottomColor: 'rgba(34, 197, 94, 0.1)',    // Very faint green
            lineColor: 'rgba(34, 197, 94, 1)',        // Solid green line
            lineWidth: 2,
            title: 'Bids',
            priceScaleId: 'left',
        });
        bidSeriesRef.current = bidSeries;

        // Add ask series (red mountain)
        const askSeries = chart.addAreaSeries({
            topColor: 'rgba(239, 68, 68, 0.8)',      // Red-500 with opacity
            bottomColor: 'rgba(239, 68, 68, 0.1)',     // Very faint red
            lineColor: 'rgba(239, 68, 68, 1)',         // Solid red line
            lineWidth: 2,
            title: 'Asks',
            priceScaleId: 'right',
        });
        askSeriesRef.current = askSeries;

        // Resize handler
        const handleResize = () => {
            if (chartRef.current && container) {
                chart.applyOptions({ width: container.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            // Use setTimeout to avoid disposal error during hot reload
            setTimeout(() => {
                try {
                    if (chartRef.current) {
                        chartRef.current.remove();
                    }
                } catch (err) {
                    console.warn('Error during cleanup:', err);
                }
            }, 0);
        };
    }, []);

    // Update data
    useEffect(() => {
        if (!chartData.bidData.length || !chartData.askData.length) return;

        if (bidSeriesRef.current) {
            bidSeriesRef.current.setData(chartData.bidData);
        }
        if (askSeriesRef.current) {
            askSeriesRef.current.setData(chartData.askData);
        }

        // Auto-fit content
        chartRef.current?.timeScale().fitContent();
    }, [chartData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2" />
                <p className="text-muted-foreground">Loading order book depth for {symbol}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[400px] text-destructive">
                Error: {error}
            </div>
        );
    }

    if (!data || !data.bids || !data.asks) {
        return (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                No order book depth data available
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center justify-between">
                <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm text-muted-foreground">Bids (Buy Orders)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm text-muted-foreground">Asks (Sell Orders)</span>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground">
                    {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'No timestamp'}
                </div>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div>
                    <p className="text-xs text-muted-foreground">Mid Price</p>
                    <p className="text-lg font-bold">${data.mid_price?.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Spread</p>
                    <p className="text-sm font-semibold text-yellow-400">
                        {data.spread?.toFixed(6)} ({data.spread_percentage?.toFixed(4)}%)
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Best Bid</p>
                    <p className="text-sm font-semibold text-green-400">
                        ${data.best_bid?.toLocaleString()} ({data.best_bid_volume})
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Best Ask</p>
                    <p className="text-sm font-semibold text-red-400">
                        ${data.best_ask?.toLocaleString()} ({data.best_ask_volume})
                    </p>
                </div>
            </div>

            {/* Depth Chart */}
            <div className="relative">
                <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />
                
                {/* Mid Price Line Overlay */}
                {data.mid_price && (
                    <div className="absolute inset-0 pointer-events-none flex items-center">
                        <div 
                            className="w-full border-t border-dashed border-yellow-400 opacity-50"
                            style={{
                                position: 'absolute',
                                top: '50%',
                            }}
                        />
                        <div 
                            className="absolute left-2 bg-yellow-400 text-black text-xs px-1 rounded"
                            style={{
                                top: '50%',
                                transform: 'translateY(-50%)',
                            }}
                        >
                            ${data.mid_price.toFixed(2)}
                        </div>
                    </div>
                )}
            </div>

            {/* Order Book Summary */}
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                    <h4 className="font-semibold text-green-400">Top 5 Bid Levels</h4>
                    {data.bids?.slice(0, 5).map((bid: any, index: number) => (
                        <div key={index} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">${bid.price}</span>
                            <span className="text-green-400">{bid.volume}</span>
                            <span className="text-muted-foreground">${bid.total}</span>
                        </div>
                    ))}
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold text-red-400">Top 5 Ask Levels</h4>
                    {data.asks?.slice(0, 5).map((ask: any, index: number) => (
                        <div key={index} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">${ask.price}</span>
                            <span className="text-red-400">{ask.volume}</span>
                            <span className="text-muted-foreground">${ask.total}</span>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
                Order Book Depth • {data.bids?.length || 0} bid levels • {data.asks?.length || 0} ask levels for {symbol}
            </p>
        </div>
    );
}
