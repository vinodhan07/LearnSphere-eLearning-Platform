import { Router } from 'express';
import { register, login, refresh, logout, getMe, googleAuth, listAdmins } from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/refresh', refresh);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.get('/admins', authenticate, listAdmins);

export default router;
