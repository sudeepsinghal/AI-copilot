import fastapi as fast
from httpx import stream
from langchain_community.embeddings import OllamaEmbeddings
from pydantic import BaseModel,Field
import requests
import json
from Backend.utils.loader import split_text
from Backend.utils.vector_store import add_documents, create_or_load_vector_store, db_path
from Backend.utils.retriever import get_retriever
from Backend.utils.llm import get_llm
from Backend.utils.rag_chain import build_rag_chain
from Backend.utils.file_parser import parse_file
from fastapi import UploadFile , File
from langchain_community.vectorstores import FAISS

app = fast.FastAPI()

class QueryFormat(BaseModel):
    query:str = Field(strict=True)

# initialise db
vector_db= create_or_load_vector_store()
# initialise retriever + llm if DB exists
retriever = None
rag_chain = None

if vector_db is not None:
    retriever = get_retriever(vector_db)
    llm = get_llm()
    rag_chain = build_rag_chain(llm,retriever)
@app.post('/ask')
def ask(request: QueryFormat):
    global rag_chain,retriever,vector_db
    if vector_db is None:
        return {"error":"No vector stored yet"}
    if retriever is None:
        retriever = get_retriever(vector_db)
    if rag_chain is None:
        llm = get_llm()
        rag_chain = build_rag_chain(llm,retriever)
    result = rag_chain.invoke({"input": request.query})

    return {
        "answer": result["answer"],
        "sources": [doc.page_content for doc in result["context"]]
    }




@app.post('/upload')
async def upload_file(file:UploadFile = File(...)):
    global vector_db , rag_chain , retriever

# reading file
    content = await file.read()
# Extract text based on the file type
    try:
        text = parse_file(file.filename,content)
    except Exception as e:
        return {"error":str(e)}
# validate extracted text
    if not text or text.strip() == "":
        return {"error":"No readable text provided"}
# convert text to documents(chunking)
    documents = split_text(text)

    if vector_db is None:
        print("creating vector store")
        embeddings = OllamaEmbeddings(model='llama3')
        vector_db = FAISS.from_documents(documents,embeddings)
        vector_db.save_local(db_path)

    else:
        print("adding to existing vector store")
        add_documents(vector_db,documents)
        retriever = get_retriever(vector_db)
        llm = get_llm()
        rag_chain = build_rag_chain(llm,retriever)
    return {
        "message" : "Document processed successfully",
        "chunks_added": len(documents)
    }




