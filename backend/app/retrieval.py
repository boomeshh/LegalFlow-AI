"""
retrieval.py — Hybrid document retrieval abstraction for LegalFlow AI.

Current backend: deterministic keyword scoring (TF-style term frequency).
Future-ready: swap in a VectorRetriever (FAISS + embeddings) by changing
RETRIEVAL_BACKEND without touching any call-sites.

Architecture
------------
BaseRetriever          (abstract interface)
  └── KeywordRetriever (current default — deterministic, no ML deps)
  └── VectorRetriever  (future — uncomment when FAISS/embeddings are available)

All retrievers expose a single method:
    search(docs: list[dict], query: str) -> list[dict]
"""
from __future__ import annotations

import os
import re
from abc import ABC, abstractmethod


# ---------------------------------------------------------------------------
# Abstract interface
# ---------------------------------------------------------------------------

class BaseRetriever(ABC):
    """Every retrieval backend must implement this interface."""

    @abstractmethod
    def search(self, docs: list[dict], query: str) -> list[dict]:
        """Return a ranked list of result dicts with keys:
        document_id, name, case_code, score, preview.
        """


# ---------------------------------------------------------------------------
# Keyword retriever (current default)
# ---------------------------------------------------------------------------

class KeywordRetriever(BaseRetriever):
    """Deterministic TF-style keyword matching.

    No external dependencies required.
    Tokens shorter than 3 characters are ignored to reduce noise.
    """

    def search(self, docs: list[dict], query: str) -> list[dict]:
        terms = [t for t in re.findall(r"\w+", query.lower()) if len(t) > 2]
        if not terms:
            return []

        scored: list[dict] = []
        for doc in docs:
            haystack = f"{doc['name']} {doc['content']}".lower()
            score = sum(haystack.count(t) for t in terms)
            if score > 0:
                scored.append(
                    {
                        "document_id": doc["id"],
                        "name": doc["name"],
                        "case_code": doc["case_code"],
                        "score": score,
                        "preview": doc["content"][:220]
                        + ("..." if len(doc["content"]) > 220 else ""),
                    }
                )
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored


# ---------------------------------------------------------------------------
# Vector retriever stub (future — not wired in by default)
# ---------------------------------------------------------------------------

class VectorRetriever(BaseRetriever):
    """Semantic retrieval using FAISS + sentence-transformers.

    Activate by setting env var:  RETRIEVAL_BACKEND=vector
    Requires:  pip install faiss-cpu sentence-transformers

    This stub raises ImportError clearly so the fallback can handle it.
    """

    def __init__(self) -> None:
        try:
            import faiss  # noqa: F401
            from sentence_transformers import SentenceTransformer  # noqa: F401
        except ImportError as exc:
            raise ImportError(
                "VectorRetriever requires faiss-cpu and sentence-transformers. "
                "Install them or switch RETRIEVAL_BACKEND back to 'keyword'."
            ) from exc

        from sentence_transformers import SentenceTransformer
        import faiss, numpy as np  # noqa: E401

        self._model = SentenceTransformer("all-MiniLM-L6-v2")
        self._faiss = faiss
        self._np = np

    def _build_index(self, docs: list[dict]):
        texts = [f"{d['name']} {d['content']}" for d in docs]
        vecs = self._model.encode(texts, convert_to_numpy=True)
        dim = vecs.shape[1]
        index = self._faiss.IndexFlatL2(dim)
        index.add(vecs.astype("float32"))
        return index, vecs

    def search(self, docs: list[dict], query: str) -> list[dict]:
        if not docs:
            return []
        index, _ = self._build_index(docs)
        q_vec = self._model.encode([query], convert_to_numpy=True).astype("float32")
        k = min(5, len(docs))
        distances, indices = index.search(q_vec, k)
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            doc = docs[idx]
            results.append(
                {
                    "document_id": doc["id"],
                    "name": doc["name"],
                    "case_code": doc["case_code"],
                    "score": round(float(1 / (1 + dist)), 4),
                    "preview": doc["content"][:220]
                    + ("..." if len(doc["content"]) > 220 else ""),
                }
            )
        return results


# ---------------------------------------------------------------------------
# Factory — selects backend via env var (defaults to keyword)
# ---------------------------------------------------------------------------

def get_retriever() -> BaseRetriever:
    """Return the active retriever based on RETRIEVAL_BACKEND env var.

    Supported values:
        keyword  (default) — no extra dependencies
        vector            — requires faiss-cpu + sentence-transformers

    Falls back to KeywordRetriever if VectorRetriever deps are missing.
    """
    backend = os.getenv("RETRIEVAL_BACKEND", "keyword").lower()
    if backend == "vector":
        try:
            return VectorRetriever()
        except ImportError:
            # Graceful degradation: log and fall back
            import logging
            logging.warning(
                "VectorRetriever dependencies not found; falling back to KeywordRetriever."
            )
    return KeywordRetriever()


# Module-level singleton — import and use directly in main.py / ai.py
retriever: BaseRetriever = get_retriever()
