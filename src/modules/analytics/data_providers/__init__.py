"""
Analytics data providers package.

This package provides a modular system for analytics data providers.
Each provider implements the DataProvider interface and can be easily
registered and accessed through the DataProviderRegistry.
"""

from .base import DataProvider
from .registry import DataProviderRegistry
from .candlestick import CandlestickProvider
from .volume import VolumeProvider
from .rsi import RSIProvider
from .macd import MACDProvider
from .bollinger import BollingerProvider
from .orderbook import OrderBookProvider

__all__ = [
    'DataProvider',
    'DataProviderRegistry',
    'CandlestickProvider',
    'VolumeProvider',
    'RSIProvider',
    'MACDProvider',
    'BollingerProvider',
    'OrderBookProvider',
]
