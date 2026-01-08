import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Database, GitBranch, HardDrive, DollarSign } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PipelineFlow } from "@/components/dashboard/PipelineFlow";
import { getDashboardMetrics } from "@/lib/api-client";

export default function Dashboard() {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [metricsData, setMetricsData] = useState<any>(null);
  
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await getDashboardMetrics();
        setMetricsData(data);
      } catch (error) {
        console.error("Failed to load metrics:", error);
      }
    };
    loadMetrics();
  }, [refreshKey]);

  if (!metricsData) {
    return <div>Loading...</div>;
  }

  const metrics = [
    {
      title: "Total Ingested Data",
      ...metricsData.totalIngested,
      icon: Database,
      formatValue: (v: number) => v >= 1000000 ? (v / 1000000).toFixed(2) + "M" : v.toLocaleString(),
    },
    {
      title: "Active Pipelines",
      ...metricsData.activePipelines,
      icon: GitBranch,
      formatValue: (v: number) => v.toString(),
    },
    {
      title: "Warehouse Storage",
      ...metricsData.warehouseStorage,
      icon: HardDrive,
      formatValue: (v: number) => v.toFixed(3) + " GB",
    },
    {
      title: "24h Volume",
      ...metricsData.volume24h,
      icon: DollarSign,
      formatValue: (v: number) => "$" + (v >= 1000000000 ? (v / 1000000000).toFixed(2) + "B" : (v / 1000000).toFixed(2) + "M"),
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Real-time overview of your data pipeline</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <MetricCard
              title={metric.title}
              value={metric.value}
              unit={metric.unit}
              change={metric.change}
              icon={metric.icon}
              refreshKey={refreshKey}
              formatValue={metric.formatValue}
            />
          </motion.div>
        ))}
      </div>

      <PipelineFlow />
    </div>
  );
}
