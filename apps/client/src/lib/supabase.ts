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

// Supabase anon keys are JWTs and start with "eyJ" - invalid keys cause auth to hang or fail
if (import.meta.env.DEV && supabaseKey && !supabaseKey.startsWith('eyJ')) {
    console.warn(
        'VITE_SUPABASE_ANON_KEY does not look like a valid Supabase JWT (should start with eyJ). ' +
            'Get the correct key from Supabase Dashboard → Project Settings → API → anon public.'
    );
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
