import { Router } from 'express';
import {
    explainLesson,
    generateSmartRetake,
    getInstructorInsights,
    summarizeReviews,
    generateQuiz
} from '../controllers/ai';
import { authenticate } from '../middleware/auth';
import { requireAnyRole } from '../middleware/rbac';

const router = Router();

router.post('/explain', authenticate, explainLesson);
router.get('/smart-retake/:lessonId', authenticate, generateSmartRetake);
router.get('/instructor-insights', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), getInstructorInsights);
router.get('/review-summary/:courseId', authenticate, summarizeReviews);
router.post('/generate-quiz', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), generateQuiz);

export default router;
