from __future__ import annotations

import logging
import uuid
from io import BytesIO

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError, EndpointConnectionError

from app.core.config import Settings

logger = logging.getLogger(__name__)
settings = Settings()


class StorageService:
    def __init__(self):
        self._client = None
        self.bucket = settings.MINIO_BUCKET

    def _get_client(self):
        if self._client is not None:
            return self._client
        try:
            self._client = boto3.client(
                "s3",
                endpoint_url=f"http://{settings.MINIO_ENDPOINT}"
                if not settings.MINIO_SECURE
                else f"https://{settings.MINIO_ENDPOINT}",
                aws_access_key_id=settings.MINIO_ACCESS_KEY,
                aws_secret_access_key=settings.MINIO_SECRET_KEY,
                config=Config(signature_version="s3v4"),
                region_name="us-east-1",
            )
            self._ensure_bucket()
        except (ClientError, EndpointConnectionError, Exception) as e:
            logger.warning(f"Storage unavailable: {e}. Images will be stored by URL only.")
            self._client = None
        return self._client

    def _ensure_bucket(self):
        try:
            self._client.head_bucket(Bucket=self.bucket)
        except ClientError:
            self._client.create_bucket(Bucket=self.bucket)

    def upload_fileobj(self, file: BytesIO, filename: str | None = None) -> str | None:
        client = self._get_client()
        if not client:
            return None
        ext = filename.split(".")[-1] if filename and "." in filename else "bin"
        key = f"products/{uuid.uuid4().hex}.{ext}"
        try:
            client.upload_fileobj(file, self.bucket, key, ExtraArgs={"ACL": "private"})
            return key
        except ClientError as e:
            logger.error(f"Upload failed: {e}")
            return None

    def get_presigned_url(self, key: str, expires_in: int = 3600) -> str | None:
        client = self._get_client()
        if not client:
            return None
        try:
            return client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        except ClientError:
            return None

    def delete_file(self, key: str) -> bool:
        client = self._get_client()
        if not client:
            return False
        try:
            client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError:
            return False

    def get_public_url(self, key: str) -> str:
        return f"{self._get_client().meta.endpoint_url}/{self.bucket}/{key}" if self._get_client() else ""


storage = StorageService()
