import os
from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma



load_dotenv()
BASE_DIR = os.path.dirname(__file__)
KNOWLEDGE_DIR = os.path.join(BASE_DIR, "knowledge")
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")



def build_vector_store():
    all_docs = []

    
    for filename in os.listdir(KNOWLEDGE_DIR):
        if filename.endswith(".txt"):
            file_path = os.path.join(KNOWLEDGE_DIR, filename)

            loader = TextLoader(file_path, encoding="utf-8")
            docs = loader.load()

            role_name = filename.replace(".txt", "")
            for doc in docs:
                doc.metadata["role"] = role_name
                doc.metadata["source"] = filename

            all_docs.extend(docs)

    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_documents(all_docs)

    
    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=os.getenv("GEMINI_API_KEY")
    )

    
    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_DIR
    )

    print(f"Stored {len(chunks)} chunks in ChromaDB at '{CHROMA_DIR}'")

if __name__ == "__main__":
    build_vector_store()