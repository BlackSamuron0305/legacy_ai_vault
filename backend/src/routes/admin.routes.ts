import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { users, workspaces, apiKeys } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper: get workspace ID + role for authenticated user
async function getUserContext(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return { workspaceId: user?.workspaceId ?? null, role: user?.role ?? 'viewer' };
}

// Middleware: require admin role
function requireAdmin(req: AuthRequest, res: Response, next: () => void) {
    // Role is checked in each route after fetching user context
    next();
}

// ===== TEAM (any authenticated user with workspace) =====

// GET /api/admin/team — list workspace team members (read-only, any role)
router.get('/team', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const ctx = await getUserContext(req.userId!);
        if (!ctx.workspaceId) return res.status(400).json({ error: 'No workspace found' });

        const members = await db.select({
            id: users.id,
            email: users.email,
            fullName: users.fullName,
            role: users.role,
            avatarInitials: users.avatarInitials,
            createdAt: users.createdAt,
        }).from(users).where(eq(users.workspaceId, ctx.workspaceId));

        res.json(members);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ===== MEMBERS =====

// GET /api/admin/members — list workspace members
router.get('/members', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const ctx = await getUserContext(req.userId!);
        if (!ctx.workspaceId) return res.status(400).json({ error: 'No workspace found' });
        if (ctx.role !== 'admin' && ctx.role !== 'owner') return res.status(403).json({ error: 'Company access required' });

        const members = await db.select({
            id: users.id,
            email: users.email,
            fullName: users.fullName,
            role: users.role,
            avatarInitials: users.avatarInitials,
            createdAt: users.createdAt,
        }).from(users).where(eq(users.workspaceId, ctx.workspaceId));

        res.json(members);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/admin/members/:id/role — change member role
router.put('/members/:id/role', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const ctx = await getUserContext(req.userId!);
        if (!ctx.workspaceId) return res.status(400).json({ error: 'No workspace found' });
        if (ctx.role !== 'admin' && ctx.role !== 'owner') return res.status(403).json({ error: 'Company access required' });

        const { role } = req.body;
        // owner and admin cannot be assigned via API — admin is set manually, owner via registration
        if (!['member', 'reviewer', 'viewer'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Verify target user is in same workspace
        const [target] = await db.select().from(users).where(eq(users.id, req.params.id));
        if (!target || target.workspaceId !== ctx.workspaceId) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Can't change own role
        if (req.params.id === req.userId) {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }

        const [updated] = await db.update(users)
            .set({ role })
            .where(eq(users.id, req.params.id))
            .returning();

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/admin/members/:id — remove member from workspace
router.delete('/members/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const ctx = await getUserContext(req.userId!);
        if (!ctx.workspaceId) return res.status(400).json({ error: 'No workspace found' });
        if (ctx.role !== 'admin' && ctx.role !== 'owner') return res.status(403).json({ error: 'Company access required' });

        // Can't remove self
        if (req.params.id === req.userId) {
            return res.status(400).json({ error: 'Cannot remove yourself' });
        }

        // Verify target user is in same workspace
        const [target] = await db.select().from(users).where(eq(users.id, req.params.id));
        if (!target || target.workspaceId !== ctx.workspaceId) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Unlink from workspace (don't delete user, just remove workspace association)
        await db.update(users)
            .set({ workspaceId: null, role: 'viewer' })
            .where(eq(users.id, req.params.id));

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ===== API KEYS =====

// GET /api/admin/api-keys — list API keys (masked)
router.get('/api-keys', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const ctx = await getUserContext(req.userId!);
        if (!ctx.workspaceId) return res.status(400).json({ error: 'No workspace found' });
        if (ctx.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        const keys = await db.select().from(apiKeys).where(eq(apiKeys.workspaceId, ctx.workspaceId));

        // Mask key values — show only last 4 chars
        const masked = keys.map(k => ({
            ...k,
            keyValue: '•'.repeat(Math.max(0, k.keyValue.length - 4)) + k.keyValue.slice(-4),
        }));

        res.json(masked);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/api-keys — add API key
router.post('/api-keys', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const ctx = await getUserContext(req.userId!);
        if (!ctx.workspaceId) return res.status(400).json({ error: 'No workspace found' });
        if (ctx.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        const { service, keyValue, label } = req.body;
        if (!service || !keyValue) {
            return res.status(400).json({ error: 'Service and key value are required' });
        }

        // Upsert: replace existing key for same service
        const [existing] = await db.select().from(apiKeys)
            .where(and(eq(apiKeys.workspaceId, ctx.workspaceId), eq(apiKeys.service, service)));

        let result;
        if (existing) {
            [result] = await db.update(apiKeys)
                .set({ keyValue, label, createdBy: req.userId })
                .where(eq(apiKeys.id, existing.id))
                .returning();
        } else {
            [result] = await db.insert(apiKeys).values({
                workspaceId: ctx.workspaceId,
                service,
                keyValue,
                label,
                createdBy: req.userId,
            }).returning();
        }

        res.json({
            ...result,
            keyValue: '•'.repeat(Math.max(0, result.keyValue.length - 4)) + result.keyValue.slice(-4),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/admin/api-keys/:id — remove API key
router.delete('/api-keys/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const ctx = await getUserContext(req.userId!);
        if (!ctx.workspaceId) return res.status(400).json({ error: 'No workspace found' });
        if (ctx.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        // Verify key belongs to workspace
        const [key] = await db.select().from(apiKeys).where(eq(apiKeys.id, req.params.id));
        if (!key || key.workspaceId !== ctx.workspaceId) {
            return res.status(404).json({ error: 'API key not found' });
        }

        await db.delete(apiKeys).where(eq(apiKeys.id, req.params.id));
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ===== COMPANY INFO =====

// GET /api/admin/companies — list ALL companies (platform admin only)
router.get('/companies', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const ctx = await getUserContext(req.userId!);
        if (ctx.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        const allWorkspaces = await db.select().from(workspaces);
        const allUsers = await db.select({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            role: users.role,
            workspaceId: users.workspaceId,
        }).from(users);

        const result = allWorkspaces.map(ws => {
            const wsMembers = allUsers.filter(u => u.workspaceId === ws.id);
            const owner = wsMembers.find(u => u.role === 'owner');
            return {
                id: ws.id,
                name: ws.name,
                companyName: ws.companyName || ws.name,
                domain: ws.domain,
                industry: ws.industry,
                memberCount: wsMembers.length,
                owner: owner ? { id: owner.id, fullName: owner.fullName, email: owner.email } : null,
                createdAt: ws.createdAt,
            };
        });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/company — get company/workspace info
router.get('/company', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const ctx = await getUserContext(req.userId!);
        if (!ctx.workspaceId) return res.status(400).json({ error: 'No workspace found' });

        const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, ctx.workspaceId));
        const memberCount = (await db.select().from(users).where(eq(users.workspaceId, ctx.workspaceId))).length;

        res.json({ ...ws, memberCount });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/admin/company — update company info (owner or admin)
router.put('/company', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const ctx = await getUserContext(req.userId!);
        if (!ctx.workspaceId) return res.status(400).json({ error: 'No workspace found' });
        if (ctx.role !== 'admin' && ctx.role !== 'owner') return res.status(403).json({ error: 'Company access required' });

        const { companyName, domain, industry } = req.body;
        const updates: Record<string, any> = {};
        if (companyName !== undefined) { updates.name = companyName; updates.companyName = companyName; }
        if (domain !== undefined) updates.domain = domain.toLowerCase();
        if (industry !== undefined) updates.industry = industry;

        const [updated] = await db.update(workspaces)
            .set(updates)
            .where(eq(workspaces.id, ctx.workspaceId))
            .returning();

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
