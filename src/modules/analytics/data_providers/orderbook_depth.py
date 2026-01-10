"""
Order Book Depth data provider for market depth visualization.
"""

import pandas as pd
import numpy as np
from .base import DataProvider


class OrderbookDepthProvider(DataProvider):
    """Provider for order book depth data visualization."""
    
    def get_data(self, symbol: str, **params):
        """
        Get order book depth data for visualization.
        
        Args:
            symbol: Trading pair symbol
            depth_levels: Number of price levels to aggregate (default: 20)
            max_price_distance: Maximum price distance from mid price (default: 0.02)
            
        Returns:
            Dictionary with bids and asks depth data
        """
        depth_levels = params.get('depth_levels', 20)
        max_price_distance = params.get('max_price_distance', 0.02)  # 2%
        
        # Normalize symbol format (BTC_USDT -> BTCUSDT)
        symbol = symbol.replace('_', '')
        
        print(f"🔍 OrderBookDepth Provider: Processing symbol='{symbol}' with params={params}")
        
        try:
            conn = self._get_connection()
            cursor = conn.cursor(dictionary=True)
            
            # First, try to get the actual orderbook structure
            cursor.execute("DESCRIBE fact_orderbook")
            columns = [row['Field'] for row in cursor.fetchall()]
            print(f"📋 Orderbook table columns: {columns}")
            
            # Try different query formats based on available columns
            if 'bid_price' in columns and 'ask_price' in columns:
                # Format 1: bid_price, bid_quantity, ask_price, ask_quantity
                query = """
                SELECT 
                    bid_price,
                    bid_quantity,
                    ask_price,
                    ask_quantity,
                    timestamp
                FROM fact_orderbook
                WHERE symbol = %s
                ORDER BY timestamp DESC
                LIMIT 1
                """
                cursor.execute(query, (symbol,))
                row = cursor.fetchone()
                
                if row:
                    bid_price = row['bid_price']
                    bid_quantity = row['bid_quantity']
                    ask_price = row['ask_price']
                    ask_quantity = row['ask_quantity']
                    timestamp = row['timestamp']
                else:
                    # No data found
                    cursor.close()
                    conn.close()
                    return self._get_empty_depth_data()
                    
            elif 'price' in columns and 'side' in columns:
                # Format 2: price, side, quantity (separate rows for bids/asks)
                # Get latest timestamp
                timestamp_column = 'captured_at' if 'captured_at' in columns else 'timestamp'
                
                cursor.execute(f"""
                    SELECT MAX({timestamp_column}) as latest
                    FROM fact_orderbook
                    WHERE symbol = %s
                """, (symbol,))
                
                result = cursor.fetchone()
                if not result or not result['latest']:
                    cursor.close()
                    conn.close()
                    return self._get_empty_depth_data()
                
                latest_time = result['latest']
                print(f"📅 Latest orderbook timestamp: {latest_time}")
                
                # Get bids (buy orders)
                cursor.execute(f"""
                    SELECT price, quantity
                    FROM fact_orderbook
                    WHERE symbol = %s 
                    AND side = 'bid'
                    AND {timestamp_column} = %s
                    ORDER BY price DESC
                    LIMIT %s
                """, (symbol, latest_time, depth_levels))
                
                bids = [{'price': float(row['price']), 'quantity': float(row['quantity'])} 
                       for row in cursor.fetchall()]
                
                # Get asks (sell orders)
                cursor.execute(f"""
                    SELECT price, quantity
                    FROM fact_orderbook
                    WHERE symbol = %s 
                    AND side = 'ask'
                    AND {timestamp_column} = %s
                    ORDER BY price ASC
                    LIMIT %s
                """, (symbol, latest_time, depth_levels))
                
                asks = [{'price': float(row['price']), 'quantity': float(row['quantity'])} 
                       for row in cursor.fetchall()]
                
                cursor.close()
                conn.close()
                
                print(f"📊 Retrieved {len(bids)} bids and {len(asks)} asks")
                
                if not bids and not asks:
                    print("❌ No bids or asks found for latest timestamp")
                    return self._get_empty_depth_data()
                
                # Process the data
                return self._process_orderbook_data(bids, asks, latest_time)
                
            else:
                print(f"❌ Unknown orderbook schema: {columns}")
                cursor.close()
                conn.close()
                return self._get_empty_depth_data()
            
            cursor.close()
            conn.close()
            
            # Process single row format
            if bid_price and ask_price:
                return self._create_synthetic_depth_data(bid_price, bid_quantity, ask_price, ask_quantity, timestamp, depth_levels)
            else:
                return self._get_empty_depth_data()
                
        except Exception as e:
            print(f"Error getting orderbook depth data: {e}")
            import traceback
            traceback.print_exc()
            return self._get_empty_depth_data()
    
    def _get_empty_depth_data(self):
        """Return empty depth data when no data is available."""
        return {
            'bids': [],
            'asks': [],
            'mid_price': 0,
            'spread': 0,
            'spread_percentage': 0,
            'timestamp': None,
            'best_bid': 0,
            'best_ask': 0,
            'best_bid_volume': 0,
            'best_ask_volume': 0
        }
    
    def _process_orderbook_data(self, bids, asks, timestamp):
        """Process actual orderbook data."""
        if not bids or not asks:
            return self._get_empty_depth_data()
        
        # Calculate mid price
        best_bid = bids[0]['price']
        best_ask = asks[0]['price']
        mid_price = (best_bid + best_ask) / 2
        
        # Calculate cumulative volumes
        cumulative_bids = []
        cumulative_volume = 0
        for bid in bids:
            cumulative_volume += bid['quantity']
            cumulative_bids.append({
                'price': round(bid['price'], 6),
                'volume': round(bid['quantity'], 6),
                'cumulative_volume': round(cumulative_volume, 6),
                'total': round(bid['price'] * bid['quantity'], 2)
            })
        
        cumulative_asks = []
        cumulative_volume = 0
        for ask in asks:
            cumulative_volume += ask['quantity']
            cumulative_asks.append({
                'price': round(ask['price'], 6),
                'volume': round(ask['quantity'], 6),
                'cumulative_volume': round(cumulative_volume, 6),
                'total': round(ask['price'] * ask['quantity'], 2)
            })
        
        return {
            'bids': cumulative_bids,
            'asks': cumulative_asks,
            'mid_price': round(mid_price, 6),
            'spread': round(best_ask - best_bid, 6),
            'spread_percentage': round(((best_ask - best_bid) / mid_price) * 100, 4),
            'timestamp': timestamp.isoformat() + 'Z' if timestamp else None,
            'best_bid': round(best_bid, 6),
            'best_ask': round(best_ask, 6),
            'best_bid_volume': round(bids[0]['quantity'], 6),
            'best_ask_volume': round(asks[0]['quantity'], 6)
        }
    
    def _create_synthetic_depth_data(self, bid_price, bid_quantity, ask_price, ask_quantity, timestamp, depth_levels):
        """Create synthetic depth data from single best bid/ask."""
        mid_price = (bid_price + ask_price) / 2
        
        # Generate synthetic depth levels
        bids = []
        asks = []
        
        # Generate bid levels (below mid price)
        for i in range(depth_levels):
            price_offset = (i + 1) * 0.001  # 0.1% increments
            bid_price_level = mid_price * (1 - price_offset)
            
            # Simulate volume distribution
            base_volume = float(bid_quantity)
            volume = base_volume * np.exp(-i * 0.3) * (1 + np.random.random() * 0.2)
            
            bids.append({
                'price': round(bid_price_level, 6),
                'volume': round(volume, 6),
                'total': round(bid_price_level * volume, 2)
            })
        
        # Generate ask levels (above mid price)
        for i in range(depth_levels):
            price_offset = (i + 1) * 0.001  # 0.1% increments
            ask_price_level = mid_price * (1 + price_offset)
            
            # Simulate volume distribution
            base_volume = float(ask_quantity)
            volume = base_volume * np.exp(-i * 0.3) * (1 + np.random.random() * 0.2)
            
            asks.append({
                'price': round(ask_price_level, 6),
                'volume': round(volume, 6),
                'total': round(ask_price_level * volume, 2)
            })
        
        # Calculate cumulative volumes
        cumulative_bids = []
        cumulative_volume = 0
        for bid in reversed(bids):
            cumulative_volume += bid['volume']
            cumulative_bids.append({
                'price': bid['price'],
                'volume': bid['volume'],
                'cumulative_volume': round(cumulative_volume, 6),
                'total': bid['total']
            })
        cumulative_bids.reverse()
        
        cumulative_asks = []
        cumulative_volume = 0
        for ask in asks:
            cumulative_volume += ask['volume']
            cumulative_asks.append({
                'price': ask['price'],
                'volume': ask['volume'],
                'cumulative_volume': round(cumulative_volume, 6),
                'total': ask['total']
            })
        
        return {
            'bids': cumulative_bids,
            'asks': cumulative_asks,
            'mid_price': round(mid_price, 6),
            'spread': round(ask_price - bid_price, 6),
            'spread_percentage': round(((ask_price - bid_price) / mid_price) * 100, 4),
            'timestamp': timestamp.isoformat() + 'Z' if timestamp else None,
            'best_bid': round(float(bid_price), 6),
            'best_ask': round(float(ask_price), 6),
            'best_bid_volume': round(float(bid_quantity), 6),
            'best_ask_volume': round(float(ask_quantity), 6)
        }
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'Order Book Depth',
            'description': 'Market depth visualization with bid/ask walls',
            'parameters': {
                'depth_levels': {
                    'type': 'integer',
                    'default': 20,
                    'description': 'Number of price levels to display'
                },
                'max_price_distance': {
                    'type': 'float',
                    'default': 0.02,
                    'description': 'Maximum price distance from mid price (0.02 = 2%)'
                }
            },
            'data_format': 'Dictionary with bids, asks, mid_price, spread, and timestamp',
            'visualization_type': 'Depth chart with bid/ask walls'
        }
