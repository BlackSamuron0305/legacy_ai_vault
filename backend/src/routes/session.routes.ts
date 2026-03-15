import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { sessions, employees, users, transcriptSegments, knowledgeCards, activities } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { log, logDebug, logError, logWarn } from '../utils/logger';
import { extractKnowledge } from '../services/extraction.service';
import { sendToMakeWebhook } from '../services/webhook.service';
import { getLatestConversationId, getConversationTranscript } from '../services/elevenlabs.service';
import { uploadReportHtml, generatePdfFromHtml, uploadReportPdf, getReportSignedUrls } from '../services/report-storage.service';

type ParsedSegment = { timestamp: string; speaker: 'ai' | 'employee'; text: string };

function parseTranscriptToSegments(transcript: string): ParsedSegment[] {
    if (!transcript?.trim()) return [];
    return transcript
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const match = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*(AI|Employee):\s*(.+)$/i);
            if (match) {
                return {
                    timestamp: match[1],
                    speaker: (match[2].toLowerCase() === 'ai' ? 'ai' : 'employee') as 'ai' | 'employee',
                    text: match[3],
                };
            }
            const fallback = line.match(/^(Agent|User):\s*(.+)$/i);
            if (fallback) {
                return {
                    timestamp: '--:--:--',
                    speaker: (fallback[1].toLowerCase() === 'agent' ? 'ai' : 'employee') as 'ai' | 'employee',
                    text: fallback[2],
                };
            }
            return { timestamp: '--:--:--', speaker: 'employee' as const, text: line };
        });
}

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

        // TEMP TEST MODE: allow creating sessions without selecting an employee.
        // Roll back before committing production behavior.
        let employeeName = 'No employee selected (test mode)';
        if (employeeId) {
            await db.update(employees)
                .set({ sessionStatus: 'scheduled' })
                .where(eq(employees.id, employeeId));

            const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId));
            employeeName = emp?.name || 'Employee';
        }

        await db.insert(activities).values({
            workspaceId: user.workspaceId,
            type: 'session_scheduled',
            message: `Session scheduled with ${employeeName}`,
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

// GET /api/sessions/:id/token — fetch signed ElevenLabs URL directly
router.get('/:id/token', async (req: AuthRequest, res: Response) => {
    try {
        log('Fetching session token', { sessionId: req.params.id, userId: req.userId });

        const [session] = await db.select().from(sessions)
            .where(eq(sessions.id, req.params.id));

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

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
        const { transcript, duration, elevenlabsConversationId } = req.body;

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
                const agentId = process.env.ELEVENLABS_AGENT_ID;
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

// GET /api/sessions/:id/transcript — get transcript segments
router.get('/:id/transcript', async (req: AuthRequest, res: Response) => {
    try {
        const segments = await db.select().from(transcriptSegments)
            .where(eq(transcriptSegments.sessionId, req.params.id))
            .orderBy(transcriptSegments.orderIndex);

        if (segments.length > 0) {
            return res.json(segments);
        }

        // Fallback: parse transcript text stored on sessions when no normalized segments exist.
        const [session] = await db.select().from(sessions)
            .where(eq(sessions.id, req.params.id));

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

// POST /api/sessions/:id/reprocess — re-trigger transcript processing for a session
router.post('/:id/reprocess', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const [session] = await db.select().from(sessions).where(eq(sessions.id, req.params.id));
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const conversationId = session.elevenlabsConversationId;
        if (!conversationId) {
            return res.status(400).json({ error: 'No ElevenLabs conversation ID stored for this session' });
        }

        log('Reprocessing session transcript', { sessionId: session.id, conversationId });

        await db.update(sessions)
            .set({ status: 'processing', transcriptStatus: 'pending', reportStatus: 'generating', lastActivity: new Date() })
            .where(eq(sessions.id, session.id));

        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';

        (async () => {
            try {
                const aiResponse = await fetch(`${aiServiceUrl}/api/process-transcript`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conversation_id: conversationId }),
                });

                if (!aiResponse.ok) {
                    const errorText = await aiResponse.text();
                    throw new Error(`AI processing failed: ${errorText || aiResponse.statusText}`);
                }

                const processed = await aiResponse.json() as {
                    full_transcript?: string;
                    report?: string;
                    transcript_segments?: Array<{ speaker: string; text: string; timestamp: string }>;
                };

                const resolvedTranscript = processed.full_transcript || '';
                const report = processed.report || '';

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

                const segmentsFromApi = processed.transcript_segments;
                const segments = segmentsFromApi?.length
                    ? segmentsFromApi.map((s, i) => ({
                        sessionId: session.id,
                        timestamp: s.timestamp || '--:--:--',
                        speaker: (s.speaker === 'user' ? 'employee' : 'ai') as 'ai' | 'employee',
                        text: s.text ?? '',
                        orderIndex: i,
                    }))
                    : parseTranscriptToSegments(resolvedTranscript).map((s, i) => ({
                        sessionId: session.id,
                        timestamp: s.timestamp,
                        speaker: s.speaker,
                        text: s.text,
                        orderIndex: i,
                    }));

                if (segments.length > 0) {
                    await db.delete(transcriptSegments).where(eq(transcriptSegments.sessionId, session.id));
                    await db.insert(transcriptSegments).values(segments);
                }

                log('Reprocess completed', { sessionId: session.id, segmentCount: segments.length, reportLength: report.length });
            } catch (error: any) {
                await db.update(sessions)
                    .set({ status: 'processing_failed', reportStatus: 'pending', lastActivity: new Date() })
                    .where(eq(sessions.id, session.id));
                logError('Reprocess async failed', { sessionId: session.id, error: error?.message || error });
            }
        })();

        res.json({ status: 'reprocessing', sessionId: session.id });
    } catch (error: any) {
        logError('Reprocess route failed', { sessionId: req.params.id, error: error?.message || error });
        res.status(500).json({ error: error?.message || 'Internal server error' });
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
                status: (session.transcriptStatus === 'generated' || session.transcriptStatus === 'approved') ? 'completed' : (session.status === 'processing' ? 'in_progress' : 'pending'),
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

// GET /api/sessions/:id/report/html — serve the raw HTML report content
router.get('/:id/report/html', async (req: AuthRequest, res: Response) => {
    try {
        const [session] = await db.select().from(sessions).where(eq(sessions.id, req.params.id));
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const html = session.summary || '';
        if (!html.trim()) {
            return res.status(404).json({ error: 'No report generated yet' });
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error: any) {
        res.status(500).json({ error: error?.message || 'Internal server error' });
    }
});

// POST /api/sessions/:id/report/generate-pdf — generate PDF on demand from stored HTML
router.post('/:id/report/generate-pdf', async (req: AuthRequest, res: Response) => {
    try {
        const [session] = await db.select().from(sessions).where(eq(sessions.id, req.params.id));
        if (!session) return res.status(404).json({ error: 'Session not found' });

        let html = session.summary || '';
        if (!html.trim()) {
            return res.status(404).json({ error: 'No report to generate PDF from' });
        }

        html = html.trim();
        if (html.startsWith('```html')) html = html.slice(7);
        else if (html.startsWith('```')) html = html.slice(3);
        if (html.endsWith('```')) html = html.slice(0, -3);
        html = html.trim();

        log('Generating PDF on demand', { sessionId: session.id });

        const pdfBuffer = await generatePdfFromHtml(html);
        const reportPdfPath = await uploadReportPdf(session.id, pdfBuffer);

        let reportHtmlPath = session.reportHtmlPath;
        if (!reportHtmlPath) {
            reportHtmlPath = await uploadReportHtml(session.id, html);
        }

        await db.update(sessions)
            .set({ reportPdfPath, reportHtmlPath: reportHtmlPath ?? undefined, lastActivity: new Date() })
            .where(eq(sessions.id, session.id));

        log('PDF generated and uploaded', { sessionId: session.id, reportPdfPath });

        res.json({ reportPdfPath, reportHtmlPath });
    } catch (error: any) {
        logError('PDF generation failed', { sessionId: req.params.id, error: error?.message || error });
        res.status(500).json({ error: `PDF generation failed: ${error?.message || 'Unknown error'}` });
    }
});

// GET /api/sessions/:id/report/urls — signed URLs for report HTML and PDF
router.get('/:id/report/urls', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });
        const [session] = await db.select().from(sessions).where(eq(sessions.id, req.params.id));
        if (!session) return res.status(404).json({ error: 'Session not found' });
        if (session.workspaceId !== user.workspaceId) return res.status(403).json({ error: 'Forbidden' });
        if (!session.reportHtmlPath) {
            return res.status(404).json({ error: 'Report not ready or paths missing' });
        }
        const pdfPath = session.reportPdfPath ?? session.reportHtmlPath;
        const urls = await getReportSignedUrls(session.reportHtmlPath, pdfPath);
        res.json({
            htmlUrl: urls.htmlUrl,
            pdfUrl: session.reportPdfPath ? urls.pdfUrl : null,
        });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || error });
    }
});

// PUT /api/sessions/:id/transcript — replace transcript segments
router.put('/:id/transcript', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });
        const [session] = await db.select().from(sessions).where(eq(sessions.id, req.params.id));
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

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error?.message || 'Internal server error' });
    }
});

