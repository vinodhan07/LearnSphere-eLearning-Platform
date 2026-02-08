import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import * as api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, Calendar, Trophy, Settings } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";

export default function Profile() {
    const { user, isAuthenticated } = useAuth();
    const [enrollmentCount, setEnrollmentCount] = useState(0);

    useEffect(() => {
        if (!user?.id || !isAuthenticated) return;

        const fetchEnrollmentCount = async () => {
            try {
                const courses = await api.getEnrolledCourses();
                setEnrollmentCount(courses.length);
            } catch (error) {
                console.error("Failed to fetch enrollment count:", error);
            }
        };

        fetchEnrollmentCount();
    }, [user?.id, isAuthenticated]);

    if (!user) return null;

    const getInitials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'INSTRUCTOR': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-green-500/10 text-green-500 border-green-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Sidebar / Info */}
                        <div className="w-full md:w-1/3 lg:w-1/4 space-y-6">
                            <Card className="border-border/40 shadow-card overflow-hidden">
                                <div className="h-24 bg-gradient-hero" />
                                <CardContent className="relative pt-0 flex flex-col items-center">
                                    <div className="relative -top-12">
                                        <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                                            <AvatarImage src={user.avatar || undefined} />
                                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="text-center -mt-8 pb-4">
                                        <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                        <Badge variant="outline" className={`mt-3 ${getRoleColor(user.role)}`}>
                                            {user.role}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/40 shadow-card">
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Account Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-foreground">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-foreground">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <span>Role: {user.role}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-foreground">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Joined Feb 2026</span>
                                    </div>
                                    <Button variant="outline" className="w-full mt-4 gap-2">
                                        <Settings className="h-4 w-4" />
                                        Edit Profile
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Card className="bg-gradient-hero text-primary-foreground border-none">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="text-primary-foreground/70 flex items-center gap-2">
                                            <Trophy className="h-4 w-4" /> Total Points
                                        </CardDescription>
                                        <CardDescription className="text-primary-foreground/70 flex items-center gap-2">
                                            <Trophy className="h-4 w-4" /> Total Points
                                        </CardDescription>
                                        <CardTitle className="text-4xl font-bold">{user.totalPoints}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-primary-foreground/60">Top 15% of all learners</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-border/40 shadow-card">
                                    <CardHeader className="pb-2">
                                        <CardDescription>Courses Enrolled</CardDescription>
                                        <CardTitle className="text-3xl font-bold">{enrollmentCount}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-muted-foreground">Keep learning to grow!</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-border/40 shadow-card">
                                    <CardHeader className="pb-2">
                                        <CardDescription>Badges Earned</CardDescription>
                                        <CardTitle className="text-3xl font-bold">0</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-muted-foreground">Complete quizzes to earn more</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="border-border/40 shadow-card">
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                    <CardDescription>Your latest actions on LearnSphere</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                                            <Calendar className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">No recent activity to show.</p>
                                        <Button variant="link" className="mt-2 text-accent">Browse Courses</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
