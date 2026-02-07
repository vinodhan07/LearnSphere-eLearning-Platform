import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';

// Validation schemas
const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['INSTRUCTOR', 'LEARNER']).optional().default('LEARNER'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

const googleAuthSchema = z.object({
    credential: z.string().min(1, 'Google credential is required'),
});

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

        const authResponse = await authService.register(validation.data);
        res.status(201).json(authResponse);
    } catch (error: any) {
        console.error('Register error:', error);
        res.status(error.message === 'Email already registered' ? 409 : 500).json({ error: error.message || 'Internal server error' });
    }
}

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

        const { email, password } = validation.data;
        const authResponse = await authService.login(email, password);
        res.json(authResponse);
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(error.message === 'Invalid email or password' ? 401 : 500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * POST /api/auth/google
 */
export async function googleAuth(req: Request, res: Response): Promise<void> {
    try {
        const validation = googleAuthSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.flatten().fieldErrors });
            return;
        }

        const { credential } = validation.data;
        const parts = credential.split('.');
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));

        if (!payload.email) {
            res.status(400).json({ error: 'Email not found in Google profile' });
            return;
        }

        const authResponse = await authService.googleAuth(payload);
        res.json(authResponse);
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * POST /api/auth/refresh
 */
export async function refresh(req: Request, res: Response): Promise<void> {
    try {
        const validation = refreshSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.flatten().fieldErrors });
            return;
        }

        const result = await authService.refreshTokens(validation.data.refreshToken);
        res.json(result);
    } catch (error: any) {
        console.error('Refresh error:', error);
        res.status(401).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response): Promise<void> {
    try {
        if (req.body.refreshToken) {
            await authService.logout(req.body.refreshToken);
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
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
