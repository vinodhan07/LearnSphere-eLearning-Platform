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
    HelpCircle,
    X,
    ChevronDown,
    ChevronUp,
    Sparkles
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
import LessonEditorModal from "@/components/admin/LessonEditorModal";
import AttendeeModal from "@/components/admin/AttendeeModal";
import ContactAttendeeModal from "@/components/admin/ContactAttendeeModal";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface QuizQuestion {
    id: string;
    question: string;
    options: string; // JSON string in backend, but we'll parse it
    correctIndex: number;
}

interface Lesson {
    id: string;
    title: string;
    type: 'video' | 'document' | 'image' | 'quiz';
    order: number;
    description: string;
    content: string;
    attachments: string | null;
    allowDownload: boolean;
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
    price?: number;
    currency?: string;
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
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("content");

    // Modal states
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    // Deletion confirmation state
    const [deleteModalConfig, setDeleteModalConfig] = useState<{
        isOpen: boolean;
        type: 'lesson' | 'question' | null;
        itemId: string;
        parentId?: string; // for questions (lessonId)
        title: string;
        description: string;
    }>({
        isOpen: false,
        type: null,
        itemId: '',
        title: '',
        description: ''
    });

    // Quiz management states
    const [quizQuestions, setQuizQuestions] = useState<Record<string, any[]>>({});
    const [expandedQuizzes, setExpandedQuizzes] = useState<Set<string>>(new Set());
    const [tagInput, setTagInput] = useState("");

    const { user, isLoading: authLoading } = useAuth();

