from typing import Optional, Dict, Any
from . import prompts
from . import config

def build_agent_config(
    voice_id: str = config.DEFAULT_VOICE_ID,
    model_id: str = config.DEFAULT_MODEL_ID,
    name: str = config.AGENT_NAME,
    description: str = config.AGENT_DESCRIPTION
) -> Dict[str, Any]:
    """
    Constructs the JSON payload for creating/updating the agent.
    """
    return {
        "name": name,
        "description": description,
        "conversation_config": {
            "first_message": prompts.FIRST_MESSAGE,
            "language": {
                "name": "en",  # Ensure this matches ElevenLabs language codes
                "code": "en"
            },
            "system_prompt": prompts.SYSTEM_PROMPT,
            # Voice settings are part of the 'voice' block in some contexts 
            # or separate in others. For ConvAI, it's typically 'voice_id'.
            # Based on current API:
            "voice_settings": {
                # Add specific voice settings if needed (stability, etc.)
            },
            # Variables for dynamic injection
            # Note: Ensure the API supports passing definitions if required.
            # Typically these are handled at runtime or via placeholders.
            # Assuming 'dynamic_variables' might be a feature in advanced setup,
            # or just implicit in prompt.
        },
        "voice_id": voice_id,
        "model_id": model_id,
        # Potentially privacy settings, recording settings etc.
        "privacy": {
            "record_voice": True, # We need transcripts!
            "retention_days": 30 
        }
    }
