from __future__ import annotations

import logging
import uuid
from io import BytesIO

import aioboto3
from botocore.config import Config

from app.core.config import Settings

logger = logging.getLogger(__name__)
settings = Settings()


class StorageService:
    def __init__(self):
        self._session = aioboto3.Session()
        self._client = None
        self.bucket = settings.MINIO_BUCKET

    async def _ensure_bucket(self):
        try:
            await self._client.head_bucket(Bucket=self.bucket)
        except Exception:
            await self._client.create_bucket(Bucket=self.bucket)

    async def _get_client(self):
        if self._client is not None:
            return self._client
        try:
            self._client = await self._session.client(
                "s3",
                endpoint_url=f"http://{settings.MINIO_ENDPOINT}"
                if not settings.MINIO_SECURE
                else f"https://{settings.MINIO_ENDPOINT}",
                aws_access_key_id=settings.MINIO_ACCESS_KEY,
                aws_secret_access_key=settings.MINIO_SECRET_KEY,
                config=Config(signature_version="s3v4"),
                region_name="us-east-1",
            ).__aenter__()
            await self._ensure_bucket()
        except Exception as e:
            logger.warning(f"Storage unavailable: {e}. Images will not be uploaded.")
            self._client = None
        return self._client

    async def upload_fileobj(self, file: BytesIO, filename: str | None = None, prefix: str = "products") -> str | None:
        client = await self._get_client()
        if not client:
            return None
        ext = filename.split(".")[-1] if filename and "." in filename else "bin"
        key = f"{prefix}/{uuid.uuid4().hex}.{ext}"
        try:
            await client.upload_fileobj(file, self.bucket, key, ExtraArgs={"ACL": "private"})
            return key
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            return None

    async def get_presigned_url(self, key: str, expires_in: int = 3600) -> str | None:
        client = await self._get_client()
        if not client:
            return None
        try:
            return await client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        except Exception:
            return None

    async def delete_file(self, key: str) -> bool:
        client = await self._get_client()
        if not client:
            return False
        try:
            await client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except Exception:
            return False

    async def get_public_url(self, key: str) -> str:
        client = await self._get_client()
        if not client:
            return ""
        return f"{client.meta.endpoint_url}/{self.bucket}/{key}"

    async def close(self):
        if self._client:
            await self._client.__aexit__(None, None, None)
            self._client = None


storage = StorageService()
