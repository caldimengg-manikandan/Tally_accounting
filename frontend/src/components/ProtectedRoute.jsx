import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export const ProtectedRoute = ({ children, requiredRole, requiredFeature }) => {
  const { user, company, loading } = useAuth();
  const location = useLocation();

  if (loading) {
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
