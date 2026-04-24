import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

// ===========================================
// DATABASE TYPES
// ===========================================

export interface DatabaseUser {
  id: string;
  email: string;
  display_name: string;
  phone?: string;
  balance: number;
  vip_level: number;
  total_earned: number;
  referral_code?: string;
  account_type: 'personal' | 'training' | 'admin';
  user_status: 'active' | 'suspended' | 'deleted';
  
  // Training
  training_completed: boolean;
  training_progress: number;
  training_phase: number;
  tasks_completed: number;
  
  // Pending Order
  trigger_task_number: number | null;
  has_pending_order: boolean;
  pending_amount: number;
  is_negative_balance: boolean;
  profit_added: boolean;
  pending_product?: {
    name?: string;
    price1?: number;
    price2?: number;
    image1?: string;
    image2?: string;
  } | null;
  
  created_at: string;
  updated_at: string;
}

export interface DatabaseTask {
  id: string;
  user_id: string;
  task_number: number;
  reward: number;
  commission_rate?: number;
  status: 'pending' | 'locked' | 'completed';
  product_name?: string;
  product_image?: string;
  product_price?: number;
  created_at: string;
  completed_at?: string;
}

export interface DatabaseTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'earning' | 'withdrawal' | 'task_reward' | 'combination_33' | 'profit_claim';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: any;
  created_at: string;
}

