import { Router, Request, Response } from 'express';
import { askQuestion, getChatHistory } from '../services/chat.service';
import { logError } from '../utils/logger';

const router = Router();

/**
 * POST /api/chat/ask
 * Ask a question — returns answer with sources from the knowledge vault.
 */
router.post('/ask', async (req: Request, res: Response) => {
    try {
        const { question, session_id } = req.body;

        if (!question || typeof question !== 'string' || question.trim().length === 0) {
            res.status(400).json({ error: 'question is required' });
            return;
        }

        const result = await askQuestion(question.trim(), session_id);
        res.json(result);
    } catch (error) {
        logError('Chat failed', error);
        res.status(500).json({ error: 'Failed to process question' });
    }
});

/**
 * GET /api/chat/history/:sessionId
 * Get chat history for a session.
 */
router.get('/history/:sessionId', async (req: Request, res: Response) => {
    try {
        const messages = await getChatHistory(req.params.sessionId);
        res.json(messages);
    } catch (error) {
        logError('Failed to get chat history', error);
        res.status(500).json({ error: 'Failed to get chat history' });
    }
});

export default router;
