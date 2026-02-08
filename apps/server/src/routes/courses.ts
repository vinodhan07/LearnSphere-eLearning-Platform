import { Router } from 'express';
import multer from 'multer';
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
    getCourseImage,
} from '../controllers/courses';
import { listLessons } from '../controllers/lessons';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireAnyRole } from '../middleware/rbac';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// --- Specific/Static Routes First ---

// User-specific courses
router.get('/my/enrolled', authenticate, listMyCourses);

// Admin listing
router.get('/admin/list', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), listAdminCourses);

// --- Public/General Routes ---

router.get('/', optionalAuthenticate, listCourses);

// --- Dynamic ID Routes Last ---

router.get('/:id', optionalAuthenticate, getCourse);
router.get('/:id/image', getCourseImage);
router.get('/:courseId/lessons', authenticate, listLessons);

// --- Other Protected Routes ---

router.post('/:id/enroll', authenticate, enrollInCourse);

// Admin-only actions on specific courses
router.post('/', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), upload.single('imageFile'), createCourse);
router.put('/:id', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), upload.single('imageFile'), updateCourse);
router.delete('/:id', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), deleteCourse);
router.get('/:id/attendees', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), getCourseAttendees);
router.post('/:id/invite', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), inviteAttendee);
router.post('/:id/invite', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), inviteAttendee);
router.post('/:id/contact', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), contactAttendees);
router.post('/:id/bulk-action', authenticate, requireAnyRole('INSTRUCTOR', 'ADMIN'), handleBulkAction);

export default router;
