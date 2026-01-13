"""
Volume Profile data provider.
Shows volume distribution across different price levels.
"""

import pandas as pd
import numpy as np
from .base import DataProvider


class VolumeProfileProvider(DataProvider):
    """Provider for Volume Profile data."""
    
    def get_data(self, symbol: str, **params):
        """
        Get Volume Profile data - volume distribution across price levels.
        
        Args:
            symbol: Trading pair symbol
            bins: Number of price bins (default: 20)
            limit: Number of candles to analyze (default: 200)
            interval: Time interval (default: '1m')
            
        Returns:
            List of volume profile data points with price_level and volume
        """
        bins = params.get('bins', 20)
        limit = params.get('limit', 200)
        interval = params.get('interval', '1m')
        
        multiplier = 1
        if interval.endswith('m'):
            multiplier = int(interval.replace('m', ''))
        elif interval.endswith('h'):
            multiplier = int(interval.replace('h', '')) * 60
        elif interval.endswith('d'):
            multiplier = int(interval.replace('d', '')) * 1440
            
        fetch_limit = limit * multiplier

        try:
            conn = self._get_connection()
            
            query = """
            SELECT 
                open_time,
                high_price,
                low_price,
                close_price,
                open_price,
                volume
            FROM fact_klines
            WHERE symbol = %s AND interval_code = '1m'
            ORDER BY open_time DESC
            LIMIT %s
            """
            
            df = pd.read_sql(query, conn, params=(symbol, fetch_limit))
            conn.close()
            
            if df.empty:
                return []

            for col in ['high_price', 'low_price', 'close_price', 'open_price', 'volume']:
                df[col] = df[col].astype(float)

            # Reverse to get chronological order
            df = df.iloc[::-1]
            
            # Calculate price range
            min_price = min(df['low_price'].min(), df['open_price'].min())
            max_price = max(df['high_price'].max(), df['close_price'].max())
            
            # Create price bins
            price_bins = np.linspace(min_price, max_price, bins + 1)
            bin_centers = (price_bins[:-1] + price_bins[1:]) / 2
            
            # Initialize volume for each bin
            volume_profile = np.zeros(len(bin_centers))
            
            # Distribute volume across price levels for each candle
            for _, row in df.iterrows():
                high = float(row['high_price'])
                low = float(row['low_price'])
                vol = float(row['volume'])
                
                # Find bins that this candle covers
                bin_indices = np.where((bin_centers >= low) & (bin_centers <= high))[0]
                
                if len(bin_indices) > 0:
                    # Distribute volume equally across covered bins
                    vol_per_bin = vol / len(bin_indices)
                    volume_profile[bin_indices] += vol_per_bin
            
            # Prepare result
            result = []
            total_volume = float(volume_profile.sum())
            
            for i, (price, vol) in enumerate(zip(bin_centers, volume_profile)):
                result.append({
                    'price_level': round(price, 2),
                    'volume': round(vol, 2),
                    'volume_percentage': round((vol / total_volume * 100) if total_volume > 0 else 0, 2),
                    'bin_index': i
                })
            
            # Sort by price level
            result.sort(key=lambda x: x['price_level'])
            
            # Find POC (Point of Control) - price level with highest volume
            poc_index = np.argmax(volume_profile)
            poc_price = round(bin_centers[poc_index], 2)
            poc_volume = round(float(volume_profile[poc_index]), 2)
            
            # Find value area (70% of volume) - prices containing 70% of total volume
            sorted_indices = np.argsort(volume_profile)[::-1]
            cumulative_volume = 0
            value_area_indices = []
            for idx in sorted_indices:
                cumulative_volume += volume_profile[idx]
                value_area_indices.append(int(idx))
                if cumulative_volume >= total_volume * 0.7:
                    break
            
            value_area_prices = [round(bin_centers[i], 2) for i in value_area_indices]
            value_area_min = round(min(value_area_prices), 2) if value_area_prices else poc_price
            value_area_max = round(max(value_area_prices), 2) if value_area_prices else poc_price
            
            return {
                'profile': result,
                'poc': {
                    'price': poc_price,
                    'volume': poc_volume
                },
                'value_area': {
                    'min': value_area_min,
                    'max': value_area_max
                },
                'total_volume': round(total_volume, 2)
            }
            
        except Exception as e:
            print(f"Error calculating Volume Profile: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'Volume Profile',
            'description': 'Volume distribution across price levels',
            'parameters': {
                'bins': {
                    'type': 'integer',
                    'default': 20,
                    'description': 'Number of price bins'
                },
                'limit': {
                    'type': 'integer',
                    'default': 200,
                    'description': 'Number of candles to analyze'
                },
                'interval': {
                    'type': 'string',
                    'default': '1m',
                    'description': 'Time interval'
                }
            },
            'data_format': 'Object with profile array, POC, value area, and total volume'
        }
