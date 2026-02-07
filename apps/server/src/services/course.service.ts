import { supabase } from '../utils/supabase.js';
import { Visibility, AccessRule } from '../../../../shared/constants.js';

export class CourseService {
    async createCourse(data: any, adminId: string) {
        const { title, description, tags, image, published, website, visibility, accessRule, price, currency } = data;

        const { data: course, error } = await supabase
            .from('Course')
            .insert({
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
            })
            .select(`
                *,
                responsibleAdmin:User(id, name, email, avatar)
            `)
            .single();

        if (error) throw new Error(`Failed to create course: ${error.message}`);

        return {
            ...course,
            tags: course.tags ? JSON.parse(course.tags) : [],
        };
    }

    async listCourses(isAuthenticated: boolean) {
        let query = supabase
            .from('Course')
            .select(`
                *,
                responsibleAdmin:User(id, name, avatar),
                enrollments:Enrollment(count)
            `)
            .eq('published', true);

        if (!isAuthenticated) {
            query = query.eq('visibility', Visibility.EVERYONE);
        }

        const { data: courses, error } = await query.order('createdAt', { ascending: false });

        if (error) throw new Error(`Failed to list courses: ${error.message}`);

        return (courses || []).map((course: any) => ({
            ...course,
            tags: course.tags ? JSON.parse(course.tags) : [],
            enrolledCount: course.enrollments?.[0]?.count || 0,
            enrollments: undefined,
        }));
    }

