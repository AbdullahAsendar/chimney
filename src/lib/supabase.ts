// Dummy supabase client for development/testing without Supabase
// This object mocks the interface used by the rest of the app
export const supabase = {
    auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => ({
      data: { session: { access_token: 'dummy_access_token', refresh_token: 'dummy_refresh_token' } },
      error: null,
    }),
    signInWithOAuth: async () => ({ error: null }),
    signUp: async () => ({ data: { session: null }, error: null }),
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({ error: null }),
    resend: async () => ({ error: null }),
    getUser: async () => ({ data: { user: { id: 'dummy_id', email: 'dummy@example.com', email_confirmed_at: new Date().toISOString(), user_metadata: { username: 'dummy', first_name: 'Dummy', last_name: 'User', fullname: 'Dummy User', occupation: '', company_name: '', phone: '', roles: [], pic: '', language: 'en', is_admin: false } } }, error: null }),
    getSession: async () => ({ data: { session: { access_token: 'dummy_access_token', refresh_token: 'dummy_refresh_token' } }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (cb: any) => ({ subscription: { unsubscribe: () => {} } }),
  },
};