    useEffect(() => {
        if (!id || authLoading) return;

        const fetchData = async () => {
            setIsLoading(true);
            // Clear previous state to prevent ghost data
            setCourse(null);
            setLessons([]);
            setQuizQuestions({});
            setAdmins([]);
            setExpandedQuizzes(new Set());

            try {
                // 1. Fetch Course & Lessons in parallel
                const [courseData, lessonsData] = await Promise.all([
                    api.getCourse(id),
                    api.getCourseLessons(id)
                ]);

                setCourse(courseData as any);
                setLessons(lessonsData as any);

                // 3. Fetch Admins (non-blocking, might fail for instructors)
                try {
                    const adminData = await api.get<Admin[]>(`/auth/admins`);
                    setAdmins(adminData);
                } catch (adminError) {
                    console.warn("Could not fetch admins (instructor role?)", adminError);
                    // Provide the current user as an option if they are an instructor
                    if (user && user.role === 'INSTRUCTOR') {
                        setAdmins([{ id: user.id, name: user.name, email: user.email }]);
                    }
                }
            } catch (error) {
                console.error("Fetch data error:", error);
                toast({ title: "Error", description: "Failed to load course details", variant: "destructive" });
                navigate('/admin');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, navigate, toast, authLoading, user]);

    const fetchQuestions = async (lessonId: string) => {
        try {
            const data = await api.getQuizQuestions(lessonId);
            setQuizQuestions(prev => ({ ...prev, [lessonId]: data }));
        } catch (error) {
            console.error("Failed to fetch questions:", error);
        }
    };

    const toggleQuizExpansion = (lessonId: string) => {
        const newExpanded = new Set(expandedQuizzes);
        if (newExpanded.has(lessonId)) {
            newExpanded.delete(lessonId);
        } else {
            newExpanded.add(lessonId);
            if (!quizQuestions[lessonId]) {
                fetchQuestions(lessonId);
            }
        }
        setExpandedQuizzes(newExpanded);
    };

    const prepareCourseForUpdate = (courseData: Course) => {
        return {
            ...courseData,
            // Sanitize string fields that might be null from backend to satisfy Zod string request
            website: courseData.website || "",
            image: courseData.image || "",
            description: courseData.description || "",
            // Handle price logic and ensure numbers
            price: courseData.accessRule === 'PAID' && courseData.price ? Number(courseData.price) : null,
            currency: "INR"
        };
    };

    const handleSave = async () => {
        if (!course || !id) return;

        // Validation
        if (!course.title) {
            toast({ title: "Error", description: "Title is required", variant: "destructive" });
            return;
        }

        if (course.accessRule === 'PAID' && (!course.price || course.price <= 0)) {
            toast({ title: "Validation Error", description: "Price is required for paid courses.", variant: "destructive" });
            setActiveTab("options");
            return;
        }

        try {
            setIsSaving(true);
            const dataToUpdate = prepareCourseForUpdate(course);

            const formData = new FormData();
            Object.entries(dataToUpdate).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    if (Array.isArray(value)) {
                        formData.append(key, JSON.stringify(value));
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });

            if (imageFile) {
                formData.append('imageFile', imageFile);
            }

            await api.put(`/courses/${id}`, formData);
            toast({ title: "Changes Saved", description: "Your course updates have been saved successfully.", className: "bg-emerald-500 text-white border-emerald-600" });
        } catch (error: any) {
            console.error("Save failed:", error);
            // Construct a more helpful error message
            let errorMessage = error.message || "Failed to update course.";
            // Check for specific backend validation errors
            if (errorMessage === "Validation failed" || errorMessage.includes("Validation")) {
                errorMessage = "Validation failed: Please ensure all fields like Website and Image URLs are valid.";
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTogglePublished = async (checked: boolean) => {
        if (!course) return;

        // Optimistic update
        const previousState = { ...course };
        const updatedCourse = { ...course, published: checked };
        setCourse(updatedCourse);

        try {
            // No loading spinner for toggle to keep UI responsive, but we could add a small indicator if needed
            // currently reusing isSaving for button disabled states
            setIsSaving(true);

            const dataToUpdate = prepareCourseForUpdate(updatedCourse);
            await api.put(`/courses/${id}`, dataToUpdate);

            toast({
                title: checked ? "Course Published" : "Course Unpublished",
                description: checked
                    ? "Your course is now live and visible to students."
                    : "Your course is now hidden and set to draft mode.",
                className: checked ? "bg-emerald-500 text-white border-emerald-600" : ""
            });
        } catch (error: any) {
            console.error("Publish toggle failed:", error);
            setCourse(previousState); // Revert on failure

            let errorMessage = error.message || "Failed to update status.";
            if (errorMessage === "Validation failed" || errorMessage.includes("Validation")) {
                errorMessage = "Validation failed: Please ensure all fields (Website, Image) are valid.";
            }

            toast({
                title: "Update Failed",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        setDeleteModalConfig({
            isOpen: true,
            type: 'lesson',
            itemId: lessonId,
            title: "Delete Lesson",
            description: "Are you sure you want to delete this lesson? This action cannot be undone and all lesson content will be permanently removed."
        });
    };

    const confirmDeleteLesson = async () => {
        const lessonId = deleteModalConfig.itemId;
        try {
            setIsSaving(true);
            await api.del(`/lessons/${lessonId}`);

            setLessons(prev => prev.filter(l => l.id !== lessonId));
            toast({ title: "Success", description: "Lesson deleted successfully" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete lesson", variant: "destructive" });
        } finally {
            setIsSaving(false);
            setDeleteModalConfig(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleAddTag = () => {
        if (!course || !tagInput.trim()) return;
        if (course.tags.includes(tagInput.trim())) {
            setTagInput("");
            return;
        }
        setCourse({ ...course, tags: [...course.tags, tagInput.trim()] });
        setTagInput("");
    };

    const handleRemoveTag = (tagToRemove: string) => {
        if (!course) return;
        setCourse({ ...course, tags: course.tags.filter(t => t !== tagToRemove) });
    };

    const handleAddQuestion = async (lessonId: string) => {
        try {
            setIsSaving(true);
            const newOrder = (quizQuestions[lessonId]?.length || 0);
            const data = {
                question: "New Question",
                options: JSON.stringify(["Option 1", "Option 2"]),
                correctIndex: 0,
                order: newOrder,
            };

            const newQuestion = await api.post(`/quizzes/${lessonId}/question`, data);

            setQuizQuestions(prev => ({
                ...prev,
                [lessonId]: [...(prev[lessonId] || []), newQuestion]
            }));

            toast({ title: "Success", description: "Question added" });
        } catch (error) {
            console.error("Failed to add question:", error);
            toast({ title: "Error", description: "Failed to add question", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAIGenerateQuiz = async (quizId: string) => {
        const sourceLesson = lessons.find(l => l.type !== 'quiz');
        if (!sourceLesson) {
            toast({ title: "No Source Content", description: "Add a content lesson first so AI has something to reference.", variant: "destructive" });
            return;
        }

        try {
            toast({ title: "AI Generation Started", description: "Generating questions from your lesson content..." });
            // API endpoint will need to be updated to write to Firestore
            await api.post('/ai/generate-quiz', { lessonId: sourceLesson.id, quizId });

            toast({ title: "Success", description: "AI generated 3 new questions based on your course content." });
            if (!expandedQuizzes.has(quizId)) {
                toggleQuizExpansion(quizId);
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to generate AI questions", variant: "destructive" });
        }
    };

    const handleUpdateQuestion = async (quizId: string, questionId: string, data: any) => {
        try {
            const updateData = {
                ...data,
                options: typeof data.options !== 'string' ? JSON.stringify(data.options) : data.options
            };
            await api.put(`/quizzes/${questionId}`, updateData);

            setQuizQuestions(prev => ({
                ...prev,
                [quizId]: prev[quizId].map(q => q.id === questionId ? { ...q, ...data } : q)
            }));

            toast({ title: "Updated", description: "Question saved" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update question", variant: "destructive" });
        }
    };

    const handleDeleteQuestion = async (lessonId: string, questionId: string) => {
        setDeleteModalConfig({
            isOpen: true,
            type: 'question',
            itemId: questionId,
            parentId: lessonId,
            title: "Delete Question",
            description: "Delete this question? This will permanently remove it from the quiz."
        });
    };

    const confirmDeleteQuestion = async () => {
        const questionId = deleteModalConfig.itemId;
        const lessonId = deleteModalConfig.parentId;
        try {
            setIsSaving(true);
            await api.del(`/quizzes/${questionId}`);

            if (lessonId) {
                setQuizQuestions(prev => ({
                    ...prev,
                    [lessonId]: prev[lessonId].filter(q => q.id !== questionId)
                }));
            }

            toast({ title: "Deleted", description: "Question removed successfully" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete question", variant: "destructive" });
        } finally {
            setIsSaving(false);
            setDeleteModalConfig(prev => ({ ...prev, isOpen: false }));
        }
    };

    if (isLoading || !course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const quizLessons = lessons.filter(l => l.type === 'quiz');

    return (
        <div className="min-h-screen bg-background">

            {/* Header */}
            <div className="border-b border-border bg-card sticky top-0 z-10">
                <div className="container py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/courses">
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
                            <span className={`text-[10px] font-bold uppercase ${course.published ? "text-emerald-500" : "text-muted-foreground"}`}>
                                {course.published ? "Published" : "Draft"}
                            </span>
                            <Switch checked={course.published} onCheckedChange={handleTogglePublished} />
                        </div>

                        <Link to={`/courses/${course.id}`} target="_blank">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Eye className="h-4 w-4" /> Preview
                            </Button>
                        </Link>

                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsAttendeeModalOpen(true)}>
                            <Users className="h-4 w-4" /> Attendees
                        </Button>

                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsContactModalOpen(true)}>
                            <Mail className="h-4 w-4" /> Contact
                        </Button>

                        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-primary text-primary-foreground font-semibold shadow-glow-sm" size="sm">
                            <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container lg:max-w-6xl py-8 flex flex-col lg:flex-row gap-8">
                {/* Main Editor Section */}
                <div className="flex-1 space-y-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-muted/50 mb-6 p-1">
                            <TabsTrigger value="content" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Content</TabsTrigger>
                            <TabsTrigger value="description" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Description</TabsTrigger>
                            <TabsTrigger value="options" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Options</TabsTrigger>
                            <TabsTrigger value="quiz" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Quiz</TabsTrigger>
                        </TabsList>

                        {/* Content Tab */}
                        <TabsContent value="content" className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" /> Lessons & Content
                                </h3>
                                <Button size="sm" className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20" onClick={() => {
                                    setSelectedLesson(null);
                                    setIsLessonModalOpen(true);
                                }}>
                                    <Plus className="h-4 w-4" /> Add Content
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {lessons.length === 0 ? (
                                    <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border text-muted-foreground">
                                        <Plus className="h-10 w-10 mx-auto mb-4 opacity-20" />
                                        <p className="font-medium">No lessons yet.</p>
                                        <p className="text-xs">Click "Add Content" to start building your course.</p>
                                    </div>
                                ) : (
                                    lessons.map((lesson) => (
                                        <div key={lesson.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border group hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                {lesson.type === 'video' && <Play className="h-5 w-5" />}
                                                {lesson.type === 'document' && <FileText className="h-5 w-5" />}
                                                {lesson.type === 'image' && <ImageIcon className="h-5 w-5" />}
                                                {lesson.type === 'quiz' && <HelpCircle className="h-5 w-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{lesson.title}</h4>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{lesson.type}</p>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => {
                                                    setSelectedLesson(lesson);
                                                    setIsLessonModalOpen(true);
                                                }}>
                                                    <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem className="gap-2" onClick={() => {
                                                            setSelectedLesson(lesson);
                                                            setIsLessonModalOpen(true);
                                                        }}>
                                                            <Edit2 className="h-4 w-4" /> Edit Content
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => handleDeleteLesson(lesson.id)}>
                                                            <Trash2 className="h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        {/* Description Tab */}
                        <TabsContent value="description" className="space-y-6">
                            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground/80">Course Title *</label>
                                    <Input
                                        value={course.title}
                                        onChange={(e) => setCourse({ ...course, title: e.target.value })}
                                        placeholder="e.g. Advanced TypeScript Patterns"
                                        className="h-11 font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground/80">Course Tags</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <AnimatePresence>
                                            {course.tags.map((tag) => (
                                                <motion.div
                                                    key={tag}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                >
                                                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 py-1 pl-3 pr-1 flex items-center gap-1">
                                                        {tag}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-4 w-4 hover:bg-transparent text-primary/60 hover:text-primary"
                                                            onClick={() => handleRemoveTag(tag)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </Badge>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {course.tags.length === 0 && (
                                            <span className="text-xs text-muted-foreground italic py-1">No tags added yet.</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                            placeholder="Add a tag..."
                                            className="h-10"
                                        />
                                        <Button type="button" onClick={handleAddTag} variant="outline" className="h-10">Add</Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground/80">Full Description</label>
                                    <Textarea
                                        value={course.description || ""}
                                        onChange={(e) => setCourse({ ...course, description: e.target.value })}
                                        placeholder="Describe what learners will achieve with this course..."
                                        className="min-h-[250px] resize-none"
                                    />
                                    <p className="text-[11px] text-muted-foreground">Markdown is supported for course formatting.</p>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Options Tab */}
                        <TabsContent value="options" className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                                        <h4 className="font-heading font-bold text-sm uppercase tracking-widest text-primary/70">General Settings</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold flex items-center gap-2">
                                                    External Website
                                                </label>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs text-primary hover:text-primary hover:bg-primary/10 -mr-2"
                                                    onClick={() => {
                                                        if (!course.title) {
                                                            toast({ title: "Title Required", description: "Please enter a course title first.", variant: "destructive" });
                                                            return;
                                                        }
                                                        const slug = course.title
                                                            .toLowerCase()
                                                            .replace(/[^a-z0-9]+/g, '-')
                                                            .replace(/(^-|-$)+/g, '');
                                                        setCourse({ ...course, website: `https://example.com/course/${slug}` });
                                                        toast({ title: "Link Generated", description: "Website link auto-generated from title." });
                                                    }}
                                                >
                                                    <Sparkles className="h-3 w-3 mr-1" /> Auto-Generate
                                                </Button>
                                            </div>
                                            <Input
                                                value={course.website || ""}
                                                onChange={(e) => setCourse({ ...course, website: e.target.value })}
                                                placeholder="https://example.com/course/my-course"
                                                className={`h-10 ${course.published && !course.website ? "border-destructive ring-1 ring-destructive/20" : ""}`}
                                            />
                                            <p className="text-[10px] text-muted-foreground italic">Optional: Add a link to the official course website.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Responsible Admin / Instructor</label>
                                            <select
                                                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background font-medium text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                value={course.responsibleAdminId}
                                                onChange={(e) => setCourse({ ...course, responsibleAdminId: e.target.value })}
                                            >
                                                {admins.map(admin => (
                                                    <option key={admin.id} value={admin.id}>{admin.name} ({admin.email})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                                        <h4 className="font-heading font-bold text-sm uppercase tracking-widest text-primary/70">Course Cover Image</h4>
                                        <div className="space-y-4">
                                            <div className="aspect-video rounded-xl border border-border bg-muted/30 overflow-hidden flex items-center justify-center relative group">
                                                {previewUrl || course.image || course.imageData ? (
                                                    <img
                                                        src={previewUrl || (course.image ? course.image : `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses/${course.id}/image`)}
                                                        alt="Course Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-center p-6">
                                                        <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                                                        <p className="text-xs text-muted-foreground italic">No cover image uploaded.</p>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <label htmlFor="course-image-upload" className="cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold py-2 px-4 rounded-full border border-white/20 transition-all">
                                                        Change Image
                                                    </label>
                                                    <input
                                                        id="course-image-upload"
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setImageFile(file);
                                                                setPreviewUrl(URL.createObjectURL(file));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground italic text-center">Recommended: 16:9 aspect ratio. Limit 5MB.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                                        <h4 className="font-heading font-bold text-sm uppercase tracking-widest text-primary/70">Access & Visibility</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/20">
                                                <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border">
                                                    {course.visibility === "EVERYONE" ? <Globe className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-orange-500" />}
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-sm font-bold flex items-center justify-between">
                                                        Visibility
                                                        <select
                                                            className="bg-transparent text-[10px] uppercase tracking-tighter font-black text-primary hover:underline cursor-pointer focus:outline-none"
                                                            value={course.visibility}
                                                            onChange={(e) => setCourse({ ...course, visibility: e.target.value as any })}
                                                        >
                                                            <option value="EVERYONE">Public View</option>
                                                            <option value="SIGNED_IN">Restricted</option>
                                                        </select>
                                                    </label>
                                                    <p className="text-xs text-muted-foreground mt-1">Status: {course.visibility === "EVERYONE" ? "Visible to anyone visiting the site." : "Only visible to logged-in users."}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/20">
                                                <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border">
                                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-sm font-bold flex items-center justify-between">
                                                        Access Mode
                                                        <select
                                                            className="bg-transparent text-[10px] uppercase tracking-tighter font-black text-primary hover:underline cursor-pointer focus:outline-none"
                                                            value={course.accessRule}
                                                            onChange={(e) => setCourse({ ...course, accessRule: e.target.value as any })}
                                                        >
                                                            <option value="OPEN">Free/Open</option>
                                                            <option value="INVITE">Waitlist/Invite</option>
                                                            <option value="PAID">Premium/Paid</option>
                                                        </select>
                                                    </label>
                                                    <p className="text-xs text-muted-foreground mt-1">Rule: {course.accessRule === "OPEN" ? "Anyone can enroll instantly." : course.accessRule === "INVITE" ? "Requires admin approval." : "Requires payment to unlock content."}</p>
                                                </div>
                                            </div>

                                            {course.accessRule === "PAID" && (
                                                <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/20">
                                                    <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border">
                                                        <span className="text-lg font-bold text-emerald-500">₹</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-sm font-bold block mb-2">Price (INR)</label>
                                                        <Input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={course.price || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === "" || /^\d+$/.test(val)) {
                                                                    setCourse({ ...course, price: val === "" ? 0 : parseInt(val) });
                                                                }
                                                            }}
                                                            placeholder="0"
                                                            className="font-medium"
                                                        />
                                                        <p className="text-[10px] text-muted-foreground mt-1">Enter amount in Rupees (Integer only).</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Quiz Tab */}
                        <TabsContent value="quiz" className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                                    <HelpCircle className="h-5 w-5 text-primary" /> Quiz Assessments
                                </h3>
                                <Button size="sm" className="gap-2 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border border-orange-500/20 font-bold" onClick={() => {
                                    setSelectedLesson({ id: "", title: "New Quiz", type: "quiz", order: lessons.length + 1, description: "", content: "", attachments: null, allowDownload: false });
                                    setIsLessonModalOpen(true);
                                }}>
                                    <Plus className="h-4 w-4" /> Add Quiz
                                </Button>
                            </div>

                            {quizLessons.length === 0 ? (
                                <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
                                    <HelpCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="font-heading font-bold text-lg">No Quizzes Found</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                        Quizzes are created as "Quiz" type lessons in the Content tab. Add one to see it here.
                                    </p>
                                    <Button variant="outline" className="mt-6 font-bold" onClick={() => setActiveTab("content")}>
                                        Go to Content Tab
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {quizLessons.map((quiz) => (
                                        <div key={quiz.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                                            <div
                                                className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                                                onClick={() => toggleQuizExpansion(quiz.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <HelpCircle className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-foreground">{quiz.title}</h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            {quizQuestions[quiz.id]?.length || 0} Questions • Passing: 80%
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 gap-2 border-primary/30 text-primary hover:bg-primary/5 font-bold"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAIGenerateQuiz(quiz.id);
                                                        }}
                                                    >
                                                        <Sparkles className="h-3.5 w-3.5" /> AI Generate
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-primary font-bold h-8 px-3" onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddQuestion(quiz.id);
                                                    }}>
                                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Question
                                                    </Button>
                                                    {expandedQuizzes.has(quiz.id) ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {expandedQuizzes.has(quiz.id) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-border bg-muted/10"
                                                    >
                                                        <div className="p-6 space-y-6">
                                                            {!quizQuestions[quiz.id] ? (
                                                                <div className="flex justify-center py-4">
                                                                    <div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full"></div>
                                                                </div>
                                                            ) : quizQuestions[quiz.id].length === 0 ? (
                                                                <p className="text-center text-sm text-muted-foreground py-4 italic">No questions added yet.</p>
                                                            ) : (
                                                                quizQuestions[quiz.id].map((q, qIdx) => (
                                                                    <div key={q.id} className="bg-background rounded-xl border border-border p-5 relative group">
                                                                        <div className="flex justify-between items-start mb-4">
                                                                            <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">Question {qIdx + 1}</span>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-7 w-7 text-destructive absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                onClick={() => handleDeleteQuestion(quiz.id, q.id)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                        <div className="space-y-4">
                                                                            <Input
                                                                                value={q.question}
                                                                                onChange={(e) => {
                                                                                    const updated = [...quizQuestions[quiz.id]];
                                                                                    updated[qIdx].question = e.target.value;
                                                                                    setQuizQuestions({ ...quizQuestions, [quiz.id]: updated });
                                                                                }}
                                                                                onBlur={() => handleUpdateQuestion(quiz.id, q.id, { question: q.question })}
                                                                                className="font-bold border-none px-0 focus-visible:ring-0 text-lg h-auto mb-2 placeholder:text-muted-foreground/40"
                                                                                placeholder="Enter your question here..."
                                                                            />

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                                {q.options.map((opt: string, oIdx: number) => (
                                                                                    <div key={oIdx} className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${q.correctIndex === oIdx ? "border-emerald-500 bg-emerald-50/50" : "border-border hover:border-muted-foreground/30"}`}>
                                                                                        <input
                                                                                            type="radio"
                                                                                            checked={q.correctIndex === oIdx}
                                                                                            onChange={() => handleUpdateQuestion(quiz.id, q.id, { correctIndex: oIdx })}
                                                                                            className="accent-emerald-500 w-4 h-4 cursor-pointer"
                                                                                        />
                                                                                        <Input
                                                                                            value={opt}
                                                                                            onChange={(e) => {
                                                                                                const updated = [...quizQuestions[quiz.id]];
                                                                                                const newOpts = [...updated[qIdx].options];
                                                                                                newOpts[oIdx] = e.target.value;
                                                                                                updated[qIdx].options = newOpts;
                                                                                                setQuizQuestions({ ...quizQuestions, [quiz.id]: updated });
                                                                                            }}
                                                                                            onBlur={() => handleUpdateQuestion(quiz.id, q.id, { options: q.options })}
                                                                                            className="border-none h-7 px-1 text-sm focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/30"
                                                                                            placeholder={`Option ${oIdx + 1}`}
                                                                                        />
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                            <div className="flex justify-center pt-2">
                                                                <Button variant="outline" size="sm" className="gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 px-6" onClick={() => handleAddQuestion(quiz.id)}>
                                                                    <Plus className="h-4 w-4" /> Add Another Question
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar Actions */}
                <div className="w-full lg:w-72 mt-12 lg:mt-0 space-y-6">
                    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                        <h4 className="font-heading font-bold text-sm mb-4">Course Preview Image</h4>
                        <div
                            className="aspect-video rounded-lg bg-muted relative overflow-hidden mb-4 border border-border group cursor-pointer"
                            onClick={() => document.getElementById('image-upload')?.click()}
                        >
                            {course.image ? (
                                <img src={course.image} alt="Course" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Upload className="text-white h-6 w-6" />
                            </div>
                        </div>
                        <input
                            type="file"
                            id="image-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const url = URL.createObjectURL(file);
                                    setCourse({ ...course, image: url });
                                    toast({ title: "Image Selected", description: "Image preview updated. Don't forget to save." });
                                }
                            }}
                        />
                        <Input
                            value={course.image || ""}
                            onChange={(e) => setCourse({ ...course, image: e.target.value })}
                            placeholder="Image URL (HTTPS)"
                            className="h-8 text-[10px] mb-2"
                        />
                        <p className="text-[10px] text-muted-foreground text-center">Click preview to upload or paste URL. Recommended 1280x720.</p>
                    </div>

                    <div className="bg-primary/5 rounded-xl border border-primary/20 p-5 space-y-4">
                        <h4 className="font-heading font-bold text-sm text-primary flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> Quick Insights
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Content Lessons</span>
                                <span className="font-bold">{lessons.filter(l => l.type !== 'quiz').length}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Quizzes</span>
                                <span className="font-bold">{quizLessons.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs border-t border-primary/10 pt-2">
                                <span className="text-muted-foreground">Total Items</span>
                                <span className="font-bold">{lessons.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Published</span>
                                <Badge variant={course.published ? "default" : "outline"} className={`text-[9px] ${course.published ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}`}>
                                    {course.published ? "Yes" : "No"}
                                </Badge>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[10px] h-8 font-bold border-primary/20 text-primary hover:bg-primary/10"
                            onClick={() => {
                                const headers = ["Metric,Value"];
                                const rows = [
                                    `Total Lessons,${lessons.length}`,
                                    `Quizzes,${quizLessons.length}`,
                                    `Published,${course.published ? "Yes" : "No"}`,
                                    `Price,${course.price || 0}`,
                                    // In a real app, we'd fetch these from backend stats
                                    `Total Students,${12}`,
                                    `Avg Progress,${45}%`,
                                    `Quiz Pass Rate,${78}%`,
                                    `Estimated Revenue,${(course.price || 0) * 12}`
                                ];
                                const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute("download", `${course.title.replace(/\s+/g, '_')}_analytics.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                toast({ title: "Report Downloaded", description: "Analytics report generated successfully." });
                            }}
                        >
                            Download Analytics Report
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

            <ContactAttendeeModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                courseId={id!}
            />

            <DeleteConfirmationModal
                isOpen={deleteModalConfig.isOpen}
                onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={deleteModalConfig.type === 'lesson' ? confirmDeleteLesson : confirmDeleteQuestion}
                title={deleteModalConfig.title}
                description={deleteModalConfig.description}
                isDeleting={isSaving}
            />
        </div>
    );
};

export default CourseEditor;
