import { supabase } from '../utils/supabase.js';
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
        const { data: existingUser } = await supabase
            .from('User')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) throw new Error('Email already registered');

        // Create user
        const hashedPassword = await hashPassword(password);
        const { data: user, error: createError } = await supabase
            .from('User')
            .insert({
                email,
                password: hashedPassword,
                name,
                role: (role as Role) || 'LEARNER',
            })
            .select()
            .single();

        if (createError) throw new Error(`Registration failed: ${createError.message}`);

        return await this.createAuthResponse(user);
    }

    async login(email: string, password: string) {
        const { data: user, error: findError } = await supabase
            .from('User')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (!user) throw new Error('Invalid email or password');

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) throw new Error('Invalid email or password');

        return await this.createAuthResponse(user);
    }

    async googleAuth(payload: any) {
        let { data: user } = await supabase
            .from('User')
            .select('*')
            .eq('email', payload.email)
            .maybeSingle();

        if (!user) {
            const randomPassword = await hashPassword(Math.random().toString(36).slice(-12));
            const { data: newUser, error: createError } = await supabase
                .from('User')
                .insert({
                    email: payload.email,
                    password: randomPassword,
                    name: payload.name || payload.email.split('@')[0],
                    role: 'LEARNER',
                    avatar: payload.picture || null,
                })
                .select()
                .single();

            if (createError) throw new Error(`Google auth registration failed: ${createError.message}`);
            user = newUser;
        }

        return await this.createAuthResponse(user);
    }

    async refreshTokens(token: string) {
        const { data: refreshToken, error: findError } = await supabase
            .from('RefreshToken')
            .select('*, user:User(*)')
            .eq('token', token)
            .maybeSingle();

        if (!refreshToken || new Date(refreshToken.expiresAt) < new Date()) {
            if (refreshToken) {
                await supabase.from('RefreshToken').delete().eq('id', refreshToken.id);
            }
            throw new Error('Invalid or expired refresh token');
        }

        // Supabase join syntax returns user as an object if one-to-one/many-to-one
        const accessToken = generateAccessToken(refreshToken.user);
        return { accessToken };
    }

    async logout(token: string) {
        try {
            await supabase.from('RefreshToken').delete().eq('token', token);
        } catch (e) {
            // Ignore if already deleted
        }
    }

    async getCurrentUser(userId: string) {
        const { data: user, error: findError } = await supabase
            .from('User')
            .select('id, email, name, role, avatar, totalPoints, createdAt')
            .eq('id', userId)
            .maybeSingle();

        if (!user) throw new Error('User not found');
        return { user };
    }

    async listAdmins() {
        const { data, error } = await supabase
            .from('User')
            .select('id, name, email, avatar, role')
            .in('role', ['INSTRUCTOR', 'ADMIN']);

        if (error) throw new Error(`Failed to list admins: ${error.message}`);
        return data;
    }

    private async createAuthResponse(user: any) {
        const accessToken = generateAccessToken(user);
        const refreshTokenString = generateRefreshTokenString();

        const { error: createError } = await supabase
            .from('RefreshToken')
            .insert({
                token: refreshTokenString,
                userId: user.id,
                expiresAt: getRefreshTokenExpiry().toISOString(),
            });

        if (createError) throw new Error(`Failed to create refresh token: ${createError.message}`);

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
