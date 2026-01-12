"""
Price Distribution data provider.
Shows distribution of closing prices over time.
"""

import pandas as pd
import numpy as np
from .base import DataProvider


class PriceDistributionProvider(DataProvider):
    """Provider for Price Distribution data."""
    
    def get_data(self, symbol: str, **params):
        """
        Get Price Distribution data - histogram of closing prices.
        
        Args:
            symbol: Trading pair symbol
            bins: Number of price bins (default: 30)
            limit: Number of candles to analyze (default: 200)
            interval: Time interval (default: '1m')
            
        Returns:
            List of price distribution data points with price_range and count
        """
        bins = params.get('bins', 40)  # Default 40 bins (30-50 range)
        limit = params.get('limit', 200)
        interval = params.get('interval', '1m')
        
        try:
            conn = self._get_connection()
            
            query = """
            SELECT 
                close_price
            FROM fact_klines
            WHERE symbol = %s AND interval_code = %s
            ORDER BY open_time DESC
            LIMIT %s
            """
            
            df = pd.read_sql(query, conn, params=(symbol, interval, limit))
            conn.close()
            
            if df.empty:
                return []
            
            # Get closing prices
            prices = df['close_price'].astype(float).values
            
            # Calculate statistics for market state analysis
            mean_price = float(np.mean(prices))
            median_price = float(np.median(prices))
            std_price = float(np.std(prices))
            min_price = float(np.min(prices))
            max_price = float(np.max(prices))
            
            # Create histogram
            hist, bin_edges = np.histogram(prices, bins=bins)
            
            # Prepare result with statistics
            result = []
            for i in range(len(hist)):
                result.append({
                    'price_min': round(bin_edges[i], 2),
                    'price_max': round(bin_edges[i + 1], 2),
                    'price_center': round((bin_edges[i] + bin_edges[i + 1]) / 2, 2),
                    'count': int(hist[i]),
                    'percentage': round((hist[i] / len(prices)) * 100, 2)
                })
            
            # Add statistics to result
            return {
                'histogram': result,
                'statistics': {
                    'mean': round(mean_price, 2),
                    'median': round(median_price, 2),
                    'std_dev': round(std_price, 2),
                    'min': round(min_price, 2),
                    'max': round(max_price, 2),
                    'range': round(max_price - min_price, 2)
                }
            }
            
        except Exception as e:
            print(f"Error calculating Price Distribution: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'Price Distribution',
            'description': 'Distribution of closing prices over time',
            'parameters': {
                'bins': {
                    'type': 'integer',
                    'default': 30,
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
            'data_format': 'Object with histogram array and statistics object'
        }
