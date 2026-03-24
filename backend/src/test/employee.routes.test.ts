import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { signToken } from '../middleware/auth';

// Shared mock state
let mockSelectResult: any[] = [];
let mockInsertResult: any[] = [];
let mockUpdateResult: any[] = [];

// Track where() calls so tests can provide different results per query
let whereCallCount = 0;
let whereResults: any[][] = [];

vi.mock('../db/drizzle', () => {
    const createChain = (resolveWith: () => any[]) => ({
        from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
                const idx = whereCallCount++;
                return Promise.resolve(whereResults[idx] ?? resolveWith());
            }),
            orderBy: vi.fn().mockImplementation(() => Promise.resolve(resolveWith())),
        }),
    });

    return {
        db: {
            select: vi.fn().mockImplementation(() => createChain(() => mockSelectResult)),
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
        },
    };
});

vi.mock('../db/schema', () => ({
    employees: { id: 'id', workspaceId: 'workspace_id', name: 'name' },
    users: { id: 'id', workspaceId: 'workspace_id' },
    sessions: { employeeId: 'employee_id', createdAt: 'created_at' },
}));

import employeeRoutes from '../routes/employee.routes';

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/employees', employeeRoutes);
    return app;
}

function authHeader() {
    const token = signToken({ sub: 'user-1', email: 'test@example.com' });
    return `Bearer ${token}`;
}

describe('employee routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSelectResult = [];
        mockInsertResult = [];
        mockUpdateResult = [];
        whereCallCount = 0;
        whereResults = [];
    });

    describe('GET /api/employees', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/employees');
            expect(res.status).toBe(401);
        });

        it('should return 400 if user has no workspace', async () => {
            const app = createApp();
            // First where() call returns user with no workspace
            whereResults = [[{ id: 'user-1', workspaceId: null }]];

            const res = await request(app)
                .get('/api/employees')
                .set('Authorization', authHeader());
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('workspace');
        });
    });

    describe('POST /api/employees', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app)
                .post('/api/employees')
                .send({ name: 'John Doe', role: 'Engineer' });
            expect(res.status).toBe(401);
        });

        it('should create employee with valid data', async () => {
            const app = createApp();
            whereResults = [[{ id: 'user-1', workspaceId: 'ws-1' }]];
            mockInsertResult = [{
                id: 'emp-1',
                workspaceId: 'ws-1',
                name: 'John Doe',
                role: 'Engineer',
                department: 'Engineering',
                avatarInitials: 'JD',
                riskLevel: 'medium',
            }];

            const res = await request(app)
                .post('/api/employees')
                .set('Authorization', authHeader())
                .send({ name: 'John Doe', role: 'Engineer', department: 'Engineering' });
            expect(res.status).toBe(201);
            expect(res.body.name).toBe('John Doe');
        });
    });

    describe('GET /api/employees/:id', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app).get('/api/employees/emp-1');
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/employees/:id', () => {
        it('should reject unauthenticated requests', async () => {
            const app = createApp();
            const res = await request(app)
                .put('/api/employees/emp-1')
                .send({ name: 'Updated Name' });
            expect(res.status).toBe(401);
        });
    });
});
