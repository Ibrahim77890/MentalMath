# main.py
import os
import logging
import uvicorn

from api import app  # Import the FastAPI app from api.py

TIMEOUT = int(os.getenv("LLAMA_TIMEOUT", 600))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        timeout_keep_alive=TIMEOUT,
    )
