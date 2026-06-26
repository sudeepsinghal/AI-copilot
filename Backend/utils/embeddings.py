from __future__ import annotations

import os
from typing import List

from langchain_core.embeddings import Embeddings


# Best free local embedding model. Far stronger retrieval than all-MiniLM-L6-v2.
# Override with EMBEDDING_MODEL in .env (e.g. BAAI/bge-small-en-v1.5 for speed).
DEFAULT_LOCAL_EMBEDDING_MODEL = "BAAI/bge-large-en-v1.5"

# Curated local options surfaced to the UI / docs. Any sentence-transformers
# model name also works via the EMBEDDING_MODEL env var.
LOCAL_EMBEDDING_MODELS = [
    "BAAI/bge-large-en-v1.5",   # best quality, 1024-dim
    "BAAI/bge-small-en-v1.5",   # fast, 384-dim
    "all-MiniLM-L6-v2",         # original baseline, 384-dim
]


class LocalEmbeddings(Embeddings):
    """sentence-transformers embeddings — free, runs anywhere, no API key needed."""

    def __init__(self, model_name: str | None = None):
        # Import here so startup is fast if another provider is chosen
        from sentence_transformers import SentenceTransformer
        resolved = model_name or os.environ.get(
            "EMBEDDING_MODEL", DEFAULT_LOCAL_EMBEDDING_MODEL
        )
        self._model = SentenceTransformer(resolved)
        self.model_name = resolved

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._model.encode(texts, convert_to_numpy=True).tolist()

    def embed_query(self, text: str) -> List[float]:
        return self._model.encode(text, convert_to_numpy=True).tolist()


class GeminiEmbeddings(Embeddings):
    """Google Gemini embeddings — free tier, 1500 req/day."""

    def __init__(self, model: str = "models/embedding-001"):
        import google.generativeai as genai
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set in environment.")
        genai.configure(api_key=api_key)
        self._genai = genai
        self._model = model

    def _embed(self, text: str) -> List[float]:
        result = self._genai.embed_content(model=self._model, content=text)
        return result["embedding"]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed(text)


class OllamaEmbeddings(Embeddings):
    """Ollama embeddings — local dev / enterprise on-prem only."""

    def __init__(self, model: str = "llama3", base_url: str | None = None, timeout: int = 45):
        import requests as _requests
        self._requests = _requests
        self.model = model
        self.base_url = (base_url or os.environ.get("OLLAMA_BASE_URL") or "http://localhost:11434").rstrip("/")
        self.timeout = timeout

    def _embed(self, text: str) -> List[float]:
        response = self._requests.post(
            f"{self.base_url}/api/embeddings",
            json={"model": self.model, "prompt": text},
            timeout=self.timeout,
        )
        if response.status_code != 200:
            raise ValueError(f"Ollama embeddings failed ({response.status_code}): {response.text}")
        embedding = response.json().get("embedding")
        if not embedding:
            raise ValueError("Ollama embeddings response contained no embedding.")
        return embedding

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed(text)


def get_embeddings() -> Embeddings:
    provider = os.environ.get("EMBEDDING_PROVIDER", "local").lower()
    if provider == "gemini":
        return GeminiEmbeddings()
    if provider == "ollama":
        return OllamaEmbeddings()
    return LocalEmbeddings()
