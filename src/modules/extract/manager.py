import requests
import json
import os
import time
from datetime import datetime, timedelta
import src.config as config
import mysql.connector
from src.modules.datalake.minio_client import MinioClient
import logging
import tempfile

logger = logging.getLogger(__name__)


class ExtractionManager:
    def __init__(self):
        self.api_url = "https://api.binance.com/api/v3"
        
        # Initialize MinIO client - MANDATORY, no fallback
        self.minio_client = MinioClient()
        logger.info("ExtractionManager initialized with MinIO storage")


    def get_db_connection(self):
        return mysql.connector.connect(
            host=config.DB_HOST,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME
        )

    def get_last_extraction_time(self, symbol, data_type):
        """Get the last extraction time from metadata table."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT last_open_time FROM extraction_metadata 
                WHERE symbol = %s AND data_type = %s
            """, (symbol, data_type))
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            return result[0] if result else None
        except Exception as e:
            print(f"Error getting last extraction time: {e}")
            return None

    def update_extraction_metadata(self, symbol, data_type, last_open_time, count):
        """Update metadata after successful extraction."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO extraction_metadata 
                (symbol, data_type, last_fetch_time, last_open_time, record_count)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    last_fetch_time = VALUES(last_fetch_time),
                    last_open_time = VALUES(last_open_time),
                    record_count = record_count + VALUES(record_count)
            """, (symbol, data_type, datetime.now(), last_open_time, count))
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error updating metadata: {e}")

    def fetch_klines(self, symbol, interval="1m", limit=100, start_time=None):
        """Fetch K-lines data, optionally from a specific time."""
        endpoint = f"{self.api_url}/klines"
        params = {
            "symbol": symbol,
            "interval": interval,
            "limit": limit
        }
        
        # If we have a start time, fetch only new data
        if start_time:
            # Convert to milliseconds timestamp
            start_ms = int(start_time.timestamp() * 1000)
            params["startTime"] = start_ms
        
        try:
            response = requests.get(endpoint, params=params, timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error fetching klines for {symbol}: {response.text}")
                return None
        except Exception as e:
            print(f"Exception fetching klines for {symbol}: {e}")
            return None

    def fetch_depth(self, symbol, limit=20):
        """Fetch Order Book (Depth) data."""
        endpoint = f"{self.api_url}/depth"
        params = {
            "symbol": symbol,
            "limit": limit
        }
        try:
            response = requests.get(endpoint, params=params, timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error fetching depth for {symbol}: {response.text}")
                return None
        except Exception as e:
            print(f"Exception fetching depth for {symbol}: {e}")
            return None

    def save_to_datalake(self, data, symbol, data_type):
        """
        Save data to MinIO data lake (MANDATORY).
        
        Returns:
            MinIO object path
        
        Raises:
            Exception if MinIO upload fails
        """
        if not data:
            return None

        today = datetime.now().strftime("%Y-%m-%d")
        timestamp = int(time.time() * 1000)
        filename = f"{symbol}_{data_type}_{timestamp}.json"
        
        payload = {
            "symbol": symbol,
            "captured_at": datetime.now().isoformat(),
            "type": data_type,
            "data": data
        }
        
        if data_type == "klines":
            payload["interval"] = "1m"
        
        json_data = json.dumps(payload)
        
        # Save to MinIO - MANDATORY, no fallback
        object_name = f"{today}/{filename}"
        
        if not self.minio_client.upload_data(
            json_data,
            object_name,
            bucket=self.minio_client.bucket_raw
        ):
            raise Exception(f"Failed to upload to MinIO: {object_name}")
        
        # Return MinIO object path
        return object_name


    def run_cycle(self):
        """Runs one cycle of extraction for all symbols - SMART VERSION."""
        generated_files = []
        for symbol in config.SYMBOLS:
            # Extract Klines - only fetch new data
            last_time = self.get_last_extraction_time(symbol, "klines")
            
            # If we have previous data, fetch from that time + 1 minute
            start_time = None
            limit = 100  # Default for first fetch
            
            if last_time:
                start_time = last_time + timedelta(minutes=1)
                # Calculate how many minutes since last fetch
                now = datetime.now()
                minutes_gap = int((now - start_time).total_seconds() / 60)
                
                # Binance API limit is 1000 candles per request
                limit = min(minutes_gap + 10, 1000)  # +10 buffer, max 1000
                
                print(f"📊 {symbol}: Fetching new klines since {start_time} (gap: {minutes_gap}m, limit: {limit})")
            else:
                print(f"📊 {symbol}: First fetch ({limit} records)")
            
            klines = self.fetch_klines(symbol, start_time=start_time, limit=limit)
            
            if klines and len(klines) > 0:
                f1 = self.save_to_datalake(klines, symbol, "klines")
                if f1:
                    generated_files.append(f1)
                    # Update metadata with the latest open_time
                    latest_open_time = datetime.fromtimestamp(klines[-1][0] / 1000)
                    self.update_extraction_metadata(symbol, "klines", latest_open_time, len(klines))
                    print(f"✅ {symbol}: Saved {len(klines)} new klines")
            else:
                print(f"⏭️  {symbol}: No new klines data")
            
            # Extract Depth - always fetch latest (snapshots)
            depth = self.fetch_depth(symbol)
            if depth:
                f2 = self.save_to_datalake(depth, symbol, "depth")
                if f2:
                    generated_files.append(f2)
                    bid_count = len(depth.get('bids', []))
                    ask_count = len(depth.get('asks', []))
                    total = bid_count + ask_count
                    self.update_extraction_metadata(symbol, "depth", datetime.now(), total)
                    print(f"✅ {symbol}: Saved depth snapshot ({total} entries)")
            
        return generated_files
