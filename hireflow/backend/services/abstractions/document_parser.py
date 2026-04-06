from abc import ABC, abstractmethod


class DocumentParser(ABC):
    @abstractmethod
    def extract_text(self, file_bytes: bytes, filename: str) -> str:
        """Extract plain text from a document. filename is used to detect format."""
        pass
