import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, Menu, X, BarChart3, LayoutDashboard, LogIn, LogOut, User, ChevronDown } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, hasMinimumRole } = useAuth();
  const { toast } = useToast();
  const isAdmin = location.pathname.startsWith("/admin");

  const learnerLinks = [
    { to: "/courses", label: "Courses", icon: BookOpen },
    { to: "/my-courses", label: "My Courses", icon: GraduationCap, requiresAuth: true },
  ];

  const adminLinks = [
    { to: "/instructor-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/reports", label: "Reporting", icon: BarChart3 },
  ];

  const links = isAdmin ? adminLinks : learnerLinks;

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
      INSTRUCTOR: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      LEARNER: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    return colors[role] || colors.LEARNER;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between relative">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">
            Learn<span className="text-accent">Sphere</span>
          </span>
        </Link>

        {/* Desktop Nav - Centered */}
        <div className="hidden md:flex items-center gap-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {links.map((link) => {
            // Hide auth-required links if not authenticated
            if ('requiresAuth' in link && link.requiresAuth && !isAuthenticated) {
              return null;
            }
            const isActive = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 font-medium rounded-full px-4 transition-all duration-200 ${isActive ? "bg-orange-100 text-orange-600 hover:bg-orange-200 hover:text-orange-700" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {/* Show Instructor Panel for INSTRUCTOR+ */}
          {!isAdmin && isAuthenticated && hasMinimumRole("INSTRUCTOR") && (
            <Link to="/instructor-dashboard">
              <Button variant="outline" size="sm" className="gap-2 border-border text-muted-foreground hover:text-foreground">
                <LayoutDashboard className="h-4 w-4" />
                Instructor Panel
              </Button>
            </Link>
          )}

          {/* Admin can also access admin panel */}
          {!isAdmin && isAuthenticated && hasMinimumRole("ADMIN") && !hasMinimumRole("INSTRUCTOR") && (
            <Link to="/admin">
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Instructor Panel
              </Button>
            </Link>
          )}

          {isAdmin && (
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Learner View
              </Button>
            </Link>
          )}

          {/* Auth Buttons / User Menu */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[100px] truncate hidden lg:block">{user.name}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border w-fit ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/learner-dashboard")}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Learner Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-courses")}>
                  <GraduationCap className="h-4 w-4 mr-2" />
                  My Courses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button size="sm" className="bg-gradient-hero hover:opacity-90 text-primary-foreground font-semibold gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
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
              {links.map((link) => {
                if ('requiresAuth' in link && link.requiresAuth && !isAuthenticated) {
                  return null;
                }
                return (
                  <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
              <div className="border-t border-border pt-2 mt-2 flex flex-col gap-2">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-4 py-2 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || undefined} alt={user.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                    {hasMinimumRole("INSTRUCTOR") && !isAdmin && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)}>
                        <Button variant="outline" className="w-full gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          Instructor Panel
                        </Button>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/" onClick={() => setMobileOpen(false)}>
                        <Button variant="outline" className="w-full gap-2">
                          <BookOpen className="h-4 w-4" />
                          Learner View
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full bg-gradient-hero text-primary-foreground font-semibold gap-2">
                        <LogIn className="h-4 w-4" />
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Create Account
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
