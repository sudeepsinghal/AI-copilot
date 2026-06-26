from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
import importlib.util
import os
from pathlib import Path
import shutil
from typing import Any, Callable


BASE_DIR = Path(__file__).resolve().parent.parent
OCR_ASSETS_ROOT = Path(
    os.environ.get("OCR_ASSETS_DIR", str(BASE_DIR / "ocr_assets"))
).resolve()

DEFAULT_OCR_PROVIDER = "tesseract"
SUPPORTED_OCR_PROVIDERS = ("tesseract", "paddleocr", "doctr", "trocr")


class OCRProviderError(RuntimeError):
    pass


class OCRProviderNotReadyError(OCRProviderError):
    pass


@dataclass(frozen=True)
class ProviderStatus:
    provider: str
    ready: bool
    runtime_mode: str
    notes: str
    python_packages_installed: bool
    asset_paths: dict[str, str]
    missing_requirements: list[str]
    binary_available: bool | None = None
    bootstrap_required: bool = False


_PROVIDER_CACHE: dict[str, Any] = {}


def _is_module_available(module_name: str) -> bool:
    return importlib.util.find_spec(module_name) is not None


def _read_pdf_with_fitz(file_bytes: bytes):
    if not _is_module_available("fitz"):
        raise OCRProviderError(
            "PyMuPDF is required for OCR rendering. Install the `PyMuPDF` package first."
        )

    if not _is_module_available("PIL"):
        raise OCRProviderError(
            "Pillow is required for OCR rendering. Install the `Pillow` package first."
        )

    import fitz
    from PIL import Image

    pdf = fitz.open(stream=file_bytes, filetype="pdf")
    images = []
    for page in pdf:
        pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        image = Image.open(BytesIO(pixmap.tobytes("png")))
        images.append(image)
    pdf.close()
    return images


def _provider_root(provider_name: str) -> Path:
    return OCR_ASSETS_ROOT / provider_name


def _contains_model_files(directory: Path, patterns: tuple[str, ...]) -> bool:
    if not directory.exists() or not directory.is_dir():
        return False
    for pattern in patterns:
        if any(directory.glob(pattern)):
            return True
    return False


def _build_provider_status(provider_name: str) -> ProviderStatus:
    if provider_name == "tesseract":
        missing = []
        if not _is_module_available("pytesseract"):
            missing.append("python-package:pytesseract")
        binary_available = shutil.which("tesseract") is not None
        if not binary_available:
            missing.append("system-binary:tesseract")
        return ProviderStatus(
            provider="tesseract",
            ready=not missing,
            runtime_mode="local_only",
            notes="Stable baseline OCR engine. Manage extra language files via TESSDATA_PREFIX if needed.",
            python_packages_installed=_is_module_available("pytesseract"),
            asset_paths={"asset_root": str(_provider_root("tesseract"))},
            missing_requirements=missing,
            binary_available=binary_available,
            bootstrap_required=False,
        )

    if provider_name == "paddleocr":
        root = _provider_root("paddleocr")
        det_dir = root / "det"
        rec_dir = root / "rec"
        cls_dir = root / "cls"
        ready_marker = root / "ready.marker"
        packages_ok = _is_module_available("paddleocr") and _is_module_available("paddle")
        missing = []
        if not _is_module_available("paddleocr"):
            missing.append("python-package:paddleocr")
        if not _is_module_available("paddle"):
            missing.append("python-package:paddlepaddle")
        if not _contains_model_files(det_dir, ("*.pdmodel", "*.json")):
            missing.append(f"asset-dir:{det_dir}")
        if not _contains_model_files(rec_dir, ("*.pdmodel", "*.json")):
            missing.append(f"asset-dir:{rec_dir}")
        if not _contains_model_files(cls_dir, ("*.pdmodel", "*.json")):
            missing.append(f"asset-dir:{cls_dir}")
        if not ready_marker.exists():
            missing.append(f"asset-marker:{ready_marker}")
        return ProviderStatus(
            provider="paddleocr",
            ready=packages_ok and len(missing) == 0,
            runtime_mode="local_only",
            notes="Detection, recognition, and classifier model directories must be provisioned locally and explicitly smoke-tested before use.",
            python_packages_installed=packages_ok,
            asset_paths={
                "asset_root": str(root),
                "det_model_dir": str(det_dir),
                "rec_model_dir": str(rec_dir),
                "cls_model_dir": str(cls_dir),
                "ready_marker": str(ready_marker),
            },
            missing_requirements=missing,
            bootstrap_required=True,
        )

    if provider_name == "doctr":
        root = _provider_root("doctr")
        cache_dir = root / "cache"
        ready_marker = root / "ready.marker"
        packages_ok = _is_module_available("doctr")
        missing = []
        if not packages_ok:
            missing.append("python-package:python-doctr")
        if not cache_dir.exists() or not any(cache_dir.rglob("*")):
            missing.append(f"asset-dir:{cache_dir}")
        if not ready_marker.exists():
            missing.append(f"asset-marker:{ready_marker}")
        return ProviderStatus(
            provider="doctr",
            ready=packages_ok and len(missing) == 0,
            runtime_mode="local_only",
            notes="Requires a populated DOCTR cache directory and a ready.marker file to avoid runtime downloads.",
            python_packages_installed=packages_ok,
            asset_paths={
                "asset_root": str(root),
                "cache_dir": str(cache_dir),
                "ready_marker": str(ready_marker),
            },
            missing_requirements=missing,
            bootstrap_required=True,
        )

    if provider_name == "trocr":
        root = _provider_root("trocr")
        model_dir = root / "model"
        processor_dir = root / "processor"
        ready_marker = root / "ready.marker"
        packages_ok = _is_module_available("transformers") and _is_module_available("torch")
        missing = []
        if not _is_module_available("transformers"):
            missing.append("python-package:transformers")
        if not _is_module_available("torch"):
            missing.append("python-package:torch")
        if not (model_dir / "config.json").exists():
            missing.append(f"asset-file:{model_dir / 'config.json'}")
        if not any((processor_dir / name).exists() for name in ("preprocessor_config.json", "processor_config.json")):
            missing.append(
                f"asset-file:{processor_dir / 'preprocessor_config.json'}"
            )
        if not ready_marker.exists():
            missing.append(f"asset-marker:{ready_marker}")
        return ProviderStatus(
            provider="trocr",
            ready=packages_ok and len(missing) == 0,
            runtime_mode="local_only",
            notes="Experimental full-page OCR provider. Requires local model and processor directories plus a smoke-test marker.",
            python_packages_installed=packages_ok,
            asset_paths={
                "asset_root": str(root),
                "model_dir": str(model_dir),
                "processor_dir": str(processor_dir),
                "ready_marker": str(ready_marker),
            },
            missing_requirements=missing,
            bootstrap_required=True,
        )

    raise OCRProviderError(f"Unsupported OCR provider '{provider_name}'")


