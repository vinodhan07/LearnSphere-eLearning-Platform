export interface Course {
  id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  image?: string;
  tags: string[];
  instructor?: string;
  instructorAvatar?: string;
  totalLessons: number;
  completedLessons?: number;
  duration?: string;
  totalDuration?: number;
  rating?: number;
  reviewCount?: number;
  price: number | null;
  visibility: "EVERYONE" | "SIGNED_IN";
  access: "OPEN" | "INVITE" | "PAID";
  status: "draft" | "published" | "archived";
  published: boolean;
  enrolledCount: number;
  progress?: number;
  category?: string;
  views?: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  type: "video" | "document" | "image" | "quiz";
  duration: string;
  completed: boolean;
  description: string;
  videoUrl?: string;
  content?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  questions: QuizQuestion[];
  rewards: { attempt: number; points: number }[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: { id: string; text: string; isCorrect: boolean }[];
}

export interface Review {
  id: string;
  courseId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  text: string;
  date: string;
}

export interface LearnerProfile {
  name: string;
  email: string;
  avatar: string;
  totalPoints: number;
  badge: string;
  coursesCompleted: number;
  coursesInProgress: number;
}

export interface ReportingRow {
  id: string;
  courseName: string;
  participantName: string;
  participantAvatar: string;
  enrolledDate: string;
  startDate: string | null;
  timeSpent: string;
  completionPercentage: number;
  completedDate: string | null;
  status: "yet_to_start" | "in_progress" | "completed";
}

export const badges = [
  { name: "Newbie", points: 20, icon: "🌱" },
  { name: "Explorer", points: 40, icon: "🧭" },
  { name: "Achiever", points: 60, icon: "🏆" },
  { name: "Specialist", points: 80, icon: "⭐" },
  { name: "Expert", points: 100, icon: "💎" },
  { name: "Master", points: 120, icon: "👑" },
];

export const mockCourses: Course[] = [];
export const mockLessons: Lesson[] = [];
export const mockQuiz: Quiz = { id: "", courseId: "", title: "", questions: [], rewards: [] };
export const mockReviews: Review[] = [];
export const mockProfile: LearnerProfile = {
  name: "Guest",
  email: "",
  avatar: "",
  totalPoints: 0,
  badge: "Newbie",
  coursesCompleted: 0,
  coursesInProgress: 0,
};
export const mockReporting: ReportingRow[] = [];

export function getBadgeForPoints(points: number) {
  const sorted = [...badges].sort((a, b) => b.points - a.points);
  for (const badge of sorted) {
    if (points >= badge.points) return badge;
  }
  return badges[0];
}

export function getNextBadge(points: number) {
  const sorted = [...badges].sort((a, b) => a.points - b.points);
  for (const badge of sorted) {
    if (points < badge.points) return badge;
  }
  return null;
}
