#!/usr/bin/env python3
"""
Migration script to move existing local data lake files to MinIO.

This script:
1. Uploads all files from data_lake/raw/ to MinIO 'crypto-raw' bucket
2. Uploads all files from data_lake/archive/ to MinIO 'crypto-archive' bucket
3. Updates the database to reflect new object paths

Usage:
    python migrate_to_minio.py [--dry-run]
"""

import os
import sys
import glob
import mysql.connector
from datetime import datetime
import src.config as config
from src.modules.datalake.minio_client import MinioClient

def get_db_connection():
    return mysql.connector.connect(
        host=config.DB_HOST,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME
    )

def migrate_to_minio(dry_run=False):
    """
    Migrate local files to MinIO.
    
    Args:
        dry_run: If True, only print what would be done without actually doing it
    """
    print("=" * 80)
    print("MinIO Migration Tool")
    print("=" * 80)
    
    if dry_run:
        print("\n⚠️  DRY RUN MODE - No changes will be made\n")
    
    # Initialize MinIO client
    try:
        minio_client = MinioClient()
        print(f"✅ Connected to MinIO at {config.MINIO_ENDPOINT}")
        print(f"   Raw bucket: {minio_client.bucket_raw}")
        print(f"   Archive bucket: {minio_client.bucket_archive}")
    except Exception as e:
        print(f"❌ Failed to connect to MinIO: {e}")
        print("\nPlease ensure MinIO is running:")
        print("  docker-compose up -d")
        return False
    
    # Get database connection
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        print(f"✅ Connected to database: {config.DB_NAME}")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return False
    
    total_uploaded = 0
    total_updated = 0
    
    # Migrate raw files
    print("\n" + "=" * 80)
    print("Migrating raw files...")
    print("=" * 80)
    
    raw_dir = config.RAW_DATA_DIR
    if os.path.exists(raw_dir):
        # Find all JSON files in raw directory
        pattern = os.path.join(raw_dir, "**", "*.json")
        files = glob.glob(pattern, recursive=True)
        
        print(f"Found {len(files)} files in {raw_dir}")
        
        for file_path in files:
            # Extract relative path from raw directory
            rel_path = os.path.relpath(file_path, raw_dir)
            object_name = rel_path.replace(os.sep, '/')  # Convert to forward slashes
            
            print(f"\n📁 {rel_path}")
            
            if not dry_run:
                # Upload to MinIO
                if minio_client.upload_file(file_path, object_name, bucket=minio_client.bucket_raw):
                    print(f"   ✅ Uploaded to MinIO: {minio_client.bucket_raw}/{object_name}")
                    total_uploaded += 1
                    
                    # Update database if file is in processed_files table
                    cursor.execute("""
                        SELECT file_path, file_name FROM processed_files 
                        WHERE file_path = %s
                    """, (file_path,))
                    
                    result = cursor.fetchone()
                    if result:
                        cursor.execute("""
                            UPDATE processed_files 
                            SET file_path = %s 
                            WHERE file_path = %s
                        """, (object_name, file_path))
                        conn.commit()
                        print(f"   ✅ Updated database record")
                        total_updated += 1
                else:
                    print(f"   ❌ Failed to upload")
            else:
                print(f"   Would upload to: {minio_client.bucket_raw}/{object_name}")
    else:
        print(f"⚠️  Raw directory not found: {raw_dir}")
    
    # Migrate archived files
    print("\n" + "=" * 80)
    print("Migrating archived files...")
    print("=" * 80)
    
    archive_dir = os.path.join(config.DATA_LAKE_DIR, "archive")
    if os.path.exists(archive_dir):
        # Find all JSON files in archive directory
        pattern = os.path.join(archive_dir, "**", "*.json")
        files = glob.glob(pattern, recursive=True)
        
        print(f"Found {len(files)} files in {archive_dir}")
        
        for file_path in files:
            # Extract relative path from archive directory
            rel_path = os.path.relpath(file_path, archive_dir)
            object_name = rel_path.replace(os.sep, '/')  # Convert to forward slashes
            
            print(f"\n📁 {rel_path}")
            
            if not dry_run:
                # Upload to MinIO archive bucket
                if minio_client.upload_file(file_path, object_name, bucket=minio_client.bucket_archive):
                    print(f"   ✅ Uploaded to MinIO: {minio_client.bucket_archive}/{object_name}")
                    total_uploaded += 1
                    
                    # Update database if file is in processed_files table
                    cursor.execute("""
                        SELECT file_path, file_name FROM processed_files 
                        WHERE file_path = %s
                    """, (file_path,))
                    
                    result = cursor.fetchone()
                    if result:
                        new_path = f"archive/{object_name}"
                        cursor.execute("""
                            UPDATE processed_files 
                            SET file_path = %s 
                            WHERE file_path = %s
                        """, (new_path, file_path))
                        conn.commit()
                        print(f"   ✅ Updated database record")
                        total_updated += 1
                else:
                    print(f"   ❌ Failed to upload")
            else:
                print(f"   Would upload to: {minio_client.bucket_archive}/{object_name}")
    else:
        print(f"⚠️  Archive directory not found: {archive_dir}")
    
    cursor.close()
    conn.close()
    
    # Summary
    print("\n" + "=" * 80)
    print("Migration Summary")
    print("=" * 80)
    
    if not dry_run:
        print(f"✅ Uploaded {total_uploaded} files to MinIO")
        print(f"✅ Updated {total_updated} database records")
        print("\n💡 Next steps:")
        print("   1. Verify files in MinIO console: http://localhost:9001")
        print("   2. Test the pipeline: python run_backend.py")
        print("   3. If everything works, you can delete the local data_lake/ directory")
    else:
        print("⚠️  This was a dry run. Use without --dry-run to perform actual migration.")
    
    return True

if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    
    if not dry_run:
        print("\n⚠️  This will migrate all local data lake files to MinIO.")
        print("    Make sure MinIO is running: docker-compose up -d")
        response = input("\nProceed with migration? [y/N]: ")
        if response.lower() != 'y':
            print("Migration cancelled.")
            sys.exit(0)
    
    success = migrate_to_minio(dry_run)
    sys.exit(0 if success else 1)