def _get_status(provider_name: str) -> ProviderStatus:
    return _build_provider_status(provider_name)


def _require_ready(provider_name: str) -> ProviderStatus:
    status = _get_status(provider_name)
    if not status.ready:
        missing = ", ".join(status.missing_requirements) or "provider_not_ready"
        raise OCRProviderNotReadyError(
            f"OCR provider '{provider_name}' is not ready for local-only inference. "
            f"Missing requirements: {missing}. "
            f"Provision local assets under {status.asset_paths.get('asset_root', str(OCR_ASSETS_ROOT))} "
            "before using this provider."
        )
    return status


def _run_tesseract(file_bytes: bytes) -> list[str]:
    _require_ready("tesseract")
    import pytesseract

    page_images = _read_pdf_with_fitz(file_bytes)
    page_texts = []
    for image in page_images:
        page_texts.append(pytesseract.image_to_string(image).strip())
    return page_texts


def _get_paddle_reader():
    if "paddleocr" in _PROVIDER_CACHE:
        return _PROVIDER_CACHE["paddleocr"]

    status = _require_ready("paddleocr")
    runtime_cache_dir = str(_provider_root("paddleocr") / "runtime_cache")
    os.environ.setdefault("PADDLE_PDX_CACHE_HOME", runtime_cache_dir)
    from paddleocr import PaddleOCR

    det_model_dir = status.asset_paths["det_model_dir"]
    rec_model_dir = status.asset_paths["rec_model_dir"]
    cls_model_dir = status.asset_paths["cls_model_dir"]
    cls_dir = Path(cls_model_dir)
    cls_available = _contains_model_files(cls_dir, ("*.pdmodel", "*.json"))

    reader_kwargs = {
        "det_model_dir": det_model_dir,
        "rec_model_dir": rec_model_dir,
        "cls_model_dir": cls_model_dir,
        "lang": "en",
        "use_angle_cls": cls_available,
        "show_log": False,
    }

    _PROVIDER_CACHE["paddleocr"] = PaddleOCR(**reader_kwargs)
    return _PROVIDER_CACHE["paddleocr"]


