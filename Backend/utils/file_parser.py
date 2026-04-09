from docx import Document
from pypdf import PdfReader
from io import BytesIO

def read_txt(file_bytes):
    return file_bytes.decode('utf-8')

def read_docx(file_bytes):
    doc = Document(BytesIO(file_bytes))
    return "\n".join([para.text for para in doc.paragraphs])

def read_pdf(file_bytes):
    reader = PdfReader(BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        text+= page.extract_text() or ""
    return text

def parse_file(filename,file_bytes):
    if filename.endswith(".txt"):
        return read_txt(file_bytes)
    elif filename.endswith(".docx"):
        return read_docx(file_bytes)
    elif filename.endswith(".pdf"):
        return read_pdf(file_bytes)
    else:
        raise ValueError("Invalid file type (current support: txt, docx, pdf)")
