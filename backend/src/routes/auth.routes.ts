import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { db } from '../db/drizzle';
import { users, workspaces } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, fullName, companyName } = req.body;

        // Create Supabase auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        // Create workspace
        const [workspace] = await db.insert(workspaces).values({
            name: companyName || `${fullName}'s Workspace`,
            companyName,
        }).returning();

        // Create user profile
        const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        await db.insert(users).values({
            id: authData.user.id,
            email,
            fullName,
            role: 'admin',
            workspaceId: workspace.id,
            avatarInitials: initials,
        });

        // Sign in to get token
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            return res.status(400).json({ error: signInError.message });
        }

        res.json({
            user: { id: authData.user.id, email, fullName, role: 'admin', workspaceId: workspace.id, avatarInitials: initials },
            session: signInData.session,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return res.status(401).json({ error: error.message });
        }

        // Get user profile
        const [userProfile] = await db.select().from(users).where(eq(users.id, data.user.id));

        res.json({
            user: userProfile,
            session: data.session,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            await supabase.auth.admin.signOut(authHeader.slice(7));
        }
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/auth/me — get current user profile
router.get('/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { data: { user }, error } = await supabase.auth.getUser(authHeader.slice(7));
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const [userProfile] = await db.select().from(users).where(eq(users.id, user.id));
        if (!userProfile) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        res.json(userProfile);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
