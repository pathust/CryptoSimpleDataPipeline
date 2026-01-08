import os
import shutil
from datetime import datetime, timedelta
import mysql.connector
import src.config as config

class DataLakeManager:
    def __init__(self):
        self.raw_dir = config.RAW_DATA_DIR
        self.archive_dir = os.path.join(config.DATA_LAKE_DIR, "archive")
        os.makedirs(self.archive_dir, exist_ok=True)
    
    def get_db_connection(self):
        return mysql.connector.connect(
            host=config.DB_HOST,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME
        )
    
    def mark_file_processed(self, file_path, symbol, data_type, record_count):
        """Mark a file as processed in the database."""
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
            print(f"Error marking file as processed: {e}")
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
            print(f"Error checking if file is processed: {e}")
            return False
    
    def archive_old_files(self, days_old=7):
        """Archive processed files older than specified days."""
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
                if os.path.exists(file_path):
                    # Extract date from path for organizing archive
                    parts = file_path.split(os.sep)
                    date_folder = None
                    for part in parts:
                        if '-' in part and len(part) == 10:  # YYYY-MM-DD format
                            date_folder = part
                            break
                    
                    if date_folder:
                        archive_path = os.path.join(self.archive_dir, date_folder)
                        os.makedirs(archive_path, exist_ok=True)
                        
                        dest_file = os.path.join(archive_path, file_info['file_name'])
                        shutil.move(file_path, dest_file)
                        
                        # Mark as archived
                        cursor.execute("""
                            UPDATE processed_files 
                            SET archived = TRUE, file_path = %s 
                            WHERE file_path = %s
                        """, (dest_file, file_path))
                        
                        archived_count += 1
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"📦 Archived {archived_count} files")
            return archived_count
            
        except Exception as e:
            print(f"Error archiving files: {e}")
            return 0
    
    def cleanup_old_archives(self, days_old=30):
        """Delete archived files older than specified days."""
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
                if os.path.exists(file_path):
                    os.remove(file_path)
                    deleted_count += 1
                
                # Remove from database
                cursor.execute("DELETE FROM processed_files WHERE file_path = %s", (file_path,))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"🗑️  Deleted {deleted_count} old archived files")
            return deleted_count
            
        except Exception as e:
            print(f"Error cleaning up archives: {e}")
            return 0
    
    def get_statistics(self):
        """Get statistics about the data lake."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("SELECT COUNT(*) as total FROM processed_files")
            total = cursor.fetchone()['total']
            
            cursor.execute("SELECT COUNT(*) as archived FROM processed_files WHERE archived = TRUE")
            archived = cursor.fetchone()['archived']
            
            cursor.execute("SELECT SUM(record_count) as records FROM processed_files")
            records = cursor.fetchone()['records'] or 0
            
            cursor.close()
            conn.close()
            
            return {
                "total_files": total,
                "archived_files": archived,
                "active_files": total - archived,
                "total_records": records
            }
        except Exception as e:
            print(f"Error getting statistics: {e}")
            return {}
