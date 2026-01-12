import json
import os
import mysql.connector
from datetime import datetime
import src.config as config
import glob
from src.modules.datalake.manager import DataLakeManager
from src.modules.warehouse.aggregator import WarehouseAggregator
import tempfile
import logging

logger = logging.getLogger(__name__)

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
        """
        Process a file from MinIO storage.
        
        Args:
            filepath: MinIO object name
            force_process: Force processing even if already processed
        """
        # Check if already processed (unless forced)
        if not force_process and self.datalake_mgr.is_file_processed(filepath):
            return 0  # Silently skip without logging
        
        temp_file = None
        try:
            conn = self.get_db_connection()
            conn.autocommit = False
            cursor = conn.cursor()
            
            symbol = None
            data_type = None
            count = 0
            
            # Download from MinIO to temporary file
            temp_file = tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False)
            temp_path = temp_file.name
            temp_file.close()
            
            if not self.datalake_mgr.minio_client.download_file(
                filepath,
                temp_path,
                bucket=self.datalake_mgr.minio_client.bucket_raw
            ):
                logger.error(f"Failed to download from MinIO: {filepath}")
                return 0
            
            process_path = temp_path
            
            # Process the file
            if "klines" in filepath:
                symbol, count = self._process_klines(process_path, cursor)
                data_type = "klines"
            elif "depth" in filepath:
                symbol, count = self._process_depth(process_path, cursor)
                data_type = "depth"
            
            conn.commit()
            cursor.close()
            conn.close()
            
            # Mark file as processed
            if count > 0 and symbol and data_type:
                self.datalake_mgr.mark_file_processed(filepath, symbol, data_type, count)
            
            return count
        except Exception as e:
            logger.error(f"Error processing {filepath}: {e}")
            return 0
        finally:
            # Cleanup temporary file
            if temp_file and os.path.exists(temp_file.name):
                try:
                    os.unlink(temp_file.name)
                except Exception as e:
                    logger.warning(f"Failed to cleanup temp file: {e}")

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
        """Process files from today's folder in MinIO."""
        today = datetime.now().strftime("%Y-%m-%d")
        
        # List objects from MinIO with today's prefix
        prefix = f"{today}/"
        files = self.datalake_mgr.minio_client.list_objects(
            prefix=prefix,
            bucket=self.datalake_mgr.minio_client.bucket_raw
        )
        
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
                            object_path = extractor.save_to_datalake(klines, symbol, "klines")
                            if object_path:
                                self.process_file(object_path)
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
                            object_path = extractor.save_to_datalake(klines, symbol, "klines")
                            if object_path:
                                # Force process to bypass duplicate check
                                self.process_file(object_path, force_process=True)
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
                            object_path = extractor.save_to_datalake(klines, symbol, "klines")
                            if object_path:
                                self.process_file(object_path)
                                print(f"   ✅ Filled {len(klines)} recent records")
                
                # STEP 1.5: Detect completely missing time periods (entire days with no data)
                # This handles cases where there are NO records at all in certain date ranges
                cursor.execute("""
                    SELECT MIN(open_time) as min_time, MAX(open_time) as max_time
                    FROM fact_klines
                    WHERE symbol = %s AND interval_code = '1m'
                """, (symbol,))
                
                result = cursor.fetchone()
                if result and result[0] and result[1]:
                    min_time = result[0]
                    max_time = result[1]
                    
                    # Check for large gaps (>60 minutes) that might indicate missing days
                    cursor.execute("""
                        SELECT 
                            DATE(t1.open_time) as date1,
                            DATE(MIN(t2.open_time)) as date2,
                            TIMESTAMPDIFF(HOUR, t1.open_time, MIN(t2.open_time)) as gap_hours
                        FROM fact_klines t1
                        LEFT JOIN fact_klines t2 
                            ON t1.symbol = t2.symbol 
                            AND t2.open_time > t1.open_time
                        WHERE t1.symbol = %s
                            AND t1.interval_code = '1m'
                        GROUP BY t1.open_time
                        HAVING gap_hours > 1
                        ORDER BY t1.open_time
                    """, (symbol,))
                    
                    large_gaps = cursor.fetchall()
                    
                    if large_gaps:
                        print(f"\n🔍 {symbol}: Scanning for missing time periods...")
                        for date1, date2, gap_hours in large_gaps:
                            if gap_hours >= 24:  # Missing at least a day
                                # Find the exact time range
                                cursor.execute("""
                                    SELECT open_time FROM fact_klines
                                    WHERE symbol = %s AND interval_code = '1m'
                                        AND DATE(open_time) = %s
                                    ORDER BY open_time DESC LIMIT 1
                                """, (symbol, date1))
                                last_time_day1 = cursor.fetchone()
                                
                                cursor.execute("""
                                    SELECT open_time FROM fact_klines
                                    WHERE symbol = %s AND interval_code = '1m'
                                        AND DATE(open_time) = %s
                                    ORDER BY open_time ASC LIMIT 1
                                """, (symbol, date2))
                                first_time_day2 = cursor.fetchone()
                                
                                if last_time_day1 and first_time_day2:
                                    gap_start_time = last_time_day1[0]
                                    gap_end_time = first_time_day2[0]
                                    gap_minutes = int((gap_end_time - gap_start_time).total_seconds() / 60)
                                    
                                    print(f"   📅 Found {gap_hours}h gap: {gap_start_time} → {gap_end_time}")
                                    print(f"   ⚠️  Filling {gap_minutes} minutes in chunks...")
                                    
                                    # Fill in chunks
                                    filled_total = 0
                                    current_start = gap_start_time + timedelta(minutes=1)
                                    
                                    while current_start < gap_end_time:
                                        minutes_remaining = int((gap_end_time - current_start).total_seconds() / 60)
                                        chunk_size = min(minutes_remaining + 10, 1000)
                                        
                                        klines = extractor.fetch_klines(
                                            symbol,
                                            interval="1m",
                                            limit=chunk_size,
                                            start_time=current_start
                                        )
                                        
                                        if klines and len(klines) > 0:
                                            object_path = extractor.save_to_datalake(klines, symbol, "klines")
                                            if object_path:
                                                self.process_file(object_path)
                                                filled_total += len(klines)
                                                
                                                # Move start time forward
                                                last_candle_time = datetime.fromtimestamp(klines[-1][0] / 1000)
                                                current_start = last_candle_time + timedelta(minutes=1)
                                                
                                                print(f"      Progress: {filled_total}/{gap_minutes} records", end='\r')
                                        else:
                                            break
                                    
                                    if filled_total > 0:
                                        print(f"\n   ✅ Filled {filled_total} records across missing period")
                
                # STEP 2: Find gaps in historical data  
                # Remove LIMIT to process ALL gaps, even large ones
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
                """, (symbol,))
                
                gaps = cursor.fetchall()
                cursor.close()
                conn.close()
                
                if gaps:
                    print(f"\n🔧 {symbol}: Found {len(gaps)} historical gap(s)")
                    for gap_start, gap_end, gap_minutes in gaps:
                        print(f"   📥 Filling gap: {gap_start} → {gap_end} ({gap_minutes} minutes)")
                        
                        # If gap is too large, break into chunks of 1000
                        if gap_minutes > 1000:
                            print(f"   ⚠️  Gap is large, splitting into {(gap_minutes // 1000) + 1} chunks")
                            
                            filled_total = 0
                            current_start = gap_start + timedelta(minutes=1)
                            
                            while current_start < gap_end:
                                # Calculate how many minutes to fetch (max 1000)
                                minutes_remaining = int((gap_end - current_start).total_seconds() / 60)
                                chunk_size = min(minutes_remaining + 10, 1000)
                                
                                klines = extractor.fetch_klines(
                                    symbol,
                                    interval="1m",
                                    limit=chunk_size,
                                    start_time=current_start
                                )
                                
                                if klines and len(klines) > 0:
                                    object_path = extractor.save_to_datalake(klines, symbol, "klines")
                                    if object_path:
                                        self.process_file(object_path)
                                        filled_total += len(klines)
                                        
                                        # Move start time forward
                                        last_candle_time = datetime.fromtimestamp(klines[-1][0] / 1000)
                                        current_start = last_candle_time + timedelta(minutes=1)
                                else:
                                    break
                            
                            if filled_total > 0:
                                print(f"   ✅ Filled {filled_total} records in multiple chunks")
                        else:
                            # Gap is small enough for single API call
                            start_time = gap_start + timedelta(minutes=1)
                            klines = extractor.fetch_klines(
                                symbol,
                                interval="1m",
                                limit=min(gap_minutes + 10, 1000),
                                start_time=start_time
                            )
                            
                            if klines and len(klines) > 0:
                                object_path = extractor.save_to_datalake(klines, symbol, "klines")
                                if object_path:
                                    self.process_file(object_path)
                                    print(f"   ✅ Filled {len(klines)} records")
                
                if not gaps and not integrity_issues and latest_time:
                    minutes_since = int((datetime.now() - latest_time).total_seconds() / 60)
                    if minutes_since <= 2:
                        print(f"✨ {symbol}: No gaps detected, data up-to-date")
                    
            except Exception as e:
                print(f"❌ Error detecting gaps for {symbol}: {e}")
                import traceback
                traceback.print_exc()
