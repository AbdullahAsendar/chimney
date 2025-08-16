import { AuthAdapter } from '@/auth/adapters/supabase-adapter';
import { PropsWithChildren, useEffect, useState, useRef } from 'react';
import { AuthContext } from '@/auth/context/auth-context';
import * as authHelper from '@/auth/lib/helpers';
import { AuthModel, UserModel } from '@/auth/lib/models';
import axios from 'axios';

// Cache for user data to avoid multiple API calls
const USER_CACHE_KEY = 'chimney-user-cache';
const USER_CACHE_TIMESTAMP_KEY = 'chimney-user-cache-timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getUserFromCache(): UserModel | null {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    const timestamp = localStorage.getItem(USER_CACHE_TIMESTAMP_KEY);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Error reading user cache:', error);
  }
  return null;
}

function setUserCache(user: UserModel): void {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    localStorage.setItem(USER_CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error setting user cache:', error);
  }
}

function clearUserCache(): void {
  try {
    localStorage.removeItem(USER_CACHE_KEY);
    localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error clearing user cache:', error);
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<AuthModel | undefined>();
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const isInitializing = useRef(false);

  useEffect(() => {
    setIsAdmin(currentUser?.is_admin === true);
  }, [currentUser]);

  // Initialize authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;
      

      
      try {
        // Always try to use refresh token on app load
        const refreshToken = AuthAdapter.getCachedRefreshToken();
        
        if (refreshToken) {
          
          try {
            // Use refresh token to get fresh auth token and user data
            const { auth: newAuth, user: newUser } = await AuthAdapter.loginWithRefreshToken(refreshToken);
            

            
            // Set auth and user data
            saveAuth(newAuth);
            setCurrentUser(newUser);
            setUserCache(newUser);
            
            // Small delay to ensure state is properly set
            await new Promise(resolve => setTimeout(resolve, 50));
            
          } catch (refreshError) {
            
            // Clear everything on refresh failure
            AuthAdapter.logout();
            authHelper.removeAuth();
            setAuth(undefined);
            setCurrentUser(undefined);
            clearUserCache();
          }
        } else {
          
          // No refresh token, clear any cached data
          AuthAdapter.logout();
          authHelper.removeAuth();
          setAuth(undefined);
          setCurrentUser(undefined);
          clearUserCache();
        }
      } catch (error) {
        
        // Clear everything on any error
        AuthAdapter.logout();
        authHelper.removeAuth();
        setAuth(undefined);
        setCurrentUser(undefined);
        clearUserCache();
      } finally {
        setLoading(false);
        setIsInitialized(true);
        isInitializing.current = false;
      }
    };

    initializeAuth();
  }, []); // Only run once on mount

  const verify = async () => {
    // This function is kept for compatibility but should not be used
    // The new flow always uses refresh token on app load
  };

  const saveAuth = (auth: AuthModel | undefined) => {
    setAuth(auth);
    if (auth) {
      authHelper.setAuth(auth);
    } else {
      authHelper.removeAuth();
    }
  };

  const login = async (refreshToken: string) => {
    try {
      const { auth, user } = await AuthAdapter.loginWithRefreshToken(refreshToken);
      saveAuth(auth);
      // Set user data directly from the adapter response (no duplicate API call)
      setCurrentUser(user);
      setUserCache(user);
    } catch (error) {
      saveAuth(undefined);
      setCurrentUser(undefined);
      clearUserCache();
      throw error;
    }
  };



  const logout = () => {
    AuthAdapter.logout();
    saveAuth(undefined);
    setCurrentUser(undefined);
    clearUserCache();
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        setLoading,
        auth,
        saveAuth,
        user: currentUser,
        setUser: setCurrentUser,
        login,
        // The following are now no-ops or not implemented:
        register: async () => {},
        requestPasswordReset: async () => {},
        resetPassword: async () => {},
        resendVerificationEmail: async () => {},
        getUser: async () => null,
        updateProfile: async () => ({} as UserModel),
        logout,
        verify,
        isAdmin,
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
