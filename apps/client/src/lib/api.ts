import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    RefreshResponse,
    User,
} from '@/types/auth';
import { Course } from '@/types/course';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'learnsphere_access_token';
const REFRESH_TOKEN_KEY = 'learnsphere_refresh_token';

/**
 * Get the stored access token
 */
export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get the stored refresh token
 */
export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Store tokens in localStorage
 */
export function setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Clear stored tokens
 */
export function clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Check if we have a stored token
 */
export function hasStoredToken(): boolean {
    return !!getAccessToken();
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

    // Handle 401 - try to refresh token
    if (response.status === 401 && getRefreshToken()) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // Retry request with new token
            const newAccessToken = getAccessToken();
            (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
            const retryResponse = await fetch(url, { ...options, headers });
            if (!retryResponse.ok) {
                const error = await retryResponse.json();
                throw new Error(error.error || 'Request failed');
            }
            return retryResponse.json();
        } else {
            // Refresh failed, clear tokens
            clearTokens();
            throw new Error('Session expired. Please login again.');
        }
    }

    if (!response.ok) {
        const error = await response.json();
        let errorMessage = error.error || 'Request failed';

        // Handle validation details from Zod
        if (error.details) {
            const detailMsg = Object.entries(error.details)
                .map(([key, msgs]) => `${key}: ${(msgs as string[]).join(', ')}`)
                .join(' | ');
            if (detailMsg) {
                errorMessage = `${errorMessage}: ${detailMsg}`;
            }
        }

        throw new Error(errorMessage);
    }

    return response.json();
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) return false;

        const data: RefreshResponse = await response.json();
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        return true;
    } catch {
        return false;
    }
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
    setTokens(authResponse.accessToken, authResponse.refreshToken);
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
    setTokens(authResponse.accessToken, authResponse.refreshToken);
    return authResponse;
}

/**
 * Login with Google OAuth credential
 */
export async function googleLogin(credential: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Google login failed');
    }

    const authResponse: AuthResponse = await response.json();
    setTokens(authResponse.accessToken, authResponse.refreshToken);
    return authResponse;
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
    try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            await apiRequest('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
            });
        }
    } catch {
        // Ignore errors during logout
    } finally {
        clearTokens();
    }
}

/**
 * Get the current user profile
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
