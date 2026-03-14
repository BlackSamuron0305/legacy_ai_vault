from typing import Any, Dict
import os
import logging
from .client import ElevenLabsClient
from .agent_config import build_agent_config

logger = logging.getLogger(__name__)

class ElevenLabsService:
    def __init__(self, api_key: str):
        self.client = ElevenLabsClient(api_key=api_key)
        self._agent_id = None

    def get_agent_id(self, agent_name: str = "LegacyAI Interviewer") -> str:
        """
        Lazily fetch the agent ID for the specified name.
        """
        if self._agent_id:
            return self._agent_id

        # 1) Prefer explicit env-configured agent id and validate it.
        configured_agent_id = os.getenv("ELEVENLABS_AGENT_ID")
        if configured_agent_id:
            try:
                _ = self.client.get_agent(configured_agent_id)
                self._agent_id = configured_agent_id
                logger.info("Using configured ELEVENLABS_AGENT_ID=%s", configured_agent_id)
                return self._agent_id
            except Exception as exc:
                logger.warning(
                    "Configured ELEVENLABS_AGENT_ID could not be validated: %s. Falling back to name lookup.",
                    exc,
                )
            
        agent = self.get_or_create_agent(agent_name)
        if agent:
            self._agent_id = agent.get("agent_id")

        logger.info("Resolved agent_id=%s for agent_name=%s", self._agent_id, agent_name)
        return self._agent_id

    def get_signed_url(self) -> str:
        """
        Get a signed URL for the configured agent.
        """
        agent_id = self.get_agent_id()
        if not agent_id:
            raise ValueError("Could not determine agent ID.")
        return self.client.get_signed_url(agent_id)

    def get_transcript(self, conversation_id: str) -> Any:
        return self.client.get_transcript(conversation_id)

    def get_or_create_agent(self, agent_name: str = "LegacyAI Interviewer"):
        """
        Check if an agent with the given name exists.
        If yes, return it.
        If no, create it.
        Returns the agent object/dict.
        """
        agents = self.client.get_agents()
        normalized_target = (agent_name or "").strip().lower()

        for agent in agents:
            candidate_name = (agent.get("name") or "").strip().lower()
            if candidate_name == normalized_target and agent.get("agent_id"):
                logger.info("Reusing existing ElevenLabs agent name=%s agent_id=%s", agent.get("name"), agent.get("agent_id"))
                return agent
        
        # Create new agent
        logger.info("No existing ElevenLabs agent found for name=%s. Creating new agent.", agent_name)
        config = build_agent_config(name=agent_name)
        new_agent_id = self.client.create_agent(config)
        logger.info("Created new ElevenLabs agent name=%s agent_id=%s", agent_name, new_agent_id)
        return {"agent_id": new_agent_id, "name": agent_name}

    def create_agent(self, config_overrides: Dict[str, Any] = None):
        """Create a fresh agent."""
        config = build_agent_config()
        if config_overrides:
            config.update(config_overrides)
        return self.client.create_agent(config)

    def update_legacy_agent(self, agent_id: str, new_prompt: str = None):
        """Update the specific LegacyAI agent."""
        # This is a simplified update logic. 
        # In production, merging prompts and configs is complex.
        current_config = self.client.get_agent(agent_id)
        
        # Update logic here to merge new prompt
        pass
