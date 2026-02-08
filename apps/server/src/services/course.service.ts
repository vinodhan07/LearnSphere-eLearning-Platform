import prisma from '../utils/prisma';
import { Visibility, AccessRule } from '../../../../shared/constants';

export class CourseService {
    async createCourse(data: any, adminId: string) {
        const { title, description, tags, image, published, website, visibility, accessRule, price, currency } = data;

        const course = await prisma.course.create({
            data: {
                title,
                description,
                tags: tags ? JSON.stringify(tags) : undefined,
                image: image || null,
                published: published || false,
                website: website || null,
                visibility: visibility || Visibility.EVERYONE,
                accessRule: accessRule || AccessRule.OPEN,
                price: accessRule === AccessRule.PAID ? price : null,
                currency: currency || 'USD',
                responsibleAdminId: adminId,
            },
            include: {
                responsibleAdmin: {
                    select: { id: true, name: true, email: true, avatar: true }
                }
            }
        });

        return {
            ...course,
            tags: course.tags ? JSON.parse(course.tags as string) : [],
        };
    }

    async listCourses(isAuthenticated: boolean) {
        try {
            const where: any = { published: true };
            if (!isAuthenticated) {
                where.visibility = Visibility.EVERYONE;
            }

            const courses = await prisma.course.findMany({
                where,
                include: {
                    responsibleAdmin: {
                        select: { id: true, name: true, avatar: true }
                    },
                    enrollments: {
                        select: { id: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            return courses.map(course => ({
                ...course,
                tags: course.tags ? JSON.parse(course.tags as string) : [],
                enrolledCount: course.enrollments.length
            }));
        } catch (err) {
            console.error('Error in listCourses:', err);
            throw err;
        }
    }

    async getCourse(id: string, user?: { userId: string, role: string }) {
        const isAuthenticated = !!user;

        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                responsibleAdmin: {
                    select: { id: true, name: true, email: true, avatar: true }
                },
                enrollments: {
                    where: { userId: user?.userId },
                },
                invitations: {
                    where: { userId: user?.userId },
                }
            }
        });

        if (!course) throw new Error('Course not found');

        // Get total enrollment count
        const enrolledCount = await prisma.enrollment.count({
            where: { courseId: id }
        });

        const updateViews = !isAuthenticated || (user!.role === 'LEARNER');
        if (updateViews) {
            // Fire and forget view increment
            prisma.course.update({
                where: { id },
                data: { viewsCount: { increment: 1 } }
            }).catch(console.error);
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
        let userEnrollment = null;

        if (isAuthenticated) {
            userEnrollment = course.enrollments[0] || null;

            if (userEnrollment) {
                canStart = true;
                enrollmentStatus = 'ENROLLED';
            } else {
                switch (course.accessRule) {
                    case AccessRule.OPEN:
                        canStart = true;
                        break;
                    case AccessRule.INVITE:
                        const invitation = course.invitations[0];
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
            tags: course.tags ? JSON.parse(course.tags as string) : [],
            enrolledCount,
            canStart,
            enrollmentStatus,
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

        if (mergedData.accessRule === AccessRule.PAID && (!mergedData.price || mergedData.price <= 0)) {
            throw new Error('Price is required when access rule is PAID');
        }

        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.tags !== undefined) updateData.tags = data.tags ? JSON.stringify(data.tags) : null;
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
                responsibleAdmin: {
                    select: { id: true, name: true, email: true, avatar: true }
                }
            }
        });

        return {
            ...course,
            tags: course.tags ? JSON.parse(course.tags as string) : [],
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
            where: {
                userId_courseId: { userId, courseId: id }
            }
        });

        if (existingEnrollment) throw new Error('Already enrolled in this course');

        switch (course.accessRule) {
            case AccessRule.OPEN:
                break;
            case AccessRule.INVITE:
                const invitation = await prisma.courseInvitation.findUnique({
                    where: {
                        courseId_userId: { courseId: id, userId }
                    }
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
                // Record payment info in enrollment
                return await prisma.enrollment.create({
                    data: {
                        userId,
                        courseId: id,
                        paidAmount: paymentInfo.paidAmount || course.price,
                        paidAt: new Date()
                    }
                });
        }

        return await prisma.enrollment.create({
            data: { userId, courseId: id }
        });
    }

    async listAdminCourses(user: { userId: string, role: string }) {
        const where: any = {};

        if (user.role === 'INSTRUCTOR') {
            where.responsibleAdminId = user.userId;
        }

        const courses = await prisma.course.findMany({
            where,
            include: {
                responsibleAdmin: {
                    select: { id: true, name: true, avatar: true }
                },
                lessons: {
                    select: { duration: true }
                },
                enrollments: { select: { id: true } },
                invitations: { select: { id: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return courses.map(course => ({
            ...course,
            tags: course.tags ? JSON.parse(course.tags as string) : [],
            enrolledCount: course.enrollments.length,
            invitationCount: course.invitations.length,
            lessonsCount: course.lessons.length,
            totalDuration: course.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
        }));
    }

    async getAttendees(id: string) {
        // Fetch base enrollments and invitations
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                enrollments: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } }
                    }
                },
                invitations: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } }
                    }
                }
            }
        });

        if (!course) throw new Error('Course not found');

        const enrollments = course.enrollments;
        const invitations = course.invitations;

        // Enhance enrollments with additional metrics (Last Active, Quiz Scores)
        const enhancedEnrollments = await Promise.all(enrollments.map(async (enrollment) => {
            // 1. Get Last Active time (max lastAccessed from LessonProgress for this course)
            const progressData = await prisma.lessonProgress.findFirst({
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
                : 0;

            return {
                ...enrollment,
                lastAccessed: progressData?.lastAccessed || enrollment.startedAt, // Using startedAt as fallback implies enrolledAt
                performance: avgScore,
                completed: enrollment.progress === 100,
            };
        }));

        return { enrollments: enhancedEnrollments, invitations };
    }

    async inviteAttendee(id: string, email: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) throw new Error('User with this email not found');

        return await prisma.courseInvitation.upsert({
            where: {
                courseId_userId: { courseId: id, userId: user.id }
            },
            update: {
                status: 'PENDING',
                invitedAt: new Date()
            },
            create: {
                courseId: id,
                userId: user.id,
                status: 'PENDING',
                invitedAt: new Date()
            }
        });
    }

    async bulkUnenroll(courseId: string, userIds: string[]) {
        await prisma.enrollment.deleteMany({
            where: {
                courseId,
                userId: { in: userIds }
            }
        });
    }

    async bulkResetProgress(courseId: string, userIds: string[]) {
        // 1. Reset Enrollment progress
        await prisma.enrollment.updateMany({
            where: {
                courseId,
                userId: { in: userIds }
            },
            data: {
                progress: 0,
                completedAt: null,
            }
        });

        // 2. Fetch lessons to filter progress/attempts delete
        const lessons = await prisma.lesson.findMany({
            where: { courseId },
            select: { id: true }
        });

        const lessonIds = lessons.map(l => l.id);
        if (lessonIds.length === 0) return;

        // 3. Delete LessonProgress and QuizAttempts for this course and users
        await Promise.all([
            prisma.lessonProgress.deleteMany({
                where: {
                    userId: { in: userIds },
                    lessonId: { in: lessonIds }
                }
            }),
            prisma.quizAttempt.deleteMany({
                where: {
                    userId: { in: userIds },
                    lessonId: { in: lessonIds }
                }
            })
        ]);
    }

    async listEnrolledCourses(userId: string) {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: {
                    include: {
                        responsibleAdmin: { select: { id: true, name: true, avatar: true } },
                        lessons: { select: { id: true } }
                    }
                }
            }
        });

        return enrollments.map(e => ({
            ...e.course,
            tags: e.course.tags ? JSON.parse(e.course.tags as string) : [],
            lessonsCount: e.course.lessons.length,
            progress: e.progress,
        }));
    }

    async listAdminEnrollments(user: { userId: string, role: string }) {
        const where: any = {};
        if (user.role !== 'ADMIN') {
            where.course = { responsibleAdminId: user.userId };
        }

        return prisma.enrollment.findMany({
            where,
            include: {
                course: {
                    select: { id: true, title: true }
                },
                user: {
                    select: { id: true, name: true, email: true, avatar: true }
                }
            },
            orderBy: { startedAt: 'desc' }
        });
    }
}

export const courseService = new CourseService();
