import { RefreshCw } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Zap, Database } from "lucide-react";

interface TopbarProps {
  onRefresh: () => void;
  metrics: any;
}

export function Topbar({ onRefresh, metrics }: TopbarProps) {
  return (
    <header className="h-16 border-b border-border/50 glass-strong flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="h-8 w-px bg-border/50" />
        
        <h2 className="text-lg font-semibold text-foreground">CryptoFlow Dashboard</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">Total Records</p>
            <p className="text-sm font-medium text-foreground">
              {metrics?.totalIngested?.value?.toLocaleString() || '0'}
            </p>
          </div>
        </div>

        <Separator orientation="vertical" className="h-8" />

        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Active Pipelines</p>
            <p className="text-sm font-medium text-foreground">
              {metrics?.activePipelines?.value || '0'}
            </p>
          </div>
        </div>

        <Separator orientation="vertical" className="h-8" />

        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">Storage</p>
            <p className="text-sm font-medium text-foreground">
              {metrics?.warehouseStorage?.value?.toFixed(3) || '0.000'} GB
            </p>
          </div>
        </div>

        <Separator orientation="vertical" className="h-8" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          className="h-8 w-8"
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </Button>
      </div>
    </header>
  );
}
