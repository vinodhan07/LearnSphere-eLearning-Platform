import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role, LoginRequest, RegisterRequest } from '@/types/auth';
import * as api from '@/lib/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    googleLogin: (credential: string) => Promise<void>;
    logout: () => Promise<void>;
    hasRole: (requiredRole: Role) => boolean;
    hasAnyRole: (...roles: Role[]) => boolean;
    hasMinimumRole: (minRole: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<Role, number> = {
    ADMIN: 3,
    INSTRUCTOR: 2,
    LEARNER: 1,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        async function checkAuth() {
            if (api.hasStoredToken()) {
                try {
                    const { user } = await api.getCurrentUser();
                    setUser(user);
                } catch (error) {
                    // Token invalid, clear it
                    api.clearTokens();
                }
            }
            setIsLoading(false);
        }
        checkAuth();
    }, []);

    const login = useCallback(async (data: LoginRequest) => {
        const response = await api.login(data);
        setUser(response.user);
    }, []);

    const register = useCallback(async (data: RegisterRequest) => {
        const response = await api.register(data);
        setUser(response.user);
    }, []);

    const googleLogin = useCallback(async (credential: string) => {
        const response = await api.googleLogin(credential);
        setUser(response.user);
    }, []);

    const logout = useCallback(async () => {
        await api.logout();
        setUser(null);
    }, []);

    const hasRole = useCallback(
        (requiredRole: Role): boolean => {
            return user?.role === requiredRole;
        },
        [user]
    );

    const hasAnyRole = useCallback(
        (...roles: Role[]): boolean => {
            return user ? roles.includes(user.role) : false;
        },
        [user]
    );

    const hasMinimumRole = useCallback(
        (minRole: Role): boolean => {
            if (!user) return false;
            return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
        },
        [user]
    );

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        logout,
        hasRole,
        hasAnyRole,
        hasMinimumRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
