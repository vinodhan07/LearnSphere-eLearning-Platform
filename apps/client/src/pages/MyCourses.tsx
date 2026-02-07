import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import CourseCard from "@/components/courses/CourseCard";
import ProfilePanel from "@/components/learner/ProfilePanel";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";

const MyCourses = () => {
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const fetchMyCourses = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('Enrollment')
        .select('*, course:Course(*)')
        .eq('userId', user.id);

      if (data) {
        const myCourses = data.map((e: any) => ({
          ...e.course,
          progress: e.progress || 0,
          enrollmentStatus: e.status
        }));
        setCourses(myCourses);
      }
      setIsLoading(false);
    };

    fetchMyCourses();

    // Cleanup: In a real app, you might want to consider real-time subscriptions here
  }, [isAuthenticated, user?.id]);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">My Courses</h1>
        <p className="text-muted-foreground mb-8">Track your learning progress and continue where you left off</p>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Profile Panel */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <ProfilePanel />
          </div>

          {/* Courses */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="flex items-center justify-between mb-6">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search my courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading your courses...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {filtered.map((course, i) => (
                  <CourseCard key={course.id} course={course} showProgress index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border text-muted-foreground">
                <p className="text-lg font-medium text-foreground mb-1">No courses yet</p>
                <p>Browse our catalog to start your learning journey.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCourses;
