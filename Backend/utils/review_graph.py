from __future__ import annotations

import sqlite3
import uuid
from pathlib import Path
from typing import Any, TypedDict

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt

# ─────────────────────────────────────────────────────────────────────────────
# LangGraph: human-in-the-loop ReviewQueue.
#
#   START ─┬─ (no low-confidence fields) ─→ finalize → END
#          └─ (low-confidence fields)     ─→ human_review  ⏸ interrupt()
#                                                  │ (human approves corrections)
#                                                  └─→ finalize → END
#
# State is persisted to SQLite via a checkpointer, so a paused review survives
# across requests and server restarts. Each review is one `thread_id`.
# ─────────────────────────────────────────────────────────────────────────────

_DB_PATH = Path(__file__).resolve().parent.parent / "review_checkpoints.sqlite"
_conn = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
_checkpointer = SqliteSaver(_conn)
try:
    _checkpointer.setup()
except Exception:
    pass


class ReviewState(TypedDict, total=False):
    extracted: dict          # {field: {"value": ..., "confidence": ...}}
    needs_review: list        # [field names below threshold]
    approved: dict            # {field: corrected_value}
    result: dict              # finalized output
    status: str


def _route_entry(state: ReviewState) -> str:
    return "human_review" if state.get("needs_review") else "finalize"


def _human_review(state: ReviewState) -> ReviewState:
    pending = {
        name: state["extracted"].get(name)
        for name in state.get("needs_review", [])
    }
    # Pause here. The payload is handed to the caller; execution resumes when
    # the graph is invoked again with Command(resume={field: corrected_value}).
    corrections = interrupt({"pending_fields": pending})
    approved = dict(state.get("approved", {}))
    if corrections:
        approved.update(corrections)
    return {"approved": approved}


def _finalize(state: ReviewState) -> ReviewState:
    result = {name: dict(info or {}) for name, info in state["extracted"].items()}
    for name, value in state.get("approved", {}).items():
        if name in result:
            result[name] = {"value": value, "confidence": 1.0, "reviewed": True}
    return {"result": result, "status": "complete"}


def _build_graph():
    graph = StateGraph(ReviewState)
    graph.add_node("human_review", _human_review)
    graph.add_node("finalize", _finalize)
    graph.add_conditional_edges(
        START, _route_entry, {"human_review": "human_review", "finalize": "finalize"}
    )
    graph.add_edge("human_review", "finalize")
    graph.add_edge("finalize", END)
    return graph.compile(checkpointer=_checkpointer)


_GRAPH = _build_graph()


def _config(thread_id: str) -> dict:
    return {"configurable": {"thread_id": thread_id}}


def start_review(extracted: dict, needs_review: list) -> dict[str, Any]:
    """Start a review workflow. Returns pending fields (if any) or the final result."""
    thread_id = uuid.uuid4().hex
    out = _GRAPH.invoke(
        {"extracted": extracted, "needs_review": needs_review, "approved": {}},
        config=_config(thread_id),
    )
    if "__interrupt__" in out:
        payload = out["__interrupt__"][0].value
        return {"thread_id": thread_id, "status": "pending", **payload}
    return {"thread_id": thread_id, "status": "complete", "result": out.get("result")}


def get_pending(thread_id: str) -> dict[str, Any]:
    """Read the current state of a review thread."""
    state = _GRAPH.get_state(_config(thread_id))
    if not state.created_at:
        return {"thread_id": thread_id, "status": "not_found"}
    if state.next:  # graph is paused awaiting human input
        values = state.values
        pending = {
            name: values["extracted"].get(name)
            for name in values.get("needs_review", [])
        }
        return {"thread_id": thread_id, "status": "pending", "pending_fields": pending}
    return {"thread_id": thread_id, "status": "complete", "result": state.values.get("result")}


def approve_review(thread_id: str, approved_values: dict) -> dict[str, Any]:
    """Resume a paused review with the human-approved corrected values."""
    out = _GRAPH.invoke(Command(resume=approved_values or {}), config=_config(thread_id))
    if "__interrupt__" in out:
        payload = out["__interrupt__"][0].value
        return {"thread_id": thread_id, "status": "pending", **payload}
    return {"thread_id": thread_id, "status": "complete", "result": out.get("result")}
