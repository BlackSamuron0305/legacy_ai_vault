import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { employees, sessions, knowledgeCards, users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { log, logError } from '../utils/logger';

const router = Router();
router.use(requireAuth);

// GET /api/analytics/coverage — department coverage metrics
// 4NF: sessionStatus/coverageScore computed from sessions, not stored on employees
router.get('/coverage', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const deptData = await db.select({
            department: employees.department,
            totalEmployees: sql<number>`count(distinct ${employees.id})::int`,
            completedSessions: sql<number>`count(distinct case when (
                SELECT s.status FROM sessions s WHERE s.employee_id = ${employees.id}
                ORDER BY s.last_activity DESC NULLS LAST LIMIT 1
            ) IN ('completed','awaiting_review','awaiting_approval','finalized') then ${employees.id} end)::int`,
            avgCoverage: sql<number>`coalesce(avg((
                SELECT s.coverage_score FROM sessions s WHERE s.employee_id = ${employees.id}
                ORDER BY s.last_activity DESC NULLS LAST LIMIT 1
            )), 0)::int`,
        })
            .from(employees)
            .where(eq(employees.workspaceId, user.workspaceId))
            .groupBy(employees.department);

        res.json(deptData);
    } catch (error: any) {
        logError('Analytics coverage failed', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/analytics/gaps — knowledge gap analysis
// 4NF: coverageScore computed from latest session per employee
router.get('/gaps', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const atRisk = await db.select({
            id: employees.id,
            name: employees.name,
            department: employees.department,
            riskLevel: employees.riskLevel,
            exitDate: employees.exitDate,
            coverageScore: sql<number>`COALESCE((
                SELECT s.coverage_score FROM sessions s WHERE s.employee_id = ${employees.id}
                ORDER BY s.last_activity DESC NULLS LAST LIMIT 1
            ), 0)`.as('coverage_score'),
        }).from(employees)
            .where(eq(employees.workspaceId, user.workspaceId))
            .orderBy(sql`coverage_score`);

        const gaps = atRisk
            .filter(e => (e.coverageScore || 0) < 50)
            .map(e => ({
                employeeId: e.id,
                employeeName: e.name,
                department: e.department,
                coverageScore: e.coverageScore,
                riskLevel: e.riskLevel,
                exitDate: e.exitDate,
            }));

        res.json(gaps);
    } catch (error: any) {
        logError('Analytics gaps failed', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/analytics/summary — dashboard summary
// 4NF: avgCoverage computed from sessions.coverage_score
router.get('/summary', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const [empCount] = await db.select({ count: sql<number>`count(*)::int` }).from(employees)
            .where(eq(employees.workspaceId, user.workspaceId));

        const [sessionCount] = await db.select({ count: sql<number>`count(*)::int` }).from(sessions)
            .where(eq(sessions.workspaceId, user.workspaceId));

        const [completedCount] = await db.select({ count: sql<number>`count(*)::int` }).from(sessions)
            .where(sql`${sessions.workspaceId} = ${user.workspaceId} AND ${sessions.status} = 'finalized'`);

        const [cardCount] = await db.select({ count: sql<number>`count(*)::int` }).from(knowledgeCards)
            .innerJoin(sessions, eq(knowledgeCards.sessionId, sessions.id))
            .where(eq(sessions.workspaceId, user.workspaceId));

        // 4NF: compute avg coverage from sessions, not employees
        const [avgCoverage] = await db.select({
            avg: sql<number>`coalesce(avg(ls.coverage_score), 0)::int`
        }).from(sql`employees e LEFT JOIN LATERAL (
            SELECT s.coverage_score FROM sessions s WHERE s.employee_id = e.id
            ORDER BY s.last_activity DESC NULLS LAST LIMIT 1
        ) ls ON true`)
            .where(sql`e.workspace_id = ${user.workspaceId}`);

        res.json({
            totalEmployees: empCount?.count || 0,
            totalSessions: sessionCount?.count || 0,
            completedSessions: completedCount?.count || 0,
            totalKnowledgeCards: cardCount?.count || 0,
            avgCoverageScore: avgCoverage?.avg || 0,
        });
    } catch (error: any) {
        logError('Analytics summary failed', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
