/**
 * Chart Parameter Controls Component
 * 
 * Provides UI controls for adjusting chart parameters dynamically.
 * Renders input fields based on parameter schema definition.
 */

import { useState, useEffect } from 'react';
import { Settings, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ParameterSchema } from '@/types/charts';

interface ChartParameterControlsProps {
    /** Parameter schema definitions */
    parameterSchema: Record<string, ParameterSchema>;

    /** Current parameter values */
    currentParams: Record<string, any>;

    /** Callback when parameters are applied */
    onApply: (params: Record<string, any>) => void;

    /** Callback when parameters are reset to defaults */
    onReset: () => void;
}

export function ChartParameterControls({
    parameterSchema,
    currentParams,
    onApply,
    onReset,
}: ChartParameterControlsProps) {
    const [localParams, setLocalParams] = useState(currentParams);
    const [isOpen, setIsOpen] = useState(false);

    // Update local params when current params change
    useEffect(() => {
        setLocalParams(currentParams);
    }, [currentParams]);

    const handleParamChange = (key: string, value: any) => {
        setLocalParams((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleApply = () => {
        onApply(localParams);
        setIsOpen(false);
    };

    const handleReset = () => {
        const defaultParams: Record<string, any> = {};
        Object.entries(parameterSchema).forEach(([key, schema]) => {
            defaultParams[key] = schema.default;
        });
        setLocalParams(defaultParams);
        onReset();
        setIsOpen(false);
    };

    // Check if parameters have changed
    const hasChanges = JSON.stringify(localParams) !== JSON.stringify(currentParams);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Configure parameters"
                >
                    <Settings className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Chart Parameters</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="h-7 text-xs"
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset
                        </Button>
                    </div>

                    {/* Parameter Inputs */}
                    <div className="space-y-3">
                        {Object.entries(parameterSchema).map(([key, schema]) => (
                            <div key={key} className="space-y-1">
                                <Label htmlFor={`param-${key}`} className="text-xs">
                                    {schema.label}
                                    {schema.description && (
                                        <span className="text-muted-foreground ml-1">
                                            ({schema.description})
                                        </span>
                                    )}
                                </Label>

                                {schema.type === 'number' ? (
                                    <Input
                                        id={`param-${key}`}
                                        type="number"
                                        value={localParams[key] ?? schema.default}
                                        onChange={(e) => {
                                            const value = e.target.value === ''
                                                ? schema.default
                                                : Number(e.target.value);
                                            handleParamChange(key, value);
                                        }}
                                        min={schema.min}
                                        max={schema.max}
                                        step={schema.step ?? 1}
                                        className="h-8 text-xs"
                                    />
                                ) : schema.type === 'select' && schema.options ? (
                                    <select
                                        id={`param-${key}`}
                                        value={localParams[key] ?? schema.default}
                                        onChange={(e) => handleParamChange(key, e.target.value)}
                                        className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md"
                                    >
                                        {schema.options.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : null}

                                {/* Validation hints */}
                                {schema.type === 'number' && (schema.min !== undefined || schema.max !== undefined) && (
                                    <p className="text-[10px] text-muted-foreground">
                                        Range: {schema.min ?? '−∞'} to {schema.max ?? '∞'}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Apply Button */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleApply}
                            disabled={!hasChanges}
                            className="flex-1 h-8 text-xs"
                            size="sm"
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Apply Changes
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
