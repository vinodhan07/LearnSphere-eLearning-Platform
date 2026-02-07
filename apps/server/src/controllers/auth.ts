import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';

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
