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
        defaultParams: { limit: 200, ma1_period: 7, ma2_period: 25, ma3_period: 99 },
        parameterSchema: {
            ma1_period: {
                label: 'MA1 Period',
                type: 'number',
                default: 7,
                min: 2,
                max: 200,
                step: 1,
                description: 'First moving average period'
            },
            ma2_period: {
                label: 'MA2 Period',
                type: 'number',
                default: 25,
                min: 2,
                max: 200,
                step: 1,
                description: 'Second moving average period'
            },
            ma3_period: {
                label: 'MA3 Period',
                type: 'number',
                default: 99,
                min: 2,
                max: 200,
                step: 1,
                description: 'Third moving average period'
            },
        },
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
        title: 'RSI',
        description: 'Relative Strength Index',
        category: 'indicator',
        icon: TrendingUp,
        component: RSIChart,
        defaultEnabled: false,
        dataProvider: 'rsi',
        refreshInterval: 15000,
        gridSpan: { cols: 3, rows: 1 },
        defaultParams: { period: 14, limit: 200 },
        parameterSchema: {
            period: {
                label: 'Period',
                type: 'number',
                default: 14,
                min: 2,
                max: 50,
                step: 1,
                description: 'Number of periods for RSI calculation'
            },
        },
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
        parameterSchema: {
            fast_period: {
                label: 'Fast Period',
                type: 'number',
                default: 12,
                min: 2,
                max: 50,
                step: 1,
                description: 'Fast EMA period'
            },
            slow_period: {
                label: 'Slow Period',
                type: 'number',
                default: 26,
                min: 2,
                max: 100,
                step: 1,
                description: 'Slow EMA period'
            },
            signal_period: {
                label: 'Signal Period',
                type: 'number',
                default: 9,
                min: 2,
                max: 50,
                step: 1,
                description: 'Signal line period'
            },
        },
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
        parameterSchema: {
            period: {
                label: 'Period',
                type: 'number',
                default: 20,
                min: 5,
                max: 100,
                step: 1,
                description: 'SMA period'
            },
            std_dev: {
                label: 'Std Deviation',
                type: 'number',
                default: 2,
                min: 0.5,
                max: 5,
                step: 0.1,
                description: 'Number of standard deviations'
            },
        },
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
        parameterSchema: {
            window: {
                label: 'Window',
                type: 'number',
                default: 20,
                min: 5,
                max: 100,
                step: 1,
                description: 'Rolling window size'
            },
        },
    },
    {
        id: 'atr',
        title: 'ATR',
        description: 'Average True Range - volatility indicator',
        category: 'indicator',
        icon: Gauge,
        component: ATRChart,
        defaultEnabled: false,
        dataProvider: 'atr',
        refreshInterval: 15000,
        gridSpan: { cols: 3, rows: 1 },
        defaultParams: { period: 14, limit: 200 },
        parameterSchema: {
            period: {
                label: 'Period',
                type: 'number',
                default: 14,
                min: 2,
                max: 50,
                step: 1,
                description: 'Number of periods for ATR'
            },
        },
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
        parameterSchema: {
            bins: {
                label: 'Bins',
                type: 'number',
                default: 20,
                min: 5,
                max: 50,
                step: 1,
                description: 'Number of price bins'
            },
        },
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
        parameterSchema: {
            bins: {
                label: 'Bins',
                type: 'number',
                default: 30,
                min: 10,
                max: 100,
                step: 5,
                description: 'Number of distribution bins'
            },
        },
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
