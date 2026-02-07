import { Request, Response } from 'express';
import { z } from 'zod';
import { lessonService } from '../services/lesson.service.js';

// Validation schema for creating/updating a lesson
const lessonSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().optional(),
    content: z.string().optional(),
    duration: z.number().int().nonnegative().default(0),
    type: z.enum(['video', 'document', 'image', 'quiz']).default('video'),
    order: z.number().int().default(0),
    allowDownload: z.boolean().optional().default(true),
    attachments: z.string().optional().nullable(),
});

/**
 * GET /api/courses/:courseId/lessons
 */
export async function listLessons(req: Request, res: Response): Promise<void> {
    try {
        const lessons = await lessonService.listLessons(req.params.courseId as string);
        res.json(lessons);
    } catch (error) {
        console.error('List lessons error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * POST /api/courses/:courseId/lessons
 */
export async function createLesson(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const validation = lessonSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.flatten().fieldErrors });
            return;
        }
        const lesson = await lessonService.createLesson(req.params.courseId as string, validation.data, { userId: req.user.userId, role: req.user.role });
        res.status(201).json(lesson);
    } catch (error: any) {
        console.error('Create lesson error:', error);
        res.status(error.message === 'Course not found' ? 404 : 403).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * PUT /api/lessons/:id
 */
export async function updateLesson(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const validation = lessonSchema.partial().safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.flatten().fieldErrors });
            return;
        }
        const updatedLesson = await lessonService.updateLesson(req.params.id as string, validation.data, { userId: req.user.userId, role: req.user.role });
        res.json(updatedLesson);
    } catch (error: any) {
        console.error('Update lesson error:', error);
        const status = error.message === 'Lesson not found' ? 404 : 403;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * DELETE /api/lessons/:id
 */
export async function deleteLesson(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        await lessonService.deleteLesson(req.params.id as string, { userId: req.user.userId, role: req.user.role });
        res.json({ message: 'Lesson deleted successfully' });
    } catch (error: any) {
        console.error('Delete lesson error:', error);
        const status = error.message === 'Lesson not found' ? 404 : 403;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}
