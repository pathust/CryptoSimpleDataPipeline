/**
 * Refactored Analytics page using chart registry system.
 * 
 * This page dynamically renders charts based on the CHART_REGISTRY configuration.
 * Adding a new chart only requires adding an entry to charts.tsx - no changes needed here!
 */

import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { ChartSelector } from "@/components/analytics/ChartSelector";
import { CHART_REGISTRY, getDefaultEnabledCharts } from "@/config/charts";

const VALID_SYMBOLS = ['BTC_USDT', 'ETH_USDT', 'BNB_USDT'];

export default function Analytics() {
    const { symbol } = useParams<{ symbol: string }>();
    const [enabledCharts, setEnabledCharts] = useState<Set<string>>(
        new Set(getDefaultEnabledCharts())
    );

    // Validate symbol and redirect if invalid
    if (!symbol || !VALID_SYMBOLS.includes(symbol)) {
        return <Navigate to="/analytics/BTC_USDT" replace />;
    }

    // Toggle chart enabled/disabled
    const handleToggleChart = (chartId: string) => {
        setEnabledCharts((prev) => {
            const next = new Set(prev);
            if (next.has(chartId)) {
                next.delete(chartId);
            } else {
                next.add(chartId);
            }
            return next;
        });
    };

    // Get enabled charts from registry
    const activeCharts = CHART_REGISTRY.filter((chart) =>
        enabledCharts.has(chart.id)
    );

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold text-foreground">Market Analytics</h1>
                <p className="text-muted-foreground">
                    Professional trading analysis and technical indicators
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Charts Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Dynamic Chart Grid */}
                    <div className="grid grid-cols-3 gap-6">
                        {activeCharts.map((chart) => (
                            <ChartContainer
                                key={chart.id}
                                config={chart}
                                symbol={symbol}
                            />
                        ))}
                    </div>

                    {/* Empty State */}
                    {activeCharts.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                            <p className="text-lg">No charts selected</p>
                            <p className="text-sm">Use the chart selector to enable charts</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <ChartSelector
                        enabledCharts={enabledCharts}
                        onToggle={handleToggleChart}
                    />
                </div>
            </div>
        </div>
    );
}
