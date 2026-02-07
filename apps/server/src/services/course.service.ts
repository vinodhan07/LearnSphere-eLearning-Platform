import { supabase } from '../utils/supabase.js';
import { Visibility, AccessRule } from '../../../../shared/constants.js';
import { listAdminCourses } from '../controllers/courses.js';

export class CourseService {
    async createCourse(data: any, adminId: string) {
        const { title, description, tags, image, published, website, visibility, accessRule, price, currency } = data;

        const { data: course, error } = await supabase
            .from('Course')
            .insert({
                title,
                description,
                tags: tags || [],
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
            tags: course.tags || [],
        };
    }

    async listCourses(isAuthenticated: boolean) {
        console.log('listCourses called, isAuthenticated:', isAuthenticated);
        try {
            let query = supabase
                .from('Course')
                .select(`
                    *,
                    responsibleAdmin:User(id, name, avatar)
                `)
                .eq('published', true);

            if (!isAuthenticated) {
                query = query.eq('visibility', Visibility.EVERYONE);
            }

            const { data: courses, error } = await query.order('createdAt', { ascending: false });

            if (error) {
                console.error('Supabase error in listCourses:', error);
                throw new Error(`Failed to list courses: ${error.message}`);
            }

            console.log(`Found ${courses?.length || 0} courses`);

            // For each course, get the enrollment count
            const coursesWithCounts = await Promise.all(
                (courses || []).map(async (course: any) => {
                    const { count } = await supabase
                        .from('Enrollment')
                        .select('*', { count: 'exact', head: true })
                        .eq('courseId', course.id);

                    return {
                        ...course,
                        tags: course.tags || [],
                        enrolledCount: count || 0,
                    };
                })
            );

            return coursesWithCounts;
        } catch (err) {
            console.error('Catch block in listCourses:', err);
            throw err;
        }
    }

    async getCourse(id: string, user?: { userId: string, role: string }) {
        const isAuthenticated = !!user;
        const { data: course, error } = await supabase
            .from('Course')
            .select(`
                *,
                responsibleAdmin:User(id, name, email, avatar)
            `)
            .eq('id', id)
            .maybeSingle();

        if (error || !course) throw new Error('Course not found');

        // Get enrollment count
        const { count: enrolledCount } = await supabase
            .from('Enrollment')
            .select('*', { count: 'exact', head: true })
            .eq('courseId', id);

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
            tags: course.tags || [],
            enrolledCount: enrolledCount || 0,
            canStart,
            enrollmentStatus,
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
        if (data.tags !== undefined) updateData.tags = data.tags;
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
            tags: course.tags || [],
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
                lessons:Lesson(duration)
            `);

        if (user.role === 'INSTRUCTOR') {
            query = query.eq('responsibleAdminId', user.userId);
        }

        const { data: courses, error } = await query.order('createdAt', { ascending: false });

        if (error) throw new Error(`Failed to list admin courses: ${error.message}`);

        // For each course, get the counts
        const coursesWithCounts = await Promise.all(
            (courses || []).map(async (course: any) => {
                const [enrollResult, inviteResult, lessonResult] = await Promise.all([
                    supabase.from('Enrollment').select('*', { count: 'exact', head: true }).eq('courseId', course.id),
                    supabase.from('CourseInvitation').select('*', { count: 'exact', head: true }).eq('courseId', course.id),
                    supabase.from('Lesson').select('*', { count: 'exact', head: true }).eq('courseId', course.id),
                ]);

                return {
                    ...course,
                    tags: course.tags || [],
                    enrolledCount: enrollResult.count || 0,
                    invitationCount: inviteResult.count || 0,
                    lessonsCount: lessonResult.count || 0,
                    totalDuration: (course.lessons || []).reduce((sum: number, lesson: any) => sum + (lesson.duration || 0), 0),
                };
            })
        );

        return coursesWithCounts;
    }

    async getAttendees(id: string) {
        // Fetch base enrollments and invitations
        const [enrollRes, inviteRes] = await Promise.all([
            supabase.from('Enrollment').select('*, user:User(id, name, email, avatar)').eq('courseId', id),
            supabase.from('CourseInvitation').select('*, user:User(id, name, email, avatar)').eq('courseId', id),
        ]);

        if (enrollRes.error) throw new Error(`Failed to get enrollments: ${enrollRes.error.message}`);
        if (inviteRes.error) throw new Error(`Failed to get invitations: ${inviteRes.error.message}`);

        const enrollments = enrollRes.data || [];
        const invitations = inviteRes.data || [];

        // Enhance enrollments with additional metrics (Last Active, Quiz Scores)
        const enhancedEnrollments = await Promise.all(enrollments.map(async (enrollment: any) => {
            // 1. Get Last Active time (max lastAccessed from LessonProgress for this course)
            const { data: progressData } = await supabase
                .from('LessonProgress')
                .select('lastAccessed, lesson:Lesson!inner(courseId)')
                .eq('userId', enrollment.userId)
                .eq('lesson.courseId', id)
                .order('lastAccessed', { ascending: false })
                .limit(1)
                .maybeSingle();

            // 2. Calculate Average Quiz Score
            const { data: quizAttempts } = await supabase
                .from('QuizAttempt')
                .select('score, lesson:Lesson!inner(courseId)')
                .eq('userId', enrollment.userId)
                .eq('lesson.courseId', id);

            const attempts = quizAttempts || [];
            const avgScore = attempts.length > 0
                ? Math.round(attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.length)
                : 0;

            return {
                ...enrollment,
                lastAccessed: progressData?.lastAccessed || enrollment.enrolledAt,
                performance: avgScore,
                completed: enrollment.progress === 100,
            };
        }));

        return { enrollments: enhancedEnrollments, invitations };
    }

    async inviteAttendee(id: string, email: string) {
        const { data: user } = await supabase
            .from('User')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (!user) throw new Error('User with this email not found');

        const { data: existingInvitation } = await supabase
            .from('CourseInvitation')
            .select('*')
            .eq('courseId', id)
            .eq('userId', user.id)
            .maybeSingle();

        if (existingInvitation) {
            const { data, error } = await supabase
                .from('CourseInvitation')
                .update({
                    status: 'PENDING',
                    invitedAt: new Date().toISOString()
                })
                .eq('id', existingInvitation.id)
                .select()
                .single();
            if (error) throw new Error(`Failed to invite attendee: ${error.message}`);
            return data;
        }

        const { data, error } = await supabase
            .from('CourseInvitation')
            .insert({
                courseId: id,
                userId: user.id,
                status: 'PENDING',
                invitedAt: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to invite attendee: ${error.message}`);
        return data;
    }

