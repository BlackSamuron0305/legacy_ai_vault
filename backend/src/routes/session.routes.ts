import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { sessions, employees, users, transcriptSegments, knowledgeCards, activities } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { log, logDebug, logError, logWarn } from '../utils/logger';

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
        log('Starting session', {
            sessionId: req.params.id,
            userId: req.userId,
        });

        const [session] = await db.update(sessions)
            .set({ status: 'in_progress', lastActivity: new Date() })
            .where(eq(sessions.id, req.params.id))
            .returning();

        if (!session) {
            logWarn('Start session failed: session not found', { sessionId: req.params.id });
            return res.status(404).json({ error: 'Session not found' });
        }

        // Update employee status
        if (session.employeeId) {
            await db.update(employees)
                .set({ sessionStatus: 'in_progress' })
                .where(eq(employees.id, session.employeeId));
        }

        log('Session started', {
            sessionId: session.id,
            employeeId: session.employeeId,
            status: session.status,
        });

        res.json(session);
    } catch (error: any) {
        logError('Start session error', { sessionId: req.params.id, error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
});

// GET /api/sessions/:id/token — fetch signed ElevenLabs URL via AI service
router.get('/:id/token', async (req: AuthRequest, res: Response) => {
    try {
        log('Fetching session token', {
            sessionId: req.params.id,
            userId: req.userId,
        });

        const [session] = await db.select().from(sessions)
            .where(eq(sessions.id, req.params.id));

        if (!session) {
            logWarn('Token fetch failed: session not found', { sessionId: req.params.id });
            return res.status(404).json({ error: 'Session not found' });
        }

        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
        const startedAt = Date.now();
        const response = await fetch(`${aiServiceUrl}/api/start-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        logDebug('AI service token request completed', {
            sessionId: req.params.id,
            status: response.status,
            durationMs: Date.now() - startedAt,
        });

        if (!response.ok) {
            const errorText = await response.text();
            logError('AI service token request failed', {
                sessionId: req.params.id,
                aiServiceUrl,
                status: response.status,
                errorText,
            });
            return res.status(502).json({ error: `AI service error: ${errorText || response.statusText}` });
        }

        const data = await response.json() as { signed_url?: string; error?: string };
        if (!data?.signed_url) {
            logError('Token fetch failed: signed_url missing', {
                sessionId: req.params.id,
                responseData: data,
            });
            return res.status(502).json({ error: data?.error || 'Missing signed_url from AI service' });
        }

        log('Session token fetched successfully', {
            sessionId: req.params.id,
            hasSignedUrl: Boolean(data?.signed_url),
        });

        res.json({ signed_url: data.signed_url });
    } catch (error: any) {
        logError('Token fetch route failed', { sessionId: req.params.id, error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
});

// POST /api/sessions/:id/end — end interview, trigger processing
router.post('/:id/end', async (req: AuthRequest, res: Response) => {
    try {
        const { transcript, duration, elevenlabsConversationId } = req.body;

        log('Ending session and triggering processing', {
            sessionId: req.params.id,
            userId: req.userId,
            hasTranscript: Boolean(transcript),
            transcriptLength: transcript?.length || 0,
            duration,
            elevenlabsConversationId,
        });

        if (!transcript && !elevenlabsConversationId) {
            logWarn('End session rejected due to missing transcript/conversation id', { sessionId: req.params.id });
            return res.status(400).json({ error: 'Missing transcript or elevenlabsConversationId' });
        }

        const [session] = await db.update(sessions)
            .set({
                status: 'processing',
                transcript,
                duration,
                elevenlabsConversationId,
                transcriptStatus: transcript ? 'generated' : 'pending',
                reportStatus: 'generating',
                lastActivity: new Date(),
            })
            .where(eq(sessions.id, req.params.id))
            .returning();

        if (!session) {
            logWarn('End session failed: session not found', { sessionId: req.params.id });
            return res.status(404).json({ error: 'Session not found' });
        }

        log('Session moved to processing', {
            sessionId: session.id,
            reportStatus: session.reportStatus,
            transcriptStatus: session.transcriptStatus,
        });

        // Trigger async AI post-processing using Python service (do not block response)
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
        const currentConversationId = elevenlabsConversationId || session.elevenlabsConversationId;

        (async () => {
            try {
                const payload = transcript
                    ? { transcript }
                    : { conversation_id: currentConversationId };

                const startedAt = Date.now();
                log('Calling AI service for transcript processing', {
                    sessionId: session.id,
                    aiServiceUrl,
                    payloadType: transcript ? 'transcript' : 'conversation_id',
                    conversationId: currentConversationId,
                });

                const aiResponse = await fetch(`${aiServiceUrl}/api/process-transcript`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                logDebug('AI service transcript processing response', {
                    sessionId: session.id,
                    status: aiResponse.status,
                    durationMs: Date.now() - startedAt,
                });

                if (!aiResponse.ok) {
                    const errorText = await aiResponse.text();
                    throw new Error(`AI processing failed: ${errorText || aiResponse.statusText}`);
                }

                const processed = await aiResponse.json() as {
                    full_transcript?: string;
                    report?: string;
                };

                const resolvedTranscript = processed.full_transcript || transcript || '';
                const report = processed.report || '';

                log('AI processing finished', {
                    sessionId: session.id,
                    transcriptLength: resolvedTranscript.length,
                    reportLength: report.length,
                });

                await db.update(sessions)
                    .set({
                        transcript: resolvedTranscript,
                        summary: report,
                        status: 'awaiting_review',
                        transcriptStatus: 'generated',
                        reportStatus: report ? 'draft' : 'pending',
                        lastActivity: new Date(),
                    })
                    .where(eq(sessions.id, session.id));

                if (session.employeeId) {
                    await db.update(employees)
                        .set({
                            sessionStatus: 'completed',
                            transcriptStatus: 'generated',
                        })
                        .where(eq(employees.id, session.employeeId));
                }

                if (session.workspaceId) {
                    await db.insert(activities).values({
                        workspaceId: session.workspaceId,
                        type: 'transcript_ready',
                        message: 'AI transcript processing completed and report draft generated',
                    });
                }

                log('Session finalized after AI processing', {
                    sessionId: session.id,
                    finalStatus: 'awaiting_review',
                });
            } catch (error: any) {
                await db.update(sessions)
                    .set({
                        status: 'awaiting_review',
                        reportStatus: 'pending',
                        lastActivity: new Date(),
                    })
                    .where(eq(sessions.id, session.id));

                logError('Async AI processing failed', {
                    sessionId: session.id,
                    error: error?.message || error,
                });
            }
        })();

        res.json(session);
    } catch (error: any) {
        logError('End session route failed', { sessionId: req.params.id, error: error?.message || error });
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

        const steps = [
            {
                name: 'Transcript Retrieval',
                status: session.transcriptStatus === 'generated' ? 'completed' : (session.status === 'processing' ? 'in_progress' : 'pending'),
            },
            {
                name: 'Chunked AI Processing',
                status: session.status === 'processing' ? 'in_progress' : (session.summary ? 'completed' : 'pending'),
            },
            {
                name: 'Report Generation',
                status: session.reportStatus === 'draft' || session.reportStatus === 'finalized'
                    ? 'completed'
                    : (session.reportStatus === 'generating' ? 'in_progress' : 'pending'),
            },
        ];

        res.json({
            sessionStatus: session.status,
            topicsExtracted: session.topicsExtracted || 0,
            reportReady: Boolean(session.summary),
            steps,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
