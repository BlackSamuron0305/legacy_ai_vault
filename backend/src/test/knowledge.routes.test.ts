import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { signToken } from '../middleware/auth';

let mockSelectResult: any[] = [];
let mockInsertResult: any[] = [];
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
        leftJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockImplementation(() => {
                    const idx = whereCallCount++;
                    return Promise.resolve(whereResults[idx] ?? resolveWith());
                }),
            }),
            where: vi.fn().mockImplementation(() => {
                const idx = whereCallCount++;
                return Promise.resolve(whereResults[idx] ?? resolveWith());
            }),
        }),
        innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
                const idx = whereCallCount++;
                return Promise.resolve(whereResults[idx] ?? resolveWith());
            }),
            groupBy: vi.fn().mockImplementation(() => Promise.resolve(resolveWith())),
        }),
    });

    return {
        db: {
            select: vi.fn().mockImplementation(() => ({
                from: vi.fn().mockImplementation(() => createFromChain(() => mockSelectResult)),
            })),
            insert: vi.fn().mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockImplementation(() => Promise.resolve(mockInsertResult)),
                }),
            }),
            execute: vi.fn().mockResolvedValue([]),
        },
    };
});

vi.mock('../db/schema', () => ({
    users: { id: 'id', workspaceId: 'workspace_id' },
    employees: { id: 'id', name: 'name', department: 'department', workspaceId: 'workspace_id' },
    sessions: { id: 'id', workspaceId: 'workspace_id' },
    knowledgeCards: { id: 'id', sessionId: 'session_id', employeeId: 'employee_id', category: 'category' },
    knowledgeCategories: { id: 'id', workspaceId: 'workspace_id', name: 'name' },
    documents: { id: 'id', workspaceId: 'workspace_id', createdAt: 'created_at' },
}));

vi.mock('../services/embedding.service', () => ({
    createEmbedding: vi.fn().mockResolvedValue(new Array(384).fill(0)),
}));

vi.mock('../services/hf.service', () => ({
    createHfChatCompletion: vi.fn().mockResolvedValue('{"cards":[]}'),
}));

vi.mock('dotenv', () => ({
    default: { config: vi.fn() },
    config: vi.fn(),
}));

import knowledgeRoutes from '../routes/knowledge.routes';

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/knowledge', knowledgeRoutes);
    return app;
}

function authHeader() {
    const token = signToken({ sub: 'user-1', email: 'test@example.com' });
    return `Bearer ${token}`;
}

describe('knowledge routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSelectResult = [];
        mockInsertResult = [];
        whereCallCount = 0;
        whereResults = [];
    });

    describe('GET /api/knowledge/categories', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/knowledge/categories');
            expect(res.status).toBe(401);
        });

        it('should return 400 if user has no workspace', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: null }]];
            const res = await request(app)
                .get('/api/knowledge/categories')
                .set('Authorization', authHeader());
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/knowledge/cards', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/knowledge/cards');
            expect(res.status).toBe(401);
        });

        it('should return 400 if user has no workspace', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: null }]];
            const res = await request(app)
                .get('/api/knowledge/cards')
                .set('Authorization', authHeader());
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/knowledge/stats', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/knowledge/stats');
            expect(res.status).toBe(401);
        });

        it('should return 400 if user has no workspace', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: null }]];
            const res = await request(app)
                .get('/api/knowledge/stats')
                .set('Authorization', authHeader());
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/knowledge/documents', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/knowledge/documents');
            expect(res.status).toBe(401);
        });

        it('should return 400 if user has no workspace', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: null }]];
            const res = await request(app)
                .get('/api/knowledge/documents')
                .set('Authorization', authHeader());
            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/knowledge/search', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app)
                .post('/api/knowledge/search')
                .send({ query: 'test' });
            expect(res.status).toBe(401);
        });

        it('should return 400 if user has no workspace', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: null }]];
            const res = await request(app)
                .post('/api/knowledge/search')
                .set('Authorization', authHeader())
                .send({ query: 'test' });
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/knowledge/:categoryName', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/knowledge/Engineering');
            expect(res.status).toBe(401);
        });

        it('should return 400 if user has no workspace', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: null }]];
            const res = await request(app)
                .get('/api/knowledge/Engineering')
                .set('Authorization', authHeader());
            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/knowledge/:categoryName/chat', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app)
                .post('/api/knowledge/Engineering/chat')
                .send({ question: 'What is this?' });
            expect(res.status).toBe(401);
        });

        it('should return 400 if user has no workspace', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: null }]];
            const res = await request(app)
                .post('/api/knowledge/Engineering/chat')
                .set('Authorization', authHeader())
                .send({ question: 'What is this?' });
            expect(res.status).toBe(400);
        });
    });
});
