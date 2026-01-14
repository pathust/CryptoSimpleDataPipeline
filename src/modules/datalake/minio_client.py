from minio import Minio
from minio.error import S3Error
import src.config as config
import io
import logging
from urllib3.util.retry import Retry
from urllib3 import PoolManager

logger = logging.getLogger(__name__)

class MinioClient:
    """
    Wrapper class for MinIO operations.
    Provides S3-compatible object storage for the data lake.
    """
    
    def __init__(self):
        """Initialize MinIO client and ensure buckets exist."""
        # Configure retry strategy to handle disk space issues
        retry_strategy = Retry(
            total=10,  # Increased from default 5
            backoff_factor=2,  # Exponential backoff
            status_forcelist=[500, 502, 503, 504],  # Retry on server errors
            allowed_methods=["HEAD", "GET", "PUT", "DELETE", "OPTIONS", "TRACE"]
        )
        
        # Create HTTP client with retry strategy
        http_client = PoolManager(
            timeout=30.0,  # Increased timeout
            maxsize=10,
            retries=retry_strategy
        )
        
        self.client = Minio(
            config.MINIO_ENDPOINT,
            access_key=config.MINIO_ACCESS_KEY,
            secret_key=config.MINIO_SECRET_KEY,
            secure=config.MINIO_SECURE,
            http_client=http_client
        )
        
        self.bucket_raw = config.MINIO_BUCKET_RAW
        self.bucket_archive = config.MINIO_BUCKET_ARCHIVE
        
        # Ensure buckets exist
        self._ensure_buckets()
    
    def _ensure_buckets(self):
        """Create buckets if they don't exist."""
        try:
            for bucket in [self.bucket_raw, self.bucket_archive]:
                if not self.client.bucket_exists(bucket):
                    self.client.make_bucket(bucket)
                    logger.info(f"Created MinIO bucket: {bucket}")
        except S3Error as e:
            logger.error(f"Error ensuring buckets exist: {e}")
            raise
    
    def upload_file(self, file_path, object_name, bucket=None):
        """
        Upload a file to MinIO.
        
        Args:
            file_path: Local path to file
            object_name: Object name in MinIO (key)
            bucket: Bucket name (defaults to raw bucket)
        
        Returns:
            True if successful, False otherwise
        """
        bucket = bucket or self.bucket_raw
        
        try:
            self.client.fput_object(bucket, object_name, file_path)
            logger.debug(f"Uploaded {file_path} to {bucket}/{object_name}")
            return True
        except S3Error as e:
            logger.error(f"Error uploading file to MinIO: {e}")
            return False
    
    def upload_data(self, data, object_name, bucket=None, content_type='application/json'):
        """
        Upload data directly to MinIO without saving to file first.
        
        Args:
            data: Data to upload (bytes or string)
            object_name: Object name in MinIO (key)
            bucket: Bucket name (defaults to raw bucket)
            content_type: Content type of the data
        
        Returns:
            True if successful, False otherwise
        """
        bucket = bucket or self.bucket_raw
        
        try:
            if isinstance(data, str):
                data = data.encode('utf-8')
            
            data_stream = io.BytesIO(data)
            data_length = len(data)
            
            self.client.put_object(
                bucket,
                object_name,
                data_stream,
                data_length,
                content_type=content_type
            )
            logger.debug(f"Uploaded data to {bucket}/{object_name}")
            return True
        except S3Error as e:
            logger.error(f"Error uploading data to MinIO: {e}")
            return False
    
    def download_file(self, object_name, file_path, bucket=None):
        """
        Download a file from MinIO.
        
        Args:
            object_name: Object name in MinIO (key)
            file_path: Local path to save file
            bucket: Bucket name (defaults to raw bucket)
        
        Returns:
            True if successful, False otherwise
        """
        bucket = bucket or self.bucket_raw
        
        try:
            self.client.fget_object(bucket, object_name, file_path)
            logger.debug(f"Downloaded {bucket}/{object_name} to {file_path}")
            return True
        except S3Error as e:
            logger.error(f"Error downloading file from MinIO: {e}")
            return False
    
    def get_object_content(self, object_name, bucket=None):
        """
        Get object content as string.
        
        Args:
            object_name: Object name in MinIO (key)
            bucket: Bucket name (defaults to raw bucket)
        
        Returns:
            Object content as string, or None if error
        """
        bucket = bucket or self.bucket_raw
        
        try:
            response = self.client.get_object(bucket, object_name)
            content = response.read().decode('utf-8')
            response.close()
            response.release_conn()
            return content
        except S3Error as e:
            logger.error(f"Error getting object content from MinIO: {e}")
            return None
    
    def list_objects(self, prefix='', bucket=None, recursive=True):
        """
        List objects in bucket with prefix.
        
        Args:
            prefix: Object name prefix to filter
            bucket: Bucket name (defaults to raw bucket)
            recursive: List recursively
        
        Returns:
            List of object names
        """
        bucket = bucket or self.bucket_raw
        
        try:
            objects = self.client.list_objects(bucket, prefix=prefix, recursive=recursive)
            return [obj.object_name for obj in objects]
        except S3Error as e:
            logger.error(f"Error listing objects from MinIO: {e}")
            return []
    
    def delete_object(self, object_name, bucket=None):
        """
        Delete an object from MinIO.
        
        Args:
            object_name: Object name in MinIO (key)
            bucket: Bucket name (defaults to raw bucket)
        
        Returns:
            True if successful, False otherwise
        """
        bucket = bucket or self.bucket_raw
        
        try:
            self.client.remove_object(bucket, object_name)
            logger.debug(f"Deleted {bucket}/{object_name}")
            return True
        except S3Error as e:
            logger.error(f"Error deleting object from MinIO: {e}")
            return False
    
    def move_object(self, src_object, dst_object=None, src_bucket=None, dst_bucket=None):
        """
        Move object from one bucket to another (copy + delete).
        
        Args:
            src_object: Source object name
            dst_object: Destination object name (defaults to same as src_object)
            src_bucket: Source bucket (defaults to raw bucket)
            dst_bucket: Destination bucket (defaults to archive bucket)
        
        Returns:
            True if successful, False otherwise
        """
        src_bucket = src_bucket or self.bucket_raw
        dst_bucket = dst_bucket or self.bucket_archive
        dst_object = dst_object or src_object
        
        try:
            # Copy object
            from minio.commonconfig import CopySource
            self.client.copy_object(
                dst_bucket,
                dst_object,
                CopySource(src_bucket, src_object)
            )
            
            # Delete source
            self.client.remove_object(src_bucket, src_object)
            
            logger.debug(f"Moved {src_bucket}/{src_object} to {dst_bucket}/{dst_object}")
            return True
        except S3Error as e:
            logger.error(f"Error moving object in MinIO: {e}")
            return False
    
    def object_exists(self, object_name, bucket=None):
        """
        Check if an object exists in MinIO.
        
        Args:
            object_name: Object name in MinIO (key)
            bucket: Bucket name (defaults to raw bucket)
        
        Returns:
            True if exists, False otherwise
        """
        bucket = bucket or self.bucket_raw
        
        try:
            self.client.stat_object(bucket, object_name)
            return True
        except S3Error:
            return False
