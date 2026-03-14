import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { activities, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/activity — recent activity feed
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const feed = await db.select().from(activities)
            .where(eq(activities.workspaceId, user.workspaceId))
            .orderBy(desc(activities.createdAt))
            .limit(20);

        // Format time as relative
        const now = Date.now();
        const result = feed.map(a => {
            const diff = now - new Date(a.createdAt!).getTime();
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(hours / 24);
            let time = '';
            if (days > 0) time = `${days} day${days > 1 ? 's' : ''} ago`;
            else if (hours > 0) time = `${hours} hour${hours > 1 ? 's' : ''} ago`;
            else time = 'Just now';

            return { ...a, time };
        });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
