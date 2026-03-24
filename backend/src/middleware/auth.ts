import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    userId?: string;
    userEmail?: string;
}

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Missing JWT_SECRET in environment variables');
    }
    return secret;
}

export interface JwtPayload {
    sub: string;   // user id
    email: string;
}

export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
        req.userId = decoded.sub;
        req.userEmail = decoded.email;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
