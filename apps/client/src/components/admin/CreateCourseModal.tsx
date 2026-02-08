import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import * as api from "@/lib/api";
import { useAuth } from '@/contexts/AuthContext';

interface CreateCourseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateCourseModal({ open, onOpenChange }: CreateCourseModalProps) {
    const [title, setTitle] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !user) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('responsibleAdminId', user.id);
            formData.append('description', '');
            formData.append('published', 'false');
            formData.append('website', '');
            formData.append('visibility', 'EVERYONE');
            formData.append('accessRule', 'OPEN');
            formData.append('currency', 'INR');
            if (imageFile) {
                formData.append('imageFile', imageFile);
            }

            await api.post('/courses', formData);

            toast({
                title: 'Course created',
                description: `Successfully created course "${title}"`,
            });
            setTitle('');
            onOpenChange(false);
        } catch (error: any) {
            console.error("Create course error:", error);
            toast({
                title: 'Failed to create course',
                description: error.message || 'Something went wrong',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border text-card-foreground">
                <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>
                        Give your new course a title. You will be able to add content and quizzes after the course is created.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-foreground">Course Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Advanced React Patterns"
                            className="bg-background border-input text-foreground focus:ring-orange-500 focus:border-orange-500"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="image" className="text-foreground">Course Cover (Optional)</Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            className="bg-background border-input text-foreground focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                            disabled={isSubmitting}
                        />
                        <p className="text-[10px] text-muted-foreground italic">Recommended size: 800x450px (Limit: 5MB)</p>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-muted-foreground hover:text-foreground"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            disabled={isSubmitting || !title.trim()}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Course'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
