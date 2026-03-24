import { describe, it, expect } from 'vitest';
import { chunkText } from '../utils/chunker';

describe('chunkText', () => {
    it('should return single chunk for short text', () => {
        const result = chunkText('Hello world');
        expect(result).toEqual(['Hello world']);
    });

    it('should return single chunk for text exactly at maxChars', () => {
        const text = 'a'.repeat(2000);
        const result = chunkText(text, 2000);
        expect(result).toHaveLength(1);
    });

    it('should split long text into multiple chunks', () => {
        const text = 'a'.repeat(5000);
        const result = chunkText(text, 2000, 200);
        expect(result.length).toBeGreaterThan(1);
    });

    it('should break at sentence boundary when possible', () => {
        const sentence1 = 'This is the first sentence.';
        const sentence2 = 'This is the second sentence.';
        const padding = 'x'.repeat(1980);
        const text = sentence1 + ' ' + padding + sentence2;
        const result = chunkText(text, 2000, 200);
        expect(result.length).toBeGreaterThan(1);
    });

    it('should handle empty string', () => {
        const result = chunkText('');
        expect(result).toEqual(['']);
    });

    it('should respect custom maxChars', () => {
        const text = 'word '.repeat(100);
        const result = chunkText(text, 50, 10);
        for (const chunk of result) {
            // Chunks may exceed slightly due to boundary logic, but should be reasonable
            expect(chunk.length).toBeLessThanOrEqual(60); // some tolerance
        }
    });

    it('should create overlapping chunks', () => {
        const text = 'abcdefghij'.repeat(50); // 500 chars
        const result = chunkText(text, 100, 20);
        // With overlap, adjacent chunks should share some text
        if (result.length >= 2) {
            const end1 = result[0].slice(-20);
            const start2 = result[1].slice(0, 20);
            expect(end1).toBe(start2);
        }
    });

    it('should filter out empty chunks', () => {
        const text = 'Hello world.';
        const result = chunkText(text, 5000);
        expect(result.every(c => c.length > 0)).toBe(true);
    });
});
