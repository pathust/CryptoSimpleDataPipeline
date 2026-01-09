import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LineChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProfessionalCandlestickChart } from "@/components/charts/ProfessionalCandlestickChart";
import { Statistics24h } from "@/components/analytics/Statistics24h";
import { Orderbook } from "@/components/analytics/Orderbook";

const VALID_SYMBOLS = ['BTC_USDT', 'ETH_USDT', 'BNB_USDT'];

export default function Analytics() {
  const { symbol } = useParams<{ symbol: string }>();
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);

  // Validate symbol and redirect if invalid
  if (!symbol || !VALID_SYMBOLS.includes(symbol)) {
    return <Navigate to="/analytics/BTC_USDT" replace />;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Market Analytics</h1>
        <p className="text-muted-foreground">Professional trading analysis and indicators</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {/* Indicator Toggles */}
          <Card className="glass p-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Indicators:</span>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="rsi"
                  checked={showRSI}
                  onCheckedChange={setShowRSI}
                />
                <Label htmlFor="rsi" className="text-sm text-muted-foreground cursor-pointer">
                  RSI
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="macd"
                  checked={showMACD}
                  onCheckedChange={setShowMACD}
                />
                <Label htmlFor="macd" className="text-sm text-muted-foreground cursor-pointer">
                  MACD
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="bollinger"
                  checked={showBollinger}
                  onCheckedChange={setShowBollinger}
                />
                <Label htmlFor="bollinger" className="text-sm text-muted-foreground cursor-pointer">
                  Bollinger Bands
                </Label>
              </div>
            </div>
          </Card>

          {/* Chart - key prop forces fresh mount on symbol change */}
          <ProfessionalCandlestickChart
            key={symbol}
            symbol={symbol}
            showRSI={showRSI}
            showMACD={showMACD}
            showBollinger={showBollinger}
          />
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <Statistics24h symbol={symbol} />
          <Orderbook symbol={symbol} />
        </div>
      </div>
    </div>
  );
}
