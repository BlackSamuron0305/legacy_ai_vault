import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { workspaceSettings, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper: get workspace ID for authenticated user
async function getWorkspaceId(userId: string): Promise<string | null> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.workspaceId ?? null;
}

// GET /api/settings — get all workspace settings
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace found' });

        let [settings] = await db.select().from(workspaceSettings).where(eq(workspaceSettings.workspaceId, workspaceId));

        // Auto-create settings row if missing
        if (!settings) {
            [settings] = await db.insert(workspaceSettings).values({ workspaceId }).returning();
        }

        res.json(settings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/settings — update workspace settings (partial)
router.put('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const workspaceId = await getWorkspaceId(req.userId!);
        if (!workspaceId) return res.status(400).json({ error: 'No workspace found' });

        // Ensure row exists
        const [existing] = await db.select().from(workspaceSettings).where(eq(workspaceSettings.workspaceId, workspaceId));
        if (!existing) {
            await db.insert(workspaceSettings).values({ workspaceId });
        }

        // Whitelist allowed fields
        const allowed = [
            'interviewTone', 'followUpDepth', 'knowledgeProbing', 'outputStructure',
            'requireApproval', 'allowEditing', 'highlightLowConfidence', 'notifyReviewer', 'allowReRecord',
            'reportFormat', 'knowledgeCategorization', 'exportFormat', 'ragChunking',
            'notifySessionReminders', 'notifyTranscriptReady', 'notifyReportFinalized',
            'notifyKnowledgeGaps', 'notifyWeeklyDigest', 'notifyInApp',
            'theme', 'density', 'dateFormat', 'language',
        ];

        const updates: Record<string, any> = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const [updated] = await db.update(workspaceSettings)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(workspaceSettings.workspaceId, workspaceId))
            .returning();

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
