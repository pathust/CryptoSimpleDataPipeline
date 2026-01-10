#!/usr/bin/env python3
"""
Test just the MACD fix
"""

import sys
import os

# Add src to pythonpath
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

from src.modules.analytics.data_providers.registry import DataProviderRegistry

def test_macd_only():
    """Test MACD provider with real data."""
    print("🧪 Testing MACD Fix Only")
    print("=" * 40)
    
    try:
        provider = DataProviderRegistry.get('macd')
        if not provider:
            print("❌ MACD provider not found")
            return False
        
        print("✅ Found MACD provider")
        
        # Test with BTCUSDT
        symbol = 'BTCUSDT'
        params = {'fast_period': 12, 'slow_period': 26, 'signal_period': 9, 'limit': 50}
        
        print(f"🔄 Testing MACD with {symbol}")
        data = provider.get_data(symbol, **params)
        
        print(f"📊 Data type: {type(data)}")
        print(f"📏 Data length: {len(data)}")
        
        if len(data) > 0:
            print("✅ SUCCESS: MACD working!")
            print(f"🔍 Sample data: {data[0]}")
            if len(data) > 1:
                print(f"🔍 Second data: {data[1]}")
            return True
        else:
            print("❌ FAIL: Still empty data")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_macd_only()
