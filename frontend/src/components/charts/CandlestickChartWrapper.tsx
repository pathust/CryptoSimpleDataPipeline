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

export function CandlestickChartWrapper({ symbol, data, loading, error, params = {} }: ChartProps) {
    const ma1Period = params.ma1_period ?? 7;
    const ma2Period = params.ma2_period ?? 25;
    const ma3Period = params.ma3_period ?? 99;

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const legendRef = useRef<HTMLDivElement>(null);

    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

    const ma1SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const ma2SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const ma3SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

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

        // MA1 - Vàng
        const ma1Series = chart.addLineSeries({
            color: '#F0B90B',
            lineWidth: 1,
            lastValueVisible: false, // Ẩn nhãn trục Y
            priceLineVisible: false, // Ẩn đường kẻ ngang
            crosshairMarkerVisible: false // Ẩn chấm tròn khi hover
        });
        ma1SeriesRef.current = ma1Series;

        // MA2 - Tím
        const ma2Series = chart.addLineSeries({
            color: '#C026D3',
            lineWidth: 1,
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false
        });
        ma2SeriesRef.current = ma2Series;

        // MA3 - Xanh
        const ma3Series = chart.addLineSeries({
            color: '#3B82F6',
            lineWidth: 1,
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false
        });
        ma3SeriesRef.current = ma3Series;

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
            const ma1Data = param.seriesData.get(ma1Series) as any;
            const ma2Data = param.seriesData.get(ma2Series) as any;
            const ma3Data = param.seriesData.get(ma3Series) as any;

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
                            <span class="text-gray-400">Change <span class="${color}">${((candleData.close - candleData.open) / candleData.open * 100).toFixed(2)}%</span></span>
                        </div>
                        <div class="flex items-center gap-3">
                             ${!isNaN(ma1Data?.value) ? `<span class="text-[#F0B90B]">MA(${ma1Period}) ${formatPrice(ma1Data.value)}</span>` : ''}
                             ${!isNaN(ma2Data?.value) ? `<span class="text-[#C026D3]">MA(${ma2Period}) ${formatPrice(ma2Data.value)}</span>` : ''}
                             ${!isNaN(ma3Data?.value) ? `<span class="text-[#3B82F6]">MA(${ma3Period}) ${formatPrice(ma3Data.value)}</span>` : ''}
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
    }, []); // Chart only created once on mount

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

        const ma1Data = calculateSMA(chartData, ma1Period);
        const ma2Data = calculateSMA(chartData, ma2Period);
        const ma3Data = calculateSMA(chartData, ma3Period);

        candleSeriesRef.current.setData(chartData);
        volumeSeriesRef.current?.setData(volumeData);
        ma1SeriesRef.current?.setData(ma1Data);
        ma2SeriesRef.current?.setData(ma2Data);
        ma3SeriesRef.current?.setData(ma3Data);

        // Set Default Legend (Last candle)
        if (legendRef.current && chartData.length > 0) {
            const last = chartData[chartData.length - 1];
            const lastVol = volumeData[volumeData.length - 1];
            const lastMa1 = ma1Data[ma1Data.length - 1];
            const lastMa2 = ma2Data[ma2Data.length - 1];
            const lastMa3 = ma3Data[ma3Data.length - 1];
            const color = last.close >= last.open ? 'text-[#0ECB81]' : 'text-[#F6465D]';

            legendRef.current.innerHTML = `
                <div class="flex flex-col gap-1 text-[11px] font-mono leading-tight select-none">
                    <div class="flex items-center gap-3">
                        <span class="text-gray-400">Open <span class="${color}">${formatPrice(last.open)}</span></span>
                        <span class="text-gray-400">High <span class="${color}">${formatPrice(last.high)}</span></span>
                        <span class="text-gray-400">Low <span class="${color}">${formatPrice(last.low)}</span></span>
                        <span class="text-gray-400">Close <span class="${color}">${formatPrice(last.close)}</span></span>
                        <span class="text-gray-400">Change <span class="${color}">${((last.close - last.open) / last.open * 100).toFixed(2)}%</span></span>
                    </div>
                    <div class="flex items-center gap-3">
                         ${lastMa1 && !isNaN(lastMa1.value) ? `<span class="text-[#F0B90B]">MA(${ma1Period}) ${formatPrice(lastMa1.value)}</span>` : ''}
                         ${lastMa2 && !isNaN(lastMa2.value) ? `<span class="text-[#C026D3]">MA(${ma2Period}) ${formatPrice(lastMa2.value)}</span>` : ''}
                         ${lastMa3 && !isNaN(lastMa3.value) ? `<span class="text-[#3B82F6]">MA(${ma3Period}) ${formatPrice(lastMa3.value)}</span>` : ''}
                    </div>
                    <div class="flex items-center gap-3">
                         ${lastVol ? `<span class="text-gray-400">Vol(BTC): <span class="text-gray-300">${formatVolume(lastVol.value)}</span></span>` : ''}
                    </div>
                </div>
            `;
        }

    }, [data, ma1Period, ma2Period, ma3Period]);

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