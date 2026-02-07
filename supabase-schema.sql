-- LearnSphere Supabase Schema

-- 1. Users table (Extends Supabase Auth)
CREATE TABLE public."User" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'LEARNER' CHECK (role IN ('ADMIN', 'INSTRUCTOR', 'LEARNER')),
    avatar TEXT,
    "totalPoints" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Courses table
CREATE TABLE public."Course" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    image TEXT,
    published BOOLEAN DEFAULT FALSE,
    website TEXT,
    visibility TEXT DEFAULT 'EVERYONE' CHECK (visibility IN ('EVERYONE', 'SIGNED_IN')),
    "accessRule" TEXT DEFAULT 'OPEN' CHECK ("accessRule" IN ('OPEN', 'INVITE', 'PAID')),
    price NUMERIC,
    currency TEXT DEFAULT 'USD',
    "responsibleAdminId" UUID REFERENCES public."User"(id) ON DELETE SET NULL,
    views INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Lessons table
CREATE TABLE public."Lesson" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "courseId" UUID REFERENCES public."Course"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'video' CHECK (type IN ('video', 'document', 'image', 'quiz')),
    content TEXT, -- URL or markdown content
    duration INTEGER DEFAULT 0, -- in minutes or seconds
    "allowDownload" BOOLEAN DEFAULT FALSE,
    description TEXT,
    "order" INTEGER DEFAULT 0,
    "passScore" INTEGER DEFAULT 70, -- for quiz
    "pointsReward" INTEGER DEFAULT 10,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Quiz Questions
CREATE TABLE public."QuizQuestion" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "lessonId" UUID REFERENCES public."Lesson"(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    "correctIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enrollments
CREATE TABLE public."Enrollment" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "courseId" UUID REFERENCES public."Course"(id) ON DELETE CASCADE,
    "userId" UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    "enrolledAt" TIMESTAMPTZ DEFAULT NOW(),
    "completedAt" TIMESTAMPTZ,
    "paidAmount" NUMERIC,
    "paidAt" TIMESTAMPTZ,
    UNIQUE("courseId", "userId")
);

-- 6. Course Invitations
CREATE TABLE public."CourseInvitation" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "courseId" UUID REFERENCES public."Course"(id) ON DELETE CASCADE,
    "userId" UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    "invitedAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("courseId", "userId")
);

-- 7. Lesson Progress
CREATE TABLE public."LessonProgress" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    "lessonId" UUID REFERENCES public."Lesson"(id) ON DELETE CASCADE,
    "isCompleted" BOOLEAN DEFAULT FALSE,
    "timeSpent" INTEGER DEFAULT 0,
    "lastAccessed" TIMESTAMPTZ DEFAULT NOW(),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("userId", "lessonId")
);

-- 8. Quiz Attempts
CREATE TABLE public."QuizAttempt" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    "lessonId" UUID REFERENCES public."Lesson"(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    "pointsEarned" INTEGER DEFAULT 0,
    "submittedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Refresh Tokens
CREATE TABLE public."RefreshToken" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    "userId" UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- RPC for incrementing views
CREATE OR REPLACE FUNCTION increment_course_views(course_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public."Course"
    SET views = views + 1
    WHERE id = course_id;
END;
$$ LANGUAGE plpgsql;

-- RPC for incrementing user points
CREATE OR REPLACE FUNCTION increment_user_points(user_id UUID, points INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE public."User"
    SET "totalPoints" = "totalPoints" + points
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (Basic examples, need to be refined per table)
ALTER TABLE public."Course" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published courses" ON public."Course"
    FOR SELECT USING (published = true);

CREATE POLICY "Instructors can manage their own courses" ON public."Course"
    FOR ALL USING (auth.uid() = "responsibleAdminId");
