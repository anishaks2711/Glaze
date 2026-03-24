import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  role: 'freelancer' | 'client';
  children: React.ReactNode;
}

export function RoleRoute({ role, children }: Props) {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  // Use profile role if available, fall back to user_metadata role (set at signup before profile exists)
  const userRole = profile?.role ?? (user?.user_metadata?.role as string | undefined);
  if (userRole && userRole !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}
