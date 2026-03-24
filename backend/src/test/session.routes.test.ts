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
    });

    const createJoinChain = (resolveWith: () => any[]) => ({
        where: vi.fn().mockImplementation(() => {
            const idx = whereCallCount++;
            return Promise.resolve(whereResults[idx] ?? resolveWith());
        }),
        orderBy: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
                const idx = whereCallCount++;
                return Promise.resolve(whereResults[idx] ?? resolveWith());
            }),
        }),
    });

    return {
        db: {
            select: vi.fn().mockImplementation(() => ({
                from: vi.fn().mockImplementation(() => ({
                    ...createFromChain(() => mockSelectResult),
                    leftJoin: vi.fn().mockReturnValue(createJoinChain(() => mockSelectResult)),
                    innerJoin: vi.fn().mockReturnValue(createJoinChain(() => mockSelectResult)),
                })),
            })),
            insert: vi.fn().mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockImplementation(() => Promise.resolve(mockInsertResult)),
                }),
            }),
            update: vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockImplementation(() => Promise.resolve(mockUpdateResult)),
                    }),
                }),
            }),
            delete: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined),
            }),
        },
    };
});

vi.mock('../db/schema', () => ({
    users: { id: 'id', workspaceId: 'workspace_id' },
    employees: { id: 'id', workspaceId: 'workspace_id', name: 'name' },
    sessions: { id: 'id', employeeId: 'employee_id', workspaceId: 'workspace_id', createdAt: 'created_at', lastActivity: 'last_activity', status: 'status' },
    activities: { id: 'id', workspaceId: 'workspace_id' },
    transcriptSegments: { sessionId: 'session_id', orderIndex: 'order_index' },
    knowledgeCards: { sessionId: 'session_id' },
}));

vi.mock('../services/extraction.service', () => ({
    extractKnowledge: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/webhook.service', () => ({
    sendToMakeWebhook: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/elevenlabs.service', () => ({
    getLatestConversationId: vi.fn().mockResolvedValue(null),
    getConversationTranscript: vi.fn().mockResolvedValue(null),
}));

vi.mock('dotenv', () => ({
    default: { config: vi.fn() },
    config: vi.fn(),
}));

import sessionRoutes from '../routes/session.routes';

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/sessions', sessionRoutes);
    return app;
}

function authHeader() {
    const token = signToken({ sub: 'user-1', email: 'test@example.com' });
    return `Bearer ${token}`;
}

describe('session routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSelectResult = [];
        mockInsertResult = [];
        mockUpdateResult = [];
        whereCallCount = 0;
        whereResults = [];
    });

    describe('GET /api/sessions', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/sessions');
            expect(res.status).toBe(401);
        });

        it('should return 400 if user has no workspace', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: null }]];
            const res = await request(app)
                .get('/api/sessions')
                .set('Authorization', authHeader());
            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/sessions', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app)
                .post('/api/sessions')
                .send({ employeeId: 'emp-1' });
            expect(res.status).toBe(401);
        });

        it('should require employeeId', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: 'ws-1' }]];
            const res = await request(app)
                .post('/api/sessions')
                .set('Authorization', authHeader())
                .send({});
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('employeeId');
        });

        it('should create session with valid data', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: 'ws-1' }]];
            mockInsertResult = [{
                id: 'sess-1',
                workspaceId: 'ws-1',
                employeeId: 'emp-1',
                status: 'scheduled',
            }];
            mockSelectResult = [{ id: 'emp-1', name: 'Jane' }];

            const res = await request(app)
                .post('/api/sessions')
                .set('Authorization', authHeader())
                .send({ employeeId: 'emp-1' });
            expect(res.status).toBe(201);
            expect(res.body.status).toBe('scheduled');
        });
    });

    describe('POST /api/sessions/:id/start', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).post('/api/sessions/sess-1/start');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/sessions/:id/end', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).post('/api/sessions/sess-1/end');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/sessions/:id/pause', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).post('/api/sessions/sess-1/pause');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/sessions/:id/resume', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).post('/api/sessions/sess-1/resume');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/sessions/:id/token', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/sessions/sess-1/token');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/sessions/:id/transcript', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/sessions/sess-1/transcript');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/sessions/:id/transcript/segment', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app)
                .post('/api/sessions/sess-1/transcript/segment')
                .send({ speaker: 'ai', text: 'Hello' });
            expect(res.status).toBe(401);
        });
    });
});
