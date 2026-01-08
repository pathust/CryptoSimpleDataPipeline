import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getStorageHealth } from "@/lib/api-client";

export function StorageHealth() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const data = await getStorageHealth();
        setHealth(data);
      } catch (error) {
        console.error("Failed to load storage health:", error);
      } finally {
        setLoading(false);
      }
    };
    loadHealth();
  }, []);

  if (loading) {
    return (
      <Card className="glass p-4 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Storage Health</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card className="glass p-4 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Storage Health</h3>
        <p className="text-sm text-muted-foreground">No data available</p>
      </Card>
    );
  }

  return (
    <Card className="glass p-4 lg:col-span-2">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Storage Health</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Lake */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Data Lake</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Files</span>
              <span className="text-sm font-medium text-foreground">{health.dataLake?.totalFiles || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Active</span>
              <span className="text-sm font-medium text-green-500">{health.dataLake?.activeFiles || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Archived</span>
              <span className="text-sm font-medium text-muted-foreground">{health.dataLake?.archivedFiles || 0}</span>
            </div>
          </div>
        </div>

        {/* Warehouse */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Data Warehouse</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Size</span>
              <span className="text-sm font-medium text-foreground">{health.warehouse?.totalSizeMB?.toFixed(2) || 0} MB</span>
            </div>
            {health.warehouse?.tables?.map((table: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{table.name}</span>
                <span className="text-xs font-medium text-foreground">{table.rows?.toLocaleString() || 0} rows</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
