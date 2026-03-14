import { Router, Request, Response } from 'express';
import { eq, asc } from 'drizzle-orm';
import { db, schema } from '../db/drizzle';
import { buildAgentConfig, getConversationTranscript } from '../services/elevenlabs.service';
import { extractKnowledge } from '../services/extraction.service';
import { log, logError } from '../utils/logger';

const router = Router();

/**
 * POST /api/interview/start
 * Start a new interview session.
 */
router.post('/start', async (req: Request, res: Response) => {
    try {
        const { name, department, specialization } = req.body;

        if (!name || !specialization) {
            res.status(400).json({ error: 'name and specialization are required' });
            return;
        }

        // Create expert via Drizzle
        const [expert] = await db.insert(schema.experts)
            .values({ name, department, specialization })
            .returning();

        // Create interview via Drizzle
        const [interview] = await db.insert(schema.interviews)
            .values({ expertId: expert.id, status: 'in_progress' })
            .returning();

        // Build ElevenLabs agent config
        const agentConfig = buildAgentConfig(name, specialization);

        log('Interview started', { interviewId: interview.id, expertId: expert.id });

        res.json({
            interview_id: interview.id,
            expert_id: expert.id,
            agent_config: agentConfig,
        });
    } catch (error) {
        logError('Failed to start interview', error);
        res.status(500).json({ error: 'Failed to start interview' });
    }
});

/**
 * POST /api/interview/end
 * End an interview. Fetches transcript, triggers extraction.
 */
router.post('/end', async (req: Request, res: Response) => {
    try {
        const { interview_id, conversation_id, transcript } = req.body;

        if (!interview_id) {
            res.status(400).json({ error: 'interview_id is required' });
            return;
        }

        let finalTranscript = transcript;

        if (conversation_id && !transcript) {
            finalTranscript = await getConversationTranscript(conversation_id);
        }

        if (!finalTranscript) {
            res.status(400).json({ error: 'No transcript available. Provide transcript or conversation_id.' });
            return;
        }

        // Save transcript via Drizzle
        await db.update(schema.interviews)
            .set({
                transcript: finalTranscript,
                elevenlabsConversationId: conversation_id || null,
                status: 'processing',
            })
            .where(eq(schema.interviews.id, interview_id));

        log('Interview ended, starting extraction', { interview_id });

        // Start extraction (async)
        extractKnowledge(interview_id).catch(err =>
            logError('Background extraction failed', err)
        );

        res.json({ status: 'processing', interview_id });
    } catch (error) {
        logError('Failed to end interview', error);
        res.status(500).json({ error: 'Failed to end interview' });
    }
});

/**
 * GET /api/interview/:id/status
 */
router.get('/:id/status', async (req: Request, res: Response) => {
    try {
        const [interview] = await db.select({
            id: schema.interviews.id,
            status: schema.interviews.status,
            summary: schema.interviews.summary,
            createdAt: schema.interviews.createdAt,
        })
            .from(schema.interviews)
            .where(eq(schema.interviews.id, req.params.id))
            .limit(1);

        if (!interview) {
            res.status(404).json({ error: 'Interview not found' });
            return;
        }

        res.json(interview);
    } catch (error) {
        logError('Failed to get interview status', error);
        res.status(500).json({ error: 'Failed to get interview status' });
    }
});

/**
 * GET /api/interview/:id/cards
 */
router.get('/:id/cards', async (req: Request, res: Response) => {
    try {
        const cards = await db.select({
            id: schema.knowledgeCards.id,
            topic: schema.knowledgeCards.topic,
            content: schema.knowledgeCards.content,
            tags: schema.knowledgeCards.tags,
            importance: schema.knowledgeCards.importance,
            createdAt: schema.knowledgeCards.createdAt,
        })
            .from(schema.knowledgeCards)
            .where(eq(schema.knowledgeCards.interviewId, req.params.id))
            .orderBy(asc(schema.knowledgeCards.createdAt));

        res.json(cards);
    } catch (error) {
        logError('Failed to get interview cards', error);
        res.status(500).json({ error: 'Failed to get interview cards' });
    }
});

export default router;
