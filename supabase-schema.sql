-- LearnSphere Supabase Schema

-- 1. Users table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public."User" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'LEARNER' CHECK (role IN ('ADMIN', 'INSTRUCTOR', 'LEARNER')),
    avatar TEXT,
    "totalPoints" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to sync user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, avatar)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Courses table
CREATE TABLE IF NOT EXISTS public."Course" (
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
CREATE TABLE IF NOT EXISTS public."Lesson" (
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

-- 4. Attachments table
CREATE TABLE IF NOT EXISTS public."Attachment" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "lessonId" UUID REFERENCES public."Lesson"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER,
    type TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Quizzes (Container for metadata if needed, but Lesson usually suffices)
CREATE TABLE IF NOT EXISTS public."Quiz" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "lessonId" UUID REFERENCES public."Lesson"(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    "timeLimit" INTEGER, -- in minutes
    "maxAttempts" INTEGER DEFAULT 0, -- 0 for unlimited
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Quiz Questions
CREATE TABLE IF NOT EXISTS public."QuizQuestion" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "lessonId" UUID REFERENCES public."Lesson"(id) ON DELETE CASCADE,
    "quizId" UUID REFERENCES public."Quiz"(id) ON DELETE CASCADE, -- Optional link to Quiz table
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    "correctIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enrollments
CREATE TABLE IF NOT EXISTS public."Enrollment" (
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

-- 8. Course Invitations
CREATE TABLE IF NOT EXISTS public."CourseInvitation" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "courseId" UUID REFERENCES public."Course"(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    "invitedAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("courseId", "email")
);

-- 9. Lesson Progress
CREATE TABLE IF NOT EXISTS public."LessonProgress" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    "lessonId" UUID REFERENCES public."Lesson"(id) ON DELETE CASCADE,
    "isCompleted" BOOLEAN DEFAULT FALSE,
    "timeSpent" INTEGER DEFAULT 0,
    "lastAccessed" TIMESTAMPTZ DEFAULT NOW(),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("userId", "lessonId")
);

-- 10. Quiz Attempts
CREATE TABLE IF NOT EXISTS public."QuizAttempt" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    "lessonId" UUID REFERENCES public."Lesson"(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    "pointsEarned" INTEGER DEFAULT 0,
    "submittedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Quiz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuizQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CourseInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LessonProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuizAttempt" ENABLE ROW LEVEL SECURITY;

-- 1. User Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public."User";
CREATE POLICY "Users can view their own profile" ON public."User" FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public."User";
CREATE POLICY "Admins can view all profiles" ON public."User" FOR SELECT USING ((auth.jwt()->>'role')::text = 'ADMIN');

DROP POLICY IF EXISTS "Users can update their own profile" ON public."User";
CREATE POLICY "Users can update their own profile" ON public."User" FOR UPDATE USING (auth.uid() = id);

-- 2. Course Policies
DROP POLICY IF EXISTS "Anyone can view published courses" ON public."Course";
CREATE POLICY "Anyone can view published courses" ON public."Course" FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Instructors can view their own courses" ON public."Course";
CREATE POLICY "Instructors can view their own courses" ON public."Course" FOR SELECT USING (auth.uid() = "responsibleAdminId");

DROP POLICY IF EXISTS "Admins can view all courses" ON public."Course";
CREATE POLICY "Admins can view all courses" ON public."Course" FOR SELECT USING ((auth.jwt()->>'role')::text = 'ADMIN');

DROP POLICY IF EXISTS "Instructors can create/manage their courses" ON public."Course";
CREATE POLICY "Instructors can create/manage their courses" ON public."Course" FOR ALL USING (auth.uid() = "responsibleAdminId" OR (auth.jwt()->>'role')::text = 'ADMIN');

-- 3. Lesson Policies
DROP POLICY IF EXISTS "Enrolled students can view lessons" ON public."Lesson";
CREATE POLICY "Enrolled students can view lessons" ON public."Lesson" FOR SELECT USING (
    EXISTS (SELECT 1 FROM public."Enrollment" e WHERE e."courseId" = public."Lesson"."courseId" AND e."userId" = auth.uid()) OR
    EXISTS (SELECT 1 FROM public."Course" c WHERE c.id = public."Lesson"."courseId" AND (c."responsibleAdminId" = auth.uid() OR c.published = true))
);

DROP POLICY IF EXISTS "Instructors can manage lessons" ON public."Lesson";
CREATE POLICY "Instructors can manage lessons" ON public."Lesson" FOR ALL USING (
    EXISTS (SELECT 1 FROM public."Course" c WHERE c.id = public."Lesson"."courseId" AND c."responsibleAdminId" = auth.uid()) OR
    (auth.jwt()->>'role')::text = 'ADMIN'
);

-- 4. Attachment Policies
DROP POLICY IF EXISTS "Access via lesson enrollment" ON public."Attachment";
CREATE POLICY "Access via lesson enrollment" ON public."Attachment" FOR SELECT USING (
    EXISTS (SELECT 1 FROM public."Lesson" l JOIN public."Enrollment" e ON l."courseId" = e."courseId" WHERE l.id = public."Attachment"."lessonId" AND e."userId" = auth.uid())
);

-- 5. Enrollment Policies
DROP POLICY IF EXISTS "Users view own enrollments" ON public."Enrollment";
CREATE POLICY "Users view own enrollments" ON public."Enrollment" FOR SELECT USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Instructors view enrollments for their courses" ON public."Enrollment";
CREATE POLICY "Instructors view enrollments for their courses" ON public."Enrollment" FOR SELECT USING (
    EXISTS (SELECT 1 FROM public."Course" c WHERE c.id = public."Enrollment"."courseId" AND c."responsibleAdminId" = auth.uid())
);

-- Storage Buckets Configuration (Run in SQL Editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('course-images', 'course-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-attachments', 'lesson-attachments', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-avatars', 'user-avatars', true);

-- Storage Policies
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'course-images' OR bucket_id = 'user-avatars' );
-- CREATE POLICY "Owner Update" ON storage.objects FOR ALL USING ( auth.uid() = owner ) WITH CHECK ( auth.uid() = owner );
