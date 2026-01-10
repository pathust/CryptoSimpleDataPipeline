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
