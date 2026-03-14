import { Router, Request, Response } from 'express';
import { eq, desc, ilike, or, sql, count } from 'drizzle-orm';
import { db, schema } from '../db/drizzle';
import { logError } from '../utils/logger';

const router = Router();

/**
 * GET /api/knowledge/cards
 * Get all knowledge cards with joined expert info.
 */
router.get('/cards', async (req: Request, res: Response) => {
    try {
        let query = db.select({
            id: schema.knowledgeCards.id,
            topic: schema.knowledgeCards.topic,
            content: schema.knowledgeCards.content,
            tags: schema.knowledgeCards.tags,
            importance: schema.knowledgeCards.importance,
            createdAt: schema.knowledgeCards.createdAt,
            expertId: schema.experts.id,
            expertName: schema.experts.name,
            expertDepartment: schema.experts.department,
            interviewId: schema.interviews.id,
            interviewSummary: schema.interviews.summary,
        })
            .from(schema.knowledgeCards)
            .leftJoin(schema.experts, eq(schema.knowledgeCards.expertId, schema.experts.id))
            .leftJoin(schema.interviews, eq(schema.knowledgeCards.interviewId, schema.interviews.id))
            .orderBy(desc(schema.knowledgeCards.createdAt))
            .$dynamic();

        // Filter by expert
        if (req.query.expert) {
            query = query.where(eq(schema.knowledgeCards.expertId, req.query.expert as string));
        }

        const cards = await query;
        res.json(cards);
    } catch (error) {
        logError('Failed to get knowledge cards', error);
        res.status(500).json({ error: 'Failed to get knowledge cards' });
    }
});

/**
 * GET /api/knowledge/search
 * Full-text search across knowledge cards.
 */
router.get('/search', async (req: Request, res: Response) => {
    try {
        const q = req.query.q as string;
        if (!q) {
            res.status(400).json({ error: 'Query parameter q is required' });
            return;
        }

        const searchPattern = `%${q}%`;

        const results = await db.select({
            id: schema.knowledgeCards.id,
            topic: schema.knowledgeCards.topic,
            content: schema.knowledgeCards.content,
            tags: schema.knowledgeCards.tags,
            importance: schema.knowledgeCards.importance,
            createdAt: schema.knowledgeCards.createdAt,
            expertName: schema.experts.name,
            expertDepartment: schema.experts.department,
        })
            .from(schema.knowledgeCards)
            .leftJoin(schema.experts, eq(schema.knowledgeCards.expertId, schema.experts.id))
            .where(or(
                ilike(schema.knowledgeCards.topic, searchPattern),
                ilike(schema.knowledgeCards.content, searchPattern)
            ))
            .orderBy(desc(schema.knowledgeCards.createdAt))
            .limit(20);

        res.json(results);
    } catch (error) {
        logError('Failed to search knowledge cards', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

/**
 * GET /api/knowledge/stats
 * Get vault statistics.
 */
router.get('/stats', async (_req: Request, res: Response) => {
    try {
        const [cardCount] = await db.select({ count: count() }).from(schema.knowledgeCards);
        const [expertCount] = await db.select({ count: count() }).from(schema.experts);
        const [interviewCount] = await db.select({ count: count() })
            .from(schema.interviews)
            .where(eq(schema.interviews.status, 'completed'));

        const depts = await db.selectDistinct({ department: schema.experts.department })
            .from(schema.experts)
            .where(sql`${schema.experts.department} IS NOT NULL`);

        res.json({
            total_cards: cardCount.count,
            total_experts: expertCount.count,
            total_interviews: interviewCount.count,
            total_departments: depts.length,
        });
    } catch (error) {
        logError('Failed to get stats', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

/**
 * GET /api/knowledge/experts
 * Get all experts with card counts.
 */
router.get('/experts', async (_req: Request, res: Response) => {
    try {
        const expertsData = await db.select({
            id: schema.experts.id,
            name: schema.experts.name,
            department: schema.experts.department,
            specialization: schema.experts.specialization,
            createdAt: schema.experts.createdAt,
            cardCount: count(schema.knowledgeCards.id),
        })
            .from(schema.experts)
            .leftJoin(schema.knowledgeCards, eq(schema.experts.id, schema.knowledgeCards.expertId))
            .groupBy(schema.experts.id)
            .orderBy(desc(schema.experts.createdAt));

        res.json(expertsData);
    } catch (error) {
        logError('Failed to get experts', error);
        res.status(500).json({ error: 'Failed to get experts' });
    }
});

/**
 * GET /api/knowledge/experts/:id
 * Get a single expert with their cards.
 */
router.get('/experts/:id', async (req: Request, res: Response) => {
    try {
        const [expert] = await db.select()
            .from(schema.experts)
            .where(eq(schema.experts.id, req.params.id))
            .limit(1);

        if (!expert) {
            res.status(404).json({ error: 'Expert not found' });
            return;
        }

        const cards = await db.select({
            id: schema.knowledgeCards.id,
            topic: schema.knowledgeCards.topic,
            content: schema.knowledgeCards.content,
            tags: schema.knowledgeCards.tags,
            importance: schema.knowledgeCards.importance,
            createdAt: schema.knowledgeCards.createdAt,
        })
            .from(schema.knowledgeCards)
            .where(eq(schema.knowledgeCards.expertId, req.params.id))
            .orderBy(desc(schema.knowledgeCards.createdAt));

        res.json({ ...expert, cards });
    } catch (error) {
        logError('Failed to get expert', error);
        res.status(500).json({ error: 'Failed to get expert' });
    }
});

export default router;
