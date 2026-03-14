import os
import sys

# Ensure backend/ai_service is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.elevenlabs.client import ElevenLabsClient
from services.elevenlabs.prompts import SYSTEM_PROMPT, FIRST_MESSAGE
from services.elevenlabs import config

def create_or_update_agent():
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        print("Error: ELEVENLABS_API_KEY environment variable is missing.")
        return

    client = ElevenLabsClient(api_key)
    
    print(f"Connecting to ElevenLabs API as agent: {config.AGENT_NAME}...")

    # Fetch existing agents
    agents = client.get_agents()
    existing_agent = None
    
    for agent in agents:
        if agent.get("name") == config.AGENT_NAME:
            existing_agent = agent
            break
    
    # Construct the payload
    # Note: API structure for 'create_agent' v1/convai/agents/create might differ slightly from get
    # We construct based on known documentation patterns for ConvAI
    agent_payload = {
        "name": config.AGENT_NAME,
        "description": config.AGENT_DESCRIPTION,
        "conversation_config": {
            "first_message": FIRST_MESSAGE,
            "system_prompt": SYSTEM_PROMPT,
        },
        "platform_settings": {
            "voice": {
                "voice_id": config.DEFAULT_VOICE_ID
            },
            "model_id": config.DEFAULT_MODEL_ID,
            "privacy": {
                "record_voice": True,
                "retention_days": 30
            }
        }
    }

    if existing_agent:
        agent_id = existing_agent["agent_id"]
        print(f"Found existing agent: {agent_id}. Updating...")
        try:
            # For updates, we might need to adjust payload structure if API uses PATCH on specific fields
            # Assuming full replacement or merge for now
            client.update_agent(agent_id, agent_payload)
            print(f"Successfully updated agent: {agent_id}")
        except Exception as e:
            print(f"Failed to update agent: {e}")
    else:
        print("No existing agent found. Creating new...")
        try:
            new_agent_id = client.create_agent(agent_payload)
            print(f"Successfully created new agent: {new_agent_id}")
            print(f"IMPORTANT: Add this ID to your .env file as ELEVENLABS_AGENT_ID={new_agent_id}")
        except Exception as e:
            print(f"Failed to create agent: {e}")

if __name__ == "__main__":
    create_or_update_agent()
