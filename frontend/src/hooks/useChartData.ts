/**
 * Generic hook for fetching chart data from analytics endpoints.
 * 
 * Usage:
 *   const { data, loading, error, refetch } = useChartData({
 *     symbol: 'BTCUSDT',
 *     endpoint: 'rsi',
 *     params: { period: 14, limit: 200 }
 *   });
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

interface UseChartDataOptions {
    symbol: string;
    endpoint: string;
    params?: Record<string, any>;
    refreshInterval?: number;
    enabled?: boolean;
}

export function useChartData<T = any>({
    symbol,
    endpoint,
    params = {},
    refreshInterval,
    enabled = true,
}: UseChartDataOptions) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;

        try {
            setLoading(true);
            setError(null);

            // Build query string from params
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value));
                }
            });

            const queryString = queryParams.toString();
            const url = `${API_BASE}/api/analytics/data/${endpoint}/${symbol}${queryString ? `?${queryString}` : ''}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // Check for error in response
            if (result.error) {
                throw new Error(result.error);
            }

            setData(result);
        } catch (err: any) {
            console.error(`Error fetching ${endpoint} data:`, err);
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, [symbol, endpoint, JSON.stringify(params), enabled]);

    useEffect(() => {
        if (!enabled) return;

        fetchData();

        if (refreshInterval && refreshInterval > 0) {
            const interval = setInterval(fetchData, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchData, refreshInterval, enabled]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
    };
}
