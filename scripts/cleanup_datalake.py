#!/usr/bin/env python3
"""
Standalone script to cleanup MinIO data lake.
This script can be run manually to free up disk space.
"""

import sys
import os
import argparse
from datetime import datetime

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.modules.datalake.retention_manager import RetentionManager
import src.config as config


def format_bytes(bytes_value):
    """Format bytes to human readable format."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.2f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.2f} PB"


def main():
    parser = argparse.ArgumentParser(
        description='Cleanup old data from MinIO data lake',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry run to see what would be deleted
  python cleanup_datalake.py --dry-run
  
  # Delete files older than 7 days
  python cleanup_datalake.py --max-age-days 7
  
  # Limit bucket size to 10GB
  python cleanup_datalake.py --max-size-gb 10
  
  # Full cleanup with default settings
  python cleanup_datalake.py
        """
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be deleted without actually deleting'
    )
    
    parser.add_argument(
        '--max-age-days',
        type=int,
        default=None,
        help=f'Maximum age of files in days (default: {config.RETENTION_MAX_AGE_DAYS})'
    )
    
    parser.add_argument(
        '--max-size-gb',
        type=int,
        default=None,
        help=f'Maximum bucket size in GB (default: {config.RETENTION_MAX_SIZE_GB})'
    )
    
    parser.add_argument(
        '--bucket',
        default=config.MINIO_BUCKET_RAW,
        help=f'Bucket to cleanup (default: {config.MINIO_BUCKET_RAW})'
    )
    
    parser.add_argument(
        '--age-only',
        action='store_true',
        help='Only perform age-based cleanup'
    )
    
    parser.add_argument(
        '--size-only',
        action='store_true',
        help='Only perform size-based cleanup'
    )
    
    parser.add_argument(
        '-y', '--yes',
        action='store_true',
        help='Skip confirmation prompt'
    )
    
    args = parser.parse_args()
    
    # Initialize retention manager
    retention_mgr = RetentionManager()
    
    print("=" * 60)
    print("MinIO Data Lake Cleanup Utility")
    print("=" * 60)
    print()
    
    # Show current status
    print(f"📊 Current Status:")
    print(f"   Bucket: {args.bucket}")
    
    try:
        current_size = retention_mgr.get_bucket_size(args.bucket)
        print(f"   Current Size: {format_bytes(current_size)} ({current_size / (1024**3):.2f} GB)")
        
        objects = retention_mgr.get_objects_with_metadata(args.bucket)
        print(f"   Total Objects: {len(objects)}")
        
        if objects:
            oldest = objects[0][1]  # First object (oldest)
            newest = objects[-1][1]  # Last object (newest)
            print(f"   Oldest File: {oldest.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"   Newest File: {newest.strftime('%Y-%m-%d %H:%M:%S')}")
    except Exception as e:
        print(f"   ❌ Error getting bucket info: {e}")
        return 1
    
    print()
    print(f"🗑️  Cleanup Configuration:")
    
    if not args.age_only and not args.size_only:
        print(f"   Mode: Full cleanup (age + size)")
    elif args.age_only:
        print(f"   Mode: Age-based cleanup only")
    elif args.size_only:
        print(f"   Mode: Size-based cleanup only")
    
    max_age = args.max_age_days if args.max_age_days is not None else config.RETENTION_MAX_AGE_DAYS
    max_size_gb = args.max_size_gb if args.max_size_gb is not None else config.RETENTION_MAX_SIZE_GB
    max_size_bytes = max_size_gb * 1024 * 1024 * 1024
    
    if not args.size_only:
        print(f"   Max Age: {max_age} days")
    if not args.age_only:
        print(f"   Max Size: {format_bytes(max_size_bytes)} ({max_size_gb} GB)")
    
    if args.dry_run:
        print(f"   🔍 DRY RUN MODE - No files will be deleted")
    
    print()
    
    # Confirmation
    if not args.yes and not args.dry_run:
        response = input("⚠️  Proceed with cleanup? [y/N]: ")
        if response.lower() != 'y':
            print("❌ Cleanup cancelled")
            return 0
    
    print()
    print("=" * 60)
    
    if args.dry_run:
        print("🔍 DRY RUN - Preview of cleanup actions:")
        print("=" * 60)
        
        # Simulate age-based cleanup
        if not args.size_only:
            print("\n📅 Age-based cleanup preview:")
            from datetime import timedelta
            cutoff_date = datetime.now() - timedelta(days=max_age)
            
            to_delete = [obj for obj in objects if obj[1].replace(tzinfo=None) < cutoff_date]
            total_size = sum(obj[2] for obj in to_delete)
            
            print(f"   Files to delete: {len(to_delete)}")
            print(f"   Space to free: {format_bytes(total_size)} ({total_size / (1024**3):.2f} GB)")
            
            if to_delete and len(to_delete) <= 10:
                print(f"   Files:")
                for obj_name, last_modified, size in to_delete:
                    age_days = (datetime.now() - last_modified.replace(tzinfo=None)).days
                    print(f"      - {obj_name} (age: {age_days} days, size: {format_bytes(size)})")
        
        # Simulate size-based cleanup
        if not args.age_only:
            print("\n💾 Size-based cleanup preview:")
            
            if current_size <= max_size_bytes:
                print(f"   ✅ Bucket size is within limit, no cleanup needed")
            else:
                to_delete = []
                total_size = 0
                size_remaining = current_size
                
                for obj in objects:
                    if size_remaining <= max_size_bytes:
                        break
                    to_delete.append(obj)
                    total_size += obj[2]
                    size_remaining -= obj[2]
                
                print(f"   Files to delete: {len(to_delete)}")
                print(f"   Space to free: {format_bytes(total_size)} ({total_size / (1024**3):.2f} GB)")
                print(f"   Final size: {format_bytes(size_remaining)} ({size_remaining / (1024**3):.2f} GB)")
        
        print("\n✅ Dry run complete. Use --yes to execute cleanup.")
        return 0
    
    # Perform actual cleanup
    print("\n🗑️  Executing cleanup...")
    print("=" * 60)
    
    try:
        if args.age_only:
            result = retention_mgr.cleanup_by_age(args.bucket, max_age)
            print_cleanup_result(result)
        elif args.size_only:
            result = retention_mgr.cleanup_by_size(args.bucket, max_size_bytes)
            print_cleanup_result(result)
        else:
            result = retention_mgr.run_retention_policy(args.bucket)
            print_full_cleanup_result(result)
        
        print("\n✅ Cleanup completed successfully!")
        
        # Show final status
        final_size = retention_mgr.get_bucket_size(args.bucket)
        print(f"\n📊 Final Status:")
        print(f"   Size: {format_bytes(final_size)} ({final_size / (1024**3):.2f} GB)")
        
    except Exception as e:
        print(f"\n❌ Cleanup failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


def print_cleanup_result(result):
    """Print cleanup result."""
    print(f"\n📊 {result['cleanup_type'].title()} Cleanup Results:")
    print(f"   Deleted: {result['deleted_count']} objects")
    print(f"   Freed: {result['deleted_size_gb']:.2f} GB")
    
    if result.get('errors'):
        print(f"   ⚠️  Errors: {len(result['errors'])}")
        for error in result['errors'][:5]:  # Show first 5 errors
            print(f"      - {error}")


def print_full_cleanup_result(result):
    """Print full retention policy result."""
    print(f"\n📊 Retention Policy Results:")
    print(f"   Total Deleted: {result['total_deleted_count']} objects")
    print(f"   Total Freed: {result['total_freed_gb']:.2f} GB")
    print(f"   Size: {result['initial_size_gb']:.2f} GB → {result['final_size_gb']:.2f} GB")
    
    print(f"\n   Age-based cleanup:")
    print(f"      - Deleted: {result['age_cleanup']['deleted_count']} objects")
    print(f"      - Freed: {result['age_cleanup']['deleted_size_gb']:.2f} GB")
    
    print(f"\n   Size-based cleanup:")
    print(f"      - Deleted: {result['size_cleanup']['deleted_count']} objects")
    print(f"      - Freed: {result['size_cleanup']['deleted_size_gb']:.2f} GB")


if __name__ == '__main__':
    sys.exit(main())
