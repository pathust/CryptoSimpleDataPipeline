"""
Return Distribution data provider.
Shows distribution of price returns (percentage changes) over time.
"""

import pandas as pd
import numpy as np
from .base import DataProvider


class ReturnDistributionProvider(DataProvider):
    """Provider for Return Distribution data."""
    
    def get_data(self, symbol: str, **params):
        """
        Get Return Distribution data - histogram of price returns.
        
        Args:
            symbol: Trading pair symbol
            bins: Number of return bins (default: 30)
            limit: Number of candles to analyze (default: 200)
            interval: Time interval (default: '1m')
            
        Returns:
            List of return distribution data points with return_range and count
        """
        bins = params.get('bins', 30)
        limit = params.get('limit', 200)
        interval = params.get('interval', '1m')
        
        try:
            conn = self._get_connection()
            
            query = """
            SELECT 
                open_price,
                close_price
            FROM fact_klines
            WHERE symbol = %s AND interval_code = %s
            ORDER BY open_time DESC
            LIMIT %s
            """
            
            df = pd.read_sql(query, conn, params=(symbol, interval, limit))
            conn.close()
            
            if df.empty or len(df) < 2:
                return []
            
            # Reverse to get chronological order
            df = df.iloc[::-1]
            
            # Calculate returns (percentage change)
            open_prices = df['open_price'].astype(float).values
            close_prices = df['close_price'].astype(float).values
            
            # Calculate return percentage: ((close - open) / open) * 100
            returns = ((close_prices - open_prices) / open_prices) * 100
            
            # Calculate risk statistics
            mean_return = float(np.mean(returns))
            std_return = float(np.std(returns))
            min_return = float(np.min(returns))
            max_return = float(np.max(returns))
            
            # Calculate skewness (measure of asymmetry)
            if len(returns) > 2 and std_return > 0:
                skewness = float(np.mean(((returns - mean_return) / std_return) ** 3))
            else:
                skewness = 0.0
            
            # Calculate kurtosis (measure of tail heaviness)
            if len(returns) > 2 and std_return > 0:
                kurtosis = float(np.mean(((returns - mean_return) / std_return) ** 4)) - 3.0
            else:
                kurtosis = 0.0
            
            # Calculate percentiles for risk analysis
            percentiles = {
                'p5': float(np.percentile(returns, 5)),
                'p25': float(np.percentile(returns, 25)),
                'p50': float(np.percentile(returns, 50)),
                'p75': float(np.percentile(returns, 75)),
                'p95': float(np.percentile(returns, 95))
            }
            
            # Create histogram
            hist, bin_edges = np.histogram(returns, bins=bins)
            
            # Prepare result
            result = []
            for i in range(len(hist)):
                result.append({
                    'return_min': round(bin_edges[i], 4),
                    'return_max': round(bin_edges[i + 1], 4),
                    'return_center': round((bin_edges[i] + bin_edges[i + 1]) / 2, 4),
                    'count': int(hist[i]),
                    'percentage': round((hist[i] / len(returns)) * 100, 2)
                })
            
            return {
                'histogram': result,
                'risk_metrics': {
                    'mean': round(mean_return, 4),
                    'std_dev': round(std_return, 4),
                    'min': round(min_return, 4),
                    'max': round(max_return, 4),
                    'skewness': round(skewness, 4),
                    'kurtosis': round(kurtosis, 4),
                    'percentiles': {k: round(v, 4) for k, v in percentiles.items()}
                }
            }
            
        except Exception as e:
            print(f"Error calculating Return Distribution: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'Return Distribution',
            'description': 'Distribution of price returns (percentage changes)',
            'parameters': {
                'bins': {
                    'type': 'integer',
                    'default': 30,
                    'description': 'Number of return bins'
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
            'data_format': 'Object with histogram array and risk_metrics object'
        }
