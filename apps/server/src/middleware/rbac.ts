import { Request, Response, NextFunction } from 'express';
import { Role, hasMinimumRole } from '../utils/auth.js';

/**
 * Middleware factory to require minimum role level
 * Uses role hierarchy: ADMIN > INSTRUCTOR > LEARNER
 */
export function requireRole(minRole: Role) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!hasMinimumRole(req.user.role, minRole)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                required: minRole,
                current: req.user.role,
            });
            return;
        }

        next();
    };
}

/**
 * Middleware to require any of the specified roles
 */
export function requireAnyRole(...roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                required: roles,
                current: req.user.role,
            });
            return;
        }

        next();
    };
}

/**
 * Convenience middleware for admin-only routes
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Convenience middleware for instructor or admin routes
 */
export const requireInstructor = requireRole('INSTRUCTOR');

/**
 * Convenience middleware for any authenticated user
 */
export const requireLearner = requireRole('LEARNER');
