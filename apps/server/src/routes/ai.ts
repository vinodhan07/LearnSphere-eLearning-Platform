import { Router } from 'express';
import {
    explainLesson,
    generateSmartRetake,
    getInstructorInsights,
    summarizeReviews
} from '../controllers/ai.js';
import { authenticate } from '../middleware/auth.js';
import { requireAnyRole } from '../middleware/rbac.js';

const router = Router();

router.post('/explain', authenticate, explainLesson);
router.get('/smart-retake/:lessonId', authenticate, generateSmartRetake);
router.get('/instructor-insights', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), getInstructorInsights);
router.get('/review-summary/:courseId', authenticate, summarizeReviews);

export default router;
