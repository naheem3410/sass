import os
from services.abstractions.storage import StorageProvider


class LocalStorageProvider(StorageProvider):
    def __init__(self, base_path: str):
        self.base_path = base_path
        os.makedirs(base_path, exist_ok=True)

    def save(self, file_bytes: bytes, filename: str) -> str:
        full_path = os.path.join(self.base_path, filename)
        with open(full_path, "wb") as f:
            f.write(file_bytes)
        return full_path

    def retrieve(self, path: str) -> bytes:
        with open(path, "rb") as f:
            return f.read()

    def delete(self, path: str) -> None:
        if os.path.exists(path):
            os.remove(path)
