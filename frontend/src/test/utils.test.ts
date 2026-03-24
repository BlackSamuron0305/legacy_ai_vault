import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('cn (classname merge)', () => {
    it('should merge simple class strings', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
        expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
    });

    it('should resolve tailwind conflicts', () => {
        const result = cn('px-2 py-1', 'px-4');
        expect(result).toContain('px-4');
        expect(result).not.toContain('px-2');
    });

    it('should handle empty input', () => {
        expect(cn()).toBe('');
    });

    it('should handle undefined and null', () => {
        expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });

    it('should handle array input', () => {
        expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle object input', () => {
        expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });
});
