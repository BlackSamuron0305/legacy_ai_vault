# Managing LegacyAI Agents

This directory contains the integration layer for the **LegacyAI Interviewer** agent powered by ElevenLabs Conversational AI.

## Setup

1. **Environment Variables**:
   Ensure your `.env` file in `backend/ai_service/` has:
   ```env
   ELEVENLABS_API_KEY=your_key_here
   ```

2. **Run the Manager**:
   To create or update the agent, run the management script from the `backend/ai_service` directory:
   ```bash
   python manage_agent.py
   ```
   
   - If no agent with the name "LegacyAI Interviewer" exists, it creates one.
   - If it exists, it updates the prompt and configuration.
   - It will output the `agent_id`. Add this to your `.env`:
     ```env
     ELEVENLABS_AGENT_ID=your_new_agent_id
     ```

## Customization

- **Prompts**: Edit `services/elevenlabs/prompts.py` to change the system instructions or first message.
- **Config**: Edit `services/elevenlabs/config.py` to change the default voice or model.

## Integration

To use this in your application:

```python
from services.elevenlabs.service import ElevenLabsService

service = ElevenLabsService(api_key="...")
# Get signed URL for frontend
url = service.client.get_signed_url(agent_id="...")
```
