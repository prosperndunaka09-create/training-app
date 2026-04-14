import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { GraduationCap, UserPlus, Mail, Lock, Hash, DollarSign, CheckCircle, AlertCircle, Send } from 'lucide-react';
// import { supabase } from '../lib/supabase';
// import { TELEGRAM_CONFIG } from '../config/telegram';

// Mock telegram config for now
const TELEGRAM_CONFIG = {
  BOT_TOKEN: 'mock-token',
  CHAT_ID: 'mock-chat-id'
};

// Mock supabase for now - replace with real import when ready
const supabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => ({
          then: (resolve: any) => resolve({ data: null, error: null })
        })
      })
    }),
    insert: () => ({
      select: () => ({
        single: () => ({
          then: (resolve: any) => resolve({ 
            data: { 
              id: 'mock-id',
              email: 'mock@example.com',
              referral_code: 'MOCK-123'
            }, 
            error: null 
          })
        })
      })
    })
  })
};

interface AccountCreationProps {
  onAccountCreated: () => void;
}

const AccountCreation: React.FC<AccountCreationProps> = ({ onAccountCreated }) => {
  const [activeTab, setActiveTab] = useState<'training' | 'user'>('training');
  const [isCreating, setIsCreating] = useState(false);
  
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

  const sendTelegramNotification = async (message: string) => {
    try {
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

      if (!response.ok) {
        throw new Error('Failed to send Telegram notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Telegram notification error:', error);
      // Don't throw error to avoid blocking account creation
    }
  };

  const createTrainingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', trainingEmail)
        .single();

      if (existingUser) {
        toast('Email already exists');
        return;
      }

      // Generate referral code
      const referralCode = `TRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create training account
      const trainingUser = {
        id: `training-${Date.now()}`,
        email: trainingEmail.toLowerCase(),
        phone: null,
        display_name: trainingName,
        vip_level: 2, // Training accounts are VIP2 (1% profit)
        balance: 1100, // Initial deposit
        total_earned: 0,
        referral_code: referralCode,
        referred_by: trainingReferral || null,
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

      // Store training account in localStorage for login
      localStorage.setItem('opt_account_' + trainingEmail.toLowerCase(), JSON.stringify({ 
        user: trainingUser, 
        password: trainingPassword 
      }));

      // Create training tasks (45 tasks per phase, 90 total)
      const trainingTasks = Array.from({ length: 45 }, (_, i) => ({
        id: `task-${Date.now()}-${i}`,
        user_id: trainingUser.id,
        task_number: i + 1,
        title: `Training Task ${i + 1}`,
        description: `Complete training task ${i + 1} for phase 1`,
        status: 'pending',
        reward: 10 + Math.random() * 5,
        created_at: new Date().toISOString()
      }));
      localStorage.setItem('opt_tasks_' + trainingUser.id, JSON.stringify(trainingTasks));

      console.log('Training account created and stored:', trainingUser);

      // Mock supabase call for compatibility
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: trainingEmail,
          password: trainingPassword,
          display_name: trainingName,
          account_type: 'training',
          vip_level: 2,
          tasks_completed: 0,
          tasks_total: 45,
          balance: 1100,
          total_earned: 0,
          referral_code: referralCode,
          referred_by: trainingReferral || null,
          training_completed: false,
          training_phase: 1,
          trigger_task_number: null,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          profit_added: false,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

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
🎯 <b>Profit Rate:</b> 1% (VIP2)
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

      await sendTelegramNotification(telegramMessage);

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

      await sendTelegramNotification(trackingMessage);

      toast('Training account created successfully');
      
      // Reset form
      setTrainingEmail('');
      setTrainingPassword('');
      setTrainingName('');
      setTrainingReferral('');
      
      // Refresh data
      onAccountCreated();
      
    } catch (error) {
      console.error('Error creating training account:', error);
      toast('Failed to create training account');
    } finally {
      setIsCreating(false);
    }
  };

  const createUserAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', userEmail)
        .single();

      if (existingUser) {
        toast('Email already exists');
        return;
      }

      // Generate referral code
      const referralCode = `USR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create user account
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userEmail,
          password: userPassword, // In production, hash this
          display_name: userName,
          account_type: 'personal',
          vip_level: userVipLevel,
          tasks_completed: 0,
          tasks_total: userVipLevel === 1 ? 35 : 45,
          balance: 0,
          total_earned: 0,
          referral_code: referralCode,
          training_completed: true,
          status: 'active',
          referred_by: userReferral || null,
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

      toast('User account created successfully');
      
      // Reset form
      setUserEmail('');
      setUserPassword('');
      setUserName('');
      setUserVipLevel(1);
      setUserReferral('');
      
      // Refresh data
      onAccountCreated();
      
    } catch (error) {
      console.error('Error creating user account:', error);
      toast('Failed to create user account');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Account Creation</h2>
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
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Enter the user's referral code for tracking (mandatory)</p>
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
                      <li>• VIP 2 account (1% profit rate)</li>
                      <li>• Initial deposit: $1100</li>
                      <li>• Training completion tracking</li>
                      <li>• Telegram notification sent</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isCreating}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Training Account
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
