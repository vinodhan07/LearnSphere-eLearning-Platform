import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
    Mail,
    Search,
    UserPlus,
    CheckCircle,
    Clock,
    MoreHorizontal,
    Trash2,
    RotateCcw,
    Award,
    Filter,
    ArrowUpDown,
    Download,
    Lock,
    Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import BulkInviteModal from "./BulkInviteModal";
import { formatDistanceToNow } from "date-fns";

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
    completed: boolean;
    lastAccessed: string; // ISO date
    performance: number; // Avg score
    startedAt: string;
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
    const [isLoading, setIsLoading] = useState(false);

    // Filtering & Sorting
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof Enrollment | 'user.name', direction: 'asc' | 'desc' } | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in-progress'>('all');

    // Bulk Interactions
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    // Modals
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        fetchData();
        setSelectedIds(new Set());
    }, [isOpen, courseId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
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
                        completed: e.completed || false,
                        lastAccessed: e.lastAccessedAt || e.updatedAt,
                        performance: e.averageQuizScore || 0,
                        startedAt: e.createdAt,
                        user: {
                            id: e.userId,
                            name: e.user?.name || "Unknown",
                            email: e.user?.email || "No Email",
                            avatar: e.user?.avatar
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
        } catch (error) {
            console.error("Fetch data failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (key: keyof Enrollment | 'user.name') => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredEnrollments = useMemo(() => {
        let filtered = [...data.enrollments];

        // 1. Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.user.name.toLowerCase().includes(lowerQ) ||
                e.user.email.toLowerCase().includes(lowerQ)
            );
        }

        // 2. Filter Status
        if (filterStatus === 'completed') {
            filtered = filtered.filter(e => e.completed);
        } else if (filterStatus === 'in-progress') {
            filtered = filtered.filter(e => !e.completed);
        }

        // 3. Sort
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: any = sortConfig.key === 'user.name' ? a.user.name : a[sortConfig.key as keyof Enrollment];
                let bValue: any = sortConfig.key === 'user.name' ? b.user.name : b[sortConfig.key as keyof Enrollment];

                if (typeof aValue === 'string') aValue = aValue.toLowerCase();
                if (typeof bValue === 'string') bValue = bValue.toLowerCase();

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [data.enrollments, searchQuery, sortConfig, filterStatus]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredEnrollments.map(e => e.user.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (userId: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) newSet.add(userId);
        else newSet.delete(userId);
        setSelectedIds(newSet);
    };

    const handleBulkAction = async (action: 'unenroll' | 'reset_progress') => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to ${action.replace('_', ' ')} for ${selectedIds.size} users?`)) return;

        try {
            setIsProcessing(true);
            await api.post(`/courses/${courseId}/bulk-action`, {
                action,
                userIds: Array.from(selectedIds)
            });
            toast({ title: "Success", description: "Bulk action completed successfully." });
            fetchData();
            setSelectedIds(new Set());
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Action failed", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl">
                <div className="p-6 border-b border-border">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center justify-between">
                            <span>Learner Management</span>
                            <Badge variant="outline" className="text-sm font-normal py-1">
                                {data.enrollments.length} Active • {data.invitations.length} Pending
                            </Badge>
                        </DialogTitle>
                        <DialogDescription>
                            Track progress, manage enrollments, and certify learners.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or email..."
                                    className="pl-9 h-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-10 w-10">
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                                        {filterStatus === 'all' && <CheckCircle className="h-3.5 w-3.5 mr-2 text-primary" />} All Learners
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterStatus('completed')}>
                                        {filterStatus === 'completed' && <CheckCircle className="h-3.5 w-3.5 mr-2 text-primary" />} Completed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterStatus('in-progress')}>
                                        {filterStatus === 'in-progress' && <CheckCircle className="h-3.5 w-3.5 mr-2 text-primary" />} In Progress
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            {selectedIds.size > 0 ? (
                                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-lg animate-in fade-in slide-in-from-right-5">
                                    <span className="text-sm font-bold text-primary whitespace-nowrap">{selectedIds.size} selected</span>
                                    <div className="h-4 w-px bg-primary/20 mx-1" />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleBulkAction('unenroll')}
                                        disabled={isProcessing}
                                    >
                                        Unenroll
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-orange-600 hover:text-orange-700 hover:bg-orange-500/10"
                                        onClick={() => handleBulkAction('reset_progress')}
                                        disabled={isProcessing}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                                    <UserPlus className="h-4 w-4" /> Invite New Users
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-0">
                    <Tabs defaultValue="enrolled" className="h-full flex flex-col">
                        <div className="px-6 pt-4">
                            <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 gap-6">
                                <TabsTrigger
                                    value="enrolled"
                                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 py-2 font-bold text-muted-foreground data-[state=active]:text-foreground"
                                >
                                    Enrolled Users
                                </TabsTrigger>
                                <TabsTrigger
                                    value="invited"
                                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 py-2 font-bold text-muted-foreground data-[state=active]:text-foreground"
                                >
                                    Pending Invitations
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="enrolled" className="flex-1 p-0 m-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b border-border/60">
                                        <TableHead className="w-[50px] pl-6">
                                            <Checkbox
                                                checked={selectedIds.size === filteredEnrollments.length && filteredEnrollments.length > 0}
                                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                            />
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('user.name')}>
                                            <div className="flex items-center gap-1">Learner <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('progress')}>
                                            <div className="flex items-center gap-1">Progress <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('performance')}>
                                            <div className="flex items-center gap-1">Score <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('lastAccessed')}>
                                            <div className="flex items-center gap-1">Last Active <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                        </TableHead>
                                        <TableHead>Certificate</TableHead>
                                        <TableHead className="text-right pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center">
                                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                    <div className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
                                                    Loading data...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredEnrollments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                                No learners found matching your criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEnrollments.map((enrollment) => (
                                            <TableRow key={enrollment.user.id} className="group hover:bg-muted/40 transition-colors border-border/40">
                                                <TableCell className="pl-6">
                                                    <Checkbox
                                                        checked={selectedIds.has(enrollment.user.id)}
                                                        onCheckedChange={(checked) => handleSelectOne(enrollment.user.id, checked as boolean)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <img src={enrollment.user.avatar || `https://ui-avatars.com/api/?name=${enrollment.user.name}&background=random`} className="h-9 w-9 rounded-full border border-border" />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm text-foreground">{enrollment.user.name}</span>
                                                            <span className="text-xs text-muted-foreground">{enrollment.user.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1.5 w-[140px]">
                                                        <div className="flex justify-between text-xs font-medium">
                                                            <span className={enrollment.progress === 100 ? "text-emerald-600" : "text-muted-foreground"}>{enrollment.progress}%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${enrollment.progress === 100 ? "bg-emerald-500" : "bg-primary"}`}
                                                                style={{ width: `${enrollment.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {enrollment.performance > 0 ? (
                                                        <Badge variant="outline" className={`font-mono font-bold ${enrollment.performance >= 80 ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" : "text-muted-foreground"}`}>
                                                            {enrollment.performance}%
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">--</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {enrollment.lastAccessed ? formatDistanceToNow(new Date(enrollment.lastAccessed), { addSuffix: true }) : "Never"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {enrollment.completed ? (
                                                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 cursor-pointer hover:shadow-md transition-shadow gap-1">
                                                            <Award className="h-3 w-3" /> Ready
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground opacity-50 flex items-center gap-1">
                                                            <Lock className="h-3 w-3" /> Locked
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background">
                                                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => window.open(`mailto:${enrollment.user.email}`)}>
                                                                <Mail className="h-4 w-4 mr-2" /> Send Email
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-orange-600" onClick={() => {
                                                                setSelectedIds(new Set([enrollment.user.id]));
                                                                handleBulkAction('reset_progress');
                                                            }}>
                                                                <RotateCcw className="h-4 w-4 mr-2" /> Reset Progress
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" onClick={() => {
                                                                setSelectedIds(new Set([enrollment.user.id]));
                                                                handleBulkAction('unenroll');
                                                            }}>
                                                                <Trash2 className="h-4 w-4 mr-2" /> Unenroll User
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="invited" className="flex-1 p-0 m-0">
                            {/* Simple list or table for invited users */}
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-border/60">
                                        <TableHead className="pl-6">Invited User</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.invitations.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="pl-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-foreground">{inv.user.name || "Unknown"}</span>
                                                    <span className="text-xs text-muted-foreground">{inv.user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={inv.status === 'ACCEPTED' ? 'default' : 'outline'}>
                                                    {inv.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button variant="ghost" size="sm" className="h-8 text-xs">Resend</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {data.invitations.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground h-32">
                                                No pending invitations.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>

            <BulkInviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                courseId={courseId}
                onSuccess={() => {
                    fetchData();
                    setIsInviteModalOpen(false);
                }}
            />
        </Dialog >
    );
};

export default AttendeeModal;
