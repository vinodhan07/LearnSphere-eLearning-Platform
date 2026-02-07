import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CreateCourseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateCourseModal({ open, onOpenChange }: CreateCourseModalProps) {
    const [title, setTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !user) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('Course')
                .insert({
                    title: title.trim(),
                    responsibleAdminId: user.id,
                    description: '',
                    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800',
                    published: false,
                    website: '',
                    visibility: 'EVERYONE',
                    accessRule: 'OPEN',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });

            if (error) throw error;

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
                        Give your new course a title. You can add more details later.
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
