/**
 * Generic chart container component.
 * 
 * Handles data fetching, loading states, and error handling for any chart.
 */

import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useChartData } from "@/hooks/useChartData";
import { ChartConfig } from "@/types/charts";

interface ChartContainerProps {
    config: ChartConfig;
    symbol: string;
    interval?: string;
}

export function ChartContainer({ config, symbol, interval }: ChartContainerProps) {
    // Convert URL format (BTC_USDT) to API format (BTCUSDT)
    const apiSymbol = symbol.replace(/_/g, '');

    const { data, loading, error, refetch } = useChartData({
        symbol: apiSymbol,
        endpoint: config.dataProvider,
        params: { ...config.defaultParams, interval: interval },
        refreshInterval: config.refreshInterval,
        enabled: true,
    });

    const ChartComponent = config.component;
    const IconComponent = config.icon;

    // Calculate grid span classes
    const colSpanClass = config.gridSpan?.cols === 3
        ? 'col-span-3'
        : config.gridSpan?.cols === 2
            ? 'col-span-2'
            : 'col-span-1';

    return (
        <Card className={`glass ${colSpanClass}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <CardTitle className="text-lg">{config.title}</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={loading}
                        className="h-8 w-8"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent>
                {loading && <ChartSkeleton />}

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription className="flex items-center justify-between">
                            <span>Failed to load data: {error}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                            >
                                Retry
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {!loading && !error && data && (
                    <ChartComponent
                        symbol={symbol}
                        data={data}
                        loading={loading}
                        error={error}
                        onRefresh={refetch}
                    />
                )}

                {!loading && !error && !data && (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                        No data available
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Loading skeleton for charts
 */
function ChartSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="h-64 w-full" />
            <div className="flex gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
            </div>
        </div>
    );
}