    async getCourse(id: string, user?: { userId: string, role: string }) {
        const isAuthenticated = !!user;
        const { data: course, error } = await supabase
            .from('Course')
            .select(`
                *,
                responsibleAdmin:User(id, name, email, avatar),
                enrollments:Enrollment(count)
            `)
            .eq('id', id)
            .maybeSingle();

        if (error || !course) throw new Error('Course not found');

        const updateViews = !isAuthenticated || (user!.role === 'LEARNER');
        if (updateViews) {
            void (async () => {
                const { error: rpcError } = await supabase.rpc('increment_course_views', { course_id: id });
                if (rpcError) console.error('Failed to increment views:', rpcError.message);
            })();
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
            const { data: enrollment } = await supabase
                .from('Enrollment')
                .select('*')
                .eq('userId', user!.userId)
                .eq('courseId', id)
                .maybeSingle();

            if (enrollment) {
                canStart = true;
                enrollmentStatus = 'ENROLLED';
            } else {
                switch (course.accessRule) {
                    case AccessRule.OPEN:
                        canStart = true;
                        break;
                    case AccessRule.INVITE:
                        const { data: invitation } = await supabase
                            .from('CourseInvitation')
                            .select('*')
                            .eq('courseId', id)
                            .eq('userId', user!.userId)
                            .maybeSingle();

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
            enrolledCount: course.enrollments?.[0]?.count || 0,
            canStart,
            enrollmentStatus,
            enrollments: undefined,
        };
    }

    async updateCourse(id: string, data: any, user: { userId: string, role: string }) {
        const { data: existingCourse } = await supabase
            .from('Course')
            .select('*')
            .eq('id', id)
            .maybeSingle();

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

        const { data: course, error } = await supabase
            .from('Course')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                responsibleAdmin:User(id, name, email, avatar)
            `)
            .single();

        if (error) throw new Error(`Failed to update course: ${error.message}`);

        return {
            ...course,
            tags: course.tags ? JSON.parse(course.tags) : [],
        };
    }

    async deleteCourse(id: string, user: { userId: string, role: string }) {
        const { data: course } = await supabase
            .from('Course')
            .select('responsibleAdminId')
            .eq('id', id)
            .maybeSingle();

        if (!course) throw new Error('Course not found');

        if (course.responsibleAdminId !== user.userId && user.role !== 'ADMIN') {
            throw new Error('Not authorized to delete this course');
        }

        const { error } = await supabase.from('Course').delete().eq('id', id);
        if (error) throw new Error(`Failed to delete course: ${error.message}`);
    }

    async enroll(id: string, userId: string, paymentInfo?: any) {
        const { data: course } = await supabase
            .from('Course')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (!course || !course.published) throw new Error('Course not found');

        const { data: existingEnrollment } = await supabase
            .from('Enrollment')
            .select('*')
            .eq('userId', userId)
            .eq('courseId', id)
            .maybeSingle();

        if (existingEnrollment) throw new Error('Already enrolled in this course');

        switch (course.accessRule) {
            case AccessRule.OPEN:
                break;
            case AccessRule.INVITE:
                const { data: invitation } = await supabase
                    .from('CourseInvitation')
                    .select('*')
                    .eq('courseId', id)
                    .eq('userId', userId)
                    .maybeSingle();

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
                const { data: paidEnrollment, error: payError } = await supabase
                    .from('Enrollment')
                    .insert({ userId, courseId: id, paidAmount: paymentInfo.paidAmount || course.price, paidAt: new Date().toISOString() })
                    .select()
                    .single();
                if (payError) throw new Error(`Enrollment failed: ${payError.message}`);
                return paidEnrollment;
        }

        const { data: enrollment, error: enrollError } = await supabase
            .from('Enrollment')
            .insert({ userId, courseId: id })
            .select()
            .single();

        if (enrollError) throw new Error(`Enrollment failed: ${enrollError.message}`);
        return enrollment;
    }

    async listAdminCourses(user: { userId: string, role: string }) {
        let query = supabase
            .from('Course')
            .select(`
                *,
                responsibleAdmin:User(id, name, avatar),
                lessons:Lesson(duration),
                enrollments:Enrollment(count),
                invitations:CourseInvitation(count),
                lessons_count:Lesson(count)
            `);

        if (user.role === 'INSTRUCTOR') {
            query = query.eq('responsibleAdminId', user.userId);
        }

        const { data: courses, error } = await query.order('createdAt', { ascending: false });

        if (error) throw new Error(`Failed to list admin courses: ${error.message}`);

        return (courses || []).map((course: any) => ({
            ...course,
            tags: course.tags ? JSON.parse(course.tags) : [],
            enrolledCount: course.enrollments?.[0]?.count || 0,
            invitationCount: course.invitations?.[0]?.count || 0,
            lessonsCount: course.lessons_count?.[0]?.count || 0,
            totalDuration: (course.lessons || []).reduce((sum: number, lesson: any) => sum + (lesson.duration || 0), 0),
            enrollments: undefined,
            invitations: undefined,
            lessons: undefined,
            lessons_count: undefined,
        }));
    }

    async getAttendees(id: string) {
<<<<<<< HEAD
        const [enrollRes, inviteRes] = await Promise.all([
            supabase.from('Enrollment').select('*, user:User(id, name, email, avatar)').eq('courseId', id),
            supabase.from('CourseInvitation').select('*, user:User(id, name, email, avatar)').eq('courseId', id),
        ]);

        if (enrollRes.error) throw new Error(`Failed to get enrollments: ${enrollRes.error.message}`);
        if (inviteRes.error) throw new Error(`Failed to get invitations: ${inviteRes.error.message}`);

        return { enrollments: enrollRes.data, invitations: inviteRes.data };
=======
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
>>>>>>> 0e6e3a9e5ee2620d7978f2025d8f2d66fe3d2be0
    }

    async inviteAttendee(id: string, email: string) {
        const { data: user } = await supabase
            .from('User')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (!user) throw new Error('User with this email not found');

        const { data, error } = await supabase
            .from('CourseInvitation')
            .upsert({
                courseId: id,
                userId: user.id,
                status: 'PENDING',
                invitedAt: new Date().toISOString()
            }, { onConflict: 'courseId,userId' })
            .select()
            .single();

        if (error) throw new Error(`Failed to invite attendee: ${error.message}`);
        return data;
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
        const { data: enrollments, error } = await supabase
            .from('Enrollment')
            .select(`
                *,
                course:Course(
                    *,
                    responsibleAdmin:User(id, name, avatar),
                    lessons:Lesson(count)
                )
            `)
            .eq('userId', userId);

        if (error) throw new Error(`Failed to list enrolled courses: ${error.message}`);

        return (enrollments || []).map((e: any) => ({
            ...e.course,
            tags: e.course.tags ? JSON.parse(e.course.tags) : [],
            lessonsCount: e.course.lessons?.[0]?.count || 0,
            progress: e.progress,
            lessons: undefined
        }));
    }
}

export const courseService = new CourseService();
