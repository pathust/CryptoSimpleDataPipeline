import { motion } from "framer-motion";
import { IngestionLogs } from "@/components/pipeline/IngestionLogs";
import { DeduplicationStats } from "@/components/pipeline/DeduplicationStats";
import { DataTable } from "@/components/pipeline/DataTable";
import { StorageHealth } from "@/components/pipeline/StorageHealth";

export default function Pipeline() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Data Pipeline & Explorer</h1>
        <p className="text-muted-foreground">Monitor ingestion, deduplication, and storage health</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IngestionLogs />
        </div>
        <div>
          <DeduplicationStats />
        </div>
      </div>

      <DataTable />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StorageHealth />
      </div>
    </div>
  );
}
