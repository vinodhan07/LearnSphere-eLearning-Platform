import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/auth';

/** In DEV, skip loading spinner after this ms to avoid infinite spinner if Supabase never responds */
const DEV_LOADING_TIMEOUT_MS = 2000;

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** Minimum role required (uses hierarchy: ADMIN > INSTRUCTOR > LEARNER) */
    minRole?: Role;
    /** Specific roles allowed (bypasses hierarchy) */
    allowedRoles?: Role[];
    /** Path to redirect to if not authenticated */
    redirectTo?: string;
}

/**
 * Wrapper component to protect routes based on authentication and role
 */
export function ProtectedRoute({
    children,
    minRole,
    allowedRoles,
    redirectTo = '/login',
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, hasMinimumRole, hasAnyRole } = useAuth();
    const location = useLocation();
    const [devTimeoutReached, setDevTimeoutReached] = useState(false);

    // In DEV, skip loading after timeout so we don't get infinite spinner if Supabase never responds
    useEffect(() => {
        if (!isLoading) {
            setDevTimeoutReached(false);
            return;
        }
        if (!import.meta.env.DEV) return;
        const t = setTimeout(() => setDevTimeoutReached(true), DEV_LOADING_TIMEOUT_MS);
        return () => clearTimeout(t);
    }, [isLoading]);

    const showSpinner = isLoading && !(import.meta.env.DEV && devTimeoutReached);

    // Show nothing while checking auth status
    if (showSpinner) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
    }

    // Check role requirements
    if (allowedRoles && !hasAnyRole(...allowedRoles)) {
        return <Navigate to="/" replace />;
    }

    if (minRole && !hasMinimumRole(minRole)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

/**
 * Wrapper for guest-only routes (login, register)
 * Redirects authenticated users away
 */
export function GuestRoute({
    children,
    redirectTo = '/',
}: {
    children: React.ReactNode;
    redirectTo?: string;
}) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    const [devTimeoutReached, setDevTimeoutReached] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setDevTimeoutReached(false);
            return;
        }
        if (!import.meta.env.DEV) return;
        const t = setTimeout(() => setDevTimeoutReached(true), DEV_LOADING_TIMEOUT_MS);
        return () => clearTimeout(t);
    }, [isLoading]);

    const showSpinner = isLoading && !(import.meta.env.DEV && devTimeoutReached);

    if (showSpinner) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        // Redirect to the page they were trying to access, or home
        const from = (location.state as { from?: string })?.from || redirectTo;
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
}
