from __future__ import annotations

import csv
import io
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv

# Explicit path so .env is always found regardless of where uvicorn is launched from
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH, override=True)

import fastapi as fast
import httpx
from fastapi import Depends, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from langchain_core.output_parsers import StrOutputParser

from Backend.utils.llm import PROVIDER_META, get_llm, strip_think
from Backend.utils.embeddings import LOCAL_EMBEDDING_MODELS
from Backend.utils.extraction_graph import run_field_extraction
from Backend.utils import review_graph
from Backend.utils import models, storage
from Backend.utils.db import db_kind, get_db, init_db
from Backend.utils.loader import split_text
from Backend.utils.pdf_extraction import DEFAULT_PDF_MODE, extract_file, to_upload_payload
from Backend.utils.vector_store import (
    add_documents,
    create_vector_store_from_documents,
    delete_by_doc_id,
    get_or_load_vector_store,
)

# ─── App setup ────────────────────────────────────────────────────────────────

app = fast.FastAPI(title="AI Copilot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"
FRONTEND_OLD_DIR = Path(__file__).resolve().parent.parent / "frontend_old"

if FRONTEND_OLD_DIR.exists():
    app.mount("/static", StaticFiles(directory=FRONTEND_OLD_DIR), name="static")

if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

AUTH_ENABLED = os.environ.get("AUTH_ENABLED", "false").lower() == "true"


@app.on_event("startup")
def _startup() -> None:
    """Create database tables if they don't exist yet."""
    init_db()
    print(f"[DB] Ready ({db_kind()}). Storage backend: {storage.backend_kind()}")


# ─── Auth dependency ──────────────────────────────────────────────────────────

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    if not AUTH_ENABLED:
        return "dev-user"

    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No auth token provided.")

    token = credentials.credentials
    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth, credentials as fb_credentials

        if not firebase_admin._apps:
            service_account_path = os.environ.get(
                "FIREBASE_SERVICE_ACCOUNT_PATH", "./firebase-service-account.json"
            )
            cred = fb_credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)

        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {exc}"
        )


# ─── Request / response models ────────────────────────────────────────────────

class AskRequest(BaseModel):
    query: str = Field(min_length=1)
    provider: str | None = None
    model: str | None = None
    # Conversation memory: if provided, history is loaded and both turns are saved.
    conversation_id: str | None = None
    # Scope retrieval to a single document; falls back to the conversation's doc,
    # then to all of the user's documents.
    document_id: str | None = None


class ConversationCreate(BaseModel):
    title: str | None = None
    document_id: str | None = None


class ExtractionField(BaseModel):
    name: str
    description: str


class ExtractRequest(BaseModel):
    fields: list[ExtractionField]
    provider: str | None = None
    model: str | None = None
    # Scope extraction to a single document (recommended). Without it, retrieval
    # spans all of the user's documents.
    document_id: str | None = None


class ReviewStartRequest(BaseModel):
    extracted: dict
    needs_review: list[str]


class ReviewApproveRequest(BaseModel):
    thread_id: str
    approved_values: dict


class ExtractionApproveRequest(BaseModel):
    # Human-corrected values, keyed by field name: { "invoice_no": "INV-1024", ... }
    values: dict


class ExportRequest(BaseModel):
    ids: list[str] | None = None       # specific extractions; else use filters
    document_id: str | None = None     # filter by document
    status: str | None = None          # e.g. "approved"
    format: str = "csv"                # "csv" | "xlsx"


class ImportUrlRequest(BaseModel):
    url: str
    filename: str | None = None


# ─── Prompt builders ──────────────────────────────────────────────────────────

def _build_qa_prompt(query: str, documents, history: list | None = None) -> str:
    context_blocks = []
    for i, doc in enumerate(documents, start=1):
        meta = getattr(doc, "metadata", {}) or {}
        label = meta.get("filename", "unknown")
        page = meta.get("page_number")
        if page is not None:
            label += f", page {page}"
        context_blocks.append(f"[Source {i}: {label}]\n{doc.page_content}")

    context = "\n\n".join(context_blocks)

    history_block = ""
    if history:
        turns = "\n".join(
            f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}"
            for m in history
        )
        history_block = (
            "\nCONVERSATION SO FAR (use it to resolve follow-up references "
            'like "it" or "that"):\n'
            f"{turns}\n"
        )

    return f"""Answer the question based ONLY on the context below.
If the answer is not in the context, say "I don't have enough information from the uploaded documents."
Write in clear, concise natural language.

CONTEXT:
{context}
{history_block}
QUESTION:
{query}

ANSWER:"""


