from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains import create_retrieval_chain
from langchain_core.prompts import ChatPromptTemplate

def build_rag_chain(llm,retriever):
    # define prompt
    prompt = ChatPromptTemplate.from_template("""
    Answer the question based ONLY on the context below.
    
    CONTEXT:
    {context}
    
    QUESTION:
    {input}
    """)
    # combine documents+LLM
    document_chain = create_stuff_documents_chain(llm,prompt)

    # create full RAG pipeline
    retrieval_chain = create_retrieval_chain(retriever,document_chain)
    return retrieval_chain