import { Request, Response } from 'express';
import { z } from 'zod';
import { quizService } from '../services/quiz.service.js';
import { lessonService } from '../services/lesson.service.js';

const submitQuizSchema = z.object({
    answers: z.array(z.number()),
});

/**
 * GET /api/lessons/:id/questions
 */
export async function getQuizQuestions(req: Request, res: Response): Promise<void> {
    try {
        const questions = await quizService.getQuizQuestions(req.params.id as string);
        res.json(questions);
    } catch (error) {
        console.error('Get quiz questions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * POST /api/lessons/:id/submit
 */
export async function submitQuiz(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { answers } = submitQuizSchema.parse(req.body);
        const result = await quizService.submitQuiz(req.params.id as string, req.user.userId, answers);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error('Submit quiz error:', error);
        const status = error.message === 'Quiz not found' ? 404 : 400;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * GET /api/lessons/:id/progress
 */
export async function updateProgress(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { isCompleted, timeSpent } = req.body;
        const progress = await lessonService.updateProgress(req.params.id as string, req.user.userId, { isCompleted, timeSpent });
        res.json(progress);
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * GET /api/quizzes/course/:courseId/progress
 */
export async function getProgressByCourse(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const progress = await lessonService.getProgressByCourse(req.params.courseId as string, req.user.userId);
        res.json(progress);
    } catch (error) {
        console.error('Get course progress error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
