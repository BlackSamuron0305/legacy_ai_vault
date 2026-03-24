import os
import time
import requests
import logging
from typing import Dict, Any, List

from . import config

# Note: Ensure .prompts import if needed, but not used here directly yet.

# Setup logger
logger = logging.getLogger(__name__)

class ElevenLabsClient:
    """
    Client for interacting with ElevenLabs Conversational AI API.
    """
    
    def __init__(self, api_key: str = None):
        """
        Initialize the client with an API key. 
        Defaults to ELEVENLABS_API_KEY env var.
        """
        self.api_key = api_key or os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError("ElevenLabs API Key is required. Set ELEVENLABS_API_KEY env var.")
            
        self.headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        self.base_url = config.API_BASE_URL
        self.api_v1_url = config.API_V1_URL

    def get_agents(self) -> List[Dict[str, Any]]:
        """Fetch all agents."""
        # Note: Endpoint is notably /v1/convai/agents
        url = f"{self.base_url}/agents" 
        try:
            response = requests.get(url, headers=self.headers)
            # Handle empty list or 404 if no agents exist depending on API behavior
            if response.status_code == 404:
                return []
            response.raise_for_status()
            return response.json().get("agents", [])
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch agents: {e}")
            raise

    def get_agent(self, agent_id: str) -> Dict[str, Any]:
        """Fetch a specific agent configuration."""
        url = f"{self.base_url}/agents/{agent_id}"
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch agent {agent_id}: {e}")
            raise

    def create_agent(self, payload: Dict[str, Any]) -> str:
        """Create a new agent."""
        url = f"{self.base_url}/agents/create"
        try:
            logger.debug("create_agent payload: %s", payload)
            response = requests.post(url, headers=self.headers, json=payload)
            if not response.ok:
                logger.error("Agent create failed status=%s body=%s", response.status_code, response.text)
            response.raise_for_status()
            return response.json().get("agent_id")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create agent: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response body: {e.response.text}")
            raise

    def update_agent(self, agent_id: str, payload: Dict[str, Any]) -> str:
        """Update an existing agent."""
        url = f"{self.base_url}/agents/{agent_id}"
        try:
            # PATCH is typically used for updates
            response = requests.patch(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json().get("agent_id")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to update agent: {e}")
            if e.response:
                logger.error(f"Response: {e.response.text}")
            raise

    def get_signed_url(self, agent_id: str) -> str:
        """Get a signed URL for client-side connection."""
        url = f"{self.base_url}/conversation/get_signed_url?agent_id={agent_id}"
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json().get("signed_url")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get signed URL: {e}")
            raise

    def get_conversations_for_agent(self, agent_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent conversations for a specific agent."""
        url = f"{self.base_url}/conversations?agent_id={agent_id}&page_size={limit}"
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            return data.get("conversations", [])
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get conversations for agent {agent_id}: {e}")
            raise

    def get_transcript(self, conversation_id: str, max_retries: int = 8, initial_delay: float = 3.0) -> List[Dict[str, Any]]:
        """Retrieve transcript for a conversation, retrying until ElevenLabs finishes processing."""
        url = f"{self.base_url}/conversations/{conversation_id}"
        delay = initial_delay

        for attempt in range(1, max_retries + 1):
            try:
                response = requests.get(url, headers=self.headers)
                response.raise_for_status()
                data = response.json()

                status = data.get("status", "unknown")
                transcript = data.get("transcript", [])

                if transcript and len(transcript) > 0:
                    logger.info(
                        "Got transcript for %s on attempt %d (status=%s, turns=%d)",
                        conversation_id, attempt, status, len(transcript),
                    )
                    return transcript

                if status in ("done", "failed"):
                    logger.warning(
                        "Conversation %s status=%s but transcript empty (attempt %d)",
                        conversation_id, status, attempt,
                    )
                    return transcript

                logger.info(
                    "Conversation %s not ready yet (status=%s, turns=%d). "
                    "Retrying in %.1fs (attempt %d/%d)",
                    conversation_id, status, len(transcript), delay, attempt, max_retries,
                )
                time.sleep(delay)
                delay = min(delay * 1.5, 15.0)

            except requests.exceptions.RequestException as e:
                logger.error("Failed to get transcript %s (attempt %d): %s", conversation_id, attempt, e)
                if attempt == max_retries:
                    raise
                time.sleep(delay)
                delay = min(delay * 1.5, 15.0)

        logger.warning("Exhausted retries for transcript %s, returning empty", conversation_id)
        return []

    def get_voices(self) -> List[Dict[str, Any]]:
        """Get all available voices."""
        url = f"{self.api_v1_url}/voices"
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json().get("voices", [])
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch voices: {e}")
            raise

    def get_models(self) -> List[Dict[str, Any]]:
        """Get all available models."""
        url = f"{self.api_v1_url}/models"
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch models: {e}")
            raise


