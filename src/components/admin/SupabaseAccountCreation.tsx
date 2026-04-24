import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { SupabaseService, DatabaseUser, DatabaseTask } from '../../services/supabaseService';
import { SecurityManager } from '../../utils/security';
import { supabase } from '../../lib/supabase';

interface SupabaseAccountCreationProps {
  onSuccess?: () => void;
  onRefresh?: () => void;
}

const SupabaseAccountCreation: React.FC<SupabaseAccountCreationProps> = ({ 
  onSuccess, 
  onRefresh 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  
  // Training account form
  const [trainingEmail, setTrainingEmail] = useState('');
  const [trainingPassword, setTrainingPassword] = useState('');
  const [trainingName, setTrainingName] = useState('');
  const [trainingReferral, setTrainingReferral] = useState('');
  
  // Personal account form
  const [personalEmail, setPersonalEmail] = useState('');
  const [personalPassword, setPersonalPassword] = useState('');
  const [personalName, setPersonalName] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [personalReferral, setPersonalReferral] = useState('');
  const personalReferralPattern = /^OPT-[A-Z0-9]{6}$/;

  // Generate referral codes
  const generateReferralCode = () => {
    return 'TRN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create training account
  const createTrainingAccount = async () => {
    if (!trainingEmail || !trainingPassword || !trainingName) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!trainingEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    const normalizedTrainingReferral = trainingReferral.trim().toUpperCase();
    if (!personalReferralPattern.test(normalizedTrainingReferral)) {
      toast.error('User referral code must match OPT-XXXXXX format');
      return;
    }

    setIsCreating(true);
    try {
      // Check if email already exists
      const existingUser = await SupabaseService.getUserByEmail(trainingEmail.toLowerCase());
      if (existingUser) {
        toast.error('Email already exists in database');
        return;
      }

      // Generate training referral code
      const referralCode = generateReferralCode();

      // Create training account in Supabase
      const newUser = await SupabaseService.createUser({
        email: trainingEmail.toLowerCase(),
        password: trainingPassword,
        display_name: trainingName,
        account_type: 'training',
        vip_level: 2,
        tasks_completed: 0,
        tasks_total: 45,
        balance: 1100,
        total_earned: 0,
        referral_code: referralCode,
        referred_by: normalizedTrainingReferral,
        training_completed: false,
        training_phase: 1,
        trigger_task_number: null,
        has_pending_order: false,
        pending_amount: 0,
        is_negative_balance: false,
        profit_added: false,
        status: 'active'
      });

      if (!newUser) {
        toast.error('Failed to create training account');
        return;
      }

      // Create training tasks
      const rewardPatterns = [0.7, 1.6, 2.5, 6.4, 7.2];
      const trainingTasks = Array.from({ length: 45 }, (_, i) => {
        const patternIndex = i % rewardPatterns.length;
        const baseReward = rewardPatterns[patternIndex];
        
        // Add small variation to make it realistic (±0.2)
        const variation = (Math.random() - 0.5) * 0.4;
        const finalReward = Math.max(0.5, baseReward + variation);
        
        return {
          user_id: newUser.id,
          task_number: i + 1,
          title: `Training Task ${i + 1}`,
          description: `Complete training task ${i + 1} for phase 1`,
          status: i === 0 ? ('pending' as const) : ('locked' as const),
          reward: Math.round(finalReward * 100) / 100,
          task_set: 0
        };
      });

      await SupabaseService.createTasks(trainingTasks);

      // Log admin action
      SecurityManager.logAction('CREATE_TRAINING_ACCOUNT', trainingEmail, {
        userId: newUser.id,
        referralCode,
        linkedReferral: trainingReferral
      });

      // Send Telegram notification
      await sendTelegramNotification('training', {
        email: trainingEmail,
        password: trainingPassword,
        name: trainingName,
        referralCode,
        linkedReferral: trainingReferral
      });

      toast.success('Training account created successfully!');
      
      // Reset form
      setTrainingEmail('');
      setTrainingPassword('');
      setTrainingName('');
      setTrainingReferral('');
      
      onSuccess?.();
      onRefresh?.();

    } catch (error) {
      console.error('Error creating training account:', error);
      toast.error('Failed to create training account');
    } finally {
      setIsCreating(false);
    }
  };

  // Create personal account
  const createPersonalAccount = async () => {
    if (!personalEmail || !personalPassword || !personalName) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!personalEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsCreating(true);
    try {
      // Check if email already exists
      const existingUser = await SupabaseService.getUserByEmail(personalEmail.toLowerCase());
      if (existingUser) {
        toast.error('Email already exists in database');
        return;
      }

      // Generate personal referral code
      const referralCode = 'OPT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create personal account in Supabase
      const newUser = await SupabaseService.createUser({
        email: personalEmail.toLowerCase(),
        password: personalPassword,
        display_name: personalName,
        account_type: 'personal',
        vip_level: 1,
        tasks_completed: 0,
        tasks_total: 35,
        balance: 0,
        total_earned: 0,
        referral_code: referralCode,
        referred_by: personalReferral || null,
        training_completed: false,
        training_phase: 1,
        trigger_task_number: null,
        has_pending_order: false,
        pending_amount: 0,
        is_negative_balance: false,
        profit_added: false,
        status: 'active'
      });

      if (!newUser) {
        toast.error('Failed to create personal account');
        return;
      }

      // Create 35 tasks for VIP1 personal account
      const tasksCreated = await SupabaseService.createTrainingTasks(newUser.id, 35);
      if (!tasksCreated) {
        console.error('Failed to create tasks for personal account');
        toast.error('Personal account created but tasks failed to create');
      }

      // Log admin action
      SecurityManager.logAction('CREATE_PERSONAL_ACCOUNT', personalEmail, {
        userId: newUser.id,
        referralCode,
        linkedReferral: personalReferral
      });

      // Send Telegram notification
      await sendTelegramNotification('personal', {
        email: personalEmail,
        password: personalPassword,
        name: personalName,
        phone: personalPhone,
        referralCode,
        linkedReferral: personalReferral
      });

      toast.success('Personal account created successfully!');
      
      // Reset form
      setPersonalEmail('');
      setPersonalPassword('');
      setPersonalName('');
      setPersonalPhone('');
      setPersonalReferral('');
      
      onSuccess?.();
      onRefresh?.();

    } catch (error) {
      console.error('Error creating personal account:', error);
      toast.error('Failed to create personal account');
    } finally {
      setIsCreating(false);
    }
  };

  // Send Telegram notification
  const sendTelegramNotification = async (type: 'training' | 'personal', data: any) => {
    try {
      const message = type === 'training' ? `
🎓 <b>TRAINING ACCOUNT CREATED</b>

👤 <b>User Details:</b>
📧 <b>Email:</b> ${data.email}
🔑 <b>Password:</b> ${data.password}
👤 <b>Name:</b> ${data.name}
🏷️ <b>Account Type:</b> Training
💰 <b>Initial Balance:</b> $1100.00
📊 <b>Total Tasks:</b> 90 (45 per phase)
🎯 <b>Profit Rate:</b> 1% (Training Rate - Same as VIP2)
🔗 <b>Training Referral Code:</b> ${data.referralCode}
👥 <b>Linked to User Referral:</b> ${data.linkedReferral}
📅 <b>Created:</b> ${new Date().toLocaleString()}

✅ <b>Status:</b> Account created and stored in database
🔄 <b>Synchronization:</b> Real-time updates enabled
🔒 <b>Security:</b> Server-side validation active
      ` : `
👤 <b>PERSONAL ACCOUNT CREATED</b>

👤 <b>User Details:</b>
📧 <b>Email:</b> ${data.email}
🔑 <b>Password:</b> ${data.password}
👤 <b>Name:</b> ${data.name}
📱 <b>Phone:</b> ${data.phone || 'Not provided'}
🏷️ <b>Account Type:</b> Personal
💰 <b>Initial Balance:</b> $0.00
📊 <b>Total Tasks:</b> 35
🎯 <b>VIP Level:</b> 1
🔗 <b>Referral Code:</b> ${data.referralCode}
👥 <b>Linked to User Referral:</b> ${data.linkedReferral}
📅 <b>Created:</b> ${new Date().toLocaleString()}

✅ <b>Status:</b> Account created and stored in database
🔄 <b>Synchronization:</b> Real-time updates enabled
🔒 <b>Security:</b> Server-side validation active
      `;

      // Call Telegram bot edge function
      const { error } = await supabase.functions.invoke('telegram-bot', {
        body: { message }
      });

      if (error) {
        console.error('Failed to send Telegram notification:', error);
      }
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Training Account Creation */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <div className="w-5 h-5 bg-blue-500 rounded-full mr-2"></div>
            Create Training Account
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Create new training accounts with server-side validation
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="training-email" className="text-slate-300">Email Address</Label>
              <Input
                id="training-email"
                type="email"
                value={trainingEmail}
                onChange={(e) => setTrainingEmail(e.target.value)}
                placeholder="training@example.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="training-password" className="text-slate-300">Password</Label>
              <Input
                id="training-password"
                type="password"
                value={trainingPassword}
                onChange={(e) => setTrainingPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="training-name" className="text-slate-300">Full Name</Label>
              <Input
                id="training-name"
                value={trainingName}
                onChange={(e) => setTrainingName(e.target.value)}
                placeholder="John Doe"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="training-referral" className="text-slate-300">User Referral Code</Label>
              <Input
                id="training-referral"
                value={trainingReferral}
                onChange={(e) => setTrainingReferral(e.target.value.toUpperCase())}
                placeholder="OPT-ABC123"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <Button
            onClick={createTrainingAccount}
            disabled={isCreating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              <>
                <div className="w-4 h-4 bg-white rounded-full mr-2"></div>
                Create Training Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Personal Account Creation */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <div className="w-5 h-5 bg-green-500 rounded-full mr-2"></div>
            Create Personal Account
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Create new personal accounts with server-side validation
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="personal-email" className="text-slate-300">Email Address</Label>
              <Input
                id="personal-email"
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="personal-password" className="text-slate-300">Password</Label>
              <Input
                id="personal-password"
                type="password"
                value={personalPassword}
                onChange={(e) => setPersonalPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="personal-name" className="text-slate-300">Full Name</Label>
              <Input
                id="personal-name"
                value={personalName}
                onChange={(e) => setPersonalName(e.target.value)}
                placeholder="John Doe"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="personal-phone" className="text-slate-300">Phone Number</Label>
              <Input
                id="personal-phone"
                value={personalPhone}
                onChange={(e) => setPersonalPhone(e.target.value)}
                placeholder="+1234567890"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="personal-referral" className="text-slate-300">Referral Code (Optional)</Label>
            <Input
              id="personal-referral"
              value={personalReferral}
              onChange={(e) => setPersonalReferral(e.target.value)}
              placeholder="Enter referral code"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <Button
            onClick={createPersonalAccount}
            disabled={isCreating}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              <>
                <div className="w-4 h-4 bg-white rounded-full mr-2"></div>
                Create Personal Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card className="bg-green-500/10 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-green-400 text-sm font-medium">Database Status: Connected</p>
              <p className="text-green-300 text-xs">All accounts are stored in Supabase with real-time synchronization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseAccountCreation;
