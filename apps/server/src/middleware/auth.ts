import { Request, Response, NextFunction } from 'express';
import { TokenPayload, verifyToken } from '../utils/auth';
import prisma from '../utils/prisma';

// Extend Express Request to include user info
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

/**
 * Middleware to authenticate JWT access token
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = authHeader.substring(7);

    try {
        const payload = verifyToken(token);

        // Verify user still exists and get latest role
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, role: true } // role is stored as string
        });

        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role as any, // Cast string to Role type
        };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
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
            const payload = verifyToken(token);
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: { id: true, email: true, role: true }
            });

            if (user) {
                req.user = {
                    userId: user.id,
                    email: user.email,
                    role: user.role as any,
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
