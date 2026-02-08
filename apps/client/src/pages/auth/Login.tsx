import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn, BookOpen } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const from = (location.state as { from?: string })?.from || '/profile';

    const handleSubmit = async (e?: React.FormEvent, demoData?: { email: string, password: string }) => {
        if (e) e.preventDefault();
        const loginEmail = demoData?.email || email;
        const loginPassword = demoData?.password || password;

        setIsSubmitting(true);

        try {
            await login({ email: loginEmail, password: loginPassword });

            // Get user from local storage or wait for next tick?
            // Actually, login() in AuthContext sets the user state.
            // But we need the role immediately. 
            // The login() function in AuthContext (apiLogin) returns { user, token }.
            // However, useAuth().user might not be updated yet in this component's scope.
            // Let's modify handleLogin to return the user or use a helper.

            // For now, since login() is async and updates state, we might need a small trick
            // or better yet, since we know apiLogin returns the user:
            const response = await (await import('@/lib/api')).login({ email: loginEmail, password: loginPassword });

            toast({
                title: 'Welcome back!',
                description: `Logged in as ${response.user.name}`,
            });

            // Role-based redirection
            const roleRoutes = {
                ADMIN: '/admin-dashboard',
                INSTRUCTOR: '/instructor-dashboard',
                LEARNER: '/learner-dashboard'
            };

            const target = roleRoutes[response.user.role] || from;
            navigate(target, { replace: true });
        } catch (error: any) {
            toast({
                title: 'Login failed',
                description: error.response?.data?.error || error.message || 'Invalid credentials',
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
                        <p className="text-xs text-muted-foreground text-center mb-3">Demo accounts (Click to fill):</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => handleSubmit(undefined, { email: 'admin.learnsphere@gmail.com', password: 'admin123' })}
                                className="px-2 py-1.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors border border-transparent hover:border-orange-200"
                                disabled={isSubmitting}
                            >
                                Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmit(undefined, { email: 'instructor.learnsphere@gmail.com', password: 'instructor123' })}
                                className="px-2 py-1.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors border border-transparent hover:border-orange-200"
                                disabled={isSubmitting}
                            >
                                Instructor
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmit(undefined, { email: 'learner.learnsphere@gmail.com', password: 'learner123' })}
                                className="px-2 py-1.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors border border-transparent hover:border-orange-200"
                                disabled={isSubmitting}
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
