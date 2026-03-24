import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { employees, users, sessions } from '../db/schema';
import { eq, and, sql, count, desc, getTableColumns } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { log, logError } from '../utils/logger';

// 4NF: sessionStatus, transcriptStatus, coverageScore are computed from the latest session
const sessionStatusSql = sql<string>`COALESCE((
  SELECT s.status FROM sessions s WHERE s.employee_id = ${employees.id}
  ORDER BY s.last_activity DESC NULLS LAST LIMIT 1
), 'not_started')`.as('session_status');

const transcriptStatusSql = sql<string>`COALESCE((
  SELECT s.transcript_status FROM sessions s WHERE s.employee_id = ${employees.id}
  ORDER BY s.last_activity DESC NULLS LAST LIMIT 1
), 'none')`.as('transcript_status');

const coverageScoreSql = sql<number>`COALESCE((
  SELECT s.coverage_score FROM sessions s WHERE s.employee_id = ${employees.id}
  ORDER BY s.last_activity DESC NULLS LAST LIMIT 1
), 0)`.as('coverage_score');

const router = Router();
router.use(requireAuth);

// GET /api/employees — list all employees for workspace
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const result = await db.select({
            ...getTableColumns(employees),
            sessionStatus: sessionStatusSql,
            transcriptStatus: transcriptStatusSql,
            coverageScore: coverageScoreSql,
        }).from(employees)
            .where(eq(employees.workspaceId, user.workspaceId))
            .orderBy(employees.exitDate);

        res.json(result);
    } catch (error: any) {
        logError('List employees failed', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/employees/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const [employee] = await db.select({
            ...getTableColumns(employees),
            sessionStatus: sessionStatusSql,
            transcriptStatus: transcriptStatusSql,
            coverageScore: coverageScoreSql,
        }).from(employees)
            .where(and(eq(employees.id, req.params.id), eq(employees.workspaceId, user.workspaceId)));

        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        // Get sessions for this employee
        const employeeSessions = await db.select().from(sessions)
            .where(eq(sessions.employeeId, req.params.id))
            .orderBy(sessions.createdAt);

        log('Employee detail retrieved', { employeeId: req.params.id });
        res.json({ ...employee, sessions: employeeSessions });
    } catch (error: any) {
        logError('Get employee failed', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/employees — create employee
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const { name, role, department, email, exitDate, tenure, riskLevel } = req.body;
        const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

        const [employee] = await db.insert(employees).values({
            workspaceId: user.workspaceId,
            name,
            role,
            department,
            email,
            avatarInitials: initials,
            exitDate,
            tenure,
            riskLevel: riskLevel || 'medium',
        }).returning();

        res.status(201).json(employee);
    } catch (error: any) {
        logError('Create employee failed', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/employees/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        // Verify employee belongs to user's workspace
        const [existing] = await db.select().from(employees)
            .where(and(eq(employees.id, req.params.id), eq(employees.workspaceId, user.workspaceId)));
        if (!existing) return res.status(404).json({ error: 'Employee not found' });

        const { name, role, department, email, exitDate, tenure, riskLevel } = req.body;

        const [updated] = await db.update(employees)
            .set({ name, role, department, email, exitDate, tenure, riskLevel })
            .where(eq(employees.id, req.params.id))
            .returning();

        if (!updated) return res.status(404).json({ error: 'Employee not found' });
        log('Employee updated', { employeeId: req.params.id });
        res.json(updated);
    } catch (error: any) {
        logError('Update employee failed', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
