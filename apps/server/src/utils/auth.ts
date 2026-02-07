// Role type (stored as string in SQLite)
export type Role = 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';

export interface TokenPayload {
    userId: string;
    email: string;
    role: Role;
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
