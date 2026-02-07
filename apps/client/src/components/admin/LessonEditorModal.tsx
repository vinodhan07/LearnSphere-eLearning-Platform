import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, FileIcon, ExternalLink, Video, FileText, Image as ImageIcon } from "lucide-react";
import * as api from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface Attachment {
    name: string;
    url: string;
    type: 'file' | 'link';
}

interface Lesson {
    id?: string;
    title: string;
    description: string;
    content: string;
    duration: number | string;
    type: 'video' | 'document' | 'image' | 'quiz';
    order: number;
    allowDownload: boolean;
    attachments: string | null; // JSON string
}

interface LessonEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    lesson?: Lesson | null;
    onSave: (lesson: any) => void;
}

const LessonEditorModal = ({ isOpen, onClose, courseId, lesson, onSave }: LessonEditorModalProps) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState<Lesson>({
        title: "",
        description: "",
        content: "",
        duration: 0,
        type: "video",
        order: 0,
        allowDownload: true,
        attachments: "[]",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    useEffect(() => {
        if (lesson) {
            setFormData(lesson);
            try {
                setAttachments(JSON.parse(lesson.attachments || "[]"));
            } catch (e) {
                setAttachments([]);
            }
        } else {
            setFormData({
                title: "",
                description: "",
                content: "",
                duration: 0,
                type: "video",
                order: 0,
                allowDownload: true,
                attachments: "[]",
            });
            setAttachments([]);
        }
    }, [lesson, isOpen]);

    const handleAddAttachment = () => {
        setAttachments([...attachments, { name: "", url: "", type: "link" }]);
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleUpdateAttachment = (index: number, field: keyof Attachment, value: string) => {
        const newAttachments = [...attachments];
        newAttachments[index] = { ...newAttachments[index], [field]: value };
        setAttachments(newAttachments);
    };

    const handleSave = async () => {
        // Validation
        if (!formData.title.trim()) {
            toast({ title: "Validation Error", description: "Lesson title is required.", variant: "destructive" });
            return;
        }
        if (!formData.content.trim()) {
            toast({ title: "Validation Error", description: "Lesson content/URL is required.", variant: "destructive" });
            return;
        }

        try {
            setIsSaving(true);
            const dataToSave = {
                ...formData,
                duration: typeof formData.duration === 'string' ? (Number(formData.duration) || 0) : formData.duration,
                attachments: JSON.stringify(attachments)
            };

            let savedLesson;
            if (lesson?.id) {
                savedLesson = await api.put(`/lessons/${lesson.id}`, dataToSave);
                toast({ title: "Success", description: "Lesson updated successfully." });
            } else {
                savedLesson = await api.post(`/lessons/course/${courseId}`, dataToSave);
                toast({ title: "Success", description: "Lesson created successfully." });
            }
            onSave(formData);
            onClose();
        } catch (error: any) {
            console.error("Failed to save lesson:", error);
            toast({
                title: "Save Failed",
                description: error.message || "An unexpected error occurred. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {formData.type === 'video' && <Video className="h-5 w-5 text-primary" />}
                        {formData.type === 'document' && <FileText className="h-5 w-5 text-blue-500" />}
                        {formData.type === 'image' && <ImageIcon className="h-5 w-5 text-emerald-500" />}
                        {lesson?.id ? "Edit Lesson" : "Add Lesson"}
                    </DialogTitle>
                    <DialogDescription>
                        Configure lesson content, description, and attachments.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="content" className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="description">Description</TabsTrigger>
                        <TabsTrigger value="attachments">Attachments</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/80">Lesson Title *</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Introduction to React Hooks"
                                className="h-10"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground/80">Content Type</label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="document">Document</SelectItem>
                                        <SelectItem value="image">Image</SelectItem>
                                        <SelectItem value="quiz">Quiz</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.type === 'video' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/80">Video Duration (min)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        className="h-10"
                                        placeholder="0.00"
                                    />
                                </div>
                            )}

                            {formData.type === 'document' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/80">Downloadable</label>
                                    <div className="flex items-center gap-3 h-10 px-3 bg-muted/30 rounded-md border border-input">
                                        <span className="text-xs font-medium flex-1">Allow learners to download</span>
                                        <Switch
                                            checked={formData.allowDownload}
                                            onCheckedChange={(checked) => setFormData({ ...formData, allowDownload: checked })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/80">
                                {formData.type === 'video' ? 'Video Link / URL' :
                                    formData.type === 'document' ? 'Document URL / Text' :
                                        formData.type === 'image' ? 'Image URL' : 'Content'}
                            </label>
                            <Input
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder={formData.type === 'video' ? 'YouTube/Vimeo/Direct MP4 URL' : 'URL or content value'}
                                className="h-10"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="description" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/80">Lesson Description</label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Explain what this lesson covers..."
                                className="min-h-[200px] resize-none"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="attachments" className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground/80 underline decoration-primary/30 underline-offset-4">Resource Attachments</label>
                            <Button variant="ghost" size="sm" onClick={handleAddAttachment} className="h-8 gap-2 text-primary hover:text-primary hover:bg-primary/10">
                                <Plus className="h-3.5 w-3.5" /> Add Resource
                            </Button>
                        </div>

                        {attachments.length === 0 ? (
                            <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border">
                                <FileIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">No additional resources added.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {attachments.map((att, idx) => (
                                    <div key={idx} className="flex gap-2 items-start p-3 bg-card rounded-lg border border-border group relative">
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <Input
                                                placeholder="Name (e.g. Cheat Sheet)"
                                                value={att.name}
                                                onChange={(e) => handleUpdateAttachment(idx, 'name', e.target.value)}
                                                className="h-8 text-xs font-medium"
                                            />
                                            <Input
                                                placeholder="URL (e.g. https://...)"
                                                value={att.url}
                                                onChange={(e) => handleUpdateAttachment(idx, 'url', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveAttachment(idx)}
                                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-[10px] text-muted-foreground italic mt-2">
                            * Resources will be displayed below the lesson content for learners.
                        </p>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4 border-t border-border pt-4">
                    <Button variant="ghost" onClick={onClose} className="hover:bg-muted/50">Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground font-bold shadow-glow-sm">
                        {isSaving ? "Saving..." : lesson?.id ? "Update Lesson" : "Create Lesson"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LessonEditorModal;