// GET /api/sessions/:id/classification — classify the generated report via AI service
router.get('/:id/classification', async (req: AuthRequest, res: Response) => {
    try {
        const [sessionRow] = await db.select({
            session: sessions,
            employeeRole: employees.role,
            employeeDepartment: employees.department,
        })
            .from(sessions)
            .leftJoin(employees, eq(sessions.employeeId, employees.id))
            .where(eq(sessions.id, req.params.id));

        if (!sessionRow) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const report = sessionRow.session.summary || sessionRow.session.transcript;
        if (!report) {
            return res.status(400).json({ error: 'No report or transcript available for classification' });
        }

        const employeeContext = `${sessionRow.employeeRole || 'Unknown role'} in ${sessionRow.employeeDepartment || 'Unknown department'} department`;
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';

        const response = await fetch(`${aiServiceUrl}/api/classify-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                report,
                employee_context: employeeContext,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(502).json({ error: `Classification failed: ${errorText || response.statusText}` });
        }

        const classification = await response.json() as any;

        await db.update(sessions)
            .set({
                status: 'finalized',
                reportStatus: 'finalized',
                lastActivity: new Date(),
            })
            .where(eq(sessions.id, req.params.id));

        // Create knowledge cards from classification results
        const classificationData = classification.classification || classification;
        const classifiedItems = classificationData.classification_results;
        if (Array.isArray(classifiedItems) && classifiedItems.length > 0) {
            const { createEmbedding } = await import('../services/embedding.service');

            for (const item of classifiedItems) {
                const matrix = item.classification_matrix || {};
                const category = matrix.knowledge_type || 'Uncategorized';
                const tags = [
                    matrix.criticality,
                    matrix.urgency,
                    matrix.audience,
                    matrix.risk_level,
                ].filter(Boolean);

                const importance = matrix.criticality === 'critical' || matrix.criticality === 'high'
                    ? (matrix.criticality as 'low' | 'normal' | 'high' | 'critical')
                    : 'normal';

                const content = [
                    item.topic,
                    item.dependency_analysis?.dependencies?.length
                        ? `Dependencies: ${item.dependency_analysis.dependencies.join(', ')}`
                        : null,
                    item.transfer_complexity?.time_to_transfer
                        ? `Transfer time: ${item.transfer_complexity.time_to_transfer}`
                        : null,
                    item.dependency_analysis?.single_point_of_failure
                        ? 'WARNING: Single point of failure'
                        : null,
                ].filter(Boolean).join('\n');

                let embedding: number[] | undefined;
                try {
                    embedding = await createEmbedding(`${item.topic}: ${content}`);
                } catch {
                    log('Embedding generation failed for classified item, storing without embedding');
                }

                await db.insert(knowledgeCards).values({
                    sessionId: req.params.id,
                    employeeId: sessionRow.session.employeeId || undefined,
                    topic: item.topic,
                    content,
                    category,
                    tags,
                    importance,
                    confidence: item.confidence_score || 0.9,
                    embedding,
                    source: 'interview',
                });
            }

            await db.update(sessions)
                .set({
                    topicsExtracted: classifiedItems.length,
                    lastActivity: new Date(),
                })
                .where(eq(sessions.id, req.params.id));

            log('Knowledge cards created from classification', {
                sessionId: req.params.id,
                cardCount: classifiedItems.length,
            });
        }

        return res.json(classification);
    } catch (error: any) {
        logError('Session classification route failed', { sessionId: req.params.id, error: error?.message || error });
        return res.status(500).json({ error: error.message });
    }
});

export default router;
