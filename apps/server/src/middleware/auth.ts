import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../utils/auth.js';
import { supabase } from '../utils/supabase.js';

// Extend Express Request to include user info
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

/**
 * Middleware to authenticate JWT access token via Supabase
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = authHeader.substring(7);

    try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !authUser) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }

        // Fetch additional profile info (role) from public table
        const { data: profile } = await supabase
            .from('User')
            .select('role')
            .eq('id', authUser.id)
            .maybeSingle();

        req.user = {
            userId: authUser.id,
            email: authUser.email || '',
            role: profile?.role || 'LEARNER',
        };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
    }
}

/**
 * Optional authentication middleware
 */
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser(token);
            if (authUser) {
                const { data: profile } = await supabase
                    .from('User')
                    .select('role')
                    .eq('id', authUser.id)
                    .maybeSingle();

                req.user = {
                    userId: authUser.id,
                    email: authUser.email || '',
                    role: profile?.role || 'LEARNER',
                };
            }
        } catch (e) {
            // Ignore optional auth errors
        }
    }

    next();
}

/**
 * Middleware to require one of specific roles
 */
export function requireAnyRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized - insufficient role' });
            return;
        }

        next();
    };
}
