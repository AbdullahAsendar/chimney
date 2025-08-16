import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ScreenLoader } from '@/components/common/screen-loader';
import { useAuth } from './context/auth-context';
import { AuthAdapter } from '@/auth/adapters/supabase-adapter';

/**
 * Component to protect routes that require authentication.
 * If user is not authenticated, redirects to the login page.
 */
export const RequireAuth = () => {
  const { auth, loading: globalLoading, isInitialized } = useAuth();
  const location = useLocation();



  // Show screen loader while authentication is initializing
  if (globalLoading || !isInitialized) {
    return <ScreenLoader />;
  }

  // If authenticated (has access token), render child routes
  if (auth?.access_token) {
    // If we're on the signin page but authenticated, redirect to home
    if (location.pathname.includes('/auth/signin')) {
      return <Navigate to="/" replace />;
    }
    
    return <Outlet />;
  }

  // If not authenticated, redirect to classic login
  return (
    <Navigate
      to={`/auth/signin?next=${encodeURIComponent(location.pathname)}`}
      replace
    />
  );
};
