from datetime import datetime, timedelta
import logging
from typing import Dict, List, Tuple
import src.config as config
from src.modules.datalake.minio_client import MinioClient

logger = logging.getLogger(__name__)


class RetentionManager:
    """
    Manages data retention policies for the MinIO data lake.
    Automatically cleans up old data based on age and size constraints.
    """
    
    def __init__(self, minio_client: MinioClient = None):
        """Initialize retention manager with MinIO client."""
        self.minio_client = minio_client or MinioClient()
        self.max_size_bytes = config.RETENTION_MAX_SIZE_GB * 1024 * 1024 * 1024
        self.max_age_days = config.RETENTION_MAX_AGE_DAYS
        self.enabled = config.RETENTION_CHECK_ENABLED
    
    def get_bucket_size(self, bucket: str = None) -> int:
        """
        Calculate total size of a bucket in bytes.
        
        Args:
            bucket: Bucket name (defaults to raw bucket)
        
        Returns:
            Total size in bytes
        """
        bucket = bucket or self.minio_client.bucket_raw
        
        try:
            objects = self.minio_client.client.list_objects(bucket, recursive=True)
            total_size = sum(obj.size for obj in objects)
            logger.info(f"Bucket '{bucket}' total size: {total_size / (1024**3):.2f} GB")
            return total_size
        except Exception as e:
            logger.error(f"Error calculating bucket size: {e}")
            return 0
    
    def get_objects_with_metadata(self, bucket: str = None) -> List[Tuple[str, datetime, int]]:
        """
        Get list of objects with their metadata (name, last_modified, size).
        
        Args:
            bucket: Bucket name (defaults to raw bucket)
        
        Returns:
            List of tuples (object_name, last_modified, size_bytes)
        """
        bucket = bucket or self.minio_client.bucket_raw
        
        try:
            objects = self.minio_client.client.list_objects(bucket, recursive=True)
            object_list = [
                (obj.object_name, obj.last_modified, obj.size)
                for obj in objects
            ]
            # Sort by last_modified (oldest first)
            object_list.sort(key=lambda x: x[1])
            return object_list
        except Exception as e:
            logger.error(f"Error listing objects: {e}")
            return []
    
    def cleanup_by_age(self, bucket: str = None, max_age_days: int = None) -> Dict:
        """
        Delete files older than specified age.
        
        Args:
            bucket: Bucket name (defaults to raw bucket)
            max_age_days: Maximum age in days (defaults to config value)
        
        Returns:
            Dictionary with cleanup statistics
        """
        bucket = bucket or self.minio_client.bucket_raw
        max_age_days = max_age_days or self.max_age_days
        
        cutoff_date = datetime.now() - timedelta(days=max_age_days)
        
        logger.info(f"Starting age-based cleanup for bucket '{bucket}' (max age: {max_age_days} days)")
        
        objects = self.get_objects_with_metadata(bucket)
        
        deleted_count = 0
        deleted_size = 0
        errors = []
        
        for obj_name, last_modified, size in objects:
            # Remove timezone info for comparison
            last_modified_naive = last_modified.replace(tzinfo=None)
            
            if last_modified_naive < cutoff_date:
                try:
                    self.minio_client.delete_object(obj_name, bucket)
                    deleted_count += 1
                    deleted_size += size
                    logger.debug(f"Deleted old object: {obj_name} (age: {(datetime.now() - last_modified_naive).days} days)")
                except Exception as e:
                    error_msg = f"Failed to delete {obj_name}: {e}"
                    logger.error(error_msg)
                    errors.append(error_msg)
        
        result = {
            'bucket': bucket,
            'cleanup_type': 'age-based',
            'max_age_days': max_age_days,
            'deleted_count': deleted_count,
            'deleted_size_mb': deleted_size / (1024 * 1024),
            'deleted_size_gb': deleted_size / (1024 * 1024 * 1024),
            'errors': errors
        }
        
        logger.info(f"Age-based cleanup completed: {deleted_count} objects deleted, "
                   f"{result['deleted_size_gb']:.2f} GB freed")
        
        return result
    
    def cleanup_by_size(self, bucket: str = None, max_size_bytes: int = None) -> Dict:
        """
        Delete oldest files until bucket size is within limit.
        
        Args:
            bucket: Bucket name (defaults to raw bucket)
            max_size_bytes: Maximum bucket size in bytes (defaults to config value)
        
        Returns:
            Dictionary with cleanup statistics
        """
        bucket = bucket or self.minio_client.bucket_raw
        max_size_bytes = max_size_bytes or self.max_size_bytes
        
        logger.info(f"Starting size-based cleanup for bucket '{bucket}' "
                   f"(max size: {max_size_bytes / (1024**3):.2f} GB)")
        
        current_size = self.get_bucket_size(bucket)
        
        if current_size <= max_size_bytes:
            logger.info(f"Bucket size ({current_size / (1024**3):.2f} GB) is within limit, no cleanup needed")
            return {
                'bucket': bucket,
                'cleanup_type': 'size-based',
                'max_size_gb': max_size_bytes / (1024**3),
                'current_size_gb': current_size / (1024**3),
                'deleted_count': 0,
                'deleted_size_mb': 0,
                'deleted_size_gb': 0,
                'errors': []
            }
        
        objects = self.get_objects_with_metadata(bucket)
        
        deleted_count = 0
        deleted_size = 0
        errors = []
        
        for obj_name, last_modified, size in objects:
            if current_size <= max_size_bytes:
                break
            
            try:
                self.minio_client.delete_object(obj_name, bucket)
                deleted_count += 1
                deleted_size += size
                current_size -= size
                logger.debug(f"Deleted object: {obj_name} ({size / (1024**2):.2f} MB)")
            except Exception as e:
                error_msg = f"Failed to delete {obj_name}: {e}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        result = {
            'bucket': bucket,
            'cleanup_type': 'size-based',
            'max_size_gb': max_size_bytes / (1024**3),
            'initial_size_gb': (current_size + deleted_size) / (1024**3),
            'final_size_gb': current_size / (1024**3),
            'deleted_count': deleted_count,
            'deleted_size_mb': deleted_size / (1024 * 1024),
            'deleted_size_gb': deleted_size / (1024 * 1024 * 1024),
            'errors': errors
        }
        
        logger.info(f"Size-based cleanup completed: {deleted_count} objects deleted, "
                   f"{result['deleted_size_gb']:.2f} GB freed, "
                   f"final size: {result['final_size_gb']:.2f} GB")
        
        return result
    
    def run_retention_policy(self, bucket: str = None) -> Dict:
        """
        Run complete retention policy (both age and size-based cleanup).
        
        Args:
            bucket: Bucket name (defaults to raw bucket)
        
        Returns:
            Dictionary with combined cleanup statistics
        """
        if not self.enabled:
            logger.info("Retention policy is disabled")
            return {
                'enabled': False,
                'message': 'Retention policy is disabled'
            }
        
        bucket = bucket or self.minio_client.bucket_raw
        
        logger.info(f"=== Starting retention policy for bucket '{bucket}' ===")
        
        # Get initial size
        initial_size = self.get_bucket_size(bucket)
        
        # Step 1: Age-based cleanup
        age_result = self.cleanup_by_age(bucket)
        
        # Step 2: Size-based cleanup (if still needed)
        size_result = self.cleanup_by_size(bucket)
        
        # Get final size
        final_size = self.get_bucket_size(bucket)
        
        combined_result = {
            'enabled': True,
            'bucket': bucket,
            'initial_size_gb': initial_size / (1024**3),
            'final_size_gb': final_size / (1024**3),
            'total_deleted_count': age_result['deleted_count'] + size_result['deleted_count'],
            'total_freed_gb': (age_result['deleted_size_gb'] + size_result['deleted_size_gb']),
            'age_cleanup': age_result,
            'size_cleanup': size_result,
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"=== Retention policy completed ===")
        logger.info(f"Total deleted: {combined_result['total_deleted_count']} objects, "
                   f"{combined_result['total_freed_gb']:.2f} GB freed")
        logger.info(f"Size: {combined_result['initial_size_gb']:.2f} GB -> "
                   f"{combined_result['final_size_gb']:.2f} GB")
        
        return combined_result
