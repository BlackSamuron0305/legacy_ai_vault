import { describe, it, expect } from 'vitest';
import { log, logDebug, logWarn, logError } from '../utils/logger';

describe('logger', () => {
    it('should export all log functions', () => {
        expect(typeof log).toBe('function');
        expect(typeof logDebug).toBe('function');
        expect(typeof logWarn).toBe('function');
        expect(typeof logError).toBe('function');
    });

    it('should not throw when called with data', () => {
        expect(() => log('test message', { key: 'value' })).not.toThrow();
        expect(() => logDebug('debug msg')).not.toThrow();
        expect(() => logWarn('warn msg', 42)).not.toThrow();
        expect(() => logError('error msg', new Error('test'))).not.toThrow();
    });

    it('should not throw when called without data', () => {
        expect(() => log('just a message')).not.toThrow();
        expect(() => logError('error without data')).not.toThrow();
    });

    it('should handle Error objects in logError', () => {
        const err = new Error('test error');
        err.stack = 'fake-stack';
        expect(() => logError('something failed', err)).not.toThrow();
    });

    it('should handle non-Error objects in logError', () => {
        expect(() => logError('string error', 'just a string')).not.toThrow();
        expect(() => logError('number error', 404)).not.toThrow();
    });
});
