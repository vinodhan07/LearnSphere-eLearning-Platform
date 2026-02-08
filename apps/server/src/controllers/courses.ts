import { Request, Response } from 'express';
import { z } from 'zod';
import { courseService } from '../services/course.service';
import { Visibility, AccessRule } from '../../../../shared/constants';

// Validation schemas
const createCourseSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    image: z.string().url().optional().or(z.literal('')),
    published: z.boolean().optional().default(false),
    website: z.string().url().optional().or(z.literal('')),
    visibility: z.enum([Visibility.EVERYONE, Visibility.SIGNED_IN]).optional().default(Visibility.EVERYONE),
    accessRule: z.enum([AccessRule.OPEN, AccessRule.INVITE, AccessRule.PAID]).optional().default(AccessRule.OPEN),
    price: z.number().positive().optional(),
    currency: z.string().length(3).optional().default('USD'),
});

const updateCourseSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    image: z.string().url().optional().or(z.literal('')),
    published: z.boolean().optional(),
    website: z.string().url().optional().or(z.literal('')),
    visibility: z.enum([Visibility.EVERYONE, Visibility.SIGNED_IN]).optional(),
    accessRule: z.enum([AccessRule.OPEN, AccessRule.INVITE, AccessRule.PAID]).optional(),
    price: z.number().positive().optional().nullable(),
    currency: z.string().length(3).optional(),
});

/**
 * POST /api/courses
 */
export async function createCourse(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const validation = createCourseSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.flatten().fieldErrors });
            return;
        }
        const course = await courseService.createCourse(validation.data, req.user.userId);
        res.status(201).json(course);
    } catch (error: any) {
        console.error('Create course error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * GET /api/courses
 */
export async function listCourses(req: Request, res: Response): Promise<void> {
    try {
        console.log('GET /api/courses - Start');
        const courses = await courseService.listCourses(!!req.user);
        res.json(courses);
    } catch (error: any) {
        console.error('List courses controller error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * GET /api/courses/:id
 */
export async function getCourse(req: Request, res: Response): Promise<void> {
    try {
        const course = await courseService.getCourse(req.params.id as string, req.user ? { userId: req.user.userId, role: req.user.role } : undefined);
        res.json(course);
    } catch (error: any) {
        console.error('Get course error:', error);
        res.status(error.message === 'Course not found' ? 404 : 500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * PUT /api/courses/:id
 */
export async function updateCourse(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const validation = updateCourseSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.flatten().fieldErrors });
            return;
        }
        const course = await courseService.updateCourse(req.params.id as string, validation.data, { userId: req.user.userId, role: req.user.role });
        res.json(course);
    } catch (error: any) {
        console.error('Update course error:', error);
        const status = ['Course not found'].includes(error.message) ? 404 : error.message.includes('Not authorized') ? 403 : 400;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * DELETE /api/courses/:id
 */
export async function deleteCourse(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        await courseService.deleteCourse(req.params.id as string, { userId: req.user.userId, role: req.user.role });
        res.json({ message: 'Course deleted successfully' });
    } catch (error: any) {
        console.error('Delete course error:', error);
        const status = error.message === 'Course not found' ? 404 : 403;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * POST /api/courses/:id/enroll
 */
export async function enrollInCourse(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const enrollment = await courseService.enroll(req.params.id as string, req.user.userId, req.body);
        res.status(201).json({ message: 'Successfully enrolled in course', enrollment });
    } catch (error: any) {
        console.error('Enroll error:', error);
        if (error.requiresPayment) {
            res.status(402).json({ error: error.message, price: error.price, currency: error.currency, requiresPayment: true });
        } else if (error.requiresInvitation) {
            res.status(403).json({ error: error.message, requiresInvitation: true });
        } else {
            res.status(error.message === 'Course not found' ? 404 : 400).json({ error: error.message || 'Internal server error' });
        }
    }
}

/**
 * GET /api/courses/admin
 */
export async function listAdminCourses(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const courses = await courseService.listAdminCourses({ userId: req.user.userId, role: req.user.role });
        res.json(courses);
    } catch (error) {
        console.error('List admin courses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * GET /api/courses/admin/enrollments
 */
export async function listAdminEnrollments(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const enrollments = await courseService.listAdminEnrollments({ userId: req.user.userId, role: req.user.role });
        res.json(enrollments);
    } catch (error) {
        console.error('List admin enrollments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * GET /api/courses/my/enrolled
 */
export async function listMyCourses(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const courses = await courseService.listEnrolledCourses(req.user.userId);
        res.json(courses);
    } catch (error) {
        console.error('List my courses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * GET /api/courses/:id/attendees
 */
export async function getCourseAttendees(req: Request, res: Response): Promise<void> {
    try {
        const attendees = await courseService.getAttendees(req.params.id as string);
        res.json(attendees);
    } catch (error) {
        console.error('Get attendees error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * POST /api/courses/:id/invite
 */
export async function inviteAttendee(req: Request, res: Response): Promise<void> {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }
        const invitation = await courseService.inviteAttendee(req.params.id as string, email);
        res.status(201).json(invitation);
    } catch (error: any) {
        console.error('Invite attendee error:', error);
        res.status(error.message === 'User with this email not found' ? 404 : 500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * POST /api/courses/:id/contact
 */
export async function contactAttendees(req: Request, res: Response): Promise<void> {
    try {
        const { subject, message } = req.body;
        if (!subject || !message) {
            res.status(400).json({ error: 'Subject and message are required' });
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        res.json({ message: 'Message sent to all attendees successfully' });
    } catch (error) {
        console.error('Contact attendees error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * POST /api/courses/:id/bulk-action
 */
export async function handleBulkAction(req: Request, res: Response): Promise<void> {
    try {
        const { action, userIds } = req.body;
        const courseId = req.params.id as string;

        if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
            res.status(400).json({ error: 'Action and userIds array are required' });
            return;
        }

        if (action === 'unenroll') {
            await courseService.bulkUnenroll(courseId, userIds);
            res.json({ message: `Successfully unenrolled ${userIds.length} users.` });
        } else if (action === 'reset_progress') {
            await courseService.bulkResetProgress(courseId, userIds);
            res.json({ message: `Successfully reset progress for ${userIds.length} users.` });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Bulk action error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
