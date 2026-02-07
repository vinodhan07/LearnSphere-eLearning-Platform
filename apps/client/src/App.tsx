import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, GuestRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import CourseCatalog from "./pages/CourseCatalog";
import CourseDetail from "./pages/CourseDetail";
import MyCourses from "./pages/MyCourses";
import LessonPlayer from "./pages/LessonPlayer";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReporting from "./pages/admin/AdminReporting";
import CourseEditor from "./pages/admin/CourseEditor";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Profile from "./pages/Profile";

import AdminLayout from "./components/layout/AdminLayout";
import QuizPlayer from "@/components/admin/QuizPlayer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/courses" element={<CourseCatalog />} />
            <Route path="/courses/:id" element={<CourseDetail />} />

            {/* Auth routes (guest only) */}
            <Route path="/login" element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            } />
            <Route path="/register" element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            } />

            {/* Learner routes (any authenticated user) */}
            <Route path="/my-courses" element={
              <ProtectedRoute minRole="LEARNER">
                <MyCourses />
              </ProtectedRoute>
            } />
            <Route path="/lesson/:courseId" element={
              <ProtectedRoute minRole="LEARNER">
                <LessonPlayer />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute minRole="LEARNER">
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/learner-dashboard" element={
              <ProtectedRoute minRole="LEARNER">
                <Profile />
              </ProtectedRoute>
            } />

            {/* Admin/Instructor routes wrapped in AdminLayout */}
            <Route element={
              <ProtectedRoute minRole="INSTRUCTOR">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/instructor-dashboard" element={<AdminDashboard />} />
              <Route path="/admin/course/:id" element={<CourseEditor />} />
              <Route path="/admin/quiz/:courseId" element={<QuizPlayer />} />
              <Route path="/admin/reports" element={<AdminReporting />} />
              {/* Legacy/Redirects if needed, but keeping clean for now */}
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
