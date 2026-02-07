import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, Users, Star, Play, FileText, Image as ImageIcon, HelpCircle, CheckCircle2, Circle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Course, Lesson, Review } from "@/data/mockData";
import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const typeIcons: Record<string, React.ElementType> = {
  video: Play,
  document: FileText,
  image: ImageIcon,
  quiz: HelpCircle,
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const { data: courseData } = await supabase
          .from('Course')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (courseData) {
          setCourse(courseData as any);

          const { data: lessonsData } = await supabase
            .from('Lesson')
            .select('*')
            .eq('courseId', id)
            .order('order', { ascending: true });

          if (lessonsData) setLessons(lessonsData as any);

          // Fetch reviews
          const { data: reviewsData } = await supabase
            .from('Review')
            .select('*')
            .eq('courseId', id);

          if (reviewsData) setReviews(reviewsData as any);

          // Check enrollment
          if (user) {
            const { data: enrollData } = await supabase
              .from('Enrollment')
              .select('*')
              .eq('courseId', id)
              .eq('userId', user.id)
              .maybeSingle();

            if (enrollData) {
              setIsEnrolled(true);
              setCourse(prev => prev ? { ...prev, progress: enrollData.progress || 0 } : null);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching course detail:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-lg text-muted-foreground">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold">Course Not Found</h2>
          <Link to="/courses" className="text-primary hover:underline mt-4 block">Back to Catalog</Link>
        </div>
      </div>
    );
  }

  const completedCount = lessons.filter((l) => l.completed).length; // This would need syncing with enrollment progress
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const handleStartLearning = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/course/${course.id}` } });
      return;
    }

    if (!isEnrolled) {
      try {
        const { error } = await supabase
          .from('Enrollment')
          .insert({
            courseId: course.id,
            userId: user!.id,
            progress: 0,
            enrolledAt: new Date().toISOString()
          });

        if (error) throw error;
        setIsEnrolled(true);
      } catch (error) {
        console.error("Enrollment failed:", error);
        return;
      }
    }
    navigate(`/lesson/${course.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        {/* Back */}
        <Link to="/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-3 gap-8 mb-8"
        >
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-2">
              {course.tags?.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{tag}</span>
              ))}
            </div>
            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">{course.title}</h1>
            <p className="text-muted-foreground leading-relaxed">{course.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{course.duration}</span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{course.totalLessons} lessons</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{course.enrolledCount} enrolled</span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-accent text-accent" />
                {avgRating} ({reviews.length} reviews)
              </span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <img src={course.instructorAvatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=instructor"} alt={course.instructor} className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-medium text-foreground">{course.instructor || "Platform Instructor"}</p>
                <p className="text-xs text-muted-foreground">Course Instructor</p>
              </div>
            </div>
          </div>

          {/* Side card */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-5 h-fit">
            <img src={course.image} alt={course.title} className="w-full h-40 rounded-lg object-cover" />
            {(isEnrolled || (course.progress && course.progress > 0)) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">{course.progress || 0}%</span>
                </div>
                <Progress value={course.progress || 0} className="h-2.5" />
              </div>
            )}
            <Button
              onClick={handleStartLearning}
              className="w-full bg-gradient-hero text-primary-foreground font-bold text-base hover:opacity-90"
              size="lg"
            >
              {!isAuthenticated && <LogIn className="h-4 w-4 mr-2" />}
              {isAuthenticated
                ? (isEnrolled ? "Continue Learning" : "Enroll Now")
                : "Sign in to Enroll"
              }
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Course Overview</TabsTrigger>
            <TabsTrigger value="reviews">Ratings & Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h3 className="font-heading text-lg font-bold text-card-foreground mb-4">Lessons ({lessons.length})</h3>
              <div className="space-y-2">
                {lessons.map((lesson, i) => {
                  const TypeIcon = typeIcons[lesson.type] || BookOpen;
                  return (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                      )}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className={`text-sm font-medium truncate ${lesson.completed ? "text-muted-foreground" : "text-foreground"}`}>
                          {lesson.title}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">{lesson.type}</span>
                      <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-center">
                  <p className="font-heading text-4xl font-bold text-foreground">{avgRating}</p>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.floor(Number(avgRating)) ? "fill-accent text-accent" : "text-border"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{reviews.length} reviews</p>
                </div>
                <div className="flex-1">
                  <Button variant="outline" className="font-semibold">Add Review</Button>
                </div>
              </div>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="flex gap-4 p-4 rounded-lg bg-muted/30">
                    <img src={review.userAvatar} alt={review.userName} className="h-10 w-10 rounded-full object-cover shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{review.userName}</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-accent text-accent" : "text-border"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.text}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{review.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CourseDetail;
