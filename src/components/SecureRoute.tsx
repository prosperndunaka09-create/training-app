import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/SafeAuthProvider";
import { SecurityManager } from '../utils/security';

interface SecureRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAuth?: boolean;
  redirectTo?: string;
}

const SecureRoute: React.FC<SecureRouteProps> = ({
  children,
  requireAdmin = false,
  requireAuth = true,
  redirectTo = '/'
}) => {
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    // Check if user is authenticated
    if (requireAuth && !isAuthenticated) {
      navigate(redirectTo);
      return;
    }

    // Check if admin access is required
    if (requireAdmin && !isAdmin) {
      logout();
      navigate(redirectTo);
      return;
    }
  }, [user, isAdmin, isAuthenticated, requireAuth, requireAdmin, navigate, logout, redirectTo]);

  // Don't render children if checks fail
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default SecureRoute;
