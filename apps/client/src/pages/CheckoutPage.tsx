import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    CreditCard,
    ShieldCheck,
    CheckCircle2,
    ArrowRight,
    Loader2,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import type { Course } from "@/types/course";
import { motion, AnimatePresence } from "framer-motion";

const CheckoutPage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
    const [country, setCountry] = useState<string>("");
    const [state, setState] = useState<string>("");
    const [coupon, setCoupon] = useState("");

    useEffect(() => {
        const fetchCourse = async () => {
            if (!courseId) return;
            try {
                const data = await api.getCourse(courseId);
                setCourse(data);
            } catch (error) {
                console.error("Failed to fetch course:", error);
                toast({
                    title: "Error",
                    description: "Could not load course details.",
                    variant: "destructive"
                });
                navigate("/courses");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourse();
    }, [courseId]);

    const calculateTotal = () => {
        if (!course?.price) return 0;
        const basePrice = course.price;
        if (plan === 'yearly') {
            // Yearly discount (e.g., 20% off)
            return Math.round(basePrice * 10); // Simulating yearly as 10x monthly
        }
        return basePrice;
    };

    const handlePurchase = async () => {
        if (!courseId) return;
        setIsSubmitting(true);
        try {
            await api.purchaseCourse(courseId, {
                plan,
                billingDetails: { country, state },
                coupon
            });

            toast({
                title: "🎉 Thanks for purchasing the course!",
                description: `"Education is the most powerful weapon which you can use to change the world." You're now enrolled in ${course?.title}!`,
            });

            // Reload to fetch updated enrollment status
            setTimeout(() => {
                window.location.href = `/courses/${courseId}`;
            }, 1500);
        } catch (error: any) {
            toast({
                title: "Purchase Failed",
                description: error.message || "An error occurred during payment.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = plan && country && state;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!course) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pt-12 pb-24 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <Button
                    variant="ghost"
                    className="mb-8 group"
                    onClick={() => navigate(-1)}
                >
                    <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Course
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="space-y-6">
                            <h1 className="text-3xl font-heading font-bold">Complete your purchase</h1>

                            {/* Plan Selection */}
                            <Card className="border-border/50 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-border/50">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                        Choose your access plan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <RadioGroup
                                        defaultValue="monthly"
                                        className="grid gap-4"
                                        onValueChange={(v) => setPlan(v as 'monthly' | 'yearly')}
                                    >
                                        <Label
                                            htmlFor="monthly"
                                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${plan === 'monthly' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <RadioGroupItem value="monthly" id="monthly" className="sr-only" />
                                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${plan === 'monthly' ? 'border-primary' : 'border-muted-foreground'}`}>
                                                    {plan === 'monthly' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Monthly Access</p>
                                                    <p className="text-sm text-muted-foreground">Full access to all course content monthly</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">₹{course.price}</p>
                                                <p className="text-xs text-muted-foreground">per month</p>
                                            </div>
                                        </Label>

                                        <Label
                                            htmlFor="yearly"
                                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer relative ${plan === 'yearly' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <RadioGroupItem value="yearly" id="yearly" className="sr-only" />
                                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${plan === 'yearly' ? 'border-primary' : 'border-muted-foreground'}`}>
                                                    {plan === 'yearly' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold">Yearly Access</p>
                                                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] h-5">
                                                            SAVE 15%
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Get full access for a whole year</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">₹{Math.round(course.price * 10)}</p>
                                                <p className="text-xs text-muted-foreground">per year</p>
                                            </div>
                                        </Label>
                                    </RadioGroup>
                                </CardContent>
                            </Card>

                            {/* Billing Address */}
                            <Card className="border-border/50 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-border/50">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Info className="h-5 w-5 text-primary" />
                                        Billing Address
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="country">Country</Label>
                                        <Select onValueChange={setCountry}>
                                            <SelectTrigger id="country" className="bg-background">
                                                <SelectValue placeholder="Select Country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="in">India</SelectItem>
                                                <SelectItem value="us">United States</SelectItem>
                                                <SelectItem value="uk">United Kingdom</SelectItem>
                                                <SelectItem value="ca">Canada</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State / Union Territory</Label>
                                        <Select onValueChange={setState}>
                                            <SelectTrigger id="state" className="bg-background">
                                                <SelectValue placeholder="Select State" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dl">Delhi</SelectItem>
                                                <SelectItem value="mh">Maharashtra</SelectItem>
                                                <SelectItem value="ka">Karnataka</SelectItem>
                                                <SelectItem value="up">Uttar Pradesh</SelectItem>
                                                <SelectItem value="tn">Tamil Nadu</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    </div>

                    {/* Sidebar / Summary */}
                    <div className="lg:col-span-1 border-l-0 lg:border-l lg:pl-8 space-y-6">
                        <section className="sticky top-12 space-y-6">
                            <Card className="border-primary/20 bg-primary/5 overflow-hidden ring-1 ring-primary/10">
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="font-heading font-bold uppercase tracking-wider text-muted-foreground text-xs">Order Summary</h3>
                                        <div className="flex gap-4 items-center p-3 rounded-lg bg-background/50 border border-border/50">
                                            <div className="h-16 w-20 rounded-md overflow-hidden bg-muted shrink-0">
                                                <img src={course.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm line-clamp-1">{course.title}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{plan} Plan</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-border/50">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Price</span>
                                            <span>₹{plan === 'monthly' ? course.price : Math.round(course.price * 12)}</span>
                                        </div>
                                        {plan === 'yearly' && (
                                            <div className="flex justify-between text-sm text-orange-600 dark:text-orange-400">
                                                <span>Yearly Discount</span>
                                                <span>- ₹{Math.round(course.price * 2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Processing Fee</span>
                                            <span className="text-success">FREE</span>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Coupon Code"
                                                    value={coupon}
                                                    onChange={(e) => setCoupon(e.target.value)}
                                                    className="bg-background h-9 text-xs"
                                                />
                                                <Button variant="outline" size="sm" className="h-9 px-3">Apply</Button>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t border-border/50">
                                            <span className="font-bold">Total Cost</span>
                                            <span className="text-2xl font-black text-primary">₹{calculateTotal()}</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full bg-gradient-hero text-primary-foreground font-bold h-12 shadow-elevated hover:shadow-none transition-all"
                                        disabled={!isFormValid || isSubmitting}
                                        onClick={handlePurchase}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Start Subscription
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>

                                    <div className="space-y-4 pt-6 text-center">
                                        <div className="flex items-center justify-center gap-4 grayscale opacity-50">
                                            <CreditCard className="h-6 w-6" />
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                            By clicking "Start Subscription", you agree to LearnSphere's Terms of Service and Privacy Policy. Secure payment processing provided by Stripe.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Trust badges */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-card border border-border/50 flex flex-col items-center text-center gap-1">
                                    <CheckCircle2 className="h-5 w-5 text-success" />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">7-Day Guarantee</span>
                                </div>
                                <div className="p-3 rounded-xl bg-card border border-border/50 flex flex-col items-center text-center gap-1">
                                    <CheckCircle2 className="h-5 w-5 text-success" />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Secure Checkout</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
