import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { JobCard } from "@/components/scheduler/JobCard";
import { ConfigForm } from "@/components/scheduler/ConfigForm";
import { getSchedulerJobs, updateSchedulerJob, runSchedulerJob } from "@/lib/api-client";
import { toast } from "sonner";

export default function Scheduler() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();

    // Poll jobs every 5 seconds to check for overdue jobs
    const interval = setInterval(async () => {
      try {
        const data = await getSchedulerJobs();
        setJobs(data);

        // Auto-run overdue jobs
        for (const job of data) {
          if (job.shouldAutoRun && job.enabled) {
            console.log(`Auto-running overdue job: ${job.id}`);
            await runSchedulerJob(job.id);
            // Reload to get updated lastRun and nextRun
            await loadJobs();
            break; // Only run one at a time
          }
        }
      } catch (error) {
        console.error("Failed to poll jobs:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      const data = await getSchedulerJobs();
      setJobs(data);
    } catch (error) {
      console.error("Failed to load jobs:", error);
      toast.error("Failed to load scheduler jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await updateSchedulerJob(id, { enabled });
      setJobs((prev: any) =>
        prev.map((job: any) =>
          job.id === id ? { ...job, enabled, status: enabled ? "idle" : "disabled" } : job
        )
      );
      toast.success(`Job ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      toast.error("Failed to update job");
    }
  };

  const handleIntervalChange = async (id: string, interval: string) => {
    try {
      await updateSchedulerJob(id, { interval });
      setJobs((prev: any) =>
        prev.map((job: any) => (job.id === id ? { ...job, interval } : job))
      );
      toast.success(`Interval updated to ${interval}`);
      // Reload jobs to get persisted value from backend
      await loadJobs();
    } catch (error) {
      toast.error("Failed to update interval");
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      setJobs((prev: any) =>
        prev.map((job: any) =>
          job.id === id ? { ...job, status: "running", lastRun: new Date().toISOString() } : job
        )
      );

      await runSchedulerJob(id);
      toast.success("Job triggered successfully!");

      setTimeout(() => {
        setJobs((prev: any) =>
          prev.map((job: any) => (job.id === id ? { ...job, status: "idle" } : job))
        );
      }, 2000);
    } catch (error) {
      toast.error("Failed to trigger job");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Scheduler Control Center</h1>
        <p className="text-muted-foreground">Manage jobs, intervals, and automation settings</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {jobs.map((job: any, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <JobCard
                job={job}
                onToggle={handleToggle}
                onIntervalChange={handleIntervalChange}
                onRunNow={handleRunNow}
              />
            </motion.div>
          ))}
        </div>

        <div>
          <ConfigForm />
        </div>
      </div>
    </div>
  );
}
