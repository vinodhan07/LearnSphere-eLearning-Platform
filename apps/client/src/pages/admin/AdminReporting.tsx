import { useState } from "react";
import { Users, Clock, CheckCircle2, BookOpen, Search, Columns3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { supabase } from '@/lib/supabase';
import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

const statusBadge: Record<string, { label: string; className: string }> = {
  yet_to_start: { label: "Yet to Start", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-info/10 text-info" },
  completed: { label: "Completed", className: "bg-success/10 text-success" },
};

const allColumns = [
  { key: "sr", label: "Sr No.", default: true },
  { key: "course", label: "Course Name", default: true },
  { key: "participant", label: "Participant", default: true },
  { key: "enrolled", label: "Enrolled Date", default: true },
  { key: "start", label: "Start Date", default: true },
  { key: "time", label: "Time Spent", default: true },
  { key: "completion", label: "Completion %", default: true },
  { key: "completed", label: "Completed Date", default: false },
  { key: "status", label: "Status", default: true },
];

const AdminReporting = () => {
  const [search, setSearch] = useState("");
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(allColumns.filter((c) => c.default).map((c) => c.key))
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // We can fetch all enrollments with courses and users joined
      const { data, error } = await supabase
        .from('Enrollment')
        .select('*, course:Course(*), user:User(*)');

      if (data) setEnrollments(data);
      setIsLoading(false);
    };

    fetchData();

    // Real-time
    const channel = supabase.channel('admin-reporting')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Enrollment' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const reportData = enrollments.map(e => {
    return {
      id: e.id,
      courseName: e.course?.title || "Unknown Course",
      participantName: e.user?.name || "Unknown User",
      participantAvatar: e.user?.avatar || `https://ui-avatars.com/api/?name=${e.user?.name || 'U'}`,
      enrolledDate: e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : "—",
      startDate: e.startedAt ? new Date(e.startedAt).toLocaleDateString() : "—",
      timeSpent: e.timeSpent || "0m",
      completionPercentage: e.progress || 0,
      status: e.status || "yet_to_start",
      completedDate: e.completedAt ? new Date(e.completedAt).toLocaleDateString() : null
    };
  }).filter(
    (r) =>
      r.courseName.toLowerCase().includes(search.toLowerCase()) ||
      r.participantName.toLowerCase().includes(search.toLowerCase())
  );

  const totalParticipants = reportData.length;
  const yetToStart = reportData.filter((r) => r.status === "yet_to_start").length;
  const inProgress = reportData.filter((r) => r.status === "in_progress").length;
  const completed = reportData.filter((r) => r.status === "completed").length;

  const toggleCol = (key: string) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const overviewCards = [
    { label: "Total Participants", value: totalParticipants, icon: Users, color: "text-primary" },
    { label: "Yet to Start", value: yetToStart, icon: Clock, color: "text-muted-foreground" },
    { label: "In Progress", value: inProgress, icon: BookOpen, color: "text-info" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "text-success" },
  ];

  const handleDownloadReport = () => {
    // Group by course to calculate aggregate metrics
    const courseStats: Record<string, { enrolled: number; progressSum: number; completed: number }> = {};

    reportData.forEach(r => {
      if (!courseStats[r.courseName]) {
        courseStats[r.courseName] = { enrolled: 0, progressSum: 0, completed: 0 };
      }
      courseStats[r.courseName].enrolled++;
      courseStats[r.courseName].progressSum += r.completionPercentage;
      if (r.status === 'completed') courseStats[r.courseName].completed++;
    });

    const headers = ["Course Name,Total Enrolled,Average Progress,Completion Rate,Estimated Revenue (INR)"];
    const rows = Object.keys(courseStats).map(courseName => {
      const stats = courseStats[courseName];
      const avgProgress = (stats.progressSum / stats.enrolled).toFixed(1);
      const completionRate = ((stats.completed / stats.enrolled) * 100).toFixed(1);
      // Mocking revenue calculation (e.g. fixed 4999 INR price per student for demo)
      const revenue = stats.enrolled * 4999;

      return `"${courseName}",${stats.enrolled},${avgProgress}%,${completionRate}%,${revenue}`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "platform_analytics_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-background">
      <div className="container py-8">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Reporting Dashboard</h1>
        <p className="text-muted-foreground mb-8">Track learner progress across all courses</p>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {overviewCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl border border-border p-5 shadow-card"
            >
              <div className="flex items-center justify-between mb-3">
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="font-heading text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by course or participant..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadReport}>
              <Download className="h-4 w-4" /> Download Report
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Columns3 className="h-4 w-4" /> Columns
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="font-heading">Customize Columns</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {allColumns.map((col) => (
                    <label key={col.key} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={visibleCols.has(col.key)}
                        onCheckedChange={() => toggleCol(col.key)}
                      />
                      <span className="text-sm">{col.label}</span>
                    </label>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {visibleCols.has("sr") && <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">#</th>}
                  {visibleCols.has("course") && <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Course</th>}
                  {visibleCols.has("participant") && <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Participant</th>}
                  {visibleCols.has("enrolled") && <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Enrolled</th>}
                  {visibleCols.has("start") && <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Started</th>}
                  {visibleCols.has("time") && <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Time Spent</th>}
                  {visibleCols.has("completion") && <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Completion</th>}
                  {visibleCols.has("completed") && <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Completed</th>}
                  {visibleCols.has("status") && <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Status</th>}
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, i) => {
                  const sb = statusBadge[row.status] || statusBadge.yet_to_start;
                  return (
                    <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      {visibleCols.has("sr") && <td className="py-3 px-4 text-sm text-muted-foreground">{i + 1}</td>}
                      {visibleCols.has("course") && <td className="py-3 px-4 text-sm font-medium text-foreground">{row.courseName}</td>}
                      {visibleCols.has("participant") && (
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <img src={row.participantAvatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                            <span className="text-sm text-foreground">{row.participantName}</span>
                          </div>
                        </td>
                      )}
                      {visibleCols.has("enrolled") && <td className="py-3 px-4 text-sm text-muted-foreground">{row.enrolledDate}</td>}
                      {visibleCols.has("start") && <td className="py-3 px-4 text-sm text-muted-foreground">{row.startDate || "—"}</td>}
                      {visibleCols.has("time") && <td className="py-3 px-4 text-sm text-muted-foreground">{row.timeSpent}</td>}
                      {visibleCols.has("completion") && (
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Progress value={row.completionPercentage} className="w-20 h-2" />
                            <span className="text-xs font-semibold text-foreground">{row.completionPercentage}%</span>
                          </div>
                        </td>
                      )}
                      {visibleCols.has("completed") && <td className="py-3 px-4 text-sm text-muted-foreground">{row.completedDate || "—"}</td>}
                      {visibleCols.has("status") && (
                        <td className="py-3 px-4">
                          <Badge className={sb.className + " text-xs font-medium"}>{sb.label}</Badge>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReporting;
