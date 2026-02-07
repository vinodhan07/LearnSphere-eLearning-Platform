import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, UserPlus, BookOpen, GraduationCap, Users } from 'lucide-react';

// Google Client ID - Replace with your own for production
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'LEARNER' | 'INSTRUCTOR'>('LEARNER');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [googleLoaded, setGoogleLoaded] = useState(false);

    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

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

        const buttonDiv = document.getElementById('google-signup-button');
        if (buttonDiv) {
            google.accounts.id.renderButton(buttonDiv, {
                theme: 'filled_black',
                size: 'large',
                width: 320,
                text: 'signup_with',
            });
        }
    }, [googleLoaded]);

    const handleGoogleResponse = async (response: { credential: string }) => {
        setIsSubmitting(true);
        try {
            await googleLogin(response.credential);
            toast({
                title: 'Account created!',
                description: 'Welcome to LearnSphere. Start exploring courses!',
            });
            navigate('/', { replace: true });
        } catch (error) {
            toast({
                title: 'Google sign-up failed',
                description: error instanceof Error ? error.message : 'Could not sign up with Google',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                title: 'Passwords do not match',
                description: 'Please make sure both passwords are the same.',
                variant: 'destructive',
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: 'Password too short',
                description: 'Password must be at least 6 characters.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await register({ email, password, name, role });
            toast({
                title: 'Account created!',
                description: 'Welcome to LearnSphere. Start exploring courses!',
            });
            navigate('/', { replace: true });
        } catch (error) {
            toast({
                title: 'Registration failed',
                description: error instanceof Error ? error.message : 'Could not create account',
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
                        <h1 className="text-2xl font-bold text-white">Create your account</h1>
                        <p className="text-gray-300 mt-1">Join thousands of learners today</p>
                    </div>

                    {/* Google Sign-Up Button */}
                    {GOOGLE_CLIENT_ID && (
                        <div className="mb-6">
                            <div id="google-signup-button" className="flex justify-center"></div>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/20"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-transparent text-gray-400">or register with email</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-200">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                            />
                        </div>

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
                            <Label htmlFor="password" className="text-gray-200">Password</Label>
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

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-gray-200">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-gray-200">I want to join as</Label>
                            <RadioGroup
                                value={role}
                                onValueChange={(value) => setRole(value as 'LEARNER' | 'INSTRUCTOR')}
                                className="grid grid-cols-2 gap-3"
                            >
                                <Label
                                    htmlFor="role-learner"
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${role === 'LEARNER'
                                            ? 'border-purple-400 bg-purple-500/20'
                                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <RadioGroupItem value="LEARNER" id="role-learner" className="sr-only" />
                                    <GraduationCap className={`h-6 w-6 ${role === 'LEARNER' ? 'text-purple-400' : 'text-gray-400'}`} />
                                    <span className={`text-sm font-medium ${role === 'LEARNER' ? 'text-white' : 'text-gray-300'}`}>
                                        Learner
                                    </span>
                                </Label>
                                <Label
                                    htmlFor="role-instructor"
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${role === 'INSTRUCTOR'
                                            ? 'border-purple-400 bg-purple-500/20'
                                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <RadioGroupItem value="INSTRUCTOR" id="role-instructor" className="sr-only" />
                                    <Users className={`h-6 w-6 ${role === 'INSTRUCTOR' ? 'text-purple-400' : 'text-gray-400'}`} />
                                    <span className={`text-sm font-medium ${role === 'INSTRUCTOR' ? 'text-white' : 'text-gray-300'}`}>
                                        Instructor
                                    </span>
                                </Label>
                            </RadioGroup>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-5"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Creating account...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Create account
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-300">
                            Already have an account?{' '}
                            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
