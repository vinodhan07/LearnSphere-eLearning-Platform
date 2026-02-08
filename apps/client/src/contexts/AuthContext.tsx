import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role, LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth';
import { login as apiLogin, register as apiRegister, getCurrentUser } from '@/lib/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
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

    const fetchUserProfile = async () => {
        try {
            const { user: userData } = await getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // If token is invalid, clear it
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Check for existing session on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserProfile();
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (data: LoginRequest) => {
        const response = await apiLogin(data);
        localStorage.setItem('token', response.token);
        setUser(response.user);
    }, []);

    const register = useCallback(async (data: RegisterRequest) => {
        const response = await apiRegister(data);
        localStorage.setItem('token', response.token);
        setUser(response.user);
    }, []);

    const logout = useCallback(async () => {
        localStorage.removeItem('token');
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
