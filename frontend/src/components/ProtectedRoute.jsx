import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import usePermissions from '../hooks/usePermissions';
import { getUser } from '../stores/authStore';

export const ProtectedRoute = ({ children, requiredRole, requiredFeature }) => {
  const { user: contextUser, company, loading } = useAuth();
  const location = useLocation();
  const user = contextUser || getUser();

  if (loading && !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (requiredRole && user.Role?.name !== requiredRole && user.Role?.name !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  // Feature check (SaaS Plan Gating)
  if (requiredFeature && company?.SubscriptionPlan) {
    const features = company.SubscriptionPlan.features || [];
    if (!features.includes(requiredFeature)) {
      // Redirect to upgrade screen instead of dashboard
      return <Navigate to="/upgrade" state={{ reason: `Feature ${requiredFeature} requires upgrade` }} replace />;
    }
  }

  return children;
};

export const WriteProtectedRoute = ({ children }) => {
  const { user: contextUser, company, loading } = useAuth();
  const location = useLocation();
  const { canCreate, canEdit } = usePermissions();
  const user = contextUser || getUser();

  if (loading && !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Prevent creation if canCreate is false
  if (location.pathname.includes('/new') && !canCreate) {
    return <Navigate to="/dashboard" replace />;
  }

  // Prevent editing if canEdit is false
  if (location.pathname.includes('/edit') && !canEdit) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const ReadProtectedRoute = ({ children }) => {
  const { user: contextUser, company, loading } = useAuth();
  const location = useLocation();
  const user = contextUser || getUser();

  if (loading && !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a user can login, they can read the dashboard/modules they navigate to.
  // The module filtering in App.jsx and backend APIs handles deeper read access.
  return children;
};
