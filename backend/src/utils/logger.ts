type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelWeight: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

const configuredLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
const minimumLevel = levelWeight[configuredLevel] ? configuredLevel : 'info';

function shouldLog(level: LogLevel): boolean {
    return levelWeight[level] >= levelWeight[minimumLevel];
}

function emit(level: LogLevel, message: string, data?: unknown) {
    if (!shouldLog(level)) return;
    const timestamp = new Date().toISOString();
    const payload = data ? ` ${JSON.stringify(data)}` : '';
    const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${payload}`;

    if (level === 'error') {
        console.error(line);
        return;
    }

    if (level === 'warn') {
        console.warn(line);
        return;
    }

    console.log(line);
}

export function log(message: string, data?: unknown) {
    emit('info', message, data);
}

export function logDebug(message: string, data?: unknown) {
    emit('debug', message, data);
}

export function logWarn(message: string, data?: unknown) {
    emit('warn', message, data);
}

export function logError(message: string, error?: unknown) {
    emit('error', message, error);
}
