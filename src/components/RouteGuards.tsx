import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function FullScreenSpinner() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading SnapNResolve...</p>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenSpinner />;
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenSpinner />;
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/feed" replace />;
  }
  return <>{children}</>;
}

export function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenSpinner />;
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/feed'} replace />;
  }
  return <>{children}</>;
}
