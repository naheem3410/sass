from abc import ABC, abstractmethod


class StorageProvider(ABC):
    @abstractmethod
    def save(self, file_bytes: bytes, filename: str) -> str:
        """Save file and return its retrievable path or key"""

    @abstractmethod
    def retrieve(self, path: str) -> bytes:
        """Return file bytes given a path or key"""

    @abstractmethod
    def delete(self, path: str) -> None:
        pass
