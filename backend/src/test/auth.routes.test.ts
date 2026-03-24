import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock the database module before importing routes
vi.mock('../db/drizzle', () => {
    const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
    };
    return { db: mockDb };
});

vi.mock('../db/schema', () => ({
    users: { id: 'id', email: 'email', workspaceId: 'workspace_id' },
    workspaces: { id: 'id', domain: 'domain' },
}));

import { db } from '../db/drizzle';
import authRoutes from '../routes/auth.routes';

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    return app;
}

describe('auth routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should reject missing email', async () => {
            const app = createApp();
            const res = await request(app)
                .post('/api/auth/register')
                .send({ password: 'testpass123', fullName: 'Test User' });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('email');
        });

        it('should reject missing password', async () => {
            const app = createApp();
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com', fullName: 'Test User' });
            expect(res.status).toBe(400);
        });

        it('should reject missing fullName', async () => {
            const app = createApp();
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com', password: 'testpass123' });
            expect(res.status).toBe(400);
        });

        it('should reject short passwords', async () => {
            const app = createApp();
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com', password: 'short', fullName: 'Test User' });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('8 characters');
        });

        it('should reject duplicate email', async () => {
            const app = createApp();
            // Mock: user already exists
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ id: 'existing-user', email: 'test@example.com' }]),
                }),
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com', password: 'testpass123', fullName: 'Test User' });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('already registered');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should reject missing email', async () => {
            const app = createApp();
            const res = await request(app)
                .post('/api/auth/login')
                .send({ password: 'testpass123' });
            expect(res.status).toBe(400);
        });

        it('should reject missing password', async () => {
            const app = createApp();
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com' });
            expect(res.status).toBe(400);
        });

        it('should reject unknown email', async () => {
            const app = createApp();
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([]),
                }),
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'unknown@example.com', password: 'testpass123' });
            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Invalid');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should return success', async () => {
            const app = createApp();
            const res = await request(app).post('/api/auth/logout');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
        });
    });
});
