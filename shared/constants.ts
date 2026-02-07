// Shared Constants for LearnSphere

export const Visibility = {
    EVERYONE: 'EVERYONE',
    SIGNED_IN: 'SIGNED_IN',
} as const;

export type Visibility = (typeof Visibility)[keyof typeof Visibility];

export const AccessRule = {
    OPEN: 'OPEN',
    INVITE: 'INVITE',
    PAID: 'PAID',
} as const;

export type AccessRule = (typeof AccessRule)[keyof typeof AccessRule];

export const InvitationStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
} as const;

export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

export const UserRole = {
    ADMIN: 'ADMIN',
    INSTRUCTOR: 'INSTRUCTOR',
    LEARNER: 'LEARNER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
