import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: z.enum(['LEARNER', 'INSTRUCTOR']).default('LEARNER'),
});

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.flatten().fieldErrors });
            return;
        }

        const result = await authService.login(validation.data);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message || 'Login failed' });
    }
}

/**
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.flatten().fieldErrors });
            return;
        }

        const result = await authService.register(validation.data);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Registration failed' });
    }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const user = await authService.getCurrentUser(req.user.userId);
        res.json(user);
    } catch (error: any) {
        console.error('GetMe error:', error);
        res.status(error.message === 'User not found' ? 404 : 500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * GET /api/auth/admins
 */
export async function listAdmins(req: Request, res: Response): Promise<void> {
    try {
        const admins = await authService.listAdmins();
        res.json(admins);
    } catch (error) {
        console.error('List admins error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
