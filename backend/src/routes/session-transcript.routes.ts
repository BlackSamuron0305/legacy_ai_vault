import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { sessions, transcriptSegments } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import { getWorkspaceId, authorizeSession } from './session.helpers';
import { log, logError } from '../utils/logger';

const router = Router({ mergeParams: true });

// ── SSE: In-memory map of session → connected clients ──
const sseClients = new Map<string, Set<Response>>();

export function broadcastSegment(sessionId: string, segment: any) {
    const clients = sseClients.get(sessionId);
    if (!clients) return;
    const data = JSON.stringify(segment);
    for (const res of clients) {
        res.write(`data: ${data}\n\n`);
    }
}

// GET /api/sessions/:id/transcript/live — SSE stream for real-time transcript
router.get('/:id/transcript/live', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const session = await authorizeSession(req.params.id, workspaceId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        // Setup SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        });
        res.write(': connected\n\n');
        log('SSE client connected for transcript', { sessionId: req.params.id });

        // Register client
        if (!sseClients.has(req.params.id)) {
            sseClients.set(req.params.id, new Set());
        }
        sseClients.get(req.params.id)!.add(res);

        // Cleanup on disconnect
        req.on('close', () => {
            const clients = sseClients.get(req.params.id);
            if (clients) {
                clients.delete(res);
                if (clients.size === 0) sseClients.delete(req.params.id);
            }
            log('SSE client disconnected', { sessionId: req.params.id });
        });
    } catch (error: any) {
        logError('SSE transcript live failed', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/sessions/:id/transcript/segment — real-time segment from frontend
router.post('/:id/transcript/segment', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const session = await authorizeSession(req.params.id, workspaceId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const { speaker, text, timestamp } = req.body;
        if (!speaker || !text) return res.status(400).json({ error: 'speaker and text are required' });

        // Atomic insert with auto-incremented order_index to prevent race conditions
        const [segment] = await db.execute(sql`
            INSERT INTO transcript_segments (session_id, speaker, text, timestamp, order_index)
            VALUES (
                ${req.params.id},
                ${speaker === 'ai' ? 'ai' : 'employee'},
                ${text},
                ${timestamp || new Date().toISOString().slice(11, 19)},
                COALESCE((SELECT MAX(order_index) FROM transcript_segments WHERE session_id = ${req.params.id}), -1) + 1
            )
            RETURNING *
        `) as any;

        // Broadcast to SSE clients
        broadcastSegment(req.params.id, segment);

        log('Transcript segment added', { sessionId: req.params.id, speaker });
        res.status(201).json(segment);
    } catch (error: any) {
        logError('Transcript segment insert failed', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/sessions/:id/transcript
router.get('/:id/transcript', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const session = await authorizeSession(req.params.id, workspaceId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const segments = await db.select().from(transcriptSegments)
            .where(eq(transcriptSegments.sessionId, req.params.id))
            .orderBy(transcriptSegments.orderIndex);

        if (segments.length > 0) {
            return res.json(segments);
        }

        if (!session?.transcript) {
            return res.json([]);
        }

        const lines = session.transcript.split('\n').map(l => l.trim()).filter(Boolean);
        const parsedSegments = lines.map((line, index) => {
            const withTimestamp = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*(AI|Employee|Agent|User):\s*(.+)$/i);
            if (withTimestamp) {
                const speaker = withTimestamp[2].toLowerCase();
                return {
                    id: `fallback-${index}`,
                    sessionId: req.params.id,
                    timestamp: withTimestamp[1],
                    speaker: speaker === 'ai' || speaker === 'agent' ? 'ai' : 'employee',
                    text: withTimestamp[3],
                    orderIndex: index,
                };
            }

            const withoutTimestamp = line.match(/^(AI|Employee|Agent|User):\s*(.+)$/i);
            if (withoutTimestamp) {
                const speaker = withoutTimestamp[1].toLowerCase();
                return {
                    id: `fallback-${index}`,
                    sessionId: req.params.id,
                    timestamp: '--:--:--',
                    speaker: speaker === 'ai' || speaker === 'agent' ? 'ai' : 'employee',
                    text: withoutTimestamp[2],
                    orderIndex: index,
                };
            }

            return {
                id: `fallback-${index}`,
                sessionId: req.params.id,
                timestamp: '--:--:--',
                speaker: 'employee',
                text: line,
                orderIndex: index,
            };
        });

        res.json(parsedSegments);
    } catch (error: any) {
        logError('Get transcript failed', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/sessions/:id/transcript
router.put('/:id/transcript', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const session = await authorizeSession(req.params.id, workspaceId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const { segments } = req.body as { segments: Array<{ timestamp?: string; speaker?: string; text?: string; orderIndex?: number }> };
        if (!Array.isArray(segments)) return res.status(400).json({ error: 'segments must be an array' });

        await db.delete(transcriptSegments).where(eq(transcriptSegments.sessionId, session.id));

        const rows = segments.map((s, i) => ({
            sessionId: session.id,
            timestamp: s.timestamp || '--:--:--',
            speaker: (s.speaker === 'ai' ? 'ai' : 'employee') as 'ai' | 'employee',
            text: s.text ?? '',
            orderIndex: s.orderIndex ?? i,
        }));

        if (rows.length > 0) {
            await db.insert(transcriptSegments).values(rows);
        }

        const updated = await db.select().from(transcriptSegments)
            .where(eq(transcriptSegments.sessionId, session.id))
            .orderBy(transcriptSegments.orderIndex);

        log('Transcript updated', { sessionId: session.id, segmentCount: updated.length });
        res.json(updated);
    } catch (error: any) {
        logError('Update transcript failed', error);
        res.status(500).json({ error: error?.message || 'Internal server error' });
    }
});

// PUT /api/sessions/:id/transcript/approve
router.put('/:id/transcript/approve', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const existing = await authorizeSession(req.params.id, workspaceId);
        if (!existing) return res.status(404).json({ error: 'Session not found' });

        const [session] = await db.update(sessions)
            .set({
                transcriptStatus: 'approved',
                status: 'awaiting_approval',
                lastActivity: new Date(),
            })
            .where(eq(sessions.id, req.params.id))
            .returning();

        if (!session) return res.status(404).json({ error: 'Session not found' });

        log('Transcript approved', { sessionId: req.params.id });
        res.json(session);
    } catch (error: any) {
        logError('Transcript approve failed', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
