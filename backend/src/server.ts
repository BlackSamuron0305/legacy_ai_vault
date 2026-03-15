import express from 'express';
import cors from 'cors';
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
import { log, logDebug } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
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

// ElevenLabs utility proxy routes (to AI service)
app.get('/api/elevenlabs/latest-conversation', async (_req, res) => {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    try {
        const response = await fetch(`${aiServiceUrl}/api/elevenlabs/latest-conversation`);
        const body = await response.text();

        // Try to parse JSON, but fall back to raw text if needed
        let json: any;
        try {
            json = JSON.parse(body);
        } catch {
            json = { error: body || 'Unexpected response from AI service' };
        }

        if (!response.ok) {
            return res.status(response.status).json(json);
        }

        return res.json(json);
    } catch (error: any) {
        log('Proxy /api/elevenlabs/latest-conversation failed', {
            error: error?.message || error,
            aiServiceUrl,
        });
        return res.status(502).json({ error: 'Failed to reach AI service for latest conversation' });
    }
});

// Health Check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
        hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
        hasSupabaseServiceKey: Boolean(process.env.SUPABASE_SERVICE_KEY),
    });
});

export default app;
