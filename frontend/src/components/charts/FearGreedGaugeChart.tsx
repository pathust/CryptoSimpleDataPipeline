/**
 * Fear & Greed Index Gauge Chart
 * Semi-circular gauge showing market sentiment from Fear to Greed
 */

import { useEffect, useRef, useMemo } from 'react';
import { ChartProps } from '@/types/charts';

interface GaugeData {
    current_value: number;
    classification: string;
    color: string;
    description: string;
    timestamp: string;
    historical_data: Array<{ date: string; value: number }>;
    price_change_24h?: number;
    volatility_24h?: number;
    volume_change_24h?: number;
    symbol: string;
}

export function FearGreedGaugeChart({ symbol, data, loading, error }: ChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    console.log('🔍 FearGreedGaugeChart: Received props', { symbol, data, loading, error });

    const gaugeData = data as GaugeData;

    if (loading) {
        console.log('⏳ FearGreedGaugeChart: Loading state');
        return (
            <div className="flex flex-col items-center justify-center h-[400px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2" />
                <p className="text-muted-foreground">Loading Fear & Greed Index for {symbol}...</p>
            </div>
        );
    }

    if (error) {
        console.log('❌ FearGreedGaugeChart: Error state', error);
        return (
            <div className="flex items-center justify-center h-[400px] text-destructive">
                Error: {error}
            </div>
        );
    }

    if (!gaugeData) {
        console.log('❌ FearGreedGaugeChart: No data available', gaugeData);
        return (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                No Fear & Greed data available
            </div>
        );
    }

    console.log('✅ FearGreedGaugeChart: Processing gauge data', gaugeData);

    // Draw the gauge
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gaugeData) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const centerX = rect.width / 2;
        const centerY = rect.height - 20;
        const radius = Math.min(rect.width, rect.height) / 2 - 20;

        // Clear canvas
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Draw gauge background zones
        const zones = [
            { min: 0, max: 20, color: '#dc2626', label: 'Extreme Fear' },
            { min: 20, max: 40, color: '#f97316', label: 'Fear' },
            { min: 40, max: 60, color: '#eab308', label: 'Neutral' },
            { min: 60, max: 80, color: '#22c55e', label: 'Greed' },
            { min: 80, max: 100, color: '#16a34a', label: 'Extreme Greed' }
        ];

        // Draw zones
        zones.forEach(zone => {
            const startAngle = Math.PI + (zone.min / 100) * Math.PI;
            const endAngle = Math.PI + (zone.max / 100) * Math.PI;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.arc(centerX, centerY, radius - 20, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = zone.color + '20'; // Add transparency
            ctx.fill();
            ctx.strokeStyle = zone.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw gauge outline
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw inner arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 20, Math.PI, 2 * Math.PI);
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw scale marks and labels
        for (let i = 0; i <= 10; i++) {
            const angle = Math.PI + (i / 10) * Math.PI;
            const x1 = centerX + Math.cos(angle) * (radius - 5);
            const y1 = centerY + Math.sin(angle) * (radius - 5);
            const x2 = centerX + Math.cos(angle) * (radius + 5);
            const y2 = centerY + Math.sin(angle) * (radius + 5);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = i % 2 === 0 ? 2 : 1;
            ctx.stroke();

            // Draw labels for major marks
            if (i % 2 === 0) {
                const labelX = centerX + Math.cos(angle) * (radius + 20);
                const labelY = centerY + Math.sin(angle) * (radius + 20);
                ctx.fillStyle = '#9ca3af';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText((i * 10).toString(), labelX, labelY);
            }
        }

        // Draw needle
        const needleAngle = Math.PI + (gaugeData.current_value / 100) * Math.PI;
        const needleLength = radius - 25;
        const needleX = centerX + Math.cos(needleAngle) * needleLength;
        const needleY = centerY + Math.sin(needleAngle) * needleLength;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(needleX, needleY);
        ctx.strokeStyle = gaugeData.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = gaugeData.color;
        ctx.fill();
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw value text
        ctx.fillStyle = '#f3f4f6';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gaugeData.current_value.toString(), centerX, centerY - 40);

        // Draw classification
        ctx.fillStyle = gaugeData.color;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(gaugeData.classification, centerX, centerY - 10);

    }, [gaugeData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2" />
                <p className="text-muted-foreground">Loading Fear & Greed Index for {symbol}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[400px] text-destructive">
                Error: {error}
            </div>
        );
    }

    if (!gaugeData) {
        return (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                No Fear & Greed data available
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Gauge Container */}
            <div className="relative bg-slate-900 rounded-lg p-4">
                <canvas 
                    ref={canvasRef}
                    className="w-full h-[300px]"
                    style={{ maxWidth: '500px', margin: '0 auto' }}
                />
            </div>

            {/* Current Status */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                    <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: gaugeData.color }}
                    />
                    <span className="text-lg font-semibold" style={{ color: gaugeData.color }}>
                        {gaugeData.classification}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">{gaugeData.description}</p>
                <p className="text-xs text-muted-foreground">
                    Last updated: {gaugeData.timestamp ? new Date(gaugeData.timestamp).toLocaleString() : 'Unknown'}
                </p>
            </div>

            {/* Market Metrics */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">24h Price Change</p>
                    <p className={`text-sm font-semibold ${
                        (gaugeData.price_change_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                        {gaugeData.price_change_24h !== null ? 
                            `${gaugeData.price_change_24h >= 0 ? '+' : ''}${gaugeData.price_change_24h}%` : 
                            'N/A'
                        }
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">24h Volatility</p>
                    <p className="text-sm font-semibold text-yellow-400">
                        {gaugeData.volatility_24h !== null ? `${gaugeData.volatility_24h}%` : 'N/A'}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Volume Change</p>
                    <p className={`text-sm font-semibold ${
                        (gaugeData.volume_change_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                        {gaugeData.volume_change_24h !== null ? 
                            `${gaugeData.volume_change_24h >= 0 ? '+' : ''}${gaugeData.volume_change_24h}%` : 
                            'N/A'
                        }
                    </p>
                </div>
            </div>

            {/* Historical Trend */}
            {gaugeData.historical_data && gaugeData.historical_data.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">7-Day Trend</h4>
                    <div className="flex items-end justify-between h-20 px-2">
                        {gaugeData.historical_data.map((item, index) => {
                            const height = (item.value / 100) * 80; // Max height 80px
                            const color = item.value <= 20 ? '#dc2626' :
                                        item.value <= 40 ? '#f97316' :
                                        item.value <= 60 ? '#eab308' :
                                        item.value <= 80 ? '#22c55e' : '#16a34a';
                            
                            return (
                                <div key={index} className="flex flex-col items-center flex-1">
                                    <div 
                                        className="w-full max-w-[20px] rounded-t-sm transition-all duration-300"
                                        style={{ 
                                            height: `${height}px`,
                                            backgroundColor: color,
                                            opacity: index === gaugeData.historical_data.length - 1 ? 1 : 0.7
                                        }}
                                    />
                                    <span className="text-xs text-muted-foreground mt-1">
                                        {new Date(item.date).toLocaleDateString('en', { weekday: 'short' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
                Fear & Greed Index • Market sentiment gauge for {symbol}
            </p>
        </div>
    );
}
