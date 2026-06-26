from __future__ import annotations

from typing import Any, TypedDict

from langchain_core.output_parsers import JsonOutputParser
from langgraph.graph import END, START, StateGraph

from Backend.utils.llm import get_llm

# ─────────────────────────────────────────────────────────────────────────────
# LangGraph: structured field extraction with an automatic retry loop.
#
#   START → extract → (valid? → END) ─┐
#                       │ invalid     │
#                       └─ retry ─────┘   (up to MAX_ATTEMPTS, stricter prompt)
#
# The chain itself is LCEL:  llm | JsonOutputParser  (structured output parsing,
# replacing the old hand-rolled _parse_llm_json).
# ─────────────────────────────────────────────────────────────────────────────

MAX_ATTEMPTS = 3

_parser = JsonOutputParser()


class ExtractionState(TypedDict, total=False):
    fields: list[dict]      # [{"name": ..., "description": ...}]
    context: str            # retrieved document text
    provider: str | None
    model: str | None
    attempt: int
    parsed: dict | None
    error: str | None


def _build_prompt(fields: list[dict], context: str, strict: bool) -> str:
    field_list = "\n".join(f'- "{f["name"]}": {f["description"]}' for f in fields)
    field_keys = ", ".join(f'"{f["name"]}"' for f in fields)
    strict_note = (
        "\nIMPORTANT: Your previous reply was not valid JSON. Respond with NOTHING "
        "but a single raw JSON object — no prose, no markdown, no code fences.\n"
        if strict else ""
    )
    return f"""You are a precise data extraction assistant. Extract the following fields from the document.
{strict_note}
FIELDS TO EXTRACT:
{field_list}

DOCUMENT:
{context}

Instructions:
- Return ONLY a raw JSON object. No markdown. No code fences. No explanation.
- Use exactly these keys: {field_keys}
- For each key, provide an object with "value" (string or null) and "confidence" (0.0 to 1.0).
- If a field is not found, use {{"value": null, "confidence": 0.0}}

Output:
{{
  "field_name": {{"value": "extracted text here", "confidence": 0.95}}
}}"""


def _extract_node(state: ExtractionState) -> ExtractionState:
    attempt = state.get("attempt", 0) + 1
    strict = attempt > 1
    prompt = _build_prompt(state["fields"], state["context"], strict=strict)

    try:
        llm = get_llm(provider=state.get("provider"), model=state.get("model"))
        # LCEL chain: model → JSON parser (structured output parsing)
        chain = llm | _parser
        raw = chain.invoke(prompt)
        parsed = raw if isinstance(raw, dict) else None
        error = None if parsed is not None else "Model did not return a JSON object."
    except Exception as exc:  # parse failure or provider error
        parsed = None
        error = str(exc)

    return {"attempt": attempt, "parsed": parsed, "error": error}


def _route(state: ExtractionState) -> str:
    if state.get("parsed") is not None:
        return END
    if state.get("attempt", 0) >= MAX_ATTEMPTS:
        return END
    return "extract"


def _build_graph():
    graph = StateGraph(ExtractionState)
    graph.add_node("extract", _extract_node)
    graph.add_edge(START, "extract")
    graph.add_conditional_edges("extract", _route, {"extract": "extract", END: END})
    return graph.compile()


_GRAPH = _build_graph()


def run_field_extraction(
    fields: list[dict],
    context: str,
    provider: str | None = None,
    model: str | None = None,
) -> dict[str, Any]:
    """
    Run the extraction graph. Returns:
      {"parsed": dict | None, "attempts": int, "error": str | None}
    """
    final = _GRAPH.invoke({
        "fields": fields,
        "context": context,
        "provider": provider,
        "model": model,
        "attempt": 0,
    })
    return {
        "parsed": final.get("parsed"),
        "attempts": final.get("attempt", 0),
        "error": final.get("error"),
    }
