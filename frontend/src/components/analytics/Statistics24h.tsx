import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getStatistics } from "@/lib/api-client";

export function Statistics24h() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getStatistics("BTCUSDT");
        setStats(data);
      } catch (error) {
        console.error("Failed to load 24h statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <Card className="glass p-4">
        <h3 className="text-sm font-medium mb-4 text-foreground">24h Statistics</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!stats || stats.error) {
    return (
      <Card className="glass p-4">
        <h3 className="text-sm font-medium mb-4 text-foreground">24h Statistics</h3>
        <p className="text-xs text-muted-foreground">No data available</p>
      </Card>
    );
  }

  const isPositive = stats.change_24h && parseFloat(stats.change_24h) >= 0;

  return (
    <Card className="glass p-4">
      <h3 className="text-sm font-medium mb-4 text-foreground">24h Statistics</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Current Price</span>
          <span className="text-sm font-medium text-foreground">
            ${stats.current_price?.toLocaleString() || "N/A"}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">24h Change</span>
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{stats.change_24h || "N/A"}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">24h High</span>
          <span className="text-sm font-medium text-foreground">
            ${stats.high_24h?.toLocaleString() || "N/A"}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">24h Low</span>
          <span className="text-sm font-medium text-foreground">
            ${stats.low_24h?.toLocaleString() || "N/A"}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">24h Volume</span>
          <span className="text-sm font-medium text-foreground">
            {stats.volume_24h?.toLocaleString() || "N/A"}
          </span>
        </div>
      </div>
    </Card>
  );
}
