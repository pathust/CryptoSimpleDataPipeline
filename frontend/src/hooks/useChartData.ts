import { useEffect, useState } from 'react';
import { getCandlestickData, getIndicators } from '@/lib/api-client';

interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

interface IndicatorData {
    rsi?: number;
    macd?: {
        macd: number;
        signal: number;
        histogram: number;
    };
    bollinger_bands?: {
        upper: number;
        middle: number;
        lower: number;
    };
}

export function useChartData(symbol: string, limit: number = 200) {
    const [candleData, setCandleData] = useState<CandleData[]>([]);
    const [indicators, setIndicators] = useState<IndicatorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [rawCandles, indicatorData] = await Promise.all([
                    getCandlestickData(symbol, limit),
                    getIndicators(symbol),
                ]);

                if (!mounted) return;

                // Transform for Lightweight Charts
                // Backend sends UTC time strings, but browser's new Date() parses them as local time
                // So no need to add offset - just convert to Unix timestamp
                const transformed = rawCandles.map((item: any) => ({
                    time: Math.floor(new Date(item.time).getTime() / 1000) as any,
                    open: parseFloat(item.open),
                    high: parseFloat(item.high),
                    low: parseFloat(item.low),
                    close: parseFloat(item.close),
                    volume: item.volume ? parseFloat(item.volume) : undefined,
                })).sort((a, b) => a.time - b.time);

                setCandleData(transformed);
                setIndicators(indicatorData);
            } catch (err: any) {
                if (mounted) {
                    console.error('Failed to load chart data:', err);
                    setError(err.message || 'Failed to load data');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            mounted = false;
        };
    }, [symbol, limit]);

    return {
        candleData,
        indicators,
        loading,
        error,
    };
}
