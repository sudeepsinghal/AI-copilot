"""
Object storage for original uploaded files.

Two backends, chosen automatically:
  - Supabase Storage  — when SUPABASE_URL + SUPABASE_SERVICE_KEY are set (prod)
  - Local filesystem  — Backend/storage/ (dev fallback, zero setup)

Same interface either way:
    path = save_file(user_id, doc_id, filename, data)   # returns storage_path
    data = get_file(path)                                # returns bytes
    delete_file(path)

Storage path scheme: "{user_id}/{doc_id}/{filename}"
"""
from __future__ import annotations

import os
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_LOCAL_ROOT = _BACKEND_DIR / "storage"

_SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
_SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()
_BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET", "documents").strip()

_use_supabase = bool(_SUPABASE_URL and _SUPABASE_KEY)


def backend_kind() -> str:
    return "supabase" if _use_supabase else "local"


def _bucket():
    """
    Return a Supabase storage bucket client (via lightweight storage3).

    A FRESH client is created per call on purpose: FastAPI runs sync endpoints in
    a threadpool, and storage3's underlying httpx/TLS connection is not safe to
    share across threads — a shared client causes intermittent
    'SSLV3_ALERT_BAD_RECORD_MAC' errors. A new client per call sidesteps this.
    """
    from storage3 import create_client

    client = create_client(
        f"{_SUPABASE_URL}/storage/v1",
        {"apikey": _SUPABASE_KEY, "Authorization": f"Bearer {_SUPABASE_KEY}"},
        is_async=False,
    )
    return client.from_(_BUCKET)


def _make_path(user_id: str, doc_id: str, filename: str) -> str:
    safe_name = os.path.basename(filename) or "file"
    return f"{user_id}/{doc_id}/{safe_name}"


def save_file(user_id: str, doc_id: str, filename: str, data: bytes,
              content_type: str = "application/octet-stream") -> str:
    path = _make_path(user_id, doc_id, filename)

    if _use_supabase:
        last_exc = None
        for attempt in range(3):
            try:
                _bucket().upload(
                    path=path,
                    file=data,
                    file_options={"content-type": content_type, "upsert": "true"},
                )
                return path
            except Exception as exc:  # transient TLS/network — retry with a fresh client
                last_exc = exc
        raise last_exc

    dest = _LOCAL_ROOT / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return path


def get_file(path: str) -> bytes:
    if _use_supabase:
        return _bucket().download(path)
    return (_LOCAL_ROOT / path).read_bytes()


def delete_file(path: str) -> None:
    if _use_supabase:
        _bucket().remove([path])
        return
    target = _LOCAL_ROOT / path
    if target.exists():
        target.unlink()
