// Script to link existing database records to manually created auth user
// Usage: node scripts/link-auth-user.js

import { createClient } from '@supabase/supabase-js';

async function linkAuthUser() {
  const email = 'ndunka000@gmail.com';
  const authUserId = '4cf50cbe-a669-4bc2-85fe-868b8790da24';

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

  console.log('Linking auth user for:', email);
  console.log('Auth user ID:', authUserId);

  try {
    // STEP 1: Find existing training account record
    console.log('STEP 1: Finding training account by email');
    const { data: trainingAccount, error: trainingError } = await supabase
      .from('training_accounts')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (trainingError) {
      console.error('Error finding training account:', trainingError);
      process.exit(1);
    }

    if (!trainingAccount) {
      console.error('No training account found with this email');
      process.exit(1);
    }

    console.log('Training account found:', trainingAccount.id, 'current auth_user_id:', trainingAccount.auth_user_id);

    // STEP 2: Find corresponding public.users record
    console.log('STEP 2: Finding public.users record');
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (publicUserError || !publicUser) {
      console.error('Error finding public user:', publicUserError);
      process.exit(1);
    }

    console.log('Public user found:', publicUser.id, 'current id:', publicUser.id);

    // STEP 3: Update training_accounts table with auth_user_id
    console.log('STEP 3: Updating training_accounts with new auth_user_id');
    const { error: trainingUpdateError } = await supabase
      .from('training_accounts')
      .update({ auth_user_id: authUserId })
      .eq('id', trainingAccount.id);

    if (trainingUpdateError) {
      console.error('Failed to update training_accounts:', trainingUpdateError);
      process.exit(1);
    }

    console.log('Training accounts updated successfully');

    // STEP 4: Update public.users table with new id if needed
    if (publicUser.id !== authUserId) {
      console.log('STEP 4: Updating public.users with new auth_user_id');
      
      // Delete old record and insert new one with correct id
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', publicUser.id);

      if (deleteError) {
        console.error('Failed to delete old public user record:', deleteError);
      }

      // Insert new record with correct auth user id
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          ...publicUser,
          id: authUserId
        });

      if (insertError) {
        console.error('Failed to insert new public user record:', insertError);
        process.exit(1);
      }

      console.log('Public users updated successfully');
    } else {
      console.log('Public users id already matches auth user id, no update needed');
    }

    console.log('Linking completed successfully for:', email);
    console.log('Auth user ID:', authUserId);

  } catch (error) {
    console.error('Exception:', error);
    process.exit(1);
  }
}

linkAuthUser();
