import { Card } from "@/components/ui/card";
import { ArrowRight, Database, Repeat, LineChart } from "lucide-react";
import { motion } from "framer-motion";

export function PipelineFlow() {
  const stages = [
    {
      icon: Database,
      label: "Extract",
      description: "Binance API",
      color: "text-blue-500"
    },
    {
      icon: Repeat,
      label: "Transform",
      description: "Deduplication",
      color: "text-purple-500"
    },
    {
      icon: LineChart,
      label: "Load",
      description: "MySQL Warehouse",
      color: "text-green-500"
    }
  ];

  return (
    <Card className="glass p-6">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Pipeline Flow</h2>
      <div className="flex items-center justify-between gap-4">
        {stages.map((stage, index) => (
          <div key={stage.label} className="flex items-center gap-4 flex-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.2 }}
              className="flex flex-col items-center gap-2 flex-1"
            >
              <div className={`p-4 rounded-lg bg-card border border-border`}>
                <stage.icon className={`h-8 w-8 ${stage.color}`} />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">{stage.label}</p>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </div>
            </motion.div>
            {index < stages.length - 1 && (
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
