import prisma from '../utils/prisma';

export class LessonService {
    async listLessons(courseId: string) {
        return await prisma.lesson.findMany({
            where: { courseId },
            orderBy: { order: 'asc' }
        });
    }

    async createLesson(courseId: string, data: any, user: { userId: string, role: string }) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { responsibleAdminId: true }
        });

        if (!course) throw new Error('Course not found');

        if (course.responsibleAdminId !== user.userId && user.role !== 'ADMIN') {
            throw new Error('Not authorized to add lessons to this course');
        }

        return await prisma.lesson.create({
            data: {
                ...data,
                courseId,
                attachments: data.attachments ? JSON.stringify(data.attachments) : null
            }
        });
    }

    async updateLesson(id: string, data: any, user: { userId: string, role: string }) {
        const existingLesson = await prisma.lesson.findUnique({
            where: { id },
            include: { course: { select: { responsibleAdminId: true } } }
        });

        if (!existingLesson) throw new Error('Lesson not found');

        if (existingLesson.course.responsibleAdminId !== user.userId && user.role !== 'ADMIN') {
            throw new Error('Not authorized to update this lesson');
        }

        const updateData = { ...data };
        if (data.attachments !== undefined) {
            updateData.attachments = data.attachments ? JSON.stringify(data.attachments) : null;
        }

        return await prisma.lesson.update({
            where: { id },
            data: updateData
        });
    }

    async deleteLesson(id: string, user: { userId: string, role: string }) {
        const existingLesson = await prisma.lesson.findUnique({
            where: { id },
            include: { course: { select: { responsibleAdminId: true } } }
        });

        if (!existingLesson) throw new Error('Lesson not found');

        if (existingLesson.course.responsibleAdminId !== user.userId && user.role !== 'ADMIN') {
            throw new Error('Not authorized to delete this lesson');
        }

        await prisma.lesson.delete({ where: { id } });
    }

    async updateProgress(lessonId: string, userId: string, data: { isCompleted?: boolean, timeSpent?: number }) {
        const existingProgress = await prisma.lessonProgress.findUnique({
            where: {
                userId_lessonId: { userId, lessonId }
            }
        });

        if (existingProgress) {
            return await prisma.lessonProgress.update({
                where: { id: existingProgress.id },
                data: {
                    isCompleted: data.isCompleted ?? existingProgress.isCompleted,
                    timeSpent: existingProgress.timeSpent + (data.timeSpent ?? 0),
                    lastAccessed: new Date(),
                }
            });
        } else {
            return await prisma.lessonProgress.create({
                data: {
                    userId,
                    lessonId,
                    isCompleted: data.isCompleted ?? false,
                    timeSpent: data.timeSpent ?? 0,
                    lastAccessed: new Date(),
                }
            });
        }
    }

    async getProgressByCourse(courseId: string, userId: string) {
        return await prisma.lessonProgress.findMany({
            where: {
                userId,
                lesson: { courseId }
            },
            include: { lesson: true }
        });
    }
}

export const lessonService = new LessonService();
