import { Navigate } from 'react-router-dom';
import { LoadingOverlay, Container } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';



interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {

  const { currentUser, loading } = useAuth();

  if (loading) {

    return (
      <Container>
        <LoadingOverlay visible={true} />
      </Container>
    );
  }

  if (!currentUser) {

    return <Navigate to="/" />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {

    return <Navigate to="/dashboard" />;
  }


  return <>{children}</>;
} 