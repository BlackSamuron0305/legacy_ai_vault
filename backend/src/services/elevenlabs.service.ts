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
 * Fetch the most recent conversation ID for a given agent from ElevenLabs API.
 * Used when the embed widget handles the conversation and the frontend
 * doesn't have access to the conversation ID.
 */
export async function getLatestConversationId(agentId: string): Promise<string | null> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        throw new Error('Missing ELEVENLABS_API_KEY');
    }

    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${encodeURIComponent(agentId)}`,
            {
                headers: { 'xi-api-key': apiKey },
            }
        );

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
        }

        const data: any = await response.json();
        const conversations = data.conversations;

        if (!Array.isArray(conversations) || conversations.length === 0) {
            log('No conversations found for agent', { agentId });
            return null;
        }

        return conversations[0].conversation_id;
    } catch (error) {
        logError('Failed to fetch latest conversation', error);
        throw error;
    }
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
