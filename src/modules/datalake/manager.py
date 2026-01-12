import os
import shutil
from datetime import datetime, timedelta
import mysql.connector
import src.config as config
from src.modules.datalake.minio_client import MinioClient
import logging

logger = logging.getLogger(__name__)

class DataLakeManager:
    def __init__(self):
        self.raw_dir = config.RAW_DATA_DIR  # Keep for backward compatibility during migration
        self.archive_dir = os.path.join(config.DATA_LAKE_DIR, "archive")
        os.makedirs(self.archive_dir, exist_ok=True)
        
        # Initialize MinIO client - MANDATORY, no fallback
        self.minio_client = MinioClient()
        logger.info("DataLakeManager initialized with MinIO storage")
    
    def get_db_connection(self):
        return mysql.connector.connect(
            host=config.DB_HOST,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME
        )
    
    def mark_file_processed(self, file_path, symbol, data_type, record_count):
        """
        Mark a file as processed in the database.
        
        Args:
            file_path: MinIO object name or local file path
            symbol: Trading symbol
            data_type: Type of data (klines or depth)
            record_count: Number of records in file
        """
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            file_name = os.path.basename(file_path)
            cursor.execute("""
                INSERT INTO processed_files 
                (file_path, file_name, symbol, data_type, record_count)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    record_count = VALUES(record_count),
                    processed_at = CURRENT_TIMESTAMP
            """, (file_path, file_name, symbol, data_type, record_count))
            
            conn.commit()
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error marking file as processed: {e}")
            return False
    
    def is_file_processed(self, file_path):
        """Check if a file has already been processed."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM processed_files WHERE file_path = %s", (file_path,))
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            return result is not None
        except Exception as e:
            logger.error(f"Error checking if file is processed: {e}")
            return False
    
    def archive_old_files(self, days_old=7):
        """
        Archive processed files older than specified days.
        For MinIO: moves objects from raw bucket to archive bucket.
        For local: moves files to archive directory.
        """
        cutoff_date = datetime.now() - timedelta(days=days_old)
        archived_count = 0
        
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Find files to archive
            cursor.execute("""
                SELECT file_path, file_name 
                FROM processed_files 
                WHERE processed_at < %s AND archived = FALSE
            """, (cutoff_date,))
            
            files_to_archive = cursor.fetchall()
            
            for file_info in files_to_archive:
                file_path = file_info['file_path']
                file_name = file_info['file_name']
                
                # MinIO: move object from raw to archive bucket
                # Extract date folder from file path or use current structure
                parts = file_path.split('/')
                if len(parts) > 1:
                    object_name = '/'.join(parts[-2:])  # e.g., "2026-01-12/BTCUSDT_klines_123.json"
                else:
                    object_name = file_path
                
                # Move to archive bucket
                if self.minio_client.move_object(
                    object_name,
                    object_name,
                    src_bucket=self.minio_client.bucket_raw,
                    dst_bucket=self.minio_client.bucket_archive
                ):
                    # Update database with new location
                    new_path = f"archive/{object_name}"
                    cursor.execute("""
                        UPDATE processed_files 
                        SET archived = TRUE, file_path = %s 
                        WHERE file_path = %s
                    """, (new_path, file_path))
                    archived_count += 1
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"📦 Archived {archived_count} files")
            return archived_count
            
        except Exception as e:
            logger.error(f"Error archiving files: {e}")
            return 0
    
    def cleanup_old_archives(self, days_old=30):
        """
        Delete archived files older than specified days.
        For MinIO: deletes objects from archive bucket.
        For local: deletes files from archive directory.
        """
        cutoff_date = datetime.now() - timedelta(days=days_old)
        deleted_count = 0
        
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Find very old archived files
            cursor.execute("""
                SELECT file_path 
                FROM processed_files 
                WHERE processed_at < %s AND archived = TRUE
            """, (cutoff_date,))
            
            files_to_delete = cursor.fetchall()
            
            for file_info in files_to_delete:
                file_path = file_info['file_path']
                
                # MinIO: delete from archive bucket
                # Remove 'archive/' prefix if present
                object_name = file_path.replace('archive/', '', 1)
                
                if self.minio_client.delete_object(
                    object_name,
                    bucket=self.minio_client.bucket_archive
                ):
                    deleted_count += 1
                
                # Remove from database
                cursor.execute("DELETE FROM processed_files WHERE file_path = %s", (file_path,))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"🗑️  Deleted {deleted_count} old archived files")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up archives: {e}")
            return 0
    
    def get_statistics(self):
        """Get statistics about the data lake."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Count active and archived files
            cursor.execute("SELECT COUNT(*) as count FROM processed_files WHERE archived = FALSE")
            active_count = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM processed_files WHERE archived = TRUE")
            archived_count = cursor.fetchone()['count']
            
            cursor.close()
            conn.close()
            
            return {
                "active_files": active_count,
                "archived_files": archived_count,
                "storage_type": "MinIO"
            }
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {
                "active_files": 0,
                "archived_files": 0,
                "storage_type": "MinIO"
            }
