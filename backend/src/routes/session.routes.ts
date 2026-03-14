import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { sessions, employees, users, transcriptSegments, knowledgeCards, activities } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { extractKnowledge } from '../services/extraction.service';

const router = Router();
router.use(requireAuth);

// GET /api/sessions — list all sessions
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const result = await db.select({
            session: sessions,
            employeeName: employees.name,
            employeeRole: employees.role,
            department: employees.department,
        })
            .from(sessions)
            .leftJoin(employees, eq(sessions.employeeId, employees.id))
            .where(eq(sessions.workspaceId, user.workspaceId))
            .orderBy(desc(sessions.lastActivity));

        const mapped = result.map(r => ({
            ...r.session,
            employeeName: r.employeeName,
            employeeRole: r.employeeRole,
            department: r.department,
        }));

        res.json(mapped);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/sessions — create new session
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const { employeeId } = req.body;

        const [session] = await db.insert(sessions).values({
            workspaceId: user.workspaceId,
            employeeId,
            status: 'scheduled',
        }).returning();

        // Update employee status
        await db.update(employees)
            .set({ sessionStatus: 'scheduled' })
            .where(eq(employees.id, employeeId));

        // Activity
        const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId));
        await db.insert(activities).values({
            workspaceId: user.workspaceId,
            type: 'session_scheduled',
            message: `Session scheduled with ${emp?.name || 'Employee'}`,
        });

        res.status(201).json(session);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/sessions/:id — session detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const [session] = await db.select({
            session: sessions,
            employeeName: employees.name,
            employeeRole: employees.role,
            department: employees.department,
        })
            .from(sessions)
            .leftJoin(employees, eq(sessions.employeeId, employees.id))
            .where(eq(sessions.id, req.params.id));

        if (!session) return res.status(404).json({ error: 'Session not found' });

        res.json({
            ...session.session,
            employeeName: session.employeeName,
            employeeRole: session.employeeRole,
            department: session.department,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/sessions/:id/start — start interview
router.post('/:id/start', async (req: AuthRequest, res: Response) => {
    try {
        const [session] = await db.update(sessions)
            .set({ status: 'in_progress', lastActivity: new Date() })
            .where(eq(sessions.id, req.params.id))
            .returning();

        if (!session) return res.status(404).json({ error: 'Session not found' });

        // Update employee status
        if (session.employeeId) {
            await db.update(employees)
                .set({ sessionStatus: 'in_progress' })
                .where(eq(employees.id, session.employeeId));
        }

        res.json(session);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/sessions/:id/end — end interview, trigger processing
router.post('/:id/end', async (req: AuthRequest, res: Response) => {
    try {
        const { transcript, duration, elevenlabsConversationId } = req.body;

        const [session] = await db.update(sessions)
            .set({
                status: 'processing',
                transcript,
                duration,
                elevenlabsConversationId,
                transcriptStatus: 'generated',
                lastActivity: new Date(),
            })
            .where(eq(sessions.id, req.params.id))
            .returning();

        if (!session) return res.status(404).json({ error: 'Session not found' });

        // Trigger async extraction
        extractKnowledge(session.id, session.employeeId!, transcript).catch(console.error);

        res.json(session);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/sessions/:id/transcript — get transcript segments
router.get('/:id/transcript', async (req: AuthRequest, res: Response) => {
    try {
        const segments = await db.select().from(transcriptSegments)
            .where(eq(transcriptSegments.sessionId, req.params.id))
            .orderBy(transcriptSegments.orderIndex);

        res.json(segments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/sessions/:id/topics — get extracted topics (knowledge cards)
router.get('/:id/topics', async (req: AuthRequest, res: Response) => {
    try {
        const cards = await db.select().from(knowledgeCards)
            .where(eq(knowledgeCards.sessionId, req.params.id));

        const topics = cards.map(c => ({
            name: c.topic,
            confidence: c.confidence,
            category: c.category,
        }));

        res.json(topics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/sessions/:id/transcript/approve — approve transcript
router.put('/:id/transcript/approve', async (req: AuthRequest, res: Response) => {
    try {
        const [session] = await db.update(sessions)
            .set({
                transcriptStatus: 'approved',
                status: 'awaiting_approval',
                lastActivity: new Date(),
            })
            .where(eq(sessions.id, req.params.id))
            .returning();

        if (!session) return res.status(404).json({ error: 'Session not found' });

        if (session.employeeId) {
            await db.update(employees)
                .set({ transcriptStatus: 'approved' })
                .where(eq(employees.id, session.employeeId));
        }

        res.json(session);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/sessions/:id/processing — get processing status
router.get('/:id/processing', async (req: AuthRequest, res: Response) => {
    try {
        const [session] = await db.select().from(sessions)
            .where(eq(sessions.id, req.params.id));

        if (!session) return res.status(404).json({ error: 'Session not found' });

        const cards = await db.select().from(knowledgeCards)
            .where(eq(knowledgeCards.sessionId, req.params.id));

        const steps = [
            { name: 'Transcript Analysis', status: session.transcript ? 'completed' : 'pending' },
            { name: 'Topic Extraction', status: cards.length > 0 ? 'completed' : (session.status === 'processing' ? 'in_progress' : 'pending') },
            { name: 'Knowledge Categorization', status: cards.some(c => c.category) ? 'completed' : 'pending' },
            { name: 'Embedding Generation', status: cards.some(c => c.embedding) ? 'completed' : 'pending' },
        ];

        res.json({
            sessionStatus: session.status,
            topicsExtracted: cards.length,
            steps,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
