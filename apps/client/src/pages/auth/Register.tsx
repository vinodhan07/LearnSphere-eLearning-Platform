import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, UserPlus, BookOpen, GraduationCap, Users } from 'lucide-react';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'LEARNER' | 'INSTRUCTOR'>('LEARNER');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const from = (location.state as { from?: string })?.from || '/';

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
            navigate(from, { replace: true });
        } catch (error: any) {
            toast({
                title: 'Registration failed',
                description: error.response?.data?.error || error.message || 'Could not create account',
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
                        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
                        <p className="text-muted-foreground mt-1">Join thousands of learners today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

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
                            <Label htmlFor="password">Password</Label>
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

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>I want to join as</Label>
                            <RadioGroup
                                value={role}
                                onValueChange={(value) => setRole(value as 'LEARNER' | 'INSTRUCTOR')}
                                className="grid grid-cols-2 gap-3"
                            >
                                <Label
                                    htmlFor="role-learner"
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${role === 'LEARNER'
                                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                                        : 'border-border hover:border-orange-200 hover:bg-orange-50/50'
                                        }`}
                                >
                                    <RadioGroupItem value="LEARNER" id="role-learner" className="sr-only" />
                                    <GraduationCap className={`h-6 w-6 ${role === 'LEARNER' ? 'text-orange-600' : 'text-muted-foreground'}`} />
                                    <span className={`text-sm font-bold ${role === 'LEARNER' ? 'text-orange-700' : 'text-muted-foreground'}`}>
                                        Learner
                                    </span>
                                </Label>
                                <Label
                                    htmlFor="role-instructor"
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${role === 'INSTRUCTOR'
                                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                                        : 'border-border hover:border-orange-200 hover:bg-orange-50/50'
                                        }`}
                                >
                                    <RadioGroupItem value="INSTRUCTOR" id="role-instructor" className="sr-only" />
                                    <Users className={`h-6 w-6 ${role === 'INSTRUCTOR' ? 'text-orange-600' : 'text-muted-foreground'}`} />
                                    <span className={`text-sm font-bold ${role === 'INSTRUCTOR' ? 'text-orange-700' : 'text-muted-foreground'}`}>
                                        Instructor
                                    </span>
                                </Label>
                            </RadioGroup>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 text-lg shadow-lg shadow-orange-500/20"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Creating account...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" />
                                    Create account
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/login" className="text-orange-600 hover:text-orange-700 font-bold hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
