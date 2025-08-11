import os
import logging
from llm_service import LlamaCppService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

LLAMA_SERVER_URL = os.getenv("LLAMA_SERVER_URL", "http://127.0.0.1:8080")
TIMEOUT = int(os.getenv("LLAMA_TIMEOUT", 600))

try:
    llm_service = LlamaCppService(
        api_url=LLAMA_SERVER_URL,
        timeout=TIMEOUT,
    )
    llm_initialized = True
    logger.info("LlamaCppService initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize LlamaCppService: {e}")
    llm_service = None
    llm_initialized = False