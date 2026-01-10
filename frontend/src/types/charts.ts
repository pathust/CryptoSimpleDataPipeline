/**
 * Chart configuration types for the analytics system.
 * 
 * These types define the structure for registering and managing charts
 * in the analytics dashboard.
 */

import { ComponentType } from 'react';

/**
 * Chart data props passed to chart components
 */
export interface ChartProps {
    symbol: string;
    data: any;
    loading: boolean;
    error: string | null;
    onRefresh?: () => void;
}

/**
 * Chart configuration for registry
 */
export interface ChartConfig {
    /** Unique identifier for the chart */
    id: string;

    /** Display title */
    title: string;

    /** Short description */
    description: string;

    /** Category for grouping */
    category: 'primary' | 'indicator' | 'market' | 'custom';

    /** Icon component (from lucide-react) */
    icon: ComponentType<{ className?: string }>;

    /** Chart component */
    component: ComponentType<ChartProps>;

    /** Whether enabled by default */
    defaultEnabled?: boolean;

    /** API endpoint for data (relative to /api/analytics/data/) */
    dataProvider: string;

    /** Auto-refresh interval in milliseconds */
    refreshInterval?: number;

    /** Grid span configuration */
    gridSpan?: {
        cols?: number;  // Columns to span (out of 3)
        rows?: number;  // Rows to span
    };

    /** Default parameters for the data provider */
    defaultParams?: Record<string, any>;
}

/**
 * Data provider metadata from backend
 */
export interface DataProviderMetadata {
    name: string;
    description: string;
    parameters: Record<string, ParameterMetadata>;
    data_format: string;
}

export interface ParameterMetadata {
    type: string;
    default: any;
    description: string;
}
