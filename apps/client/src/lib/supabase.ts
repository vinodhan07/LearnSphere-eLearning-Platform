import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    const msg = 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env. Add them and restart the dev server.';
    if (import.meta.env.DEV) {
        throw new Error(msg);
    }
    console.error(msg);
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
