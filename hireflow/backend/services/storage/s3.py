import boto3
from services.abstractions.storage import StorageProvider


class S3StorageProvider(StorageProvider):
    def __init__(self, bucket: str):
        self.s3 = boto3.client("s3")
        self.bucket = bucket

    def save(self, file_bytes: bytes, filename: str) -> str:
        self.s3.put_object(Bucket=self.bucket, Key=filename, Body=file_bytes)
        return filename

    def retrieve(self, path: str) -> bytes:
        obj = self.s3.get_object(Bucket=self.bucket, Key=path)
        return obj["Body"].read()

    def delete(self, path: str) -> None:
        self.s3.delete_object(Bucket=self.bucket, Key=path)
