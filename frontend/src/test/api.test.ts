import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to mock the localStorage and import.meta.env before importing
const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
})();

Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(global, 'window', {
    value: { location: mockLocation, localStorage: mockLocalStorage },
    writable: true,
});

import { api } from '../lib/api';

describe('ApiClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.clear();
        mockLocation.href = '';
        // Reset internal token state
        api.setToken(null);
    });

    describe('token management', () => {
        it('should store token in localStorage', () => {
            api.setToken('test-token-123');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'test-token-123');
        });

        it('should clear token from localStorage', () => {
            api.setToken(null);
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
        });

        it('should retrieve token from localStorage', () => {
            mockLocalStorage.getItem.mockReturnValue('stored-token');
            api.setToken(null); // clear internal cache
            const token = api.getToken();
            expect(token).toBe('stored-token');
        });
    });

    describe('login', () => {
        it('should send credentials and store the token', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    user: { id: '1', email: 'test@example.com' },
                    session: { access_token: 'jwt-token' },
                }),
            });

            const result = await api.login('test@example.com', 'password123');
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(result.session.access_token).toBe('jwt-token');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'jwt-token');
        });

        it('should throw on 401 errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ error: 'Invalid credentials' }),
            });

            await expect(api.login('bad@example.com', 'wrong')).rejects.toThrow('Unauthorized');
        });
    });

    describe('register', () => {
        it('should send registration data', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    user: { id: '2', email: 'new@example.com', fullName: 'New User' },
                    session: { access_token: 'new-jwt' },
                }),
            });

            const result = await api.register('new@example.com', 'password123', 'New User');
            expect(result.user.fullName).toBe('New User');
        });
    });

    describe('logout', () => {
        it('should clear token on logout', async () => {
            api.setToken('existing-token');
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ success: true }),
            });

            await api.logout();
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
        });
    });

    describe('authenticated requests', () => {
        it('should include Authorization header when token is set', async () => {
            api.setToken('my-token');
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ id: '1', email: 'test@example.com' }),
            });

            await api.getMe();
            const [, options] = mockFetch.mock.calls[0];
            expect(options.headers['Authorization']).toBe('Bearer my-token');
        });

        it('should handle non-JSON error responses gracefully', async () => {
            api.setToken('my-token');
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => { throw new Error('not json'); },
            });

            await expect(api.getMe()).rejects.toThrow();
        });
    });
});
