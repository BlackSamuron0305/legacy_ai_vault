import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { sessions, employees, knowledgeCards, transcriptSegments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import { log, logError } from '../utils/logger';
import { getWorkspaceId, authorizeSession, parseTranscriptToSegments } from './session.helpers';

const router = Router({ mergeParams: true });

// GET /api/sessions/:id/topics
router.get('/:id/topics', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const session = await authorizeSession(req.params.id, workspaceId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

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

// POST /api/sessions/:id/reprocess
router.post('/:id/reprocess', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const session = await authorizeSession(req.params.id, workspaceId);
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

// GET /api/sessions/:id/processing
router.get('/:id/processing', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const session = await authorizeSession(req.params.id, workspaceId);
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

// GET /api/sessions/:id/classification
router.get('/:id/classification', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const authorized = await authorizeSession(req.params.id, workspaceId);
        if (!authorized) return res.status(404).json({ error: 'Session not found' });

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
                } catch (embeddingErr) {
                    logError('Embedding generation failed for classified item, storing without embedding', embeddingErr);
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
