"""
MACD (Moving Average Convergence Divergence) data provider.
"""

import pandas as pd
import numpy as np
from .base import DataProvider


class MACDProvider(DataProvider):
    """Provider for MACD indicator data."""
    
    def get_data(self, symbol: str, **params):
        """
        Get MACD indicator data.
        
        Args:
            symbol: Trading pair symbol
            fast_period: Fast EMA period (default: 12)
            slow_period: Slow EMA period (default: 26)
            signal_period: Signal line period (default: 9)
            limit: Number of data points (default: 200)
            
        Returns:
            List of MACD data points with time, macd, signal, histogram
        """
        fast_period = params.get('fast_period', 12)
        slow_period = params.get('slow_period', 26)
        signal_period = params.get('signal_period', 9)
        limit = params.get('limit', 200)
        
        # Normalize symbol format (BTC_USDT -> BTCUSDT)
        symbol = symbol.replace('_', '')
        
        print(f"🔍 MACD Provider: Processing symbol='{symbol}' with params={params}")
        
        try:
            conn = self._get_connection()
            
            # Fetch more data than needed for calculation
            fetch_limit = limit + slow_period + signal_period + 50
            query = """
            SELECT 
                open_time,
                close_price
            FROM fact_klines
            WHERE symbol = %s AND interval_code = '1m'
            ORDER BY open_time DESC
            LIMIT %s
            """
            
            print(f"🔄 MACD Provider: Executing query with limit={fetch_limit}")
            df = pd.read_sql(query, conn, params=(symbol, fetch_limit))
            conn.close()
            
            print(f"📊 MACD Provider: Retrieved {len(df)} rows from database")
            
            if df.empty or len(df) < slow_period + signal_period:
                print(f"❌ MACD Provider: Insufficient data (need {slow_period + signal_period}, got {len(df)})")
                return []
            
            # Reverse to get chronological order
            df = df.iloc[::-1]
            
            # Calculate EMAs
            prices = df['close_price'].values
            print(f"💰 MACD Provider: Calculating EMAs for {len(prices)} price points")
            
            # Fast EMA
            ema_fast = self._calculate_ema(prices, fast_period)
            
            # Slow EMA
            ema_slow = self._calculate_ema(prices, slow_period)
            
            # MACD line
            macd_line = ema_fast - ema_slow
            
            # Signal line (EMA of MACD) - ensure proper indexing
            macd_for_signal = macd_line[slow_period-1:]  # Start from where slow EMA is valid
            signal_line = self._calculate_ema(macd_for_signal, signal_period)
            
            # Histogram - ensure arrays have same length
            macd_for_histogram = macd_line[slow_period + signal_period - 2:]  # Adjusted index
            if len(macd_for_histogram) != len(signal_line):
                # Trim to match lengths
                min_len = min(len(macd_for_histogram), len(signal_line))
                macd_for_histogram = macd_for_histogram[:min_len]
                signal_line = signal_line[:min_len]
            
            histogram = macd_for_histogram - signal_line
            
            print(f"📈 MACD Provider: Calculated {len(histogram)} MACD points")
            
            # Prepare result
            result = []
            start_idx = slow_period + signal_period - 2  # Adjusted to match new indexing
            for i in range(len(histogram)):
                idx = start_idx + i
                if idx < len(df):
                    open_time_utc = df.iloc[idx]['open_time'].replace(tzinfo=None).isoformat() + 'Z'
                    result.append({
                        'time': open_time_utc,
                        'macd': round(float(macd_for_histogram[i]), 8),
                        'signal': round(float(signal_line[i]), 8),
                        'histogram': round(float(histogram[i]), 8)
                    })
            
            # Return only requested limit
            final_result = result[-limit:]
            print(f"✅ MACD Provider: Returning {len(final_result)} data points")
            
            # Log sample data
            if len(final_result) > 0:
                print(f"🔍 MACD Provider: Sample data point: {final_result[0]}")
            
            return final_result
            
        except Exception as e:
            print(f"❌ Error calculating MACD: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _calculate_ema(self, data, period):
        """Calculate Exponential Moving Average."""
        ema = np.zeros(len(data))
        multiplier = 2 / (period + 1)
        
        # Start with SMA
        ema[period - 1] = np.mean(data[:period])
        
        # Calculate EMA
        for i in range(period, len(data)):
            ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1]
        
        return ema
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'MACD',
            'description': 'Moving Average Convergence Divergence - trend indicator',
            'parameters': {
                'fast_period': {
                    'type': 'integer',
                    'default': 12,
                    'description': 'Fast EMA period'
                },
                'slow_period': {
                    'type': 'integer',
                    'default': 26,
                    'description': 'Slow EMA period'
                },
                'signal_period': {
                    'type': 'integer',
                    'default': 9,
                    'description': 'Signal line period'
                },
                'limit': {
                    'type': 'integer',
                    'default': 200,
                    'description': 'Number of data points'
                }
            },
            'data_format': 'Array of {time, macd, signal, histogram}'
        }
