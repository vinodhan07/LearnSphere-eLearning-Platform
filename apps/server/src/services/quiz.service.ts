import { supabase } from '../utils/supabase.js';
import { lessonService } from './lesson.service.js';

export class QuizService {
    async getQuizQuestions(lessonId: string) {
        const { data, error } = await supabase
            .from('QuizQuestion')
            .select('*')
            .eq('lessonId', lessonId);

        if (error) throw new Error(`Failed to get quiz questions: ${error.message}`);

        return (data || []).map((q: any) => ({
            ...q,
            options: q.options,
        }));
    }

    async submitQuiz(lessonId: string, userId: string, answers: number[]) {
        const { data: lesson, error: lessonError } = await supabase
            .from('Lesson')
            .select(`
                *,
                questions:QuizQuestion(*)
            `)
            .eq('id', lessonId)
            .maybeSingle();

        if (lessonError || !lesson || lesson.type !== 'quiz') throw new Error('Quiz not found');
        if (!lesson.questions || lesson.questions.length === 0) throw new Error('Quiz has no questions');

        let correctCount = 0;
        lesson.questions.forEach((q: any, index: number) => {
            const parsedOptions = q.options;
            // Verify if the answer index matches
            if (answers[index] === q.correctIndex) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / lesson.questions.length) * 100);
        const passed = score >= lesson.passScore;
        let pointsEarned = 0;

        if (passed) {
            pointsEarned = lesson.pointsReward;

            const { data: existingPass } = await supabase
                .from('QuizAttempt')
                .select('*')
                .eq('userId', userId)
                .eq('lessonId', lessonId)
                .eq('passed', true)
                .maybeSingle();

            if (existingPass) {
                pointsEarned = 0;
            } else {
                await supabase.rpc('increment_user_points', { user_id: userId, points: pointsEarned });
                await lessonService.updateProgress(lessonId, userId, { isCompleted: true });
            }
        }

        const { data: attempt, error: createError } = await supabase
            .from('QuizAttempt')
            .insert({
                userId,
                lessonId,
                score,
                passed,
                pointsEarned,
            })
            .select()
            .single();

        if (createError) throw new Error(`Failed to save quiz attempt: ${createError.message}`);

        return {
            attempt,
            correctCount,
            totalQuestions: lesson.questions.length,
            nextBadgeProgress: 75,
        };
    }

    async createQuestion(lessonId: string, data: any) {
        const { question, options, correctIndex } = data;

        const { data: result, error } = await supabase
            .from('QuizQuestion')
            .insert({
                question,
                options,
                correctIndex,
                lessonId,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create question: ${error.message}`);
        return result;
    }

    async updateQuestion(id: string, data: any) {
        const { question, options, correctIndex } = data;
        const updateData: any = {};

        if (question !== undefined) updateData.question = question;
        if (options !== undefined) updateData.options = options;
        if (correctIndex !== undefined) updateData.correctIndex = correctIndex;

        const { data: result, error } = await supabase
            .from('QuizQuestion')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update question: ${error.message}`);
        return result;
    }

    async deleteQuestion(id: string) {
        const { error } = await supabase
            .from('QuizQuestion')
            .delete()
            .eq('id', id);
        if (error) throw new Error(`Failed to delete question: ${error.message}`);
    }
}

export const quizService = new QuizService();
