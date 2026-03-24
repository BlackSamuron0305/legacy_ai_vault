import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { reports, employees, sessions, users } from '../db/schema';
import { eq, desc, isNotNull, and } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { log, logError } from '../utils/logger';

const router = Router();
router.use(requireAuth);

// GET /api/reports — returns both standalone reports AND session-generated reports
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        // 1. Standalone reports from the reports table
        const standaloneResult = await db.select({
            report: reports,
            employeeName: employees.name,
        })
            .from(reports)
            .leftJoin(employees, eq(reports.employeeId, employees.id))
            .where(eq(reports.workspaceId, user.workspaceId))
            .orderBy(desc(reports.lastUpdated));

        const standaloneReports = standaloneResult.map(r => ({
            ...r.report,
            employee: r.employeeName || 'Unknown',
            source: 'report' as const,
        }));

        // 2. Session-generated reports (sessions with a summary/report)
        const sessionResult = await db.select({
            session: sessions,
            employeeName: employees.name,
            employeeRole: employees.role,
            employeeDepartment: employees.department,
        })
            .from(sessions)
            .leftJoin(employees, eq(sessions.employeeId, employees.id))
            .where(and(
                eq(sessions.workspaceId, user.workspaceId),
                isNotNull(sessions.summary),
            ))
            .orderBy(desc(sessions.lastActivity));

        const sessionReports = sessionResult
            .filter(r => r.session.summary && r.session.summary.trim().length > 0)
            .map(r => ({
                id: `session-${r.session.id}`,
                sessionId: r.session.id,
                title: `${r.employeeName || 'Session'} — Knowledge Capture Report`,
                employee: r.employeeName || 'Unknown',
                employeeRole: r.employeeRole,
                department: r.employeeDepartment,
                type: 'Handover Report',
                status: r.session.reportStatus || 'draft',
                exportStatus: r.session.reportPdfPath ? 'ready' : 'pending',
                lastUpdated: r.session.lastActivity,
                createdAt: r.session.createdAt,
                hasPdf: Boolean(r.session.reportPdfPath),
                source: 'session' as const,
            }));

        const all = [...sessionReports, ...standaloneReports].sort((a, b) => {
            const dateA = new Date(a.lastUpdated || a.createdAt || 0).getTime();
            const dateB = new Date(b.lastUpdated || b.createdAt || 0).getTime();
            return dateB - dateA;
        });

        res.json(all);
    } catch (error: any) {
        logError('List reports failed', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const [report] = await db.select({
            report: reports,
            employeeName: employees.name,
        })
            .from(reports)
            .leftJoin(employees, eq(reports.employeeId, employees.id))
            .where(and(
                eq(reports.id, req.params.id),
                eq(reports.workspaceId, user.workspaceId)
            ));

        if (!report) return res.status(404).json({ error: 'Report not found' });

        res.json({
            ...report.report,
            employee: report.employeeName || 'Multiple',
        });
    } catch (error: any) {
        logError('Get report failed', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/reports — generate a new report
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const { title, type, sessionId, employeeId } = req.body;

        const [report] = await db.insert(reports).values({
            workspaceId: user.workspaceId,
            title,
            type: type || 'Handover Report',
            sessionId,
            employeeId,
        }).returning();

        log('Report created', { reportId: report.id });
        res.status(201).json(report);
    } catch (error: any) {
        logError('Create report failed', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/reports/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const { title, content, status, exportStatus } = req.body;

        const [updated] = await db.update(reports)
            .set({ title, content, status, exportStatus, lastUpdated: new Date() })
            .where(and(
                eq(reports.id, req.params.id),
                eq(reports.workspaceId, user.workspaceId)
            ))
            .returning();

        if (!updated) return res.status(404).json({ error: 'Report not found' });
        log('Report updated', { reportId: req.params.id });
        res.json(updated);
    } catch (error: any) {
        logError('Update report failed', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
