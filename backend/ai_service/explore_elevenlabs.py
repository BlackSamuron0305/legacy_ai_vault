import os
import json
from dotenv import load_dotenv
from services.communication import CommunicationService

# Load environment from root .env (two levels up from this file)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

def explore_elevenlabs():
    elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
    elevenlabs_agent_id = os.getenv("ELEVENLABS_AGENT_ID")

    if not elevenlabs_api_key:
        print("Error: ELEVENLABS_API_KEY environment variable not set.")
        return

    print(f"Using Agent ID: {elevenlabs_agent_id}")
    
    communication_service = CommunicationService(elevenlabs_api_key, elevenlabs_agent_id)

    print("\n--- Fetching Voices ---")
    try:
        voices = communication_service.get_voices()
        print(f"Found {len(voices)} voices.")
        for i, voice in enumerate(voices[:5]): # Print first 5
            print(f"{i+1}. {voice.get('name')} (ID: {voice.get('voice_id')}) - {voice.get('category')}")
        if len(voices) > 5:
            print("... and more.")
    except Exception as e:
        print(f"Error fetching voices: {e}")

    print("\n--- Fetching Models ---")
    try:
        models = communication_service.get_models()
        print(f"Found {len(models)} models.")
        for i, model in enumerate(models):
            print(f"{i+1}. {model.get('name')} (ID: {model.get('model_id')}) - Description: {model.get('description')}")
    except Exception as e:
        print(f"Error fetching models: {e}")

if __name__ == "__main__":
    explore_elevenlabs()
