import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import FreelancerProfile from "./pages/FreelancerProfile";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import FreelancerOnboard from "./pages/FreelancerOnboard";
import EditProfile from "./pages/EditProfile";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GuestRoute } from "./components/GuestRoute";
import { RoleRoute } from "./components/RoleRoute";
import { useAuth } from "./hooks/useAuth";
import { FloatingChat } from "./components/FloatingChat";

/**
 * Redirects a logged-in user with no profile to /onboard on any page load.
 * Skips redirect on auth pages and /onboard itself to avoid loops.
 */
function IncompleteProfileGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const { pathname } = useLocation();
  const skipPaths = ['/login', '/signup', '/onboard'];
  if (!loading && user && !profile && !skipPaths.includes(pathname) && user.user_metadata?.role === 'freelancer') {
    return <Navigate to="/onboard" replace />;
  }
  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <IncompleteProfileGuard>
            <Routes>
              <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
              <Route path="/onboard" element={<ProtectedRoute><RoleRoute role="freelancer"><FreelancerOnboard /></RoleRoute></ProtectedRoute>} />
              <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="/" element={<Index />} />
              <Route path="/profile/:id" element={<FreelancerProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingChat />
          </IncompleteProfileGuard>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
