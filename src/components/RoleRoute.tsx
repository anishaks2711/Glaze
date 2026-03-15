import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  role: 'freelancer' | 'client';
  children: React.ReactNode;
}

export function RoleRoute({ role, children }: Props) {
  const { profile, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  // Only redirect when profile is loaded and role doesn't match
  if (profile && profile.role !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}
