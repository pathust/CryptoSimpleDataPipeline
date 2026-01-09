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

    def process_file(self, filepath, force_process=False):
        # Check if already processed (unless forced)
        if not force_process and self.datalake_mgr.is_file_processed(filepath):
            return 0  # Silently skip without logging
        
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
        processed_count = 0
        skipped_count = 0
        
        for f in files:
            count = self.process_file(f)
            if count > 0:
                processed_count += 1
                total_records += count
            else:
                skipped_count += 1
        
        # Print summary
        if processed_count > 0 or skipped_count > 0:
            print(f"📦 Processed {processed_count} new files, skipped {skipped_count} duplicates")
        
        # After processing, trigger aggregations
        if total_records > 0:
            print("🔄 Triggering aggregations...")
            self.warehouse_agg.aggregate_hourly()
            self.warehouse_agg.aggregate_daily()
        
        return total_records
    
    def run_maintenance(self):
        """Run data lake and warehouse maintenance tasks."""
        print("\n🧹 Running maintenance tasks...")
        
        # NEW: Detect and fill data gaps
        self._detect_and_fill_gaps()
        
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
    
    def _detect_and_fill_gaps(self):
        """Detect and fill gaps in klines data."""
        from src.modules.extract.manager import ExtractionManager
        from datetime import timedelta
        
        print("\n🔍 Detecting data gaps and integrity issues...")
        extractor = ExtractionManager()
        
        for symbol in config.SYMBOLS:
            try:
                conn = self.get_db_connection()
                cursor = conn.cursor()
                
                # STEP 0: Check data integrity - open[i] should equal close[i-1]
                cursor.execute("""
                    SELECT 
                        t1.open_time,
                        t1.close_price as prev_close,
                        t2.open_time,
                        t2.open_price as curr_open
                    FROM fact_klines t1
                    INNER JOIN fact_klines t2 
                        ON t1.symbol = t2.symbol
                        AND t2.open_time = DATE_ADD(t1.open_time, INTERVAL 1 MINUTE)
                    WHERE t1.symbol = %s 
                        AND t1.interval_code = '1m'
                        AND ABS(t1.close_price - t2.open_price) > 0.01
                    ORDER BY t1.open_time
                    LIMIT 10
                """, (symbol,))
                
                integrity_issues = cursor.fetchall()
                
                if integrity_issues:
                    print(f"\n⚠️  {symbol}: Found {len(integrity_issues)} price continuity issue(s)")
                    for prev_time, prev_close, curr_time, curr_open in integrity_issues:
                        print(f"   🔧 Fixing: {prev_time} close={prev_close:.2f} → {curr_time} open={curr_open:.2f}")
                        
                        # Delete both candles to refetch clean data
                        cursor.execute("""
                            DELETE FROM fact_klines 
                            WHERE symbol = %s 
                                AND interval_code = '1m'
                                AND open_time IN (%s, %s)
                        """, (symbol, prev_time, curr_time))
                        conn.commit()
                        
                        # Fetch clean data for this range
                        start_time = prev_time
                        klines = extractor.fetch_klines(
                            symbol,
                            interval="1m",
                            limit=10,
                            start_time=start_time
                        )
                        
                        if klines and len(klines) > 0:
                            filepath = extractor.save_to_datalake(klines, symbol, "klines")
                            if filepath:
                                self.process_file(filepath)
                                print(f"   ✅ Refetched and fixed {len(klines)} records")
                
                # Check for flat candles (open = close) - potential data quality issue
                cursor.execute("""
                    SELECT open_time, open_price, close_price
                    FROM fact_klines
                    WHERE symbol = %s 
                        AND interval_code = '1m'
                        AND ABS(open_price - close_price) <= 0.1
                        AND open_time >= NOW() - INTERVAL 1 DAY
                    ORDER BY open_time DESC
                    LIMIT 200
                """, (symbol,))
                
                flat_candles = cursor.fetchall()
                
                if flat_candles:
                    print(f"\n⚠️  {symbol}: Found {len(flat_candles)} flat candle(s) (open=close)")
                    for candle_time, open_p, close_p in flat_candles:
                        print(f"   🔧 Refetching: {candle_time} (open={open_p:.2f}, close={close_p:.2f})")
                        
                        # Delete flat candle
                        cursor.execute("""
                            DELETE FROM fact_klines 
                            WHERE symbol = %s 
                                AND interval_code = '1m'
                                AND open_time = %s
                        """, (symbol, candle_time))
                        conn.commit()
                        
                        # Fetch fresh data
                        klines = extractor.fetch_klines(
                            symbol,
                            interval="1m",
                            limit=5,
                            start_time=candle_time
                        )
                        
                        if klines and len(klines) > 0:
                            filepath = extractor.save_to_datalake(klines, symbol, "klines")
                            if filepath:
                                # Force process to bypass duplicate check
                                self.process_file(filepath, force_process=True)
                                print(f"   ✅ Refetched {len(klines)} records")
                
                # STEP 1: Check if we're missing recent data (latest DB → now)
                cursor.execute("""
                    SELECT MAX(open_time) as latest_time
                    FROM fact_klines
                    WHERE symbol = %s AND interval_code = '1m'
                """, (symbol,))
                result = cursor.fetchone()
                latest_time = result[0] if result else None
                
                if latest_time:
                    now = datetime.now()
                    minutes_since_latest = int((now - latest_time).total_seconds() / 60)
                    
                    # If gap from latest to now > 2 minutes, fetch missing data
                    if minutes_since_latest > 2:
                        print(f"\n🔧 {symbol}: Missing recent data (gap: {minutes_since_latest}m from {latest_time})")
                        start_time = latest_time + timedelta(minutes=1)
                        limit = min(minutes_since_latest + 10, 1000)
                        
                        klines = extractor.fetch_klines(
                            symbol, 
                            interval="1m", 
                            limit=limit,
                            start_time=start_time
                        )
                        
                        if klines and len(klines) > 0:
                            filepath = extractor.save_to_datalake(klines, symbol, "klines")
                            if filepath:
                                self.process_file(filepath)
                                print(f"   ✅ Filled {len(klines)} recent records")
                
                # STEP 2: Find gaps in historical data
                cursor.execute("""
                    SELECT 
                        t1.open_time as gap_start,
                        MIN(t2.open_time) as gap_end,
                        TIMESTAMPDIFF(MINUTE, t1.open_time, MIN(t2.open_time)) as gap_minutes
                    FROM fact_klines t1
                    LEFT JOIN fact_klines t2 
                        ON t1.symbol = t2.symbol 
                        AND t2.open_time > t1.open_time
                    WHERE t1.symbol = %s
                        AND t1.interval_code = '1m'
                    GROUP BY t1.open_time
                    HAVING gap_minutes > 1
                    ORDER BY gap_start
                    LIMIT 10
                """, (symbol,))
                
                gaps = cursor.fetchall()
                cursor.close()
                conn.close()
                
                if gaps:
                    print(f"\n🔧 {symbol}: Found {len(gaps)} historical gap(s)")
                    for gap_start, gap_end, gap_minutes in gaps:
                        if gap_minutes > 1000:
                            print(f"   ⚠️  Gap too large ({gap_minutes}m), skipping: {gap_start} → {gap_end}")
                            continue
                        
                        print(f"   📥 Filling gap: {gap_start} → {gap_end} ({gap_minutes} minutes)")
                        
                        # Fetch data to fill the gap
                        start_time = gap_start + timedelta(minutes=1)
                        klines = extractor.fetch_klines(
                            symbol, 
                            interval="1m", 
                            limit=min(gap_minutes + 10, 1000),
                            start_time=start_time
                        )
                        
                        if klines and len(klines) > 0:
                            # Save to datalake
                            filepath = extractor.save_to_datalake(klines, symbol, "klines")
                            if filepath:
                                # Process immediately
                                self.process_file(filepath)
                                print(f"   ✅ Filled {len(klines)} records")
                
                if not gaps and not integrity_issues and latest_time:
                    minutes_since = int((datetime.now() - latest_time).total_seconds() / 60)
                    if minutes_since <= 2:
                        print(f"✨ {symbol}: No gaps detected, data up-to-date")
                    
            except Exception as e:
                print(f"❌ Error detecting gaps for {symbol}: {e}")
                import traceback
                traceback.print_exc()
