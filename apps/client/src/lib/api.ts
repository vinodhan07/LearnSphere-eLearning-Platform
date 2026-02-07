import { supabase } from './supabase';
import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    RefreshResponse,
    User,
} from '@/types/auth';
import { Course } from '@/types/course';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Get the current access token from Supabase session
 */
export async function getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const accessToken = await getAccessToken();

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

    const authResponse: AuthResponse = await response.json();
    return authResponse;
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

    const authResponse: AuthResponse = await response.json();
    return authResponse;
}

// ============ Auth API Functions ============

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
