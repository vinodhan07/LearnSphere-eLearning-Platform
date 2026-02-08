import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role, LoginRequest, RegisterRequest } from '@/types/auth';
import { supabase } from '@/lib/supabase';

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

    const fetchUserProfile = async (uid: string) => {
        const { data, error } = await supabase
            .from('User')
            .select('*')
            .eq('id', uid)
            .maybeSingle();

        if (error) {
            console.error('Error fetching user profile:', error.message);
            return null;
        }
        return data as User | null;
    };

    // Check for existing session on mount
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchUserProfile(session.user.id).then(profile => {
                    setUser(profile);
                    setIsLoading(false);
                });
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                const profile = await fetchUserProfile(session.user.id);
                setUser(profile);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = useCallback(async (data: LoginRequest) => {
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) throw error;
        // User state will be updated by onAuthStateChange listener
    }, []);

    const register = useCallback(async (data: RegisterRequest) => {
        // Sign up user via Supabase Auth
        // The public.User profile is created automatically via Supabase database trigger
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    name: data.name,
                }
            }
        });

        if (authError || !authData.user) throw authError || new Error('Auth signup failed');

        // setUser will be called by onAuthStateChange listener
    }, []);

    const googleLogin = useCallback(async (credential: string) => {
        // This assumes the frontend is handling the Google OAuth flow 
        // and calling this with the result. For Supabase, we typically use 
        // signInWithOAuth. If using a specific credential (ID Token), we use:
        const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: credential,
        });

        if (error) throw error;
    }, []);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
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
