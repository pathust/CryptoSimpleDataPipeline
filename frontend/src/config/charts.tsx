/**
 * Central chart registry configuration.
 * 
 * To add a new chart:
 * 1. Import the chart component
 * 2. Add a new entry to CHART_REGISTRY array
 * 3. Done! Chart will automatically appear in Analytics page
 */

import { LineChart, BarChart3, TrendingUp, Activity, Waves } from "lucide-react";
import { ChartConfig } from "@/types/charts";
import { CandlestickChartWrapper } from "@/components/charts/CandlestickChartWrapper";
import { VolumeChart } from "@/components/charts/VolumeChart";
import { RSIChart } from "@/components/charts/RSIChart";
import { MACDChart } from "@/components/charts/MACDChart";
import { BollingerChart } from "@/components/charts/BollingerChart";
import { OrderBookChart } from "@/components/charts/OrderBookChart";
import { SpreadChart } from "@/components/charts/SpreadChart";
import { DailyTrendChart } from "@/components/charts/DailyTrendChart";
import { CalendarRange } from "lucide-react"; // Import icon
import { Layers, BarChartHorizontal } from "lucide-react";
export const CHART_REGISTRY: ChartConfig[] = [
    {
        id: 'candlestick',
        title: 'Price Chart',
        description: 'OHLCV candlestick chart with volume',
        category: 'primary',
        icon: LineChart,
        component: CandlestickChartWrapper,
        defaultEnabled: true,
        dataProvider: 'candlestick',
        refreshInterval: 15000, // 15 seconds
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
        id: 'order_book',
        title: 'Order Book Depth',
        description: 'Real-time bid/ask market depth',
        component: OrderBookChart,
        dataProvider: 'orderbook',
        category: 'market',
        icon: Layers,
        gridSpan: { cols: 2 },
        refreshInterval: 10000 // 10s refresh
    },
    {
        id: 'spread_history',
        title: 'Bid-Ask Spread',
        description: 'Price gap between buy and sell orders',
        component: SpreadChart,
        dataProvider: 'spread',
        category: 'market',
        icon: Activity,
        gridSpan: { cols: 1 },
        refreshInterval: 5000 // Spread đổi nhanh, refresh 5s
    },
    {
        id: 'daily_trend',
        title: 'Daily History',
        description: '30-day price & volume trend',
        component: DailyTrendChart,
        dataProvider: 'daily_trend',
        category: 'market',
        icon: CalendarRange,
        gridSpan: { cols: 2 }, // Chart ngày nên để rộng (2 cột)
        refreshInterval: 60000 // Dữ liệu ngày ít đổi, 60s là đủ
    }
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
