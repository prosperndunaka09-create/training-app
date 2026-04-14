import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import SupabaseService, { DatabaseUser, DatabaseTask, DatabaseTransaction } from '@/services/supabaseService';
import { toast } from '@/components/ui/use-toast';

// ===========================================
// TYPES
// ===========================================

export interface User {
  id: string;
  email: string;
  phone: string | null;
  display_name: string;
  vip_level: 1 | 2 | 3;
  balance: number;
  total_earned: number;
  referral_code: string;
  created_at: string;
  account_type: 'training' | 'personal' | 'admin';
  training_completed: boolean;
  training_progress: number;
  user_status: 'registered' | 'waiting_for_training' | 'training_assigned' | 'training_credentials_sent' | 'training_completed' | 'active';
  training_account_email?: string;
  personal_account_id?: string;
  training_phase: 1 | 2;
  tasks_completed: number;
  trigger_task_number: 19 | 24 | 31 | 32 | null;
  has_pending_order: boolean;
  pending_amount: number;
  is_negative_balance: boolean;
  profit_added: boolean;
  pending_product?: {
    name: string;
    brand: string;
    price: number;
    category: string;
    image: string;
  };
}

export interface Task {
  id: string;
  user_id: string;
  task_number: number;
  title: string;
  description: string;
  reward: number;
  status: 'pending' | 'completed' | 'locked';
  created_at: string;
  completed_at: string | null;
  task_set: number;
}

export interface Wallet {
  id: string;
  user_id: string;
  wallet_address: string;
  wallet_type: string;
  is_primary: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'reward' | 'withdrawal' | 'demo' | 'pending' | 'profit';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
}

export interface AppContextType {
  user: User | null;
  tasks: Task[];
  transactions: Transaction[];
  wallets: Wallet[];
  isAuthenticated: boolean;
  isLoading: boolean;
  authLoading: boolean;
  
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Auth Modal UI State
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'register';
  setAuthModalTab: (tab: 'login' | 'register') => void;
  
  // Auth
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginTrainingAccount: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Tasks
  completeTask: (taskNumber: number) => Promise<{ success: boolean; reward?: number; error?: string }>;
  refreshTasks: () => Promise<void>;
  
  // User
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  
  // Pending Order
  createPendingOrder: (taskNumber: number, amount: number, product: any) => Promise<boolean>;
  clearPendingOrderAndClaimProfit: () => Promise<{ success: boolean; profit?: number; error?: string }>;
  
  // Data
  refreshTransactions: () => Promise<void>;
  addWallet: (walletAddress: string, walletType: string) => Promise<boolean>;
  refreshWallets: () => Promise<void>;
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function mapDatabaseUserToUser(dbUser: DatabaseUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    phone: dbUser.phone || null,
    display_name: dbUser.display_name,
    vip_level: (dbUser.vip_level || 1) as 1 | 2 | 3,
    balance: dbUser.balance || 0,
    total_earned: dbUser.total_earned || 0,
    referral_code: dbUser.referral_code || '',
    created_at: dbUser.created_at,
    account_type: (dbUser.account_type || 'personal') as 'training' | 'personal' | 'admin',
    training_completed: dbUser.training_completed || false,
    training_progress: dbUser.training_progress || 0,
    user_status: 'active' as User['user_status'],
    training_phase: (dbUser.training_phase || 1) as 1 | 2,
    tasks_completed: dbUser.tasks_completed || 0,
    trigger_task_number: dbUser.trigger_task_number as 19 | 24 | 31 | 32 | null,
    has_pending_order: dbUser.has_pending_order || false,
    pending_amount: dbUser.pending_amount || 0,
    is_negative_balance: dbUser.is_negative_balance || false,
    profit_added: dbUser.profit_added || false,
    pending_product: dbUser.pending_product ? {
      name: dbUser.pending_product.name || 'Product',
      brand: 'Premium Brand',
      price: dbUser.pending_product.price1 || 0,
      category: 'Electronics',
      image: dbUser.pending_product.image1 || ''
    } : undefined
  };
}

