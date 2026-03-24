import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

// Mock the api module
vi.mock('../lib/api', () => ({
    api: {
        getToken: vi.fn(),
        setToken: vi.fn(),
        getMe: vi.fn(),
        login: vi.fn(),
        register: vi.fn(),
        joinCompany: vi.fn(),
        logout: vi.fn(),
    },
}));

function createWrapper() {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(AuthProvider, null, children);
    };
}

describe('useAuth hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should throw when used outside AuthProvider', () => {
        expect(() => {
            renderHook(() => useAuth());
        }).toThrow('useAuth must be used within an AuthProvider');
    });

    it('should start with loading=true and user=null', () => {
        (api.getToken as any).mockReturnValue(null);
        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
        // Initially user is null
        expect(result.current.user).toBeNull();
    });

    it('should set loading=false when no token exists', async () => {
        (api.getToken as any).mockReturnValue(null);
        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(result.current.user).toBeNull();
    });

    it('should fetch user profile when token exists', async () => {
        const mockUser = { id: '1', email: 'test@x.com', fullName: 'Test', role: 'admin' };
        (api.getToken as any).mockReturnValue('valid-token');
        (api.getMe as any).mockResolvedValue(mockUser);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(result.current.user).toEqual(mockUser);
    });

    it('should clear token when getMe fails', async () => {
        (api.getToken as any).mockReturnValue('expired-token');
        (api.getMe as any).mockRejectedValue(new Error('Unauthorized'));

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(api.setToken).toHaveBeenCalledWith(null);
        expect(result.current.user).toBeNull();
    });

    it('should expose login, register, logout, joinCompany functions', async () => {
        (api.getToken as any).mockReturnValue(null);
        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(typeof result.current.login).toBe('function');
        expect(typeof result.current.register).toBe('function');
        expect(typeof result.current.logout).toBe('function');
        expect(typeof result.current.joinCompany).toBe('function');
        expect(typeof result.current.refreshUser).toBe('function');
    });
});
