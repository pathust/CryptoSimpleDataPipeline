"""
Order book data provider for market depth visualization.
"""

from .base import DataProvider


class OrderbookProvider(DataProvider):
    """Provider for order book depth data."""
    
    def get_data(self, symbol: str, **params):
        """
        Get latest orderbook snapshot.
        
        Args:
            symbol: Trading pair symbol
            limit: Number of price levels per side (default: 20)
            
        Returns:
            Dictionary with bids, asks, and timestamp
        """
        limit = params.get('limit', 20)
        
        try:
            conn = self._get_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Get latest timestamp
            cursor.execute("""
                SELECT MAX(captured_at) as latest
                FROM fact_orderbook
                WHERE symbol = %s
            """, (symbol,))
            
            result = cursor.fetchone()
            if not result or not result['latest']:
                conn.close()
                return {'bids': [], 'asks': [], 'timestamp': None}
            
            latest_time = result['latest']
            
            # Get bids (buy orders)
            cursor.execute("""
                SELECT price, quantity
                FROM fact_orderbook
                WHERE symbol = %s 
                AND side = 'bid'
                AND captured_at = %s
                ORDER BY price DESC
                LIMIT %s
            """, (symbol, latest_time, limit))
            
            bids = [{'price': float(row['price']), 'quantity': float(row['quantity'])} 
                   for row in cursor.fetchall()]
            
            # Get asks (sell orders)
            cursor.execute("""
                SELECT price, quantity
                FROM fact_orderbook
                WHERE symbol = %s 
                AND side = 'ask'
                AND captured_at = %s
                ORDER BY price ASC
                LIMIT %s
            """, (symbol, latest_time, limit))
            
            asks = [{'price': float(row['price']), 'quantity': float(row['quantity'])} 
                   for row in cursor.fetchall()]
            
            conn.close()
            
            return {
                'bids': bids,
                'asks': asks,
                'timestamp': latest_time.isoformat() if latest_time else None
            }
            
        except Exception as e:
            print(f"Error getting orderbook: {e}")
            return {'bids': [], 'asks': [], 'timestamp': None}
    
    def get_metadata(self):
        """Return metadata about this provider."""
        return {
            'name': 'Order Book',
            'description': 'Market depth with bid/ask price levels',
            'parameters': {
                'limit': {
                    'type': 'integer',
                    'default': 20,
                    'description': 'Number of price levels per side'
                }
            },
            'data_format': '{bids: [{price, quantity}], asks: [{price, quantity}], timestamp}'
        }
