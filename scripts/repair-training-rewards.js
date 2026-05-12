// Script to repair training account rewards for ronika32@gmail.com
// This account has 45/45 completed but balance still 1100 and total earned 0

import { createClient } from '@supabase/supabase-js';

async function repairTrainingRewards() {
  const email = 'ronika32@gmail.com';

  // You need to provide these values
  const supabaseUrl = 'YOUR_SUPABASE_URL_HERE';
  const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY_HERE';

  if (supabaseUrl === 'YOUR_SUPABASE_URL_HERE' || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
    console.error('Please update the script with your Supabase URL and Service Role Key');
    console.error('Edit this file and replace:');
    console.error('  - YOUR_SUPABASE_URL_HERE with your actual Supabase URL');
    console.error('  - YOUR_SERVICE_ROLE_KEY_HERE with your actual Service Role Key');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Repairing training rewards for:', email);

  try {
    // STEP 1: Find the user by email
    console.log('STEP 1: Finding user by email');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      process.exit(1);
    }

    console.log('User found:', user.id, 'account_type:', user.account_type);

    // STEP 2: Find the training account
    console.log('STEP 2: Finding training account');
    const { data: trainingAccount, error: trainingError } = await supabase
      .from('training_accounts')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (trainingError || !trainingAccount) {
      console.error('Training account not found:', trainingError);
      process.exit(1);
    }

    console.log('Training account found:', trainingAccount.id);
    console.log('Current amount:', trainingAccount.amount);
    console.log('Current task_number:', trainingAccount.task_number);
    console.log('Current commission:', trainingAccount.commission);

    // STEP 3: Get all completed tasks for this user
    console.log('STEP 3: Getting completed tasks');
    const { data: completedTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('task_number, reward, status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('task_number', { ascending: true });

    if (tasksError) {
      console.error('Error fetching completed tasks:', tasksError);
      process.exit(1);
    }

    console.log('Completed tasks found:', completedTasks.length);

    if (completedTasks.length === 0) {
      console.error('No completed tasks found for this user');
      process.exit(1);
    }

    // STEP 4: Calculate total rewards
    console.log('STEP 4: Calculating total rewards');
    const totalReward = completedTasks.reduce((sum, task) => sum + (task.reward || 0), 0);
    console.log('Total reward from completed tasks:', totalReward);
    console.log('Task rewards:', completedTasks.map(t => `Task ${t.task_number}: $${t.reward}`));

    // STEP 5: Calculate expected balance
    const INITIAL_BALANCE = 1100;
    const expectedBalance = INITIAL_BALANCE + totalReward;
    console.log('Expected balance:', expectedBalance);
    console.log('Current balance:', trainingAccount.amount);
    console.log('Difference:', expectedBalance - trainingAccount.amount);

    // STEP 6: Update training_accounts table
    console.log('STEP 5: Updating training_accounts table');
    const { error: updateError } = await supabase
      .from('training_accounts')
      .update({
        amount: expectedBalance,
        task_number: completedTasks.length + 1, // Next task to complete
        commission: totalReward
      })
      .eq('id', trainingAccount.id);

    if (updateError) {
      console.error('Failed to update training_accounts:', updateError);
      process.exit(1);
    }

    console.log('Training accounts updated successfully');
    console.log('New amount:', expectedBalance);
    console.log('New task_number:', completedTasks.length + 1);
    console.log('New commission:', totalReward);

    // STEP 7: Update users table stats
    console.log('STEP 6: Updating users table stats');
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        tasks_completed: completedTasks.length,
        training_progress: Math.min(100, Math.round((completedTasks.length / 45) * 100))
      })
      .eq('id', user.id);

    if (userUpdateError) {
      console.error('Failed to update users table:', userUpdateError);
    } else {
      console.log('Users table updated successfully');
    }

    console.log('Repair completed successfully for:', email);

  } catch (error) {
    console.error('Exception:', error);
    process.exit(1);
  }
}

repairTrainingRewards();
