import { claudeAgent } from '../agents/ClaudeAgent.js';
import { supabase } from '../utils/supabase.js';

export class AIService {
    async getLessonExplanation(lessonId: string) {
        return { explanation: await claudeAgent.explainLesson(lessonId) };
    }

    async getSmartRetakeQuestions(lessonId: string) {
        return await claudeAgent.generateSmartRetake(lessonId);
    }

    async getAIQuizQuestions(lessonId: string) {
        return await claudeAgent.generateQuizQuestionsFromContent(lessonId);
    }

    async getInstructorInsights() {
        // Group by in Supabase is not directly available in select like Prisma groupBy.
        // We'll use a complex select or a view/rpc for deep analytics.
        // For now, let's simplify or use an RPC if available.
        // Simplified approach: get failed attempts and calculate in JS (data might be large, but it's a demo)
        const { data: attempts, error } = await supabase
            .from('QuizAttempt')
            .select('lessonId, score')
            .eq('passed', false);

        if (error || !attempts) throw new Error('Failed to get instructor insights');

        const lessonStats: Record<string, { count: number, totalScore: number }> = {};
        attempts.forEach(a => {
            if (!lessonStats[a.lessonId]) lessonStats[a.lessonId] = { count: 0, totalScore: 0 };
            lessonStats[a.lessonId].count++;
            lessonStats[a.lessonId].totalScore += a.score;
        });

        const sorted = Object.entries(lessonStats).sort((a, b) => b[1].count - a[1].count);
        const mostFailed = sorted[0];

        let hardestLesson = null;
        if (mostFailed) {
            const { data: lesson } = await supabase
                .from('Lesson')
                .select('title, id')
                .eq('id', mostFailed[0])
                .maybeSingle();
            hardestLesson = lesson;
        }

        return {
            hardestLesson: hardestLesson ? hardestLesson.title : "N/A",
            mostFailedCount: mostFailed ? mostFailed[1].count : 0,
            averageScoreOnMostFailed: mostFailed ? (mostFailed[1].totalScore / mostFailed[1].count) : 0,
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
