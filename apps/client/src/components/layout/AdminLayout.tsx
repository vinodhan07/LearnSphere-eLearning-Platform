import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
    BookOpen,
    BarChart3,
    Menu,
    X,
    LogOut,
    User,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const AdminLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const { user, logout } = useAuth();

    const navItems = [
        { label: "Courses", path: "/courses", icon: BookOpen },
        { label: "Reports", path: "/reports", icon: BarChart3 },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar for Desktop */}
            <aside
                className={`fixed inset-y-0 left-0 bg-card border-r border-border transition-all duration-300 z-50 flex flex-col
          ${isSidebarOpen ? "w-64" : "w-20"}`}
            >
                <div className="p-6 flex items-center justify-between">
                    <Link to="/" className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isSidebarOpen ? "w-auto" : "w-0 opacity-0"}`}>
                        <div className="p-1.5 bg-orange-500 rounded-lg">
                            <span className="text-white font-bold text-xl">L</span>
                        </div>
                        <span className="font-heading font-bold text-xl tracking-tight text-foreground whitespace-nowrap">LearnSphere</span>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                                        ? "bg-orange-500/10 text-orange-500 shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                            >
                                <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-orange-500" : "text-muted-foreground"}`} />
                                <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 pointer-events-none"}`}>
                                    {item.label}
                                </span>
                                {isActive && isSidebarOpen && (
                                    <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border mt-auto h-32 flex flex-col justify-end">
                    {isSidebarOpen ? (
                        <div className="bg-muted/30 rounded-2xl p-3 flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold border border-orange-500/30">
                                {user?.name?.charAt(0) || <User className="h-5 w-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{user?.name || "Instructor"}</p>
                                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest">{user?.role || "ADMIN"}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="icon" onClick={logout} className="mx-auto text-muted-foreground hover:text-destructive mb-4">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 min-h-screen ${isSidebarOpen ? "ml-64" : "ml-20"}`}>
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
