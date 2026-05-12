// Standalone script to repair broken training account auth
// Usage: node scripts/repair-training-account.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function repairTrainingAccount() {
  const email = 'ndunka000@gmail.com';
  const password = '111111';

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Starting repair for:', email);

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

    console.log('Training account found:', trainingAccount.id, 'auth_user_id:', trainingAccount.auth_user_id);

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

    console.log('Public user found:', publicUser.id);

    // STEP 3: Check if auth user exists in Supabase Auth
    console.log('STEP 3: Checking if auth user exists in Supabase Auth');
    let authUserId = trainingAccount.auth_user_id || publicUser.id;
    let authUserExists = false;

    if (authUserId) {
      try {
        const { data: authUser, error: authCheckError } = await supabase.auth.admin.getUserById(authUserId);
        if (!authCheckError && authUser) {
          authUserExists = true;
          console.log('Auth user exists:', authUserId);
        }
      } catch (checkError) {
        console.log('Auth user does not exist or is invalid:', authUserId);
        authUserExists = false;
      }
    }

    // STEP 4: If auth user doesn't exist, create it
    if (!authUserExists) {
      console.log('STEP 4: Creating new auth user for existing training account');
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        email_confirm: true,
        user_metadata: {
          display_name: trainingAccount.display_name || publicUser.display_name,
          account_type: 'training'
        }
      });

      if (authError || !authData.user) {
        console.error('Failed to create auth user:', authError);
        process.exit(1);
      }

      authUserId = authData.user.id;
      console.log('New auth user created:', authUserId);

      // STEP 5: Update training_accounts table with new auth_user_id
      console.log('STEP 5: Updating training_accounts with new auth_user_id');
      const { error: trainingUpdateError } = await supabase
        .from('training_accounts')
        .update({ auth_user_id: authUserId })
        .eq('id', trainingAccount.id);

      if (trainingUpdateError) {
        console.error('Failed to update training_accounts:', trainingUpdateError);
        process.exit(1);
      }

      // STEP 6: Update public.users table with new id if needed
      if (publicUser.id !== authUserId) {
        console.log('STEP 6: Updating public.users with new auth_user_id');
        
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
      }
    } else {
      console.log('Auth user already exists, no creation needed');
    }

    console.log('Repair completed successfully for:', email);
    console.log('Auth user ID:', authUserId);

  } catch (error) {
    console.error('Exception:', error);
    process.exit(1);
  }
}

repairTrainingAccount();
