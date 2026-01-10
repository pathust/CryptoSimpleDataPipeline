#!/usr/bin/env python3
"""
Debug script to test chart data providers.
Run this script to check if MACD, Order Book Depth, and Fear & Greed are working.
"""

import sys
import os
import requests
import json

# Add src to pythonpath
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

from src.modules.analytics.data_providers.registry import DataProviderRegistry

def test_provider_directly(provider_name, symbol='BTCUSDT'):
    """Test a data provider directly."""
    print(f"\n{'='*50}")
    print(f"🧪 Testing {provider_name} provider directly")
    print(f"{'='*50}")
    
    try:
        provider = DataProviderRegistry.get(provider_name)
        if not provider:
            print(f"❌ Provider {provider_name} not found in registry")
            return False
        
        print(f"✅ Found provider: {provider.__class__.__name__}")
        
        # Get metadata
        metadata = provider.get_metadata()
        print(f"📋 Metadata: {metadata['name']}")
        print(f"📝 Description: {metadata['description']}")
        
        # Get data with default parameters
        params = {}
        if provider_name == 'macd':
            params = {'fast_period': 12, 'slow_period': 26, 'signal_period': 9, 'limit': 50}
        elif provider_name == 'orderbook_depth':
            params = {'depth_levels': 10, 'max_price_distance': 0.02}
        elif provider_name == 'fear_greed_gauge':
            params = {'use_price_change': True}
        elif provider_name == 'candlestick_enhanced':
            params = {'limit': 50}
        
        print(f"🔄 Calling get_data({symbol}, {params})...")
        data = provider.get_data(symbol, **params)
        
        print(f"✅ Data returned successfully!")
        print(f"📊 Data type: {type(data)}")
        
        if isinstance(data, list):
            print(f"📏 Data length: {len(data)}")
            if len(data) > 0:
                print(f"🔍 Sample item: {data[0]}")
                if len(data) > 1:
                    print(f"🔍 Second item: {data[1]}")
        elif isinstance(data, dict):
            print(f"🔑 Data keys: {list(data.keys())}")
            for key, value in data.items():
                if isinstance(value, (list, dict)):
                    print(f"  📊 {key}: {type(value)} (length: {len(value) if hasattr(value, '__len__') else 'N/A'})")
                    if isinstance(value, list) and len(value) > 0:
                        print(f"    🔍 Sample: {value[0]}")
                else:
                    print(f"  📊 {key}: {value}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing {provider_name}: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_endpoint(provider_name, symbol='BTCUSDT', base_url='http://localhost:5001'):
    """Test the API endpoint for a provider."""
    print(f"\n{'='*50}")
    print(f"🌐 Testing API endpoint for {provider_name}")
    print(f"{'='*50}")
    
    try:
        url = f"{base_url}/api/analytics/data/{provider_name}/{symbol}"
        print(f"🔗 URL: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API returned data successfully!")
            print(f"📊 Data type: {type(data)}")
            
            if isinstance(data, list):
                print(f"📏 Data length: {len(data)}")
                if len(data) > 0:
                    print(f"🔍 Sample item: {data[0]}")
            elif isinstance(data, dict):
                print(f"🔑 Data keys: {list(data.keys())}")
                if 'error' in data:
                    print(f"❌ API returned error: {data['error']}")
                    return False
            
            return True
        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except requests.RequestException as e:
        print(f"❌ Request error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error testing API: {e}")
        return False

def main():
    """Main test function."""
    print("🚀 Starting Chart Data Provider Debug Tests")
    print("=" * 60)
    
    # Test providers
    providers_to_test = [
        'candlestick_enhanced',
        'macd', 
        'orderbook_depth',
        'fear_greed_gauge'
    ]
    
    symbol = 'BTCUSDT'
    
    print(f"📈 Testing with symbol: {symbol}")
    
    # Test each provider directly
    direct_results = {}
    for provider in providers_to_test:
        direct_results[provider] = test_provider_directly(provider, symbol)
    
    # Test API endpoints (only if backend is running)
    print(f"\n{'='*60}")
    print("🌐 Testing API Endpoints (make sure backend is running on port 5001)")
    print("=" * 60)
    
    api_results = {}
    for provider in providers_to_test:
        api_results[provider] = test_api_endpoint(provider, symbol)
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    for provider in providers_to_test:
        direct_status = "✅ PASS" if direct_results[provider] else "❌ FAIL"
        api_status = "✅ PASS" if api_results[provider] else "❌ FAIL"
        print(f"{provider:20} | Direct: {direct_status:8} | API: {api_status:8}")
    
    print(f"\n💡 Recommendations:")
    print("1. If Direct tests pass but API tests fail, check the Flask backend")
    print("2. If both fail, check the data provider implementation")
    print("3. Check browser console for frontend debugging logs")
    print("4. Ensure database has data for the symbol being tested")

if __name__ == "__main__":
    main()
