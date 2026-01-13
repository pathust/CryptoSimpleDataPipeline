"""
Correlation data provider for price correlation analysis between coins.
"""

import pandas as pd
import numpy as np
from .base import DataProvider
import src.config as config


class CorrelationProvider(DataProvider):
    """Provider for correlation data between one coin and two other coins."""
    
    def get_data(self, symbol: str, **params):
        """
        Get correlation data between base symbol and two comparison symbols.
        
        Args:
            symbol: Base trading pair symbol (e.g., 'BTCUSDT')
            compare_symbol1: First comparison symbol (e.g., 'ETHUSDT')
            compare_symbol2: Second comparison symbol (e.g., 'BNBUSDT')
            window: Rolling window size for correlation (default: 30)
            limit: Number of data points (default: 200)
            interval: Time interval (default: '1m')
            
        Returns:
            List of correlation data points with time, correlation1, correlation2
        """
        compare_symbol1 = params.get('compare_symbol1')
        compare_symbol2 = params.get('compare_symbol2')
        window = params.get('window', 30)
        limit = params.get('limit', 200)
        interval = params.get('interval', '1m')
        
        multiplier = 1
        if interval.endswith('m'):
            multiplier = int(interval.replace('m', ''))
        elif interval.endswith('h'):
            multiplier = int(interval.replace('h', '')) * 60
        elif interval.endswith('d'):
            multiplier = int(interval.replace('d', '')) * 1440

        # If comparison symbols not provided, use other symbols from config
        if not compare_symbol1 or not compare_symbol2:
            available_symbols = [s for s in config.SYMBOLS if s != symbol]
            if len(available_symbols) >= 2:
                compare_symbol1 = compare_symbol1 or available_symbols[0]
                compare_symbol2 = compare_symbol2 or available_symbols[1]
            elif len(available_symbols) == 1:
                compare_symbol1 = compare_symbol1 or available_symbols[0]
                compare_symbol2 = compare_symbol2 or available_symbols[0]  # Use same if only one available
            else:
                return []
        
        needed_candles = limit + window + 1
        fetch_limit = needed_candles * multiplier

        try:
            conn = self._get_connection()
            
            # Fetch data for all symbols - use a larger limit to ensure we have enough overlapping timestamps
            query = """
            SELECT 
                open_time,
                close_price,
                symbol
            FROM fact_klines
            WHERE symbol IN (%s, %s, %s) AND interval_code = '1m'
            ORDER BY open_time DESC
            LIMIT %s
            """
            
            # Execute query - fetch enough rows to ensure we have data for all 3 symbols
            # Multiply by 3 to account for 3 symbols, and add buffer
            df = pd.read_sql(query, conn, params=(symbol, compare_symbol1, compare_symbol2, fetch_limit * 3))
            conn.close()
            
            if df.empty:
                print(f"Correlation: No data found for symbols {symbol}, {compare_symbol1}, {compare_symbol2}")
                return []
            
            df['open_time'] = pd.to_datetime(df['open_time'])
            df['close_price'] = df['close_price'].astype(float)

            # Sort to get chronological order (oldest first)
            df = df.sort_values('open_time').reset_index(drop=True)
            
            # Check if we have data for all symbols
            unique_symbols = df['symbol'].unique()
            if len(unique_symbols) < 3:
                print(f"Correlation: Missing symbols. Found: {unique_symbols}, Expected: [{symbol}, {compare_symbol1}, {compare_symbol2}]")
            
            # Pivot to get prices for each symbol
            price_df = df.pivot_table(
                index='open_time',
                columns='symbol',
                values='close_price',
                aggfunc='first'
            ).sort_index()
            
            if interval != '1m':
                p_interval = interval.replace('m', 'min').replace('h', 'H').replace('d', 'D')
                price_df = price_df.resample(p_interval).last().dropna()

            # Check if all required symbols are present
            required_symbols = [symbol, compare_symbol1, compare_symbol2]
            missing_symbols = [s for s in required_symbols if s not in price_df.columns]
            if missing_symbols:
                print(f"Correlation: Missing symbols in pivot: {missing_symbols}")
                return []
            
            # Drop rows with missing data
            price_df = price_df.dropna()
            
            if len(price_df) < window + 1:
                print(f"Correlation: Not enough data points after pivot. Got {len(price_df)}, need {window + 1}")
                # Try with smaller window if we have some data
                if len(price_df) >= 10:
                    window = min(window, len(price_df) - 1)
                    print(f"Correlation: Adjusting window to {window}")
                else:
                    return []
            
            # Calculate returns (percentage change)
            returns_df = price_df.pct_change().dropna()
            
            # Adjust window if needed after calculating returns
            if len(returns_df) < window:
                print(f"Correlation: Not enough returns data. Got {len(returns_df)}, need {window}")
                if len(returns_df) >= 5:
                    original_window = window
                    window = min(window, len(returns_df))
                    print(f"Correlation: Adjusting window from {original_window} to {window}")
                else:
                    return []
            
            # Calculate rolling correlation
            base_returns = returns_df[symbol]
            compare1_returns = returns_df[compare_symbol1]
            compare2_returns = returns_df[compare_symbol2]
            
            correlations1 = []
            correlations2 = []
            timestamps = []
            
            for i in range(window - 1, len(returns_df)):
                window_base = base_returns.iloc[i - window + 1:i + 1]
                window_compare1 = compare1_returns.iloc[i - window + 1:i + 1]
                window_compare2 = compare2_returns.iloc[i - window + 1:i + 1]
                
                # Calculate correlation
                corr1 = window_base.corr(window_compare1)
                corr2 = window_base.corr(window_compare2)
                
                # Handle NaN values
                corr1 = corr1 if not np.isnan(corr1) else 0.0
                corr2 = corr2 if not np.isnan(corr2) else 0.0
                
                correlations1.append(corr1)
                correlations2.append(corr2)
                timestamps.append(returns_df.index[i])
            
            # Prepare result
            result = []
            for i, timestamp in enumerate(timestamps):
                result.append({
                    'time': self._format_datetime_to_utc(timestamp),
                    'correlation1': round(correlations1[i], 4),
                    'correlation2': round(correlations2[i], 4),
                    'symbol1': compare_symbol1,
                    'symbol2': compare_symbol2
                })
            
            # Return only requested limit (most recent)
            return result[-limit:]
            
        except Exception as e:
            print(f"Error calculating correlation: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'Correlation',
            'description': 'Rolling correlation between base coin and two comparison coins',
            'parameters': {
                'compare_symbol1': {
                    'type': 'string',
                    'default': None,
                    'description': 'First comparison symbol (auto-selected if not provided)'
                },
                'compare_symbol2': {
                    'type': 'string',
                    'default': None,
                    'description': 'Second comparison symbol (auto-selected if not provided)'
                },
                'window': {
                    'type': 'integer',
                    'default': 30,
                    'description': 'Rolling window size for correlation calculation'
                },
                'limit': {
                    'type': 'integer',
                    'default': 200,
                    'description': 'Number of data points'
                },
                'interval': {
                    'type': 'string',
                    'default': '1m',
                    'description': 'Time interval'
                }
            },
            'data_format': 'Array of {time, correlation1, correlation2, symbol1, symbol2}'
        }
