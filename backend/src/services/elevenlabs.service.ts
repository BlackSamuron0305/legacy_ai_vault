import { buildInterviewerPrompt, buildFirstMessage } from '../prompts/interviewer';
import { log, logError } from '../utils/logger';

interface AgentConfig {
    agent_id: string;
    system_prompt: string;
    first_message: string;
}

/**
 * Build ElevenLabs Conversational AI agent config for an interview session.
 * The actual Voice-to-Voice happens client-side via the ElevenLabs SDK.
 * This service provides the configuration needed by the frontend.
 */
export function buildAgentConfig(name: string, specialization: string): AgentConfig {
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    if (!agentId) {
        throw new Error('Missing ELEVENLABS_AGENT_ID in environment variables');
    }

    log('Building ElevenLabs agent config', { name, specialization });

    return {
        agent_id: agentId,
        system_prompt: buildInterviewerPrompt(name, specialization),
        first_message: buildFirstMessage(name, specialization),
    };
}

/**
 * Fetch conversation transcript from ElevenLabs API after interview ends.
 */
export async function getConversationTranscript(conversationId: string): Promise<string> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        throw new Error('Missing ELEVENLABS_API_KEY');
    }

    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversations/${encodeURIComponent(conversationId)}`,
            {
                headers: {
                    'xi-api-key': apiKey,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
        }

        const data: any = await response.json();

        // Extract transcript from conversation turns
        if (data.transcript && Array.isArray(data.transcript)) {
            return data.transcript
                .map((turn: { role: string; message: string }) => `${turn.role}: ${turn.message}`)
                .join('\n');
        }

        return data.transcript || '';
    } catch (error) {
        logError('Failed to fetch conversation transcript', error);
        throw error;
    }
}
