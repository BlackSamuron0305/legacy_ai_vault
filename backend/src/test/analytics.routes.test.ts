import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { signToken } from '../middleware/auth';

let mockSelectResult: any[] = [];
let mockInsertResult: any[] = [];
let mockUpdateResult: any[] = [];
let whereCallCount = 0;
let whereResults: any[][] = [];

vi.mock('../db/drizzle', () => {
    const createFromChain = (resolveWith: () => any[]) => ({
        where: vi.fn().mockImplementation(() => {
            const idx = whereCallCount++;
            return Promise.resolve(whereResults[idx] ?? resolveWith());
        }),
        orderBy: vi.fn().mockImplementation(() => Promise.resolve(resolveWith())),
        groupBy: vi.fn().mockImplementation(() => Promise.resolve(resolveWith())),
    });

    const createJoinChain = (resolveWith: () => any[]) => ({
        where: vi.fn().mockImplementation(() => {
            const idx = whereCallCount++;
            return Promise.resolve(whereResults[idx] ?? resolveWith());
        }),
    });

    return {
        db: {
            select: vi.fn().mockImplementation(() => ({
                from: vi.fn().mockImplementation(() => ({
                    ...createFromChain(() => mockSelectResult),
                    innerJoin: vi.fn().mockReturnValue(createJoinChain(() => mockSelectResult)),
                })),
            })),
            execute: vi.fn().mockResolvedValue({ rows: [] }),
        },
    };
});

vi.mock('../db/schema', () => ({
    users: { id: 'id', workspaceId: 'workspace_id' },
    employees: { id: 'id', workspaceId: 'workspace_id', department: 'department' },
    sessions: { id: 'id', workspaceId: 'workspace_id', status: 'status', employeeId: 'employee_id' },
    knowledgeCards: { sessionId: 'session_id' },
}));

vi.mock('dotenv', () => ({
    default: { config: vi.fn() },
    config: vi.fn(),
}));

import analyticsRoutes from '../routes/analytics.routes';

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/analytics', analyticsRoutes);
    return app;
}

function authHeader() {
    const token = signToken({ sub: 'user-1', email: 'test@example.com' });
    return `Bearer ${token}`;
}

describe('analytics routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSelectResult = [];
        whereCallCount = 0;
        whereResults = [];
    });

    describe('GET /api/analytics/coverage', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/analytics/coverage');
            expect(res.status).toBe(401);
        });

        it('should return 400 if user has no workspace', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: null }]];
            const res = await request(app)
                .get('/api/analytics/coverage')
                .set('Authorization', authHeader());
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/analytics/gaps', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/analytics/gaps');
            expect(res.status).toBe(401);
        });

        it('should return 400 if user has no workspace', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: null }]];
            const res = await request(app)
                .get('/api/analytics/gaps')
                .set('Authorization', authHeader());
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/analytics/summary', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/analytics/summary');
            expect(res.status).toBe(401);
        });

        it('should return 400 if user has no workspace', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: null }]];
            const res = await request(app)
                .get('/api/analytics/summary')
                .set('Authorization', authHeader());
            expect(res.status).toBe(400);
        });
    });
});
