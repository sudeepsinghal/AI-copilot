# AI Document Copilot (RAG-based QA System)

An AI-powered backend system that allows users to upload documents and query them using natural language.

## 🚀 Features

- Upload PDF / DOCX / TXT files
- Extract and process document text
- Chunk + embed using LangChain
- Store embeddings in FAISS (persistent)
- Query documents using LLM (Ollama)
- Retrieval-Augmented Generation (RAG)
- Multi-document support

## 🧠 Tech Stack

- FastAPI
- LangChain
- FAISS
- Ollama (LLM)
- Python

## ⚙️ How it works

1. Upload document → parsed into text
2. Text split into chunks
3. Chunks converted into embeddings
4. Stored in FAISS vector DB
5. Query → retrieves relevant chunks
6. LLM generates answer using context

## ▶️ Run locally

```bash
# create venv
python3 -m venv venv
source venv/bin/activate

# install dependencies
pip install -r requirements.txt

# run server
uvicorn Backend.main:app --reload