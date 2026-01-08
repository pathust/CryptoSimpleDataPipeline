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
        jobs = [
            {
                "id": "pipeline_job",
                "name": "Data Pipeline",
                "description": "Extract and transform crypto data from Binance API",
                "interval": f"{self.get_interval()}s",
                "enabled": self.is_enabled(),
                "status": "idle",
                "lastRun": self.config.get("last_pipeline_run"),
                "nextRun": None  # Can be calculated based on interval
            },
            {
                "id": "maintenance_job",
                "name": "Weekly Maintenance",
                "description": "Archive old files, cleanup data",
                "interval": "weekly",
                "enabled": True,
                "status": "idle",
                "lastRun": self.config.get("last_maintenance_run"),
                "nextRun": "Sunday 2:00 AM"
            }
        ]
        return jobs
    
    def update_job(self, job_id, updates):
        """Update specific job configuration."""
        if job_id == "pipeline_job":
            if "interval" in updates:
                # Convert interval string (e.g., "60s") to seconds
                interval_str = updates["interval"]
                seconds = int(interval_str.rstrip('s'))
                self.set_interval(seconds)
            if "enabled" in updates:
                self.set_enabled(updates["enabled"])
            return True
        return False
    
    def mark_job_run(self, job_id):
        """Mark a job as having been run."""
        if job_id == "pipeline_job":
            self.config["last_pipeline_run"] = datetime.now().isoformat()
        elif job_id == "maintenance_job":
            self.config["last_maintenance_run"] = datetime.now().isoformat()
        self.save_config()
        return True
