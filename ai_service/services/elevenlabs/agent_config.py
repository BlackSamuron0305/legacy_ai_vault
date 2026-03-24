from typing import Optional, Dict, Any
from . import prompts
from . import config


def _dynamic_variable_placeholders() -> Dict[str, Any]:
    placeholders: Dict[str, Any] = {}
    for item in prompts.DEFAULT_VARIABLES:
        name = item.get("name")
        value = item.get("value")
        if name:
            placeholders[name] = value
    return placeholders

def build_agent_config(
    voice_id: str = config.DEFAULT_VOICE_ID,
    model_id: str = config.DEFAULT_MODEL_ID,
    name: str = config.AGENT_NAME,
    description: str = config.AGENT_DESCRIPTION,
) -> Dict[str, Any]:
    """
    Constructs a documented ElevenLabs /v1/convai/agents/create payload.
    The structure intentionally mirrors the API schema fields:
    - conversation_config.agent.first_message
    - conversation_config.agent.prompt.prompt
    - conversation_config.agent.dynamic_variables.dynamic_variable_placeholders
    - conversation_config.tts.model_id / voice_id
    - platform_settings.privacy
    """
    dynamic_placeholders = _dynamic_variable_placeholders()

    return {
        "name": name,
        "tags": ["legacy-ai-vault", "offboarding", "knowledge-capture"],
        "conversation_config": {
            "agent": {
                "first_message": prompts.FIRST_MESSAGE,
                "language": config.LANGUAGE,
                "dynamic_variables": {
                    "dynamic_variable_placeholders": dynamic_placeholders
                },
                "prompt": {
                    "prompt": prompts.SYSTEM_PROMPT,
                    "llm": config.DEFAULT_AGENT_LLM,
                },
            },
            "tts": {
                "model_id": model_id,
                "voice_id": voice_id,
                "stability": 0.5,
                "speed": 1.0,
                "similarity_boost": 0.8,
            },
            "turn": {
                "turn_timeout": 2,
                "turn_eagerness": "eager",
            },
            "conversation": {
                "text_only": False,
                "max_duration_seconds": 3600,
                "client_events": [
                    "conversation_initiation_metadata",
                    "audio",
                    "interruption",
                    "ping",
                ],
            },
            "asr": {
                "provider": "elevenlabs",
                "user_input_audio_format": "pcm_16000",
            },
        },
        "platform_settings": {
            "privacy": {
                "record_voice": True,
                "retention_days": 30,
            },
            "conversation_config_override": {
                "agent": {
                    "first_message": True,
                    "language": True,
                    "prompt": {
                        "prompt": True,
                    },
                },
                "tts": {
                    "voice_id": True,
                    "stability": True,
                    "speed": True,
                    "similarity_boost": True,
                },
            },
        },
    }
