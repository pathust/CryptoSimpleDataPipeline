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
