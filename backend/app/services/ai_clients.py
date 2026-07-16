"""
Shared AI client factory.

Before this file existed, `ChatGoogleGenerativeAI(model="gemini-2.5-flash",
google_api_key=os.getenv("GEMINI_API_KEY"))` was constructed inline,
identically, in resume_agent.py, skill_gap_agent.py, learning_planner_agent.py,
and utils/llm.py — and the Chroma vector store + embeddings client were
constructed identically (down to variable names) in both
skill_gap_agent.py and learning_planner_agent.py, each with its own
slightly-different path arithmetic for the same chroma_db directory.

Centralizing these here means:
  - One place to change the model name, embedding model, or add
    retry/timeout config, instead of N places.
  - The vector store and embeddings client are now built once and reused
    (@lru_cache) instead of being reconstructed — and reconnected to disk —
    on every single skill-gap or learning-plan request.
"""

import os
from functools import lru_cache

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

load_dotenv()

# Single source of truth for where the vector store lives — previously
# computed with two different (if equivalent) relative-path expressions
# in skill_gap_agent.py and learning_planner_agent.py.
CHROMA_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "chroma_db")
)

DEFAULT_CHAT_MODEL = "gemini-2.5-flash"
DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001"


@lru_cache(maxsize=4)
def get_chat_llm(model: str = DEFAULT_CHAT_MODEL) -> ChatGoogleGenerativeAI:
    """Shared Gemini chat model client, reused across agents/requests."""
    return ChatGoogleGenerativeAI(
        model=model,
        google_api_key=os.getenv("GEMINI_API_KEY"),
    )


@lru_cache(maxsize=1)
def get_embeddings(model: str = DEFAULT_EMBEDDING_MODEL) -> GoogleGenerativeAIEmbeddings:
    return GoogleGenerativeAIEmbeddings(
        model=model,
        google_api_key=os.getenv("GEMINI_API_KEY"),
    )


@lru_cache(maxsize=1)
def get_vector_store() -> Chroma:
    """Shared Chroma vector store handle for the RAG-backed agents."""
    return Chroma(
        persist_directory=CHROMA_DIR,
        embedding_function=get_embeddings(),
    )


def retrieve_context(query: str, k: int = 3) -> str:
    """
    Run a similarity search against the shared knowledge base and return
    the matched chunks joined into one string, ready to drop into a prompt.
    """
    docs = get_vector_store().similarity_search(query, k=k)
    return "\n\n".join(doc.page_content for doc in docs)
