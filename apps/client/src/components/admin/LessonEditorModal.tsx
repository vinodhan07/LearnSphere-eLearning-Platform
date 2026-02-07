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
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";

interface Lesson {
    id?: string;
    title: string;
    description: string;
    content: string;
    duration: number;
    type: 'video' | 'document' | 'image' | 'quiz';
    order: number;
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
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (lesson) {
            setFormData(lesson);
        } else {
            setFormData({
                title: "",
                description: "",
                content: "",
                duration: 0,
                type: "video",
                order: 0,
            });
        }
    }, [lesson, isOpen]);

    const handleSave = async () => {
        if (!formData.title) {
            toast({ title: "Error", description: "Title is required", variant: "destructive" });
            return;
        }

        try {
            setIsSaving(true);
            let savedLesson;
            if (lesson?.id) {
                savedLesson = await api.put(`/lessons/${lesson.id}`, formData);
                toast({ title: "Success", description: "Lesson updated" });
            } else {
                savedLesson = await api.post(`/lessons/course/${courseId}`, formData);
                toast({ title: "Success", description: "Lesson created" });
            }
            onSave(savedLesson);
            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save lesson",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{lesson?.id ? "Edit Lesson" : "Add Lesson"}</DialogTitle>
                    <DialogDescription>
                        {lesson?.id ? "Update the details and content of your lesson." : "Add a new lesson to your course."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title *</label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Introduction to React Hooks"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger>
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Duration (min)</label>
                            <Input
                                type="number"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Content URL / Value</label>
                        <Input
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="e.g. YouTube URL or text"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief summary of the lesson..."
                            className="h-24"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Lesson"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LessonEditorModal;
