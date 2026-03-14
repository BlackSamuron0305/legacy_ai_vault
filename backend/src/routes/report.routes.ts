import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { reports, employees, sessions, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/reports
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const result = await db.select({
            report: reports,
            employeeName: employees.name,
        })
            .from(reports)
            .leftJoin(employees, eq(reports.employeeId, employees.id))
            .where(eq(reports.workspaceId, user.workspaceId))
            .orderBy(desc(reports.lastUpdated));

        res.json(result.map(r => ({
            ...r.report,
            employee: r.employeeName || 'Multiple',
        })));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const [report] = await db.select({
            report: reports,
            employeeName: employees.name,
        })
            .from(reports)
            .leftJoin(employees, eq(reports.employeeId, employees.id))
            .where(eq(reports.id, req.params.id));

        if (!report) return res.status(404).json({ error: 'Report not found' });

        res.json({
            ...report.report,
            employee: report.employeeName || 'Multiple',
        });
    } catch (error: any) {
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

        res.status(201).json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/reports/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { title, content, status, exportStatus } = req.body;

        const [updated] = await db.update(reports)
            .set({ title, content, status, exportStatus, lastUpdated: new Date() })
            .where(eq(reports.id, req.params.id))
            .returning();

        if (!updated) return res.status(404).json({ error: 'Report not found' });
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
