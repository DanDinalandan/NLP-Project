import logging
import os
from pathlib import Path
from typing import List, Dict, Any
import httpx
import chromadb
from chromadb.config import Settings

logger = logging.getLogger(__name__)

OLLAMA_BASE = "http://127.0.0.1:11434"


class OllamaEmbeddingFunction:
    """Embed texts via Ollama using whichever model is currently loaded."""

    def __call__(self, input: List[str]) -> List[List[float]]:
        model = self._active_model()
        results = []
        with httpx.Client(timeout=30.0) as client:
            for text in input:
                r = client.post(
                    f"{OLLAMA_BASE}/api/embeddings",
                    json={"model": model, "prompt": text},
                )
                r.raise_for_status()
                results.append(r.json()["embedding"])
        return results

    def _active_model(self) -> str:
        try:
            with httpx.Client(timeout=3.0) as client:
                r = client.get(f"{OLLAMA_BASE}/api/tags")
                models = r.json().get("models", [])
                if models:
                    return models[0]["name"]
        except Exception:
            pass
        return "llama3.2:3b"


def get_chroma_client() -> chromadb.Client:
    app_data = os.environ.get("APPDATA", str(Path.home()))
    chroma_dir = Path(app_data) / "ReviewBot" / "chroma"
    chroma_dir.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(
        path=str(chroma_dir),
        settings=Settings(anonymized_telemetry=False),
    )


def get_collection(client: chromadb.Client, folder_id: int):
    return client.get_or_create_collection(
        name=f"folder_{folder_id}",
        embedding_function=OllamaEmbeddingFunction(),
        metadata={"hnsw:space": "cosine"},
    )


def add_chunks(
    folder_id: int,
    file_id: int,
    file_name: str,
    chunks: List[str],
    page_ranges: List[str],
):
    client = get_chroma_client()
    collection = get_collection(client, folder_id)

    ids = [f"file_{file_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "file_id": file_id,
            "file_name": file_name,
            "page_range": page_ranges[i] if i < len(page_ranges) else "unknown",
        }
        for i in range(len(chunks))
    ]

    try:
        collection.upsert(documents=chunks, ids=ids, metadatas=metadatas)
    except Exception as e:
        logger.warning("ChromaDB embed skipped (Ollama not running?): %s", e)


def query_chunks(
    folder_id: int,
    question: str,
    n_results: int = 3,
    file_ids: List[int] = None,
) -> List[Dict[str, Any]]:
    client = get_chroma_client()
    collection = get_collection(client, folder_id)

    if collection.count() == 0:
        return []

    # Build a ChromaDB `where` filter when specific file IDs are requested
    where = None
    if file_ids:
        if len(file_ids) == 1:
            where = {"file_id": {"$eq": file_ids[0]}}
        else:
            where = {"file_id": {"$in": file_ids}}

    results = collection.query(
        query_texts=[question],
        n_results=min(n_results, collection.count()),
        include=["documents", "metadatas"],
        where=where,
    )

    chunks = []
    docs  = results.get("documents", [[]])[0]
    metas = results.get("metadatas",  [[]])[0]
    for doc, meta in zip(docs, metas):
        chunks.append({"text": doc, "metadata": meta})

    return chunks


def delete_folder_embeddings(folder_id: int):
    client = get_chroma_client()
    try:
        client.delete_collection(f"folder_{folder_id}")
    except Exception:
        pass  # Collection may not exist yet (no files were generated)


def delete_file_embeddings(folder_id: int, file_id: int):
    client = get_chroma_client()
    collection = get_collection(client, folder_id)
    try:
        collection.delete(where={"file_id": file_id})
    except Exception:
        pass
