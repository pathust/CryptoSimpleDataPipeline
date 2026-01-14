import json
import os
from datetime import datetime

CONFIG_FILE = "scheduler_config.json"

class SchedulerConfig:
    def __init__(self):
        self.config_path = CONFIG_FILE
        self.load_config()
    
    def load_config(self):
        """Load configuration from JSON file."""
        if os.path.exists(self.config_path):
            with open(self.config_path, 'r') as f:
                self.config = json.load(f)
        else:
            # Default configuration
            self.config = {
                "interval_seconds": 60,
                "enabled": True,
                "last_updated": datetime.now().isoformat()
            }
            self.save_config()
    
    def save_config(self):
        """Save configuration to JSON file."""
        self.config["last_updated"] = datetime.now().isoformat()
        with open(self.config_path, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def get_interval(self):
        """Get current interval in seconds."""
        return self.config.get("interval_seconds", 60)
    
    def set_interval(self, seconds):
        """Set new interval (in seconds)."""
        if seconds < 10:
            seconds = 10  # Minimum 10 seconds
        self.config["interval_seconds"] = seconds
        self.save_config()
        return True
    
    def is_enabled(self):
        """Check if scheduler is enabled."""
        return self.config.get("enabled", True)
    
    def set_enabled(self, enabled):
        """Enable or disable scheduler."""
        self.config["enabled"] = enabled
        self.save_config()
        return True
    
    def get_config(self):
        """Get full configuration."""
        return self.config.copy()
    
    def update_config(self, updates):
        """Update configuration with new values."""
        if "interval_seconds" in updates:
            self.set_interval(updates["interval_seconds"])
        if "enabled" in updates:
            self.set_enabled(updates["enabled"])
        return self.get_config()
    
    def get_all_jobs(self):
        """Get all scheduled jobs with their status."""
        from datetime import datetime, timedelta
        
        now = datetime.now()
        
        # Calculate next run time for pipeline job
        pipeline_next_run = None
        pipeline_should_run = False
        last_run_str = self.config.get("last_pipeline_run")
        if last_run_str:
            try:
                last_run = datetime.fromisoformat(last_run_str)
                interval_seconds = self.get_interval()
                next_run = last_run + timedelta(seconds=interval_seconds)
                
                # Check if overdue
                if next_run < now:
                    pipeline_should_run = True
                    # Show that it's overdue
                    pipeline_next_run = now.isoformat()
                else:
                    pipeline_next_run = next_run.isoformat()
            except:
                pipeline_next_run = None
        
        # Calculate next run for maintenance job
        maintenance_interval = self.config.get("maintenance_interval_seconds", 86400)  # Default 1 day
        maintenance_next_run = None
        maintenance_should_run = False
        last_maintenance_str = self.config.get("last_maintenance_run")
        if last_maintenance_str:
            try:
                last_run = datetime.fromisoformat(last_maintenance_str)
                next_run = last_run + timedelta(seconds=maintenance_interval)
                
                # Check if overdue
                if next_run < now:
                    maintenance_should_run = True
                    maintenance_next_run = now.isoformat()
                else:
                    maintenance_next_run = next_run.isoformat()
            except:
                maintenance_next_run = None
        
        # Calculate next run for retention cleanup job
        retention_interval = self.config.get("retention_interval_seconds", 86400)  # Default 1 day
        retention_next_run = None
        retention_should_run = False
        last_retention_str = self.config.get("last_retention_cleanup_run")
        if last_retention_str:
            try:
                last_run = datetime.fromisoformat(last_retention_str)
                next_run = last_run + timedelta(seconds=retention_interval)
                
                # Check if overdue
                if next_run < now:
                    retention_should_run = True
                    retention_next_run = now.isoformat()
                else:
                    retention_next_run = next_run.isoformat()
            except:
                retention_next_run = None
        
        jobs = [
            {
                "id": "pipeline_job",
                "name": "Data Pipeline",
                "description": "Extract and transform crypto data from Binance API",
                "interval": f"{self.get_interval()}s",
                "enabled": self.is_enabled(),
                "status": "overdue" if pipeline_should_run else "idle",
                "lastRun": self.config.get("last_pipeline_run"),
                "nextRun": pipeline_next_run,
                "shouldAutoRun": pipeline_should_run
            },
            {
                "id": "maintenance_job",
                "name": "Periodic Maintenance",
                "description": "Archive old files, cleanup data",
                "interval": f"{maintenance_interval}s",
                "enabled": True,
                "status": "overdue" if maintenance_should_run else "idle",
                "lastRun": self.config.get("last_maintenance_run"),
                "nextRun": maintenance_next_run,
                "shouldAutoRun": maintenance_should_run
            },
            {
                "id": "retention_cleanup_job",
                "name": "Data Lake Cleanup",
                "description": "Remove old data from MinIO data lake based on retention policy",
                "interval": f"{retention_interval}s",
                "enabled": True,
                "status": "overdue" if retention_should_run else "idle",
                "lastRun": self.config.get("last_retention_cleanup_run"),
                "nextRun": retention_next_run,
                "shouldAutoRun": retention_should_run
            }
        ]
        return jobs
    
    def update_job(self, job_id, updates):
        """Update specific job configuration."""
        if job_id == "pipeline_job":
            if "interval" in updates:
                # Convert interval string to seconds
                # Supports: "30s" (seconds), "5m" (minutes), "1h" (hours)
                interval_str = updates["interval"]
                if interval_str.endswith('s'):
                    seconds = int(interval_str[:-1])
                elif interval_str.endswith('m'):
                    seconds = int(interval_str[:-1]) * 60
                elif interval_str.endswith('h'):
                    seconds = int(interval_str[:-1]) * 3600
                elif interval_str.endswith('d'):
                    seconds = int(interval_str[:-1]) * 86400
                else:
                    # Default: treat as seconds if no unit
                    seconds = int(interval_str)
                self.set_interval(seconds)
            if "enabled" in updates:
                self.set_enabled(updates["enabled"])
            return True
        elif job_id == "maintenance_job":
            if "interval" in updates:
                # Parse maintenance interval
                interval_str = updates["interval"]
                if interval_str.endswith('s'):
                    seconds = int(interval_str[:-1])
                elif interval_str.endswith('m'):
                    seconds = int(interval_str[:-1]) * 60
                elif interval_str.endswith('h'):
                    seconds = int(interval_str[:-1]) * 3600
                elif interval_str.endswith('d'):
                    seconds = int(interval_str[:-1]) * 86400
                else:
                    seconds = int(interval_str)
                self.config["maintenance_interval_seconds"] = seconds
                self.save_config()
            return True
        elif job_id == "retention_cleanup_job":
            if "interval" in updates:
                # Parse retention interval
                interval_str = updates["interval"]
                if interval_str.endswith('s'):
                    seconds = int(interval_str[:-1])
                elif interval_str.endswith('m'):
                    seconds = int(interval_str[:-1]) * 60
                elif interval_str.endswith('h'):
                    seconds = int(interval_str[:-1]) * 3600
                elif interval_str.endswith('d'):
                    seconds = int(interval_str[:-1]) * 86400
                else:
                    seconds = int(interval_str)
                self.config["retention_interval_seconds"] = seconds
                self.save_config()
            return True
        return False
    
    def mark_job_run(self, job_id):
        """Mark a job as having been run."""
        if job_id == "pipeline_job":
            self.config["last_pipeline_run"] = datetime.now().isoformat()
        elif job_id == "maintenance_job":
            self.config["last_maintenance_run"] = datetime.now().isoformat()
        elif job_id == "retention_cleanup_job":
            self.config["last_retention_cleanup_run"] = datetime.now().isoformat()
        self.save_config()
        return True
