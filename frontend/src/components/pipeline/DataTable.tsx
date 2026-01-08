import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function DataTable() {
  return (
    <Card className="glass p-4">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Data Explorer</h3>
      <div className="text-sm text-muted-foreground text-center py-8">
        <p className="mb-2">📊 Data Explorer</p>
        <p>Use the Analytics page to explore candlestick data</p>
        <p className="text-xs mt-2">API: /api/analytics/candlestick/&lt;symbol&gt;</p>
      </div>
    </Card>
  );
}
