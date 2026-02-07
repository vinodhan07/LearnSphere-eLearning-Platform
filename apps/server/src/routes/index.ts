import { Router } from 'express';
import authRoutes from './auth.js';
import courseRoutes from './courses.js';
import lessonRoutes from './lessons.js';
import quizRoutes from './quizzes.js';
import aiRoutes from './ai.js';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/lessons', lessonRoutes);
router.use('/quizzes', quizRoutes);
router.use('/ai', aiRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
