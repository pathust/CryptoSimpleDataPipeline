import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChart, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useChartData } from '@/hooks/useChartData';

interface ProfessionalCandleChartProps {
  symbol: string;
  showRSI?: boolean;
  showMACD?: boolean;
  showBollinger?: boolean;
}

export function ProfessionalCandleChart({ symbol: urlSymbol }: ProfessionalCandleChartProps) {
  const navigate = useNavigate();
  const [showVolume, setShowVolume] = useState(true);
  const [ohlcData, setOhlcData] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
  } | null>(null);

  // Convert URL format (BTC_USDT) to API format (BTCUSDT)
  const symbol = urlSymbol.replace('_', '');

  const { candleData, indicators, loading, error } = useChartData(symbol, 200);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Create/recreate chart when symbol changes
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    // Clean up existing chart
    if (chartRef.current) {
      console.log('Removing old chart');
      try {
        chartRef.current.remove();
      } catch (err) {
        console.warn('Error removing chart:', err);
      }
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    console.log('Creating new chart for', symbol);

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 600,
      layout: {
        background: { type: ColorType.Solid, color: '#0a0e27' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#1e293b',
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = candleSeries;

    // Resize handler
    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({ width: container.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      try {
        chart.remove();
      } catch (err) {
        console.warn('Error during cleanup:', err);
      }
    };
  }, [symbol]); // Recreate when symbol changes

  // Update candlestick data
  useEffect(() => {
    if (candleSeriesRef.current && candleData.length > 0) {
      console.log('Setting data:', candleData.length, 'candles for', symbol);
      candleSeriesRef.current.setData(candleData as any);

      // Subscribe to crosshair move to track OHLC
      const chart = chartRef.current;
      if (chart) {
        const handleCrosshairMove = (param: any) => {
          if (!param.time || !param.seriesData || !candleSeriesRef.current) {
            setOhlcData(null);
            return;
          }

          const data = param.seriesData.get(candleSeriesRef.current);
          if (data) {
            const date = new Date((param.time as number) * 1000);
            setOhlcData({
              time: date.toLocaleString(),
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close
            });
          }
        };

        chart.subscribeCrosshairMove(handleCrosshairMove);

        return () => {
          chart.unsubscribeCrosshairMove(handleCrosshairMove);
        };
      }
    }
  }, [candleData, symbol]);

  // Volume toggle
  useEffect(() => {
    if (!chartRef.current) return;

    if (showVolume && !volumeSeriesRef.current) {
      const volume = chartRef.current.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volume.priceScale().applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });
      volumeSeriesRef.current = volume;

      if (candleData.length > 0) {
        const volumeData = candleData
          .filter(d => d.volume)
          .map(d => ({
            time: d.time,
            value: d.volume!,
            color: d.close >= d.open ? '#10b98140' : '#ef444440',
          }));
        volume.setData(volumeData as any);
      }
    } else if (!showVolume && volumeSeriesRef.current) {
      chartRef.current.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }
  }, [showVolume, candleData]);

  if (error) {
    return (
      <Card className="glass p-6">
        <div className="h-[600px] flex items-center justify-center text-red-500">
          {error}
        </div>
      </Card>
    );
  }

  // Calculate stats safely
  const stats = candleData && candleData.length > 0 ? {
    current: candleData[candleData.length - 1]?.close || 0,
    change: candleData.length > 1
      ? ((candleData[candleData.length - 1].close - candleData[0].open) / candleData[0].open) * 100
      : 0,
    high: Math.max(...candleData.map(d => d.high)),
    low: Math.min(...candleData.map(d => d.low)),
  } : null;

  return (
    <Card className="glass p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Select
            value={urlSymbol}
            onValueChange={(newSymbol) => navigate(`/analytics/${newSymbol}`)}
            disabled={loading}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BTC_USDT">BTC/USDT</SelectItem>
              <SelectItem value="ETH_USDT">ETH/USDT</SelectItem>
              <SelectItem value="BNB_USDT">BNB/USDT</SelectItem>
            </SelectContent>
          </Select>

          {stats && (
            <>
              <div>
                <span className="text-2xl font-bold">
                  ${stats.current.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <Badge variant={stats.change >= 0 ? 'default' : 'destructive'} className="ml-2">
                  {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                <div>H: ${stats.high.toLocaleString()}</div>
                <div>L: ${stats.low.toLocaleString()}</div>
              </div>
            </>
          )}

          {ohlcData && (
            <div className="ml-4 p-2 bg-muted/30 rounded text-xs space-y-0.5">
              <div className="font-semibold text-muted-foreground">{ohlcData.time}</div>
              <div className="flex gap-4">
                <span>O: <span className="font-mono">{ohlcData.open.toFixed(2)}</span></span>
                <span>H: <span className="font-mono text-green-500">{ohlcData.high.toFixed(2)}</span></span>
                <span>L: <span className="font-mono text-red-500">{ohlcData.low.toFixed(2)}</span></span>
                <span className={ohlcData.close >= ohlcData.open ? 'text-green-500' : 'text-red-500'}>
                  C: <span className="font-mono font-bold">{ohlcData.close.toFixed(2)}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Switch id="vol" checked={showVolume} onCheckedChange={setShowVolume} />
            <Label htmlFor="vol" className="text-sm cursor-pointer">Volume</Label>
          </div>
        </div>
      </div>

      {/* Chart Container - always mounted */}
      <div className="relative">
        <div ref={chartContainerRef} style={{ minHeight: '600px', width: '100%' }} />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-[#0a0e27]/90 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Loading {symbol}...</p>
            </div>
          </div>
        )}
      </div>

      {/* Indicators - only show when we have valid data */}
      {indicators && !loading && candleData.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
          {typeof indicators.rsi === 'number' && !isNaN(indicators.rsi) && (
            <div>
              <span className="text-xs text-muted-foreground">RSI:</span>
              <span className={`ml-2 text-sm font-bold ${indicators.rsi > 70 ? 'text-red-500' : indicators.rsi < 30 ? 'text-green-500' : 'text-yellow-500'
                }`}>
                {indicators.rsi.toFixed(2)}
              </span>
            </div>
          )}
          {indicators.macd && typeof indicators.macd.macd === 'number' && !isNaN(indicators.macd.macd) && (
            <div>
              <span className="text-xs text-muted-foreground">MACD:</span>
              <span className="ml-2 text-sm font-bold">{indicators.macd.macd.toFixed(2)}</span>
            </div>
          )}
          {indicators.bollinger_bands && typeof indicators.bollinger_bands.middle === 'number' && !isNaN(indicators.bollinger_bands.middle) && (
            <div>
              <span className="text-xs text-muted-foreground">BB:</span>
              <span className="ml-2 text-sm font-bold">${indicators.bollinger_bands.middle.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// Keep old name export for compatibility
export { ProfessionalCandleChart as ProfessionalCandlestickChart };
