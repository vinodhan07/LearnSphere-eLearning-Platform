import { claudeAgent } from '../agents/ClaudeAgent.js';
import prisma from '../utils/prisma.js';

export class AIService {
    async getLessonExplanation(lessonId: string) {
        return { explanation: await claudeAgent.explainLesson(lessonId) };
    }

    async getSmartRetakeQuestions(lessonId: string) {
        return await claudeAgent.generateSmartRetake(lessonId);
    }

    async getInstructorInsights() {
        const attempts = await prisma.quizAttempt.groupBy({
            by: ['lessonId'],
            _avg: { score: true },
            _count: { id: true },
            where: { passed: false }
        });

        const sorted = [...attempts].sort((a, b) => b._count.id - a._count.id);
        const mostFailed = sorted[0];

        let hardestLesson = null;
        if (mostFailed) {
            hardestLesson = await prisma.lesson.findUnique({
                where: { id: mostFailed.lessonId },
                select: { title: true, id: true }
            });
        }

        return {
            hardestLesson: hardestLesson ? hardestLesson.title : "N/A",
            mostFailedCount: mostFailed ? mostFailed._count.id : 0,
            averageScoreOnMostFailed: mostFailed ? mostFailed._avg.score : 0,
            recommendation: hardestLesson
                ? `Students are struggling with "${hardestLesson.title}". Consider adding more document resources or an extra video explanation for this topic.`
                : "Not enough data yet to provide deep insights."
        };
    }

    async getReviewSummary(courseId: string) {
        return { summary: await claudeAgent.summarizeReviews(courseId) };
    }
}

export const aiService = new AIService();
