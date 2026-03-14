import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { employees, sessions, knowledgeCards, users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/analytics/coverage — department coverage metrics
router.get('/coverage', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const deptData = await db.select({
            department: employees.department,
            totalEmployees: sql<number>`count(distinct ${employees.id})::int`,
            completedSessions: sql<number>`count(distinct case when ${employees.sessionStatus} = 'completed' then ${employees.id} end)::int`,
            avgCoverage: sql<number>`coalesce(avg(${employees.coverageScore}), 0)::int`,
        })
            .from(employees)
            .where(eq(employees.workspaceId, user.workspaceId))
            .groupBy(employees.department);

        res.json(deptData);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/analytics/gaps — knowledge gap analysis
router.get('/gaps', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        // Employees with low coverage who are leaving soon
        const atRisk = await db.select().from(employees)
            .where(eq(employees.workspaceId, user.workspaceId))
            .orderBy(employees.coverageScore);

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
        res.status(500).json({ error: error.message });
    }
});

// GET /api/analytics/summary — dashboard summary
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

        const [avgCoverage] = await db.select({ avg: sql<number>`coalesce(avg(${employees.coverageScore}), 0)::int` })
            .from(employees)
            .where(eq(employees.workspaceId, user.workspaceId));

        res.json({
            totalEmployees: empCount?.count || 0,
            totalSessions: sessionCount?.count || 0,
            completedSessions: completedCount?.count || 0,
            totalKnowledgeCards: cardCount?.count || 0,
            avgCoverageScore: avgCoverage?.avg || 0,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
