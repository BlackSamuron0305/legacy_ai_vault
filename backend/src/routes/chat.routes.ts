import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { chatMessages } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { askQuestion, getChatHistory } from '../services/chat.service';

const router = Router();
router.use(requireAuth);

// POST /api/chat/ask
router.post('/ask', async (req: AuthRequest, res: Response) => {
    try {
        const { question, sessionId } = req.body;
        const result = await askQuestion(question, sessionId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/chat/history/:sessionId
router.get('/history/:sessionId', async (req: AuthRequest, res: Response) => {
    try {
        const history = await getChatHistory(req.params.sessionId);
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
