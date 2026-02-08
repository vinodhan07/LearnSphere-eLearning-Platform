import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
    BookOpen,
    BarChart3,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    User,
    ChevronDown,
    Menu,
    X,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const AdminLayout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const dashboardPath = "/admin";
    const navItems = [
        { label: "Dashboard", path: dashboardPath, icon: LayoutDashboard },
        { label: "Reports", path: "/admin/reports", icon: BarChart3 },
        { label: "My Courses", path: "/my-courses", icon: GraduationCap },
    ];

    const getInitials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top Navbar */}
            <nav className="sticky top-0 z-50 border-b border-border bg-background backdrop-blur-xl">
                <div className="container flex h-16 items-center justify-between relative">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
                                <GraduationCap className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <span className="font-heading text-xl font-bold text-foreground">
                                Learn<span className="text-accent">Sphere</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Nav Links - Centered */}
                    <div className="hidden md:flex items-center gap-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
                            return (
                                <Link key={item.path} to={item.path}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`gap-2 font-medium rounded-full px-4 transition-all duration-200 ${isActive ? "bg-orange-100 text-orange-600 hover:bg-orange-200 hover:text-orange-700" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <Link to={dashboardPath}>
                            <Button variant="outline" size="sm" className="gap-2 border-border text-muted-foreground hover:text-foreground">
                                <LayoutDashboard className="h-4 w-4" />
                                {user?.role === "ADMIN" ? "Admin" : "Instructor"} Dashboard
                            </Button>
                        </Link>

                        <div className="h-6 w-[1px] bg-border mx-1" />

                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="gap-2 px-2 hover:bg-muted/50">
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={user.avatar || undefined} alt={user.name} />
                                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-col items-start leading-none text-left hidden lg:flex">
                                            <span className="text-sm font-bold truncate max-w-[120px]">{user.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{user.role}</span>
                                        </div>
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 mt-2">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1 p-1">
                                            <p className="text-sm font-bold">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate italic">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                                        <User className="h-4 w-4 mr-2" />
                                        Instructor Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="md:hidden p-2 rounded-md hover:bg-muted"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Mobile Nav */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden border-t border-border bg-card overflow-hidden"
                        >
                            <div className="container py-4 flex flex-col gap-2">
                                {navItems.map((item) => (
                                    <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
                                        <Button variant="ghost" className="w-full justify-start gap-2 h-11">
                                            <item.icon className="h-4 w-4" />
                                            {item.label}
                                        </Button>
                                    </Link>
                                ))}
                                <div className="border-t border-border pt-4 mt-2 flex flex-col gap-3">
                                    <Link to="/" onClick={() => setMobileOpen(false)}>
                                        <Button variant="outline" className="w-full gap-2">
                                            <Eye className="h-4 w-4" />
                                            Learner View
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="destructive"
                                        className="w-full gap-2 h-11"
                                        onClick={() => {
                                            logout();
                                            setMobileOpen(false);
                                        }}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 bg-muted/5">
                <div className="container py-8 px-4 sm:px-6 lg:px-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
