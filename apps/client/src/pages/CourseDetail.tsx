import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, Users, Star, Play, FileText, Image as ImageIcon, HelpCircle, CheckCircle2, Circle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCourse } from "@/lib/api";
import { Course, Lesson } from "@/types/course";
import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const typeIcons: Record<string, React.ElementType> = {
  video: Play,
  document: FileText,
  image: ImageIcon,
  quiz: HelpCircle,
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]); // Need to fetch lessons separately or include in course
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      try {
        const data = await getCourse(id);
        setCourse(data);
        // For now mimicking lessons if not in payload, but ideally should be in payload or separate call
        // The current getCourse service includes neither, need to check if we can get lessons
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load course details.",
          variant: "destructive",
        });
        navigate("/courses");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [id, navigate, toast]);

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  if (!course) return null;

  // Mock data for missing parts until backend updates
  const reviews: any[] = [];
  const completedCount = 0;
  const avgRating = "0";

  const handleStartLearning = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in Required",
        description: "Please sign in to start learning.",
      });
      navigate("/login", { state: { from: `/lesson/${course.id}` } });
      return;
    }

    if (course.canStart) {
      navigate(`/lesson/${course.id}`);
    } else {
      if (course.accessRule === 'PAID') {
        toast({
          title: "Enrollment Required",
          description: `This is a premium course. Price: $${course.price}`,
          variant: "default"
        });
        // Future: Open Payment Modal
      } else if (course.accessRule === 'INVITE') {
        toast({
          title: "Restricted Access",
          description: "You need an invitation to join this course.",
          variant: "destructive"
        });
      }
    }
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
              {course.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{tag}</span>
              ))}
            </div>
            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">{course.title}</h1>
            <p className="text-muted-foreground leading-relaxed">{course.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{course.totalDuration || "0m"}</span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{course.lessonsCount || 0} lessons</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{course.enrolledCount || 0} enrolled</span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-accent text-accent" />
                {avgRating} ({reviews.length} reviews)
              </span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <img src={course.responsibleAdmin?.avatar} alt={course.responsibleAdmin?.name} className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-medium text-foreground">{course.responsibleAdmin?.name}</p>
                <p className="text-xs text-muted-foreground">Course Instructor</p>
              </div>
            </div>
          </div>

          {/* Side card */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-5 h-fit">
            <img src={course.image} alt={course.title} className="w-full h-40 rounded-lg object-cover" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">{course.progress || 0}%</span>
              </div>
              <Progress value={course.progress || 0} className="h-2.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{completedCount} completed</span>
                <span>{lessons.length - completedCount} remaining</span>
              </div>
            </div>
            <Button
              onClick={handleStartLearning}
              className="w-full bg-gradient-hero text-primary-foreground font-bold text-base hover:opacity-90"
              size="lg"
            >
              {!isAuthenticated && <LogIn className="h-4 w-4 mr-2" />}
              {isAuthenticated
                ? ((course.progress || 0) > 0 ? "Continue Learning" : "Start Learning Now")
                : "Sign in to Start Learning"
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
