from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OllamaEmbeddings
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
db_path = BASE_DIR / "faiss_index"
def create_or_load_vector_store(documents=None):
    embed = OllamaEmbeddings(model='llama3')

    # if Db exists
    if os.path.exists(db_path):
        print("loading vector store")
        vector_db = FAISS.load_local(folder_path = db_path,embeddings=embed,allow_dangerous_deserialization=True)
        return vector_db
    # if no Data in DB -> return vector_db = None
    print("No existing vector store , waiting for upload...")
    return None

    # print("creating vector store")
    # vector_db = FAISS.from_documents(documents,embed)
    # vector_db.save_local(db_path)
    # return vector_db
def add_documents(vector_db , new_documents):
    vector_db.add_documents(new_documents)
    vector_db.save_local(db_path)
    print("Documents added to vector store")