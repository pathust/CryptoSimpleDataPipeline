import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getIngestionLogs } from "@/lib/api-client";

export function IngestionLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await getIngestionLogs(10, 0);
        setLogs(data.logs || []);
      } catch (error) {
        console.error("Failed to load ingestion logs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  if (loading) {
    return (
      <Card className="glass p-4">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Recent Ingestion Logs</h3>
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass p-4">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Recent Ingestion Logs</h3>
      <div className="space-y-2">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No logs available</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
              <div className="flex-1">
                <p className="font-medium text-foreground">{log.fileName}</p>
                <p className="text-muted-foreground">{log.symbol} • {log.dataType}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground">{log.recordCount} records</p>
                <p className="text-muted-foreground">{new Date(log.processedAt).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
