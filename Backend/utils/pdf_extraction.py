from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
import re
import time
from typing import Any

from docx import Document
from pypdf import PdfReader

from Backend.utils.ocr_providers import (
    DEFAULT_OCR_PROVIDER,
    run_ocr,
)


DEFAULT_PDF_MODE = "parse"
SUPPORTED_PDF_MODES = ("parse", "ocr", "auto")


@dataclass
class ExtractionResult:
    text: str
    page_texts: list[str]
    requested_mode: str
    used_mode: str
    ocr_provider: str | None
    metrics: dict[str, Any]
    fallback_reason: str | None = None


def _word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def _join_page_texts(page_texts: list[str]) -> str:
    return "\n\n".join(page_texts).strip()


def _build_metrics(page_texts: list[str], elapsed_ms: int) -> dict[str, Any]:
    text = _join_page_texts(page_texts)
    pages_total = len(page_texts)
    words_total = _word_count(text)
    chars_total = len(text)
    pages_with_text = sum(1 for page_text in page_texts if page_text.strip())
    empty_pages = pages_total - pages_with_text
    short_pages = sum(1 for page_text in page_texts if _word_count(page_text) < 20)
    non_alnum_chars = sum(
        1 for char in text if not char.isalnum() and not char.isspace()
    )

    return {
        "pages_total": pages_total,
        "pages_with_text": pages_with_text,
        "empty_pages": empty_pages,
        "chars_total": chars_total,
        "words_total": words_total,
        "avg_words_per_page": round(words_total / pages_total, 2) if pages_total else 0,
        "non_alnum_ratio": round(non_alnum_chars / chars_total, 4) if chars_total else 1.0,
        "short_page_ratio": round(short_pages / pages_total, 4) if pages_total else 1.0,
        "extraction_time_ms": elapsed_ms,
        "preview_excerpt": text[:400],
    }


def _parse_pdf_pages(file_bytes: bytes) -> list[str]:
    reader = PdfReader(BytesIO(file_bytes))
    return [(page.extract_text() or "").strip() for page in reader.pages]


def _extract_pdf_with_parser(file_bytes: bytes, requested_mode: str) -> ExtractionResult:
    started = time.perf_counter()
    page_texts = _parse_pdf_pages(file_bytes)
    elapsed_ms = round((time.perf_counter() - started) * 1000)
    return ExtractionResult(
        text=_join_page_texts(page_texts),
        page_texts=page_texts,
        requested_mode=requested_mode,
        used_mode="parse",
        ocr_provider=None,
        metrics=_build_metrics(page_texts, elapsed_ms),
    )


def _extract_pdf_with_ocr(
    file_bytes: bytes, requested_mode: str, ocr_provider: str | None = None
) -> ExtractionResult:
    started = time.perf_counter()
    provider_name = (ocr_provider or DEFAULT_OCR_PROVIDER).lower()
    page_texts = run_ocr(file_bytes=file_bytes, provider=provider_name)
    elapsed_ms = round((time.perf_counter() - started) * 1000)
    return ExtractionResult(
        text=_join_page_texts(page_texts),
        page_texts=page_texts,
        requested_mode=requested_mode,
        used_mode="ocr",
        ocr_provider=provider_name,
        metrics=_build_metrics(page_texts, elapsed_ms),
    )


def _parse_quality_fallback_reason(result: ExtractionResult) -> str | None:
    metrics = result.metrics

    if metrics["words_total"] == 0:
        return "parser_extracted_no_words"
    if metrics["pages_total"] and metrics["empty_pages"] == metrics["pages_total"]:
        return "parser_extracted_empty_pages"
    if metrics["pages_total"] and metrics["avg_words_per_page"] < 15:
        return "parser_extracted_too_few_words_per_page"
    if metrics["short_page_ratio"] > 0.7:
        return "parser_extracted_too_many_short_pages"
    return None


def _extract_pdf_auto(
    file_bytes: bytes, requested_mode: str, ocr_provider: str | None = None
) -> ExtractionResult:
    parsed_result = _extract_pdf_with_parser(
        file_bytes=file_bytes,
        requested_mode=requested_mode,
    )
    fallback_reason = _parse_quality_fallback_reason(parsed_result)
    if fallback_reason is None:
        return ExtractionResult(
            text=parsed_result.text,
            page_texts=parsed_result.page_texts,
            requested_mode=requested_mode,
            used_mode="parse",
            ocr_provider=None,
            metrics=parsed_result.metrics,
            fallback_reason=None,
        )

    ocr_result = _extract_pdf_with_ocr(
        file_bytes=file_bytes,
        requested_mode=requested_mode,
        ocr_provider=ocr_provider,
    )
    ocr_result.fallback_reason = fallback_reason
    return ocr_result


def _read_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8")


def _read_docx(file_bytes: bytes) -> str:
    doc = Document(BytesIO(file_bytes))
    return "\n".join([paragraph.text for paragraph in doc.paragraphs]).strip()


def extract_file(
    filename: str,
    file_bytes: bytes,
    pdf_mode: str = DEFAULT_PDF_MODE,
    ocr_provider: str | None = None,
) -> ExtractionResult:
    lower_filename = filename.lower()

    if lower_filename.endswith(".pdf"):
        selected_mode = (pdf_mode or DEFAULT_PDF_MODE).lower()
        if selected_mode not in SUPPORTED_PDF_MODES:
            supported = ", ".join(SUPPORTED_PDF_MODES)
            raise ValueError(
                f"Invalid pdf_mode '{selected_mode}'. Supported modes: {supported}"
            )
        if selected_mode == "parse":
            return _extract_pdf_with_parser(file_bytes, requested_mode="parse")
        if selected_mode == "ocr":
            return _extract_pdf_with_ocr(
                file_bytes,
                requested_mode="ocr",
                ocr_provider=ocr_provider,
            )
        return _extract_pdf_auto(
            file_bytes,
            requested_mode="auto",
            ocr_provider=ocr_provider,
        )

    started = time.perf_counter()
    if lower_filename.endswith(".txt"):
        text = _read_txt(file_bytes)
    elif lower_filename.endswith(".docx"):
        text = _read_docx(file_bytes)
    else:
        raise ValueError("Invalid file type (current support: txt, docx, pdf)")

    elapsed_ms = round((time.perf_counter() - started) * 1000)
    page_texts = [text]
    return ExtractionResult(
        text=text,
        page_texts=page_texts,
        requested_mode="parse",
        used_mode="parse",
        ocr_provider=None,
        metrics=_build_metrics(page_texts, elapsed_ms),
    )


def to_preview_payload(result: ExtractionResult) -> dict[str, Any]:
    pages = []
    for index, page_text in enumerate(result.page_texts, start=1):
        pages.append(
            {
                "page_number": index,
                "text": page_text,
                "chars": len(page_text),
                "words": _word_count(page_text),
            }
        )

    return {
        "requested_mode": result.requested_mode,
        "used_mode": result.used_mode,
        "ocr_provider": result.ocr_provider,
        "fallback_reason": result.fallback_reason,
        "metrics": result.metrics,
        "text": result.text,
        "pages": pages,
    }


def to_upload_payload(result: ExtractionResult) -> dict[str, Any]:
    metrics = result.metrics
    return {
        "requested_mode": result.requested_mode,
        "used_mode": result.used_mode,
        "ocr_provider": result.ocr_provider,
        "fallback_reason": result.fallback_reason,
        "pages_total": metrics["pages_total"],
        "pages_with_text": metrics["pages_with_text"],
        "empty_pages": metrics["empty_pages"],
    }
