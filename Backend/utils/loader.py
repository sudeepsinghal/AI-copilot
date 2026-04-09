from langchain_text_splitters import RecursiveCharacterTextSplitter

def split_text(text:str):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size = 500,
        chunk_overlap = 100
    )
    documents = splitter.create_documents([text])
    return documents