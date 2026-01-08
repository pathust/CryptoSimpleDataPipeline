import requests
import json
import os
import time
from datetime import datetime, timedelta
import src.config as config
import mysql.connector

class ExtractionManager:
    def __init__(self):
        self.api_url = "https://api.binance.com/api/v3"

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
        """Save data to local data lake as JSON."""
        if not data:
            return None

        today = datetime.now().strftime("%Y-%m-%d")
        save_dir = os.path.join(config.RAW_DATA_DIR, today)
        os.makedirs(save_dir, exist_ok=True)
        
        timestamp = int(time.time() * 1000)
        filename = f"{symbol}_{data_type}_{timestamp}.json"
        filepath = os.path.join(save_dir, filename)
        
        payload = {
            "symbol": symbol,
            "captured_at": datetime.now().isoformat(),
            "type": data_type,
            "data": data
        }
        
        if data_type == "klines":
            payload["interval"] = "1m"

        with open(filepath, 'w') as f:
            json.dump(payload, f)
        
        return filepath

    def run_cycle(self):
        """Runs one cycle of extraction for all symbols - SMART VERSION."""
        generated_files = []
        for symbol in config.SYMBOLS:
            # Extract Klines - only fetch new data
            last_time = self.get_last_extraction_time(symbol, "klines")
            
            # If we have previous data, fetch from that time + 1 minute
            start_time = None
            if last_time:
                start_time = last_time + timedelta(minutes=1)
                print(f"📊 {symbol}: Fetching new klines since {start_time}")
            else:
                print(f"📊 {symbol}: First fetch (100 records)")
            
            klines = self.fetch_klines(symbol, start_time=start_time)
            
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
