import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Role type (stored as string in SQLite)
export type Role = 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';

// Environment variables (use defaults for development)
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'learnsphere-access-secret-dev';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'learnsphere-refresh-secret-dev';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface TokenPayload {
    userId: string;
    email: string;
    role: Role;
}

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate an access token (short-lived)
 */
export function generateAccessToken(user: { id: string, email: string, role: string }): string {
    const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role as Role,
    };
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generate a refresh token string
 */
export function generateRefreshTokenString(): string {
    return crypto.randomBytes(64).toString('hex');
}

export function getRefreshTokenExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    return expiresAt;
}

/**
 * Verify an access token and return the payload
 */
export function verifyAccessToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch {
        return null;
    }
}

/**
 * Role hierarchy helpers
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
    ADMIN: 3,
    INSTRUCTOR: 2,
    LEARNER: 1,
};

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
