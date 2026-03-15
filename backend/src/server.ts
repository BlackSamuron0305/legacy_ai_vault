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
import { getLatestConversationId } from './services/elevenlabs.service';

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

// ElevenLabs utility routes
app.get('/api/elevenlabs/latest-conversation', async (req, res) => {
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
