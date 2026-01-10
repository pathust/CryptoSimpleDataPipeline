#!/usr/bin/env python3
"""
Test the chart fixes with actual database data
"""

import sys
import os

# Add src to pythonpath
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

from src.modules.analytics.data_providers.registry import DataProviderRegistry

def test_provider_with_real_data(provider_name, symbol='BTCUSDT'):
    """Test a provider with real database data."""
    print(f"\n{'='*60}")
    print(f"🧪 Testing {provider_name} with real data")
    print(f"{'='*60}")
    
    try:
        provider = DataProviderRegistry.get(provider_name)
        if not provider:
            print(f"❌ Provider {provider_name} not found")
            return False
        
        print(f"✅ Found provider: {provider.__class__.__name__}")
        
        # Test with symbol normalization
        test_symbols = [symbol, f"{symbol[:3]}_{symbol[3:]}"]  # BTCUSDT, BTC_USDT
        
        for test_symbol in test_symbols:
            print(f"\n🔄 Testing with symbol: {test_symbol}")
            
            # Get data
            params = {}
            if provider_name == 'macd':
                params = {'fast_period': 12, 'slow_period': 26, 'signal_period': 9, 'limit': 50}
            elif provider_name == 'orderbook_depth':
                params = {'depth_levels': 10, 'max_price_distance': 0.02}
            elif provider_name == 'fear_greed_gauge':
                params = {'use_price_change': True}
            elif provider_name == 'candlestick_enhanced':
                params = {'limit': 50}
            
            data = provider.get_data(test_symbol, **params)
            
            print(f"📊 Data type: {type(data)}")
            
            if isinstance(data, list):
                print(f"📏 Data length: {len(data)}")
                if len(data) > 0:
                    print(f"✅ SUCCESS: Got {len(data)} data points")
                    print(f"🔍 Sample: {data[0]}")
                    return True
                else:
                    print(f"❌ FAIL: Empty data array")
            elif isinstance(data, dict):
                print(f"🔑 Data keys: {list(data.keys())}")
                if 'bids' in data and 'asks' in data:
                    bids_count = len(data['bids'])
                    asks_count = len(data['asks'])
                    print(f"📊 Bids: {bids_count}, Asks: {asks_count}")
                    if bids_count > 0 and asks_count > 0:
                        print(f"✅ SUCCESS: Got orderbook data")
                        print(f"🔍 Sample bid: {data['bids'][0]}")
                        print(f"🔍 Sample ask: {data['asks'][0]}")
                        return True
                    else:
                        print(f"❌ FAIL: Empty orderbook data")
                elif 'current_value' in data:
                    print(f"✅ SUCCESS: Got gauge data: {data['current_value']}")
                    return True
                else:
                    print(f"❌ FAIL: Unknown dict format")
            else:
                print(f"❌ FAIL: Unexpected data type")
        
        return False
        
    except Exception as e:
        print(f"❌ Error testing {provider_name}: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function."""
    print("🚀 Testing Chart Fixes with Real Database Data")
    print("=" * 60)
    
    # Test the problematic providers
    providers_to_test = [
        'orderbook_depth',
        'macd', 
        'fear_greed_gauge',
        'candlestick_enhanced'  # Test this too for comparison
    ]
    
    results = {}
    for provider in providers_to_test:
        results[provider] = test_provider_with_real_data(provider)
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    for provider, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{provider:20} | {status}")
    
    print(f"\n💡 If any tests fail, check:")
    print("1. Backend logs for detailed error messages")
    print("2. Database connection and data availability")
    print("3. Symbol format normalization")

if __name__ == "__main__":
    main()
