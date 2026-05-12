import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTestAccountBonus() {
  const email = 'water@gmail.com';
  const targetBonus = 1052.43;

  console.log(`[Fix Test Account Bonus] Starting fix for email: ${email}`);

  try {
    // Step 1: Find user ID by email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('[Fix Test Account Bonus] Error fetching users:', authError);
      return;
    }

    const user = authUsers.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`[Fix Test Account Bonus] User not found with email: ${email}`);
      return;
    }

    console.log(`[Fix Test Account Bonus] Found user ID: ${user.id}`);

    // Step 2: Find existing phase 2 checkpoint for this user
    const { data: checkpoint, error: checkpointError } = await supabase
      .from('phase2_checkpoints')
      .select('*')
      .eq('auth_user_id', user.id)
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
    console.log(`[Fix Test Account Bonus] User: ${email} (${user.id})`);

  } catch (error) {
    console.error('[Fix Test Account Bonus] Unexpected error:', error);
  }
}

fixTestAccountBonus();
