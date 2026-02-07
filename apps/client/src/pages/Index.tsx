import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Trophy, PlayCircle, Star, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCourses } from "@/lib/api";
import type { Course } from "@/types/course";
import CourseCard from "@/components/courses/CourseCard";
import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const stats = [
  { icon: BookOpen, value: "150+", label: "Courses" },
  { icon: Users, value: "12K+", label: "Learners" },
  { icon: Trophy, value: "5K+", label: "Certifications" },
  { icon: Star, value: "4.8", label: "Avg Rating" },
];

const Index = () => {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasMinimumRole, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Wait for auth to finish initializing before deciding whether to fetch courses
    if (authLoading) return;

    const fetchCourses = async () => {
      // Don't fetch if user is an instructor/admin to avoid unnecessary errors
      // and match the user's specific requirement.
      if (hasMinimumRole("INSTRUCTOR")) {
        console.log("Skipping featured courses fetch for instructor/admin");
        setIsLoading(false);
        return;
      }

      try {
        const data = await getCourses();
        const published = data.filter((c: Course) => c.published).slice(0, 3);
        setFeaturedCourses(published);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        toast({
          title: "Error",
          description: "Failed to load featured courses.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [toast, hasMinimumRole, authLoading]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/60" />
        </div>
        <div className="container relative py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 px-4 py-1.5 text-sm text-primary-foreground/90 backdrop-blur-sm">
              <PlayCircle className="h-4 w-4" />
              Start learning today — 100+ free courses
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight">
              Unlock Your Potential with{" "}
              <span className="text-accent">LearnSphere</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-lg">
              A modern eLearning platform where instructors build engaging courses
              and learners earn badges, complete quizzes, and master new skills.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/courses">
                <Button size="lg" className="bg-gradient-accent text-accent-foreground font-bold text-base gap-2 hover:opacity-90 shadow-glow">
                  Explore Courses
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              {hasMinimumRole("INSTRUCTOR") && (
                <Link to="/admin">
                  <Button
                    size="lg"
                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 font-semibold text-base"
                  >
                    Instructor Portal
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-heading text-3xl font-bold text-foreground">Featured Courses</h2>
              <p className="mt-2 text-muted-foreground">Handpicked courses to accelerate your learning</p>
            </div>
            <Link to="/courses">
              <Button variant="ghost" className="gap-2 font-semibold text-primary">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.length > 0 ? (
                featuredCourses.map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} />
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                  No featured courses available at the moment.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-foreground">Why LearnSphere?</h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">Everything you need for an engaging learning experience</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: PlayCircle, title: "Interactive Lessons", desc: "Video, documents, images, and quizzes — learn your way with diverse content formats." },
              { icon: Trophy, title: "Gamification", desc: "Earn points, unlock badges, and track your progress as you complete courses and quizzes." },
              { icon: CheckCircle, title: "Smart Quizzes", desc: "Multiple attempts with decreasing points — encouraging first-try mastery while allowing retakes." },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-background rounded-xl p-6 border border-border shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary py-12">
        <div className="container text-center">
          <p className="font-heading text-xl font-bold text-primary-foreground mb-2">
            Learn<span className="text-accent">Sphere</span>
          </p>
          <p className="text-primary-foreground/60 text-sm">
            © 2026 LearnSphere. Empowering learners worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
