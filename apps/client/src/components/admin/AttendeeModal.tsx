import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Mail, Search, UserPlus, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface User {
    id?: string;
    name: string;
    email: string;
    avatar?: string;
}

interface Enrollment {
    id: string;
    user: User;
    progress: number;
}

interface Invitation {
    id: string;
    user: User;
    status: string;
}

interface AttendeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
}

const AttendeeModal = ({ isOpen, onClose, courseId }: AttendeeModalProps) => {
    const { toast } = useToast();
    const [data, setData] = useState<{ enrollments: Enrollment[], invitations: Invitation[] }>({
        enrollments: [],
        invitations: []
    });
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    useEffect(() => {
        if (!isOpen || !courseId) return;

        const fetchData = async () => {
            setIsLoading(true);

            // 1. Fetch Enrollments with User profile join
            const { data: enrollData } = await supabase
                .from('Enrollment')
                .select('*, user:User(*)')
                .eq('courseId', courseId);

            if (enrollData) {
                setData(prev => ({
                    ...prev,
                    enrollments: enrollData.map((e: any) => ({
                        id: e.id,
                        progress: e.progress || 0,
                        user: {
                            id: e.userId,
                            name: e.user.name,
                            email: e.user.email,
                            avatar: e.user.avatar
                        }
                    }))
                }));
            }

            // 2. Fetch Invitations
            const { data: inviteData } = await supabase
                .from('CourseInvitation')
                .select('*')
                .eq('courseId', courseId);

            if (inviteData) {
                setData(prev => ({
                    ...prev,
                    invitations: inviteData.map((i: any) => ({
                        id: i.id,
                        user: { email: i.email, name: i.email.split('@')[0] },
                        status: i.status
                    }))
                }));
            }

            setIsLoading(false);
        };

        fetchData();

        // Real-time for both
        const enrollChannel = supabase.channel(`attendees-${courseId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Enrollment', filter: `courseId=eq.${courseId}` }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'CourseInvitation', filter: `courseId=eq.${courseId}` }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(enrollChannel);
        };
    }, [isOpen, courseId]);

    const handleInvite = async () => {
        if (!email) return;
        try {
            setIsInviting(true);
            const { error } = await supabase
                .from('CourseInvitation')
                .insert({
                    courseId,
                    email,
                    status: 'PENDING',
                    invitedBy: 'ADMIN', // Placeholder or use current user ID
                    createdAt: new Date().toISOString()
                });

            if (error) throw error;
            toast({ title: "Success", description: `Invitation sent to ${email}` });
            setEmail("");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to invite user",
                variant: "destructive"
            });
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Course Attendees</DialogTitle>
                    <DialogDescription>
                        View and manage learners enrolled in this course or invite new ones.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 my-4">
                    <Input
                        placeholder="Invite by email..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button onClick={handleInvite} disabled={isInviting} className="gap-2">
                        <UserPlus className="h-4 w-4" /> {isInviting ? "Inviting..." : "Invite"}
                    </Button>
                </div>

                <Tabs defaultValue="enrolled" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="bg-muted/50 w-full justify-start rounded-none border-b border-border">
                        <TabsTrigger value="enrolled">Enrolled Users ({data.enrollments.length})</TabsTrigger>
                        <TabsTrigger value="invited">Invited ({data.invitations.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="enrolled" className="flex-1 overflow-y-auto pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Learner</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.enrollments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            No learners enrolled yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.enrollments.map((enrollment) => (
                                        <TableRow key={enrollment.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <img src={enrollment.user.avatar || "https://ui-avatars.com/api/?name=" + enrollment.user.name} className="h-8 w-8 rounded-full" />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">{enrollment.user.name}</span>
                                                        <span className="text-xs text-muted-foreground">{enrollment.user.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                                                        <div className="bg-primary h-full" style={{ width: `${enrollment.progress}%` }} />
                                                    </div>
                                                    <span className="text-xs">{enrollment.progress}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon"><Mail className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TabsContent>

                    <TabsContent value="invited" className="flex-1 overflow-y-auto pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.invitations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                            No pending invitations.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.invitations.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{inv.user.name}</span>
                                                    <span className="text-xs text-muted-foreground">{inv.user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={inv.status === 'ACCEPTED' ? 'default' : 'outline'}>
                                                    {inv.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default AttendeeModal;
