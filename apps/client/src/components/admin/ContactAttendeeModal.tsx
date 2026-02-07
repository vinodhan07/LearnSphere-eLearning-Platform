import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContactAttendeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
}

const ContactAttendeeModal: React.FC<ContactAttendeeModalProps> = ({ isOpen, onClose, courseId }) => {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    const handleSend = async () => {
        if (!subject || !message) {
            toast({
                title: "Validation Error",
                description: "Please provide both a subject and a message.",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsSending(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast({
                title: "Message Sent",
                description: "Your message has been sent to all course attendees.",
            });
            onClose();
            setSubject("");
            setMessage("");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-orange-500" />
                        Contact Attendees
                    </DialogTitle>
                    <DialogDescription>
                        Send a message to all learners enrolled in this course.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Subject</label>
                        <Input
                            placeholder="e.g. New course material available"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Message</label>
                        <Textarea
                            placeholder="Write your message here..."
                            className="min-h-[150px] resize-none"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-muted rounded-lg border border-border">
                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            This message will be sent to all enrolled participants via their registered email addresses.
                            Please ensure your content complies with the platform's communication guidelines.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isSending}
                        className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                    >
                        {isSending ? "Sending..." : "Send Message"}
                        <Send className="h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ContactAttendeeModal;