def _normalize_extraction(raw: dict, fields: list[ExtractionField]) -> dict:
    """
    Normalise LLM extraction output into a consistent shape.
    Handles models that skip confidence scores, use different key names,
    or return plain string values instead of objects.
    """
    normalized = {}
    for field in fields:
        name = field.name
        raw_val = raw.get(name)

        if raw_val is None:
            normalized[name] = {"value": None, "confidence": 0.0}
            continue

        if isinstance(raw_val, dict):
            # Expected: {"value": "...", "confidence": 0.9}
            value = (
                raw_val.get("value")
                or raw_val.get("val")
                or raw_val.get("extracted_value")
                or raw_val.get("result")
            )
            confidence = (
                raw_val.get("confidence")
                or raw_val.get("conf")
                or raw_val.get("score")
                or raw_val.get("certainty")
                or 0.5
            )
        elif isinstance(raw_val, str):
            value = raw_val.strip() or None
            confidence = 0.5  # model gave no confidence info
        else:
            value = str(raw_val)
            confidence = 0.5

        # Normalise confidence to [0, 1] — some models return percentages
        try:
            confidence = float(confidence)
            if confidence > 1.0:
                confidence = confidence / 100.0
            confidence = round(max(0.0, min(1.0, confidence)), 3)
        except (TypeError, ValueError):
            confidence = 0.5

        normalized[name] = {"value": value, "confidence": confidence}

    return normalized