    async bulkUnenroll(courseId: string, userIds: string[]) {
        const { error } = await supabase
            .from('Enrollment')
            .delete()
            .eq('courseId', courseId)
            .in('userId', userIds);

        if (error) throw new Error(`Failed to bulk unenroll: ${error.message}`);
    }

    async bulkResetProgress(courseId: string, userIds: string[]) {
        // 1. Reset Enrollment progress
        const { error: enrollError } = await supabase
            .from('Enrollment')
            .update({
                progress: 0,
                completedAt: null,
            })
            .eq('courseId', courseId)
            .in('userId', userIds);

        if (enrollError) throw new Error(`Failed to reset enrollment progress: ${enrollError.message}`);

        // 2. Fetch lessons to filter progress/attempts delete
        const { data: lessons } = await supabase
            .from('Lesson')
            .select('id')
            .eq('courseId', courseId);

        const lessonIds = (lessons || []).map(l => l.id);
        if (lessonIds.length === 0) return;

        // 3. Delete LessonProgress and QuizAttempts for this course and users
        const [progressError, quizError] = await Promise.all([
            supabase.from('LessonProgress').delete().in('userId', userIds).in('lessonId', lessonIds),
            supabase.from('QuizAttempt').delete().in('userId', userIds).in('lessonId', lessonIds),
        ]);

        if (progressError.error) throw new Error(`Failed to delete lesson progress: ${progressError.error.message}`);
        if (quizError.error) throw new Error(`Failed to delete quiz attempts: ${quizError.error.message}`);
    }

    async listEnrolledCourses(userId: string) {
        const { data: enrollments, error } = await supabase
            .from('Enrollment')
            .select(`
                *,
                course:Course(
                    *,
                    responsibleAdmin:User(id, name, avatar)
                )
            `)
            .eq('userId', userId);

        if (error) throw new Error(`Failed to list enrolled courses: ${error.message}`);

        // For each enrollment, get the lesson count
        const enrollmentsWithCounts = await Promise.all(
            (enrollments || []).map(async (e: any) => {
                const { count: lessonsCount } = await supabase
                    .from('Lesson')
                    .select('*', { count: 'exact', head: true })
                    .eq('courseId', e.course.id);

                return {
                    ...e.course,
                    tags: e.course.tags || [],
                    lessonsCount: lessonsCount || 0,
                    progress: e.progress,
                };
            })
        );

        return enrollmentsWithCounts;
    }
}

export const courseService = new CourseService();
