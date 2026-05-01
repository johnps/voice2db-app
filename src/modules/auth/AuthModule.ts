import type { SupabaseClient, Session } from '@supabase/supabase-js';

export interface AuthModule {
  signIn(phone: string): Promise<void>;
  verifyOTP(phone: string, token: string): Promise<void>;
  getSession(): Promise<Session | null>;
  signOut(): Promise<void>;
}

export function createAuthModule(supabase: SupabaseClient): AuthModule {
  return {
    async signIn(phone) {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw new Error(error.message);
    },

    async verifyOTP(phone, token) {
      const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) throw new Error(error.message);
    },

    async getSession() {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },

    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    },
  };
}
