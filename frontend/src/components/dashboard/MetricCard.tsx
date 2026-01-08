import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useFlashAnimation } from "@/hooks/useFlashAnimation";

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  change: number;
  icon: LucideIcon;
  refreshKey: number;
  formatValue?: (value: number) => string;
}

export function MetricCard({
  title,
  value,
  unit,
  change,
  icon: Icon,
  refreshKey,
  formatValue = (v) => v.toLocaleString(),
}: MetricCardProps) {
  const isFlashing = useFlashAnimation(value, refreshKey);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`glass p-5 transition-all duration-300 ${isFlashing ? "ring-1 ring-primary/50" : ""}`}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <motion.div
              className={`transition-colors rounded-md ${isFlashing ? "bg-primary/10" : ""}`}
              animate={isFlashing ? { scale: [1, 1.02, 1] } : {}}
            >
              <p className="text-2xl font-bold text-foreground">
                {formatValue(value)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{unit}</p>
            </motion.div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            {change !== 0 && (
              <div className={`flex items-center gap-1 text-xs ${change > 0 ? "text-primary" : "text-destructive"}`}>
                {change > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(change).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
