from __future__ import annotations

from pathlib import Path

from langchain_community.vectorstores import FAISS
from Backend.utils.embeddings import get_embeddings

BASE_DIR = Path(__file__).resolve().parent.parent
FAISS_ROOT = BASE_DIR / "faiss_index"

# In-memory cache — FAISS index is loaded from disk once per user per server session
_cache: dict[str, FAISS] = {}


def _user_db_path(user_id: str) -> Path:
    return FAISS_ROOT / user_id


def get_or_load_vector_store(user_id: str = "default") -> FAISS | None:
    """Return the cached FAISS index for this user, loading from disk if needed."""
    if user_id in _cache:
        return _cache[user_id]

    db_path = _user_db_path(user_id)
    if not db_path.exists():
        return None

    try:
        embeddings = get_embeddings()
        vs = FAISS.load_local(
            folder_path=str(db_path),
            embeddings=embeddings,
            allow_dangerous_deserialization=True,
        )
        _cache[user_id] = vs
        print(f"[VectorStore] Loaded from disk for user: {user_id}")
        return vs
    except Exception as exc:
        # Index is corrupted or embedding dimensions changed — start fresh
        print(f"[VectorStore] Failed to load index for {user_id}: {exc}. Starting fresh.")
        import shutil
        shutil.rmtree(str(db_path), ignore_errors=True)
        _cache.pop(user_id, None)
        return None


def create_or_load_vector_store(user_id: str = "default") -> FAISS | None:
    """Alias kept for compatibility."""
    return get_or_load_vector_store(user_id)


def create_vector_store_from_documents(documents, user_id: str = "default") -> FAISS:
    """Create a brand-new FAISS index from a user's first documents."""
    db_path = _user_db_path(user_id)
    db_path.mkdir(parents=True, exist_ok=True)

    embeddings = get_embeddings()
    vs = FAISS.from_documents(documents, embeddings)
    vs.save_local(str(db_path))
    _cache[user_id] = vs
    print(f"[VectorStore] Created new index for user: {user_id}")
    return vs


def add_documents(vector_db: FAISS, new_documents, user_id: str = "default") -> None:
    """Add documents to the index and persist to disk."""
    db_path = _user_db_path(user_id)
    vector_db.add_documents(new_documents)
    vector_db.save_local(str(db_path))
    _cache[user_id] = vector_db  # keep cache in sync
    print(f"[VectorStore] Added {len(new_documents)} chunks for user: {user_id}")


def delete_by_doc_id(user_id: str, doc_id: str) -> int:
    """
    Remove all vector chunks belonging to a document so deleted docs no longer
    pollute retrieval. Returns the number of chunks removed.
    """
    vector_db = get_or_load_vector_store(user_id)
    if vector_db is None:
        return 0
    ids = [
        store_id
        for store_id, doc in vector_db.docstore._dict.items()
        if (doc.metadata or {}).get("doc_id") == doc_id
    ]
    if not ids:
        return 0
    vector_db.delete(ids)
    vector_db.save_local(str(_user_db_path(user_id)))
    _cache[user_id] = vector_db
    print(f"[VectorStore] Deleted {len(ids)} chunks for doc {doc_id} (user: {user_id})")
    return len(ids)
