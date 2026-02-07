import prisma from '../utils/prisma.js';
import { Visibility, AccessRule } from '../../../../shared/constants.js';

export class CourseService {
    async createCourse(data: any, adminId: string) {
        const { title, description, tags, image, published, website, visibility, accessRule, price, currency } = data;

        const course = await prisma.course.create({
            data: {
                title,
                description,
                tags: tags ? JSON.stringify(tags) : null,
                image: image || null,
                published,
                website: website || null,
                visibility,
                accessRule,
                price: accessRule === AccessRule.PAID ? price : null,
                currency,
                responsibleAdminId: adminId,
            },
            include: {
                responsibleAdmin: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
            },
        });

        return {
            ...course,
            tags: course.tags ? JSON.parse(course.tags) : [],
        };
    }

    async listCourses(isAuthenticated: boolean) {
        const where: any = { published: true };
        if (!isAuthenticated) {
            where.visibility = Visibility.EVERYONE;
        }

        const courses = await prisma.course.findMany({
            where,
            include: {
                responsibleAdmin: { select: { id: true, name: true, avatar: true } },
                _count: { select: { enrollments: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return courses.map((course: any) => ({
            ...course,
            tags: course.tags ? JSON.parse(course.tags) : [],
            enrolledCount: course._count.enrollments,
            _count: undefined,
        }));
    }

    async getCourse(id: string, user?: { userId: string, role: string }) {
        const isAuthenticated = !!user;
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                responsibleAdmin: { select: { id: true, name: true, email: true, avatar: true } },
                _count: { select: { enrollments: true } },
            },
        });

        if (!course) throw new Error('Course not found');

        const updateViews = !isAuthenticated || (user!.role === 'LEARNER');
        if (updateViews) {
            prisma.course.update({
                where: { id },
                data: { viewsCount: { increment: 1 } }
            }).catch(err => console.error('Failed to increment views:', err));
        }

        if (!course.published) {
            if (!isAuthenticated || (user!.userId !== course.responsibleAdminId && user!.role !== 'ADMIN')) {
                throw new Error('Course not found');
            }
        }

        if (course.visibility === Visibility.SIGNED_IN && !isAuthenticated) {
            throw new Error('Sign in required to view this course');
        }

        let canStart = false;
        let enrollmentStatus: string | null = null;

        if (isAuthenticated) {
            const enrollment = await prisma.enrollment.findUnique({
                where: { userId_courseId: { userId: user!.userId, courseId: id } },
            });

            if (enrollment) {
                canStart = true;
                enrollmentStatus = 'ENROLLED';
            } else {
                switch (course.accessRule) {
                    case AccessRule.OPEN:
                        canStart = true;
                        break;
                    case AccessRule.INVITE:
                        const invitation = await prisma.courseInvitation.findUnique({
                            where: { courseId_userId: { courseId: id, userId: user!.userId } },
                        });
                        canStart = invitation?.status === 'ACCEPTED';
                        enrollmentStatus = invitation ? `INVITED_${invitation.status}` : 'NOT_INVITED';
                        break;
                    case AccessRule.PAID:
                        canStart = false;
                        enrollmentStatus = 'REQUIRES_PAYMENT';
                        break;
                }
            }
        }

        return {
            ...course,
            tags: course.tags ? JSON.parse(course.tags) : [],
            enrolledCount: (course as any)._count.enrollments,
            canStart,
            enrollmentStatus,
            _count: undefined,
        };
    }

    async updateCourse(id: string, data: any, user: { userId: string, role: string }) {
        const existingCourse = await prisma.course.findUnique({ where: { id } });
        if (!existingCourse) throw new Error('Course not found');

        if (existingCourse.responsibleAdminId !== user.userId && user.role !== 'ADMIN') {
            throw new Error('Not authorized to update this course');
        }

        const mergedData = {
            published: data.published ?? existingCourse.published,
            website: data.website ?? existingCourse.website,
            accessRule: data.accessRule ?? existingCourse.accessRule,
            price: data.price ?? existingCourse.price,
        };

        // if (mergedData.published && !mergedData.website) throw new Error('Website is required when course is published');
        if (mergedData.accessRule === AccessRule.PAID && (!mergedData.price || mergedData.price <= 0)) {
            throw new Error('Price is required when access rule is PAID');
        }

        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
        if (data.image !== undefined) updateData.image = data.image || null;
        if (data.published !== undefined) updateData.published = data.published;
        if (data.website !== undefined) updateData.website = data.website || null;
        if (data.visibility !== undefined) updateData.visibility = data.visibility;
        if (data.accessRule !== undefined) {
            updateData.accessRule = data.accessRule;
            if (data.accessRule !== AccessRule.PAID) updateData.price = null;
        }
        if (data.price !== undefined) updateData.price = data.price;
        if (data.currency !== undefined) updateData.currency = data.currency;

        const course = await prisma.course.update({
            where: { id },
            data: updateData,
            include: {
                responsibleAdmin: { select: { id: true, name: true, email: true, avatar: true } },
            },
        });

        return {
            ...course,
            tags: course.tags ? JSON.parse(course.tags) : [],
        };
    }

    async deleteCourse(id: string, user: { userId: string, role: string }) {
        const course = await prisma.course.findUnique({ where: { id } });
        if (!course) throw new Error('Course not found');

        if (course.responsibleAdminId !== user.userId && user.role !== 'ADMIN') {
            throw new Error('Not authorized to delete this course');
        }

        await prisma.course.delete({ where: { id } });
    }

    async enroll(id: string, userId: string, paymentInfo?: any) {
        const course = await prisma.course.findUnique({ where: { id } });
        if (!course || !course.published) throw new Error('Course not found');

        const existingEnrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId: id } },
        });
        if (existingEnrollment) throw new Error('Already enrolled in this course');

        switch (course.accessRule) {
            case AccessRule.OPEN:
                break;
            case AccessRule.INVITE:
                const invitation = await prisma.courseInvitation.findUnique({
                    where: { courseId_userId: { courseId: id, userId } },
                });
                if (!invitation || invitation.status !== 'ACCEPTED') {
                    const err: any = new Error('This course requires an invitation to enroll');
                    err.requiresInvitation = true;
                    throw err;
                }
                break;
            case AccessRule.PAID:
                if (!paymentInfo?.confirmed) {
                    const err: any = new Error('Payment required to enroll in this course');
                    err.requiresPayment = true;
                    err.price = course.price;
                    err.currency = course.currency;
                    throw err;
                }
                return await prisma.enrollment.create({
                    data: { userId, courseId: id, paidAmount: paymentInfo.paidAmount || course.price, paidAt: new Date() },
                });
        }

        return await prisma.enrollment.create({
            data: { userId, courseId: id },
        });
    }

    async listAdminCourses(user: { userId: string, role: string }) {
        const where: any = {};
        if (user.role === 'INSTRUCTOR') where.responsibleAdminId = user.userId;

        const courses = await prisma.course.findMany({
            where,
            include: {
                responsibleAdmin: { select: { id: true, name: true, avatar: true } },
                lessons: { select: { duration: true } },
                _count: { select: { enrollments: true, invitations: true, lessons: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return courses.map((course: any) => ({
            ...course,
            tags: course.tags ? JSON.parse(course.tags) : [],
            enrolledCount: course._count.enrollments,
            invitationCount: course._count.invitations,
            lessonsCount: course._count.lessons,
            totalDuration: course.lessons.reduce((sum: number, lesson: any) => sum + (lesson.duration || 0), 0),
            _count: undefined,
            lessons: undefined,
        }));
    }

    async getAttendees(id: string) {
        // Fetch base enrollments and invitations
        const [enrollments, invitations] = await Promise.all([
            prisma.enrollment.findMany({
                where: { courseId: id },
                include: {
                    user: { select: { id: true, name: true, email: true, avatar: true } }
                },
            }),
            prisma.courseInvitation.findMany({
                where: { courseId: id },
                include: {
                    user: { select: { id: true, name: true, email: true, avatar: true } }
                },
            }),
        ]);

        // Enhance enrollments with additional metrics (Last Active, Quiz Scores)
        // We do this in parallel to minimize DB round trips, though for large courses this might need optimization
        const enhancedEnrollments = await Promise.all(enrollments.map(async (enrollment) => {
            // 1. Get Last Active time (max lastAccessed from LessonProgress for this course)
            const lastActiveProgress = await prisma.lessonProgress.findFirst({
                where: {
                    userId: enrollment.userId,
                    lesson: { courseId: id }
                },
                orderBy: { lastAccessed: 'desc' },
                select: { lastAccessed: true }
            });

            // 2. Calculate Average Quiz Score
            const quizAttempts = await prisma.quizAttempt.findMany({
                where: {
                    userId: enrollment.userId,
                    lesson: { courseId: id }
                },
                select: { score: true }
            });

            const avgScore = quizAttempts.length > 0
                ? Math.round(quizAttempts.reduce((acc, curr) => acc + curr.score, 0) / quizAttempts.length)
                : 0; // Or null if no quizzes taken

            return {
                ...enrollment,
                lastAccessed: lastActiveProgress?.lastAccessed || enrollment.startedAt, // Fallback to start date
                performance: avgScore,
                completed: enrollment.progress === 100, // Infer certificate eligibility
            };
        }));

        return { enrollments: enhancedEnrollments, invitations };
    }

    async inviteAttendee(id: string, email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error('User with this email not found');

        return await prisma.courseInvitation.upsert({
            where: { courseId_userId: { courseId: id, userId: user.id } },
            update: { status: 'PENDING', invitedAt: new Date() },
            create: { courseId: id, userId: user.id, status: 'PENDING' },
        });
    }

    async bulkUnenroll(courseId: string, userIds: string[]) {
        // Delete enrollments
        await prisma.enrollment.deleteMany({
            where: {
                courseId,
                userId: { in: userIds }
            }
        });

        // Also delete progress to ensure clean slate if they re-enroll? 
        // Usually safer to keep it, but "Reset" is a separate action. 
        // Requirements say "Unenroll", usually implies removal.
        // Let's keep data for now unless explicitly asked to wipe history, 
        // but typically unenroll removes access.
    }

    async bulkResetProgress(courseId: string, userIds: string[]) {
        return await prisma.$transaction(async (tx) => {
            // 1. Reset Enrollment progress
            await tx.enrollment.updateMany({
                where: {
                    courseId,
                    userId: { in: userIds }
                },
                data: {
                    progress: 0,
                    completedAt: null,
                    startedAt: new Date() // Reset start time? Maybe. Let's update it to 're-started'.
                }
            });

            // 2. Delete LessonProgress for this course
            // Need to find lessons first to filter simple delete
            // OR use deleteMany with where lesson.courseId provided prisma supports relation filtering in deleteMany (it generally doesn't for deep relations)
            // So we fetch lessons first.
            const lessons = await tx.lesson.findMany({ where: { courseId }, select: { id: true } });
            const lessonIds = lessons.map(l => l.id);

            await tx.lessonProgress.deleteMany({
                where: {
                    userId: { in: userIds },
                    lessonId: { in: lessonIds }
                }
            });

            // 3. Delete QuizAttempts? 'Reset Progress' usually implies retaking quizzes.
            await tx.quizAttempt.deleteMany({
                where: {
                    userId: { in: userIds },
                    lessonId: { in: lessonIds }
                }
            });
        });
    }

    async listEnrolledCourses(userId: string) {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: {
                    include: {
                        responsibleAdmin: { select: { id: true, name: true, avatar: true } },
                        _count: { select: { lessons: true } }
                    }
                }
            }
        });

        return enrollments.map(e => ({
            ...e.course,
            tags: e.course.tags ? JSON.parse(e.course.tags) : [],
            lessonsCount: e.course._count.lessons,
            progress: e.progress,
            _count: undefined
        }));
    }
}

export const courseService = new CourseService();
