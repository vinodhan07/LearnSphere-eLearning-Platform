import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    Eye,
    Users,
    Mail,
    Upload,
    Plus,
    MoreVertical,
    Edit2,
    Trash2,
    Globe,
    Lock,
    MessageSquare,
    CheckCircle,
    AlertCircle,
    FileText,
    Play,
    Image as ImageIcon,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import LessonEditorModal from "@/components/admin/LessonEditorModal";
import AttendeeModal from "@/components/admin/AttendeeModal";

interface Lesson {
    id: string;
    title: string;
    type: 'video' | 'document' | 'image' | 'quiz';
    order: number;
}

interface Course {
    id: string;
    title: string;
    description: string;
    tags: string[];
    image: string;
    published: boolean;
    website: string;
    visibility: "EVERYONE" | "SIGNED_IN";
    accessRule: "OPEN" | "INVITE" | "PAID";
    responsibleAdminId: string;
}

interface Admin {
    id: string;
    name: string;
    email: string;
}

const CourseEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal states
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            const [courseData, lessonData, adminData] = await Promise.all([
                api.get<Course>(`/courses/${id}`),
                api.get<Lesson[]>(`/lessons/course/${id}`),
                api.get<Admin[]>(`/auth/admins`)
            ]);
            setCourse(courseData);
            setLessons(lessonData);
            setAdmins(adminData);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load course data",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!course) return;

        // Validation
        if (!course.title) {
            toast({ title: "Error", description: "Title is required", variant: "destructive" });
            return;
        }
        if (course.published && !course.website) {
            toast({ title: "Error", description: "Website is required when published", variant: "destructive" });
            return;
        }

        try {
            setIsSaving(true);
            await api.put(`/courses/${id}`, course);
            toast({ title: "Success", description: "Course updated successfully" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update course", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTogglePublished = async (checked: boolean) => {
        if (!course) return;
        setCourse({ ...course, published: checked });
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm("Are you sure you want to delete this lesson?")) return;
        try {
            await api.del(`/lessons/${lessonId}`);
            setLessons(lessons.filter(l => l.id !== lessonId));
            toast({ title: "Success", description: "Lesson deleted" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete lesson", variant: "destructive" });
        }
    };

    if (isLoading || !course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Header */}
            <div className="border-b border-border bg-card sticky top-0 z-10">
                <div className="container py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-heading text-xl font-bold truncate max-w-[300px]">{course.title}</h1>
                            <p className="text-xs text-muted-foreground">ID: {course.id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full mr-2">
                            <span className="text-xs font-semibold">{course.published ? "Published" : "Draft"}</span>
                            <Switch checked={course.published} onCheckedChange={handleTogglePublished} />
                        </div>

                        <Link to={`/course/${course.id}`} target="_blank">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Eye className="h-4 w-4" /> Preview
                            </Button>
                        </Link>

                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsAttendeeModalOpen(true)}>
                            <Users className="h-4 w-4" /> Attendees
                        </Button>

                        <Button variant="outline" size="sm" className="gap-2">
                            <Mail className="h-4 w-4" /> Contact
                        </Button>

                        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-primary text-primary-foreground font-semibold" size="sm">
                            <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container lg:max-w-6xl py-8 flex flex-col lg:flex-row gap-8">
                {/* Main Editor Section */}
                <div className="flex-1 space-y-8">
                    <Tabs defaultValue="content" className="w-full">
                        <TabsList className="bg-muted/50 mb-6">
                            <TabsTrigger value="content">Content</TabsTrigger>
                            <TabsTrigger value="description">Description</TabsTrigger>
                            <TabsTrigger value="options">Options</TabsTrigger>
                            <TabsTrigger value="quiz">Quiz</TabsTrigger>
                        </TabsList>

                        {/* Content Tab */}
                        <TabsContent value="content" className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-heading text-lg font-bold">Lessons</h3>
                                <Button size="sm" className="gap-2" onClick={() => {
                                    setSelectedLesson(null);
                                    setIsLessonModalOpen(true);
                                }}>
                                    <Plus className="h-4 w-4" /> Add Content
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {lessons.length === 0 ? (
                                    <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border text-muted-foreground">
                                        <p>No lessons yet. Click "Add Content" to start building your course.</p>
                                    </div>
                                ) : (
                                    lessons.map((lesson) => (
                                        <div key={lesson.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border group hover:border-primary/50 transition-colors">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                {lesson.type === 'video' && <Play className="h-5 w-5" />}
                                                {lesson.type === 'document' && <FileText className="h-5 w-5" />}
                                                {lesson.type === 'image' && <ImageIcon className="h-5 w-5" />}
                                                {lesson.type === 'quiz' && <HelpCircle className="h-5 w-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-foreground truncate">{lesson.title}</h4>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{lesson.type}</p>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="gap-2" onClick={() => {
                                                        setSelectedLesson(lesson);
                                                        setIsLessonModalOpen(true);
                                                    }}>
                                                        <Edit2 className="h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => handleDeleteLesson(lesson.id)}>
                                                        <Trash2 className="h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        {/* Description Tab */}
                        <TabsContent value="description" className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Course Title *</label>
                                    <Input
                                        value={course.title}
                                        onChange={(e) => setCourse({ ...course, title: e.target.value })}
                                        placeholder="e.g. Advanced TypeScript Patterns"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea
                                        value={course.description || ""}
                                        onChange={(e) => setCourse({ ...course, description: e.target.value })}
                                        placeholder="Describe what learners will achieve..."
                                        className="min-h-[200px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tags (comma separated)</label>
                                    <Input
                                        value={course.tags.join(", ")}
                                        onChange={(e) => setCourse({ ...course, tags: e.target.value.split(",").map(t => t.trim()) })}
                                        placeholder="e.g. React, UI, Web"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Options Tab */}
                        <TabsContent value="options" className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">General Settings</h4>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">External Website {course.published && "*"}</label>
                                        <Input
                                            value={course.website || ""}
                                            onChange={(e) => setCourse({ ...course, website: e.target.value })}
                                            placeholder="https://example.com/course"
                                        />
                                        <p className="text-[11px] text-muted-foreground">Required if the course is published.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Responsible Admin</label>
                                        <select
                                            className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            value={course.responsibleAdminId}
                                            onChange={(e) => setCourse({ ...course, responsibleAdminId: e.target.value })}
                                        >
                                            {admins.map(admin => (
                                                <option key={admin.id} value={admin.id}>{admin.name} ({admin.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">Access & Visibility</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
                                            <div className="mt-0.5">
                                                {course.visibility === "EVERYONE" ? <Globe className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-warning" />}
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-sm font-medium flex items-center justify-between">
                                                    Visibility
                                                    <select
                                                        className="bg-transparent text-xs font-bold border-none underline cursor-pointer focus:outline-none"
                                                        value={course.visibility}
                                                        onChange={(e) => setCourse({ ...course, visibility: e.target.value as any })}
                                                    >
                                                        <option value="EVERYONE">Public</option>
                                                        <option value="SIGNED_IN">Signed In Users</option>
                                                    </select>
                                                </label>
                                                <p className="text-xs text-muted-foreground">Who can see this course in the catalog.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
                                            <div className="mt-0.5">
                                                <CheckCircle className="h-4 w-4 text-success" />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-sm font-medium flex items-center justify-between">
                                                    Access Rule
                                                    <select
                                                        className="bg-transparent text-xs font-bold border-none underline cursor-pointer focus:outline-none"
                                                        value={course.accessRule}
                                                        onChange={(e) => setCourse({ ...course, accessRule: e.target.value as any })}
                                                    >
                                                        <option value="OPEN">Open (Anyone)</option>
                                                        <option value="INVITE">Invite Only</option>
                                                        <option value="PAID">Paid</option>
                                                    </select>
                                                </label>
                                                <p className="text-xs text-muted-foreground">How users can enroll in the course.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Quiz Tab */}
                        <TabsContent value="quiz" className="space-y-6">
                            <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
                                <HelpCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                <h3 className="font-heading font-bold text-lg">Quiz Management</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                    Coming soon! You will be able to manage course-wide assessments here.
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar Actions */}
                <div className="w-full lg:w-72 mt-12 lg:mt-0 space-y-6">
                    <div className="bg-card rounded-xl border border-border p-5 shadow-card">
                        <h4 className="font-heading font-bold text-sm mb-4">Course Image</h4>
                        <div className="aspect-video rounded-lg bg-muted relative overflow-hidden mb-4 border border-border group">
                            {course.image ? (
                                <img src={course.image} alt="Course" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                <Upload className="text-white h-6 w-6" />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center">Click image to upload. Recommended ratio 16:9.</p>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-4">
                        <h4 className="font-heading font-bold text-sm">Quick Actions</h4>
                        <Button variant="outline" className="w-full justify-start gap-3 h-10">
                            <Mail className="h-4 w-4" /> Message Instructor
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-3 h-10">
                            <AlertCircle className="h-4 w-4" /> View Analytics
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <LessonEditorModal
                isOpen={isLessonModalOpen}
                onClose={() => setIsLessonModalOpen(false)}
                courseId={id!}
                lesson={selectedLesson as any}
                onSave={() => {
                    api.get<Lesson[]>(`/lessons/course/${id}`).then(setLessons);
                }}
            />

            <AttendeeModal
                isOpen={isAttendeeModalOpen}
                onClose={() => setIsAttendeeModalOpen(false)}
                courseId={id!}
            />
        </div>
    );
};

export default CourseEditor;
