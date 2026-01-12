#!/usr/bin/env python3
"""
Backfill Recent Data Script

Fetches the last 3 days of data for all configured symbols with:
- Chunking to avoid API rate limits (max 1000 klines per request)
- Delay between requests to prevent being banned
- Progress tracking and error handling
- Automatic processing into database

Usage:
    python backfill_recent_data.py
"""

import sys
import time
from datetime import datetime, timedelta
import requests
import json
import tempfile

# Add src to path
sys.path.insert(0, './src')

import src.config as config
from src.modules.extract.manager import ExtractionManager
from src.modules.transform.manager import TransformManager

class BackfillManager:
    """Manages backfilling of recent data with rate limiting."""
    
    def __init__(self):
        self.api_url = "https://api.binance.com/api/v3"
        self.extract_mgr = ExtractionManager()
        self.transform_mgr = TransformManager()
        
        # Rate limiting configuration
        self.delay_between_requests = 0.5  # 500ms delay between requests
        self.chunk_size = 500  # Fetch 500 minutes per chunk (safe under 1000 limit)
        self.max_retries = 3
        
    def fetch_klines_chunk(self, symbol, start_time, end_time, interval="1m"):
        """
        Fetch klines for a specific time range.
        
        Args:
            symbol: Trading pair (e.g., 'BTCUSDT')
            start_time: Start datetime
            end_time: End datetime
            interval: Candle interval (default: '1m')
        
        Returns:
            List of klines or None if error
        """
        endpoint = f"{self.api_url}/klines"
        params = {
            "symbol": symbol,
            "interval": interval,
            "startTime": int(start_time.timestamp() * 1000),
            "endTime": int(end_time.timestamp() * 1000),
            "limit": 1000
        }
        
        for attempt in range(self.max_retries):
            try:
                response = requests.get(endpoint, params=params, timeout=10)
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 429:
                    # Rate limited - wait longer
                    wait_time = (attempt + 1) * 2
                    print(f"⚠️  Rate limited, waiting {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    print(f"❌ Error {response.status_code}: {response.text}")
                    return None
                    
            except Exception as e:
                print(f"❌ Request failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(1)
        
        return None
    
    def backfill_symbol(self, symbol, days=3):
        """
        Backfill data for a single symbol.
        
        Args:
            symbol: Trading pair to backfill
            days: Number of days to backfill (default: 3)
        """
        print(f"\n{'='*60}")
        print(f"📊 Backfilling {symbol} - Last {days} days")
        print(f"{'='*60}")
        
        # Calculate time range
        end_time = datetime.now()
        start_time = end_time - timedelta(days=days)
        
        total_minutes = int((end_time - start_time).total_seconds() / 60)
        num_chunks = (total_minutes + self.chunk_size - 1) // self.chunk_size
        
        print(f"⏱️  Time range: {start_time.strftime('%Y-%m-%d %H:%M')} to {end_time.strftime('%Y-%m-%d %H:%M')}")
        print(f"📦 Total chunks: {num_chunks} ({self.chunk_size} minutes each)")
        print()
        
        total_klines = 0
        current_time = start_time
        
        for chunk_idx in range(num_chunks):
            # Calculate chunk end time
            chunk_end = min(current_time + timedelta(minutes=self.chunk_size), end_time)
            
            # Fetch chunk
            print(f"[{chunk_idx + 1}/{num_chunks}] Fetching {current_time.strftime('%Y-%m-%d %H:%M')} to {chunk_end.strftime('%Y-%m-%d %H:%M')}...", end=" ")
            
            klines = self.fetch_klines_chunk(symbol, current_time, chunk_end)
            
            if klines and len(klines) > 0:
                # Save to MinIO via ExtractionManager
                try:
                    object_path = self.extract_mgr.save_to_datalake(klines, symbol, "klines")
                    total_klines += len(klines)
                    print(f"✅ {len(klines)} klines saved to MinIO")
                    
                    # Update extraction metadata
                    latest_open_time = datetime.fromtimestamp(klines[-1][0] / 1000)
                    self.extract_mgr.update_extraction_metadata(
                        symbol, "klines", latest_open_time, len(klines)
                    )
                    
                except Exception as e:
                    print(f"❌ Failed to save: {e}")
            else:
                print("⏭️  No data")
            
            # Rate limiting delay
            if chunk_idx < num_chunks - 1:
                time.sleep(self.delay_between_requests)
            
            current_time = chunk_end
        
        print(f"\n✅ {symbol} backfill complete: {total_klines} total klines")
        return total_klines
    
    def process_backfilled_data(self):
        """Process all backfilled data from MinIO into database."""
        print(f"\n{'='*60}")
        print("⚙️  Processing backfilled data into database...")
        print(f"{'='*60}\n")
        
        try:
            records = self.transform_mgr.process_recent_files()
            print(f"✅ Processed {records} records into database")
            
            # Run aggregations
            print("\n📊 Running aggregations...")
            for symbol in config.SYMBOLS:
                self.transform_mgr.warehouse_agg.aggregate_hourly(symbol)
                self.transform_mgr.warehouse_agg.aggregate_daily(symbol)
            print("✅ Aggregations complete")
            
        except Exception as e:
            print(f"❌ Processing failed: {e}")
    
    def run(self, days=3):
        """
        Run the complete backfill process.
        
        Args:
            days: Number of days to backfill (default: 3)
        """
        print("\n" + "="*60)
        print("🚀 CRYPTO DATA BACKFILL - Recent Data")
        print("="*60)
        print(f"📅 Backfill period: Last {days} days")
        print(f"💱 Symbols: {', '.join(config.SYMBOLS)}")
        print(f"⚙️  Chunk size: {self.chunk_size} minutes")
        print(f"⏱️  Request delay: {self.delay_between_requests}s")
        print("="*60)
        
        start_total = time.time()
        grand_total = 0
        
        # Backfill each symbol
        for idx, symbol in enumerate(config.SYMBOLS, 1):
            try:
                total = self.backfill_symbol(symbol, days)
                grand_total += total
            except Exception as e:
                print(f"❌ Failed to backfill {symbol}: {e}")
            
            # Add delay between symbols
            if idx < len(config.SYMBOLS):
                print(f"\n⏸️  Waiting 2s before next symbol...")
                time.sleep(2)
        
        # Process all data
        self.process_backfilled_data()
        
        elapsed = time.time() - start_total
        print(f"\n{'='*60}")
        print(f"🎉 BACKFILL COMPLETE")
        print(f"{'='*60}")
        print(f"📊 Total klines fetched: {grand_total:,}")
        print(f"⏱️  Total time: {elapsed:.1f}s ({elapsed/60:.1f} minutes)")
        print(f"✅ Data is now available in the database")
        print("="*60 + "\n")


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Backfill recent cryptocurrency data from Binance'
    )
    parser.add_argument(
        '--days',
        type=int,
        default=3,
        help='Number of days to backfill (default: 3)'
    )
    
    args = parser.parse_args()
    
    # Validate days
    if args.days < 1 or args.days > 30:
        print("❌ Error: Days must be between 1 and 30")
        sys.exit(1)
    
    # Run backfill
    manager = BackfillManager()
    manager.run(days=args.days)


if __name__ == "__main__":
    main()
