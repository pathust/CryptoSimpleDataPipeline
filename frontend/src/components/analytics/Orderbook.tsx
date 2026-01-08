import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getOrderbookSnapshot } from "@/lib/api-client";

export function Orderbook() {
  const [orderbook, setOrderbook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrderbook = async () => {
      try {
        const data = await getOrderbookSnapshot("BTCUSDT", 10);
        setOrderbook(data);
      } catch (error) {
        console.error("Failed to load orderbook:", error);
      } finally {
        setLoading(false);
      }
    };
    loadOrderbook();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadOrderbook, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading)  {
    return (
      <Card className="glass p-4">
        <h3 className="text-sm font-medium mb-4 text-foreground">Order Book</h3>
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 bg-muted rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!orderbook || (!orderbook.bids?.length && !orderbook.asks?.length)) {
    return (
      <Card className="glass p-4">
        <h3 className="text-sm font-medium mb-4 text-foreground">Order Book</h3>
        <p className="text-xs text-muted-foreground">No orderbook data</p>
      </Card>
    );
  }

  return (
    <Card className="glass p-4">
      <h3 className="text-sm font-medium mb-4 text-foreground">Order Book</h3>
      
      {/* Asks (Sell) */}
      <div className="space-y-1 mb-3">
        <p className="text-xs text-red-400 font-medium">Asks (Sell)</p>
        {orderbook.asks?.slice(0, 5).reverse().map((ask: any, i: number) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-red-400">${Number(ask.price).toLocaleString()}</span>
            <span className="text-muted-foreground">{Number(ask.quantity).toFixed(4)}</span>
          </div>
        ))}
      </div>
      
      {/* Spread */}
      <div className="border-t border-b border-border/50 py-2 mb-3">
        <div className=" text-xs text-center text-muted-foreground">
          Spread: {orderbook.asks?.[0] && orderbook.bids?.[0] 
            ? `$${(orderbook.asks[0].price - orderbook.bids[0].price).toFixed(2)}`
            : 'N/A'}
        </div>
      </div>
      
      {/* Bids (Buy) */}
      <div className="space-y-1">
        <p className="text-xs text-green-400 font-medium">Bids (Buy)</p>
        {orderbook.bids?.slice(0, 5).map((bid: any, i: number) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-green-400">${Number(bid.price).toLocaleString()}</span>
            <span className="text-muted-foreground">{Number(bid.quantity).toFixed(4)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
