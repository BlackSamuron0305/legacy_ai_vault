from typing import Any, Dict
import os
import logging
import threading
from contextlib import contextmanager
from .client import ElevenLabsClient
from .agent_config import build_agent_config

logger = logging.getLogger(__name__)

class ElevenLabsService:
    def __init__(self, api_key: str):
        self.client = ElevenLabsClient(api_key=api_key)
        self._agent_id = None
        self._agent_lock = threading.Lock()

    @contextmanager
    def _agent_creation_lock(self):
        self._agent_lock.acquire()
        try:
            yield
        finally:
            self._agent_lock.release()

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
            
        force_create = os.getenv("ELEVENLABS_FORCE_CREATE_AGENT", "false").lower() == "true"
        if force_create:
            logger.info("ELEVENLABS_FORCE_CREATE_AGENT=true; creating a fresh programmatic agent")
            agent = self.create_programmatic_agent(agent_name)
        else:
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
            raise ValueError("Could not determine agent ID for signed URL generation.")
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
        with self._agent_creation_lock():
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

    def create_programmatic_agent(self, agent_name: str = "LegacyAI Interviewer") -> Dict[str, Any]:
        """
        Create a fresh agent from code (blank-template style payload) with our prompt/first message.
        """
        config = build_agent_config(name=agent_name)
        new_agent_id = self._create_agent_with_fallback(config)
        logger.info("Programmatically created fresh ElevenLabs agent name=%s agent_id=%s", agent_name, new_agent_id)
        return {"agent_id": new_agent_id, "name": agent_name}

    def _strip_dynamic_variables(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        payload = dict(payload)
        conversation_config = dict(payload.get("conversation_config") or {})

        # Legacy location fallback.
        if "dynamic_variables" in conversation_config:
            conversation_config.pop("dynamic_variables", None)

        # Documented location in conversation_config.agent.dynamic_variables.
        agent_cfg = dict(conversation_config.get("agent") or {})
        if "dynamic_variables" in agent_cfg:
            agent_cfg.pop("dynamic_variables", None)
        if agent_cfg:
            conversation_config["agent"] = agent_cfg

        payload["conversation_config"] = conversation_config
        return payload

    def _create_agent_with_fallback(self, payload: Dict[str, Any]) -> str:
        try:
            return self.client.create_agent(payload)
        except Exception as exc:
            logger.warning("Agent create with dynamic variables failed; retrying without dynamic_variables. error=%s", exc)
            fallback = self._strip_dynamic_variables(payload)
            return self.client.create_agent(fallback)

    def _update_agent_with_fallback(self, agent_id: str, payload: Dict[str, Any]) -> str:
        try:
            return self.client.update_agent(agent_id, payload)
        except Exception as exc:
            logger.warning("Agent update with dynamic variables failed; retrying without dynamic_variables. error=%s", exc)
            fallback = self._strip_dynamic_variables(payload)
            return self.client.update_agent(agent_id, fallback)

    def create_agent(self, config_overrides: Dict[str, Any] = None):
        """Create a fresh agent."""
        config = build_agent_config()
        if config_overrides:
            config.update(config_overrides)
        return self._create_agent_with_fallback(config)

    def update_legacy_agent(self, agent_id: str, new_prompt: str = None):
        """Update the specific LegacyAI agent."""
        # This is a simplified update logic. 
        # In production, merging prompts and configs is complex.
        current_config = self.client.get_agent(agent_id)
        
        # Update logic here to merge new prompt
        pass
