import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { signToken } from '../middleware/auth';

let mockSelectResult: any[] = [];
let whereCallCount = 0;
let whereResults: any[][] = [];

vi.mock('../db/drizzle', () => {
    const createFromChain = (resolveWith: () => any[]) => ({
        where: vi.fn().mockImplementation(() => {
            const idx = whereCallCount++;
            return Promise.resolve(whereResults[idx] ?? resolveWith());
        }),
        orderBy: vi.fn().mockImplementation(() => Promise.resolve(resolveWith())),
    });

    return {
        db: {
            select: vi.fn().mockImplementation(() => ({
                from: vi.fn().mockImplementation(() => createFromChain(() => mockSelectResult)),
            })),
        },
    };
});

vi.mock('../db/schema', () => ({
    users: { id: 'id', workspaceId: 'workspace_id' },
    chatMessages: { id: 'id', sessionId: 'session_id', createdAt: 'created_at' },
    sessions: { id: 'id', workspaceId: 'workspace_id' },
}));

vi.mock('../services/chat.service', () => ({
    askQuestion: vi.fn().mockResolvedValue({ answer: 'Test answer', sources: [] }),
    getChatHistory: vi.fn().mockResolvedValue([]),
}));

let mockWorkspaceId: string | null = 'ws-1';
let mockAuthorizedSession: any = { id: 'session-1', workspaceId: 'ws-1' };

vi.mock('../routes/session.helpers', () => ({
    getWorkspaceId: vi.fn().mockImplementation(() => Promise.resolve(mockWorkspaceId)),
    authorizeSession: vi.fn().mockImplementation(() => Promise.resolve(mockAuthorizedSession)),
}));

vi.mock('dotenv', () => ({
    default: { config: vi.fn() },
    config: vi.fn(),
}));

import chatRoutes from '../routes/chat.routes';

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/chat', chatRoutes);
    return app;
}

function authHeader() {
    const token = signToken({ sub: 'user-1', email: 'test@example.com' });
    return `Bearer ${token}`;
}

describe('chat routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSelectResult = [];
        whereCallCount = 0;
        whereResults = [];
        mockWorkspaceId = 'ws-1';
        mockAuthorizedSession = { id: 'session-1', workspaceId: 'ws-1' };
    });

    describe('POST /api/chat/ask', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app)
                .post('/api/chat/ask')
                .send({ question: 'Hello' });
            expect(res.status).toBe(401);
        });

        it('should return 400 if user has no workspace', async () => {
            const app = createApp();
            mockWorkspaceId = null;
            const res = await request(app)
                .post('/api/chat/ask')
                .set('Authorization', authHeader())
                .send({ question: 'Hello' });
            expect(res.status).toBe(400);
        });

        it('should return answer with valid workspace', async () => {
            const app = createApp();
            const res = await request(app)
                .post('/api/chat/ask')
                .set('Authorization', authHeader())
                .send({ question: 'Hello' });
            expect(res.status).toBe(200);
            expect(res.body.answer).toBe('Test answer');
        });
    });

    describe('GET /api/chat/history/:sessionId', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/chat/history/session-1');
            expect(res.status).toBe(401);
        });

        it('should return history for valid session', async () => {
            const app = createApp();
            const res = await request(app)
                .get('/api/chat/history/session-1')
                .set('Authorization', authHeader());
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('should return 403 for session not in workspace', async () => {
            const app = createApp();
            mockAuthorizedSession = null;
            const res = await request(app)
                .get('/api/chat/history/session-1')
                .set('Authorization', authHeader());
            expect(res.status).toBe(403);
        });
    });
});
