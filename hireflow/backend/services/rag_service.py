import os
import chromadb
from openai import OpenAI
from chromadb.api import ClientAPI

_chroma_client: ClientAPI | None = None
_collection = None
_openai_client: OpenAI | None = None


def _get_collection():
    global _chroma_client, _collection
    if _collection is None:
        persist_dir = os.environ.get("CHROMA_PERSIST_DIR", "./chroma_store")
        _chroma_client = chromadb.PersistentClient(path=persist_dir)
        _collection = _chroma_client.get_or_create_collection("company_contexts")
    return _collection


def _get_openai():
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI()
    return _openai_client


def index_company(company_id: int, company_data: dict) -> None:
    text = f"""
Company: {company_data.get('name', '')}
Website: {company_data.get('website', 'N/A')}
Industry: {company_data.get('industry', 'N/A')}
Size: {company_data.get('size', 'N/A')}
About: {company_data.get('description', '')}
""".strip()

    client = _get_openai()
    embedding = (
        client.embeddings.create(input=text, model="text-embedding-3-small")
        .data[0]
        .embedding
    )

    collection = _get_collection()
    collection.upsert(
        ids=[str(company_id)],
        embeddings=[embedding],
        documents=[text],
        metadatas=[{"company_id": company_id}],
    )


def get_company_context(company_id: int) -> str:
    collection = _get_collection()
    result = collection.get(ids=[str(company_id)], include=["documents"])
    if result["documents"]:
        return result["documents"][0]
    return ""
