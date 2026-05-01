import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);
