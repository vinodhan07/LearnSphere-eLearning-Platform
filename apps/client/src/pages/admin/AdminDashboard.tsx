import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  MoreHorizontal,
  LayoutGrid,
  List,
  Eye,
  Pencil,
  Trash2,
  Share2,
  Clock,
  BookOpen,
  Eye as EyeIcon,
  Loader2,
  Sparkles,
  HelpCircle,
  AlertCircle,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import type { Course } from "@/types/course";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";
import ReviewSummaryModal from "@/components/admin/ReviewSummaryModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import CreateCourseModal from "@/components/admin/CreateCourseModal";

const statusColors: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedCourseForReview, setSelectedCourseForReview] = useState<{ id: string, title: string } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [insights, setInsights] = useState<{
    hardestLesson: string;
    mostFailedCount: number;
    averageScoreOnMostFailed: number;
    recommendation: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading) return;

    if (isAuthenticated && user) {
      const fetchCourses = async () => {
        setIsLoading(true);
        try {
          const data = await api.getAdminCourses();
          setCourses(data as any);
        } catch (error) {
          console.error("Failed to fetch admin courses:", error);
          toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      };

      fetchCourses();

      // Fetch insights
      const fetchInsights = async () => {
        try {
          const data = await api.get<any>("/ai/instructor-insights");
          setInsights(data);
        } catch (error) {
          console.error("Failed to fetch insights", error);
        }
      };
      fetchInsights();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, authLoading, toast]);

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {
    draft: filteredCourses.filter((c) => !c.published),
    published: filteredCourses.filter((c) => c.published),
  };

  const handleShare = (course: Course) => {
    const url = `${window.location.origin}/courses/${course.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Course link has been copied to clipboard.",
    });
  };

  const handleDeleteCourse = async (id: string) => {
    setDeleteCourseId(id);
  };

  const confirmDeleteCourse = async () => {
    if (!deleteCourseId) return;
    try {
      setIsDeleting(true);
      await api.del(`/courses/${deleteCourseId}`);

      setCourses(prev => prev.filter(c => c.id !== deleteCourseId));
      toast({ title: "Course Deleted", description: "The course has been permanently removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete course", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteCourseId(null);
    }
  };

  const CourseActions = ({ course }: { course: Course }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted text-muted-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="gap-2" onClick={() => navigate(`/admin/course/${course.id}`)}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => handleShare(course)}>
          <Share2 className="h-3.5 w-3.5" /> Share
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => window.open(`/courses/${course.id}`, '_blank')}>
          <Eye className="h-3.5 w-3.5" /> Preview
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => {
          setSelectedCourseForReview({ id: course.id, title: course.title });
          setIsReviewModalOpen(true);
        }}>
          <MessageSquare className="h-3.5 w-3.5" /> AI Review Summary
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400"
          onClick={() => handleDeleteCourse(course.id)}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu >
  );

  return (
    <div className="bg-background text-foreground selection:bg-orange-500/30">

      <main className="container max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Course Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage, organize, and track your content performance</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-accent hover:opacity-90 shadow-lg shadow-orange-500/20 gap-2 h-11 px-6 font-semibold text-accent-foreground"
          >
            <Plus className="h-5 w-5" /> Create Course
          </Button>
        </div>

        {/* AI Insights Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-orange-400" />
            <h2 className="text-xl font-bold">Instructor AI Insights</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group shadow-sm">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <HelpCircle className="h-24 w-24 text-orange-500" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Hardest Lesson</p>
              <h3 className="text-xl font-bold text-foreground mb-2">{insights?.hardestLesson || "Loading..."}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {insights?.mostFailedCount ? `Failing rate is high: ${insights.mostFailedCount} students failed their last attempt.` : "No significant struggles detected yet."}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <AlertCircle className="h-24 w-24 text-orange-500" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Most Failed Quiz</p>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {insights?.hardestLesson !== "N/A" ? insights?.hardestLesson : "No Data"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {insights?.averageScoreOnMostFailed ? `Average score is ${Math.round(insights.averageScoreOnMostFailed)}%.` : "Keep track of upcoming quiz results."}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-500/5 to-amber-500/5 border border-orange-500/10 rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">AI Recommendation</p>
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                "{insights?.recommendation || "Analyzing student performance data..."}"
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search courses by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11 bg-card border-border focus:border-orange-500/50 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex bg-muted rounded-xl p-1 border border-border self-start sm:self-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("kanban")}
              className={`gap-2 h-9 px-4 rounded-lg transition-all ${view === "kanban" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-card/50"}`}
            >
              <LayoutGrid className="h-4 w-4" /> Kanban
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("list")}
              className={`gap-2 h-9 px-4 rounded-lg transition-all ${view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-card/50"}`}
            >
              <List className="h-4 w-4" /> List
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
            <p className="text-muted-foreground font-medium leading-relaxed">Loading your dashboard...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === "kanban" ? (
              <motion.div
                key="kanban"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid lg:grid-cols-2 gap-8"
              >
                {(["draft", "published"] as const).map((status) => (
                  <div key={status} className="bg-muted/30 border border-border/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`px-3 py-1 uppercase tracking-wider text-[10px] font-bold bg-background/50 ${statusColors[status]}`}>
                          {status}
                        </Badge>
                        <span className="text-sm text-muted-foreground font-medium">
                          {grouped[status].length} {grouped[status].length === 1 ? 'Course' : 'Courses'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {grouped[status].map((course, i) => (
                        <motion.div
                          key={course.id}
                          layoutId={course.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="group relative bg-card hover:bg-card/80 rounded-xl border border-border p-5 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 pr-8">
                                <h3 className="font-bold text-base text-foreground group-hover:text-orange-500 transition-colors leading-tight">
                                  {course.title}
                                </h3>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {course.tags?.map((tag) => (
                                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                      {tag}
                                    </span>
                                  ))}
                                  {(!course.tags || course.tags.length === 0) && (
                                    <span className="text-[10px] text-muted-foreground italic">No tags</span>
                                  )}
                                </div>
                              </div>
                              <div className="absolute right-4 top-4">
                                <CourseActions course={course} />
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border mt-auto">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Views</span>
                                <div className="flex items-center gap-1.5 text-foreground">
                                  <EyeIcon className="h-3 w-3 text-orange-500" />
                                  <span className="text-sm font-semibold">{course.viewsCount || 0}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Lessons</span>
                                <div className="flex items-center gap-1.5 text-foreground">
                                  <BookOpen className="h-3 w-3 text-blue-500" />
                                  <span className="text-sm font-semibold">{course.lessonsCount || 0}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Quizzes</span>
                                <div className="flex items-center gap-1.5 text-foreground">
                                  <HelpCircle className="h-3 w-3 text-orange-500" />
                                  <span className="text-sm font-semibold">{course.quizzesCount || 0}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Time</span>
                                <div className="flex items-center gap-1.5 text-foreground">
                                  <Clock className="h-3 w-3 text-amber-500" />
                                  <span className="text-sm font-semibold">{course.totalDuration || 0}m</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {grouped[status].length === 0 && (
                        <div className="py-12 px-4 border border-dashed border-border rounded-xl text-center">
                          <p className="text-sm text-muted-foreground">No courses in category</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest py-4 px-6">Course</th>
                        <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest py-4 px-6">Status</th>
                        <th className="text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest py-4 px-6">Views</th>
                        <th className="text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest py-4 px-6">Lessons</th>
                        <th className="text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest py-4 px-6">Quizzes</th>
                        <th className="text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest py-4 px-6">Duration</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest py-4 px-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredCourses.map((course) => (
                        <tr key={course.id} className="group hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground group-hover:text-orange-500 transition-colors">
                                {course.title}
                              </span>
                              <div className="flex gap-2 mt-1.5">
                                {course.tags?.slice(0, 3).map((tag) => (
                                  <span key={tag} className="text-[10px] text-muted-foreground">#{tag}</span>
                                ))}
                                {(course.tags?.length || 0) > 3 && (
                                  <span className="text-[10px] text-muted-foreground/60">+{course.tags!.length - 3} more</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="outline" className={`px-2 py-0 text-[10px] uppercase font-bold border-0 ${course.published ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                              {course.published ? 'Published' : 'Draft'}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="text-sm font-medium text-foreground">{course.viewsCount || 0}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="text-sm font-medium text-foreground">{course.lessonsCount || 0}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="text-sm font-medium text-foreground">{course.quizzesCount || 0}</span>
                          </td>
                          <td className="py-4 px-6 text-center text-sm font-medium text-foreground">
                            {course.totalDuration || 0} min
                          </td>
                          <td className="py-4 px-6 text-right">
                            <CourseActions course={course} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredCourses.length === 0 && (
                    <div className="py-20 text-center">
                      <p className="text-muted-foreground font-medium">No courses found matching your search</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <CreateCourseModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteCourseId}
        onClose={() => setDeleteCourseId(null)}
        onConfirm={confirmDeleteCourse}
        title="Delete Course"
        description="Are you sure you want to delete this course? All content, lessons, and student progress associated with it will be permanently lost."
        isDeleting={isDeleting}
      />

      <ReviewSummaryModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        courseId={selectedCourseForReview?.id || ""}
        courseTitle={selectedCourseForReview?.title || ""}
      />
    </div>
  );
}

export default AdminDashboard;
