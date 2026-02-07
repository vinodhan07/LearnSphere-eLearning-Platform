import prisma from '../utils/prisma.js';

export class LessonService {
    async listLessons(courseId: string) {
        return await prisma.lesson.findMany({
            where: { courseId },
            orderBy: { order: 'asc' },
        });
    }

    async createLesson(courseId: string, data: any, user: { userId: string, role: string }) {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) throw new Error('Course not found');

        if (course.responsibleAdminId !== user.userId && user.role !== 'ADMIN') {
            throw new Error('Not authorized to add lessons to this course');
        }

        return await prisma.lesson.create({
            data: { ...data, courseId },
        });
    }

    async updateLesson(id: string, data: any, user: { userId: string, role: string }) {
        const existingLesson = await prisma.lesson.findUnique({
            where: { id },
            include: { course: true },
        });

        if (!existingLesson) throw new Error('Lesson not found');

        if (existingLesson.course.responsibleAdminId !== user.userId && user.role !== 'ADMIN') {
            throw new Error('Not authorized to update this lesson');
        }

        return await prisma.lesson.update({
            where: { id },
            data,
        });
    }

    async deleteLesson(id: string, user: { userId: string, role: string }) {
        const existingLesson = await prisma.lesson.findUnique({
            where: { id },
            include: { course: true },
        });

        if (!existingLesson) throw new Error('Lesson not found');

        if (existingLesson.course.responsibleAdminId !== user.userId && user.role !== 'ADMIN') {
            throw new Error('Not authorized to delete this lesson');
        }

        await prisma.lesson.delete({ where: { id } });
    }

    async updateProgress(lessonId: string, userId: string, data: { isCompleted?: boolean, timeSpent?: number }) {
        return await prisma.lessonProgress.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            update: {
                isCompleted: data.isCompleted ?? undefined,
                timeSpent: { increment: data.timeSpent ?? 0 },
                lastAccessed: new Date(),
            },
            create: {
                userId,
                lessonId,
                isCompleted: data.isCompleted ?? false,
                timeSpent: data.timeSpent ?? 0,
            },
        });
    }

    async getProgressByCourse(courseId: string, userId: string) {
        return await prisma.lessonProgress.findMany({
            where: {
                userId,
                lesson: { courseId }
            }
        });
    }
}

export const lessonService = new LessonService();
