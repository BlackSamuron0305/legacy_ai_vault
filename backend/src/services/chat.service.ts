import { eq, asc, sql } from 'drizzle-orm';
import { db } from '../db/drizzle';
import { chatMessages } from '../db/schema';
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
 * Answer a question using RAG: embed question → vector search (pgvector SQL) → LLM answer.
 */
export async function askQuestion(question: string, workspaceId: string, sessionId?: string): Promise<ChatResponse> {
    const sid = sessionId || uuidv4();
    log('Chat question received', { question, sessionId: sid, workspaceId });

    // 1. Embed the question
    const queryEmbedding = await createEmbedding(question);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // 2. Vector search via pgvector SQL function (workspace-scoped + hybrid)
    const searchResult = await db.execute(sql`
        SELECT id, topic, content, tags, importance, expert_name, expert_department, interview_date, similarity
        FROM search_knowledge(${embeddingStr}::vector, ${workspaceId}::uuid, 0.65, 5, ${question})
    `);

    const relevantCards = searchResult as any[];

    // 3. Build context from found cards
    let answer: string;
    const sources: ChatSource[] = [];

    if (!relevantCards || relevantCards.length === 0) {
        answer = 'I don\'t have any knowledge about that topic in the vault yet. No relevant expert knowledge has been captured on this subject.';
    } else {
        const context = relevantCards
            .map((card: any) =>
                `[Source: ${card.expert_name}, Department: ${card.expert_department}]\nTopic: ${card.topic}\nImportance: ${card.importance}\n${card.content}`
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

        answer = answerText || 'Sorry, I could not generate an answer.';

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
