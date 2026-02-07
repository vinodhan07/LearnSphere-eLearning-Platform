import prisma from '../utils/prisma.js';
import {
    hashPassword,
    verifyPassword,
    generateAccessToken,
    generateRefreshTokenString,
    getRefreshTokenExpiry,
    Role
} from '../utils/auth.js';

export class AuthService {
    async register(data: any) {
        const { email, password, name, role } = data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new Error('Email already registered');

        // Create user
        const hashedPassword = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role as Role,
            },
        });

        return await this.createAuthResponse(user);
    }

    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error('Invalid email or password');

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) throw new Error('Invalid email or password');

        return await this.createAuthResponse(user);
    }

    async googleAuth(payload: any) {
        let user = await prisma.user.findUnique({ where: { email: payload.email } });

        if (!user) {
            const randomPassword = await hashPassword(Math.random().toString(36).slice(-12));
            user = await prisma.user.create({
                data: {
                    email: payload.email,
                    password: randomPassword,
                    name: payload.name || payload.email.split('@')[0],
                    role: 'LEARNER',
                    avatar: payload.picture || null,
                },
            });
        }

        return await this.createAuthResponse(user);
    }

    async refreshTokens(token: string) {
        const refreshToken = await prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!refreshToken || refreshToken.expiresAt < new Date()) {
            if (refreshToken) await prisma.refreshToken.delete({ where: { id: refreshToken.id } });
            throw new Error('Invalid or expired refresh token');
        }

        const accessToken = generateAccessToken(refreshToken.user);
        return { accessToken };
    }

    async logout(token: string) {
        try {
            await prisma.refreshToken.delete({ where: { token } });
        } catch (e) {
            // Ignore if already deleted
        }
    }

    async getCurrentUser(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                totalPoints: true,
                createdAt: true,
            },
        });
        if (!user) throw new Error('User not found');
        return { user };
    }

    async listAdmins() {
        return await prisma.user.findMany({
            where: { role: { in: ['INSTRUCTOR', 'ADMIN'] } },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
            },
        });
    }

    private async createAuthResponse(user: any) {
        const accessToken = generateAccessToken(user);
        const refreshTokenString = generateRefreshTokenString();

        await prisma.refreshToken.create({
            data: {
                token: refreshTokenString,
                userId: user.id,
                expiresAt: getRefreshTokenExpiry(),
            },
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role as Role,
                avatar: user.avatar,
                totalPoints: user.totalPoints,
            },
            accessToken,
            refreshToken: refreshTokenString,
        };
    }
}

export const authService = new AuthService();