function mapDatabaseTaskToTask(dbTask: DatabaseTask): Task {
  return {
    id: dbTask.id,
    user_id: dbTask.user_id,
    task_number: dbTask.task_number,
    title: dbTask.product_name || `Task ${dbTask.task_number}`,
    description: `Complete task ${dbTask.task_number}`,
    reward: dbTask.reward || 0,
    status: dbTask.status || 'locked',
    created_at: dbTask.created_at,
    completed_at: dbTask.completed_at || null,
    task_set: 0
  };
}

function mapDatabaseTransactionToTransaction(dbTx: DatabaseTransaction): Transaction {
  const typeMap: Record<string, Transaction['type']> = {
    'deposit': 'deposit',
    'earning': 'reward',
    'withdrawal': 'withdrawal',
    'task_reward': 'reward',
    'combination_order': 'pending',
    'profit_claim': 'profit'
  };
  
  return {
    id: dbTx.id,
    user_id: dbTx.user_id,
    type: typeMap[dbTx.type] || 'reward',
    amount: Math.abs(dbTx.amount),
    status: dbTx.status,
    description: dbTx.description,
    created_at: dbTx.created_at
  };
}

// ===========================================
// CONTEXT CREATION
// ===========================================

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Auth Modal UI State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // ===========================================
  // INITIAL LOAD - Check Session
  // ===========================================
  
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const dbUser = await SupabaseService.getCurrentUser();
        
        if (dbUser) {
          setUser(mapDatabaseUserToUser(dbUser));
          setIsAuthenticated(true);
          
          // Load user data
          await loadUserData(dbUser.id);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const dbUser = await SupabaseService.getUserById(session.user.id);
        if (dbUser) {
          setUser(mapDatabaseUserToUser(dbUser));
          setIsAuthenticated(true);
          await loadUserData(dbUser.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setTasks([]);
        setTransactions([]);
        setWallets([]);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Load tasks
      const dbTasks = await SupabaseService.getUserTasks(userId);
      setTasks((dbTasks || []).map(mapDatabaseTaskToTask));
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
    
    try {
      // Load transactions
      const dbTransactions = await SupabaseService.getUserTransactions(userId);
      setTransactions((dbTransactions || []).map(mapDatabaseTransactionToTransaction));
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    }
    
    try {
      // Load wallets - pass userId directly to avoid race condition
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error loading wallets:', error);
        setWallets([]);
      } else {
        setWallets(data as Wallet[]);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
      setWallets([]);
    }
  };

  // ===========================================
  // AUTH FUNCTIONS
  // ===========================================
  
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthLoading(true);
    try {
      const { user: dbUser, error } = await SupabaseService.signIn(email, password);
      
      if (error || !dbUser) {
        setAuthLoading(false);
        return { success: false, error: error || 'Login failed' };
      }
      
      setUser(mapDatabaseUserToUser(dbUser));
      setIsAuthenticated(true);
      await loadUserData(dbUser.id);
      setAuthLoading(false);
      
      toast({
        title: 'Welcome back!',
        description: `Successfully logged in as ${dbUser.display_name}`
      });
      
      return { success: true };
    } catch (error: any) {
      setAuthLoading(false);
      return { success: false, error: error.message };
    }
  };

  const loginTrainingAccount = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const trainingAccount = await SupabaseService.validateTrainingAccount(email, password);
      
      if (!trainingAccount) {
        return { success: false, error: 'Invalid training account credentials' };
      }
      
      // For training accounts, create a temporary session-like state
      // In production, you might want to handle this differently
      toast({
        title: 'Training Account',
        description: 'Logged in as training account (limited access)'
      });
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email: string, password: string, displayName: string, phone?: string): Promise<{ success: boolean; error?: string }> => {
    setAuthLoading(true);
    try {
      const { user: dbUser, error } = await SupabaseService.signUp(email, password, displayName, phone);
      
      if (error || !dbUser) {
        setAuthLoading(false);
        return { success: false, error: error || 'Registration failed' };
      }
      
      setUser(mapDatabaseUserToUser(dbUser));
      setIsAuthenticated(true);
      await loadUserData(dbUser.id);
      setAuthLoading(false);
      
      toast({
        title: 'Welcome!',
        description: 'Account created successfully'
      });
      
      return { success: true };
    } catch (error: any) {
      setAuthLoading(false);
      return { success: false, error: error.message };
    }
  };

  const logout = async (): Promise<void> => {
    // Check if this is a training account that has completed both phases
    if (user && user.account_type === 'training' && !user.training_completed) {
      // Check if all training tasks are completed (Phase 1 + Phase 2 = 90 tasks)
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const totalTrainingTasks = 90; // 45 Phase 1 + 45 Phase 2
      
      if (completedTasks >= totalTrainingTasks) {
        console.log('[AppContext] Training completed! Auto-transferring balance to personal account...');
        
        try {
          // Attempt to complete training and transfer balance
          const result = await SupabaseService.completeTrainingAndTransferBalance(user.id);
          
          if (result.success && result.transferredAmount && result.transferredAmount > 0) {
            toast({ 
              title: '🎉 Training Completed!', 
              description: `$${result.transferredAmount.toFixed(2)} has been automatically transferred to your personal account.` 
            });
            
            // Show additional notification
            setTimeout(() => {
              toast({ 
                title: 'Login to Personal Account', 
                description: 'Your earnings are now in your personal account. Please login with your personal account credentials.' 
              });
            }, 2000);
          } else {
            console.log('[AppContext] Training completion result:', result);
          }
        } catch (error) {
          console.error('[AppContext] Error auto-completing training:', error);
        }
      }
    }
    
    await SupabaseService.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setTasks([]);
    setTransactions([]);
    setWallets([]);
    toast({ title: 'Logged out', description: 'See you soon!' });
  };

  // ===========================================
  // TASK FUNCTIONS
  // ===========================================
  
  const completeTask = async (taskNumber: number): Promise<{ success: boolean; reward?: number; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const result = await SupabaseService.completeTask(user.id, taskNumber);
    
    if (result.success && result.reward) {
      // Refresh user data
      await refreshUser();
      await refreshTasks();
      
      toast({
        title: 'Task Completed!',
        description: `You earned $${result.reward.toFixed(2)}`
      });
      
      // Check if we should trigger pending order for personal accounts
      // Phase 2, task 28 triggers pending order
      if (user.account_type === 'personal' && 
          user.training_phase === 2 && 
          taskNumber === 28 && 
          !user.has_pending_order) {
        
        // Create combination product for pending order
        const product1 = {
          name: 'Premium Wireless Headphones',
          brand: 'AudioTech',
          price: 45,
          category: 'Electronics',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
        };
        const product2 = {
          name: 'Smart Watch Series 5',
          brand: 'TechGear',
          price: 38,
          category: 'Wearables',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
        };
        
        const combinedPrice = product1.price + product2.price; // $83
        const pendingAmount = combinedPrice - user.balance; // Will be negative
        
        // Create pending order
        await createPendingOrder(28, Math.abs(pendingAmount), {
          name: `${product1.name} + ${product2.name}`,
          brand: 'Combination Product',
          price: combinedPrice,
          category: 'Premium Bundle',
          image: product1.image,
          price1: product1.price,
          price2: product2.price,
          image1: product1.image,
          image2: product2.image,
          name1: product1.name,
          name2: product2.name
        });
        
        toast({
          title: 'Combination Order Detected!',
          description: 'A premium combination product has been assigned. Contact customer service to clear.',
          variant: 'destructive'
        });
      }
    }
    
    return result;
  };

  const refreshTasks = async (): Promise<void> => {
    if (!user) return;
    try {
      const dbTasks = await SupabaseService.getUserTasks(user.id);
      setTasks((dbTasks || []).map(mapDatabaseTaskToTask));
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      setTasks([]);
    }
  };

  // ===========================================
  // USER FUNCTIONS
  // ===========================================
  
  const refreshUser = async (): Promise<void> => {
    if (!user) return;
    
    const dbUser = await SupabaseService.getUserById(user.id);
    if (dbUser) {
      setUser(mapDatabaseUserToUser(dbUser));
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    // Map frontend User type to DatabaseUser type
    const dbUpdates: Partial<DatabaseUser> = {};
    if (updates.display_name) dbUpdates.display_name = updates.display_name;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.vip_level) dbUpdates.vip_level = updates.vip_level;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.total_earned !== undefined) dbUpdates.total_earned = updates.total_earned;
    
    const success = await SupabaseService.updateUser(user.id, dbUpdates);
    
    if (success) {
      await refreshUser();
    }
    
    return success;
  };

  // ===========================================
  // PENDING ORDER FUNCTIONS
  // ===========================================
  
  const createPendingOrder = async (taskNumber: number, amount: number, product: any): Promise<boolean> => {
    if (!user) return false;
    
    const success = await SupabaseService.createPendingOrder(user.id, taskNumber, amount, product);
    
    if (success) {
      await refreshUser();
      await refreshTransactions();
      
      toast({
        title: 'Combination Order Created',
        description: 'Complete the purchase to unlock tasks and claim 6x profit'
      });
    }
    
    return success;
  };

  const clearPendingOrderAndClaimProfit = async (): Promise<{ success: boolean; profit?: number; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const result = await SupabaseService.clearPendingOrderAndAddProfit(user.id);
    
    if (result.success && result.profit) {
      await refreshUser();
      await refreshTransactions();
      
      toast({
        title: 'Profit Claimed!',
        description: `You received $${result.profit.toFixed(2)} (6x profit)`
      });
    }
    
    return result;
  };

  // ===========================================
  // DATA FUNCTIONS
  // ===========================================
  
  const refreshTransactions = async (): Promise<void> => {
    if (!user) return;
    try {
      const dbTransactions = await SupabaseService.getUserTransactions(user.id);
      setTransactions((dbTransactions || []).map(mapDatabaseTransactionToTransaction));
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      setTransactions([]);
    }
  };

  const addWallet = async (walletAddress: string, walletType: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress,
          wallet_type: walletType,
          is_primary: wallets.length === 0
        });
      
      if (error) {
        console.error('Error adding wallet:', error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return false;
      }
      
      await refreshWallets();
      
      toast({
        title: 'Wallet Added',
        description: 'Your wallet has been added successfully'
      });
      
      return true;
    } catch (error: any) {
      console.error('Exception adding wallet:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const refreshWallets = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching wallets:', error);
        return;
      }
      
      setWallets(data as Wallet[]);
    } catch (error) {
      console.error('Exception fetching wallets:', error);
    }
  };

  // ===========================================
  // PROVIDER VALUE
  // ===========================================
  
  const value: AppContextType = {
    user,
    tasks,
    transactions,
    wallets,
    isAuthenticated,
    isLoading,
    authLoading,
    activeTab,
    setActiveTab,
    
    // Auth Modal UI State
    authModalOpen,
    setAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    
    // Auth
    login,
    loginTrainingAccount,
    register,
    logout,
    
    // Tasks
    completeTask,
    refreshTasks,
    
    // User
    refreshUser,
    updateUser,
    
    // Pending Order
    createPendingOrder,
    clearPendingOrderAndClaimProfit,
    
    // Data
    refreshTransactions,
    addWallet,
    refreshWallets
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Backward compatibility alias
export const useAppContext = useApp;
