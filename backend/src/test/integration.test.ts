import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';

// Mock ALL database-dependent modules so the server can boot without Postgres
vi.mock('../db/drizzle', () => ({
    db: {
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
                orderBy: vi.fn().mockResolvedValue([]),
            }),
        }),
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([]),
            }),
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([]),
                }),
            }),
        }),
        execute: vi.fn().mockResolvedValue({ rows: [] }),
    },
}));

vi.mock('../db/schema', () => ({
    users: { id: 'id', email: 'email', workspaceId: 'workspace_id' },
    workspaces: { id: 'id', domain: 'domain', name: 'name', companyName: 'company_name' },
    employees: { id: 'id', workspaceId: 'workspace_id', name: 'name', exitDate: 'exit_date' },
    sessions: { id: 'id', employeeId: 'employee_id', createdAt: 'created_at', workspaceId: 'workspace_id' },
    knowledgeEntries: { id: 'id', workspaceId: 'workspace_id' },
    reports: { id: 'id', sessionId: 'session_id' },
    analytics: { id: 'id' },
    activityLog: { id: 'id', workspaceId: 'workspace_id', createdAt: 'created_at' },
    chatMessages: { id: 'id', sessionId: 'session_id' },
    settings: { id: 'id', workspaceId: 'workspace_id', key: 'key', value: 'value' },
    apiKeys: { id: 'id', workspaceId: 'workspace_id' },
    categories: { id: 'id', workspaceId: 'workspace_id' },
    embeddings: { id: 'id' },
}));

vi.mock('../services/elevenlabs.service', () => ({
    getLatestConversationId: vi.fn().mockResolvedValue(null),
}));

vi.mock('../services/embedding.service', () => ({
    generateEmbedding: vi.fn().mockResolvedValue(new Array(384).fill(0)),
}));

vi.mock('../services/hf.service', () => ({
    queryHF: vi.fn().mockResolvedValue('mock response'),
}));

// Prevent dotenv from loading any stale .env
vi.mock('dotenv', () => ({
    default: { config: vi.fn() },
    config: vi.fn(),
}));

let app: any;

beforeAll(async () => {
    const serverModule = await import('../server');
    app = serverModule.default;
});

describe('integration: Express app', () => {
    describe('GET /api/health', () => {
        it('should return 200 with status ok', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.timestamp).toBeDefined();
        });
    });

    describe('security headers', () => {
        it('should include helmet security headers', async () => {
            const res = await request(app).get('/api/health');
            // Helmet sets various security headers
            expect(res.headers['x-content-type-options']).toBe('nosniff');
            expect(res.headers['x-frame-options']).toBeDefined();
        });
    });

    describe('auth endpoints', () => {
        it('POST /api/auth/register — should validate input', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({});
            expect(res.status).toBe(400);
        });

        it('POST /api/auth/login — should validate input', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({});
            expect(res.status).toBe(400);
        });

        it('POST /api/auth/logout — should return success', async () => {
            const res = await request(app)
                .post('/api/auth/logout');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/auth/me — should require auth', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
        });
    });

    describe('protected endpoints require auth', () => {
        const protectedEndpoints = [
            ['GET', '/api/employees'],
            ['POST', '/api/employees'],
            ['GET', '/api/sessions'],
            ['GET', '/api/analytics/overview'],
            ['GET', '/api/activity'],
            ['GET', '/api/settings'],
        ];

        for (const [method, path] of protectedEndpoints) {
            it(`${method} ${path} — should return 401 without token`, async () => {
                const res = method === 'GET'
                    ? await request(app).get(path)
                    : await request(app).post(path).send({});
                expect(res.status).toBe(401);
            });
        }
    });

    describe('404 handling', () => {
        it('should return 404 for unknown API routes', async () => {
            const res = await request(app).get('/api/nonexistent');
            // Express returns 404 by default for unmatched routes
            expect(res.status).toBe(404);
        });
    });

    describe('CORS', () => {
        it('should allow localhost:8080 origin', async () => {
            const res = await request(app)
                .get('/api/health')
                .set('Origin', 'http://localhost:8080');
            expect(res.headers['access-control-allow-origin']).toBe('http://localhost:8080');
        });

        it('should allow localhost:5173 origin', async () => {
            const res = await request(app)
                .get('/api/health')
                .set('Origin', 'http://localhost:5173');
            expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
        });
    });
});
