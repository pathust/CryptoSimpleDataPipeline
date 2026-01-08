import json
import os
import mysql.connector
from datetime import datetime
import src.config as config
import glob
from src.modules.datalake.manager import DataLakeManager
from src.modules.warehouse.aggregator import WarehouseAggregator

class TransformManager:
    def __init__(self):
        self.datalake_mgr = DataLakeManager()
        self.warehouse_agg = WarehouseAggregator()

    def get_db_connection(self):
        return mysql.connector.connect(
            host=config.DB_HOST,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME
        )

    def process_file(self, filepath):
        # Check if already processed
        if self.datalake_mgr.is_file_processed(filepath):
            print(f"⏭️  Skipping {os.path.basename(filepath)} (already processed)")
            return 0
        
        try:
            conn = self.get_db_connection()
            conn.autocommit = False
            cursor = conn.cursor()
            
            symbol = None
            data_type = None
            count = 0
            
            if "klines" in filepath:
                symbol, count = self._process_klines(filepath, cursor)
                data_type = "klines"
            elif "depth" in filepath:
                symbol, count = self._process_depth(filepath, cursor)
                data_type = "depth"
            
            conn.commit()
            cursor.close()
            conn.close()
            
            # Mark file as processed
            if count > 0 and symbol and data_type:
                self.datalake_mgr.mark_file_processed(filepath, symbol, data_type, count)
            
            return count
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
            return 0

    def _process_klines(self, filepath,cursor):
        with open(filepath, 'r') as f:
            payload = json.load(f)
        
        symbol = payload.get('symbol')
        interval = payload.get('interval')
        raw_data = payload.get('data')

        if not raw_data:
            return symbol, 0

        values = []
        for k in raw_data:
            open_time = datetime.fromtimestamp(k[0] / 1000)
            close_time = datetime.fromtimestamp(k[6] / 1000)
            open_p = k[1]
            high_p = k[2]
            low_p = k[3]
            close_p = k[4]
            vol = k[5]
            values.append((symbol, interval, open_time, open_p, high_p, low_p, close_p, vol, close_time))

        sql = """
        INSERT INTO fact_klines 
        (symbol, interval_code, open_time, open_price, high_price, low_price, close_price, volume, close_time)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            open_price = VALUES(open_price),
            high_price = VALUES(high_price),
            low_price = VALUES(low_price),
            close_price = VALUES(close_price),
            volume = VALUES(volume),
            close_time = VALUES(close_time)
        """
        
        cursor.executemany(sql, values)
        return symbol, len(values)

    def _process_depth(self, filepath, cursor):
        with open(filepath, 'r') as f:
            payload = json.load(f)
            
        symbol = payload.get('symbol')
        raw_data = payload.get('data')
        captured_at_str = payload.get('captured_at')
        
        if not raw_data:
            return symbol, 0

        captured_at = datetime.fromisoformat(captured_at_str)

        values = []
        for bid in raw_data.get('bids', []):
            values.append((symbol, 'bid', bid[0], bid[1], captured_at))
            
        for ask in raw_data.get('asks', []):
            values.append((symbol, 'ask', ask[0], ask[1], captured_at))

        sql = """
        INSERT INTO fact_orderbook (symbol, side, price, quantity, captured_at)
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.executemany(sql, values)
        return symbol, len(values)

    def process_recent_files(self):
        """Process files from today's folder."""
        today = datetime.now().strftime("%Y-%m-%d")
        search_path = os.path.join(config.RAW_DATA_DIR, today, "*.json")
        files = glob.glob(search_path)
        
        total_records = 0
        for f in files:
            count = self.process_file(f)
            total_records += count
        
        # After processing, trigger aggregations
        if total_records > 0:
            print("🔄 Triggering aggregations...")
            self.warehouse_agg.aggregate_hourly()
            self.warehouse_agg.aggregate_daily()
        
        return total_records
    
    def run_maintenance(self):
        """Run data lake and warehouse maintenance tasks."""
        print("\n🧹 Running maintenance tasks...")
        
        # Archive old files (7+ days)
        self.datalake_mgr.archive_old_files(days_old=7)
        
        # Cleanup very old archives (30+ days)
        self.datalake_mgr.cleanup_old_archives(days_old=30)
        
        # Cleanup old warehouse data (90+ days)
        self.warehouse_agg.cleanup_old_data(days_to_keep=90)
        
        # Print statistics
        dl_stats = self.datalake_mgr.get_statistics()
        wh_stats = self.warehouse_agg.get_statistics()
        
        print(f"\n📊 Data Lake: {dl_stats.get('active_files', 0)} active files, {dl_stats.get('archived_files', 0)} archived")
        print(f"📊 Warehouse: {wh_stats.get('klines_count', 0)} klines, {wh_stats.get('hourly_count', 0)} hourly, {wh_stats.get('daily_count', 0)} daily")
