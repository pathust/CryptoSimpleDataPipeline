import { useEffect, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/card";
import { getCandlestickData, getIndicators } from "@/lib/api-client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CandlestickChartProps {
  showRSI: boolean;
  showMACD: boolean;
  showBollinger: boolean;
}

export function CandlestickChart({ showRSI, showMACD, showBollinger }: CandlestickChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any>(null);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Loading data for ${symbol}...`);
        const [candleData, indicatorData] = await Promise.all([
          getCandlestickData(symbol, 100),
          getIndicators(symbol)
        ]);
        
        console.log('Data loaded:', candleData?.length, 'candles');
        
        if (!candleData || candleData.length === 0) {
          setError("No candlestick data available");
          return;
        }

        // Process data for chart
        const processedData = candleData.map((item: any, index: number) => {
          const time = new Date(item.time);
          return {
            index,
            time: item.time,
            displayTime: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            open: Number(item.open),
            high: Number(item.high),
            low: Number(item.low),
            close: Number(item.close),
            volume: Number(item.volume || 0),
            isGreen: Number(item.close) >= Number(item.open),
            // For bar chart
            bodyStart: Math.min(Number(item.open), Number(item.close)),
            bodyHeight: Math.abs(Number(item.close) - Number(item.open)),
          };
        });
        
        setData(processedData);
        setIndicators(indicatorData);
        
      } catch (err: any) {
        console.error("Failed to load chart data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [symbol]);

  if (loading) {
    return (
      <Card className="glass p-6">
        <div className="h-[500px] flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-muted-foreground">Loading {symbol} chart...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <Card className="glass p-6">
        <div className="h-[500px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-500 mb-2">{error || "No data available"}</p>
            <p className="text-sm text-muted-foreground mb-4">
              Backend: http://localhost:5001
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      </Card>
    );
  }

  const stats = {
    current: data[data.length - 1]?.close || 0,
    change: data.length > 1 ? ((data[data.length - 1].close - data[0].open) / data[0].open) * 100 : 0,
    high: Math.max(...data.map(d => d.high)),
    low: Math.min(...data.map(d => d.low)),
  };

  return (
    <Card className="glass p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
              <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
              <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-4">
            <div>
              <span className="text-2xl font-bold text-foreground">
                ${stats.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <Badge 
                variant={stats.change >= 0 ? "default" : "destructive"}
                className="ml-2"
              >
                {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              <div>H: ${stats.high.toLocaleString()}</div>
              <div>L: ${stats.low.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Indicator badges */}
        <div className="flex gap-2">
          {showRSI && indicators?.rsi && (
            <Badge variant="outline" className="text-xs">
              RSI: {Number(indicators.rsi).toFixed(1)}
            </Badge>
          )}
          {showMACD && indicators?.macd && (
            <Badge variant="outline" className="text-xs">
              MACD: {Number(indicators.macd.macd).toFixed(2)}
            </Badge>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            
            <XAxis
              dataKey="displayTime"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              stroke="#1e293b"
              interval="preserveStartEnd"
            />
            
            <YAxis
              domain={['dataMin - 100', 'dataMax + 100']}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              stroke="#1e293b"
              tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: "#0a0e27",
                border: "1px solid #1e293b",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
              formatter={(value: any, name: string) => {
                if (name === "close") return [`$${Number(value).toFixed(2)}`, "Close"];
                if (name === "open") return [`$${Number(value).toFixed(2)}`, "Open"];
                if (name === "high") return [`$${Number(value).toFixed(2)}`, "High"];
                if (name === "low") return [`$${Number(value).toFixed(2)}`, "Low"];
                return [value, name];
              }}
            />

            {/* Candlestick bodies using bars */}
            <Bar dataKey="bodyStart" stackId="candle" fill="transparent">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isGreen ? "#10b981" : "#ef4444"} />
              ))}
            </Bar>
            
            <Bar dataKey="bodyHeight" stackId="candle">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isGreen ? "#10b981" : "#ef4444"} />
              ))}
            </Bar>

            {/* Close price line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#10b981"
              strokeWidth={1.5}
              dot={false}
              opacity={0.5}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Indicators info */}
      {(showRSI || showMACD) && indicators && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
          {showRSI && indicators.rsi && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">RSI (14)</span>
                <span className={`text-lg font-bold ${
                  indicators.rsi > 70 ? 'text-red-500' : indicators.rsi < 30 ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {Number(indicators.rsi).toFixed(2)}
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded-full">
                <div 
                  className={`absolute h-full rounded-full ${
                    indicators.rsi > 70 ? 'bg-red-500' : indicators.rsi < 30 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(indicators.rsi, 100)}%` }}
                />
              </div>
            </div>
          )}

          {showMACD && indicators.macd && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">MACD</span>
                <span className={`text-lg font-bold ${
                  indicators.macd.histogram > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {Number(indicators.macd.macd).toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-muted/30 rounded">
                  <div className="text-muted-foreground">MACD</div>
                  <div>{Number(indicators.macd.macd).toFixed(2)}</div>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <div className="text-muted-foreground">Signal</div>
                  <div>{Number(indicators.macd.signal).toFixed(2)}</div>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <div className="text-muted-foreground">Histogram</div>
                  <div>{Number(indicators.macd.histogram).toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
