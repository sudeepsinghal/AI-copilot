"""
Database engine + session management.

Uses SQLAlchemy so the *same* models run on:
  - SQLite          (local dev fallback, zero setup)
  - Supabase Postgres (production, via DATABASE_URL)

Switch is purely the DATABASE_URL env var. If it is unset we fall back to a
local SQLite file so the app always boots.
"""
from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_SQLITE_FALLBACK = f"sqlite:///{_BACKEND_DIR / 'app.sqlite'}"

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip() or _SQLITE_FALLBACK

# Normalise common Supabase/Heroku-style URLs to the psycopg v3 driver.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)

_is_sqlite = DATABASE_URL.startswith("sqlite")

if _is_sqlite:
    _engine_kwargs: dict = {"connect_args": {"check_same_thread": False}}
else:
    # Supabase's transaction pooler (port 6543) is pgbouncer; server-side
    # prepared statements break there, so disable them. pre_ping avoids
    # serving connections the pooler has already dropped.
    _engine_kwargs = {
        "pool_pre_ping": True,
        "connect_args": {"prepare_threshold": None},
    }

engine = create_engine(DATABASE_URL, **_engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    """Create all tables if they don't exist. Safe to call on every startup."""
    from Backend.utils import models  # noqa: F401 — register mappers

    Base.metadata.create_all(bind=engine)
    _auto_add_columns()


# Columns added after a table's first creation. create_all() never ALTERs an
# existing table, so we add new nullable columns here (lightweight dev migration).
_ADDED_COLUMNS = {
    "documents": [("pages", "JSON")],
}


def _auto_add_columns() -> None:
    from sqlalchemy import inspect, text

    insp = inspect(engine)
    existing_tables = set(insp.get_table_names())
    for table, columns in _ADDED_COLUMNS.items():
        if table not in existing_tables:
            continue
        present = {c["name"] for c in insp.get_columns(table)}
        for name, sql_type in columns:
            if name not in present:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {sql_type}"))
                print(f"[DB] Added column {table}.{name}")


def get_db():
    """FastAPI dependency — yields a session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def db_kind() -> str:
    return "sqlite" if _is_sqlite else "postgres"
