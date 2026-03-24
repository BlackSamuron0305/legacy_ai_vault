import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { sessions, employees, users, activities } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { log, logDebug, logError, logWarn } from '../utils/logger';
import { extractKnowledge } from '../services/extraction.service';
import { sendToMakeWebhook } from '../services/webhook.service';
import { getLatestConversationId } from '../services/elevenlabs.service';
import { getWorkspaceId, authorizeSession } from './session.helpers';

import transcriptRoutes from './session-transcript.routes';
import reportRoutes from './session-report.routes';
import processingRoutes from './session-processing.routes';

const router = Router();
router.use(requireAuth);

// Mount sub-routers
router.use(transcriptRoutes);
router.use(reportRoutes);
router.use(processingRoutes);

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
        logError('List sessions failed', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/sessions — create new session
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const { employeeId } = req.body;
        if (!employeeId) return res.status(400).json({ error: 'employeeId is required' });

        const [session] = await db.insert(sessions).values({
            workspaceId: user.workspaceId,
            employeeId,
            status: 'scheduled',
        }).returning();

        const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId));
        const employeeName = emp?.name || 'Employee';

        await db.insert(activities).values({
            workspaceId: user.workspaceId,
            type: 'session_scheduled',
            message: `Session scheduled with ${employeeName}`,
        });

        log('Session created', { sessionId: session.id, employeeId });
        res.status(201).json(session);
    } catch (error: any) {
        logError('Create session failed', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/sessions/:id — session detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const [session] = await db.select({
            session: sessions,
            employeeName: employees.name,
            employeeRole: employees.role,
            department: employees.department,
        })
            .from(sessions)
            .leftJoin(employees, eq(sessions.employeeId, employees.id))
            .where(and(eq(sessions.id, req.params.id), eq(sessions.workspaceId, workspaceId)));

        if (!session) return res.status(404).json({ error: 'Session not found' });

        res.json({
            ...session.session,
            employeeName: session.employeeName,
            employeeRole: session.employeeRole,
            department: session.department,
        });
    } catch (error: any) {
        logError('Get session detail failed', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/sessions/:id/start — start interview
router.post('/:id/start', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const existing = await authorizeSession(req.params.id, workspaceId);
        if (!existing) return res.status(404).json({ error: 'Session not found' });

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

// GET /api/sessions/:id/token — fetch signed ElevenLabs URL directly
router.get('/:id/token', async (req: AuthRequest, res: Response) => {
    try {
        log('Fetching session token', { sessionId: req.params.id, userId: req.userId });

        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const session = await authorizeSession(req.params.id, workspaceId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const apiKey = process.env.ELEVENLABS_API_KEY;
        const agentId = process.env.ELEVENLABS_AGENT_ID;

        if (!apiKey || !agentId) {
            logError('Missing ElevenLabs config', { hasApiKey: !!apiKey, hasAgentId: !!agentId });
            return res.status(500).json({ error: 'Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID' });
        }

        const response = await fetch('https://api.elevenlabs.io/v1/convai/conversation/token', {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ agent_id: agentId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logError('ElevenLabs token request failed', { status: response.status, errorText });
            return res.status(502).json({ error: `ElevenLabs error: ${errorText || response.statusText}` });
        }

        const data = await response.json() as { token?: string; signed_url?: string };
        const signedUrl = data.signed_url || data.token;

        if (!signedUrl) {
            logError('ElevenLabs returned no signed_url or token', { data });
            return res.status(502).json({ error: 'No signed URL returned from ElevenLabs' });
        }

        log('Session token fetched successfully', { sessionId: req.params.id });
        res.json({ signed_url: signedUrl });
    } catch (error: any) {
        logError('Token fetch route failed', { sessionId: req.params.id, error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
});

// POST /api/sessions/:id/end — end interview, trigger processing
router.post('/:id/end', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const existing = await authorizeSession(req.params.id, workspaceId);
        if (!existing) return res.status(404).json({ error: 'Session not found' });

        const { transcript, duration, elevenlabsConversationId, agentId: bodyAgentId } = req.body;

        log('Ending session and triggering processing', {
            sessionId: req.params.id,
            userId: req.userId,
            hasTranscript: Boolean(transcript),
            transcriptLength: transcript?.length || 0,
            duration,
            elevenlabsConversationId,
        });

        const [session] = await db.update(sessions)
            .set({
                status: 'processing',
                transcript: transcript || undefined,
                duration,
                elevenlabsConversationId: elevenlabsConversationId || undefined,
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
        let currentConversationId = elevenlabsConversationId || session.elevenlabsConversationId;

        (async () => {
            const MAX_RETRIES = 3;

            // Widget mode: no frontend transcript and no conversation ID.
            // Auto-fetch the latest conversation from ElevenLabs for this agent.
            let resolvedTranscriptText = transcript;
            if (!resolvedTranscriptText && !currentConversationId) {
                const agentId = bodyAgentId || process.env.ELEVENLABS_AGENT_ID;
                if (agentId) {
                    try {
                        log('Widget mode: fetching latest conversation from ElevenLabs', {
                            sessionId: session.id,
                            agentId,
                        });
                        const latestId = await getLatestConversationId(agentId);
                        if (latestId) {
                            currentConversationId = latestId;
                            await db.update(sessions)
                                .set({ elevenlabsConversationId: latestId })
                                .where(eq(sessions.id, session.id));
                            log('Resolved conversation ID from ElevenLabs', {
                                sessionId: session.id,
                                conversationId: latestId,
                            });
                        } else {
                            logWarn('No conversations found for agent', {
                                sessionId: session.id,
                                agentId,
                            });
                        }
                    } catch (fetchError: any) {
                        logError('Failed to auto-fetch conversation ID (non-fatal)', {
                            sessionId: session.id,
                            error: fetchError?.message || fetchError,
                        });
                    }
                }
            }

            // Give ElevenLabs time to finish processing the call recording into a transcript
            if (!resolvedTranscriptText && currentConversationId) {
                log('Waiting 5s for ElevenLabs to finish processing before fetching transcript', { sessionId: session.id });
                await new Promise(r => setTimeout(r, 5000));
            }

            const payload = resolvedTranscriptText
                ? { transcript: resolvedTranscriptText }
                : { conversation_id: currentConversationId };

            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    const startedAt = Date.now();
                    log('Calling AI service for transcript processing', {
                        sessionId: session.id,
                        aiServiceUrl,
                        payloadType: transcript ? 'transcript' : 'conversation_id',
                        conversationId: currentConversationId,
                        attempt,
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
                        attempt,
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
                    const report = (processed.report && processed.report.trim())
                        ? processed.report
                        : (resolvedTranscript
                            ? 'Transcript captured successfully. AI report generation returned an empty response; please review transcript and rerun processing if needed.'
                            : 'No transcript content was captured.');

                    log('AI processing finished', {
                        sessionId: session.id,
                        transcriptLength: resolvedTranscript.length,
                        reportLength: report.length,
                        attempt,
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

                    if (session.workspaceId) {
                        await db.insert(activities).values({
                            workspaceId: session.workspaceId,
                            type: 'transcript_ready',
                            message: 'AI transcript processing completed and report draft generated',
                        });
                    }

                    if (resolvedTranscript) {
                        try {
                            await extractKnowledge(session.id, session.employeeId || null, resolvedTranscript);
                            log('Knowledge extraction completed', { sessionId: session.id });
                        } catch (extractionError: any) {
                            logError('Knowledge extraction failed (non-fatal)', {
                                sessionId: session.id,
                                error: extractionError?.message || extractionError,
                            });
                        }
                    }

                    if (report && process.env.MAKE_WEBHOOK_URL) {
                        try {
                            await sendToMakeWebhook({
                                sessionId: session.id,
                                employeeId: session.employeeId,
                                report,
                                transcript: resolvedTranscript,
                                generatedAt: new Date().toISOString(),
                            });
                            log('Make webhook sent', { sessionId: session.id });
                        } catch (webhookError: any) {
                            logError('Make webhook failed (non-fatal)', {
                                sessionId: session.id,
                                error: webhookError?.message || webhookError,
                            });
                        }
                    }

                    log('Session finalized after AI processing', {
                        sessionId: session.id,
                        finalStatus: 'awaiting_review',
                    });

                    return; // success — exit retry loop
                } catch (error: any) {
                    logError('AI processing attempt failed', {
                        sessionId: session.id,
                        attempt,
                        maxRetries: MAX_RETRIES,
                        error: error?.message || error,
                    });

                    if (attempt < MAX_RETRIES) {
                        const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                        log('Retrying AI processing', {
                            sessionId: session.id,
                            nextAttempt: attempt + 1,
                            delayMs,
                        });
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                    } else {
                        await db.update(sessions)
                            .set({
                                status: 'awaiting_review',
                                reportStatus: 'pending',
                                lastActivity: new Date(),
                            })
                            .where(eq(sessions.id, session.id));

                        logError('All AI processing retries exhausted', {
                            sessionId: session.id,
                            totalAttempts: MAX_RETRIES,
                        });
                    }
                }
            }
        })();

        res.json(session);
    } catch (error: any) {
        logError('End session route failed', { sessionId: req.params.id, error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
});

// POST /api/sessions/:id/pause — pause an in-progress interview
router.post('/:id/pause', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const existing = await authorizeSession(req.params.id, workspaceId);
        if (!existing) return res.status(404).json({ error: 'Session not found' });

        if (existing.status !== 'in_progress') {
            return res.status(409).json({ error: `Cannot pause session with status '${existing.status}'` });
        }

        const [session] = await db.update(sessions)
            .set({ status: 'paused', lastActivity: new Date() })
            .where(eq(sessions.id, req.params.id))
            .returning();

        log('Session paused', { sessionId: session.id });
        res.json(session);
    } catch (error: any) {
        logError('Pause session error', { sessionId: req.params.id, error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
});

// POST /api/sessions/:id/resume — resume a paused interview
router.post('/:id/resume', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const existing = await authorizeSession(req.params.id, workspaceId);
        if (!existing) return res.status(404).json({ error: 'Session not found' });

        if (existing.status !== 'paused') {
            return res.status(409).json({ error: `Cannot resume session with status '${existing.status}'` });
        }

        const [session] = await db.update(sessions)
            .set({ status: 'in_progress', lastActivity: new Date() })
            .where(eq(sessions.id, req.params.id))
            .returning();

        log('Session resumed', { sessionId: session.id });
        res.json(session);
    } catch (error: any) {
        logError('Resume session error', { sessionId: req.params.id, error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
});

export default router;
