import { Navigate } from 'react-router-dom';
import { LoadingOverlay, Container } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';

console.log('ProtectedRoute component loaded');

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  console.log('ProtectedRoute rendering');
  const { currentUser, loading } = useAuth();

  if (loading) {
    console.log('Auth loading, showing loading overlay');
    return (
      <Container>
        <LoadingOverlay visible={true} />
      </Container>
    );
  }

  if (!currentUser) {
    console.log('No user found, redirecting to home');
    return <Navigate to="/" />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    console.log('User role not allowed, redirecting to dashboard');
    return <Navigate to="/dashboard" />;
  }

  console.log('User authenticated, rendering protected content');
  return <>{children}</>;
} 