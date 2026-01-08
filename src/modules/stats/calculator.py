import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class StatsCalculator:
    
    @staticmethod
    def calculate_rsi(prices, period=14):
        """Calculate Relative Strength Index."""
        if len(prices) < period:
            return None
        
        deltas = np.diff(prices)
        seed = deltas[:period]
        up = seed[seed >= 0].sum() / period
        down = -seed[seed < 0].sum() / period
        
        if down == 0:
            return 100
        
        rs = up / down
        rsi = 100 - (100 / (1 + rs))
        return round(rsi, 2)
    
    @staticmethod
    def calculate_macd(prices, fast=12, slow=26, signal=9):
        """Calculate MACD (Moving Average Convergence Divergence)."""
        if len(prices) < slow:
            return None, None, None
        
        prices_series = pd.Series(prices)
        ema_fast = prices_series.ewm(span=fast, adjust=False).mean()
        ema_slow = prices_series.ewm(span=slow, adjust=False).mean()
        
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        histogram = macd_line - signal_line
        
        return (
            round(macd_line.iloc[-1], 4),
            round(signal_line.iloc[-1], 4),
            round(histogram.iloc[-1], 4)
        )
    
    @staticmethod
    def calculate_bollinger_bands(prices, period=20, std_dev=2):
        """Calculate Bollinger Bands."""
        if len(prices) < period:
            return None, None, None
        
        prices_series = pd.Series(prices)
        sma = prices_series.rolling(window=period).mean()
        std = prices_series.rolling(window=period).std()
        
        upper_band = sma + (std * std_dev)
        lower_band = sma - (std * std_dev)
        
        return (
            round(upper_band.iloc[-1], 2),
            round(sma.iloc[-1], 2),
            round(lower_band.iloc[-1], 2)
        )
    
    @staticmethod
    def calculate_moving_averages(prices, periods=[5, 20, 50]):
        """Calculate multiple moving averages."""
        result = {}
        prices_series = pd.Series(prices)
        
        for period in periods:
            if len(prices) >= period:
                ma = prices_series.rolling(window=period).mean().iloc[-1]
                result[f'MA{period}'] = round(ma, 2)
        
        return result
    
    @staticmethod
    def calculate_price_change(current, previous):
        """Calculate price change percentage."""
        if previous == 0:
            return 0
        change = ((current - previous) / previous) * 100
        return round(change, 2)
    
    @staticmethod
    def calculate_volatility(prices, period=20):
        """Calculate price volatility (standard deviation)."""
        if len(prices) < period:
            return None
        
        prices_series = pd.Series(prices)
        volatility = prices_series.rolling(window=period).std().iloc[-1]
        return round(volatility, 4)
