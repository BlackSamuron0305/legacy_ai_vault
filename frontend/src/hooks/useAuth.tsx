import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
    workspaceId: string;
    avatarInitials: string;
    workspaceName: string;
    companyName: string;
    domain: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string, companyName: string, domain?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = api.getToken();
        if (token) {
            api.getMe()
                .then(setUser)
                .catch(() => api.setToken(null))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        await api.login(email, password);
        const userData = await api.getMe();
        setUser(userData);
    };

    const register = async (email: string, password: string, fullName: string, companyName: string, domain?: string) => {
        await api.register(email, password, fullName, companyName, domain);
        const userData = await api.getMe();
        setUser(userData);
    };

    const refreshUser = async () => {
        const data = await api.getMe();
        setUser(data);
    };

    const logout = async () => {
        await api.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
