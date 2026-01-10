/**
 * Chart selector component for toggling charts on/off.
 */

import { Settings2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CHART_REGISTRY } from "@/config/charts";
import { ChartConfig } from "@/types/charts";

interface ChartSelectorProps {
    enabledCharts: Set<string>;
    onToggle: (chartId: string) => void;
}

export function ChartSelector({ enabledCharts, onToggle }: ChartSelectorProps) {
    // Group charts by category
    const primaryCharts = CHART_REGISTRY.filter(c => c.category === 'primary');
    const indicatorCharts = CHART_REGISTRY.filter(c => c.category === 'indicator');
    const marketCharts = CHART_REGISTRY.filter(c => c.category === 'market');
    const customCharts = CHART_REGISTRY.filter(c => c.category === 'custom');

    return (
        <Card className="glass">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg">Chart Selection</CardTitle>
                </div>
                <CardDescription>Choose which charts to display</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {primaryCharts.length > 0 && (
                    <ChartCategory
                        title="Primary Charts"
                        charts={primaryCharts}
                        enabledCharts={enabledCharts}
                        onToggle={onToggle}
                    />
                )}

                {indicatorCharts.length > 0 && (
                    <>
                        <Separator />
                        <ChartCategory
                            title="Technical Indicators"
                            charts={indicatorCharts}
                            enabledCharts={enabledCharts}
                            onToggle={onToggle}
                        />
                    </>
                )}

                {marketCharts.length > 0 && (
                    <>
                        <Separator />
                        <ChartCategory
                            title="Market Data"
                            charts={marketCharts}
                            enabledCharts={enabledCharts}
                            onToggle={onToggle}
                        />
                    </>
                )}

                {customCharts.length > 0 && (
                    <>
                        <Separator />
                        <ChartCategory
                            title="Custom Charts"
                            charts={customCharts}
                            enabledCharts={enabledCharts}
                            onToggle={onToggle}
                        />
                    </>
                )}
            </CardContent>
        </Card>
    );
}

interface ChartCategoryProps {
    title: string;
    charts: ChartConfig[];
    enabledCharts: Set<string>;
    onToggle: (chartId: string) => void;
}

function ChartCategory({ title, charts, enabledCharts, onToggle }: ChartCategoryProps) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <div className="space-y-2">
                {charts.map((chart) => {
                    const IconComponent = chart.icon;
                    const isEnabled = enabledCharts.has(chart.id);

                    return (
                        <div
                            key={chart.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <IconComponent className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <Label
                                        htmlFor={`chart-${chart.id}`}
                                        className="cursor-pointer text-sm font-medium"
                                    >
                                        {chart.title}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {chart.description}
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id={`chart-${chart.id}`}
                                checked={isEnabled}
                                onCheckedChange={() => onToggle(chart.id)}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
