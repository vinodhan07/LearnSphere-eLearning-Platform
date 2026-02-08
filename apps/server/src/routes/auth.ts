import { Router } from 'express';
import { getMe, listAdmins, login, register } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', authenticate, getMe);
router.get('/admins', authenticate, listAdmins);

export default router;
