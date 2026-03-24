import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  // If logged in but no profile yet, send to onboarding instead of home.
  if (user) return <Navigate to={profile ? '/' : '/onboard'} replace />;

  return <>{children}</>;
}
