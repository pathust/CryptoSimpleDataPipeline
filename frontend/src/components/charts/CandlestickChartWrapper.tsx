/**
 * Candlestick chart styled like Binance.
 * Fix: Removed axis labels for Indicators (MA, Volume) to clean up the Y-axis.
 */

import { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { ChartProps } from '@/types/charts';

// Hàm helper tính SMA
const calculateSMA = (data: any[], count: number) => {
    const avg = (data: any[]) => data.reduce((a, b) => a + b, 0) / data.length;
    const result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < count - 1) {
            result.push({ time: data[i].time, value: NaN });
            continue;
        }
        const slice = data.slice(i - count + 1, i + 1);
        const val = avg(slice.map((d) => d.close));
        result.push({ time: data[i].time, value: val });
    }
    return result;
};

export function CandlestickChartWrapper({ symbol, data, loading, error }: ChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const legendRef = useRef<HTMLDivElement>(null);
    
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    
    const ma7SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const ma25SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const ma99SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container) return;

        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        // --- CẤU HÌNH CHART STYLE BINANCE ---
        const chart = createChart(container, {
            width: container.clientWidth,
            height: 500,
            layout: {
                background: { type: ColorType.Solid, color: '#161A25' },
                textColor: '#848E9C', // Màu chữ xám nhạt chuẩn Binance
            },
            grid: {
                vertLines: { color: '#2B2F36', style: LineStyle.Dotted }, // Grid dạng chấm mờ
                horzLines: { color: '#2B2F36', style: LineStyle.Dotted },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    width: 1,
                    color: '#9CA3AF', // Màu crosshair sáng hơn chút
                    style: LineStyle.Dashed,
                    labelBackgroundColor: '#4B5563',
                },
                horzLine: {
                    width: 1,
                    color: '#9CA3AF',
                    style: LineStyle.Dashed,
                    labelBackgroundColor: '#4B5563',
                },
            },
            timeScale: {
                borderColor: '#2B2F36',
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 5, // Khoảng cách đệm bên phải
            },
            rightPriceScale: {
                borderColor: '#2B2F36',
                scaleMargins: {
                    top: 0.1, // Chừa khoảng trống phía trên
                    bottom: 0.2, // Chừa khoảng trống phía dưới (để volume không đè nến)
                },
                visible: true,
            },
        });

        chartRef.current = chart;

        // --- 1. NẾN (MAIN SERIES) ---
        // Chỉ có series này mới được hiện Label giá trên trục Y
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#0ECB81',
            downColor: '#F6465D',
            borderDownColor: '#F6465D',
            borderUpColor: '#0ECB81',
            wickDownColor: '#F6465D',
            wickUpColor: '#0ECB81',
        });
        candleSeriesRef.current = candleSeries;

        // --- 2. VOLUME ---
        const volumeSeries = chart.addHistogramSeries({
            priceFormat: { type: 'volume' },
            priceScaleId: '', // Overlay mode (không tạo trục riêng)
            lastValueVisible: false, // TẮT SỐ BÊN CẠNH
            priceLineVisible: false, // TẮT ĐƯỜNG KẺ NGANG
        });
        
        // Đẩy volume xuống sát đáy (giống Binance)
        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8, // Volume nằm dưới thấp (từ 80% trở xuống)
                bottom: 0,
            },
        });
        volumeSeriesRef.current = volumeSeries;

        // --- 3. MOVING AVERAGES ---
        // Quan trọng: Set lastValueVisible: false để ẩn số bên phải
        
        // MA7 - Vàng
        const ma7Series = chart.addLineSeries({ 
            color: '#F0B90B', 
            lineWidth: 1, 
            lastValueVisible: false, // Ẩn nhãn trục Y
            priceLineVisible: false, // Ẩn đường kẻ ngang
            crosshairMarkerVisible: false // Ẩn chấm tròn khi hover
        });
        ma7SeriesRef.current = ma7Series;
        
        // MA25 - Tím
        const ma25Series = chart.addLineSeries({ 
            color: '#C026D3', 
            lineWidth: 1, 
            lastValueVisible: false, 
            priceLineVisible: false, 
            crosshairMarkerVisible: false 
        });
        ma25SeriesRef.current = ma25Series;

        // MA99 - Xanh
        const ma99Series = chart.addLineSeries({ 
            color: '#3B82F6', 
            lineWidth: 1, 
            lastValueVisible: false, 
            priceLineVisible: false, 
            crosshairMarkerVisible: false 
        });
        ma99SeriesRef.current = ma99Series;

        // --- LEGEND LOGIC (Góc trái trên cùng) ---
        chart.subscribeCrosshairMove((param) => {
            if (!legendRef.current) return;
            
            const legend = legendRef.current;
            
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > container.clientWidth ||
                param.point.y < 0 ||
                param.point.y > container.clientHeight
            ) {
                return;
            }

            const candleData = param.seriesData.get(candleSeries) as any;
            const volData = param.seriesData.get(volumeSeries) as any;
            const ma7Data = param.seriesData.get(ma7Series) as any;
            const ma25Data = param.seriesData.get(ma25Series) as any;
            const ma99Data = param.seriesData.get(ma99Series) as any;

            if (candleData) {
                const color = candleData.close >= candleData.open ? 'text-[#0ECB81]' : 'text-[#F6465D]';
                // Format giống hệt thanh header của Binance
                legend.innerHTML = `
                    <div class="flex flex-col gap-1 text-[11px] font-mono leading-tight select-none">
                        <div class="flex items-center gap-3">
                            <span class="text-gray-400">Open <span class="${color}">${formatPrice(candleData.open)}</span></span>
                            <span class="text-gray-400">High <span class="${color}">${formatPrice(candleData.high)}</span></span>
                            <span class="text-gray-400">Low <span class="${color}">${formatPrice(candleData.low)}</span></span>
                            <span class="text-gray-400">Close <span class="${color}">${formatPrice(candleData.close)}</span></span>
                            <span class="text-gray-400">Change <span class="${color}">${((candleData.close - candleData.open)/candleData.open * 100).toFixed(2)}%</span></span>
                        </div>
                        <div class="flex items-center gap-3">
                             ${!isNaN(ma7Data?.value) ? `<span class="text-[#F0B90B]">MA(7) ${formatPrice(ma7Data.value)}</span>` : ''}
                             ${!isNaN(ma25Data?.value) ? `<span class="text-[#C026D3]">MA(25) ${formatPrice(ma25Data.value)}</span>` : ''}
                             ${!isNaN(ma99Data?.value) ? `<span class="text-[#3B82F6]">MA(99) ${formatPrice(ma99Data.value)}</span>` : ''}
                        </div>
                         <div class="flex items-center gap-3">
                             ${volData ? `<span class="text-gray-400">Vol(BTC): <span class="text-gray-300">${formatVolume(volData.value)}</span></span>` : ''}
                        </div>
                    </div>
                `;
            }
        });

        const handleResize = () => {
            if (chartRef.current && container) {
                chart.applyOptions({ width: container.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // Update Data Effect (Giữ nguyên logic cũ nhưng gọn hơn)
    useEffect(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return;
        if (!candleSeriesRef.current) return;

        const sortedData = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        
        const chartData = sortedData.map((item: any) => ({
            time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
        }));

        const volumeData = sortedData.map((item: any) => ({
            time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
            value: parseFloat(item.volume),
            color: parseFloat(item.close) >= parseFloat(item.open) ? 'rgba(14, 203, 129, 0.4)' : 'rgba(246, 70, 93, 0.4)', 
        }));

        const ma7Data = calculateSMA(chartData, 7);
        const ma25Data = calculateSMA(chartData, 25);
        const ma99Data = calculateSMA(chartData, 99);

        candleSeriesRef.current.setData(chartData);
        volumeSeriesRef.current?.setData(volumeData);
        ma7SeriesRef.current?.setData(ma7Data);
        ma25SeriesRef.current?.setData(ma25Data);
        ma99SeriesRef.current?.setData(ma99Data);

        // Set Default Legend (Last candle)
        if (legendRef.current && chartData.length > 0) {
            const last = chartData[chartData.length - 1];
            const lastVol = volumeData[volumeData.length - 1];
            const lastMa7 = ma7Data[ma7Data.length - 1];
            const lastMa25 = ma25Data[ma25Data.length - 1];
            const lastMa99 = ma99Data[ma99Data.length - 1];
            const color = last.close >= last.open ? 'text-[#0ECB81]' : 'text-[#F6465D]';

            legendRef.current.innerHTML = `
                <div class="flex flex-col gap-1 text-[11px] font-mono leading-tight select-none">
                    <div class="flex items-center gap-3">
                        <span class="text-gray-400">Open <span class="${color}">${formatPrice(last.open)}</span></span>
                        <span class="text-gray-400">High <span class="${color}">${formatPrice(last.high)}</span></span>
                        <span class="text-gray-400">Low <span class="${color}">${formatPrice(last.low)}</span></span>
                        <span class="text-gray-400">Close <span class="${color}">${formatPrice(last.close)}</span></span>
                        <span class="text-gray-400">Change <span class="${color}">${((last.close - last.open)/last.open * 100).toFixed(2)}%</span></span>
                    </div>
                    <div class="flex items-center gap-3">
                         ${lastMa7 && !isNaN(lastMa7.value) ? `<span class="text-[#F0B90B]">MA(7) ${formatPrice(lastMa7.value)}</span>` : ''}
                         ${lastMa25 && !isNaN(lastMa25.value) ? `<span class="text-[#C026D3]">MA(25) ${formatPrice(lastMa25.value)}</span>` : ''}
                         ${lastMa99 && !isNaN(lastMa99.value) ? `<span class="text-[#3B82F6]">MA(99) ${formatPrice(lastMa99.value)}</span>` : ''}
                    </div>
                    <div class="flex items-center gap-3">
                         ${lastVol ? `<span class="text-gray-400">Vol(BTC): <span class="text-gray-300">${formatVolume(lastVol.value)}</span></span>` : ''}
                    </div>
                </div>
            `;
        }

    }, [data]);

    const formatPrice = (price: number) => price >= 1000 ? price.toFixed(2) : price.toPrecision(5);
    const formatVolume = (vol: number) => {
        if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M';
        if (vol >= 1000) return (vol / 1000).toFixed(2) + 'K';
        return vol.toFixed(2);
    };

    if (loading) return <div className="h-[500px] flex items-center justify-center bg-[#161A25]"><div className="animate-spin h-8 w-8 border-4 border-[#F0B90B] border-t-transparent rounded-full" /></div>;
    if (error) return <div className="h-[500px] flex items-center justify-center bg-[#161A25] text-[#F6465D]">Error: {error}</div>;
    if (!data?.length) return <div className="h-[500px] flex items-center justify-center bg-[#161A25] text-gray-500">No data</div>;

    return (
        <div className="relative w-full h-[500px] bg-[#161A25] border border-[#2B2F36] overflow-hidden">
            <div ref={legendRef} className="absolute top-2 left-2 z-10 pointer-events-none" />
            <div ref={chartContainerRef} className="w-full h-full" />
            <div className="absolute bottom-8 right-4 text-[40px] font-bold text-[#2B2F36] opacity-30 select-none pointer-events-none">
                {symbol?.replace(/_/g, '')}
            </div>
        </div>
    );
}