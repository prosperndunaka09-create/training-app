import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { SecurityManager, SecureSession, requireAdmin } from '../utils/security';

interface AuthState {
  user: any | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: any; isAdmin: boolean } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SESSION_EXPIRED' };

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
      return {
        ...state,
        isLoading: true,
        error: null,
      };
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
    case 'SESSION_EXPIRED':
      return {
        ...state,
        user: null,
        isAdmin: false,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  requireAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Secure login function
  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Validate inputs
      if (!email || !password || !email.includes('@')) {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid email or password' });
        return false;
      }

      // Check for admin credentials (hardcoded for now, move to backend later)
      if (email === 'admin@optimize.com' && password === 'admin123') {
        const adminUser = {
          id: 'admin-001',
          email: 'admin@optimize.com',
          display_name: 'Admin',
          account_type: 'admin',
          balance: 0,
          total_earned: 0,
          created_at: new Date().toISOString(),
        };

        // Validate admin user data
        if (!SecurityManager.validateUserData(adminUser)) {
          dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid admin account data' });
          return false;
        }

        // Create secure session
        SecurityManager.createSession(adminUser, true);
        
        // Store minimal data in localStorage (not sensitive)
        localStorage.setItem('opt_user', JSON.stringify(adminUser));
        
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user: adminUser, isAdmin: true } 
        });
        
        return true;
      }

      // Check for training account
      const trainingKey = `training_account_${email.toLowerCase()}`;
      const trainingData = localStorage.getItem(trainingKey);
      
      if (trainingData) {
        const trainingAcc = JSON.parse(trainingData);
        
        // Validate training account data
        if (!SecurityManager.validateUserData({
          ...trainingAcc,
          balance: trainingAcc.balance || 1100,
          total_earned: trainingAcc.total_earned || 0,
        })) {
          dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid training account data' });
          return false;
        }

        if (trainingAcc.password === password) {
          const trainingUser = {
            id: 'training-' + email.toLowerCase(),
            email: trainingAcc.email,
            display_name: trainingAcc.assignedTo || 'Training User',
            account_type: 'training',
            balance: trainingAcc.balance || 1100,
            total_earned: trainingAcc.total_earned || 0,
            training_completed: trainingAcc.training_completed || false,
            training_phase: trainingAcc.training_phase || 1,
            tasks_completed: trainingAcc.tasks_completed || 0,
            created_at: trainingAcc.createdAt || new Date().toISOString(),
          };

          // Create secure session
          SecurityManager.createSession(trainingUser, false);
          
          // Store in localStorage
          localStorage.setItem('opt_user', JSON.stringify(trainingUser));
          
          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { user: trainingUser, isAdmin: false } 
          });
          
          return true;
        }
      }

      // Check for personal account
      const personalKey = `opt_account_${email.toLowerCase()}`;
      const personalData = localStorage.getItem(personalKey);
      
      if (personalData) {
        const personalAcc = JSON.parse(personalData);
        
        // Validate personal account data
        if (!SecurityManager.validateUserData(personalAcc)) {
          dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid personal account data' });
          return false;
        }

        if (personalAcc.password === password) {
          // Create secure session
          SecurityManager.createSession(personalAcc, false);
          
          // Store in localStorage
          localStorage.setItem('opt_user', JSON.stringify(personalAcc));
          
          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { user: personalAcc, isAdmin: false } 
          });
          
          return true;
        }
      }

      dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid credentials' });
      return false;

    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Login failed' });
      return false;
    }
  };

  // Secure logout
  const logout = () => {
    SecurityManager.destroySession();
    localStorage.removeItem('opt_user');
    dispatch({ type: 'LOGOUT' });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Admin protection
  const requireAdminAccess = () => {
    return state.isAdmin;
  };

  // Check session on mount and validate localStorage
  useEffect(() => {
    const validateSession = () => {
      // Check if session exists in memory
      const session = SecurityManager.getSession();
      if (session) {
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user: session.user, isAdmin: session.isAdmin } 
        });
        return;
      }

      // Validate localStorage data
      if (!SecurityManager.validateLocalStorage()) {
        dispatch({ type: 'SESSION_EXPIRED' });
        return;
      }

      // Try to restore from localStorage
      const userData = localStorage.getItem('opt_user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (SecurityManager.validateUserData(user)) {
            const isAdmin = user.account_type === 'admin';
            SecurityManager.createSession(user, isAdmin);
            
            dispatch({ 
              type: 'LOGIN_SUCCESS', 
              payload: { user, isAdmin } 
            });
          } else {
            dispatch({ type: 'SESSION_EXPIRED' });
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
          dispatch({ type: 'SESSION_EXPIRED' });
        }
      }
    };

    validateSession();

    // Check session every minute
    const interval = setInterval(validateSession, 60000);
    return () => clearInterval(interval);
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    requireAdmin: requireAdminAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Admin route protection component
export const AdminRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      SecurityManager.logAction('UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT');
      logout();
      navigate('/');
    }
  }, [isAdmin, logout, navigate]);

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
};
