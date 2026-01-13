"""
Base class for analytics data providers.

All data providers should inherit from this class and implement
the get_data() and get_metadata() methods.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any
import mysql.connector
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
import src.config as config


class DataProvider(ABC):
    """Base class for analytics data providers."""
    
    def __init__(self):
        self.db_config = {
            'host': config.DB_HOST,
            'user': config.DB_USER,
            'password': config.DB_PASSWORD,
            'database': config.DB_NAME
        }
    
    def _get_connection(self):
        """Get database connection."""
        return mysql.connector.connect(**self.db_config)
    
    def _format_datetime_to_utc(self, dt):
        """
        Convert MySQL datetime (local timezone) to UTC ISO string.
        
        MySQL stores datetime in local timezone (UTC+7 for Vietnam).
        This method converts it to proper UTC before sending to frontend.
        
        Args:
            dt: datetime object from MySQL (naive, in local timezone)
            
        Returns:
            ISO format string in UTC with 'Z' suffix (e.g., "2026-01-13T07:00:00Z")
        """
        if dt is None:
            return None
        
        from datetime import timezone, timedelta
        
        # MySQL stores in local timezone (UTC+7)
        VN_TZ = timezone(timedelta(hours=7))
        
        # Mark the naive datetime as being in Vietnam timezone
        dt_local = dt.replace(tzinfo=VN_TZ)
        
        # Convert to UTC
        dt_utc = dt_local.astimezone(timezone.utc)
        
        # Format as ISO string with 'Z' suffix
        return dt_utc.isoformat().replace('+00:00', 'Z')

    
    @abstractmethod
    def get_data(self, symbol: str, **params) -> Dict[str, Any]:
        """
        Fetch data for the given symbol with optional parameters.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSDT')
            **params: Additional parameters specific to this provider
            
        Returns:
            Dictionary containing the data in a format suitable for visualization
        """
        pass
    
    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """
        Return metadata about this data provider.
        
        Returns:
            Dictionary with metadata including:
            - name: Provider name
            - description: What this provider does
            - parameters: List of supported parameters
            - data_format: Description of returned data structure
        """
        pass
