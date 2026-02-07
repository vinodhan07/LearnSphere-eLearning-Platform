import { Router } from 'express';
import {
    createLesson,
    updateLesson,
    deleteLesson,
    listLessons,
} from '../controllers/lessons.js';
import { authenticate } from '../middleware/auth.js';
import { requireAnyRole } from '../middleware/rbac.js';

const router = Router();

// All lesson management routes require INSTRUCTOR or ADMIN role
router.get('/course/:courseId', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), listLessons);
router.post('/course/:courseId', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), createLesson);
router.put('/:id', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), updateLesson);
router.delete('/:id', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), deleteLesson);

export default router;
