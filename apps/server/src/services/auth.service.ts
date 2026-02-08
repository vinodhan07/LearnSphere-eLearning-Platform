import prisma from '../utils/prisma';
import { hashPassword, comparePassword, generateToken, Role } from '../utils/auth';

export class AuthService {
    async register(data: { email: string; password: string; name: string; role: Role }) {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await hashPassword(data.password);
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: data.role,
            },
        });

        const token = generateToken({ userId: user.id, email: user.email, role: user.role as Role });
        return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
    }

    async login(data: { email: string; password: string }) {
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValid = await comparePassword(data.password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        const token = generateToken({ userId: user.id, email: user.email, role: user.role as Role });
        return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
    }

    async getCurrentUser(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, role: true, avatar: true, totalPoints: true, createdAt: true },
        });

        if (!user) throw new Error('User not found');
        return { user };
    }

    async listAdmins() {
        const users = await prisma.user.findMany({
            where: { role: { in: ['INSTRUCTOR', 'ADMIN'] } },
            select: { id: true, name: true, email: true, avatar: true, role: true },
        });
        return users;
    }
}

export const authService = new AuthService();
