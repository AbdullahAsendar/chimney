import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface UserInfo {
  username: string;
  email: string;
}

interface AuthState {
  refreshToken: string | null;
  accessToken: string | null;
  accountId: string | null;
  user: UserInfo | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  accountIdStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: AuthState = {
  refreshToken: localStorage.getItem('refreshToken'),
  accessToken: null, // Don't load from localStorage
  accountId: null, // Don't load from localStorage
  user: null,
  status: 'idle',
  error: null,
  accountIdStatus: 'idle',
};

// 1. Call refresh token API to get access token
export const fetchAccessToken = createAsyncThunk(
  'auth/fetchAccessToken',
  async ({ refreshToken, apiBaseUrl }: { refreshToken: string; apiBaseUrl: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/authentication-service/api/v1/auth/sdd/refresh`,
        { refToken: refreshToken },
        { headers: { 'Content-Type': 'application/json', accept: '*/*' } }
      );
      if (!response.data || !response.data.result || !response.data.result.token) {
        localStorage.removeItem('refreshToken');
        return rejectWithValue('invalid_token');
      }
      // Don't store accessToken in localStorage
      return { accessToken: response.data.result.token, refreshToken };
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        return rejectWithValue('unauthorized');
      }
      return rejectWithValue(err.response?.data?.message || 'Failed to authenticate');
    }
  }
);

// 2. Use access token to get super admin account id
export const fetchAccountId = createAsyncThunk(
  'auth/fetchAccountId',
  async ({ accessToken, apiBaseUrl }: { accessToken: string; apiBaseUrl: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${apiBaseUrl}/authentication-service/api/v1/auth/account/admin/super`,
        {
          headers: {
            'accept': '*/*',
            'sdd-token': accessToken,
          },
        }
      );
      if (!response.data || !response.data.result || !response.data.result.id) {
        return rejectWithValue('invalid_token');
      }
      // Don't store accountId in localStorage
      return { accountId: response.data.result.id };
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        return rejectWithValue('unauthorized');
      }
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch account id');
    }
  }
);

export const fetchUserInfo = createAsyncThunk(
  'auth/fetchUserInfo',
  async ({ accessToken, apiBaseUrl }: { accessToken: string; apiBaseUrl: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${apiBaseUrl}/authentication-service/api/v1/auth`,
        { headers: { 'accept': '*/*', 'sdd-token': accessToken } }
      );
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user info');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRefreshToken(state, action: PayloadAction<string>) {
      state.refreshToken = action.payload;
      localStorage.setItem('refreshToken', action.payload);
    },
    logout(state) {
      state.refreshToken = null;
      state.accessToken = null;
      state.accountId = null;
      state.user = null;
      localStorage.removeItem('refreshToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccessToken.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAccessToken.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('refreshToken', action.payload.refreshToken);
        state.error = null;
      })
      .addCase(fetchAccessToken.rejected, (state, action) => {
        state.status = 'failed';
        state.accountId = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAccountId.pending, (state) => {
        state.accountIdStatus = 'loading';
      })
      .addCase(fetchAccountId.fulfilled, (state, action) => {
        state.accountId = action.payload.accountId;
        state.accountIdStatus = 'succeeded';
      })
      .addCase(fetchAccountId.rejected, (state, action) => {
        state.accountId = null;
        state.accountIdStatus = 'failed';
        state.error = action.payload as string;
      })
      .addCase(fetchUserInfo.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = { username: action.payload.result.name, email: action.payload.result.email };
        state.error = null;
      })
      .addCase(fetchUserInfo.rejected, (state, action) => {
        state.status = 'failed';
        state.user = null;
        state.error = action.payload as string;
      });
  },
});

export const { setRefreshToken, logout } = authSlice.actions;
export default authSlice.reducer; 