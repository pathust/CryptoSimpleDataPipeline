#!/usr/bin/env python3
"""Test script for schema_debug provider"""

import sys
import os
sys.path.append(os.path.abspath('.'))

from src.modules.analytics.data_providers.registry import DataProviderRegistry

def test_schema_debug():
    print("Testing schema_debug provider...")
    
    # Check if provider is registered
    providers = DataProviderRegistry.list_providers()
    print(f"Available providers: {list(providers.keys())}")
    
    # Get the schema_debug provider
    provider = DataProviderRegistry.get('schema_debug')
    if not provider:
        print("❌ schema_debug provider not found!")
        return
    
    print("✅ schema_debug provider found!")
    
    # Test get_metadata
    metadata = provider.get_metadata()
    print(f"Metadata: {metadata}")
    
    # Test get_data
    try:
        data = provider.get_data('BTCUSDT')
        print(f"Data keys: {list(data.keys())}")
        for table, info in data.items():
            if isinstance(info, dict):
                print(f"Table {table}: {len(info.get('columns', []))} columns, {len(info.get('sample_data', []))} sample rows")
            else:
                print(f"Table {table}: {info}")
    except Exception as e:
        print(f"❌ Error getting data: {e}")

if __name__ == "__main__":
    test_schema_debug()
