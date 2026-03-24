import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { chatMessages, sessions, users } from '../db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { askQuestion, getChatHistory } from '../services/chat.service';
import { getWorkspaceId, authorizeSession } from './session.helpers';
import { log, logError } from '../utils/logger';

const router = Router();
router.use(requireAuth);

// POST /api/chat/ask
router.post('/ask', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const { question, sessionId } = req.body;

        // Verify session belongs to user's workspace if provided
        if (sessionId) {
            const session = await authorizeSession(sessionId, workspaceId);
            if (!session) return res.status(403).json({ error: 'Session not in your workspace' });
        }

        const result = await askQuestion(question, workspaceId, sessionId);
        log('Chat question answered', { userId: req.userId, sessionId, workspaceId });
        res.json(result);
    } catch (error: any) {
        logError('Chat ask failed', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/chat/history/:sessionId
router.get('/history/:sessionId', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        // Verify session belongs to user's workspace
        const session = await authorizeSession(req.params.sessionId, workspaceId);
        if (!session) return res.status(403).json({ error: 'Session not in your workspace' });

        const history = await getChatHistory(req.params.sessionId);
        log('Chat history retrieved', { sessionId: req.params.sessionId, messageCount: history.length });
        res.json(history);
    } catch (error: any) {
        logError('Chat history failed', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
