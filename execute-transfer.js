const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeCommissionTransfer() {
  try {
    console.log('[Transfer] Starting commission transfer...');

    // Find personal account (fire@gmail.com)
    const { data: personalUser, error: personalError } = await supabase
      .from('users')
      .select('id, email, balance, total_earned')
      .eq('email', 'fire@gmail.com')
      .eq('account_type', 'personal')
      .single();

    if (personalError || !personalUser) {
      console.error('[Transfer] Personal account not found:', personalError);
      return;
    }

    console.log('[Transfer] Personal account found:', personalUser.email, 'current balance:', personalUser.balance);

    // Find training account (water@gmail.com)
    const { data: trainingUser, error: trainingError } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('email', 'water@gmail.com')
      .eq('account_type', 'training')
      .single();

    if (trainingError || !trainingUser) {
      console.error('[Transfer] Training account not found:', trainingError);
      return;
    }

    console.log('[Transfer] Training account found:', trainingUser.email, 'current balance:', trainingUser.balance);

    const trainingBalance = trainingUser.balance;
    const commissionAmount = trainingBalance * 0.02;
    const remainingTrainingBalance = trainingBalance - commissionAmount;

    console.log('[Transfer] Calculated commission:', commissionAmount);
    console.log('[Transfer] Remaining training balance:', remainingTrainingBalance);

    // Update personal account balance to commission amount only
    const { error: personalUpdateError } = await supabase
      .from('users')
      .update({
        balance: commissionAmount,
        total_earned: commissionAmount,
        user_status: 'active',
        training_completed: true,
        commission_transferred: true,
        commission_transfer_amount: commissionAmount,
        commission_transferred_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', personalUser.id);

    if (personalUpdateError) {
      console.error('[Transfer] Error updating personal account:', personalUpdateError);
      return;
    }

    console.log('[Transfer] Personal account updated successfully');

    // Update training account balance (deduct commission)
    const { error: trainingUpdateError } = await supabase
      .from('users')
      .update({
        balance: remainingTrainingBalance,
        commission_transferred: true,
        commission_transfer_amount: commissionAmount,
        commission_transferred_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', trainingUser.id);

    if (trainingUpdateError) {
      console.error('[Transfer] Error updating training account:', trainingUpdateError);
      return;
    }

    console.log('[Transfer] Training account updated successfully');

    console.log('[Transfer] Commission transfer completed successfully!');
    console.log('[Transfer] Final balances:');
    console.log('[Transfer] - Personal (fire@gmail.com):', commissionAmount.toFixed(2));
    console.log('[Transfer] - Training (water@gmail.com):', remainingTrainingBalance.toFixed(2));

  } catch (error) {
    console.error('[Transfer] Exception:', error);
  }
}

executeCommissionTransfer();
