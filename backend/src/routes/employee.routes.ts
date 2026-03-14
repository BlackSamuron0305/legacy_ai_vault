import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { employees, users, sessions } from '../db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/employees — list all employees for workspace
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const result = await db.select().from(employees)
            .where(eq(employees.workspaceId, user.workspaceId))
            .orderBy(employees.exitDate);

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/employees/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const [employee] = await db.select().from(employees)
            .where(eq(employees.id, req.params.id));

        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        // Get sessions for this employee
        const employeeSessions = await db.select().from(sessions)
            .where(eq(sessions.employeeId, req.params.id))
            .orderBy(sessions.createdAt);

        res.json({ ...employee, sessions: employeeSessions });
    } catch (error: any) {
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
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/employees/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { name, role, department, email, exitDate, tenure, riskLevel, sessionStatus, transcriptStatus, coverageScore } = req.body;

        const [updated] = await db.update(employees)
            .set({ name, role, department, email, exitDate, tenure, riskLevel, sessionStatus, transcriptStatus, coverageScore })
            .where(eq(employees.id, req.params.id))
            .returning();

        if (!updated) return res.status(404).json({ error: 'Employee not found' });
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
