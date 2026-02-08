import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User,
} from '@/types/auth';
import { Course } from '@/types/course';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Get the current access token from localStorage
 */
export function getAccessToken(): string | null {
    return localStorage.getItem('token');
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const accessToken = getAccessToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (accessToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;

            // Handle validation details from Zod
            if (error.details) {
                const detailMsg = Object.entries(error.details)
                    .map(([key, msgs]) => `${key}: ${(msgs as string[]).join(', ')}`)
                    .join(' | ');
                if (detailMsg) {
                    errorMessage = `${errorMessage}: ${detailMsg}`;
                }
            }
        } catch (e) {
            // If response is not JSON
            errorMessage = response.statusText;
        }

        throw new Error(errorMessage);
    }

    return response.json();
}

// ============ Auth API Functions ============

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
    }

    return response.json();
}

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
    }

    return response.json();
}

/**
 * Get the current user profile from the server
 */
export async function getCurrentUser(): Promise<{ user: User }> {
    return apiRequest('/auth/me');
}

// ============ Course API Functions ============

export async function getCourses(): Promise<Course[]> {
    return get<Course[]>('/courses');
}

export async function getCourse(id: string): Promise<Course> {
    return get<Course>(`/courses/${id}`);
}

export async function getEnrolledCourses(): Promise<Course[]> {
    return get<Course[]>('/courses/my/enrolled');
}

export async function getAdminCourses(): Promise<Course[]> {
    return get<Course[]>('/courses/admin/list');
}

export async function getCourseLessons(courseId: string): Promise<any[]> {
    return get<any[]>(`/courses/${courseId}/lessons`);
}

export async function enroll(courseId: string, paymentMethodId?: string): Promise<any> {
    return post(`/courses/${courseId}/enroll`, { paymentMethodId });
}

export async function updateLessonProgress(lessonId: string, data: { isCompleted: boolean, timeSpent?: number }): Promise<any> {
    return post(`/quizzes/${lessonId}/progress`, data);
}

export async function getCourseProgress(courseId: string): Promise<any> {
    return get(`/quizzes/course/${courseId}/progress`);
}

// ============ Quiz API Functions ============

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[] | string;
    correctIndex: number;
}

export async function getQuizQuestions(lessonId: string): Promise<QuizQuestion[]> {
    return get<QuizQuestion[]>(`/quizzes/${lessonId}/questions`);
}

export async function submitQuiz(lessonId: string, answers: number[]): Promise<any> {
    return post(`/quizzes/${lessonId}/submit`, { answers });
}

// ============ Generic API Helpers ============

export async function get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

export async function post<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    return apiRequest<T>(endpoint, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
    });
}

export async function put<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    return apiRequest<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
    });
}

export async function del<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}
