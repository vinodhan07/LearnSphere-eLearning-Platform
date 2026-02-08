import { Router } from 'express';
import {
    createCourse,
    listCourses,
    getCourse,
    updateCourse,
    deleteCourse,
    enrollInCourse,
    listAdminCourses,
    getCourseAttendees,
    inviteAttendee,
    contactAttendees,
    listMyCourses,
    handleBulkAction,
    purchaseCourse,
} from '../controllers/courses';
import { listLessons } from '../controllers/lessons';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireAnyRole } from '../middleware/rbac';

const router = Router();

// Force reload - purchase route fix

// --- Specific/Static Routes First ---

// User-specific courses
router.get('/my/enrolled', authenticate, listMyCourses);

// Admin listing
router.get('/admin/list', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), listAdminCourses);

// --- Public/General Routes ---

router.get('/', optionalAuthenticate, listCourses);

// --- Dynamic ID Routes Last ---

// IMPORTANT: Specific routes with path segments after :id MUST come before generic :id routes
router.post('/:id/enroll', authenticate, enrollInCourse);
router.post('/:id/purchase', authenticate, purchaseCourse);

router.get('/:id', optionalAuthenticate, getCourse);
router.get('/:courseId/lessons', authenticate, listLessons);

// --- Other Protected Routes ---

// Admin-only actions on specific courses
router.post('/', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), createCourse);
router.put('/:id', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), updateCourse);
router.delete('/:id', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), deleteCourse);
router.get('/:id/attendees', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), getCourseAttendees);
router.post('/:id/invite', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), inviteAttendee);
router.post('/:id/contact', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), contactAttendees);
router.post('/:id/bulk-action', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), handleBulkAction);

export default router;