export interface DatabaseTrainingAccount {
  id: string;
  user_id?: string;
  email: string;
  password: string;
  assigned_to?: string; 
  created_by?: string;
  status: string;
  progress: number;
  total_tasks: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseAdminLog {
  id: string;
  action: string;
  user_id?: string;
  admin_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

// ===========================================
// SUPABASE SERVICE
// ===========================================

export class SupabaseService {
  private static buildDefaultProfile(params: {
    id: string;
    email: string;
    displayName?: string | null;
    phone?: string | null;
  }) {
    return {
      id: params.id,
      email: params.email.trim().toLowerCase(),
      display_name: params.displayName || params.email.split('@')[0] || 'User',
      phone: params.phone || null,
      account_type: 'personal' as const,
      user_status: 'active' as const,
      vip_level: 1,
      balance: 0,
      total_earned: 0,
      referral_code: `OPT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      training_completed: false,
      training_progress: 0,
      training_phase: 1,
      tasks_completed: 0,
      trigger_task_number: null,
      has_pending_order: false,
      pending_amount: 0,
      is_negative_balance: false,
      profit_added: false,
      pending_product: null,
    };
  }

  static async ensureUserProfile(params: {
    id: string;
    email?: string | null;
    displayName?: string | null;
    phone?: string | null;
  }): Promise<DatabaseUser | null> {
    try {
      console.log('[ensureUserProfile] Checking for existing profile:', params.id);
      
      // First attempt: Try to get existing user
      const { data: existingUser, error: existingError } = await supabase
        .from('users')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (existingError) {
        console.error('[ensureUserProfile] Error checking existing user profile:', existingError);
        // Don't return null yet, try to create the profile
      } else if (existingUser) {
        console.log('[ensureUserProfile] Found existing profile:', existingUser.id);
        return existingUser as DatabaseUser;
      }

      if (!params.email) {
        console.error('[ensureUserProfile] Cannot create profile without email');
        return null;
      }

      console.log('[ensureUserProfile] Creating new profile for:', params.id);
      
      const profilePayload = this.buildDefaultProfile({
        id: params.id,
        email: params.email,
        displayName: params.displayName,
        phone: params.phone,
      });

      // Try upsert (insert or update)
      const { data: createdUser, error: upsertError } = await supabase
        .from('users')
        .upsert(profilePayload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (upsertError) {
        console.error('[ensureUserProfile] Error creating user profile:', upsertError);
        
        // Try a second approach: direct insert if upsert failed
        console.log('[ensureUserProfile] Retrying with direct insert...');
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert(profilePayload)
          .select()
          .maybeSingle();
        
        if (insertError) {
          console.error('[ensureUserProfile] Direct insert also failed:', insertError);
          return null;
        }
        
        console.log('[ensureUserProfile] Profile created via direct insert:', insertedUser?.id);
        return (insertedUser as DatabaseUser) || null;
      }

      console.log('[ensureUserProfile] Profile created via upsert:', createdUser?.id);
      return (createdUser as DatabaseUser) || null;
    } catch (error) {
      console.error('[ensureUserProfile] Exception ensuring user profile:', error);
      return null;
    }
  }

  // ===========================================
  // USER OPERATIONS
  // ===========================================
  
  static async createUser(userData: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user:', error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return null;
      }
      
      return data as DatabaseUser;
    } catch (error: any) {
      console.error('Exception creating user:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  }
  
  static async getUserById(userId: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      if (data) {
        return data as DatabaseUser;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.id === userId) {
        return await this.ensureUserProfile({
          id: authUser.id,
          email: authUser.email,
          displayName: (authUser.user_metadata?.display_name as string | undefined) || null,
          phone: (authUser.user_metadata?.phone as string | undefined) || null,
        });
      }

      return null;
    } catch (error) {
      console.error('Exception fetching user:', error);
      return null;
    }
  }
  
  static async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user by email:', error);
        return null;
      }
      
      return data as DatabaseUser | null;
    } catch (error) {
      console.error('Exception fetching user by email:', error);
      return null;
    }
  }
  
  static async updateUser(userId: string, updates: Partial<DatabaseUser>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating user:', error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error('Exception updating user:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  }
  
  // ===========================================
  // AUTH OPERATIONS
  // ===========================================
  
  static async signUp(email: string, password: string, displayName: string, phone?: string): Promise<{ user: DatabaseUser | null; error: string | null }> {
    const emailLower = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailLower,
        password,
        options: {
          data: {
            display_name: displayName,
            phone: phone || null,
          },
        },
      });

      if (error) {
        const signupMessage = error.message || '';
        const alreadyRegistered = /already registered|already exists|user already/i.test(signupMessage);
        if (alreadyRegistered) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: emailLower,
            password,
          });

          if (signInError || !signInData.user) {
            return { user: null, error: signInError?.message || 'User already registered. Please log in.' };
          }

          const recoveredUser = await this.ensureUserProfile({
            id: signInData.user.id,
            email: signInData.user.email || emailLower,
            displayName: (signInData.user.user_metadata?.display_name as string | undefined) || displayName || null,
            phone: (signInData.user.user_metadata?.phone as string | undefined) || phone || null,
          });

          if (!recoveredUser) {
            return { user: null, error: 'User exists in auth, but profile recovery failed.' };
          }

          return { user: recoveredUser, error: null };
        }

        console.error('Signup error:', signupMessage);
        return { user: null, error: signupMessage };
      }

      if (!data?.user) {
        return { user: null, error: 'Could not create account. Try again or use a different email.' };
      }

      const authUserId = data.user.id;
      let session = data.session;

      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailLower,
          password,
        });

        if (signInError) {
          const msg = signInError.message || '';
          if (/confirm|verify|not confirmed|email.*not.*confirmed/i.test(msg)) {
            return {
              user: null,
              error: 'Account created. Confirm the link sent to your email, then sign in.',
            };
          }
          console.error('Sign in after signup failed:', signInError);
          return { user: null, error: signInError.message };
        }

        session = signInData.session;
      }

      if (!session) {
        return {
          user: null,
          error:
            'Account created but you are not signed in yet. If email confirmation is enabled in Supabase, open the confirmation link first, then sign in.',
        };
      }

      const userData = await this.ensureUserProfile({
        id: authUserId,
        email: emailLower,
        displayName,
        phone: phone || null,
      });

      if (!userData) {
        return { user: null, error: 'Failed to create or fetch public.users profile after signup.' };
      }

      const tasksCreated = await this.createTrainingTasks(authUserId, 35);
      if (!tasksCreated) {
        console.error('Failed to create tasks for personal account');
      }

      return { user: userData as DatabaseUser, error: null };
    } catch (error: unknown) {
      console.error('Signup exception:', error);
      const message = error instanceof Error ? error.message : 'Signup failed';
      let classifiedError = message;
      if (message.includes('fetch') || message.includes('NetworkError')) {
        classifiedError =
          'Network error: cannot reach Supabase. Check VITE_SUPABASE_URL, project status, and browser extensions blocking requests.';
      }
      if (message.includes('timeout')) {
        classifiedError = 'Connection timed out. The Supabase project may be paused or unreachable.';
      }
      return { user: null, error: classifiedError };
    }
  }
  
  static async signIn(email: string, password: string): Promise<{ user: DatabaseUser | null; error: string | null }> {
    const emailLower = email.trim().toLowerCase();
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailLower,
        password,
      });

      if (authError) {
        console.error('Auth signin error:', authError);
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: 'Failed to sign in' };
      }

      const userData = await this.ensureUserProfile({
        id: authData.user.id,
        email: authData.user.email,
        displayName: (authData.user.user_metadata?.display_name as string | undefined) || null,
        phone: (authData.user.user_metadata?.phone as string | undefined) || null,
      });

      if (!userData) {
        return {
          user: null,
          error: 'No public.users profile for this account (sign-up insert or RLS may have failed).',
        };
      }

      return { user: userData as DatabaseUser, error: null };
    } catch (error: unknown) {
      console.error('Exception in signIn:', error);
      const message = error instanceof Error ? error.message : 'Sign in failed';
      return { user: null, error: message };
    }
  }
  
  static async signOut(): Promise<boolean> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Exception in signOut:', error);
      return false;
    }
  }
  
  static async getCurrentUser(): Promise<DatabaseUser | null> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        return null;
      }

      const userData = await this.ensureUserProfile({
        id: authUser.id,
        email: authUser.email,
        displayName: (authUser.user_metadata?.display_name as string | undefined) || null,
        phone: (authUser.user_metadata?.phone as string | undefined) || null,
      });

      return userData;
    } catch (error) {
      console.error('Exception in getCurrentUser:', error);
      return null;
    }
  }
  
  // ===========================================
  // VIP COMMISSION RATES
  // ===========================================
  
  static getVIPCommissionRate(vipLevel: number, isTraining: boolean = false): number {
    // Training accounts get 1% commission rate (same as VIP2)
    if (isTraining) {
      return 0.01; // 1% for training accounts
    }
    // VIP commission rates - Set A (Balanced)
    // VIP1 Bronze: 0.5% - $0-$100
    // VIP2 Silver: 1.0% - $101-$500
    // VIP3 Gold: 3.0% - $501+
    const rates: Record<number, number> = {
      1: 0.005,  // VIP1 Bronze = 0.5%
      2: 0.01,   // VIP2 Silver = 1.0%
      3: 0.03,   // VIP3 Gold = 3.0%
    };
    return rates[vipLevel] || 0.005; // Default to VIP1 Bronze rate
  }

  static getVIPTierName(vipLevel: number): string {
    const names: Record<number, string> = {
      1: 'Bronze',
      2: 'Silver',
      3: 'Gold',
    };
    return names[vipLevel] || 'Bronze';
  }

  static getVIPBalanceRange(vipLevel: number): string {
    const ranges: Record<number, string> = {
      1: '$0 - $100',
      2: '$101 - $500',
      3: '$501+',
    };
    return ranges[vipLevel] || '$0 - $100';
  }
  
  static calculateTaskReward(productPrice: number, vipLevel: number, isTraining: boolean = false): number {
    const commissionRate = this.getVIPCommissionRate(vipLevel, isTraining);
    const reward = productPrice * commissionRate;
    return Math.round(reward * 100) / 100; // Round to 2 decimal places
  }
  
  // ===========================================
  // TASK OPERATIONS
  // ===========================================
  
  static async createTrainingTasks(userId: string, taskCount: number = 35): Promise<boolean> {
    try {
      // Get user's VIP level
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('vip_level, account_type')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error fetching user for VIP level:', userError);
        return false;
      }
      
      const vipLevel = user?.vip_level || 1;
      const isTraining = user?.account_type === 'training';
      const commissionRate = this.getVIPCommissionRate(vipLevel, isTraining);
      
      // Use provided taskCount (default 35 for VIP1 personal accounts)
      // Training accounts can have 45 tasks
      const actualTaskCount = taskCount;
      
      // Create training tasks with VIP-based commission rewards
      // Product prices range from $50 to $150 (realistic product prices)
      const tasks = Array.from({ length: actualTaskCount }, (_, i) => {
        // Generate realistic product prices (between $50 and $150)
        const productPrice = Math.floor(Math.random() * 100) + 50;
        
        // Calculate reward based on product price and VIP commission rate
        let reward = this.calculateTaskReward(productPrice, vipLevel);
        
        // Add small variation for realism (±10%)
        const variation = (Math.random() - 0.5) * 0.2;
        reward = reward * (1 + variation);
        reward = Math.max(0.25, reward); // Minimum $0.25 per task
        
        return {
          user_id: userId,
          task_number: i + 1,
          reward: Math.round(reward * 100) / 100,
          commission_rate: commissionRate,
          status: i === 0 ? 'pending' : 'locked',
          product_name: `Training Product ${i + 1}`,
          product_price: productPrice
        };
      });
      
      const { error } = await supabase.from('tasks').insert(tasks);
      
      if (error) {
        console.error('Error creating training tasks:', error);
        return false;
      }
      
      console.log(`[SupabaseService] Created ${actualTaskCount} training tasks for user ${userId} with ${isTraining ? 'Training' : 'VIP' + vipLevel} rate (${commissionRate * 100}%)`);
      return true;
    } catch (error) {
      console.error('Exception creating training tasks:', error);
      return false;
    }
  }
  
  static async getUserTasks(userId: string): Promise<DatabaseTask[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('task_number', { ascending: true });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        return [];
      }
      
      return data as DatabaseTask[];
    } catch (error) {
      console.error('Exception fetching tasks:', error);
      return [];
    }
  }
  
  static async completeTask(userId: string, taskNumber: number): Promise<{ success: boolean; reward?: number; error?: string }> {
    try {
      // Get task info
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('task_number', taskNumber)
        .single();
      
      if (taskError || !task) {
        return { success: false, error: 'Task not found' };
      }
      
      if (task.status === 'completed') {
        return { success: false, error: 'Task already completed' };
      }
      
      const reward = task.reward;
      
      // Update task status
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', task.id);
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      
      // Update user balance and stats
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError || !user) {
        return { success: false, error: 'User not found' };
      }
      
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          balance: user.balance + reward,
          total_earned: user.total_earned + reward,
          tasks_completed: user.tasks_completed + 1,
          training_progress: Math.min(100, Math.round(((user.tasks_completed + 1) / 45) * 100)),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (userUpdateError) {
        return { success: false, error: userUpdateError.message };
      }
      
      // Create transaction record
      await this.createTransaction({
        user_id: userId,
        type: 'task_reward',
        amount: reward,
        description: `Completed task ${taskNumber}`,
        status: 'completed'
      });
      
      // Unlock next task
      await supabase
        .from('tasks')
        .update({ status: 'pending' })
        .eq('user_id', userId)
        .eq('task_number', taskNumber + 1);
      
      return { success: true, reward };
    } catch (error: any) {
      console.error('Exception completing task:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ===========================================
  // PENDING ORDER OPERATIONS
  // ===========================================
  
  static async createPendingOrder(userId: string, taskNumber: number, amount: number, product: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          has_pending_order: true,
          trigger_task_number: taskNumber,
          pending_amount: amount,
          is_negative_balance: true,
          pending_product: product,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Error creating pending order:', error);
        return false;
      }
      
      // Create transaction for combination order
      await this.createTransaction({
        user_id: userId,
        type: 'combination_order',
        amount: amount,
        description: `Combination order at task ${taskNumber}`,
        status: 'completed',
        metadata: { product }
      });
      
      return true;
    } catch (error) {
      console.error('Exception creating pending order:', error);
      return false;
    }
  }
  
  static async clearPendingOrderAndAddProfit(userId: string): Promise<{ success: boolean; profit?: number; error?: string }> {
    try {
      // Get user current pending order info
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError || !user) {
        return { success: false, error: 'User not found' };
      }
      
      if (!user.has_pending_order) {
        return { success: false, error: 'No pending order to clear' };
      }
      
      const pendingAmount = user.pending_amount;
      const profit = pendingAmount * 6; // 6x profit
      
      // Clear pending order and add profit
      const { error: updateError } = await supabase
        .from('users')
        .update({
          has_pending_order: false,
          is_negative_balance: false,
          profit_added: true,
          balance: user.balance + pendingAmount + profit,
          pending_amount: 0,
          pending_product: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      
      // Create profit transaction
      await this.createTransaction({
        user_id: userId,
        type: 'profit_claim',
        amount: profit,
        description: `6x Profit claimed (${pendingAmount} x 6)`,
        status: 'completed'
      });
      
      return { success: true, profit };
    } catch (error: any) {
      console.error('Exception clearing pending order:', error);
      return { success: false, error: error.message };
    }
  }

  // ===========================================
  // TRAINING COMPLETION & BALANCE TRANSFER
  // ===========================================

  static async completeTrainingAndTransferBalance(trainingUserId: string): Promise<{ success: boolean; transferredAmount?: number; error?: string }> {
    try {
      console.log(`[SupabaseService] Completing training for user ${trainingUserId}`);
      
      // Get training account details
      const { data: trainingUser, error: trainingError } = await supabase
        .from('users')
        .select('*')
        .eq('id', trainingUserId)
        .single();
      
      if (trainingError || !trainingUser) {
        console.error('[SupabaseService] Training user not found:', trainingError);
        return { success: false, error: 'Training account not found' };
      }

      // Verify this is a training account
      if (trainingUser.account_type !== 'training') {
        return { success: false, error: 'This is not a training account' };
      }

      // Check if training is already completed
      if (trainingUser.training_completed) {
        return { success: false, error: 'Training is already marked as completed' };
      }

      // Get the linked personal account using referred_by (which stores the personal account's referral code)
      const personalReferralCode = trainingUser.referred_by;
      if (!personalReferralCode) {
        return { success: false, error: 'No linked personal account found (referred_by is empty)' };
      }

      const { data: personalUser, error: personalError } = await supabase
        .from('users')
        .select('*')
        .eq('referral_code', personalReferralCode)
        .eq('account_type', 'personal')
        .single();
      
      if (personalError || !personalUser) {
        console.error('[SupabaseService] Personal account not found:', personalError);
        return { success: false, error: 'Linked personal account not found' };
      }

      const trainingBalance = trainingUser.balance || 0;
      const currentPersonalBalance = personalUser.balance || 0;
      
      if (trainingBalance <= 0) {
        return { success: false, error: 'No balance to transfer from training account' };
      }

      console.log(`[SupabaseService] Transferring $${trainingBalance} from training to personal account ${personalUser.id}`);

      // Update training account - mark as completed and reset balance
      const { error: updateTrainingError } = await supabase
        .from('users')
        .update({
          training_completed: true,
          balance: 0,
          total_earned: trainingUser.total_earned || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', trainingUserId);
      
      if (updateTrainingError) {
        console.error('[SupabaseService] Error updating training account:', updateTrainingError);
        return { success: false, error: 'Failed to update training account: ' + updateTrainingError.message };
      }

      // Update personal account - add the transferred balance
      const { error: updatePersonalError } = await supabase
        .from('users')
        .update({
          balance: currentPersonalBalance + trainingBalance,
          total_earned: (personalUser.total_earned || 0) + trainingBalance,
          training_completed: true, // Also mark personal account training as completed
          updated_at: new Date().toISOString()
        })
        .eq('id', personalUser.id);
      
      if (updatePersonalError) {
        console.error('[SupabaseService] Error updating personal account:', updatePersonalError);
        return { success: false, error: 'Failed to update personal account: ' + updatePersonalError.message };
      }

      // Create transaction record for training account (debit)
      await this.createTransaction({
        user_id: trainingUserId,
        type: 'withdrawal',
        amount: trainingBalance,
        description: `Training completed - Balance transferred to personal account (${personalUser.email})`,
        status: 'completed'
      });

      // Create transaction record for personal account (credit)
      await this.createTransaction({
        user_id: personalUser.id,
        type: 'earning',
        amount: trainingBalance,
        description: `Training completed - Balance received from training account (${trainingUser.email})`,
        status: 'completed'
      });

      console.log(`[SupabaseService] Successfully transferred $${trainingBalance} from training to personal account`);
      
      return { 
        success: true, 
        transferredAmount: trainingBalance,
      };
    } catch (error: any) {
      console.error('[SupabaseService] Exception completing training:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ===========================================
  // TRANSACTION OPERATIONS
  // ===========================================
  
  static async createTransaction(transaction: Omit<DatabaseTransaction, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert(transaction);
      
      if (error) {
        console.error('Error creating transaction:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception creating transaction:', error);
      return false;
    }
  }
  
  static async getUserTransactions(userId: string): Promise<DatabaseTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
      
      return data as DatabaseTransaction[];
    } catch (error) {
      console.error('Exception fetching transactions:', error);
      return [];
    }
  }
  
  // ===========================================
  // ADMIN OPERATIONS
  // ===========================================
  
  static async getAllUsers(): Promise<DatabaseUser[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching all users:', error);
        return [];
      }
      
      return data as DatabaseUser[];
    } catch (error) {
      console.error('Exception fetching all users:', error);
      return [];
    }
  }
  
  static async resetUserProgress(userId: string): Promise<boolean> {
    try {
      // Reset user stats
      const { error: userError } = await supabase
        .from('users')
        .update({
          training_progress: 0,
          tasks_completed: 0,
          balance: 0,
          total_earned: 0,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          profit_added: false,
          pending_product: null,
          trigger_task_number: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (userError) {
        console.error('Error resetting user:', userError);
        return false;
      }
      
      // Reset all tasks to locked except first
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('Error deleting tasks:', deleteError);
        return false;
      }
      
      // Recreate 35 tasks for VIP1
      await this.createTrainingTasks(userId, 35);
      
      return true;
    } catch (error) {
      console.error('Exception resetting user:', error);
      return false;
    }
  }
  
  static async updateUserBalance(userId: string, newBalance: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating balance:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception updating balance:', error);
      return false;
    }
  }
  
  static async logAdminAction(action: string, userId?: string, details?: any): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('admin_logs')
        .insert({
          action,
          user_id: userId,
          admin_id: user?.id,
          details,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error logging admin action:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception logging admin action:', error);
      return false;
    }
  }
  
  // ===========================================
  // TRAINING ACCOUNT OPERATIONS
  // ===========================================
  
  static async createTrainingAccount(account: Omit<DatabaseTrainingAccount, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseTrainingAccount | null> {
    try {
      const { data, error } = await supabase
        .from('training_accounts')
        .insert(account)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating training account:', error);
        return null;
      }
      
      return data as DatabaseTrainingAccount;
    } catch (error) {
      console.error('Exception creating training account:', error);
      return null;
    }
  }
  
  static async getTrainingAccounts(): Promise<DatabaseTrainingAccount[]> {
    try {
      const { data, error } = await supabase
        .from('training_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching training accounts:', error);
        return [];
      }
      
      return data as DatabaseTrainingAccount[];
    } catch (error) {
      console.error('Exception fetching training accounts:', error);
      return [];
    }
  }
  
  static async validateTrainingAccount(email: string, password: string): Promise<DatabaseUser | null> {
    try {
      const emailKey = email.toLowerCase();
      
      // Training accounts use localStorage for auth only
      const storedAccount = localStorage.getItem(`training_account_${emailKey}`);
      
      if (!storedAccount) {
        console.log('[validateTrainingAccount] No training account found in localStorage for:', emailKey);
        return null;
      }
      
      const accountData = JSON.parse(storedAccount);
      if (accountData.password !== password) {
        console.log('[validateTrainingAccount] Password mismatch for:', emailKey);
        return null;
      }
      
      console.log('[validateTrainingAccount] Training account validated successfully:', emailKey);
      
      // Return a mock DatabaseUser object for training accounts
      // Training accounts don't need to exist in Supabase database
      return {
        id: accountData.id || `training_${emailKey}`,
        email: accountData.email || emailKey,
        phone: accountData.phone || null,
        display_name: accountData.assignedTo || accountData.display_name || emailKey.split('@')[0],
        account_type: 'training',
        vip_level: 2,
        balance: 1100,
        total_earned: 0,
        referral_code: accountData.trainingReferralCode || '',
        training_completed: false,
        training_progress: 0,
        user_status: 'active',
        training_phase: 1,
        tasks_completed: 0,
        trigger_task_number: null,
        has_pending_order: false,
        pending_amount: 0,
        is_negative_balance: false,
        profit_added: false,
        created_at: accountData.createdAt || new Date().toISOString()
      } as DatabaseUser;
    } catch (error) {
      console.error('Exception validating training account:', error);
      return null;
    }
  }
}

export default SupabaseService;
