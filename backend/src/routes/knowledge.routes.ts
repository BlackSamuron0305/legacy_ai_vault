import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { knowledgeCards, knowledgeCategories, employees, sessions, users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { supabase } from '../db/supabase';
import { createEmbedding } from '../services/embedding.service';

const router = Router();
router.use(requireAuth);

// GET /api/knowledge/categories
router.get('/categories', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const cardsByCategory = await db.select({
            category: knowledgeCards.category,
            count: sql<number>`count(*)::int`,
            sourceSessions: sql<number>`count(distinct ${knowledgeCards.sessionId})::int`,
        })
            .from(knowledgeCards)
            .innerJoin(sessions, eq(knowledgeCards.sessionId, sessions.id))
            .where(eq(sessions.workspaceId, user.workspaceId))
            .groupBy(knowledgeCards.category);

        const customCats = await db.select().from(knowledgeCategories)
            .where(eq(knowledgeCategories.workspaceId, user.workspaceId));

        const result = cardsByCategory.map(c => {
            const custom = customCats.find(cc => cc.name === c.category);
            return {
                id: custom?.id || c.category,
                name: c.category || 'Uncategorized',
                icon: custom?.icon || 'folder',
                count: c.count,
                completeness: Math.min(100, c.count * 10),
                sourceSessions: c.sourceSessions,
                status: custom?.status || 'draft',
            };
        });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/knowledge/cards
router.get('/cards', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const result = await db.select({
            card: knowledgeCards,
            employeeName: employees.name,
            employeeDepartment: employees.department,
        })
            .from(knowledgeCards)
            .leftJoin(employees, eq(knowledgeCards.employeeId, employees.id))
            .innerJoin(sessions, eq(knowledgeCards.sessionId, sessions.id))
            .where(eq(sessions.workspaceId, user.workspaceId));

        res.json(result.map(r => ({
            ...r.card,
            expertName: r.employeeName,
            expertDepartment: r.employeeDepartment,
        })));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/knowledge/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const [cardCount] = await db.select({ count: sql<number>`count(*)::int` }).from(knowledgeCards)
            .innerJoin(sessions, eq(knowledgeCards.sessionId, sessions.id))
            .where(eq(sessions.workspaceId, user.workspaceId));

        const [empCount] = await db.select({ count: sql<number>`count(*)::int` }).from(employees)
            .where(eq(employees.workspaceId, user.workspaceId));

        const [sessionCount] = await db.select({ count: sql<number>`count(*)::int` }).from(sessions)
            .where(eq(sessions.workspaceId, user.workspaceId));

        res.json({
            totalCards: cardCount?.count || 0,
            totalEmployees: empCount?.count || 0,
            totalSessions: sessionCount?.count || 0,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/knowledge/:categoryName — cards for a category
router.get('/:categoryName', async (req: AuthRequest, res: Response) => {
    try {
        const cards = await db.select({
            card: knowledgeCards,
            employeeName: employees.name,
        })
            .from(knowledgeCards)
            .leftJoin(employees, eq(knowledgeCards.employeeId, employees.id))
            .where(eq(knowledgeCards.category, decodeURIComponent(req.params.categoryName)));

        res.json({
            category: decodeURIComponent(req.params.categoryName),
            blocks: cards.map(c => ({ ...c.card, expertName: c.employeeName })),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/knowledge/:categoryName/chat — AI chat about category
router.post('/:categoryName/chat', async (req: AuthRequest, res: Response) => {
    try {
        const { question, history } = req.body;

        const cards = await db.select().from(knowledgeCards)
            .where(eq(knowledgeCards.category, decodeURIComponent(req.params.categoryName)));

        const context = cards.map(c =>
            `Topic: ${c.topic}\nContent: ${c.content}\nTags: ${c.tags?.join(', ')}`
        ).join('\n\n---\n\n');

        const hfToken = process.env.HUGGINGFACE_API_TOKEN;
        if (!hfToken) {
            return res.status(500).json({ error: 'Missing HUGGINGFACE_API_TOKEN in environment variables' });
        }

        const messages: any[] = [
            { role: 'system', content: `You are a knowledge assistant. Answer based on these knowledge cards:\n\n${context}\n\nOnly answer from available information. Cite sources.` },
            ...(history || []),
            { role: 'user', content: question },
        ];

        const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${hfToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'Qwen/Qwen2.5-72B-Instruct',
                messages,
                temperature: 0.3,
                max_tokens: 1200,
            }),
        });

        if (!response.ok) {
            const body = await response.text();
            return res.status(502).json({ error: `Hugging Face API error: ${response.status} ${body}` });
        }

        const completion = await response.json() as any;
        const answer = completion?.choices?.[0]?.message?.content || 'No answer returned.';

        res.json({
            answer,
            sources: cards.map(c => ({ id: c.id, topic: c.topic })),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/knowledge/search — vector search
router.post('/search', async (req: AuthRequest, res: Response) => {
    try {
        const { query } = req.body;
        const embedding = await createEmbedding(query);

        const { data, error } = await supabase.rpc('search_knowledge', {
            query_embedding: embedding,
            match_threshold: 0.65,
            match_count: 10,
        });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
