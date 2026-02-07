import { Router } from 'express';
import {
    getQuizQuestions,
    submitQuiz,
    updateProgress,
    getProgressByCourse,
    createQuestion,
    updateQuestion,
    deleteQuestion
} from '../controllers/quizzes.js';
import { authenticate, requireAnyRole } from '../middleware/auth.js';

const router = Router();

// Progress tracking
router.get('/course/:courseId/progress', authenticate, getProgressByCourse);
router.post('/:id/progress', authenticate, updateProgress);

// Quiz endpoints (Learner)
router.get('/:id/questions', authenticate, getQuizQuestions);
router.post('/:id/submit', authenticate, submitQuiz);

// Quiz management (Instructor/Admin)
router.post('/lessons/:lessonId/questions', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), createQuestion);
router.put('/questions/:id', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), updateQuestion);
router.delete('/questions/:id', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), deleteQuestion);

export default router;
