import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { sessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import { log, logError } from '../utils/logger';
import { uploadReportHtml, generatePdfFromHtml, uploadReportPdf, getReportDownloadUrls } from '../services/report-storage.service';
import { getWorkspaceId, authorizeSession } from './session.helpers';

const router = Router({ mergeParams: true });

// GET /api/sessions/:id/report/html
router.get('/:id/report/html', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const session = await authorizeSession(req.params.id, workspaceId);
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

// POST /api/sessions/:id/report/generate-pdf
router.post('/:id/report/generate-pdf', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const session = await authorizeSession(req.params.id, workspaceId);
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

// GET /api/sessions/:id/report/urls
router.get('/:id/report/urls', async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace' });

        const session = await authorizeSession(req.params.id, workspaceId);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        if (!session.reportHtmlPath) {
            return res.status(404).json({ error: 'Report not ready or paths missing' });
        }
        const pdfPath = session.reportPdfPath ?? session.reportHtmlPath;
        const urls = await getReportDownloadUrls(session.reportHtmlPath, pdfPath);
        res.json({
            htmlUrl: urls.htmlUrl,
            pdfUrl: session.reportPdfPath ? urls.pdfUrl : null,
        });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || error });
    }
});

export default router;
