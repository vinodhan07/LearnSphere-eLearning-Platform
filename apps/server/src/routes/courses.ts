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
} from '../controllers/courses.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { requireAnyRole } from '../middleware/rbac.js';

const router = Router();

// Public routes (with optional auth for visibility filtering)
router.get('/', optionalAuthenticate, listCourses);
router.get('/:id', optionalAuthenticate, getCourse);

// Protected routes - require authentication
router.get('/my/enrolled', authenticate, listMyCourses);
router.post('/:id/enroll', authenticate, enrollInCourse);

// Admin routes - require INSTRUCTOR or ADMIN role
router.post('/', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), createCourse);
router.put('/:id', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), updateCourse);
router.delete('/:id', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), deleteCourse);
router.get('/admin/list', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), listAdminCourses);
router.get('/:id/attendees', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), getCourseAttendees);
router.post('/:id/invite', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), inviteAttendee);
router.post('/:id/contact', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), contactAttendees);

export default router;
