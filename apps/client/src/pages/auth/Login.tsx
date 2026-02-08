import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn, BookOpen } from 'lucide-react';

// Google Client ID - Replace with your own for production
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [googleLoaded, setGoogleLoaded] = useState(false);

    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const from = (location.state as { from?: string })?.from || '/profile';

    const handleRedirect = useCallback((role?: string) => {
        if (role === 'ADMIN') {
            navigate('/admin-dashboard', { replace: true });
        } else if (role === 'INSTRUCTOR') {
            navigate('/instructor-dashboard', { replace: true });
        } else if (role === 'LEARNER') {
            navigate('/learner-dashboard', { replace: true });
        } else {
            navigate('/my-courses', { replace: true });
        }
    }, [navigate]);

    const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
        setIsSubmitting(true);
        try {
            await googleLogin(response.credential);
            const { data: { session } } = await supabase.auth.getSession();
            let role: string | undefined;
            if (session) {
                const { data: profile } = await supabase
                    .from('User')
                    .select('role')
                    .eq('id', session.user.id)
                    .maybeSingle();
                role = profile?.role;
            }
            handleRedirect(role);
            toast({
                title: 'Welcome!',
                description: 'You have successfully signed in with Google.',
            });
        } catch (error) {
            toast({
                title: 'Google sign-in failed',
                description: error instanceof Error ? error.message : 'Could not sign in with Google',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [googleLogin, handleRedirect, toast]);

    // Load Google Identity Services script
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setGoogleLoaded(true);
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Initialize Google Sign-In
    useEffect(() => {
        if (!googleLoaded || !GOOGLE_CLIENT_ID) return;

        const google = (window as any).google;
        if (!google) return;

        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
        });

        const buttonDiv = document.getElementById('google-signin-button');
        if (buttonDiv) {
            google.accounts.id.renderButton(buttonDiv, {
                theme: 'filled_black',
                size: 'large',
                width: 320,
                text: 'continue_with',
            });
        }
    }, [googleLoaded, handleGoogleResponse]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await performLogin(email, password);
    };

    const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
        setEmail(demoEmail);
        setPassword(demoPassword);
        await performLogin(demoEmail, demoPassword);
    };

    const performLogin = async (loginEmail: string, loginPassword: string) => {
        setIsSubmitting(true);
        try {
            // Login and get profile directly from context
            const profile = await login({ email: loginEmail, password: loginPassword });
            handleRedirect(profile?.role);

            toast({
                title: 'Welcome back!',
                description: 'You have successfully logged in.',
            });
        } catch (error) {
            toast({
                title: 'Login failed',
                description: error instanceof Error ? error.message : 'Invalid credentials',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-foreground">
                        <div className="p-2 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/20">
                            <BookOpen className="h-8 w-8" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">LearnSphere</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl p-8 shadow-xl border border-border">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
                        <p className="text-muted-foreground mt-1">Sign in to continue learning</p>
                    </div>

                    {/* Google Sign-In Button */}
                    {GOOGLE_CLIENT_ID && (
                        <div className="mb-6">
                            <div id="google-signin-button" className="flex justify-center"></div>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-muted-foreground">or continue with email</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link to="/forgot-password" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 text-lg shadow-lg shadow-orange-500/20"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Signing in...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <LogIn className="h-5 w-5" />
                                    Sign in
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-orange-600 hover:text-orange-700 font-bold hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {/* Demo credentials */}
                    <div className="mt-8 pt-6 border-t border-border">
                        <p className="text-xs text-muted-foreground text-center mb-3">Demo accounts (Click to auto-login):</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('admin.learnsphere@gmail.com', 'admin123')}
                                className="px-2 py-1.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                            >
                                Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('instructor.learnsphere@gmail.com', 'instructor123')}
                                className="px-2 py-1.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                            >
                                Instructor
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('learner.learnsphere@gmail.com', 'learner123')}
                                className="px-2 py-1.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                            >
                                Learner
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
