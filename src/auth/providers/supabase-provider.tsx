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
  const [auth, setAuth] = useState<AuthModel | undefined>(authHelper.getAuth());
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const fetchingUser = useRef(false);
  const lastUseEffectCall = useRef(0);

  useEffect(() => {
    setIsAdmin(currentUser?.is_admin === true);
  }, [currentUser]);

  const fetchUserProfile = async (accessToken: string): Promise<UserModel | null> => {
    if (fetchingUser.current) {
      // Already fetching, wait for it to complete
      return new Promise((resolve) => {
        const checkComplete = () => {
          if (!fetchingUser.current) {
            resolve(currentUser || null);
          } else {
            setTimeout(checkComplete, 100);
          }
        };
        checkComplete();
      });
    }

    fetchingUser.current = true;
    
    try {
      // Check cache first
      const cachedUser = getUserFromCache();
      if (cachedUser) {
        setCurrentUser(cachedUser);
        fetchingUser.current = false;
        return cachedUser;
      }

      // Fetch from API
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://stg-api-aqari.ds.sharjah.ae';
      const superResponse = await axios.get(
        `${API_BASE_URL}/authentication-service/api/v1/auth/account/admin/super`,
        { headers: { accept: '*/*', 'sdd-token': accessToken } }
      );
      
      const user = superResponse.data?.result;
      if (user) {
        setCurrentUser(user);
        setUserCache(user);
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    } finally {
      fetchingUser.current = false;
    }
  };

  const verify = async () => {
    try {
      // Check if we have cached auth data
      const cachedAuth = authHelper.getAuth();
      if (cachedAuth?.access_token) {
        setAuth(cachedAuth);
        // Try to fetch user profile to verify token is still valid
        const user = await fetchUserProfile(cachedAuth.access_token);
        if (!user) {
          // Token might be expired, try to refresh using refresh token
          const refreshToken = AuthAdapter.getCachedRefreshToken();
          if (refreshToken) {
            try {
              const { auth: newAuth, user: newUser } = await AuthAdapter.loginWithRefreshToken(refreshToken);
              saveAuth(newAuth);
              setCurrentUser(newUser);
              setUserCache(newUser);
              return; // Successfully refreshed, exit early
            } catch (refreshError) {
              // Refresh failed, clear everything
              console.error('Failed to refresh token:', refreshError);
              AuthAdapter.logout();
              authHelper.removeAuth();
              setAuth(undefined);
              setCurrentUser(undefined);
              clearUserCache();
            }
          } else {
            // No refresh token, clear auth
            authHelper.removeAuth();
            setAuth(undefined);
            setCurrentUser(undefined);
            clearUserCache();
          }
        }
      } else {
        // No cached auth, try to use refresh token
        const refreshToken = AuthAdapter.getCachedRefreshToken();
        if (refreshToken) {
          try {
            const { auth: newAuth, user: newUser } = await AuthAdapter.loginWithRefreshToken(refreshToken);
            saveAuth(newAuth);
            setCurrentUser(newUser);
            setUserCache(newUser);
            return; // Successfully authenticated, exit early
          } catch (refreshError) {
            // Refresh failed, clear everything
            console.error('Failed to refresh token:', refreshError);
            AuthAdapter.logout();
            authHelper.removeAuth();
            setAuth(undefined);
            setCurrentUser(undefined);
            clearUserCache();
          }
        }
      }
    } catch (error) {
      // Clear auth on any error
      console.error('Auth verification error:', error);
      AuthAdapter.logout();
      authHelper.removeAuth();
      setAuth(undefined);
      setCurrentUser(undefined);
      clearUserCache();
    } finally {
      setLoading(false);
    }
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

  // On mount, if authenticated, fetch user profile from /super
  useEffect(() => {
    // Prevent multiple simultaneous calls
    if (fetchingUser.current) {
      console.log('AuthProvider: Skipping useEffect - already fetching user');
      return;
    }

    // Add cooldown to prevent rapid successive calls
    const now = Date.now();
    if (now - lastUseEffectCall.current < 1000) { // 1 second cooldown
      console.log('AuthProvider: Skipping useEffect - cooldown active');
      return;
    }
    lastUseEffectCall.current = now;

    const fetchUser = async () => {
      console.log('AuthProvider: useEffect triggered', { 
        hasToken: !!auth?.access_token, 
        hasUser: !!currentUser,
        loading 
      });
      
      if (auth?.access_token && !currentUser && !loading) {
        console.log('AuthProvider: Fetching user profile...');
        await fetchUserProfile(auth.access_token);
      } else if (!auth?.access_token) {
        console.log('AuthProvider: No token, clearing user');
        setCurrentUser(undefined);
        clearUserCache();
      } else {
        console.log('AuthProvider: Skipping fetch', { 
          hasToken: !!auth?.access_token, 
          hasUser: !!currentUser, 
          loading 
        });
      }
    };
    fetchUser();
    // Only run when auth token or currentUser changes, not on every auth object change
  }, [auth?.access_token, currentUser, loading]);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
