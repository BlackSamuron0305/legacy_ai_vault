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
import { log, logDebug } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:8080',
        'http://localhost:5173',
    ],
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
