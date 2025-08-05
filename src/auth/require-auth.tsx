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

  console.log('RequireAuth: Checking authentication state', {
    hasAuth: !!auth,
    hasAccessToken: !!auth?.access_token,
    loading: globalLoading,
    isInitialized,
    currentPath: location.pathname
  });

  // Show screen loader while authentication is initializing
  if (globalLoading || !isInitialized) {
    console.log('RequireAuth: Showing loader while authentication initializes');
    return <ScreenLoader />;
  }

  // If authenticated (has access token), render child routes
  if (auth?.access_token) {
    console.log('RequireAuth: User authenticated, rendering protected routes');
    
    // If we're on the signin page but authenticated, redirect to home
    if (location.pathname.includes('/auth/signin')) {
      console.log('RequireAuth: User authenticated but on signin page, redirecting to home');
      return <Navigate to="/" replace />;
    }
    
    return <Outlet />;
  }

  // If not authenticated, redirect to classic login
  console.log('RequireAuth: User not authenticated, redirecting to login');
  return (
    <Navigate
      to={`/auth/signin?next=${encodeURIComponent(location.pathname)}`}
      replace
    />
  );
};
