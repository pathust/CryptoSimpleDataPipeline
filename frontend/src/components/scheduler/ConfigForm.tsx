import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSymbols, updateSymbols } from "@/lib/api-client";
import { toast } from "sonner";

export function ConfigForm() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symbolInput, setSymbolInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSymbols();
  }, []);

  const loadSymbols = async () => {
    try {
      const data = await getSymbols();
      setSymbols(data.symbols || []);
    } catch (error) {
      console.error("Failed to load symbols:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSymbol = async () => {
    if (!symbolInput.trim()) return;
    
    const newSymbols = [...symbols, symbolInput.trim().toUpperCase()];
    try {
      await updateSymbols(newSymbols);
      setSymbols(newSymbols);
      setSymbolInput("");
      toast.success("Symbol added");
    } catch (error) {
      toast.error("Failed to add symbol");
    }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    const newSymbols = symbols.filter(s => s !== symbol);
    try {
      await updateSymbols(newSymbols);
      setSymbols(newSymbols);
      toast.success("Symbol removed");
    } catch (error) {
      toast.error("Failed to remove symbol");
    }
  };

  if (loading) {
    return (
      <Card className="glass p-4">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Configuration</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass p-4">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Configuration</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="symbols" className="text-sm text-muted-foreground">Tracked Symbols</Label>
          <div className="flex gap-2 flex-wrap mt-2">
            {symbols.map((symbol) => (
              <div key={symbol} className="flex items-center gap-1 px-2 py-1 bg-primary/20 rounded text-xs">
                <span>{symbol}</span>
                <button
                  onClick={() => handleRemoveSymbol(symbol)}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Add symbol (e.g., BTCUSDT)"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddSymbol()}
          />
          <Button onClick={handleAddSymbol} size="sm">Add</Button>
        </div>

        <div className="text-xs text-muted-foreground pt-4 border-t border-border/50">
          <p>💡 Tip: Use manual trigger via /api/trigger to run pipeline</p>
        </div>
      </div>
    </Card>
  );
}
