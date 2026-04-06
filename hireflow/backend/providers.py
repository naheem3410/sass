"""
providers.py — single source of truth for all external dependencies.

To swap any provider in production, change only this file.
No business logic changes are required elsewhere.

Examples:
    storage = S3StorageProvider(bucket="hireflow-cvs")
    llm     = BedrockProvider(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0")
    db      = PostgreSQLProvider(url=os.environ["DATABASE_URL"])
"""
import os

from services.abstractions.storage import StorageProvider
from services.abstractions.document_parser import DocumentParser
from services.abstractions.llm import LLMProvider
from services.abstractions.database import DatabaseProvider

from services.storage.local import LocalStorageProvider
from services.document.universal_parser import UniversalDocumentParser
from services.llm.openai_provider import OpenAIProvider
from services.db.sqlite_provider import SQLiteProvider

# ── Active providers ────────────────────────────────────────────────────────
storage: StorageProvider = LocalStorageProvider(
    base_path=os.environ.get("CV_STORAGE_PATH", "./uploads/cvs")
)

document_parser: DocumentParser = UniversalDocumentParser()

llm: LLMProvider = OpenAIProvider(model="gpt-5-nano")

db: DatabaseProvider = SQLiteProvider(
    path=os.environ.get("DATABASE_URL", "./hireflow.db")
)


# ── FastAPI dependency factories ─────────────────────────────────────────────
def get_storage() -> StorageProvider:
    return storage


def get_parser() -> DocumentParser:
    return document_parser


def get_llm() -> LLMProvider:
    return llm


def get_db() -> DatabaseProvider:
    return db
