import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { signToken, requireAuth } from '../middleware/auth';

describe('auth middleware', () => {
    describe('signToken', () => {
        it('should create a valid JWT with sub and email', () => {
            const token = signToken({ sub: 'user-123', email: 'test@example.com' });
            expect(token).toBeTruthy();
            expect(typeof token).toBe('string');

            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            expect(decoded.sub).toBe('user-123');
            expect(decoded.email).toBe('test@example.com');
            expect(decoded.exp).toBeDefined();
        });

        it('should set 7-day expiry', () => {
            const token = signToken({ sub: 'user-123', email: 'a@b.com' });
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            const expiresIn = decoded.exp - decoded.iat;
            expect(expiresIn).toBe(7 * 24 * 60 * 60);
        });
    });

    describe('requireAuth', () => {
        function createMockReqRes(authHeader?: string) {
            const req: any = { headers: { authorization: authHeader } };
            const res: any = {
                statusCode: 200,
                body: null,
                status(code: number) { this.statusCode = code; return this; },
                json(data: any) { this.body = data; return this; },
            };
            return { req, res };
        }

        it('should reject requests without Authorization header', () => {
            const { req, res } = createMockReqRes();
            const next = vi.fn();
            requireAuth(req, res, next);
            expect(res.statusCode).toBe(401);
            expect(res.body.error).toContain('Missing');
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject requests with invalid token', () => {
            const { req, res } = createMockReqRes('Bearer invalid-token');
            const next = vi.fn();
            requireAuth(req, res, next);
            expect(res.statusCode).toBe(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should accept valid tokens and set userId', () => {
            const token = signToken({ sub: 'user-456', email: 'test@x.com' });
            const { req, res } = createMockReqRes(`Bearer ${token}`);
            const next = vi.fn();
            requireAuth(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.userId).toBe('user-456');
            expect(req.userEmail).toBe('test@x.com');
        });

        it('should reject expired tokens', () => {
            const token = jwt.sign(
                { sub: 'user-789', email: 'exp@test.com' },
                process.env.JWT_SECRET!,
                { expiresIn: '0s' },
            );
            // Wait a tick for expiry
            const { req, res } = createMockReqRes(`Bearer ${token}`);
            const next = vi.fn();
            requireAuth(req, res, next);
            expect(res.statusCode).toBe(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject Bearer with empty token', () => {
            const { req, res } = createMockReqRes('Bearer ');
            const next = vi.fn();
            requireAuth(req, res, next);
            expect(res.statusCode).toBe(401);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
