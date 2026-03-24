from typing import Any, Optional
import os
import logging
from .client import ElevenLabsClient

logger = logging.getLogger(__name__)


class ElevenLabsService:
    def __init__(self, api_key: str):
        self.client = ElevenLabsClient(api_key=api_key)
        self._agent_id: Optional[str] = None

    def get_agent_id(self) -> str:
        """Return the pre-deployed agent ID from ELEVENLABS_AGENT_ID env var."""
        if self._agent_id:
            return self._agent_id

        agent_id = os.getenv("ELEVENLABS_AGENT_ID")
        if not agent_id:
            raise ValueError(
                "ELEVENLABS_AGENT_ID env var is required. "
                "Set it to the ID of your deployed ElevenLabs agent."
            )

        self.client.get_agent(agent_id)
        self._agent_id = agent_id
        logger.info("Using ELEVENLABS_AGENT_ID=%s", agent_id)
        return self._agent_id

    def get_signed_url(self) -> str:
        """Get a signed URL for the configured agent."""
        agent_id = self.get_agent_id()
        return self.client.get_signed_url(agent_id)

    def get_transcript(self, conversation_id: str) -> Any:
        return self.client.get_transcript(conversation_id)
