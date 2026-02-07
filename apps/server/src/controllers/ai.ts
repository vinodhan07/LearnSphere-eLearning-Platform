import { Request, Response } from 'express';
import { aiService } from '../services/ai.service.js';

/**
 * POST /api/ai/explain
 * Summarizes the current lesson in simple words
 */
export async function explainLesson(req: Request, res: Response): Promise<void> {
    try {
        const { lessonId } = req.body;
        const result = await aiService.getLessonExplanation(lessonId);
        res.json(result);
    } catch (error: any) {
        console.error('AI Explain error:', error);
        res.status(error.message === 'Lesson not found' ? 404 : 500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * GET /api/ai/smart-retake/:lessonId
 * Generates 3 practice questions after a failed quiz
 */
export async function generateSmartRetake(req: Request, res: Response): Promise<void> {
    try {
        const { lessonId } = req.params as any;
        const questions = await aiService.getSmartRetakeQuestions(lessonId);
        res.json(questions);
    } catch (error: any) {
        console.error('AI Smart Retake error:', error);
        res.status(error.message === 'Lesson not found' ? 404 : 500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * GET /api/ai/instructor-insights
 * Show hardest lesson and most failed quiz
 */
export async function getInstructorInsights(req: Request, res: Response): Promise<void> {
    try {
        const insights = await aiService.getInstructorInsights();
        res.json(insights);
    } catch (error) {
        console.error('AI Insights error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * GET /api/ai/review-summary/:courseId
 * Summarize student reviews
 */
export async function summarizeReviews(req: Request, res: Response): Promise<void> {
    try {
        const { courseId } = req.params as any;
        const summary = await aiService.getReviewSummary(courseId);
        res.json(summary);
    } catch (error) {
        console.error('AI Review Summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
