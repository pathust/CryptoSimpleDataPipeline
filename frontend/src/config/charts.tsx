/**
 * Central chart registry configuration.
 * 
 * To add a new chart:
 * 1. Import the chart component
 * 2. Add a new entry to CHART_REGISTRY array
 * 3. Done! Chart will automatically appear in Analytics page
 */

import { LineChart, BarChart3, TrendingUp, Activity, Waves, BarChart, Gauge } from "lucide-react";
import { ChartConfig } from "@/types/charts";
import { CandlestickChartWrapper } from "@/components/charts/CandlestickChartWrapper";
import { CandlestickEnhancedChart } from "@/components/charts/CandlestickEnhancedChart";
import { VolumeChart } from "@/components/charts/VolumeChart";
import { RSIChart } from "@/components/charts/RSIChart";
import { MACDChart } from "@/components/charts/MACDChart";
import { BollingerChart } from "@/components/charts/BollingerChart";
import { OrderbookDepthChart } from "@/components/charts/OrderbookDepthChart";
import { FearGreedGaugeChart } from "@/components/charts/FearGreedGaugeChart";

export const CHART_REGISTRY: ChartConfig[] = [
    {
        id: 'candlestick',
        title: 'Price Chart',
        description: 'OHLCV candlestick chart with volume',
        category: 'primary',
        icon: LineChart,
        component: CandlestickChartWrapper,
        defaultEnabled: false, // Disabled in favor of enhanced version
        dataProvider: 'candlestick',
        refreshInterval: 15000, // 15 seconds
        gridSpan: { cols: 3, rows: 2 },
        defaultParams: { limit: 200 },
    },
    {
        id: 'candlestick_enhanced',
        title: 'Enhanced Price Chart',
        description: 'Candlestick with EMA 20/50 and Bollinger Bands',
        category: 'primary',
        icon: LineChart,
        component: CandlestickEnhancedChart,
        defaultEnabled: true,
        dataProvider: 'candlestick_enhanced',
        refreshInterval: 15000,
        gridSpan: { cols: 3, rows: 2 },
        defaultParams: { limit: 200 },
    },
    {
        id: 'volume',
        title: 'Volume',
        description: 'Trading volume over time',
        category: 'indicator',
        icon: BarChart3,
        component: VolumeChart,
        defaultEnabled: false,
        dataProvider: 'volume',
        refreshInterval: 15000,
        gridSpan: { cols: 3, rows: 1 },
        defaultParams: { limit: 200 },
    },
    {
        id: 'rsi',
        title: 'RSI (14)',
        description: 'Relative Strength Index',
        category: 'indicator',
        icon: TrendingUp,
        component: RSIChart,
        defaultEnabled: false,
        dataProvider: 'rsi',
        refreshInterval: 15000,
        gridSpan: { cols: 3, rows: 1 },
        defaultParams: { period: 14, limit: 200 },
    },
    {
        id: 'macd',
        title: 'MACD',
        description: 'Moving Average Convergence Divergence',
        category: 'indicator',
        icon: Activity,
        component: MACDChart,
        defaultEnabled: false,
        dataProvider: 'macd',
        refreshInterval: 15000,
        gridSpan: { cols: 3, rows: 1 },
        defaultParams: { fast_period: 12, slow_period: 26, signal_period: 9, limit: 200 },
    },
    {
        id: 'bollinger',
        title: 'Bollinger Bands',
        description: 'Volatility indicator',
        category: 'indicator',
        icon: Waves,
        component: BollingerChart,
        defaultEnabled: false,
        dataProvider: 'bollinger',
        refreshInterval: 15000,
        gridSpan: { cols: 3, rows: 1 },
        defaultParams: { period: 20, std_dev: 2, limit: 200 },
    },
    {
        id: 'orderbook_depth',
        title: 'Order Book Depth',
        description: 'Market depth visualization with bid/ask walls',
        category: 'market',
        icon: BarChart,
        component: OrderbookDepthChart,
        defaultEnabled: true,
        dataProvider: 'orderbook_depth',
        refreshInterval: 10000, // 10 seconds for real-time feel
        gridSpan: { cols: 3, rows: 2 },
        defaultParams: { depth_levels: 20, max_price_distance: 0.02 },
    },
    {
        id: 'fear_greed_gauge',
        title: 'Fear & Greed Index',
        description: 'Market sentiment gauge showing Fear to Greed spectrum',
        category: 'sentiment',
        icon: Gauge,
        component: FearGreedGaugeChart,
        defaultEnabled: true,
        dataProvider: 'fear_greed_gauge',
        refreshInterval: 30000, // 30 seconds
        gridSpan: { cols: 3, rows: 2 },
        defaultParams: { use_price_change: true },
    },
];

/**
 * Get charts by category
 */
export function getChartsByCategory(category: ChartConfig['category']) {
    return CHART_REGISTRY.filter(chart => chart.category === category);
}

/**
 * Get chart by ID
 */
export function getChartById(id: string) {
    return CHART_REGISTRY.find(chart => chart.id === id);
}

/**
 * Get default enabled charts
 */
export function getDefaultEnabledCharts() {
    return CHART_REGISTRY.filter(chart => chart.defaultEnabled).map(chart => chart.id);
}
