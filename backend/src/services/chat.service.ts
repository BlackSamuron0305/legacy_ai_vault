import { eq, asc } from 'drizzle-orm';
import { db } from '../db/drizzle';
import { chatMessages } from '../db/schema';
import { supabase } from '../db/supabase';
import { buildChatbotPrompt } from '../prompts/chatbot';
import { createEmbedding } from './embedding.service';
import { log, logError } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { createHfChatCompletion } from './hf.service';

interface ChatSource {
    id: string;
    topic: string;
    expert_name: string;
    similarity: number;
}

interface ChatResponse {
    answer: string;
    sources: ChatSource[];
    session_id: string;
}

/**
 * Answer a question using RAG: embed question → vector search (Supabase RPC) → LLM answer.
 * Vector search uses Supabase JS client (pgvector RPC).
 * Chat history uses Drizzle.
 */
export async function askQuestion(question: string, sessionId?: string): Promise<ChatResponse> {
    const sid = sessionId || uuidv4();
    log('Chat question received', { question, sessionId: sid });

    // 1. Embed the question
    const queryEmbedding = await createEmbedding(question);

    // 2. Vector search via Supabase RPC (pgvector)
    const { data: relevantCards, error: searchError } = await supabase.rpc('search_knowledge', {
        query_embedding: queryEmbedding,
        match_threshold: 0.65,
        match_count: 5,
    });

    if (searchError) {
        logError('Vector search failed', searchError);
        throw new Error('Knowledge search failed');
    }

    // 3. Build context from found cards
    let answer: string;
    const sources: ChatSource[] = [];

    if (!relevantCards || relevantCards.length === 0) {
        answer = 'Dazu habe ich leider kein Wissen im Vault. Es wurde noch kein passendes Expertenwissen zu diesem Thema gesammelt.';
    } else {
        const context = relevantCards
            .map((card: any) =>
                `[Quelle: ${card.expert_name}, Abteilung: ${card.expert_department}]\nThema: ${card.topic}\nWichtigkeit: ${card.importance}\n${card.content}`
            )
            .join('\n\n---\n\n');

        const prompt = buildChatbotPrompt(context);

        // 4. LLM generates answer with context
        const answerText = await createHfChatCompletion({
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: question },
            ],
            temperature: 0.4,
            maxTokens: 1200,
        });

        answer = answerText || 'Entschuldigung, ich konnte keine Antwort generieren.';

        for (const card of relevantCards) {
            sources.push({
                id: card.id,
                topic: card.topic,
                expert_name: card.expert_name,
                similarity: card.similarity,
            });
        }
    }

    // 5. Save chat messages via Drizzle
    const sourceIds = sources.map(s => s.id);
    await db.insert(chatMessages).values([
        { sessionId: sid, role: 'user', content: question },
        { sessionId: sid, role: 'assistant', content: answer, sources: sourceIds },
    ]);

    log('Chat answer generated', { sessionId: sid, sourceCount: sources.length });

    return { answer, sources, session_id: sid };
}

/**
 * Get chat history for a session via Drizzle.
 */
export async function getChatHistory(sessionId: string) {
    return db.select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(asc(chatMessages.createdAt));
}
