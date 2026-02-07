import { supabase } from '../utils/supabase.js';

export class LessonService {
    async listLessons(courseId: string) {
        const { data, error } = await supabase
            .from('Lesson')
            .select('*')
            .eq('courseId', courseId)
            .order('order', { ascending: true });

        if (error) throw new Error(`Failed to list lessons: ${error.message}`);
        return data;
    }

    async createLesson(courseId: string, data: any, user: { userId: string, role: string }) {
        const { data: course } = await supabase
            .from('Course')
            .select('responsibleAdminId')
            .eq('id', courseId)
            .maybeSingle();

        if (!course) throw new Error('Course not found');

        if (course.responsibleAdminId !== user.userId && user.role !== 'ADMIN') {
            throw new Error('Not authorized to add lessons to this course');
        }

        const { data: lesson, error } = await supabase
            .from('Lesson')
            .insert({ ...data, courseId })
            .select()
            .single();

        if (error) throw new Error(`Failed to create lesson: ${error.message}`);
        return lesson;
    }

    async updateLesson(id: string, data: any, user: { userId: string, role: string }) {
        const { data: existingLesson } = await supabase
            .from('Lesson')
            .select('*, course:Course(responsibleAdminId)')
            .eq('id', id)
            .maybeSingle();

        if (!existingLesson) throw new Error('Lesson not found');

        // Supabase join syntax: existingLesson.course is an object if one-to-one
        if (existingLesson.course.responsibleAdminId !== user.userId && user.role !== 'ADMIN') {
            throw new Error('Not authorized to update this lesson');
        }

        const { data: lesson, error } = await supabase
            .from('Lesson')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update lesson: ${error.message}`);
        return lesson;
    }

    async deleteLesson(id: string, user: { userId: string, role: string }) {
        const { data: existingLesson } = await supabase
            .from('Lesson')
            .select('*, course:Course(responsibleAdminId)')
            .eq('id', id)
            .maybeSingle();

        if (!existingLesson) throw new Error('Lesson not found');

        if (existingLesson.course.responsibleAdminId !== user.userId && user.role !== 'ADMIN') {
            throw new Error('Not authorized to delete this lesson');
        }

        const { error } = await supabase.from('Lesson').delete().eq('id', id);
        if (error) throw new Error(`Failed to delete lesson: ${error.message}`);
    }

    async updateProgress(lessonId: string, userId: string, data: { isCompleted?: boolean, timeSpent?: number }) {
        // Handle upsert with custom logic for incrementing timeSpent
        const { data: existingProgress } = await supabase
            .from('LessonProgress')
            .select('*')
            .eq('userId', userId)
            .eq('lessonId', lessonId)
            .maybeSingle();

        if (existingProgress) {
            const { data: updated, error } = await supabase
                .from('LessonProgress')
                .update({
                    isCompleted: data.isCompleted ?? existingProgress.isCompleted,
                    timeSpent: existingProgress.timeSpent + (data.timeSpent ?? 0),
                    lastAccessed: new Date().toISOString(),
                })
                .eq('id', existingProgress.id)
                .select()
                .single();
            if (error) throw new Error(`Failed to update progress: ${error.message}`);
            return updated;
        } else {
            const { data: created, error } = await supabase
                .from('LessonProgress')
                .insert({
                    userId,
                    lessonId,
                    isCompleted: data.isCompleted ?? false,
                    timeSpent: data.timeSpent ?? 0,
                })
                .select()
                .single();
            if (error) throw new Error(`Failed to create progress: ${error.message}`);
            return created;
        }
    }

    async getProgressByCourse(courseId: string, userId: string) {
        const { data, error } = await supabase
            .from('LessonProgress')
            .select('*, lesson:Lesson!inner(courseId)')
            .eq('userId', userId)
            .eq('lesson.courseId', courseId);

        if (error) throw new Error(`Failed to get progress: ${error.message}`);
        return data;
    }
}

export const lessonService = new LessonService();
