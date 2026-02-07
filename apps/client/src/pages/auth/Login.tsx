import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
    }, [googleLoaded]);

    const handleGoogleResponse = async (response: { credential: string }) => {
        setIsSubmitting(true);
        try {
            await googleLogin(response.credential);
            toast({
                title: 'Welcome!',
                description: 'You have successfully signed in with Google.',
            });
            navigate(from, { replace: true });
        } catch (error) {
            toast({
                title: 'Google sign-in failed',
                description: error instanceof Error ? error.message : 'Could not sign in with Google',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await login({ email, password });
            toast({
                title: 'Welcome back!',
                description: 'You have successfully logged in.',
            });
            navigate(from, { replace: true });
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-white">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                            <BookOpen className="h-8 w-8" />
                        </div>
                        <span className="text-2xl font-bold">LearnSphere</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                        <p className="text-gray-300 mt-1">Sign in to continue learning</p>
                    </div>

                    {/* Google Sign-In Button */}
                    {GOOGLE_CLIENT_ID && (
                        <div className="mb-6">
                            <div id="google-signin-button" className="flex justify-center"></div>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/20"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-transparent text-gray-400">or continue with email</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-200">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-gray-200">Password</Label>
                                <Link to="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
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
                                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-5"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Signing in...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <LogIn className="h-4 w-4" />
                                    Sign in
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-300">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {/* Demo credentials */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-xs text-gray-400 text-center mb-3">Demo accounts:</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => { setEmail('admin.learnsphere@gmail.com'); setPassword('admin123'); }}
                                className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                            >
                                Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => { setEmail('instructor.learnsphere@gmail.com'); setPassword('instructor123'); }}
                                className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                            >
                                Instructor
                            </button>
                            <button
                                type="button"
                                onClick={() => { setEmail('learner.learnsphere@gmail.com'); setPassword('learner123'); }}
                                className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
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
