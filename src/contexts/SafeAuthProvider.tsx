import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface SafeAuthUser {
  id: string;
  email: string;
  display_name?: string;
  account_type: string;
}

interface AuthState {
  user: SafeAuthUser | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: SafeAuthUser; isAdmin: boolean } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAdmin: false,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAdmin: action.payload.isAdmin,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAdmin: false,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAdmin: false,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export type SafeAuthLoginResult = {
  success: boolean;
  isAdmin?: boolean;
  error?: string;
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<SafeAuthLoginResult>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

async function hydrateUserFromProfile(authUser: SupabaseAuthUser): Promise<{
  user: SafeAuthUser;
  isAdmin: boolean;
}> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, account_type')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    console.error('SafeAuth: profile load error', error);
  }

  if (data) {
    return {
      user: {
        id: data.id,
        email: data.email,
        display_name: data.display_name ?? undefined,
        account_type: data.account_type ?? 'personal',
      },
      isAdmin: data.account_type === 'admin',
    };
  }

  return {
    user: {
      id: authUser.id,
      email: authUser.email ?? '',
      display_name: undefined,
      account_type: 'personal',
    },
    isAdmin: false,
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      void (async () => {
        if (cancelled) return;
        if (event === 'SIGNED_OUT') {
          dispatch({ type: 'LOGOUT' });
          return;
        }
        if (!session?.user) {
          return;
        }
        const hydrated = await hydrateUserFromProfile(session.user);
        if (!cancelled) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: hydrated });
        }
      })();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<SafeAuthLoginResult> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
        return { success: false, error: error.message };
      }

      if (!data.user) {
        const msg = 'Sign-in failed: no user returned';
        dispatch({ type: 'LOGIN_FAILURE', payload: msg });
        return { success: false, error: msg };
      }

      const hydrated = await hydrateUserFromProfile(data.user);
      dispatch({ type: 'LOGIN_SUCCESS', payload: hydrated });
      return { success: true, isAdmin: hydrated.isAdmin };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    void supabase.auth.signOut().catch((e) => console.error('SafeAuth signOut error', e));
    localStorage.removeItem('opt_user');
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  return (
    <AuthContext.Provider value={{ ...state, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};