def _format_sources(documents) -> list[dict]:
    sources = []
    for doc in documents:
        meta = getattr(doc, "metadata", {}) or {}
        sources.append(
            {
                "doc_id": meta.get("doc_id"),
                "filename": meta.get("filename"),
                "page_number": meta.get("page_number"),
                "line_start": meta.get("line_start"),
                "line_end": meta.get("line_end"),
                "snippet": doc.page_content[:300],
            }
        )
    return sources


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def index():
    react_index = FRONTEND_DIR / "index.html"
    if react_index.exists():
        return FileResponse(react_index)
    old_index = FRONTEND_OLD_DIR / "index.html"
    if old_index.exists():
        return FileResponse(old_index)
    return {"message": "AI Copilot API is running.", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok", "env_file": str(_ENV_PATH), "env_loaded": _ENV_PATH.exists()}


@app.get("/providers")
async def get_providers():
    """
    Returns the configuration status of all LLM providers.
    Use this to debug API key issues — if 'configured' is false, the key is missing from .env.
    """
    ollama_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")

    # Check if Ollama is reachable and get its installed models
    ollama_running = False
    ollama_models: list[str] = []
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{ollama_url}/api/tags")
            if r.status_code == 200:
                ollama_running = True
                ollama_models = [m["name"] for m in r.json().get("models", [])]
    except Exception:
        pass

    providers: dict = {}
    for name, meta in PROVIDER_META.items():
        if name == "ollama":
            providers["ollama"] = {
                "configured": True,
                "running": ollama_running,
                "url": ollama_url,
                "models": ollama_models,
                "kind": "local",
                "note": "Install a model with: ollama pull llama3" if not ollama_models else "",
            }
            continue
        key = os.environ.get(meta["env"], "")
        providers[name] = {
            "configured": bool(key),
            "key_preview": f"{key[:8]}..." if key else "NOT SET",
            "models": meta["models"],
            "kind": meta["kind"],
        }

    providers.update({
        "default_provider": os.environ.get("LLM_PROVIDER", "groq"),
        "embedding_provider": os.environ.get("EMBEDDING_PROVIDER", "local"),
        "embedding_model": os.environ.get("EMBEDDING_MODEL", LOCAL_EMBEDDING_MODELS[0]),
        "embedding_models": LOCAL_EMBEDDING_MODELS,
        "env_file": str(_ENV_PATH),
        "env_file_exists": _ENV_PATH.exists(),
    })
    return providers


HISTORY_TURNS = 10  # how many recent messages feed the chat's memory


def _owned_conversation(db: Session, user_id: str, conversation_id: str):
    conv = db.get(models.Conversation, conversation_id)
    if conv is None or conv.user_id != user_id:
        return None
    return conv


@app.post("/ask")
def ask(
    request: AskRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Q&A over the user's documents with semantic vector search.

    If `conversation_id` is supplied, recent history is loaded for memory,
    retrieval is scoped to that conversation's document, and both the question
    and answer are persisted. Without it, the call is stateless (legacy behavior).
    """
    vector_db = get_or_load_vector_store(user_id)
    if vector_db is None:
        return {"error": "No documents uploaded yet. Please upload a document first."}

    conv = None
    history: list = []
    if request.conversation_id:
        conv = _owned_conversation(db, user_id, request.conversation_id)
        if conv is None:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        history = list(conv.messages)[-HISTORY_TURNS:]

    # Scope retrieval: explicit doc → conversation's doc → all docs
    doc_id = request.document_id or (conv.document_id if conv else None)
    search_filter = {"doc_id": doc_id} if doc_id else None

    try:
        # fetch_k high so document-scoped filtering still surfaces enough candidates
        documents = vector_db.similarity_search(
            request.query, k=4, filter=search_filter, fetch_k=60
        )
        if not documents:
            return {"error": "No relevant content found. Try rephrasing your question."}

        llm = get_llm(provider=request.provider, model=request.model)
        prompt = _build_qa_prompt(request.query, documents, history=history)
        # LCEL chain: model → string output parser
        chain = llm | StrOutputParser()
        answer = strip_think(chain.invoke(prompt))
    except Exception as exc:
        return {"error": str(exc)}

    sources = _format_sources(documents)

    if conv is not None:
        db.add(models.Message(conversation_id=conv.id, role="user", content=request.query))
        db.add(
            models.Message(
                conversation_id=conv.id, role="assistant", content=answer, sources=sources
            )
        )
        if conv.title in (None, "", "New chat"):
            conv.title = (
                request.query[:60] + "…" if len(request.query) > 60 else request.query
            )
        db.commit()

    return {
        "answer": answer,
        "sources": sources,
        "provider": request.provider or os.environ.get("LLM_PROVIDER", "groq"),
        "conversation_id": conv.id if conv else None,
    }


def _find_value_source(value, documents) -> dict | None:
    """Best-effort: locate an extracted value in the retrieved chunks and return
    a clickable citation (page + line) pointing at it in the document viewer."""
    if value is None:
        return None
    needle = str(value).strip()
    if len(needle) < 2:
        return None
    low = needle.lower()
    for doc in documents:
        content = doc.page_content or ""
        idx = content.lower().find(low)
        if idx == -1:
            continue
        meta = doc.metadata or {}
        base_line = meta.get("line_start") or 1
        line = base_line + content.count("\n", 0, idx)
        return {
            "doc_id": meta.get("doc_id"),
            "filename": meta.get("filename"),
            "page_number": meta.get("page_number"),
            "line_start": line,
            "line_end": line + needle.count("\n"),
            "snippet": content[max(0, idx - 40): idx + len(needle) + 40].strip(),
        }
    return None


@app.post("/extract")
def extract_fields(
    request: ExtractRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Structured field extraction with confidence scores. Fields below 70%
    confidence are flagged for human review. The result is persisted as an
    Extraction (feeds the Review Queue + exports), with a per-field citation.
    """
    if not request.fields:
        return {"error": "No fields provided. Add at least one field to extract."}

    vector_db = get_or_load_vector_store(user_id)
    if vector_db is None:
        return {"error": "No documents uploaded yet. Upload a document first."}

    combined_query = " ".join(f.name + " " + f.description for f in request.fields)
    search_filter = {"doc_id": request.document_id} if request.document_id else None

    try:
        documents = vector_db.similarity_search(
            combined_query, k=6, filter=search_filter, fetch_k=60
        )
        if not documents:
            return {"error": "Could not find any relevant content in the uploaded documents."}

        context = "\n\n".join(doc.page_content for doc in documents)
        fields = [{"name": f.name, "description": f.description} for f in request.fields]
        # LangGraph extraction with structured JSON parsing + auto-retry
        outcome = run_field_extraction(
            fields=fields,
            context=context,
            provider=request.provider,
            model=request.model,
        )
    except Exception as exc:
        return {"error": str(exc)}

    if outcome["parsed"] is None:
        return {
            "error": "The AI returned a response that could not be parsed as JSON after "
            f"{outcome['attempts']} attempts. Try switching to a different model — "
            "Groq llama-3.1-8b-instant is most reliable for extraction.",
            "detail": outcome.get("error"),
        }

    extracted = _normalize_extraction(outcome["parsed"], request.fields)

    CONFIDENCE_THRESHOLD = 0.7
    descriptions = {f.name: f.description for f in request.fields}

    # Enrich each field with its description + a best-effort source citation.
    fields_payload: dict = {}
    for name, data in extracted.items():
        fields_payload[name] = {
            "value": data.get("value"),
            "confidence": data.get("confidence"),
            "description": descriptions.get(name, ""),
            "source": _find_value_source(data.get("value"), documents),
        }

    needs_review = [
        name
        for name, data in fields_payload.items()
        if (data.get("confidence") or 0.0) < CONFIDENCE_THRESHOLD
    ]

    provider = request.provider or os.environ.get("LLM_PROVIDER", "groq")

    # Look up document metadata for the registry / export columns.
    doc_name, file_type = "", "unknown"
    if request.document_id:
        doc = db.get(models.Document, request.document_id)
        if doc and doc.user_id == user_id:
            doc_name, file_type = doc.filename, doc.file_type

    extraction = models.Extraction(
        user_id=user_id,
        document_id=request.document_id,
        document_name=doc_name,
        file_type=file_type,
        fields=fields_payload,
        needs_review=needs_review,
        status="needs_review" if needs_review else "approved",
        provider=provider,
    )
    db.add(extraction)
    db.commit()
    db.refresh(extraction)

    return {
        "extraction_id": extraction.id,
        "extracted": fields_payload,
        "needs_review": needs_review,
        "status": extraction.status,
        "sources": _format_sources(documents),
        "provider": provider,
    }


# ─── ReviewQueue (human-in-the-loop, LangGraph) ──────────────────────────────

@app.post("/review/start")
def review_start(request: ReviewStartRequest, user_id: str = Depends(get_current_user)):
    """
    Start a human-in-the-loop review for an extraction. If any fields need review,
    the workflow pauses and returns a thread_id plus the pending fields. State is
    persisted, so the review can be completed in a later request.
    """
    try:
        return review_graph.start_review(request.extracted, request.needs_review)
    except Exception as exc:
        return {"error": str(exc)}


@app.get("/review/queue/{thread_id}")
def review_queue(thread_id: str, user_id: str = Depends(get_current_user)):
    """Read the current state of a review thread (pending fields or final result)."""
    try:
        return review_graph.get_pending(thread_id)
    except Exception as exc:
        return {"error": str(exc)}


@app.post("/review/approve")
def review_approve(request: ReviewApproveRequest, user_id: str = Depends(get_current_user)):
    """Resume a paused review with human-approved corrected values."""
    try:
        return review_graph.approve_review(request.thread_id, request.approved_values)
    except Exception as exc:
        return {"error": str(exc)}


MAX_IMPORT_BYTES = 50 * 1024 * 1024  # 50 MB cap for URL/connector imports

_CONTENT_TYPE_EXT = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "text/plain": "txt",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}


def _ingest_document(
    *,
    content: bytes,
    filename: str,
    content_type: str,
    user_id: str,
    db: Session,
    pdf_mode: str = DEFAULT_PDF_MODE,
    ocr_provider: str | None = None,
    pdf_document_type: str | None = None,
    source: str = "upload",
) -> dict:
    """
    Shared ingestion pipeline used by /upload and every import connector:
    extract text → chunk + tag → index in FAISS → store original → register.
    Raises ValueError for user-facing problems (no text, etc.).
    """
    filename = filename or "document"
    lower = filename.lower()
    file_type = lower.rsplit(".", 1)[-1] if "." in lower else "unknown"

    extraction = extract_file(
        filename=filename,
        file_bytes=content,
        pdf_mode=pdf_mode,
        ocr_provider=ocr_provider,
    )
    text = extraction.text
    if not text or not text.strip():
        raise ValueError("No readable text found in the document.")

    doc_id = uuid.uuid4().hex

    documents = split_text(
        extraction=extraction,
        filename=filename,
        file_type=file_type,
        pdf_document_type=pdf_document_type,
    )
    for chunk in documents:
        chunk.metadata["doc_id"] = doc_id

    if lower.endswith(".pdf"):
        pages = [
            {"page": i, "text": t}
            for i, t in enumerate(extraction.page_texts, start=1)
            if t.strip()
        ]
    else:
        pages = [{"page": 1, "text": text}]

    vector_db = get_or_load_vector_store(user_id)
    if vector_db is None:
        vector_db = create_vector_store_from_documents(documents, user_id)
    else:
        add_documents(vector_db, documents, user_id)

    storage_path = None
    try:
        storage_path = storage.save_file(
            user_id, doc_id, filename, content,
            content_type=content_type or "application/octet-stream",
        )
    except Exception as exc:
        print(f"[ingest] storage save failed (file not retained): {exc}")

    db.add(
        models.Document(
            id=doc_id,
            user_id=user_id,
            filename=filename,
            file_type=file_type,
            storage_path=storage_path,
            chunk_count=len(documents),
            char_count=len(text),
            pages=pages,
            status="indexed",
        )
    )
    db.commit()

    response = {
        "message": "Document indexed successfully.",
        "document_id": doc_id,
        "filename": filename,
        "file_type": file_type,
        "chunks_added": len(documents),
        "user_id": user_id,
        "source": source,
        "extracted_text": text,
    }
    if lower.endswith(".pdf"):
        response["pdf_document_type"] = pdf_document_type
        response["extraction_detail"] = to_upload_payload(extraction)
    return response


@app.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    pdf_mode: str = Form(DEFAULT_PDF_MODE),
    ocr_provider: str | None = Form(None),
    pdf_document_type: str | None = Form(None),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a document: store the original, index its text, and register it."""
    content = file.file.read()
    try:
        return _ingest_document(
            content=content,
            filename=file.filename or "document",
            content_type=file.content_type or "application/octet-stream",
            user_id=user_id,
            db=db,
            pdf_mode=pdf_mode,
            ocr_provider=ocr_provider,
            pdf_document_type=pdf_document_type,
            source="upload",
        )
    except Exception as exc:
        return {"error": str(exc)}


@app.post("/import-url")
def import_url(
    request: ImportUrlRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Import a document from a public URL (also powers Dropbox/OneDrive direct
    links). The server downloads it, then runs the shared ingestion pipeline.
    """
    url = (request.url or "").strip()
    if not url.lower().startswith(("http://", "https://")):
        return {"error": "Provide a valid http(s) URL."}

    try:
        with httpx.Client(timeout=60.0, follow_redirects=True) as client:
            resp = client.get(url)
            resp.raise_for_status()
            content = resp.content
    except Exception as exc:
        return {"error": f"Could not download the file: {exc}"}

    if len(content) > MAX_IMPORT_BYTES:
        return {"error": "File exceeds the 50 MB import limit."}

    content_type = (resp.headers.get("content-type") or "").split(";")[0].strip()

    # Derive a filename: explicit → Content-Disposition → URL path → fallback.
    filename = (request.filename or "").strip()
    if not filename:
        cd = resp.headers.get("content-disposition", "")
        if "filename=" in cd:
            filename = cd.split("filename=")[-1].strip().strip('"; ')
    if not filename:
        from urllib.parse import urlparse, unquote
        filename = unquote(os.path.basename(urlparse(url).path)) or ""
    if not filename:
        filename = "imported_file"
    # Ensure a usable extension so extraction picks the right parser.
    if "." not in filename and content_type in _CONTENT_TYPE_EXT:
        filename = f"{filename}.{_CONTENT_TYPE_EXT[content_type]}"

    try:
        return _ingest_document(
            content=content,
            filename=filename,
            content_type=content_type or "application/octet-stream",
            user_id=user_id,
            db=db,
            source="url",
        )
    except Exception as exc:
        return {"error": str(exc)}


# ─── Document registry ────────────────────────────────────────────────────────

_MEDIA_TYPES = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "txt": "text/plain",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _doc_to_dict(d: models.Document) -> dict:
    return {
        "id": d.id,
        "filename": d.filename,
        "file_type": d.file_type,
        "chunk_count": d.chunk_count,
        "char_count": d.char_count,
        "status": d.status,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


@app.get("/documents")
def list_documents(
    user_id: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    """List the current user's uploaded documents, newest first."""
    rows = db.scalars(
        select(models.Document)
        .where(models.Document.user_id == user_id)
        .order_by(desc(models.Document.created_at))
    ).all()
    return {"documents": [_doc_to_dict(d) for d in rows]}


@app.get("/documents/{document_id}/pages")
def get_document_pages(
    document_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return per-page extracted text for the in-app viewer + citation jumps."""
    doc = db.get(models.Document, document_id)
    if doc is None or doc.user_id != user_id:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "file_type": doc.file_type,
        "pages": doc.pages or [],
    }


@app.get("/documents/{document_id}/file")
def get_document_file(
    document_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stream back the original uploaded file (powers the document viewer)."""
    doc = db.get(models.Document, document_id)
    if doc is None or doc.user_id != user_id:
        raise HTTPException(status_code=404, detail="Document not found.")
    if not doc.storage_path:
        raise HTTPException(
            status_code=404, detail="Original file was not retained for this document."
        )
    try:
        data = storage.get_file(doc.storage_path)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"File unavailable: {exc}")

    media = _MEDIA_TYPES.get(doc.file_type, "application/octet-stream")
    return Response(
        content=data,
        media_type=media,
        headers={"Content-Disposition": f'inline; filename="{doc.filename}"'},
    )


@app.delete("/documents/{document_id}")
def delete_document(
    document_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a document record + its stored file. (Vector chunks are left until reindex.)"""
    doc = db.get(models.Document, document_id)
    if doc is None or doc.user_id != user_id:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.storage_path:
        try:
            storage.delete_file(doc.storage_path)
        except Exception as exc:
            print(f"[delete] storage delete failed: {exc}")
    # Remove the document's vector chunks so they don't pollute retrieval.
    try:
        delete_by_doc_id(user_id, document_id)
    except Exception as exc:
        print(f"[delete] vector cleanup failed: {exc}")
    db.delete(doc)
    db.commit()
    return {"deleted": document_id}


# ─── Conversations (ChatGPT-style sidebar + memory) ───────────────────────────

def _conv_to_dict(c: models.Conversation, with_messages: bool = False) -> dict:
    data = {
        "id": c.id,
        "title": c.title,
        "document_id": c.document_id,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }
    if with_messages:
        data["messages"] = [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "sources": m.sources,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in c.messages
        ]
    return data


@app.post("/conversations")
def create_conversation(
    request: ConversationCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new chat, optionally tied to a single document."""
    if request.document_id:
        doc = db.get(models.Document, request.document_id)
        if doc is None or doc.user_id != user_id:
            raise HTTPException(status_code=404, detail="Document not found.")
    conv = models.Conversation(
        user_id=user_id,
        title=request.title or "New chat",
        document_id=request.document_id,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return _conv_to_dict(conv)


@app.get("/conversations")
def list_conversations(
    user_id: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    """List the user's conversations, most recently updated first (sidebar)."""
    rows = db.scalars(
        select(models.Conversation)
        .where(models.Conversation.user_id == user_id)
        .order_by(desc(models.Conversation.updated_at))
    ).all()
    return {"conversations": [_conv_to_dict(c) for c in rows]}


@app.get("/conversations/{conversation_id}")
def get_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Load a conversation with its full message history (to resume chatting)."""
    conv = _owned_conversation(db, user_id, conversation_id)
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return _conv_to_dict(conv, with_messages=True)


@app.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _owned_conversation(db, user_id, conversation_id)
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    db.delete(conv)
    db.commit()
    return {"deleted": conversation_id}


# ─── Extractions (structured data + Review Queue + export) ─────────────────────

def _extraction_to_dict(e: models.Extraction) -> dict:
    return {
        "id": e.id,
        "document_id": e.document_id,
        "document_name": e.document_name,
        "file_type": e.file_type,
        "fields": e.fields or {},
        "needs_review": e.needs_review or [],
        "status": e.status,
        "provider": e.provider,
        "created_at": e.created_at.isoformat() if e.created_at else None,
        "updated_at": e.updated_at.isoformat() if e.updated_at else None,
    }


@app.get("/extractions")
def list_extractions(
    status: str | None = None,
    document_id: str | None = None,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List extractions, optionally filtered by status (e.g. needs_review) or document."""
    q = select(models.Extraction).where(models.Extraction.user_id == user_id)
    if status:
        q = q.where(models.Extraction.status == status)
    if document_id:
        q = q.where(models.Extraction.document_id == document_id)
    rows = db.scalars(q.order_by(desc(models.Extraction.created_at))).all()
    return {"extractions": [_extraction_to_dict(e) for e in rows]}


@app.get("/extractions/{extraction_id}")
def get_extraction(
    extraction_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    e = db.get(models.Extraction, extraction_id)
    if e is None or e.user_id != user_id:
        raise HTTPException(status_code=404, detail="Extraction not found.")
    return _extraction_to_dict(e)


@app.post("/extractions/{extraction_id}/approve")
def approve_extraction(
    extraction_id: str,
    request: ExtractionApproveRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Apply human-corrected values, mark verified fields confident, and approve."""
    e = db.get(models.Extraction, extraction_id)
    if e is None or e.user_id != user_id:
        raise HTTPException(status_code=404, detail="Extraction not found.")

    fields = dict(e.fields or {})
    for name, new_value in (request.values or {}).items():
        if name in fields:
            fields[name] = {**fields[name], "value": new_value, "confidence": 1.0}
        else:
            fields[name] = {"value": new_value, "confidence": 1.0, "description": "", "source": None}

    e.fields = fields
    e.needs_review = []
    e.status = "approved"
    db.commit()
    db.refresh(e)
    return _extraction_to_dict(e)


@app.delete("/extractions/{extraction_id}")
def delete_extraction(
    extraction_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    e = db.get(models.Extraction, extraction_id)
    if e is None or e.user_id != user_id:
        raise HTTPException(status_code=404, detail="Extraction not found.")
    db.delete(e)
    db.commit()
    return {"deleted": extraction_id}


@app.post("/extractions/export")
def export_extractions(
    request: ExportRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export selected/filtered extractions as CSV or XLSX (one row per extraction)."""
    q = select(models.Extraction).where(models.Extraction.user_id == user_id)
    if request.ids:
        q = q.where(models.Extraction.id.in_(request.ids))
    if request.document_id:
        q = q.where(models.Extraction.document_id == request.document_id)
    if request.status:
        q = q.where(models.Extraction.status == request.status)
    rows = db.scalars(q.order_by(desc(models.Extraction.created_at))).all()

    if not rows:
        raise HTTPException(status_code=404, detail="No extractions match the export filters.")

    # Column order: metadata first, then the union of all field names.
    field_names: list[str] = []
    for e in rows:
        for name in (e.fields or {}).keys():
            if name not in field_names:
                field_names.append(name)
    headers = ["document_name", "status", *field_names]

    def value_of(e, name):
        cell = (e.fields or {}).get(name)
        return "" if cell is None else cell.get("value", "")

    table = [headers]
    for e in rows:
        table.append([e.document_name, e.status, *[value_of(e, n) for n in field_names]])

    fmt = (request.format or "csv").lower()
    if fmt == "xlsx":
        try:
            from openpyxl import Workbook
        except ImportError:
            raise HTTPException(status_code=500, detail="openpyxl not installed on the server.")
        wb = Workbook()
        ws = wb.active
        ws.title = "Extractions"
        for r in table:
            ws.append([("" if v is None else v) for v in r])
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        return Response(
            content=buf.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": 'attachment; filename="extractions.xlsx"'},
        )

    # default: CSV
    buf = io.StringIO()
    writer = csv.writer(buf)
    for r in table:
        writer.writerow(["" if v is None else v for v in r])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="extractions.csv"'},
    )
