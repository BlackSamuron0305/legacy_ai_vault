import { eq } from 'drizzle-orm';
import { db } from '../db/drizzle';
import { sessions, knowledgeCards, employees, transcriptSegments, activities } from '../db/schema';
import { EXTRACTOR_PROMPT } from '../prompts/extractor';
import { createEmbedding } from './embedding.service';
import { log, logError } from '../utils/logger';
import { createHfChatCompletion } from './hf.service';

interface ExtractedCard {
    topic: string;
    content: string;
    category: string;
    tags: string[];
    importance: 'low' | 'normal' | 'high' | 'critical';
    confidence: number;
}

/**
 * Extract knowledge cards from a session transcript using LLM,
 * generate embeddings, and store everything via Drizzle.
 */
export async function extractKnowledge(sessionId: string, employeeId: string | null, transcript: string): Promise<void> {
    log('Starting knowledge extraction', { sessionId });

    try {
        // 1. LLM: Extract knowledge cards from transcript
        const responseText = await createHfChatCompletion({
            messages: [
                { role: 'system', content: EXTRACTOR_PROMPT },
                { role: 'user', content: `Transkript:\n\n${transcript}` },
            ],
            responseFormat: { type: 'json_object' },
            temperature: 0.3,
            maxTokens: 2000,
        });

        if (!responseText) throw new Error('Empty LLM response');

        const parsed = JSON.parse(responseText);
        const cards: ExtractedCard[] = parsed.cards || [];

        log(`Extracted ${cards.length} knowledge cards`, { sessionId });

        // 2. Parse transcript into segments
        const lines = transcript.split('\n').filter(l => l.trim());
        let segmentIndex = 0;
        for (const line of lines) {
            const match = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*(AI|Employee):\s*(.+)/i);
            if (match) {
                await db.insert(transcriptSegments).values({
                    sessionId,
                    timestamp: match[1],
                    speaker: match[2].toLowerCase() === 'ai' ? 'ai' : 'employee',
                    text: match[3],
                    orderIndex: segmentIndex++,
                });
            }
        }

        // 3. Generate embeddings and store each card
        for (const card of cards) {
            const embeddingText = `${card.topic}: ${card.content}`;
            let embedding: number[] | undefined;
            try {
                embedding = await createEmbedding(embeddingText);
            } catch {
                log('Embedding generation failed, storing card without embedding');
            }

            await db.insert(knowledgeCards).values({
                sessionId,
                employeeId: employeeId || undefined,
                topic: card.topic,
                content: card.content,
                category: card.category || 'Uncategorized',
                tags: card.tags,
                importance: card.importance,
                confidence: card.confidence || 0.9,
                embedding,
                source: 'interview',
            });
        }

        // 4. Update session (preserve existing summary/report — never overwrite it here)
        await db.update(sessions)
            .set({
                topicsExtracted: cards.length,
                lastActivity: new Date(),
            })
            .where(eq(sessions.id, sessionId));

        // 6. Update employee (if assigned)
        if (employeeId) {
            await db.update(employees)
                .set({
                    sessionStatus: 'completed',
                    transcriptStatus: 'generated',
                    coverageScore: Math.min(100, cards.length * 6),
                })
                .where(eq(employees.id, employeeId));
        }

        // 7. Get workspace for activity
        const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
        const emp = employeeId
            ? (await db.select().from(employees).where(eq(employees.id, employeeId)))[0]
            : null;
        if (session?.workspaceId) {
            await db.insert(activities).values({
                workspaceId: session.workspaceId,
                type: 'session_completed',
                message: `Knowledge capture session completed for ${emp?.name || 'Employee'}`,
            });
        }

        log('Knowledge extraction completed', { sessionId, cardCount: cards.length });
    } catch (error) {
        await db.update(sessions)
            .set({ status: 'awaiting_review' })
            .where(eq(sessions.id, sessionId));
        logError('Knowledge extraction failed', error);
    }
}
