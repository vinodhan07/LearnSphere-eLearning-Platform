-- LearnSphere Database Schema (PostgreSQL)
-- For execution in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'LEARNER',
    "avatar" TEXT,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RefreshTokens Table
CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "token" TEXT UNIQUE NOT NULL,
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE IF NOT EXISTS "Course" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT, -- JSON array stored as text
    "image" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT FALSE,
    "website" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'EVERYONE',
    "accessRule" TEXT NOT NULL DEFAULT 'OPEN',
    "price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "responsibleAdminId" UUID NOT NULL REFERENCES "User"("id"),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "viewsCount" INTEGER NOT NULL DEFAULT 0
);

-- Lessons Table
CREATE TABLE IF NOT EXISTS "Lesson" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'video',
    "order" INTEGER NOT NULL DEFAULT 0,
    "pointsReward" INTEGER NOT NULL DEFAULT 10,
    "passScore" INTEGER NOT NULL DEFAULT 80,
    "allowDownload" BOOLEAN NOT NULL DEFAULT TRUE,
    "attachments" TEXT, -- JSON array of objects
    "courseId" UUID NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- QuizQuestions Table
CREATE TABLE IF NOT EXISTS "QuizQuestion" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "question" TEXT NOT NULL,
    "options" TEXT NOT NULL, -- JSON array of strings
    "correctIndex" INTEGER NOT NULL,
    "lessonId" UUID NOT NULL REFERENCES "Lesson"("id") ON DELETE CASCADE
);

-- QuizAttempts Table
CREATE TABLE IF NOT EXISTS "QuizAttempt" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "lessonId" UUID NOT NULL REFERENCES "Lesson"("id") ON DELETE CASCADE,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- LessonProgress Table
CREATE TABLE IF NOT EXISTS "LessonProgress" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "lessonId" UUID NOT NULL REFERENCES "Lesson"("id") ON DELETE CASCADE,
    "isCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "lastAccessed" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "lessonId")
);

-- Enrollments Table
CREATE TABLE IF NOT EXISTS "Enrollment" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "courseId" UUID NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
    "paidAmount" DOUBLE PRECISION,
    "paidAt" TIMESTAMP WITH TIME ZONE,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP WITH TIME ZONE,
    UNIQUE("userId", "courseId")
);

-- CourseInvitations Table
CREATE TABLE IF NOT EXISTS "CourseInvitation" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "courseId" UUID NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("courseId", "userId")
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_course_published" ON "Course"("published");
CREATE INDEX IF NOT EXISTS "idx_lesson_courseId" ON "Lesson"("courseId");
CREATE INDEX IF NOT EXISTS "idx_quiz_attempt_userId" ON "QuizAttempt"("userId");
CREATE INDEX IF NOT EXISTS "idx_quiz_attempt_lessonId" ON "QuizAttempt"("lessonId");
CREATE INDEX IF NOT EXISTS "idx_enrollment_userId" ON "Enrollment"("userId");
CREATE INDEX IF NOT EXISTS "idx_enrollment_courseId" ON "Enrollment"("courseId");

-- RPC functions
CREATE OR REPLACE FUNCTION increment_course_views(course_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE "Course"
    SET "viewsCount" = "viewsCount" + 1
    WHERE id = course_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_user_points(user_id UUID, points INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE "User"
    SET "totalPoints" = "totalPoints" + points
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
