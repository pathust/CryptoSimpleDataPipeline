"""
Data provider registry for analytics.

This module provides a central registry for all analytics data providers,
making it easy to add new providers and access them via a unified interface.
"""

from .candlestick import CandlestickProvider
from .volume import VolumeProvider
from .rsi import RSIProvider
from .macd import MACDProvider
from .bollinger import BollingerProvider
from .schema_debug import SchemaDebugProvider
from .correlation import CorrelationProvider
from .atr import ATRProvider
from .volume_profile import VolumeProfileProvider
from .price_distribution import PriceDistributionProvider
from .return_distribution import ReturnDistributionProvider

from .orderbook import OrderBookProvider
class DataProviderRegistry:
    """Central registry for all analytics data providers."""
    
    _providers = {}
    
    @classmethod
    def register(cls, name: str, provider_class):
        """
        Register a data provider.
        
        Args:
            name: Provider identifier (used in API endpoints)
            provider_class: Provider class (will be instantiated)
        """
        cls._providers[name] = provider_class()
        print(f"✓ Registered data provider: {name}")
    
    @classmethod
    def get(cls, name: str):
        """
        Get a registered provider by name.
        
        Args:
            name: Provider identifier
            
        Returns:
            Provider instance or None if not found
        """
        return cls._providers.get(name)
    
    @classmethod
    def list_providers(cls):
        """
        List all registered providers with their metadata.
        
        Returns:
            Dictionary of {provider_name: metadata}
        """
        return {
            name: provider.get_metadata()
            for name, provider in cls._providers.items()
        }
    
    @classmethod
    def get_all_providers(cls):
        """
        Get all registered providers.
        
        Returns:
            Dictionary of {provider_name: provider_instance}
        """
        return cls._providers.copy()


# Auto-register all providers
DataProviderRegistry.register('candlestick', CandlestickProvider)
DataProviderRegistry.register('volume', VolumeProvider)
DataProviderRegistry.register('rsi', RSIProvider)
DataProviderRegistry.register('macd', MACDProvider)
DataProviderRegistry.register('bollinger', BollingerProvider)
DataProviderRegistry.register('schema_debug', SchemaDebugProvider)
DataProviderRegistry.register('correlation', CorrelationProvider)
DataProviderRegistry.register('atr', ATRProvider)
DataProviderRegistry.register('volume_profile', VolumeProfileProvider)
DataProviderRegistry.register('price_distribution', PriceDistributionProvider)
DataProviderRegistry.register('return_distribution', ReturnDistributionProvider)
DataProviderRegistry.register('orderbook', OrderBookProvider)
