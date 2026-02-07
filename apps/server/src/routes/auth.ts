import { Router } from 'express';
import { getMe, listAdmins } from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protected routes
router.get('/me', authenticate, getMe);
router.get('/admins', authenticate, listAdmins);

export default router;
