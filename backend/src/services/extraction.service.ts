import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/drizzle';
import { EXTRACTOR_PROMPT } from '../prompts/extractor';
import { createEmbedding } from './embedding.service';
import { log, logError } from '../utils/logger';

const openai = new OpenAI();

interface ExtractedCard {
    topic: string;
    content: string;
    tags: string[];
    importance: 'low' | 'normal' | 'high' | 'critical';
}

/**
 * Extract knowledge cards from an interview transcript using LLM,
 * generate embeddings, and store everything via Drizzle.
 */
export async function extractKnowledge(interviewId: string): Promise<ExtractedCard[]> {
    log('Starting knowledge extraction', { interviewId });

    // 1. Fetch interview
    const [interview] = await db.select()
        .from(schema.interviews)
        .where(eq(schema.interviews.id, interviewId))
        .limit(1);

    if (!interview) {
        throw new Error(`Interview not found: ${interviewId}`);
    }

    if (!interview.transcript) {
        throw new Error(`Interview has no transcript: ${interviewId}`);
    }

    // 2. Update status to processing
    await db.update(schema.interviews)
        .set({ status: 'processing' })
        .where(eq(schema.interviews.id, interviewId));

    try {
        // 3. LLM: Extract knowledge cards from transcript
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: EXTRACTOR_PROMPT },
                { role: 'user', content: `Transkript:\n\n${interview.transcript}` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const responseText = completion.choices[0].message.content;
        if (!responseText) {
            throw new Error('Empty LLM response');
        }

        const parsed = JSON.parse(responseText);
        const cards: ExtractedCard[] = parsed.cards || [];

        log(`Extracted ${cards.length} knowledge cards`, { interviewId });

        // 4. Generate embeddings and store each card
        for (const card of cards) {
            const embeddingText = `${card.topic}: ${card.content}`;
            const embedding = await createEmbedding(embeddingText);

            await db.insert(schema.knowledgeCards).values({
                interviewId,
                expertId: interview.expertId,
                topic: card.topic,
                content: card.content,
                tags: card.tags,
                importance: card.importance,
                embedding,
            });
        }

        // 5. Generate summary
        const summaryCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Fasse das folgende Interview in 2-3 Sätzen auf Deutsch zusammen.',
                },
                { role: 'user', content: interview.transcript },
            ],
            temperature: 0.3,
        });

        const summary = summaryCompletion.choices[0].message.content || '';

        // 6. Mark interview as completed
        await db.update(schema.interviews)
            .set({ status: 'completed', summary })
            .where(eq(schema.interviews.id, interviewId));

        log('Knowledge extraction completed', { interviewId, cardCount: cards.length });
        return cards;
    } catch (error) {
        await db.update(schema.interviews)
            .set({ status: 'failed' })
            .where(eq(schema.interviews.id, interviewId));
        logError('Knowledge extraction failed', error);
        throw error;
    }
}
