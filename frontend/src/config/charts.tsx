/**
 * Central chart registry configuration.
 * 
 * To add a new chart:
 * 1. Import the chart component
 * 2. Add a new entry to CHART_REGISTRY array
 * 3. Done! Chart will automatically appear in Analytics page
 */

import { LineChart, BarChart3, TrendingUp, Activity, Waves, GitBranch, Gauge, BarChartHorizontal, PieChart } from "lucide-react";
import { ChartConfig } from "@/types/charts";
import { CandlestickChartWrapper } from "@/components/charts/CandlestickChartWrapper";
import { VolumeChart } from "@/components/charts/VolumeChart";
import { RSIChart } from "@/components/charts/RSIChart";
import { MACDChart } from "@/components/charts/MACDChart";
import { BollingerChart } from "@/components/charts/BollingerChart";
import { OrderBookChart } from "@/components/charts/OrderBookChart";
import { CorrelationChart } from "@/components/charts/CorrelationChart";
import { ATRChart } from "@/components/charts/ATRChart";
import { VolumeProfileChart } from "@/components/charts/VolumeProfileChart";
import { ReturnDistributionChart } from "@/components/charts/ReturnDistributionChart";
import { Layers } from "lucide-react";
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
        defaultParams: { limit: 200, interval: '1m' },
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
        gridSpan: { cols: 3, rows: 1 },
        refreshInterval: 10000 // 10s refresh
    },
    {
        id: 'correlation',
        title: 'Price Correlation',
        description: 'Correlation between base coin and two comparison coins',
        category: 'indicator',
        icon: GitBranch,
        component: CorrelationChart,
        defaultEnabled: false,
        dataProvider: 'correlation',
        refreshInterval: 15000,
        gridSpan: { cols: 3, rows: 1 },
        defaultParams: { window: 20, limit: 200, interval: '1m' },
    },
    {
        id: 'atr',
        title: 'ATR (14)',
        description: 'Average True Range - volatility indicator',
        category: 'indicator',
        icon: Gauge,
        component: ATRChart,
        defaultEnabled: false,
        dataProvider: 'atr',
        refreshInterval: 15000,
        gridSpan: { cols: 3, rows: 1 },
        defaultParams: { period: 14, limit: 200 },
    },
    {
        id: 'volume_profile',
        title: 'Volume Profile',
        description: 'Volume distribution across price levels - Support/Resistance Analysis',
        category: 'market',
        icon: BarChartHorizontal,
        component: VolumeProfileChart,
        defaultEnabled: false,
        dataProvider: 'volume_profile',
        refreshInterval: 30000, // 30 seconds
        gridSpan: { cols: 3, rows: 2 },
        defaultParams: { bins: 20, limit: 200 },
    },
    {
        id: 'return_distribution',
        title: 'Return Distribution',
        description: 'Distribution of price returns - Risk Analysis',
        category: 'market',
        icon: PieChart,
        component: ReturnDistributionChart,
        defaultEnabled: false,
        dataProvider: 'return_distribution',
        refreshInterval: 30000, // 30 seconds
        gridSpan: { cols: 3, rows: 1 },
        defaultParams: { bins: 30, limit: 200 },
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
