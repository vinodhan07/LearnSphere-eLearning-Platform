// User roles
export type Role = 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';

// User interface
export interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    avatar: string | null;
    totalPoints: number;
}

// Auth response from API
export interface AuthResponse {
    user: User;
    token: string;
}

// Login request
export interface LoginRequest {
    email: string;
    password: string;
}

// Register request
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    role?: 'INSTRUCTOR' | 'LEARNER';
}

// Token refresh response
export interface RefreshResponse {
    accessToken: string;
}

// API error response
export interface ApiError {
    error: string;
    details?: Record<string, string[]>;
}
