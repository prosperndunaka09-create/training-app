// Fix checkpoint bonus_amount for test account (water@gmail.com)
// Run with: node scripts/fix-test-account-bonus.js

const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment or use placeholder
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
  console.error('Run: set VITE_SUPABASE_URL=your-url && set VITE_SUPABASE_ANON_KEY=your-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTestAccountBonus() {
  const email = 'water@gmail.com';
  const targetBonus = 1052.43;

  console.log(`[Fix Test Account Bonus] Starting fix for email: ${email}`);

  try {
    // Step 1: Find user by querying training_accounts table
    const { data: trainingAccount, error: accountError } = await supabase
      .from('training_accounts')
      .select('id, user_id')
      .eq('user_email', email)
      .single();

    if (accountError || !trainingAccount) {
      console.error('[Fix Test Account Bonus] Error fetching training account or not found:', accountError);
      return;
    }

    console.log(`[Fix Test Account Bonus] Found training account:`, trainingAccount);
    const userId = trainingAccount.user_id || trainingAccount.id;

    // Step 2: Find existing phase 2 checkpoint for this user
    const { data: checkpoint, error: checkpointError } = await supabase
      .from('phase2_checkpoints')
      .select('*')
      .eq('auth_user_id', userId)
      .eq('status', 'approved')
      .single();

    if (checkpointError || !checkpoint) {
      console.error('[Fix Test Account Bonus] Error fetching checkpoint or no approved checkpoint found:', checkpointError);
      return;
    }

    console.log(`[Fix Test Account Bonus] Found checkpoint:`, {
      id: checkpoint.id,
      current_bonus: checkpoint.bonus_amount,
      task_number: checkpoint.task_number,
      status: checkpoint.status
    });

    // Step 3: Update bonus_amount to correct value
    const { error: updateError } = await supabase
      .from('phase2_checkpoints')
      .update({ bonus_amount: targetBonus })
      .eq('id', checkpoint.id);

    if (updateError) {
      console.error('[Fix Test Account Bonus] Error updating bonus_amount:', updateError);
      return;
    }

    console.log(`[Fix Test Account Bonus] SUCCESS: Updated bonus_amount from ${checkpoint.bonus_amount} to ${targetBonus}`);
    console.log(`[Fix Test Account Bonus] Checkpoint ID: ${checkpoint.id}`);
    console.log(`[Fix Test Account Bonus] User: ${email} (${userId})`);

  } catch (error) {
    console.error('[Fix Test Account Bonus] Unexpected error:', error);
  }
}

fixTestAccountBonus();
