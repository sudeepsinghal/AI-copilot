from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def split_text(
    extraction,
    filename: str,
    file_type: str,
    pdf_document_type: str | None = None,
):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=700,
        chunk_overlap=120,
        add_start_index=True,
    )

    base_metadata = {
        "filename": filename,
        "file_type": file_type,
    }

    # Keep each parent page's text so we can map chunk offsets → line numbers.
    page_text_by_number: dict[int, str] = {}

    if file_type == "pdf":
        base_metadata.update(
            {
                "requested_mode": extraction.requested_mode,
                "used_mode": extraction.used_mode,
                "ocr_provider": extraction.ocr_provider,
                "fallback_reason": extraction.fallback_reason,
                "pdf_document_type": pdf_document_type,
            }
        )
        base_documents = []
        for page_number, page_text in enumerate(extraction.page_texts, start=1):
            if not page_text.strip():
                continue
            page_text_by_number[page_number] = page_text
            metadata = {
                **base_metadata,
                "page_number": page_number,
            }
            base_documents.append(Document(page_content=page_text, metadata=metadata))
    else:
        # DOCX / TXT have no real pages — treat the whole document as page 1.
        page_text_by_number[1] = extraction.text
        base_documents = [
            Document(
                page_content=extraction.text,
                metadata={**base_metadata, "page_number": 1},
            )
        ]

    documents = splitter.split_documents(base_documents)
    for chunk_index, document in enumerate(documents, start=1):
        document.metadata["chunk_index"] = chunk_index
        # start_index (from add_start_index=True) is the char offset within the
        # parent page; convert it to 1-based line numbers for citation jumps.
        page_no = document.metadata.get("page_number", 1)
        parent = page_text_by_number.get(page_no, "")
        start = document.metadata.get("start_index") or 0
        end = start + len(document.page_content)
        document.metadata["line_start"] = parent.count("\n", 0, start) + 1
        document.metadata["line_end"] = parent.count("\n", 0, end) + 1
    return documents
