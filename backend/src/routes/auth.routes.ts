import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db/drizzle';
import { users, workspaces } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, AuthRequest, signToken } from '../middleware/auth';
import { log, logError } from '../utils/logger';

const router = Router();

const BCRYPT_ROUNDS = 12;

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, fullName, companyName, domain: explicitDomain } = req.body;
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'email, password, and fullName are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        const emailDomain = email.split('@')[1]?.toLowerCase();

        // Check if email is already taken
        const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Check if a workspace with this email domain already exists
        let workspace = null;
        let userRole = 'viewer';
        const [existingWs] = emailDomain
            ? await db.select().from(workspaces).where(eq(workspaces.domain, emailDomain))
            : [];

        if (existingWs && !explicitDomain) {
            workspace = existingWs;
            userRole = 'member';
        } else if (explicitDomain) {
            const [newWs] = await db.insert(workspaces).values({
                name: companyName || `${fullName}'s Workspace`,
                companyName,
                domain: explicitDomain.toLowerCase(),
            }).returning();
            workspace = newWs;
            userRole = 'owner';
        }

        const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        const [newUser] = await db.insert(users).values({
            email: email.toLowerCase(),
            passwordHash,
            fullName,
            role: userRole,
            workspaceId: workspace?.id || null,
            avatarInitials: initials,
        }).returning();

        const accessToken = signToken({ sub: newUser.id, email: newUser.email });

        log('User registered', { userId: newUser.id, role: userRole });
        res.json({
            user: { id: newUser.id, email: newUser.email, fullName, role: userRole, workspaceId: workspace?.id || null, avatarInitials: initials },
            session: { access_token: accessToken },
        });
    } catch (error: any) {
        logError('Register failed', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        const [userRow] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
        if (!userRow) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const valid = await bcrypt.compare(password, userRow.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const accessToken = signToken({ sub: userRow.id, email: userRow.email });

        const { passwordHash: _ph, ...userProfile } = userRow;
        log('User logged in', { userId: userRow.id });
        res.json({
            user: userProfile,
            session: { access_token: accessToken },
        });
    } catch (error: any) {
        logError('Login failed', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/logout
router.post('/logout', async (_req: Request, res: Response) => {
    // With stateless JWTs there is no server-side session to revoke.
    // Client discards the token.
    res.json({ success: true });
});

// GET /api/auth/me — get current user profile with workspace
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const [userRow] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!userRow) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        let workspaceName = '';
        let companyName = '';
        let domain = '';
        if (userRow.workspaceId) {
            const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, userRow.workspaceId));
            workspaceName = ws?.name || '';
            companyName = ws?.companyName || ws?.name || '';
            domain = ws?.domain || '';
        }

        const { passwordHash: _ph, ...profile } = userRow;
        res.json({ ...profile, workspaceName, companyName, domain });
    } catch (error: any) {
        logError('Get profile failed', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/auth/profile — update profile (fullName, avatarInitials)
router.put('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { fullName } = req.body;
        const initials = fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        const [updated] = await db.update(users)
            .set({ fullName, avatarInitials: initials })
            .where(eq(users.id, req.userId!))
            .returning();
        const { passwordHash: _ph, ...profile } = updated;
        log('Profile updated', { userId: req.userId });
        res.json(profile);
    } catch (error: any) {
        logError('Update profile failed', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/join-company — join a company by email domain
router.post('/join-company', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const [userRow] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (userRow.workspaceId) {
            return res.status(400).json({ error: 'You are already in a workspace' });
        }

        const emailDomain = userRow.email.split('@')[1]?.toLowerCase();
        if (!emailDomain) {
            return res.status(400).json({ error: 'Could not determine email domain' });
        }

        const [ws] = await db.select().from(workspaces).where(eq(workspaces.domain, emailDomain));
        if (!ws) {
            return res.status(404).json({ error: `No company found for @${emailDomain}. Ask your company admin to register the company first.` });
        }

        const [updated] = await db.update(users)
            .set({ workspaceId: ws.id, role: 'member' })
            .where(eq(users.id, req.userId!))
            .returning();

        const { passwordHash: _ph, ...profile } = updated;
        log('User joined company', { userId: req.userId, workspaceId: ws.id });
        res.json({ ...profile, workspaceName: ws.name, companyName: ws.companyName || ws.name, domain: ws.domain });
    } catch (error: any) {
        logError('Join company failed', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/auth/workspace — update workspace name
router.put('/workspace', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { companyName } = req.body;
        const [userRow] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!userRow.workspaceId) return res.status(400).json({ error: 'No workspace found' });
        if (userRow.role !== 'admin' && userRow.role !== 'owner') return res.status(403).json({ error: 'Company access required' });
        const [updated] = await db.update(workspaces)
            .set({ name: companyName, companyName })
            .where(eq(workspaces.id, userRow.workspaceId!))
            .returning();
        log('Workspace updated', { workspaceId: userRow.workspaceId });
        res.json(updated);
    } catch (error: any) {
        logError('Update workspace failed', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
