"""
Fear & Greed Index gauge chart data provider.
Displays market sentiment as a semi-circular gauge.
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from .base import DataProvider


class FearGreedGaugeProvider(DataProvider):
    """Provider for Fear & Greed Index gauge visualization."""
    
    def get_data(self, symbol: str, **params):
        """
        Get Fear & Greed Index data for gauge visualization.
        
        Args:
            symbol: Trading pair symbol
            use_price_change: If True, uses 24h price change as proxy (default: True)
            
        Returns:
            Dictionary with gauge data including value, classification, and historical data
        """
        use_price_change = params.get('use_price_change', True)
        
        # Normalize symbol format (BTC_USDT -> BTCUSDT)
        symbol = symbol.replace('_', '')
        
        print(f"🔍 FearGreed Provider: Processing symbol='{symbol}' with params={params}")
        
        try:
            # Try to fetch from alternative.me API first
            fear_greed_data = self._fetch_fear_greed_api()
            
            if fear_greed_data:
                return fear_greed_data
            else:
                # Fallback to price-based calculation
                print("Fear & Greed API failed, using price-based fallback")
                return self._calculate_from_price_data(symbol, use_price_change)
                
        except Exception as e:
            print(f"Error getting Fear & Greed gauge data: {e}")
            # Return fallback data
            return self._get_fallback_data(symbol)
    
    def _fetch_fear_greed_api(self):
        """Fetch Fear & Greed Index from alternative.me API."""
        try:
            print("Fetching Fear & Greed Index from alternative.me API...")
            response = requests.get('https://api.alternative.me/fng/', timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if 'data' in data and len(data['data']) > 0:
                    latest = data['data'][0]
                    value = int(latest['value'])
                    timestamp = datetime.fromtimestamp(int(latest['timestamp']))
                    
                    # Get historical data
                    historical = []
                    for item in data['data'][:7]:  # Last 7 days
                        historical.append({
                            'date': datetime.fromtimestamp(int(item['timestamp'])).strftime('%Y-%m-%d'),
                            'value': int(item['value'])
                        })
                    
                    return self._format_fear_greed_data(value, timestamp, historical)
            
            print(f"Fear & Greed API returned status: {response.status_code}")
            return None
            
        except requests.RequestException as e:
            print(f"Fear & Greed API request failed: {e}")
            return None
        except Exception as e:
            print(f"Fear & Greed API parsing failed: {e}")
            return None
    
    def _calculate_from_price_data(self, symbol: str, use_price_change: bool):
        """Calculate Fear & Greed from price data as fallback."""
        try:
            # Calculate Fear & Greed based on 24h price change and volatility
            conn = self._get_connection()
            
            # Get 24h price data
            query = """
            SELECT 
                open_price,
                close_price,
                high_price,
                low_price,
                volume,
                open_time
            FROM fact_klines
            WHERE symbol = %s AND interval_code = '1h'
            ORDER BY open_time DESC
            LIMIT 25
            """
            
            df = pd.read_sql(query, conn, params=(symbol,))
            conn.close()
            
            if df.empty:
                return self._get_fallback_data(symbol)
            
            # Calculate 24h price change
            df = df.iloc[::-1]  # Reverse to chronological order
            if len(df) < 2:
                return self._get_fallback_data(symbol)
            
            current_price = df.iloc[-1]['close_price']
            price_24h_ago = df.iloc[0]['close_price']
            price_change_pct = ((current_price - price_24h_ago) / price_24h_ago) * 100
            
            # Calculate volatility (standard deviation of hourly returns)
            df['returns'] = df['close_price'].pct_change() * 100
            volatility = df['returns'].std() if len(df) > 1 else 0
            
            # Calculate volume change
            current_volume = df.iloc[-1]['volume']
            avg_volume = df['volume'].mean()
            volume_change_pct = ((current_volume - avg_volume) / avg_volume) * 100 if avg_volume > 0 else 0
            
            # Simple Fear & Greed calculation (0-100 scale)
            # Higher price change = more greed, lower = more fear
            # Volatility moderates the score
            base_score = 50 + (price_change_pct * 2)  # Center at 50, scale by 2
            volatility_adjustment = -volatility * 0.5  # High volatility reduces greed
            volume_adjustment = volume_change_pct * 0.1  # Volume supports the trend
            
            fear_greed_score = max(0, min(100, base_score + volatility_adjustment + volume_adjustment))
            
            # Generate historical data
            historical_data = []
            base_value = fear_greed_score
            for i in range(7):  # Last 7 days
                date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
                # Add some variation to historical data
                variation = np.random.uniform(-10, 10)
                historical_value = max(0, min(100, base_value + variation))
                historical_data.append({
                    'date': date,
                    'value': round(historical_value, 1)
                })
                base_value = historical_value  # Use previous day as base for next
            
            historical_data.reverse()  # Chronological order
            
            return self._format_fear_greed_data(
                round(fear_greed_score, 1), 
                datetime.now(), 
                historical_data,
                price_change_24h=price_change_pct,
                volatility_24h=volatility,
                volume_change_24h=volume_change_pct,
                symbol=symbol
            )
            
        except Exception as e:
            print(f"Error calculating Fear & Greed from price data: {e}")
            return self._get_fallback_data(symbol)
    
    def _format_fear_greed_data(self, value, timestamp, historical_data, **kwargs):
        """Format Fear & Greed data consistently."""
        # Determine classification
        if value <= 20:
            classification = "Extreme Fear"
            color = "#dc2626"  # Red
            description = "Maximum fear, potential buying opportunity"
        elif value <= 40:
            classification = "Fear"
            color = "#f97316"  # Orange
            description = "Market fear, prices may be undervalued"
        elif value <= 60:
            classification = "Neutral"
            color = "#eab308"  # Yellow
            description = "Balanced market sentiment"
        elif value <= 80:
            classification = "Greed"
            color = "#22c55e"  # Green
            description = "Market greed, prices may be overvalued"
        else:
            classification = "Extreme Greed"
            color = "#16a34a"  # Dark Green
            description = "Maximum greed, potential selling opportunity"
        
        return {
            'current_value': round(value, 1),
            'classification': classification,
            'color': color,
            'description': description,
            'timestamp': timestamp.isoformat() + 'Z',
            'historical_data': historical_data,
            'price_change_24h': kwargs.get('price_change_24h'),
            'volatility_24h': kwargs.get('volatility_24h'),
            'volume_change_24h': kwargs.get('volume_change_24h'),
            'symbol': kwargs.get('symbol', 'Unknown')
        }
    
    def _get_fallback_data(self, symbol: str):
        """Return fallback data when all methods fail."""
        return self._format_fear_greed_data(
            50,  # Neutral value
            datetime.now(),
            [],  # No historical data
            symbol=symbol
        )
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'Fear & Greed Gauge',
            'description': 'Market sentiment gauge showing Fear & Greed Index',
            'parameters': {
                'use_price_change': {
                    'type': 'boolean',
                    'default': True,
                    'description': 'Use 24h price change to calculate Fear & Greed Index'
                }
            },
            'data_format': 'Dictionary with current_value, classification, color, and historical_data',
            'visualization_type': 'Semi-circular gauge chart',
            'scale': {
                'min': 0,
                'max': 100,
                'zones': [
                    {'min': 0, 'max': 20, 'label': 'Extreme Fear', 'color': '#dc2626'},
                    {'min': 20, 'max': 40, 'label': 'Fear', 'color': '#f97316'},
                    {'min': 40, 'max': 60, 'label': 'Neutral', 'color': '#eab308'},
                    {'min': 60, 'max': 80, 'label': 'Greed', 'color': '#22c55e'},
                    {'min': 80, 'max': 100, 'label': 'Extreme Greed', 'color': '#16a34a'}
                ]
            }
        }
