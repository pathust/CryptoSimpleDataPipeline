import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Job {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  interval: string;
  lastRun: string;
  nextRun: string | null;
  status: string;
}

interface JobCardProps {
  job: Job;
  onToggle: (id: string, enabled: boolean) => void;
  onIntervalChange: (id: string, interval: string) => void;
  onRunNow: (id: string) => void;
}

const statusConfig = {
  running: { icon: Play, color: "text-primary", bg: "bg-primary/10", label: "Running" },
  idle: { icon: CheckCircle, color: "text-muted-foreground", bg: "bg-muted/30", label: "Idle" },
  disabled: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted/30", label: "Disabled" },
  error: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Error" },
};

export function JobCard({ job, onToggle, onIntervalChange, onRunNow }: JobCardProps) {
  const [isRunning, setIsRunning] = useState(false);
  const config = statusConfig[job.status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  const handleRunNow = () => {
    setIsRunning(true);
    onRunNow(job.id);
    setTimeout(() => setIsRunning(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`glass p-4 transition-all duration-300 ${job.enabled ? "" : "opacity-60"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                className={`p-2 rounded-lg ${config.bg}`}
                animate={job.status === "running" ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: job.status === "running" ? Infinity : 0 }}
              >
                <StatusIcon className={`h-4 w-4 ${config.color}`} />
              </motion.div>
              <div>
                <h3 className="font-semibold text-foreground">{job.name}</h3>
                <p className="text-xs text-muted-foreground">{job.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Last: {new Date(job.lastRun).toLocaleString()}
                </span>
              </div>
              {job.nextRun && (
                <Badge variant="outline" className="text-xs">
                  Next: {new Date(job.nextRun).toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <Switch
              checked={job.enabled}
              onCheckedChange={(checked) => onToggle(job.id, checked)}
            />

            <div className="flex items-center gap-2">
              <Select
                value={job.interval}
                onValueChange={(value) => onIntervalChange(job.id, value)}
                disabled={!job.enabled}
              >
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1m</SelectItem>
                  <SelectItem value="5m">5m</SelectItem>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="1d">1d</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRunNow}
                disabled={!job.enabled || isRunning}
                className="text-xs h-8"
              >
                {isRunning ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Play className="h-3 w-3" />
                  </motion.div>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Run Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
