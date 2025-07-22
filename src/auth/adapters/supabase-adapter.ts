import axios from 'axios';
import { AuthModel, UserModel } from '@/auth/lib/models';

// Helper to select API base URL
function getApiBaseUrl() {
  if (
    (typeof window !== 'undefined' && (window as any).USE_PROD_API) ||
    (typeof window !== 'undefined' && localStorage.getItem('useProdApi') === 'true')
  ) {
    return import.meta.env.VITE_API_BASE_URL_PROD || 'https://api-aqari.ds.sharjah.ae';
  }
  return import.meta.env.VITE_API_BASE_URL || 'https://stg-api-aqari.ds.sharjah.ae';
}

const REFRESH_TOKEN_KEY = 'chimney-refresh-token';
const USER_ID_KEY = 'chimney-user-id';

export const AuthAdapter = {
  async loginWithRefreshToken(refreshToken: string): Promise<{ auth: AuthModel; user: UserModel }> {
    const API_BASE_URL = getApiBaseUrl();
    // 1. Call refresh API to get access token
    const refreshResponse = await axios.post(
      `${API_BASE_URL}/authentication-service/api/v1/auth/sdd/refresh`,
      { refToken: refreshToken },
      { headers: { 'Content-Type': 'application/json', accept: '*/*' } }
    );
    const accessToken = refreshResponse.data?.result?.token;
    if (!accessToken) {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      throw new Error('Invalid refresh token');
    }
    // 2. Call /super API to get user details
    const superResponse = await axios.get(
      `${API_BASE_URL}/authentication-service/api/v1/auth/account/admin/super`,
      { headers: { accept: '*/*', 'sdd-token': accessToken } }
    );
    const user = superResponse.data?.result;
    if (!user?.id) {
      const error = new Error('No account found for this refresh token.');
      (error as any).code = 'NO_ACCOUNT';
      throw error;
    }
    // Cache refresh token and user id
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_ID_KEY, user.id);
    
    const auth = { access_token: accessToken, refresh_token: refreshToken };
    return { auth, user };
  },

  getCachedRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getCachedUserId(): string | null {
    return localStorage.getItem(USER_ID_KEY);
  },

  logout(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  },
};
