import { Router } from 'express';
import { getQuizQuestions, submitQuiz, updateProgress, getProgressByCourse } from '../controllers/quizzes.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Progress tracking
router.get('/course/:courseId/progress', authenticate, getProgressByCourse);
router.post('/:id/progress', authenticate, updateProgress);

// Quiz endpoints
router.get('/:id/questions', authenticate, getQuizQuestions);
router.post('/:id/submit', authenticate, submitQuiz);

export default router;
