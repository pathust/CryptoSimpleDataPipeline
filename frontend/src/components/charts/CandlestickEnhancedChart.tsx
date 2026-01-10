/**
 * Enhanced Candlestick chart with EMA 20, EMA 50, and Bollinger Bands
 * Using lightweight-charts with professional dark theme styling
 */

import { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { ChartProps } from '@/types/charts';

export function CandlestickEnhancedChart({ symbol, data, loading, error }: ChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

    // Create chart
    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container) return;

        // Clean up existing chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
            candleSeriesRef.current = null;
            ema20SeriesRef.current = null;
            ema50SeriesRef.current = null;
            bbUpperSeriesRef.current = null;
            bbLowerSeriesRef.current = null;
        }

        const chart = createChart(container, {
            width: container.clientWidth,
            height: 600,
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
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    width: 1,
                    color: '#3b82f6',
                    style: 3, // dashed
                },
                horzLine: {
                    width: 1,
                    color: '#3b82f6',
                    style: 3, // dashed
                },
            },
        });

        chartRef.current = chart;

        // Add candlestick series with specified colors
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',      // Xanh ngọc (Turquoise)
            downColor: '#ef5350',    // Đỏ san hô (Coral red)
            borderUpColor: '#26a69a',
            borderDownColor: '#ef5350',
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });
        candleSeriesRef.current = candleSeries;

        // Add EMA 20 (Yellow/Neon) - thicker line
        const ema20Series = chart.addLineSeries({
            color: '#ffeb3b',       // Vàng tươi rực rỡ
            lineWidth: 2,
            title: 'EMA 20',
            priceScaleId: 'right',
        });
        ema20SeriesRef.current = ema20Series;

        // Add EMA 50 (Blue) - thinner dashed line
        const ema50Series = chart.addLineSeries({
            color: '#3b82f6',       // Xanh dương
            lineWidth: 1,
            lineStyle: 2, // dashed
            title: 'EMA 50',
            priceScaleId: 'right',
        });
        ema50SeriesRef.current = ema50Series;

        // Add Bollinger Bands (very faint white/blue)
        const bbUpperSeries = chart.addLineSeries({
            color: 'rgba(255, 255, 255, 0.1)',  // Cực mờ
            lineWidth: 1,
            title: 'BB Upper',
            priceScaleId: 'right',
        });
        bbUpperSeriesRef.current = bbUpperSeries;

        const bbLowerSeries = chart.addLineSeries({
            color: 'rgba(255, 255, 255, 0.1)',  // Cực mờ
            lineWidth: 1,
            title: 'BB Lower',
            priceScaleId: 'right',
        });
        bbLowerSeriesRef.current = bbLowerSeries;

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

        const transformedData = data.map((item: any) => ({
            time: Math.floor(new Date(item.time).getTime() / 1000) as any,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
        })).sort((a, b) => a.time - b.time);

        const ema20Data = data
            .filter((item: any) => item.ema20 !== null && item.ema20 !== undefined)
            .map((item: any) => ({
                time: Math.floor(new Date(item.time).getTime() / 1000) as any,
                value: parseFloat(item.ema20),
            }))
            .sort((a, b) => a.time - b.time);

        const ema50Data = data
            .filter((item: any) => item.ema50 !== null && item.ema50 !== undefined)
            .map((item: any) => ({
                time: Math.floor(new Date(item.time).getTime() / 1000) as any,
                value: parseFloat(item.ema50),
            }))
            .sort((a, b) => a.time - b.time);

        const bbUpperData = data
            .filter((item: any) => item.bb_upper !== null && item.bb_upper !== undefined)
            .map((item: any) => ({
                time: Math.floor(new Date(item.time).getTime() / 1000) as any,
                value: parseFloat(item.bb_upper),
            }))
            .sort((a, b) => a.time - b.time);

        const bbLowerData = data
            .filter((item: any) => item.bb_lower !== null && item.bb_lower !== undefined)
            .map((item: any) => ({
                time: Math.floor(new Date(item.time).getTime() / 1000) as any,
                value: parseFloat(item.bb_lower),
            }))
            .sort((a, b) => a.time - b.time);

        if (transformedData.length > 0 && candleSeriesRef.current) {
            candleSeriesRef.current.setData(transformedData);
        }
        if (ema20Data.length > 0 && ema20SeriesRef.current) {
            ema20SeriesRef.current.setData(ema20Data);
        }
        if (ema50Data.length > 0 && ema50SeriesRef.current) {
            ema50SeriesRef.current.setData(ema50Data);
        }
        if (bbUpperData.length > 0 && bbUpperSeriesRef.current) {
            bbUpperSeriesRef.current.setData(bbUpperData);
        }
        if (bbLowerData.length > 0 && bbLowerSeriesRef.current) {
            bbLowerSeriesRef.current.setData(bbLowerData);
        }

        chartRef.current?.timeScale().fitContent();
    }, [data]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2" />
                <p className="text-muted-foreground">Loading {symbol}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[600px] text-destructive">
                Error: {error}
            </div>
        );
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                No enhanced candlestick data available
            </div>
        );
    }

    const latest = data[data.length - 1];

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#26a69a] rounded"></div>
                    <span className="text-muted-foreground">Bullish</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#ef5350] rounded"></div>
                    <span className="text-muted-foreground">Bearish</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-[#ffeb3b]"></div>
                    <span className="text-muted-foreground">EMA 20</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-[#3b82f6] border-dashed"></div>
                    <span className="text-muted-foreground">EMA 50</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-white opacity-10"></div>
                    <span className="text-muted-foreground">Bollinger Bands</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-5 gap-4">
                <div>
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="text-lg font-bold">${parseFloat(latest.close).toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">EMA 20</p>
                    <p className="text-sm font-semibold text-yellow-400">
                        ${latest.ema20 ? parseFloat(latest.ema20).toFixed(2) : 'N/A'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">EMA 50</p>
                    <p className="text-sm font-semibold text-blue-400">
                        ${latest.ema50 ? parseFloat(latest.ema50).toFixed(2) : 'N/A'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">BB Upper</p>
                    <p className="text-sm font-semibold text-gray-400">
                        ${latest.bb_upper ? parseFloat(latest.bb_upper).toFixed(2) : 'N/A'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">BB Lower</p>
                    <p className="text-sm font-semibold text-gray-400">
                        ${latest.bb_lower ? parseFloat(latest.bb_lower).toFixed(2) : 'N/A'}
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div ref={chartContainerRef} style={{ width: '100%', height: '600px' }} />

            <p className="text-xs text-muted-foreground text-center">
                Enhanced candlestick chart with EMA 20/50 and Bollinger Bands • {data.length} candles for {symbol}
            </p>
        </div>
    );
}
