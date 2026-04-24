import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  UserX,
  Settings,
  DollarSign,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import supabaseService from '@/services/supabaseService';
import { TELEGRAM_CONFIG } from '../../config/telegram';

interface AdminControlsProps {
  onRefresh: () => void;
}

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
  }
};

// MIGRATION: Update existing tasks with new realistic rewards
const migrateExistingTasks = (email: string, tasks: any[]) => {
  const rewardPatterns = [0.7, 1.6, 2.5, 6.4, 7.2];
  
  return tasks.map((task, i) => {
    const patternIndex = i % rewardPatterns.length;
    const baseReward = rewardPatterns[patternIndex];
    
    // Add small variation to make it realistic (±0.2)
    const variation = (Math.random() - 0.5) * 0.4;
    const finalReward = Math.max(0.5, baseReward + variation); // Minimum $0.50
    
    return {
      ...task,
      reward: Math.round(finalReward * 100) / 100,
    };
  });
};

const AdminControls: React.FC<AdminControlsProps> = ({ onRefresh }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [profitMultiplier, setProfitMultiplier] = useState(6);
  const [resetEmail, setResetEmail] = useState('');

  const resetPersonalAccount = async () => {
    if (!resetEmail.trim()) {
      toast('Please enter an email address');
      return;
    }

    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      
      // Find personal account in localStorage
      const accountKey = 'opt_account_' + email;
      const accountData = localStorage.getItem(accountKey);
      
      if (accountData) {
        const account = JSON.parse(accountData);
        const userId = account.user?.id || account.id;
        
        // Check if Phase 1 is complete (35/35) to move to Phase 2
        const currentPhase = account.user?.training_phase || account.training_phase || 1;
        const tasksCompleted = account.user?.tasks_completed || account.tasks_completed || 0;
        const isPhase1Complete = currentPhase === 1 && tasksCompleted >= 35;
        const newPhase = isPhase1Complete ? 2 : 1;
        
        console.log(`[Personal Reset] Current phase: ${currentPhase}, Tasks: ${tasksCompleted}, IsPhase1Complete: ${isPhase1Complete}, NewPhase: ${newPhase}`);
        
        // Create fresh 35 tasks for the new phase with VIP1 rates (0.5%)
        const resetTasks = Array.from({ length: 35 }, (_, i) => {
          // VIP1 commission: 0.5% of product price
          const productPrice = Math.floor(Math.random() * 100) + 50; // $50-$150
          const commission = Math.round(productPrice * 0.005 * 100) / 100; // 0.5%
          
          return {
            id: `task-${Date.now()}-${i}`,
            user_id: userId,
            task_number: i + 1,
            title: `Personal Task ${i + 1} (Phase ${newPhase})`,
            description: `Complete personal task ${i + 1} for phase ${newPhase}`,
            status: i === 0 ? 'pending' : 'locked',
            reward: commission,
            created_at: new Date().toISOString()
          };
        });
        
        // Update user object
        const updatedUser = {
          ...account.user,
          tasks_completed: 0,
          training_phase: newPhase,
          training_progress: 0,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          trigger_task_number: null,
          profit_added: false,
          updated_at: new Date().toISOString()
        };
        
        // Save updated account
        localStorage.setItem(accountKey, JSON.stringify({
          ...account,
          user: updatedUser
        }));
        
        // Save new tasks
        if (userId) {
          const tasksKey = 'opt_tasks_' + userId;
          localStorage.setItem(tasksKey, JSON.stringify(resetTasks));
          console.log(`[Personal Reset] Created ${resetTasks.length} Phase ${newPhase} tasks for: ${email}, userId: ${userId}`);
        }
        
        // Update opt_user if currently logged in
        const currentUser = localStorage.getItem('opt_user');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          if (user.email.toLowerCase() === email && user.account_type === 'personal') {
            localStorage.setItem('opt_user', JSON.stringify(updatedUser));
          }
        }
        
        const phaseMessage = newPhase === 2 
          ? 'PHASE 2 ACTIVATED: Pending order will appear at task 28 (combination product)'
          : 'Phase 1 reset';
        
        toast.success(`Personal account reset to 0/35 - ${phaseMessage}. Balance and earnings preserved.`);
      } else {
        toast('Personal account not found in localStorage');
      }
      
      setResetEmail('');
      onRefresh();
    } catch (error) {
      console.error('Error resetting personal account:', error);
      toast.error('Failed to reset personal account');
    } finally {
      setIsResetting(false);
    }
  };

  const migrateAllTrainingAccounts = async () => {
    setIsResetting(true);
    try {
      let migratedCount = 0;
      
      // Search through all localStorage for training accounts
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('training_tasks_') || key.startsWith('opt_tasks_'))) {
          const tasksData = localStorage.getItem(key);
          if (tasksData) {
            try {
              const tasks = JSON.parse(tasksData);
              
              // Check if tasks need migration (old reward amounts)
              const needsMigration = tasks.some((task: any) => 
                task.reward && (task.reward > 10 || task.reward < 0.5)
              );
              
              if (needsMigration) {
                // Extract email from key
                const email = key.replace('training_tasks_', '').replace('opt_tasks_', '');
                const migratedTasks = migrateExistingTasks(email, tasks);
                localStorage.setItem(key, JSON.stringify(migratedTasks));
                migratedCount++;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      toast.success(`Migration Complete! Updated ${migratedCount} training accounts with new realistic rewards.`);
      onRefresh();
    } catch (error) {
      console.error('Error migrating accounts:', error);
      toast.error('Failed to migrate accounts');
    } finally {
      setIsResetting(false);
    }
  };

  const resetTrainingAccount = async () => {
    if (!resetEmail.trim()) {
      toast('Please enter an email address');
      return;
    }

    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      const accountKey = 'training_account_' + email;
      const tasksKey = 'training_tasks_' + email;
      
      console.log("Training account lookup key:", accountKey);
      
      // DEBUG: Search ALL localStorage keys for task data
      console.log('[Admin Reset] === SEARCHING ALL LOCALSTORAGE ===');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('task') || key.includes(email))) {
          const data = localStorage.getItem(key);
          if (data && data.length > 10) {
            try {
              const parsed = JSON.parse(data);
              if (Array.isArray(parsed)) {
                const completed = parsed.filter((t: any) => t.status === 'completed').length;
                console.log(`[Admin Reset] Key: ${key}, Type: Array, Length: ${parsed.length}, Completed: ${completed}`);
              } else if (parsed.tasks_completed !== undefined || parsed.training_progress !== undefined) {
                console.log(`[Admin Reset] Key: ${key}, tasks_completed: ${parsed.tasks_completed}, training_progress: ${parsed.training_progress}`);
              }
            } catch (e) {
              // Not JSON, skip
            }
          }
        }
      }
      console.log('[Admin Reset] === END SEARCH ===');
      
      // Try to find training account using consistent email-based key
      let trainingData = localStorage.getItem(accountKey);
      
      // CRITICAL: Also check opt_training_data_{email} which has the ACTUAL current progress
      // This is updated by saveState when tasks are completed
      const optTrainingDataKey = 'opt_training_data_' + email;
      const optTrainingData = localStorage.getItem(optTrainingDataKey);
      
      console.log("[Admin Reset] Checking opt_training_data key:", optTrainingDataKey, "Found:", !!optTrainingData);
      
      // Use opt_training_data if available (it has the real-time progress)
      let effectiveTrainingData = trainingData;
      if (optTrainingData) {
        effectiveTrainingData = optTrainingData;
        console.log("[Admin Reset] Using opt_training_data (has actual progress)");
      }
      
      if (!trainingData) {
        // Check if user exists but training account is missing
        console.log("Training account not found, checking if user exists...");
        
        // Search for any account with this email
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes(email) || key.includes('opt_training_'))) {
            const data = localStorage.getItem(key);
            if (data) {
              try {
                const parsed = JSON.parse(data);
                if (parsed.email === email) {
                  console.log("Found user data, creating training account...");
                  
                  // AUTO-CREATE training account for this email
                  const newTrainingAccount = {
                    email: email,
                    password: parsed.password || 'temp123',
                    assignedTo: parsed.assignedTo || 'Training User',
                    userReferralCode: parsed.userReferralCode || '',
                    trainingReferralCode: parsed.trainingReferralCode || `TRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    userEmail: email,
                    createdAt: new Date().toISOString(),
                    balance: 1100,
                    total_earned: 0,
                    tasks_completed: 0,
                    training_progress: 0,
                    training_phase: 1,
                    training_completed: false,
                    trigger_task_number: null,
                    has_pending_order: false,
                    pending_amount: 0,
                    is_negative_balance: false,
                    profit_added: false
                  };
                  
                  localStorage.setItem(accountKey, JSON.stringify(newTrainingAccount));
                  trainingData = JSON.stringify(newTrainingAccount);
                  console.log("Auto-created training account:", accountKey);
                  break;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
      
      if (!trainingData) {
        // If still not found, create a fresh training account
        console.log("Creating fresh training account for:", email);
        const freshTrainingAccount = {
          email: email,
          password: 'temp123',
          assignedTo: 'Training User',
          userReferralCode: '',
          trainingReferralCode: `TRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          userEmail: email,
          createdAt: new Date().toISOString(),
          balance: 1100,
          total_earned: 0,
          tasks_completed: 0,
          training_progress: 0,
          training_phase: 1,
          training_completed: false,
          trigger_task_number: null,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          profit_added: false
        };
        
        localStorage.setItem(accountKey, JSON.stringify(freshTrainingAccount));
        trainingData = JSON.stringify(freshTrainingAccount);
        console.log("Created fresh training account:", accountKey);
      }
      
      // Parse the effective data (either from training_account or opt_training_data)
      const trainingAcc = JSON.parse(effectiveTrainingData || trainingData || '{}');
      
      // DEBUG: Log the full data to see what's there
      console.log('[Admin Reset] Full training data:', trainingAcc);
      console.log('[Admin Reset] Data source:', optTrainingData ? 'opt_training_data' : (trainingData ? 'training_account' : 'fallback'));
      
      // Get the proper user identifier - prefer user.id if available, otherwise use email
      const userId = trainingAcc.user?.id || trainingAcc.id || email;
      
      // Check if user completed Phase 1 (45/45 tasks) - then move to Phase 2
      // Handle both nested (trainingAcc.user) and direct (trainingAcc) structures
      const userData = trainingAcc.user || trainingAcc;
      const currentPhase = userData.training_phase || 1;
      const tasksCompleted = userData.tasks_completed || 0;
      const trainingProgress = userData.training_progress || 0;
      
      // ALSO check if user object exists with different field names
      const altTasksCompleted = trainingAcc.user?.tasks_completed || 0;
      const altTrainingProgress = trainingAcc.user?.training_progress || 0;
      
      // CRITICAL: Check ACTUAL tasks from localStorage to get real completion count
      // The opt_training_data might have stale data, so count completed tasks directly
      // Note: tasksKey already defined above
      const optTasksKey = 'opt_tasks_' + userId;
      let actualCompletedTasks = 0;
      let tasksFound = false;
      
      // Try multiple task keys - log each attempt
      const taskKeys = [tasksKey, optTasksKey, 'opt_tasks_' + email, 'training_tasks_' + email];
      console.log('[Admin Reset] Searching for tasks in keys:', taskKeys);
      
      for (const key of taskKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          console.log(`[Admin Reset] Found data in key: ${key}, length: ${data.length}`);
          try {
            const tasks = JSON.parse(data);
            console.log(`[Admin Reset] Parsed ${tasks.length} tasks from ${key}`);
            console.log(`[Admin Reset] First task sample:`, tasks[0]);
            const completed = tasks.filter((t: any) => t.status === 'completed').length;
            console.log(`[Admin Reset] Completed tasks in ${key}: ${completed}`);
            if (completed > actualCompletedTasks) {
              actualCompletedTasks = completed;
              tasksFound = true;
            }
          } catch (e) {
            console.log(`[Admin Reset] Error parsing ${key}:`, e);
          }
        } else {
          console.log(`[Admin Reset] No data in key: ${key}`);
        }
      }
      
      console.log(`[Admin Reset] Final actual completed tasks: ${actualCompletedTasks}, found: ${tasksFound}`);
      
      // PHASE 1 COMPLETE DETECTION: Use HIGHEST value from all sources
      const effectiveTasks = Math.max(tasksCompleted, altTasksCompleted, actualCompletedTasks);
      const effectiveProgress = Math.max(trainingProgress, altTrainingProgress, actualCompletedTasks);
      const isPhase1Complete = currentPhase === 1 && (effectiveTasks >= 45 || effectiveProgress >= 45);
      const newPhase = isPhase1Complete ? 2 : 1;
      
      console.log(`[Admin Reset] Current phase: ${currentPhase}, Tasks: ${effectiveTasks}, Progress: ${effectiveProgress}, IsPhase1Complete: ${isPhase1Complete}, NewPhase: ${newPhase}`);
      
      // Reset tasks to 0/45 - create fresh tasks REALISTIC PRODUCT-BASED REWARDS
      const rewardPatterns = [0.7, 1.6, 2.5, 6.4, 7.2];
      const resetTasks = Array.from({ length: 45 }, (_, i) => {
        const patternIndex = i % rewardPatterns.length;
        const baseReward = rewardPatterns[patternIndex];
        
        // Add small variation to make it realistic (±0.2)
        const variation = (Math.random() - 0.5) * 0.4;
        const finalReward = Math.max(0.5, baseReward + variation); // Minimum $0.50
        
        return {
          id: `task-${Date.now()}-${i}`,
          user_id: userId,
          task_number: i + 1,
          title: `Training Task ${i + 1} (Phase ${newPhase})`,
          description: `Complete training task ${i + 1} for phase ${newPhase}`,
          status: i === 0 ? 'pending' : 'locked', // First task pending, rest locked
          reward: Math.round(finalReward * 100) / 100,
          created_at: new Date().toISOString(),
          completed_at: null,
          task_set: 0,
        };
      });
      
      console.log("[Admin] Resetting tasks for userId:", userId);
      
      // Clear ALL possible task storage keys to ensure complete reset
      const possibleTaskKeys = [
        'training_tasks_' + email,
        'opt_tasks_' + userId,
        'opt_tasks_' + email,
        'tasks_' + userId,
        'tasks_' + email
      ];
      
      possibleTaskKeys.forEach(key => {
        localStorage.setItem(key, JSON.stringify(resetTasks));
        console.log("[Admin] Reset tasks in key:", key);
      });
      
      // Also remove any legacy keys that might exist
      // NOTE: Do NOT remove 'training_tasks_' as it's the PRIMARY key used by login
      // Only remove truly legacy/old format keys that are no longer used
      localStorage.removeItem('old_training_tasks_' + email);
      localStorage.removeItem('legacy_tasks_' + email);
      
      // Update training account with reset progress
      const updatedTrainingAcc = {
        ...trainingAcc,
        id: userId,
        tasks_completed: 0,
        training_progress: 0,
        training_phase: newPhase, // Move to Phase 2 if Phase 1 complete, else Phase 1
        training_completed: false,
        trigger_task_number: null,
        has_pending_order: false,
        pending_amount: 0,
        is_negative_balance: false,
        profit_added: false,
        reset_at: new Date().toISOString(),
        reset_by: 'admin',
        reset_to_phase: newPhase
      };
      
      localStorage.setItem(accountKey, JSON.stringify({
        ...trainingAcc,
        user: updatedTrainingAcc
      }));
      
      // Also update opt_training_data_ key if it exists
      // Note: optTrainingDataKey and optTrainingData already declared at start of function
      const existingOptData = localStorage.getItem(optTrainingDataKey);
      if (existingOptData) {
        const optData = JSON.parse(existingOptData);
        const resetOptData = {
          ...optData,
          id: userId,
          tasks_completed: 0,
          training_progress: 0,
          training_phase: newPhase,
          training_completed: false,
          trigger_task_number: null,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          profit_added: false
        };
        localStorage.setItem(optTrainingDataKey, JSON.stringify(resetOptData));
        console.log("[Admin] Reset opt_training_data for:", email);
      }
      
      // Also update opt_training_ key (login credentials)
      const trainingKey = 'opt_training_' + email;
      const trainingLoginData = localStorage.getItem(trainingKey);
      if (trainingLoginData) {
        const loginData = JSON.parse(trainingLoginData);
        const resetLoginData = {
          ...loginData,
          id: userId,
          tasks_completed: 0,
          training_progress: 0,
          training_phase: newPhase,
          training_completed: false,
          trigger_task_number: null,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          profit_added: false
        };
        localStorage.setItem(trainingKey, JSON.stringify(resetLoginData));
        console.log("[Admin] Reset opt_training login data for:", email);
      }
      
      // Also update opt_user if this training account is currently logged in
      const currentUser = localStorage.getItem('opt_user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.email === email && user.account_type === 'training') {
          const resetUser = {
            ...user,
            id: userId,
            tasks_completed: 0,
            training_progress: 0,
            training_phase: 1,
            training_completed: false,
            trigger_task_number: null,
            has_pending_order: false,
            pending_amount: 0,
            is_negative_balance: false,
            profit_added: false
          };
          localStorage.setItem('opt_user', JSON.stringify(resetUser));
          
          // Also reset the opt_tasks for the current user
          localStorage.setItem('opt_tasks_' + userId, JSON.stringify(resetTasks));
          
          // Broadcast event to notify all tabs/components of the reset
          window.dispatchEvent(new Event('training-account-reset'));
          console.log('[Admin] Broadcast training-account-reset event for current user');
        }
      }
      
      toast.success(`Training account reset successfully - Moved to Phase ${newPhase} (0/45 tasks), balance and earnings preserved`);
      
      // Send Telegram notification for training account reset
      const telegramMessage = `
🔄 <b>TRAINING ACCOUNT HAS BEEN RESET SUCCESSFULLY</b>

👤 <b>Account Details:</b>
📧 <b>Email:</b> ${email}
👤 <b>Name:</b> ${trainingAcc.assignedTo || trainingAcc.display_name || 'Training User'}
🏷️ <b>Account Type:</b> Training
🔗 <b>Referral Code:</b> ${trainingAcc.trainingReferralCode || 'N/A'}

📊 <b>Reset Details:</b>
📈 <b>Previous Phase:</b> Phase ${currentPhase}
📈 <b>Previous Progress:</b> ${effectiveTasks}/45 tasks completed
📈 <b>New Phase:</b> Phase ${newPhase}
📈 <b>New Progress:</b> 0/45 tasks
💰 <b>Balance:</b> $${(trainingAcc.balance || 1100).toFixed(2)} (preserved)
💰 <b>Total Earned:</b> $${(trainingAcc.total_earned || 0).toFixed(2)} (preserved)

⚙️ <b>Admin Action:</b> Training Account Reset
📅 <b>Reset Timestamp:</b> ${new Date().toLocaleString()}

📋 <b>Reset Summary:</b>
• Tasks reset to 0/45 for Phase ${newPhase}
• Balance and earnings preserved
• Combination orders cleared
• User can continue training from Phase ${newPhase}

🔗 <b>Contact User Support:</b> https://t.me/EARNINGSLLCONLINECS1
      `.trim();

      try {
        await sendTelegramNotification(telegramMessage, 10000);
      } catch (telegramError) {
        console.error('[Admin Reset] Telegram notification failed:', telegramError);
      }
      
      setResetEmail('');
      onRefresh();
    } catch (error) {
      console.error('Error resetting training account:', error);
      toast.error('Failed to reset training account');
    } finally {
      setIsResetting(false);
    }
  };

  const removePendingOrder = async () => {
    if (!resetEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      const combinationAmount = 210;
      const profitAmount = combinationAmount * 6; // 6x profit = $1260
      
      // First, try to find and update in Supabase
      const { data: supabaseUser, error: supabaseError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('account_type', 'training')
        .single();
      
      if (supabaseError && supabaseError.code !== 'PGRST116') {
        console.error('Supabase error:', supabaseError);
      }
      
      if (supabaseUser) {
        // Calculate final balance: current balance + pending amount (deducted) + 6x profit
        // When pending was created, balance was reduced by $210
        // Now we add back the $210 + $1260 profit = $1470 total
        const currentBalance = supabaseUser.balance || 0;
        const finalBalance = currentBalance + combinationAmount + profitAmount;
        
        // Update in Supabase
        const { error: updateError } = await supabase
          .from('users')
          .update({
            has_pending_order: false,
            pending_amount: 0,
            is_negative_balance: false,
            profit_added: true,
            balance: finalBalance,
            total_earned: (supabaseUser.total_earned || 0) + profitAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', supabaseUser.id);
        
        if (updateError) {
          console.error('Error updating Supabase:', updateError);
          toast.error('Failed to clear pending order in database');
          setIsResetting(false);
          return;
        }
        
        // Also update localStorage if exists
        const trainingDataKey = 'opt_training_data_' + email;
        const trainingData = localStorage.getItem(trainingDataKey);
        if (trainingData) {
          const trainingAcc = JSON.parse(trainingData);
          localStorage.setItem(trainingDataKey, JSON.stringify({
            ...trainingAcc,
            has_pending_order: false,
            pending_amount: 0,
            is_negative_balance: false,
            profit_added: true,
            balance: finalBalance,
            total_earned: (trainingAcc.total_earned || 0) + profitAmount,
            cleared_at: new Date().toISOString(),
            cleared_by: 'admin'
          }));
        }
        
        // Update opt_user if currently logged in
        const currentUser = localStorage.getItem('opt_user');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          if (user.email === email && user.account_type === 'training') {
            localStorage.setItem('opt_user', JSON.stringify({
              ...user,
              has_pending_order: false,
              pending_amount: 0,
              is_negative_balance: false,
              profit_added: true,
              balance: finalBalance,
              total_earned: (user.total_earned || 0) + profitAmount
            }));
          }
        }
        
        toast.success(`✅ PENDING ORDER CLEARED!\n6x Profit: $${profitAmount} added\nNew Balance: $${finalBalance}\nUser can continue tasks.`);
        console.log(`[Admin] Cleared pending order for ${email} in Supabase. Added $${profitAmount}, new balance: $${finalBalance}`);
        setResetEmail('');
        onRefresh();
        setIsResetting(false);
        return;
      }
      
      // If not in Supabase, try localStorage as fallback
      const trainingDataKey = 'opt_training_data_' + email;
      const trainingData = localStorage.getItem(trainingDataKey);
      
      if (trainingData) {
        const trainingAcc = JSON.parse(trainingData);
        
        const currentBalance = trainingAcc.balance || 0;
        const finalBalance = currentBalance + combinationAmount + profitAmount;
        
        localStorage.setItem(trainingDataKey, JSON.stringify({
          ...trainingAcc,
          balance: finalBalance,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          profit_added: true,
          total_earned: (trainingAcc.total_earned || 0) + profitAmount,
          cleared_at: new Date().toISOString(),
          cleared_by: 'admin'
        }));
        
        // Update other localStorage keys
        const trainingKey = 'opt_training_' + email;
        const trainingLoginData = localStorage.getItem(trainingKey);
        if (trainingLoginData) {
          const loginData = JSON.parse(trainingLoginData);
          localStorage.setItem(trainingKey, JSON.stringify({
            ...loginData,
            balance: finalBalance,
            has_pending_order: false,
            pending_amount: 0,
            is_negative_balance: false,
            profit_added: true,
            total_earned: (loginData.total_earned || 0) + profitAmount
          }));
        }
        
        const currentUser = localStorage.getItem('opt_user');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          if (user.email === email && user.account_type === 'training') {
            localStorage.setItem('opt_user', JSON.stringify({
              ...user,
              balance: finalBalance,
              has_pending_order: false,
              pending_amount: 0,
              is_negative_balance: false,
              profit_added: true,
              total_earned: (user.total_earned || 0) + profitAmount
            }));
          }
        }
        
        toast.success(`✅ PENDING ORDER CLEARED!\n6x Profit: $${profitAmount} added\nNew Balance: $${finalBalance}\nUser can continue tasks.`);
        console.log(`[Admin] Cleared pending order for ${email} in localStorage. Added $${profitAmount}, new balance: $${finalBalance}`);
        setResetEmail('');
        onRefresh();
        setIsResetting(false);
        return;
      }
      
      toast.error('Training account not found in Supabase or localStorage');
      setIsResetting(false);
    } catch (error) {
      console.error('Error removing pending order:', error);
      toast.error('Failed to remove pending order: ' + (error as Error).message);
    } finally {
      setIsResetting(false);
    }
  };

  const completeTrainingAndTransfer = async () => {
    if (!resetEmail.trim()) {
      toast.error('Please enter a training account email address');
      return;
    }

    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      
      // First, try to find in Supabase
      const { data: supabaseUser, error: supabaseError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('account_type', 'training')
        .single();
      
      if (supabaseError && supabaseError.code !== 'PGRST116') {
        console.error('Supabase error:', supabaseError);
      }
      
      if (supabaseUser) {
        // Use the new SupabaseService function
        const result = await SupabaseService.completeTrainingAndTransferBalance(supabaseUser.id);
        
        if (result.success) {
          toast.success(`✅ Training Completed!\nTransferred: $${result.transferredAmount?.toFixed(2)} to personal account`);
          console.log('[Admin] Training completed and balance transferred:', result);
          setResetEmail('');
          onRefresh();
        } else {
          toast.error('Failed to complete training: ' + result.error);
        }
        setIsResetting(false);
        return;
      }
      
      // If not in Supabase, check localStorage
      const trainingDataKey = 'opt_training_data_' + email;
      const trainingData = localStorage.getItem(trainingDataKey);
      
      if (!trainingData) {
        toast.error('Training account not found in database or localStorage');
        setIsResetting(false);
        return;
      }
      
      const trainingAcc = JSON.parse(trainingData);
      const trainingBalance = trainingAcc.balance || trainingAcc.user?.balance || 0;
      
      if (trainingBalance <= 0) {
        toast.error('No balance to transfer from training account');
        setIsResetting(false);
        return;
      }
      
      // For localStorage accounts, we can only update local state
      // Mark training as completed
      trainingAcc.training_completed = true;
      trainingAcc.user.training_completed = true;
      localStorage.setItem(trainingDataKey, JSON.stringify(trainingAcc));
      
      toast.success(`✅ Training marked as completed (localStorage only)\nBalance would be: $${trainingBalance.toFixed(2)}\n\nNote: For full transfer, account must be in Supabase database.`);
      console.log('[Admin] Training marked complete (localStorage):', trainingAcc);
      setResetEmail('');
      onRefresh();
      setIsResetting(false);
    } catch (error) {
      console.error('Error completing training:', error);
      toast.error('Failed to complete training: ' + (error as Error).message);
      setIsResetting(false);
    }
  };

  const triggerPendingOrder = async () => {
    if (!resetEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      const combinationAmount = 210; // Fixed amount for combination product
      
      // First, try to find in Supabase
      const { data: supabaseUser, error: supabaseError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('account_type', 'training')
        .single();
      
      if (supabaseError && supabaseError.code !== 'PGRST116') {
        console.error('Supabase error:', supabaseError);
      }
      
      if (supabaseUser) {
        // Check if in phase 2 - MANDATORY
        if (supabaseUser.training_phase !== 2) {
          toast.error(`MUST BE IN PHASE 2! Current phase: ${supabaseUser.training_phase || 1}. Complete Phase 1 first (45/45 tasks).`);
          setIsResetting(false);
          return;
        }
        
        // Check if already has pending order
        if (supabaseUser.has_pending_order) {
          toast.error('Training account already has a pending order!');
          setIsResetting(false);
          return;
        }
        
        // Calculate new balance for pending order
        const currentBalance = supabaseUser.balance || 0;
        const newBalance = currentBalance - combinationAmount;
        
        // Update Supabase - always Phase 2 for pending order
        const { error: updateError } = await supabase
          .from('users')
          .update({
            training_phase: 2,
            has_pending_order: true,
            pending_amount: combinationAmount,
            is_negative_balance: true,
            trigger_task_number: 31,
            balance: newBalance
          })
          .eq('id', supabaseUser.id);
        
        // Update opt_user if currently logged in
        const currentUser = localStorage.getItem('opt_user');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          if (user.email === email && user.account_type === 'training') {
            localStorage.setItem('opt_user', JSON.stringify({
              ...user,
              has_pending_order: true,
              pending_amount: combinationAmount,
              is_negative_balance: true,
              trigger_task_number: 31,
              balance: newBalance
            }));
          }
        }
        
        toast.success(`✅ PENDING ORDER TRIGGERED FOR PHASE 2!\nBalance: -$${combinationAmount}\nTasks will be LOCKED until cleared.`);
        console.log(`[Admin] Triggered pending order for ${email} in Supabase. Amount: $${combinationAmount}`);
        setResetEmail('');
        onRefresh();
        setIsResetting(false);
        return;
      }
      
      // If not in Supabase, try localStorage as fallback
      const trainingDataKey = 'opt_training_data_' + email;
      const trainingData = localStorage.getItem(trainingDataKey);
      
      if (trainingData) {
        const trainingAcc = JSON.parse(trainingData);
        
        // Check if in phase 2 - MANDATORY
        if (trainingAcc.training_phase !== 2) {
          toast.error(`MUST BE IN PHASE 2! Current phase: ${trainingAcc.training_phase || 1}. Complete Phase 1 first (45/45 tasks).`);
          setIsResetting(false);
          return;
        }
        
        // Check if already has pending order
        if (trainingAcc.has_pending_order) {
          toast.error('Training account already has a pending order!');
          setIsResetting(false);
          return;
        }
        
        const updatedTrainingAcc = {
          ...trainingAcc,
          has_pending_order: true,
          pending_amount: combinationAmount,
          is_negative_balance: true,
          trigger_task_number: 31,
          balance: (trainingAcc.balance || 0) - combinationAmount,
          pending_triggered_at: new Date().toISOString(),
          pending_triggered_by: 'admin'
        };
        
        localStorage.setItem(trainingDataKey, JSON.stringify(updatedTrainingAcc));
        
        // Update other localStorage keys
        const trainingKey = 'opt_training_' + email;
        const trainingLoginData = localStorage.getItem(trainingKey);
        if (trainingLoginData) {
          const loginData = JSON.parse(trainingLoginData);
          localStorage.setItem(trainingKey, JSON.stringify({
            ...loginData,
            has_pending_order: true,
            pending_amount: combinationAmount,
            is_negative_balance: true,
            trigger_task_number: 31,
            balance: (loginData.balance || 0) - combinationAmount
          }));
        }
        
        const currentUser = localStorage.getItem('opt_user');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          if (user.email === email && user.account_type === 'training') {
            localStorage.setItem('opt_user', JSON.stringify({
              ...user,
              has_pending_order: true,
              pending_amount: combinationAmount,
              is_negative_balance: true,
              trigger_task_number: 31,
              balance: (user.balance || 0) - combinationAmount
            }));
          }
        }
        
        toast.success(`✅ PENDING ORDER TRIGGERED FOR PHASE 2!\nBalance: -$${combinationAmount}\nTasks will be LOCKED until cleared.`);
        console.log(`[Admin] Triggered pending order for ${email} in localStorage. Amount: $${combinationAmount}`);
        setResetEmail('');
        onRefresh();
        setIsResetting(false);
        return;
      }
      
      toast.error('Training account not found in Supabase or localStorage. Please check the email address.');
      setIsResetting(false);
    } catch (error) {
      console.error('Error triggering pending order:', error);
      toast.error('Failed to trigger pending order: ' + (error as Error).message);
    } finally {
      setIsResetting(false);
    }
  };

  const fixBalance = () => {
    if (!resetEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    const email = resetEmail.trim().toLowerCase();
    const trainingDataKey = 'opt_training_data_' + email;
    const trainingData = localStorage.getItem(trainingDataKey);
    
    if (!trainingData) {
      toast.error('Training account not found');
      return;
    }

    const trainingAcc = JSON.parse(trainingData);
    
    // Calculate correct balance:
    // Total Earned includes all task earnings
    // Balance should be: Total Earned - Pending Amount + (6x Profit if pending cleared)
    const totalEarned = trainingAcc.total_earned || 0;
    const pendingAmount = trainingAcc.pending_amount || 0;
    const hasPending = trainingAcc.has_pending_order || false;
    
    let correctBalance = totalEarned;
    
    if (hasPending && pendingAmount > 0) {
      // If there's a pending order, the balance was deducted by pendingAmount
      // So current balance = totalEarned - pendingAmount (negative)
      correctBalance = totalEarned - pendingAmount;
    }
    
    // Update the training data
    trainingAcc.balance = correctBalance;
    localStorage.setItem(trainingDataKey, JSON.stringify(trainingAcc));
    
    // Also update login key
    const trainingKey = 'opt_training_' + email;
    const loginData = localStorage.getItem(trainingKey);
    if (loginData) {
      const login = JSON.parse(loginData);
      login.balance = correctBalance;
      localStorage.setItem(trainingKey, JSON.stringify(login));
    }
    
    toast.success(`Balance fixed: $${correctBalance.toFixed(2)} (based on Total Earned: $${totalEarned})`);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Controls</h2>
          <p className="text-slate-400">Manage training system and user accounts</p>
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Reset Controls */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <RotateCcw className="w-5 h-5 mr-2 text-orange-500" />
              Account Reset Controls
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Reset personal and training accounts
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                User Email Address
              </label>
              <Input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={resetPersonalAccount}
                disabled={isResetting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4 mr-2" />
                    Reset Personal Account
                  </>
                )}
              </Button>

              <Button
                onClick={resetTrainingAccount}
                disabled={isResetting}
                variant="outline"
                className="border-purple-600 text-purple-400 hover:bg-purple-700"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Training Account
                  </>
                )}
              </Button>

              <Button
                onClick={completeTrainingAndTransfer}
                disabled={isResetting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Training & Transfer Balance
                  </>
                )}
              </Button>
            </div>

            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-orange-400 text-sm font-medium">Reset Effects:</p>
                  <ul className="text-orange-300 text-xs space-y-1 mt-1">
                    <li>• Personal: Tasks reset to 0/35, balance & earnings preserved</li>
                    <li>• Training: Tasks reset to 0/45, balance & earnings preserved</li>
                    <li>• All progress and pending orders cleared</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-emerald-400 text-sm font-medium">Complete Training & Transfer:</p>
                  <ul className="text-emerald-300 text-xs space-y-1 mt-1">
                    <li>• Transfers ALL training balance to linked personal account</li>
                    <li>• Marks training as completed on both accounts</li>
                    <li>• Creates transaction records for the transfer</li>
                    <li>• Training account balance will be set to $0</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Controls */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="w-5 h-5 mr-2 text-green-500" />
              System Controls
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Configure training system parameters
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Combination Product Profit
              </label>
              <div className="flex items-center space-x-3">
                <Input
                  type="number"
                  value={6}
                  disabled
                  className="bg-slate-700 border-slate-600 text-white w-24 opacity-60"
                />
                <span className="text-slate-400 text-sm">x (Fixed for combo clearance)</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                6x profit automatically applied when clearing combination orders
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* TEST: Simple migration button */}
              <button
                onClick={() => {
                  alert('Migration button clicked!');
                  console.log('Migration test');
                }}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🔄 TEST: Migrate All Training Accounts
              </button>
              
              <Button
                onClick={triggerPendingOrder}
                disabled={isResetting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Triggering...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Trigger Pending Order (P2)
                  </>
                )}
              </Button>

              <Button
                onClick={removePendingOrder}
                disabled={isResetting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Removing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Remove Pending Order
                  </>
                )}
              </Button>

              <Button
                onClick={fixBalance}
                disabled={isResetting}
                variant="outline"
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Fix Balance (Recalculate)
              </Button>

              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Training Analytics
              </Button>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-green-400 text-sm font-medium">System Features:</p>
                  <ul className="text-green-300 text-xs space-y-1 mt-1">
                    <li>• Training accounts: 2-phase system (45/45 each)</li>
                    <li>• Combination products: Auto-trigger at tasks 19/24/31</li>
                    <li>• 6x profit system: Fixed for combination clearance</li>
                    <li>• Task pausing: During pending orders</li>
                    <li>• Withdrawal blocking: During training</li>
                    <li>• Referral tracking: Link accounts to users</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="w-5 h-5 mr-2 text-yellow-500" />
            Admin Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-yellow-400 mb-2">Training Account Flow:</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Phase 1: Complete 45/45 tasks normally</li>
                <li>• Phase 2: Complete another 45/45 tasks</li>
                <li>• Auto-trigger at task 31 in Phase 2 ONLY</li>
                <li>• Negative balance until cleared</li>
                <li>• 6x profit added after clearing</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">Personal Account Flow:</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• 1% profit transfer after training (training earnings moved to personal account)</li>
                <li>• Withdrawal restrictions during training</li>
                <li>• Separate balance tracking</li>
                <li>• No combination products</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug / Testing Section */}
      <Card className="bg-slate-900/50 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Debug & Testing Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              onClick={async () => {
                // Try to get the currently logged-in user with email
                let user = JSON.parse(localStorage.getItem('optimize_user') || '{}');
                let userEmail = user?.email;
                
                // If no email found, try training_account
                if (!userEmail) {
                  const trainingAccount = JSON.parse(localStorage.getItem('training_account') || '{}');
                  if (trainingAccount?.email) {
                    user = trainingAccount;
                    userEmail = trainingAccount.email;
                  }
                }
                
                // If still no email, try current_user
                if (!userEmail) {
                  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
                  if (currentUser?.email) {
                    user = currentUser;
                    userEmail = currentUser.email;
                  }
                }
                
                // Try to find any training account with email
                if (!userEmail) {
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith('training_') && key.includes('@')) {
                      const account = JSON.parse(localStorage.getItem(key) || '{}');
                      if (account?.email) {
                        user = account;
                        userEmail = account.email;
                        break;
                      }
                    }
                  }
                }
                
                const currentBalance = user.balance || 1100;
                const triggerTask = Math.random() < 0.5 ? 31 : 32;
                
                user.has_pending_order = true;
                user.pending_amount = 210;
                user.trigger_task_number = triggerTask;
                // Subtract 210 from current balance (don't overwrite it!)
                user.balance = currentBalance - 210;
                user.profit_added = false;
                user.training_phase = 2;
                user.pending_product = {
                  name: `Premium Combination Product - Task ${triggerTask}`,
                  brand: 'Optimize',
                  price: 210,
                  category: 'Premium',
                  image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
                };
                
                // Save to ALL localStorage keys for consistency
                localStorage.setItem('optimize_user', JSON.stringify(user));
                localStorage.setItem('training_account', JSON.stringify(user));
                localStorage.setItem('current_user', JSON.stringify(user));
                
                // Save to email-specific keys
                if (userEmail) {
                  localStorage.setItem(`training_${userEmail}`, JSON.stringify(user));
                  localStorage.setItem(`optimize_user_${userEmail}`, JSON.stringify(user));
                }
                
                // ALSO sync to Supabase for cross-device persistence
                if (user.id && user.id !== 'local-admin') {
                  try {
                    await supabaseService.syncUserBalance(user.id, user.balance, user.total_earned || 0);
                    console.log('[Simulate Pending] Balance synced to Supabase:', user.balance);
                  } catch (e) {
                    console.log('[Simulate Pending] Supabase sync failed (offline)');
                  }
                }
                
                alert(`Pending order simulated at Task ${triggerTask}!\n\nEmail: ${userEmail || 'Unknown'}\nPrevious Balance: $${currentBalance.toFixed(2)}\nPending Amount: -$210\nNew Balance: $${user.balance.toFixed(2)}\n\nGo to Tasks page to see the Combination Product!`);
              }}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Simulate Pending Order
            </Button>
            
            <Button
              variant="outline"
              className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              onClick={() => {
                // Clear pending order (admin action simulation)
                const user = JSON.parse(localStorage.getItem('optimize_user') || localStorage.getItem('training_account') || '{}');
                user.has_pending_order = false;
                user.pending_amount = 0;
                user.is_negative_balance = false;
                // Keep trigger_task_number and pending_product for claim
                localStorage.setItem('optimize_user', JSON.stringify(user));
                alert('Pending order cleared by admin!\n\nGo to Tasks page to see "Claim 6x Profit" modal.');
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Simulate Admin Clear
            </Button>
            
            <Button
              variant="outline"
              className="bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
              onClick={() => {
                // Reset everything
                const user = JSON.parse(localStorage.getItem('optimize_user') || localStorage.getItem('training_account') || '{}');
                user.has_pending_order = false;
                user.pending_amount = 0;
                user.trigger_task_number = null;
                user.balance = 1100;
                user.profit_added = false;
                user.pending_product = null;
                localStorage.setItem('optimize_user', JSON.stringify(user));
                alert('Reset complete!\n\nBalance: $1100\nNo pending orders.');
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Test State
            </Button>
          </div>
          
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-400/80">
              <strong>Test Flow:</strong> 1) Click "Simulate Pending Order" → 2) Go to Tasks (see red modal) → 3) Click "Simulate Admin Clear" → 4) Go to Tasks (see green "Claim 6x Profit" modal) → 5) Click claim button → Profit added!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminControls;
