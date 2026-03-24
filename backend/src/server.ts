import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import sessionRoutes from './routes/session.routes';
import knowledgeRoutes from './routes/knowledge.routes';
import reportRoutes from './routes/report.routes';
import analyticsRoutes from './routes/analytics.routes';
import activityRoutes from './routes/activity.routes';
import chatRoutes from './routes/chat.routes';
import settingsRoutes from './routes/settings.routes';
import adminRoutes from './routes/admin.routes';
import { log, logDebug, logError } from './utils/logger';
import { getLatestConversationId } from './services/elevenlabs.service';
import { requireAuth, AuthRequest } from './middleware/auth';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_CUSTOM,
    'http://localhost:8080',
    'http://localhost:5173',
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Request tracing middleware
app.use((req, res, next) => {
    const start = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    (req as any).requestId = requestId;

    log('Incoming request', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
    });

    res.on('finish', () => {
        const durationMs = Date.now() - start;
        log('Completed request', {
            requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
        });
    });

    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

// Serve uploaded files (reports, documents) — auth-protected
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
app.use('/api/files', requireAuth, express.static(UPLOADS_DIR));

// ElevenLabs utility routes
app.get('/api/elevenlabs/latest-conversation', requireAuth, async (req: AuthRequest, res) => {
    try {
        const agentId = (req.query.agent_id as string) || process.env.ELEVENLABS_AGENT_ID;
        if (!agentId) {
            return res.status(503).json({ error: 'No agent_id provided and ELEVENLABS_AGENT_ID not configured' });
        }
        const conversationId = await getLatestConversationId(agentId);
        if (!conversationId) {
            return res.status(404).json({ error: 'No conversations found' });
        }
        return res.json({ conversation_id: conversationId });
    } catch (error: any) {
        log('GET /api/elevenlabs/latest-conversation failed', { error: error?.message || error });
        return res.status(500).json({ error: error?.message || 'Failed to fetch latest conversation' });
    }
});

// Health Check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler — must be after all routes
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logError('Unhandled error', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    log('Backend service started', {
        port: PORT,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5000',
        logLevel: process.env.LOG_LEVEL || 'info',
    });
    logDebug('Startup environment flags', {
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        hasJwtSecret: Boolean(process.env.JWT_SECRET),
    });
});

export default app;
