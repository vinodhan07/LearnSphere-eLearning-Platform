import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { quizService } from '../services/quiz.service';

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
        const { lessonId } = req.params;
        const questions = await aiService.getSmartRetakeQuestions(lessonId as string);
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
        const { courseId } = req.params;
        const summary = await aiService.getReviewSummary(courseId as string);
        res.json(summary);
    } catch (error) {
        console.error('AI Review Summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * POST /api/ai/generate-quiz
 * Generates questions for a quiz based on another lesson's content
 */
export async function generateQuiz(req: Request, res: Response): Promise<void> {
    try {
        const { lessonId, quizId } = req.body;
        if (!lessonId || !quizId) {
            res.status(400).json({ error: 'lessonId and quizId are required' });
            return;
        }

        const questions = await aiService.getAIQuizQuestions(lessonId);

        // Save the AI generated questions to the database for the specified quiz
        const savedQuestions = await Promise.all(
            questions.map(q => quizService.createQuestion(quizId, q))
        );

        res.status(201).json(savedQuestions);
    } catch (error: any) {
        console.error('AI Generate Quiz error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
