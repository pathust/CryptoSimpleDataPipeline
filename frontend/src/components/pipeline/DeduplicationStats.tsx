import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getDeduplicationStats } from "@/lib/api-client";

export function DeduplicationStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDeduplicationStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load deduplication stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <Card className="glass p-4">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Deduplication Stats</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="glass p-4">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Deduplication Stats</h3>
        <p className="text-sm text-muted-foreground">No data available</p>
      </Card>
    );
  }

  return (
    <Card className="glass p-4">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Deduplication Stats</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Processed</span>
          <span className="text-lg font-bold text-foreground">{stats.totalProcessed?.toLocaleString() || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Unique Records</span>
          <span className="text-lg font-bold text-green-500">{stats.uniqueRecords?.toLocaleString() || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Duplicates Removed</span>
          <span className="text-lg font-bold text-red-500">{stats.duplicatesRemoved?.toLocaleString() || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Deduplication Rate</span>
          <span className="text-lg font-bold text-primary">
            {stats.deduplicationRate ? Number(stats.deduplicationRate).toFixed(2) : '0.00'}%
          </span>
        </div>
      </div>
    </Card>
  );
}
