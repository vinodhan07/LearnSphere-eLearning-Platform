import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles, Loader2 } from "lucide-react";
import * as api from "@/lib/api";

interface ReviewSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    courseTitle: string;
}

const ReviewSummaryModal: React.FC<ReviewSummaryModalProps> = ({
    isOpen,
    onClose,
    courseId,
    courseTitle,
}) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && courseId) {
            fetchSummary();
        }
    }, [isOpen, courseId]);

    const fetchSummary = async () => {
        try {
            setIsLoading(true);
            const data = await api.get<{ summary: string }>(`/ai/review-summary/${courseId}`);
            setSummary(data.summary);
        } catch (error) {
            console.error("Failed to fetch review summary", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-orange-500" />
                        AI Review Summary
                    </DialogTitle>
                    <DialogDescription>
                        Summarized sentiment analysis for "{courseTitle}"
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                            <p className="text-sm text-muted-foreground animate-pulse">Analyzing student feedback...</p>
                        </div>
                    ) : summary ? (
                        <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <MessageSquare className="h-20 w-20 text-orange-500" />
                            </div>
                            <p className="text-foreground/90 leading-relaxed italic text-lg font-medium">
                                "{summary}"
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No review data available for this course yet.</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button onClick={fetchSummary} disabled={isLoading} variant="ghost" className="gap-2">
                        <Sparkles className="h-4 w-4" /> Refresh Analysis
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ReviewSummaryModal;
