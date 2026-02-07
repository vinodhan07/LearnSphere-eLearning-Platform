import { supabase } from '../utils/supabase.js';

export class AuthService {
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
}

export const authService = new AuthService();
