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
    params?: Record<string, any>; // Current parameter values
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

    /** Parameter schema for configurable parameters */
    parameterSchema?: Record<string, ParameterSchema>;
}

/**
 * Schema definition for a configurable parameter
 */
export interface ParameterSchema {
    /** Display label for the parameter */
    label: string;

    /** Input type */
    type: 'number' | 'select';

    /** Default value */
    default: any;

    /** Minimum value (for number type) */
    min?: number;

    /** Maximum value (for number type) */
    max?: number;

    /** Step value (for number type) */
    step?: number;

    /** Options (for select type) */
    options?: { label: string; value: any }[];

    /** Description/tooltip text */
    description?: string;
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
