# llm_service.py
import requests
import logging
from typing import List, Optional, Dict, Any, Union

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LlamaCppService:
    """
    A client for llama.cpp server API.
    Connects to a running llama-server instance via HTTP.
    """
    def __init__(
        self,
        api_url: str = "http://127.0.0.1:8080",
        timeout: int = 600,
    ):
        self.api_url = api_url.rstrip('/')
        self.completion_endpoint = f"{self.api_url}/completion"
        self.timeout = timeout
        
        # Verify server is available
        try:
            self._check_server_connection()
            logger.info(f"Connected to llama.cpp server at {self.api_url}")
        except Exception as e:
            logger.error(f"Failed to connect to llama.cpp server: {e}")
            raise ConnectionError(f"Cannot connect to llama.cpp server at {self.api_url}: {str(e)}")

    def _check_server_connection(self) -> None:
        """Verify the server is reachable"""
        try:
            # Most llama.cpp servers have a root endpoint that returns info
            response = requests.get(self.api_url, timeout=5)
            response.raise_for_status()
        except requests.RequestException as e:
            raise ConnectionError(f"Server connection check failed: {str(e)}")

    def generate(
        self, 
        prompt: str, 
        n_predict: int = 512,
        temperature: float = 0.7,
        stop: Optional[List[str]] = None,
        **kwargs
    ) -> str:
        """
        Send a completion request to the llama.cpp server.
        
        Args:
            prompt: The text prompt to generate from
            n_predict: Maximum number of tokens to predict
            temperature: Sampling temperature (higher = more random)
            stop: List of strings that will stop generation when encountered
            **kwargs: Additional parameters to pass to the API
            
        Returns:
            The generated text response
        """
        if stop is None:
            stop = ["</s>"]
            
        payload = {
            "prompt": prompt,
            "n_predict": n_predict,
            "temperature": temperature,
            "stop": stop,
            **kwargs
        }
        
        logger.info(f"Sending completion request: {prompt[:50]}...")
        
        try:
            response = requests.post(
                self.completion_endpoint,
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
            result = response.json()
            
            # Extract the generated content from the response
            # The exact structure depends on the llama.cpp server version
            if "content" in result:
                return result["content"]
            elif "completion" in result:
                return result["completion"]
            elif "text" in result:
                return result["text"]
            else:
                logger.warning(f"Unexpected response format: {result}")
                return str(result)
                
        except requests.RequestException as e:
            logger.error(f"Request to llama.cpp server failed: {e}")
            raise RuntimeError(f"Failed to generate completion: {str(e)}")