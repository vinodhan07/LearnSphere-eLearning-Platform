import prisma from '../utils/prisma';
import { lessonService } from './lesson.service';

export class QuizService {
    async getQuizQuestions(lessonId: string) {
        const questions = await prisma.quizQuestion.findMany({
            where: { lessonId }
        });

        return questions.map(q => ({
            ...q,
            options: JSON.parse(q.options as string),
        }));
    }

    async submitQuiz(lessonId: string, userId: string, answers: number[]) {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { questions: true }
        });

        if (!lesson || lesson.type !== 'quiz') throw new Error('Quiz not found');
        if (!lesson.questions || lesson.questions.length === 0) throw new Error('Quiz has no questions');

        let correctCount = 0;
        lesson.questions.forEach((q, index) => {
            if (answers[index] === q.correctIndex) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / lesson.questions.length) * 100);
        const passed = score >= lesson.passScore;
        let pointsEarned = 0;

        if (passed) {
            pointsEarned = lesson.pointsReward;

            const existingPass = await prisma.quizAttempt.findFirst({
                where: {
                    userId,
                    lessonId,
                    passed: true
                }
            });

            if (existingPass) {
                pointsEarned = 0;
            } else {
                // Increment user points
                await prisma.user.update({
                    where: { id: userId },
                    data: { totalPoints: { increment: pointsEarned } }
                });
                await lessonService.updateProgress(lessonId, userId, { isCompleted: true });
            }
        }

        const attempt = await prisma.quizAttempt.create({
            data: {
                userId,
                lessonId,
                score,
                passed,
                pointsEarned,
            }
        });

        return {
            attempt,
            correctCount,
            totalQuestions: lesson.questions.length,
            nextBadgeProgress: 75,
        };
    }

    async createQuestion(lessonId: string, data: any) {
        const { question, options, correctIndex } = data;

        return await prisma.quizQuestion.create({
            data: {
                question,
                options: JSON.stringify(options),
                correctIndex,
                lessonId,
            }
        });
    }

    async updateQuestion(id: string, data: any) {
        const { question, options, correctIndex } = data;
        const updateData: any = {};

        if (question !== undefined) updateData.question = question;
        if (options !== undefined) updateData.options = JSON.stringify(options);
        if (correctIndex !== undefined) updateData.correctIndex = correctIndex;

        return await prisma.quizQuestion.update({
            where: { id },
            data: updateData
        });
    }

    async deleteQuestion(id: string) {
        await prisma.quizQuestion.delete({ where: { id } });
    }
}

export const quizService = new QuizService();
