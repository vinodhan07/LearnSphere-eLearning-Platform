import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  CheckCircle2,
  Circle,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  Sparkles,
  MessageSquare,
  Clock,
  Download,
  ExternalLink,
  Trophy,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import QuizFlow from "@/components/learner/QuizFlow";
import PointsNotification from "@/components/common/PointsNotification";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/lib/supabase";

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  duration: number;
  type: 'video' | 'document' | 'image' | 'quiz';
  order: number;
  pointsReward?: number;
  passScore?: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
}

const LessonPlayerPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // AI related
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  // Rewards
  const [earnedPoints, setEarnedPoints] = useState(0);

  useEffect(() => {
    if (courseId && user) {
      const fetchData = async () => {
        try {
          setIsLoading(true);

          // Fetch course and lessons
          const { data: courseData } = await supabase
            .from('Course')
            .select('*')
            .eq('id', courseId)
            .maybeSingle();

          const { data: lessonsData } = await supabase
            .from('Lesson')
            .select('*')
            .eq('courseId', courseId)
            .order('order', { ascending: true });

          if (courseData) setCourse(courseData as any);
          if (lessonsData) setLessons(lessonsData as any);

          // Fetch enrollment
          const { data: enrollData } = await supabase
            .from('Enrollment')
            .select('*')
            .eq('courseId', courseId)
            .eq('userId', user.id)
            .maybeSingle();

          if (enrollData) {
            setEnrollmentId(enrollData.id);
            setCompletedIds(new Set(enrollData.completedLessons || []));
          }
        } catch (error) {
          toast({ title: "Error", description: "Failed to load course content", variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [courseId, user]);

  const current = lessons[currentIndex];

  const handleMarkComplete = async () => {
    if (!current || !enrollmentId) return;
    try {
      const newCompleted = [...Array.from(completedIds), current.id];
      const progress = Math.round((newCompleted.length / lessons.length) * 100);

      const { error } = await supabase
        .from('Enrollment')
        .update({
          completedLessons: newCompleted,
          progress,
          status: progress === 100 ? 'completed' : 'in_progress',
          completedAt: progress === 100 ? new Date().toISOString() : null
        })
        .eq('id', enrollmentId);

      if (error) throw error;

      setCompletedIds(new Set(newCompleted));
      toast({ title: "Lesson Completed", description: "Your progress has been saved." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save progress", variant: "destructive" });
    }
  };

  const handleExplain = async () => {
    if (!current) return;
    try {
      setIsExplaining(true);
      setExplanation(null);
      // AI logic still calls the backend as it requires the AI model key
      const res = await api.post<any>(`/ai/explain`, { lessonId: current.id });
      setExplanation(res.explanation);
    } catch (error) {
      toast({ title: "Error", description: "AI Assistant is currently unavailable", variant: "destructive" });
    } finally {
      setIsExplaining(false);
    }
  };

  const goNext = () => {
    if (currentIndex < lessons.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setExplanation(null);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setExplanation(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
      </div>
    );
  }

  if (!course || lessons.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold">No Content Found</h2>
          <Link to="/courses" className="mt-4"><Button>Back to Catalog</Button></Link>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((completedIds.size / lessons.length) * 100);
  const allCompleted = completedIds.size === lessons.length;

  const renderContent = () => {
    if (!current) return null;

    if (current.type === "quiz") {
      return (
        <QuizFlow
          lessonId={current.id}
          passScore={current.passScore || 80}
          pointsReward={current.pointsReward || 10}
          onComplete={(pts) => {
            setEarnedPoints(pts);
            handleMarkComplete();
          }}
        />
      );
    }

    if (current.type === "video") {
      return (
        <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative group">
          <iframe
            src={current.content?.includes('youtube.com') ? current.content.replace('watch?v=', 'embed/') : current.content}
            className="w-full h-full"
            allowFullScreen
          />
          <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Badge className="bg-primary/90">Video Lesson</Badge>
          </div>
        </div>
      );
    }

    if (current.type === "document") {
      return (
        <div className="bg-card rounded-2xl border border-border p-12 min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Document Content Available</h3>
            <p className="text-muted-foreground max-w-sm">This lesson contains supplementary reading materials and guides.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Download PDF</Button>
            <Button className="gap-2"><ExternalLink className="h-4 w-4" /> Open in Viewer</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-card rounded-2xl border border-border p-12 min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
        <div className="h-20 w-20 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
          <ImageIcon className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Graphic Reference</h3>
          <p className="text-muted-foreground max-w-sm">Infographics and visual aids for this lesson.</p>
        </div>
        {current.content && <img src={current.content} alt={current.title} className="max-h-[300px] rounded-lg shadow-md border border-border" />}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />

      {/* Top Progress bar */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/courses">
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <span className="text-sm font-bold truncate max-w-[200px] md:max-w-md">{course.title}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-col items-end mr-2 hidden md:flex">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{progressPercent}% Completed</span>
            <Progress value={progressPercent} className="w-40 h-1.5 mt-1" />
          </div>
          {allCompleted && (
            <Badge className="bg-success/20 text-success border-success/30 hover:bg-success/20 px-3 py-1 gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Certified
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="w-80 border-r border-border bg-card overflow-y-auto shrink-0 z-20"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" /> Curriculum
                  </h3>
                  <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {lessons.map((lesson, i) => {
                    const isActive = i === currentIndex;
                    const isDone = completedIds.has(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          setCurrentIndex(i);
                          setExplanation(null);
                        }}
                        className={`w-full text-left flex items-start gap-3 p-3 rounded-xl text-sm transition-all duration-200 group ${isActive
                          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                          : "hover:bg-muted/50 text-muted-foreground"
                          }`}
                      >
                        <div className="mt-0.5">
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                          ) : (
                            <Circle className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/30"}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block font-bold truncate group-hover:text-foreground transition-colors">{lesson.title}</span>
                          <div className="flex items-center gap-2 mt-1 text-[10px] opacity-60">
                            <span className="uppercase">{lesson.type}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {lesson.duration}m</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed left-6 top-32 z-30 p-2.5 rounded-full bg-card border border-border shadow-lg hover:shadow-primary/10 hover:border-primary/50 transition-all"
            >
              <PanelLeftOpen className="h-5 w-5 text-primary" />
            </button>
          )}

          <div className="max-w-4xl mx-auto p-8 lg:p-12 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="px-3 py-1 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">
                  Lesson {currentIndex + 1}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                    onClick={handleExplain}
                    disabled={isExplaining}
                  >
                    <Sparkles className={`h-4 w-4 ${isExplaining ? 'animate-spin' : ''}`} />
                    {isExplaining ? "Thinking..." : "Explain Lesson"}
                  </Button>
                </div>
              </div>
              <h1 className="font-heading text-4xl font-black text-foreground tracking-tight">{current?.title}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">{current?.description}</p>
            </div>

            <AnimatePresence>
              {explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Sparkles className="h-24 w-24 text-primary" />
                  </div>
                  <h4 className="flex items-center gap-2 font-bold mb-3 text-primary uppercase tracking-widest text-xs">
                    <MessageSquare className="h-4 w-4" /> AI Summary
                  </h4>
                  <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                    {explanation.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 text-primary hover:bg-primary/10 h-8"
                    onClick={() => setExplanation(null)}
                  >
                    Got it, thanks!
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              {renderContent()}
            </div>

            {/* Navigation & Controls */}
            <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className="h-12 w-12 sm:w-auto sm:px-6 rounded-xl gap-2 font-bold"
                >
                  <ChevronLeft className="h-5 w-5" /> <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="text-sm font-bold bg-muted px-4 py-2 rounded-lg">
                  {currentIndex + 1} / {lessons.length}
                </div>
                <Button
                  variant="outline"
                  onClick={goNext}
                  disabled={currentIndex === lessons.length - 1}
                  className="h-12 w-12 sm:w-auto sm:px-6 rounded-xl gap-2 font-bold"
                >
                  <span className="hidden sm:inline">Next</span> <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {current && current.type !== 'quiz' && !completedIds.has(current.id) && (
                  <Button
                    onClick={handleMarkComplete}
                    className="h-12 px-8 flex-1 sm:flex-none rounded-xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all gap-2"
                  >
                    Mark as Complete <CheckCircle2 className="h-5 w-5" />
                  </Button>
                )}

                {allCompleted && (
                  <Button
                    onClick={() => {
                      toast({ title: "Congratulations!", description: "You have completed the entire course!" });
                      navigate('/courses');
                    }}
                    className="h-12 px-8 flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all gap-2"
                  >
                    Complete this course <Trophy className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <PointsNotification points={earnedPoints} badgeProgress={75} />
    </div>
  );
};

export default LessonPlayerPage;