def _run_paddleocr(file_bytes: bytes) -> list[str]:
    if not _is_module_available("numpy"):
        raise OCRProviderError(
            "The `numpy` package is required for the paddleocr OCR provider."
        )

    import numpy as np

    reader = _get_paddle_reader()
    page_images = _read_pdf_with_fitz(file_bytes)
    page_texts = []
    for image in page_images:
        result = reader.ocr(np.array(image), cls=False)
        lines: list[str] = []
        for page_result in result or []:
            if isinstance(page_result, list):
                for line in page_result:
                    if (
                        isinstance(line, (list, tuple))
                        and len(line) >= 2
                        and isinstance(line[1], (list, tuple))
                        and line[1]
                    ):
                        lines.append(str(line[1][0]).strip())
        page_texts.append("\n".join(filter(None, lines)).strip())
    return page_texts


def _get_doctr_predictor():
    if "doctr" in _PROVIDER_CACHE:
        return _PROVIDER_CACHE["doctr"]

    status = _require_ready("doctr")
    os.environ["DOCTR_CACHE_DIR"] = status.asset_paths["cache_dir"]
    os.environ.setdefault("DOCTR_MULTIPROCESSING_DISABLE", "TRUE")

    from doctr.models import ocr_predictor

    _PROVIDER_CACHE["doctr"] = ocr_predictor(pretrained=True)
    return _PROVIDER_CACHE["doctr"]


def _run_doctr(file_bytes: bytes) -> list[str]:
    if not _is_module_available("numpy"):
        raise OCRProviderError(
            "The `numpy` package is required for the doctr OCR provider."
        )

    import numpy as np

    predictor = _get_doctr_predictor()
    page_images = _read_pdf_with_fitz(file_bytes)
    page_arrays = [np.array(image.convert("RGB")) for image in page_images]
    result = predictor(page_arrays)

    page_texts = []
    for page in result.pages:
        words = []
        for block in page.blocks:
            for line in block.lines:
                line_text = " ".join(word.value for word in line.words).strip()
                if line_text:
                    words.append(line_text)
        page_texts.append("\n".join(words).strip())
    return page_texts


def _get_trocr_components():
    if "trocr" in _PROVIDER_CACHE:
        return _PROVIDER_CACHE["trocr"]

    status = _require_ready("trocr")
    from transformers import TrOCRProcessor, VisionEncoderDecoderModel

    processor = TrOCRProcessor.from_pretrained(
        status.asset_paths["processor_dir"],
        local_files_only=True,
    )
    model = VisionEncoderDecoderModel.from_pretrained(
        status.asset_paths["model_dir"],
        local_files_only=True,
    )
    model.eval()
    _PROVIDER_CACHE["trocr"] = (processor, model)
    return _PROVIDER_CACHE["trocr"]


def _run_trocr(file_bytes: bytes) -> list[str]:
    if not _is_module_available("torch"):
        raise OCRProviderError(
            "The `torch` package is required for the trocr OCR provider."
        )

    import torch

    processor, model = _get_trocr_components()
    page_images = _read_pdf_with_fitz(file_bytes)
    page_texts = []
    for image in page_images:
        pixel_values = processor(images=image.convert("RGB"), return_tensors="pt").pixel_values
        with torch.no_grad():
            generated_ids = model.generate(pixel_values)
        text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()
        page_texts.append(text)
    return page_texts


def run_ocr(file_bytes: bytes, provider: str | None = None) -> list[str]:
    provider_name = (provider or DEFAULT_OCR_PROVIDER).lower()
    providers: dict[str, Callable[[bytes], list[str]]] = {
        "tesseract": _run_tesseract,
        "paddleocr": _run_paddleocr,
        "doctr": _run_doctr,
        "trocr": _run_trocr,
    }

    if provider_name not in providers:
        supported = ", ".join(SUPPORTED_OCR_PROVIDERS)
        raise OCRProviderError(
            f"Unsupported OCR provider '{provider_name}'. Supported providers: {supported}"
        )

    return providers[provider_name](file_bytes)


def get_provider_status() -> list[dict[str, Any]]:
    statuses = []
    for provider_name in SUPPORTED_OCR_PROVIDERS:
        status = _get_status(provider_name)
        statuses.append(
            {
                "provider": status.provider,
                "ready": status.ready,
                "runtime_mode": status.runtime_mode,
                "notes": status.notes,
                "python_packages_installed": status.python_packages_installed,
                "binary_available": status.binary_available,
                "asset_paths": status.asset_paths,
                "missing_requirements": status.missing_requirements,
                "bootstrap_required": status.bootstrap_required,
            }
        )
    return statuses
