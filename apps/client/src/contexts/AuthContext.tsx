import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role, LoginRequest, RegisterRequest } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

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
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserProfile = async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from('User')
                .select('*')
                .eq('id', uid)
                .maybeSingle();

            if (error) {
                console.error('[AuthContext] Error fetching user profile:', error.message);
                return null;
            }

            if (!data && uid) {
                console.warn('[AuthContext] Profile missing for user, attempting fallback creation...');
                // Fallback: Create profile if trigger failed
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    const { data: newProfile, error: createError } = await supabase
                        .from('User')
                        .insert({
                            id: authUser.id,
                            email: authUser.email,
                            password: 'SUPABASE_AUTH',
                            name: authUser.user_metadata?.name || 'User',
                            role: authUser.user_metadata?.role || 'LEARNER',
                            totalPoints: 0,
                            updatedAt: new Date().toISOString()
                        })
                        .select()
                        .maybeSingle();

                    if (!createError) {
                        console.log('[AuthContext] Fallback profile created:', newProfile?.email);
                        return newProfile as User;
                    }
                    console.error('[AuthContext] Fallback profile creation failed:', createError.message);
                }
            }

            console.log('[AuthContext] Profile fetched successfully:', data?.email);
            return data as User | null;
        } catch (err: any) {
            console.warn('[AuthContext] Profile fetch failed:', err.message);
            return null;
        }
    };

    // Check for existing session on mount
    useEffect(() => {
        const initAuth = async () => {
            console.log('[AuthContext] Initializing auth...');
            try {
                console.log('[AuthContext] Getting session from Supabase...');
                const { data: { session } } = await supabase.auth.getSession();
                console.log('[AuthContext] Session found:', !!session);

                setSession(session);
                if (session) {
                    const profile = await fetchUserProfile(session.user.id);
                    setUser(profile);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('[AuthContext] Auth initialization error:', error);
                setSession(null);
                setUser(null);
            } finally {
                console.log('[AuthContext] Initialization complete, setting isLoading to false');
                setIsLoading(false);
            }
        };

        const initPromise = initAuth();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[AuthContext] Auth state changed: ${event}`, !!session);

            // Set session immediately so UI can react (e.g. GuestRoute redirects)
            setSession(session);

            if (session) {
                // If we have a session, we must ensure we have a profile
                // We keep isLoading true while fetching the profile to prevent premature redirection by ProtectedRoutes
                setIsLoading(true);
                try {
                    const profile = await fetchUserProfile(session.user.id);
                    setUser(profile);
                } catch (error) {
                    console.error('[AuthContext] Auth change profile fetch error:', error);
                } finally {
                    console.log('[AuthContext] Auth change handled, setting isLoading to false');
                    setIsLoading(false);
                }
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = useCallback(async (data: LoginRequest) => {
        console.log('[AuthContext] Attempting login for:', data.email);
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) {
            console.error('[AuthContext] Login error:', error.message);
            throw error;
        }
        console.log('[AuthContext] Login call successful');
    }, []);

    const register = useCallback(async (data: RegisterRequest) => {
        console.log('[AuthContext] Attempting registration for:', data.email);
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
    }, []);

    const googleLogin = useCallback(async (credential: string) => {
        const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: credential,
        });

        if (error) throw error;
    }, []);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setSession(null);
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
        isAuthenticated: !!session, // Decoupled from user profile
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
