import { useState } from "react";
import { Users, Clock, CheckCircle2, BookOpen, Search, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { mockReporting } from "@/data/mockData";
import { motion } from "framer-motion";
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
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(allColumns.filter((c) => c.default).map((c) => c.key))
  );

  const data = mockReporting.filter(
    (r) =>
      r.courseName.toLowerCase().includes(search.toLowerCase()) ||
      r.participantName.toLowerCase().includes(search.toLowerCase())
  );

  const totalParticipants = mockReporting.length;
  const yetToStart = mockReporting.filter((r) => r.status === "yet_to_start").length;
  const inProgress = mockReporting.filter((r) => r.status === "in_progress").length;
  const completed = mockReporting.filter((r) => r.status === "completed").length;

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
                {data.map((row, i) => {
                  const sb = statusBadge[row.status];
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
